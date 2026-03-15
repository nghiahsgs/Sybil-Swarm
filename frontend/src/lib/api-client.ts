/** API client for Sybil Swarm backend. */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

import type { SimulationCreate, SimulationDetail, SimulationReport, SimulationResponse } from "./types";

/** Create a new simulation. */
export async function createSimulation(data: SimulationCreate): Promise<SimulationResponse> {
  const res = await fetch(`${API_BASE}/api/simulations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

/** Get simulation details. */
export async function getSimulation(id: number): Promise<SimulationDetail> {
  const res = await fetch(`${API_BASE}/api/simulations/${id}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Get simulation report. */
export async function getReport(id: number): Promise<SimulationReport> {
  const res = await fetch(`${API_BASE}/api/simulations/${id}/report`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

/** Get SSE stream URL. */
export function getStreamUrl(id: number): string {
  return `${API_BASE}/api/simulations/${id}/stream`;
}
