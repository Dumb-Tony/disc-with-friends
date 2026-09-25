import { inWater } from "./course.js";
export function collideEnvironment(s, old, environment) {
  if (!environment || Array.isArray(environment)) return;
  const steps = Math.max(
    1,
    Math.ceil(Math.hypot(s.x - old.x, s.y - old.y, s.z - old.z) / 0.08),
  );
  for (let i = 0; i <= steps; i++) {
    const t = i / steps,
      p = {
        x: old.x + (s.x - old.x) * t,
        y: old.y + (s.y - old.y) * t,
        z: old.z + (s.z - old.z) * t,
      };
    if (p.y <= 0.17) {
      const water = inWater(p.x, p.z, environment.water || []);
      if (water) {
        Object.assign(s, p, {
          y: 0.07,
          vx: 0,
          vy: 0,
          vz: 0,
          phase: "rest",
          event: "water",
          hazard: { type: "water", drop: { ...water.drop } },
        });
        return;
      }
    }
    for (const r of environment.rocks || []) {
      const rx = r.radius + 0.24,
        ry = r.height + 0.04,
        dx = p.x - r.x,
        dz = p.z - r.z;
      const q = (dx * dx + dz * dz) / (rx * rx) + (p.y * p.y) / (ry * ry);
      if (q >= 1 || p.y < 0) continue;
      const n = { x: dx / (rx * rx), y: p.y / (ry * ry), z: dz / (rx * rx) },
        len = Math.hypot(n.x, n.y, n.z) || 1;
      n.x /= len;
      n.y /= len;
      n.z /= len;
      const speed = s.vx * n.x + s.vy * n.y + s.vz * n.z;
      const scale = 1 / Math.sqrt(Math.max(q, 0.0001));
      s.x = r.x + dx * scale + n.x * 0.005;
      s.y = p.y * scale + n.y * 0.005;
      s.z = r.z + dz * scale + n.z * 0.005;
      if (speed < 0) {
        s.vx = (s.vx - 1.35 * speed * n.x) * 0.75;
        s.vy = (s.vy - 1.35 * speed * n.y) * 0.65;
        s.vz = (s.vz - 1.35 * speed * n.z) * 0.75;
      }
      // Resting on top must still resolve down to a playable ground lie.
      if (s.phase !== "flight") s.phase = "flight";
      if (s.time - (s.lastRockTime ?? -1) > 0.1) {
        s.event = "rock";
        s.lastRockTime = s.time;
      }
      return;
    }
  }
}
