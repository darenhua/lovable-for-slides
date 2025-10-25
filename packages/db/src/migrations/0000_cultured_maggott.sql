CREATE TABLE "powerpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_path" text NOT NULL,
	"file_name" text NOT NULL,
	"created_at" timestamptz DEFAULT now() NOT NULL
);