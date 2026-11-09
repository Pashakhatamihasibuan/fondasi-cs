// Domino 3D untuk induksi matematika: basis = domino pertama didorong,
// langkah induktif = setiap domino yang jatuh menjatuhkan domino berikutnya.
// Skenario menunjukkan apa yang terjadi jika basis atau langkah induktif gagal.

import * as THREE from "three";
import { OrbitControls } from "three/addons/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/CSS2DRenderer.js";
import { cssVar, prefersReducedMotion, escapeHtml } from "../app.js";
import { webglAvailable } from "../viz/automaton3d.js";

const N = 12;
const LEAN = 0.56; // sudut saat bersandar pada domino berikutnya: asin((jarak − tebal) / tinggi)

export const SCENARIOS = {
  jumlah: {
    title: "P(n): 1 + 2 + … + n = n(n + 1)/2",
    start: 1,
    P: (n) => true,
    detail: (n) => `${(n * (n + 1)) / 2} = ${n}·${n + 1}/2`,
    step: () => true,
    note: "Basis P(1) benar dan langkah P(k) → P(k+1) berlaku untuk setiap k ≥ 1. Semua domino jatuh: P(n) benar untuk semua n ≥ 1.",
  },
  "tanpa-basis": {
    title: "P(n): n = n + 1",
    start: 1,
    P: () => false,
    detail: (n) => `${n} ≠ ${n + 1}`,
    step: () => true,
    note: "Langkah induktifnya sah: jika k = k + 1, tambahkan 1 di kedua ruas, maka k + 1 = k + 2. Tetapi basis P(1) salah, sehingga tidak ada domino yang pernah didorong. Langkah induktif saja tidak membuktikan apa-apa.",
  },
  "langkah-gagal": {
    title: "P(n): 2ⁿ ≥ n², mulai n = 1",
    start: 1,
    P: (n) => 2 ** n >= n * n,
    detail: (n) => `${2 ** n} ${2 ** n >= n * n ? "≥" : "<"} ${n * n}`,
    step: (k) => k >= 4 || (2 ** k >= k * k ? 2 ** (k + 1) >= (k + 1) ** 2 : true),
    note: "Basis P(1) benar dan P(2) juga benar, tetapi langkah dari k = 2 ke k = 3 gagal karena 8 < 9. Rantai berhenti di celah itu. Domino 4 dan seterusnya sebenarnya benar, tetapi tidak ada yang menjatuhkannya dari sini.",
  },
  "basis-4": {
    title: "P(n): 2ⁿ ≥ n², mulai n = 4",
    start: 4,
    P: (n) => 2 ** n >= n * n,
    detail: (n) => `${2 ** n} ${2 ** n >= n * n ? "≥" : "<"} ${n * n}`,
    step: (k) => k >= 4,
    note: "Basis dipindah ke n = 4 (16 ≥ 16). Untuk k ≥ 4, langkah induktif berlaku (lihat Contoh 3 di bawah). Semua domino dari 4 ke atas jatuh. Domino 1–3 tidak tercakup oleh bukti ini, dan memang domino 3 salah.",
  },
};

