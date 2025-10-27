import type { UIMessage } from "ai";
import { streamClaudeResponse } from "@/lib/claude-vercel-adapter";

export const maxDuration = 30;

export async function POST(req: Request) {
	const { messages }: { messages: UIMessage[] } = await req.json();

	return streamClaudeResponse(messages, {
		// Optional: Override default options if needed
		// model: 'claude-3-5-sonnet-20241022',
		// maxTurns: 1,
	});
}
