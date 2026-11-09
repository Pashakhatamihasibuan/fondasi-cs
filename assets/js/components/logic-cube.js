// Logika proposisional: parser rumus, tabel kebenaran, dan "kubus kebenaran" 3D.
// Setiap variabel menjadi satu sumbu; setiap sudut kubus adalah satu baris tabel kebenaran.

import * as THREE from "three";
import { OrbitControls } from "three/addons/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/CSS2DRenderer.js";
import { cssVar, escapeHtml, prefersReducedMotion } from "../app.js";
import { webglAvailable } from "../viz/automaton3d.js";

/* ===================== parser ===================== */
// Tata bahasa (presedensi dari rendah ke tinggi):
//   iff  := imp ( "↔" imp )*
//   imp  := or ( "→" imp )?          (asosiatif kanan)
//   or   := xor ( "∨" xor )*
//   xor  := and ( "⊕" and )*
//   and  := not ( "∧" not )*
//   not  := "¬" not | atom
//   atom := var | "T" | "F" | "(" iff ")"

const TOKENS = [
  [/^(<->|<=>|↔|iff\b)/, "↔"],
  [/^(->|=>|→)/, "→"],
  [/^(\|\||\||∨|\bor\b|\batau\b)/, "∨"],
  [/^(&&|&|∧|\band\b|\bdan\b)/, "∧"],
  [/^(\^|⊕|\bxor\b)/, "⊕"],
  [/^(!|~|¬|\bnot\b|\bbukan\b)/, "¬"],
  [/^\(/, "("],
  [/^\)/, ")"],
  [/^(T|1|⊤)\b/, "T"],
  [/^(F|0|⊥)\b/, "F"],
  [/^[a-z]\b/, "var"],
];

function tokenize(src) {
  const out = [];
  let s = src.trim();
  while (s.length) {
    if (/^\s/.test(s)) { s = s.trimStart(); continue; }
    let hit = false;
    for (const [re, type] of TOKENS) {
      const m = s.match(re);
      if (m) {
        out.push(type === "var" ? { t: "var", v: m[0] } : { t: type });
        s = s.slice(m[0].length);
        hit = true;
        break;
      }
    }
    if (!hit) throw new Error(`Tidak mengenali "${s[0]}". Variabel harus satu huruf kecil (p, q, r, s); operator: ¬ ∧ ∨ → ↔ ⊕ atau ~ & | -> <-> ^.`);
  }
  return out;
}

export function parse(src) {
  const toks = tokenize(src);
  if (!toks.length) throw new Error("Rumus masih kosong.");
  let i = 0;
  const peek = () => toks[i]?.t;
  const eat = (t) => { if (peek() !== t) throw new Error(`Diharapkan "${t}" di posisi ${i + 1}.`); i++; };
  const bin = (op, a, b) => ({ op, a, b });
  function iff() { let n = imp(); while (peek() === "↔") { i++; n = bin("↔", n, imp()); } return n; }
  function imp() { const n = or(); if (peek() === "→") { i++; return bin("→", n, imp()); } return n; }
  function or() { let n = xor(); while (peek() === "∨") { i++; n = bin("∨", n, xor()); } return n; }
  function xor() { let n = and(); while (peek() === "⊕") { i++; n = bin("⊕", n, and()); } return n; }
  function and() { let n = not(); while (peek() === "∧") { i++; n = bin("∧", n, not()); } return n; }
  function not() { if (peek() === "¬") { i++; return { op: "¬", a: not() }; } return atom(); }
  function atom() {
    const t = toks[i];
    if (!t) throw new Error("Rumus berakhir terlalu cepat. Ada operator atau kurung yang belum lengkap?");
    if (t.t === "var") { i++; return { v: t.v }; }
    if (t.t === "T" || t.t === "F") { i++; return { c: t.t === "T" }; }
    if (t.t === "(") { i++; const n = iff(); eat(")"); return n; }
    throw new Error(`Simbol "${t.t}" tidak boleh muncul di posisi ${i + 1}.`);
  }
  const tree = iff();
  if (i < toks.length) throw new Error(`Ada sisa setelah posisi ${i}: periksa kurung atau operator yang hilang.`);
  return tree;
}

