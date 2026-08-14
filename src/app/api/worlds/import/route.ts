import { NextResponse } from "next/server";
export const dynamic = 'force-dynamic';
import { db } from "@/db";
import { worlds, entries, relationships } from "@/db/schema";
import crypto from "crypto";
import { generateEmbedding } from "@/lib/embeddings";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    if (!data.world || !data.world.name) {
      return NextResponse.json({ error: "Invalid LorePack format: Missing world data" }, { status: 400 });
    }

    const worldId = crypto.randomUUID();
    
    // Insert world
    await db.insert(worlds).values({
      id: worldId,
      name: data.world.name,
      themeHint: data.world.themeHint || "",
      narratorVoice: data.world.narratorVoice || ""
    });

    const nameToEntryId: Record<string, string> = {};

    // Import entries
    if (data.entries && Array.isArray(data.entries)) {
      for (const entry of data.entries) {
        if (!entry.name || !entry.type) continue;

        const entryId = crypto.randomUUID();
        nameToEntryId[entry.name] = entryId;
        
        // Prepare text for embedding
        const combinedText = [
          entry.name,
          ...(entry.tags || []),
          entry.layers?.public || "",
          entry.layers?.personal || "",
          entry.layers?.observable || ""
        ].join(" ");

        const embedding = await generateEmbedding(combinedText);

        await db.insert(entries).values({
          id: entryId,
          worldId,
          type: entry.type,
          name: entry.name,
          aliases: entry.aliases || [],
          tags: entry.tags || [],
          layers: entry.layers || {},
          triggers: entry.triggers || {},
          autoInject: true,
          embedding
        });
      }
    }

    // Import canonical relationships (graph links)
    if (data.canonicalRelationships && Array.isArray(data.canonicalRelationships)) {
      for (const rel of data.canonicalRelationships) {
        const sourceId = nameToEntryId[rel.sourceName];
        const targetId = nameToEntryId[rel.targetName];
        if (sourceId && targetId && rel.relationType) {
          await db.insert(relationships).values({
            id: crypto.randomUUID(),
            worldId,
            sourceId,
            targetId,
            relationType: rel.relationType,
            context: rel.context || ""
          });
        }
      }
    }

    return NextResponse.json({ success: true, worldId }, { status: 200 });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Failed to import world" }, { status: 500 });
  }
}
