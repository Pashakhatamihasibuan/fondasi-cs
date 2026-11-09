// Gradient descent 3D: permukaan loss z = f(x, y), bola yang turun mengikuti
// −∇f dengan learning rate pilihan, dan panah gradien di posisi saat ini.

import * as THREE from "three";
import { OrbitControls } from "three/addons/OrbitControls.js";
import { cssVar, prefersReducedMotion } from "../app.js";
import { webglAvailable } from "../viz/automaton3d.js";

export const SURFACES = {
  mangkuk: {
    name: "Mangkuk: f(x, y) = x² + y²",
    f: (x, y) => x * x + y * y,
    g: (x, y) => [2 * x, 2 * y],
    start: [2.6, 2.2], lr: 0.1, zScale: 0.25,
    note: "Permukaan paling ramah: satu minimum di (0, 0), dan gradien selalu menunjuk menjauhi pusat. Coba learning rate 0.9 lalu 1.05 untuk melihat osilasi dan divergensi.",
  },
  lembah: {
    name: "Lembah sempit: f(x, y) = 0.1x² + 3y²",
    f: (x, y) => 0.1 * x * x + 3 * y * y,
    g: (x, y) => [0.2 * x, 6 * y],
    start: [2.8, 1.4], lr: 0.15, zScale: 0.18,
    note: "Lembah sempit memanjang (ill-conditioned). Arah y curam, arah x landai. Learning rate yang aman untuk y terlalu lambat untuk x, sehingga bola zig-zag. Inilah alasan optimizer seperti momentum dan Adam diciptakan.",
  },
  "dua-lembah": {
    name: "Dua minimum: f(x, y) = (x² − 4)²/8 + y²",
    f: (x, y) => ((x * x - 4) ** 2) / 8 + y * y,
    g: (x, y) => [(x * (x * x - 4)) / 2, 2 * y],
    start: [0.3, 2.4], lr: 0.08, zScale: 0.35,
    note: "Ada dua minimum, di x = −2 dan x = 2. Titik awal menentukan minimum mana yang dicapai. Coba x awal −0.3: bola jatuh ke lembah lain. Pada neural network, permukaan loss punya sangat banyak lembah seperti ini.",
  },
};

const RANGE = 3.2;

