import { db, powerpoints } from "@my-better-t-app/db";
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
};
