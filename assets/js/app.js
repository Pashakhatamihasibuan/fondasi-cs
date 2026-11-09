// Utilitas yang dipakai semua halaman: tema, progres belajar, daftar isi aktif.

const STORE_KEY = "fondasi-cs:done";
const THEME_KEY = "fondasi-cs:theme";

function safeGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* mode privat: abaikan */ }
}

/* ---------------- progres ---------------- */
export const progress = {
  all() {
    try { return new Set(JSON.parse(safeGet(STORE_KEY) || "[]")); } catch { return new Set(); }
  },
  has(key) { return this.all().has(key); },
  set(key, done) {
    const s = this.all();
    done ? s.add(key) : s.delete(key);
    safeSet(STORE_KEY, JSON.stringify([...s]));
    document.dispatchEvent(new CustomEvent("progress-change", { detail: { key, done } }));
  },
  countFor(track) {
    const s = this.all();
    return track.modules.filter((m) => s.has(`${track.id}/${m.id}`)).length;
  },
};

/* ---------------- tema ---------------- */
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === "light" || theme === "dark") root.dataset.theme = theme;
  else delete root.dataset.theme;
  document.dispatchEvent(new CustomEvent("theme-change"));
}
export function currentThemeIsDark() {
  const t = document.documentElement.dataset.theme;
  if (t) return t === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}
function initTheme() {
  applyTheme(safeGet(THEME_KEY));
  const btn = document.querySelector("[data-theme-toggle]");
  if (!btn) return;
  const sync = () => {
    const dark = currentThemeIsDark();
    btn.setAttribute("aria-label", dark ? "Ganti ke tema terang" : "Ganti ke tema gelap");
    btn.innerHTML = dark
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  };
  btn.addEventListener("click", () => {
    const next = currentThemeIsDark() ? "light" : "dark";
    safeSet(THEME_KEY, next);
    applyTheme(next);
    sync();
  });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (!document.documentElement.dataset.theme) { document.dispatchEvent(new CustomEvent("theme-change")); sync(); }
  });
  sync();
}

/* ---------------- daftar isi yang mengikuti scroll ---------------- */
function initToc() {
  const links = [...document.querySelectorAll(".toc a[href^='#']")];
  if (!links.length || !("IntersectionObserver" in window)) return;
  const map = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          links.forEach((l) => l.classList.remove("active"));
          map.get(e.target.id)?.classList.add("active");
        }
      });
    },
    { rootMargin: "-20% 0px -70% 0px" }
  );
  map.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
}

/* ---------------- tombol "tandai selesai" ---------------- */
function initDoneToggles() {
  document.querySelectorAll("[data-done-key]").forEach((input) => {
    const key = input.dataset.doneKey;
    input.checked = progress.has(key);
    input.addEventListener("change", () => progress.set(key, input.checked));
  });
}

export const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Baca token warna CSS sebagai string hex/rgb. */
export function cssVar(name, el = document.documentElement) {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

initTheme();
initToc();
initDoneToggles();
const year = document.querySelector("[data-year]");
if (year) year.textContent = new Date().getFullYear();
