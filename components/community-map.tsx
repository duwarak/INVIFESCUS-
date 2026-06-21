"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { CommunityPod, CommunityRegion } from "../lib/community/types";

interface Props {
  pods: CommunityPod[];
  regions: CommunityRegion[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const STATUS_COLOR: Record<CommunityPod["moderation"]["status"], string> = {
  approved: "#22c55e",
  pending_review: "#f4a02e",
  flagged: "#ef476f",
  hidden: "#94a3b8",
  archived: "#64748b",
};

const STYLE = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    "osm-raster": {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap contributors",
    },
  },
  layers: [
    {
      id: "osm-raster-layer",
      type: "raster",
      source: "osm-raster",
      paint: {
        "raster-opacity": 0.55,
        "raster-saturation": -0.5,
      },
    },
  ],
} as any;

export default function CommunityMap({ pods, regions, selectedId, onSelect }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || mapRef.current) return;

    const map = new maplibregl.Map({
      container: wrap,
      style: STYLE,
      center: [15, 25],
      zoom: 1.6,
      attributionControl: false,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), "top-right");
    map.addControl(new maplibregl.AttributionControl({ compact: true }));

    map.on("load", () => {
      map.addSource("regions", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: regions.map((r) => ({
            type: "Feature",
            id: r.id,
            geometry: r.geometry,
            properties: { density: r.density, label: r.label },
          })),
        },
      });
      map.addLayer({
        id: "regions-fill",
        type: "fill",
        source: "regions",
        paint: {
          "fill-color": [
            "interpolate",
            ["linear"],
            ["get", "density"],
            40, "#cfe9ff",
            60, "#86c7ff",
            75, "#3b82f6",
            90, "#1d4ed8",
          ],
          "fill-opacity": 0.32,
        },
      });
      map.addLayer({
        id: "regions-line",
        type: "line",
        source: "regions",
        paint: {
          "line-color": "#1d4ed8",
          "line-width": 0.8,
          "line-opacity": 0.55,
        },
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const [id, m] of markersRef.current.entries()) {
      if (!pods.find((p) => p.id === id)) {
        m.remove();
        markersRef.current.delete(id);
      }
    }
    for (const p of pods) {
      const existing = markersRef.current.get(p.id);
      if (existing) {
        existing.setLngLat(p.coords);
        const el = existing.getElement();
        el.dataset.selected = selectedId === p.id ? "1" : "0";
        el.style.transform += "";
        continue;
      }
      const el = document.createElement("div");
      const color = STATUS_COLOR[p.moderation.status];
      const size = 14 + Math.round(p.knowledgeDensity / 8);
      el.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid #ffffff;box-shadow:0 0 0 2px ${color}66, 0 2px 6px rgba(15,23,42,0.35);cursor:pointer;transition:transform 120ms ease;`;
      el.dataset.selected = selectedId === p.id ? "1" : "0";
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        onSelect(p.id);
      });
      el.addEventListener("mouseenter", () => (el.style.transform = "scale(1.18)"));
      el.addEventListener("mouseleave", () => (el.style.transform = "scale(1)"));
      const marker = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat(p.coords)
        .addTo(map);
      markersRef.current.set(p.id, marker);
    }
  }, [pods, selectedId, onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const p = pods.find((x) => x.id === selectedId);
    if (!p) return;
    map.flyTo({ center: p.coords, zoom: 4.2, speed: 1.4, curve: 1.5 });
  }, [selectedId, pods]);

  return <div ref={wrapRef} className="w-full h-full" style={{ background: "#0c1220" }} />;
}
