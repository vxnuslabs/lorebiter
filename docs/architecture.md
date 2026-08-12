# Lorebiter Architecture

Lorebiter is built on a strict separation of concerns between **Canonical World State** and **Semantic LLM Generation**. 

The core principle is:
> The database is the canonical world state. The LLM is the semantic reasoning/narration layer.

## Core Concepts

### 1. Account (Users)
The authenticated real human user. Used for ownership, permissions, and persistence.
- Table: `users`
- Managed via NextAuth-like custom middleware and cookies.

### 2. Persona
A reusable player identity owned by an Account. It contains intrinsic traits (appearance, personality, background) independent of any specific world.
- Table: `personas`
- Example: *Name: Artemis, Description: chaotic rogue synth.*

### 3. World Entity (Role)
A canonical entity that exists within a specific World. This could be an NPC, a faction, or a player-occupiable role.
- Table: `entries` (Type: `character`, `role`, etc.)
- Example: *The Heir, Head Maid, Royal Guard.*

### 4. Session Binding
The runtime bridge that places a user's Persona into a canonical World Entity for the duration of a playthrough.
- Table: `sessions`
- Stores: `personaId` -> `boundEntityId`
- **Crucial Rule:** The Persona and World Entity are never merged in the database. The binding is strictly contextual.

---

## Generation Pipeline (The State Loop)

The LLM generation pipeline operates in explicit stages to ensure canonical integrity.

### Stage 1: Semantic Entity Resolution
*User language → Canonical Entities*
Before any generation occurs, the engine parses the user's message to identify which existing World Entities are being addressed (e.g., resolving "the old servant" to the UUID of the "Head Maid"). 
- A lightweight LLM pass evaluates the active NPCs and top vector-search candidates.
- It returns a strict JSON array of addressed UUIDs. 
- **Rule:** The engine never invents entities based on ambiguous user input.

### Stage 2: Bounded Relationship Traversal
*Canonical Entities → Graph Context*
The engine builds a "scene neighborhood" graph:
1. Gathers the `sceneEntityIds` (active NPCs + addressed entities + player's bound entity).
2. Traverses the `relationships` table for any edge directly connected (1-hop) to these IDs.
3. Prioritizes relationships involving the Player's Bound Entity and caps the total number to prevent prompt flooding.

### Stage 3: AI Context Construction
*State → LLM Prompt*
The prompt is constructed authoritatively. 
- **Player Binding:** Explicitly defines the active Persona and the World Role they occupy.
- **Canonical Relationships:** Lists the bounded relationships.
- **Session-Resolved Interpretation:** Instructs the LLM that any canonical relationship directed at the World Role applies to the occupying Persona.
  *(e.g., If the Head Maid RESENTS The Heir, she resents Artemis in this session).*

### Stage 4: Scene Generation
*LLM Prompt → Narrative Output*
The model generates the scene, strictly formatting character inner thoughts, dialogue, and world prose. The model dictates *how* canonical truths manifest naturally in the narrative, but cannot rewrite the truths themselves.

### Stage 5: Consistency Arbiter
*Narrative Output → Structured State Changes*
The generated scene is evaluated by the Arbiter against the Established Observed Facts and Canonical Relationships.
- The Arbiter detects meaningful, persistent changes in entity relationships.
- It outputs structured JSON updates mapping exact `sourceEntityId` and `targetEntityId` UUIDs to new `relationTypes` and context.
- **Rule:** Fleeting narrative emotions do not trigger canonical state mutations.

### Stage 6: Application Validation & Persistence
*Structured Updates → Database*
The engine intercepts the Arbiter's proposed changes:
1. Validates that the UUIDs exist and were part of the scene scope.
2. Upserts the new context into the structured `relationships` table.
3. The legacy unstructured `entries` table is protected from arbitrary relationship mutations.

---

## Relationship Evolution

Relationships in Lorebiter are strictly separated from arbitrary Lore.

- **Static Relationships:** Canonical Lore (e.g., "The Heir rules the Kingdom").
- **Dynamic Relationships:** Evolving states handled via the `relationships` table (`id, worldId, sourceId, targetId, relationType, context`).

When the Arbiter detects a shift (e.g., the Head Maid begins to trust the Heir), it updates the `context` of the existing `relationType` or inserts a new record. The graph remains strictly attached to canonical World Entities (e.g., Head Maid → The Heir), ensuring that if a different Persona plays The Heir in a new Session, they inherit the exact canonical world state.
