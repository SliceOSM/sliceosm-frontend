import { useState, useEffect, useRef } from "react";
import {
  API_ENDPOINT,
  FILES_ENDPOINT,
  initializeMap,
  getBounds,
} from "./Common";
import { Header } from "./CommonComponents";
import maplibregl from "maplibre-gl";

const getUuid = () => {
  const query = new URLSearchParams(location.search);
  return query.get("uuid");
};

interface Result {
  Timestamp: string;
  CellsProg: number;
  CellsTotal: number;
  NodesProg: number;
  NodesTotal: number;
  ElemsProg: number;
  ElemsTotal: number;
  Complete: boolean;
  SizeBytes: number;
  Elapsed: number;
}

const progressValue = (prog: number, total: number) => {
  if (total === 0) return 0.0;
  return prog / total;
};

function ShowComponent() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map>();
  const [result, setResult] = useState<Result>();
  const [name, setName] = useState<string>();

  useEffect(() => {
    const abortController = new AbortController();

    const map = initializeMap(mapContainerRef.current!);
    mapRef.current = map;
    fetch(`${FILES_ENDPOINT}/${getUuid()}_region.json`, {
      signal: abortController.signal,
    })
      .then((resp) => resp.json())
      .then((j) => {
        setName(j.SanitizedName);
        // if (j.SanitizedRegionType === "geojson") {
        //   const geojson = j.SanitizedRegionData;
        //   const poly_coords = geojson.coordina;tes[0]
        //     .slice(0, -1)
        //     .map((x: [number, number]) => [x[1], x[0]]);
        // } else if (j.SanitizedRegionType === "bbox") {
        //   const split = j.SanitizedRegionData;
        // }
        map.on("load", () => {
          try {
            map.addSource("region", {
              type: "geojson",
              data: j.SanitizedRegionData,
            });
            map.addLayer({
              id: "region",
              type: "fill",
              source: "region",
              paint: {
                "fill-color": "steelblue",
                "fill-opacity": 0.5,
              },
            });

            map.fitBounds(getBounds(j.SanitizedRegionData), {
              padding: 60,
              animate: false,
            });
          } catch (e) {
            console.error(e);
          }
        });
      });
    return () => {
      abortController.abort();
    };
  }, []);

  // fix double fetch
  useEffect(() => {
    const abortController = new AbortController();

    const poll = async () => {
      console.log("poll");
      const query = new URLSearchParams(location.search);
      const uuid = query.get("uuid");
      const resp = await fetch(`${API_ENDPOINT}/${uuid}`, {
        signal: abortController.signal,
      });
      const j = await resp.json();
      setResult(j);
      if (!j.Complete) {
        setTimeout(() => poll(), 3 * 1000);
      }
    };

    poll();

    return () => {
      abortController.abort();
    };
  }, []);
  return (
    <div className="main">
      <Header />
      <div className="content">
        <div className="sidebar">
          {result ? (
            <div>
              <p>Snapshot Time {result.Timestamp}</p>
              <p>
                <span>
                  {result.CellsProg} / {result.CellsTotal} cells
                </span>
                <progress
                  value={progressValue(result.CellsProg, result.CellsTotal)}
                />
              </p>
              <p>
                <span>
                  {result.NodesProg} / {result.NodesTotal} nodes
                </span>
                <progress
                  value={progressValue(result.NodesProg, result.NodesTotal)}
                />
              </p>
              <p>
                <span>
                  {result.ElemsProg} / {result.ElemsTotal} elements
                </span>
                <progress
                  value={progressValue(result.ElemsProg, result.ElemsTotal)}
                />
              </p>
            </div>
          ) : null}
          {result && result.Complete ? (
            <div>
              <p>Elements {result.ElemsTotal}</p>
              <p>Size {result.SizeBytes}</p>
              <p>Time Elapsed {result.Elapsed}</p>
              <a
                href={`${FILES_ENDPOINT}/${getUuid()}.osm.pbf`}
                download={`${name || getUuid()}.osm.pbf`}
              >
                Download
              </a>
            </div>
          ) : null}
        </div>
        <div className="mapContainer">
          <div ref={mapContainerRef} className="map"></div>
        </div>
      </div>
    </div>
  );
}

export default ShowComponent;
