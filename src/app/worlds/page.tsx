"use client";

import useSWR from "swr";
import Link from "next/link";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Upload } from "lucide-react";
import { LabelWithTooltip } from "@/components/ui/label-with-tooltip";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function WorldsPage() {
  const { data: worlds, error, mutate } = useSWR("/api/worlds", fetcher);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [themeHint, setThemeHint] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      const res = await fetch("/api/worlds/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jsonData),
      });
      const data = await res.json();
      if (res.ok && data.worldId) {
        mutate();
        router.push(`/worlds/${data.worldId}`);
      } else {
        alert("Import failed: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to parse or upload file");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
          <h2 className="text-xl font-bold mb-2">Import World</h2>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">Have a backup? Upload a previously exported world JSON file to restore your entire lorebook and chat history instantly.</p>
        <input 
          type="file" 
          accept=".json" 
          ref={fileInputRef} 
          onChange={handleImport} 
          className="hidden" 
        />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center justify-center w-full bg-white border-2 border-gray-200 text-gray-800 p-3 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 transition-all mt-auto"
          >
            {isImporting ? "Importing..." : <><Upload className="w-5 h-5 mr-2"/> Upload JSON Backup</>}
          </button>
        </div>
      </div>
    </div>
  );
}
