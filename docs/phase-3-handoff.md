# Lorebiter: Phase 3 Handoff Document

## Current State (Phase 2 Complete)
Lorebiter currently supports **Dialogue Mode** with multiple NPCs. 
- The system correctly detects direct addresses and promotes NPCs to `active_speakers`.
- The `generate` API performs a batch generation where the World Narrator and all `active_speakers` respond in a single LLM call.
- Time jumps and dismissals correctly demote characters and return the session to `narrative` mode.
- The UI handles multiple characters per session seamlessly.

## Goal for Phase 3: Meetings & Consistency
Phase 3 focuses on **Consistency Enforcement**. Now that multiple characters can talk, they might contradict established lore or each other. We need to implement a mechanism where the "World Narrator acts as the arbiter of truth," detecting contradictions and handling them gracefully (either by flagging them as lies/misremembered, or forcing a regeneration).

## Core Features to Implement

### 1. Fact Tracking in State
- **Concept:** The session must keep track of what is observably true versus what characters claim.
- **Implementation:** 
  - Update the `state` JSON in the `sessions` table (no schema migration needed since it's `jsonb`, just update the default/initialization logic).
  - Add `observed_facts: string[]` (facts established by the World Narrator or user actions).
  - Add `claimed_facts: { agent: string, claim: string, turn: number }[]` (things NPCs have said).

### 2. The Consistency Check (Arbiter)
- **Concept:** A post-generation check to see if the newly generated character dialogue contradicts any `observed_facts` or strict `public` lore.
- **Implementation:**
  - After `generateResponse` completes, perform a second, smaller/cheaper LLM call (the "Arbiter").
  - **Arbiter Prompt:** Provide the `observed_facts`, the character's traits/tags, and the newly generated dialogue. Ask: "Does this dialogue contain a hard contradiction against the observed facts? Respond with JSON: `{ "contradiction": true, "reason": "...", "justifiable": boolean }`"

### 3. Resolution Logic
- **Concept:** If a contradiction is detected, how do we handle it?
- **Implementation:**
  - Check the offending character's `tags` (loaded from their entry).
  - If they have a tag like `deceptive` or `secret_keeper`, and the contradiction is justifiable as a lie: **Accept the response**, but flag the message object in the database (e.g., add a `metadata: { flag: "lie" }` column to `messages` or just append a visual note to the UI).
  - If they have a tag like `unreliable` or `stressed`: **Accept the response**, flag as `metadata: { flag: "misremembered" }`.
  - If it's a **Hard Contradiction** with no narrative justification (e.g., the character says they are holding a sword when they are unarmed): **Regenerate** the character's response with a strict guard prompt pointing out the error.

### 4. Updating Observed Facts
- **Concept:** The World Narrator's prose establishes new truths.
- **Implementation:**
  - If the World Narrator generates prose that contains significant factual changes (e.g., "The bridge collapses"), the Arbiter should extract that fact and append it to the session's `observed_facts` array.

## Code & Schema Changes Required

1. **Messages Table Update:**
   - Modify `src/db/schema.ts` to add a `metadata` JSONB column to the `messages` table. This will store `{ flag: "lie" | "misremembered" }`.
   - Run `npx drizzle-kit push` (ensure `DATABASE_URL` is set).

2. **Update UI:**
   - Modify `src/app/sessions/[id]/page.tsx`. If a character's message has `metadata.flag === "lie"`, render a subtle UI indicator (e.g., a small red "Deception" icon or a faded thought bubble next to the message) to let the User know the engine caught it.

3. **Generate API Refactor (`src/app/api/generate/route.ts`):**
   - After the main generation loop, hook in the `Arbiter` LLM call.
   - Implement the retry/regenerate loop for hard contradictions.
   - Save the extracted `observed_facts` back to the session state.

## Next Steps for the Next Agent
1. Update `schema.ts` to add `metadata` to `messages`.
2. Update the `generate` API to include the post-generation Arbiter call.
3. Update the chat UI to display consistency flags (lies/misremembrances).
4. Test the flow by creating a character with the `deceptive` tag and attempting to force a contradiction.
