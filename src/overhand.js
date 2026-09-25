import { clamp } from "./config.js";
// Arcade coefficients guided by the reference demonstrations in docs/FLIGHT-REFERENCES.md.
// Release is limited to 90 degrees; airborne orientation can continue through inversion.
export const overhandTuning = {
  startAngle: 60,
  fullAngle: 85,
  baseRoll: 0.6,
  stallRoll: 1.8,
  spinReference: 60,
  invertedLift: 0.25,
};
export function overhandAmount(bank) {
  const t = overhandTuning;
  return clamp(
    ((Math.abs(bank) * 180) / Math.PI - t.startAngle) /
      (t.fullAngle - t.startAngle),
    0,
    1,
  );
}
export function overhandResponse(s, airSpeed) {
  const t = overhandTuning,
    amount = s.overhand || 0;
  const stall = clamp((20 - airSpeed) / 16, 0, 1);
  const rollRate =
    (t.baseRoll + t.stallRoll * stall) *
    clamp(t.spinReference / Math.max(s.spin, 15), 0.55, 2);
  const progress = clamp(
    (Math.abs(s.bank) - Math.PI / 2) / (Math.PI / 2),
    0,
    1,
  );
  return {
    amount,
    rollRate: rollRate * (s.overhandSide || 1),
    sideScale: 1 - amount * (0.85 - 0.65 * stall - 0.2 * progress),
    invertedScale: 1 - amount * (1 - t.invertedLift),
  };
}
