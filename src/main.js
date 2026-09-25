import { waterOutline } from "./water-shape.js";
import { discs, discById, discConfig } from "./discs.js";
let selectedDisc = "midrange";
try {
  selectedDisc = discById(localStorage.getItem("dwf-disc-v1")).id;
} catch {}
import { course, holes } from "./course.js";
import { Round, scoreName } from "./round.js";
const round = new Round();
import { defaults, ranges, FIXED_DT, clamp, maxBank } from "./config.js";
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
let completedShot = null;
let shot = null,
  shotConfig = { ...config },
  lie = { x: 0, z: 0 },
  lastShot = null,
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
    round.restart();
    input.aim = Math.atan2(round.hole.pin.x, round.hole.pin.z);
    lastShot = null;
    completedShot = null;
  }
  updateHUD();
  saveRound();
}
function throwDisc(spec, replay = false) {
  completedShot = null;
  lastShot = replay
    ? lastShot
    : {
        spec: { ...spec, lie: { ...lie } },
        config: discConfig(config, selectedDisc, spec.power),
        discId: selectedDisc,
        before: round.strokes,
        penalties: round.penalties,
      };
  selectedDisc = lastShot.discId || "midrange";
  try {
    localStorage.setItem("dwf-disc-v1", selectedDisc);
  } catch {}
  view.setDisc(discById(selectedDisc));
  updateBag();
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
  round.strokes = lastShot.before + 1;
  round.penalties = lastShot.penalties;
  round.scores[round.index] = null;
  round.holed = round.done = false;
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
    if (shot.hazard) {
      round.strokes++;
      round.penalties++;
      lie = { ...shot.hazard.drop };
      toast("Water · +1 stroke · marked drop zone");
    } else lie = { x: shot.x, z: shot.z };
    input.aim = Math.atan2(round.hole.pin.x - lie.x, round.hole.pin.z - lie.z);
    input.pitch = (config.launchLoft * Math.PI) / 180;
    input.bank = input.rawBank = 0;
    reset();
  }
}
function capture() {
  if (round.holed) return;
  if (
    !started ||
    !$("panel").hidden ||
    !$("welcome").hidden ||
    !$("scorecard").hidden
  )
    return;
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
  for (const button of $("discBag").querySelectorAll("button"))
    button.disabled = !!shot || input.mode !== "aim" || round.holed;
  const dist = Math.hypot(round.hole.pin.x - lie.x, round.hole.pin.z - lie.z);
  $("distance").innerHTML = `${dist.toFixed(0)} <small>m</small>`;
  $("throws").textContent =
    `${round.strokes} strokes${round.penalties ? " · +" + round.penalties + " penalty" : ""}`;
  $("holeLabel").textContent =
    `${round.practice ? "PRACTICE · " : ""}HOLE ${round.index + 1} / 9 · PAR ${round.hole.par}`;
  if (performance.now() - (drawMap.last || 0) > 100) {
    drawMap();
    drawMap.last = performance.now();
  }
  $("angleText").textContent =
    Math.abs(input.bank) < 0.01
      ? "FLAT"
      : `${Math.abs((input.bank * 180) / Math.PI).toFixed(0)}° ${input.bank < 0 ? "HYZER" : "ANHYZER"}`;
  $("bankNeedle").style.left = `${50 + (input.bank / maxBank) * 50}%`;
  $("bankNeedle").style.transform =
    `translateX(-50%) rotate(${(-input.bank * 180) / Math.PI}deg)`;
  const pitchDegrees = Math.round((input.pitch * 180) / Math.PI);
  $("pitchText").textContent =
    pitchDegrees === 0
      ? "LEVEL · 0°"
      : `${pitchDegrees > 0 ? "UP ↑" : "DOWN ↓"} ${Math.abs(pitchDegrees)}°`;
  $("powerFill").style.width = `${input.power * 100}%`;
  $("reticle").hidden = !!shot || round.holed;
  $("readout").hidden = !!shot || round.holed;
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
        : round.holed
          ? "HOLE COMPLETE"
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
  panel(false);
  showCard(false);
  $("start").textContent = round.holed
    ? "View completed hole"
    : "Continue · Hole " + (round.index + 1);
  input.cancel();
  document.exitPointerLock?.();
  $("welcome").hidden = false;
};
$("tune").onclick = () => panel($("panel").hidden);
$("closeTune").onclick = () => panel(false);
$("reset").onclick = () => reset(true);
$("again").onclick = () => {
  if (round.done || round.practice) {
    round.start();
    loadHole();
  } else if (round.advance()) loadHole();
  capture();
};
$("replay").onclick = replay;
$("sound").onclick = () => {
  sound.enabled = !sound.enabled;
  $("sound").textContent = sound.enabled ? "Sound on" : "Sound off";
};
$("game").addEventListener("contextmenu", (e) => e.preventDefault());
$("game").addEventListener("pointerdown", (e) => {
  e.preventDefault();
  if (
    !started ||
    !$("panel").hidden ||
    !$("welcome").hidden ||
    !$("scorecard").hidden
  )
    return;
  sound.unlock();
  if (!document.pointerLockElement) {
    capture();
    lastMouse = { x: e.clientX, y: e.clientY };
  }
  if (!shot && !round.holed) input.down(e.button);
});
addEventListener("pointermove", (e) => {
  if (
    !started ||
    shot ||
    round.holed ||
    !$("panel").hidden ||
    !$("welcome").hidden ||
    !$("scorecard").hidden
  )
    return;
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
  if (
    !started ||
    shot ||
    round.holed ||
    !$("panel").hidden ||
    !$("welcome").hidden ||
    !$("scorecard").hidden
  )
    return;
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
    showCard(false);
  }
  if (!started) return;
  if (
    (!$("welcome").hidden || !$("scorecard").hidden || !$("panel").hidden) &&
    !["KeyS", "KeyT", "Escape"].includes(e.code)
  )
    return;
  if (["Digit1", "Digit2", "Digit3"].includes(e.code))
    selectDisc(discs[Number(e.code.slice(-1)) - 1].id);
  if (e.code === "KeyR") reset(true);
  if (e.code === "Home") {
    e.preventDefault();
    reset(true);
  }
  if (e.code === "Space") {
    e.preventDefault();
    replay();
  }
  if (e.code === "Enter" && round.holed) $("again").click();
  if (e.code === "KeyS") showCard($("scorecard").hidden);
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
        step(shot, shotConfig, FIXED_DT, round.hole.pin, round.hole);
        if (shot.event) {
          sound.play(shot.event);
          if (shot.impact) view.onBasketImpact(shot.impact);
        }
      }
      accumulator -= FIXED_DT;
    }
    if (shot?.phase === "rest" && !finished) {
      completedShot = structuredClone(shot);
      finished = true;
      if (shot.scored) {
        round.finish();
        showResult();
        saveRound();
        if (!$("scorecard").hidden) showCard(true);
      } else fromLie();
    }
    updateHUD();
    view.update(dt, { input, shot, lie, active: started });
  }
  requestAnimationFrame(frame);
}

