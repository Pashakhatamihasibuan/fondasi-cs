// Kuis pilihan ganda. Soal ditulis sebagai JSON di dalam
// <script type="application/json"> di dalam elemen [data-quiz].
// Format: [{ "q": "...", "options": ["..."], "answer": 0, "explain": "..." }]


function mountQuiz(root) {
  const data = JSON.parse(root.querySelector("script[type='application/json']").textContent);
  const id = root.id || "quiz";
  const form = document.createElement("form");
  form.className = "quiz";
  form.noValidate = true;

  form.innerHTML = data.map((item, i) => `
    <div class="q">
      <fieldset>
        <legend>${i + 1}. ${item.q}</legend>
        ${item.options.map((opt, j) => `
          <label><input type="radio" name="${id}-${i}" value="${j}"> <span>${opt}</span></label>`).join("")}
        <div class="explain" hidden></div>
      </fieldset>
    </div>`).join("") + `
    <div class="viz-row">
      <button type="submit" class="btn btn-primary">Periksa jawaban</button>
      <button type="button" class="btn" data-retry>Ulangi</button>
      <span class="quiz-result" role="status" aria-live="polite"></span>
    </div>`;
  root.appendChild(form);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let score = 0, answered = 0;
    data.forEach((item, i) => {
      const chosen = form.querySelector(`input[name="${id}-${i}"]:checked`);
      const labels = form.querySelectorAll(`input[name="${id}-${i}"]`);
      labels.forEach((inp) => inp.closest("label").classList.remove("correct", "wrong"));
      const exp = labels[0].closest("fieldset").querySelector(".explain");
      if (!chosen) { exp.hidden = true; return; }
      answered++;
      const ok = Number(chosen.value) === item.answer;
      if (ok) score++;
      labels[item.answer].closest("label").classList.add("correct");
      if (!ok) chosen.closest("label").classList.add("wrong");
      exp.hidden = false;
      exp.innerHTML = (ok ? "<b>Benar.</b> " : "<b>Belum tepat.</b> ") + (item.explain || "");
    });
    const res = form.querySelector(".quiz-result");
    res.textContent = answered < data.length
      ? `Skor ${score}/${data.length}. Masih ada ${data.length - answered} soal yang belum dijawab.`
      : `Skor ${score}/${data.length}${score === data.length ? ". Sempurna!" : score >= data.length * 0.7 ? ". Bagus, ulas lagi yang salah." : ". Baca ulang bagian terkait lalu coba lagi."}`;
  });

  form.querySelector("[data-retry]").addEventListener("click", () => {
    form.reset();
    form.querySelectorAll("label").forEach((l) => l.classList.remove("correct", "wrong"));
    form.querySelectorAll(".explain").forEach((x) => (x.hidden = true));
    form.querySelector(".quiz-result").textContent = "";
  });
}

document.querySelectorAll("[data-quiz]").forEach(mountQuiz);
