"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { Plus, User, ArrowLeft } from "lucide-react";
import { LabelWithTooltip } from "@/components/ui/label-with-tooltip";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function PersonasPage() {
  const { data: personas, error, mutate } = useSWR("/api/personas", fetcher);
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [appearance, setAppearance] = useState("");
  const [personality, setPersonality] = useState("");
  const [background, setBackground] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || (!appearance && !personality && !background)) return;
    
    // Combine fields into the description for the DB
    const description = [
      appearance ? `[Appearance]\n${appearance}` : "",
      personality ? `[Personality]\n${personality}` : "",
      background ? `[Background]\n${background}` : ""
    ].filter(Boolean).join("\n\n");

    const res = await fetch("/api/personas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description })
    });
    if (res.ok) {
      setName("");
      setAppearance("");
      setPersonality("");
      setBackground("");
      setIsCreating(false);
      mutate();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 mt-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/worlds" className="text-gray-500 hover:text-black mb-2 inline-flex items-center text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Hub
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Personas</h1>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Persona
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="font-semibold text-lg mb-4">Create New Persona</h2>
          
          <div className="mb-6">
            <LabelWithTooltip 
              label="Name" 
              tooltip="The name of your persona. This is how you will be identified in sessions." 
            />
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="block w-full rounded-xl border border-gray-300 p-2 focus:ring-2 focus:ring-black focus:border-black transition-shadow"
              placeholder="e.g. Artemis"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <LabelWithTooltip 
                label="Appearance" 
                tooltip="Physical traits, clothing style, and distinguishing features." 
              />
              <textarea 
                value={appearance} 
                onChange={e => setAppearance(e.target.value)} 
                className="block w-full rounded-xl border border-gray-300 p-2 focus:ring-2 focus:ring-black focus:border-black transition-shadow min-h-[120px]"
                placeholder="e.g. Tall, wears a ragged cloak..."
              />
            </div>
            <div>
              <LabelWithTooltip 
                label="Personality" 
                tooltip="How your character acts, their flaws, and their demeanour." 
              />
              <textarea 
                value={personality} 
                onChange={e => setPersonality(e.target.value)} 
                className="block w-full rounded-xl border border-gray-300 p-2 focus:ring-2 focus:ring-black focus:border-black transition-shadow min-h-[120px]"
                placeholder="e.g. Cynical but fiercely loyal..."
              />
            </div>
            <div>
              <LabelWithTooltip 
                label="Background" 
                tooltip="Your character's history, origin, or goals." 
              />
              <textarea 
                value={background} 
                onChange={e => setBackground(e.target.value)} 
                className="block w-full rounded-xl border border-gray-300 p-2 focus:ring-2 focus:ring-black focus:border-black transition-shadow min-h-[120px]"
                placeholder="e.g. Exiled from the inner city..."
              />
            </div>
          </div>

          <div className="flex space-x-3 max-w-xs">
            <button 
              type="submit" 
              className="flex-1 bg-black text-white p-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Create
            </button>
            <button 
              type="button"
              onClick={() => setIsCreating(false)}
              className="flex-1 bg-gray-100 text-gray-700 p-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {personas?.map((persona: any) => (
          <div key={persona.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-black group-hover:text-white transition-colors">
                <User className="w-5 h-5" />
              </div>
              <h2 className="font-semibold text-lg text-gray-900 truncate">{persona.name}</h2>
            </div>
            <p className="text-sm text-gray-600 line-clamp-3">{persona.description}</p>
          </div>
        ))}
        {personas?.length === 0 && !isCreating && (
          <div className="col-span-full text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-300">
            <User className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">You haven't created any Personas yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
