import test from "node:test";
import assert from "node:assert/strict";
import { holes, inWater } from "../src/course.js";
import { waterOutline, containsWater } from "../src/water-shape.js";
test("organic pond outline is irregular and exact visible edges bracket the water hazard", () => {
  const w = holes[2].water[0],
    pts = waterOutline(w);
  const radii = pts.map((p) =>
    Math.hypot((p.x - w.x) / w.rx, (p.z - w.z) / w.rz),
  );
  assert.ok(Math.max(...radii) - Math.min(...radii) > 0.15);
  for (let i = 0; i < pts.length; i += 7) {
    const p = pts[i];
    assert.equal(
      containsWater(w, w.x + (p.x - w.x) * 0.98, w.z + (p.z - w.z) * 0.98),
      true,
    );
    assert.equal(
      containsWater(w, w.x + (p.x - w.x) * 1.02, w.z + (p.z - w.z) * 1.02),
      false,
    );
  }
});
test("creek is one continuous winding hazard with dry drop zones", () => {
  const h = holes[1];
  assert.equal(h.water.length, 1);
  const w = h.water[0];
  for (let x = -26; x <= 26; x += 0.5) {
    const center = w.z + Math.sin(((x + 24) / 4) * 0.65) * 2.3;
    assert.equal(containsWater(w, x, center), true);
    assert.equal(containsWater(w, x, center + 4), false);
  }
  assert.equal(inWater(w.drop.x, w.drop.z, h.water), undefined);
});
