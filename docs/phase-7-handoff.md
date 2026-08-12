# Lorebiter: Phase 7 Handoff Document

## Current State (Phase 6 Complete)
Lorebiter now boasts **Semantic RAG & Advanced Triggers**.
- **Embedding Pipeline:** Both Entries and Messages are automatically converted to embeddings upon creation using `src/lib/embeddings.ts` (configured for OpenAI's `text-embedding-3-small`).
- **Semantic Triggers:** The `generate` API route now dynamically queries the `entries` table using `cosineDistance` to automatically inject the top 3 most relevant Lore Entries based on the user's input, reducing reliance on strict keywords.
- **Session RAG Search:** A new Semantic Search page (`/worlds/[id]/search`) allows users to query past chat logs by semantic meaning. Results are sorted by vector distance, pulling out distant memories instantly.

## Goal for Phase 7: Advanced Relationship Dynamics & UI Polish
With the backend fully fleshed out with embeddings, consistency engines, and portable worlds, Phase 7 pivots back to the game's mechanics and user experience. We need to implement dynamic relationship states (e.g. tracking tension/intimacy) and polish the frontend experience to match the architecture's power.

## Core Features to Implement

### 1. Dynamic Relationship State (Tension & Intimacy)
- **Concept:** Characters should track their "Intimacy" and "Tension" with the User and each other across sessions. 
- **Implementation:**
  - Create a specialized `relationship` viewer in the Entry UI that renders a sliding scale or status tag for Intimacy/Tension.
  - Update the Consistency Arbiter to output relationship changes at the end of a session or generation turn:
    `{ "relationship_updates": [{ "target": "user", "change": "+1 intimacy" }] }`
  - Write these updates back to the relevant `relationship` entry layers.

### 2. Inner Thought UI Polish
- **Concept:** The `INNER_THOUGHT` engine works perfectly in the backend, but the frontend needs a beautiful way to display it.
- **Implementation:**
  - Update the Session chat UI to parse `metadata.inner_thought` from messages.
  - Add an "Insight Glass" toggle button to the UI that, when active, reveals character inner thoughts above their spoken dialogue using distinct styling (e.g., italicized text with a subtle background color or thought bubble).

### 3. Mobile / Desktop Considerations (PWA)
- **Concept:** Lorebiter is meant to be a private, local-first feeling app.
- **Implementation:**
  - Ensure all layouts are strictly mobile-responsive.
  - Add `manifest.json` and service worker setup to make the Next.js app a Progressive Web App (PWA) so users can install it to their home screen on Android/iOS.
  - (Optional) Investigate Tauri or React Native Expo bridging if a native build is desired in the future.

## Next Steps for the Next Agent
1. **Relationship Mechanics:** Modify the Arbiter prompt in `/api/generate` to detect and output relationship shifts.
2. **Chat UI Update:** Revamp the message bubbles in `src/app/worlds/[id]/sessions/[sessionId]/page.tsx` to handle inner thoughts gracefully.
3. **PWA Setup:** Add the required Next.js PWA configuration.
