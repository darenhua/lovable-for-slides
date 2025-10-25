# Cursor-Style Dashboard with PowerPoint Viewer and Chat Implementation Plan

## Overview

Replace the existing dashboard page with a Cursor-style interface featuring a resizable layout with a PowerPoint viewer, chat panel, and status footer. The layout will use shadcn's Resizable component to allow users to adjust panel sizes.

## Current State Analysis

**Existing Code:**
- Dashboard at `/dashboard` (apps/web/src/app/dashboard/page.tsx:1-22) - basic auth check + welcome message
- Dashboard component (apps/web/src/app/dashboard/dashboard.tsx:1-14) - displays API data
- AI chat at `/ai` (apps/web/src/app/ai/page.tsx:1-88) - uses @ai-sdk/react with `useChat` hook
- PowerPoint schema exists (packages/db/src/schema/powerpoints.ts:1-10) - stores filePath & fileName
- PowerPoint API exists (packages/api/src/routers/powerpoints.ts:1-24) - create endpoint only

**Key Discoveries:**
- shadcn Resizable and Tabs components are NOT yet installed
- Project uses @ai-sdk/react for chat functionality with streaming
- UI components are in apps/web/src/components/ui/
- Chat logic can be extracted and reused from /ai page

## Desired End State

A Cursor-style dashboard with:
1. **Left side (2/3 width)** - vertically split into:
   - PowerPoint viewer (top, most space) - placeholder iframe
   - Footer bar (bottom, fixed height) with:
     - "Buyer Strips" status button
     - "Branding" status button
     - Tabs list (right-aligned, no content)
2. **Right side (1/3 width)** - Chat panel with AI streaming
3. All three sections (viewer, footer, chat) are resizable using shadcn Resizable

### Success Criteria:

#### Automated Verification:
- [ ] Project builds without errors: `cd /Users/lellyo/Desktop/cool-projects/slides/my-better-t-app && bun run build`
- [ ] Type checking passes: `cd /Users/lellyo/Desktop/cool-projects/slides/my-better-t-app && bun run check-types`
- [ ] Linting passes: `cd /Users/lellyo/Desktop/cool-projects/slides/my-better-t-app && bun run check`

#### Manual Verification:
- [ ] Dashboard page loads without errors
- [ ] All three panels are visible (PowerPoint viewer, footer, chat)
- [ ] Panels can be resized by dragging handles
- [ ] Chat accepts input and shows messages
- [ ] Footer displays all three elements (Buyer Strips, Branding, Tabs)
- [ ] Layout looks good at different screen sizes

## What We're NOT Doing

- Not implementing actual PowerPoint rendering (just iframe placeholder)
- Not implementing real functionality for "Buyer Strips" or "Branding" buttons
- Not creating actual tab content (only TabsList component)
- Not implementing PowerPoint selection/loading logic
- Not styling the chat beyond basic functionality
- Not adding authentication checks (keeping existing auth)

## Implementation Approach

Build the layout incrementally:
1. Install required shadcn components (Resizable, Tabs)
2. Create reusable sub-components (PowerPointViewer, FooterBar, ChatPanel)
3. Compose components together in Dashboard with resizable layout
4. Test and verify all functionality

## Phase 1: Install shadcn Components

### Overview
Install the Resizable and Tabs components from shadcn/ui registry.

### Changes Required:

#### 1. Install Resizable Component
**Command**: Install via shadcn CLI
```bash
cd /Users/lellyo/Desktop/cool-projects/slides/my-better-t-app/apps/web
bunx shadcn@latest add resizable
```

This will create: `apps/web/src/components/ui/resizable.tsx`

#### 2. Install Tabs Component
**Command**: Install via shadcn CLI
```bash
cd /Users/lellyo/Desktop/cool-projects/slides/my-better-t-app/apps/web
bunx shadcn@latest add tabs
```

This will create: `apps/web/src/components/ui/tabs.tsx`

### Success Criteria:

#### Automated Verification:
- [ ] Resizable component file exists: `ls /Users/lellyo/Desktop/cool-projects/slides/my-better-t-app/apps/web/src/components/ui/resizable.tsx`
- [ ] Tabs component file exists: `ls /Users/lellyo/Desktop/cool-projects/slides/my-better-t-app/apps/web/src/components/ui/tabs.tsx`
- [ ] Project builds: `cd /Users/lellyo/Desktop/cool-projects/slides/my-better-t-app && bun run build`

#### Manual Verification:
- [ ] Confirm both component files were created successfully
- [ ] Verify no installation errors in terminal

---

## Phase 2: Create Sub-Components

### Overview
Create reusable sub-components in the components folder to keep code organized and maintainable.

### Changes Required:

#### 1. Create PowerPointViewer Component
**File**: `apps/web/src/components/powerpoint-viewer.tsx`
**Changes**: New file with iframe viewer component

