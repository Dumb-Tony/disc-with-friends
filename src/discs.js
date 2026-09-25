// Arcade profiles inspired by putter/midrange/fairway roles, not manufacturer ratings.
export const discs = Object.freeze([
  Object.freeze({
    id: "putter",
    name: "Nest",
    type: "Putter",
    color: "#55bfc1",
    hint: "Short approaches · gentle fade · soft landings",
    factors: {
      maxSpeed: 0.8,
      lift: 0.88,
      drag: 1.25,
      turn: 0.2,
      fade: 0.45,
      skip: 0.55,
      friction: 1.2,
    },
  }),
  Object.freeze({
    id: "midrange",
    name: "Fieldwork",
    type: "Midrange",
    color: "#ee612e",
    hint: "Balanced glide · familiar flight · all-purpose",
    factors: {},
  }),
  Object.freeze({
    id: "driver",
    name: "Kestrel",
    type: "Driver",
    color: "#9c7ce0",
    hint: "Long drives · stronger finish · needs power",
    factors: {
      maxSpeed: 1.12,
      lift: 1.06,
      drag: 0.82,
      turn: 1.4,
      fade: 1.45,
      spinDecay: 0.85,
      skip: 1.15,
    },
  }),
]);
export const discById = (id) => discs.find((d) => d.id === id) || discs[1];
export function discConfig(base, id, power = 1) {
  const disc = discById(id),
    result = { ...base };
  for (const [key, factor] of Object.entries(disc.factors))
    result[key] *= factor;
  // A driver below its useful speed loses glide and fades sooner.
  if (disc.id === "driver") {
    const slow = Math.max(0, (0.7 - power) / 0.7);
    result.lift *= 1 - 0.25 * slow;
    result.fade *= 1 + 0.8 * slow;
  }
  return result;
}
