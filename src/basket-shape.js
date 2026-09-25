// Shared world-space dimensions for rendering and deterministic contacts (metres).
export const basketShape = Object.freeze({
  postRadius: 0.055,
  postTop: 2.18,
  trayRadius: 0.64,
  rimTube: 0.022,
  lowerRimY: 0.74,
  upperRimY: 1.01,
  floorRadius: 0.38,
  floorY: 0.72,
  bandRadius: 0.595,
  bandBottom: 1.91,
  bandTop: 2.088,
  chainTop: 1.88,
  chainBottom: 1,
  chainBottomRadius: 0.14,
  discRadius: 0.24,
  discHalfThickness: 0.028,
});
export const chainLayout = [];
for (let row = 0; row < 2; row++)
  for (let i = 0; i < (row ? 12 : 18); i++) {
    const count = row ? 12 : 18,
      angle = ((i + 0.5 * row) / count) * Math.PI * 2,
      radius = row ? 0.31 : 0.51;
    chainLayout.push({
      angle,
      radius,
      top: {
        x: Math.sin(angle) * radius,
        y: basketShape.chainTop,
        z: Math.cos(angle) * radius,
      },
      bottom: {
        x: Math.sin(angle) * basketShape.chainBottomRadius,
        y: basketShape.chainBottom,
        z: Math.cos(angle) * basketShape.chainBottomRadius,
      },
    });
  }

const segments = [];
function segment(a, b, radius, part, restitution) {
  segments.push({ a, b, radius, part, restitution });
}
function ring(radius, y, tube, part) {
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2,
      b = ((i + 1) / 64) * Math.PI * 2;
    segment(
      { x: Math.sin(a) * radius, y, z: Math.cos(a) * radius },
      { x: Math.sin(b) * radius, y, z: Math.cos(b) * radius },
      tube,
      part,
      0.56,
    );
  }
}
ring(
  basketShape.trayRadius,
  basketShape.lowerRimY,
  basketShape.rimTube,
  "lower-rim",
);
ring(
  basketShape.trayRadius,
  basketShape.upperRimY,
  basketShape.rimTube,
  "upper-rim",
);
ring(0.36, 0.735, 0.012, "tray");
ring(0.16, 0.735, 0.015, "tray");
// The lower chain loop is flexible, handled by chain contacts rather than rigid metal.
segment(
  { x: 0, y: 0.045, z: 0 },
  { x: 0, y: basketShape.postTop, z: 0 },
  basketShape.postRadius,
  "post",
  0.5,
);
for (let i = 0; i < 24; i++) {
  const a = (i / 24) * Math.PI * 2,
    s = Math.sin(a),
    c = Math.cos(a);
  segment(
    { x: s * 0.38, y: 0.72, z: c * 0.38 },
    { x: s * 0.64, y: 1.01, z: c * 0.64 },
    0.009,
    "tray",
    0.32,
  );
  segment(
    { x: 0, y: 0.72, z: 0 },
    { x: s * 0.38, y: 0.72, z: c * 0.38 },
    0.009,
    "tray",
    0.25,
  );
}
export const basketMetal = segments;
