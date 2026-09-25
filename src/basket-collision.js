import {
  basketShape as shape,
  basketMetal,
  chainLayout,
} from "./basket-shape.js";
import { clamp } from "./config.js";

// A thin oriented ellipsoid approximates the visible disc. Swept samples are
// closer together than its thickness, so a fast edge cannot skip thin wires.
function discNormal(s) {
  const yaw = Math.atan2(s.vx, s.vz),
    pitch = s.chainTouched ? 0 : Math.atan2(s.vy, Math.hypot(s.vx, s.vz));
  const sb = Math.sin(s.bank),
    cb = Math.cos(s.bank),
    sp = Math.sin(pitch);
  return {
    x: -sb * Math.cos(yaw) - cb * sp * Math.sin(yaw),
    y: cb * Math.cos(pitch),
    z: sb * Math.sin(yaw) - cb * sp * Math.cos(yaw),
  };
}
function contact(p, a, b, tube, n) {
  const r = shape.discRadius + tube,
    h = shape.discHalfThickness + tube,
    ir = 1 / (r * r),
    extra = 1 / (h * h) - ir;
  const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
  const metric = (a, b) => dot(a, b) * ir + dot(a, n) * dot(b, n) * extra;
  const ab = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z },
    ap = { x: p.x - a.x, y: p.y - a.y, z: p.z - a.z };
  const t = clamp(metric(ap, ab) / Math.max(metric(ab, ab), 1e-12), 0, 1);
  const point = { x: a.x + ab.x * t, y: a.y + ab.y * t, z: a.z + ab.z * t };
  const d = { x: p.x - point.x, y: p.y - point.y, z: p.z - point.z },
    q = metric(d, d);
  if (q > 1) return null;
  const dn = dot(d, n),
    normal = {
      x: d.x * ir + n.x * dn * extra,
      y: d.y * ir + n.y * dn * extra,
      z: d.z * ir + n.z * dn * extra,
    };
  const length = Math.hypot(normal.x, normal.y, normal.z);
  if (length < 1e-8) {
    normal.x = 0;
    normal.y = 1;
    normal.z = 0;
  } else {
    normal.x /= length;
    normal.y /= length;
    normal.z /= length;
  }
  const A = metric(normal, normal),
    B = metric(d, normal);
  const depth = (-B + Math.sqrt(Math.max(0, B * B + A * (1 - q)))) / A;
  return { point, normal, depth };
}
function bandContact(p, n) {
  const radial = Math.hypot(p.x, p.z),
    r = shape.bandRadius;
  // The cap is a solid disk; the side is a metal cylinder, not a catch zone.
  const q = { x: p.x, y: clamp(p.y, shape.bandBottom, shape.bandTop), z: p.z };
  if (radial > r) {
    q.x *= r / radial;
    q.z *= r / radial;
  } else if (p.y >= shape.bandBottom && p.y <= shape.bandTop) {
    const distances = [
        radial ? r - radial : r,
        p.y - shape.bandBottom,
        shape.bandTop - p.y,
      ],
      nearest = Math.min(...distances);
    if (nearest === distances[0]) {
      q.x = radial ? (p.x * r) / radial : r;
      q.z = radial ? (p.z * r) / radial : 0;
    } else q.y = nearest === distances[1] ? shape.bandBottom : shape.bandTop;
  }
  return contact(p, q, q, 0, n);
}
function impact(s, p, hit, target, kind) {
  s.impact = {
    kind,
    part: hit.part,
    x: hit.point.x + target.x,
    y: hit.point.y,
    z: hit.point.z + target.z,
    vx: s.vx,
    vy: s.vy,
    vz: s.vz,
    speed: Math.hypot(s.vx, s.vy, s.vz),
  };
  s.x = p.x + target.x;
  s.y = p.y;
  s.z = p.z + target.z;
}
export function collideBasket(s, old, target, dt) {
  if (!target) return;
  s.chainCooldown = Math.max(0, (s.chainCooldown || 0) - dt);
  const start = { x: old.x - target.x, y: old.y, z: old.z - target.z },
    end = { x: s.x - target.x, y: s.y, z: s.z - target.z };
  // Broadphase includes both ends; never discard a fast crossing shot.
  if (Math.min(start.y, end.y) > 2.55 || Math.max(start.y, end.y) < -0.2)
    return;
  const dx = end.x - start.x,
    dy = end.y - start.y,
    dz = end.z - start.z,
    len2 = dx * dx + dz * dz;
  const near = clamp(
    -(start.x * dx + start.z * dz) / Math.max(len2, 1e-12),
    0,
    1,
  );
  if (Math.hypot(start.x + dx * near, start.z + dz * near) > 1.05) return;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy, dz) / 0.018)),
    n = discNormal(s);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps,
      p = { x: start.x + dx * t, y: start.y + dy * t, z: start.z + dz * t };
    let hit = bandContact(p, n);
    if (hit) Object.assign(hit, { part: "band", restitution: 0.45 });
    if (!hit)
      for (const wire of basketMetal) {
        hit = contact(p, wire.a, wire.b, wire.radius, n);
        if (hit) {
          Object.assign(hit, {
            part: wire.part,
            restitution: wire.restitution,
          });
          break;
        }
      }
    if (hit) {
      const speed = Math.hypot(s.vx, s.vy, s.vz),
        vn = s.vx * hit.normal.x + s.vy * hit.normal.y + s.vz * hit.normal.z;
      const inTray = Math.hypot(p.x, p.z) < 0.39 && p.y < 0.96;
      impact(s, p, hit, target, "metal");
      s.x += hit.normal.x * (hit.depth + 0.001);
      s.y += hit.normal.y * (hit.depth + 0.001);
      s.z += hit.normal.z * (hit.depth + 0.001);
      if (
        hit.part === "tray" &&
        inTray &&
        s.vy <= 0 &&
        hit.normal.y > 0.2 &&
        speed < 5.5
      ) {
        s.vx = s.vy = s.vz = 0;
        s.bank *= 0.25;
        s.phase = "rest";
        s.scored = !!s.chainTouched;
        s.carry ||= Math.hypot(s.x - s.origin.x, s.z - s.origin.z);
        s.event = s.scored ? "basket" : "rest";
        return;
      }
      if (vn < 0) {
        // Chains cushion the pole behind them. Exposed metal still rebounds.
        const cushioned =
          hit.part === "post" &&
          p.y > shape.chainBottom &&
          s.time - (s.lastChainTime ?? -10) < 0.65;
        const bounce = (1 + (cushioned ? 0 : hit.restitution)) * vn;
        s.vx = (s.vx - bounce * hit.normal.x) * 0.91;
        s.vy = (s.vy - bounce * hit.normal.y) * 0.91;
        s.vz = (s.vz - bounce * hit.normal.z) * 0.91;
        if (cushioned) {
          s.vx *= 0.35;
          s.vz *= 0.35;
        }
        if (s.phase !== "flight" && s.vy > 0.2) s.phase = "flight";
      }
      if (speed > 0.5 && s.time - (s.lastMetalTime ?? -1) > 0.055) {
        s.event = "metal";
        s.lastMetalTime = s.time;
      }
      return;
    }
    if (s.phase !== "flight" || s.chainCooldown > 0) continue;
    for (const chain of chainLayout) {
      hit = contact(p, chain.top, chain.bottom, 0.012, n);
      if (!hit) continue;
      hit.part = "chains";
      impact(s, p, hit, target, "chains");
      const horizontal = Math.hypot(s.vx, s.vz),
        offset = Math.abs(p.x * s.vz - p.z * s.vx) / Math.max(horizontal, 0.01);
      const central = 1 - clamp(offset / 0.62, 0, 1),
        speed = Math.hypot(s.vx, s.vy, s.vz);
      // A yielding curtain carries the disc inward while absorbing momentum.
      // Central strikes engage several strands; edge clips retain their speed.
      const coverage = clamp((central - 0.15) / 0.65, 0, 1);
      const softRetain = Math.min(0.65, 3.5 / Math.max(horizontal, 0.01));
      const edgeRetain = 0.78 + 0.12 * clamp((speed - 12) / 18, 0, 1);
      const retain = edgeRetain + (softRetain - edgeRetain) * coverage;
      s.vx *= retain;
      s.vz *= retain;
      s.vy = Math.min(s.vy * 0.28, -0.25);
      s.bank *= 0.4;
      s.spin *= 0.72;
      s.chainTouched = true;
      s.lastChainTime = s.time;
      s.chainCooldown = 0.3;
      s.event = "chains";
      return;
    }
  }
}
