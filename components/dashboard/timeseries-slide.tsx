"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { TimeSeriesRow } from "../../lib/dashboard/types";

interface Props {
  rows: TimeSeriesRow[];
  width: number;
  height: number;
}

export default function TimeSeriesSlide({ rows, width, height }: Props) {
  const ref = useRef<SVGSVGElement | null>(null);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setFrame((f) => (f + 1) % rows.length);
    }, 900);
    return () => clearInterval(id);
  }, [playing, rows.length]);

  useEffect(() => {
    const row = rows[frame];
    if (!row) return;
    const svg = d3.select(ref.current!);
    svg.selectAll("*").remove();

    const margin = { top: 30, right: 120, bottom: 30, left: 14 };
    const w = width - margin.left - margin.right;
    const h = height - margin.top - margin.bottom;

    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    g.append("text")
      .attr("x", w + 110)
      .attr("y", h - 4)
      .attr("text-anchor", "end")
      .style("font", "600 44px var(--apple-font, system-ui)")
      .style("fill", "rgba(245,245,247,0.22)")
      .style("letter-spacing", "-0.02em")
      .text(row.date.slice(5));

    const items = [...row.items].sort((a, b) => b.value - a.value);
    const max = d3.max(items, (d) => d.value) ?? 1;
    const x = d3.scaleLinear().domain([0, max]).range([0, w]);
    const y = d3
      .scaleBand<string>()
      .domain(items.map((d) => d.name))
      .range([0, h])
      .padding(0.32);

    const bars = g
      .selectAll("g.bar")
      .data(items, (d: any) => d.name)
      .join("g")
      .attr("class", "bar")
      .attr("transform", (d) => `translate(0,${y(d.name)!})`);

    bars
      .append("rect")
      .attr("rx", 8)
      .attr("ry", 8)
      .attr("height", y.bandwidth())
      .attr("fill", (d) => d.color)
      .attr("width", 0)
      .transition()
      .duration(750)
      .ease(d3.easeCubicOut)
      .attr("width", (d) => x(d.value));

    bars
      .append("text")
      .attr("x", -8)
      .attr("y", y.bandwidth() / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .style("font", "600 11px var(--apple-font, system-ui)")
      .style("fill", "rgba(245,245,247,0.7)")
      .text((d) => d.name);

    bars
      .append("text")
      .attr("x", (d) => x(d.value) + 10)
      .attr("y", y.bandwidth() / 2)
      .attr("dominant-baseline", "middle")
      .style("font", "600 12px var(--apple-font, system-ui)")
      .style("fill", "rgba(245,245,247,0.9)")
      .text((d) => d.value);
  }, [frame, rows, width, height]);

  return (
    <div className="relative w-full h-full">
      <svg ref={ref} width={width} height={height} />
      <div className="absolute top-3 right-3 flex items-center gap-2">
        <button
          onClick={() => setPlaying((p) => !p)}
          className="apple-button-ghost"
          style={{ padding: "4px 10px", fontSize: 11 }}
        >
          {playing ? "❚❚ pause" : "▶ play"}
        </button>
        <span className="apple-pill">{rows[frame]?.date}</span>
      </div>
      <div className="absolute bottom-3 left-3 right-3 flex items-center gap-1">
        {rows.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setFrame(i);
              setPlaying(false);
            }}
            className="flex-1 h-1 rounded-full transition-all"
            style={{
              background: i <= frame ? "rgba(91,141,255,0.85)" : "rgba(255,255,255,0.1)",
              transform: i === frame ? "scaleY(2.5)" : "scaleY(1)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
