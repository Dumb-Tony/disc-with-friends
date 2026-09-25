import { chromium } from "playwright";
import assert from "node:assert/strict";
const b = await chromium.launch({
  executablePath:
    process.env.BROWSER_EXECUTABLE ||
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  headless: true,
  args: [
    "--enable-webgl",
    "--use-angle=" + (process.env.ANGLE_BACKEND || "swiftshader"),
  ],
});
try {
  const page = await b.newPage({ viewport: { width: 1200, height: 850 } }),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.route("**/__shoreline-review.html", (r) =>
    r.fulfill({
      contentType: "text/html",
      body: `<style>body{margin:0}</style><canvas id="game"></canvas><script type="module">import {FieldView} from './src/view.js';import {holes} from './src/course.js';window.v=new FieldView(document.getElementById('game'));window.holes=holes;window.ready=true;</script>`,
    }),
  );
  await page.goto(
    (process.env.TEST_URL || "http://127.0.0.1:43928") +
      "/__shoreline-review.html",
  );
  await page.waitForFunction(() => window.ready);
  for (const [index, name] of [
    [2, "pond"],
    [1, "creek"],
    [0, "foliage"],
  ]) {
    const stats = await page.evaluate((index) => {
      const v = window.v,
        h = window.holes[index];
      v.loadHole(h);
      v.arrow.visible =
        v.disc.visible =
        v.shadow.visible =
        v.trace.visible =
          false;
      if (index === 0) {
        v.camera.position.set(-3, 2, 12);
        v.camera.lookAt(0, 4, 27);
      } else {
        const w = h.water[0];
        v.camera.position.set(w.x + 19, 16, w.z - 22);
        v.camera.lookAt(w.x, 0, w.z);
      }
      v.sun.position.set(-48, 40, 0);
      v.sun.target.position.set(0, 0, 30);
      v.renderer.render(v.scene, v.camera);
      return {
        calls: v.renderer.info.render.calls,
        triangles: v.renderer.info.render.triangles,
        geometries: v.renderer.info.memory.geometries,
      };
    }, index);
    await page.screenshot({ path: `artifacts/deeper-${name}.png` });
    console.log(name, stats);
  }
  assert.deepEqual(errors, []);
  console.log("PASS: shoreline and foliage render review, no browser errors.");
} finally {
  await b.close();
}
