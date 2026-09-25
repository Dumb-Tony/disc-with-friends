import { surfaceMaterials } from "./surfaces.js";
import { basketShape, chainLayout } from "./basket-shape.js";
import * as THREE from "../vendor/three.module.js";

// Seeded decoration never shares state with flight physics.
function random(seed = 731) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
function texture(size, paint, { repeat = 1, color = true } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  paint(canvas.getContext("2d"), size, random());
  const map = new THREE.CanvasTexture(canvas);
  if (color) map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.setScalar(repeat);
  map.anisotropy = 8;
  return map;
}
function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
  const object = new THREE.Mesh(geometry, material);
  object.position.set(x, y, z);
  object.castShadow = true;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}
function ring(parent, radius, tube, y, material) {
  const object = mesh(
    parent,
    new THREE.TorusGeometry(radius, tube, 8, 64),
    material,
    0,
    y,
  );
  object.rotation.x = Math.PI / 2;
  return object;
}
function rod(parent, a, b, radius, material) {
  const delta = b.clone().sub(a),
    object = mesh(
      parent,
      new THREE.CylinderGeometry(radius, radius, delta.length(), 6),
      material,
    );
  object.position.copy(a).add(b).multiplyScalar(0.5);
  object.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    delta.normalize(),
  );
  return object;
}

export function createMaterials() {
  const grass = texture(
    512,
    (ctx, s, r) => {
      ctx.fillStyle = "#527b45";
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 25000; i++) {
        const x = r() * s,
          y = r() * s;
        ctx.strokeStyle = [
          "#729548",
          "#506f36",
          "#87a452",
          "#668544",
          "#a5ad65",
        ][i % 5];
        ctx.globalAlpha = 0.2 + r() * 0.5;
        ctx.lineWidth = 0.5 + r();
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 2 + r() * 4, y + 2 + r() * 7);
        ctx.stroke();
      }
    },
    { repeat: 180 },
  );
  const grain = texture(
    256,
    (ctx, s, r) => {
      ctx.fillStyle = "#999";
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 12000; i++) {
        ctx.fillStyle = r() > 0.5 ? "#aaa" : "#888";
        ctx.fillRect(r() * s, r() * s, 1, 1);
      }
    },
    { color: false },
  );
  const bark = texture(256, (ctx, s, r) => {
    ctx.fillStyle = "#685744";
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 340; i++) {
      ctx.strokeStyle = i % 2 ? "#493d30" : "#8b7760";
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1 + r() * 4;
      const x = r() * s,
        y = r() * s;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + r() * 6 - 3, y + 15 + r() * 100);
      ctx.stroke();
    }
  });
  return {
    ...surfaceMaterials(),
    grass: new THREE.MeshStandardMaterial({
      map: grass,
      color: "#83a78a",
      roughness: 1,
      bumpMap: grass,
      bumpScale: 0.07,
    }),
    cream: new THREE.MeshStandardMaterial({
      color: "#f6ebbf",
      roughness: 0.65,
    }),
    line: new THREE.MeshBasicMaterial({
      color: "#e5e1b9",
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    }),
    metal: new THREE.MeshStandardMaterial({
      color: "#c9d2d5",
      metalness: 0.9,
      roughness: 0.28,
      bumpMap: grain,
      bumpScale: 0.00035,
    }),
    darkMetal: new THREE.MeshStandardMaterial({
      color: "#424e4d",
      metalness: 0.8,
      roughness: 0.42,
    }),
    gold: new THREE.MeshPhysicalMaterial({
      color: "#e9b731",
      metalness: 0.35,
      roughness: 0.32,
      clearcoat: 0.55,
    }),
    disc: new THREE.MeshPhysicalMaterial({
      color: "#ee612e",
      metalness: 0,
      roughness: 0.29,
      clearcoat: 0.85,
      clearcoatRoughness: 0.2,
      bumpMap: grain,
      bumpScale: 0.0003,
    }),
    bark: new THREE.MeshStandardMaterial({
      map: bark,
      roughness: 0.94,
      bumpMap: bark,
      bumpScale: 0.08,
    }),
  };
}

