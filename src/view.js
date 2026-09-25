import { addCourse } from "./course-view.js";
import { ChainStrand } from "./chain-motion.js";
import * as THREE from "../vendor/three.module.js";
import { hole as openingHole, inWater } from "./course.js";
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
    this.loadHole(openingHole);
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
    this.chainAccumulator = 0;
    this.chainModels = this.chains.map(
      (chain) =>
        new ChainStrand(
          chain.userData.layout.top,
          chain.userData.layout.bottom,
        ),
    );
    this.linkDummy = new THREE.Object3D();
    this.linkTwist = new THREE.Quaternion();
    addEventListener("resize", () => this.resize());
    this.resize();
  }
  loadHole(hole) {
    const shared = new Set(Object.values(this.mats));
    for (const group of [this.courseGroup, this.basket, this.marker]) {
      if (!group) continue;
      this.scene.remove(group);
      const geometries = new Set(),
        materials = new Set();
      group.traverse((o) => {
        if (o.geometry) geometries.add(o.geometry);
        if (o.material)
          for (const m of Array.isArray(o.material) ? o.material : [o.material])
            if (!shared.has(m)) materials.add(m);
      });
      for (const g of geometries) g.dispose();
      for (const m of materials) {
        if (m.map && !Object.values(this.mats).some((s) => s.map === m.map))
          m.map.dispose();
        m.dispose();
      }
    }
    const blades = this.scene.getObjectByName("fieldGrass");
    if (blades) {
      const original = blades.userData.originalMatrices,
        m = new THREE.Matrix4();
      for (let i = 0; i < blades.count; i++) {
        m.fromArray(original, i * 16);
        if (inWater(m.elements[12], m.elements[14], hole.water, 0.6))
          m.scale(new THREE.Vector3(0, 0, 0));
        blades.setMatrixAt(i, m);
      }
      blades.instanceMatrix.needsUpdate = true;
    }
    this.target = hole.pin;
    this.courseGroup = addCourse(this.scene, this.mats, hole);
    const visual = createBasket(this.mats, hole.id);
    this.basket = visual.group;
    this.chains = visual.chains;
    this.basket.position.set(hole.pin.x, 0, hole.pin.z);
    this.scene.add(this.basket);
    this.marker = this.label(
      String(hole.id).padStart(2, "0"),
      hole.pin.x,
      3.3,
      hole.pin.z,
    );
    this.chainAccumulator = 0;
    this.chainModels = this.chains.map(
      (chain) =>
        new ChainStrand(
          chain.userData.layout.top,
          chain.userData.layout.bottom,
        ),
    );
    this.camera.position.set(0, 3, -5);
    this.look.set(hole.pin.x * 0.1, 1.5, 15);
    if (this.trace) this.resetTrace();
  }
  onBasketImpact(impact) {
    if (!impact || impact.kind !== "chains") return;
    const hit = {
      ...impact,
      x: impact.x - this.basket.position.x,
      z: impact.z - this.basket.position.z,
    };
    for (const strand of this.chainModels) strand.kick(hit);
  }
  animateChains(dt) {
    this.chainAccumulator += Math.min(dt, 0.1);
    while (this.chainAccumulator >= 1 / 120) {
      for (const strand of this.chainModels) strand.step();
      this.chainAccumulator -= 1 / 120;
    }
    const up = v(0, 1, 0),
      tangent = v();
    this.chains.forEach((chain, index) => {
      const points = this.chainModels[index].points;
      for (let j = 0; j < points.length; j++) {
        const p = points[j],
          a = points[Math.max(j - 1, 0)],
          b = points[Math.min(j + 1, points.length - 1)];
        this.linkDummy.position.set(
          p.x - chain.position.x,
          p.y - chain.position.y,
          p.z - chain.position.z,
        );
        tangent.set(a.x - b.x, a.y - b.y, a.z - b.z).normalize();
        this.linkDummy.quaternion.setFromUnitVectors(up, tangent);
        this.linkTwist.setFromAxisAngle(
          up,
          chain.userData.layout.angle + ((j % 2) * Math.PI) / 2,
        );
        this.linkDummy.quaternion.multiply(this.linkTwist);
        this.linkDummy.updateMatrix();
        chain.setMatrixAt(j, this.linkDummy.matrix);
      }
      chain.instanceMatrix.needsUpdate = true;
    });
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
    return s;
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
        shot.phase === "flight" && !shot.chainTouched
          ? Math.atan2(shot.vy, Math.hypot(shot.vx, shot.vz))
          : 0;
      this.disc.rotation.set(-flightPitch, heading, shot.bank, "YXZ");
      if (shot.phase !== "rest")
        this.disc.children[0].rotation.y += dt * shot.spin;
      const isRest = shot.phase === "rest",
        follow = v(shot.vx, 0, shot.vz);
      if (isRest) follow.set(this.target.x - shot.x, 0, this.target.z - shot.z);
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
    this.animateChains(dt);
    // Keep the useful shadow region around the shot, snapped to reduce shimmer.
    const sx = Math.round(this.disc.position.x * 16) / 16;
    const sz = Math.round(this.disc.position.z * 16) / 16;
    this.sun.position.set(sx - 38, 65, sz - 32);
    this.sun.target.position.set(sx, 0, sz);
    this.renderer.render(this.scene, this.camera);
  }
}
