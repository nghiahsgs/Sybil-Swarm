"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, ChevronDown, Shield, Target, TrendingUp, Users, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createSimulation } from "@/lib/api-client";
import type { TargetAudience } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [agents, setAgents] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTarget, setShowTarget] = useState(false);
  const [target, setTarget] = useState<TargetAudience>({
    age_range: "", gender: "", interests: "", occupation: "", income_level: "", location: "",
  });

  const hasTarget = Object.values(target).some((v) => v.trim());

  const handleLaunch = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    try {
      const sim = await createSimulation({
        product_input: input,
        total_agents: agents,
        target_audience: hasTarget ? target : undefined,
      });
      router.push(`/simulation/${sim.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start simulation");
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#0a0a0a] px-4 py-24">
      {/* Ambient glow blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-purple-600/20 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full bg-cyan-500/10 blur-[100px]"
      />

      {/* Badge */}
      <Badge
        variant="outline"
        className="mb-8 border-purple-500/40 bg-purple-500/10 text-purple-300 backdrop-blur"
      >
        <Zap className="mr-1.5 h-3 w-3" />
        AI-Powered Market Simulation
      </Badge>

      {/* Headline */}
      <h1 className="mb-4 max-w-3xl text-center text-5xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
        <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Sybil Swarm
        </span>
      </h1>

      {/* Tagline */}
      <p className="mb-4 max-w-xl text-center text-xl font-medium text-white/80 sm:text-2xl">
        Meet your first{" "}
        <span className="font-bold text-cyan-400">1,000 customers</span> before
        you build.
      </p>

      <p className="mb-12 max-w-lg text-center text-base text-white/50">
        Drop your landing page URL or describe your product. Our AI spawns a swarm of
        synthetic personas and delivers brutally honest market insights.
      </p>

      {/* Input + CTA */}
      <div className="flex w-full max-w-xl flex-col gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLaunch()}
          placeholder="https://yourproduct.com or describe your idea…"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/60"
        />
        <div className="flex items-center gap-3">
          <select
            value={agents}
            onChange={(e) => setAgents(Number(e.target.value))}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/70"
          >
            <option value={10}>10 agents (test)</option>
            <option value={50}>50 agents</option>
            <option value={100}>100 agents</option>
            <option value={500}>500 agents</option>
            <option value={1000}>1,000 agents</option>
          </select>
          <Button
            onClick={handleLaunch}
            disabled={loading || !input.trim()}
            className="flex-1 bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-500 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Launching Swarm...
              </span>
            ) : (
              <>
                Launch Simulation
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        {/* Target Audience (collapsible) */}
        <button
          type="button"
          onClick={() => setShowTarget(!showTarget)}
          className="flex w-full items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
        >
          <Target className="h-3.5 w-3.5" />
          Define target audience (optional)
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showTarget ? "rotate-180" : ""}`} />
        </button>

        {showTarget && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { key: "age_range", placeholder: "Age range (e.g. 18-35)", },
              { key: "gender", placeholder: "Gender (any/male/female)", },
              { key: "interests", placeholder: "Interests (e.g. tech, fitness)", },
              { key: "occupation", placeholder: "Occupation (e.g. developer)", },
              { key: "income_level", placeholder: "Income (low/medium/high)", },
              { key: "location", placeholder: "Location (e.g. Vietnam, US)", },
            ].map(({ key, placeholder }) => (
              <input
                key={key}
                type="text"
                value={target[key as keyof TargetAudience]}
                onChange={(e) => setTarget({ ...target, [key]: e.target.value })}
                placeholder={placeholder}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
              />
            ))}
          </div>
        )}
      </div>

      {/* Feature pills */}
      <div className="mt-16 flex flex-wrap justify-center gap-4 text-sm text-white/50">
        <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2">
          <Users className="h-4 w-4 text-purple-400" />
          1,000 synthetic personas
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2">
          <TrendingUp className="h-4 w-4 text-cyan-400" />
          Real-time swarm analytics
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2">
          <Shield className="h-4 w-4 text-pink-400" />
          Bring Your Own API Key
        </span>
      </div>
    </main>
  );
}
