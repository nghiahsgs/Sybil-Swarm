"use client";

/**
 * Simulation Dashboard — the main event.
 * Shows real-time simulation world, agent feed, heatmap, stats, funnel,
 * agent chat panel, and post-simulation report.
 */

import { use, useEffect, useState } from "react";

import AgentFeed from "@/components/agent-feed";
import ChatPanel from "@/components/chat-panel";
import ConversionFunnel from "@/components/conversion-funnel";
import PhaseIndicator from "@/components/phase-indicator";
import ReportView from "@/components/report-view";
import SentimentHeatmap from "@/components/sentiment-heatmap";
import SimulationWorld from "@/components/simulation-world";
import StatsPanel from "@/components/stats-panel";
import { getSimulation } from "@/lib/api-client";
import type { SimAgent } from "@/lib/types";
import { useSimulationSSE } from "@/lib/use-sse";

export default function SimulationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const simId = parseInt(id, 10);
  const state = useSimulationSSE(simId);
  const [chatAgent, setChatAgent] = useState<SimAgent | null>(null);
  const [totalAgents, setTotalAgents] = useState(10);

  // Fetch simulation details — also detect if already completed (page refresh case)
  const [simComplete, setSimComplete] = useState(false);
  useEffect(() => {
    getSimulation(simId).then((sim) => {
      setTotalAgents(sim.total_agents);
      if (sim.status === "completed") setSimComplete(true);
    }).catch(() => {});
  }, [simId]);

  // Also poll status every 5s if not complete (catches SSE misses)
  useEffect(() => {
    if (state.isComplete || simComplete) return;
    const interval = setInterval(() => {
      getSimulation(simId).then((sim) => {
        if (sim.status === "completed") {
          setSimComplete(true);
          clearInterval(interval);
        }
      }).catch(() => {});
    }, 5000);
    return () => clearInterval(interval);
  }, [simId, state.isComplete, simComplete]);

  const isComplete = state.isComplete || simComplete;

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4 text-white">
      {/* Header */}
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                Sybil Swarm
              </span>
            </h1>
            <p className="text-sm text-white/40">Simulation #{simId}</p>
          </div>
          {isComplete && (
            <div className="rounded-full bg-green-500/20 px-4 py-1.5 text-sm font-medium text-green-400">
              Complete
            </div>
          )}
        </div>

        {/* Phase progress */}
        <PhaseIndicator
          phase={state.phase}
          completedCount={state.completedCount}
          totalAgents={totalAgents}
        />

        {/* Main grid */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_320px]">
          {/* Left column: World + bottom panels */}
          <div className="space-y-4">
            {/* Simulation World — THE star */}
            <SimulationWorld agents={state.agents} width={900} height={500} />

            {/* Bottom row: Funnel + Stats */}
            <div className="grid gap-4 md:grid-cols-2">
              <ConversionFunnel agents={state.agents} totalAgents={totalAgents} />
              <StatsPanel
                agents={state.agents}
                totalAgents={totalAgents}
                isComplete={isComplete}
                overallScore={state.overallScore}
                conversionRate={state.conversionRate}
              />
            </div>

            {/* Report — shows after completion */}
            <ReportView simulationId={simId} isComplete={isComplete} />
          </div>

          {/* Right column: Heatmap + Feed */}
          <div className="space-y-4">
            <SentimentHeatmap agents={state.agents} totalSlots={totalAgents} />
            <AgentFeed agents={state.agents} onAgentClick={setChatAgent} />
          </div>
        </div>

        {/* Error display */}
        {state.error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {state.error}
          </div>
        )}
      </div>

      {/* Chat panel — slides in from right */}
      <ChatPanel
        simulationId={simId}
        agent={chatAgent}
        onClose={() => setChatAgent(null)}
      />
    </div>
  );
}
