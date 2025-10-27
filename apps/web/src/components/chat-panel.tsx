"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Response } from "@/components/response";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tool } from "@/components/ui/tool";

export function ChatPanel() {
	const [input, setInput] = useState("");
	const { messages, sendMessage } = useChat({
		transport: new DefaultChatTransport({
			api: "/api/ai",
		}),
	});
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const text = input.trim();
		if (!text) return;
		sendMessage({ text });
		setInput("");
	};
	console.log("messages", messages);

	return (
		<div className="flex h-full flex-col">
			{/* Chat messages */}
			<div className="flex-1 space-y-4 overflow-y-auto p-4">
				{messages.length === 0 ? (
					<div className="mt-8 text-center text-muted-foreground">
						Ask me anything to get started!
					</div>
				) : (
					messages.map((message) => (
						<div
							key={message.id}
							className={`rounded-lg p-3 ${
								message.role === "user"
									? "ml-8 bg-primary/10"
									: "mr-8 bg-secondary/20"
							}`}
						>
							<p className="mb-1 font-semibold text-sm">
								{message.role === "user" ? "You" : "AI Assistant"}
							</p>
							{message.parts?.map((part, index) => {
								// Render text parts
								if (part.type === "text") {
									return (
										<Response key={`${message.id}-${index}`}>
											{part.text}
										</Response>
									);
								}

								// Render tool parts (format: tool-{ToolName})
								if (part.type.startsWith("tool-") && "state" in part) {
									const toolName = part.type.replace("tool-", "");
									return (
										<Tool
											key={`${message.id}-tool-${index}`}
											toolPart={{
												type: toolName,
												state: (part as any).state,
												input: (part as any).input as Record<string, unknown>,
												output: (part as any).output as Record<string, unknown>,
												toolCallId: (part as any).toolCallId,
												errorText: (part as any).errorText,
											}}
										/>
									);
								}

								// Render tool calls (legacy format)
								if (
									part.type === "tool-call" &&
									"toolName" in part &&
									typeof part.toolName === "string"
								) {
									return (
										<Tool
											key={`${message.id}-tool-${index}`}
											toolPart={{
												type: part.toolName,
												state: "input-available",
												input: part.input as Record<string, unknown>,
												toolCallId: part.toolCallId as string,
											}}
										/>
									);
								}

								// Render tool results
								if (
									part.type === "tool-result" &&
									"toolName" in part &&
									typeof part.toolName === "string"
								) {
									return (
										<Tool
											key={`${message.id}-result-${index}`}
											toolPart={{
												type: part.toolName,
												state: "output-available",
												output: part.output as Record<string, unknown>,
												toolCallId: part.toolCallId as string,
											}}
										/>
									);
								}

								// Render tool errors
								if (
									part.type === "tool-error" &&
									"toolName" in part &&
									typeof part.toolName === "string" &&
									"error" in part
								) {
									return (
										<Tool
											key={`${message.id}-error-${index}`}
											toolPart={{
												type: part.toolName,
												state: "output-error",
												errorText: part.error
													? String(part.error)
													: "Unknown error",
												toolCallId: part.toolCallId as string,
											}}
										/>
									);
								}

								return null;
							})}
						</div>
					))
				)}
				<div ref={messagesEndRef} />
			</div>

			{/* Chat input */}
			<form
				onSubmit={handleSubmit}
				className="flex items-center gap-2 border-t p-4"
			>
				<Input
					name="prompt"
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Type your message..."
					className="flex-1"
					autoComplete="off"
				/>
				<Button type="submit" size="icon">
					<Send size={18} />
				</Button>
			</form>
		</div>
	);
}
