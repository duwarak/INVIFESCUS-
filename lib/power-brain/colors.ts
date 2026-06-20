export const GROUP_COLORS: Record<string, string> = {
  Technology: "#5b6cff",
  Communication: "#06b6a8",
  Business: "#f4a02e",
  Music: "#ef476f",
  Psychology: "#9b6dff",
  Sports: "#22c55e",
  Mental_Models: "#0ea5e9",

  "computer-science": "#5b6cff",
  music: "#ef476f",
  business: "#f4a02e",
  gymnastics: "#22c55e",
  psychology: "#9b6dff",
  mathematics: "#0ea5e9",
  design: "#ec4899",
  biology: "#10b981",
  unknown: "#94a3b8",
};

export const GROUP_BG: Record<string, string> = {
  Technology: "#eef0ff",
  Communication: "#defaf6",
  Business: "#fff4e0",
  Music: "#ffeaf0",
  Psychology: "#f1eaff",
  Sports: "#dcfce7",
  Mental_Models: "#e0f3ff",

  "computer-science": "#eef0ff",
  music: "#ffeaf0",
  business: "#fff4e0",
  gymnastics: "#dcfce7",
  psychology: "#f1eaff",
  mathematics: "#e0f3ff",
  design: "#ffe5f0",
  biology: "#e0f6ec",
  unknown: "#eef2f7",
};

export const TYPE_GLYPH: Record<string, string> = {
  concept: "◆",
  core_concept: "◆",
  framework: "❖",
  method: "▲",
  skill: "✦",
  tool: "▣",
  technique: "▲",
  principle: "⬢",
  state: "○",
  event: "●",
  decision: "★",
  person: "☺",
  mental_model: "✺",
};

export const SURFACE = {
  bg: "#fafafa",
  panel: "#ffffff",
  border: "#e6e8ee",
  borderStrong: "#cfd3dc",
  text: "#1c1f26",
  textMuted: "#5b6270",
  accent: "#5b6cff",
  accentSoft: "#eef0ff",
};

export function colorFor(group: string): string {
  return GROUP_COLORS[group] ?? GROUP_COLORS.unknown;
}

export function softFor(group: string): string {
  return GROUP_BG[group] ?? GROUP_BG.unknown;
}
