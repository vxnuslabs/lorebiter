# Lorebiter: Phase 5 Handoff Document

## Current State (Phase 4 Complete)
Lorebiter now supports **Long-term Memory & UX Polish**.
- **Schema Expansion:** The system fully supports dynamic entry types (`character`, `event`, `location`, `fact`, `relationship`).
- **Templates:** The entry creation UI automatically provides custom templates and layer labels based on the selected entry type.
- **Inner Thoughts:** The generation engine prompts characters to output internal reasoning hidden from the standard narrative. A toggle in the UI reveals these "Insights" to the user.
- **Cross-Session Summarization:** Sessions can be summarized via an AI call that compresses transcript events into permanent `fact` or `event` entries.
- **Quick Entry:** Users can dump raw text into a Magic Parse endpoint that uses NLP to structure it into the correct entry type and layers.

## Goal for Phase 5: World Cohesion & Data Portability (Month 2 Deepening)
Phase 5 marks the transition from MVP to a mature platform. The focus is on macro-level understanding of the lore (Lore Graph), advanced triggers (Semantic Search), and allowing users to backup and share their worlds.

## Core Features to Implement

### 1. Visual Lore Graph
- **Concept:** Lore entries reference each other (e.g., Head Maid -> Mansion). We need a visual representation of the web to help the user spot gaps or orphaned entries.
- **Implementation:**
  - Create `/worlds/[id]/graph` page.
  - Parse the tags and layers of entries to infer implicit links (e.g. if an entry mentions "Mansion" in its layers, link it to the Mansion entry).
  - Use a library like `react-force-graph` or standard SVG to render the nodes.
  - Highlight "Orphaned" entries (nodes with no edges) in amber.

### 2. Export / Import Worlds
- **Concept:** Since worlds are entirely private and self-contained, users should be able to back them up or share them.
- **Implementation:**
  - **Export API:** Add `/api/worlds/[id]/export` that fetches the World, all its Entries, Sessions, and Messages, then bundles them into a single massive JSON file for the user to download.
  - **Import API:** Add an upload button in the Global Hub (`/worlds`). Parse an uploaded JSON file and batch insert the records into the database with new IDs (to prevent conflicts).

### 3. Semantic Trigger Expansion (Embeddings)
- **Concept:** Currently, `auto_inject: true` is the only reliable way to put lore into context. Relying purely on keyword matching is brittle. We need vector embeddings.
- **Implementation:**
  - When an Entry is created or updated, call an embedding API (e.g. `text-embedding-3-small` or `nomic-embed-text`) on its combined layers.
  - Store the vector in a new `embedding` column in the `entries` table (requires `pgvector` setup in Drizzle/Neon).
  - During `generate`, embed the user's latest message (or the recent history) and perform a vector similarity search to pull in relevant entries that aren't already `present_npcs` or `autoInject`.

### 4. Full Log Semantic Search (RAG)
- **Concept:** "What happened with the rats?" The user should be able to query their own past sessions.
- **Implementation:**
  - Add an embedding column to `messages` as well, or chunk sessions into summaries.
  - Build a global search bar in the World Hub that retrieves the exact chat message or summarized event from past sessions using vector similarity.

## Next Steps for the Next Agent
1. **Drizzle Vector Setup:** Ensure the Neon database has `pgvector` enabled and update `src/db/schema.ts` to include `vector` columns for entries.
2. **Export/Import:** Build the UI and API routes for handling large JSON blob backups of entire worlds.
3. **Graph UI:** Implement `react-force-graph` on a dedicated `/graph` sub-page.
