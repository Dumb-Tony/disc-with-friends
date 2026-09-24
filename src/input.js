import { clamp } from "./config.js";
export class ThrowInput {
  constructor() {
    this.aim = 0;
    this.rawBank = 0;
    this.bank = 0;
    this.power = 0;
    this.mode = "aim";
    this.draw = 0;
  }
  move(dx, dy) {
    if (this.mode === "draw") {
      this.draw = clamp(this.draw + dy, 0, 240);
      this.power = this.draw / 240;
    } else if (this.mode === "angle") {
      this.rawBank = clamp(
        this.rawBank + dx * 0.005,
        -Math.PI / 4,
        Math.PI / 4,
      );
      this.bank = Math.abs(this.rawBank) < 0.055 ? 0 : this.rawBank;
    } else if (this.mode === "aim") {
      this.aim -= dx * 0.0025;
    }
  }
  down(button) {
    if (button === 2 && this.mode === "draw") {
      this.cancel();
      return;
    }
    if (button === 2) this.mode = "angle";
    if (button === 0 && this.mode !== "draw") {
      this.mode = "draw";
      this.draw = 0;
      this.power = 0;
    }
  }
  up(button) {
    if (button === 2 && this.mode === "angle") this.mode = "aim";
    if (button === 0 && this.mode === "draw") {
      const shot =
        this.power > 0.018
          ? { aim: this.aim, bank: this.bank, power: this.power }
          : null;
      this.cancel();
      return shot;
    }
    return null;
  }
  cancel() {
    this.mode = "aim";
    this.power = 0;
    this.draw = 0;
  }
}