class GDScene {
  constructor(stage) {
    this.stage = stage;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
    this.camera.position.set(5, 9.5, 7);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.domElement.setAttribute("aria-hidden", "true");
    stage.appendChild(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.target.set(0, 1.4, 0);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.3));
    const dl = new THREE.DirectionalLight(0xffffff, 1.4);
    dl.position.set(5, 10, 4);
    this.scene.add(dl);
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.ball = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 20), new THREE.MeshStandardMaterial({ roughness: 0.3 }));
    this.scene.add(this.ball);
    this.arrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(), 1, 0xffffff, 0.22, 0.12);
    this.scene.add(this.arrow);
    this.pathMat = new THREE.LineBasicMaterial();
    this.path = new THREE.Line(new THREE.BufferGeometry(), this.pathMat);
    this.scene.add(this.path);

    new ResizeObserver(() => this.resize()).observe(stage);
    this.visible = true;
    new IntersectionObserver(([e]) => (this.visible = e.isIntersecting)).observe(stage);
    document.addEventListener("theme-change", () => this.surface && this.build(this.surface));
    this.resize();
    const loop = () => {
      requestAnimationFrame(loop);
      if (!this.visible) return;
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }

  resize() {
    const w = this.stage.clientWidth, h = this.stage.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.camera.position.setLength(w < 560 ? 19 : 15);
    this.renderer.setSize(w, h);
  }

  // koordinat dunia: x → x, y(math) → −z, f → tinggi
  world(x, y) {
    const s = this.surface;
    return new THREE.Vector3(x, Math.min(s.f(x, y) * s.zScale, 4.5), -y);
  }

  build(s) {
    this.surface = s;
    this.group.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); });
    this.scene.remove(this.group);
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.scene.background = new THREE.Color(cssVar("--viz-bg"));
    const low = new THREE.Color(cssVar("--t-ml")), high = new THREE.Color(cssVar("--t-research"));
    const seg = 60;
    const geo = new THREE.PlaneGeometry(RANGE * 2, RANGE * 2, seg, seg);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = [];
    let maxH = 0;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = -pos.getZ(i);
      const h = Math.min(s.f(x, y) * s.zScale, 4.5);
      pos.setY(i, h);
      maxH = Math.max(maxH, h);
    }
    for (let i = 0; i < pos.count; i++) {
      const c = low.clone().lerp(high, Math.pow(pos.getY(i) / maxH, 0.6));
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, side: THREE.DoubleSide }));
    this.group.add(mesh);
    // kontur di lantai
    const contourMat = new THREE.LineBasicMaterial({ color: new THREE.Color(cssVar("--viz-edge")), transparent: true, opacity: 0.6 });
    const levels = 9;
    for (let l = 1; l <= levels; l++) {
      const target = (maxH / s.zScale) * Math.pow(l / (levels + 1), 2);
      const pts = [];
      for (let a = 0; a <= 360; a += 3) {
        // cari jari-jari r di sepanjang sinar dengan f = target (bisection)
        const dx = Math.cos((a * Math.PI) / 180), dy = Math.sin((a * Math.PI) / 180);
        let lo = 0, hi = RANGE * 1.5, ok = s.f(hi * dx, hi * dy) >= target;
        if (!ok) continue;
        for (let it = 0; it < 30; it++) { const m = (lo + hi) / 2; if (s.f(m * dx, m * dy) < target) lo = m; else hi = m; }
        const r = (lo + hi) / 2;
        if (r * Math.abs(dx) <= RANGE && r * Math.abs(dy) <= RANGE) pts.push(new THREE.Vector3(r * dx, -0.6, -r * dy));
      }
      if (pts.length > 2) this.group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), contourMat));
    }
    const accent = new THREE.Color(cssVar("--accent"));
    this.ball.material.color.copy(new THREE.Color(cssVar("--text")));
    this.ball.material.emissive = accent.clone().multiplyScalar(0.3);
    this.arrow.setColor(new THREE.Color(cssVar("--bad")));
    this.pathMat.color.copy(new THREE.Color(cssVar("--text")));
  }

  place(x, y, trail) {
    const p = this.world(x, y).add(new THREE.Vector3(0, 0.16, 0));
    this.ball.position.copy(p);
    const [gx, gy] = this.surface.g(x, y);
    const len = Math.hypot(gx, gy);
    if (len > 1e-6) {
      this.arrow.visible = true;
      this.arrow.position.copy(p);
      this.arrow.setDirection(new THREE.Vector3(-gx, 0, gy).normalize()); // arah −∇f (turun)
      this.arrow.setLength(Math.min(0.4 + len * 0.25, 1.6), 0.22, 0.12);
    } else this.arrow.visible = false;
    this.path.geometry.dispose();
    this.path.geometry = new THREE.BufferGeometry().setFromPoints(trail.map(([a, b]) => this.world(a, b).add(new THREE.Vector3(0, 0.05, 0))));
  }
}

