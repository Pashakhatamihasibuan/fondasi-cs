// Simulator NFA: banyak state aktif sekaligus, transisi ε, dan konversi ke DFA
// (konstruksi subset) yang hasilnya dimuat ke simulator DFA kedua.

import { AutomatonViz, webglAvailable, transitionTableHtml, targets } from "../viz/automaton3d.js";
import { mountDfaSim } from "./dfa-sim.js";
import { escapeHtml } from "../app.js";

const EPS = "ε";

export const NFA_EXAMPLES = {
  "diakhiri-01": {
    name: "Diakhiri '01' (NFA)",
    desc: "Bandingkan dengan DFA di Modul 1. NFA cukup 'menebak' kapan akhiran 01 dimulai: di q0 saat membaca 0, mesin bercabang. Satu cabang tetap di q0, cabang lain mencoba q1.",
    alphabet: ["0", "1"], states: ["q0", "q1", "q2"], start: "q0", accept: ["q2"], epsilon: false,
    delta: { q0: { 0: ["q0", "q1"], 1: ["q0"] }, q1: { 1: ["q2"] }, q2: {} },
    samples: ["1101", "0110", "001"],
  },
  "sipser-n1": {
    name: "Sipser N₁: memuat 101 atau 11",
    desc: "Contoh 1.30 di Sipser. Perhatikan transisi ε dari q2 ke q3: setiap kali token tiba di q2, ia langsung bercabang ke q3 tanpa membaca simbol.",
    alphabet: ["0", "1"], states: ["q1", "q2", "q3", "q4"], start: "q1", accept: ["q4"], epsilon: true,
    delta: { q1: { 0: ["q1"], 1: ["q1", "q2"] }, q2: { 0: ["q3"], ε: ["q3"] }, q3: { 1: ["q4"] }, q4: { 0: ["q4"], 1: ["q4"] } },
    samples: ["010110", "1001", "0110", "100"],
  },
  "kelipatan-2-atau-3": {
    name: "Panjang kelipatan 2 atau 3",
    desc: "Contoh 1.33 di Sipser, alfabet {0}. Dari state awal s, transisi ε 'membelah' mesin menjadi dua: satu menghitung mod 2, satu menghitung mod 3. String diterima jika salah satunya sampai di state penerima.",
    alphabet: ["0"], states: ["s", "a0", "a1", "b0", "b1", "b2"], start: "s", accept: ["a0", "b0"], epsilon: true,
    delta: { s: { ε: ["a0", "b0"] }, a0: { 0: ["a1"] }, a1: { 0: ["a0"] }, b0: { 0: ["b1"] }, b1: { 0: ["b2"] }, b2: { 0: ["b0"] } },
    samples: ["0000", "000", "00000", "000000"],
  },
  "ketiga-dari-belakang": {
    name: "Simbol ke-3 dari belakang adalah 1",
    desc: "Cukup 4 state: tebak bahwa 1 yang sedang dibaca adalah simbol ke-3 dari belakang, lalu pastikan tepat dua simbol lagi tersisa. DFA setaranya butuh 8 state (Latihan 7 Modul 1). Coba konversikan di bawah.",
    alphabet: ["0", "1"], states: ["q0", "q1", "q2", "q3"], start: "q0", accept: ["q3"], epsilon: false,
    delta: { q0: { 0: ["q0"], 1: ["q0", "q1"] }, q1: { 0: ["q2"], 1: ["q2"] }, q2: { 0: ["q3"], 1: ["q3"] }, q3: {} },
    samples: ["0100", "1011", "111", "0011"],
  },
};

/** ε-closure: semua state yang terjangkau dari S hanya lewat transisi ε. */
export function closure(nfa, S) {
  const out = new Set(S);
  const stack = [...S];
  while (stack.length) {
    const q = stack.pop();
    for (const r of targets(nfa, q, EPS)) if (!out.has(r)) { out.add(r); stack.push(r); }
  }
  return [...out].sort((a, b) => nfa.states.indexOf(a) - nfa.states.indexOf(b));
}

/** Pasangan (from, to) lewat ε yang dipakai untuk membentuk closure dari `S`. */
function closureMoves(nfa, S) {
  const seen = new Set(S), moves = [], stack = [...S];
  while (stack.length) {
    const q = stack.pop();
    for (const r of targets(nfa, q, EPS)) {
      moves.push({ from: q, to: r });
      if (!seen.has(r)) { seen.add(r); stack.push(r); }
    }
  }
  return moves;
}

