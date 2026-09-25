import { collideCourse } from "./course-collision.js";
import { collideBasket } from "./basket-collision.js";
import {
  defaults,
  FIXED_DT,
  clamp,
  basket,
  pitchLimits,
  maxBank,
} from "./config.js";
export function launch(
  { aim = 0, pitch, bank = 0, power = 0.7, lie = { x: 0, z: 0 } },
  config = defaults,
) {
  const p = clamp(power, 0, 1),
    speed = 4 + (config.maxSpeed - 4) * Math.pow(p, 0.82),
    loft = clamp(
      Number.isFinite(pitch) ? pitch : (config.launchLoft * Math.PI) / 180,
      pitchLimits.min,
      pitchLimits.max,
    );
  return {
    x: lie.x,
    y: 1.35,
    z: lie.z,
    vx: Math.sin(aim) * speed * Math.cos(loft),
    vy: speed * Math.sin(loft),
    vz: Math.cos(aim) * speed * Math.cos(loft),
    bank,
    spin: 20 + 70 * p,
    time: 0,
    phase: "flight",
    skips: 0,
    scored: false,
    carry: 0,
    origin: { ...lie },
    event: null,
    impact: null,
    chainTouched: false,
    chainCooldown: 0,
  };
}
// Renderer/input independent. Mutates one state for precisely one fixed tick.
export function step(
  s,
  c = defaults,
  dt = FIXED_DT,
  target = basket,
  obstacles = [],
) {
  s.event = null;
  s.impact = null;
  if (s.phase === "rest" || s.scored) return s;
  const old = { x: s.x, y: s.y, z: s.z };
  s.time += dt;
  s.spin *= Math.exp(-c.spinDecay * dt);
  const groundSpeed = Math.hypot(s.vx, s.vz);
  if (s.phase === "flight") {
    const ax = s.vx + c.windX,
      az = s.vz - c.windZ,
      airSpeed = Math.hypot(ax, az),
      speed = Math.hypot(airSpeed, s.vy);
    const high = clamp((airSpeed - 17) / 10, 0, 1),
      late = 1 - clamp((airSpeed - 9) / 12, 0, 1);
    const stability = clamp(45 / Math.max(s.spin, 15), 0.5, 1.25);
    s.bank = clamp(
      s.bank + (c.turn * high - c.fade * late) * stability * dt,
      -maxBank,
      maxBank,
    );
    const lift = Math.min(c.lift * airSpeed * airSpeed, c.gravity * 1.22);
    const side = -Math.sin(s.bank) * lift;
    s.vx += ((side * az) / Math.max(airSpeed, 0.01) - c.drag * speed * ax) * dt;
    s.vz +=
      ((-side * ax) / Math.max(airSpeed, 0.01) - c.drag * speed * az) * dt;
    s.vy += (lift * Math.cos(s.bank) - c.gravity - c.drag * speed * s.vy) * dt;
  } else {
    const decel = c.friction * (s.phase === "roll" ? 0.7 : 1),
      next = Math.max(0, groundSpeed - decel * dt),
      ratio = next / Math.max(groundSpeed, 0.001);
    if (s.phase === "roll") {
      const yaw = -Math.sign(s.bank) * 0.22 * dt,
        co = Math.cos(yaw),
        si = Math.sin(yaw),
        vx = s.vx;
      s.vx = vx * co + s.vz * si;
      s.vz = s.vz * co - vx * si;
    }
    s.vx *= ratio;
    s.vz *= ratio;
    s.bank *= Math.exp(-dt * (s.phase === "roll" ? 0.3 : 5));
    s.vy = 0;
    if (next < 0.18) {
      s.phase = "rest";
      s.vx = s.vz = 0;
      s.event = "rest";
    }
  }
  s.x += s.vx * dt;
  s.y += s.vy * dt;
  s.z += s.vz * dt;
  collideCourse(s, old, obstacles);
  collideBasket(s, old, target, dt);
  if (s.phase === "rest") return s;
  if (s.y < 0.12 && s.phase === "flight") {
    s.y = 0.12;
    s.carry ||= Math.hypot(s.x - s.origin.x, s.z - s.origin.z);
    if (Math.abs(s.bank) > 1.0 && groundSpeed > 3) {
      s.phase = "roll";
      s.vy = 0;
      s.event = "roll";
    } else if (groundSpeed > 6 && s.vy < -0.6 && s.skips < 3) {
      s.vy = Math.min(2.8, -s.vy * c.skip);
      s.vx *= 0.73;
      s.vz *= 0.73;
      s.skips++;
      s.event = "skip";
      if (s.vy < 0.35) s.phase = "slide";
    } else {
      s.phase = "slide";
      s.vy = 0;
      s.event = "ground";
    }
  }
  if (s.time > 45) {
    s.phase = "rest";
    s.vx = s.vy = s.vz = 0;
    s.y = 0.12;
    s.event = "rest";
  }
  return s;
}
export function simulate(
  shot,
  config = defaults,
  target = basket,
  obstacles = [],
) {
  const s = launch(shot, config),
    path = [];
  for (let i = 0; i < 5401 && s.phase !== "rest"; i++) {
    step(s, config, FIXED_DT, target, obstacles);
    if (i % 12 === 0) path.push({ ...s });
  }
  return { state: s, path };
}
