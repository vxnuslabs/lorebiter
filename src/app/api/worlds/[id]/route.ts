import { NextResponse } from "next/server";
import { db } from "@/db";
import { worlds, entries, sessions, messages, relationships } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing world ID" }, { status: 400 });
  }

  try {
    // 1. Get all sessions for this world
    const worldSessions = await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.worldId, id));
    const sessionIds = worldSessions.map(s => s.id);

    // 2. Delete all messages for these sessions
    if (sessionIds.length > 0) {
      await db.delete(messages).where(inArray(messages.sessionId, sessionIds));
    }

    // 3. Delete all sessions for this world
    await db.delete(sessions).where(eq(sessions.worldId, id));

    // 4. Delete relationships explicitly to avoid FK issues
    await db.delete(relationships).where(eq(relationships.worldId, id));

    // 5. Delete all entries for this world
    await db.delete(entries).where(eq(entries.worldId, id));

    // 6. Finally, delete the world itself
    await db.delete(worlds).where(eq(worlds.id, id));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Delete world error:", error);
    return NextResponse.json({ error: "Failed to delete world" }, { status: 500 });
  }
}
