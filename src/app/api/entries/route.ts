import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { db } from "@/db";
import { entries } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import { generateEmbedding } from "@/lib/embeddings";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const worldId = searchParams.get("worldId");
    
    if (!worldId) {
      return NextResponse.json({ error: "Missing worldId" }, { status: 400 });
    }
    
    const worldEntries = await db.select().from(entries).where(eq(entries.worldId, worldId)).orderBy(desc(entries.createdAt));
    return NextResponse.json(worldEntries);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const id = randomUUID();
    
    const combinedText = [
      data.name,
      ...(data.tags || []),
      data.layers?.public || "",
      data.layers?.personal || "",
      data.layers?.observable || ""
    ].join(" ");
    
    const embedding = await generateEmbedding(combinedText);

    const [newEntry] = await db
      .insert(entries)
      .values({ ...data, id, embedding })
      .returning();
    return NextResponse.json(newEntry);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }
}
