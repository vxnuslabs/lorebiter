CREATE TABLE "entries" (
	"id" text PRIMARY KEY NOT NULL,
	"world_id" text NOT NULL,
	"type" text NOT NULL,
	"name" text NOT NULL,
	"tags" text[] DEFAULT '{}',
	"layers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"triggers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"auto_inject" boolean DEFAULT true,
	"embedding" vector(1536),
	"created_at" integer DEFAULT 1786420950
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"speaker_name" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"embedding" vector(1536),
	"created_at" integer DEFAULT 1786420950
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"world_id" text NOT NULL,
	"state" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"started_at" integer DEFAULT 1786420950,
	"last_turn" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "worlds" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"theme_hint" text,
	"narrator_voice" text,
	"created_at" integer DEFAULT 1786420950
);
--> statement-breakpoint
ALTER TABLE "entries" ADD CONSTRAINT "entries_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_session_id_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_world_id_worlds_id_fk" FOREIGN KEY ("world_id") REFERENCES "public"."worlds"("id") ON DELETE no action ON UPDATE no action;