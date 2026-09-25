import test from "node:test";
import assert from "node:assert/strict";
import { launch, step, simulate } from "../src/physics.js";
import { defaults, basket } from "../src/config.js";
import { trees } from "../src/course.js";
const still = { ...defaults, gravity: 0, lift: 0, drag: 0, turn: 0, fade: 0 };
test("swept trunk contact deflects fast discs and leaves a playable lie", () => {
  const tree = trees[0],
    s = Object.assign(launch({ lie: { x: tree.x, z: tree.z - 2 } }), {
      y: 1,
      vx: 0,
      vy: 0,
      vz: 100,
    });
  for (let i = 0; i < 10 && !s.treeHits; i++)
    step(s, still, 1 / 120, null, trees);
  assert.equal(s.event, "wood");
  assert.ok(s.vz < 0);
  assert.ok(Math.hypot(s.x - tree.x, s.z - tree.z) > tree.trunkRadius + 0.24);
});
test("foliage absorbs a flight without a hard ricochet", () => {
  const tree = trees[0],
    s = Object.assign(launch({ lie: { x: tree.x + 1, z: tree.z - 4 } }), {
      y: 3,
      vx: 0,
      vy: 0,
      vz: 15,
    });
  for (let i = 0; i < 60 && !s.treeHits; i++)
    step(s, still, 1 / 120, null, trees);
  assert.equal(s.event, "leaves");
  assert.ok(s.vz > 0 && s.vz < 10);
  assert.ok(s.vy < 0);
});
test("hole supports a clear flank and a precise direct ace, with punished gate misses", () => {
  const safe = simulate(
    { aim: 0.3, power: 0.5 },
    defaults,
    basket,
    trees,
  ).state;
  assert.equal(safe.treeHits, undefined);
  assert.ok(safe.z > 30 && safe.z < 36);
  assert.ok(safe.x > 9);
  const miss = simulate(
    { aim: 0.1, power: 0.5 },
    defaults,
    basket,
    trees,
  ).state;
  assert.ok(miss.treeHits > 0);
  assert.ok(miss.z < safe.z);
  const ace = simulate(
    { aim: 0, power: 213 / 240 },
    defaults,
    basket,
    trees,
  ).state;
  assert.equal(ace.scored, true);
  assert.deepEqual(
    miss,
    simulate({ aim: 0.1, power: 0.5 }, defaults, basket, trees).state,
  );
});