```typescript
"use client";

export function PowerPointViewer() {
	return (
		<div className="flex h-full items-center justify-center bg-muted/20">
			<div className="h-full w-full p-4">
				<iframe
					src="https://via.placeholder.com/800x600?text=PowerPoint+Viewer+Placeholder"
					className="h-full w-full rounded-lg border"
					title="PowerPoint Viewer"
				/>
			</div>
		</div>
	);
}
```

#### 2. Create FooterBar Component
**File**: `apps/web/src/components/footer-bar.tsx`
**Changes**: New file with status buttons and tabs

```typescript
"use client";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function FooterBar() {
	return (
		<div className="flex h-full items-center justify-between border-t bg-background px-4">
			{/* Left: Status buttons */}
			<div className="flex items-center gap-2">
				<Button variant="outline" size="sm">
					Buyer Strips
				</Button>
				<Button variant="outline" size="sm">
					Branding
				</Button>
			</div>

			{/* Right: Tabs */}
			<Tabs defaultValue="tab1">
				<TabsList>
					<TabsTrigger value="tab1">View 1</TabsTrigger>
					<TabsTrigger value="tab2">View 2</TabsTrigger>
					<TabsTrigger value="tab3">View 3</TabsTrigger>
				</TabsList>
			</Tabs>
		</div>
	);
}
```

#### 3. Create ChatPanel Component
**File**: `apps/web/src/components/chat-panel.tsx`
**Changes**: New file with chat interface (messages + input)

```typescript
"use client";

import { Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Response } from "@/components/response";

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
	}, [messages]);

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const text = input.trim();
		if (!text) return;
		sendMessage({ text });
		setInput("");
	};

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
							<p className="mb-1 text-sm font-semibold">
								{message.role === "user" ? "You" : "AI Assistant"}
							</p>
							{message.parts?.map((part, index) => {
								if (part.type === "text") {
									return (
										<Response key={`${message.id}-${index}`}>
											{part.text}
										</Response>
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
```

### Success Criteria:

#### Automated Verification:
- [ ] PowerPointViewer component file exists: `ls /Users/lellyo/Desktop/cool-projects/slides/my-better-t-app/apps/web/src/components/powerpoint-viewer.tsx`
- [ ] FooterBar component file exists: `ls /Users/lellyo/Desktop/cool-projects/slides/my-better-t-app/apps/web/src/components/footer-bar.tsx`
- [ ] ChatPanel component file exists: `ls /Users/lellyo/Desktop/cool-projects/slides/my-better-t-app/apps/web/src/components/chat-panel.tsx`
- [ ] Project builds: `cd /Users/lellyo/Desktop/cool-projects/slides/my-better-t-app && bun run build`

#### Manual Verification:
- [ ] All three component files created successfully
- [ ] No TypeScript errors in component files

---

## Phase 3: Create Dashboard Layout Structure

### Overview
Compose the sub-components together using ResizablePanelGroup to create the Cursor-style layout.

### Changes Required:

#### 1. Replace Dashboard Page (Server Component)
**File**: `apps/web/src/app/dashboard/page.tsx`
**Changes**: Keep auth logic, replace UI with new Dashboard import

```typescript
import { auth } from "@my-better-t-app/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Dashboard from "./dashboard";

export default async function DashboardPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/login");
	}

	return <Dashboard />;
}
```

#### 2. Create New Dashboard Component (Client Component)
**File**: `apps/web/src/app/dashboard/dashboard.tsx`
**Changes**: Complete rewrite using sub-components with resizable layout

```typescript
"use client";

import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";
import { PowerPointViewer } from "@/components/powerpoint-viewer";
import { FooterBar } from "@/components/footer-bar";
import { ChatPanel } from "@/components/chat-panel";

export default function Dashboard() {
	return (
		<div className="h-screen w-full overflow-hidden">
			<ResizablePanelGroup direction="horizontal">
				{/* Left side: PowerPoint viewer + Footer */}
				<ResizablePanel defaultSize={67} minSize={30}>
					<ResizablePanelGroup direction="vertical">
						{/* PowerPoint Viewer */}
						<ResizablePanel defaultSize={85} minSize={20}>
							<PowerPointViewer />
						</ResizablePanel>

						<ResizableHandle withHandle />

						{/* Footer */}
						<ResizablePanel defaultSize={15} minSize={10} maxSize={30}>
							<FooterBar />
						</ResizablePanel>
					</ResizablePanelGroup>
				</ResizablePanel>

				<ResizableHandle withHandle />

				{/* Right side: Chat */}
				<ResizablePanel defaultSize={33} minSize={20}>
					<ChatPanel />
				</ResizablePanel>
			</ResizablePanelGroup>
		</div>
	);
}
```

### Success Criteria:

