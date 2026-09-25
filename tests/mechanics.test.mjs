import test from "node:test";
import assert from "node:assert/strict";
import { launch, step, simulate } from "../src/physics.js";
import { defaults, FIXED_DT, pitchLimits } from "../src/config.js";
import { ThrowInput } from "../src/input.js";
test("moving mouse right aims right in the +Z-facing camera", () => {
  const i = new ThrowInput();
  i.move(100, 0);
  assert.ok(i.aim < 0);
  assert.ok(launch({ aim: i.aim }).vx < 0);
});
test("identical initial conditions reproduce every sampled state", () => {
  const spec = { aim: 0.2, pitch: 0.5, bank: 0.3, power: 0.8 };
  assert.deepEqual(simulate(spec), simulate(spec));
});
test("power gesture locks aim and bank, supports backing off, then releases once", () => {
  const i = new ThrowInput();
  i.move(40, 0);
  i.down(2);
  i.move(30, 0);
  i.up(2);
  const aim = i.aim,
    pitch = i.pitch,
    bank = i.bank;
  i.down(0);
  i.move(90, 200);
  assert.equal(i.aim, aim);
  assert.equal(i.bank, bank);
  assert.equal(i.pitch, pitch);
  i.move(-80, -80);
  assert.equal(i.power, 0.5);
  assert.deepEqual(i.up(0), { aim, pitch, bank, power: 0.5 });
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
    for (const bank of [
      -Math.PI / 2,
      -Math.PI / 4,
      0,
      Math.PI / 4,
      Math.PI / 2,
    ])
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

test("bank reaches either vertical limit, reverses immediately, and stays locked for release", () => {
  for (const sign of [-1, 1]) {
    const input = new ThrowInput();
    input.down(2);
    input.move(sign * 1000, 0);
    assert.equal(input.bank, (sign * Math.PI) / 2);
    input.move(-sign * 10, 0);
    assert.ok(Math.abs(input.bank) < Math.PI / 2);
    input.move(sign * 10, 0);
    input.up(2);
    input.down(0);
    input.move(80, 160);
    const spec = input.up(0);
    assert.equal(spec.bank, (sign * Math.PI) / 2);
    const shot = launch(spec);
    step(shot, defaults, FIXED_DT, null);
    assert.ok(
      Math.abs(shot.bank) > 1.55,
      "first tick must not snap back to the old cap",
    );
  }
});
test("high vertical releases settle and replay deterministically", () => {
  for (const bank of [-Math.PI / 2, Math.PI / 2]) {
    const spec = { bank, pitch: (55 * Math.PI) / 180, power: 0.8 };
    const a = simulate(spec, defaults, null),
      b = simulate(spec, defaults, null);
    assert.deepEqual(a, b);
    assert.equal(a.state.phase, "rest");
    assert.ok(a.path.every((s) => Number.isFinite(s.y) && s.y >= 0.12));
    assert.ok(a.state.time < 45);
  }
});