export const setName = (S) => (S.length ? `{${S.join(",")}}` : "∅");

/** Konstruksi subset (Sipser Teorema 1.39), hanya state yang terjangkau. */
export function subsetConstruction(nfa) {
  const start = closure(nfa, [nfa.start]);
  const rows = [];
  const seen = new Map([[setName(start), start]]);
  const queue = [start];
  const delta = {};
  while (queue.length) {
    const S = queue.shift();
    const name = setName(S);
    delta[name] = {};
    const row = { name, set: S, accept: S.some((q) => nfa.accept.includes(q)), next: {} };
    for (const a of nfa.alphabet) {
      const moved = [...new Set(S.flatMap((q) => targets(nfa, q, a)))];
      const T = closure(nfa, moved);
      const tn = setName(T);
      delta[name][a] = tn;
      row.next[a] = tn;
      if (!seen.has(tn)) { seen.set(tn, T); queue.push(T); }
    }
    rows.push(row);
  }
  const states = [...seen.keys()];
  return {
    rows,
    dfa: {
      name: "DFA hasil konversi",
      desc: `DFA hasil konstruksi subset: ${states.length} state yang terjangkau dari ${setName(start)}. Setiap state adalah himpunan state NFA.`,
      alphabet: nfa.alphabet, states, start: setName(start),
      accept: rows.filter((r) => r.accept).map((r) => r.name), delta, samples: nfa.samples,
    },
  };
}

export function parseNfa(text) {
  const errors = [];
  let alphabet = null, start = null, accept = [];
  const states = [], delta = {};
  let epsilon = false;
  const add = (q) => { if (!states.includes(q)) { states.push(q); delta[q] = delta[q] || {}; } };
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.replace(/#.*/, "").trim();
    if (!line) return;
    const m = line.match(/^(alfabet|mulai|terima)\s*:\s*(.*)$/i);
    if (m) {
      const v = m[2].split(/[\s,]+/).filter(Boolean);
      const k = m[1].toLowerCase();
      if (k === "alfabet") alphabet = v;
      if (k === "mulai") start = v[0] || null;
      if (k === "terima") accept = v;
      return;
    }
    const p = line.split(/\s+/);
    if (p.length !== 3) { errors.push(`Baris ${i + 1}: format transisi harus "state simbol tujuan".`); return; }
    let [q, a, r] = p;
    if (a === "e" || a === "eps" || a === EPS) { a = EPS; epsilon = true; }
    add(q); add(r);
    delta[q][a] = [...new Set([...(delta[q][a] || []), r])];
  });
  if (!alphabet?.length) errors.push('Tuliskan alfabet, contoh: "alfabet: 0 1".');
  if (alphabet?.includes("e")) errors.push('Huruf "e" dicadangkan untuk ε. Pakai simbol lain di alfabet.');
  if (!start) errors.push('Tuliskan state awal, contoh: "mulai: q0".');
  if (start) add(start);
  accept.forEach(add);
  if (states.length > 7) errors.push("Maksimal 7 state agar visualisasi dan hasil konversinya tetap terbaca.");
  if (alphabet) for (const q of states) for (const a of Object.keys(delta[q])) if (a !== EPS && !alphabet.includes(a)) errors.push(`Simbol "${a}" dari ${q} tidak ada di alfabet.`);
  if (errors.length) throw new Error(errors.join("\n"));
  return { name: "NFA buatanmu", desc: "NFA dari editor.", alphabet, states, start, accept, delta, epsilon, samples: [""] };
}

export function nfaToText(n) {
  const lines = [`alfabet: ${n.alphabet.join(" ")}`, `mulai: ${n.start}`, `terima: ${n.accept.join(" ")}`];
  for (const q of n.states) for (const [a, rs] of Object.entries(n.delta[q] || {})) for (const r of rs) lines.push(`${q} ${a === EPS ? "e" : a} ${r}`);
  return lines.join("\n");
}

