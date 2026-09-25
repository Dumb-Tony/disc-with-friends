import * as THREE from "../vendor/three.module.js";
import { trees } from "./course.js";
export function addCourse(scene, materials) {
  const add = (geo, mat, x, y, z) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
    return m;
  };
  const needles = new THREE.MeshStandardMaterial({
    color: "#365f38",
    roughness: 1,
    flatShading: true,
  });
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
        new THREE.ConeGeometry(
          t.width * (1 - tier * 0.155),
          t.height * 0.38,
          16,
        ),
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
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(8, 0, 19),
    new THREE.Vector3(9, 0, 34),
    new THREE.Vector3(0, 0, 55),
  ]);
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
  const green = add(new THREE.CircleGeometry(6, 64), fairway, 0, 0.006, 55);
  green.rotation.x = -Math.PI / 2;
  green.castShadow = false;
}
