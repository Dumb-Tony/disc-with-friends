import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.BROWSER_EXECUTABLE || "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--enable-webgl", "--use-angle=swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(process.env.TEST_URL || "http://127.0.0.1:43928");
await page.click("#start");
await page.mouse.move(720, 400);
await page.keyboard.press("Home");
await page.waitForTimeout(700);
await page.screenshot({ path: "artifacts/pine-gate-tee.png" });
await page.mouse.move(600, 400, { steps: 12 });
await page.mouse.down();
await page.mouse.move(600, 520, { steps: 12 });
await page.mouse.up();
await page.waitForFunction(
  () => discLab.snapshot().completedShot !== null,
  {},
  { timeout: 30000 },
);
let state = await page.evaluate(() => discLab.snapshot());
assert.equal(state.shot, null);
assert.equal(state.count, 1);
assert.equal(state.completedShot.treeHits, undefined);
assert.ok(state.lie.z > 30 && state.lie.x > 9);
assert.equal(state.input.bank, 0);
assert.equal(await page.locator("#result").isVisible(), false);
assert.equal(await page.locator("#lie").count(), 0);
await page.waitForTimeout(800);
await page.screenshot({ path: "artifacts/pine-gate-approach.png" });
await page.mouse.move(612, 520, { steps: 3 });
await page.mouse.down();
await page.mouse.move(612, 640, { steps: 12 });
await page.mouse.up();
await page.waitForFunction(
  () => discLab.snapshot().completedShot !== null,
  {},
  { timeout: 30000 },
);
state = await page.evaluate(() => discLab.snapshot());
assert.equal(state.shot.scored, true);
assert.equal(state.count, 2);
assert.equal(await page.locator("#resultDistance").textContent(), "BIRDIE");
await page.screenshot({ path: "artifacts/pine-gate-birdie.png" });
await page.keyboard.press("KeyR");
state = await page.evaluate(() => discLab.snapshot());
assert.equal(state.count, 0);
assert.deepEqual(state.lie, { x: 0, z: 0 });
assert.equal(state.lastShot, null);
await page.mouse.down();
await page.mouse.move(612, 853, { steps: 20 });
await page.mouse.up();
await page.waitForFunction(
  () => discLab.snapshot().completedShot !== null,
  {},
  { timeout: 30000 },
);
assert.equal((await page.evaluate(() => discLab.snapshot())).shot.scored, true);
assert.equal(await page.locator("#resultDistance").textContent(), "ACE!");
await page.keyboard.press("Home");
await page.mouse.move(572, 853, { steps: 4 });
await page.mouse.down();
await page.mouse.move(572, 973, { steps: 12 });
await page.mouse.up();
await page.waitForFunction(
  () => discLab.snapshot().completedShot !== null,
  {},
  { timeout: 30000 },
);
state = await page.evaluate(() => discLab.snapshot());
assert.ok(state.completedShot.treeHits > 0);
assert.equal(state.shot, null);
assert.equal(state.count, 1);
assert.equal(await page.locator("#result").isVisible(), false);
assert.deepEqual(errors, []);
console.log(
  "Pine Gate browser pass: automatic lie, safe-route birdie, restart, direct ace, tree collision and automatic recovery.",
);
await browser.close();
