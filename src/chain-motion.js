// Render-only fixed-step, damped Verlet strands. End links remain attached;
// nearby links respond to the hit instead of rotating the whole basket.
export class ChainStrand {
  constructor(top, bottom, count = 17) {
    this.home = Array.from({ length: count }, (_, i) => {
      const t = i / (count - 1);
      return {
        x: top.x + (bottom.x - top.x) * t,
        y: top.y + (bottom.y - top.y) * t,
        z: top.z + (bottom.z - top.z) * t,
      };
    });
    this.home[0] = { ...top };
    this.home[count - 1] = { ...bottom };
    this.points = this.home.map((p) => ({ ...p }));
    this.previous = this.home.map((p) => ({ ...p }));
    this.length =
      (Math.hypot(bottom.x - top.x, bottom.y - top.y, bottom.z - top.z) /
        (count - 1)) *
      1.035;
  }
  kick(hit) {
    const speed = Math.hypot(hit.vx, hit.vy, hit.vz),
      scale = Math.min(0.22, 2.8 / Math.max(speed, 0.01));
    for (let i = 1; i < this.points.length - 1; i++) {
      const p = this.points[i],
        distance = (p.x - hit.x) ** 2 + (p.y - hit.y) ** 2 + (p.z - hit.z) ** 2,
        weight = Math.exp(-distance / 0.085);
      this.previous[i].x -= (hit.vx * scale * weight) / 120;
      this.previous[i].y -= ((hit.vy * scale * weight) / 120) * 0.3;
      this.previous[i].z -= (hit.vz * scale * weight) / 120;
    }
  }
  step(dt = 1 / 120) {
    const last = this.points.length - 1,
      damping = Math.exp(-3.4 * dt);
    for (let i = 1; i < last; i++) {
      const p = this.points[i],
        old = this.previous[i],
        home = this.home[i],
        next = { ...p };
      p.x += (p.x - old.x) * damping + (home.x - p.x) * 10 * dt * dt;
      p.y += (p.y - old.y) * damping + ((home.y - p.y) * 10 - 1.4) * dt * dt;
      p.z += (p.z - old.z) * damping + (home.z - p.z) * 10 * dt * dt;
      this.previous[i] = next;
    }
    for (let iteration = 0; iteration < 7; iteration++) {
      this.points[0] = { ...this.home[0] };
      this.points[last] = { ...this.home[last] };
      for (let i = 0; i < last; i++) {
        const a = this.points[i],
          b = this.points[i + 1],
          dx = b.x - a.x,
          dy = b.y - a.y,
          dz = b.z - a.z,
          len = Math.hypot(dx, dy, dz);
        const correction = (len - this.length) / Math.max(len, 1e-9),
          wa = i === 0 ? 0 : i + 1 === last ? 1 : 0.5,
          wb = i + 1 === last ? 0 : i === 0 ? 1 : 0.5;
        a.x += dx * correction * wa;
        a.y += dy * correction * wa;
        a.z += dz * correction * wa;
        b.x -= dx * correction * wb;
        b.y -= dy * correction * wb;
        b.z -= dz * correction * wb;
      }
    }
  }
}