function mount(root) {
  const $ = (s) => root.querySelector(s);
  const stage = $(".viz-stage"), sel = $("[data-surface]"), lr = $("[data-lr]"), lrOut = $("[data-lr-out]");
  const x0 = $("[data-x0]"), y0 = $("[data-y0]"), status = $("[data-status]"), note = $("[data-note]"), log = $("[data-log]");
  const bStep = $("[data-step]"), bRun = $("[data-run]"), bReset = $("[data-reset]");
  let sc = null;
  if (webglAvailable()) { try { sc = new GDScene(stage); } catch (e) { console.warn(e); } }
  if (!sc) stage.innerHTML = '<p class="viz-fallback">Animasi 3D butuh WebGL. Log iterasi di bawah tetap berjalan.</p>';
  const st = { x: 0, y: 0, it: 0, trail: [], running: false, token: 0 };

  const fmt = (v) => (Math.abs(v) >= 1e4 ? v.toExponential(2) : v.toFixed(3));
  function render() {
    const s = SURFACES[sel.value];
    const [gx, gy] = s.g(st.x, st.y);
    const fval = s.f(st.x, st.y);
    status.textContent = `iterasi ${st.it} · (x, y) = (${fmt(st.x)}, ${fmt(st.y)}) · f = ${fmt(fval)} · |∇f| = ${fmt(Math.hypot(gx, gy))}`;
    const diverged = !isFinite(fval) || Math.abs(st.x) > 50 || Math.abs(st.y) > 50;
    status.className = "viz-status" + (diverged ? " reject" : Math.hypot(gx, gy) < 1e-3 ? " accept" : "");
    if (sc) sc.place(Math.max(-RANGE, Math.min(RANGE, st.x)), Math.max(-RANGE, Math.min(RANGE, st.y)), st.trail.filter(([a, b]) => Math.abs(a) <= RANGE && Math.abs(b) <= RANGE));
    return diverged;
  }
  function reset() {
    st.running = false; st.token++;
    bRun.textContent = "Jalankan 40 iterasi";
    const s = SURFACES[sel.value];
    st.x = Number(x0.value); st.y = Number(y0.value); st.it = 0; st.trail = [[st.x, st.y]];
    log.textContent = "it   x        y        f(x,y)\n" + `0    ${fmt(st.x).padEnd(8)} ${fmt(st.y).padEnd(8)} ${fmt(s.f(st.x, st.y))}`;
    render();
  }
  function step() {
    const s = SURFACES[sel.value], a = Number(lr.value);
    const [gx, gy] = s.g(st.x, st.y);
    st.x -= a * gx; st.y -= a * gy; st.it++;
    st.trail.push([st.x, st.y]);
    const line = `\n${String(st.it).padEnd(4)} ${fmt(st.x).padEnd(8)} ${fmt(st.y).padEnd(8)} ${fmt(s.f(st.x, st.y))}`;
    log.textContent += line;
    log.scrollTop = log.scrollHeight;
    return render();
  }
  async function run() {
    if (st.running) { st.running = false; bRun.textContent = "Jalankan 40 iterasi"; return; }
    st.running = true; bRun.textContent = "Jeda";
    const token = ++st.token;
    for (let i = 0; i < 40 && st.running && token === st.token; i++) {
      if (step()) { status.textContent += " · DIVERGEN: learning rate terlalu besar"; break; }
      await new Promise((r) => setTimeout(r, prefersReducedMotion() ? 0 : 140));
    }
    if (token !== st.token) return;
    st.running = false; bRun.textContent = "Jalankan 40 iterasi";
  }
  function loadSurface() {
    const s = SURFACES[sel.value];
    note.textContent = s.note;
    lr.value = s.lr; lrOut.textContent = s.lr;
    x0.value = s.start[0]; y0.value = s.start[1];
    sc?.build(s);
    reset();
  }
  sel.addEventListener("change", loadSurface);
  lr.addEventListener("input", () => { lrOut.textContent = Number(lr.value).toFixed(2); });
  [x0, y0].forEach((el) => el.addEventListener("change", reset));
  bStep.addEventListener("click", step);
  bRun.addEventListener("click", run);
  bReset.addEventListener("click", reset);
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-preset]");
    if (!b) return;
    const [surf, rate, xs, ys] = JSON.parse(b.dataset.preset);
    sel.value = surf; loadSurface();
    lr.value = rate; lrOut.textContent = rate;
    if (xs != null) { x0.value = xs; y0.value = ys; }
    reset(); run();
  });
  loadSurface();
}

document.querySelectorAll("[data-gd]").forEach(mount);
