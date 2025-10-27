import {
	type Options,
	query,
	type SDKAssistantMessage,
	type SDKMessage,
	type SDKPartialAssistantMessage,
	type SDKUserMessage,
} from "@anthropic-ai/claude-agent-sdk";
import {
	createUIMessageStreamResponse,
	type UIMessage,
	type UIMessageChunk,
} from "ai";

// ============= Simplified Type Interfaces =============

// Simplified views of what we extract from Claude messages
interface ClaudeTextContent {
	type: "text";
	text: string;
}

interface ClaudeToolUseContent {
	type: "tool_use";
	id: string;
	name: string;
	input: Record<string, unknown>;
}

interface ClaudeToolResultContent {
	type: "tool_result";
	tool_use_id: string;
	content: unknown;
	is_error?: boolean;
}

// Simplified views of chunks we produce for Vercel
interface TextDeltaChunk {
	type: "text-delta";
	id: string;
	delta: string;
}

interface ToolInputChunk {
	type: "tool-input-available";
	toolCallId: string;
	toolName: string;
	input: Record<string, unknown>;
}

interface ToolOutputChunk {
	type: "tool-output-available";
	toolCallId: string;
	output: unknown;
}

interface ToolErrorChunk {
	type: "tool-output-error";
	toolCallId: string;
	errorText: string;
}

// ============= Main Streaming Function =============

export async function streamClaudeResponse(
	messages: UIMessage[],
	options?: Partial<Options>,
): Promise<Response> {
	const stream = new TransformStream<UIMessageChunk>();
	const writer = stream.writable.getWriter();

	// Start streaming in background
	processClaudeStream(messages, options, writer);

	// Return SSE response immediately
	return createUIMessageStreamResponse({ stream: stream.readable });
}

// ============= Stream Processing =============

async function processClaudeStream(
	messages: UIMessage[],
	options: Partial<Options> | undefined,
	writer: WritableStreamDefaultWriter<UIMessageChunk>,
): Promise<void> {
	try {
		const prompt = formatMessagesToPrompt(messages);
		const messageId = generateMessageId();

		// Start the message
		await writeChunk(writer, { type: "start", messageId });

		// Query Claude with streaming enabled
		const queryOptions: Options = {
			model: "claude-3-5-sonnet-20241022",
			maxTurns: 10,
			allowedTools: ["Read", "Write", "Edit", "Bash"],
			includePartialMessages: true, // Enable real-time streaming
			...options,
		};

		// Track text state
		let currentTextId: string | null = null;

		for await (const message of query({ prompt, options: queryOptions })) {
			const chunks = mapClaudeMessageToChunks(message, messageId);

			for (const chunk of chunks) {
				// Manage text lifecycle
				if (chunk.type === "text-delta") {
					if (!currentTextId) {
						currentTextId = `${messageId}-text`;
						await writeChunk(writer, { type: "text-start", id: currentTextId });
					}
					chunk.id = currentTextId;
				} else if (chunk.type === "tool-input-available" && currentTextId) {
					await writeChunk(writer, { type: "text-end", id: currentTextId });
					currentTextId = null;
				}

				await writeChunk(writer, chunk);
			}
		}

		// Clean up any active text
		if (currentTextId) {
			await writeChunk(writer, { type: "text-end", id: currentTextId });
		}

		await writeChunk(writer, { type: "finish" });
	} catch (error) {
		await writeChunk(writer, {
			type: "error",
			errorText: error instanceof Error ? error.message : "Stream failed",
		});
	} finally {
		await writer.close();
	}
}

// ============= Message Mapping Functions =============

function mapClaudeMessageToChunks(
	message: SDKMessage,
	messageId: string,
): UIMessageChunk[] {
	switch (message.type) {
		case "assistant":
			return mapAssistantMessage(message as SDKAssistantMessage, messageId);
		case "user":
			return mapUserMessage(message as SDKUserMessage);
		case "stream_event":
			return mapStreamEvent(message as SDKPartialAssistantMessage, messageId);
		case "result":
			return []; // Result messages don't produce UI chunks
		case "system":
			return []; // System messages don't produce UI chunks
		default:
			return [];
	}
}

