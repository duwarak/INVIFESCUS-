"use client";

import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { SpatialPoint } from "../../lib/dashboard/types";

interface Props {
  points: SpatialPoint[];
  width: number;
  height: number;
}

export default function SpatialSlide({ points, width, height }: Props) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = d3.select(ref.current!);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const projection = d3
      .geoNaturalEarth1()
      .scale(Math.min(width, height) * 0.32)
      .translate([width / 2, height / 2 + 18]);
    const path = d3.geoPath(projection);

    const defs = svg.append("defs");
    const grad = defs
      .append("radialGradient")
      .attr("id", "globeGrad")
      .attr("cx", "30%")
      .attr("cy", "30%");
    grad.append("stop").attr("offset", "0%").attr("stop-color", "rgba(91,141,255,0.18)");
    grad.append("stop").attr("offset", "100%").attr("stop-color", "rgba(15,15,30,0.06)");

    const sphere: any = { type: "Sphere" };
    svg
      .append("path")
      .datum(sphere)
      .attr("d", path)
      .attr("fill", "url(#globeGrad)")
      .attr("stroke", "rgba(255,255,255,0.18)")
      .attr("stroke-width", 1);

    const graticule = d3.geoGraticule10();
    svg
      .append("path")
      .datum(graticule as any)
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "rgba(255,255,255,0.06)")
      .attr("stroke-width", 0.5);

    const projected = points
      .map((p) => {
        const xy = projection([p.lng, p.lat]);
        return xy ? { ...p, x: xy[0], y: xy[1] } : null;
      })
      .filter(Boolean) as (SpatialPoint & { x: number; y: number })[];

    const arcsG = svg.append("g");
    const center = projected[0];
    if (center) {
      for (let i = 1; i < Math.min(projected.length, 7); i++) {
        const t = projected[i];
        arcsG
          .append("path")
          .attr(
            "d",
            `M${center.x},${center.y} Q${(center.x + t.x) / 2},${Math.min(center.y, t.y) - 60} ${t.x},${t.y}`
          )
          .attr("fill", "none")
          .attr("stroke", t.color)
          .attr("stroke-opacity", 0)
          .attr("stroke-width", 1.2)
          .transition()
          .delay(400 + i * 80)
          .duration(800)
          .attr("stroke-opacity", 0.45);
      }
    }

    const pts = svg
      .append("g")
      .selectAll("circle")
      .data(projected)
      .join("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", 0)
      .attr("fill", (d) => d.color)
      .attr("stroke", "rgba(255,255,255,0.9)")
      .attr("stroke-width", 1);

    pts
      .transition()
      .duration(600)
      .delay((_, i) => i * 35)
      .attr("r", (d) => 3 + Math.sqrt(d.weight) * 0.85);

    pts.each(function (d, i) {
      if (i < 6) {
        d3.select(this.parentNode as any)
          .append("text")
          .attr("x", d.x + 6)
          .attr("y", d.y - 8)
          .style("font", "600 9px var(--apple-font, system-ui)")
          .style("fill", "rgba(245,245,247,0.78)")
          .style("paint-order", "stroke")
          .style("stroke", "rgba(7,8,15,0.85)")
          .style("stroke-width", "3px")
          .text(d.label);
      }
    });
  }, [points, width, height]);

  return <svg ref={ref} width={width} height={height} />;
}