class DominoScene {
  constructor(stage) {
    this.stage = stage;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.domElement.setAttribute("aria-hidden", "true");
    stage.appendChild(this.renderer.domElement);
    this.labels = new CSS2DRenderer();
    Object.assign(this.labels.domElement.style, { position: "absolute", inset: "0", pointerEvents: "none" });
    stage.appendChild(this.labels.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 6;
    this.controls.maxDistance = 40;
    this.controls.maxPolarAngle = Math.PI * 0.48;

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.2));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(-6, 14, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16 });
    this.scene.add(sun);

    this.floorMat = new THREE.MeshStandardMaterial({ roughness: 0.9 });
    const floor = new THREE.Mesh(new THREE.CircleGeometry(16, 64), this.floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Domino disusun di sepanjang busur supaya kedalaman 3D terasa.
    this.dominos = [];
    const H = 2, W = 1.0, D = 0.22, gap = 1.25;
    this.size = { H, W, D };
    for (let i = 0; i < N; i++) {
      const n = i + 1;
      const t = (i - (N - 1) / 2) * gap;
      const angle = t / 9;
      const pos = new THREE.Vector3(Math.sin(angle) * 9, 0, 9 - Math.cos(angle) * 9);
      const mat = new THREE.MeshStandardMaterial({ roughness: 0.4 });
      // wrap menghadap arah barisan; hinge berada di tepi bawah depan
      // sehingga domino jatuh ke arah domino berikutnya.
      const wrap = new THREE.Group();
      wrap.position.copy(pos);
      wrap.rotation.y = -angle + Math.PI / 2;
      const hinge = new THREE.Group();
      hinge.position.set(0, 0, 0);
      const body = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), mat);
      body.position.set(0, H / 2, -D / 2);
      body.castShadow = true;
      hinge.add(body);
      wrap.add(hinge);
      this.scene.add(wrap);

      const el = document.createElement("div");
      el.className = "viz-label domino";
      const lbl = new CSS2DObject(el);
      lbl.position.set(0, H + 0.55, 0);
      wrap.add(lbl);
      this.dominos.push({ n, wrap, hinge, mat, el, fallen: false });
    }

    this.paint();
    document.addEventListener("theme-change", () => this.paint());
    new ResizeObserver(() => this.resize()).observe(stage);
    this.visible = true;
    new IntersectionObserver(([e]) => (this.visible = e.isIntersecting)).observe(stage);
    this.resize();
    this.anims = [];
    const loop = (now) => {
      requestAnimationFrame(loop);
      this.anims = this.anims.filter((a) => a(now));
      if (!this.visible) return;
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.labels.render(this.scene, this.camera);
    };
    requestAnimationFrame(loop);
  }

  paint() {
    this.colors = {
      bg: new THREE.Color(cssVar("--viz-bg")), floor: new THREE.Color(cssVar("--surface-2")),
      t: new THREE.Color(cssVar("--ok")), f: new THREE.Color(cssVar("--bad")),
      idle: new THREE.Color(cssVar("--viz-node")), out: new THREE.Color(cssVar("--viz-edge")),
    };
    this.scene.background = this.colors.bg;
    this.floorMat.color.copy(this.colors.floor);
    this.dominos.forEach((d) => this.colorDomino(d));
  }

  colorDomino(d) {
    const c = d.state === "out" ? this.colors.out : d.fallen ? this.colors.t : d.truth === false ? this.colors.f : this.colors.idle;
    d.mat.color.copy(c);
  }

  resize() {
    const w = this.stage.clientWidth, h = this.stage.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    const far = w < 560 ? 21 : 14;
    this.camera.position.set(0, far * 0.42, far + 2);
    this.controls.target.set(0, 1, 0.8);
    this.renderer.setSize(w, h);
    this.labels.setSize(w, h);
  }

  setup(sc) {
    this.anims = [];
    this.dominos.forEach((d) => {
      d.fallen = false;
      d.hinge.rotation.x = 0;
      d.state = d.n < sc.start ? "out" : "in";
      d.truth = sc.P(d.n);
      d.el.innerHTML = `<b>${d.n}</b> <span class="${d.truth ? "t" : "f"}">${d.truth ? "T" : "F"}</span>`;
      d.el.title = sc.detail(d.n);
      this.colorDomino(d);
    });
  }

  fall(d, ms) {
    return new Promise((resolve) => {
      d.fallen = true;
      this.colorDomino(d);
      if (prefersReducedMotion() || ms <= 0) { d.hinge.rotation.x = LEAN; resolve(); return; }
      const t0 = performance.now();
      this.anims.push((now) => {
        const k = Math.min(1, (now - t0) / ms);
        d.hinge.rotation.x = LEAN * k * k; // jatuh makin cepat
        if (k >= 1) { resolve(); return false; }
        return true;
      });
    });
  }

  /** Mainkan: dorong basis, lalu rantai mengikuti langkah induktif. Mengembalikan n terakhir yang jatuh. */
  async play(sc, ms, onFall) {
    this.setup(sc);
    const first = this.dominos.find((d) => d.n === sc.start);
    if (!sc.P(sc.start)) {
      // dorongan basis gagal: domino bergoyang lalu kembali
      if (!prefersReducedMotion()) {
        const t0 = performance.now();
        await new Promise((res) => this.anims.push((now) => {
          const k = Math.min(1, (now - t0) / 700);
          first.hinge.rotation.x = 0.18 * Math.sin(k * Math.PI);
          if (k >= 1) { res(); return false; }
          return true;
        }));
      }
      return null;
    }
    let last = sc.start;
    await this.fall(first, ms);
    onFall?.(sc.start);
    for (let k = sc.start; k < N; k++) {
      if (!sc.step(k)) break;
      const next = this.dominos[k];
      await this.fall(next, ms * 0.85);
      last = k + 1;
      onFall?.(last);
    }
    return last;
  }
}

