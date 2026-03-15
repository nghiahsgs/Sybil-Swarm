"use client";

/**
 * StatsPanel — Animated key metrics cards.
 * Numbers count up as data streams in.
 */

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

import type { SimAgent } from "@/lib/types";

interface Props {
  agents: SimAgent[];
  totalAgents: number;
  isComplete: boolean;
  overallScore: number;
  conversionRate: number;
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => `${Math.round(v)}${suffix}`);

  useEffect(() => {
    const controls = animate(mv, value, { duration: 1.5, ease: "easeOut" });
    return controls.stop;
  }, [value, mv]);

  return <motion.span>{rounded}</motion.span>;
}

export default function StatsPanel({ agents, totalAgents, isComplete, overallScore, conversionRate }: Props) {
  const completed = agents.length;
  const buyers = agents.filter((a) => a.purchased).length;
  const liveConversion = completed > 0 ? (buyers / completed) * 100 : 0;
  const avgSentiment = completed > 0 ? agents.reduce((s, a) => s + a.sentiment, 0) / completed : 0;

  const displayConversion = isComplete ? conversionRate : liveConversion;
  const displayScore = isComplete ? overallScore : Math.round(liveConversion * 0.4 + (avgSentiment + 1) * 30);

  const stats = [
    {
      label: "Agents Complete",
      value: completed,
      total: totalAgents,
      color: "text-blue-400",
    },
    {
      label: "Conversion Rate",
      value: displayConversion,
      suffix: "%",
      color: displayConversion > 30 ? "text-green-400" : displayConversion > 15 ? "text-yellow-400" : "text-red-400",
    },
    {
      label: "Overall Score",
      value: displayScore,
      suffix: "/100",
      color: displayScore > 60 ? "text-green-400" : displayScore > 30 ? "text-yellow-400" : "text-red-400",
    },
    {
      label: "Avg Sentiment",
      value: Math.round((avgSentiment + 1) * 50),
      suffix: "%",
      color: avgSentiment > 0.2 ? "text-green-400" : avgSentiment > -0.2 ? "text-yellow-400" : "text-red-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-sm">
          <p className="text-[11px] font-medium uppercase tracking-wider text-white/40">{stat.label}</p>
          <p className={`mt-1 text-2xl font-bold ${stat.color}`}>
            <AnimatedNumber value={stat.value} suffix={stat.suffix || ""} />
            {stat.total && <span className="text-sm text-white/30">/{stat.total}</span>}
          </p>
        </div>
      ))}
    </div>
  );
}
