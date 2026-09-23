"use client";

import { useState, useEffect as import_react_useEffect } from "react";
import { useRouter } from "next/navigation";
import { AIMode } from "@/types/ai";
import { createAISession, getSessionMessages } from "@/lib/ai/actions";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function AIChatPanel({ subjectId, initialSessionId }: { subjectId?: string; initialSessionId?: string }) {
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<AIMode>("explain");
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const router = useRouter();

  // Cleanup abort controller on unmount
  import_react_useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  // Load existing session history if initialSessionId is provided
  import_react_useEffect(() => {
    if (initialSessionId) {
      setLoading(true);
      getSessionMessages(initialSessionId)
        .then(history => {
          setMessages(history.map(m => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content })));
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [initialSessionId]);

  const startSession = async () => {
    try {
      setLoading(true);
      const session = await createAISession(mode, subjectId);
      router.push(`/dashboard/ai/${session.id}`);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || !sessionId) return;

    const userMsg = input;
    setInput("");
    
    // Optimistic UI update
    const tempId = Date.now().toString();
    setMessages(prev => [...prev, { id: tempId, role: "user", content: userMsg }]);
    setLoading(true);

    try {
      if (abortController) {
        abortController.abort();
      }
      const controller = new AbortController();
      setAbortController(controller);

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: userMsg }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantMsgContent = "";

      const assistantId = Date.now().toString();
      setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "" }]);
      setLoading(false); // Disable top-level loading since stream is active

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (dataStr) {
              try {
                const data = JSON.parse(dataStr);
                if (data.message) {
                  assistantMsgContent = data.message;
                  setMessages(prev => 
                    prev.map(m => m.id === assistantId ? { ...m, content: assistantMsgContent } : m)
                  );
                }
              } catch (err) {
                console.error("Parse error on chunk", err);
              }
            }
          } else if (line.startsWith("event: error")) {
             // Handle stream error if necessary
          }
        }
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-lg border shadow-sm p-4 w-full max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4 pb-2 border-b">
        <h2 className="text-lg font-semibold text-slate-800">Assistant IA</h2>
        {!sessionId && (
          <div className="flex gap-2">
            <select 
              value={mode} 
              onChange={e => setMode(e.target.value as AIMode)}
              className="px-2 py-1 border rounded text-sm bg-slate-50 text-slate-700"
            >
              <option value="explain">Expliquer</option>
              <option value="summarize">Résumer</option>
              <option value="quiz">Quiz</option>
              <option value="coach">Coach</option>
            </select>
            <button 
              onClick={startSession}
              disabled={loading}
              className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
            >
              Démarrer
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {!sessionId ? (
          <div className="text-center text-slate-500 mt-10">
            Démarrez une session pour interagir avec l&apos;IA.
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-slate-500 mt-10">
            Posez votre première question !
          </div>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div 
                className={`max-w-[80%] px-4 py-2 rounded-lg ${
                  msg.role === "user" 
                    ? "bg-indigo-600 text-white rounded-tr-none" 
                    : "bg-slate-100 text-slate-800 rounded-tl-none border"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {loading && sessionId && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-500 px-4 py-2 rounded-lg rounded-tl-none text-sm animate-pulse">
              L&apos;IA réfléchit...
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Posez votre question..."
          disabled={!sessionId || loading}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!sessionId || loading || !input.trim()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium transition-colors"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}
