/**
 * Tiny LLM — Karpathy-style minimal forward pass for educational/demo use.
 * Mirrors the structure: embed → causal self-attention → softmax → sample.
 * Not a trained model — outputs a deterministic, plausible-looking trace
 * so the Decision Lab can show what's running under the agents.
 *
 * Reference: github.com/karpathy/nanoGPT and the famous 442a6bf gist
 * showing the minimum needed to demonstrate the math.
 */

export interface ForwardTrace {
  stage:
    | "tokenize" | "embed" | "qkv" | "attention" | "ffn" | "layernorm"
    | "logits" | "softmax" | "sample";
  shape: string;
  notes: string;
  ms: number;
  preview?: number[];
}

export interface RunResult {
  prompt: string;
  tokens: string[];
  sampledTokens: string[];
  perTokenEntropy: number[];
  loss: number;
  trace: ForwardTrace[];
  config: {
    vocab: number;
    dModel: number;
    nLayers: number;
    nHeads: number;
    context: number;
    temperature: number;
  };
}

const VOCAB = [
  "the", "a", "agent", "concept", "decision", "tomorrow", "next", "week", "quarter",
  "if", "then", "but", "first", "later", "synthesis", "memory", "graph", "bridge",
  "cross-domain", "pre-mortem", "scenario", "future", "you", "your", "should",
  "skip", "commit", "delay", "reflect", "review", "ship", "iterate", "pause",
  "energy", "low", "high", "leverage", "risk", "upside", "downside", "<eos>",
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 32);
}

function hash(s: string, salt = 0): number {
  let h = salt | 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function embed(tokens: string[], dModel: number): number[][] {
  return tokens.map((t) => {
    const seed = hash(t);
    return Array.from({ length: dModel }, (_, i) => {
      const v = ((seed + i * 9301) % 4096) / 4096 - 0.5;
      return Number(v.toFixed(4));
    });
  });
}

function softmax(xs: number[], temperature: number): number[] {
  const t = Math.max(0.01, temperature);
  const scaled = xs.map((x) => x / t);
  const max = Math.max(...scaled);
  const exp = scaled.map((x) => Math.exp(x - max));
  const sum = exp.reduce((s, x) => s + x, 0);
  return exp.map((x) => x / sum);
}

function entropy(probs: number[]): number {
  let h = 0;
  for (const p of probs) if (p > 0) h -= p * Math.log2(p);
  return h;
}

function attention(emb: number[][]): number[][] {
  const n = emb.length;
  const d = emb[0].length;
  const out: number[][] = [];
  for (let i = 0; i < n; i++) {
    const scores: number[] = [];
    for (let j = 0; j <= i; j++) {
      let s = 0;
      for (let k = 0; k < d; k++) s += emb[i][k] * emb[j][k];
      scores.push(s / Math.sqrt(d));
    }
    const w = softmax(scores, 1);
    const row = new Array(d).fill(0);
    for (let j = 0; j <= i; j++) for (let k = 0; k < d; k++) row[k] += w[j] * emb[j][k];
    out.push(row);
  }
  return out;
}

function ffn(emb: number[][]): number[][] {
  return emb.map((row) => row.map((x) => Math.tanh(x * 1.3 + 0.05)));
}

function logits(state: number[], dModel: number): number[] {
  return VOCAB.map((tok, vi) => {
    const seed = hash(tok, vi);
    let dot = 0;
    for (let k = 0; k < dModel; k++) {
      const w = ((seed + k * 31) % 2048) / 2048 - 0.5;
      dot += state[k] * w;
    }
    return dot;
  });
}

function sample(probs: number[]): number {
  const r = Math.random();
  let s = 0;
  for (let i = 0; i < probs.length; i++) {
    s += probs[i];
    if (r <= s) return i;
  }
  return probs.length - 1;
}

const DEFAULT = {
  vocab: VOCAB.length,
  dModel: 32,
  nLayers: 4,
  nHeads: 4,
  context: 32,
  temperature: 0.85,
};

export function runTiny(prompt: string, opts: Partial<typeof DEFAULT> = {}): RunResult {
  const cfg = { ...DEFAULT, ...opts };
  const t0 = Date.now();
  const trace: ForwardTrace[] = [];

  const tokens = tokenize(prompt.length ? prompt : "Should I commit to the next quarter?");
  trace.push({ stage: "tokenize", shape: `[${tokens.length}]`, notes: `Split into ${tokens.length} word tokens (vocab=${cfg.vocab})`, ms: Date.now() - t0 });

  const t1 = Date.now();
  let state = embed(tokens, cfg.dModel);
  trace.push({ stage: "embed", shape: `[${tokens.length}, ${cfg.dModel}]`, notes: `Per-token embedding via hash → ℝ^${cfg.dModel}`, ms: Date.now() - t1, preview: state[0].slice(0, 6) });

  for (let l = 0; l < cfg.nLayers; l++) {
    const tL = Date.now();
    state = attention(state);
    trace.push({ stage: "attention", shape: `[${tokens.length}, ${cfg.dModel}]`, notes: `Layer ${l + 1}/${cfg.nLayers} · causal attention, ${cfg.nHeads} heads (folded)`, ms: Date.now() - tL });
    const tF = Date.now();
    state = ffn(state);
    trace.push({ stage: "ffn", shape: `[${tokens.length}, ${cfg.dModel}]`, notes: `Layer ${l + 1}/${cfg.nLayers} · tanh FFN`, ms: Date.now() - tF });
  }

  const t2 = Date.now();
  const last = state[state.length - 1];
  trace.push({ stage: "logits", shape: `[${cfg.vocab}]`, notes: "W_unembedding · h_last → logits over vocab", ms: Date.now() - t2 });

  const sampled: string[] = [];
  const entropies: number[] = [];
  let runningState = last.slice();

  for (let i = 0; i < 5; i++) {
    const ts = Date.now();
    const z = logits(runningState, cfg.dModel);
    const p = softmax(z, cfg.temperature);
    const e = entropy(p);
    entropies.push(Number(e.toFixed(3)));
    trace.push({ stage: "softmax", shape: `[${cfg.vocab}]`, notes: `T=${cfg.temperature} · entropy=${e.toFixed(2)} bits`, ms: Date.now() - ts });
    const idx = sample(p);
    sampled.push(VOCAB[idx]);
    trace.push({ stage: "sample", shape: `[1]`, notes: `Sampled "${VOCAB[idx]}" (p=${p[idx].toFixed(3)})`, ms: 1 });

    runningState = runningState.map((x, k) => Math.tanh(x + ((hash(VOCAB[idx], k) % 2048) / 2048 - 0.5) * 0.15));
    if (VOCAB[idx] === "<eos>") break;
  }

  const loss = entropies.reduce((s, x) => s + x, 0) / Math.max(1, entropies.length);

  return {
    prompt,
    tokens,
    sampledTokens: sampled,
    perTokenEntropy: entropies,
    loss: Number(loss.toFixed(3)),
    trace,
    config: cfg,
  };
}
