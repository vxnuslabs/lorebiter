# Lorebiter: Phase 6 Handoff Document

## Current State (Phase 5 Complete)
Lorebiter has successfully laid the groundwork for **World Cohesion & Data Portability**.
- **Vector Schema Setup:** Drizzle schema now supports `embedding` vector columns on both `entries` and `messages` tables, preparing the database for semantic search.
- **Export & Import Worlds:** Users can fully export a world (including all entries, sessions, and messages) into a portable JSON file, and import worlds seamlessly into their local or cloud database without ID conflicts.
- **Visual Lore Graph:** A new `/worlds/[id]/graph` route uses `react-force-graph-2d` to visualize relationships between lore entries. It automatically parses text layers to detect implicit links and highlights orphaned entries in amber.

## Goal for Phase 6: Semantic RAG & Advanced Triggers (Month 2 Completion)
With the vector database ready and worlds portable, Phase 6 focuses on bringing the data to life using vector embeddings. We must transition from exact-keyword matching to true semantic understanding of the lore and chat history.

## Core Features to Implement

### 1. Embedding Generation Pipeline
- **Concept:** Every time an Entry or Message is created or updated, we need to generate a vector embedding for its text.
- **Implementation:**
  - Create a utility function (e.g., in `src/lib/embeddings.ts`) that calls an embedding API (like OpenAI's `text-embedding-3-small`).
  - Update `POST /api/entries` and `POST /api/messages` routes: Before inserting into the database, generate the embedding and include it in the insert payload.
  - *Optional:* Write a backfill script for existing entries/messages that currently lack embeddings.

### 2. Semantic Trigger Expansion
- **Concept:** When a user sends a message, the system should automatically inject relevant Lore Entries into the AI's context based on semantic similarity, rather than relying solely on `autoInject` flags or exact name matches.
- **Implementation:**
  - In the main `generate` route, embed the user's latest prompt.
  - Use Drizzle's vector cosine distance operator (`cosineDistance`) to query the `entries` table.
  - Inject the top 3-5 most semantically relevant entries into the "Revealed Lore" block of the system prompt.

### 3. Full Log Semantic Search (Session RAG)
- **Concept:** Users should be able to ask questions about past sessions (e.g., "What happened with the rats?").
- **Implementation:**
  - Add a Search UI component inside the World Hub (`/worlds/[id]/search`).
  - Create an API route `/api/worlds/[id]/search` that takes a query, embeds it, and performs a vector search against the `messages` table for that specific world.
  - Return the most relevant past messages along with their timestamp and session context, allowing the user to click and jump to that point in history.

## Next Steps for the Next Agent
1. **Embedding API Setup:** Configure the OpenAI client (or OpenRouter equivalent) for text embeddings.
2. **Hook up Write Paths:** Update the create/edit endpoints for Entries and Messages to populate the `embedding` column automatically.
3. **Semantic Querying:** Implement the `cosineDistance` queries in Drizzle to fetch relevant context during AI generation and user searches.
4. **Search UI:** Build the global world search interface to query past chat logs.
