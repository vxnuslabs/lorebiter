# Master Plan: Private Roleplaying Engine (Lorebiter)

## 1. Core Philosophy

- **Coherence over surprise**: The engine prioritizes memory, consistency, and authorship over randomness.
- **"Fun first"**: Build the playable loop in Week 1. Deepen later.
- **Narrative time, not mechanical time**: Time flows as the user directs. No real-time drift, no turn counters.
- **Lore is law**: Entries are typed, layered, and enforceable. Not free text.
- **Local-first**: SQLite + Expo (Android). Only API calls are for LLM generation and grammar polish.
- **Multi-world**: Each world is a self-contained database. No cross-contamination.

---

## 2. The 4-Agent Architecture

| Agent | Role | Context | Output |
|-------|------|---------|--------|
| **World Narrator** | Setting, atmosphere, physical actions, time, observable reality | Full world state, location, weather, objects | Descriptive prose between bubbles. No avatar. No name. Invisible infrastructure. |
| **User** | Player input | Their own intent | Actions, dialogue, commands. Right-aligned bubble. |
| **Agent Main Character** | One specific NPC (e.g., Head Maid) | Their own lore, relationship to user, current emotional state | Dialogue + action in standard bubble. Name as UI chrome. Never prefixes own name. |
| **Agent NPC/Global** | All other characters, crowds, background life | Aggregate lore for non-main NPCs, faction behaviors | Dispatched as individual bubbles when promoted, or summarized by World Narrator when background. |

**Rule**: Agents never generate user actions. Ever.

---

## 3. Scene Modes & Orchestration

### 3.1 Narrative Mode (Default)
- World Narrator prose flows between bubbles as plain text.
- One or few NPCs present but not individually speaking unless addressed.
- Efficient. Sets stage. Bridges time.

### 3.2 Dialogue Mode
- Triggered by user directly addressing an NPC, or calling a meeting.
- Promoted NPCs get their own generation turns with personal lore injected.
- Round-robin for small groups (≤3). Batch tool for larger groups.
- Auto-demote back to narrative after 3+ turns of no direct address.

### 3.3 Mode Transition Triggers

| Trigger | From | To | Action |
|---------|------|-----|--------|
| User addresses specific NPC | narrative | dialogue | Promote that NPC to active_speakers |
| User says "let's hear from everyone" / calls meeting | narrative | dialogue | Promote all present NPCs with relevant lore tags |
| 3+ turns dialogue, no direct address | dialogue | narrative | Demote all, World Narrator summarizes |
| User exits / "leave them" | dialogue | narrative | Demote, World frames next scene |
| User signals time jump (sleep, wake, "next morning") | any | narrative | World generates transition prose, jump to new moment |

**Intent parsing**: Regex + keyword. No LLM call for mode switching.

---

## 4. Lorebook System

### 4.1 Entry Types

| Type | Purpose | Example |
|------|---------|---------|
| **Character** | NPC identity, personality, memory layers | Head Maid |
| **Relationship** | Directed bond between two entities | Head Maid → User |
| **Fact** | Immutable world truth | User is the heir |
| **Event** | Something that happened, may have state | Old Master's Death |
| **Flag** | Boolean state, session-scoped or permanent | guest_incident_mentioned |
| **Location** | Place with sensory properties | East Wing |

### 4.2 Layer Structure (Per Entry)

```
public      → known to all agents, user-facing
personal    → known only to owner agent + World Narrator (for behavior accuracy)
observable  → World Narrator only (for prose description, not dialogue)
```

**Injection rules**:
- `public` → all agents
- `personal` → owner agent + World Narrator
- `observable` → World Narrator only

### 4.3 Triggers

```
reveal_public: always | on_keyword | on_intimacy | on_blackmail | manual
reveal_personal: always | on_intimacy_high | on_blackmail | manual
reveal_observable: on_insight_check | on_proximity | always
```

