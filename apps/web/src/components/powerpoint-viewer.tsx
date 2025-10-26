"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase-client";
import { client } from "@/utils/orpc";

type Props = {
	presentationId: string;
};

export function PowerPointViewer({ presentationId }: Props) {
	const containerRef = useRef<HTMLDivElement>(null);

	// Fetch presentation record from database
	const { data: presentation, error: dbError } = useQuery({
		queryKey: ["presentation", presentationId],
		queryFn: () => client.powerpoints.getById({ id: presentationId }),
		retry: false,
	});

	// Download file from Supabase storage
	const {
		data: arrayBuffer,
		isLoading,
		error: downloadError,
	} = useQuery({
		queryKey: ["presentation-file", presentationId, presentation?.filePath],
		queryFn: async () => {
			const { data: blob, error: downloadError } = await supabase.storage
				.from("presentation")
				.download(presentation?.filePath ?? "");

			if (downloadError) {
				throw new Error("Failed to download presentation file");
			}

			// Convert blob to ArrayBuffer
			const arrayBuffer = await blob.arrayBuffer();
			console.log("arrayBuffer", arrayBuffer);
			return arrayBuffer;
		},
		enabled: !!presentation,
		retry: false,
	});

	useEffect(() => {
		if (!arrayBuffer || !containerRef.current) return;

		const container = containerRef.current;

		(async () => {
			const NutrientViewer = (await import("@nutrient-sdk/viewer")).default;

			// Unload any previous instance.
			NutrientViewer.unload(container);

			if (container) {
				NutrientViewer.load({
					container,
					document: arrayBuffer,
					baseUrl: `${window.location.protocol}//${window.location.host}/nutrient-assets/`,
					// Show only sidebar toggle button in toolbar
					toolbarItems: [
						{ type: "sidebar-thumbnails" }
					],
					initialViewState: new NutrientViewer.ViewState({
						sidebarMode: NutrientViewer.SidebarMode.THUMBNAILS,
					}),
				});
			}
		})();

		return () => {
			(async () => {
				const NutrientViewer = (await import("@nutrient-sdk/viewer")).default;
				NutrientViewer.unload(container);
			})();
		};
	}, [arrayBuffer]);

	const error = dbError || downloadError;

	if (error) {
		return (
			<div className="flex h-full items-center justify-center bg-muted/20">
				<div className="text-center">
					<h2 className="mb-2 font-semibold text-2xl text-destructive">
						Error Loading Presentation
					</h2>
					<p className="max-w-md text-muted-foreground">
						{error instanceof Error
							? error.message
							: "Failed to load presentation"}
					</p>
				</div>
			</div>
		);
	}

	if (isLoading || !arrayBuffer) {
		return (
			<div className="flex h-full items-center justify-center bg-muted/20">
				<div className="text-center">
					<div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-primary border-b-2" />
					<p className="text-muted-foreground">Loading presentation...</p>
				</div>
			</div>
		);
	}

	// Nutrient viewer container
	return (
		<div className="h-full w-full">
			<div ref={containerRef} className="h-full w-full" />
		</div>
	);
}