function mountNfaSim(root) {
  const $ = (s) => root.querySelector(s);
  const stage = $(".viz-stage"), select = $("[data-example]"), desc = $("[data-desc]");
  const input = $("[data-input]"), btnRun = $("[data-run]"), btnStep = $("[data-step]"), btnReset = $("[data-reset]");
  const speed = $("[data-speed]"), tape = $("[data-tape]"), status = $("[data-status]"), trace = $("[data-trace]");
  const samples = $("[data-samples]"), live = $("[data-live]"), formal = $("[data-formal]");
  const editor = $("[data-editor]"), editorMsg = $("[data-editor-msg]"), btnApply = $("[data-apply]");
  const subsetOut = document.querySelector(root.dataset.subsetTarget || "#subset-out");
  const dfaTarget = document.querySelector(root.dataset.dfaTarget || "#subset-dfa");

  let viz = null;
  if (webglAvailable()) { try { viz = new AutomatonViz(stage); } catch (e) { console.warn(e); } }
  let dfaApi = null;

  const st = { nfa: null, word: "", pos: 0, active: [], busy: false, playing: false, finished: false, path: [] };
  const setStatus = (t, mood = "") => { status.textContent = t; status.className = "viz-status" + (mood ? " " + mood : ""); };

  function renderSubset() {
    if (!subsetOut) return;
    const { rows, dfa } = subsetConstruction(st.nfa);
    const head = st.nfa.alphabet.map((a) => `<th class="c">${escapeHtml(a)}</th>`).join("");
    subsetOut.innerHTML = `
      <p>Mulai dari <span class="math">E({${escapeHtml(st.nfa.start)}}) = ${escapeHtml(dfa.start)}</span>. Hasilnya <strong>${rows.length} state</strong> (dari ${2 ** st.nfa.states.length} subset yang mungkin, hanya yang terjangkau ditulis).</p>
      <div class="table-wrap"><table><thead><tr><th>State DFA (himpunan)</th>${head}<th>Penerima?</th></tr></thead><tbody>
      ${rows.map((r) => `<tr><th class="mono">${r.name === dfa.start ? "→ " : ""}${escapeHtml(r.name)}</th>${st.nfa.alphabet.map((a) => `<td class="c mono">${escapeHtml(r.next[a])}</td>`).join("")}<td>${r.accept ? "ya, memuat state penerima NFA" : "tidak"}</td></tr>`).join("")}
      </tbody></table></div>`;
    if (dfaTarget) {
      if (!dfaApi) dfaApi = mountDfaSim(dfaTarget);
      dfaApi.load(dfa);
    }
  }

  function load(n) {
    st.nfa = n;
    if (desc) desc.textContent = n.desc;
    if (viz) viz.load(n);
    else stage.innerHTML = `<div class="viz-fallback"><p>Browser ini tidak mendukung WebGL. Simulator tetap berjalan dengan tabel transisi di bawah.</p></div>`;
    if (formal) formal.innerHTML = `<p class="math">N = (Q, Σ, δ, q₀, F), δ : Q × Σ<sub>ε</sub> → 𝒫(Q)</p>${transitionTableHtml(n)}<p class="muted" style="font-size:.85rem">Sel berisi himpunan state tujuan; ∅ atau – berarti cabang itu mati.</p>`;
    if (samples) samples.innerHTML = n.samples.map((s) => `<button type="button" class="btn btn-sm mono" data-sample="${escapeHtml(s)}">${s === "" ? "ε (kosong)" : escapeHtml(s)}</button>`).join("");
    if (editor && n.name !== "NFA buatanmu") editor.value = nfaToText(n);
    input.value = n.samples[0] ?? "";
    reset();
    renderSubset();
  }

  function valid() {
    const bad = [...input.value].find((c) => !st.nfa.alphabet.includes(c));
    if (bad) { setStatus(`Simbol "${bad}" tidak ada di alfabet {${st.nfa.alphabet.join(", ")}}`, "reject"); return false; }
    return true;
  }
  function renderTape() {
    const w = [...st.word];
    tape.innerHTML = w.length
      ? w.map((c, i) => `<span class="cell ${i < st.pos ? "read" : ""} ${i === st.pos ? "head" : ""}">${escapeHtml(c)}</span>`).join("")
      : `<span class="empty">ε, string kosong: diterima jika closure state awal memuat state penerima.</span>`;
  }
  const renderTrace = () => { trace.textContent = st.path.map((p, i) => (i === 0 ? setName(p.set) : ` —${p.sym}→ ${setName(p.set)}`)).join(""); };
  function updateButtons() {
    btnStep.disabled = st.busy || st.finished;
    btnRun.disabled = st.busy && !st.playing;
    btnRun.textContent = st.playing ? "Jeda" : "Jalankan";
    input.disabled = st.playing || st.busy;
  }

  function reset() {
    st.playing = st.busy = st.finished = false;
    st.word = input.value; st.pos = 0;
    st.active = closure(st.nfa, [st.nfa.start]);
    st.path = [{ set: st.active }];
    if (viz) viz.reset(st.active);
    renderTape(); renderTrace();
    if (valid()) setStatus(`Aktif: ${setName(st.active)} · dibaca 0/${st.word.length}`);
    updateButtons();
  }

  function finish() {
    st.finished = true;
    const ok = st.active.some((q) => st.nfa.accept.includes(q));
    const msg = ok
      ? `DITERIMA · ada cabang yang berakhir di state penerima (${st.active.filter((q) => st.nfa.accept.includes(q)).join(", ")})`
      : st.active.length ? `DITOLAK · tidak ada cabang aktif yang berada di state penerima` : `DITOLAK · semua cabang mati`;
    setStatus(msg, ok ? "accept" : "reject");
    if (viz) viz.setActiveSet(st.active, ok ? "accept" : "reject");
    if (live) live.textContent = `String "${st.word || "ε"}" ${ok ? "diterima" : "ditolak"}.`;
    st.playing = false;
    updateButtons();
  }

  async function step() {
    if (st.busy) return;
    if (!valid()) { st.playing = false; updateButtons(); return; }
    if (st.pos >= st.word.length) { finish(); return; }
    st.busy = true; updateButtons();
    const a = st.word[st.pos];
    const ms = Number(speed?.value || 700);
    const moves = st.active.flatMap((q) => targets(st.nfa, q, a).map((r) => ({ from: q, to: r })));
    const moved = [...new Set(moves.map((m) => m.to))];
    if (viz) await viz.animateMoves(moves, moved, ms);
    const after = closure(st.nfa, moved);
    if (viz && after.length > moved.length) {
      await viz.animateMoves(closureMoves(st.nfa, moved), after, ms * 0.6);
    }
    st.active = after;
    st.pos++;
    st.path.push({ sym: a, set: after });
    st.busy = false;
    renderTape(); renderTrace();
    setStatus(after.length ? `Aktif: ${setName(after)} · dibaca ${st.pos}/${st.word.length}` : `Semua cabang mati · dibaca ${st.pos}/${st.word.length}`, after.length ? "" : "reject");
    if (viz) viz.setActiveSet(after);
    if (st.pos >= st.word.length || !after.length) finish();
    updateButtons();
  }

  async function play() {
    if (st.playing) { st.playing = false; updateButtons(); return; }
    if (st.finished || st.pos > 0 || st.word !== input.value) reset();
    if (!valid()) return;
    st.playing = true; updateButtons();
    if (!st.word.length) { finish(); return; }
    while (st.playing && !st.finished) {
      await step();
      if (st.playing && !st.finished) await new Promise((r) => setTimeout(r, 140));
    }
    updateButtons();
  }

  select?.addEventListener("change", () => load(NFA_EXAMPLES[select.value]));
  btnStep.addEventListener("click", step);
  btnRun.addEventListener("click", play);
  btnReset.addEventListener("click", reset);
  input.addEventListener("input", () => { if (!st.playing) reset(); });
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); play(); } });
  samples?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-sample]");
    if (!b) return;
    input.value = b.dataset.sample; reset(); play();
  });
  btnApply?.addEventListener("click", () => {
    try {
      const n = parseNfa(editor.value);
      editorMsg.className = "form-ok";
      editorMsg.textContent = `NFA valid: ${n.states.length} state${n.epsilon ? ", memakai transisi ε" : ""}. Visualisasi dan tabel konversi sudah diperbarui.`;
      if (select) select.value = "";
      load(n);
      stage.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      editorMsg.className = "form-error";
      editorMsg.textContent = err.message;
    }
  });
  if (editor) {
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-load-nfa]");
      if (!b) return;
      editor.value = b.previousElementSibling.textContent.trim();
      editor.closest("details")?.setAttribute("open", "");
      btnApply.click();
    });
  }

  load(NFA_EXAMPLES[select?.value] || NFA_EXAMPLES["diakhiri-01"]);
}

document.querySelectorAll("[data-nfa-sim]").forEach(mountNfaSim);
