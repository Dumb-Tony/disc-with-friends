import * as THREE from "../vendor/three.module.js";
import { basket } from "./config.js";
import {
  createMaterials,
  addLighting,
  createDisc,
  createBasket,
  addLandscape,
  contactShadow,
} from "./visuals.js";
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
    this.sun = addLighting(this.scene, this.renderer);
    this.mats = createMaterials();
    addLandscape(this.scene, this.mats);
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
    const basketVisual = createBasket(this.mats);
    this.basket = basketVisual.group;
    this.basket.position.set(basket.x, 0, basket.z);
    this.chains = basketVisual.chains;
    this.scene.add(this.basket);
    this.label("01", 0, 3.3, 55);
    this.disc = createDisc(this.mats);
    this.scene.add(this.disc);
    this.shadow = contactShadow();
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
    const pitch = input.pitch ?? (10 * Math.PI) / 180;
    const launchDirection = forward.clone().multiplyScalar(Math.cos(pitch));
    launchDirection.y = Math.sin(pitch);
    const pitchOffset = pitch - (10 * Math.PI) / 180;
    let desired, look;
    this.arrow.visible = !shot;
    this.arrow.position.set(lie.x, 1.35, lie.z);
    this.arrow.setDirection(launchDirection);
    this.arrow.setLength(
      pitch < 0 ? Math.min(4, 1.25 / -Math.sin(pitch)) : 4,
      0.5,
      0.22,
    );
    if (!shot) {
      const pos = v(
        lie.x,
        1.18 + Math.sin(pitchOffset) * (pitchOffset > 0 ? 2.4 : 1),
        lie.z,
      )
        .addScaledVector(right, 1.05)
        .addScaledVector(forward, 0.45 - input.power * 0.9);
      this.disc.position.copy(pos);
      this.disc.rotation.set(-pitch, aim, input.bank, "YXZ");
      this.disc.children[0].rotation.y = 0;
      desired = v(lie.x, 2.7, lie.z).addScaledVector(
        forward,
        -4.3 - input.power * 0.22,
      );
      look = v(lie.x, 1.5 + Math.tan(pitchOffset) * 12, lie.z).addScaledVector(
        forward,
        18,
      );
    } else {
      this.disc.position.set(shot.x, shot.y, shot.z);
      const heading = Math.atan2(shot.vx, shot.vz);
      const flightPitch =
        shot.phase === "flight"
          ? Math.atan2(shot.vy, Math.hypot(shot.vx, shot.vz))
          : 0;
      this.disc.rotation.set(-flightPitch, heading, shot.bank, "YXZ");
      if (shot.phase !== "rest")
        this.disc.children[0].rotation.y += dt * shot.spin;
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
    if (!shot) {
      const reticle = document.getElementById("reticle");
      const sight = v(lie.x, 1.35, lie.z)
        .addScaledVector(launchDirection, 20)
        .project(this.camera);
      if (reticle) {
        reticle.style.left = `${(sight.x * 0.5 + 0.5) * innerWidth}px`;
        reticle.style.top = `${(-sight.y * 0.5 + 0.5) * innerHeight}px`;
      }
    }
    this.shadow.position.set(this.disc.position.x, 0.008, this.disc.position.z);
    const height = this.disc.position.y;
    this.shadow.scale.setScalar(1 + height * 0.06);
    this.shadow.material.opacity = Math.max(0.06, 0.3 - height * 0.018);
    this.chainTime = Math.max(0, this.chainTime - dt);
    for (let i = 0; i < this.chains.length; i++)
      this.chains[i].rotation.z =
        Math.sin(this.chainTime * 30 + i) * this.chainTime * 0.06;
    // Keep the useful shadow region around the shot, snapped to reduce shimmer.
    const sx = Math.round(this.disc.position.x * 16) / 16;
    const sz = Math.round(this.disc.position.z * 16) / 16;
    this.sun.position.set(sx - 38, 65, sz - 32);
    this.sun.target.position.set(sx, 0, sz);
    this.renderer.render(this.scene, this.camera);
  }
}