export function evaluate(n, env) {
  if ("v" in n) return env[n.v];
  if ("c" in n) return n.c;
  const a = evaluate(n.a, env);
  if (n.op === "¬") return !a;
  const b = evaluate(n.b, env);
  switch (n.op) {
    case "∧": return a && b;
    case "∨": return a || b;
    case "⊕": return a !== b;
    case "→": return !a || b;
    case "↔": return a === b;
  }
}

export function vars(n, acc = new Set()) {
  if ("v" in n) acc.add(n.v);
  if (n.a) vars(n.a, acc);
  if (n.b) vars(n.b, acc);
  return acc;
}

const PREC = { "↔": 1, "→": 2, "∨": 3, "⊕": 4, "∧": 5, "¬": 6 };
export function show(n, parent = 0) {
  if ("v" in n) return n.v;
  if ("c" in n) return n.c ? "T" : "F";
  const p = PREC[n.op];
  const s = n.op === "¬" ? `¬${show(n.a, p)}` : `${show(n.a, p)} ${n.op} ${show(n.b, p)}`;
  return p < parent || (p === parent && n.op !== "¬") ? `(${s})` : s;
}

/** Subrumus dalam urutan pasca-urut (tanpa variabel), untuk kolom bantu tabel. */
function subformulas(n, out = []) {
  if ("v" in n || "c" in n) return out;
  subformulas(n.a, out);
  if (n.b) subformulas(n.b, out);
  const s = show(n);
  if (!out.some((x) => x.s === s)) out.push({ s, n });
  return out;
}

/** Semua penugasan dalam urutan tabel kebenaran baku (T dulu). */
export function assignments(vs) {
  const rows = [];
  const k = vs.length;
  for (let m = 0; m < 2 ** k; m++) {
    const env = {};
    vs.forEach((v, j) => { env[v] = !((m >> (k - 1 - j)) & 1); });
    rows.push(env);
  }
  return rows;
}

export function classify(n, vs) {
  const vals = assignments(vs).map((e) => evaluate(n, e));
  if (vals.every(Boolean)) return "tautologi";
  if (!vals.some(Boolean)) return "kontradiksi";
  return "satisfiable";
}

const tf = (b) => (b ? "T" : "F");

