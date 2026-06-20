"use client";

import { useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Node,
  Edge,
  MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { BrainEdge, BrainNode } from "../lib/power-brain/types";
import { layeredLayout } from "../lib/power-brain/layered-layout";
import { colorFor, softFor, SURFACE } from "../lib/power-brain/colors";

interface Props {
  nodes: BrainNode[];
  edges: BrainEdge[];
  onSelect?: (id: string) => void;
  selectedId?: string | null;
  showSimilarity?: boolean;
}

export default function GenealogyCanvas({
  nodes,
  edges,
  onSelect,
  selectedId,
  showSimilarity = false,
}: Props) {
  const layout = useMemo(
    () => layeredLayout(nodes, edges, { layerGap: 160, nodeGap: 150 }),
    [nodes, edges]
  );

  const flowNodes: Node[] = useMemo(() => {
    return nodes.map((n) => {
      const p = layout.positions.get(n.id) ?? { x: 0, y: 0 };
      const color = colorFor(n.group);
      const soft = softFor(n.group);
      const isSelected = selectedId === n.id;
      const w = 130;
      const h = 50;
      return {
        id: n.id,
        position: { x: p.x - w / 2, y: p.y - h / 2 },
        data: {
          label: (
            <div className="flex flex-col items-start justify-center w-full h-full px-3">
              <div
                className="text-[11px] font-semibold truncate w-full"
                style={{ color: SURFACE.text }}
                title={n.label}
              >
                {n.label}
              </div>
              <div
                className="text-[9px] uppercase tracking-wider mt-0.5"
                style={{ color }}
              >
                {n.group}
              </div>
            </div>
          ),
          domain: n.group,
        },
        draggable: false,
        type: "default",
        style: {
          width: w,
          height: h,
          borderRadius: 10,
          background: soft,
          border: `${isSelected ? 2 : 1}px solid ${color}`,
          padding: 0,
          color: SURFACE.text,
          boxShadow: isSelected
            ? `0 0 0 4px ${color}22`
            : "0 1px 2px rgba(15,23,42,0.05)",
          zIndex: isSelected ? 10 : 5,
        },
        zIndex: isSelected ? 10 : 5,
      };
    });
  }, [nodes, layout, selectedId]);

  const flowEdges: Edge[] = useMemo(() => {
    return edges
      .filter((e) => layout.positions.has(e.source) && layout.positions.has(e.target))
      .filter(
        (e) =>
          showSimilarity || (e.type !== "similar" && e.type !== "bridge")
      )
      .map((e, i) => {
        const isLat = e.type === "similar" || e.type === "bridge";
        const focus =
          selectedId && (e.source === selectedId || e.target === selectedId);
        return {
          id: `ge-${i}`,
          source: e.source,
          target: e.target,
          type: "smoothstep",
          animated: isLat,
          markerEnd: !isLat
            ? { type: MarkerType.ArrowClosed, color: "#94a3b8" }
            : undefined,
          style: {
            stroke: isLat ? "#a78bfa" : "#94a3b8",
            strokeWidth: focus ? 1.6 : isLat ? 0.8 : 1,
            opacity: focus ? 0.9 : isLat ? 0.45 : 0.5,
            strokeDasharray: isLat ? "4 4" : undefined,
          },
        };
      });
  }, [edges, layout, selectedId, showSimilarity]);

  return (
    <div className="w-full h-full" style={{ background: SURFACE.panel }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.1}
        maxZoom={2.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, node) => onSelect?.(node.id)}
        onPaneClick={() => onSelect?.("")}
      >
        <Background color="#eef0f5" gap={24} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
