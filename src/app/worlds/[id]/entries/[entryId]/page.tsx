"use client";

import useSWR from "swr";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Activity } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function EntryDetailPage() {
  const params = useParams();
  const worldId = params.id as string;
  const entryId = params.entryId as string;
  const { data: entry, error } = useSWR(`/api/entries/${entryId}`, fetcher);

  if (!entry) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link href={`/worlds/${worldId}/entries`} className="text-sm text-gray-500 hover:underline mb-4 inline-block">&larr; Back to Entries</Link>
      
      <div className="bg-white border rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">{entry.name}</h1>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded-full uppercase">{entry.type}</span>
              {entry.tags?.map((tag: string) => (
                <span key={tag} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">#{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {entry.type === "relationship" && (
          <div className="my-6 p-4 bg-purple-50 border border-purple-100 rounded-lg">
            <h3 className="font-semibold text-purple-900 mb-3 flex items-center">
              <Activity className="w-4 h-4 mr-2" /> Relationship Dynamics
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-purple-800">Intimacy</span>
                  <span className="text-purple-600 font-bold">{entry.layers?.intimacy || 0}%</span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2.5">
                  <div className="bg-pink-500 h-2.5 rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, parseInt(entry.layers?.intimacy || 0)))}%` }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-purple-800">Tension</span>
                  <span className="text-purple-600 font-bold">{entry.layers?.tension || 0}%</span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2.5">
                  <div className="bg-red-500 h-2.5 rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, parseInt(entry.layers?.tension || 0)))}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6 mt-6">
          {Object.entries(entry.layers || {}).filter(([k]) => k !== 'intimacy' && k !== 'tension').map(([key, value]) => (
            <div key={key}>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">{key.replace('_', ' ')}</h3>
              <div className="bg-gray-50 p-4 rounded-lg text-gray-800 whitespace-pre-wrap leading-relaxed">
                {value as string}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
