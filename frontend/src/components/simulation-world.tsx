"use client";

/**
 * SimulationWorld — THE signature visual component.
 * A canvas-based 2D world where agent avatars move, pulse, and show speech bubbles.
 * Agents cluster by sentiment: buyers (green) drift right, rejectors (red) drift left.
 * Expert agents are larger and glow. Speech bubbles flash their first impressions.
 */

import { useCallback, useEffect, useRef } from "react";

import type { SimAgent } from "@/lib/types";

interface Props {
  agents: SimAgent[];
  width?: number;
  height?: number;
}

/** Particle for visual flair. */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

// Agent movement: smooth lerp toward target
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export default function SimulationWorld({ agents, width = 900, height = 600 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const agentsRef = useRef<SimAgent[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const hoveredRef = useRef<SimAgent | null>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  // Update agents ref when new agents arrive
  useEffect(() => {
    const newAgents = agents.slice(agentsRef.current.length);
    for (const agent of newAgents) {
      agentsRef.current.push({ ...agent });
      // Spawn particles on arrival
      for (let i = 0; i < 5; i++) {
        particlesRef.current.push({
          x: agent.x,
          y: agent.y,
          vx: (Math.random() - 0.5) * 3,
          vy: (Math.random() - 0.5) * 3,
          life: 1,
          maxLife: 1,
          color: agent.color,
          size: Math.random() * 3 + 1,
        });
      }
    }

    // Assign target positions based on sentiment clustering
    for (const a of agentsRef.current) {
      // Buyers cluster right, rejectors left
      const xBias = a.purchased ? width * 0.65 : width * 0.35;
      const yBias = a.sentiment > 0 ? height * 0.35 : height * 0.65;
      a.targetX = xBias + (Math.random() - 0.5) * width * 0.3;
      a.targetY = yBias + (Math.random() - 0.5) * height * 0.3;
    }
  }, [agents, width, height]);

  // Mouse tracking for hover tooltips
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      // Find hovered agent
      hoveredRef.current = null;
      for (const a of agentsRef.current) {
        const dx = mouseRef.current.x - a.x;
        const dy = mouseRef.current.y - a.y;
        if (dx * dx + dy * dy < (a.radius + 4) * (a.radius + 4)) {
          hoveredRef.current = a;
          break;
        }
      }
    },
    [],
  );

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      // Background grid
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Zone labels
      ctx.font = "12px Inter, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.1)";
      ctx.fillText("REJECT ZONE", 30, 30);
      ctx.fillText("BUY ZONE", width - 120, 30);

      // Divider line
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();
      ctx.setLineDash([]);

      // Update and draw particles
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Update and draw agents
      const now = Date.now();
      for (const a of agentsRef.current) {
        // Smooth movement toward target
        a.x = lerp(a.x, a.targetX, 0.008);
        a.y = lerp(a.y, a.targetY, 0.008);

        // Slight wander
        a.targetX += (Math.random() - 0.5) * 0.5;
        a.targetY += (Math.random() - 0.5) * 0.5;
        a.targetX = Math.max(a.radius, Math.min(width - a.radius, a.targetX));
        a.targetY = Math.max(a.radius + 20, Math.min(height - a.radius, a.targetY));

        // Glow for experts
        if (a.tier === "expert") {
          ctx.shadowColor = a.color;
          ctx.shadowBlur = 15;
        }

        // Agent circle
        ctx.fillStyle = a.color;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
        ctx.fill();

        // Pulse ring
        const pulse = Math.sin(now / 500 + a.x) * 0.3 + 0.7;
        ctx.strokeStyle = a.color;
        ctx.globalAlpha = pulse * 0.4;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;

        // Speech bubble — show briefly for recently added agents
        if (a.showBubble && a.bubbleTimer > 0) {
          a.bubbleTimer -= 16;
          if (a.bubbleTimer <= 0) {
            a.showBubble = false;
          } else {
            const bubbleAlpha = Math.min(1, a.bubbleTimer / 500);
            drawSpeechBubble(ctx, a.x, a.y - a.radius - 8, a.impression.slice(0, 40), a.color, bubbleAlpha);
          }
        }
      }

      // Hover tooltip
      const hovered = hoveredRef.current;
      if (hovered) {
        drawTooltip(ctx, mouseRef.current.x, mouseRef.current.y, hovered);
      }

      animFrameRef.current = requestAnimationFrame(draw);
    }

    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseMove={handleMouseMove}
      className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm"
      style={{ cursor: hoveredRef.current ? "pointer" : "default" }}
    />
  );
}

/** Draw a speech bubble above an agent. */
function drawSpeechBubble(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color: string, alpha: number) {
  ctx.globalAlpha = alpha;
  const padding = 6;
  ctx.font = "10px Inter, sans-serif";
  const metrics = ctx.measureText(text);
  const w = metrics.width + padding * 2;
  const h = 20;
  const bx = x - w / 2;
  const by = y - h;

  // Bubble background
  ctx.fillStyle = "rgba(0,0,0,0.8)";
  ctx.beginPath();
  ctx.roundRect(bx, by, w, h, 4);
  ctx.fill();

  // Bubble border
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(bx, by, w, h, 4);
  ctx.stroke();

  // Text
  ctx.fillStyle = "#fff";
  ctx.fillText(text, bx + padding, by + 14);
  ctx.globalAlpha = 1;
}

/** Draw hover tooltip with agent details. */
function drawTooltip(ctx: CanvasRenderingContext2D, mx: number, my: number, agent: SimAgent) {
  const lines = [
    `${agent.name}, ${agent.age}`,
    agent.occupation,
    `Tier: ${agent.tier.toUpperCase()}`,
    `Sentiment: ${agent.sentiment > 0 ? "+" : ""}${agent.sentiment.toFixed(2)}`,
    agent.purchased ? "WOULD BUY" : "WOULD NOT BUY",
  ];

  ctx.font = "11px Inter, sans-serif";
  const maxW = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const padding = 8;
  const lineH = 16;
  const w = maxW + padding * 2;
  const h = lines.length * lineH + padding * 2;
  let tx = mx + 12;
  let ty = my - h / 2;
  if (tx + w > 900) tx = mx - w - 12;
  if (ty < 0) ty = 0;

  ctx.fillStyle = "rgba(0,0,0,0.9)";
  ctx.beginPath();
  ctx.roundRect(tx, ty, w, h, 6);
  ctx.fill();

  ctx.strokeStyle = agent.color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(tx, ty, w, h, 6);
  ctx.stroke();

  ctx.fillStyle = "#fff";
  lines.forEach((line, i) => {
    if (i === lines.length - 1) {
      ctx.fillStyle = agent.purchased ? "#22c55e" : "#ef4444";
    }
    ctx.fillText(line, tx + padding, ty + padding + (i + 1) * lineH - 3);
  });
}
