import * as THREE from "../vendor/three.module.js";
import { hole as openingHole } from "./course.js";
export function addCourse(parent, materials, hole = openingHole) {
  const scene = new THREE.Group();
  parent.add(scene);
  const trees = hole.trees;
  const add = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
    return m;
  };
  const needles = materials.needles;
  const bough = (radius, height) => {
    const geo = new THREE.ConeGeometry(radius, height, 24, 8),
      p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i),
        z = p.getZ(i),
        a = Math.atan2(z, x);
      const f = 0.93 + 0.07 * Math.sin(a * 9 + y * 7);
      p.setXYZ(i, x * f, y, z * f);
    }
    geo.computeVertexNormals();
    return geo;
  };
  for (const t of trees) {
    add(
      new THREE.CylinderGeometry(
        t.trunkRadius,
        t.trunkRadius,
        t.height * 0.58,
        12,
      ),
      materials.bark,
      t.x,
      t.height * 0.29,
      t.z,
    );
    for (let tier = 0; tier < 5; tier++) {
      add(
        bough(t.width * (1 - tier * 0.155), t.height * 0.38),
        needles,
        t.x,
        t.height * (0.35 + tier * 0.135),
        t.z,
      );
    }
  }
  // A broad mown flank suggests a lay-up; the narrow central gate remains open.
  const fairway = new THREE.MeshStandardMaterial({
    color: "#91a65c",
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
    roughness: 1,
  });
  const path = new THREE.CatmullRomCurve3(
    hole.route.map(([x, z]) => new THREE.Vector3(x, 0, z)),
  );
  const vertices = [],
    indices = [];
  for (let i = 0; i <= 80; i++) {
    const p = path.getPoint(i / 80),
      d = path.getTangent(i / 80),
      w = i > 65 ? 6 : 4.5;
    vertices.push(
      p.x - d.z * w,
      0.004,
      p.z + d.x * w,
      p.x + d.z * w,
      0.004,
      p.z - d.x * w,
    );
    if (i < 80) {
      const j = i * 2;
      indices.push(j, j + 2, j + 1, j + 1, j + 2, j + 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, fairway);
  m.receiveShadow = true;
  scene.add(m);
  const green = add(
    new THREE.CircleGeometry(6, 64),
    fairway,
    hole.pin.x,
    0.006,
    hole.pin.z,
  );
  green.rotation.x = -Math.PI / 2;
  green.castShadow = false;
  const water = materials.water,
    shore = materials.shore;
  for (const w of hole.water) {
    for (const [mat, extra, y] of [
      [shore, 0.55, 0.008],
      [water, 0, 0.025],
    ]) {
      const m = add(new THREE.CircleGeometry(1, 48), mat, w.x, y, w.z);
      m.rotation.x = -Math.PI / 2;
      m.scale.set(w.rx + extra, w.rz + extra, 1);
      m.castShadow = false;
    }
  }
  const stone = materials.stone;
  for (const r of hole.rocks) {
    const m = add(new THREE.SphereGeometry(1, 16, 10), stone, r.x, 0, r.z);
    m.scale.set(r.radius, r.height, r.radius);
  }
  const drops = new Map(
    hole.water.map((w) => [JSON.stringify(w.drop), w.drop]),
  );
  for (const d of drops.values()) {
    const m = add(
      new THREE.RingGeometry(0.65, 0.85, 32),
      shore,
      d.x,
      0.035,
      d.z,
    );
    m.rotation.x = -Math.PI / 2;
    m.castShadow = false;
    const post = add(
      new THREE.CylinderGeometry(0.07, 0.07, 0.7, 8),
      materials.bark,
      d.x + 1,
      0.35,
      d.z,
    );
    add(
      new THREE.BoxGeometry(0.45, 0.3, 0.06),
      shore,
      post.position.x,
      0.68,
      d.z,
    );
  }
  return scene;
}
