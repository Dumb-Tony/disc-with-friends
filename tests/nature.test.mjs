import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { holes, course, inWater } from "../src/course.js";
import { Round } from "../src/round.js";
import { simulate, launch, step } from "../src/physics.js";
import { defaults, FIXED_DT } from "../src/config.js";
test("all nine authored routes play from tee to chains without teleporting or penalties", () => {
  const routes = JSON.parse(
    fs.readFileSync(new URL("./fixtures/nature-round.json", import.meta.url)),
  );
  assert.equal(routes.length, 9);
  assert.equal(course.par, 34);
  for (const route of routes) {
    const h = holes[route.hole - 1];
    let lie = { x: 0, z: 0 };
    for (const [i, shot] of route.shots.entries()) {
      // Recorded Windows coordinates can differ by a few ULPs on Linux.
      assert.ok(Math.hypot(shot.spec.lie.x-lie.x,shot.spec.lie.z-lie.z)<1e-8);
      const { state: s } = simulate({...shot.spec,lie}, defaults, h.pin, h);
      assert.ok(!s.hazard);
      assert.equal(!!s.scored, i === route.shots.length - 1);
      lie = { x: s.x, z: s.z };
    }
  }
});
test("nine-hole progression, restart, score totals and round restoration", () => {
  const r = new Round();
  for (let i = 0; i < 9; i++) {
    r.strokes = holes[i].par;
    r.finish();
    assert.equal(
      r.total,
      holes.slice(0, i + 1).reduce((n, h) => n + h.par, 0),
    );
    const saved = r.serialize({ x: 0, z: 0 });
    assert.equal(new Round().restore(saved), true);
    if (i < 8) assert.equal(r.advance(), true);
  }
  assert.equal(r.done, true);
  assert.equal(r.total, 34);
  assert.equal(r.relative, 0);
  assert.equal(r.advance(), false);
  r.restart();
  assert.equal(r.done, false);
  assert.equal(r.scores[8], null);
  assert.equal(r.scores.filter(Boolean).length, 8);
  assert.equal(new Round().restore({}), false);
});
test("tees, baskets and water drop zones are dry and away from trunks", () => {
  for (const h of holes)
    for (const p of [{ x: 0, z: 0 }, h.pin, ...h.water.map((w) => w.drop)]) {
      assert.equal(inWater(p.x, p.z, h.water), undefined, h.name);
      assert.ok(
        h.trees.every((t) => Math.hypot(t.x - p.x, t.z - p.z) > 1),
        h.name,
      );
    }
});
test("water catches ground shots but leaves airborne crossings alone", () => {
  const h = holes[1],
    base = launch({ aim: 0, bank: 0, power: 0.5 });
  for (const [height, wet] of [
    [0.1, true],
    [3, false],
  ]) {
    const s = { ...base, x: 10, z: 29, y: height, vx: 0, vz: 100, vy: 0 };
    for (let i = 0; i < 12 && s.phase !== "rest"; i++)
      step(s, defaults, FIXED_DT, h.pin, h);
    assert.equal(!!s.hazard, wet);
  }
});

test("rocks deflect swept low throws and remain deterministic", () => {
  const h = {
    pin: { x: 0, z: 80 },
    trees: [],
    water: [],
    rocks: [{ x: 0, z: 2, radius: 1, height: 1.5 }],
  };
  const run = () => {
    const s = {
      ...launch({ aim: 0, bank: 0, power: 1 }),
      x: 0,
      y: 0.5,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 100,
    };
    for (let i = 0; i < 3; i++) step(s, defaults, FIXED_DT, h.pin, h);
    return s;
  };
  const a = run();
  assert.ok(a.vz < 0);
  assert.deepEqual(a, run());
});
test("saved-round validation rejects inconsistent scores and future completed holes", () => {
  const r = new Round(),
    data = r.serialize({ x: 0, z: 0 });
  assert.equal(new Round().restore({ ...data, holed: "false" }), false);
  const future = structuredClone(data);
  future.scores[8] = { strokes: 2, penalties: 0 };
  assert.equal(new Round().restore(future), false);
  r.strokes = 3;
  r.finish();
  const mismatch = r.serialize({ x: 0, z: 0 });
  mismatch.strokes = 4;
  assert.equal(new Round().restore(mismatch), false);
});
