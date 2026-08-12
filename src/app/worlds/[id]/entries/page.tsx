"use client";

import useSWR from "swr";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus, Wand2 } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function EntriesPage() {
  const params = useParams();
  const worldId = params.id as string;
  const { data: entries, error } = useSWR(`/api/entries?worldId=${worldId}`, fetcher);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link href={`/worlds/${worldId}`} className="text-sm text-gray-500 hover:underline mb-4 inline-block">&larr; Back to Hub</Link>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Lore Entries</h1>
        <div className="flex space-x-2">
          <Link href={`/worlds/${worldId}/entries/quick`} className="flex items-center bg-gray-100 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-200">
            <Wand2 className="w-4 h-4 mr-2" /> Quick Draft
          </Link>
          <Link href={`/worlds/${worldId}/entries/new`} className="flex items-center bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800">
            <Plus className="w-4 h-4 mr-2" /> New Entry
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries?.map((entry: any) => (
          <Link key={entry.id} href={`/worlds/${worldId}/entries/${entry.id}`}>
            <div className="border p-4 rounded-lg hover:shadow-lg transition-shadow cursor-pointer bg-white">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold">{entry.name}</h2>
                <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded-full uppercase">{entry.type}</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {entry.tags?.map((tag: string) => (
                  <span key={tag} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">#{tag}</span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {entries?.length === 0 && (
        <div className="text-center p-12 border border-dashed rounded-lg text-gray-500">
          No entries yet. Create your first entry!
        </div>
      )}
    </div>
  );
}
