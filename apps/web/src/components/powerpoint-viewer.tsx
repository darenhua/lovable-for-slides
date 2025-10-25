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
