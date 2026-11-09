// Peta 3D di beranda: enam jalur belajar mengorbit tujuan akhir (MECS UTM).
// Garis menunjukkan ketergantungan antarjalur; partikel kecil mengalir ke arah tujuan.

import * as THREE from "three";
import { OrbitControls } from "three/addons/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/CSS2DRenderer.js";
import { cssVar, prefersReducedMotion } from "../app.js";
import { webglAvailable } from "./automaton3d.js";

// prasyarat -> jalur yang memakainya
const LINKS = [
  ["matematika-diskrit", "teori-komputasi"],
  ["matematika-diskrit", "algoritma-lanjut"],
  ["algoritma-lanjut", "teori-komputasi"],
  ["algoritma-lanjut", "ai-klasik"],
  ["python-ml", "ai-klasik"],
  ["riset-menulis", "python-ml"],
];

export function mountHero(stage, tracks, root = "") {
  if (!webglAvailable()) {
    stage.innerHTML = '<p class="viz-fallback">Peta 3D butuh WebGL. Daftar jalur belajar ada di bawah.</p>';
    return;
  }
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 4.2, 10.5);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.domElement.setAttribute("aria-hidden", "true");
  stage.prepend(renderer.domElement);
  const labels = new CSS2DRenderer();
  Object.assign(labels.domElement.style, { position: "absolute", inset: "0", pointerEvents: "none" });
  stage.appendChild(labels.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.autoRotate = !prefersReducedMotion();
  controls.autoRotateSpeed = 0.9;

  scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.5));
  const dl = new THREE.DirectionalLight(0xffffff, 1.5);
  dl.position.set(5, 8, 6);
  scene.add(dl);

  const world = new THREE.Group();
  scene.add(world);

  // Tujuan di tengah
  const goalMat = new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.2 });
  const goal = new THREE.Mesh(new THREE.IcosahedronGeometry(0.85, 1), goalMat);
  world.add(goal);
  const goalEl = document.createElement("div");
  goalEl.className = "viz-label";
  goalEl.textContent = "🎓 MECS UTM 2028";
  const goalLbl = new CSS2DObject(goalEl);
  goalLbl.position.set(0, 1.35, 0);
  world.add(goalLbl);

  const nodes = new Map();
  tracks.forEach((t, i) => {
    const a = (i / tracks.length) * Math.PI * 2;
    const y = (i % 2 ? 0.9 : -0.6);
    const pos = new THREE.Vector3(Math.cos(a) * 3.6, y, Math.sin(a) * 3.6);
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.1 });
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 24), mat);
    mesh.position.copy(pos);
    world.add(mesh);
    const el = document.createElement("a");
    el.className = "viz-label track";
    el.href = `${root}roadmap.html?jalur=${t.id}`;
    el.textContent = `${t.num}. ${t.title}`;
    const lbl = new CSS2DObject(el);
    lbl.position.copy(pos).add(new THREE.Vector3(0, 0.75, 0));
    world.add(lbl);
    nodes.set(t.id, { mesh, pos, color: t.color });
  });

  // Garis & partikel
  const lineMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.55 });
  const particles = [];
  const particleGeo = new THREE.SphereGeometry(0.06, 10, 8);
  const particleMat = new THREE.MeshBasicMaterial();
  const addCurve = (a, b, lift) => {
    const mid = a.clone().add(b).multiplyScalar(0.5);
    mid.y += lift;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(40)), lineMat));
    for (let k = 0; k < 2; k++) {
      const p = new THREE.Mesh(particleGeo, particleMat);
      world.add(p);
      particles.push({ p, curve, off: Math.random() });
    }
  };
  nodes.forEach((n) => addCurve(n.pos, new THREE.Vector3(0, 0, 0), 0.8));
  LINKS.forEach(([a, b]) => addCurve(nodes.get(a).pos, nodes.get(b).pos, 1.2));

  function paint() {
    scene.background = new THREE.Color(cssVar("--viz-bg"));
    goalMat.color.set(cssVar("--accent"));
    lineMat.color.set(cssVar("--viz-edge"));
    particleMat.color.set(cssVar("--accent"));
    nodes.forEach((n) => n.mesh.material.color.set(cssVar(n.color)));
  }
  paint();
  document.addEventListener("theme-change", paint);

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    camera.aspect = w / h;
    camera.position.z = w < 520 ? 13 : 10.5;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
    labels.setSize(w, h);
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);
  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    if (!visible) return;
    const t = clock.getElapsedTime();
    if (!prefersReducedMotion()) {
      goal.rotation.y = t * 0.4;
      goal.rotation.x = Math.sin(t * 0.3) * 0.2;
      particles.forEach(({ p, curve, off }) => p.position.copy(curve.getPoint((t * 0.18 + off) % 1)));
    } else {
      particles.forEach(({ p, curve, off }) => p.position.copy(curve.getPoint(off)));
    }
    controls.update();
    renderer.render(scene, camera);
    labels.render(scene, camera);
  })();
}
