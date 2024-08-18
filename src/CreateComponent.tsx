import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import cover from "@mapbox/tile-cover";
import tilebelt from "@mapbox/tilebelt";
import { API_ENDPOINT, initializeMap } from "./Common";
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
import { Polygon, MultiPolygon, Feature, FeatureCollection } from "geojson";

const degeneratePolygon = (p: Polygon) => {
  if (p.coordinates.length === 0) return true;
  const ring = p.coordinates[0];
  const [firstPoint] = ring;
  return ring.every(
    (point) => point[0] === firstPoint[0] && point[1] === firstPoint[1],
  );
};

const estimateWebMercatorTile = async (
  polygons: Polygon[],
  canvas: Promise<Uint8ClampedArray>,
): Promise<{ nodes: number; geojson: FeatureCollection }> => {
  const arr = await canvas;
  const getPixel = (base: number, z: number, x: number, y: number): number => {
    // uses the red channel and green channel
    if (z < base) {
      const dz = Math.pow(2, base - z);
      let retval = 0;
      for (let ix = x * dz; ix < x * dz + dz; ix++) {
        for (let iy = y * dz; iy < y * dz + dz; iy++) {
          const red = arr[4 * 4096 * iy + 4 * ix];
          const green = arr[4 * 4096 * iy + 4 * ix + 1];
          retval += red * 256 + green;
        }
      }
      return retval;
    } else if (z === base) {
      const red = arr[4 * 4096 * y + 4 * x];
      const green = arr[4 * 4096 * y + 4 * x + 1];
      return red * 256 + green;
    } else {
      // z > base
      const dz = Math.pow(2, z - base);
      x = Math.floor(x / dz);
      y = Math.floor(y / dz);
      const red = arr[4 * 4096 * y + 4 * x];
      const green = arr[4 * 4096 * y + 4 * x + 1];
      return (red * 256 + green) / (dz * dz);
    }
  };

  let limits;
  let covering;

  const mp: MultiPolygon = {
    type: "MultiPolygon",
    coordinates: polygons.map((p) => p.coordinates),
  };

  for (let cz = 0; cz <= 14; cz++) {
    limits = { min_zoom: cz, max_zoom: cz };
    covering = cover.tiles(mp, limits);
    if (covering.length > 256) break;
  }

  const cells: Feature[] = [];
  let max_pxl = -Infinity;
  let sum = 0;

  covering!.forEach((t) => {
    const pxl = getPixel(12, t[2], t[0], t[1]);
    sum += pxl;
    if (pxl > max_pxl) max_pxl = pxl;
    cells.push({
      type: "Feature",
      geometry: tilebelt.tileToGeoJSON(t),
      properties: { pxl: pxl },
    });
  });
  return {
    nodes: sum * 32,
    geojson: { type: "FeatureCollection", features: cells },
  };
};

const loadWebMercatorTile = (): Promise<Uint8ClampedArray> => {
  const img = new Image();
  const canvas = document.createElement("canvas");
  canvas.width = 4096;
  canvas.height = 4096;
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  return new Promise((resolve) => {
    img.addEventListener("load", () => {
      context.drawImage(img, 0, 0);
      resolve(context.getImageData(0, 0, 4096, 4096).data);
    });
    img.src = "/z12_red_green.png";
  });
};

