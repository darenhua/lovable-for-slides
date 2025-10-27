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
					<TabsTrigger value="tab1">Design Mode</TabsTrigger>
					<TabsTrigger value="tab2">Data Mode</TabsTrigger>
				</TabsList>
			</Tabs>
		</div>
	);
}