#### Automated Verification:
- [ ] Dashboard page file updated: `ls /Users/lellyo/Desktop/cool-projects/slides/my-better-t-app/apps/web/src/app/dashboard/page.tsx`
- [ ] Dashboard component file updated: `ls /Users/lellyo/Desktop/cool-projects/slides/my-better-t-app/apps/web/src/app/dashboard/dashboard.tsx`
- [ ] Project builds without errors: `cd /Users/lellyo/Desktop/cool-projects/slides/my-better-t-app && bun run build`
- [ ] Type checking passes: `cd /Users/lellyo/Desktop/cool-projects/slides/my-better-t-app && bun run check-types`
- [ ] Linting passes: `cd /Users/lellyo/Desktop/cool-projects/slides/my-better-t-app && bun run check`

#### Manual Verification:
- [ ] Dashboard loads at /dashboard without errors
- [ ] Three resizable sections are visible
- [ ] Can drag resize handles to adjust panel sizes
- [ ] PowerPoint iframe placeholder displays
- [ ] Footer shows "Buyer Strips" and "Branding" buttons
- [ ] Tabs list appears on the right side of footer
- [ ] Chat panel shows "Ask me anything" message
- [ ] Can type in chat input field

**Implementation Note**: After completing this phase and all automated verification passes, pause here for manual confirmation from the human that the manual testing was successful before proceeding.

---

## Phase 4: Test and Verify

### Overview
Comprehensive testing of the new dashboard layout and functionality.

### Testing Strategy

#### Unit Tests:
- Not applicable for this feature (primarily UI layout)

#### Integration Tests:
- Not applicable for this feature

#### Manual Testing Steps:

1. **Layout Testing**
   - Navigate to `/dashboard`
   - Verify three distinct sections are visible
   - Test horizontal resize between viewer and chat
   - Test vertical resize between viewer and footer
   - Verify minimum/maximum size constraints work

2. **PowerPoint Viewer Testing**
   - Confirm iframe placeholder is visible
   - Verify iframe fills the available space
   - Test responsiveness when resizing panel

3. **Footer Testing**
   - Verify "Buyer Strips" button is visible and clickable
   - Verify "Branding" button is visible and clickable
   - Verify tabs list shows three tabs on the right
   - Verify clicking tabs changes active state (visual only)

4. **Chat Testing**
   - Type a message and submit
   - Verify message appears in chat history
   - Verify AI response streams in
   - Verify messages display with correct styling
   - Test scrolling with many messages
   - Verify auto-scroll to latest message works

5. **Responsive Testing**
   - Test at different viewport widths (1920px, 1440px, 1024px)
   - Verify layout doesn't break at smaller sizes
   - Verify resizable handles are accessible

6. **Edge Cases**
   - Resize panels to minimum sizes
   - Resize panels to maximum sizes
   - Send empty messages (should not submit)
   - Test rapid message sending

### Success Criteria:

#### Automated Verification:
- [ ] Final build succeeds: `cd /Users/lellyo/Desktop/cool-projects/slides/my-better-t-app && bun run build`
- [ ] All type checks pass: `cd /Users/lellyo/Desktop/cool-projects/slides/my-better-t-app && bun run check-types`
- [ ] All linting passes: `cd /Users/lellyo/Desktop/cool-projects/slides/my-better-t-app && bun run check`
- [ ] Dev server starts without errors: `cd /Users/lellyo/Desktop/cool-projects/slides/my-better-t-app && bun run dev`

#### Manual Verification:
- [ ] All layout testing steps pass
- [ ] All PowerPoint viewer testing steps pass
- [ ] All footer testing steps pass
- [ ] All chat testing steps pass
- [ ] All responsive testing checks pass
- [ ] All edge cases handled properly

---

## Performance Considerations

- Chat messages use `useEffect` with messages dependency for auto-scroll
- ResizablePanel uses `defaultSize` props for initial layout (67/33 split)
- Chat input uses controlled component pattern for React best practices
- No heavy computations or data fetching in this phase

## Migration Notes

- No database migrations required
- No data migration needed
- Existing PowerPoint records remain unchanged
- AI chat endpoint `/api/ai` already exists and is reused

## References

- shadcn Resizable docs: https://ui.shadcn.com/docs/components/resizable
- shadcn Tabs docs: https://ui.shadcn.com/docs/components/tabs
- Existing chat logic: apps/web/src/app/ai/page.tsx:1-88
- Vercel AI SDK docs: https://sdk.vercel.ai/docs

## Component Structure

**New Components Created:**
- `apps/web/src/components/powerpoint-viewer.tsx` - PowerPoint iframe viewer
- `apps/web/src/components/footer-bar.tsx` - Status buttons and tabs bar
- `apps/web/src/components/chat-panel.tsx` - AI chat interface with streaming

**Modified Files:**
- `apps/web/src/app/dashboard/page.tsx` - Server component with auth
- `apps/web/src/app/dashboard/dashboard.tsx` - Main dashboard layout orchestrator
