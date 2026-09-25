// Shared by the renderer and deterministic obstacle contacts.
export const hole = { name: "Pine Gate", par: 3, length: 55 };
export const trees = [
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
