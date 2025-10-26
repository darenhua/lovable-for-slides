import { db, powerpoints } from "@my-better-t-app/db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { publicProcedure } from "../index";

export const powerpointsRouter = {
	create: publicProcedure
		.input(
			z.object({
				filePath: z.string(),
				fileName: z.string(),
			}),
		)
		.handler(async ({ input }) => {
			const [result] = await db
				.insert(powerpoints)
				.values({
					filePath: input.filePath,
					fileName: input.fileName,
				})
				.returning();

			return result;
		}),

	getById: publicProcedure
		.input(z.object({ id: z.string().uuid() }))
		.handler(async ({ input }) => {
			const [presentation] = await db
				.select()
				.from(powerpoints)
				.where(eq(powerpoints.id, input.id))
				.limit(1);

			if (!presentation) {
				throw new Error("Presentation not found");
			}

			return presentation;
		}),
};
