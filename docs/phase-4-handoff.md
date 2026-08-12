# Lorebiter: Phase 4 Handoff Document

## Current State (Phase 3 Complete)
Lorebiter now features **Consistency Enforcement**. The generation engine uses a secondary "Arbiter" LLM call to evaluate generated responses against the session's `observed_facts`.
- It tracks `observed_facts` throughout the session.
- It detects contradictions and handles them dynamically:
  - Tags like `deceptive` flag the message metadata as `lie`.
  - Tags like `unreliable` flag it as `misremembered`.
  - Hard contradictions automatically trigger a targeted regeneration prompt.
- The UI renders "Deception" or "Misremembered" badges on character bubbles when these flags are present.

## Goal for Phase 4: Memory & Polish
Phase 4 shifts focus from session-level orchestration to **Long-term Memory & UX Polish**. When a session ends, the events that transpired need to be compressed into new lore entries to persist the story. Additionally, the entry creation process will be streamlined with templates and quick-entry modes.

## Core Features to Implement

### 1. Cross-Session Memory (Summarization)
- **Concept:** "After each session, a cheap LLM call compresses key events into 2-3 new lore entries."
- **Implementation:**
  - Create a new API route: `POST /api/sessions/[id]/summarize`
  - Fetch all messages from the session.
  - Prompt the LLM to extract the most important narrative developments into 1-3 new `Event` or `Fact` entries.
  - Programmatically insert these into the `entries` table, attached to the `worldId`, with `auto_inject: true`.
  - Add a "Summarize & End Session" button to the session UI.

### 2. Entry Types & Templates
- **Concept:** Phase 1 only implemented the `character` type. We need to expand this to `event`, `location`, `fact`, and `relationship`.
- **Implementation:**
  - Update `src/db/schema.ts` to expand the `type` enum in the `entries` table: `enum: ["character", "event", "location", "fact", "relationship"]`. (Run `drizzle-kit push`).
  - Update the `src/app/worlds/[id]/entries/new/page.tsx` UI to allow selecting an Entry Type.
  - Implement **Templates**:
    - If `character` is selected, pre-fill layers with "public/personal/observable".
    - If `location` is selected, pre-fill layers with "sight", "sound", "smell/atmosphere".
    - If `event` is selected, pre-fill layers with "before_state", "after_state".

### 3. Quick Entry Mode
- **Concept:** "For inspiration strikes: just dump text. Tag and structure later."
- **Implementation:**
  - Add a "Quick Draft" button in the World Hub.
  - Opens a modal with a single large text area.
  - Submitting it calls an AI endpoint (`/api/entries/parse`) that takes the raw text block, infers the type, splits the information into the appropriate layers (e.g. public vs personal), and auto-generates tags.
  - The UI then drops the user into the standard Entry Editor pre-filled with the AI's suggestions for final approval.

### 4. Inner Thought Logging
- **Concept:** Characters should have a hidden "inner thought" block that informs their dialogue but isn't spoken aloud.
- **Implementation:**
  - Modify the Generation API and prompt to ask characters to output an `INNER_THOUGHT:` block before their dialogue.
  - Store this thought in the `metadata` column of the message.
  - In the UI, add an "Insight" toggle to reveal inner thoughts (this is a god-mode feature for the user).

## Next Steps for the Next Agent
1. **Schema Migration:** Update `entries.type` enum in `src/db/schema.ts` to support all entry types.
2. **Summarization API:** Build the `/api/sessions/[id]/summarize` route and wire it to a button in the Chat UI.
3. **UI Expansion:** Refactor the `entries/new` page to support dynamic templates based on the selected entry type.
4. **Quick Entry:** Build the NLP-powered Quick Entry modal and API route.
