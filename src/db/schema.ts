import { pgTable, text, integer, jsonb, boolean, vector } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  passwordHash: text("password_hash"),
  createdAt: integer("created_at").default(Math.floor(Date.now() / 1000)),
});

export const personas = pgTable("personas", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  createdAt: integer("created_at").default(Math.floor(Date.now() / 1000)),
});

export const worlds = pgTable("worlds", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id").references(() => users.id),
  themeHint: text("theme_hint"),
  narratorVoice: text("narrator_voice"),
  createdAt: integer("created_at").default(Math.floor(Date.now() / 1000)),
});

export const entries = pgTable("entries", {
  id: text("id").primaryKey(),
  worldId: text("world_id").notNull().references(() => worlds.id),
  type: text("type", { enum: ["character", "event", "location", "fact", "relationship", "role", "faction", "concept"] }).notNull(),
  name: text("name").notNull(),
  aliases: jsonb("aliases").default([]).notNull(),
  tags: text("tags").array().default([]),
  layers: jsonb("layers").default({}).notNull(), // e.g. { appearance: string, background: string }
  triggers: jsonb("triggers").default({}).notNull(), // e.g. { reveal_appearance: string }
  autoInject: boolean("auto_inject").default(true),
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: integer("created_at").default(Math.floor(Date.now() / 1000)),
});

export const relationships = pgTable("relationships", {
  id: text("id").primaryKey(),
  worldId: text("world_id").notNull().references(() => worlds.id),
  sourceId: text("source_id").notNull().references(() => entries.id, { onDelete: "cascade" }),
  targetId: text("target_id").notNull().references(() => entries.id, { onDelete: "cascade" }),
  relationType: text("relation_type").notNull(),
  context: text("context"),
  createdAt: integer("created_at").default(Math.floor(Date.now() / 1000)),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  worldId: text("world_id").notNull().references(() => worlds.id),
  personaId: text("persona_id").references(() => personas.id),
  boundEntityId: text("bound_entity_id").references(() => entries.id),
  state: jsonb("state").default({}).notNull(),
  startedAt: integer("started_at").default(Math.floor(Date.now() / 1000)),
  lastTurn: integer("last_turn").default(0),
});

export const messages = pgTable("messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => sessions.id),
  role: text("role", { enum: ["user", "world", "character"] }).notNull(),
  content: text("content").notNull(),
  speakerName: text("speaker_name"), // for character role
  metadata: jsonb("metadata").default({}), // { flag: "lie" | "misremembered" }
  embedding: vector("embedding", { dimensions: 1536 }),
  createdAt: integer("created_at").default(Math.floor(Date.now() / 1000)),
});
