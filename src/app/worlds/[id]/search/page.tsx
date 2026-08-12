"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Search, Loader2 } from "lucide-react";

export default function SearchPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/worlds/${id}/search?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link href={`/worlds/${id}`} className="text-sm text-gray-500 hover:underline mb-4 inline-block">&larr; Back to World Hub</Link>
      <h1 className="text-3xl font-bold mb-2">Semantic Search</h1>
      <p className="text-gray-600 mb-6">Search past sessions by meaning, not just exact keywords.</p>
      
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. What happened with the rats?"
          className="flex-1 border border-gray-300 rounded-md p-3 shadow-sm"
        />
        <button 
          type="submit" 
          disabled={isSearching}
          className="bg-black text-white px-6 rounded-md hover:bg-gray-800 disabled:opacity-50 flex items-center"
        >
          {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        </button>
      </form>

      <div className="space-y-4">
        {results.length > 0 ? (
          results.map((msg) => (
            <div key={msg.id} className="border p-4 rounded-lg bg-white shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold text-gray-800">
                  {msg.role === "world" ? "WORLD" : msg.role === "character" ? msg.speakerName : "USER"}
                </span>
                <span className="text-xs text-gray-400">Match score: {(1 - msg.distance).toFixed(2)}</span>
              </div>
              <p className="text-gray-700">{msg.content}</p>
              <Link href={`/worlds/${id}/sessions/${msg.sessionId}`} className="text-blue-600 text-sm mt-3 hover:underline">
                View Session &rarr;
              </Link>
            </div>
          ))
        ) : (
          !isSearching && query && <p className="text-gray-500 italic">No semantic matches found.</p>
        )}
      </div>
    </div>
  );
}
