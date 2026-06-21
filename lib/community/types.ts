export type ModerationStatus =
  | "approved"
  | "pending_review"
  | "flagged"
  | "hidden"
  | "archived";

export interface ModerationData {
  status: ModerationStatus;
  toxicityScore: number;
  reviewedAt?: string;
  reason?: string;
}

export interface CommunityPod {
  id: string;
  label: string;
  description: string;
  domains: string[];
  coords: [number, number];
  memberCount: number;
  knowledgeDensity: number;
  moderation: ModerationData;
  ownerId: string;
  ownerName: string;
  privacy: "public" | "private";
  createdAt: string;
  thumbnail?: string;
  nextEvent?: { title: string; whenISO: string };
}

export interface CommunityRegion {
  id: string;
  label: string;
  density: number;
  podCount: number;
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}
