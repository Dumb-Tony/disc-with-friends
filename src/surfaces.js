import * as THREE from "../vendor/three.module.js";
function map(paint, repeat = 1, color = true) {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  let seed = 3187;
  const r = () =>
    (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
  paint(c.getContext("2d"), r);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.setScalar(repeat);
  t.anisotropy = 8;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export function surfaceMaterials() {
  const needles = map((c, r) => {
    c.fillStyle = "#4b6840";
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 18000; i++) {
      let x = r() * 512,
        y = r() * 512;
      c.strokeStyle = ["#273e2d", "#658150", "#8c995d", "#3b5836"][i % 4];
      c.lineWidth = 0.5 + r();
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + (r() - 0.5) * 16, y + 4 + r() * 15);
      c.stroke();
    }
  }, 3);
  const stone = map((c, r) => {
    c.fillStyle = "#92978c";
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 19000; i++) {
      c.fillStyle = ["#5c625b", "#c7c3ad", "#838973", "#a8ac9c"][i % 4];
      c.globalAlpha = 0.25 + r() * 0.4;
      const s = 0.5 + r() * 4;
      c.fillRect(r() * 512, r() * 512, s, s);
    }
    for (let i = 0; i < 30; i++) {
      c.strokeStyle = "#535d52";
      c.globalAlpha = 0.2;
      c.beginPath();
      let x = r() * 512,
        y = r() * 512;
      c.moveTo(x, y);
      for (let j = 0; j < 5; j++) {
        x += r() * 35;
        y += r() * 20 - 10;
        c.lineTo(x, y);
      }
      c.stroke();
    }
  }, 2);
  const sand = map((c, r) => {
    c.fillStyle = "#af9c6b";
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 23000; i++) {
      c.fillStyle = i % 2 ? "#d4c693" : "#796b4d";
      c.globalAlpha = 0.4;
      c.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2);
    }
  }, 5);
  const waves = map(
    (c) => {
      const data = c.createImageData(512, 512);
      for (let y = 0; y < 512; y++)
        for (let x = 0; x < 512; x++) {
          const a = (x / 512) * Math.PI * 2,
            b = (y / 512) * Math.PI * 2,
            i = (y * 512 + x) * 4;
          data.data[i] =
            128 + 32 * Math.cos(a * 8 + b * 3) + 12 * Math.cos(a * 17 - b * 7);
          data.data[i + 1] = 128 + 24 * Math.sin(b * 9 + a * 2);
          data.data[i + 2] = 244;
          data.data[i + 3] = 255;
        }
      c.putImageData(data, 0, 0);
    },
    5,
    false,
  );
  const leafTexture = map((c, r) => {
    c.clearRect(0, 0, 512, 512);
    for (let i = 0; i < 28; i++) {
      c.save();
      c.translate(r() * 512, r() * 512);
      c.rotate(r() * 6.28);
      const size = 22 + r() * 26;
      c.fillStyle = ["#406b3b", "#678645", "#315331", "#849a55"][i % 4];
      c.beginPath();
      c.moveTo(0, -size);
      c.quadraticCurveTo(size * 0.75, -size * 0.2, 0, size);
      c.quadraticCurveTo(-size * 0.75, size * 0.2, 0, -size);
      c.fill();
      c.strokeStyle = "#ced297";
      c.lineWidth = 0.8;
      c.beginPath();
      c.moveTo(0, -size * 0.7);
      c.lineTo(0, size * 0.8);
      c.stroke();
      c.restore();
    }
  });
  return {
    mud: new THREE.MeshStandardMaterial({
      map: sand,
      color: "#85896a",
      roughness: 1,
    }),
    leafSprays: new THREE.MeshStandardMaterial({
      map: leafTexture,
      alphaTest: 0.45,
      side: THREE.DoubleSide,
      roughness: 1,
    }),
    bank: new THREE.MeshStandardMaterial({
      map: sand,
      color: "#65704c",
      roughness: 1,
    }),
    reeds: new THREE.MeshStandardMaterial({
      color: "#6c8750",
      side: THREE.DoubleSide,
      roughness: 1,
    }),
    needles: new THREE.MeshStandardMaterial({
      map: needles,
      color: "#aab694",
      bumpMap: needles,
      bumpScale: 0.12,
      roughness: 0.96,
    }),
    stone: new THREE.MeshStandardMaterial({
      map: stone,
      bumpMap: stone,
      bumpScale: 0.15,
      roughness: 0.88,
    }),
    shore: new THREE.MeshStandardMaterial({
      map: sand,
      bumpMap: sand,
      bumpScale: 0.035,
      roughness: 1,
    }),
    water: new THREE.MeshPhysicalMaterial({
      color: "#155858",
      normalMap: waves,
      normalScale: new THREE.Vector2(0.18, 0.18),
      roughness: 0.27,
      metalness: 0.22,
      clearcoat: 0.55,
      clearcoatRoughness: 0.12,
      envMapIntensity: 0.35,
    }),
  };
}
