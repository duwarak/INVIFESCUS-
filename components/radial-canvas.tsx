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
import { BrainEdge, BrainNode, DEFAULT_RADIAL_OPTS } from "../lib/power-brain/types";
import { radialLayout } from "../lib/power-brain/radial-layout";
import { colorFor, softFor, SURFACE, TYPE_GLYPH } from "../lib/power-brain/colors";

interface Props {
  nodes: BrainNode[];
  edges: BrainEdge[];
  showEdges?: boolean;
  centerCount?: number;
  maxRing?: number;
  baseR?: number;
  ringGap?: number;
  onSelect?: (id: string) => void;
  selectedId?: string | null;
}

export default function RadialCanvas({
  nodes,
  edges,
  showEdges = false,
  centerCount,
  maxRing,
  baseR,
  ringGap,
  onSelect,
  selectedId,
}: Props) {
  const layout = useMemo(
    () =>
      radialLayout(nodes, edges, {
        centerCount: centerCount ?? DEFAULT_RADIAL_OPTS.centerCount,
        maxRing: maxRing ?? DEFAULT_RADIAL_OPTS.maxRing,
        baseR: baseR ?? DEFAULT_RADIAL_OPTS.baseR,
        ringGap: ringGap ?? DEFAULT_RADIAL_OPTS.ringGap,
      }),
    [nodes, edges, centerCount, maxRing, baseR, ringGap]
  );

  const flowNodes: Node[] = useMemo(() => {
    const ringGuides: Node[] = layout.rings.map((r) => {
      const d = r.radius * 2;
      return {
        id: `ring-${r.ring}`,
        position: { x: -r.radius, y: -r.radius },
        data: { label: "" },
        draggable: false,
        selectable: false,
        type: "default",
        style: {
          width: d,
          height: d,
          borderRadius: "50%",
          border: `1px dashed ${SURFACE.border}`,
          background: "transparent",
          pointerEvents: "none",
          zIndex: 0,
        },
        zIndex: 0,
      };
    });

    const dataNodes: Node[] = nodes.map((n) => {
      const pos = layout.positions.get(n.id) ?? { x: 0, y: 0 };
      const isCenter = layout.centerIds.has(n.id);
      const isSelected = selectedId === n.id;
      const size = isCenter ? 72 : 44;
      const color = colorFor(n.group);
      const soft = softFor(n.group);
      return {
        id: n.id,
        position: { x: pos.x - size / 2, y: pos.y - size / 2 },
        data: {
          label: (
            <div className="flex flex-col items-center justify-center w-full h-full">
              <div
                className="font-semibold leading-none"
                style={{ color, fontSize: isCenter ? 20 : 14 }}
              >
                {TYPE_GLYPH[n.type] ?? "◆"}
              </div>
              {isCenter && (
                <div
                  className="mt-1 text-[10px] font-semibold text-center px-1 truncate max-w-[68px]"
                  style={{ color: SURFACE.text }}
                  title={n.label}
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
          background: isCenter ? "#ffffff" : soft,
          border: `${isSelected ? 3 : isCenter ? 2 : 1.5}px solid ${color}`,
          boxShadow: isCenter
            ? `0 4px 18px ${color}33`
            : isSelected
              ? `0 0 0 4px ${color}22`
              : "0 1px 2px rgba(15,23,42,0.06)",
          padding: 0,
          color: SURFACE.text,
          zIndex: isCenter ? 10 : isSelected ? 8 : 5,
        },
        zIndex: isCenter ? 10 : isSelected ? 8 : 5,
      };
    });

    return [...ringGuides, ...dataNodes];
  }, [nodes, layout, selectedId]);

  const flowEdges: Edge[] = useMemo(() => {
    if (!showEdges && !selectedId) return [];
    const allow = (e: BrainEdge) => {
      if (showEdges) return true;
      return selectedId === e.source || selectedId === e.target;
    };
    return edges
      .filter((e) => layout.positions.has(e.source) && layout.positions.has(e.target))
      .filter(allow)
      .map((e, i) => ({
        id: `e-${i}`,
        source: e.source,
        target: e.target,
        type: "default",
        animated: e.type === "bridge",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#cbd5e1" },
        style: {
          stroke: e.type === "bridge" ? SURFACE.accent : "#cbd5e1",
          strokeWidth: e.type === "bridge" ? 1.4 : 0.8,
          opacity: e.type === "bridge" ? 0.7 : 0.45,
        },
      }));
  }, [edges, showEdges, selectedId, layout]);

  return (
    <div className="w-full h-full" style={{ background: SURFACE.panel }}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
        onNodeClick={(_, node) => {
          if (node.id.startsWith("ring-")) return;
          onSelect?.(node.id);
        }}
        onPaneClick={() => onSelect?.("")}
      >
        <Background color="#eef0f5" gap={28} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
