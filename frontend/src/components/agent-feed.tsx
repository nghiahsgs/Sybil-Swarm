"use client";

/**
 * AgentFeed — Twitter-like scrolling feed of agent evaluations.
 * New agents animate in from top. Color-coded by purchase decision.
 */

import { motion, AnimatePresence } from "framer-motion";

import type { SimAgent } from "@/lib/types";

interface Props {
  agents: SimAgent[];
  maxVisible?: number;
  onAgentClick?: (agent: SimAgent) => void;
}

export default function AgentFeed({ agents, maxVisible = 50, onAgentClick }: Props) {
  // Show most recent agents first, limit to avoid DOM bloat
  const visible = agents.slice(-maxVisible).reverse();

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm">
      <h3 className="mb-3 text-sm font-medium text-white/60">Live Agent Feed</h3>
      <div className="h-[500px] space-y-2 overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        <AnimatePresence initial={false}>
          {visible.map((agent) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => onAgentClick?.(agent)}
              className={`cursor-pointer rounded-lg border p-3 transition-colors hover:bg-white/5 ${
                agent.purchased
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-red-500/30 bg-red-500/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Avatar circle */}
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: agent.color }}
                  >
                    {agent.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {agent.name}
                      {agent.tier === "expert" && (
                        <span className="ml-1.5 rounded-full bg-purple-500/30 px-1.5 py-0.5 text-[9px] text-purple-300">
                          EXPERT
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-white/40">
                      {agent.age}y · {agent.occupation}
                    </p>
                  </div>
                </div>
                <span className={`text-lg ${agent.purchased ? "" : ""}`}>
                  {agent.purchased ? "💰" : "👋"}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-white/70">
                &quot;{agent.impression}&quot;
              </p>
            </motion.div>
          ))}
        </AnimatePresence>

        {visible.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-white/30">
            Waiting for agents...
          </div>
        )}
      </div>
    </div>
  );
}
