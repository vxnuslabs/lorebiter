"use client";

import { useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus, Link as LinkIcon, Edit2, Trash2, Check, X } from "lucide-react";
import { LabelWithTooltip } from "@/components/ui/label-with-tooltip";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function RelationshipsPage() {
  const params = useParams();
  const worldId = params.id as string;
  const { data: relationships, mutate } = useSWR(`/api/worlds/${worldId}/relationships`, fetcher);
  const { data: entries } = useSWR(`/api/entries?worldId=${worldId}`, fetcher);
  
  const [isCreating, setIsCreating] = useState(false);
  const [sourceId, setSourceId] = useState("");
  const [targetId, setTargetId] = useState("");
  const [relationType, setRelationType] = useState("");
  const [context, setContext] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRelationType, setEditRelationType] = useState("");
  const [editContext, setEditContext] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId || !relationType) return;
    
    const res = await fetch(`/api/worlds/${worldId}/relationships`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId, targetId, relationType, context })
    });
    
    if (res.ok) {
      setSourceId("");
      setTargetId("");
      setRelationType("");
      setContext("");
      setIsCreating(false);
      mutate();
    }
  };

  const startEditing = (rel: any) => {
    setEditingId(rel.id);
    setEditRelationType(rel.relationType);
    setEditContext(rel.context || "");
  };

  const handleUpdate = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (!editRelationType) return;

    await fetch(`/api/relationships/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ relationType: editRelationType, context: editContext })
    });
    setEditingId(null);
    mutate();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this relationship?")) return;
    await fetch(`/api/relationships/${id}`, { method: "DELETE" });
    mutate();
  };

  const getEntryName = (id: string) => {
    return entries?.find((e: any) => e.id === id)?.name || "Unknown";
  };

  return (
    <div className="max-w-4xl mx-auto p-6 mt-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href={`/worlds/${worldId}`} className="text-gray-500 hover:text-black mb-2 inline-flex items-center text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to World
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Canonical Relationships</h1>
        </div>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Relationship
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="font-semibold text-lg mb-4">Create Structured Relationship</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <LabelWithTooltip 
                label="Source Entity" 
                tooltip="The entity that originates the relationship." 
              />
              <select value={sourceId} onChange={e => setSourceId(e.target.value)} className="w-full border rounded-xl p-2" required>
                <option value="">-- Select --</option>
                {entries?.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div>
              <LabelWithTooltip 
                label="Relation Verb (e.g. RESENTS)" 
                tooltip="The action or feeling directed at the target (use uppercase for clarity)." 
              />
              <input type="text" value={relationType} onChange={e => setRelationType(e.target.value)} className="w-full border rounded-xl p-2 uppercase" placeholder="PROTECTS" required />
            </div>
            <div>
              <LabelWithTooltip 
                label="Target Entity" 
                tooltip="The entity receiving the relationship action or feeling." 
              />
              <select value={targetId} onChange={e => setTargetId(e.target.value)} className="w-full border rounded-xl p-2" required>
                <option value="">-- Select --</option>
                {entries?.map((e: any) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <LabelWithTooltip 
              label="Context (Optional)" 
              tooltip="Additional details explaining the 'why' behind this relationship." 
            />
            <input type="text" value={context} onChange={e => setContext(e.target.value)} className="w-full border rounded-xl p-2" placeholder="e.g. because of a 30-year grudge" />
          </div>
          <div className="flex space-x-3">
            <button type="submit" className="bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800">Save</button>
            <button type="button" onClick={() => setIsCreating(false)} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
        <ul className="divide-y">
          {relationships?.map((rel: any) => (
            <li key={rel.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between hover:bg-gray-50 group">
              {editingId === rel.id ? (
                <form onSubmit={(e) => handleUpdate(e, rel.id)} className="w-full flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex-1 w-full md:w-auto">
                    <span className="font-medium mr-2">{getEntryName(rel.sourceId)}</span>
                    <input 
                      type="text" 
                      value={editRelationType} 
                      onChange={(e) => setEditRelationType(e.target.value)} 
                      className="border rounded p-1 w-32 text-sm uppercase" 
                      placeholder="VERB"
                      required
                    />
                    <span className="font-medium ml-2">{getEntryName(rel.targetId)}</span>
                    <input 
                      type="text" 
                      value={editContext} 
                      onChange={(e) => setEditContext(e.target.value)} 
                      className="border rounded p-1 ml-4 flex-1 text-sm w-full md:w-auto mt-2 md:mt-0" 
                      placeholder="Context"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button type="submit" className="text-green-600 hover:text-green-800 p-2"><Check className="w-4 h-4" /></button>
                    <button type="button" onClick={() => setEditingId(null)} className="text-gray-500 hover:text-gray-700 p-2"><X className="w-4 h-4" /></button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start space-x-4">
                    <LinkIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {getEntryName(rel.sourceId)} <span className="text-blue-600 mx-1">{rel.relationType}</span> {getEntryName(rel.targetId)}
                      </p>
                      {rel.context && <p className="text-sm text-gray-500 mt-1">{rel.context}</p>}
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4 md:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEditing(rel)} className="text-gray-500 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(rel.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
          {relationships?.length === 0 && !isCreating && (
            <li className="p-8 text-center text-gray-500">No canonical relationships defined yet.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
