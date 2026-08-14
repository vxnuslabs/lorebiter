"use client";

import useSWR from "swr";
import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload } from "lucide-react";
import { LabelWithTooltip } from "@/components/ui/label-with-tooltip";

const fetcher = (url: string) => fetch(url).then(res => res.json());

const AI_PROMPT_TEXT = `You are an expert world builder. Create a rich fantasy world and output it EXACTLY in the following JSON format so I can import it into my game engine:

{
  "world": {
    "name": "The Ruined Kingdom",
    "themeHint": "Dark fantasy, grimdark",
    "narratorVoice": "Somber and highly descriptive"
  },
  "entries": [
    {
      "type": "character",
      "name": "Head Maid",
      "aliases": ["Old Servant"],
      "tags": ["maid", "mansion", "strict"],
      "layers": {
        "appearance": "Wears a faded uniform and walks with a limp.",
        "personality": "Strict and uncompromising.",
        "background": "She has served the family for 40 years.",
        "secrets": "She knows the secret of the old master's death."
      }
    },
    {
      "type": "relationship",
      "name": "Head Maid & The Master",
      "aliases": ["Master's relationship with Maid"],
      "tags": ["maid", "master", "relationship"],
      "layers": {
        "dynamics": "A strict professional relationship masking a history of mutual disdain.",
        "secret": "She knows he was stealing from the treasury.",
        "intimacy": "10",
        "tension": "85"
      }
    }
  ],
  "canonicalRelationships": [
    {
      "sourceName": "Head Maid",
      "targetName": "The Master",
      "relationType": "serves",
      "context": "Works in his mansion"
    }
  ]
}

RULES FOR ENTRIES:
1. "type" MUST be one of: "character", "location", "event", "fact", "relationship", "faction", "concept", "role".
2. The "layers" object keys depend on the "type":
   - character: "appearance", "personality", "background", "secrets"
   - location: "sight", "sound", "smell_atmosphere"
   - event: "before_state", "after_state", "details"
   - fact: "description", "hidden_truth" (Use this to define World Laws or mechanics)
   - relationship: "dynamics", "secret", "intimacy" (0-100 string), "tension" (0-100 string)
   - faction/concept/role: "description", "details"
3. Use the "canonicalRelationships" array to define direct graph links between entry names. Valid relationTypes: "is_parent_of", "works_for", "hates", "loves", "serves", etc.

LOREBITER ENGINE PHILOSOPHY (Keep this in mind):
- Lorebiter is a strict, memory-focused narrative RPG engine. 
- Do NOT include stats, HP, or dice roll mechanics. The game runs purely on narrative consistency and relationships.
- Entries are injected dynamically. Include an "aliases" array for every entry with alternative names (e.g. ["The Maid", "Martha"]).
- Layers like "secrets" and "hidden_truth" are strictly hidden from the player until discovered through gameplay. Make them juicy!
- "fact" entries act as immutable World Laws. The Consistency Arbiter will enforce them. 

Please generate a new original world with at least 5 characters, 3 locations, 2 factions, and 3 facts/laws.`;

