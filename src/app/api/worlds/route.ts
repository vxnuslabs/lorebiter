import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { db } from "@/db";
import { worlds } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    const allWorlds = await db.select().from(worlds).orderBy(desc(worlds.createdAt));
    return NextResponse.json(allWorlds);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch worlds" }, { status: 500 });
  }
}

import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { name, themeHint } = await request.json();
    const id = randomUUID();
    const [newWorld] = await db
      .insert(worlds)
      .values({ id, name, themeHint, ownerId: user.id })
      .returning();
    return NextResponse.json(newWorld);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create world" }, { status: 500 });
  }
}
