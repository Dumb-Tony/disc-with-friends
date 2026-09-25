import { waterOutline } from "./water-shape.js";
import { discs, discById, discConfig } from "./discs.js";
let selectedDisc = "midrange";
try {
  selectedDisc = discById(localStorage.getItem("dwf-disc-v1")).id;
} catch {}
import { courses } from "./courses.js";
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
let courseTime = 0;
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
    courseTime = 0;
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
        spec: { ...spec, lie: { ...lie }, courseTime },
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
  courseTime = lastShot.spec.courseTime || 0;
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
      if (started) courseTime += FIXED_DT;
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
    view.update(dt, { input, shot, lie, active: started, courseTime });
  }
  requestAnimationFrame(frame);
}

function saveRound() {
  try {
    const checkpoint = JSON.stringify(round.serialize(lie));
    localStorage.setItem("dwf-round-v1", checkpoint);
    localStorage.setItem("dwf-round-" + round.courseId, checkpoint);
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
  $("courseName").textContent = (
    round.course.name +
    " / " +
    round.course.mode
  ).toUpperCase();
  document.body.dataset.theme = h.theme || "nature";
  document.title = "Disc With Friends · " + round.course.name;
  $("game").setAttribute("aria-label", round.course.name + " disc golf course");
  $("map").setAttribute(
    "aria-label",
    h.theme
      ? "Hole map: pink bumpers, yellow sails and pads, purple portals, blue fans"
      : "Hole map: orange is you, gold is the basket, blue is water",
  );
  $("menuCourse").textContent =
    round.course.name.toUpperCase() + " / NINE HOLES / PAR " + round.course.par;
  $("menuTitle").innerHTML = h.theme
    ? "Small course.<br>Big disc energy."
    : "Find your line.<br>Nine ways home.";
  $("menuDescription").textContent = h.theme
    ? "Welcome to Cloud Carnival. Ride fans, bank off bumpers and fling through portal shortcuts. Nine candy-colored holes. Same discs. Entirely different playground."
    : "Play Sunny Pines through pine gates, winding streams, ponds and stone greens. Water adds one stroke and moves you to a marked drop zone.";
  $("newRound").textContent =
    "New " + round.course.mode.toLowerCase() + " round";
  $("scoreTitle").textContent = round.course.name + " scorecard";
  for (const b of $("coursePicker").querySelectorAll("button"))
    b.setAttribute("aria-pressed", String(b.dataset.course === round.courseId));
  $("mapLegend").textContent = h.theme
    ? "Pink: bumper · Yellow: sail / pad · Purple: portal · Blue: fan"
    : "● You · ◆ Basket · Blue: water";
  populatePractice();
  $("holeName").textContent = h.name;
  $("holeHint").textContent = h.hint;
  $("footerHole").textContent =
    h.id + " · " + h.name + " · " + h.length + " m · PAR " + h.par;
}
function showResult() {
  $("result").hidden = false;
  document.exitPointerLock?.();
  $("resultTitle").textContent = round.done
    ? round.course.name.toUpperCase() + " · ROUND COMPLETE"
    : round.hole.name.toUpperCase() + " · COMPLETE";
  $("resultDistance").textContent = round.done
    ? round.total + " STROKES"
    : scoreName(round.strokes, round.hole.par);
  $("resultDetail").textContent = round.done
    ? "Par " +
      round.course.par +
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
  $("scoreRows").innerHTML = round.holes
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
    (round.practice ? "Practice" : round.course.name) +
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
  ctx.fillStyle = h.theme ? "#285c75" : "#173d32";
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
  for (const o of h.gadgets || []) {
    ctx.fillStyle = {
      bumper: "#ff70ad",
      mill: "#ffcf58",
      fan: "#54c9f2",
      portal: "#bd8bff",
      pad: "#ffcf58",
      wall: "#fff5d9",
    }[o.type];
    if (o.type === "fan" || o.type === "wall") {
      const w = o.type === "fan" ? o.rx * 2 : o.w,
        d = o.type === "fan" ? o.rz * 2 : o.d;
      ctx.globalAlpha = o.type === "fan" ? 0.6 : 1;
      ctx.fillRect(
        px(o.x + w / 2),
        py(o.z + d / 2),
        w * scale,
        Math.max(2, d * scale),
      );
      ctx.globalAlpha = 1;
    } else {
      ctx.beginPath();
      ctx.arc(px(o.x), py(o.z), Math.max(2, (o.r || 2) * scale), 0, 7);
      ctx.fill();
    }
    if (o.type === "portal") {
      ctx.strokeStyle = "#cfa4ff";
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(px(o.x), py(o.z));
      ctx.lineTo(px(o.exit.x), py(o.exit.z));
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#54c9f2";
      ctx.beginPath();
      ctx.arc(px(o.exit.x), py(o.exit.z), 3, 0, 7);
      ctx.fill();
    }
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
function populatePractice() {
  const previous = $("practiceHole").value;
  $("practiceHole").innerHTML = round.holes
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
  $("practiceHole").value = previous || "0";
}
$("practice").onclick = () => {
  round.start(Number($("practiceHole").value), true);
  loadHole();
  $("start").click();
};
$("coursePicker").innerHTML = courses
  .map(
    (c) =>
      '<button data-course="' +
      c.id +
      '"><b>' +
      c.name +
      "</b><span>" +
      c.mode +
      " · 9 holes · Par " +
      c.par +
      "</span></button>",
  )
  .join("");
for (const b of $("coursePicker").querySelectorAll("button"))
  b.onclick = () => {
    if (b.dataset.course === round.courseId) return;
    // A course switch resumes the last settled lie, not a half-completed throw.
    if (!shot || finished) saveRound();
    input.cancel();
    shot = null;
    lastShot = null;
    completedShot = null;
    finished = false;
    courseTime = 0;
    view.resetTrace();
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem("dwf-round-" + b.dataset.course));
    } catch {}
    if (saved?.course === b.dataset.course && round.restore(saved)) {
      lie = { ...saved.lie };
      view.loadHole(round.hole);
      input.aim = Math.atan2(
        round.hole.pin.x - lie.x,
        round.hole.pin.z - lie.z,
      );
      input.pitch = (config.launchLoft * Math.PI) / 180;
      input.bank = input.rawBank = 0;
      $("result").hidden = true;
      if (round.holed) showResult();
    } else {
      round.start(0, false, b.dataset.course);
      loadHole();
    }
    updateHole();
    saveRound();
    $("start").textContent =
      "Play " + round.course.name + " · Hole " + (round.index + 1);
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
const requestedCourse = new URLSearchParams(location.search).get("course");
if (requestedCourse && requestedCourse !== round.courseId) {
  const button = [...$("coursePicker").querySelectorAll("button")].find(
    (b) => b.dataset.course === requestedCourse,
  );
  button?.click();
}
saveRound();
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
      courseTime,
    }),
};
