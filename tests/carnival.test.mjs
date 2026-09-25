import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { playground, playgroundHoles } from "../src/playground.js";
import { Round } from "../src/round.js";
import { launch, simulate } from "../src/physics.js";
import { defaults } from "../src/config.js";
import { collideGadgets, gadgetForces } from "../src/playground-physics.js";
test("two complete courses keep distinct save identities and score totals", () => {
  const round = new Round(),
    nature = round.serialize({ x: 0, z: 0 });
  round.start(0, false, playground.id);
  assert.equal(round.hole.name, "Welcome to the Bounce");
  for (const h of playgroundHoles) {
    round.strokes = h.par;
    round.finish();
    if (h.id < 9) assert.ok(round.advance());
  }
  assert.equal(round.total, playground.par);
  assert.equal(round.relative, 0);
  assert.ok(round.done);
  const copy = new Round();
  assert.ok(copy.restore(round.serialize({ x: 0, z: 98 })));
  assert.equal(copy.courseId, playground.id);
  assert.ok(copy.restore(nature));
  assert.equal(copy.course.mode, "Nature");
  assert.equal(copy.restore({ ...nature, course: "missing" }), false);
});
test("spring bumper catches a swept fast hit and reflects outward", () => {
  const o = { type: "bumper", x: 0, z: 5, r: 1, height: 3 };
  const s = { ...launch({}), x: 0, y: 1, z: 8, vx: 0, vy: 0, vz: 120 };
  collideGadgets(s, { x: 0, y: 1, z: 0 }, { gadgets: [o] });
  assert.ok(s.vz < 0);
  assert.ok(s.z < 4);
  assert.equal(s.bumperHits, 1);
});
test("fans push only inside their visible zone; ground pads launch low discs", () => {
  const o = playgroundHoles[2].gadgets[0],
    s = { ...launch({}), x: o.x, z: o.z, y: 2, vx: 0, vz: 0, vy: 0 };
  gadgetForces(s, { gadgets: [o] }, 0.1);
  assert.equal(s.vx, 0.5);
  assert.ok(Math.abs(s.vz - 0.3) < 1e-12);
  assert.ok(Math.abs(s.vy - 0.18) < 1e-12);
  s.x = 99;
  gadgetForces(s, { gadgets: [o] }, 0.1);
  assert.equal(s.vx, 0.5);
  Object.assign(s, { x: 0, y: 0.1, z: 0, vy: -5, time: 1 });
  collideGadgets(
    s,
    { x: 0, y: 1, z: 0 },
    { gadgets: [{ type: "pad", x: 0, z: 0, r: 2, kick: 9 }] },
  );
  assert.equal(s.vy, 9);
  assert.equal(s.phase, "flight");
});
test("portals preserve velocity and clear the swept segment at the exit", () => {
  const o = playgroundHoles[3].gadgets[0];
  const s = {
    ...launch({}),
    x: o.x,
    y: 2,
    z: o.z + 1,
    vx: 2,
    vy: -1,
    vz: 30,
    time: 1,
  };
  const old = { x: o.x, y: 2, z: o.z - 1 };
  collideGadgets(s, old, { gadgets: [o] });
  assert.equal(s.teleports, 1);
  assert.equal(s.x, o.exit.x);
  assert.equal(s.z, o.exit.z + 1.35);
  assert.deepEqual([s.vx, s.vy, s.vz], [2, -1, 30]);
  assert.deepEqual(old, { x: s.x, y: s.y, z: s.z });
});
test("windmill collision follows its launch phase, with exact replay", () => {
  const o = {
    type: "mill",
    x: 0,
    y: 4,
    z: 10,
    r: 4.5,
    width: 0.85,
    depth: 0.65,
    speed: 1,
  };
  const hit = (phase) => {
    const s = {
      ...launch({}),
      courseTime: phase,
      time: 0,
      x: 3,
      y: 4,
      z: 11,
      vx: 0,
      vy: 0,
      vz: 20,
    };
    collideGadgets(s, { x: 3, y: 4, z: 9 }, { gadgets: [o] });
    return s;
  };
  assert.ok(hit(0).vz < 0);
  assert.equal(hit(Math.PI / 4).vz, 20);
  assert.deepEqual(hit(0.2), hit(0.2));
  const spec = { aim: 0.02, power: 0.8, courseTime: 2.3 };
  assert.deepEqual(
    simulate(spec, defaults, playgroundHoles[1].pin, playgroundHoles[1]),
    simulate(spec, defaults, playgroundHoles[1].pin, playgroundHoles[1]),
  );
});
test("all nine carnival routes finish from real lies, including moving obstacle phase variations", () => {
  const routes = JSON.parse(
    fs.readFileSync(new URL("./fixtures/carnival-round.json", import.meta.url)),
  );
  for (const phase of [0, 1, 3, 7])
    for (const route of routes) {
      const h = playgroundHoles[route.hole - 1];
      let lie = { x: 0, z: 0 };
      for (const shot of route.shots) {
        const { state: s } = simulate(
          { ...shot.spec, lie, courseTime: phase },
          defaults,
          h.pin,
          h,
        );
        assert.ok(
          Math.hypot(s.x - shot.expected.x, s.z - shot.expected.z) < 1e-7,
          `Hole ${h.id}, phase ${phase}`,
        );
        assert.equal(!!s.scored, shot.expected.scored);
        assert.equal(s.phase, "rest");
        lie = { x: s.x, z: s.z };
      }
      assert.ok(route.shots.at(-1).expected.scored);
    }
});
