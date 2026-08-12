"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import useSWR from "swr";
import Link from "next/link";
import { Send, FileText } from "lucide-react";

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function ChatSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  
  const { data: initialMessages, error } = useSWR(`/api/messages?sessionId=${sessionId}`, fetcher);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialMessages) {
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    setIsLoading(true);

    // Optimistic UI for user message
    const tempUserMsg = { id: Date.now().toString(), role: "user", content: userMsg };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, userMessage: userMsg })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Append generated messages
      if (data.messages && data.messages.length > 0) {
        setMessages(prev => [...prev.filter(m => m.id !== tempUserMsg.id), tempUserMsg, ...data.messages]);
      }
    } catch (e) {
      console.error(e);
      // Revert optimistic if error
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
      alert("Failed to generate response. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarize = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/summarize`, {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        alert(`Session summarized! Created ${data.count} new lore entries.`);
        router.push("/worlds"); // Go back to worlds/hub
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      alert("Failed to summarize session: " + e.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-3xl mx-auto bg-gray-50 border-x">
      <div className="bg-white border-b p-4 flex items-center justify-between shadow-sm z-10">
        <h1 className="font-bold text-lg">Lorebiter Session</h1>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm text-gray-600 cursor-pointer">
            <input 
              type="checkbox" 
              checked={showInsights} 
              onChange={e => setShowInsights(e.target.checked)} 
              className="rounded"
            />
            <span>Insight</span>
          </label>
          <button 
            onClick={handleSummarize}
            disabled={isLoading}
            className="flex items-center text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded hover:bg-blue-100 disabled:opacity-50"
          >
            <FileText className="w-4 h-4 mr-1" /> End & Summarize
          </button>
          <Link href="/worlds" className="text-sm text-gray-500 hover:underline">Exit</Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg, idx) => (
          <div key={msg.id || idx}>
            {msg.role === "world" && (
              <div className="w-full text-center py-4">
                <p className="text-gray-500 italic inline-block max-w-2xl mx-auto whitespace-pre-wrap">{msg.content}</p>
              </div>
            )}
            
            {msg.role === "character" && (
              <div className="flex flex-col items-start max-w-[85%]">
                <div className="flex items-center mb-1 ml-1 space-x-2">
                  <span className="text-xs font-semibold text-gray-500">{msg.speakerName}</span>
                  {msg.metadata?.flag === "lie" && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold tracking-wider uppercase border border-red-200">Deception</span>
                  )}
                  {msg.metadata?.flag === "misremembered" && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold tracking-wider uppercase border border-amber-200">Misremembered</span>
                  )}
                </div>
                <div className="bg-white border rounded-2xl rounded-tl-sm p-4 shadow-sm">
                  {showInsights && msg.metadata?.inner_thought && (
                    <div className="mb-3 p-3 bg-indigo-50 border border-indigo-100 rounded-xl rounded-bl-sm text-sm text-indigo-800 italic relative shadow-inner">
                      <span className="font-semibold text-indigo-900 not-italic block mb-1 text-xs uppercase tracking-wider">Inner Thought</span>
                      {msg.metadata.inner_thought}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            )}
            
            {msg.role === "user" && (
              <div className="flex flex-col items-end max-w-[85%] ml-auto">
                <div className="bg-black text-white rounded-2xl rounded-tr-sm p-4 shadow-sm">
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex flex-col items-start max-w-[85%]">
            <div className="bg-white border rounded-2xl rounded-tl-sm p-4 shadow-sm flex space-x-2 items-center h-12">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t p-4">
        <form onSubmit={handleSend} className="relative flex items-center">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Type your action, speech, or time jump..."
            className="w-full border border-gray-300 rounded-full pl-4 pr-12 py-3 max-h-32 focus:outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500 resize-none overflow-hidden"
            rows={1}
            style={{ minHeight: "48px" }}
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:bg-gray-300 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-xs text-center text-gray-400 mt-2">Enter to send, Shift+Enter for new line.</p>
      </div>
    </div>
  );
}
