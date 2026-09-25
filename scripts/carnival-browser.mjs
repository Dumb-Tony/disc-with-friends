import { chromium } from "playwright";
import fs from "node:fs";
import assert from "node:assert/strict";
const routes = JSON.parse(
  fs.readFileSync("tests/fixtures/carnival-round.json", "utf8"),
);
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE ||
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
  args: [
    "--enable-webgl",
    "--use-angle=" + (process.env.ANGLE_BACKEND || "swiftshader"),
  ],
});
const page = await browser.newPage({ viewport: { width: 960, height: 720 } }),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto(process.env.TEST_URL || "http://127.0.0.1:43928");
  await page.click('[data-course="cloud-carnival-v1"]');
  await page.click("#newRound");
  let x = 600,
    y = 400;
  await page.mouse.move(x, y);
  await page.keyboard.press("Home");
  for (const route of process.env.HAZARDS_ONLY ? [] : routes) {
    await page.waitForTimeout(600);
    await page.screenshot({
      path: `artifacts/carnival-hole-${route.hole}.png`,
    });
    for (const [i, shot] of route.shots.entries()) {
      const before = await page.evaluate(() => discLab.snapshot());
      assert.equal(before.round.index, route.hole - 1);
      assert.ok(
        Math.hypot(
          before.lie.x - shot.spec.lie.x,
          before.lie.z - shot.spec.lie.z,
        ) < 0.02,
      );
      // Use native pointer movement and draw/release, not state injection.
      x -= Math.round((shot.spec.aim - before.input.aim) / 0.0025);
      y -= Math.round((shot.spec.pitch - before.input.pitch) / 0.0025);
      await page.mouse.move(x, y, { steps: 2 });
      await page.mouse.down();
      y += shot.draw;
      await page.mouse.move(x, y, { steps: 8 });
      await page.mouse.up();
      await page.waitForFunction(
        () => discLab.snapshot().completedShot !== null,
        {},
        { timeout: 60000 },
      );
      const after = await page.evaluate(() => discLab.snapshot());
      assert.equal(
        !!after.completedShot.scored,
        shot.expected.scored,
        `hole ${route.hole} shot ${i + 1}`,
      );
      assert.ok(
        Math.hypot(
          after.completedShot.x - shot.expected.x,
          after.completedShot.z - shot.expected.z,
        ) < 0.03,
      );
      console.log(
        "Hole",
        route.hole,
        "shot",
        i + 1,
        after.completedShot.scored ? "HOLED" : "landed",
      );
    }
    if (route.hole < 9) {
      await page.keyboard.press("Enter");
      await page.mouse.move(600, 400);
      x = 600;
      y = 400;
      await page.keyboard.press("Home");
    }
  }
  if (!process.env.HAZARDS_ONLY) {
    let state = await page.evaluate(() => discLab.snapshot());
    assert.equal(state.round.done, true);
    assert.equal(state.round.scores.filter(Boolean).length, 9);
    await page.click("#scoreButton");
    await page.screenshot({ path: "artifacts/carnival-final-scorecard.png" });
    await page.reload();
    await page.click("#start");
    state = await page.evaluate(() => discLab.snapshot());
    assert.equal(state.round.done, true);
  }

  assert.deepEqual(errors, []);
  console.log(
    "Complete Cloud Carnival round and saved scorecard verified with native mouse input.",
  );
} finally {
  await browser.close();
}
