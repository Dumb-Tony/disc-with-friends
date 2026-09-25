import test from "node:test";
import assert from "node:assert/strict";
import { launch, step, simulate } from "../src/physics.js";
import { defaults } from "../src/config.js";
const shot = (power, bank = Math.PI / 2) =>
  simulate({ power, bank, pitch: (40 * Math.PI) / 180 }, defaults, null);
test("overhand orientation passes vertical and inversion; higher power delays turnover", () => {
  const soft = shot(0.3),
    hard = shot(1),
    cross = (r) =>
      r.path.find((s) => Math.abs(s.bank) > Math.PI && s.phase === "flight");
  assert.ok(cross(soft));
  assert.ok(cross(hard));
  assert.ok(cross(hard).time > cross(soft).time + 0.5);
  assert.ok(cross(hard).z > cross(soft).z * 2);
  assert.ok(hard.path.some((s) => s.vx < -0.5));
  assert.ok(soft.path.some((s) => s.vx > 0.5));
  assert.deepEqual(hard, shot(1));
});
test("opposite vertical releases mirror their pan without random drift", () => {
  const left = shot(0.6, -Math.PI / 2),
    right = shot(0.6, Math.PI / 2);
  assert.ok(Math.abs(left.state.x + right.state.x) < 1e-8);
  assert.ok(Math.abs(left.state.z - right.state.z) < 1e-8);
});
test("top-down landings slide on the top rather than turning into edge rollers", () => {
  const s = Object.assign(launch({ bank: Math.PI / 2 }), {
    bank: Math.PI,
    y: 0.121,
    vy: -2,
    vx: 0,
    vz: 8,
  });
  step(s, defaults, 1 / 120, null);
  assert.equal(s.phase, "slide");
  assert.equal(s.skips, 0);
  for (let i = 0; i < 1000 && s.phase !== "rest"; i++)
    step(s, defaults, 1 / 120, null);
  assert.equal(s.phase, "rest");
  assert.ok(Math.abs(Math.abs(s.bank) - Math.PI) < 0.01);
});
test("steep edge impact loses speed rather than rolling away at full speed", () => {
  const s = Object.assign(launch({ bank: Math.PI / 2 }), {
    y: 0.121,
    vy: -10,
    vx: 0,
    vz: 10,
  });
  step(s, defaults, 1 / 120, null);
  assert.equal(s.phase, "slide");
  assert.ok(Math.hypot(s.vx, s.vz) < 4);
});
