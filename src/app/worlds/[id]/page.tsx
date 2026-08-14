"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Download, Network, Search, Trash2 } from "lucide-react";

export default function WorldHub() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "Are you absolutely sure you want to delete this world? This will permanently delete all entries, relationships, and chat sessions. This action cannot be undone."
    );

    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/worlds/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/worlds");
      } else {
        const data = await res.json();
        alert("Failed to delete world: " + data.error);
        setIsDeleting(false);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting the world.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link href="/worlds" className="text-sm text-gray-500 hover:underline mb-4 inline-block">&larr; Back to Worlds</Link>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">World Hub</h1>
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex items-center px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {isDeleting ? "Deleting..." : "Delete World"}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href={`/worlds/${id}/entries`}>
          <div className="border p-6 rounded-lg hover:shadow-lg transition-shadow cursor-pointer bg-blue-50 h-full flex flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-bold text-blue-900 mb-2">Lore Entries</h2>
            <p className="text-blue-700">Manage characters and world facts</p>
          </div>
        </Link>

        <Link href={`/worlds/${id}/relationships`}>
          <div className="border p-6 rounded-lg hover:shadow-lg transition-shadow cursor-pointer bg-teal-50 h-full flex flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-bold text-teal-900 mb-2">Canonical Relationships</h2>
            <p className="text-teal-700">Define entity connections</p>
          </div>
        </Link>

        <Link href={`/worlds/${id}/sessions`}>
          <div className="border p-6 rounded-lg hover:shadow-lg transition-shadow cursor-pointer bg-green-50 h-full flex flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-bold text-green-900 mb-2">Sessions</h2>
            <p className="text-green-700">Play and manage chat sessions</p>
          </div>
        </Link>
        
        <Link href={`/worlds/${id}/graph`}>
          <div className="border p-6 rounded-lg hover:shadow-lg transition-shadow cursor-pointer bg-purple-50 h-full flex flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-bold text-purple-900 mb-2">Lore Graph</h2>
            <p className="text-purple-700">Visualize entry connections</p>
          </div>
        </Link>
        
        <Link href={`/worlds/${id}/search`}>
          <div className="border p-6 rounded-lg hover:shadow-lg transition-shadow cursor-pointer bg-amber-50 h-full flex flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-bold text-amber-900 mb-2">Search Memory</h2>
            <p className="text-amber-700">Semantic search across logs</p>
          </div>
        </Link>

        <a href={`/api/worlds/${id}/export`} download>
          <div className="border p-6 rounded-lg hover:shadow-lg transition-shadow cursor-pointer bg-gray-50 h-full flex flex-col items-center justify-center text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Export World</h2>
            <p className="text-gray-700">Download LorePack JSON for AI</p>
          </div>
        </a>
      </div>
    </div>
  );
}
