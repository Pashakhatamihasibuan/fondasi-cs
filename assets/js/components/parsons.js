// Latihan "susun bukti" (Parsons problem): langkah bukti diacak, pelajar mengurutkannya.
// Data: <script type="application/json">{"steps": ["langkah 1", "langkah 2", ...]}</script>
// Urutan di JSON adalah urutan yang benar.

function shuffle(n, seed) {
  const idx = [...Array(n).keys()];
  let s = seed;
  for (let i = n - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  // pastikan tidak kebetulan sudah urut
  if (idx.every((v, i) => v === i)) idx.reverse();
  return idx;
}

function mount(root, k) {
  const { steps } = JSON.parse(root.querySelector("script[type='application/json']").textContent);
  let order = shuffle(steps.length, 17 + k * 31);
  const list = document.createElement("ol");
  list.className = "parsons";
  const bar = document.createElement("div");
  bar.className = "viz-row";
  bar.innerHTML = `<button type="button" class="btn btn-primary btn-sm" data-check>Periksa urutan</button>
    <button type="button" class="btn btn-sm" data-shuffle>Acak ulang</button>
    <span class="quiz-result" role="status" aria-live="polite"></span>`;
  root.append(list, bar);
  const result = bar.querySelector(".quiz-result");

  function render(focusIdx, focusDir) {
    list.innerHTML = order.map((s, pos) => `
      <li data-pos="${pos}">
        <span class="step-text">${steps[s]}</span>
        <span class="step-btns">
          <button type="button" class="icon-btn" data-move="-1" aria-label="Naikkan langkah ${pos + 1}" ${pos === 0 ? "disabled" : ""}>↑</button>
          <button type="button" class="icon-btn" data-move="1" aria-label="Turunkan langkah ${pos + 1}" ${pos === order.length - 1 ? "disabled" : ""}>↓</button>
        </span>
      </li>`).join("");
    if (focusIdx != null) list.querySelector(`li[data-pos="${focusIdx}"] [data-move="${focusDir}"]`)?.focus()
      ?? list.querySelector(`li[data-pos="${focusIdx}"] button:not([disabled])`)?.focus();
  }

  list.addEventListener("click", (e) => {
    const b = e.target.closest("[data-move]");
    if (!b) return;
    const pos = Number(b.closest("li").dataset.pos), d = Number(b.dataset.move), to = pos + d;
    if (to < 0 || to >= order.length) return;
    [order[pos], order[to]] = [order[to], order[pos]];
    result.textContent = "";
    render(to, b.dataset.move);
  });
  bar.querySelector("[data-check]").addEventListener("click", () => {
    let ok = 0;
    list.querySelectorAll("li").forEach((li, pos) => {
      const good = order[pos] === pos;
      if (good) ok++;
      li.classList.toggle("good", good);
      li.classList.toggle("bad", !good);
    });
    result.textContent = ok === steps.length
      ? "Urutan benar. Baca ulang bukti dari atas: setiap langkah mengikuti dari langkah sebelumnya."
      : `${ok} dari ${steps.length} langkah sudah di posisi yang benar. Langkah merah perlu dipindah.`;
  });
  bar.querySelector("[data-shuffle]").addEventListener("click", () => {
    order = shuffle(steps.length, Math.floor(Math.random() * 1e5));
    result.textContent = "";
    render();
  });
  render();
}

document.querySelectorAll("[data-parsons]").forEach(mount);
