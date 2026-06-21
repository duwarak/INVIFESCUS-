import fs from "fs";
import path from "path";
import { BrainEdge, BrainNode } from "./types";

const CACHE_DIR = path.join(process.cwd(), ".brain-cache");
const CACHE_FILE = path.join(CACHE_DIR, "memory-extensions.json");

export interface SynthesisRecord {
  id: string;
  label: string;
  sourceNodeId: string;
  group: string;
  level: 1 | 2 | 3 | 4;
  summary: string;
  pushedAt: number;
  pushedBy: string;
  evidence: { neighborId: string; relation: string; weight: number }[];
}

export interface MemoryExtensions {
  nodes: BrainNode[];
  edges: BrainEdge[];
  syntheses: SynthesisRecord[];
}

const EMPTY: MemoryExtensions = { nodes: [], edges: [], syntheses: [] };

let cache: MemoryExtensions | null = null;

function ensureDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

export function readMemory(): MemoryExtensions {
  if (cache) return cache;
  try {
    ensureDir();
    if (!fs.existsSync(CACHE_FILE)) {
      cache = { ...EMPTY };
      return cache;
    }
    const raw = fs.readFileSync(CACHE_FILE, "utf-8");
    const parsed = JSON.parse(raw) as MemoryExtensions;
    cache = {
      nodes: parsed.nodes ?? [],
      edges: parsed.edges ?? [],
      syntheses: parsed.syntheses ?? [],
    };
    return cache;
  } catch {
    cache = { ...EMPTY };
    return cache;
  }
}

export function writeMemory(next: MemoryExtensions) {
  ensureDir();
  cache = next;
  fs.writeFileSync(CACHE_FILE, JSON.stringify(next, null, 2), "utf-8");
}

export function appendSynthesis(rec: SynthesisRecord, extraEdges: BrainEdge[]) {
  const mem = readMemory();
  const existing = mem.nodes.find((n) => n.id === rec.id);
  const synthNode: BrainNode = {
    id: rec.id,
    label: rec.label,
    type: "concept",
    group: rec.group,
    importance: 0.7 + rec.level * 0.05,
    score: 0.6 + rec.level * 0.08,
    ts: rec.pushedAt,
    summary: rec.summary,
  };
  const nodes = existing
    ? mem.nodes.map((n) => (n.id === rec.id ? synthNode : n))
    : [...mem.nodes, synthNode];

  const dedupeKey = (e: BrainEdge) => `${e.source}->${e.target}:${e.type}`;
  const seen = new Set(mem.edges.map(dedupeKey));
  const newEdges = extraEdges.filter((e) => !seen.has(dedupeKey(e)));

  const syntheses = [
    rec,
    ...mem.syntheses.filter((s) => s.id !== rec.id),
  ].slice(0, 200);

  const next: MemoryExtensions = {
    nodes,
    edges: [...mem.edges, ...newEdges],
    syntheses,
  };
  writeMemory(next);
  return next;
}

export function clearMemory() {
  writeMemory({ ...EMPTY });
}
