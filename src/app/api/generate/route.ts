import { NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, entries, messages, worlds, personas, relationships } from "@/db/schema";
import { inArray, eq, desc, sql, cosineDistance } from "drizzle-orm";
import { randomUUID } from "crypto";
import { generateResponse } from "@/lib/openrouter";
import { generateEmbedding } from "@/lib/embeddings";

export const dynamic = 'force-dynamic';

const TIME_JUMP_REGEX = /sleep|wake|morning|night|later|tomorrow|hours?|days?/i;
const ADDRESS_EVERYONE_REGEX = /everyone|all of you|let's hear from|listen up/i;
const HIJACK_PATTERNS = [
  /^You\s+(walk|look|say|think|feel|move|stand|sit|turn|reach)/im,
  /^\*You\s+/im,
  /^"You\s+/im,
];

function containsHijack(text: string): boolean {
  return HIJACK_PATTERNS.some(p => p.test(text));
}

export async function POST(request: Request) {
  try {
    const { sessionId, userMessage, model } = await request.json();

    const userEmbedding = await generateEmbedding(userMessage);

    const userId = randomUUID();
    await db.insert(messages).values({
      id: userId,
      sessionId,
      role: "user",
      content: userMessage,
      embedding: userEmbedding,
    });

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

    const [world] = await db.select().from(worlds).where(eq(worlds.id, session.worldId));
    
    const state = session.state as any;
    const presentNpcIds = state.present_npcs || [];
    let activeSpeakerIds = state.active_speakers || [];
    let mode = state.mode || "narrative";
    let turnsSinceDirectAddress = state.turns_since_direct_address || 0;
    let observedFacts = state.observed_facts || [];

    let presentNpcs: any[] = [];
    if (presentNpcIds.length > 0) {
      presentNpcs = await db.select().from(entries).where(inArray(entries.id, presentNpcIds));
    }

    const personaId = session.personaId;
    const boundEntityId = session.boundEntityId;
    
    let persona = null;
    let boundEntity = null;
    if (personaId) {
      const [p] = await db.select().from(personas).where(eq(personas.id, personaId));
      persona = p;
    }
    if (boundEntityId) {
      const [e] = await db.select().from(entries).where(eq(entries.id, boundEntityId));
      boundEntity = e;
    }

    // STAGE 1: Semantic Retrieval for Candidates
    const candidateEntries = await db.select()
      .from(entries)
      .where(eq(entries.worldId, session.worldId))
      .orderBy(cosineDistance(entries.embedding, userEmbedding))
      .limit(5);

    const relevantLoreContext = candidateEntries
      .filter(e => !presentNpcIds.includes(e.id))
      .map(e => `${e.name}: ${(e.layers as any).public || ""} ${(e.layers as any).personal || ""}`);

    // STAGE 2: Lightweight Entity Resolution
    const allCandidates = new Map();
    presentNpcs.forEach(n => allCandidates.set(n.id, n));
    candidateEntries.forEach(n => allCandidates.set(n.id, n));
    if (boundEntity) allCandidates.set(boundEntity.id, boundEntity);

    let addressedEntityIds = new Set<string>();
    try {
      const resolverPrompt = `You are a semantic entity resolver. Identify which canonical entities from the given list are being explicitly addressed, mentioned, or interacted with in the User Message.
      
Available Entities:
${Array.from(allCandidates.values()).map(n => `[ID: ${n.id}] ${n.name} (Aliases: ${JSON.stringify(n.aliases || [])})`).join('\n')}

Output strictly in JSON format:
{
  "addressedEntityIds": ["UUID1", "UUID2"]
}
If none are addressed or it is ambiguous, output an empty array. Do NOT invent IDs.`;

      const resolverResponse = await generateResponse({ systemPrompt: resolverPrompt, userMessage, model });
      const jsonMatch = resolverResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed.addressedEntityIds)) {
          parsed.addressedEntityIds.forEach((id: string) => addressedEntityIds.add(id));
        }
      }
    } catch (e) {
      console.warn("Entity resolver failed", e);
    }

    // STAGE 3: Relationship Resolution
    let sceneEntityIds = new Set(presentNpcs.map(n => n.id));
    addressedEntityIds.forEach(id => sceneEntityIds.add(id));
    if (boundEntity) sceneEntityIds.add(boundEntity.id);
    
    const allWorldRels = await db.select().from(relationships).where(eq(relationships.worldId, session.worldId));
    
    // Bounded traversal: 1-hop from scene entities
    const relevantRels = allWorldRels.filter(r => sceneEntityIds.has(r.sourceId) || sceneEntityIds.has(r.targetId));
    
    // Prioritize relationships
    relevantRels.sort((a, b) => {
      const aInvolvesPlayer = boundEntityId && (a.sourceId === boundEntityId || a.targetId === boundEntityId);
      const bInvolvesPlayer = boundEntityId && (b.sourceId === boundEntityId || b.targetId === boundEntityId);
      if (aInvolvesPlayer && !bInvolvesPlayer) return -1;
      if (!aInvolvesPlayer && bInvolvesPlayer) return 1;
      return 0;
    });

    const neededEntryIds = new Set([...relevantRels.map(r => r.sourceId), ...relevantRels.map(r => r.targetId)]);
    
    let formattedRels: string[] = [];
    if (neededEntryIds.size > 0) {
      const relationEntities = await db.select({ id: entries.id, name: entries.name }).from(entries).where(inArray(entries.id, Array.from(neededEntryIds)));
      const entityNameMap = Object.fromEntries(relationEntities.map(e => [e.id, e.name]));
      
      // Cap at top 15 relationships to prevent flooding
      formattedRels = relevantRels.slice(0, 15).map(r => {
        const src = entityNameMap[r.sourceId] || "Unknown";
        const tgt = entityNameMap[r.targetId] || "Unknown";
        return `- [${src}] ${r.relationType} [${tgt}] ${r.context ? `(Context: ${r.context})` : ''}`;
      });
    }

    const isTimeJump = TIME_JUMP_REGEX.test(userMessage);
    if (isTimeJump) {
      mode = "narrative";
      activeSpeakerIds = [];
      turnsSinceDirectAddress = 0;
    } else {
      // We pass the active entities to the LLM and let it semantically determine who was addressed.
      // We still detect direct dismissals to clear the scene.
      const isDismissal = /leave us|leave me|walk away|goodbye/i.test(userMessage);
      if (isDismissal) {
        mode = "narrative";
        activeSpeakerIds = [];
        turnsSinceDirectAddress = 0;
      }
    }

    state.mode = mode;

    const recentMessages = await db.select().from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(desc(messages.createdAt))
      .limit(5);
    recentMessages.reverse();

    const historyText = recentMessages.map(m => {
      if (m.role === "world") return `WORLD: ${m.content}`;
      if (m.role === "character") return `${m.speakerName}: ${m.content}`;
      return `USER: ${m.content}`;
    }).join("\n\n");

    const activeNpcs = presentNpcs.filter(npc => activeSpeakerIds.includes(npc.id));

    // Prepare Prompt
    let systemPrompt = `You are the Game Engine orchestration layer. You must generate the response for the scene.

CANONICAL WORLD STATE
=====================

PLAYER BINDING:
${persona && boundEntity ? `Persona: ${persona.name}
Persona Description: ${persona.description}
Current World Role: ${boundEntity.name}
Binding: ${persona.name} occupies ${boundEntity.name} for this session. Do NOT merge them into one database entity. ${persona.name} is the active Persona. ${boundEntity.name} is the World Entity being occupied.` : 'None (acting as generic observer).'}

ACTIVE ENTITIES:
${presentNpcs.map(n => `- ${n.name} (Appearance: ${(n.layers as any).observable || 'No observable traits.'})`).join("\n")}

CANONICAL RELATIONSHIPS:
${formattedRels.length > 0 ? formattedRels.join("\n") : "None."}

SESSION-RESOLVED INTERPRETATION:
${persona && boundEntity ? `- In this session, ${boundEntity.name} is occupied by ${persona.name}.\n- Therefore any canonical relationship directed toward ${boundEntity.name} applies to ${persona.name}.` : ''}

SEMANTIC LORE
=====================
${relevantLoreContext.length > 0 ? relevantLoreContext.join("\n") : "None relevant."}
Established Observed Facts:
${observedFacts.length > 0 ? observedFacts.map((f: string) => "- " + f).join("\n") : "None yet."}

RECENT SESSION HISTORY
=====================
${historyText}

INSTRUCTIONS
=====================
Canonical World State is authoritative.
Do not invent or modify canonical entities or relationships.
Use Persona traits and World Role context to determine how canonical relationships manifest naturally.
Do not treat Persona and World Entity as the same identity.
Do not rewrite canonical relationships into Persona-specific relationships.

1. First, always output WORLD: [prose] to describe settings, physical actions, and time. Keep it 2-4 sentences. Bridge any time gaps. Never generate actions for the user.
2. If the user addresses or interacts with any ACTIVE ENTITIES, or if they would naturally respond, output a section for each of them.
3. For each character responding, FIRST provide their inner thoughts using INNER_THOUGHT: [text], THEN their spoken dialogue/actions using DIALOGUE: [text]. They must respond in-character. Never narrate for the user.
4. Output EXACTLY like this format:
WORLD: [prose]
---
CHARACTER [Name of Entity]:
INNER_THOUGHT: [internal reasoning/feelings]
DIALOGUE: [dialogue and physical actions]
${isTimeJump ? "\nNOTE: The user signaled a time jump. Provide transition prose in WORLD." : ""}
`;

    let responseText: string = await generateResponse({ systemPrompt, userMessage, model });

    // Arbiter Phase (Consistency Engine)
    const arbiterPrompt = `You are the Consistency Arbiter for a roleplaying game. 
Review the generated response against the canonical state.

Generated Response:
${responseText}

Task:
1. Identify any NEW significant physical truths established in the WORLD prose.
2. Check if any CHARACTER dialogue/actions contradict Established Observed Facts.
3. Detect meaningful persistent changes in relationships between canonical entities. Do NOT record fleeting emotions as relationship changes.
   Only output changes that represent a permanent shift in how two entities interact (e.g. going from neutral to TRUSTS, or gaining a new resentment).
   
Available Canonical Entities for Relationships:
${Array.from(allCandidates.values()).map(n => `[ID: ${n.id}] ${n.name}`).join('\n')}

4. Output strictly in JSON format:
{
  "new_observed_facts": ["fact1", "fact2"],
  "relationshipUpdates": [
    { 
      "sourceEntityId": "UUID", 
      "targetEntityId": "UUID", 
      "relationType": "TRUSTS", 
      "context": "Context explaining why this relationship formed/changed"
    }
  ],
  "character_evaluations": [
    {
      "name": "Character Name",
      "contradiction": boolean,
      "reason": "explanation of contradiction if any",
      "justifiable_as_lie": boolean,
      "justifiable_as_misremembered": boolean
    }
  ]
}`;
    
    let arbiterResult: any = { new_observed_facts: [], relationshipUpdates: [], character_evaluations: [] };
    try {
      const arbiterResponse = await generateResponse({ systemPrompt: arbiterPrompt, userMessage: "Run Arbiter", model });
      const jsonMatch = arbiterResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        arbiterResult = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn("Arbiter failed to parse", e);
    }

    if (arbiterResult.new_observed_facts && Array.isArray(arbiterResult.new_observed_facts)) {
      observedFacts = [...observedFacts, ...arbiterResult.new_observed_facts].slice(-20);
      state.observed_facts = observedFacts;
    }

    if (arbiterResult.relationshipUpdates && Array.isArray(arbiterResult.relationshipUpdates)) {
      // Application Validation
      for (const update of arbiterResult.relationshipUpdates) {
        if (!update.sourceEntityId || !update.targetEntityId || !update.relationType) continue;
        // Basic validation: ensure IDs look like UUIDs and are in the candidate set
        if (!allCandidates.has(update.sourceEntityId) && !allCandidates.has(update.targetEntityId)) continue;
        
        try {
          const existing = await db.select().from(relationships).where(
            sql`${relationships.sourceId} = ${update.sourceEntityId} AND ${relationships.targetId} = ${update.targetEntityId} AND ${relationships.relationType} = ${update.relationType}`
          );
          if (existing.length > 0) {
            await db.update(relationships).set({ context: update.context }).where(eq(relationships.id, existing[0].id));
          } else {
            await db.insert(relationships).values({
              id: randomUUID(),
              worldId: session.worldId,
              sourceId: update.sourceEntityId,
              targetId: update.targetEntityId,
              relationType: update.relationType,
              context: update.context
            });
          }
        } catch (e) {
          console.warn("Failed to apply relationship update", e);
        }
      }
    }

    const insertedMessages = [];
    let parts = responseText.split("---").map((p: string) => p.trim()).filter(Boolean);
    
    for (const part of parts) {
      if (part.startsWith("WORLD:")) {
        const content = part.replace(/^WORLD:\s*/i, "").trim();
        if (content) {
          const worldEmbedding = await generateEmbedding(content);
          const [wm] = await db.insert(messages).values({
            id: randomUUID(), sessionId, role: "world", content, embedding: worldEmbedding
          }).returning();
          insertedMessages.push(wm);
        }
      } else if (part.startsWith("CHARACTER")) {
        const charMatch = part.match(/^CHARACTER\s+(.*?):([\s\S]*)/i);
        if (charMatch) {
          const speakerName = charMatch[1].trim();
          const block = charMatch[2].trim();
          
          let innerThought = "";
          let dialogueContent = block;
          
          const thoughtMatch = block.match(/INNER_THOUGHT:\s*([\s\S]*?)(?:DIALOGUE:|$)/i);
          if (thoughtMatch) {
            innerThought = thoughtMatch[1].trim();
          }
          
          const dialogueMatch = block.match(/DIALOGUE:\s*([\s\S]*)/i);
          if (dialogueMatch) {
            dialogueContent = dialogueMatch[1].trim();
          }
          
          if (speakerName !== 'None' && dialogueContent) {
            let metadata: any = {};
            if (innerThought) {
              metadata.inner_thought = innerThought;
            }

            const npc = presentNpcs.find(n => n.name === speakerName);
            const npcTags = npc?.tags || [];
            
            // Apply Arbiter Judgement
            const evaluation = arbiterResult.character_evaluations?.find((e: any) => e.name === speakerName);
            if (evaluation && evaluation.contradiction) {
              if (evaluation.justifiable_as_lie && (npcTags.includes("deceptive") || npcTags.includes("secret_keeper"))) {
                metadata.flag = "lie";
              } else if (evaluation.justifiable_as_misremembered && (npcTags.includes("unreliable") || npcTags.includes("stressed"))) {
                metadata.flag = "misremembered";
              } else {
                // Hard contradiction, regenerate
                const guardPrompt = `${systemPrompt}\n\nCRITICAL ERROR: Your previous DIALOGUE response for ${speakerName} contained a hard contradiction: ${evaluation.reason}. Correct this. Output the same format (INNER_THOUGHT and DIALOGUE).`;
                const retryResponse = await generateResponse({ systemPrompt: guardPrompt, userMessage, model });
                const retryParts = retryResponse.split("---");
                const retryCharPart = retryParts.find((p: string) => p.includes(`CHARACTER ${speakerName}:`));
                if (retryCharPart) {
                  const rThoughtMatch = retryCharPart.match(/INNER_THOUGHT:\s*([\s\S]*?)(?:DIALOGUE:|$)/i);
                  if (rThoughtMatch) metadata.inner_thought = rThoughtMatch[1].trim();
                  
                  const rDialogueMatch = retryCharPart.match(/DIALOGUE:\s*([\s\S]*)/i);
                  if (rDialogueMatch) dialogueContent = rDialogueMatch[1].trim();
                }
              }
            }

            if (containsHijack(dialogueContent)) {
              dialogueContent = "*Reacts internally instead of generating user actions.* " + dialogueContent.replace(HIJACK_PATTERNS[0], "");
            }
            
            const charEmbedding = await generateEmbedding(dialogueContent);
            const [cm] = await db.insert(messages).values({
              id: randomUUID(), sessionId, role: "character", content: dialogueContent, speakerName, metadata, embedding: charEmbedding
            }).returning();
            insertedMessages.push(cm);
          }
        }
      }
    }

    await db.update(sessions).set({
      lastTurn: (session.lastTurn || 0) + 1,
      state: state
    }).where(eq(sessions.id, sessionId));

    return NextResponse.json({
      messages: insertedMessages,
      state
    });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message || "Failed to generate" }, { status: 500 });
  }
}
