# Lorebiter: Phase 2 Handoff Document

## Current State (Phase 1 Complete)
Lorebiter currently has a working "Narrative Loop" built on Next.js App Router, Neon (PostgreSQL), Drizzle ORM, and the OpenRouter API. 

**What is working:**
- Multi-world creation and management.
- Creation of Character lore entries (with Public, Personal, Observable layers and Tags).
- Start and persistence of chat sessions with one specific active character.
- The chat loop successfully prompts a dual-agent generation (World Narrator + Character) using `claude-3.5-sonnet`.
- Time jump detection (regex matching words like "sleep", "morning") appending transitions.
- Anti-hijack filter preventing characters from generating user actions.
- "AI Polish" API integrated for lore layer refinement.

## Goal for Phase 2
Phase 2 focuses on introducing **Dialogue Mode** and the dynamic promotion/demotion of characters in a scene. Right now, a session is strictly one-on-one. In Phase 2, the system must support tracking multiple NPCs in a room, determining who the user is speaking to, and isolating responses to the addressed character.

## Core Features to Implement

### 1. Direct Address Parsing
- **Concept:** Detect when the user is speaking to a specific NPC by name or title (e.g., "Tell me, Head Maid..." or "What do you think, Butler?").
- **Implementation:** 
  - Enhance `POST /api/generate` to scan the `userMessage` against the names/tags of `present_npcs` (a new state array).
  - If a match is found, promote that NPC to `active_speakers`.

### 2. Promotion & Demotion Logic
- **Concept:** Only active speakers generate dialogue bubbles. 
- **Triggers:**
  - *Promote*: User directly addresses an NPC. (State moves from `narrative` to `dialogue`).
  - *Demote*: 3+ turns of dialogue pass without direct address, or the user explicitly dismisses them ("Leave us", "I walk away").
- **Implementation:**
  - Update the `sessions` state JSON in the database to track:
    - `mode`: `"narrative" | "dialogue"`
    - `present_npcs`: `string[]` (IDs of entries in the current scene)
    - `active_speakers`: `string[]` (IDs of entries currently promoted to speak)

### 3. Scene Management & Multiple NPCs
- **Concept:** A session can now have multiple characters "present" even if they aren't actively speaking.
- **Implementation:**
  - Update `src/app/worlds/[id]/sessions/new/page.tsx` to allow selecting *multiple* characters to be present in the scene, rather than just one active character.
  - The UI will need to pass an array of `entryIds` when creating a session.
  - Update the system prompt to inject the `observable` layer of `present_npcs` into the World Narrator's context, and the `public/personal` layers only for `active_speakers`.

## Database Schema Changes Required
The current `sessions` table has a hardcoded `entryId` column for the 1-on-1 model.
```typescript
// IN src/db/schema.ts:
// REMOVE: entryId: text("entry_id").notNull().references(() => entries.id)
// ADD: use the `state` jsonb object to store present_npcs and active_speakers.
```
*Note: A Drizzle migration will be required to alter the `sessions` table to remove `entryId` and rely entirely on the `state` JSON for tracking participants.*

## Next Steps for the Next Agent
1. **Schema Migration:** Remove `entryId` from `sessions` table. Rely on the `state` JSON column to store `present_npcs: string[]` and `active_speakers: string[]`. Run `drizzle-kit push`.
2. **Update Session UI:** Modify `NewSessionPage` to use checkboxes for selecting multiple characters to include in the scene.
3. **Update Generation API:** Rewrite the orchestration logic in `src/app/api/generate/route.ts` to support the promotion/demotion lifecycle. If `mode === "narrative"`, perhaps only the World Narrator generates. If `mode === "dialogue"`, iterate through `active_speakers` to generate character responses.

## Code References
- **Schema**: `src/db/schema.ts`
- **Generation Logic**: `src/app/api/generate/route.ts` (this file will require the largest refactor).
- **Session State**: `src/app/worlds/[id]/sessions/new/page.tsx`
