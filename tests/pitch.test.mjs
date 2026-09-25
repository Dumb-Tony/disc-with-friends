import test from "node:test";
import assert from "node:assert/strict";
import { ThrowInput } from "../src/input.js";
import { launch, simulate } from "../src/physics.js";
import { defaults, pitchLimits } from "../src/config.js";

test("mouse up raises pitch, down lowers it, bounded with immediate reversal", () => {
  const input = new ThrowInput(),
    initial = input.pitch;
  input.move(0, -60);
  assert.ok(input.pitch > initial);
  input.move(0, 120);
  assert.ok(input.pitch < initial);
  input.move(0, -10000);
  assert.equal(input.pitch, pitchLimits.max);
  input.move(0, 1);
  assert.ok(input.pitch < pitchLimits.max);
  input.move(0, 10000);
  assert.equal(input.pitch, pitchLimits.min);
  input.move(0, -1);
  assert.ok(input.pitch > pitchLimits.min);
});
test("bank gesture leaves vertical aim alone; draw locks pitch through backoff and cancel", () => {
  const i = new ThrowInput();
  i.move(0, -80);
  const pitch = i.pitch;
  i.down(2);
  i.move(30, 100);
  i.up(2);
  assert.equal(i.pitch, pitch);
  i.down(0);
  i.move(200, 240);
  i.move(-50, -100);
  assert.equal(i.pitch, pitch);
  const shot = i.up(0);
  assert.equal(shot.pitch, pitch);
  assert.equal(shot.power, 140 / 240);
  i.down(0);
  i.move(0, 200);
  i.cancel();
  assert.equal(i.up(0), null);
  assert.equal(i.pitch, pitch);
});
test("pitch selects elevation without changing throw speed; explicit zero is horizontal", () => {
  const pitches = [pitchLimits.min, 0, 0.3, pitchLimits.max];
  const states = pitches.map((pitch) => launch({ pitch, power: 0.8 }));
  assert.ok(states[0].vy < 0);
  assert.equal(states[1].vy, 0);
  assert.ok(states[3].vy > states[2].vy);
  const speeds = states.map((s) => Math.hypot(s.vx, s.vy, s.vz));
  assert.ok(speeds.every((s) => Math.abs(s - speeds[0]) < 1e-10));
  assert.deepEqual(launch({ pitch: (10 * Math.PI) / 180 }), launch({}));
  assert.equal(
    launch({ pitch: 100 }).vy,
    launch({ pitch: pitchLimits.max }).vy,
  );
});
test("high and low lines are distinct and deterministic; pitch extremes settle", () => {
  const high = simulate({ pitch: 0.7, power: 0.8 }, defaults, null),
    low = simulate({ pitch: -0.2, power: 0.8 }, defaults, null);
  assert.ok(
    Math.max(...high.path.map((s) => s.y)) >
      Math.max(...low.path.map((s) => s.y)) + 5,
  );
  assert.deepEqual(high, simulate({ pitch: 0.7, power: 0.8 }, defaults, null));
  for (const pitch of [pitchLimits.min, 0, pitchLimits.max])
    for (const bank of [-0.78, 0, 0.78])
      for (const power of [0.02, 0.5, 1]) {
        const result = simulate({ pitch, bank, power }, defaults, null);
        assert.equal(result.state.phase, "rest");
        assert.ok(result.state.time < 45);
        assert.ok(
          result.path.every(
            (s) =>
              s.y >= 0.12 &&
              [s.x, s.y, s.z, s.vx, s.vy, s.vz].every(Number.isFinite),
          ),
        );
      }
});
