import { chromium } from "playwright";
import assert from "node:assert/strict";
import { simulate } from "../src/physics.js";
import { holes } from "../src/course.js";
const browser = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE ||
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--enable-webgl", "--use-angle=swiftshader"],
});
try {
  const page = await browser.newPage({
      viewport: { width: 1200, height: 850 },
    }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto(process.env.TEST_URL || "http://127.0.0.1:43928");
  await page.click("#start");
  let x = 600,
    y = 400;
  await page.mouse.move(x, y);
  await page.keyboard.press("Home");
  for (const [key, id] of [
    ["Digit1", "putter"],
    ["Digit2", "midrange"],
    ["Digit3", "driver"],
  ]) {
    await page.keyboard.press("Home");
    await page.keyboard.press(key);
    let s = await page.evaluate(() => discLab.snapshot());
    assert.equal(s.selectedDisc, id);
    x -= 120;
    await page.mouse.move(x, y, { steps: 3 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `artifacts/woodland-${id}.png` });
    await page.mouse.down();
    await page.keyboard.press(key === "Digit1" ? "Digit3" : "Digit1");
    s = await page.evaluate(() => discLab.snapshot());
    assert.equal(s.selectedDisc, id, "selection locked during draw");
    y += 120;
    await page.mouse.move(x, y, { steps: 8 });
    await page.mouse.up();
    await page.keyboard.press("Digit2");
    await page.waitForFunction(
      () => discLab.snapshot().completedShot !== null,
      {},
      { timeout: 60000 },
    );
    s = await page.evaluate(() => discLab.snapshot());
    assert.equal(s.lastShot.discId, id);
    const expected = simulate(
      s.lastShot.spec,
      s.lastShot.config,
      holes[0].pin,
      holes[0],
    ).state;
    assert.ok(
      Math.hypot(
        s.completedShot.x - expected.x,
        s.completedShot.z - expected.z,
      ) < 1e-7,
    );
    console.log(id, "native-input flight verified");
    if (id === "putter") {
      const landed = s.completedShot;
      await page.keyboard.press("Digit3");
      await page.keyboard.press("Space");
      await page.waitForFunction(
        () => discLab.snapshot().completedShot !== null,
        {},
        { timeout: 60000 },
      );
      s = await page.evaluate(() => discLab.snapshot());
      assert.equal(s.selectedDisc, "putter");
      assert.equal(s.count, 1);
      assert.deepEqual(s.completedShot, landed);
    }
  }
  await page.reload();
  assert.equal(
    (await page.evaluate(() => discLab.snapshot())).selectedDisc,
    "driver",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: all three disc flights, locked selection, exact replay and persistent selection.",
  );
} finally {
  await browser.close();
}
