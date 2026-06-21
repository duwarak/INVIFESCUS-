import { CommunityPod, CommunityRegion, ModerationStatus } from "./types";

const SEED: Omit<CommunityPod, "moderation" | "createdAt">[] = [
  { id: "pod_sf", label: "SF Polymath Salon", description: "Cross-domain reading + decisions lab every Wednesday.", domains: ["Technology", "Psychology", "Business"], coords: [-122.4194, 37.7749], memberCount: 84, knowledgeDensity: 92, ownerId: "u_avi", ownerName: "Avi Tan", privacy: "public", nextEvent: { title: "Decision Lab — Pricing power across domains", whenISO: "2026-06-27T18:00:00Z" } },
  { id: "pod_nyc", label: "NYC Latticework", description: "Munger-style mental model jam.", domains: ["Mental_Models", "Business", "Psychology"], coords: [-74.006, 40.7128], memberCount: 67, knowledgeDensity: 78, ownerId: "u_priya", ownerName: "Priya Shah", privacy: "public", nextEvent: { title: "Inversion night — what to avoid in 2027", whenISO: "2026-07-02T23:00:00Z" } },
  { id: "pod_berlin", label: "Berlin Sketchbrain", description: "Excalidraw → MemPalace sketch ingest.", domains: ["Design", "Technology"], coords: [13.405, 52.52], memberCount: 41, knowledgeDensity: 64, ownerId: "u_jonas", ownerName: "Jonas Weber", privacy: "public" },
  { id: "pod_london", label: "London C-Suite Brains", description: "Pre-mortem + scenario forecasting circle.", domains: ["Business", "Mental_Models"], coords: [-0.1276, 51.5074], memberCount: 52, knowledgeDensity: 71, ownerId: "u_emma", ownerName: "Emma Clarke", privacy: "private" },
  { id: "pod_tokyo", label: "Tokyo MiroFish Lab", description: "Live multi-agent persona simulation evenings.", domains: ["Technology", "Communication"], coords: [139.6917, 35.6895], memberCount: 38, knowledgeDensity: 69, ownerId: "u_yui", ownerName: "Yui Nakamura", privacy: "public", nextEvent: { title: "Persona Swarm — agent debate night", whenISO: "2026-07-05T10:00:00Z" } },
  { id: "pod_blr", label: "Bangalore Bridge", description: "CS ⇌ Psychology ⇌ Music decomposition jams.", domains: ["Technology", "Music", "Psychology"], coords: [77.5946, 12.9716], memberCount: 73, knowledgeDensity: 88, ownerId: "u_arjun", ownerName: "Arjun Iyer", privacy: "public", nextEvent: { title: "Carnatic + Compilers", whenISO: "2026-06-28T13:30:00Z" } },
  { id: "pod_singapore", label: "Singapore Mental Latticework", description: "Decision frameworks for builders.", domains: ["Business", "Mental_Models"], coords: [103.8198, 1.3521], memberCount: 29, knowledgeDensity: 58, ownerId: "u_wei", ownerName: "Wei Ling", privacy: "public" },
  { id: "pod_toronto", label: "Toronto Knowledge Pod", description: "Spaced repetition cohort + MemPalace audits.", domains: ["Psychology", "Technology"], coords: [-79.3832, 43.6532], memberCount: 47, knowledgeDensity: 66, ownerId: "u_megan", ownerName: "Megan O'Hara", privacy: "public" },
  { id: "pod_seattle", label: "Seattle Polymath Pod", description: "Music + ML weekly.", domains: ["Music", "Technology", "Mathematics"], coords: [-122.3321, 47.6062], memberCount: 35, knowledgeDensity: 62, ownerId: "u_dana", ownerName: "Dana Liu", privacy: "public" },
  { id: "pod_dubai", label: "Dubai Decision Circle", description: "Bezos regret-min + Dalio principles study.", domains: ["Business", "Mental_Models"], coords: [55.2708, 25.2048], memberCount: 24, knowledgeDensity: 54, ownerId: "u_omar", ownerName: "Omar Hassan", privacy: "private" },
  { id: "pod_sydney", label: "Sydney Sketch + Synthesize", description: "Sketch ingest + cross-domain bridge nights.", domains: ["Design", "Psychology"], coords: [151.2093, -33.8688], memberCount: 31, knowledgeDensity: 60, ownerId: "u_kai", ownerName: "Kai Pearson", privacy: "public" },
  { id: "pod_chennai", label: "Chennai Carnatic Brain", description: "Music theory ⇌ pattern recognition ⇌ compilers.", domains: ["Music", "Technology"], coords: [80.2707, 13.0827], memberCount: 22, knowledgeDensity: 49, ownerId: "u_lakshmi", ownerName: "Lakshmi Raj", privacy: "public" },
  { id: "pod_amsterdam", label: "Amsterdam Lattice", description: "Cycling-time mental model audio club.", domains: ["Mental_Models", "Sports"], coords: [4.9041, 52.3676], memberCount: 19, knowledgeDensity: 47, ownerId: "u_lotte", ownerName: "Lotte de Vries", privacy: "public" },
  { id: "pod_paris", label: "Paris Polymath Cercle", description: "Decomposition × counterpoint × persona modelling.", domains: ["Music", "Mathematics"], coords: [2.3522, 48.8566], memberCount: 26, knowledgeDensity: 52, ownerId: "u_henri", ownerName: "Henri Bertrand", privacy: "public" },
  { id: "pod_saopaulo", label: "São Paulo Synth Lab", description: "Cross-domain transfer learning circle.", domains: ["Psychology", "Technology"], coords: [-46.6333, -23.5505], memberCount: 33, knowledgeDensity: 57, ownerId: "u_carla", ownerName: "Carla Mendes", privacy: "public" },
  { id: "pod_capetown", label: "Cape Town Compiler Lounge", description: "Type systems × sports decomposition.", domains: ["Technology", "Sports"], coords: [18.4241, -33.9249], memberCount: 18, knowledgeDensity: 44, ownerId: "u_thando", ownerName: "Thando Khumalo", privacy: "public" },
  { id: "pod_seoul", label: "Seoul Second Brain", description: "Obsidian + MemPalace daily synthesis.", domains: ["Technology", "Psychology"], coords: [126.978, 37.5665], memberCount: 44, knowledgeDensity: 67, ownerId: "u_jisoo", ownerName: "Jisoo Park", privacy: "public", nextEvent: { title: "Daily synthesis sprint", whenISO: "2026-06-30T11:00:00Z" } },
  { id: "pod_mumbai", label: "Mumbai Mind Map Meet", description: "Reasoning arena nightly.", domains: ["Mental_Models", "Business"], coords: [72.8777, 19.076], memberCount: 51, knowledgeDensity: 70, ownerId: "u_anika", ownerName: "Anika Verma", privacy: "public" },
  { id: "pod_austin", label: "Austin Compose & Compile", description: "Music + code paired learning.", domains: ["Music", "Technology"], coords: [-97.7431, 30.2672], memberCount: 28, knowledgeDensity: 55, ownerId: "u_jordan", ownerName: "Jordan Lee", privacy: "public" },
  { id: "pod_mexico", label: "CDMX Sketch Brain", description: "Drawing → graph → debate sessions.", domains: ["Design", "Communication"], coords: [-99.1332, 19.4326], memberCount: 21, knowledgeDensity: 48, ownerId: "u_diego", ownerName: "Diego Soto", privacy: "public" },
];

