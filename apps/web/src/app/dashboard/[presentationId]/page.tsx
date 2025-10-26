"use client";

import { useParams } from "next/navigation";
import Dashboard from "./dashboard";
export default function DashboardPage() {
	const { presentationId } = useParams();
	// Note: Auth check is currently commented out in original
	// const session = await auth.api.getSession({
	// 	headers: await headers(),
	// });
	// if (!session?.user) {
	// 	redirect("/login");
	// }

	return <Dashboard presentationId={presentationId as string} />;
}
