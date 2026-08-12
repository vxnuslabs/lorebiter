import { NextResponse } from "next/server";
import { generateResponse } from "@/lib/openrouter";

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { rawText } = await request.json();
    if (!rawText) return NextResponse.json({ error: "Missing text" }, { status: 400 });

    const systemPrompt = `You are the Lore Master's AI Assistant. 
The user will provide a raw dump of text describing a new lore element.
Your task is to parse it, infer the best entry type (character, event, location, fact, or relationship), 
and split the information into the appropriate structural layers.

Templates:
- character: ["public", "personal", "observable"]
- location: ["sight", "sound", "smell_atmosphere"]
- event: ["before_state", "after_state", "details"]
- fact: ["description", "hidden_truth"]
- relationship: ["dynamics", "secret"]

Extract the character name/title, infer the type, generate 2-4 tags, and populate the correct layers.
Output EXACTLY valid JSON format matching this schema:
{
  "name": "...",
  "type": "...",
  "tags": ["...", "..."],
  "layers": {
    "layer_key_1": "...",
    "layer_key_2": "..."
  }
}
`;

    const responseText = await generateResponse({ systemPrompt, userMessage: rawText, model: "x-ai/grok-4.5" });
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse JSON from AI response.");
    }

    const data = JSON.parse(jsonMatch[0]);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Parse error:", error);
    return NextResponse.json({ error: error.message || "Failed to parse" }, { status: 500 });
  }
}
