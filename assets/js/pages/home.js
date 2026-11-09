import { TRACKS, PHASES } from "../data/tracks.js";
import { progress, escapeHtml } from "../app.js";
import { mountHero } from "../viz/hero3d.js";

const cards = document.querySelector("[data-track-cards]");
const phases = document.querySelector("[data-phases]");

function renderCards() {
  cards.innerHTML = TRACKS.map((t) => {
    const done = progress.countFor(t);
    const ready = t.modules.filter((m) => m.status === "ready").length;
    const pct = Math.round((done / t.modules.length) * 100);
    return `
    <a class="card" href="roadmap.html?jalur=${t.id}" style="--track: var(${t.color})">
      <div style="display:flex;gap:10px;align-items:center">
        <span class="track-num" aria-hidden="true">${t.num}</span>
        <span class="badge ${t.num <= 2 ? "badge-accent" : ""}">${escapeHtml(t.priority)}</span>
      </div>
      <h3>${escapeHtml(t.title)}</h3>
      <p>${escapeHtml(t.summary)}</p>
      <div class="meta">
        <span class="badge">${t.modules.length} modul</span>
        <span class="badge">${t.weeks} minggu · ${t.hoursPerWeek} jam/minggu</span>
        ${ready ? `<span class="badge badge-ok">${ready} modul siap dibaca</span>` : ""}
      </div>
      <div>
        <div class="progress" role="progressbar" aria-label="Progres ${escapeHtml(t.title)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${pct}%"></i></div>
        <small class="muted">${done}/${t.modules.length} modul selesai</small>
      </div>
    </a>`;
  }).join("");

  const total = TRACKS.reduce((s, t) => s + t.modules.length, 0);
  const done = TRACKS.reduce((s, t) => s + progress.countFor(t), 0);
  document.querySelector("[data-stat-total]").textContent = total;
  document.querySelector("[data-stat-done]").textContent = done;
  document.querySelector("[data-stat-weeks]").textContent = Math.ceil((new Date("2027-11-01") - new Date()) / (7 * 864e5));
}

phases.innerHTML = PHASES.map((p) => `
  <div class="phase">
    <span class="when">${escapeHtml(p.when)}</span>
    <h3>${escapeHtml(p.title)}</h3>
    <ul>${p.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
  </div>`).join("");

renderCards();
document.addEventListener("progress-change", renderCards);
mountHero(document.querySelector("[data-hero-viz]"), TRACKS);
