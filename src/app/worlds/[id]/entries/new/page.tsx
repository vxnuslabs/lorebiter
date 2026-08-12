"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, Save } from "lucide-react";
import { LabelWithTooltip } from "@/components/ui/label-with-tooltip";

const TEMPLATES: Record<string, string[]> = {
  character: ["appearance", "personality", "background", "secrets"],
  location: ["sight", "sound", "smell_atmosphere"],
  event: ["before_state", "after_state", "details"],
  fact: ["description", "hidden_truth"],
  relationship: ["dynamics", "secret"]
};

export default function NewEntryPage() {
  const params = useParams();
  const worldId = params.id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const isDraft = searchParams.get("draft") === "true";
  
  const [type, setType] = useState("character");
  const [name, setName] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [layers, setLayers] = useState<Record<string, string>>({});
  const [triggers, setTriggers] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [polishing, setPolishing] = useState<string | null>(null);

  useEffect(() => {
    if (isDraft) {
      const draftData = sessionStorage.getItem("lorebiter_quick_draft");
      if (draftData) {
        try {
          const parsed = JSON.parse(draftData);
          if (parsed.type) setType(parsed.type);
          if (parsed.name) setName(parsed.name);
          if (parsed.tags) setTagsInput(parsed.tags.join(", "));
          if (parsed.layers) setLayers(parsed.layers);
          
          // Set triggers for the active layers
          const newTriggers: Record<string, string> = {};
          (TEMPLATES[parsed.type] || []).forEach(layer => {
            newTriggers[`reveal_${layer}`] = "always";
          });
          setTriggers(newTriggers);
          
          sessionStorage.removeItem("lorebiter_quick_draft");
        } catch (e) {
          console.error("Failed to parse draft data");
        }
      }
    } else {
      // Default init
      const newTriggers: Record<string, string> = {};
      (TEMPLATES["character"] || []).forEach(layer => {
        newTriggers[`reveal_${layer}`] = "always";
      });
      setTriggers(newTriggers);
    }
  }, [isDraft]);

  const activeLayers = TEMPLATES[type] || [];

  const handleTypeChange = (newType: string) => {
    setType(newType);
    setLayers({});
    const newTriggers: Record<string, string> = {};
    (TEMPLATES[newType] || []).forEach(layer => {
      newTriggers[`reveal_${layer}`] = "always";
    });
    setTriggers(newTriggers);
  };

  const handleSave = async () => {
    if (!name) return;
    setIsSaving(true);
    
    const tags = tagsInput.split(",").map(t => t.trim()).filter(Boolean);
    
    await fetch("/api/entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        worldId,
        name,
        type,
        tags,
        layers,
        triggers,
        autoInject: true
      })
    });
    
    router.push(`/worlds/${worldId}/entries`);
    router.refresh();
  };

  const handlePolish = async (layerKey: string) => {
    const text = layers[layerKey];
    if (!text) return;
    
    setPolishing(layerKey);
    try {
      const res = await fetch("/api/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: text, tone: "neutral" })
      });
      const data = await res.json();
      if (data.polishedText) {
        setLayers(prev => ({ ...prev, [layerKey]: data.polishedText }));
      }
    } catch (e) {
      console.error(e);
    }
    setPolishing(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link href={`/worlds/${worldId}/entries`} className="text-sm text-gray-500 hover:underline mb-4 inline-block">&larr; Back to Entries</Link>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">New Lore Entry</h1>
        <button 
          onClick={handleSave} 
          disabled={isSaving || !name}
          className="flex items-center bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50"
        >
          <Save className="w-4 h-4 mr-2" /> {isSaving ? "Saving..." : "Save Entry"}
        </button>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white p-6 border rounded-lg shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <LabelWithTooltip 
                label="Entry Name *" 
                tooltip="The main identifier for this lore entry (e.g. 'King Arthur', 'The Citadel')." 
              />
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                className="w-full border rounded-md p-2"
                placeholder="e.g. Head Maid"
                required 
              />
            </div>
            <div>
              <LabelWithTooltip 
                label="Entry Type" 
                tooltip="Categorize this entry to load the appropriate lore structure templates." 
              />
              <select 
                value={type} 
                onChange={e => handleTypeChange(e.target.value)}
                className="w-full border rounded-md p-2 bg-white"
              >
                {Object.keys(TEMPLATES).map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4">
            <LabelWithTooltip 
              label="Tags (comma separated)" 
              tooltip="Keywords used to link and quickly filter entries (e.g. 'magic, royalty')." 
            />
            <input 
              type="text" 
              value={tagsInput} 
              onChange={e => setTagsInput(e.target.value)} 
              className="w-full border rounded-md p-2"
              placeholder="e.g. staff, secretly_rebellious"
            />
          </div>
        </div>

        {activeLayers.map((layer) => (
          <div key={layer} className="bg-white p-6 border rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <LabelWithTooltip 
                label={`${layer.replace('_', ' ')} Layer`} 
                tooltip={`The specific data layer containing ${layer.replace('_', ' ')} information.`}
                className="capitalize"
              />
              <div className="flex space-x-2 items-center">
                <select 
                  value={triggers[`reveal_${layer}`] || "always"}
                  onChange={e => setTriggers(prev => ({ ...prev, [`reveal_${layer}`]: e.target.value }))}
                  className="text-xs border rounded p-1"
                >
                  <option value="always">Reveal: Always</option>
                  <option value="manual">Reveal: Manual</option>
                </select>
                <button 
                  onClick={() => handlePolish(layer)}
                  disabled={polishing === layer || !layers[layer]}
                  className="text-xs flex items-center bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 disabled:opacity-50"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {polishing === layer ? "Polishing..." : "AI Polish"}
                </button>
              </div>
            </div>
            <textarea 
              value={layers[layer] || ""}
              onChange={e => setLayers(prev => ({ ...prev, [layer]: e.target.value }))}
              className="w-full border rounded-md p-2 h-32"
              placeholder={`Enter ${layer.replace('_', ' ')} details here...`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
