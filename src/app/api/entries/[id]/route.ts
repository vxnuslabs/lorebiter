import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { db } from "@/db";
import { entries } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [entry] = await db.select().from(entries).where(eq(entries.id, id));
    if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(entry);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