function mount(root) {
  const stage = root.querySelector(".viz-stage");
  const select = root.querySelector("[data-scenario]");
  const btn = root.querySelector("[data-play]");
  const btnReset = root.querySelector("[data-reset]");
  const status = root.querySelector("[data-status]");
  const note = root.querySelector("[data-note]");
  const table = root.querySelector("[data-table]");
  let scene = null;
  if (webglAvailable()) { try { scene = new DominoScene(stage); } catch (e) { console.warn(e); } }
  if (!scene) stage.innerHTML = '<p class="viz-fallback">Animasi domino butuh WebGL. Penjelasan dan tabel di bawah tetap lengkap.</p>';
  let busy = false;

  function show() {
    const sc = SCENARIOS[select.value];
    note.textContent = sc.note;
    status.textContent = sc.title;
    status.className = "viz-status";
    scene?.setup(sc);
    table.innerHTML = `<div class="table-wrap"><table><thead><tr><th>n</th>${Array.from({ length: N }, (_, i) => `<th class="c">${i + 1}</th>`).join("")}</tr></thead><tbody>
      <tr><th>Cek</th>${Array.from({ length: N }, (_, i) => `<td class="c mono" style="font-size:.78rem;white-space:nowrap">${escapeHtml(sc.detail(i + 1))}</td>`).join("")}</tr>
      <tr><th>P(n)</th>${Array.from({ length: N }, (_, i) => { const v = sc.P(i + 1); return `<td class="c mono" style="color:var(${v ? "--ok" : "--bad"});font-weight:700">${v ? "T" : "F"}</td>`; }).join("")}</tr>
      </tbody></table></div>`;
  }

  async function play() {
    if (busy || !scene) return;
    busy = true; btn.disabled = true;
    const sc = SCENARIOS[select.value];
    status.textContent = `Mendorong domino ${sc.start} (basis)…`;
    const last = await scene.play(sc, 520, (n) => { status.textContent = `Domino ${n} jatuh: P(${n}) terbukti`; });
    if (last === null) {
      status.textContent = `Basis P(${sc.start}) salah: domino pertama tidak bisa didorong. Tidak ada yang terbukti.`;
      status.className = "viz-status reject";
    } else if (last === N) {
      status.textContent = `Semua domino dari ${sc.start} sampai ${N} jatuh (dan seterusnya tanpa batas).`;
      status.className = "viz-status accept";
    } else {
      status.textContent = `Rantai berhenti: P(${last}) → P(${last + 1}) gagal. Hanya n = ${sc.start}…${last} yang terbukti.`;
      status.className = "viz-status reject";
    }
    busy = false; btn.disabled = false;
  }

  select.addEventListener("change", show);
  btn.addEventListener("click", play);
  btnReset.addEventListener("click", show);
  show();
}

document.querySelectorAll("[data-domino]").forEach(mount);
