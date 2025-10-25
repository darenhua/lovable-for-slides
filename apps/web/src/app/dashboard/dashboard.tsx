"use client";

import { ChatPanel } from "@/components/chat-panel";
import { FooterBar } from "@/components/footer-bar";
import { PowerPointViewer } from "@/components/powerpoint-viewer";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable";

export default function Dashboard() {
	return (
		<div className="h-full w-full">
			<ResizablePanelGroup direction="horizontal">
				{/* Left side: PowerPoint viewer + Footer */}
				<ResizablePanel defaultSize={67} minSize={30}>
					<div className="flex h-full flex-col">
						{/* PowerPoint Viewer */}
						<div className="flex-1 overflow-hidden">
							<PowerPointViewer />
						</div>

						{/* Footer - Fixed height */}
						<div className="h-16">
							<FooterBar />
						</div>
					</div>
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
