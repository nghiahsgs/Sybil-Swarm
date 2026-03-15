"use client";

/**
 * ChatPanel — Slide-out panel for chatting with individual agent personas.
 * Shows persona card at top, streaming chat messages, and input field.
 */

import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Send, X } from "lucide-react";
import { useRef, useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import type { SimAgent } from "@/lib/types";
import { useAgentChat } from "@/lib/use-websocket";

interface Props {
  simulationId: number;
  agent: SimAgent | null;
  onClose: () => void;
}

export default function ChatPanel({ simulationId, agent, onClose }: Props) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Parse persona ID from agent.id (format: "agent-{timestamp}-{random}")
  // For now we use a simple mapping — in real use, persona_id would be in SimAgent
  const personaId = agent ? parseInt(agent.id.split("-")[1]) % 10000 : null;

  const { messages, streaming, connected, sendMessage } = useAgentChat(
    simulationId,
    agent ? personaId : null,
  );

  // Auto-scroll on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || streaming) return;
    sendMessage(input.trim());
    setInput("");
  };

  return (
    <AnimatePresence>
      {agent && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 z-50 flex h-full w-[400px] flex-col border-l border-white/10 bg-[#0c0c0c]/95 backdrop-blur-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: agent.color }}
              >
                {agent.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{agent.name}</p>
                <p className="text-xs text-white/40">
                  {agent.age}y · {agent.occupation}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Persona card */}
          <div className={`mx-4 mt-4 rounded-lg border p-3 ${agent.purchased ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
            <p className="text-xs text-white/50">Original evaluation:</p>
            <p className="mt-1 text-sm text-white/80">&quot;{agent.impression}&quot;</p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${agent.purchased ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                {agent.purchased ? "Would Buy" : "Would Not Buy"}
              </span>
              <span className="text-[10px] text-white/30">
                Sentiment: {agent.sentiment > 0 ? "+" : ""}{agent.sentiment.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center text-center text-white/30">
                <MessageCircle className="mb-2 h-8 w-8" />
                <p className="text-sm">Ask {agent.name} anything about their evaluation</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === "user"
                      ? "bg-purple-600/30 text-white"
                      : "bg-white/5 text-white/80"
                  }`}
                >
                  {msg.content}
                  {streaming && i === messages.length - 1 && msg.role === "agent" && (
                    <span className="ml-1 inline-block h-3 w-1 animate-pulse bg-white/50" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="border-t border-white/10 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={connected ? "Ask this agent..." : "Connecting..."}
                disabled={!connected || streaming}
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500/50 disabled:opacity-50"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || streaming || !connected}
                size="icon"
                className="bg-purple-600 hover:bg-purple-500"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
