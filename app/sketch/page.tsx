"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const SketchCanvas = dynamic(() => import("@/components/sketch-canvas"), { ssr: false });

export default function SketchPage() {
  const [revealed, setRevealed] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const handleSketchSubmit = async (imageData: string) => {
    // In full version: send sketch to LLM for comparison against actual map
    // For demo: simulate the comparison
    setAiResult(
      "You connected Music and Business — good instinct. But you missed the bridge to Computer Science: decomposition in CS uses the same structural pattern as breaking down a musical piece into practice segments. That's one cross-domain connection you almost saw."
    );
    setRevealed(true);
  };

  return (
    <div className="h-full flex flex-col max-w-4xl">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">Sketch first</h2>
        <p className="text-sm text-polymath-muted mt-1">
          The AI won&apos;t show you the answer until you try drawing it yourself. This forces active thinking — the single most effective learning technique that exists.
        </p>
      </div>

      {!revealed ? (
        <SketchCanvas
          prompt="Draw how you think today's three concepts (decomposition, trading fees, repetition mastery) connect to each other. Just boxes and arrows — rough is fine."
          onSubmit={handleSketchSubmit}
        />
      ) : (
        <div className="space-y-4">
          {/* AI comparison result */}
          <div className="bg-polymath-surface border border-polymath-accent/30 rounded-lg p-5">
            <h3 className="text-sm font-medium text-polymath-accent mb-2">
              What the AI found that you didn&apos;t
            </h3>
            <p className="text-sm text-polymath-text leading-relaxed">
              {aiResult}
            </p>
          </div>

          {/* The gap */}
          <div className="bg-polymath-surface border border-polymath-teal/20 rounded-lg p-5">
            <h3 className="text-sm font-medium text-polymath-teal mb-2">
              Your named blind spot
            </h3>
            <p className="text-sm text-polymath-muted">
              CS ↔ Music bridge: structural decomposition. This pattern appears in at least 3 of your domains but you only connected 2. The skill tag &ldquo;Cross-domain linker&rdquo; needs one more bridge to unlock.
            </p>
          </div>

          <button
            onClick={() => setRevealed(false)}
            className="px-4 py-2 bg-polymath-surface border border-polymath-border rounded-lg text-sm text-polymath-muted hover:text-polymath-text transition-colors"
          >
            Try another sketch
          </button>
        </div>
      )}
    </div>
  );
}
