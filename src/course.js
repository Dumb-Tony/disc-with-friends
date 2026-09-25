// Coordinates are local to each hole; visible obstacles and physics share this data.
const pine = (x, z, height = 9, width = 2.5) => ({
  x,
  z,
  height,
  width,
  trunkRadius: 0.34,
});
const grove = (points) =>
  points.map(([x, z, h, w]) => pine(x, z, h || 9, w || 2.5));
const pond = (x, z, rx, rz, drop) => ({ x, z, rx, rz, drop });
const creek = (z, drop) =>
  Array.from({ length: 13 }, (_, i) =>
    pond((i - 6) * 4, z + Math.sin(i * 0.65) * 2.3, 3.3, 2.7, drop),
  );
const rock = (x, z, radius = 1.8, height = 1.3) => ({ x, z, radius, height });
const openingTrees = [
  { x: -3.2, z: 24, height: 9, width: 2.5 },
  { x: 3.2, z: 24, height: 8.5, width: 2.5 },
  { x: -7.5, z: 27, height: 10, width: 2.8 },
  { x: -5.5, z: 39, height: 8, width: 2.2 },
  { x: -11, z: 43, height: 10, width: 2.8 },
  { x: 15, z: 29, height: 9, width: 2.5 },
  { x: 12, z: 44, height: 8, width: 2.3 },
  { x: -8, z: 61, height: 9, width: 2.5 },
  { x: 8, z: 64, height: 10, width: 2.8 },
].map((t, id) => ({ ...t, id, trunkRadius: 0.34 }));
export const holes = [
  {
    name: "Pine Gate",
    par: 3,
    pin: { x: 0, z: 55 },
    hint: "Thread the gate, or follow the wide fairway on the left.",
    route: [
      [0, 0],
      [8, 19],
      [9, 34],
      [0, 55],
    ],
    trees: openingTrees,
    water: [],
    rocks: [],
  },
  {
    name: "Willow Brook",
    par: 3,
    pin: { x: 6, z: 64 },
    hint: "Carry the shallow brook, or skirt its left end. Keep the approach low under the pines.",
    route: [
      [0, 0],
      [10, 20],
      [10, 44],
      [6, 64],
    ],
    trees: grove([
      [-7, 17],
      [18, 22],
      [-10, 43],
      [20, 48],
      [-3, 57],
      [15, 71],
    ]),
    water: creek(32, { x: 10, z: 23 }),
    rocks: [rock(-2, 49, 1.7, 1)],
  },
  {
    name: "Mirror Pond",
    par: 4,
    pin: { x: -10, z: 82 },
    hint: "The pond guards the direct line. Lay up along the broad left bank, then turn toward the green.",
    route: [
      [0, 0],
      [15, 28],
      [14, 56],
      [-10, 82],
    ],
    trees: grove([
      [-14, 19],
      [25, 27],
      [26, 51],
      [-20, 65],
      [-2, 71],
      [3, 91],
    ]),
    water: [pond(-3, 43, 12, 18, { x: 12, z: 21 })],
    rocks: [rock(-18, 77), rock(9, 67, 2, 1.6)],
  },
  {
    name: "Cedar Bend",
    par: 4,
    pin: { x: 24, z: 102 },
    hint: "Place the drive in the clearing to the left, then shape your approach around the cedar stand.",
    route: [
      [0, 0],
      [18, 31],
      [26, 64],
      [24, 102],
    ],
    trees: grove([
      [-4, 22],
      [3, 33],
      [5, 43],
      [6, 54],
      [-2, 62],
      [9, 72],
      [13, 82],
      [38, 45],
      [38, 69],
      [36, 91],
      [15, 111],
    ]),
    water: [],
    rocks: [rock(21, 51, 2.1, 1.4), rock(32, 87, 1.6, 1.1)],
  },
  {
    name: "Needle Alley",
    par: 3,
    pin: { x: 0, z: 70 },
    hint: "Two staggered gates reward a controlled low line. An overhand can clear the first canopy.",
    route: [
      [0, 0],
      [0, 24],
      [-5, 43],
      [0, 70],
    ],
    trees: grove([
      [-3.4, 22, 8, 2.3],
      [3.4, 22, 8, 2.3],
      [-8, 39, 10, 2.5],
      [1, 40, 10, 2.3],
      [-12, 53],
      [8, 56],
      [8, 29],
      [-10, 20],
    ]),
    water: [],
    rocks: [rock(6, 64, 1.3, 0.9)],
  },
  {
    name: "Twin Crossings",
    par: 5,
    pin: { x: -8, z: 124 },
    hint: "Two brooks divide the fairway into landing areas. Cross one at a time for a steady route to par.",
    route: [
      [0, 0],
      [6, 25],
      [10, 62],
      [-8, 95],
      [-8, 124],
    ],
    trees: grove([
      [-10, 18],
      [19, 26],
      [-12, 54],
      [24, 65],
      [3, 73],
      [-20, 100],
      [8, 110],
      [-17, 133],
    ]),
    water: [...creek(40, { x: 7, z: 30 }), ...creek(85, { x: 9, z: 75 })],
    rocks: [rock(-4, 58, 2, 1.5), rock(-16, 111, 1.8, 1.2)],
  },
  {
    name: "Stone Pocket",
    par: 3,
    pin: { x: 9, z: 62 },
    hint: "Boulders guard the green. A soft landing is safer than skipping past the basket into the pond.",
    route: [
      [0, 0],
      [-4, 26],
      [4, 45],
      [9, 62],
    ],
    trees: grove([
      [-10, 20],
      [8, 23],
      [19, 40],
      [-8, 48],
      [21, 70],
    ]),
    water: [pond(8, 77, 11, 7, { x: 0, z: 63 })],
    rocks: [
      rock(4, 54, 2, 1.6),
      rock(14, 56, 1.8, 1.4),
      rock(16, 65, 1.6, 1.1),
    ],
  },
  {
    name: "Lakeside Reach",
    par: 4,
    pin: { x: -18, z: 136 },
    hint: "The lake tempts a long shortcut. The mown left shoreline leaves a safer second approach.",
    route: [
      [0, 0],
      [18, 35],
      [20, 76],
      [3, 110],
      [-18, 136],
    ],
    trees: grove([
      [-16, 25],
      [30, 37],
      [32, 71],
      [29, 94],
      [-5, 104],
      [-30, 127],
      [-10, 148],
    ]),
    water: [pond(-6, 72, 17, 31, { x: 16, z: 31 })],
    rocks: [rock(11, 49, 1.8, 1.2), rock(-23, 117, 2, 1.5)],
  },
  {
    name: "Homeward Waters",
    par: 5,
    pin: { x: 0, z: 166 },
    hint: "Choose your landing areas: skirt the first pond, cross the last brook, then split the final pines.",
    route: [
      [0, 0],
      [16, 36],
      [14, 70],
      [-8, 100],
      [-9, 140],
      [0, 166],
    ],
    trees: grove([
      [-10, 21],
      [28, 37],
      [27, 62],
      [-18, 82],
      [3, 90],
      [15, 110],
      [-21, 129],
      [-4, 149, 9, 2.4],
      [5, 149, 9, 2.4],
      [-12, 175],
      [14, 176],
    ]),
    water: [
      pond(-4, 46, 12, 19, { x: 13, z: 22 }),
      ...creek(119, { x: -8, z: 108 }),
    ],
    rocks: [
      rock(-10, 69, 2, 1.5),
      rock(10, 95, 2, 1.3),
      rock(10, 160, 1.8, 1.3),
    ],
  },
].map((h, index) => ({
  ...h,
  id: index + 1,
  length: Math.round(Math.hypot(h.pin.x, h.pin.z)),
  trees: h.trees.map((t, id) => ({ ...t, id })),
  water: h.water.map((w, id) => ({ ...w, id })),
  rocks: h.rocks.map((r, id) => ({ ...r, id })),
}));
export const course = {
  id: "sunny-pines-v1",
  name: "Sunny Pines",
  mode: "Nature",
  par: holes.reduce((s, h) => s + h.par, 0),
  holes,
};
// Opening-hole exports preserve isolated mechanics fixtures.
export const hole = holes[0],
  trees = hole.trees;
export function inWater(x, z, water, margin = 0) {
  return water.find(
    (w) =>
      ((x - w.x) / (w.rx + margin)) ** 2 + ((z - w.z) / (w.rz + margin)) ** 2 <=
      1,
  );
}
export function treeRadius(tree, y) {
  let radius = 0;
  for (let tier = 0; tier < 5; tier++) {
    const height = tree.height * 0.38,
      center = tree.height * (0.35 + tier * 0.135);
    const bottom = center - height / 2;
    if (y >= bottom && y <= bottom + height)
      radius = Math.max(
        radius,
        tree.width * (1 - tier * 0.155) * (1 - (y - bottom) / height),
      );
  }
  return radius;
}
