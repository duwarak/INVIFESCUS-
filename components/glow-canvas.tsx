"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BrainEdge, BrainNode } from "../lib/power-brain/types";
import { colorFor, vibrantFor } from "../lib/power-brain/colors";

export interface LiveHit {
  id: string;
  label: string;
  source: "openalex" | "wikipedia" | "arxiv";
  url: string;
  parentId: string;
  ts: number;
}

interface Props {
  nodes: BrainNode[];
  edges: BrainEdge[];
  liveHits?: LiveHit[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  onHitOpen?: (hit: LiveHit) => void;
  dim?: "2d" | "3d";
  motion?: number;
  spread?: number;
}

interface Particle {
  id: string;
  label: string;
  group: string;
  color: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  mass: number;
  baseR: number;
  bornAt: number;
  isHit: boolean;
  parentId?: string;
  url?: string;
  source?: LiveHit["source"];
}

interface Spring {
  a: string;
  b: string;
  rest: number;
  k: number;
  type: BrainEdge["type"];
}

const SRC_COLOR: Record<LiveHit["source"], string> = {
  openalex: "#0ea5e9",
  wikipedia: "#9b6dff",
  arxiv: "#ef476f",
};

function seededRng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1000000) / 1000000;
  };
}

const FOCAL = 900;

