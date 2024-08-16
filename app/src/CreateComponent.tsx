import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
// import cover from "@mapbox/tile-cover";
// import tilebelt from "@mapbox/tilebelt";
import { OSMX_ENDPOINT, initializeMap } from "./Common";
import { Header } from "./CommonComponents";
import maplibregl from "maplibre-gl";
import {
  TerraDraw,
  TerraDrawSelectMode,
  TerraDrawRectangleMode,
  TerraDrawAngledRectangleMode,
  TerraDrawPolygonMode,
  TerraDrawCircleMode,
  TerraDrawMapLibreGLAdapter,
} from "terra-draw";
import { polygonToCells, cellsToMultiPolygon, H3Index } from "h3-js";
import { Polygon, MultiPolygon } from "geojson";

const LIMIT = 100000000;

const estimateH3 = (
  polygons: Polygon[],
): { nodes: number; geojson: MultiPolygon } => {
  let cells: H3Index[] = [];
  for (const polygon of polygons) {
    cells = [
      ...cells,
      ...polygonToCells(polygon.coordinates as number[][][], 5, true),
    ];
  }
  return {
    nodes: 0,
    geojson: {
      type: "MultiPolygon",
      coordinates: cellsToMultiPolygon(cells, true),
    },
  };
};

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
    const map = initializeMap(mapContainerRef.current!);
    mapRef.current = map;

    map.on("load", () => {
      map.addSource("heatmap", {
        type: "geojson",
        data: {
          type: "MultiPolygon",
          coordinates: [],
        },
      });
      map.addLayer({
        id: "heatmap-fill",
        type: "fill",
        source: "heatmap",
        paint: {
          "fill-color": "steelblue",
          "fill-opacity": 0.5,
        },
      });
      map.addLayer({
        id: "heatmap-stroke",
        type: "line",
        source: "heatmap",
        paint: {
          "line-color": "steelblue",
        },
      });
    });

    const draw = new TerraDraw({
      adapter: new TerraDrawMapLibreGLAdapter({ map: map, lib: maplibregl }),
      modes: [
        new TerraDrawSelectMode({
          keyEvents: {
            delete: "Backspace",
            deselect: null,
            rotate: null,
            scale: null,
          },
          styles: {
            selectedPolygonOutlineColor: "#0000ff",
            selectedPolygonOutlineWidth: 2,
            selectedPolygonColor: "#0000ff",
            selectionPointColor: "#0000ff",
            selectionPointOutlineWidth: 2,
          },
          flags: {
            rectangle: {
              feature: {},
            },
            "angled-rectangle": {
              feature: {},
            },
            polygon: {
              feature: {
                coordinates: {
                  draggable: true,
                },
              },
            },
            circle: {
              feature: {},
            },
          },
        }),
        new TerraDrawRectangleMode(),
        new TerraDrawAngledRectangleMode(),
        new TerraDrawPolygonMode(),
        new TerraDrawCircleMode(),
      ],
    });
    draw.start();

    const doEstimate = () => {
      const features = draw.getSnapshot().map((f) => f.geometry);
      const estimate = estimateH3(features as Polygon[]);
      const heatmap = map.getSource("heatmap") as maplibregl.GeoJSONSource;
      if (heatmap) {
        heatmap.setData(estimate.geojson);
      }
    };

    draw.on("finish", () => {
      doEstimate();
      draw.setMode("select");
    });

    draw.on("change", (_: (string | number)[], type: string) => {
      if (type === "delete") {
        doEstimate();
      }
    });
    drawRef.current = draw;

    return () => {
      map.remove();
      mapRef.current = undefined;
      drawRef.current = undefined;
    };
  }, []);

  const create = () => {
    window.location.href = "/show/?uuid=abc";
  };

  const startMode = (mode: string) => {
    console.log("start mode", mode);
    if (drawRef.current) {
      drawRef.current.setMode(mode);
    }
  };

  return (
    <div className="main">
      <Header />
      <div className="content">
        <div className="sidebar">
          {updatedTimestamp}
          <button onClick={() => startMode("rectangle")}>Rectangle</button>
          <button onClick={() => startMode("angled-rectangle")}>
            Angled Rectangle
          </button>
          <button onClick={() => startMode("polygon")}>Polygon</button>
          <button onClick={() => startMode("circle")}>Circle</button>
          <div>
            <input placeholder="name this area..." />
            <p>Paste bbox or GeoJSON:</p>
            <textarea value="abcd" />
          </div>
          <button className="create" onClick={create}>
            Create
          </button>
        </div>
        <div className="mapContainer">
          <div ref={mapContainerRef} className="map"></div>
        </div>
      </div>
    </div>
  );
}

export default CreateComponent;