function mapAssistantMessage(
	message: SDKAssistantMessage,
	messageId: string,
): UIMessageChunk[] {
	// Access the content from the Claude message structure
	const content = (message as any).message?.content;

	if (!Array.isArray(content)) return [];

	const chunks: UIMessageChunk[] = [];

	for (const block of content) {
		const chunk = mapContentBlock(block, messageId);
		if (chunk) chunks.push(chunk);
	}

	return chunks;
}

function mapUserMessage(message: SDKUserMessage): UIMessageChunk[] {
	// Access the content from the Claude message structure
	const content = (message as any).message?.content;

	if (!Array.isArray(content)) return [];

	const chunks: UIMessageChunk[] = [];

	for (const block of content) {
		if (block.type === "tool_result") {
			const toolChunk = mapToolResult(block as ClaudeToolResultContent);
			if (toolChunk) chunks.push(toolChunk);
		}
	}

	return chunks;
}

function mapStreamEvent(
	message: SDKPartialAssistantMessage,
	messageId: string,
): UIMessageChunk[] {
	// Access the event from the stream message
	const event = (message as any).event;

	if (
		event?.type === "content_block_delta" &&
		event.delta?.type === "text_delta"
	) {
		const textChunk: TextDeltaChunk = {
			type: "text-delta",
			delta: event.delta.text,
			id: `${messageId}-text`,
		};
		return [textChunk];
	}

	return [];
}

function mapContentBlock(
	block: ClaudeTextContent | ClaudeToolUseContent,
	messageId: string,
): UIMessageChunk | null {
	if (block.type === "text") {
		return mapTextBlock(block as ClaudeTextContent, messageId);
	}

	if (block.type === "tool_use") {
		return mapToolUseBlock(block as ClaudeToolUseContent);
	}

	return null;
}

function mapTextBlock(
	block: ClaudeTextContent,
	messageId: string,
): TextDeltaChunk | null {
	if (!block.text) return null;

	return {
		type: "text-delta",
		delta: block.text,
		id: `${messageId}-text`,
	};
}

function mapToolUseBlock(block: ClaudeToolUseContent): ToolInputChunk {
	return {
		type: "tool-input-available",
		toolCallId: block.id,
		toolName: block.name,
		input: block.input || {},
	};
}

function mapToolResult(
	block: ClaudeToolResultContent,
): ToolOutputChunk | ToolErrorChunk {
	if (block.is_error) {
		return {
			type: "tool-output-error",
			toolCallId: block.tool_use_id,
			errorText: formatToolError(block.content),
		};
	}

	return {
		type: "tool-output-available",
		toolCallId: block.tool_use_id,
		output: formatToolOutput(block.content),
	};
}

// ============= Helper Functions =============

function generateMessageId(): string {
	return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

async function writeChunk(
	writer: WritableStreamDefaultWriter<UIMessageChunk>,
	chunk: UIMessageChunk,
): Promise<void> {
	await writer.write(chunk);
}

function formatToolOutput(content: unknown): unknown {
	if (content === null || content === undefined) return "";
	return content;
}

function formatToolError(content: unknown): string {
	if (typeof content === "string") return content;
	if (typeof content === "object" && content !== null && "error" in content) {
		return String((content as { error: unknown }).error);
	}
	return "Tool execution failed";
}

function formatMessagesToPrompt(messages: UIMessage[]): string {
	return messages
		.map((msg) => {
			const role = msg.role === "user" ? "Human" : "Assistant";
			const textParts = msg.parts
				?.filter((p): p is { type: "text"; text: string } => p.type === "text")
				.map((p) => p.text)
				.join("");
			return textParts ? `${role}: ${textParts}` : "";
		})
		.filter(Boolean)
		.join("\n\n");
}
