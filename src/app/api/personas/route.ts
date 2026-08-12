import { NextResponse } from "next/server";
import { db } from "@/db";
import { personas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await db.select().from(personas).where(eq(personas.userId, user.id));
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description } = await request.json();
  if (!name || !description) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const id = randomUUID();
  const [newPersona] = await db.insert(personas).values({ id, userId: user.id, name, description }).returning();
  return NextResponse.json(newPersona);
}
