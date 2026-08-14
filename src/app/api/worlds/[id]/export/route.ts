import { NextResponse } from "next/server";
import { db } from "@/db";
import { worlds, entries, relationships } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  if (!id) {
    return NextResponse.json({ error: "Missing world ID" }, { status: 400 });
  }

  try {
    const worldData = await db.select().from(worlds).where(eq(worlds.id, id));
    
    if (worldData.length === 0) {
      return NextResponse.json({ error: "World not found" }, { status: 404 });
    }

    const world = worldData[0];
    const worldEntries = await db.select().from(entries).where(eq(entries.worldId, id));
    const worldRelationships = await db.select().from(relationships).where(eq(relationships.worldId, id));

    const entryIdToName = Object.fromEntries(worldEntries.map(e => [e.id, e.name]));

    const exportData = {
      world: {
        name: world.name,
        themeHint: world.themeHint,
        narratorVoice: world.narratorVoice
      },
      entries: worldEntries.map(e => ({
        type: e.type,
        name: e.name,
        aliases: e.aliases,
        tags: e.tags,
        layers: e.layers
      })),
      canonicalRelationships: worldRelationships.map(r => ({
        sourceName: entryIdToName[r.sourceId],
        targetName: entryIdToName[r.targetId],
        relationType: r.relationType,
        context: r.context
      })).filter(r => r.sourceName && r.targetName)
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="lorepack-${world.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export world" }, { status: 500 });
  }
}
