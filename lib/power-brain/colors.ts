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

function hashHue(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((h % 200) - 100) / 100;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
  }
  h = (h * 60 + 360) % 360;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { h, s, l };
}

export function vibrantFor(group: string, id: string): string {
  const base = colorFor(group);
  const { h, s, l } = hexToHsl(base);
  const dh = hashHue(id) * 28;
  const ds = Math.min(1, s * (0.85 + ((id.length * 13) % 30) / 100));
  const dl = Math.max(0.45, Math.min(0.78, l + (hashHue(id + "l") * 0.12)));
  return `hsl(${((h + dh + 360) % 360).toFixed(0)}, ${Math.round(ds * 100)}%, ${Math.round(dl * 100)}%)`;
}