export default function GlowCanvas({
  nodes,
  edges,
  liveHits = [],
  selectedId,
  onSelect,
  onHitOpen,
  dim = "3d",
  motion = 1,
  spread = 1,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const particles = useRef<Map<string, Particle>>(new Map());
  const springs = useRef<Spring[]>([]);
  const cameraRef = useRef({ scale: 1, tx: 0, ty: 0, rot: 0 });
  const draggingRef = useRef<{ x: number; y: number } | null>(null);
  const hoveringRef = useRef<string | null>(null);
  const lastTickRef = useRef<number>(performance.now());
  const [, force] = useState(0);

  const focusId = selectedId ?? null;
  const neighborSet = useMemo(() => {
    if (!focusId) return null;
    const s = new Set<string>([focusId]);
    for (const e of edges) {
      if (e.source === focusId) s.add(e.target);
      if (e.target === focusId) s.add(e.source);
    }
    for (const h of liveHits) {
      if (h.parentId === focusId) s.add(h.id);
    }
    return s;
  }, [edges, focusId, liveHits]);

  useEffect(() => {
    const rng = seededRng(101);
    const map = particles.current;
    const existing = new Set(map.keys());
    const incoming = new Set<string>();

    const addIfMissing = (p: Omit<Particle, "x" | "y" | "z" | "vx" | "vy" | "vz">) => {
      incoming.add(p.id);
      if (map.has(p.id)) {
        const cur = map.get(p.id)!;
        cur.label = p.label;
        cur.color = p.color;
        cur.group = p.group;
        cur.baseR = p.baseR;
        return;
      }
      const rad = (80 + rng() * 480) * spread;
      const phi = rng() * Math.PI * 2;
      const th = (rng() - 0.5) * Math.PI;
      const x = Math.cos(phi) * Math.cos(th) * rad;
      const y = Math.sin(th) * rad;
      const z = Math.sin(phi) * Math.cos(th) * rad;
      map.set(p.id, {
        ...p,
        x,
        y,
        z,
        vx: (rng() - 0.5) * 0.8,
        vy: (rng() - 0.5) * 0.8,
        vz: (rng() - 0.5) * 0.8,
      });
    };

    for (const n of nodes) {
      addIfMissing({
        id: n.id,
        label: n.label,
        group: n.group,
        color: vibrantFor(n.group, n.id),
        mass: 0.6 + n.importance * 1.4,
        baseR: 3.5 + n.importance * 4.5,
        bornAt: existing.has(n.id) ? map.get(n.id)!.bornAt : performance.now() - 1500,
        isHit: false,
      });
    }
    for (const h of liveHits) {
      const parent = map.get(h.parentId);
      const cx = parent?.x ?? 0;
      const cy = parent?.y ?? 0;
      const cz = parent?.z ?? 0;
      if (!map.has(h.id)) {
        const phi = rng() * Math.PI * 2;
        const th = (rng() - 0.5) * Math.PI;
        const r = 30;
        map.set(h.id, {
          id: h.id,
          label: h.label,
          group: h.source,
          color: SRC_COLOR[h.source],
          x: cx + Math.cos(phi) * Math.cos(th) * r,
          y: cy + Math.sin(th) * r,
          z: cz + Math.sin(phi) * Math.cos(th) * r,
          vx: Math.cos(phi) * 0.6,
          vy: (rng() - 0.5) * 0.3,
          vz: Math.sin(phi) * 0.6,
          mass: 0.4,
          baseR: 2.5 + Math.random() * 2.5,
          bornAt: performance.now(),
          isHit: true,
          parentId: h.parentId,
          url: h.url,
          source: h.source,
        });
      }
      incoming.add(h.id);
    }

    for (const id of existing) {
      if (!incoming.has(id)) map.delete(id);
    }

    const sp: Spring[] = [];
    const restLen = 85 * spread;
    for (const e of edges) {
      if (map.has(e.source) && map.has(e.target)) {
        sp.push({
          a: e.source,
          b: e.target,
          rest: restLen,
          k: 0.015 * (0.5 + e.weight),
          type: e.type,
        });
      }
    }
    for (const h of liveHits) {
      if (map.has(h.id) && map.has(h.parentId)) {
        sp.push({ a: h.id, b: h.parentId, rest: 60, k: 0.05, type: "derived" });
      }
    }
    springs.current = sp;
    force((x) => x + 1);
  }, [nodes, edges, liveHits]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    let raf = 0;
    const physicsStep = (dtMs: number) => {
      const dt = Math.min(0.03, dtMs / 1000);
      const arr = Array.from(particles.current.values());
      if (!arr.length) return;
      const charge = 1800 * motion * (1 + (spread - 1) * 0.8);
      const damping = Math.pow(0.92, dt * 60);
      const centerK = 0.012 * motion;
      const groupMap = new Map<string, { x: number; y: number; z: number; n: number }>();
      for (const p of arr) {
        const g = groupMap.get(p.group) ?? { x: 0, y: 0, z: 0, n: 0 };
        g.x += p.x;
        g.y += p.y;
        g.z += p.z;
        g.n += 1;
        groupMap.set(p.group, g);
      }
      for (const g of groupMap.values()) {
        g.x /= g.n;
        g.y /= g.n;
        g.z /= g.n;
      }

      const n = arr.length;
      const fx = new Float32Array(n);
      const fy = new Float32Array(n);
      const fz = new Float32Array(n);
      const idx = new Map<string, number>();
      arr.forEach((p, i) => idx.set(p.id, i));

      for (let i = 0; i < n; i++) {
        const pi = arr[i];
        for (let j = i + 1; j < n; j++) {
          const pj = arr[j];
          let dx = pi.x - pj.x;
          let dy = pi.y - pj.y;
          let dz = dim === "3d" ? pi.z - pj.z : 0;
          let d2 = dx * dx + dy * dy + dz * dz + 0.01;
          if (d2 > 250000) continue;
          const d = Math.sqrt(d2);
          const f = charge / d2;
          const ux = dx / d;
          const uy = dy / d;
          const uz = dz / d;
          fx[i] += ux * f;
          fy[i] += uy * f;
          fz[i] += uz * f;
          fx[j] -= ux * f;
          fy[j] -= uy * f;
          fz[j] -= uz * f;
        }
      }

      for (const s of springs.current) {
        const ia = idx.get(s.a)!;
        const ib = idx.get(s.b)!;
        if (ia == null || ib == null) continue;
        const pa = arr[ia];
        const pb = arr[ib];
        const dx = pb.x - pa.x;
        const dy = pb.y - pa.y;
        const dz = dim === "3d" ? pb.z - pa.z : 0;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz + 0.01);
        const f = (d - s.rest) * s.k * motion;
        const ux = dx / d;
        const uy = dy / d;
        const uz = dz / d;
        fx[ia] += ux * f;
        fy[ia] += uy * f;
        fz[ia] += uz * f;
        fx[ib] -= ux * f;
        fy[ib] -= uy * f;
        fz[ib] -= uz * f;
      }

      for (let i = 0; i < n; i++) {
        const p = arr[i];
        fx[i] -= p.x * centerK;
        fy[i] -= p.y * centerK;
        if (dim === "3d") fz[i] -= p.z * centerK;
        const gc = groupMap.get(p.group)!;
        fx[i] -= (p.x - gc.x) * 0.004 * motion;
        fy[i] -= (p.y - gc.y) * 0.004 * motion;
        if (dim === "3d") fz[i] -= (p.z - gc.z) * 0.004 * motion;
      }

      for (let i = 0; i < n; i++) {
        const p = arr[i];
        const m = p.mass;
        p.vx = (p.vx + (fx[i] / m) * dt) * damping;
        p.vy = (p.vy + (fy[i] / m) * dt) * damping;
        p.vz = (p.vz + (fz[i] / m) * dt) * damping;
        p.x += p.vx * dt * 60;
        p.y += p.vy * dt * 60;
        if (dim === "3d") p.z += p.vz * dt * 60;
        else p.z *= 0.85;
      }

      cameraRef.current.rot += 0.002 * motion;
    };

    const project = (p: Particle) => {
      const cam = cameraRef.current;
      const cosR = Math.cos(cam.rot);
      const sinR = Math.sin(cam.rot);
      const xr = p.x * cosR + p.z * sinR;
      const zr = -p.x * sinR + p.z * cosR;
      const yr = p.y;
      const denom = FOCAL - zr;
      const scale = FOCAL / Math.max(120, denom);
      return { sx: xr * scale, sy: yr * scale, scale, zr };
    };

    const render = (now: number) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const w = canvas.width;
      const h = canvas.height;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const grd = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h));
      grd.addColorStop(0, "#0a0c18");
      grd.addColorStop(1, "#04050a");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      const cam = cameraRef.current;
      const cx = w / 2 + cam.tx * dpr;
      const cy = h / 2 + cam.ty * dpr;
      const s = cam.scale * dpr;

      const arr = Array.from(particles.current.values());
      const projected = arr.map((p) => ({ p, ...project(p) }));
      projected.sort((a, b) => a.zr - b.zr);

      const focus = focusId ?? hoveringRef.current ?? null;
      const dim2 = focus ? neighborSet : null;

      ctx.lineCap = "round";
      for (const sp of springs.current) {
        const pa = particles.current.get(sp.a);
        const pb = particles.current.get(sp.b);
        if (!pa || !pb) continue;
        const ja = project(pa);
        const jb = project(pb);
        const x1 = cx + ja.sx * s;
        const y1 = cy + ja.sy * s;
        const x2 = cx + jb.sx * s;
        const y2 = cy + jb.sy * s;
        const isFocus = focus && (sp.a === focus || sp.b === focus);
        const alpha = dim2 ? (isFocus ? 0.9 : 0.04) : 0.22;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = isFocus
          ? "#ffffff"
          : sp.type === "bridge"
            ? "#7c5cfc"
            : "#3b82f6";
        ctx.lineWidth = isFocus ? 1.6 : 0.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      for (const { p, sx, sy, scale, zr } of projected) {
        const age = (now - p.bornAt) / 800;
        const grow = Math.min(1, age);
        const pulse = 0.92 + Math.sin(now * 0.003 + p.x * 0.01) * 0.08;
        const depthFade = dim === "3d" ? Math.min(1, Math.max(0.3, scale)) : 1;
        const isFocus = focus === p.id;
        const inFocus = dim2 ? dim2.has(p.id) : true;
        const r = p.baseR * scale * grow * pulse;
        const glow = isFocus ? 36 : p.isHit ? 22 : 16;
        const x = cx + sx * s;
        const y = cy + sy * s;

        ctx.save();
        ctx.globalAlpha = inFocus ? depthFade : 0.18;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = glow * dpr * depthFade;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(x, y, r * dpr, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (p.isHit) {
          ctx.save();
          ctx.globalAlpha = inFocus ? 0.9 : 0.3;
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 0.8 * dpr;
          ctx.beginPath();
          ctx.arc(x, y, (r + 2) * dpr, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        if (isFocus) {
          ctx.save();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.4 * dpr;
          ctx.beginPath();
          ctx.arc(x, y, (r + 4) * dpr, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
      }

      if (focus) {
        const fp = particles.current.get(focus);
        if (fp) {
          const j = project(fp);
          const x = cx + j.sx * s;
          const y = cy + j.sy * s;
          ctx.save();
          ctx.font = `${12 * dpr}px system-ui, sans-serif`;
          const text = fp.label;
          const w2 = ctx.measureText(text).width + 14 * dpr;
          const h2 = 24 * dpr;
          ctx.fillStyle = "rgba(10,12,20,0.95)";
          ctx.fillRect(x + 14 * dpr, y - h2 / 2, w2, h2);
          ctx.strokeStyle = fp.color;
          ctx.lineWidth = 1.2 * dpr;
          ctx.strokeRect(x + 14 * dpr, y - h2 / 2, w2, h2);
          ctx.fillStyle = "#e6e8ee";
          ctx.textBaseline = "middle";
          ctx.fillText(text, x + 21 * dpr, y);
          ctx.restore();
        }
      }
    };

    const loop = (now: number) => {
      const dt = now - lastTickRef.current;
      lastTickRef.current = now;
      physicsStep(dt);
      render(now);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const screenToParticle = (px: number, py: number) => {
      const rect = canvas.getBoundingClientRect();
      const cam = cameraRef.current;
      const wx = (px - rect.left - rect.width / 2 - cam.tx) / cam.scale;
      const wy = (py - rect.top - rect.height / 2 - cam.ty) / cam.scale;
      let best: { id: string; d: number } | null = null;
      for (const p of particles.current.values()) {
        const j = project(p);
        const dx = j.sx - wx;
        const dy = j.sy - wy;
        const r = p.baseR * j.scale + 4;
        const d2 = dx * dx + dy * dy;
        if (d2 < r * r) {
          if (!best || d2 < best.d) best = { id: p.id, d: d2 };
        }
      }
      return best?.id ?? null;
    };

    const onMove = (e: MouseEvent) => {
      if (draggingRef.current) {
        const dx = e.clientX - draggingRef.current.x;
        const dy = e.clientY - draggingRef.current.y;
        cameraRef.current.tx += dx;
        cameraRef.current.ty += dy;
        draggingRef.current = { x: e.clientX, y: e.clientY };
        return;
      }
      const id = screenToParticle(e.clientX, e.clientY);
      hoveringRef.current = id;
      canvas.style.cursor = id ? "pointer" : "grab";
    };
    const onDown = (e: MouseEvent) => {
      const id = screenToParticle(e.clientX, e.clientY);
      if (id) {
        const p = particles.current.get(id);
        if (p?.isHit && p.url && onHitOpen) {
          onHitOpen({
            id,
            label: p.label,
            source: p.source!,
            url: p.url,
            parentId: p.parentId!,
            ts: p.bornAt,
          });
          return;
        }
        onSelect?.(id);
      } else {
        draggingRef.current = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = "grabbing";
      }
    };
    const onUp = () => {
      draggingRef.current = null;
      canvas.style.cursor = "grab";
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const k = e.deltaY < 0 ? 1.1 : 0.9;
      cameraRef.current.scale = Math.min(
        5,
        Math.max(0.15, cameraRef.current.scale * k)
      );
    };

    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [dim, motion, focusId, neighborSet, onSelect, onHitOpen]);

  return (
    <div
      ref={wrapRef}
      className="w-full h-full relative overflow-hidden"
      style={{ background: "#04050a" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />
      <div
        className="absolute top-3 left-3 text-[10px] uppercase tracking-wider px-2 py-1 rounded-full font-semibold flex items-center gap-2"
        style={{ background: "rgba(255,255,255,0.06)", color: "#e2e8f0" }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: "#22c55e" }}
        />
        Glow Cloud · {dim.toUpperCase()} · live physics · click to grow web hits
      </div>
      <div
        className="absolute bottom-3 left-3 text-[10px] px-2 py-1 rounded-md flex gap-3"
        style={{ background: "rgba(255,255,255,0.05)", color: "#94a3b8" }}
      >
        <span>scroll · zoom</span>
        <span>drag · pan</span>
        <span>click node · select</span>
        <span>click hit · open source</span>
      </div>
    </div>
  );
}
