// Pure, fixed-step carnival interactions. Rendering uses these same dimensions/poses.
export const millAngle = (o, time) => time * o.speed;
export function gadgetForces(s, hole, dt) {
  for (const o of hole?.gadgets || []) {
    if (
      o.type === "fan" &&
      Math.abs(s.x - o.x) < o.rx &&
      Math.abs(s.z - o.z) < o.rz &&
      s.y < o.height &&
      s.phase === "flight"
    ) {
      s.vx += o.fx * dt;
      s.vz += o.fz * dt;
      s.vy += o.fy * dt;
    }
  }
}
function reflect(s, nx, ny, nz, bounce) {
  const dot = s.vx * nx + s.vy * ny + s.vz * nz;
  if (dot < 0) {
    s.vx -= (1 + bounce) * dot * nx;
    s.vy -= (1 + bounce) * dot * ny;
    s.vz -= (1 + bounce) * dot * nz;
  }
  s.phase = "flight";
  s.event = "wood";
}
function box(s, p, o, angle = 0) {
  const co = Math.cos(angle),
    si = Math.sin(angle),
    dx = p.x - o.x,
    dy = p.y - o.y;
  const q = [dx * co + dy * si, -dx * si + dy * co, p.z - o.z];
  const half = [o.w / 2 + 0.24, o.h / 2 + 0.16, o.d / 2 + 0.24];
  if (q.some((a, i) => Math.abs(a) >= half[i])) return false;
  const gaps = q.map((a, i) => half[i] - Math.abs(a));
  const axis = gaps.indexOf(Math.min(...gaps)),
    sign = Math.sign(q[axis]) || -1;
  const n = [0, 0, 0];
  n[axis] = sign;
  q[axis] = sign * (half[axis] + 0.015);
  s.x = o.x + q[0] * co - q[1] * si;
  s.y = o.y + q[0] * si + q[1] * co;
  s.z = o.z + q[2];
  reflect(s, n[0] * co - n[1] * si, n[0] * si + n[1] * co, n[2], 0.65);
  return true;
}
export function collideGadgets(s, old, hole) {
  const gadgets = hole?.gadgets;
  if (!gadgets?.length) return;
  const count = Math.max(
    1,
    Math.ceil(Math.hypot(s.x - old.x, s.y - old.y, s.z - old.z) / 0.1),
  );
  const end = { x: s.x, y: s.y, z: s.z };
  for (let i = 1; i <= count; i++) {
    const t = i / count,
      p = {
        x: old.x + (end.x - old.x) * t,
        y: old.y + (end.y - old.y) * t,
        z: old.z + (end.z - old.z) * t,
      };
    for (const o of gadgets) {
      if (o.type === "mill") {
        for (const side of [-1, 1])
          if (
            box(s, p, {
              x: o.x + side * 5.6,
              y: 2.6,
              z: o.z + 1,
              w: 1.1,
              h: 5.2,
              d: 1.1,
            })
          )
            return;
        if (box(s, p, { x: o.x, y: 6, z: o.z + 1, w: 12, h: 0.7, d: 0.8 }))
          return;
      }
      if (o.type === "portal") {
        if (s.time < (s.portalUntil || 0)) continue;
        if (old.z < o.z && end.z >= o.z) {
          const f = (o.z - old.z) / (end.z - old.z),
            x = old.x + (end.x - old.x) * f,
            y = old.y + (end.y - old.y) * f;
          if (Math.hypot(x - o.x, y - o.y) < o.r - 0.24) {
            s.x = o.exit.x + (end.x - o.x);
            s.y = o.exit.y + (end.y - o.y);
            s.z = o.exit.z + (end.z - o.z) + 0.35;
            s.portalUntil = s.time + 0.8;
            s.event = "portal";
            s.teleports = (s.teleports || 0) + 1;
            Object.assign(old, { x: s.x, y: s.y, z: s.z });
            return;
          }
        }
      } else if (o.type === "pad") {
        if (
          p.y < 0.3 &&
          s.vy <= 0 &&
          Math.hypot(p.x - o.x, p.z - o.z) < o.r &&
          s.time >= (s.padUntil || 0)
        ) {
          s.y = 0.32;
          s.vy = o.kick;
          s.phase = "flight";
          s.padUntil = s.time + 0.5;
          s.event = "spring";
          s.bounces = (s.bounces || 0) + 1;
          return;
        }
      } else if (o.type === "bumper") {
        const dx = p.x - o.x,
          dz = p.z - o.z,
          dist = Math.hypot(dx, dz),
          r = o.r + 0.24;
        if (dist < r && p.y < o.height + 0.16) {
          const nx = dist > 0.001 ? dx / dist : 0,
            nz = dist > 0.001 ? dz / dist : -1;
          s.x = o.x + nx * (r + 0.02);
          s.z = o.z + nz * (r + 0.02);
          s.y = Math.max(0.13, p.y);
          reflect(s, nx, 0, nz, 1.08);
          s.vy = Math.max(s.vy, 1.5);
          s.bumperHits = (s.bumperHits || 0) + 1;
          s.event = "bumper";
          return;
        }
      } else if (o.type === "wall") {
        if (box(s, p, o)) return;
      } else if (
        o.type === "mill" &&
        Math.abs(p.z - o.z) < 0.7 &&
        Math.abs(p.x - o.x) < o.r + 0.4 &&
        Math.abs(p.y - o.y) < o.r + 0.4
      ) {
        const angle = millAngle(o, (s.courseTime || 0) + s.time);
        for (let b = 0; b < 2; b++)
          if (
            box(
              s,
              p,
              { x: o.x, y: o.y, z: o.z, w: o.r * 2, h: o.width, d: o.depth },
              angle + (b * Math.PI) / 2,
            )
          )
            return;
      }
    }
  }
}
