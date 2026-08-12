"use client";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import Link from "next/link";

const GraphComponent = dynamic(() => import("./GraphComponent"), { ssr: false });

export default function GraphPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Link href={`/worlds/${id}`} className="text-sm text-gray-500 hover:underline mb-4 inline-block">&larr; Back to World Hub</Link>
      <h1 className="text-3xl font-bold mb-2">Lore Graph</h1>
      <p className="text-gray-600 mb-6">Nodes represent entries. Edges represent implicit mentions in lore layers. Orphaned entries (amber) have no connections.</p>
      
      <GraphComponent worldId={id} />
    </div>
  );
}
