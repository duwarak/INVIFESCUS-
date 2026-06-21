"use client";

import { useEffect, useState } from "react";
import IngestForm from "@/components/ingest-form";

interface FeedItem {
  inputId: string;
  type: string;
  content: string;
  sourceContext: string;
  timestamp: string;
  emotion: string;
  stickiness: number;
  concept: {
    topic: string;
    subtopic: string;
    domain: string;
    tags: string[];
    confidence: number;
  } | null;
}

const TYPE_GLYPH: Record<string, string> = {
  text: "✎", image: "🖼", audio: "🎙", screenshot: "📸",
  class_note: "📓", journal: "📔", drawing: "✏️", voice_note: "🎤",
};
const EMOTION_COLOR: Record<string, string> = {
  neutral: "rgba(255,255,255,0.4)",
  stressed: "#ff453a",
  excited: "#ff66c4",
  anxious: "#ff9f0a",
  calm: "#30d158",
  overwhelmed: "#ef476f",
};
const DOMAIN_COLOR: Record<string, string> = {
  academic: "#5b8dff",
  professional: "#9b6dff",
  personal: "#30d158",
  creative: "#ff66c4",
  health: "#06b6a8",
  financial: "#f4a02e",
  social: "#0ea5e9",
};

function timeAgo(iso: string) {
  const t = new Date(iso).getTime();
  const ms = Date.now() - t;
  const m = Math.round(ms / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

export default function IngestPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/feed/recent?limit=12")
      .then((r) => r.json())
      .then((j) => {
        setItems(j.items as FeedItem[]);
        setTotal(j.total);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter ? items.filter((x) => x.concept?.domain === filter) : items;
  const domainsPresent = Array.from(new Set(items.map((x) => x.concept?.domain).filter(Boolean) as string[]));

  return (
    <div className="apple-mesh-bg apple-font -m-6 p-8 min-h-[calc(100vh-3rem)]" style={{ color: "var(--apple-text)" }}>
      <header className="apple-fade-in mb-6">
        <div className="apple-pill mb-3">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--apple-success)" }} />
          Feed Input · training-schema dataset · {total} items indexed
        </div>
        <h1 className="apple-display" style={{ fontSize: 36, lineHeight: 1.05 }}>
          Feed your brain.
        </h1>
        <p className="text-[14px] mt-2 max-w-3xl" style={{ color: "var(--apple-text-secondary)" }}>
          Drop in text, photos, voice, screenshots, sketches, or class notes. Each item is enriched
          with a concept, domain, tag set, stickiness score, and emotion signal — exactly the
          schema the rest of the brain trains on.
        </p>
      </header>

      <section className="grid grid-cols-12 gap-5 apple-fade-in">
        <div className="col-span-12 lg:col-span-7 apple-card-strong rounded-[24px] p-6">
          <div className="text-[10px] uppercase tracking-[0.22em] mb-3" style={{ color: "var(--apple-text-tertiary)" }}>
            New entry
          </div>
          <IngestForm />
        </div>

        <aside className="col-span-12 lg:col-span-5 flex flex-col gap-4">
          <div className="apple-card-strong rounded-[24px] p-5">
            <div className="text-[10px] uppercase tracking-[0.22em] mb-2" style={{ color: "var(--apple-text-tertiary)" }}>
              Schema-trained pipeline
            </div>
            <p className="text-[12px] leading-relaxed" style={{ color: "var(--apple-text-secondary)" }}>
              Every entry flows: <strong style={{ color: "var(--apple-accent)" }}>input_item</strong> →
              <strong style={{ color: "#9b6dff" }}> concept_extraction</strong> →
              <strong style={{ color: "#30d158" }}> transfer_link</strong> →
              <strong style={{ color: "#ff9f0a" }}> priority_task</strong> →
              <strong style={{ color: "#ff66c4" }}> reflection_prompt</strong> →
              <strong style={{ color: "#0ea5e9" }}> outcome_record</strong>. The training dataset
              contains 100 inputs, 100 concepts, 40 transfers, 100 tasks, 80 reflections, 100 outcomes, and 60 community connections.
            </p>
          </div>
          <div className="apple-card-strong rounded-[24px] p-5">
            <div className="text-[10px] uppercase tracking-[0.22em] mb-2" style={{ color: "var(--apple-text-tertiary)" }}>
              Filter by domain
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setFilter(null)}
                className={filter === null ? "apple-button" : "apple-button-ghost"}
                style={{ padding: "5px 12px", fontSize: 11 }}
              >
                All
              </button>
              {domainsPresent.map((d) => (
                <button
                  key={d}
                  onClick={() => setFilter(d === filter ? null : d)}
                  className={filter === d ? "apple-button" : "apple-button-ghost"}
                  style={{
                    padding: "5px 12px",
                    fontSize: 11,
                    background: filter === d ? DOMAIN_COLOR[d] ?? "var(--apple-accent)" : undefined,
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="col-span-12 apple-card-strong rounded-[24px] p-6">
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em]" style={{ color: "var(--apple-text-tertiary)" }}>
                Recent inputs · training corpus stream
              </div>
              <h3 className="apple-display text-[20px] mt-1">
                {filtered.length} of {items.length} shown
              </h3>
            </div>
            <span className="apple-pill">live · pulls from /api/feed/recent</span>
          </div>

          {loading ? (
            <div className="apple-shimmer h-[200px] rounded-xl" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filtered.map((it) => (
                <div key={it.inputId} className="apple-card p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 18 }}>{TYPE_GLYPH[it.type] ?? "•"}</span>
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--apple-text-tertiary)" }}>
                        {it.type.replace(/_/g, " ")} · {it.sourceContext}
                      </span>
                    </div>
                    <span className="text-[10px]" style={{ color: "var(--apple-text-tertiary)" }}>
                      {timeAgo(it.timestamp)}
                    </span>
                  </div>
                  <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--apple-text)" }}>
                    {it.content}
                  </p>
                  {it.concept && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                        style={{
                          background: `${DOMAIN_COLOR[it.concept.domain] ?? "#94a3b8"}22`,
                          color: DOMAIN_COLOR[it.concept.domain] ?? "#94a3b8",
                        }}
                      >
                        {it.concept.domain}
                      </span>
                      <span className="text-[11px] font-semibold" style={{ color: "var(--apple-text)" }}>
                        {it.concept.topic}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--apple-text-secondary)" }}>
                        · {it.concept.subtopic}
                      </span>
                      <span className="text-[10px] ml-auto" style={{ color: "var(--apple-accent)" }}>
                        confidence {(it.concept.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: "rgba(255,255,255,0.06)", color: EMOTION_COLOR[it.emotion] ?? "#94a3b8" }}
                    >
                      ● {it.emotion}
                    </span>
                    <span className="apple-pill" style={{ fontSize: 9 }}>
                      stickiness {(it.stickiness * 100).toFixed(0)}%
                    </span>
                    {it.concept?.tags.slice(0, 3).map((t) => (
                      <span key={t} className="apple-pill" style={{ fontSize: 9 }}>{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