function CreateComponent() {
  // data fetched from server
  const canvasPromiseRef = useRef<Promise<Uint8ClampedArray>>();
  const nodesLimitRef = useRef<Promise<number>>();
  const [updatedTimestamp, setUpdatedTimestamp] = useState<string>();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map>();
  const drawRef = useRef<TerraDraw>();

  const [textAreaValue, setTextAreaValue] = useState<string>("");
  const [nodesEstimate, setNodesEstimate] = useState<number>(0);
  const [regionType, setRegionType] = useState<string>();
  const [regionData, setRegionData] = useState<
    string | Polygon | MultiPolygon
  >();
  const [name, setName] = useState<string>("");

  useEffect(() => {
    canvasPromiseRef.current = loadWebMercatorTile();
  }, []);

  useEffect(() => {
    fetch(API_ENDPOINT)
      .then((x) => x.json())
      .then((j) => {
        setUpdatedTimestamp(formatDistanceToNow(parseISO(j.Timestamp)));
        nodesLimitRef.current = new Promise((resolve) => {
          resolve(j.NodesLimit);
        });
      });
  }, []);

  useEffect(() => {
    const map = initializeMap(mapContainerRef.current!);
    mapRef.current = map;

    map.on("load", () => {
      try {
        map.addSource("heatmap", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
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
      } catch (e) {
        console.error(e);
      }
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

    const updateRegion = async () => {
      const geometries = draw
        .getSnapshot()
        .map((f) => f.geometry)
        .filter((p) => !degeneratePolygon(p as Polygon)) as Polygon[];

      // TODO: handle b box
      setRegionType("geojson");
      if (geometries.length === 1) {
        setRegionData({
          type: "Polygon",
          coordinates: geometries[0].coordinates,
        });
      } else {
        setRegionData({
          type: "MultiPolygon",
          coordinates: geometries.map((g) => g.coordinates),
        });
      }

      const estimate = await estimateWebMercatorTile(
        geometries,
        canvasPromiseRef.current!,
      );
      const heatmap = map.getSource("heatmap") as maplibregl.GeoJSONSource;
      if (heatmap) {
        heatmap.setData(estimate.geojson);
      }
      setNodesEstimate(estimate.nodes);
    };

    draw.on("finish", () => {
      updateRegion();
      draw.setMode("select");
    });

    draw.on("change", (_: (string | number)[], type: string) => {
      if (type === "delete" || type === "create") {
        updateRegion();
      }
    });
    drawRef.current = draw;

    return () => {
      map.remove();
      mapRef.current = undefined;
      drawRef.current = undefined;
    };
  },[]);

  const create = async () => {
    const body = {
      RegionType: regionType,
      RegionData: regionData,
      Name: name,
    };
    const result = await fetch(API_ENDPOINT, {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (result.status === 201) {
      const uuid = await result.text();
      window.location.href = `/show/?uuid=${uuid}`;
    } else {
      console.log(await result.text());
    }
  };

  const startMode = (mode: string) => {
    if (drawRef.current) {
      drawRef.current.setMode(mode);
    }
  };

  const loadTextArea = () => {
    if (!drawRef.current || !mapRef.current) return;
    const isBbox = /^(\d+(\.\d+)?,){3}\d+(\.\d+)?$/;
    if (isBbox.test(textAreaValue)) {
      const arr = textAreaValue.split(",");
      const minX = +arr[0];
      const minY = +arr[1];
      const maxX = +arr[2];
      const maxY = +arr[3];
      drawRef.current.clear();
      drawRef.current.addFeatures([
        {
          type: "Feature",
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [minX, minY],
                [minX, maxY],
                [maxX, maxY],
                [maxX, minY],
                [minX, minY],
              ],
            ],
          },
          properties: {
            mode: "polygon",
          },
        },
      ]);
      drawRef.current.setMode("select");
      mapRef.current.fitBounds(
        [
          [minX, minY],
          [maxX, maxY],
        ],
        { padding: 60, animate: false },
      );
    } else {
      const parsed = JSON.parse(textAreaValue);
      parsed.properties.mode = "polygon";
      drawRef.current.clear();
      drawRef.current.addFeatures([parsed]);
      drawRef.current.setMode("select");
    }
  };

  return (
    <div className="main">
      <Header />
      <div className="content">
        <div className="sidebar">
          <p>Data updated {updatedTimestamp} ago</p>
          <button onClick={() => startMode("rectangle")}>Rectangle</button>
          <button onClick={() => startMode("angled-rectangle")}>
            Angled Rectangle
          </button>
          <button onClick={() => startMode("polygon")}>Polygon</button>
          <button onClick={() => startMode("circle")}>Circle</button>
          <div>
            <p>Paste bbox or GeoJSON:</p>
            <textarea
              value={textAreaValue}
              onChange={(e) => setTextAreaValue(e.target.value)}
            />
            <button onClick={loadTextArea}>Load</button>
          </div>
          <p>Estimated nodes: {nodesEstimate}</p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="name this area..."
          />
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
