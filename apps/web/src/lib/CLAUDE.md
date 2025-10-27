# Claude SDK ↔ Vercel AI SDK Integration

This document explains how the Claude Agent SDK is integrated with the Vercel AI SDK to provide streaming AI chat functionality.

## Architecture Overview

```
Frontend (React)
    ↓ useChat hook (Vercel AI SDK)
    ↓ HTTP POST to /api/ai
Backend (Next.js API Route)
    ↓ streamClaudeResponse()
Claude Agent SDK
    ↓ query() with streaming
    ↓ Transform messages to Vercel format
    ↓ Stream back as SSE (Server-Sent Events)
Frontend (React)
    ↓ Render messages & tools
```

## Message Flow

### 1. Frontend → Backend

The frontend uses Vercel AI SDK's `useChat` hook:

```typescript
const { messages, sendMessage } = useChat({
  transport: new DefaultChatTransport({ api: "/api/ai" })
});
```

When a user sends a message, it's formatted as:
```typescript
{
  role: "user",
  parts: [{ type: "text", text: "What is 2+2?" }]
}
```

### 2. Backend Processing

The API route (`/api/ai/route.ts`) receives the messages and calls:

```typescript
streamClaudeResponse(messages, options)
```

This function:
1. Converts Vercel UI messages to a Claude prompt format
2. Calls Claude Agent SDK's `query()` function with streaming enabled
3. Transforms Claude SDK messages back to Vercel UI chunks
4. Streams them as Server-Sent Events (SSE)

### 3. Claude SDK → Vercel SDK Transformation

The adapter handles three types of Claude messages:

#### Stream Events (`stream_event`)
Real-time text deltas as Claude generates text:
```typescript
// Claude SDK format
{
  type: "stream_event",
  event: {
    type: "content_block_delta",
    delta: { type: "text_delta", text: "Hello" }
  }
}

// Transformed to Vercel format
{
  type: "text-delta",
  delta: "Hello",
  id: "msg_123-text"
}
```

#### Assistant Messages (`assistant`)
Complete assistant messages with text and tool calls:
```typescript
// Claude SDK format
{
  type: "assistant",
  message: {
    content: [
      { type: "text", text: "Let me check..." },
      { type: "tool_use", id: "tool_1", name: "Read", input: {...} }
    ]
  }
}

// Transformed to Vercel format (multiple chunks)
[
  { type: "text-delta", delta: "Let me check...", id: "msg_123-text" },
  { type: "tool-input-available", toolCallId: "tool_1", toolName: "Read", input: {...} }
]
```

#### User Messages (`user`)
Tool results from the Claude SDK:
```typescript
// Claude SDK format
{
  type: "user",
  message: {
    content: [
      { type: "tool_result", tool_use_id: "tool_1", content: "file contents...", is_error: false }
    ]
  }
}

// Transformed to Vercel format
{
  type: "tool-output-available",
  toolCallId: "tool_1",
  output: "file contents..."
}
```

## Streaming Lifecycle

The adapter manages the complete message lifecycle:

```
1. START
   → { type: "start", messageId: "msg_123" }

2. TEXT START
   → { type: "text-start", id: "msg_123-text" }

3. TEXT DELTAS (multiple, character-by-character)
   → { type: "text-delta", delta: "H", id: "msg_123-text" }
   → { type: "text-delta", delta: "e", id: "msg_123-text" }
   → { type: "text-delta", delta: "l", id: "msg_123-text" }
   ...

4. TEXT END (when tool call starts)
   → { type: "text-end", id: "msg_123-text" }

5. TOOL INPUT
   → { type: "tool-input-available", toolCallId: "tool_1", toolName: "Bash", input: {...} }

6. TOOL OUTPUT
   → { type: "tool-output-available", toolCallId: "tool_1", output: "result" }

7. FINISH
   → { type: "finish" }
```

## Frontend Rendering

The `chat-panel.tsx` component renders messages based on their parts:

### Text Parts
```typescript
if (part.type === "text") {
  return <Response>{part.text}</Response>
}
```

### Tool Parts
Vercel AI SDK creates tool parts with the format `tool-{ToolName}`:
- `tool-Bash` - Bash command execution
- `tool-Read` - File reading
- `tool-Write` - File writing
- `tool-Edit` - File editing

```typescript
if (part.type.startsWith("tool-") && "state" in part) {
  const toolName = part.type.replace("tool-", "");
  return <Tool toolPart={{
    type: toolName,
    state: part.state,      // "input-available" | "output-available" | "output-error"
    input: part.input,
    output: part.output,
    toolCallId: part.toolCallId,
    errorText: part.errorText
  }} />
}
```

### Tool States
- `input-available` - Tool was called with input (shows tool name and input)
- `output-available` - Tool completed successfully (shows output)
- `output-error` - Tool failed (shows error message)

## Key Configuration

### Claude Agent SDK Options
```typescript
{
  model: "claude-3-5-sonnet-20241022",
  maxTurns: 10,
  allowedTools: ["Read", "Write", "Edit", "Bash"],
  includePartialMessages: true  // ← Enables real-time streaming
}
```

### Why `includePartialMessages: true`?
This enables character-by-character streaming via `stream_event` messages. Without it, you only get complete messages after Claude finishes generating, which feels slow.

## Type Safety

The adapter uses minimal `any` casting, only where SDK types are incomplete:

```typescript
// Claude SDK doesn't export detailed message content types
const content = (message as any).message?.content;
const event = (message as any).event;
```

All other types are properly typed using:
- Claude SDK: `SDKMessage`, `SDKAssistantMessage`, `SDKUserMessage`, `SDKPartialAssistantMessage`
- Vercel SDK: `UIMessage`, `UIMessageChunk`
- Custom: `ClaudeTextContent`, `ClaudeToolUseContent`, `ClaudeToolResultContent`

## Error Handling

### Stream Errors
```typescript
try {
  // Stream processing
} catch (error) {
  await writeChunk(writer, {
    type: "error",
    errorText: error instanceof Error ? error.message : "Stream failed"
  });
}
```

### Tool Errors
Tool errors are detected via `is_error` flag:
```typescript
if (block.is_error) {
  return {
    type: "tool-output-error",
    toolCallId: block.tool_use_id,
    errorText: formatToolError(block.content)
  };
}
```

## Prompt Format

Messages are converted to Claude's expected format:

```typescript
// Input: Vercel UI messages
[
  { role: "user", parts: [{ type: "text", text: "Hello" }] },
  { role: "assistant", parts: [{ type: "text", text: "Hi there!" }] }
]

// Output: Claude prompt string
`Human: Hello