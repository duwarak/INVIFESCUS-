"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { ForceLink, ForceNode } from "../../lib/dashboard/types";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

interface Props {
  nodes: ForceNode[];
  links: ForceLink[];
  width: number;
  height: number;
}

export default function GenreMapSlide({ nodes, links, width, height }: Props) {
  const data = useMemo(() => ({ nodes, links }), [nodes, links]);
  return (
    <ForceGraph2D
      graphData={data as any}
      width={width}
      height={height}
      backgroundColor="rgba(0,0,0,0)"
      cooldownTicks={Infinity as any}
      warmupTicks={80}
      d3AlphaDecay={0.012}
      d3VelocityDecay={0.34}
      linkColor={() => "rgba(255,255,255,0.18)"}
      linkWidth={0.5}
      nodeCanvasObject={(n: any, ctx: CanvasRenderingContext2D, scale: number) => {
        const r = Math.max(2, n.val);
        ctx.save();
        ctx.shadowColor = n.color;
        ctx.shadowBlur = 14;
        ctx.fillStyle = n.color;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        if (scale > 1.2) {
          ctx.save();
          ctx.font = `${9 / scale}px var(--apple-font, system-ui)`;
          ctx.fillStyle = "rgba(245,245,247,0.7)";
          ctx.textAlign = "center";
          ctx.fillText(n.label.slice(0, 22), n.x, n.y + r + 9 / scale);
          ctx.restore();
        }
      }}
      nodePointerAreaPaint={(n: any, color: string, ctx: CanvasRenderingContext2D) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(n.x, n.y, Math.max(3, n.val + 2), 0, Math.PI * 2);
        ctx.fill();
      }}
    />
  );
}
