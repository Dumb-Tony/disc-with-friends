import test from "node:test";
import assert from "node:assert/strict";
import { launch, step } from "../src/physics.js";
import { defaults } from "../src/config.js";
import { ChainStrand } from "../src/chain-motion.js";
import { chainLayout } from "../src/basket-shape.js";

const still = { ...defaults, gravity: 0, lift: 0, drag: 0, turn: 0, fade: 0 };
function direct(props = {}, config = still) {
  const s = Object.assign(
      launch({ power: 0.3, lie: { x: 0, z: 53 } }),
      { vx: 0, vy: 0, vz: 10, bank: 0 },
      props,
    ),
    events = [];
  for (let i = 0; i < 1200 && s.phase !== "rest"; i++) {
    step(s, config);
    if (s.event)
      events.push({
        event: s.event,
        impact: s.impact,
        time: s.time,
        y: s.y,
        scored: s.scored,
      });
    if (config === still && events.length) break;
  }
  return { s, events };
}
for (const [name, y] of [
  ["lower-rim", 0.74],
  ["upper-rim", 1.01],
  ["post", 0.35],
  ["band", 2.01],
])
  test(`${name} deflects instead of scoring`, () => {
    const { s, events } = direct({ y });
    assert.equal(events[0].impact.part, name);
    assert.equal(s.event, "metal");
    assert.ok(s.vz < 0);
    assert.equal(s.chainTouched, false);
    assert.equal(s.scored, false);
  });
test("swept rim collision stops a 100 m/s shot; grazing visible disc edge also collides", () => {
  const fast = direct({ y: 1.01, vz: 100 });
  assert.equal(fast.events[0].impact.part, "upper-rim");
  assert.ok(fast.s.vz < 0);
  const graze = direct({ x: 0.82, y: 0.74 });
  assert.equal(graze.events[0].impact.part, "lower-rim");
  assert.equal(graze.s.scored, false);
  const miss = direct({ x: 1, y: 0.74 });
  assert.equal(miss.events.length, 0);
  assert.equal(miss.s.chainTouched, false);
});
test("tray wires are solid; entering the basket below the chains earns no catch", () => {
  const { s, events } = direct({ y: 0.86 });
  assert.equal(events[0].impact.part, "tray");
  assert.equal(s.scored, false);
  assert.equal(s.chainTouched, false);
});
test("chain contact damps first, then drops onto tray before scoring", () => {
  const { s, events } = direct({ y: 1.65, vz: 7 }, defaults),
    hit = events.find((e) => e.event === "chains"),
    catchEvent = events.find((e) => e.event === "basket");
  assert.ok(hit);
  assert.equal(hit.scored, false);
  assert.ok(catchEvent);
  assert.ok(catchEvent.time > hit.time + 0.15);
  assert.ok(catchEvent.y < hit.y - 0.25);
  assert.equal(s.scored, true);
  assert.equal(s.phase, "rest");
});
test("fast and wide chain shots can reject instead of being magnetic catches", () => {
  const fast = direct({ y: 1.65, vz: 28 }, defaults);
  assert.ok(fast.s.chainTouched);
  assert.equal(fast.s.scored, false);
  const wide = direct({ x: 0.65, y: 1.65, vz: 12 }, defaults);
  assert.equal(wide.s.scored, false);
});
test("basket impacts, scoring and final state replay deterministically", () => {
  assert.deepEqual(
    direct({ y: 1.65, vz: 7 }, defaults),
    direct({ y: 1.65, vz: 7 }, defaults),
  );
});
test("dropping into the tray without chain contact does not award a score", () => {
  const { s } = direct(
    { x: 0.3, z: 55, y: 0.88, vx: 0, vy: -0.3, vz: 0 },
    defaults,
  );
  assert.equal(s.scored, false);
  assert.equal(s.chainTouched, false);
  assert.equal(s.phase, "rest");
});
test("chain motion is local, attached, damped and deterministic", () => {
  const layout = chainLayout[9],
    make = () => new ChainStrand(layout.top, layout.bottom);
  const hit = { x: 0, y: 1.45, z: -0.35, vx: 0, vy: 0, vz: 10 },
    strand = make(),
    copy = make(),
    baseline = make();
  strand.kick(hit);
  copy.kick(hit);
  const distance = () =>
    Math.max(
      ...strand.points.map((p, i) =>
        Math.hypot(
          p.x - baseline.points[i].x,
          p.y - baseline.points[i].y,
          p.z - baseline.points[i].z,
        ),
      ),
    );
  for (let i = 0; i < 30; i++) {
    strand.step();
    copy.step();
    baseline.step();
  }
  assert.deepEqual(strand.points, copy.points);
  assert.ok(distance() > 0.003);
  assert.deepEqual(strand.points[0], layout.top);
  assert.deepEqual(strand.points.at(-1), layout.bottom);
  for (let i = 0; i < 900; i++) {
    strand.step();
    baseline.step();
  }
  assert.ok(distance() < 0.002);
  assert.ok(
    strand.points.every((p) => Object.values(p).every(Number.isFinite)),
  );
  const near = make(),
    far = new ChainStrand(chainLayout[0].top, chainLayout[0].bottom);
  near.kick(hit);
  far.kick(hit);
  const energy = (s) =>
    s.previous.reduce(
      (sum, p, i) => sum + Math.hypot(p.x - s.points[i].x, p.z - s.points[i].z),
      0,
    );
  assert.ok(energy(near) > energy(far) * 5);
});
