"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { Play, Info } from "lucide-react";
import { LabelWithTooltip } from "@/components/ui/label-with-tooltip";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function NewSessionPage() {
  const params = useParams();
  const worldId = params.id as string;
  const router = useRouter();
  const { data: entries, error } = useSWR(`/api/entries?worldId=${worldId}`, fetcher);
  const { data: personas } = useSWR(`/api/personas`, fetcher);
  const { data: openRouterModels } = useSWR(`/api/models`, fetcher);
  
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([]);
  const [personaId, setPersonaId] = useState("");
  const [boundEntityId, setBoundEntityId] = useState("");
  const [model, setModel] = useState("x-ai/grok-4.5");
  const [isStarting, setIsStarting] = useState(false);

  const toggleEntry = (id: string) => {
    setSelectedEntryIds(prev => 
      prev.includes(id) ? prev.filter(eId => eId !== id) : [...prev, id]
    );
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEntryIds.length === 0) return;
    setIsStarting(true);
    
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ worldId, presentNpcs: selectedEntryIds, personaId, boundEntityId, model })
    });
    
    const newSession = await res.json();
    router.push(`/sessions/${newSession.id}`);
  };

  const playableEntries = entries?.filter((e: any) => e.type === "character" || e.type === "role");

  return (
    <div className="max-w-md mx-auto p-6 mt-12 border rounded-lg shadow-sm bg-white">
      <Link href={`/worlds/${worldId}/sessions`} className="text-sm text-gray-500 hover:underline mb-4 inline-block">&larr; Back</Link>
      
      <h1 className="text-2xl font-bold mb-6">Start New Session</h1>
      
      {playableEntries?.length === 0 ? (
        <div className="text-center p-6 border border-dashed rounded bg-gray-50">
          <p className="text-gray-500 mb-4">You need to create a character first.</p>
          <Link href={`/worlds/${worldId}/entries/new`} className="text-blue-600 hover:underline">
            Create Character
          </Link>
        </div>
      ) : (
        <form onSubmit={handleStart} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <LabelWithTooltip 
                label="Select Your Persona" 
                tooltip="The user persona you will play as." 
              />
              <select 
                value={personaId} 
                onChange={e => setPersonaId(e.target.value)} 
                className="w-full rounded-md border-gray-300 p-2 border focus:ring-black focus:border-black"
                required
              >
                <option value="">-- Choose Persona --</option>
                {personas?.map((p: any) => (
                  <option key={p.id} value={p.id} title={p.description}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <LabelWithTooltip 
                label="Bind to World Role" 
                tooltip="Which entity in this world are you playing? This tells the AI who you are inside the lore." 
              />
              <select 
                value={boundEntityId} 
                onChange={e => setBoundEntityId(e.target.value)} 
                className="w-full rounded-md border-gray-300 p-2 border focus:ring-black focus:border-black"
                required
              >
                <option value="">-- Choose Role / Entity --</option>
                {playableEntries?.map((e: any) => {
                  const desc = e.layers?.appearance || e.layers?.public || e.layers?.description || "No description available.";
                  return <option key={e.id} value={e.id} title={desc}>{e.name} ({e.type})</option>;
                })}
              </select>
            </div>
          </div>
          
          <div>
            <LabelWithTooltip 
              label="Select AI Model" 
              tooltip="The LLM that will orchestrate the game engine. Fetched live from OpenRouter." 
            />
            <input 
              list="openrouter-models"
              value={model} 
              onChange={e => setModel(e.target.value)} 
              className="w-full rounded-md border-gray-300 p-2 border focus:ring-black focus:border-black"
              placeholder="Search or select a model (e.g. x-ai/grok-4.5)"
            />
            <datalist id="openrouter-models">
              <option value="x-ai/grok-4.5">x-ai/grok-4.5 (Default)</option>
              {openRouterModels?.data?.map((m: any) => (
                <option key={m.id} value={m.id}>{m.name || m.id}</option>
              ))}
            </datalist>
          </div>

          <div>
            <LabelWithTooltip 
              label="Select Present Characters" 
              tooltip="Who is participating in this scene? The AI will load their full lore." 
            />
            <div className="space-y-2 border rounded-md p-3 max-h-60 overflow-y-auto mt-1 relative">
              {playableEntries?.map((entry: any) => {
                const desc = entry.layers?.appearance || entry.layers?.public || entry.layers?.description || entry.layers?.details || "No description provided.";
                
                return (
                <label key={entry.id} title={desc} className="flex items-center space-x-3 group relative cursor-pointer hover:bg-gray-50 p-1 rounded transition-colors">
                  <input 
                    type="checkbox" 
                    checked={selectedEntryIds.includes(entry.id)}
                    onChange={() => toggleEntry(entry.id)}
                    className="rounded border-gray-300 text-black focus:ring-black"
                  />
                  <span className="flex items-center flex-1">
                    {entry.name}
                    <Info className="w-3.5 h-3.5 text-gray-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </label>
              )})}
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={isStarting || selectedEntryIds.length === 0}
            className="w-full flex items-center justify-center bg-black text-white p-3 rounded-md hover:bg-gray-800 disabled:opacity-50"
          >
            {isStarting ? "Starting..." : <><Play className="w-4 h-4 mr-2"/> Begin Session</>}
          </button>
        </form>
      )}
    </div>
  );
}