function saveRound() {
  try {
    localStorage.setItem("dwf-round-v1", JSON.stringify(round.serialize(lie)));
  } catch {}
}
function toast(message) {
  $("toast").textContent = message;
  $("toast").hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => ($("toast").hidden = true), 4500);
}
function loadHole() {
  view.loadHole(round.hole);
  reset(true);
  updateHole();
}
function updateHole() {
  const h = round.hole;
  $("courseName").textContent = "SUNNY PINES / NATURE";
  $("holeName").textContent = h.name;
  $("holeHint").textContent = h.hint;
  $("footerHole").textContent =
    h.id + " · " + h.name + " · " + h.length + " m · PAR " + h.par;
}
function showResult() {
  $("result").hidden = false;
  document.exitPointerLock?.();
  $("resultTitle").textContent = round.done
    ? "SUNNY PINES · ROUND COMPLETE"
    : round.hole.name.toUpperCase() + " · COMPLETE";
  $("resultDistance").textContent = round.done
    ? round.total + " STROKES"
    : scoreName(round.strokes, round.hole.par);
  $("resultDetail").textContent = round.done
    ? "Par " +
      course.par +
      " · " +
      (round.relative > 0 ? "+" : "") +
      round.relative +
      " for the round"
    : round.strokes +
      " strokes · Par " +
      round.hole.par +
      " · Round " +
      (round.relative > 0 ? "+" : "") +
      round.relative;
  $("again").textContent =
    round.done || round.practice ? "Start new round" : "Next hole →";
}
function showCard(open) {
  $("scorecard").hidden = !open;
  input.cancel();
  if (!open) return;
  document.exitPointerLock?.();
  $("scoreRows").innerHTML = holes
    .map((h, i) => {
      const s = round.scores[i];
      return (
        '<tr class="' +
        (i === round.index ? "current" : "") +
        '"><td>' +
        h.id +
        "</td><td>" +
        h.name +
        "</td><td>" +
        h.length +
        " m</td><td>" +
        h.par +
        "</td><td>" +
        (s ? s.strokes : "—") +
        "</td><td>" +
        (s ? s.penalties : "—") +
        "</td></tr>"
      );
    })
    .join("");
  $("scoreTotal").textContent =
    (round.practice ? "Practice" : "Sunny Pines") +
    " · " +
    round.scores.filter(Boolean).length +
    "/9 completed · " +
    round.total +
    " strokes · " +
    (round.relative > 0 ? "+" : "") +
    round.relative;
}
function drawMap() {
  const c = $("map"),
    ctx = c.getContext("2d"),
    h = round.hole;
  const scale = 160 / (h.length + 22),
    px = (x) => 100 - x * scale,
    py = (z) => 190 - z * scale;
  ctx.clearRect(0, 0, 200, 200);
  ctx.fillStyle = "#173d32";
  ctx.fillRect(0, 0, 200, 200);
  ctx.strokeStyle = "#6c8853";
  ctx.lineWidth = 9 * scale;
  ctx.beginPath();
  h.route.forEach(([x, z], i) =>
    i ? ctx.lineTo(px(x), py(z)) : ctx.moveTo(px(x), py(z)),
  );
  ctx.stroke();
  ctx.fillStyle = "#67b3c1";
  for (const w of h.water) {
    ctx.beginPath();
    waterOutline(w).forEach((p, i) =>
      i ? ctx.lineTo(px(p.x), py(p.z)) : ctx.moveTo(px(p.x), py(p.z)),
    );
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = "#b7c58b";
  for (const t of h.trees) {
    ctx.beginPath();
    ctx.arc(px(t.x), py(t.z), t.width * scale, 0, 7);
    ctx.fill();
  }
  ctx.fillStyle = "#969b90";
  for (const r of h.rocks) {
    ctx.beginPath();
    ctx.arc(px(r.x), py(r.z), r.radius * scale, 0, 7);
    ctx.fill();
  }
  for (const [x, z, color, r] of [
    [0, 0, "#ffffff", 3],
    [h.pin.x, h.pin.z, "#ffe499", 5],
    [shot?.x ?? lie.x, shot?.z ?? lie.z, "#ff9e65", 4],
  ]) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px(x), py(z), r, 0, 7);
    ctx.fill();
  }
}
$("scoreButton").onclick = () => showCard(true);
$("closeScore").onclick = () => showCard(false);
$("newRound").onclick = () => {
  round.start();
  loadHole();
  $("start").click();
};
$("practiceHole").innerHTML = holes
  .map(
    (h) =>
      '<option value="' +
      (h.id - 1) +
      '">' +
      h.id +
      " · " +
      h.name +
      " · Par " +
      h.par +
      "</option>",
  )
  .join("");
