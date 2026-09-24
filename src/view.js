import * as THREE from "../vendor/three.module.js";
import { basket } from "./config.js";
const v = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export class FieldView {
  constructor(canvas) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color("#b8d9d2");
    this.scene.fog = new THREE.Fog("#b8d9d2", 105, 240);
    this.camera = new THREE.PerspectiveCamera(
      58,
      innerWidth / innerHeight,
      0.05,
      400,
    );
    this.camera.position.set(0, 3, -5);
    this.look = v(0, 1.5, 15);
    this.scene.add(new THREE.HemisphereLight(0xe9f4dc, 0x486c48, 2.5));
    const sun = new THREE.DirectionalLight(0xffedc6, 3);
    sun.position.set(-30, 65, -20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -70,
      right: 70,
      top: 110,
      bottom: -30,
      far: 180,
    });
    sun.shadow.bias = -0.0004;
    this.scene.add(sun);
    const mat = (color, roughness = 0.85) =>
      new THREE.MeshStandardMaterial({ color, roughness });
    this.mats = {
      grass: mat("#71946b"),
      line: mat("#adc494"),
      cream: mat("#eee7bc"),
      metal: mat("#b5c8be", 0.4),
      gold: mat("#f2ca65", 0.45),
      disc: mat("#ff9558", 0.38),
    };
    this.mesh(
      new THREE.PlaneGeometry(1000, 1000),
      this.mats.grass,
      0,
      -0.03,
      0,
    ).rotation.x = -Math.PI / 2;
    for (let z = 10; z <= 120; z += 10) {
      const line = this.mesh(
        new THREE.PlaneGeometry(52, 0.065),
        this.mats.line,
        0,
        0.002,
        z,
      );
      line.rotation.x = -Math.PI / 2;
      this.label(`${z} m`, -28, 0.15, z);
    }
    const tee = this.mesh(
      new THREE.BoxGeometry(3, 0.08, 4),
      mat("#cabf9c"),
      0,
      0,
      -1.3,
    );
    tee.receiveShadow = true;
    for (const x of [-1.2, 1.2])
      this.mesh(
        new THREE.BoxGeometry(0.08, 0.02, 3.4),
        this.mats.cream,
        x,
        0.052,
        -1.3,
      );
    // Distant simple silhouettes establish scale without adding obstacles or level art.
    for (let i = 0; i < 36; i++) {
      let x = i % 2 ? 52 + (i % 5) * 5 : -52 - (i % 4) * 6,
        z = -20 + Math.floor(i / 2) * 11;
      this.mesh(
        new THREE.CylinderGeometry(0.3, 0.45, 3, 7),
        mat("#6b7860"),
        x,
        1.5,
        z,
      );
      this.mesh(
        new THREE.ConeGeometry(2.6, 7 + (i % 3), 7),
        mat(i % 2 ? "#527d63" : "#638768"),
        x,
        6,
        z,
      );
    }
    this.basket = new THREE.Group();
    this.basket.position.set(basket.x, 0, basket.z);
    this.scene.add(this.basket);
    const add = (geo, material, x, y, z) => {
      const m = new THREE.Mesh(geo, material);
      m.position.set(x, y, z);
      m.castShadow = true;
      this.basket.add(m);
      return m;
    };
    add(
      new THREE.CylinderGeometry(0.06, 0.06, 2.1, 12),
      this.mats.metal,
      0,
      1.05,
      0,
    );
    for (const y of [0.7, 1, 1.95]) {
      const ring = add(
        new THREE.TorusGeometry(y === 1.95 ? 0.56 : 0.65, 0.035, 6, 32),
        y === 1.95 ? this.mats.gold : this.mats.metal,
        0,
        y,
        0,
      );
      ring.rotation.x = Math.PI / 2;
    }
    add(
      new THREE.CylinderGeometry(0.59, 0.59, 0.16, 32),
      this.mats.gold,
      0,
      1.99,
      0,
    );
    this.chains = [];
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2,
        x = Math.sin(a),
        z = Math.cos(a);
      const points = [v(x * 0.49, 1.91, z * 0.49), v(x * 0.19, 1.02, z * 0.19)];
      const chain = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(points),
        new THREE.LineBasicMaterial({ color: 0xe9eee1 }),
      );
      this.basket.add(chain);
      this.chains.push(chain);
      add(
        new THREE.CylinderGeometry(0.014, 0.014, 0.32, 5),
        this.mats.metal,
        x * 0.62,
        0.85,
        z * 0.62,
      );
    }
    const flag = add(
      new THREE.PlaneGeometry(0.65, 0.35),
      this.mats.gold,
      0.32,
      2.48,
      0,
    );
    flag.material = new THREE.MeshStandardMaterial({
      color: 0xf2ca65,
      side: THREE.DoubleSide,
    });
    add(
      new THREE.CylinderGeometry(0.025, 0.025, 0.6, 8),
      this.mats.metal,
      0,
      2.3,
      0,
    );
    this.label("01", 0, 3.3, 55);
    this.disc = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 0.055, 40),
      this.mats.disc,
    );
    body.castShadow = true;
    this.disc.add(body);
    const stamp = new THREE.Mesh(
      new THREE.TorusGeometry(0.16, 0.013, 5, 32),
      this.mats.cream,
    );
    stamp.rotation.x = Math.PI / 2;
    stamp.position.y = 0.031;
    this.disc.add(stamp);
    this.scene.add(this.disc);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x173f36,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    });
    this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.4, 24), shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.scene.add(this.shadow);
    this.arrow = new THREE.ArrowHelper(
      v(0, 0, 1),
      v(0, 0.06, 1),
      4,
      0xf4e2a0,
      0.7,
      0.35,
    );
    this.scene.add(this.arrow);
    this.trace = new THREE.Line(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({
        color: 0xffe7ad,
        transparent: true,
        opacity: 0.5,
      }),
    );
    this.scene.add(this.trace);
    this.points = [];
    this.lastTraceTime = 0;
    this.chainTime = 0;
    addEventListener("resize", () => this.resize());
    this.resize();
  }
  mesh(geometry, material, x, y, z) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    return mesh;
  }
  label(text, x, y, z) {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 96;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#f3efd1";
    ctx.font = "500 46px Segoe UI";
    ctx.textAlign = "center";
    ctx.fillText(text, 128, 64);
    const map = new THREE.CanvasTexture(canvas);
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false }),
    );
    s.position.set(x, y, z);
    s.scale.set(3.8, 1.42, 1);
    this.scene.add(s);
  }
  resize() {
    this.renderer.setSize(innerWidth, innerHeight);
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
  }
  resetTrace() {
    this.points = [];
    this.lastTraceTime = 0;
    this.trace.geometry.dispose();
    this.trace.geometry = new THREE.BufferGeometry();
  }
  update(dt, { input, shot, lie, active }) {
    const aim = input.aim,
      forward = v(Math.sin(aim), 0, Math.cos(aim)),
      right = v(-Math.cos(aim), 0, Math.sin(aim));
    let desired, look;
    this.arrow.visible = !shot;
    this.arrow.position.set(lie.x, 0.065, lie.z + 0.1);
    this.arrow.setDirection(forward);
    if (!shot) {
      const pos = v(lie.x, 1.18, lie.z)
        .addScaledVector(right, 0.48)
        .addScaledVector(forward, 0.45 - input.power * 0.9);
      this.disc.position.copy(pos);
      this.disc.rotation.set(0, aim, input.bank);
      desired = v(lie.x, 2.7, lie.z).addScaledVector(
        forward,
        -4.3 - input.power * 0.22,
      );
      look = v(lie.x, 1.5, lie.z).addScaledVector(forward, 18);
    } else {
      this.disc.position.set(shot.x, shot.y, shot.z);
      const heading = Math.atan2(shot.vx, shot.vz);
      this.disc.rotation.set(0, heading, shot.bank);
      this.disc.children[0].rotation.y = shot.time * shot.spin;
      const isRest = shot.phase === "rest",
        follow = v(shot.vx, 0, shot.vz);
      if (isRest) follow.set(basket.x - shot.x, 0, basket.z - shot.z);
      if (follow.length() < 0.1) follow.copy(forward);
      follow.normalize();
      const launchCam = v(lie.x, 2.7, lie.z).addScaledVector(forward, -4.3),
        chase = v(
          shot.x,
          shot.y + (isRest ? 4.8 : 3.2),
          shot.z,
        ).addScaledVector(follow, isRest ? -8 : -7);
      desired = launchCam.lerp(
        chase,
        THREE.MathUtils.smoothstep(shot.time, 0.12, 1.05),
      );
      desired.y = Math.max(desired.y, 2.7);
      look = v(shot.x, shot.y + 0.5, shot.z).addScaledVector(
        follow,
        isRest ? 1 : 3,
      );
      if (shot.time > this.lastTraceTime + 0.045 && !isRest) {
        this.points.push(this.disc.position.clone());
        this.lastTraceTime = shot.time;
        this.trace.geometry.dispose();
        this.trace.geometry = new THREE.BufferGeometry().setFromPoints(
          this.points,
        );
      }
    }
    this.camera.position.lerp(desired, 1 - Math.exp(-dt * 4));
    this.look.lerp(look, 1 - Math.exp(-dt * 6));
    this.camera.lookAt(this.look);
    this.shadow.position.set(this.disc.position.x, 0.008, this.disc.position.z);
    const height = this.disc.position.y;
    this.shadow.scale.setScalar(1 + height * 0.06);
    this.shadow.material.opacity = Math.max(0.06, 0.3 - height * 0.018);
    this.chainTime = Math.max(0, this.chainTime - dt);
    for (let i = 0; i < this.chains.length; i++)
      this.chains[i].rotation.z =
        Math.sin(this.chainTime * 30 + i) * this.chainTime * 0.06;
    this.renderer.render(this.scene, this.camera);
  }
}
