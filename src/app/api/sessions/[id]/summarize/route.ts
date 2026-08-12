import { NextResponse } from "next/server";
import { db } from "@/db";
import { sessions, messages, entries, worlds } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { generateResponse } from "@/lib/openrouter";

export const dynamic = 'force-dynamic';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const sessionId = id;
    
    // 1. Fetch Session and World
    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId));
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    
    const [world] = await db.select().from(worlds).where(eq(worlds.id, session.worldId));

    // 2. Fetch all messages in chronological order
    const sessionMessages = await db.select().from(messages).where(eq(messages.sessionId, sessionId)).orderBy(messages.createdAt);
    
    if (sessionMessages.length === 0) {
      return NextResponse.json({ success: true, count: 0 }); // Nothing to summarize
    }

    const transcript = sessionMessages.map(m => {
      if (m.role === "world") return `WORLD: ${m.content}`;
      if (m.role === "character") return `${m.speakerName}: ${m.content}`;
      return `USER: ${m.content}`;
    }).join("\n\n");

    // 3. Prompt LLM for Summarization
    const systemPrompt = `You are the Lore Archivist for a roleplaying game world called "${world.name}".
Your job is to read the following session transcript and extract the 1 to 3 most important narrative developments into new Lore Entries.

Rules:
1. Only extract significant events, hidden truths revealed, or major status changes. Ignore trivial conversation.
2. Types can ONLY be "event" or "fact".
3. For "event", the layers must be "before_state", "after_state", "details".
4. For "fact", the layers must be "description", "hidden_truth".
5. Output ONLY valid JSON containing an array of entries.

Format:
{
  "entries": [
    {
      "name": "Short Descriptive Title",
      "type": "event",
      "tags": ["summary", "session_event"],
      "layers": {
        "before_state": "...",
        "after_state": "...",
        "details": "..."
      }
    }
  ]
}

Transcript:
${transcript}`;

    const responseText = await generateResponse({ systemPrompt, userMessage: "Summarize this session.", model: "cognitivecomputations/dolphin-mistral-24b-venice-edition" });
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse JSON from AI response.");
    }
    
    const data = JSON.parse(jsonMatch[0]);
    const newEntries = data.entries || [];
    let count = 0;

    // 4. Insert New Entries
    for (const entry of newEntries) {
      if (entry.type === "event" || entry.type === "fact") {
        await db.insert(entries).values({
          id: randomUUID(),
          worldId: session.worldId,
          type: entry.type,
          name: entry.name,
          tags: entry.tags || [],
          layers: entry.layers || {},
          triggers: { reveal_all: "always" }, // Simplified triggers for auto-generated
          autoInject: true
        });
        count++;
      }
    }

    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    console.error("Summarization error:", error);
    return NextResponse.json({ error: error.message || "Failed to summarize" }, { status: 500 });
  }
}
