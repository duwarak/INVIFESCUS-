"use client";

interface CriticData {
  flaws: string[];
  hiddenAssumptions: string[];
  alternatives: string[];
  premortem: string;
}

interface CriticReportProps {
  data: CriticData;
}

export default function CriticReport({ data }: CriticReportProps) {
  return (
    <div className="space-y-4">
      {/* Flaws */}
      <div className="bg-polymath-surface border border-polymath-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-polymath-coral mb-3 flex items-center gap-2">
          <span>⚠️</span> What could go wrong
        </h3>
        <ul className="space-y-2">
          {data.flaws.map((flaw, i) => (
            <li key={i} className="text-sm text-polymath-text flex items-start gap-2">
              <span className="text-polymath-coral mt-0.5 shrink-0">→</span>
              {flaw}
            </li>
          ))}
        </ul>
      </div>

      {/* Hidden assumptions */}
      <div className="bg-polymath-surface border border-polymath-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-polymath-amber mb-3 flex items-center gap-2">
          <span>🔍</span> Hidden assumptions
        </h3>
        <ul className="space-y-2">
          {data.hiddenAssumptions.map((assumption, i) => (
            <li key={i} className="text-sm text-polymath-text flex items-start gap-2">
              <span className="text-polymath-amber mt-0.5 shrink-0">→</span>
              {assumption}
            </li>
          ))}
        </ul>
      </div>

      {/* Alternatives */}
      <div className="bg-polymath-surface border border-polymath-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-polymath-teal mb-3 flex items-center gap-2">
          <span>💡</span> What else you could do
        </h3>
        <ul className="space-y-2">
          {data.alternatives.map((alt, i) => (
            <li key={i} className="text-sm text-polymath-text flex items-start gap-2">
              <span className="text-polymath-teal mt-0.5 shrink-0">→</span>
              {alt}
            </li>
          ))}
        </ul>
      </div>

      {/* Premortem */}
      <div className="bg-polymath-surface border border-polymath-coral/20 rounded-lg p-4">
        <h3 className="text-sm font-medium text-polymath-coral mb-2 flex items-center gap-2">
          <span>💀</span> Premortem — the story of failure
        </h3>
        <p className="text-sm text-polymath-muted italic leading-relaxed">
          &ldquo;{data.premortem}&rdquo;
        </p>
      </div>
    </div>
  );
}