Once revealed, `auto_inject: true` entries are **permanently in context** until session ends. No retrieval needed.

### 4.4 Link System

Entries reference each other forming a web:
- Head Maid → User (relationship)
- Head Maid → Mansion (location)
- Head Maid → Old Master's Death (event)

**UI**: Visual graph. Tap entry → see connected nodes. Orphaned entries (no links) highlighted amber.

---

## 5. Session State

```json
{
  "scene": {
    "mode": "narrative",
    "focus": ["user"],
    "present_npcs": ["head_maid", "butler"],
    "active_speakers": [],
    "revealed_lore": ["maid_background", "terrible_guest_yesterday"],
    "active_lore": ["head_maid_identity", "user_is_heir"],
    "flags": {"guest_incident_mentioned": true},
    "observed_facts": ["head_maid_signed_repair_order"],
    "claimed_facts": [{"agent": "head_maid", "claim": "i_never_touched_ledgers", "turn": 52}],
    "last_summarized_turn": 47
  }
}
```

**State lives in context every turn.** AI sees it as a "memory block" in the system prompt.

---

## 6. Consistency Enforcement

### 6.1 World Narrator as Arbiter
World Narrator maintains `observed_facts`. Character agents are interpretations that can deviate, but deviations are **flagged**:

| Resolution | When |
|------------|------|
| Regenerate | Hard contradiction, no narrative justification |
| Flag as lie | Agent has `secret_keeper` or `deceptive` trait |
| Flag as misremembered | Agent has `unreliable` trait, or stress state |
| Accept and update | New info overrides old (rare, logged) |

### 6.2 Contradiction Detection
Cheap post-generation check: string similarity or small model call against `observed_facts`.

---

## 7. Output Format & Parsing

### 7.1 NPC Output Rules
- NEVER prefix own name. Never write "Head Maid: ..."
- NEVER generate actions or speech for the user.
- NEVER narrate in third person.
- Use *asterisks* for physical actions or tone.
- Use "quotation marks" for spoken words.
- May mix both in one message.
- Paraphrase others' speech. No nested quotes.

### 7.2 Parser (Optional)
```python
# Split into segments: speech vs action
# Strip accidental "Name: " prefix
# Detect hijack attempts (user actions in NPC output)
```

**Alternative**: No parsing. Render everything as mixed prose in one bubble. More robust, less structured.

### 7.3 UI Rendering
- **World Narrator prose**: Plain text, full width, no bubble. Between messages.
- **NPC dialogue/action**: Standard bubble, avatar left, name above.
- **User input**: Right-aligned bubble, distinct color.
- **System meta** (time, location): Centered, muted, small font. Optional.

---

## 8. Multi-World Architecture

### 8.1 Hierarchy
```
World ("The Heir")
├── Entries (the law of this world)
│   ├── Character: Head Maid
│   ├── Character: Butler
│   ├── Relationship: Head Maid → User
│   ├── Fact: Mansion East Wing
│   ├── Event: Old Master's Death
│   └── Flag: Guest Incident Revealed
├── Sessions (chat histories)
│   └── Session #1: "First Night"
└── World Settings (theme, narrator voice, global rules)
```

### 8.2 Database
- Each world = one SQLite file.
- Switch worlds = switch database connection.
- Export/import: copy sqlite file.

---

## 9. UI/UX Design

### 9.1 Entry List
- Scrollable card list.
- Tap to expand/edit.
- Swipe for quick actions (duplicate, archive, link).
- Filter by type, tag, or link status.

### 9.2 Entry Editor
- Collapsible layers (public/personal/observable).
- "AI Polish" button per layer: sends to API, returns diff, user approves/rejects.
- Tags: freeform + autocomplete from existing.
- Links: visual picker to connect other entries.
- Triggers: dropdown selectors.

### 9.3 World Switcher
- Grid or list of worlds.
- Show entry count, session count, last played.
- Long press: export, duplicate, delete.
- Tap: enter world hub.

