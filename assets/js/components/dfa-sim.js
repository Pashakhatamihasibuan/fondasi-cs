// Simulator DFA interaktif: menghubungkan kontrol (contoh, input, langkah, editor)
// dengan visualisasi 3D. Dipasang pada elemen [data-dfa-sim].

import { AutomatonViz, webglAvailable, transitionTableHtml } from "../viz/automaton3d.js";
import { escapeHtml } from "../app.js";

export const EXAMPLES = {
  palang: {
    name: "Palang pintu stasiun",
    desc: "k = tempel kartu, d = dorong palang. Palang terkunci sampai kartu ditempel; setelah didorong, palang kembali terkunci. String diterima bila palang berakhir dalam keadaan terbuka.",
    alphabet: ["k", "d"], states: ["Terkunci", "Terbuka"], start: "Terkunci", accept: ["Terbuka"],
    delta: { Terkunci: { k: "Terbuka", d: "Terkunci" }, Terbuka: { k: "Terbuka", d: "Terkunci" } },
    samples: ["kd", "dk", "kdk", "kkd"],
  },
  "genap-1": {
    name: "Jumlah angka 1 genap",
    desc: "Menerima string biner yang memuat angka 1 sebanyak genap (termasuk nol kali). State hanya perlu 'mengingat' paritas: genap atau ganjil.",
    alphabet: ["0", "1"], states: ["q0", "q1"], start: "q0", accept: ["q0"],
    delta: { q0: { 0: "q0", 1: "q1" }, q1: { 0: "q1", 1: "q0" } },
    samples: ["1001", "111", "", "0110"],
  },
  "akhir-01": {
    name: "Diakhiri '01'",
    desc: "Menerima string biner yang berakhiran 01. State mencatat berapa banyak akhiran '01' yang sudah cocok: belum ada, sudah '0', atau sudah '01'.",
    alphabet: ["0", "1"], states: ["q0", "q1", "q2"], start: "q0", accept: ["q2"],
    delta: { q0: { 0: "q1", 1: "q0" }, q1: { 0: "q1", 1: "q2" }, q2: { 0: "q1", 1: "q0" } },
    samples: ["1101", "0110", "01", "1001"],
  },
  "kelipatan-3": {
    name: "Bilangan biner habis dibagi 3",
    desc: "State rᵢ berarti 'nilai biner yang sudah dibaca, mod 3, sama dengan i'. Membaca bit b mengubah nilai n menjadi 2n + b, jadi dari rᵢ mesin pindah ke state r dengan indeks (2i + b) mod 3.",
    alphabet: ["0", "1"], states: ["r0", "r1", "r2"], start: "r0", accept: ["r0"],
    delta: { r0: { 0: "r0", 1: "r1" }, r1: { 0: "r2", 1: "r0" }, r2: { 0: "r1", 1: "r2" } },
    samples: ["110", "1001", "111", "10010"],
  },
  "memuat-aba": {
    name: "Memuat substring 'aba'",
    desc: "Begitu 'aba' ditemukan, mesin masuk ke q3 dan tidak pernah keluar (state penerima yang menjebak). Perhatikan transisi q2 —b→ q0: setelah 'ab' lalu 'b', tidak ada awalan 'aba' yang tersisa.",
    alphabet: ["a", "b"], states: ["q0", "q1", "q2", "q3"], start: "q0", accept: ["q3"],
    delta: { q0: { a: "q1", b: "q0" }, q1: { a: "q1", b: "q2" }, q2: { a: "q3", b: "q0" }, q3: { a: "q3", b: "q3" } },
    samples: ["bbaba", "abba", "aaba", "abab"],
  },
  "panjang-2": {
    name: "Panjang tepat 2",
    desc: "Contoh dead state (qd): begitu string lebih panjang dari 2, mesin masuk ke state 'mati' yang bukan penerima dan tidak bisa keluar lagi.",
    alphabet: ["a", "b"], states: ["q0", "q1", "q2", "qd"], start: "q0", accept: ["q2"],
    delta: { q0: { a: "q1", b: "q1" }, q1: { a: "q2", b: "q2" }, q2: { a: "qd", b: "qd" }, qd: { a: "qd", b: "qd" } },
    samples: ["ab", "a", "bab", "bb"],
  },
};

export function dfaToText(d) {
  const lines = [`alfabet: ${d.alphabet.join(" ")}`, `mulai: ${d.start}`, `terima: ${d.accept.join(" ")}`];
  for (const q of d.states) for (const s of d.alphabet) lines.push(`${q} ${s} ${d.delta[q][s]}`);
  return lines.join("\n");
}

