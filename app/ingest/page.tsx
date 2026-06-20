"use client";

import IngestForm from "@/components/ingest-form";

export default function IngestPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white">Feed your brain</h2>
        <p className="text-sm text-polymath-muted mt-1">
          Dump anything — text notes, photos of whiteboards, voice transcriptions, Word documents. The AI extracts the core concept and weaves it into your knowledge map.
        </p>
      </div>

      <IngestForm />

      {/* Recent inputs */}
      <div className="mt-8">
        <h3 className="text-sm font-medium text-polymath-muted mb-3">
          Recent inputs today
        </h3>
        <div className="space-y-2">
          {[
            { concept: "Decomposition — breaking complex systems into parts", domain: "Computer Science", time: "2h ago" },
            { concept: "Hidden fee structure in trading games", domain: "Business", time: "4h ago" },
            { concept: "Repetition builds mastery through neural pathways", domain: "Music", time: "6h ago" },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-polymath-surface border border-polymath-border rounded-lg p-3 flex items-center justify-between"
            >
              <div>
                <p className="text-sm text-polymath-text">{item.concept}</p>
                <p className="text-xs text-polymath-muted mt-0.5">{item.domain}</p>
              </div>
              <span className="text-xs text-polymath-muted shrink-0 ml-4">{item.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
