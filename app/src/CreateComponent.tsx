import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
// import cover from "@mapbox/tile-cover";
// import tilebelt from "@mapbox/tilebelt";
import { OSMX_ENDPOINT, Header } from "./Common";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { TerraDraw, TerraDrawPolygonMode, TerraDrawMapLibreGLAdapter } from "terra-draw";
import { polygonToCells, cellsToMultiPolygon, H3Index } from "h3-js";
import "./reset.css";
import "./main.css";
import { Polygon, MultiPolygon } from "geojson";

const LIMIT = 100000000;

const estimateH3 = (polygons:Polygon[]):{nodes: number, geojson: MultiPolygon} => {
  let cells:H3Index[] = [];
  for (const polygon of polygons) {
    cells = [...cells, ...polygonToCells(polygon.coordinates as number[][][], 5, true)];
  }
  return {nodes: 0, geojson: {type:"MultiPolygon",coordinates:cellsToMultiPolygon(cells, true)}};
}

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
    console.log(LIMIT);
  }, []);

  useEffect(() => {
    const map = new maplibregl.Map({
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
    draw.on("finish", () => {
      const features = draw.getSnapshot().map(f => f.geometry);
      const estimate = estimateH3(features as Polygon[]);
      const heatmap = map.getSource("heatmap") as maplibregl.GeoJSONSource;
      if (heatmap) {
        heatmap.setData(estimate.geojson);
      }
    })
    drawRef.current = draw;

    return () => {
      map.remove();
      mapRef.current = undefined;
      drawRef.current = undefined;
    };
  }, []);

  const create = () => {
    window.location.href = "/show/?uuid=abc"
  }

  return (
    <div className="main">
      <Header/>
      <div className="content">
        <div className="sidebar">
          { updatedTimestamp }
          <textarea value="abcd"/>
          <button className="create" onClick={create}>Create</button>
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
