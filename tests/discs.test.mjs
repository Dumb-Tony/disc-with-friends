import test from "node:test";
import assert from "node:assert/strict";
import { discs, discConfig } from "../src/discs.js";
import { defaults } from "../src/config.js";
import { simulate } from "../src/physics.js";
test("midrange preserves baseline tuning exactly; profiles never mutate it", () => {
  assert.deepEqual(discConfig(defaults, "midrange", 0.7), defaults);
  for (const d of discs) {
    const base = { ...defaults };
    discConfig(base, d.id);
    assert.deepEqual(base, defaults);
  }
});
test("putter, midrange and driver have distinct useful ranges and repeatable flight", () => {
  const results = discs.map((d) => {
    const spec = { aim: 0, power: 0.7, bank: 0 },
      c = discConfig(defaults, d.id, 0.7),
      a = simulate(spec, c, { x: 999, z: 999 });
    assert.deepEqual(a, simulate(spec, c, { x: 999, z: 999 }));
    return a.state;
  });
  assert.ok(results[0].z + 15 < results[1].z);
  assert.ok(results[1].z + 15 < results[2].z);
  assert.ok(Math.abs(results[0].x) < Math.abs(results[1].x));
});
test("underpowered driver fades sooner and loses glide; all legal release extremes settle", () => {
  assert.ok(
    discConfig(defaults, "driver", 0.2).fade >
      discConfig(defaults, "driver", 1).fade,
  );
  for (const d of discs)
    for (const power of [0.05, 0.5, 1])
      for (const bank of [-Math.PI / 2, 0, Math.PI / 2]) {
        const s = simulate(
          { power, bank, pitch: 0.6 },
          discConfig(defaults, d.id, power),
          { x: 999, z: 999 },
        ).state;
        assert.equal(s.phase, "rest");
        assert.ok(Number.isFinite(s.x) && Number.isFinite(s.z));
      }
});
