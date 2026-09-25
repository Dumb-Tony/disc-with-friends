import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
await mkdir("artifacts", { recursive: true });
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--enable-webgl", "--use-angle=swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(process.env.TEST_URL || "http://127.0.0.1:43927");
await page.waitForFunction(() => window.discLab);
await page.screenshot({ path: "artifacts/welcome.png" });
await page.click("#start");
await page.waitForTimeout(200);
await page.mouse.move(720, 500);
await page.keyboard.press("Home");
const basePitch = (await page.evaluate(() => discLab.snapshot())).input.pitch;
await page.mouse.move(720, 430, { steps: 7 });
assert.ok(
  (await page.evaluate(() => discLab.snapshot())).input.pitch > basePitch,
);
await page.mouse.down({ button: "right" });
await page.mouse.move(765, 430, { steps: 5 });
await page.mouse.up({ button: "right" });
let before = await page.evaluate(() => discLab.snapshot());
await page.mouse.down();
await page.mouse.move(825, 620, { steps: 15 });
let drawing = await page.evaluate(() => discLab.snapshot());
assert.equal(drawing.input.aim, before.input.aim);
assert.equal(drawing.input.bank, before.input.bank);
assert.equal(drawing.input.pitch, before.input.pitch);
await page.screenshot({ path: "artifacts/pitch-draw.png" });
assert.ok(drawing.input.power > 0.5);
await page.mouse.up();
await page.waitForTimeout(1800);
await page.screenshot({ path: "artifacts/flight.png" });
await page.waitForFunction(
  () => discLab.snapshot().finished,
  {},
  { timeout: 20000 },
);
let first = await page.evaluate(() => discLab.snapshot());
assert.equal(first.count, 1);
await page.screenshot({ path: "artifacts/landing.png" });
await page.keyboard.press("Space");
await page.waitForFunction(() => !discLab.snapshot().finished);
await page.waitForFunction(
  () => discLab.snapshot().finished,
  {},
  { timeout: 20000 },
);
let replay = await page.evaluate(() => discLab.snapshot());
assert.deepEqual(
  { ...replay.shot, event: null, impact: null },
  { ...first.shot, event: null },
);
assert.equal(replay.count, 1);
await page.keyboard.press("KeyN");
let next = await page.evaluate(() => discLab.snapshot());
assert.equal(next.lie.x, first.shot.x);
assert.equal(next.shot, null);
assert.equal(next.input.pitch, Math.PI / 18);
await page.keyboard.press("Home");
await page.keyboard.press("KeyT");
assert.equal(await page.locator("#panel").isVisible(), true);
await page
  .locator('input[aria-label="Lift / glide"]')
  .evaluate((el) => (el.value = "0.04"));
await page.locator('input[aria-label="Lift / glide"]').dispatchEvent("input");
await page.reload();
await page.waitForFunction(() => window.discLab);
assert.equal((await page.evaluate(() => discLab.snapshot())).config.lift, 0.04);
await page.click("#start");
await page.keyboard.press("KeyT");
await page.click("#defaults");
await page.click("#closeTune");
await page.waitForTimeout(1000);
await page.screenshot({ path: "artifacts/field.png" });
await page.mouse.click(720, 400);
await page.waitForTimeout(100);
await page.keyboard.press("Home");
await page.mouse.down();
await page.mouse.move(720, 613, { steps: 20 });
await page.mouse.up();
await page.waitForFunction(
  () => discLab.snapshot().finished,
  {},
  { timeout: 20000 },
);
assert.equal((await page.evaluate(() => discLab.snapshot())).shot.scored, true);
await page.screenshot({ path: "artifacts/basket.png" });
await page.keyboard.press("Home");
await page.mouse.move(720, 861, { steps: 10 });
assert.ok((await page.evaluate(() => discLab.snapshot())).input.pitch < 0);
await page.screenshot({ path: "artifacts/pitch-down.png" });
assert.deepEqual(errors, []);
console.log(
  "Browser pass: vertical aim + pitch lock, real pointer draw + aim lock, flight, landing, exact replay, next lie, reset, tuning persistence, successful basket from tee. No page errors.",
);
await browser.close();
