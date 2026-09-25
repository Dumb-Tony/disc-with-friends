import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--enable-webgl", "--use-angle=swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(process.env.TEST_URL || "http://127.0.0.1:43928");
await page.click("#start");
await page.mouse.move(720, 500);
await page.keyboard.press("Home");
await page.mouse.move(720, 300, { steps: 10 });
await page.mouse.down({ button: "right" });
await page.mouse.move(1100, 300, { steps: 12 });
await page.mouse.up({ button: "right" });
let s = await page.evaluate(() => discLab.snapshot());
assert.equal(s.input.bank, Math.PI / 2);
assert.equal(
  await page.locator("#bankNeedle").evaluate((e) => e.style.left),
  "100%",
);
assert.ok((await page.locator("#angleText").textContent()).includes("90°"));
await page.screenshot({ path: "artifacts/vertical-tilt.png" });
await page.mouse.down();
await page.mouse.move(1140, 490, { steps: 12 });
await page.mouse.up();
s = await page.evaluate(() => discLab.snapshot());
assert.equal(s.lastShot.spec.bank, Math.PI / 2);
await page.waitForFunction(
  () => discLab.snapshot().completedShot !== null,
  {},
  { timeout: 30000 },
);
const first = (await page.evaluate(() => discLab.snapshot())).completedShot;
await page.keyboard.press("Space");
await page.waitForFunction(
  () => discLab.snapshot().completedShot !== null,
  {},
  { timeout: 30000 },
);
const replay = (await page.evaluate(() => discLab.snapshot())).completedShot;
assert.deepEqual(
  { ...first, event: null, impact: null },
  { ...replay, event: null, impact: null },
);
await page.keyboard.press("Home");
await page.mouse.down({ button: "right" });
await page.mouse.move(760, 490, { steps: 12 });
await page.mouse.up({ button: "right" });
s = await page.evaluate(() => discLab.snapshot());
assert.equal(s.input.bank, -Math.PI / 2);
assert.equal(
  await page.locator("#bankNeedle").evaluate((e) => e.style.left),
  "0%",
);
assert.deepEqual(errors, []);
console.log(
  "Vertical tilt browser pass: ±90° input, bounded HUD, raised vertical release, landing and identical replay.",
);
await browser.close();
