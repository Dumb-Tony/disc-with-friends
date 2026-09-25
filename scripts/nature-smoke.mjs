import { chromium } from "playwright";
import assert from "node:assert/strict";
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
  const res = await page.goto(process.env.TEST_URL || "http://127.0.0.1:43928");
  assert.equal(res.status(), 200);
  await page.waitForFunction(() => window.discLab);
  await page.screenshot({ path: "artifacts/nature-menu.png" });
  for (let i = 0; i < 9; i++) {
    if (i) await page.keyboard.press("Shift+Slash");
    await page.selectOption("#practiceHole", String(i));
    await page.click("#practice");
    await page.waitForTimeout(400);
    const s = await page.evaluate(() => discLab.snapshot());
    assert.equal(s.round.index, i);
    assert.equal(s.round.practice, true);
    assert.equal(s.count, 0);
    assert.equal(await page.locator("#holeName").textContent(), s.hole.name);
    if ([1, 2, 5, 8].includes(i))
      await page.screenshot({
        path: `artifacts/nature-release-hole-${i + 1}.png`,
      });
  }
  await page.keyboard.press("Shift+Slash");
  await page.click("#newRound");
  await page.mouse.move(600, 400);
  await page.keyboard.press("Home");
  await page.mouse.down();
  await page.mouse.move(600, 613, { steps: 15 });
  await page.mouse.up();
  await page.waitForFunction(
    () => discLab.snapshot().round.holed,
    {},
    { timeout: 45000 },
  );
  assert.equal(await page.locator("#resultDistance").textContent(), "ACE!");
  await page.keyboard.press("Enter");
  let s = await page.evaluate(() => discLab.snapshot());
  assert.equal(s.round.index, 1);
  assert.equal(s.round.scores[0].strokes, 1);
  await page.keyboard.press("KeyS");
  assert.equal(await page.locator("#scoreRows tr").count(), 9);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#scorecard").isVisible(), false);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: published nine-hole selection/rendering, new round, native-input ace, next hole, preserved score and scorecard controls.",
  );
} finally {
  await browser.close();
}
