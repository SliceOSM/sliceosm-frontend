export const API_ENDPOINT = (import.meta.env.VITE_API_ENDPOINT || "/api");
export const FILES_ENDPOINT = (import.meta.env.VITE_FILES_ENDPOINT || "/files");
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

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
  });
  map.addControl(
    new maplibregl.AttributionControl({
      compact: false,
    }),
  );
  map.addControl(new maplibregl.NavigationControl(), "top-right");
  return map;
};
