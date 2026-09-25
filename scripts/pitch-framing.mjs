import { chromium } from "playwright";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--enable-webgl", "--use-angle=swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
await page.goto(process.env.TEST_URL || "http://127.0.0.1:43928");
await page.waitForFunction(() => window.discLab);
await page.click("#start");
await page.mouse.move(720, 500);
await page.keyboard.press("Home");
await page.mouse.move(720, 100, { steps: 10 });
await page.waitForTimeout(700);
assert.equal(
  (await page.evaluate(() => discLab.snapshot())).input.pitch,
  (55 * Math.PI) / 180,
);
await page.screenshot({ path: "artifacts/pitch-high.png" });
await page.mouse.move(720, 850, { steps: 10 });
await page.waitForTimeout(700);
assert.equal(
  (await page.evaluate(() => discLab.snapshot())).input.pitch,
  (-20 * Math.PI) / 180,
);
await page.screenshot({ path: "artifacts/pitch-low.png" });
await browser.close();
console.log(
  "Both pitch limits reachable with pointer motion. Framing captures saved.",
);
