import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--enable-webgl", "--use-angle=swiftshader"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } }),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
const base = process.env.TEST_URL || "http://127.0.0.1:43928";
await page.route("**/__visual-review.html", (route) =>
  route.fulfill({
    contentType: "text/html",
    body: `<style>body{margin:0}canvas{display:block}</style><canvas id="canvas"></canvas><script type="module">import {FieldView} from './src/view.js';window.review=new FieldView(document.getElementById('canvas'));window.ready=true;</script>`,
  }),
);
await page.goto(base + "/__visual-review.html");
await page.waitForFunction(() => window.ready);
await mkdir("artifacts", { recursive: true });
for (const item of ["disc", "basket"]) {
  const stats = await page.evaluate((item) => {
    const v = window.review;
    v.arrow.visible = v.trace.visible = v.shadow.visible = false;
    v.basket.position.z = item === "basket" ? 0 : 55;
    v.disc.visible = item === "disc";
    v.disc.position.set(0, 1.18, 0);
    if (item === "disc") {
      v.camera.position.set(0.75, 2.0, -1.1);
      v.camera.lookAt(0, 1.18, 0);
    } else {
      v.camera.position.set(2.15, 2.4, -3.1);
      v.camera.lookAt(0, 1.2, 0);
    }
    v.renderer.render(v.scene, v.camera);
    return v.renderer.info.render;
  }, item);
  await page.screenshot({ path: `artifacts/detail-${item}.png` });
  console.log(item, stats);
}
console.log("Console errors:", errors);
await browser.close();
if (errors.length) process.exitCode = 1;
