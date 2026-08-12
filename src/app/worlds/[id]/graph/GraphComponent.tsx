"use client";
import { useEffect, useState, useMemo } from "react";
import ForceGraph2D from "react-force-graph-2d";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function GraphComponent({ worldId }: { worldId: string }) {
  const { data: entries } = useSWR(`/api/entries?worldId=${worldId}`, fetcher);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: Math.min(window.innerWidth - 64, 1152), height: window.innerHeight - 250 });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const graphData = useMemo(() => {
    if (!entries) return { nodes: [], links: [] };

    const nodes = entries.map((e: any) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      val: 20
    }));

    const links: any[] = [];
    
    // Parse tags and layers to find implicit connections
    entries.forEach((entry: any) => {
      const allText = [
        ...(entry.tags || []),
        entry.layers?.public || "",
        entry.layers?.personal || "",
        entry.layers?.observable || ""
      ].join(" ").toLowerCase();

      entries.forEach((otherEntry: any) => {
        if (entry.id !== otherEntry.id && allText.includes(otherEntry.name.toLowerCase())) {
          links.push({ source: entry.id, target: otherEntry.id });
        }
      });
    });

    // Mark orphaned nodes
    const connectedNodes = new Set();
    links.forEach(l => {
      connectedNodes.add(l.source);
      connectedNodes.add(l.target);
    });

    nodes.forEach((n: any) => {
      n.orphaned = !connectedNodes.has(n.id);
    });

    return { nodes, links };
  }, [entries]);

  if (!entries) return <div>Loading graph...</div>;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white flex justify-center items-center" style={{ width: dimensions.width, height: dimensions.height }}>
      <ForceGraph2D
        width={dimensions.width}
        height={dimensions.height}
        graphData={graphData}
        nodeLabel="name"
        nodeColor={(node: any) => node.orphaned ? "#f59e0b" : "#3b82f6"}
        nodeRelSize={6}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
      />
    </div>
  );
}