$("practice").onclick = () => {
  round.start(Number($("practiceHole").value), true);
  loadHole();
  $("start").click();
};
try {
  const data = JSON.parse(localStorage.getItem("dwf-round-v1"));
  if (round.restore(data)) {
    lie = { ...data.lie };
    view.loadHole(round.hole);
    input.aim = Math.atan2(round.hole.pin.x - lie.x, round.hole.pin.z - lie.z);
    $("start").textContent =
      "Resume " +
      (round.practice ? "practice" : "round") +
      " · Hole " +
      (round.index + 1);
    if (round.holed) showResult();
  }
} catch {}
updateHole();
function updateBag() {
  for (const b of $("discBag").querySelectorAll("button"))
    b.setAttribute("aria-pressed", String(b.dataset.disc === selectedDisc));
  $("discHint").textContent = discById(selectedDisc).hint;
}
function selectDisc(id) {
  if (shot || round.holed || input.mode !== "aim") return;
  selectedDisc = discById(id).id;
  view.setDisc(discById(selectedDisc));
  updateBag();
  try {
    localStorage.setItem("dwf-disc-v1", selectedDisc);
  } catch {}
}
$("discBag").innerHTML = discs
  .map(
    (d, i) =>
      '<button data-disc="' +
      d.id +
      '" style="--disc-color:' +
      d.color +
      '"><kbd>' +
      (i + 1) +
      "</kbd> " +
      d.type +
      "</button>",
  )
  .join("");
for (const b of $("discBag").querySelectorAll("button"))
  b.onclick = () => selectDisc(b.dataset.disc);
view.setDisc(discById(selectedDisc));
updateBag();
requestAnimationFrame(frame);
// Read-only diagnostic snapshots for browser regressions; no production input shortcuts.
window.discLab = {
  snapshot: () =>
    structuredClone({
      shot,
      input,
      lie,
      count: round.strokes,
      round: round.serialize(lie),
      hole: round.hole,
      config,
      selectedDisc,
      lastShot,
      finished,
      completedShot,
    }),
};
