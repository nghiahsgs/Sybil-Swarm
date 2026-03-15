"use client";

/** Custom hook for consuming SSE events from simulation stream. */

import { useCallback, useEffect, useRef, useState } from "react";

import { getStreamUrl } from "./api-client";
import type { AgentEvent, PhaseEvent, SimulationCompleteEvent, SimAgent } from "./types";

/** Assign color based on sentiment score (-1 to 1). */
function sentimentColor(score: number): string {
  if (score > 0.3) return "#22c55e"; // green
  if (score > 0) return "#86efac"; // light green
  if (score > -0.3) return "#facc15"; // yellow
  if (score > -0.6) return "#f97316"; // orange
  return "#ef4444"; // red
}

/** Random position within bounds. */
function randPos(max: number): number {
  return Math.random() * max * 0.85 + max * 0.075;
}

export interface SimulationState {
  agents: SimAgent[];
  phase: string;
  completedCount: number;
  isComplete: boolean;
  conversionRate: number;
  overallScore: number;
  error: string | null;
}

export function useSimulationSSE(simulationId: number | null) {
  const [state, setState] = useState<SimulationState>({
    agents: [],
    phase: "connecting",
    completedCount: 0,
    isComplete: false,
    conversionRate: 0,
    overallScore: 0,
    error: null,
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!simulationId) return;

    const es = new EventSource(getStreamUrl(simulationId));
    eventSourceRef.current = es;

    es.addEventListener("agent_completed", (e) => {
      const data: AgentEvent = JSON.parse(e.data);
      const agent: SimAgent = {
        id: `agent-${Date.now()}-${Math.random()}`,
        name: data.persona_name,
        age: data.persona_age,
        occupation: data.persona_occupation,
        tier: data.tier,
        sentiment: data.sentiment_score,
        purchased: data.purchase_decision,
        impression: data.first_impression,
        x: randPos(800),
        y: randPos(600),
        targetX: randPos(800),
        targetY: randPos(600),
        color: sentimentColor(data.sentiment_score),
        radius: data.tier === "expert" ? 10 : 6,
        showBubble: true,
        bubbleTimer: 3000,
      };

      setState((prev) => ({
        ...prev,
        agents: [...prev.agents, agent],
        completedCount: prev.completedCount + 1,
      }));
    });

    es.addEventListener("phase_changed", (e) => {
      const data: PhaseEvent = JSON.parse(e.data);
      setState((prev) => ({ ...prev, phase: data.phase }));
    });

    es.addEventListener("simulation_complete", (e) => {
      const data: SimulationCompleteEvent = JSON.parse(e.data);
      setState((prev) => ({
        ...prev,
        isComplete: true,
        conversionRate: data.conversion_rate,
        overallScore: data.overall_score,
        phase: "completed",
      }));
      es.close();
    });

    es.addEventListener("error", (e) => {
      const data = (e as MessageEvent).data;
      if (data) {
        try {
          const parsed = JSON.parse(data);
          setState((prev) => ({ ...prev, error: parsed.message }));
        } catch {
          // SSE connection error, not a data event
        }
      }
    });

    es.onerror = () => {
      // Auto-reconnect after 3s
      es.close();
      setTimeout(connect, 3000);
    };
  }, [simulationId]);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
    };
  }, [connect]);

  return state;
}
