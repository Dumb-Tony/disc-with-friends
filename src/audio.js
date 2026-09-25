export class Sound {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }
  unlock() {
    this.ctx ||= new AudioContext();
    this.ctx.resume();
  }
  play(type, power = 0.5) {
    if (!this.enabled || !this.ctx) return;
    if (type === "basket") type = "chains";
    const ctx = this.ctx,
      t = ctx.currentTime;
    const tones =
      type === "portal"
        ? [440, 660, 880]
        : type === "bumper"
          ? [220, 440]
          : type === "spring"
            ? [330, 990]
            : type === "chains"
              ? [880, 1320, 1760, 2217]
              : type === "throw"
                ? [180 + power * 120]
                : type === "metal"
                  ? [620, 1070]
                  : [90];
    tones.forEach((freq, i) => {
      const o = ctx.createOscillator(),
        g = ctx.createGain();
      o.type = type === "throw" ? "sine" : "triangle";
      o.frequency.setValueAtTime(freq, t);
      o.frequency.exponentialRampToValueAtTime(
        freq * (type === "throw" ? 0.3 : 0.8),
        t + 0.25,
      );
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(
        type === "chains" ? 0.07 : 0.035,
        t + 0.01 + i * 0.012,
      );
      g.gain.exponentialRampToValueAtTime(
        0.0001,
        t + (type === "chains" ? 0.65 : 0.23),
      );
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.7);
    });
  }
}
