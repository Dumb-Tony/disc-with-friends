import test from "node:test";
import assert from "node:assert/strict";
import { launch, step, simulate } from "../src/physics.js";
import { defaults, FIXED_DT } from "../src/config.js";
import { ThrowInput } from "../src/input.js";
test("moving mouse right aims right in the +Z-facing camera", () => {
  const i = new ThrowInput();
  i.move(100, 0);
  assert.ok(i.aim < 0);
  assert.ok(launch({ aim: i.aim }).vx < 0);
});
test("identical initial conditions reproduce every sampled state", () => {
  const spec = { aim: 0.2, bank: 0.3, power: 0.8 };
  assert.deepEqual(simulate(spec), simulate(spec));
});
test("power gesture locks aim and bank, supports backing off, then releases once", () => {
  const i = new ThrowInput();
  i.move(40, 0);
  i.down(2);
  i.move(30, 0);
  i.up(2);
  const aim = i.aim,
    bank = i.bank;
  i.down(0);
  i.move(90, 200);
  assert.equal(i.aim, aim);
  assert.equal(i.bank, bank);
  i.move(-80, -80);
  assert.equal(i.power, 0.5);
  assert.deepEqual(i.up(0), { aim, bank, power: 0.5 });
  assert.equal(i.up(0), null);
});
test("neutral snap can be entered and left; RMB cancels a drawn throw", () => {
  const i = new ThrowInput();
  i.down(2);
  i.move(7, 0);
  assert.equal(i.bank, 0);
  i.move(20, 0);
  assert.ok(i.bank > 0);
  i.move(-27, 0);
  assert.equal(i.bank, 0);
  i.up(2);
  i.down(0);
  i.move(0, 200);
  i.down(2);
  assert.equal(i.up(0), null);
});
test("flat power progression is useful; hyzer left and anhyzer right", () => {
  const low = simulate({ power: 0.3 }, defaults, null).state,
    high = simulate({ power: 1 }, defaults, null).state;
  assert.ok(high.z > low.z * 2);
  assert.ok(simulate({ bank: -0.6, power: 0.8 }, defaults, null).state.x > 8);
  assert.ok(simulate({ bank: 0.6, power: 0.8 }, defaults, null).state.x < -8);
  assert.ok(high.skips > 0);
});
test("all supported shots settle finitely with no ground penetration", () => {
  for (const power of [0.02, 0.3, 0.7, 1])
    for (const bank of [-Math.PI / 4, 0, Math.PI / 4])
      for (const windX of [-8, 0, 8]) {
        const { state, path } = simulate(
          { power, bank },
          { ...defaults, windX },
          null,
        );
        assert.equal(state.phase, "rest");
        assert.ok(
          path.every(
            (s) => Number.isFinite(s.x) && Number.isFinite(s.z) && s.y >= 0.12,
          ),
        );
        assert.ok(state.time < 45);
      }
});
test("steep release can roll", () => {
  const { path } = simulate(
    { power: 0.7, bank: -Math.PI / 4 },
    { ...defaults, fade: 0.5 },
    null,
  );
  assert.ok(path.some((s) => s.phase === "roll"));
});
test("swept chain catch scores, fast shot rejects, outside shot misses", () => {
  const s = launch({ power: 0.1, lie: { x: 0, z: 54.8 } });
  s.vz = 5;
  s.vy = 0;
  step(s);
  assert.equal(s.scored, true);
  const fast = launch({ power: 1, lie: { x: 0, z: 54.3 } });
  fast.vz = 100;
  fast.vy = 0;
  step(fast);
  assert.equal(fast.scored, false);
  assert.ok(fast.vz < 0);
  const miss = launch({ lie: { x: 2, z: 54.8 } });
  step(miss);
  assert.equal(miss.scored, false);
});
test("120Hz tick results are independent of render frame grouping", () => {
  const run = (hz) => {
    const s = launch({ power: 0.8 });
    let acc = 0;
    for (let f = 0; f < hz * 12; f++) {
      acc += 1 / hz;
      while (acc + 1e-10 >= FIXED_DT) {
        step(s);
        acc -= FIXED_DT;
      }
    }
    return s;
  };
  assert.deepEqual(run(30), run(60));
  assert.deepEqual(run(60), run(144));
});
