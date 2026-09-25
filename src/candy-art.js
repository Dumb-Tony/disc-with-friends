import * as T from "../vendor/three.module.js";
// Original procedural confectionery textures: no external asset requests.
export function candyMaterials(colors) {
  const textures = [];
  function texture(draw, repeat = 1) {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const x = c.getContext("2d");
    draw(x);
    const t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.repeat.set(repeat, repeat);
    t.anisotropy = 4;
    textures.push(t);
    return t;
  }
  let seed = 173;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const sugar = texture((x) => {
    x.fillStyle = "#bbbbbb";
    x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 8500; i++) {
      const n = 125 + Math.floor(random() * 110);
      x.fillStyle = `rgb(${n},${n},${n})`;
      x.fillRect(
        random() * 256,
        random() * 256,
        1 + random() * 2,
        1 + random() * 2,
      );
    }
  }, 4);
  const stripes = texture((x) => {
    x.fillStyle = "#fff7ed";
    x.fillRect(0, 0, 256, 256);
    x.fillStyle = "#ed548c";
    for (let i = -256; i < 512; i += 64) {
      x.beginPath();
      x.moveTo(i, 0);
      x.lineTo(i + 30, 0);
      x.lineTo(i + 286, 256);
      x.lineTo(i + 256, 256);
      x.fill();
    }
  }, 2);
  stripes.colorSpace = T.SRGBColorSpace;
  const wafer = texture((x) => {
    x.fillStyle = "#c79361";
    x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 256; i += 32)
      for (let j = 0; j < 256; j += 32) {
        x.fillStyle = "#f2c894";
        x.fillRect(i + 2, j + 2, 28, 28);
        x.fillStyle = "#d6a76c";
        x.fillRect(i + 6, j + 6, 20, 20);
      }
  }, 3);
  wafer.colorSpace = T.SRGBColorSpace;
  const frosting = texture((x) => {
    x.fillStyle = "#f1eddd";
    x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 1600; i++) {
      x.fillStyle = i % 2 ? "#ffffff" : "#dbdfc8";
      x.beginPath();
      x.arc(random() * 256, random() * 256, random() * 2 + 0.5, 0, 7);
      x.fill();
    }
  }, 1);
  frosting.colorSpace = T.SRGBColorSpace;
  const swirl = texture((x) => {
    x.fillStyle = "#fff8ed";
    x.fillRect(0, 0, 256, 256);
    x.fillStyle = "#ee619b";
    for (let band = 0; band < 10; band++) {
      x.beginPath();
      for (let j = 0; j <= 80; j++) {
        const r = j * 1.7,
          a = (band * Math.PI) / 5 + r * 0.008;
        x.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r);
      }
      for (let j = 80; j >= 0; j--) {
        const r = j * 1.7,
          a = (band * Math.PI) / 5 + r * 0.008 + 0.3;
        x.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r);
      }
      x.fill();
    }
  }, 1);
  swirl.colorSpace = T.SRGBColorSpace;
  const shade = texture((x) => {
    const g = x.createRadialGradient(128, 128, 10, 128, 128, 125);
    g.addColorStop(0, "rgba(66,35,88,.38)");
    g.addColorStop(0.5, "rgba(66,35,88,.18)");
    g.addColorStop(1, "rgba(66,35,88,0)");
    x.fillStyle = g;
    x.fillRect(0, 0, 256, 256);
  });
  const mats = Object.fromEntries(
    Object.entries(colors).map(([key, color]) => [
      key,
      new T.MeshPhysicalMaterial({
        color,
        roughness: key === "green" || key === "mint" ? 0.82 : 0.27,
        metalness: 0,
        clearcoat: key === "green" || key === "mint" ? 0 : 1,
        clearcoatRoughness: 0.22,
        envMapIntensity: 0.7,
        bumpMap: sugar,
        bumpScale: key === "green" || key === "mint" ? 0.025 : 0.009,
      }),
    ]),
  );
  mats.green.color.set("#80bfa8");
  mats.mint.color.set("#b2eac6");
  mats.green.map = frosting;
  mats.mint.map = frosting;
  mats.swirl = new T.MeshPhysicalMaterial({
    map: swirl,
    roughness: 0.3,
    clearcoat: 1,
    side: T.DoubleSide,
  });
  mats.contact = new T.MeshBasicMaterial({
    map: shade,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
  });
  mats.cane = new T.MeshPhysicalMaterial({
    map: stripes,
    roughness: 0.25,
    clearcoat: 1,
    clearcoatRoughness: 0.16,
    bumpMap: sugar,
    bumpScale: 0.005,
  });
  mats.wafer = new T.MeshStandardMaterial({
    map: wafer,
    bumpMap: wafer,
    bumpScale: 0.055,
    roughness: 0.95,
  });
  mats.glow = new T.MeshStandardMaterial({
    color: "#fff2c0",
    emissive: "#ffbd63",
    emissiveIntensity: 3,
    roughness: 0.25,
  });
  mats.cloud = new T.MeshStandardMaterial({ color: "#fff4f2", roughness: 1 });
  return { mats, dispose: () => textures.forEach((t) => t.dispose()) };
}
export function candyScenery(root, mats, hole) {
  const mesh = (g, m, x, y, z) => {
    const o = new T.Mesh(g, m);
    o.position.set(x, y, z);
    o.castShadow = o.receiveShadow = true;
    root.add(o);
    return o;
  };
  const sphere = new T.SphereGeometry(1, 20, 12),
    rod = new T.CylinderGeometry(0.065, 0.065, 0.42, 6),
    dummy = new T.Object3D();
  const sprinkles = new T.InstancedMesh(
    rod,
    new T.MeshStandardMaterial({ roughness: 0.45 }),
    1000,
  );
  const palette = ["#ff86b7", "#fff2b1", "#9974eb", "#69d5ec", "#fff8f2"];
  for (let i = 0; i < 1000; i++) {
    const side = i % 2 ? -1 : 1,
      x = side * (19 + (Math.sin(i * 72.31) * 0.5 + 0.5) * 27),
      z = -12 + (i / 1000) * 145;
    dummy.position.set(x, 0.15, z);
    dummy.rotation.set(Math.PI / 2, Math.sin(i * 2) * 3, Math.sin(i) * 2);
    dummy.updateMatrix();
    sprinkles.setMatrixAt(i, dummy.matrix);
    sprinkles.setColorAt(i, new T.Color(palette[i % 5]));
  }
  sprinkles.receiveShadow = true;
  root.add(sprinkles);
  // Oversized candy canes and stacked wafer biscuits live beyond the playable lane.
  for (let i = 0; i < 14; i++) {
    const side = i % 2 ? -1 : 1,
      x = side * (24 + (i % 3) * 3),
      z = 7 + i * 8;
    const points = [];
    for (let j = 0; j <= 8; j++) points.push(new T.Vector3(0, j * 0.65, 0));
    for (let j = 1; j <= 18; j++) {
      const a = (j * Math.PI) / 18;
      points.push(
        new T.Vector3(1.1 * (1 - Math.cos(a)), 5.2 + Math.sin(a) * 1.1, 0),
      );
    }
    mesh(
      new T.TubeGeometry(new T.CatmullRomCurve3(points), 48, 0.32, 10, false),
      mats.cane,
      x,
      0,
      z,
    );
    const biscuit = mesh(
      new T.BoxGeometry(3, 0.7, 2.5),
      mats.wafer,
      x + side * 3,
      0.5,
      z + 2,
    );
    biscuit.rotation.y = i * 0.4;
    const icing = mesh(
      new T.BoxGeometry(3, 0.22, 2.5),
      mats.white,
      x + side * 3,
      0.91,
      z + 2,
    );
    icing.rotation.y = i * 0.4;
    const gum = mesh(
      sphere,
      mats[["pink", "purple", "blue"][i % 3]],
      x - side * 2,
      0.7,
      z + 3,
    );
    gum.scale.set(1.1, 0.8, 1.1);
  }
  for (let i = 0; i < 9; i++) {
    const x = (i % 2 ? -1 : 1) * (21 + (i % 3) * 2),
      z = 10 + i * 12;
    const shadow = mesh(new T.PlaneGeometry(7, 7), mats.contact, x, 0.012, z);
    shadow.rotation.x = -Math.PI / 2;
    shadow.castShadow = shadow.receiveShadow = false;
    mesh(new T.CylinderGeometry(0.2, 0.2, 4.8, 12), mats.white, x, 2.4, z);
    const sweet = mesh(sphere, mats.white, x, 5.2, z);
    sweet.scale.set(2.3, 2.3, 0.4);
    mesh(new T.CircleGeometry(2.22, 48), mats.swirl, x, 5.2, z - 0.41);
  }
  for (const o of hole.gadgets.filter((o) => o.type === "bumper")) {
    const shadow = mesh(
      new T.PlaneGeometry(o.r * 5, o.r * 5),
      mats.contact,
      o.x,
      0.08,
      o.z,
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.castShadow = shadow.receiveShadow = false;
  }
  // Warm bulb garlands decorate the frame, leaving flight paths clear.
  for (const o of hole.gadgets.filter((o) => o.type === "mill"))
    for (let i = 0; i < 13; i++) {
      const bulb = mesh(
        sphere,
        mats.glow,
        o.x - 5.5 + (i * 11) / 12,
        6.45,
        o.z + 0.55,
      );
      bulb.scale.setScalar(0.12);
    }
  const tint = new T.Color("#efb8ec");
  const sky = new T.Mesh(
    new T.SphereGeometry(330, 24, 16),
    new T.ShaderMaterial({
      side: T.BackSide,
      depthWrite: false,
      uniforms: {
        top: { value: new T.Color("#99cce9") },
        bottom: { value: tint },
      },
      vertexShader:
        "varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
      fragmentShader:
        "varying vec3 p;uniform vec3 top;uniform vec3 bottom;void main(){float h=smoothstep(-.05,.65,normalize(p).y);gl_FragColor=vec4(mix(bottom,top,h),1.); #include <tonemapping_fragment>\n#include <colorspace_fragment>}".replace(
          "; #include",
          ";\n#include",
        ),
    }),
  );
  root.add(sky);
  const fill = new T.DirectionalLight("#ffc3e6", 1.1);
  fill.position.set(35, 20, 50);
  root.add(fill);
  for (const o of hole.gadgets.filter((o) => o.type === "portal")) {
    const light = new T.PointLight("#c895ff", 16, 7, 2);
    light.position.set(o.x, 2, o.z - 1);
    root.add(light);
  }
}
