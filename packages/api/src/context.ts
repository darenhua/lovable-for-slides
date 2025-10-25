import { auth } from "@my-better-t-app/auth";

export async function createContext(req: { headers: Headers }) {
	const session = await auth.api.getSession({
		headers: req.headers,
	});
	return {
		session,
	};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