/** Parse format teks sederhana. Melempar Error berisi daftar masalah. */
export function parseDfa(text) {
  const errors = [];
  let alphabet = null, start = null, accept = [];
  const states = [];
  const delta = {};
  const addState = (q) => { if (!states.includes(q)) { states.push(q); delta[q] = delta[q] || {}; } };

  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.replace(/#.*/, "").trim();
    if (!line) return;
    const m = line.match(/^(alfabet|mulai|terima)\s*:\s*(.*)$/i);
    if (m) {
      const key = m[1].toLowerCase();
      const vals = m[2].split(/[\s,]+/).filter(Boolean);
      if (key === "alfabet") alphabet = vals;
      if (key === "mulai") start = vals[0] || null;
      if (key === "terima") accept = vals;
      return;
    }
    const parts = line.split(/\s+/);
    if (parts.length !== 3) { errors.push(`Baris ${i + 1}: format transisi harus "state simbol state_tujuan".`); return; }
    const [q, s, r] = parts;
    addState(q); addState(r);
    if (delta[q][s] && delta[q][s] !== r) errors.push(`Baris ${i + 1}: δ(${q}, ${s}) sudah didefinisikan ke ${delta[q][s]}. DFA harus deterministik.`);
    delta[q][s] = r;
  });

  if (!alphabet || !alphabet.length) errors.push('Tuliskan alfabet, contoh: "alfabet: 0 1".');
  if (alphabet && alphabet.some((s) => s.length !== 1)) errors.push("Setiap simbol alfabet harus satu karakter.");
  if (!start) errors.push('Tuliskan state awal, contoh: "mulai: q0".');
  if (start) addState(start);
  accept.forEach(addState);
  if (states.length > 8) errors.push("Maksimal 8 state agar visualisasi tetap terbaca.");

  if (alphabet) {
    for (const q of states) {
      for (const s of Object.keys(delta[q])) if (!alphabet.includes(s)) errors.push(`Simbol "${s}" pada transisi dari ${q} tidak ada di alfabet.`);
      const missing = alphabet.filter((s) => !delta[q][s]);
      if (missing.length) errors.push(`State ${q} belum punya transisi untuk: ${missing.join(", ")}. Di DFA setiap state wajib punya tepat satu transisi per simbol.`);
    }
  }
  if (errors.length) throw new Error(errors.join("\n"));
  return { name: "DFA buatanmu", desc: "DFA dari editor.", alphabet, states, start, accept, delta, samples: [] };
}

