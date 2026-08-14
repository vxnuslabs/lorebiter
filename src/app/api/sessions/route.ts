import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const worldId = searchParams.get("worldId");
    
    if (!worldId) {
      return NextResponse.json({ error: "Missing worldId" }, { status: 400 });
    }
    
    const worldSessions = await db.select().from(sessions).where(eq(sessions.worldId, worldId)).orderBy(desc(sessions.startedAt));
    return NextResponse.json(worldSessions);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { worldId, presentNpcs, personaId, boundEntityId, model } = await request.json();
    const id = randomUUID();
    const [newSession] = await db
      .insert(sessions)
      .values({ 
        id, 
        worldId,
        personaId,
        boundEntityId,
        state: { 
          mode: "narrative",
          present_npcs: presentNpcs || [], 
          model: model || "x-ai/grok-4.5",
          active_speakers: [],
          revealed_lore: [], 
          flags: {},
          turns_since_direct_address: 0
        } 
      })
      .returning();
    return NextResponse.json(newSession);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}
