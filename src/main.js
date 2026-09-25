import { defaults, ranges, FIXED_DT, basket, clamp } from "./config.js";
import { launch, step } from "./physics.js";
import { ThrowInput } from "./input.js";
import { FieldView } from "./view.js";
import { Sound } from "./audio.js";
const $ = (id) => document.getElementById(id),
  input = new ThrowInput(),
  sound = new Sound();
let config = { ...defaults };
try {
  const saved = JSON.parse(localStorage.getItem("dwf-tuning-v1") || "{}");
  for (const [key, [min, max]] of Object.entries(ranges))
    if (Number.isFinite(saved[key])) config[key] = clamp(saved[key], min, max);
} catch {}
input.pitch = (config.launchLoft * Math.PI) / 180;
let view;
try {
  view = new FieldView($("game"));
} catch (error) {
  $("welcome").innerHTML =
    "<article><h1>WebGL unavailable</h1><p>Enable hardware acceleration in your desktop browser, then reload.</p></article>";
  throw error;
}
let shot = null,
  shotConfig = { ...config },
  lie = { x: 0, z: 0 },
  lastShot = null,
  count = 0,
  started = false,
  accumulator = 0,
  previousTime = performance.now(),
  finished = false,
  lastMouse = null;
function reset(tee = false) {
  shot = null;
  finished = false;
  accumulator = 0;
  input.cancel();
  view.resetTrace();
  $("result").hidden = true;
  if (tee) {
    lie = { x: 0, z: 0 };
    input.aim = 0;
    input.pitch = (config.launchLoft * Math.PI) / 180;
    input.bank = input.rawBank = 0;
    count = 0;
  }
  updateHUD();
}
function throwDisc(spec, replay = false) {
  lastShot = replay
    ? lastShot
    : { spec: { ...spec, lie: { ...lie } }, config: { ...config } };
  shotConfig = { ...lastShot.config };
  lie = { ...lastShot.spec.lie };
  input.aim = lastShot.spec.aim;
  input.pitch = lastShot.spec.pitch ?? (shotConfig.launchLoft * Math.PI) / 180;
  input.bank = input.rawBank = lastShot.spec.bank;
  shot = launch(lastShot.spec, shotConfig);
  accumulator = 0;
  finished = false;
  view.resetTrace();
  $("result").hidden = true;
  if (!replay) count++;
  sound.play("throw", lastShot.spec.power);
}
function replay() {
  if (lastShot) {
    input.cancel();
    throwDisc(lastShot.spec, true);
  }
}
function fromLie() {
  if (shot?.phase === "rest" && !shot.scored) {
    lie = { x: shot.x, z: shot.z };
    input.aim = Math.atan2(basket.x - lie.x, basket.z - lie.z);
    input.pitch = (config.launchLoft * Math.PI) / 180;
    reset();
  }
}
function capture() {
  if (!started || !$("panel").hidden || !$("welcome").hidden) return;
  const request = $("game").requestPointerLock?.();
  request?.catch?.(() => {
    $("status").textContent =
      "Drag on the field to throw. Cursor capture unavailable.";
  });
}
function panel(open) {
  $("panel").hidden = !open;
  input.cancel();
  if (open) document.exitPointerLock?.();
}
function updateHUD() {
  const dist = Math.hypot(basket.x - lie.x, basket.z - lie.z);
  $("distance").innerHTML = `${dist.toFixed(0)} <small>m</small>`;
  $("throws").textContent = `${count} throw${count === 1 ? "" : "s"}`;
  $("angleText").textContent =
    Math.abs(input.bank) < 0.01
      ? "FLAT"
      : `${Math.abs((input.bank * 180) / Math.PI).toFixed(0)}° ${input.bank < 0 ? "HYZER" : "ANHYZER"}`;
  $("bankNeedle").style.left = `${50 + (input.bank / (Math.PI / 4)) * 50}%`;
  $("bankNeedle").style.transform =
    `translateX(-50%) rotate(${(-input.bank * 180) / Math.PI}deg)`;
  const pitchDegrees = Math.round((input.pitch * 180) / Math.PI);
  $("pitchText").textContent =
    pitchDegrees === 0
      ? "LEVEL · 0°"
      : `${pitchDegrees > 0 ? "UP ↑" : "DOWN ↓"} ${Math.abs(pitchDegrees)}°`;
  $("powerFill").style.width = `${input.power * 100}%`;
  $("reticle").hidden = !!shot;
  $("readout").hidden = !!shot;
  $("wind").textContent =
    config.windX || config.windZ
      ? `WIND ${Math.hypot(config.windX, config.windZ).toFixed(1)} m/s`
      : "STILL AIR";
  $("phase").textContent = shot
    ? shot.phase.toUpperCase()
    : input.mode === "draw"
      ? "AIM LOCKED"
      : input.mode === "angle"
        ? "SETTING ANGLE"
        : "READY TO THROW";
  $("gesture").textContent =
    input.mode === "draw"
      ? "Direction locked · Pull down for power · Release to send"
      : input.mode === "angle"
        ? "Move sideways to tilt · Release to keep this angle"
        : "Move ↔ ↕ to aim · Hold right to bank · Pull left to throw";
  $("status").textContent = shot
    ? shot.scored
      ? "Chains!"
      : shot.phase === "rest"
        ? "Another line?"
        : shot.phase === "roll"
          ? "On the edge."
          : shot.phase === "slide"
            ? "Settling."
            : ""
    : input.mode === "draw"
      ? "Draw it back."
      : input.mode === "angle"
        ? "Shape your flight."
        : document.pointerLockElement
          ? "Find your line."
          : "Click the field to capture the mouse.";
}
$("start").onclick = () => {
  started = true;
  $("welcome").hidden = true;
  sound.unlock();
  capture();
};
$("help").onclick = () => {
  input.cancel();
  document.exitPointerLock?.();
  $("welcome").hidden = false;
};
$("tune").onclick = () => panel($("panel").hidden);
$("closeTune").onclick = () => panel(false);
$("reset").onclick = () => reset(true);
$("again").onclick = () => reset();
$("lie").onclick = fromLie;
$("replay").onclick = replay;
$("sound").onclick = () => {
  sound.enabled = !sound.enabled;
  $("sound").textContent = sound.enabled ? "Sound on" : "Sound off";
};
$("game").addEventListener("contextmenu", (e) => e.preventDefault());
$("game").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (!started || !$("panel").hidden || !$("welcome").hidden) return;
  sound.unlock();
  if (!document.pointerLockElement) {
    capture();
    lastMouse = { x: e.clientX, y: e.clientY };
  }
  if (!shot) input.down(e.button);
});
addEventListener("pointermove", (e) => {
  if (!started || shot || !$("panel").hidden || !$("welcome").hidden) return;
  const locked = document.pointerLockElement === $("game");
  if (!locked && e.target !== $("game") && input.mode === "aim") {
    lastMouse = null;
    return;
  }
  const dx = locked ? e.movementX : lastMouse ? e.clientX - lastMouse.x : 0,
    dy = locked ? e.movementY : lastMouse ? e.clientY - lastMouse.y : 0;
  lastMouse = { x: e.clientX, y: e.clientY };
  input.move(dx, dy);
});
addEventListener("pointerup", (e) => {
  if (!started || shot || !$("panel").hidden || !$("welcome").hidden) return;
  const spec = input.up(e.button);
  if (spec) throwDisc(spec);
});
addEventListener("blur", () => {
  input.cancel();
  lastMouse = null;
});
document.addEventListener("visibilitychange", () => {
  input.cancel();
  accumulator = 0;
});
document.addEventListener("pointerlockchange", () => {
  if (!document.pointerLockElement) {
    input.cancel();
    lastMouse = null;
  }
});
addEventListener("keydown", (e) => {
  if (e.target instanceof HTMLInputElement) return;
  if (e.code === "Escape") {
    input.cancel();
    panel(false);
  }
  if (!started) return;
  if (e.code === "KeyR") reset();
  if (e.code === "Home") {
    e.preventDefault();
    reset(true);
  }
  if (e.code === "KeyN") fromLie();
  if (e.code === "Space") {
    e.preventDefault();
    replay();
  }
  if (e.code === "KeyT") panel($("panel").hidden);
  if (e.key === "?") $("help").click();
});
const labels = {
  gravity: "Gravity",
  lift: "Lift / glide",
  drag: "Air drag",
  turn: "High-speed turn",
  fade: "Late-flight fade",
  spinDecay: "Spin decay",
  maxSpeed: "Full-power speed",
  launchLoft: "Starting pitch (Home / next lie)",
  skip: "Ground bounce",
  friction: "Ground friction",
  windX: "Crosswind",
  windZ: "Tailwind",
};
function save() {
  try {
    localStorage.setItem("dwf-tuning-v1", JSON.stringify(config));
  } catch {}
}
function sliders() {
  const parent = $("sliders");
  parent.replaceChildren();
  for (const [key, [min, max, step]] of Object.entries(ranges)) {
    const label = document.createElement("label"),
      out = document.createElement("output");
    label.textContent = labels[key];
    out.textContent = config[key];
    label.append(out);
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = config[key];
    slider.setAttribute("aria-label", labels[key]);
    slider.oninput = () => {
      config[key] = Number(slider.value);
      out.textContent = slider.value;
      save();
    };
    parent.append(label, slider);
  }
}
sliders();
$("defaults").onclick = () => {
  config = { ...defaults };
  save();
  sliders();
};
$("export").onclick = () => {
  const data = { version: 1, tuning: config, lastShot },
    a = document.createElement("a"),
    url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
  a.href = url;
  a.download = "disc-with-friends-playtest.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
function frame(now) {
  const dt = Math.min((now - previousTime) / 1000, 0.1);
  previousTime = now;
  if (!document.hidden) {
    accumulator += dt;
    while (accumulator >= FIXED_DT) {
      if (shot) {
        step(shot, shotConfig);
        if (shot.event) {
          sound.play(shot.event);
          if (shot.event === "chains") view.chainTime = 1;
        }
      }
      accumulator -= FIXED_DT;
    }
    if (shot?.phase === "rest" && !finished) {
      finished = true;
      $("result").hidden = false;
      $("resultTitle").textContent = shot.scored
        ? "IN THE BASKET"
        : "SHOT COMPLETE";
      const total = Math.hypot(shot.x - lie.x, shot.z - lie.z),
        toPin = Math.hypot(shot.x - basket.x, shot.z - basket.z);
      $("resultDistance").textContent = shot.scored
        ? "CHING!"
        : `${total.toFixed(1)} m`;
      $("resultDetail").textContent =
        `${shot.carry.toFixed(1)} m carry · ${shot.skips} skips · ${toPin.toFixed(1)} m to basket`;
      $("lie").hidden = shot.scored;
    }
    updateHUD();
    view.update(dt, { input, shot, lie, active: started });
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// Read-only diagnostic snapshots for browser regressions; no production input shortcuts.
window.discLab = {
  snapshot: () =>
    structuredClone({ shot, input, lie, count, config, lastShot, finished }),
};
