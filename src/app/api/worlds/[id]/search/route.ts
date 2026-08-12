import { NextResponse } from "next/server";
import { db } from "@/db";
import { messages, sessions } from "@/db/schema";
import { eq, inArray, cosineDistance } from "drizzle-orm";
import { generateEmbedding } from "@/lib/embeddings";

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ error: "Missing search query" }, { status: 400 });
    }

    const worldSessions = await db.select({ id: sessions.id }).from(sessions).where(eq(sessions.worldId, id));
    const sessionIds = worldSessions.map(s => s.id);

    if (sessionIds.length === 0) {
      return NextResponse.json([]); // No sessions in this world yet
    }

    const queryEmbedding = await generateEmbedding(query);

    const relevantMessages = await db.select({
      id: messages.id,
      sessionId: messages.sessionId,
      role: messages.role,
      content: messages.content,
      speakerName: messages.speakerName,
      createdAt: messages.createdAt,
      distance: cosineDistance(messages.embedding, queryEmbedding)
    })
    .from(messages)
    .where(inArray(messages.sessionId, sessionIds))
    .orderBy(cosineDistance(messages.embedding, queryEmbedding))
    .limit(10);

    return NextResponse.json(relevantMessages);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Failed to search messages" }, { status: 500 });
  }
}
