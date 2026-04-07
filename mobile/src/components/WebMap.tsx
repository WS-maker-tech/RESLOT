import React, { useEffect, useRef, useState } from "react";
import { View, Text, Platform } from "react-native";
import { C, FONTS, RADIUS } from "@/lib/theme";

interface Marker {
  id: string;
  lat: number;
  lng: number;
  image: string;
  name: string;
}

interface WebMapProps {
  center: [number, number];
  zoom?: number;
  markers?: Marker[];
  onMarkerPress?: (id: string) => void;
  style?: object;
  interactive?: boolean;
}

const MAPBOX_TOKEN =
  process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? "";

export function WebMap({
  center,
  zoom = 13,
  markers = [],
  onMarkerPress,
  style,
  interactive = true,
}: WebMapProps) {
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<any[]>([]);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!containerRef.current || mapInitialized) return;

    // Inject Mapbox GL JS + CSS dynamically
    if (!document.querySelector('link[href*="mapbox-gl"]')) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://api.mapbox.com/mapbox-gl-js/v3.9.0/mapbox-gl.css";
      document.head.appendChild(css);
    }

    if (!(window as any).mapboxgl && !document.querySelector('script[src*="mapbox-gl"]')) {
      const js = document.createElement("script");
      js.src = "https://api.mapbox.com/mapbox-gl-js/v3.9.0/mapbox-gl.js";
      document.head.appendChild(js);
    }

    // Wait longer for script to load
    const tryInit = () => {
      const mapboxgl = (window as any).mapboxgl;
      if (!mapboxgl) return false;

      try {
        mapboxgl.accessToken = MAPBOX_TOKEN;

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/standard",
          center: [center[1], center[0]],
          zoom,
          interactive,
          attributionControl: false,
          antialias: true,
        });

        map.on("style.load", () => {
          try {
            map.setConfigProperty("basemap", "lightPreset", "day");
            map.setConfigProperty("basemap", "showPointOfInterestLabels", true);
            map.setConfigProperty("basemap", "showTransitLabels", false);
          } catch (e) {}
        });

        map.on("load", () => setMapInitialized(true));
        map.on("error", () => setError(true));

        mapRef.current = map;
        return true;
      } catch (e) {
        setError(true);
        return true;
      }
    };

    if (!tryInit()) {
      // Poll until mapboxgl loads from CDN
      const interval = setInterval(() => {
        if (tryInit()) clearInterval(interval);
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  // Update center
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({ center: [center[1], center[0]], zoom, duration: 800 });
  }, [center[0], center[1]]);

  // Update markers
  useEffect(() => {
    if (!mapInitialized || !mapRef.current) return;
    const mapboxgl = (window as any).mapboxgl;
    if (!mapboxgl) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    markers.forEach((marker) => {
      if (!marker.lat || !marker.lng) return;

      const el = document.createElement("div");
      el.style.cssText = "display:flex;flex-direction:column;align-items:center;cursor:pointer;";
      el.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;">
          <div style="
            width:36px;height:36px;border-radius:18px;
            background:#3d7a3a;
            border:2.5px solid white;
            box-shadow:0 3px 12px rgba(61,122,58,0.45);
            display:flex;align-items:center;justify-content:center;
          ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 11l19-9-9 19-2-8-8-2z"/>
            </svg>
          </div>
          <div style="
            width:0;height:0;
            border-left:6px solid transparent;
            border-right:6px solid transparent;
            border-top:8px solid #3d7a3a;
            margin-top:-1px;
          "></div>
          <div style="
            margin-top:4px;background:white;padding:3px 9px;
            border-radius:10px;box-shadow:0 1px 6px rgba(0,0,0,0.12);
            max-width:120px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
          ">
            <span style="font-size:11px;font-weight:600;color:#111827;">${marker.name}</span>
          </div>
        </div>
      `;

      if (onMarkerPress) el.addEventListener("click", () => onMarkerPress(marker.id));

      const m = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([marker.lng, marker.lat])
        .addTo(mapRef.current);

      markersRef.current.push(m);
    });
  }, [mapInitialized, JSON.stringify(markers.map((m) => m.id))]);

  if (Platform.OS !== "web") {
    return (
      <View style={[{ backgroundColor: C.bgInput, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.lg }, style]}>
        <Text style={{ fontFamily: FONTS.medium, fontSize: 14, color: C.textSecondary }}>
          Karta kommer snart
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[{ backgroundColor: C.bgInput, alignItems: "center", justifyContent: "center", borderRadius: RADIUS.lg }, style]}>
        <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.textTertiary }}>
          Kunde inte ladda karta
        </Text>
      </View>
    );
  }

  return (
    <View style={[{ overflow: "hidden", position: "relative" }, style]}>
      {!mapInitialized && (
        <View style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          alignItems: "center", justifyContent: "center",
          backgroundColor: "#FAFAF8", zIndex: 1,
        }}>
          <Text style={{ fontFamily: FONTS.medium, fontSize: 13, color: C.textTertiary }}>
            Laddar karta...
          </Text>
        </View>
      )}
      {/* @ts-ignore */}
      <div ref={containerRef} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
    </View>
  );
}

export function StaticWebMap({ center, zoom = 15, style }: { center: [number, number]; zoom?: number; style?: object }) {
  return <WebMap center={center} zoom={zoom} markers={[]} style={style} interactive={false} />;
}