export function addLighting(scene, renderer) {
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  scene.fog = new THREE.FogExp2("#86b8a5", 0.006);
  scene.add(new THREE.HemisphereLight(0xc8e2ff, 0x52613a, 0.65));
  const sun = new THREE.DirectionalLight(0xffdda6, 3.1);
  sun.position.set(-48, 40, -32);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -43,
    right: 43,
    top: 43,
    bottom: -43,
    near: 1,
    far: 170,
  });
  sun.shadow.normalBias = 0.025;
  sun.shadow.bias = -0.00012;
  sun.shadow.radius = 2;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xc9ddff, 0.35);
  fill.position.set(40, 20, 50);
  scene.add(fill);
  const faces = [];
  for (let face = 0; face < 6; face++) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d");
    const gradient = ctx.createLinearGradient(0, 0, 0, 128);
    gradient.addColorStop(0, face === 3 ? "#495532" : "#b4d8ed");
    gradient.addColorStop(0.5, "#f5f0d8");
    gradient.addColorStop(0.55, "#7f9860");
    gradient.addColorStop(1, "#394b2a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    if (face === 0 || face === 2) {
      ctx.fillStyle = "#fff9e8";
      ctx.fillRect(30, 12, 35, 25);
    }
    faces.push(canvas);
  }
  const env = new THREE.CubeTexture(faces);
  env.colorSpace = THREE.SRGBColorSpace;
  env.needsUpdate = true;
  const pmrem = new THREE.PMREMGenerator(renderer),
    environment = pmrem.fromCubemap(env);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.6;
  pmrem.dispose();
  env.dispose();
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(350, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader:
        "varying vec3 direction; void main(){direction=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader:
        "varying vec3 direction; void main(){vec3 d=normalize(direction);float h=max(d.y,0.);vec3 col=mix(vec3(.67,.73,.64),vec3(.10,.32,.56),pow(h,.55));float glow=pow(max(dot(d,normalize(vec3(-.68,.57,-.46))),0.),70.);col+=vec3(.55,.33,.10)*glow;gl_FragColor=vec4(col,1.); #include <tonemapping_fragment>\n #include <colorspace_fragment>\n}",
    }),
  );
  sky.material.fragmentShader = sky.material.fragmentShader.replace(
    "; #include",
    ";\n#include",
  );
  scene.add(sky);
  return sun;
}

