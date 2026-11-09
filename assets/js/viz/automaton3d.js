// Visualisasi 3D sebuah automata (DFA) dengan Three.js.
// State = bola, transisi = tabung melengkung + panah, state penerima = cincin ganda,
// token bercahaya berjalan di sepanjang transisi saat input dibaca.

import * as THREE from "three";
import { OrbitControls } from "three/addons/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/CSS2DRenderer.js";
import { cssVar, prefersReducedMotion, escapeHtml } from "../app.js";

const UP = new THREE.Vector3(0, 1, 0);
const NODE_R = 0.42;

export function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch { return false; }
}

export class AutomatonViz {
  constructor(stage) {
    this.stage = stage;
    this.nodes = new Map();   // id -> { mesh, ring, pos, label }
    this.edges = new Map();   // "a->b" -> { curve, tube, cone, label, symbols }
    this.visible = true;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    stage.appendChild(this.renderer.domElement);
    this.renderer.domElement.setAttribute("aria-hidden", "true");

    this.labels = new CSS2DRenderer();
    Object.assign(this.labels.domElement.style, { position: "absolute", inset: "0", pointerEvents: "none" });
    stage.appendChild(this.labels.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 30;
    this.controls.enablePan = false;

    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x444466, 1.6));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(4, 10, 6);
    this.scene.add(key);

    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Kumpulan token: DFA memakai satu, NFA bisa memakai banyak sekaligus.
    this.tokenGeo = new THREE.SphereGeometry(0.16, 24, 16);
    this.haloGeo = new THREE.SphereGeometry(0.3, 24, 16);
    this.tokenMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.haloMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, depthWrite: false });
    this.tokens = [];
    this.activeIds = [];

    this.readColors();
    document.addEventListener("theme-change", () => { this.readColors(); this.applyColors(); });

    new ResizeObserver(() => this.resize()).observe(stage);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; }).observe(stage);
    }
    this.resize();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  readColors() {
    this.colors = {
      bg: new THREE.Color(cssVar("--viz-bg")),
      node: new THREE.Color(cssVar("--viz-node")),
      edge: new THREE.Color(cssVar("--viz-edge")),
      accent: new THREE.Color(cssVar("--accent")),
      ok: new THREE.Color(cssVar("--ok")),
      bad: new THREE.Color(cssVar("--bad")),
      ring: new THREE.Color(cssVar("--t-toc")),
    };
  }

  applyColors() {
    this.scene.background = this.colors.bg;
    this.tokenMat.color.copy(this.colors.accent);
    this.haloMat.color.copy(this.colors.accent);
    this.nodes.forEach((n) => {
      n.mesh.material.color.copy(this.colors.node);
      if (n.ring) n.ring.material.color.copy(this.colors.ring);
    });
    this.edges.forEach((e) => this.paintEdge(e, false));
    if (this.startArrow) this.startArrow.children.forEach((m) => m.material?.color.copy(this.colors.edge));
    this.setActiveSet(this.activeIds, this.activeMood);
  }

  token(i) {
    while (this.tokens.length <= i) {
      const t = new THREE.Mesh(this.tokenGeo, this.tokenMat);
      t.add(new THREE.Mesh(this.haloGeo, this.haloMat));
      t.visible = false;
      this.scene.add(t);
      this.tokens.push(t);
    }
    return this.tokens[i];
  }

  resize() {
    const w = this.stage.clientWidth, h = this.stage.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = w + "px";
    this.renderer.domElement.style.height = h + "px";
    this.labels.setSize(w, h);
  }

  loop(t) {
    requestAnimationFrame(this.loop);
    if (!this.visible) return;
    this.controls.update();
    if (!prefersReducedMotion()) {
      const s = 1 + 0.15 * Math.sin(t / 140);
      this.tokens.forEach((tk) => tk.children[0].scale.setScalar(s));
    }
    this.renderer.render(this.scene, this.camera);
    this.labels.render(this.scene, this.camera);
  }

  clear() {
    this.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
    });
    // CSS2DObject menyimpan elemen DOM; buang manual.
    this.group.traverse((o) => { if (o.isCSS2DObject) o.element.remove(); });
    this.scene.remove(this.group);
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.nodes.clear();
    this.edges.clear();
    this.startArrow = null;
    this.activeIds = [];
  }

  /** Bangun scene dari definisi DFA. */
  load(dfa) {
    this.clear();
    this.dfa = dfa;
    const n = dfa.states.length;
    const R = n === 1 ? 0 : Math.max(2.1, n * 0.78);

    // Letakkan state pada lingkaran, start di kiri, berputar searah jarum jam.
    dfa.states.forEach((id, i) => {
      const a = Math.PI - (i / n) * Math.PI * 2;
      // Automata besar diberi ketinggian berselang agar panah tidak saling menumpuk.
      const y = n > 5 ? (i % 2 ? 1.1 : -1.1) : 0;
      const pos = new THREE.Vector3(Math.cos(a) * R, y, -Math.sin(a) * R);
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(NODE_R, 40, 28),
        new THREE.MeshStandardMaterial({ color: this.colors.node, roughness: 0.45, metalness: 0.05, emissive: 0x000000 })
      );
      mesh.position.copy(pos);
      this.group.add(mesh);

      let ring = null;
      if (dfa.accept.includes(id)) {
        ring = new THREE.Mesh(
          new THREE.TorusGeometry(NODE_R + 0.14, 0.035, 12, 64),
          new THREE.MeshStandardMaterial({ color: this.colors.ring, roughness: 0.4 })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.copy(pos);
        this.group.add(ring);
      }

      const el = document.createElement("div");
      el.className = "viz-label state";
      el.textContent = id;
      const label = new CSS2DObject(el);
      label.position.copy(pos);
      this.group.add(label);

      this.nodes.set(id, { mesh, ring, pos, el });
    });

    const center = new THREE.Vector3();
    const outward = (p) => {
      const d = p.clone().sub(center).setY(0);
      return d.lengthSq() < 1e-6 ? new THREE.Vector3(0, 0, -1) : d.normalize();
    };

    // Kelompokkan simbol per pasangan state.
    const pairs = new Map();
    const syms = [...dfa.alphabet, ...(dfa.epsilon ? ["ε"] : [])];
    for (const from of dfa.states) {
      for (const sym of syms) {
        for (const to of targets(dfa, from, sym)) {
          const k = `${from}->${to}`;
          if (!pairs.has(k)) pairs.set(k, { from, to, symbols: [] });
          pairs.get(k).symbols.push(sym);
        }
      }
    }

    pairs.forEach((p, k) => {
      const a = this.nodes.get(p.from).pos, b = this.nodes.get(p.to).pos;
      let curve, labelPos;
      if (p.from === p.to) {
        const d = outward(a);
        const t = new THREE.Vector3().crossVectors(UP, d).normalize();
        const pts = [
          a.clone().addScaledVector(d, NODE_R * 0.75).addScaledVector(t, 0.28).addScaledVector(UP, 0.12),
          a.clone().addScaledVector(d, 1.05).addScaledVector(t, 0.5).addScaledVector(UP, 0.45),
          a.clone().addScaledVector(d, 1.45).addScaledVector(UP, 0.6),
          a.clone().addScaledVector(d, 1.05).addScaledVector(t, -0.5).addScaledVector(UP, 0.45),
          a.clone().addScaledVector(d, NODE_R * 0.95).addScaledVector(t, -0.3).addScaledVector(UP, 0.14),
        ];
        curve = new THREE.CatmullRomCurve3(pts);
        labelPos = a.clone().addScaledVector(d, 1.75).addScaledVector(UP, 0.75);
      } else {
        const dir = b.clone().sub(a);
        const perp = new THREE.Vector3().crossVectors(dir, UP).normalize();
        const bidir = pairs.has(`${p.to}->${p.from}`);
        const bend = bidir ? 0.75 : 0.25;
        const ctrl = a.clone().add(b).multiplyScalar(0.5).addScaledVector(perp, bend).addScaledVector(UP, 0.35);
        const start = a.clone().add(ctrl.clone().sub(a).normalize().multiplyScalar(NODE_R));
        const end = b.clone().add(ctrl.clone().sub(b).normalize().multiplyScalar(NODE_R + 0.02));
        curve = new THREE.QuadraticBezierCurve3(start, ctrl, end);
        labelPos = curve.getPoint(0.5).addScaledVector(UP, 0.28);
      }

      const coneH = 0.26;
      const tipT = 1;
      const tip = curve.getPoint(tipT);
      const tan = curve.getTangent(tipT).normalize();
      // Tabung berhenti sebelum kepala panah.
      const tubePts = curve.getPoints(48).filter((pt) => pt.distanceTo(tip) > coneH * 0.8);
      const tubeCurve = new THREE.CatmullRomCurve3(tubePts);
      const mat = new THREE.MeshStandardMaterial({ color: this.colors.edge, roughness: 0.6 });
      const tube = new THREE.Mesh(new THREE.TubeGeometry(tubeCurve, 48, 0.03, 8, false), mat);
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.1, coneH, 16), mat.clone());
      cone.position.copy(tip).addScaledVector(tan, -coneH / 2);
      cone.quaternion.setFromUnitVectors(UP, tan);
      this.group.add(tube, cone);

      const el = document.createElement("div");
      el.className = "viz-label edge";
      el.textContent = p.symbols.join(", ");
      const label = new CSS2DObject(el);
      label.position.copy(labelPos);
      this.group.add(label);

      this.edges.set(k, { curve, tube, cone, el, symbols: p.symbols });
    });

    // Panah masuk ke state awal.
    const s = this.nodes.get(dfa.start);
    if (s) {
      const d = outward(s.pos);
      const t = new THREE.Vector3().crossVectors(UP, d).normalize();
      const from = s.pos.clone().addScaledVector(d, 0.9).addScaledVector(t, -1.1);
      const to = s.pos.clone().add(from.clone().sub(s.pos).normalize().multiplyScalar(NODE_R + 0.02));
      const dir = to.clone().sub(from);
      const len = dir.length();
      dir.normalize();
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ color: this.colors.edge });
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, len - 0.26, 8), mat);
      shaft.position.copy(from).addScaledVector(dir, (len - 0.26) / 2);
      shaft.quaternion.setFromUnitVectors(UP, dir);
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.26, 16), mat.clone());
      head.position.copy(to).addScaledVector(dir, -0.13);
      head.quaternion.setFromUnitVectors(UP, dir);
      g.add(shaft, head);
      const el = document.createElement("div");
      el.className = "viz-label edge";
      el.textContent = "mulai";
      const lbl = new CSS2DObject(el);
      lbl.position.copy(from).addScaledVector(UP, 0.3);
      g.add(lbl);
      this.group.add(g);
      this.startArrow = g;
    }

    // Kamera menyesuaikan ukuran automata.
    // Jarak kamera dihitung agar seluruh automata (termasuk self-loop) muat di layar.
    const extent = R + 2;
    const aspect = Math.min(1, this.camera.aspect || 1);
    const dist = Math.max(6, (extent / Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2))) / aspect * 1.12);
    this.camera.position.set(0, dist * 0.82, dist * 0.57);
    this.controls.target.set(0, 0, 0);
    this.controls.update();
    this.applyColors();
    this.reset();
  }

  paintEdge(e, on) {
    const c = on ? this.colors.accent : this.colors.edge;
    e.tube.material.color.copy(c);
    e.cone.material.color.copy(c);
    e.el.style.borderColor = on ? "var(--accent)" : "";
    e.el.style.color = on ? "var(--accent)" : "";
  }

  /** mood: "active" | "accept" | "reject" */
  setActive(id, mood = "active") {
    this.setActiveSet(id == null ? [] : [id], mood);
  }

  /** Tandai sekumpulan state aktif (NFA) dan letakkan satu token di atas masing-masing. */
  setActiveSet(ids = [], mood = "active") {
    this.activeIds = [...ids];
    this.activeMood = mood;
    this.nodes.forEach((n, nid) => {
      const on = ids.includes(nid);
      const c = mood === "accept" ? this.colors.ok : mood === "reject" ? this.colors.bad : this.colors.accent;
      n.mesh.material.emissive.copy(on ? c : new THREE.Color(0x000000));
      n.mesh.material.emissiveIntensity = on ? 0.9 : 0;
      n.mesh.scale.setScalar(on ? 1.15 : 1);
      n.el.classList.toggle("on", on);
    });
    this.tokens.forEach((t) => (t.visible = false));
    ids.forEach((nid, i) => {
      const n = this.nodes.get(nid);
      if (!n) return;
      const t = this.token(i);
      t.position.copy(n.pos).addScaledVector(UP, NODE_R + 0.2);
      t.visible = true;
    });
  }

  reset(activeIds) {
    this.edges.forEach((e) => this.paintEdge(e, false));
    this.setActiveSet(activeIds || (this.dfa?.start ? [this.dfa.start] : []), "active");
  }

  /**
   * Animasikan banyak token sekaligus. moves = [{from, to}]; setelah selesai,
   * state aktif menjadi `after` (default: semua tujuan).
   */
  animateMoves(moves, after, duration = 700) {
    this.edges.forEach((x) => this.paintEdge(x, false));
    const list = moves.map((m) => this.edges.get(`${m.from}->${m.to}`)).filter(Boolean);
    list.forEach((e) => this.paintEdge(e, true));
    const final = after || [...new Set(moves.map((m) => m.to))];
    if (!list.length || prefersReducedMotion() || duration <= 0) {
      this.setActiveSet(final);
      return Promise.resolve(final);
    }
    this.setActiveSet([]);
    this.nodes.forEach((n) => n.el.classList.remove("on"));
    const toks = list.map((_, i) => { const t = this.token(i); t.visible = true; return t; });
    return new Promise((resolve) => {
      const t0 = performance.now();
      const tick = (now) => {
        const k = Math.min(1, (now - t0) / duration);
        const eased = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        list.forEach((e, i) => toks[i].position.copy(e.curve.getPoint(eased)).addScaledVector(UP, 0.12));
        if (k < 1) requestAnimationFrame(tick);
        else { this.setActiveSet(final); resolve(final); }
      };
      requestAnimationFrame(tick);
    });
  }

  /** Animasikan token dari state `from` lewat simbol `sym`. Resolve dengan state tujuan. */
  transition(from, sym, duration = 700) {
    const to = this.dfa.delta[from]?.[sym];
    const e = this.edges.get(`${from}->${to}`);
    this.edges.forEach((x) => this.paintEdge(x, false));
    if (!e) return Promise.resolve(to);
    return this.animateMoves([{ from, to }], [to], duration).then(() => to);
  }
}

/** Daftar state tujuan untuk (state, simbol); mendukung DFA (string) dan NFA (array). */
export function targets(m, q, sym) {
  const v = m.delta[q]?.[sym];
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

/** Tabel transisi teks sebagai fallback bila WebGL tidak tersedia. */
export function transitionTableHtml(dfa) {
  const syms = [...dfa.alphabet, ...(dfa.epsilon ? ["ε"] : [])];
  const head = syms.map((s) => `<th class="c">${escapeHtml(s)}</th>`).join("");
  const rows = dfa.states.map((q) => {
    const mark = (q === dfa.start ? "→ " : "") + (dfa.accept.includes(q) ? "* " : "");
    const cells = syms.map((s) => {
      const v = dfa.delta[q]?.[s];
      const txt = v == null ? "–" : Array.isArray(v) ? (v.length ? `{${v.join(", ")}}` : "∅") : v;
      return `<td class="c mono">${escapeHtml(txt)}</td>`;
    }).join("");
    return `<tr><th class="mono">${escapeHtml(mark + q)}</th>${cells}</tr>`;
  }).join("");
  return `<div class="table-wrap"><table><thead><tr><th>δ</th>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}
