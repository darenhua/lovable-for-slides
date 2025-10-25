import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const powerpoints = pgTable("powerpoints", {
	id: uuid("id").primaryKey().defaultRandom(),
	filePath: text("file_path").notNull(),
	fileName: text("file_name").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});
