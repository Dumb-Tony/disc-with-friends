import { treeRadius } from "./course.js";
// Sample the swept disc against the same trunk and tiered canopy used visually.
// Foliage absorbs momentum once per entry; trunks deflect with a wooden thud.
export function collideCourse(s, old, trees) {
  const steps = Math.max(
    1,
    Math.ceil(Math.hypot(s.x - old.x, s.y - old.y, s.z - old.z) / 0.08),
  );
  for (let i = 0; i <= steps; i++) {
    const t = i / steps,
      x = old.x + (s.x - old.x) * t,
      y = old.y + (s.y - old.y) * t,
      z = old.z + (s.z - old.z) * t;
    for (const tree of trees) {
      const dx = x - tree.x,
        dz = z - tree.z,
        d = Math.hypot(dx, dz);
      if (d > tree.width + 0.3) continue;
      const wood =
        y < tree.height * 0.58 && y > 0 && d < tree.trunkRadius + 0.24;
      const leaves =
        y > 0 && d < treeRadius(tree, y) + 0.24 && treeRadius(tree, y) > 0;
      if (!wood && !leaves) continue;
      if (!wood && s.foliageTree === tree.id) continue;
      const nx = d > 1e-6 ? dx / d : 0,
        nz = d > 1e-6 ? dz / d : -1;
      if (wood) {
        s.x = tree.x + nx * (tree.trunkRadius + 0.245);
        s.z = tree.z + nz * (tree.trunkRadius + 0.245);
        s.y = y;
        const vn = s.vx * nx + s.vz * nz;
        if (vn < 0) {
          s.vx = (s.vx - 1.35 * vn * nx) * 0.7;
          s.vz = (s.vz - 1.35 * vn * nz) * 0.7;
        }
        s.vy *= 0.75;
      } else {
        s.vx *= 0.48;
        s.vz *= 0.48;
        s.vy = Math.min(s.vy * 0.45, -0.3);
        s.spin *= 0.65;
        s.foliageTree = tree.id;
      }
      s.event = wood ? "wood" : "leaves";
      s.treeHits = (s.treeHits || 0) + 1;
      return;
    }
  }
  if (s.foliageTree !== undefined) {
    const tree = trees.find((t) => t.id === s.foliageTree);
    if (
      !tree ||
      Math.hypot(s.x - tree.x, s.z - tree.z) > treeRadius(tree, s.y) + 0.3
    )
      delete s.foliageTree;
  }
}
