"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { BrainEdge, BrainNode } from "../lib/power-brain/types";
import { forceLayout } from "../lib/power-brain/force-layout";
import { colorFor, SURFACE } from "../lib/power-brain/colors";

interface Props {
  nodes: BrainNode[];
  edges: BrainEdge[];
  onSelect?: (id: string) => void;
  selectedId?: string | null;
  showLabels?: boolean;
  iterations?: number;
}

export default function ForceCanvas({
  nodes,
  edges,
  onSelect,
  selectedId,
  showLabels = true,
  iterations = 220,
}: Props) {
  const positions = useMemo(
    () => forceLayout(nodes, edges, { iterations }),
    [nodes, edges, iterations]
  );

  const neighborSet = useMemo(() => {
    if (!selectedId) return new Set<string>();
    const s = new Set<string>([selectedId]);
    for (const e of edges) {
      if (e.source === selectedId) s.add(e.target);
      if (e.target === selectedId) s.add(e.source);
    }
    return s;
  }, [edges, selectedId]);

  const flowNodes: Node[] = useMemo(() => {
    return nodes.map((n) => {
      const p = positions.get(n.id) ?? { x: 0, y: 0 };
      const color = colorFor(n.group);
      const isSelected = selectedId === n.id;
      const dim = selectedId ? !neighborSet.has(n.id) : false;
      const size = 12 + Math.round(n.importance * 14);
      return {
        id: n.id,
        position: { x: p.x - size / 2, y: p.y - size / 2 },
        data: {
          label: (
            <div className="relative flex items-center justify-center w-full h-full">
              {showLabels && (
                <div
                  className="absolute whitespace-nowrap pointer-events-none"
                  style={{
                    top: size + 2,
                    fontSize: 9,
                    color: SURFACE.textMuted,
                    opacity: dim ? 0.25 : 0.9,
                    fontWeight: isSelected ? 700 : 400,
                  }}
                >
                  {n.label}
                </div>
              )}
            </div>
          ),
          domain: n.group,
        },
        draggable: false,
        type: "default",
        style: {
          width: size,
          height: size,
          borderRadius: "50%",
          background: color,
          border: isSelected ? `2px solid ${SURFACE.text}` : `1px solid #ffffff`,
          opacity: dim ? 0.18 : 1,
          padding: 0,
          color: SURFACE.text,
          boxShadow: isSelected ? "0 0 0 6px rgba(91,108,255,0.18)" : "none",
          zIndex: isSelected ? 10 : 5,
        },
        zIndex: isSelected ? 10 : 5,
      };
    });
  }, [nodes, positions, selectedId, neighborSet, showLabels]);

  const flowEdges: Edge[] = useMemo(() => {
    return edges
      .filter((e) => positions.has(e.source) && positions.has(e.target))
      .map((e, i) => {
        const focus =
          selectedId && (e.source === selectedId || e.target === selectedId);
        const dim = selectedId && !focus;
        return {
          id: `fe-${i}`,
          source: e.source,
          target: e.target,
          type: "default",
          style: {
            stroke: focus ? SURFACE.accent : "#a8b1c2",
            strokeWidth: focus ? 1.2 : 0.4,
            opacity: dim ? 0.08 : focus ? 0.85 : 0.32,
          },
        };
      });
  }, [edges, positions, selectedId]);

  return (
    <div className="w-full h-full" style={{ background: SURFACE.panel }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.05}
        maxZoom={3}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, node) => onSelect?.(node.id)}
        onPaneClick={() => onSelect?.("")}
      >
        <Background color="#eef0f5" gap={36} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
