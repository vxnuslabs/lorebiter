import { NextResponse } from "next/server";
import { db } from "@/db";
import { relationships, entries } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request, context: any) {
  const params = await context.params;
  const worldId = params.id;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await db.select().from(relationships).where(eq(relationships.worldId, worldId));
  return NextResponse.json(items);
}

export async function POST(request: Request, context: any) {
  const params = await context.params;
  const worldId = params.id;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sourceId, targetId, relationType, context: relContext } = await request.json();
  if (!sourceId || !targetId || !relationType) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const id = randomUUID();
  const [newRel] = await db.insert(relationships).values({ 
    id, worldId, sourceId, targetId, relationType, context: relContext 
  }).returning();
  
  return NextResponse.json(newRel);
}
