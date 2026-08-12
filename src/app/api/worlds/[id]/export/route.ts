import { NextResponse } from "next/server";
import { db } from "@/db";
import { worlds, entries, sessions, messages } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  if (!id) {
    return NextResponse.json({ error: "Missing world ID" }, { status: 400 });
  }

  try {
    const worldData = await db.select().from(worlds).where(eq(worlds.id, id));
    
    if (worldData.length === 0) {
      return NextResponse.json({ error: "World not found" }, { status: 404 });
    }

    const world = worldData[0];
    const worldEntries = await db.select().from(entries).where(eq(entries.worldId, id));
    const worldSessions = await db.select().from(sessions).where(eq(sessions.worldId, id));
    
    // Get all messages for all sessions in this world
    const sessionIds = worldSessions.map(s => s.id);
    let allMessages: any[] = [];
    
    if (sessionIds.length > 0) {
      // In a real app we'd batch this or use in operator, but doing it simply
      for (const sId of sessionIds) {
        const sessionMessages = await db.select().from(messages).where(eq(messages.sessionId, sId));
        allMessages = [...allMessages, ...sessionMessages];
      }
    }

    const exportData = {
      world,
      entries: worldEntries,
      sessions: worldSessions,
      messages: allMessages,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="lorebiter-world-${id}.json"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export world" }, { status: 500 });
  }
}
