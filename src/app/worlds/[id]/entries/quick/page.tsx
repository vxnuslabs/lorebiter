"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Wand2 } from "lucide-react";

export default function QuickEntryPage() {
  const params = useParams();
  const worldId = params.id as string;
  const router = useRouter();
  
  const [rawText, setRawText] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  const handleParse = async () => {
    if (!rawText.trim()) return;
    setIsParsing(true);
    
    try {
      const res = await fetch("/api/entries/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Store the parsed data in localStorage or pass via query params
      // Since query params have length limits, let's use sessionStorage
      sessionStorage.setItem("lorebiter_quick_draft", JSON.stringify(data));
      
      // Redirect to the regular new entry page which will read this draft
      router.push(`/worlds/${worldId}/entries/new?draft=true`);
      
    } catch (e: any) {
      alert("Failed to parse: " + e.message);
      setIsParsing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href={`/worlds/${worldId}/entries`} className="text-sm text-gray-500 hover:underline mb-4 inline-block">&larr; Back to Entries</Link>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Quick Draft</h1>
        <p className="text-gray-600">Dump your raw ideas below. The AI will parse it, structure it into layers, and determine the best entry type.</p>
      </div>
      
      <textarea 
        value={rawText}
        onChange={e => setRawText(e.target.value)}
        className="w-full border rounded-lg p-4 h-64 mb-4 focus:ring-2 focus:ring-black focus:outline-none"
        placeholder="e.g. The East Wing is mostly abandoned now. It smells like old dust and dried roses. The hidden truth is that the Old Master's real will is hidden under the floorboards in the third guest room."
      />

      <div className="flex justify-end">
        <button 
          onClick={handleParse} 
          disabled={isParsing || !rawText.trim()}
          className="flex items-center bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 disabled:opacity-50 text-lg font-medium shadow-md transition-all"
        >
          <Wand2 className="w-5 h-5 mr-2" /> 
          {isParsing ? "Analyzing..." : "Magic Parse"}
        </button>
      </div>
    </div>
  );
}
