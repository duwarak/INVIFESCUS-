// Responsible AI: never expose exact GPS coordinates
// Rounds to ~1.1km precision (2 decimal places of lat/lng)

export interface FuzzedLocation {
  lat: number;
  lng: number;
  zone: string; // human-readable approximate zone
}

export function anonymizeLocation(lat: number, lng: number): FuzzedLocation {
  const fuzzedLat = Math.round(lat * 100) / 100;
  const fuzzedLng = Math.round(lng * 100) / 100;

  return {
    lat: fuzzedLat,
    lng: fuzzedLng,
    zone: `Zone ${fuzzedLat.toFixed(1)},${fuzzedLng.toFixed(1)}`,
  };
}

// Check if a user is a minor (under 20 for this app's safety architecture)
export function isMinor(birthYear: number): boolean {
  const currentYear = new Date().getFullYear();
  return currentYear - birthYear < 20;
}

// Age-gate check: returns the required approval flow
export type ApprovalFlow = "self" | "parent_required";

export function getApprovalFlow(birthYear: number): ApprovalFlow {
  return isMinor(birthYear) ? "parent_required" : "self";
}
