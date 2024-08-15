import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
// import cover from "@mapbox/tile-cover";
// import tilebelt from "@mapbox/tilebelt";
import { OSMX_ENDPOINT } from "./common";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { TerraDraw, TerraDrawPolygonMode, TerraDrawMapLibreGLAdapter } from "terra-draw";
import { polygonToCells, cellsToMultiPolygon } from "h3-js";
import "./reset.css";
import "./main.css";

const LIMIT = 100000000;

function CreateComponent() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map>();
  const drawRef = useRef<TerraDraw>();
  const [updatedTimestamp, setUpdatedTimestamp] = useState<string>();

  useEffect(() => {
    fetch(OSMX_ENDPOINT + "/timestamp")
      .then((x) => x.text())
      .then((t) => {
        setUpdatedTimestamp(formatDistanceToNow(parseISO(t.trim())));
      });
    console.log(`Nodes limit: ${LIMIT}`);
  }, []);

  useEffect(() => {
    var map = new maplibregl.Map({
      style: "https://americanamap.org/style.json",
      container: mapContainerRef.current!
    });
    mapRef.current = map;

    map.on("load", () => {
      map.addSource("heatmap", {
        type: "geojson",
        data: {
          type: "MultiPolygon",
          coordinates: [[[[0,0],[0,1],[1,1],[1,0],[0,0]]]]
        }
      });
      map.addLayer({
          'id': 'heatmap',
          'type': 'fill',
          'source': 'heatmap',
          'paint': {
              'fill-color': 'red'
          }
      });
    })

    const draw = new TerraDraw({ 
      adapter: new TerraDrawMapLibreGLAdapter({ map: map, lib: maplibregl }),
      modes: [new TerraDrawPolygonMode()] })
    draw.start();
    draw.setMode("polygon");
    draw.on("finish", (id: (string | number)) => {
      const features = draw.getSnapshot();
      const feature = features.filter((feature) => feature.id === id)[0];

      for (const polygon of feature.geometry.coordinates) {
        const result = cellsToMultiPolygon(polygonToCells(polygon as number[][], 5, true),true);
        const heatmap = map.getSource("heatmap") as maplibregl.GeoJSONSource;
        if (heatmap) {
          heatmap.setData({type: 'MultiPolygon', coordinates: result});
        }
      }
    })
    drawRef.current = draw;

    return () => {
      map.remove();
      mapRef.current = undefined;
      drawRef.current = undefined;
    };
  }, []);

  return (
    <div className="main">
      <div className="header">
        <span>
          <strong><a href="/">Downloads</a></strong>
        </span>
        <span>
          <a>About</a>
          <a>GitHub</a>
        </span>
      </div>
      <div className="content">
        <div className="sidebar">
          { updatedTimestamp }
          <textarea value="abcd"/>
          <button>Create</button>
        </div>
        <div className="mapContainer">
          <div
            ref={mapContainerRef}
            className="map"
          ></div>
        </div>
      </div>
    </div>
  );
}

export default CreateComponent;
