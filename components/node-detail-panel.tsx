"use client";

import { useEffect, useState } from "react";
import { BrainNode, ExplainResponse } from "../lib/power-brain/types";
import { colorFor, SURFACE, TYPE_GLYPH } from "../lib/power-brain/colors";

interface Props {
  node: BrainNode | null;
  graphScope: "live" | "memory" | "genealogy";
  onClose: () => void;
}

export default function NodeDetailPanel({ node, graphScope, onClose }: Props) {
  const [data, setData] = useState<ExplainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [svg, setSvg] = useState<string | null>(null);
  const [svgLoading, setSvgLoading] = useState(false);

  useEffect(() => {
    setData(null);
    setSvg(null);
    if (!node) return;
    setLoading(true);
    fetch(`/api/power-brain/explain?id=${encodeURIComponent(node.id)}&scope=${graphScope}`)
      .then((r) => r.json())
      .then((j) => setData(j))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [node, graphScope]);

  if (!node) {
    return (
      <aside
        className="w-80 shrink-0 rounded-xl border p-5 flex flex-col gap-2"
        style={{
          background: SURFACE.panel,
          borderColor: SURFACE.border,
          color: SURFACE.textMuted,
        }}
      >
        <div className="text-xs uppercase tracking-wider font-medium">
          Inspector
        </div>
        <div className="text-sm">
          Click any node to see why it's connected — answered by MiroFish over
          MemPalace, with optional infographic render.
        </div>
        <div className="mt-4 text-xs flex flex-col gap-1.5">
          <div>◆ concept · ▲ method · ● event</div>
          <div>★ decision · ☺ person</div>
        </div>
      </aside>
    );
  }

  const color = colorFor(node.group);

  const onGenerateInfographic = async () => {
    setSvgLoading(true);
    try {
      const res = await fetch("/api/power-brain/infographic", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nodeId: node.id,
          label: node.label,
          group: node.group,
          neighbors: data?.neighbors.slice(0, 6).map((n) => ({
            label: n.node.label,
            weight: n.weight,
            relation: n.relation,
          })) ?? [],
        }),
      });
      const text = await res.text();
      setSvg(text);
    } finally {
      setSvgLoading(false);
    }
  };

  return (
    <aside
      className="w-80 shrink-0 rounded-xl border flex flex-col overflow-hidden"
      style={{ background: SURFACE.panel, borderColor: SURFACE.border }}
    >
      <header
        className="px-5 py-4 border-b"
        style={{ borderColor: SURFACE.border }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full grid place-items-center text-sm font-bold"
              style={{ background: `${color}22`, color }}
            >
              {TYPE_GLYPH[node.type] ?? "◆"}
            </div>
            <div>
              <div
                className="text-sm font-semibold leading-tight"
                style={{ color: SURFACE.text }}
              >
                {node.label}
              </div>
              <div
                className="text-[10px] uppercase tracking-wider mt-0.5"
                style={{ color }}
              >
                {node.group} · {node.type}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs"
            style={{ color: SURFACE.textMuted }}
          >
            ✕
          </button>
        </div>
        <div className="flex gap-2 mt-3 text-[10px]">
          <span
            className="px-2 py-0.5 rounded-full"
            style={{
              background: SURFACE.accentSoft,
              color: SURFACE.accent,
            }}
          >
            score {node.score.toFixed(2)}
          </span>
          <span
            className="px-2 py-0.5 rounded-full"
            style={{
              background: SURFACE.accentSoft,
              color: SURFACE.accent,
            }}
          >
            importance {node.importance.toFixed(2)}
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-5">
        <section>
          <div
            className="text-[10px] uppercase tracking-wider font-semibold mb-2"
            style={{ color: SURFACE.textMuted }}
          >
            Why it's connected
          </div>
          {loading ? (
            <div className="text-xs" style={{ color: SURFACE.textMuted }}>
              MiroFish is reading MemPalace…
            </div>
          ) : data ? (
            <p
              className="text-xs leading-relaxed"
              style={{ color: SURFACE.text }}
            >
              {data.narrative}
            </p>
          ) : (
            <div className="text-xs" style={{ color: SURFACE.textMuted }}>
              No explanation yet.
            </div>
          )}
        </section>

        {data && data.neighbors.length > 0 && (
          <section>
            <div
              className="text-[10px] uppercase tracking-wider font-semibold mb-2"
              style={{ color: SURFACE.textMuted }}
            >
              Closest neighbors
            </div>
            <div className="flex flex-col gap-1.5">
              {data.neighbors.slice(0, 8).map((n) => {
                const c = colorFor(n.node.group);
                return (
                  <div
                    key={n.node.id}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: c }}
                    />
                    <span
                      className="flex-1 truncate"
                      style={{ color: SURFACE.text }}
                    >
                      {n.node.label}
                    </span>
                    <span
                      className="text-[10px]"
                      style={{ color: SURFACE.textMuted }}
                    >
                      {n.relation} · {(n.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {data && data.sources.length > 0 && (
          <section>
            <div
              className="text-[10px] uppercase tracking-wider font-semibold mb-2"
              style={{ color: SURFACE.textMuted }}
            >
              Sources
            </div>
            <div className="flex flex-wrap gap-1.5">
              {data.sources.map((s, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded-full border"
                  style={{
                    borderColor: SURFACE.border,
                    color: SURFACE.textMuted,
                  }}
                >
                  {s.kind}: {s.ref}
                </span>
              ))}
            </div>
          </section>
        )}

        <section>
          <button
            onClick={onGenerateInfographic}
            disabled={svgLoading}
            className="w-full text-xs font-semibold rounded-lg py-2.5 transition-colors"
            style={{
              background: SURFACE.accent,
              color: "#ffffff",
              opacity: svgLoading ? 0.6 : 1,
            }}
          >
            {svgLoading ? "Rendering…" : "Generate infographic"}
          </button>
          {svg && (
            <div
              className="mt-3 rounded-lg border overflow-hidden bg-white"
              style={{ borderColor: SURFACE.border }}
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          )}
        </section>
      </div>
    </aside>
  );
}
