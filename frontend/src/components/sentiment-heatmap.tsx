"use client";

/**
 * SentimentHeatmap — 32x32 grid of cells that light up as agents complete.
 * Color transitions from red → yellow → green based on sentiment.
 * THE screenshot-worthy component for README/social.
 */

import { motion } from "framer-motion";
import { useMemo } from "react";

import type { SimAgent } from "@/lib/types";

interface Props {
  agents: SimAgent[];
  totalSlots?: number;
}

function sentimentToHSL(score: number): string {
  // -1 (red, h=0) → 0 (yellow, h=50) → 1 (green, h=130)
  const hue = Math.round(((score + 1) / 2) * 130);
  return `hsl(${hue}, 80%, 50%)`;
}

export default function SentimentHeatmap({ agents, totalSlots = 100 }: Props) {
  // Auto-calculate grid size: square root rounded up
  const gridSize = Math.max(2, Math.ceil(Math.sqrt(totalSlots)));

  const cells = useMemo(() => {
    const result = [];
    for (let i = 0; i < totalSlots; i++) {
      const agent = agents[i];
      result.push({
        filled: !!agent,
        color: agent ? sentimentToHSL(agent.sentiment) : "rgba(255,255,255,0.05)",
        name: agent?.name || "",
        sentiment: agent?.sentiment || 0,
        purchased: agent?.purchased || false,
      });
    }
    return result;
  }, [agents, totalSlots]);

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm">
      <h3 className="mb-3 text-sm font-medium text-white/60">Sentiment Heatmap</h3>
      <div
        className="grid gap-[2px]"
        style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
      >
        {cells.map((cell, i) => (
          <motion.div
            key={i}
            initial={cell.filled ? { scale: 0, opacity: 0 } : false}
            animate={cell.filled ? { scale: 1, opacity: 1 } : { opacity: 0.3 }}
            transition={{ duration: 0.3, delay: Math.random() * 0.1 }}
            className="aspect-square rounded-[2px]"
            style={{ backgroundColor: cell.color }}
            title={cell.filled ? `${cell.name}: ${cell.sentiment.toFixed(2)}` : "Waiting..."}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] text-white/40">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-red-500" /> Reject
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-yellow-500" /> Neutral
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-green-500" /> Buy
        </span>
      </div>
    </div>
  );
}
