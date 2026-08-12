import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
import { db } from "@/db";
import { messages } from "@/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");
    
    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }
    
    const sessionMessages = await db.select().from(messages).where(eq(messages.sessionId, sessionId)).orderBy(asc(messages.createdAt));
    return NextResponse.json(sessionMessages);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