/* ===================== kubus 3D ===================== */
class TruthCube {
  constructor(stage) {
    this.stage = stage;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    this.camera.position.set(5.2, 4.2, 6.4);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.domElement.setAttribute("aria-hidden", "true");
    stage.appendChild(this.renderer.domElement);
    this.labels = new CSS2DRenderer();
    Object.assign(this.labels.domElement.style, { position: "absolute", inset: "0", pointerEvents: "none" });
    stage.appendChild(this.labels.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = false;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 20;
    this.controls.autoRotate = !prefersReducedMotion();
    this.controls.autoRotateSpeed = 0.6;
    this.renderer.domElement.addEventListener("pointerdown", () => (this.controls.autoRotate = false));
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.5));
    const dl = new THREE.DirectionalLight(0xffffff, 1.3);
    dl.position.set(4, 8, 5);
    this.scene.add(dl);
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.visible = true;
    new ResizeObserver(() => this.resize()).observe(stage);
    new IntersectionObserver(([e]) => (this.visible = e.isIntersecting)).observe(stage);
    document.addEventListener("theme-change", () => this.last && this.draw(...this.last));
    this.resize();
    const loop = (t) => {
      requestAnimationFrame(loop);
      if (!this.visible) return;
      if (this.pulse && !prefersReducedMotion()) this.pulse.forEach((m) => m.scale.setScalar(1 + 0.08 * Math.sin(t / 260)));
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
      this.labels.render(this.scene, this.camera);
    };
    requestAnimationFrame(loop);
  }

  resize() {
    const w = this.stage.clientWidth, h = this.stage.clientHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.labels.setSize(w, h);
  }

  clear() {
    this.group.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); if (o.isCSS2DObject) o.element.remove(); });
    this.scene.remove(this.group);
    this.group = new THREE.Group();
    this.scene.add(this.group);
  }

  label(text, pos, cls = "viz-label edge") {
    const el = document.createElement("div");
    el.className = cls;
    el.textContent = text;
    const o = new CSS2DObject(el);
    o.position.copy(pos);
    this.group.add(o);
    return el;
  }

  /**
   * vs: daftar variabel (≤ 4). value(env) -> "on" | "off" | "diff".
   * Variabel ke-4 menggambar dua kubus berdampingan (s = T dan s = F).
   */
  draw(vs, value) {
    this.last = [vs, value];
    this.clear();
    this.pulse = [];
    this.scene.background = new THREE.Color(cssVar("--viz-bg"));
    const C = {
      on: new THREE.Color(cssVar("--ok")), off: new THREE.Color(cssVar("--viz-node")),
      diff: new THREE.Color(cssVar("--bad")), edge: new THREE.Color(cssVar("--viz-edge")),
    };
    const S = 2.4; // panjang sisi kubus
    const axes = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, -1)];
    const cubes = vs.length === 4 ? [{ off: -2.4, s: true }, { off: 2.4, s: false }] : [{ off: 0 }];
    const base = vs.slice(0, 3);
    const center = new THREE.Vector3(...[0, 1, 2].map((d) => (d < base.length ? S / 2 : 0)));
    center.z = -center.z;

    cubes.forEach((cube) => {
      const shift = new THREE.Vector3(cube.off, 0, 0).sub(center);
      const pos = (env) => {
        const p = new THREE.Vector3();
        base.forEach((v, d) => { if (env[v]) p.addScaledVector(axes[d], S); });
        return p.add(shift);
      };
      const envs = assignments(base).map((e) => (cube.s === undefined ? e : { ...e, [vs[3]]: cube.s }));
      // rusuk: hubungkan penugasan yang berbeda di tepat satu variabel
      const lineMat = new THREE.LineBasicMaterial({ color: C.edge, transparent: true, opacity: 0.7 });
      envs.forEach((e) => base.forEach((v) => {
        if (!e[v]) return;
        const f = { ...e, [v]: false };
        this.group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([pos(e), pos(f)]), lineMat));
      }));
      envs.forEach((e) => {
        const state = value(e);
        const mat = new THREE.MeshStandardMaterial({
          color: C[state], roughness: 0.35,
          emissive: state === "off" ? new THREE.Color(0) : C[state], emissiveIntensity: state === "off" ? 0 : 0.45,
        });
        const m = new THREE.Mesh(new THREE.SphereGeometry(state === "off" ? 0.22 : 0.3, 32, 20), mat);
        m.position.copy(pos(e));
        this.group.add(m);
        if (state !== "off") this.pulse.push(m);
        const tag = vs.map((v) => tf(e[v])).join("");
        this.label(tag, pos(e).add(new THREE.Vector3(0, 0.48, 0)), "viz-label state");
      });
      // label sumbu
      base.forEach((v, d) => {
        const end = shift.clone().addScaledVector(axes[d], S + 0.95).add(new THREE.Vector3(0, -0.45, 0));
        this.label(`${v} = T →`, end, "viz-label");
      });
      if (cube.s !== undefined) this.label(`${vs[3]} = ${tf(cube.s)}`, shift.clone().add(new THREE.Vector3(S / 2, -0.9, 0)), "viz-label");
    });
    const span = vs.length === 4 ? 13 : vs.length === 3 ? 8.5 : 7;
    this.camera.position.setLength(span);
  }
}

