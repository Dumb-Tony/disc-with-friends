import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--enable-webgl", "--use-angle=swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } }),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
const base = (process.env.TEST_URL || "http://127.0.0.1:43928").replace(
  /\/$/,
  "",
);
await page.route("**/__basket-contact.html", (route) =>
  route.fulfill({
    contentType: "text/html",
    body: `<style>body{margin:0}canvas{display:block}</style><canvas id="canvas"></canvas><script type="module">import {FieldView} from './src/view.js';import {launch,step} from './src/physics.js';import {defaults} from './src/config.js';window.lab={view:new FieldView(document.getElementById('canvas')),launch,step,defaults};</script>`,
  }),
);
await page.goto(base + "/__basket-contact.html");
await page.waitForFunction(() => window.lab);
const result = await page.evaluate(() => {
  const { view, launch, step, defaults } = lab;
  view.arrow.visible = view.trace.visible = view.shadow.visible = false;
  view.camera.position.set(2.2, 2.1, 51.5);
  view.camera.lookAt(0, 1.25, 55);
  view.sun.position.set(-38, 65, 23);
  view.sun.target.position.set(0, 0, 55);
  const shot = Object.assign(launch({ lie: { x: 0, z: 53 } }), {
    y: 1.65,
    vx: 0,
    vy: 0,
    vz: 7,
    bank: 0,
  });
  lab.shot = shot;
  let first = null;
  for (let i = 0; i < 150; i++) {
    step(shot, defaults);
    if (shot.impact) view.onBasketImpact(shot.impact);
    view.animateChains(1 / 120);
    if (shot.event === "chains" && !first) first = shot.time;
    if (first && shot.time - first > 0.1) break;
  }
  view.disc.position.set(shot.x, shot.y, shot.z);
  view.renderer.render(view.scene, view.camera);
  const displacement = Math.max(
    ...view.chainModels.flatMap((s) =>
      s.points.map((p, i) => Math.hypot(p.x - s.home[i].x, p.z - s.home[i].z)),
    ),
  );
  return { first, scored: shot.scored, displacement };
});
assert.ok(result.first);
assert.equal(result.scored, false);
assert.ok(result.displacement > 0.01);
await page.screenshot({ path: "artifacts/chains-impact.png" });
const caught = await page.evaluate(() => {
  const { view, step, defaults, shot } = lab;
  for (let i = 0; i < 600 && shot.phase !== "rest"; i++) {
    step(shot, defaults);
    if (shot.impact) view.onBasketImpact(shot.impact);
    view.animateChains(1 / 120);
  }
  view.disc.position.set(shot.x, shot.y, shot.z);
  view.renderer.render(view.scene, view.camera);
  return shot.scored;
});
assert.equal(caught, true);
await page.screenshot({ path: "artifacts/chains-caught.png" });
const rim = await page.evaluate(() => {
  const { view, launch, step, defaults } = lab,
    shot = Object.assign(launch({ lie: { x: 0, z: 53 } }), {
      y: 0.74,
      vx: 0,
      vy: 0,
      vz: 10,
      bank: 0,
    });
  const c = { ...defaults, gravity: 0, lift: 0, drag: 0, turn: 0, fade: 0 };
  let part;
  for (let i = 0; i < 100; i++) {
    step(shot, c);
    if (shot.impact) {
      part = shot.impact.part;
      break;
    }
  }
  view.disc.position.set(shot.x, shot.y, shot.z);
  view.renderer.render(view.scene, view.camera);
  return { part, vz: shot.vz, scored: shot.scored };
});
assert.equal(rim.part, "lower-rim");
assert.ok(rim.vz < 0);
assert.equal(rim.scored, false);
await page.screenshot({ path: "artifacts/rim-impact.png" });
assert.deepEqual(errors, []);
console.log("Browser contact pass:", {
  chainDisplacement: result.displacement,
  delayedCatch: caught,
  rim,
});
await browser.close();