export function createDisc(
  materials,
  definition = { name: "Fieldwork", type: "Midrange", color: "#ee612e" },
) {
  materials.disc.color.set(definition.color);
  const disc = new THREE.Group(),
    spin = new THREE.Group();
  disc.add(spin);
  disc.scale.setScalar(basketShape.discRadius / 0.3);
  // Actual flight plate, rounded nose and undercut rim instead of a solid puck.
  const profile = [
    [0, 0.026],
    [0.15, 0.026],
    [0.22, 0.026],
    [0.255, 0.022],
    [0.282, 0.012],
    [0.297, 0],
    [0.3, -0.012],
    [0.297, -0.025],
    [0.287, -0.035],
    [0.271, -0.036],
    [0.266, -0.027],
    [0.27, -0.017],
    [0.255, -0.006],
    [0.19, 0.003],
    [0, 0.006],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  mesh(spin, new THREE.LatheGeometry(profile.reverse(), 96), materials.disc);
  ring(spin, 0.283, 0.003, -0.028, materials.disc);
  const underside = new THREE.MeshStandardMaterial({
    color: "#c44720",
    roughness: 0.5,
  });
  ring(spin, 0.225, 0.0015, 0.001, underside);
  ring(spin, 0.213, 0.0015, 0.001, underside);
  const stamp = texture(1024, (ctx, s) => {
    ctx.clearRect(0, 0, s, s);
    ctx.translate(s / 2, s / 2);
    ctx.strokeStyle = "#ffe4a2";
    ctx.fillStyle = "#ffe4a2";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(0, 0, 420, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 394, 0, Math.PI * 2);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.font = "800 83px Segoe UI";
    ctx.fillText(definition.name.toUpperCase(), 0, -165);
    ctx.font = "600 33px Segoe UI";
    ctx.fillText("DISC WITH FRIENDS", 0, -105);
    ctx.beginPath();
    ctx.moveTo(-210, 123);
    ctx.lineTo(-70, -43);
    ctx.lineTo(18, 65);
    ctx.lineTo(110, -16);
    ctx.lineTo(216, 123);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#873e29";
    ctx.font = "800 72px Segoe UI";
    ctx.fillText("01", 0, 122);
    ctx.fillStyle = "#ffe4a2";
    ctx.font = "600 30px Segoe UI";
    ctx.fillText(definition.type.toUpperCase() + " • SUNNY PINES", 0, 251);
    for (let i = 0; i < 36; i++) {
      const a = (i / 36) * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * 452, Math.sin(a) * 452, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  const decal = mesh(
    spin,
    new THREE.CircleGeometry(0.218, 96),
    new THREE.MeshPhysicalMaterial({
      map: stamp,
      transparent: true,
      roughness: 0.4,
      metalness: 0.15,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    }),
    0,
    0.0266,
  );
  decal.rotation.x = -Math.PI / 2;
  decal.rotation.z = Math.PI;
  decal.castShadow = false;
  return disc;
}

export function createBasket(materials, number = 1) {
  const group = new THREE.Group(),
    chains = [];
  const steel = materials.metal;
  mesh(
    group,
    new THREE.CylinderGeometry(
      basketShape.postRadius,
      basketShape.postRadius,
      basketShape.postTop,
      20,
    ),
    steel,
    0,
    1.09,
  );
  mesh(
    group,
    new THREE.CylinderGeometry(0.12, 0.15, 0.09, 24),
    materials.darkMetal,
    0,
    0.045,
  );
  for (const height of [basketShape.lowerRimY, basketShape.upperRimY])
    ring(group, basketShape.trayRadius, basketShape.rimTube, height, steel);
  ring(group, 0.36, 0.012, 0.735, steel);
  ring(group, 0.16, 0.015, 0.735, steel);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2,
      s = Math.sin(a),
      c = Math.cos(a);
    rod(
      group,
      new THREE.Vector3(s * 0.38, 0.72, c * 0.38),
      new THREE.Vector3(s * 0.64, 1.01, c * 0.64),
      0.009,
      steel,
    );
    rod(
      group,
      new THREE.Vector3(0, 0.72, 0),
      new THREE.Vector3(s * 0.38, 0.72, c * 0.38),
      0.009,
      steel,
    );
  }
  // Powder-coated annular band: open below, with a shallow rain cap above.
  const bandProfile = [
    [0.535, 1.91],
    [0.585, 1.91],
    [0.595, 1.93],
    [0.595, 2.065],
    [0.584, 2.083],
    [0.535, 2.083],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  mesh(group, new THREE.LatheGeometry(bandProfile, 72), materials.gold);
  mesh(
    group,
    new THREE.CylinderGeometry(0.581, 0.581, 0.02, 72),
    materials.gold,
    0,
    2.078,
  );
  ring(group, 0.589, 0.009, 1.922, materials.darkMetal);
  ring(group, 0.578, 0.008, 2.085, materials.gold);
  // Four readable number plates around the band.
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const sign = texture(256, (ctx, s) => {
      ctx.fillStyle = "#243c33";
      ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = "#f5d876";
      ctx.font = "800 175px Segoe UI";
      ctx.textAlign = "center";
      ctx.fillText(String(number).padStart(2, "0"), s / 2, 190);
    });
    const plate = mesh(
      group,
      new THREE.PlaneGeometry(0.135, 0.105),
      new THREE.MeshStandardMaterial({ map: sign, roughness: 0.55 }),
      Math.sin(a) * 0.598,
      2.005,
      Math.cos(a) * 0.598,
    );
    plate.rotation.y = a;
    mesh(
      group,
      new THREE.SphereGeometry(0.012, 8, 6),
      steel,
      Math.sin(a + 0.16) * 0.598,
      2.0,
      Math.cos(a + 0.16) * 0.598,
    );
  }
  const linkGeometry = new THREE.TorusGeometry(0.019, 0.0048, 5, 10);
  linkGeometry.scale(1, 1.65, 1);
  for (const layout of chainLayout) {
    const a = layout.angle,
      r = layout.radius;
    const chain = new THREE.InstancedMesh(linkGeometry, steel, 17);
    chain.castShadow = true;
    chain.receiveShadow = true;
    chain.position.set(Math.sin(a) * r, 1.915, Math.cos(a) * r);
    chain.userData.layout = layout;
    const dummy = new THREE.Object3D();
    for (let j = 0; j < 17; j++) {
      const t = j / 16,
        radial = (0.14 - r) * t;
      dummy.position.set(
        Math.sin(a) * radial,
        -0.035 - t * 0.88,
        Math.cos(a) * radial,
      );
      dummy.rotation.set(
        Math.cos(a) * 0.26,
        a + ((j % 2) * Math.PI) / 2,
        -Math.sin(a) * 0.26,
      );
      dummy.updateMatrix();
      chain.setMatrixAt(j, dummy.matrix);
    }
    group.add(chain);
    chains.push(chain);
  }
  ring(group, 0.15, 0.015, 0.995, steel);
  mesh(
    group,
    new THREE.CylinderGeometry(0.018, 0.018, 0.48, 10),
    steel,
    0,
    2.32,
  );
  const flagMap = texture(256, (ctx, s) => {
    ctx.fillStyle = "#eabe4a";
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = "#294735";
    ctx.font = "900 130px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText(String(number).padStart(2, "0"), 128, 175);
  });
  const flagGeo = new THREE.PlaneGeometry(0.5, 0.28, 10, 2),
    pos = flagGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + 0.25;
    pos.setZ(i, Math.sin(x * 13) * x * 0.18);
  }
  flagGeo.computeVertexNormals();
  const flag = mesh(
    group,
    flagGeo,
    new THREE.MeshStandardMaterial({
      map: flagMap,
      roughness: 0.9,
      side: THREE.FrontSide,
    }),
    0.25,
    2.43,
  );
  const reverseFlag = flagGeo.clone(),
    uv = reverseFlag.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
  mesh(
    group,
    reverseFlag,
    new THREE.MeshStandardMaterial({
      map: flagMap,
      roughness: 0.9,
      side: THREE.BackSide,
    }),
    0.25,
    2.43,
  );
  return { group, chains, flag };
}

export function addLandscape(scene, materials) {
  const r = random(514),
    dummy = new THREE.Object3D();
  mesh(
    scene,
    new THREE.PlaneGeometry(1000, 1000),
    materials.grass,
    0,
    -0.03,
  ).rotation.x = -Math.PI / 2;
  // Gentle mowing bands, visible at distance while the fine texture handles closeups.
  for (let z = -20; z < 208; z += 16) {
    const band = mesh(
      scene,
      new THREE.PlaneGeometry(68, 8),
      new THREE.MeshBasicMaterial({
        color: "#e0d68e",
        transparent: true,
        opacity: 0.035,
        depthWrite: false,
      }),
      0,
      -0.023,
      z,
    );
    band.rotation.x = -Math.PI / 2;
    band.castShadow = false;
  }
  const turf = texture(
    128,
    (ctx, s, rand) => {
      ctx.fillStyle = "#586b48";
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 4000; i++) {
        ctx.fillStyle = i % 2 ? "#657853" : "#435b3b";
        ctx.fillRect(rand() * s, rand() * s, 1, 3);
      }
    },
    { repeat: 5 },
  );
  const tee = mesh(
    scene,
    new THREE.BoxGeometry(3, 0.09, 4),
    new THREE.MeshStandardMaterial({ map: turf, roughness: 1 }),
    0,
    0,
    -1.3,
  );
  for (const x of [-1.55, 1.55])
    mesh(
      scene,
      new THREE.BoxGeometry(0.1, 0.13, 4.15),
      materials.bark,
      x,
      0.01,
      -1.3,
    );
  for (const z of [-3.36, 0.76])
    mesh(
      scene,
      new THREE.BoxGeometry(3.2, 0.13, 0.1),
      materials.bark,
      0,
      0.01,
      z,
    );

  const grassGeometry = new THREE.BufferGeometry();
  grassGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [
        -0.023, 0, 0, 0.023, 0, 0, 0.007, 0.15, 0.018, 0, 0, -0.02, 0, 0, 0.02,
        -0.018, 0.11, 0.006,
      ],
      3,
    ),
  );
  grassGeometry.computeVertexNormals();
  const blades = new THREE.InstancedMesh(
    grassGeometry,
    new THREE.MeshStandardMaterial({
      color: "#ffffff",
      roughness: 1,
      side: THREE.DoubleSide,
    }),
    15000,
  );
  const color = new THREE.Color();
  for (let i = 0; i < 15000; i++) {
    let x = (r() - 0.5) * 120,
      z = -20 + r() * 220;
    if (Math.abs(x) < 25) {
      if (i % 3 !== 0) x += Math.sign(x || 1) * 30;
    }
    if (Math.abs(x) < 1.8 && z < 1 && z > -3.7) x += 4;
    dummy.position.set(x, 0, z);
    dummy.rotation.y = r() * Math.PI;
    const scale = 0.3 + r() * 0.85;
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    blades.setMatrixAt(i, dummy.matrix);
    color.setHSL(0.2 + r() * 0.035, 0.28 + r() * 0.15, 0.32 + r() * 0.1);
    color.convertSRGBToLinear();
    blades.setColorAt(i, color);
  }
  blades.name = "fieldGrass";
  blades.userData.originalMatrices = blades.instanceMatrix.array.slice();
  blades.receiveShadow = true;
  scene.add(blades);

  return { tee, blades };
}

export function contactShadow() {
  const map = texture(128, (ctx, s) => {
    const grad = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grad.addColorStop(0, "rgba(17,35,24,.65)");
    grad.addColorStop(0.35, "rgba(17,35,24,.4)");
    grad.addColorStop(1, "rgba(17,35,24,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
  });
  return new THREE.Mesh(
    new THREE.PlaneGeometry(1.25, 1.25),
    new THREE.MeshBasicMaterial({
      map,
      transparent: true,
      depthWrite: false,
      opacity: 0.5,
    }),
  );
}
