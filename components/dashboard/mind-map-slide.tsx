"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { MindMapNode } from "../../lib/dashboard/types";

interface Props {
  data: MindMapNode;
  width: number;
  height: number;
}

export default function MindMapSlide({ data, width, height }: Props) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current!);
    svg.selectAll("*").remove();

    const r = Math.min(width, height) / 2 - 60;
    const root = d3.hierarchy<MindMapNode>(data, (d) => d.children);

    const tree = d3.tree<MindMapNode>().size([2 * Math.PI, r]).separation((a, b) => (a.parent === b.parent ? 1 : 1.4) / a.depth);
    tree(root);

    const g = svg
      .attr("viewBox", `${-width / 2} ${-height / 2} ${width} ${height}`)
      .append("g");

    const link = d3
      .linkRadial<any, d3.HierarchyPointNode<MindMapNode>>()
      .angle((d) => (d as any).x)
      .radius((d) => (d as any).y);

    g.append("g")
      .attr("fill", "none")
      .attr("stroke-opacity", 0.45)
      .selectAll("path")
      .data(root.links())
      .join("path")
      .attr("d", link as any)
      .attr("stroke", (d) => (d.target as any).data.color ?? "#5b8dff")
      .attr("stroke-width", (d) => (d.target.depth === 1 ? 1.8 : 0.8))
      .attr("stroke-linecap", "round")
      .style("opacity", 0)
      .transition()
      .duration(800)
      .delay((_, i) => i * 18)
      .style("opacity", 1);

    const node = g
      .append("g")
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr(
        "transform",
        (d: any) =>
          `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0)`
      )
      .style("opacity", 0);

    node
      .append("circle")
      .attr("r", (d) => (d.depth === 0 ? 7 : d.depth === 1 ? 5 : 3))
      .attr("fill", (d: any) => d.data.color ?? "#5b8dff")
      .attr("stroke", "rgba(255,255,255,0.92)")
      .attr("stroke-width", 1.2);

    node
      .append("text")
      .attr("dy", "0.32em")
      .attr("x", (d: any) => (d.x < Math.PI ? 10 : -10))
      .attr("text-anchor", (d: any) => (d.x < Math.PI ? "start" : "end"))
      .attr(
        "transform",
        (d: any) => (d.x >= Math.PI ? "rotate(180)" : null)
      )
      .style("font", "11px var(--apple-font, system-ui)")
      .style("font-weight", (d) => (d.depth <= 1 ? 600 : 400))
      .style("fill", "rgba(245,245,247,0.92)")
      .style("paint-order", "stroke")
      .style("stroke", "rgba(7,8,15,0.85)")
      .style("stroke-width", "3px")
      .style("stroke-linecap", "round")
      .style("stroke-linejoin", "round")
      .text((d: any) => d.data.label);

    node
      .transition()
      .duration(700)
      .delay((_, i) => 200 + i * 24)
      .style("opacity", 1);
  }, [data, width, height]);

  return <svg ref={ref} width={width} height={height} />;
}
