import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import cover from "@mapbox/tile-cover";
import tilebelt from "@mapbox/tilebelt";
import "leaflet-editable";

const LIMIT = 100000000;

function CreateComponent() {
  const mapContainerRef = useRef();
  const mapRef = useRef();
  const leafletLayerSelectionRef = useRef();
  const canvasPromiseRef = useRef();
  const heatmapRef = useRef();
  const isDrawingRectangleRef = useRef(false);
  const [region, setRegion] = useState();

  const setGeom = () => {
    var l = leafletLayerSelectionRef.current.getLatLngs()[0];
    if (l.length === 0) return;

    var minLat = Infinity;
    var minLng = Infinity;
    var maxLat = -Infinity;
    var maxLng = -Infinity;
    l.forEach((c) => {
      if (c.lat < minLat) minLat = c.lat;
      if (c.lng < minLng) minLng = c.lng;
      if (c.lat > maxLat) maxLat = c.lat;
      if (c.lng > maxLng) maxLng = c.lng;
    });

    if (maxLat - minLat < 0.0000001 || maxLng - minLng < 0.0000001) {
      return;
    }

    var geojson = null;
    if (isDrawingRectangleRef.current) {
      // use only the 0 and 2 points,
      // because the leaflet.draw is not perfectly rectangular
      // minLat,minLon,maxLat,maxLon
      var bbox = [l[2].lat, l[2].lng, l[0].lat, l[0].lng];
      setRegion({ type: "bbox", data: bbox });
      geojson = {
        type: "Polygon",
        coordinates: [
          [
            [l[2].lng, l[2].lat],
            [l[0].lng, l[2].lat],
            [l[0].lng, l[0].lat],
            [l[2].lng, l[0].lat],
            [l[2].lng, l[2].lat],
          ],
        ],
      };
    } else {
      var geocoords = l.map((c) => [c.lng, c.lat]);
      geocoords.push(geocoords[0]);
      setRegion({
        type: "geojson",
        data: { type: "Polygon", coordinates: [geocoords] },
      });
      geojson = { type: "Polygon", coordinates: [geocoords] };
    }

    canvasPromiseRef.current.then((arr) => {
      var getPixel = (base, z, x, y) => {
        // uses the red channel and green channel
        if (z < base) {
          var dz = Math.pow(2, base - z);
          var retval = 0;
          for (var ix = x * dz; ix < x * dz + dz; ix++) {
            for (var iy = y * dz; iy < y * dz + dz; iy++) {
              var red = arr[4 * 4096 * iy + 4 * ix];
              var green = arr[4 * 4096 * iy + 4 * ix + 1];
              retval += red * 256 + green;
            }
          }
          return retval;
        } else if (z === base) {
          var red = arr[4 * 4096 * y + 4 * x];
          var green = arr[4 * 4096 * y + 4 * x + 1];
          return red * 256 + green;
        } else if (z > base) {
          dz = Math.pow(2, z - base);
          x = Math.floor(x / dz);
          y = Math.floor(y / dz);
          var red = arr[4 * 4096 * y + 4 * x];
          var green = arr[4 * 4096 * y + 4 * x + 1];
          return (red * 256 + green) / (dz * dz);
        }
      };

      var limits;
      var covering;
      for (var cz = 0; cz <= 14; cz++) {
        limits = { min_zoom: cz, max_zoom: cz };
        covering = cover.tiles(geojson, limits);
        if (covering.length > 256) break;
      }

      var cells = [];
      var max_pxl = -Infinity;
      var sum = 0;

      covering.forEach((t) => {
        var pxl = getPixel(12, t[2], t[0], t[1]);
        sum += pxl;
        if (pxl > max_pxl) max_pxl = pxl;
        cells.push({
          type: "Feature",
          geometry: tilebelt.tileToGeoJSON(t),
          properties: { pxl: pxl },
        });
      });

      const colors = ["#ffffcc", "#a1dab4", "#41b6c4", "#2c7fb8", "#253494"];

      var estimate = sum * 32;
      if (estimate > LIMIT) {
        leafletLayerSelectionRef.current.setStyle({
          fillColor: "#666",
          color: "#666",
        });
      } else {
        leafletLayerSelectionRef.current.setStyle({
          fillColor: "#19A974",
          color: "#19A974",
        });
      }

      const getClass = (val) => {
        var frac = val / max_pxl; // from 0 to 1
        var frac2 = frac * (colors.length - 1);
        return colors[Math.round(frac2)];
      };

      if (heatmapRef.current) mapRef.current.removeLayer(heatmapRef.current);
      heatmapRef.current = L.geoJSON(
        { type: "FeatureCollection", features: cells },
        {
          style: function (feature) {
            return {
              stroke: false,
              fillColor: getClass(feature.properties.pxl),
              fillOpacity: 0.2,
            };
          },
        },
      );
      heatmapRef.current.addTo(mapRef.current);
      console.log("Estimate of nodes:", estimate);
    });
  };

  useEffect(() => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    canvas.width = 4096;
    canvas.height = 4096;
    const context = canvas.getContext("2d");
    canvasPromiseRef.current = new Promise((resolve, reject) => {
      img.addEventListener("load", () => {
        context.drawImage(img, 0, 0);
        resolve(context.getImageData(0, 0, 4096, 4096).data);
      });
      img.src = "/z12_red_green.png";
    });

    const map = L.map(mapContainerRef.current, { editable: true }).setView(
      [40, -100],
      5,
    );
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    mapRef.current = map;

    map.on("editable:drawing:commit", (e) => setGeom(e));
    map.on("editable:vertex:dragend", (e) => setGeom(e));

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  const reset = (isFile) => {
    if (leafletLayerSelectionRef.current) {
      leafletLayerSelectionRef.current.remove();
      setRegion(null);
    }
    // files = [];
    // if (!isFile) fileInput.value = "";
  };

  const startPolygon = () => {
    reset(false);
    var e = mapRef.current.editTools.startPolygon();
    e.options.weight = 2;
    e.options.color = "#19A974";
    leafletLayerSelectionRef.current = e;
    isDrawingRectangleRef.current = false;
  };

  const startRectangle = () => {
    reset(false);
    var e = mapRef.current.editTools.startRectangle();
    e.options.weight = 1;
    e.options.color = "#19A974";
    leafletLayerSelectionRef.current = e;
    isDrawingRectangleRef.current = true;
  };

  return (
    <div className="flex flex-grow flex-col h-screen">
      <div className="flex flex-grow" style={{ minHeight: 0 }}>
        <div className="w-1/2 lg:w-1/4 overflow-y-auto">
          <div className="flex flex-grow">
            <div className="m-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Create OpenStreetMap Extract
              </h3>
              <p className="mt-1 max-w-2xl text-sm leading-5 text-gray-500">
                Download areas of raw OpenStreetMap data.
              </p>
              <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium leading-5 bg-green-100 text-green-800 mt-2">
                <svg
                  className="-ml-1 mr-1.5 h-2 w-2 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 8 8"
                >
                  <circle cx="4" cy="4" r="3" />
                </svg>
                Data updated n ago
              </span>
              <button
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm leading-5 font-medium text-white bg-green-600 hover:bg-green-500 focus:outline-none focus:border-green-700 focus:shadow-outline-green active:bg-green-700 transition duration-150 ease-in-out mt-6"
                onClick={startRectangle}
              >
                Draw Rectangle
              </button>
              <button
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm leading-5 font-medium text-white bg-green-600 hover:bg-green-500 focus:outline-none focus:border-green-700 focus:shadow-outline-green active:bg-green-700 transition duration-150 ease-in-out mt-6"
                onClick={startPolygon}
              >
                Draw Polygon
              </button>
              <div className="mt-4">
                Upload Shape
                <input
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm leading-5 font-medium text-white bg-green-600"
                  type="file"
                  accept="json,geojson"
                />
              </div>
              <label
                htmlFor="name"
                className="block text-sm font-medium leading-5 text-gray-700 mt-6"
              >
                Name this area
              </label>
              <div className="mt-1 relative shadow-sm">
                <input
                  id="name"
                  className="form-input block w-full sm:text-sm sm:leading-5"
                  placeholder="Null Island, Earth"
                />
              </div>
              <span className="inline-flex w-full shadow-sm mt-6">
                <button
                  type="button"
                  className="w-full items-center px-6 py-3 border border-transparent text-base leading-6 font-medium text-white bg-green-600 hover:bg-green-500 focus:outline-none focus:border-green-700 focus:shadow-outline-green active:bg-green-700 transition ease-in-out duration-150"
                >
                  Create Extract
                </button>
              </span>
              Downloaded files are distributed under the{" "}
              <a
                className="green"
                href="https://www.openstreetmap.org/copyright"
              >
                ODbL.
              </a>
              <br />
            </div>
          </div>
        </div>
        <div className="w-1/2 lg:w-3/4 flex">
          <div ref={mapContainerRef} className="flex flex-grow z-0"></div>
        </div>
      </div>
    </div>
  );
}

export default CreateComponent;
