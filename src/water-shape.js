// One sampled shoreline shared by drawing, minimap, grass masking and hazards.
const cache = new WeakMap();
export function waterOutline(w, margin = 0) {
  let variants = cache.get(w);
  if (!variants) {
    variants = new Map();
    cache.set(w, variants);
  }
  if (variants.has(margin)) return variants.get(margin);
  const points = [];
  if (w.kind === "creek") {
    const section = (t) => {
      const x = -27 + 54 * t;
      return {
        x: w.x + x + (t - 0.5) * margin * 2,
        z: w.z + Math.sin(((x + 24) / 4) * 0.65) * 2.3,
        width:
          2.45 +
          0.35 * Math.sin(t * 15 + 1) +
          0.2 * Math.cos(t * 25) +
          margin * (1 + 0.35 * Math.cos(t * 19)),
      };
    };
    for (const side of [-1, 1]) {
      for (let j = 0; j <= 64; j++) {
        const t = (side === -1 ? j : 64 - j) / 64,
          p = section(t);
        points.push({ x: p.x, z: p.z + side * p.width });
      }
      const end = section(side === -1 ? 1 : 0),
        start = side === -1 ? -Math.PI / 2 : Math.PI / 2;
      for (let j = 1; j < 16; j++) {
        const a = start + (j / 16) * Math.PI;
        points.push({
          x: end.x + Math.cos(a) * end.width,
          z: end.z + Math.sin(a) * end.width,
        });
      }
    }
  } else {
    const phase = w.x * 0.31 + w.z * 0.17;
    for (let i = 0; i < 128; i++) {
      const a = (i / 128) * Math.PI * 2,
        shape =
          1 +
          0.09 * Math.sin(a * 3 + phase) +
          0.055 * Math.cos(a * 5 - phase) +
          0.025 * Math.sin(a * 9);
      points.push({
        x:
          w.x +
          Math.cos(a) *
            (w.rx * shape + margin * (1 + 0.45 * Math.sin(a * 7 - phase))),
        z:
          w.z +
          Math.sin(a) *
            (w.rz * shape + margin * (1 + 0.45 * Math.sin(a * 7 - phase))),
      });
    }
  }
  variants.set(margin, points);
  return points;
}
export function containsWater(w, x, z, margin = 0) {
  if (
    Math.abs(x - w.x) > w.rx * 1.2 + margin ||
    Math.abs(z - w.z) > w.rz * 1.2 + margin
  )
    return false;
  const p = waterOutline(w, margin);
  let inside = false;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++)
    if (
      p[i].z > z !== p[j].z > z &&
      x < ((p[j].x - p[i].x) * (z - p[i].z)) / (p[j].z - p[i].z) + p[i].x
    )
      inside = !inside;
  return inside;
}
