"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Activity, Edit2, Check, X, Trash2 } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function EntryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const worldId = params.id as string;
  const entryId = params.entryId as string;
  const { data: entry, error, mutate } = useSWR(`/api/entries/${entryId}`, fetcher);

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [editTags, setEditTags] = useState("");
  const [editLayers, setEditLayers] = useState("");

  useEffect(() => {
    if (entry && !isEditing) {
      setEditName(entry.name || "");
      setEditType(entry.type || "character");
      setEditTags(Array.isArray(entry.tags) ? entry.tags.join(", ") : "");
      setEditLayers(JSON.stringify(entry.layers || {}, null, 2));
    }
  }, [entry, isEditing]);

  const handleUpdate = async () => {
    try {
      let parsedLayers = {};
      try {
        parsedLayers = JSON.parse(editLayers);
      } catch (e) {
        alert("Invalid JSON in layers");
        return;
      }

      const res = await fetch(`/api/entries/${entryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          type: editType,
          tags: editTags.split(",").map(t => t.trim()).filter(Boolean),
          layers: parsedLayers
        })
      });

      if (res.ok) {
        setIsEditing(false);
        mutate();
      } else {
        alert("Failed to update entry");
      }
    } catch (e) {
      alert("Error updating entry");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    try {
      const res = await fetch(`/api/entries/${entryId}`, { method: "DELETE" });
      if (res.ok) {
        router.push(`/worlds/${worldId}/entries`);
      } else {
        alert("Failed to delete entry");
      }
    } catch (e) {
      alert("Error deleting entry");
    }
  };

  if (error || (entry && entry.error)) return <div className="p-8 text-center text-red-500">Error: {entry?.error || "Failed to load"}</div>;
  if (!entry) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <Link href={`/worlds/${worldId}/entries`} className="text-sm text-gray-500 hover:underline">&larr; Back to Entries</Link>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <button onClick={handleUpdate} className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded hover:bg-green-100 text-sm font-medium">
                <Check className="w-4 h-4 mr-1" /> Save
              </button>
              <button onClick={() => setIsEditing(false)} className="flex items-center text-gray-600 bg-gray-100 px-3 py-1 rounded hover:bg-gray-200 text-sm font-medium">
                <X className="w-4 h-4 mr-1" /> Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)} className="flex items-center text-blue-600 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100 text-sm font-medium">
                <Edit2 className="w-4 h-4 mr-1" /> Edit
              </button>
              <button onClick={handleDelete} className="flex items-center text-red-600 bg-red-50 px-3 py-1 rounded hover:bg-red-100 text-sm font-medium">
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="bg-white border rounded-xl shadow-sm p-6 mb-6">
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full border rounded-lg p-2" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select value={editType} onChange={e => setEditType(e.target.value)} className="w-full border rounded-lg p-2">
                  <option value="character">Character</option>
                  <option value="event">Event</option>
                  <option value="location">Location</option>
                  <option value="fact">Fact</option>
                  <option value="relationship">Relationship</option>
                  <option value="role">Role</option>
                  <option value="faction">Faction</option>
                  <option value="concept">Concept</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                <input type="text" value={editTags} onChange={e => setEditTags(e.target.value)} className="w-full border rounded-lg p-2" placeholder="e.g. hero, magic" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Layers (JSON format)</label>
              <textarea value={editLayers} onChange={e => setEditLayers(e.target.value)} className="w-full border rounded-lg p-2 font-mono text-sm" rows={8} />
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-1">{entry.name}</h1>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded-full uppercase">{entry.type}</span>
                  {(Array.isArray(entry.tags) ? entry.tags : []).map((tag: string) => (
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
                  <div className="bg-gray-50 p-4 rounded-lg text-gray-800 whitespace-pre-wrap leading-relaxed font-mono text-sm">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
