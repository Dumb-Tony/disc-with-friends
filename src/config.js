// SI units; deliberately designed aerodynamics, not a research simulator.
export const defaults = Object.freeze({
  gravity: 9.81,
  lift: 0.027,
  drag: 0.018,
  turn: 0.15,
  fade: 0.3,
  spinDecay: 0.15,
  maxSpeed: 29,
  launchLoft: 10,
  skip: 0.38,
  friction: 3.8,
  windX: 0,
  windZ: 0,
});
export const ranges = {
  gravity: [5, 15, 0.1],
  lift: [0.01, 0.06, 0.001],
  drag: [0.005, 0.05, 0.001],
  turn: [0, 0.6, 0.01],
  fade: [0, 1.5, 0.01],
  spinDecay: [0.03, 0.5, 0.01],
  maxSpeed: [18, 38, 0.5],
  launchLoft: [3, 20, 0.5],
  skip: [0, 0.7, 0.01],
  friction: [1, 9, 0.1],
  windX: [-8, 8, 0.5],
  windZ: [-8, 8, 0.5],
};
export const pitchLimits = Object.freeze({
  min: (-20 * Math.PI) / 180,
  max: (55 * Math.PI) / 180,
});
export const FIXED_DT = 1 / 120;
export const basket = { x: 0, z: 55 };
export const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