export function mountDfaSim(root) {
  const $ = (sel) => root.querySelector(sel);
  const stage = $(".viz-stage");
  const select = $("[data-example]");
  const desc = $("[data-desc]");
  const input = $("[data-input]");
  const btnRun = $("[data-run]");
  const btnStep = $("[data-step]");
  const btnReset = $("[data-reset]");
  const speed = $("[data-speed]");
  const tape = $("[data-tape]");
  const status = $("[data-status]");
  const trace = $("[data-trace]");
  const samples = $("[data-samples]");
  const live = $("[data-live]");
  const editor = $("[data-editor]");
  const editorMsg = $("[data-editor-msg]");
  const btnApply = $("[data-apply]");
  const formal = $("[data-formal]");

  let viz = null;
  if (webglAvailable()) {
    try { viz = new AutomatonViz(stage); } catch (e) { console.warn(e); }
  }

  const st = { dfa: null, word: "", pos: 0, current: null, busy: false, playing: false, path: [] };

  function renderFormal(d) {
    if (!formal) return;
    const set = (xs) => `{${xs.map(escapeHtml).join(", ")}}`;
    formal.innerHTML =
      `<p class="math">M = (Q, Σ, δ, q₀, F) dengan Q = ${set(d.states)}, Σ = ${set(d.alphabet)}, q₀ = ${escapeHtml(d.start)}, F = ${set(d.accept)}</p>` +
      transitionTableHtml(d) +
      `<p class="muted" style="font-size:.85rem">Tanda → menandai state awal, * menandai state penerima.</p>`;
  }

  function load(d) {
    st.dfa = d;
    if (desc) desc.textContent = d.desc;
    if (viz) viz.load(d);
    else stage.innerHTML = `<div class="viz-fallback"><p>Browser ini tidak mendukung WebGL, jadi animasi 3D tidak bisa ditampilkan. Simulator tetap berjalan dengan tabel transisi di bawah.</p></div>`;
    renderFormal(d);
    if (samples) {
      samples.innerHTML = d.samples.map((s) => `<button type="button" class="btn btn-sm mono" data-sample="${escapeHtml(s)}">${s === "" ? "ε (kosong)" : escapeHtml(s)}</button>`).join("");
    }
    if (editor && d.name !== "DFA buatanmu") editor.value = dfaToText(d);
    input.value = d.samples[0] ?? "";
    reset();
  }

  function validWord() {
    const bad = [...input.value].filter((c) => !st.dfa.alphabet.includes(c));
    if (bad.length) {
      setStatus(`Simbol "${bad[0]}" tidak ada di alfabet {${st.dfa.alphabet.join(", ")}}`, "reject");
      return false;
    }
    return true;
  }

  function setStatus(text, mood = "") {
    status.textContent = text;
    status.className = "viz-status" + (mood ? " " + mood : "");
  }

  function renderTape() {
    const w = [...st.word];
    if (!w.length) { tape.innerHTML = `<span class="empty">ε, string kosong: mesin langsung memutuskan di state awal.</span>`; return; }
    tape.innerHTML = w.map((c, i) => `<span class="cell ${i < st.pos ? "read" : ""} ${i === st.pos ? "head" : ""}">${escapeHtml(c)}</span>`).join("");
  }

  function renderTrace() {
    trace.textContent = st.path.map((p, i) => (i === 0 ? p.state : ` —${p.sym}→ ${p.state}`)).join("");
  }

  function updateButtons() {
    const done = st.pos >= st.word.length && st.finished;
    btnStep.disabled = st.busy || done;
    btnRun.disabled = st.busy && !st.playing;
    btnRun.textContent = st.playing ? "Jeda" : "Jalankan";
    input.disabled = st.playing || st.busy;
  }

  function reset() {
    st.playing = false;
    st.busy = false;
    st.finished = false;
    st.word = input.value;
    st.pos = 0;
    st.current = st.dfa.start;
    st.path = [{ state: st.current }];
    if (viz) viz.reset();
    renderTape();
    renderTrace();
    if (validWord()) setStatus(`State: ${st.current} · dibaca 0/${st.word.length}`);
    updateButtons();
  }

  function finish() {
    st.finished = true;
    const ok = st.dfa.accept.includes(st.current);
    setStatus(ok ? `DITERIMA · berakhir di ${st.current} (state penerima)` : `DITOLAK · berakhir di ${st.current} (bukan state penerima)`, ok ? "accept" : "reject");
    if (viz) viz.setActive(st.current, ok ? "accept" : "reject");
    if (live) live.textContent = `String "${st.word || "ε"}" ${ok ? "diterima" : "ditolak"}.`;
    st.playing = false;
    updateButtons();
  }

  async function step() {
    if (st.busy) return;
    if (st.pos === 0 && !st.finished && st.word !== input.value) reset();
    if (!validWord()) { st.playing = false; updateButtons(); return; }
    if (st.pos >= st.word.length) { finish(); return; }
    st.busy = true; updateButtons();
    const sym = st.word[st.pos];
    const ms = Number(speed?.value || 700);
    const next = viz ? await viz.transition(st.current, sym, ms) : st.dfa.delta[st.current][sym];
    st.current = next;
    st.pos += 1;
    st.path.push({ sym, state: next });
    st.busy = false;
    renderTape();
    renderTrace();
    setStatus(`State: ${st.current} · dibaca ${st.pos}/${st.word.length}`);
    if (st.pos >= st.word.length) finish();
    updateButtons();
  }

  async function play() {
    if (st.playing) { st.playing = false; updateButtons(); return; }
    if (st.finished || st.word !== input.value) reset();
    if (!validWord()) return;
    st.playing = true; updateButtons();
    if (!st.word.length) { finish(); return; }
    while (st.playing && !st.finished) {
      await step();
      if (st.playing && !st.finished) await new Promise((r) => setTimeout(r, 120));
    }
    updateButtons();
  }

  select?.addEventListener("change", () => load(EXAMPLES[select.value]));
  btnStep.addEventListener("click", step);
  btnRun.addEventListener("click", play);
  btnReset.addEventListener("click", reset);
  input.addEventListener("input", () => { if (!st.playing) reset(); });
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); play(); } });
  samples?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-sample]");
    if (!b) return;
    input.value = b.dataset.sample;
    reset();
    play();
  });
  btnApply?.addEventListener("click", () => {
    try {
      const d = parseDfa(editor.value);
      d.samples = [""];
      editorMsg.className = "form-ok";
      editorMsg.textContent = `DFA valid: ${d.states.length} state, alfabet {${d.alphabet.join(", ")}}. Visualisasi di atas sudah diperbarui.`;
      if (select) select.value = "";
      load(d);
      stage.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (err) {
      editorMsg.className = "form-error";
      editorMsg.textContent = err.message;
    }
  });

  // Tombol "Muat ke simulator" di bagian latihan: ambil teks dari <pre> tepat sebelumnya.
  if (editor) {
    document.addEventListener("click", (e) => {
      const b = e.target.closest("[data-load-dfa]");
      if (!b) return;
      editor.value = b.previousElementSibling.textContent.trim();
      editor.closest("details")?.setAttribute("open", "");
      btnApply.click();
    });
  }

  load(EXAMPLES[select?.value] || EXAMPLES[root.dataset.initial] || EXAMPLES["genap-1"]);
  return { load };
}

// Elemen dengan data-manual dipasang oleh skrip halaman (misalnya hasil konversi NFA → DFA).
document.querySelectorAll("[data-dfa-sim]:not([data-manual])").forEach(mountDfaSim);
