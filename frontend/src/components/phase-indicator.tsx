"use client";

/**
 * PhaseIndicator — Shows current simulation phase with animated progress.
 */

import { motion } from "framer-motion";

interface Props {
  phase: string;
  completedCount: number;
  totalAgents: number;
}

const PHASE_LABELS: Record<string, string> = {
  connecting: "Connecting...",
  parsing_input: "Analyzing product...",
  generating_personas: "Creating 1,000 synthetic customers...",
  simulating: "Swarm evaluation in progress...",
  aggregating: "Synthesizing market report...",
  completed: "Simulation complete!",
};

export default function PhaseIndicator({ phase, completedCount, totalAgents }: Props) {
  const progress = phase === "completed" ? 100 : (completedCount / totalAgents) * 100;
  const label = PHASE_LABELS[phase] || phase;

  return (
    <div className="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-white/60">{label}</span>
        <span className="text-sm font-mono text-white/40">
          {completedCount}/{totalAgents}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}
