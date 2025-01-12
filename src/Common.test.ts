import { expect, test } from "vitest";
import { normalize } from "./Common";

const COORDS_1 = [
  [
    [0.0, 0.0],
    [1.0, 0.0],
    [1.0, 1.0],
    [0.0, 1.0],
    [0.0, 0.0],
  ],
];

const COORDS_2 = [
  [
    [2.0, 2.0],
    [3.0, 2.0],
    [3.0, 3.0],
    [2.0, 3.0],
    [2.0, 2.0],
  ],
];

const POLYGON = {
  type: "Polygon",
  coordinates: COORDS_1,
};

const MULTIPOLYGON = {
  type: "MultiPolygon",
  coordinates: [COORDS_1, COORDS_2],
};

test("normalizes a featurecollection", () => {
  expect(
    normalize({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Polygon", coordinates: COORDS_1 },
        },
        {
          type: "Feature",
          geometry: { type: "Polygon", coordinates: COORDS_2 },
        },
      ],
    }),
  ).toStrictEqual([
    { type: "Polygon", coordinates: COORDS_1 },
    { type: "Polygon", coordinates: COORDS_2 },
  ]);
});

test("normalizes a feature with a polygon", () => {
  expect(normalize({ type: "Feature", geometry: POLYGON })).toStrictEqual([
    POLYGON,
  ]);
});

test("normalizes a feature with a multipolygon", () => {
  expect(normalize({ type: "Feature", geometry: MULTIPOLYGON })).toStrictEqual([
    { type: "Polygon", coordinates: COORDS_1 },
    { type: "Polygon", coordinates: COORDS_2 },
  ]);
});

test("normalizes a polygon geometry", () => {
  expect(normalize(POLYGON)).toStrictEqual([POLYGON]);
});

test("normalizes a multipolygon geometry", () => {
  expect(normalize(MULTIPOLYGON)).toStrictEqual([
    { type: "Polygon", coordinates: COORDS_1 },
    { type: "Polygon", coordinates: COORDS_2 },
  ]);
});

test("ignores non-Polygons", () => {
  expect(normalize({ type: "Point", coordinates: [0, 0] })).toStrictEqual([]);
});
