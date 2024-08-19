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
  Uuid: string;
  Timestamp: string;
  ElemsTotal: number;
  Complete: boolean;
  SizeBytes: number;
  Elapsed: number;
}

function ShowComponent() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map>();
  const [result, setResult] = useState<Result>();
  const [name, setName] = useState<string>();

  useEffect(() => {
    const map = initializeMap(mapContainerRef.current!);
    mapRef.current = map;
    fetch(`${FILES_ENDPOINT}/${getUuid()}_region.json`)
      .then((resp) => resp.json())
      .then((j) => {
        setName(j.SanitizedName);
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
  });

  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const uuid = query.get("uuid");
    fetch(`${API_ENDPOINT}/${uuid}`)
      .then((x) => x.json())
      .then((j) => {
        if (j.Complete) {
          setResult(j);
        }
        // if (j.SanitizedRegionType === "geojson") {
        //   const geojson = j.SanitizedRegionData;
        //   const poly_coords = geojson.coordina;tes[0]
        //     .slice(0, -1)
        //     .map((x: [number, number]) => [x[1], x[0]]);
        // } else if (j.SanitizedRegionType === "bbox") {
        //   const split = j.SanitizedRegionData;
        // }
      });

    return () => {};
  }, []);

  return (
    <div className="main">
      <Header />
      <div className="content">
        <div className="sidebar">
          {result ? (
            <div>
              <p>Snapshot Time {result.Timestamp}</p>
              <p>Elements {result.ElemsTotal}</p>
              <p>Size {result.SizeBytes}</p>
              <p>Time Elapsed {result.Elapsed}</p>
            </div>
          ) : null}
          <a href={`${FILES_ENDPOINT}/${getUuid()}.osm.pbf`} download={`${name}.osm.pbf`}>Download</a>
        </div>
        <div className="mapContainer">
          <div ref={mapContainerRef} className="map"></div>
        </div>
      </div>
    </div>
  );
}

export default ShowComponent;
