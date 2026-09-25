import { chromium } from "playwright";
import fs from "node:fs";
import assert from "node:assert/strict";
const fixtures = JSON.parse(
  fs.readFileSync("tests/fixtures/carnival-gadgets.json", "utf8"),
);
const browser = await chromium.launch({
  executablePath:
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
  args: ["--enable-webgl", "--use-angle=d3d11"],
});
const p = await browser.newPage({ viewport: { width: 1200, height: 850 } }),
  errors = [];
p.on("pageerror", (e) => errors.push(e.message));
try {
  await p.goto(process.env.TEST_URL || "http://127.0.0.1:43928");
  await p.click('[data-course="cloud-carnival-v1"]');
  for (const f of fixtures) {
    await p.selectOption("#practiceHole", String(f.index));
    await p.click("#practice");
    await p.mouse.move(600, 400);
    await p.keyboard.press("Home");
    await p.mouse.move(600 - f.dx, 400 + f.pitchPixels, { steps: 2 });
    await p.mouse.down();
    await p.mouse.move(600 - f.dx, 400 + f.pitchPixels + f.draw, { steps: 8 });
    await p.mouse.up();
    await p.waitForFunction(
      () => discLab.snapshot().completedShot,
      {},
      { timeout: 30000 },
    );
    const after = await p.evaluate(() => discLab.snapshot());
    assert.ok(after.completedShot[f.key]);
    assert.ok(
      Math.hypot(
        after.completedShot.x - f.expected.x,
        after.completedShot.z - f.expected.z,
      ) < 0.03,
    );
    await p.keyboard.press("Space");
    await p.waitForFunction(
      () => discLab.snapshot().completedShot,
      {},
      { timeout: 30000 },
    );
    const replay = await p.evaluate(() => discLab.snapshot());
    assert.deepEqual(replay.completedShot, after.completedShot);
    assert.equal(replay.count, after.count);
    console.log(f.key, "native throw and exact replay passed");
    await p.keyboard.press("Shift+Slash");
  }
  // A moving-sail shot replays the launch-time obstacle phase, even after waiting.
  await p.selectOption("#practiceHole", "1");
  await p.click("#practice");
  await p.mouse.move(600, 400);
  await p.keyboard.press("Home");
  await p.mouse.down();
  await p.mouse.move(600, 570, { steps: 8 });
  await p.mouse.up();
  await p.waitForFunction(
    () => discLab.snapshot().completedShot,
    {},
    { timeout: 30000 },
  );
  const first = await p.evaluate(() => discLab.snapshot());
  await p.waitForTimeout(700);
  await p.keyboard.press("Space");
  await p.waitForFunction(
    () => discLab.snapshot().completedShot,
    {},
    { timeout: 30000 },
  );
  assert.deepEqual(
    (await p.evaluate(() => discLab.snapshot())).completedShot,
    first.completedShot,
  );
  assert.deepEqual(errors, []);
  console.log("Moving obstacle replay passed.");
} finally {
  await browser.close();
}
