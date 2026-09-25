import * as THREE from "../vendor/three.module.js";
// Decorative woodland outside the authored fairways. Flight geometry stays in course.js.
export function addWoodland(parent, materials, hole) {
  const scene = new THREE.Group();
  parent.add(scene);
  let seed = 87531;
  const r = () =>
    (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
  const dummy = new THREE.Object3D(),
    color = new THREE.Color(),
    count = 134;
  const trunks = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.38, 0.7, 1, 9),
    materials.bark,
    count,
  );
  const leaves = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 1),
    materials.needles,
    count * 9,
  );
  const sprays = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, 1),
    materials.leafSprays,
    count * 9 * 8,
  );
  const branches = new THREE.InstancedMesh(
    new THREE.CylinderGeometry(0.09, 0.24, 1, 6),
    materials.bark,
    count * 3,
  );
  const put = (mesh, i, x, y, z, sx, sy, sz, rz = 0) => {
    dummy.position.set(x, y, z);
    dummy.rotation.set(0, r() * 6.28, rz);
    dummy.scale.set(sx, sy, sz);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  };
  for (let i = 0; i < count; i++) {
    const side = i % 2 ? 1 : -1,
      x = i < 110 ? side * (36 + r() * 27) : (i - 122) * 5 + r() * 3,
      z =
        i < 110
          ? -28 + Math.floor(i / 2) * 4.6 + r() * 5
          : hole.pin.z + 40 + r() * 14,
      h = 18 + r() * 12;
    put(trunks, i, x, h * 0.45, z, 1, h * 0.9, 1);
    for (let j = 0; j < 3; j++) {
      const a = j * 2.1 + r(),
        start = new THREE.Vector3(x, h * (0.55 + j * 0.035), z),
        end = new THREE.Vector3(
          x + Math.sin(a) * 3,
          h * 0.86,
          z + Math.cos(a) * 3,
        ),
        delta = end.clone().sub(start);
      dummy.position.copy(start).add(end).multiplyScalar(0.5);
      dummy.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        delta.clone().normalize(),
      );
      dummy.scale.set(0.9, delta.length(), 0.9);
      dummy.updateMatrix();
      branches.setMatrixAt(i * 3 + j, dummy.matrix);
    }
    for (let j = 0; j < 9; j++) {
      const a = j * 2.4,
        rad = j ? 2 + r() * 2 : 0;
      put(
        leaves,
        i * 9 + j,
        x + Math.sin(a) * rad,
        h * (0.8 + r() * 0.18),
        z + Math.cos(a) * rad,
        3 + r() * 2,
        1.7 + r() * 1.3,
        3 + r() * 2,
      );
      color.setHSL(0.26 + r() * 0.07, 0.28 + r() * 0.22, 0.42 + r() * 0.12);
      leaves.setColorAt(i * 9 + j, color);
      const crown = dummy.position.clone(),
        span = dummy.scale.clone();
      for (let k = 0; k < 8; k++) {
        const theta = k * 2.4,
          yy = Math.sin(k * 1.7) * 0.7;
        put(
          sprays,
          (i * 9 + j) * 8 + k,
          crown.x + Math.cos(theta) * span.x * 0.82,
          crown.y + yy * span.y,
          crown.z + Math.sin(theta) * span.z * 0.82,
          2.2,
          2.2,
          2.2,
        );
        dummy.rotation.x = Math.sin(k) * 0.7;
        dummy.updateMatrix();
        sprays.setMatrixAt((i * 9 + j) * 8 + k, dummy.matrix);
      }
    }
  }
  sprays.castShadow = sprays.receiveShadow = true;
  scene.add(sprays);
  for (const m of [trunks, branches, leaves]) {
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
  }
  const shrub = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 0),
    materials.needles,
    450,
  );
  const petals = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({ color: "#c6a1bf", roughness: 0.9 }),
    150,
  );
  for (let i = 0; i < 450; i++) {
    const side = i % 2 ? 1 : -1,
      x = side * (31 + r() * 25),
      z = -15 + r() * 225,
      s = 0.3 + r() * 0.7;
    put(shrub, i, x, s * 0.4, z, s, s * 0.6, s);
    color.setHSL(0.23 + r() * 0.12, 0.35, 0.2 + r() * 0.15);
    shrub.setColorAt(i, color);
    if (i < 150) put(petals, i, x + 0.3, s * 0.6 + 0.2, z, 0.12, 0.08, 0.12);
  }
  shrub.castShadow = shrub.receiveShadow = true;
  scene.add(shrub, petals);
  // Soft artistic sun shafts. Depth testing lets foreground trees occlude them;
  // these are transparent light volumes, not ray-traced illumination.
  const shaftMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: {},
    vertexShader:
      "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader:
      "varying vec2 vUv;void main(){float edge=pow(sin(vUv.x*3.14159),3.);float end=smoothstep(0.,.22,vUv.y)*(1.-smoothstep(.7,1.,vUv.y));gl_FragColor=vec4(.95,.83,.48,edge*end*.023);}",
  });
  for (let i = 0; i < 10; i++) {
    const shaft = new THREE.Mesh(
      new THREE.PlaneGeometry(3 + (i % 3), 24),
      shaftMat,
    );
    shaft.position.set((i % 2 ? 1 : -1) * (24 + (i % 3) * 3), 11, 12 + i * 18);
    shaft.rotation.z = -0.55;
    scene.add(shaft);
  }
  return scene;
}
