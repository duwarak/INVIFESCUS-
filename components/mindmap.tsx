"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const DOMAIN_COLORS: Record<string, string> = {
  "Computer Science": "#7c5cfc",
  Music: "#fb7185",
  Business: "#fbbf24",
  Gymnastics: "#2dd4bf",
  Psychology: "#a78bfa",
  default: "#6b7280",
};

function getDomainColor(domain: string): string {
  return DOMAIN_COLORS[domain] || DOMAIN_COLORS.default;
}

interface MapNode {
  id: string;
  name: string;
  domain: string;
  type: string;
}

interface MapEdge {
  source: string;
  target: string;
  type: string;
  label?: string;
}

export default function MindMap() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);

  const loadGraph = useCallback(async () => {
    try {
      const res = await fetch("/api/ingest", { method: "GET" }).catch(() => null);

      // For demo: use sample data if API not available
      const sampleNodes: MapNode[] = [
        { id: "1", name: "Decomposition", domain: "Computer Science", type: "technique" },
        { id: "2", name: "Audience adjustment", domain: "Business", type: "technique" },
        { id: "3", name: "Repetition mastery", domain: "Music", type: "insight" },
        { id: "4", name: "Form breakdown", domain: "Gymnastics", type: "technique" },
        { id: "5", name: "Systems thinking", domain: "Psychology", type: "insight" },
      ];

      const sampleEdges: MapEdge[] = [
        { source: "1", target: "5", type: "BRIDGE", label: "Breaking complex into parts" },
        { source: "2", target: "5", type: "BRIDGE", label: "Layering for audience" },
        { source: "3", target: "5", type: "BRIDGE", label: "Hidden structure in repetition" },
        { source: "4", target: "5", type: "BRIDGE", label: "Structural form analysis" },
      ];

      const flowNodes: Node[] = sampleNodes.map((n, i) => ({
        id: n.id,
        position: {
          x: n.id === "5" ? 300 : 100 + (i % 2) * 400,
          y: n.id === "5" ? 250 : 50 + Math.floor(i / 2) * 180,
        },
        data: {
          label: (
            <div className="text-center">
              <div className="font-medium text-sm">{n.name}</div>
              <div className="text-xs mt-1 opacity-60">{n.domain}</div>
            </div>
          ),
        },
        style: {
          background: "#1a1a24",
          border: `2px solid ${getDomainColor(n.domain)}`,
          borderRadius: "10px",
          padding: "12px 16px",
          color: "#e2e2e8",
          minWidth: 140,
        },
      }));

      const flowEdges: Edge[] = sampleEdges.map((e, i) => ({
        id: `e-${i}`,
        source: e.source,
        target: e.target,
        label: e.label,
        type: "default",
        animated: e.type === "BRIDGE",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#4a4a6a" },
        style: {
          stroke: e.type === "BRIDGE" ? "#7c5cfc" : "#4a4a6a",
          strokeWidth: 1.5,
        },
        labelStyle: {
          fill: "#8888a0",
          fontSize: 11,
        },
      }));

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (err) {
      console.error("Failed to load graph:", err);
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-polymath-muted">
        Loading knowledge map...
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#2a2a3a" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={(n) => getDomainColor((n.data?.domain as string) || "default")}
          style={{ background: "#1a1a24" }}
        />
      </ReactFlow>
    </div>
  );
}
