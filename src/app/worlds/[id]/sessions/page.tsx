"use client";

import useSWR from "swr";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus, MessageSquare, Trash2 } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SessionsPage() {
  const params = useParams();
  const worldId = params.id as string;
  const { data: sessions, error, mutate } = useSWR(`/api/sessions?worldId=${worldId}`, fetcher);
  const { data: entries } = useSWR(`/api/entries?worldId=${worldId}`, fetcher);

  const getEntryNames = (sessionState: any) => {
    if (!entries || !sessionState?.present_npcs) return "Loading...";
    const npcs = sessionState.present_npcs;
    const names = npcs.map((id: string) => {
      const entry = entries.find((e: any) => e.id === id);
      return entry ? entry.name : "Unknown";
    });
    return names.join(", ") || "No characters";
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this session?")) return;
    
    try {
      await fetch(`/api/sessions/${id}`, { method: 'DELETE' });
      mutate();
    } catch (error) {
      alert("Failed to delete session");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link href={`/worlds/${worldId}`} className="text-sm text-gray-500 hover:underline mb-4 inline-block">&larr; Back to Hub</Link>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sessions</h1>
        <Link href={`/worlds/${worldId}/sessions/new`} className="flex items-center bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800">
          <Plus className="w-4 h-4 mr-2" /> New Session
        </Link>
      </div>
      
      <div className="space-y-4">
        {sessions?.map((session: any) => (
          <Link key={session.id} href={`/sessions/${session.id}`}>
            <div className="border p-4 rounded-lg hover:shadow-lg transition-shadow cursor-pointer bg-white flex items-center justify-between">
              <div className="flex items-center">
                <MessageSquare className="w-6 h-6 text-gray-400 mr-4" />
                <div>
                  <h2 className="text-lg font-semibold">Scene with {getEntryNames(session.state)}</h2>
                  <p className="text-sm text-gray-500">Started: {new Date(session.startedAt * 1000).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {session.lastTurn || 0} turns
                </div>
                <button
                  onClick={(e) => handleDelete(e, session.id)}
                  className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                  title="Delete Session"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {sessions?.length === 0 && (
        <div className="text-center p-12 border border-dashed rounded-lg text-gray-500">
          No sessions yet. Start a conversation!
        </div>
      )}
    </div>
  );
}