### 9.4 Session Starter
- Select active entries for this session (checkboxes).
- Scene seed: optional text field.
- "Begin" button.

### 9.5 Visual Graph (Lore Web)
- Nodes = entries.
- Edges = links.
- Tap node → see details.
- Orphaned nodes highlighted amber.

### 9.6 Entry Templates
| Template | Pre-fills |
|----------|-----------|
| Character | public/personal/observable layers, loyalty trigger |
| Relationship | two entities, tension scale, secret checkbox |
| Event | date (vague), participants, before/after state |
| Location | sensory layers (sight, smell, sound), mood |

### 9.7 Quick Entry Mode
- For inspiration strikes: just dump text.
- Tag and structure later.
- One field, no layers, no triggers.
- Convert to full entry when ready.

---

## 10. Persistence Strategy

### 10.1 Session State
- JSON blob per session. Saved every turn.
- Load session = restore exact state.

### 10.2 Cross-Session Memory (Month 2)
After each session, cheap LLM call compresses key events into 2-3 new lore entries.
- Written back to world's entry list.
- `auto_inject: true` for next session.
- Not perfect recall, but *narrative* recall.

### 10.3 Full Log Archive
- Raw chat logs stored.
- Semantic search for "what happened with the rats?" (future RAG).

---

## 11. MVP Roadmap

### Week 1: The Loop
- [ ] JSON lore schema (hardcoded file)
- [ ] Narrative mode only
- [ ] One scene, one NPC (Head Maid)
- [ ] User can: speak, act, move, sleep/wake
- [ ] World Narrator: sets stage, follows time jumps
- [ ] Basic UI: world prose + NPC bubble + user input
- [ ] Feel the rhythm

### Week 2: Dialogue
- [ ] Dialogue mode
- [ ] Promotion/demotion logic
- [ ] Direct address parsing
- [ ] One-on-one conversations

### Week 3: Meetings & Consistency
- [ ] Multi-NPC dialogue (round-robin + batch fallback)
- [ ] Contradiction detection
- [ ] Lie/misremember flags
- [ ] World Narrator as arbiter

### Week 4: Polish & Memory
- [ ] Batch meeting tool
- [ ] Inner thought logging
- [ ] Session summarization → new lore entries
- [ ] Entry templates
- [ ] Quick entry mode

### Month 2: Deepening
- [ ] Semantic trigger expansion (embeddings)
- [ ] Full log semantic search
- [ ] Visual lore graph
- [ ] Export/import worlds
- [ ] Advanced relationship dynamics

---

## 12. Technical Stack

| Layer | Choice |
|-------|--------|
| Frontend | Expo (React Native) for Android |
| Database | SQLite (local, per-world file) |
| LLM API | External API (OpenAI, Claude, local endpoint) |
| State Management | In-memory JSON + SQLite persistence |
| Embeddings | Optional, Month 2 (API or local model) |

---

## 13. Anti-Patterns to Avoid

1. **Real-time mechanics**: No idle timers, no "come back in 3 hours."
2. **Forced drama**: Let lore drive tension, not random events.
3. **Over-retrieval**: Don't query lorebook every turn. Inject revealed lore permanently.
4. **NPC hijack**: Never let agents write user actions.
5. **Name prefixes in text**: UI handles attribution. Text stays clean.
6. **Babying the user**: Assume competence. No tutorial walls.
7. **Premature RAG**: Start with keyword triggers. Semantic search is Month 2.

---

## 14. Open Questions

1. Parser vs no-parser for action/speech separation?
2. World Narrator voice: permanently neutral, or vibe-shift per world theme?
3. Meeting threshold for batch vs round-robin? (Default: 3 NPCs)
4. Should session summaries be auto-generated or user-curated?
5. How to handle user-created contradictions (retconning their own actions)?

---

*Document version: 1.0*
*Created: 2026-08-11*
*Status: Architecture complete. Ready for Week 1 implementation.*
