import { useState, useEffect, useRef } from "react";
import { formatDistanceToNow, parseISO } from "date-fns";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { OSMX_ENDPOINT, RESULT_ENDPOINT } from "./common";

const query = new URLSearchParams(location.search);
const uuid = query.get("uuid");

function ShowComponent() {
  const mapContainerRef = useRef();
  const [regionType, setRegionType] = useState();
  const [regionData, setRegionData] = useState();
  const [name, setName] = useState();

  const download = () => {
    window.location = `${RESULT_ENDPOINT}/${uuid}.osm.pbf`;
  };

  useEffect(() => {
    const map = L.map(mapContainerRef.current).setView([40, -100], 5);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    fetch(`${RESULT_ENDPOINT}/${uuid}_task.json`)
      .then((x) => x.json())
      .then((j) => {
        setName(j.Name);
        var polygon;
        if (j.SanitizedRegionType === "geojson") {
          var geojson = j.SanitizedRegionData;
          const poly_coords = geojson.coordinates[0]
            .slice(0, -1)
            .map((x) => [x[1], x[0]]);
          polygon = L.polygon(poly_coords, { color: "#19A974", weight: 2 });
        } else if (j.SanitizedRegionType === "bbox") {
          const split = j.SanitizedRegionData;
          polygon = L.rectangle(
            [
              [split[0], split[1]],
              [split[2], split[3]],
            ],
            { color: "#19A974", weight: 2 },
          );
        }
        if (map._mapPane) {
          polygon.addTo(map);
          map.fitBounds(polygon.getBounds());
        }
      });

    return () => {
      map.remove();
    };
  }, []);

  return (
    <div className="flex flex-grow flex-col">
      <div className="flex flex-grow">
        <div className="w-1/2 lg:w-1/4 overflow-y-auto">
          <div className="m-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Download OpenStreetMap
            </h3>
            <a href="/" className="text-green-600">
              &larr; Back to create new
            </a>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-gray-500">
              {name || uuid}
            </p>
            <span className="inline-flex w-full shadow-sm mt-6">
              <button
                type="button"
                className="w-full items-center px-6 py-3 border border-transparent text-base leading-6 font-medium text-white bg-green-600 hover:bg-green-500 focus:outline-none focus:border-green-700 focus:shadow-outline-green active:bg-green-700 transition ease-in-out duration-150"
                onClick={download}
              >
                Download
              </button>
            </span>
            <div className="text-sm mt-1 text-gray-500">
              Downloaded files are licensed{" "}
              <a
                className="text-green-800"
                href="https://www.openstreetmap.org/copyright"
              >
                ODbL.
              </a>
            </div>
          </div>
        </div>
        <div className="w-1/2 lg:w-3/4 flex">
          <div
            ref={mapContainerRef}
            className="flex flex-grow z-0"
            style={{ height: "100vh" }}
          ></div>
        </div>
      </div>
    </div>
  );
}

export default ShowComponent;
