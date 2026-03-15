"use client";

/**
 * ConversionFunnel — SVG funnel showing pipeline from awareness to purchase.
 * Numbers update live as agents respond.
 */

import { motion } from "framer-motion";

import type { SimAgent } from "@/lib/types";

interface Props {
  agents: SimAgent[];
  totalAgents: number;
}

export default function ConversionFunnel({ agents, totalAgents }: Props) {
  const total = agents.length;
  const interested = agents.filter((a) => a.sentiment > -0.3).length;
  const willingToPay = agents.filter((a) => a.sentiment > 0.1).length;
  const wouldBuy = agents.filter((a) => a.purchased).length;

  const stages = [
    { label: "Aware", count: totalAgents, color: "#3b82f6", width: 100 },
    { label: "Evaluated", count: total, color: "#8b5cf6", width: 82 },
    { label: "Interested", count: interested, color: "#f59e0b", width: 64 },
    { label: "Willing to Pay", count: willingToPay, color: "#f97316", width: 46 },
    { label: "Would Buy", count: wouldBuy, color: "#22c55e", width: 30 },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm">
      <h3 className="mb-3 text-sm font-medium text-white/60">Conversion Funnel</h3>
      <div className="flex flex-col items-center gap-1">
        {stages.map((stage, i) => (
          <motion.div
            key={stage.label}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="flex items-center justify-between rounded-md px-3 py-2"
            style={{
              width: `${stage.width}%`,
              backgroundColor: `${stage.color}20`,
              borderLeft: `3px solid ${stage.color}`,
            }}
          >
            <span className="text-[11px] text-white/60">{stage.label}</span>
            <span className="text-sm font-bold" style={{ color: stage.color }}>
              {stage.count.toLocaleString()}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
