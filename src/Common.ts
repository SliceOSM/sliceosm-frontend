export const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT || "/api";
export const FILES_ENDPOINT = import.meta.env.VITE_FILES_ENDPOINT || "/files";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Polygon, MultiPolygon } from "geojson";

export const initializeMap = (mapContainerRef: HTMLDivElement) => {
  if (maplibregl.getRTLTextPluginStatus() === "unavailable") {
    maplibregl.setRTLTextPlugin(
      "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js",
      true,
    );
  }
  const map = new maplibregl.Map({
    style: "https://americanamap.org/style.json",
    container: mapContainerRef,
    attributionControl: false,
    hash: true,
  });
  map.addControl(
    new maplibregl.AttributionControl({
      compact: false,
    }),
  );
  map.addControl(new maplibregl.NavigationControl(), "top-right");
  return map;
};

export function getBounds(
  geojson: Polygon | MultiPolygon,
): [[number, number], [number, number]] {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  function updateBounds(coords: number[][]) {
    for (const coord of coords) {
      const [x, y] = coord;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }

  if (geojson.type === "Polygon") {
    for (const ring of geojson.coordinates) {
      updateBounds(ring);
    }
  } else if (geojson.type === "MultiPolygon") {
    for (const polygon of geojson.coordinates) {
      for (const ring of polygon) {
        updateBounds(ring);
      }
    }
  }

  return [
    [minX, minY],
    [maxX, maxY],
  ];
}

export function normalize(input: unknown): Polygon[] {
  if (input.type === "Polygon") {
    return [input];
  } else if (input.type === "MultiPolygon") {
    return input.coordinates.map((p) => {
      return { type: "Polygon", coordinates: p };
    });
  } else if (input.type === "Feature") {
    return normalize(input.geometry);
  } else if (input.type === "FeatureCollection") {
    return input.features.flatMap((f) => normalize(f));
  }
  return [];
}