export default function WorldsPage() {
  const { data: worlds, error, mutate } = useSWR("/api/worlds", fetcher);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [themeHint, setThemeHint] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pastedJson, setPastedJson] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleCopy = () => {
    navigator.clipboard.writeText(AI_PROMPT_TEXT);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    setIsCreating(true);
    const res = await fetch("/api/worlds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, themeHint }),
    });
    const newWorld = await res.json();
    mutate();
    setIsCreating(false);
    router.push(`/worlds/${newWorld.id}`);
  };

  const importJsonData = async (jsonData: any) => {
    setIsImporting(true);
    try {
      const res = await fetch("/api/worlds/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jsonData),
      });
      const data = await res.json();
      if (res.ok && data.worldId) {
        mutate();
        setIsPasteModalOpen(false);
        setPastedJson("");
        router.push(`/worlds/${data.worldId}`);
      } else {
        alert("Import failed: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to import world data.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      await importJsonData(jsonData);
    } catch (err) {
      console.error(err);
      alert("Failed to parse or upload file");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handlePasteImport = async () => {
    if (!pastedJson.trim()) return;
    try {
      const jsonData = JSON.parse(pastedJson);
      await importJsonData(jsonData);
    } catch (err) {
      console.error(err);
      alert("Failed to parse JSON. Please make sure you copied valid JSON.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 pt-16">
      <div className="flex flex-col items-center justify-center mb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-3">Lorebiter</h1>
        <p className="text-gray-500 text-lg max-w-lg">Your private, offline-first roleplaying engine. Select a world to begin or create a new one.</p>
      </div>

      <div className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">Worlds</h1>
          <p className="text-gray-500">Your collection of persistent roleplay environments.</p>
        </div>
        <div className="flex space-x-3">
          <Link 
            href="/personas"
            className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center shadow-sm"
          >
            My Personas
          </Link>
          <button 
            onClick={() => setIsCreating(!isCreating)}
            className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-all flex items-center shadow-sm hover:shadow active:scale-95"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create World
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {Array.isArray(worlds) ? (
          worlds.map((world: any) => (
            <Link key={world.id} href={`/worlds/${world.id}`}>
              <div className="group border border-gray-200 p-6 rounded-2xl hover:shadow-md hover:border-gray-300 transition-all cursor-pointer bg-white h-full flex flex-col">
                <h2 className="text-xl font-bold text-gray-900 group-hover:text-black">{world.name}</h2>
                {world.themeHint && <p className="text-gray-500 text-sm mt-2 font-medium">{world.themeHint}</p>}
              </div>
            </Link>
          ))
        ) : (
          <p className="text-red-500 col-span-full text-center py-8 bg-red-50 rounded-2xl border border-red-100">
            {worlds?.error || error?.message || "Loading worlds..."}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="border border-gray-200 p-8 rounded-2xl bg-white shadow-sm">
          <h2 className="text-xl font-bold mb-6">Create New World</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
              <LabelWithTooltip 
                label="World Name" 
                tooltip="A unique name for this persistent roleplay environment." 
              />
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="block w-full rounded-xl border-gray-300 shadow-sm border p-3 focus:ring-2 focus:ring-black focus:border-black transition-shadow"
                required 
              />
            </div>
            <div>
              <LabelWithTooltip 
                label="Theme Hint (Optional)" 
                tooltip="A brief description of the world's setting or tone (e.g. Victorian Gothic, Cyberpunk)." 
              />
              <input 
                type="text" 
                value={themeHint} 
                onChange={e => setThemeHint(e.target.value)} 
                className="block w-full rounded-xl border-gray-300 shadow-sm border p-3 focus:ring-2 focus:ring-black focus:border-black transition-shadow"
                placeholder="e.g. Victorian Gothic, Cyberpunk"
              />
            </div>
            <button 
              type="submit" 
              disabled={isCreating}
              className="flex items-center justify-center w-full bg-black text-white p-3 rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors mt-2"
            >
              {isCreating ? "Creating..." : <><Plus className="w-5 h-5 mr-2"/> Create World</>}
            </button>
          </form>
        </div>
        
        <div className="border border-gray-200 p-8 rounded-2xl bg-white shadow-sm flex flex-col justify-center">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-xl font-bold">Import World</h2>
            <button 
              onClick={() => setIsPromptModalOpen(true)}
              className="text-xs bg-purple-100 text-purple-700 font-bold px-2.5 py-1 rounded-full hover:bg-purple-200 transition-colors"
            >
              Generate with AI
            </button>
          </div>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">Have a backup or an AI-generated LorePack? Upload a world JSON file to import your lorebook instantly.</p>
          <input 
            type="file" 
            accept=".json" 
            ref={fileInputRef} 
            onChange={handleImport} 
            className="hidden" 
          />
          <div className="flex space-x-3 mt-auto">
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="flex-1 flex items-center justify-center bg-white border-2 border-gray-200 text-gray-800 p-3 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all"
            >
              {isImporting ? "Importing..." : <><Upload className="w-5 h-5 mr-2"/> Upload File</>}
            </button>
            <button 
              onClick={() => setIsPasteModalOpen(true)}
              disabled={isImporting}
              className="flex-1 flex items-center justify-center bg-gray-100 border border-gray-200 text-gray-800 p-3 rounded-xl font-medium hover:bg-gray-200 disabled:opacity-50 transition-all"
            >
              Paste JSON
            </button>
          </div>
        </div>
      </div>

      {isPromptModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Generate World with AI</h2>
            <p className="text-gray-600 mb-4">Copy the prompt below and paste it into ChatGPT, Claude, or Gemini to generate a complete world for Lorebiter.</p>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 relative mb-6">
              <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono">
                {AI_PROMPT_TEXT}
              </pre>
            </div>
            <div className="flex justify-end space-x-3">
              <button 
                onClick={handleCopy}
                className="bg-gray-100 text-gray-800 px-6 py-2 rounded-xl font-medium hover:bg-gray-200 transition-colors border border-gray-300"
              >
                {isCopied ? "Copied!" : "Copy Prompt"}
              </button>
              <button 
                onClick={() => setIsPromptModalOpen(false)}
                className="bg-black text-white px-6 py-2 rounded-xl font-medium hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isPasteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-xl">
            <h2 className="text-2xl font-bold mb-4">Paste JSON</h2>
            <p className="text-gray-600 mb-4">Paste the LorePack JSON generated by the AI below:</p>
            <textarea
              value={pastedJson}
              onChange={(e) => setPastedJson(e.target.value)}
              className="w-full h-64 p-4 border border-gray-300 rounded-xl font-mono text-sm mb-6 focus:ring-2 focus:ring-black focus:border-black"
              placeholder="{...}"
            />
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => setIsPasteModalOpen(false)}
                className="bg-gray-100 text-gray-800 px-6 py-2 rounded-xl font-medium hover:bg-gray-200 transition-colors border border-gray-300"
              >
                Cancel
              </button>
              <button 
                onClick={handlePasteImport}
                disabled={isImporting || !pastedJson.trim()}
                className="bg-black text-white px-6 py-2 rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isImporting ? "Importing..." : "Import World"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
