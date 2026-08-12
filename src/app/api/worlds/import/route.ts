import { NextResponse } from "next/server";
import { db } from "@/db";
import { worlds, entries, sessions, messages } from "@/db/schema";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    if (!data.world || !data.entries || !data.sessions || !data.messages) {
      return NextResponse.json({ error: "Invalid import format" }, { status: 400 });
    }

    const { world, entries: importEntries, sessions: importSessions, messages: importMessages } = data;

    // 1. Generate new World ID
    const newWorldId = crypto.randomUUID();
    
    // 2. ID Mapping maps old ID -> new ID
    const idMap: Record<string, string> = {
      [world.id]: newWorldId
    };

    // Insert World
    await db.insert(worlds).values({
      ...world,
      id: newWorldId,
      name: `${world.name} (Imported)`
    });

    // 3. Insert Entries with new IDs
    if (importEntries.length > 0) {
      const newEntries = importEntries.map((entry: any) => {
        const newEntryId = crypto.randomUUID();
        idMap[entry.id] = newEntryId;
        return {
          ...entry,
          id: newEntryId,
          worldId: newWorldId
        };
      });
      await db.insert(entries).values(newEntries);
    }

    // 4. Insert Sessions and their Messages
    if (importSessions.length > 0) {
      const newSessions = importSessions.map((session: any) => {
        const newSessionId = crypto.randomUUID();
        idMap[session.id] = newSessionId;
        return {
          ...session,
          id: newSessionId,
          worldId: newWorldId
        };
      });
      await db.insert(sessions).values(newSessions);
    }

    if (importMessages.length > 0) {
      const newMessages = importMessages.map((msg: any) => {
        const newMsgId = crypto.randomUUID();
        return {
          ...msg,
          id: newMsgId,
          sessionId: idMap[msg.sessionId] || msg.sessionId // Remap sessionId to the new one
        };
      });
      
      // Batch insert messages in chunks if there are many
      const chunkSize = 100;
      for (let i = 0; i < newMessages.length; i += chunkSize) {
        const chunk = newMessages.slice(i, i + chunkSize);
        await db.insert(messages).values(chunk);
      }
    }

    return NextResponse.json({ success: true, worldId: newWorldId }, { status: 200 });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Failed to import world" }, { status: 500 });
  }
}
