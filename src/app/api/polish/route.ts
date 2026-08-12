import { NextResponse } from "next/server";
import { generateResponse } from "@/lib/openrouter";

export async function POST(request: Request) {
  try {
    const { rawText, tone } = await request.json();

    const systemPrompt = `You are an AI editor for a roleplaying game. 
Your task is to polish the user's input text to have correct grammar and flow, while preserving the exact meaning and perspective.
Tone constraint: ${tone || "neutral"}.
Output ONLY the polished text. Do not add any introductory or concluding remarks.`;

    const polishedText = await generateResponse({
      systemPrompt,
      userMessage: rawText,
    });

    return NextResponse.json({ polishedText });
  } catch (error) {
    return NextResponse.json({ error: "Failed to polish text" }, { status: 500 });
  }
}
