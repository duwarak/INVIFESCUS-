"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";

// Dynamic import for Excalidraw (it doesn't support SSR)
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false, loading: () => <div className="text-polymath-muted p-8">Loading canvas...</div> }
);

interface SketchCanvasProps {
  prompt: string;                    // What the user should sketch
  onSubmit: (imageData: string) => void;  // Called when user submits their sketch
}

export default function SketchCanvas({ prompt, onSubmit }: SketchCanvasProps) {
  const [submitted, setSubmitted] = useState(false);
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);

  const handleSubmit = useCallback(async () => {
    if (!excalidrawAPI) return;

    try {
      const elements = excalidrawAPI.getSceneElements();
      if (elements.length === 0) {
        alert("Draw something first — even a rough sketch helps you think.");
        return;
      }

      // Export as PNG for potential LLM analysis
      const blob = await excalidrawAPI.exportToBlob({
        mimeType: "image/png",
        quality: 0.8,
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        onSubmit(base64);
        setSubmitted(true);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Export failed:", err);
    }
  }, [excalidrawAPI, onSubmit]);

  return (
    <div className="flex flex-col h-full">
      <div className="bg-polymath-surface border border-polymath-border rounded-lg p-4 mb-4">
        <p className="text-sm text-polymath-muted mb-1">Before the AI shows you the answer:</p>
        <p className="text-polymath-text font-medium">{prompt}</p>
      </div>

      <div className="flex-1 min-h-[400px] rounded-lg overflow-hidden border border-polymath-border bg-white">
        <Excalidraw
          excalidrawAPI={(api: any) => setExcalidrawAPI(api)}
          theme="light"
          initialData={{
            appState: {
              viewBackgroundColor: "#ffffff",
              currentItemFontFamily: 1,
            },
          }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitted}
        className={`mt-4 px-6 py-3 rounded-lg font-medium transition-all ${
          submitted
            ? "bg-polymath-teal/20 text-polymath-teal cursor-default"
            : "bg-polymath-accent text-white hover:bg-polymath-accent-light"
        }`}
      >
        {submitted ? "Sketch submitted — AI is comparing..." : "Done sketching — show me what the AI found"}
      </button>
    </div>
  );
}
