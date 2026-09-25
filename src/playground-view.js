import * as T from "../vendor/three.module.js";
import { millAngle } from "./playground-physics.js";
export function addPlayground(scene, hole) {
  const root = new T.Group();
  root.name = "Cloud Carnival";
  scene.add(root);
  const colors = {
    mint: "#64e5aa",
    green: "#35c689",
    dark: "#27848c",
    pink: "#ff70ad",
    purple: "#9b70e5",
    yellow: "#ffcf58",
    white: "#fff5d9",
    blue: "#54c9f2",
    red: "#f97870",
  };
  const mats = Object.fromEntries(
    Object.entries(colors).map(([k, color]) => [
      k,
      new T.MeshToonMaterial({ color }),
    ]),
  );
  const animations = [];
  function mesh(geo, mat, x, y, z, parent = root) {
    const m = new T.Mesh(geo, mats[mat] || mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }
  const box = (x, y, z, w, h, d, c, parent) =>
    mesh(new T.BoxGeometry(w, h, d), c, x, y, z, parent);
  const ball = (x, y, z, r, c, parent) =>
    mesh(new T.SphereGeometry(r, 12, 8), c, x, y, z, parent);
  const cyl = (x, y, z, r, h, c, parent) =>
    mesh(new T.CylinderGeometry(r, r, h, 24), c, x, y, z, parent);
  function ring(x, y, z, r, t, c, parent) {
    return mesh(new T.TorusGeometry(r, t, 8, 40), c, x, y, z, parent);
  }
  function label(text, x, y, z, color = "#6c488d", size = 2.5) {
    const canvas = document.createElement("canvas");
    canvas.width = 768;
    canvas.height = 160;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff8e7";
    ctx.beginPath();
    ctx.roundRect(4, 4, 760, 152, 40);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 9;
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.font = "900 62px Trebuchet MS, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 384, 84, 710);
    const map = new T.CanvasTexture(canvas);
    map.colorSpace = T.SRGBColorSpace;
    const sprite = new T.Sprite(new T.SpriteMaterial({ map }));
    sprite.position.set(x, y, z);
    sprite.scale.set(size * 4.8, size, 1);
    root.add(sprite);
    return sprite;
  }
  // Broad, forgiving lawn. The painted route suggests a line without invisible walls.
  box(0, -0.48, 45, 360, 0.9, 360, "green");
  const points = hole.route.map(([x, z]) => new T.Vector3(x, 0.01, z));
  const curve = new T.CatmullRomCurve3(points),
    positions = [],
    indices = [];
  const n = 120,
    width = 7;
  for (let i = 0; i <= n; i++) {
    const p = curve.getPoint(i / n),
      t = curve.getTangent(i / n);
    for (const side of [-1, 1])
      positions.push(p.x + t.z * width * side, 0.025, p.z - t.x * width * side);
    if (i < n) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  mesh(geo, "mint", 0, 0, 0);
  for (let i = 0; i <= n; i += 3) {
    const p = curve.getPoint(i / n),
      t = curve.getTangent(i / n);
    for (const side of [-1, 1]) {
      const m = box(
        p.x + t.z * 7.1 * side,
        0.045,
        p.z - t.x * 7.1 * side,
        0.22,
        0.035,
        0.85,
        "white",
      );
      m.rotation.y = Math.atan2(t.x, t.z);
    }
  }
  const tee = box(0, 0.03, 0, 4, 0.06, 5, "purple");
  for (let i = 0; i < 4; i++)
    box(0, 0.068, -1.6 + i, 0.9 - i * 0.12, 0.02, 0.16, "white");
  cyl(hole.pin.x, 0.025, hole.pin.z, 5, 0.045, "yellow");
  const green = ring(hole.pin.x, 0.06, hole.pin.z, 5, 0.07, "white");
  green.rotation.x = -Math.PI / 2;
  label("CLOUD CARNIVAL", 0, 6, -6, "#8155bf", 1.2);
  label(
    String(hole.id).padStart(2, "0") + "  /  " + hole.name.toUpperCase(),
    -8,
    2.3,
    -1,
    "#52658a",
    0.65,
  );
  // Rounded toy scenery frames the route and never masquerades as a collision obstacle.
  for (let i = 0; i < 26; i++) {
    const z = -18 + i * 5.7,
      x = (i % 2 ? -1 : 1) * (25 + 7 * Math.sin(i * 2.13)),
      h = 3 + (i % 4) * 0.8;
    cyl(x, h / 2, z, 0.4, h, "white");
    const c = ["pink", "purple", "yellow", "blue"][i % 4];
    ball(x, h + 1.3, z, 2.1, c);
    ball(x - 1.4, h + 0.8, z + 0.2, 1.4, c);
    ball(x + 1.25, h + 0.65, z - 0.2, 1.5, c);
    const base = cyl(x, 0.15, z, 2.5, 0.3, "dark");
    for (let j = 0; j < 3; j++)
      ball(
        x + Math.sin(j * 2) * 2,
        0.3,
        z + Math.cos(j * 2) * 2,
        0.35,
        "yellow",
      );
  }
  for (let i = 0; i < 16; i++) {
    const a = i * 2.399,
      x = Math.cos(a) * (70 + i * 3),
      z = 35 + Math.sin(a) * 95,
      y = 18 + (i % 4) * 5;
    const cloud = new T.Group();
    root.add(cloud);
    cloud.position.set(x, y, z);
    for (let j = 0; j < 4; j++) {
      const b = ball(j * 2.1 - 3, Math.sin(j) * 0.6, 0, 2.1, "white", cloud);
      b.scale.set(1.5, 0.65, 1);
      b.castShadow = false;
    }
  }
  for (let i = 0; i < 7; i++) {
    const x = (i % 2 ? -1 : 1) * (45 + i * 3),
      z = i * 19 - 14;
    const hill = ball(x, -4, z, 15, ["pink", "purple", "blue"][i % 3]);
    hill.scale.set(1, 0.8, 1.6);
  }
  for (const o of hole.gadgets) {
    if (o.type === "bumper") {
      cyl(o.x, o.height / 2, o.z, o.r, o.height, "pink");
      cyl(o.x, 0.17, o.z, o.r + 0.18, 0.3, "purple");
      cyl(o.x, o.height - 0.12, o.z, o.r + 0.12, 0.25, "yellow");
      ball(o.x, o.height, o.z, o.r * 0.72, "yellow").scale.y = 0.35;
      for (let j = 0; j < 8; j++) {
        const a = (j * Math.PI) / 4;
        ball(
          o.x + Math.cos(a) * (o.r + 0.01),
          1.5,
          o.z + Math.sin(a) * (o.r + 0.01),
          0.12,
          "white",
        );
      }
    } else if (o.type === "wall") {
      box(o.x, o.y, o.z, o.w, o.h, o.d, "purple");
      const count = Math.max(1, Math.floor(o.w));
      for (let i = 0; i < count; i++)
        box(
          o.x - o.w / 2 + ((i + 0.5) * o.w) / count,
          o.y,
          o.z - 0.01,
          (o.w / count) * 0.48,
          o.h + 0.035,
          o.d + 0.04,
          i % 2 ? "pink" : "white",
        );
      box(
        o.x,
        o.y + o.h / 2 + 0.07,
        o.z,
        o.w + 0.3,
        0.16,
        o.d + 0.25,
        "yellow",
      );
    } else if (o.type === "mill") {
      // The open arch deliberately leaves the central flight window clear.
      for (const side of [-1, 1]) {
        box(o.x + side * 5.6, 2.6, o.z + 1, 1.1, 5.2, 1.1, "purple");
        ball(o.x + side * 5.6, 5.3, o.z + 1, 0.8, "yellow");
      }
      box(o.x, 6, o.z + 1, 12, 0.7, 0.8, "purple");
      label("SPIN CITY", o.x, 7.6, o.z, "#b35ba5", 0.65);
      const rotor = new T.Group();
      rotor.position.set(o.x, o.y, o.z);
      root.add(rotor);
      for (let b = 0; b < 4; b++) {
        const blade = new T.Group();
        rotor.add(blade);
        blade.rotation.z = (b * Math.PI) / 2;
        box(
          o.r / 2,
          0,
          0,
          o.r,
          o.width,
          o.depth,
          b % 2 ? "yellow" : "white",
          blade,
        );
        for (let k = 1; k < 5; k++)
          box(
            (k * o.r) / 5,
            0,
            -o.depth / 2 - 0.012,
            0.12,
            o.width,
            0.03,
            "pink",
            blade,
          );
      }
      ball(0, 0, 0, 0.6, "pink", rotor);
      animations.push((time) => (rotor.rotation.z = millAngle(o, time)));
    } else if (o.type === "fan") {
      const platform = box(o.x, 0.045, o.z, o.rx * 2, 0.04, o.rz * 2, "blue");
      for (let i = 0; i < 6; i++) {
        const arrow = new T.ArrowHelper(
          new T.Vector3(o.fx, 0, o.fz).normalize(),
          new T.Vector3(o.x, 0.11, o.z - o.rz + 2 + i * 2.7),
          2.3,
          0xffffff,
          0.7,
          0.6,
        );
        root.add(arrow);
      }
      const unit = new T.Group();
      unit.position.set(o.x - 6, 2.5, o.z);
      root.add(unit);
      ring(0, 0, 0, 1.8, 0.3, "blue", unit);
      cyl(o.x - 6, 1, o.z, 0.4, 2, "purple");
      const rotor = new T.Group();
      unit.add(rotor);
      for (let j = 0; j < 3; j++) {
        const b = box(0, 0.8, 0, 0.65, 1.5, 0.18, "white", rotor);
        b.rotation.z = (j * Math.PI * 2) / 3;
        b.position.set(
          Math.sin((-j * Math.PI * 2) / 3) * 0.8,
          Math.cos((j * Math.PI * 2) / 3) * 0.8,
          0,
        );
      }
      ball(0, 0, -0.15, 0.35, "yellow", unit);
      animations.push((time) => (rotor.rotation.z = time * 5));
      const motes = [];
      for (let j = 0; j < 16; j++)
        motes.push(ball(o.x, 1, o.z, 0.075, "white"));
      animations.push((time) =>
        motes.forEach((m, j) => {
          const t = (time * 0.3 + j / 16) % 1;
          m.position.set(
            o.x + (t - 0.5) * o.fx * 1.2,
            1 + (j % 4) * 0.7,
            o.z + (t - 0.5) * o.rz * 2,
          );
        }),
      );
      label("AIR MAIL", o.x - 6, 5, o.z, "#387bad", 0.55);
    } else if (o.type === "portal") {
      for (const [p, exit] of [
        [o, false],
        [o.exit, true],
      ]) {
        ring(p.x, p.y, p.z, o.r, 0.22, exit ? "blue" : "purple");
        ring(p.x, p.y, p.z - 0.02, o.r + 0.3, 0.08, "yellow");
        for (let j = 0; j < 8; j++) {
          const a = (j * Math.PI) / 4;
          ball(
            p.x + Math.cos(a) * (o.r + 0.3),
            p.y + Math.sin(a) * (o.r + 0.3),
            p.z,
            0.13,
            "white",
          );
        }
        cyl(p.x, 0.06, p.z, 2.4, 0.1, exit ? "blue" : "purple");
        label(
          exit ? "EXIT →" : "SHORTCUT →",
          p.x,
          p.y + 3,
          p.z,
          exit ? "#387bad" : "#8155bf",
          0.6,
        );
      }
    } else if (o.type === "pad") {
      cyl(o.x, 0.06, o.z, o.r, 0.12, "yellow");
      const rim = ring(o.x, 0.14, o.z, o.r, 0.12, "pink");
      rim.rotation.x = -Math.PI / 2;
      for (let j = 0; j < 3; j++) {
        const r = ring(o.x, 0.13, o.z, 0.55 + j * 0.5, 0.045, "white");
        r.rotation.x = -Math.PI / 2;
      }
      label("POP!", o.x, 1.1, o.z + 3, "#ac6b42", 0.45);
    }
  }
  root.userData.animate = (time) => animations.forEach((fn) => fn(time));
  return root;
}
