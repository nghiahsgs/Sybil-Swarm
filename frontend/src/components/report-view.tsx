"use client";

/**
 * ReportView — Displays the simulation report with download options.
 */

import { motion } from "framer-motion";
import { Download, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getReport } from "@/lib/api-client";
import type { SimulationReport } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Props {
  simulationId: number;
  isComplete: boolean;
}

export default function ReportView({ simulationId, isComplete }: Props) {
  const [report, setReport] = useState<SimulationReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isComplete) return;
    setLoading(true);
    getReport(simulationId)
      .then(setReport)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [simulationId, isComplete]);

  if (!isComplete) return null;

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/40 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-white/40">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-purple-500" />
          Loading report...
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/10 bg-black/40 p-6 backdrop-blur-sm"
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          <FileText className="h-5 w-5 text-purple-400" />
          Market Prediction Report
        </h2>
        <a
          href={`${API_BASE}/api/simulations/${simulationId}/report/download?format=md`}
          download
        >
          <Button variant="outline" size="sm" className="gap-1.5 border-white/10 text-white/60 hover:text-white">
            <Download className="h-3.5 w-3.5" />
            Download MD
          </Button>
        </a>
      </div>

      {/* Score hero */}
      <div className="mb-6 flex items-center gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-purple-500/50">
          <span className="text-2xl font-bold text-white">{Math.round(report.overall_score)}</span>
        </div>
        <div>
          <p className="text-sm text-white/40">Market Viability Score</p>
          <p className="text-sm text-white/60">
            {report.overall_score > 60
              ? "Strong market potential"
              : report.overall_score > 30
              ? "Needs improvement"
              : "Significant concerns"}
          </p>
        </div>
      </div>

      {/* Key metrics */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <MetricCard label="Conversion" value={`${report.conversion_rate.toFixed(1)}%`} />
        <MetricCard label="Avg WTP" value={`${report.avg_willingness_to_pay.toFixed(0)}/100`} />
        <MetricCard
          label="Sentiment"
          value={`${report.sentiment_distribution.positive}% +`}
        />
      </div>

      {/* Synthesis narrative — rendered markdown */}
      <div className="mb-6">
        <h3 className="mb-2 text-sm font-medium text-white/60">Analysis</h3>
        <div className="prose prose-sm prose-invert max-w-none rounded-lg bg-white/5 p-4 leading-relaxed">
          <ReactMarkdown>{report.synthesis_narrative}</ReactMarkdown>
        </div>
      </div>

      {/* Objections & Suggestions */}
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-medium text-red-400/80">Top Objections</h3>
          <ul className="space-y-1.5">
            {report.top_objections.slice(0, 5).map((o, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                <span className="mt-0.5 rounded bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-400">
                  {o.count}x
                </span>
                {o.objection}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium text-green-400/80">Top Suggestions</h3>
          <ul className="space-y-1.5">
            {report.top_suggestions.slice(0, 5).map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                <span className="mt-0.5 rounded bg-green-500/20 px-1.5 py-0.5 text-[10px] text-green-400">
                  {s.count}x
                </span>
                {s.suggestion}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/5 p-3 text-center">
      <p className="text-[10px] uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  );
}
