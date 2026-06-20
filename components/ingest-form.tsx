"use client";

import { useState, useRef } from "react";

interface IngestResult {
  id: string;
  concept: string;
  domain: string;
  type: string;
  relatedTerms: string[];
  confidence: number;
}

export default function IngestForm() {
  const [inputType, setInputType] = useState<"text" | "image" | "docx">("text");
  const [textContent, setTextContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<IngestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let content = textContent;

      if (inputType === "image" || inputType === "docx") {
        const file = fileRef.current?.files?.[0];
        if (!file) {
          setError("Please select a file first.");
          setLoading(false);
          return;
        }

        if (inputType === "image") {
          const buffer = await file.arrayBuffer();
          content = Buffer.from(buffer).toString("base64");
        } else {
          // For docx, read as text via mammoth (server-side)
          const buffer = await file.arrayBuffer();
          content = Buffer.from(buffer).toString("base64");
        }
      }

      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: inputType, content }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      setResult(data);
      setTextContent("");
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Input type selector */}
      <div className="flex gap-2">
        {(["text", "image", "docx"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setInputType(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              inputType === t
                ? "bg-polymath-accent text-white"
                : "bg-polymath-surface text-polymath-muted hover:text-polymath-text border border-polymath-border"
            }`}
          >
            {t === "text" ? "Text / Voice note" : t === "image" ? "Photo / Screenshot" : "Word doc"}
          </button>
        ))}
      </div>

      {/* Input area */}
      {inputType === "text" ? (
        <textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder="Type your notes, paste a voice transcription, or dump whatever's on your mind..."
          className="w-full h-40 bg-polymath-surface border border-polymath-border rounded-lg p-4 text-polymath-text placeholder:text-polymath-muted/50 resize-none focus:outline-none focus:border-polymath-accent"
        />
      ) : (
        <div className="bg-polymath-surface border border-polymath-border border-dashed rounded-lg p-8 text-center">
          <input
            ref={fileRef}
            type="file"
            accept={inputType === "image" ? "image/*" : ".docx"}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer text-polymath-muted hover:text-polymath-text transition-colors"
          >
            <span className="text-3xl block mb-2">
              {inputType === "image" ? "📷" : "📄"}
            </span>
            Click to upload {inputType === "image" ? "a photo or screenshot" : "a Word document"}
          </label>
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || (inputType === "text" && !textContent.trim())}
        className="w-full py-3 bg-polymath-accent text-white rounded-lg font-medium hover:bg-polymath-accent-light disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        {loading ? "Processing with AI..." : "Feed to the brain"}
      </button>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-polymath-surface border border-polymath-accent/30 rounded-lg p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-polymath-accent uppercase tracking-wide">
              Concept extracted
            </span>
            <span className="text-xs text-polymath-muted">
              {Math.round(result.confidence * 100)}% confidence
            </span>
          </div>
          <p className="text-polymath-text font-medium">{result.concept}</p>
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs px-2 py-1 rounded bg-polymath-accent/10 text-polymath-accent-light">
              {result.domain}
            </span>
            <span className="text-xs px-2 py-1 rounded bg-polymath-teal/10 text-polymath-teal">
              {result.type}
            </span>
            {result.relatedTerms.map((term) => (
              <span
                key={term}
                className="text-xs px-2 py-1 rounded bg-polymath-surface text-polymath-muted border border-polymath-border"
              >
                {term}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
