import { useState, useEffect, useRef } from "react";
import { RESULT_ENDPOINT } from "./common";

const query = new URLSearchParams(location.search);
const uuid = query.get("uuid");

function ShowComponent() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState<string>();

  const download = () => {
    window.location.href = `${RESULT_ENDPOINT}/${uuid}.osm.pbf`;
  };

  useEffect(() => {
    fetch(`${RESULT_ENDPOINT}/${uuid}_task.json`)
      .then((x) => x.json())
      .then((j) => {
        setName(j.Name);
        if (j.SanitizedRegionType === "geojson") {
          const geojson = j.SanitizedRegionData;
          const poly_coords = geojson.coordinates[0]
            .slice(0, -1)
            .map((x:[number, number]) => [x[1], x[0]]);
          console.log(geojson);
          console.log(poly_coords);
        } else if (j.SanitizedRegionType === "bbox") {
          const split = j.SanitizedRegionData;
          console.log(split);
        }
      });

    return () => {
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
          { name }
          <button onClick={download}>Download</button>
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

export default ShowComponent;
