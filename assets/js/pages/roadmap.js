import { TRACKS, findTrack } from "../data/tracks.js";
import { progress, escapeHtml } from "../app.js";

const params = new URLSearchParams(location.search);
const track = findTrack(params.get("jalur")) || TRACKS[0];
const root = document.querySelector("[data-roadmap]");
document.title = `${track.title} · Fondasi CS`;
document.documentElement.style.setProperty("--track", `var(${track.color})`);

function render() {
  const done = progress.countFor(track);
  const pct = Math.round((done / track.modules.length) * 100);
  const idx = TRACKS.indexOf(track);
  const prev = TRACKS[idx - 1], next = TRACKS[idx + 1];

  root.innerHTML = `
  <div class="page-head">
    <nav class="breadcrumb" aria-label="Breadcrumb"><a href="./">Beranda</a> / Roadmap</nav>
    <p class="eyebrow" style="color:var(${track.color})">Jalur ${track.num} · ${escapeHtml(track.en)}</p>
    <h1>${escapeHtml(track.title)}</h1>
    <p class="lead">${escapeHtml(track.summary)}</p>
  </div>

  <div class="track-hero">
    <div class="panel">
      <h3>Mengapa jalur ini penting untuk MECS UTM</h3>
      <ul>${track.why.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}</ul>
      <h3 style="margin-top:16px">Target akhir</h3>
      <p style="margin:0">${escapeHtml(track.outcome)}</p>
    </div>
    <div class="panel">
      <h3>Progres</h3>
      <div class="progress" role="progressbar" aria-label="Progres jalur" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" style="--accent: var(${track.color})"><i style="width:${pct}%"></i></div>
      <p class="muted" style="margin:8px 0 14px">${done} dari ${track.modules.length} modul selesai · ${track.weeks} minggu · ${track.hoursPerWeek} jam/minggu</p>
      <h3>Bahan belajar</h3>
      <ul>${track.resources.map((r) => `<li>${r.url ? `<a href="${r.url}" target="_blank" rel="noopener">${escapeHtml(r.name)}</a>` : escapeHtml(r.name)} <span class="muted">· ${escapeHtml(r.kind)}</span></li>`).join("")}</ul>
    </div>
  </div>

  <div class="section-head"><h2>Urutan modul</h2><span class="muted">Kira-kira satu modul per minggu</span></div>
  <ol class="module-list">
    ${track.modules.map((m) => {
      const key = `${track.id}/${m.id}`;
      const isDone = progress.has(key);
      return `
      <li class="module ${isDone ? "done" : ""}">
        <span class="module-num" aria-hidden="true">${isDone ? "✓" : m.id}</span>
        <div>
          <h3>${m.status === "ready" ? `<a href="${m.href}">${escapeHtml(m.title)}</a>` : escapeHtml(m.title)}</h3>
          <p>${escapeHtml(m.summary)}</p>
          <ul class="topics">${m.topics.map((t) => `<li class="badge">${escapeHtml(t)}</li>`).join("")}</ul>
          <div class="row">
            ${m.status === "ready"
              ? `<a class="btn btn-primary btn-sm" href="${m.href}">Buka materi</a>`
              : `<span class="badge badge-warn">Materi sedang disusun</span>`}
            ${m.read && m.read !== "-" ? `<span class="badge">Bacaan: ${escapeHtml(m.read)}</span>` : ""}
            <label class="check"><input type="checkbox" data-key="${key}" ${isDone ? "checked" : ""}> Tandai selesai</label>
          </div>
        </div>
      </li>`;
    }).join("")}
  </ol>

  <nav class="pager" aria-label="Jalur lain">
    ${prev ? `<a class="btn" href="roadmap.html?jalur=${prev.id}">← ${escapeHtml(prev.title)}</a>` : "<span></span>"}
    ${next ? `<a class="btn" href="roadmap.html?jalur=${next.id}">${escapeHtml(next.title)} →</a>` : ""}
  </nav>`;

  root.querySelectorAll("input[data-key]").forEach((inp) =>
    inp.addEventListener("change", () => progress.set(inp.dataset.key, inp.checked))
  );
  document.querySelectorAll(".nav a[data-track]").forEach((a) => {
    if (a.dataset.track === track.id) a.setAttribute("aria-current", "page");
  });
}

render();
document.addEventListener("progress-change", (e) => {
  const y = window.scrollY;
  render();
  window.scrollTo(0, y);
  root.querySelector(`input[data-key="${e.detail.key}"]`)?.focus({ preventScroll: true });
});
