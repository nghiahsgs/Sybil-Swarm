/** Shared TypeScript types for Sybil Swarm frontend. */

export interface TargetAudience {
  age_range: string;
  gender: string;
  interests: string;
  occupation: string;
  income_level: string;
  location: string;
}

export interface SimulationCreate {
  product_input: string;
  total_agents: number;
  target_audience?: TargetAudience;
}

export interface SimulationResponse {
  id: number;
  status: string;
  product_input: string;
  total_agents: number;
}

export interface SimulationDetail {
  id: number;
  status: string;
  product_input: string;
  product_info: string;
  total_agents: number;
  completed_agents: number;
  created_at: string;
  completed_at: string | null;
  error_message: string | null;
}

export interface AgentEvent {
  persona_name: string;
  persona_age: number;
  persona_occupation: string;
  tier: "bulk" | "expert" | "synthesis";
  purchase_decision: boolean;
  sentiment_score: number; // -1.0 to 1.0
  first_impression: string;
}

export interface PhaseEvent {
  phase: string;
  total_personas?: number;
}

export interface SimulationCompleteEvent {
  conversion_rate: number;
  overall_score: number;
}

export interface SimulationReport {
  overall_score: number;
  conversion_rate: number;
  avg_willingness_to_pay: number;
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  top_objections: Array<{ objection: string; count: number }>;
  top_suggestions: Array<{ suggestion: string; count: number }>;
  synthesis_narrative: string;
}

export interface AgentResponseItem {
  id: number;
  persona_name: string;
  persona_age: number;
  persona_occupation: string;
  tier: string;
  first_impression: string;
  willingness_to_pay: number;
  purchase_decision: boolean;
  sentiment_score: number;
}

/** Agent state for the simulation world canvas. */
export interface SimAgent {
  id: string;
  name: string;
  age: number;
  occupation: string;
  tier: "bulk" | "expert" | "synthesis";
  sentiment: number; // -1 to 1
  purchased: boolean;
  impression: string;
  // Canvas position & animation
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  radius: number;
  showBubble: boolean;
  bubbleTimer: number;
}
