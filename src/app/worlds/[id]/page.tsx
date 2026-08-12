"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useParams } from "next/navigation";
import { Download, Network, Search } from "lucide-react";

export default function WorldHub() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link href="/worlds" className="text-sm text-gray-500 hover:underline mb-4 inline-block">&larr; Back to Worlds</Link>
      <h1 className="text-3xl font-bold mb-6">World Hub</h1>
      
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
            <p className="text-gray-700">Download a full JSON backup</p>
          </div>
        </a>
      </div>
    </div>
  );
}
