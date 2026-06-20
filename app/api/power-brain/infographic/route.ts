import { NextRequest, NextResponse } from "next/server";
import { GROUP_COLORS } from "../../../../lib/power-brain/colors";

interface Body {
  nodeId: string;
  label: string;
  group: string;
  neighbors: { label: string; weight: number; relation: string }[];
}

function escape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Body;
  const color = GROUP_COLORS[body.group] ?? "#5b6cff";
  const W = 320;
  const H = 260;
  const cx = W / 2;
  const cy = H / 2;
  const neighbors = body.neighbors.slice(0, 6);

  const ringR = 90;
  const spokes = neighbors
    .map((n, i) => {
      const a = (2 * Math.PI * i) / Math.max(neighbors.length, 1) - Math.PI / 2;
      const x = cx + Math.cos(a) * ringR;
      const y = cy + Math.sin(a) * ringR;
      const r = 6 + n.weight * 6;
      const labelX = cx + Math.cos(a) * (ringR + 16);
      const labelY = cy + Math.sin(a) * (ringR + 16);
      const anchor =
        Math.cos(a) > 0.3 ? "start" : Math.cos(a) < -0.3 ? "end" : "middle";
      return `
        <line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="${color}" stroke-opacity="${0.25 + n.weight * 0.5}" stroke-width="${0.8 + n.weight * 1.4}"/>
        <circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="0.85"/>
        <text x="${labelX}" y="${labelY}" fill="#1c1f26" font-size="9" font-family="system-ui, sans-serif" text-anchor="${anchor}" dominant-baseline="middle">${escape(n.label.slice(0, 22))}</text>
      `;
    })
    .join("");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" height="auto">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <circle cx="${cx}" cy="${cy}" r="${ringR}" fill="none" stroke="#e6e8ee" stroke-dasharray="3 4"/>
  ${spokes}
  <circle cx="${cx}" cy="${cy}" r="22" fill="#ffffff" stroke="${color}" stroke-width="2"/>
  <text x="${cx}" y="${cy - 2}" fill="${color}" font-size="11" font-family="system-ui, sans-serif" text-anchor="middle" dominant-baseline="middle" font-weight="700">${escape(body.label.slice(0, 14))}</text>
  <text x="${cx}" y="${cy + 10}" fill="#5b6270" font-size="8" font-family="system-ui, sans-serif" text-anchor="middle">${escape(body.group)}</text>
  <text x="12" y="${H - 10}" fill="#94a3b8" font-size="9" font-family="system-ui, sans-serif">infographic-generator · MemPalace · MiroFish</text>
</svg>`;

  return new NextResponse(svg, {
    headers: { "content-type": "image/svg+xml; charset=utf-8" },
  });
}