function modFor(seed: string, density: number): { status: ModerationStatus; toxicityScore: number; reviewedAt: string; reason?: string } {
  const h = seed.charCodeAt(seed.length - 1) % 10;
  if (h < 6) return { status: "approved", toxicityScore: Math.round(2 + (10 - density) * 0.3), reviewedAt: new Date(Date.now() - h * 86400000).toISOString() };
  if (h < 8) return { status: "pending_review", toxicityScore: Math.round(8 + h), reviewedAt: new Date(Date.now() - 2 * 86400000).toISOString() };
  if (h === 8) return { status: "flagged", toxicityScore: 42, reviewedAt: new Date().toISOString(), reason: "off-topic reports × 2" };
  return { status: "approved", toxicityScore: 4, reviewedAt: new Date(Date.now() - 14 * 86400000).toISOString() };
}

export function buildMockPods(): CommunityPod[] {
  return SEED.map((p, i) => ({
    ...p,
    moderation: modFor(p.id, p.knowledgeDensity),
    createdAt: new Date(Date.now() - (60 + i * 3) * 86400000).toISOString(),
  }));
}

function ring(lng: number, lat: number, r: number, n = 24) {
  const ring: number[][] = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    ring.push([lng + Math.cos(a) * r * 1.3, lat + Math.sin(a) * r]);
  }
  return ring;
}

export function buildMockRegions(): CommunityRegion[] {
  const pods = buildMockPods();
  return pods.map((p) => ({
    id: `region_${p.id}`,
    label: p.label,
    density: p.knowledgeDensity,
    podCount: 1,
    geometry: {
      type: "Polygon",
      coordinates: [ring(p.coords[0], p.coords[1], 3 + p.knowledgeDensity / 20)],
    },
  }));
}
