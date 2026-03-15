"use client";

/** Custom hook for WebSocket chat with agent personas. */

import { useCallback, useEffect, useRef, useState } from "react";

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";

export interface ChatMessage {
  role: "user" | "agent";
  content: string;
}

export function useAgentChat(simulationId: number, personaId: number | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const streamBufferRef = useRef("");

  useEffect(() => {
    if (!personaId) return;

    const ws = new WebSocket(`${WS_BASE}/api/simulations/${simulationId}/agents/${personaId}/chat`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "token") {
        streamBufferRef.current += data.content;
        // Update last agent message with streaming content
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "agent") {
            return [...prev.slice(0, -1), { role: "agent", content: streamBufferRef.current }];
          }
          return [...prev, { role: "agent", content: streamBufferRef.current }];
        });
      }

      if (data.type === "complete") {
        streamBufferRef.current = "";
        setStreaming(false);
        // Replace with final content
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.role === "agent") {
            return [...prev.slice(0, -1), { role: "agent", content: data.content }];
          }
          return [...prev, { role: "agent", content: data.content }];
        });
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [simulationId, personaId]);

  const sendMessage = useCallback(
    (message: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      setMessages((prev) => [...prev, { role: "user", content: message }]);
      setStreaming(true);
      streamBufferRef.current = "";
      wsRef.current.send(JSON.stringify({ message }));
    },
    [],
  );

  // Reset when persona changes
  useEffect(() => {
    setMessages([]);
    streamBufferRef.current = "";
  }, [personaId]);

  return { messages, streaming, connected, sendMessage };
}
