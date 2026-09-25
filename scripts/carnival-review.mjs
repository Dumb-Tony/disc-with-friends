import { chromium } from "playwright";
import assert from "node:assert/strict";
const b = await chromium.launch({
  executablePath:
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
  args: ["--enable-webgl", "--use-angle=d3d11"],
});
const p = await b.newPage({ viewport: { width: 1280, height: 850 } }),
  errors = [];
p.on("pageerror", (e) => errors.push(e.message));
try {
  await p.goto(process.env.TEST_URL || "http://127.0.0.1:43928");
  await p.click('[data-course="cloud-carnival-v1"]');
  await p.screenshot({ path: "artifacts/carnival-menu.png" });
  await p.click("#newRound");
  await p.waitForTimeout(900);
  await p.screenshot({ path: "artifacts/carnival-hole-1.png" });
  for (const i of [1, 2, 3, 4, 5, 6, 7, 8]) {
    await p.keyboard.press("Shift+Slash");
    await p.selectOption("#practiceHole", String(i));
    await p.click("#practice");
    await p.waitForTimeout(350);
    await p.screenshot({ path: `artifacts/carnival-hole-${i + 1}.png` });
  }
  assert.equal(
    (await p.evaluate(() => discLab.snapshot())).round.course,
    "cloud-carnival-v1",
  );
  await p.reload();
  assert.equal((await p.evaluate(() => discLab.snapshot())).round.index, 8);
  await p.click('[data-course="sunny-pines-v1"]');
  assert.equal(
    (await p.evaluate(() => discLab.snapshot())).round.course,
    "sunny-pines-v1",
  );
  await p.click('[data-course="cloud-carnival-v1"]');
  assert.equal((await p.evaluate(() => discLab.snapshot())).round.index, 8);
  assert.deepEqual(errors, []);
  console.log("Nine playground holes render; mode saves and reload verified.");
} finally {
  await b.close();
}