/* ===================== UI ===================== */
function tableHtml(tree, vs, tree2) {
  const subs = subformulas(tree);
  const cols = subs.map((x) => x.s);
  const rows = assignments(vs);
  const head = [...vs, ...cols, ...(tree2 ? [show(tree2)] : [])].map((h, i) => `<th class="c mono${i === vs.length + cols.length - 1 ? " final" : ""}">${escapeHtml(h)}</th>`).join("");
  const body = rows.map((env) => {
    const main = evaluate(tree, env);
    const other = tree2 ? evaluate(tree2, env) : null;
    const cells = [
      ...vs.map((v) => `<td class="c mono">${tf(env[v])}</td>`),
      ...subs.map((x, i) => {
        const val = evaluate(x.n, env);
        const fin = i === subs.length - 1;
        return `<td class="c mono${fin ? (val ? " t" : " f") : ""}">${tf(val)}</td>`;
      }),
      ...(tree2 ? [`<td class="c mono ${other === main ? "t" : "x"}">${tf(other)}</td>`] : []),
    ];
    return `<tr>${cells.join("")}</tr>`;
  }).join("");
  return `<div class="table-wrap"><table class="truth"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function mount(root) {
  const $ = (s) => root.querySelector(s);
  const inp = $("[data-formula]"), inp2 = $("[data-formula2]"), mode = $("[data-mode]");
  const out = $("[data-table]"), msg = $("[data-msg]"), status = $("[data-status]");
  const stage = $(".viz-stage");
  let cube = null;
  if (webglAvailable()) { try { cube = new TruthCube(stage); } catch (e) { console.warn(e); } }
  if (!cube) stage.innerHTML = '<p class="viz-fallback">Kubus 3D butuh WebGL. Tabel kebenaran di bawah tetap lengkap.</p>';

  function render() {
    const eq = mode?.value === "ekuivalen";
    if (inp2) inp2.closest(".viz-row").hidden = !eq;
    try {
      const t1 = parse(inp.value);
      const t2 = eq ? parse(inp2.value) : null;
      const vs = [...new Set([...vars(t1), ...(t2 ? vars(t2) : [])])].sort();
      if (vs.length > 4) throw new Error("Maksimal 4 variabel berbeda (p, q, r, s) agar kubus tetap terbaca.");
      msg.textContent = "";
      msg.className = "";
      out.innerHTML = tableHtml(t1, vs, t2);
      if (eq) {
        const same = assignments(vs).every((e) => evaluate(t1, e) === evaluate(t2, e));
        status.textContent = same ? `EKUIVALEN: ${show(t1)} ≡ ${show(t2)}` : `TIDAK ekuivalen: sudut merah adalah baris yang berbeda`;
        status.className = "viz-status " + (same ? "accept" : "reject");
        cube?.draw(vs, (e) => (evaluate(t1, e) !== evaluate(t2, e) ? "diff" : evaluate(t1, e) ? "on" : "off"));
      } else {
        const k = classify(t1, vs);
        const n = assignments(vs).filter((e) => evaluate(t1, e)).length;
        status.textContent = k === "tautologi" ? `TAUTOLOGI: benar di semua ${2 ** vs.length} baris`
          : k === "kontradiksi" ? `KONTRADIKSI: salah di semua baris`
          : `SATISFIABLE: benar di ${n} dari ${2 ** vs.length} baris`;
        status.className = "viz-status " + (k === "tautologi" ? "accept" : k === "kontradiksi" ? "reject" : "");
        cube?.draw(vs, (e) => (evaluate(t1, e) ? "on" : "off"));
      }
    } catch (err) {
      msg.textContent = err.message;
      msg.className = "form-error";
      status.textContent = "Rumus belum valid";
      status.className = "viz-status reject";
    }
  }

  let timer;
  [inp, inp2].forEach((el) => el?.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(render, 250); }));
  mode?.addEventListener("change", render);
  // Papan simbol: sisipkan operator di posisi kursor pada kolom yang terakhir difokus.
  let lastField = inp;
  [inp, inp2].forEach((el) => el?.addEventListener("focus", () => (lastField = el)));
  root.addEventListener("click", (e) => {
    const k = e.target.closest("[data-insert]");
    if (!k) return;
    const f = lastField, sym = k.dataset.insert;
    const a = f.selectionStart ?? f.value.length, b = f.selectionEnd ?? a;
    f.value = f.value.slice(0, a) + sym + f.value.slice(b);
    f.focus();
    f.setSelectionRange(a + sym.length, a + sym.length);
    render();
  });
  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-set]");
    if (!b) return;
    const [m, f1, f2] = JSON.parse(b.dataset.set);
    if (mode) mode.value = m;
    inp.value = f1;
    if (inp2 && f2) inp2.value = f2;
    render();
  });
  // Tombol di luar kartu (bagian latihan) juga bisa memuat rumus ke sini.
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-logic-load]");
    if (!b || root.contains(b)) return;
    const [m, f1, f2] = JSON.parse(b.dataset.logicLoad);
    if (mode) mode.value = m;
    inp.value = f1;
    if (inp2 && f2) inp2.value = f2;
    render();
    stage.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
  });
  render();
}

document.querySelectorAll("[data-logic]").forEach(mount);
