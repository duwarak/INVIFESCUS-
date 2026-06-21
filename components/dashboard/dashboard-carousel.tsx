"use client";

import { useEffect, useRef, useState } from "react";
import { DashboardData } from "../../lib/dashboard/types";
import MindMapSlide from "./mind-map-slide";
import GenreMapSlide from "./genre-map-slide";
import TimeSeriesSlide from "./timeseries-slide";
import SpatialSlide from "./spatial-slide";

interface Props {
  data: DashboardData;
}

const SLIDES = [
  { key: "mindmap", title: "Mind Map", subtitle: "Hierarchy from your live concepts (d3 radial · Kicu/mind-map pattern)" },
  { key: "force", title: "Knowledge Atlas", subtitle: "Force-directed atlas of all bridges (react-force-graph · graphs_d3 reference)" },
  { key: "timeseries", title: "Domain Pulse", subtitle: "14-day rolling activity per domain (sjvisualizer racing-bar pattern)" },
  { key: "spatial", title: "Global Pods", subtitle: "Community pods on the natural-earth globe (d3-geo + deck.gl pattern)" },
] as const;

export default function DashboardCarousel({ data }: Props) {
  const [idx, setIdx] = useState(0);
  const [auto, setAuto] = useState(true);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 800, h: 460 });

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const resize = () => setSize({ w: wrap.clientWidth, h: wrap.clientHeight });
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 11000);
    return () => clearInterval(id);
  }, [auto]);

  const slide = SLIDES[idx];

  return (
    <div className="apple-card-strong rounded-[28px] p-1 overflow-hidden">
      <div className="px-6 pt-5 pb-3 flex items-end justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--apple-text-tertiary)" }}>
            Slide {idx + 1} of {SLIDES.length}
          </div>
          <h3 className="apple-display text-[26px] mt-1" style={{ color: "var(--apple-text)" }}>
            {slide.title}
          </h3>
          <p className="text-[13px] mt-1" style={{ color: "var(--apple-text-secondary)" }}>
            {slide.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setAuto((a) => !a)} className="apple-button-ghost" style={{ padding: "6px 12px", fontSize: 11 }}>
            {auto ? "❚❚ Pause" : "▶ Auto"}
          </button>
          <button
            onClick={() => setIdx((i) => (i - 1 + SLIDES.length) % SLIDES.length)}
            className="apple-button-ghost"
            style={{ padding: "6px 12px", fontSize: 11 }}
          >
            ←
          </button>
          <button
            onClick={() => setIdx((i) => (i + 1) % SLIDES.length)}
            className="apple-button-ghost"
            style={{ padding: "6px 12px", fontSize: 11 }}
          >
            →
          </button>
        </div>
      </div>

      <div className="apple-divider" />

      <div
        ref={wrapRef}
        className="relative w-full"
        style={{
          height: 520,
          background:
            "radial-gradient(700px 400px at 20% 0%, rgba(91,141,255,0.10), transparent), radial-gradient(700px 400px at 100% 100%, rgba(255,102,196,0.06), transparent)",
        }}
      >
        <div key={slide.key} className="absolute inset-0 apple-fade-in">
          {slide.key === "mindmap" && <MindMapSlide data={data.mindMap} width={size.w} height={size.h} />}
          {slide.key === "force" && (
            <GenreMapSlide nodes={data.force.nodes} links={data.force.links} width={size.w} height={size.h} />
          )}
          {slide.key === "timeseries" && (
            <TimeSeriesSlide rows={data.timeSeries} width={size.w} height={size.h} />
          )}
          {slide.key === "spatial" && (
            <SpatialSlide points={data.spatial} width={size.w} height={size.h} />
          )}
        </div>
      </div>

      <div className="px-6 py-4 flex items-center justify-between">
        <div className="apple-slide-dots flex items-center gap-2">
          {SLIDES.map((s, i) => (
            <button key={s.key} data-active={i === idx ? "1" : "0"} onClick={() => setIdx(i)} aria-label={s.title} />
          ))}
        </div>
        <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--apple-text-tertiary)" }}>
          <span>Auto-advance · 11s</span>
          <span>·</span>
          <span>Powered by d3 · vega · react-force-graph · maplibre</span>
        </div>
      </div>
    </div>
  );
}
