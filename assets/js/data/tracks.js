// Data seluruh jalur belajar. Halaman beranda dan roadmap dirender dari sini,
// jadi menambah modul cukup dengan mengedit file ini.
// status: "ready" = materi lengkap tersedia, "soon" = garis besar saja.

export const TRACKS = [
  {
    id: "teori-komputasi",
    num: 1,
    title: "Teori Komputasi",
    en: "Theory of Computation",
    color: "--t-toc",
    priority: "Prioritas utama",
    weeks: 12,
    hoursPerWeek: "6–8",
    summary:
      "Automata, bahasa formal, mesin Turing, decidability, dan kompleksitas P vs NP. Ini celah terbesar di transkrip dan prasyarat langsung mata kuliah Advanced Theory of Computer Science di MECS.",
    why: [
      "Prasyarat MECS (nilai minimal B-) yang belum ada di transkrip S1.",
      "Dasar mata kuliah inti Advanced Theory of Computer Science.",
      "Melatih cara berpikir formal: definisi, konstruksi, dan pembuktian.",
    ],
    outcome:
      "Mampu merancang DFA/NFA/PDA, membuktikan sebuah bahasa tidak reguler, menjelaskan mengapa halting problem tidak dapat diputuskan, dan melakukan reduksi NP-complete sederhana.",
    resources: [
      { name: "Sipser, Introduction to the Theory of Computation (ed. 3)", kind: "Buku utama" },
      { name: "MIT OCW 18.404J Theory of Computation (Fall 2020, video Sipser)", kind: "Video kuliah", url: "https://ocw.mit.edu/courses/18-404j-theory-of-computation-fall-2020/" },
      { name: "JFLAP (simulator automata)", kind: "Alat", url: "https://www.jflap.org/" },
      { name: "NPTEL Theory of Computation (bisa jadi bukti belajar mandiri)", kind: "Sertifikat", url: "https://nptel.ac.in/" },
    ],
    modules: [
      { id: "01", title: "Bahasa formal dan DFA", summary: "Alfabet, string, bahasa, dan deterministic finite automaton sebagai mesin paling sederhana.", topics: ["alfabet & string", "bahasa", "definisi formal DFA", "merancang DFA", "operasi reguler"], read: "Sipser 0.2, 1.1", status: "ready", href: "teori-komputasi/01-bahasa-dan-dfa.html" },
      { id: "02", title: "NFA dan konstruksi subset", summary: "Nondeterminisme, transisi ε, dan bukti bahwa NFA setara DFA.", topics: ["NFA", "ε-transisi", "subset construction", "closure"], read: "Sipser 1.2", status: "soon" },
      { id: "03", title: "Ekspresi reguler", summary: "Regex formal dan konversi dua arah dengan automata.", topics: ["regex formal", "regex → NFA", "GNFA", "DFA → regex"], read: "Sipser 1.3", status: "soon" },
      { id: "04", title: "Batas bahasa reguler", summary: "Pumping lemma untuk membuktikan sebuah bahasa tidak reguler.", topics: ["pumping lemma", "bukti kontradiksi", "Myhill–Nerode (pengayaan)"], read: "Sipser 1.4", status: "soon" },
      { id: "05", title: "Context-free grammar", summary: "Grammar, derivasi, parse tree, ambiguitas, dan Chomsky normal form.", topics: ["CFG", "derivasi", "ambiguitas", "CNF"], read: "Sipser 2.1", status: "soon" },
      { id: "06", title: "Pushdown automata", summary: "Automata dengan stack, kesetaraan dengan CFG, dan pumping lemma CFL.", topics: ["PDA", "CFG ⇔ PDA", "pumping lemma CFL"], read: "Sipser 2.2–2.3", status: "soon" },
      { id: "07", title: "Mesin Turing", summary: "Model komputasi umum, varian mesin Turing, dan tesis Church–Turing.", topics: ["TM", "konfigurasi", "multitape", "Church–Turing"], read: "Sipser 3", status: "soon" },
      { id: "08", title: "Decidability", summary: "Bahasa decidable vs recognizable, diagonalisasi, dan halting problem.", topics: ["decidable", "diagonalisasi", "A_TM", "halting problem"], read: "Sipser 4", status: "soon" },
      { id: "09", title: "Reducibility", summary: "Membuktikan ketakterputusan lewat reduksi, termasuk teorema Rice.", topics: ["reduksi pemetaan", "teorema Rice", "PCP"], read: "Sipser 5", status: "soon" },
      { id: "10", title: "Kompleksitas waktu: P dan NP", summary: "Notasi Big-O dalam TM, kelas P, NP, dan verifier.", topics: ["TIME(f(n))", "kelas P", "kelas NP", "verifier"], read: "Sipser 7.1–7.3", status: "soon" },
      { id: "11", title: "NP-completeness", summary: "Reduksi polinomial, teorema Cook–Levin, dan contoh NP-complete.", topics: ["reduksi polinomial", "SAT", "3SAT", "CLIQUE", "VERTEX-COVER"], read: "Sipser 7.4–7.5", status: "soon" },
      { id: "12", title: "Review dan ujian latihan", summary: "Soal-soal ujian MIT 18.404 dan simulasi ujian tertutup.", topics: ["problem set", "ujian latihan", "rangkuman"], read: "MIT 18.404 exams", status: "soon" },
    ],
  },
  {
    id: "ai-klasik",
    num: 2,
    title: "Kecerdasan Buatan Klasik",
    en: "Classical Artificial Intelligence",
    color: "--t-ai",
    priority: "Prioritas utama",
    weeks: 12,
    hoursPerWeek: "5–7",
    summary:
      "Pencarian, constraint satisfaction, logika, penalaran probabilistik, dan dasar learning. Menutup celah mata kuliah Kecerdasan Buatan dan menyiapkan Advanced Artificial Intelligence.",
    why: [
      "Prasyarat MECS; di transkrip baru ada Pembelajaran Mesin, Penambangan Data, dan SPK.",
      "Fondasi mata kuliah inti Advanced Artificial Intelligence.",
      "Melengkapi sisi ML yang sudah kuat dengan sisi simbolik dan pencarian.",
    ],
    outcome:
      "Mampu mengimplementasikan BFS, A*, minimax alpha-beta, solver CSP, inferensi logika, dan jaringan Bayes sederhana dalam Python.",
    resources: [
      { name: "Russell & Norvig, Artificial Intelligence: A Modern Approach (ed. 4)", kind: "Buku utama" },
      { name: "Harvard CS50's Introduction to AI with Python", kind: "Kursus + proyek", url: "https://cs50.harvard.edu/ai/" },
      { name: "UC Berkeley CS188 (Pacman projects)", kind: "Proyek", url: "https://inst.eecs.berkeley.edu/~cs188/" },
    ],
    modules: [
      { id: "01", title: "Agen cerdas", summary: "Agen, lingkungan, PEAS, dan jenis-jenis lingkungan.", topics: ["agen rasional", "PEAS", "jenis lingkungan"], read: "AIMA 2", status: "soon" },
      { id: "02", title: "Pencarian tanpa informasi", summary: "BFS, DFS, uniform-cost, iterative deepening, dan analisis kelengkapan.", topics: ["BFS", "DFS", "UCS", "IDS"], read: "AIMA 3.1–3.4", status: "soon" },
      { id: "03", title: "Pencarian heuristik", summary: "Greedy best-first, A*, heuristik admissible dan konsisten.", topics: ["A*", "admissible", "consistent", "relaxed problem"], read: "AIMA 3.5–3.6", status: "soon" },
      { id: "04", title: "Pencarian adversarial", summary: "Minimax, alpha-beta pruning, dan fungsi evaluasi.", topics: ["minimax", "alpha-beta", "MCTS (pengenalan)"], read: "AIMA 5", status: "soon" },
      { id: "05", title: "Constraint satisfaction", summary: "Backtracking, forward checking, AC-3, dan heuristik MRV.", topics: ["CSP", "backtracking", "AC-3", "MRV"], read: "AIMA 6", status: "soon" },
      { id: "06", title: "Logika proposisional", summary: "Knowledge base, entailment, resolusi, dan model checking.", topics: ["entailment", "resolusi", "CNF", "DPLL"], read: "AIMA 7", status: "soon" },
      { id: "07", title: "Logika orde pertama", summary: "Kuantor, unifikasi, forward dan backward chaining.", topics: ["FOL", "unifikasi", "chaining"], read: "AIMA 8–9", status: "soon" },
      { id: "08", title: "Probabilitas dan jaringan Bayes", summary: "Aturan Bayes, independensi bersyarat, dan inferensi di jaringan Bayes.", topics: ["Bayes", "jaringan Bayes", "inferensi"], read: "AIMA 12–13", status: "soon" },
      { id: "09", title: "Penalaran temporal", summary: "Rantai Markov, HMM, dan algoritma Viterbi.", topics: ["Markov chain", "HMM", "Viterbi"], read: "AIMA 14", status: "soon" },
      { id: "10", title: "Dasar machine learning", summary: "Supervised learning, decision tree, dan evaluasi model dari sudut pandang AI.", topics: ["decision tree", "entropi", "overfitting"], read: "AIMA 19", status: "soon" },
      { id: "11", title: "Reinforcement learning dasar", summary: "MDP, value iteration, dan Q-learning.", topics: ["MDP", "value iteration", "Q-learning"], read: "AIMA 16, 22", status: "soon" },
      { id: "12", title: "Proyek mini", summary: "Menyelesaikan dua proyek CS50 AI sebagai portofolio.", topics: ["proyek", "portofolio"], read: "CS50 AI projects", status: "soon" },
    ],
  },
  {
    id: "algoritma-lanjut",
    num: 3,
    title: "Algoritma Lanjut",
    en: "Advanced Algorithms",
    color: "--t-algo",
    priority: "Penting",
    weeks: 12,
    hoursPerWeek: "5–6",
    summary:
      "Analisis kompleksitas, divide and conquer, graf, greedy, dynamic programming, dan network flow. Menyiapkan mata kuliah Advanced Data Structure and Algorithm.",
    why: [
      "Mata kuliah inti MECS: Advanced Data Structure and Algorithm.",
      "Transkrip belum memuat Desain dan Analisis Algoritma.",
      "Dipakai terus di Teori Komputasi (kompleksitas) dan AI (pencarian).",
    ],
    outcome:
      "Mampu menganalisis waktu jalan dengan rekurensi, memilih paradigma algoritma yang tepat, dan membuktikan kebenaran algoritma greedy dan DP.",
    resources: [
      { name: "Cormen dkk., Introduction to Algorithms (CLRS, ed. 4)", kind: "Buku utama" },
      { name: "MIT OCW 6.006 dan 6.046J", kind: "Video kuliah", url: "https://ocw.mit.edu/courses/6-046j-design-and-analysis-of-algorithms-spring-2015/" },
      { name: "LeetCode / NeetCode 150", kind: "Latihan rutin", url: "https://neetcode.io/practice" },
    ],
    modules: [
      { id: "01", title: "Analisis asimptotik", summary: "O, Ω, Θ, rekurensi, dan master theorem.", topics: ["Big-O", "rekurensi", "master theorem"], read: "CLRS 3–4", status: "soon" },
      { id: "02", title: "Divide and conquer", summary: "Merge sort, Karatsuba, closest pair.", topics: ["merge sort", "Karatsuba", "recursion tree"], read: "CLRS 4", status: "soon" },
      { id: "03", title: "Sorting dan algoritma acak", summary: "Quicksort acak, batas bawah perbandingan, counting dan radix sort.", topics: ["quicksort", "lower bound", "radix sort"], read: "CLRS 7–8", status: "soon" },
      { id: "04", title: "Struktur data lanjut", summary: "Heap, hashing, BST seimbang, dan union-find.", topics: ["heap", "hashing", "red-black tree", "union-find"], read: "CLRS 6, 11, 13, 19", status: "soon" },
      { id: "05", title: "Penelusuran graf", summary: "BFS, DFS, topological sort, dan strongly connected components.", topics: ["BFS", "DFS", "toposort", "SCC"], read: "CLRS 20", status: "soon" },
      { id: "06", title: "Shortest path", summary: "Dijkstra, Bellman-Ford, dan Floyd-Warshall.", topics: ["Dijkstra", "Bellman-Ford", "Floyd-Warshall"], read: "CLRS 22–23", status: "soon" },
      { id: "07", title: "Minimum spanning tree", summary: "Kruskal, Prim, dan cut property.", topics: ["Kruskal", "Prim", "cut property"], read: "CLRS 21", status: "soon" },
      { id: "08", title: "Algoritma greedy", summary: "Activity selection, Huffman coding, dan bukti exchange argument.", topics: ["greedy choice", "Huffman", "exchange argument"], read: "CLRS 15", status: "soon" },
      { id: "09", title: "Dynamic programming", summary: "Substruktur optimal, LCS, knapsack, edit distance.", topics: ["memoization", "LCS", "knapsack", "edit distance"], read: "CLRS 14", status: "soon" },
      { id: "10", title: "Network flow", summary: "Ford-Fulkerson, max-flow min-cut, dan bipartite matching.", topics: ["max-flow", "min-cut", "matching"], read: "CLRS 24", status: "soon" },
      { id: "11", title: "Analisis amortisasi", summary: "Aggregate, accounting, dan potential method.", topics: ["amortized", "dynamic array", "potential"], read: "CLRS 16", status: "soon" },
      { id: "12", title: "NP-hard dan aproksimasi", summary: "Menghubungkan ke Teori Komputasi: aproksimasi vertex cover dan TSP.", topics: ["NP-hard", "aproksimasi", "TSP"], read: "CLRS 34–35", status: "soon" },
    ],
  },
  {
    id: "matematika-diskrit",
    num: 4,
    title: "Matematika Diskrit",
    en: "Discrete Mathematics",
    color: "--t-math",
    priority: "Fondasi pendukung",
    weeks: 10,
    hoursPerWeek: "3–4",
    summary:
      "Logika, teknik pembuktian, induksi, kombinatorika, teori graf, dan probabilitas diskrit. Bahasa yang dipakai Teori Komputasi dan Algoritma, jadi sebaiknya dipelajari paling awal.",
    why: [
      "Teori Komputasi hampir seluruhnya berupa definisi dan pembuktian.",
      "Analisis algoritma butuh induksi, rekurensi, dan counting.",
      "Sudah ada Matematika Informatika (A); jalur ini memperdalam sisi pembuktian.",
    ],
    outcome:
      "Mampu menulis bukti langsung, kontradiksi, dan induksi dengan rapi dalam bahasa Inggris akademik.",
    resources: [
      { name: "Lehman, Leighton & Meyer, Mathematics for Computer Science", kind: "Buku gratis", url: "https://courses.csail.mit.edu/6.042/spring18/mcs.pdf" },
      { name: "MIT OCW 6.042J Mathematics for Computer Science", kind: "Video kuliah", url: "https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-fall-2010/" },
      { name: "Velleman, How to Prove It", kind: "Buku pembuktian" },
    ],
    modules: [
      { id: "01", title: "Logika proposisional dan predikat", summary: "Konektif, tabel kebenaran, kuantor, dan negasi.", topics: ["konektif", "kuantor", "ekuivalensi"], read: "MCS 1, 3", status: "soon" },
      { id: "02", title: "Teknik pembuktian", summary: "Bukti langsung, kontrapositif, kontradiksi, dan kasus.", topics: ["bukti langsung", "kontradiksi", "kontrapositif"], read: "MCS 1", status: "soon" },
      { id: "03", title: "Induksi", summary: "Induksi biasa, induksi kuat, dan well-ordering.", topics: ["induksi", "induksi kuat", "well-ordering"], read: "MCS 5", status: "soon" },
      { id: "04", title: "Himpunan, relasi, fungsi", summary: "Operasi himpunan, relasi ekuivalensi, kardinalitas, dan countability.", topics: ["himpunan", "relasi", "bijeksi", "countable"], read: "MCS 4, 8", status: "soon" },
      { id: "05", title: "Teori bilangan", summary: "Pembagi, GCD, aritmetika modular, dan RSA.", topics: ["GCD", "modular", "RSA"], read: "MCS 9", status: "soon" },
      { id: "06", title: "Teori graf", summary: "Graf, pohon, pewarnaan, dan graf planar.", topics: ["graf", "pohon", "pewarnaan"], read: "MCS 10–13", status: "soon" },
      { id: "07", title: "Kombinatorika", summary: "Aturan perkalian, permutasi, kombinasi, dan pigeonhole.", topics: ["counting", "binomial", "pigeonhole"], read: "MCS 15", status: "soon" },
      { id: "08", title: "Rekurensi", summary: "Menyelesaikan rekurensi linear dan divide-and-conquer.", topics: ["rekurensi", "fungsi pembangkit"], read: "MCS 22", status: "soon" },
      { id: "09", title: "Probabilitas diskrit", summary: "Ruang sampel, peluang bersyarat, dan independensi.", topics: ["peluang", "Bayes", "independensi"], read: "MCS 17–18", status: "soon" },
      { id: "10", title: "Variabel acak", summary: "Ekspektasi, linearitas ekspektasi, dan variansi.", topics: ["ekspektasi", "variansi", "batas deviasi"], read: "MCS 19–20", status: "soon" },
    ],
  },
  {
    id: "riset-menulis",
    num: 5,
    title: "Riset dan Menulis Ilmiah (Inggris)",
    en: "Research & Academic Writing",
    color: "--t-research",
    priority: "Untuk proposal dan beasiswa",
    weeks: 10,
    hoursPerWeek: "3–4",
    summary:
      "Membaca paper, menyusun literature review, menemukan research gap, dan menulis proposal riset 1.000 kata dalam bahasa Inggris untuk pendaftaran UTM dan beasiswa MIS.",
    why: [
      "Proposal riset dibutuhkan untuk pendaftaran dan beasiswa MIS.",
      "Mata kuliah inti Research Methodology dan disertasi MECS.",
      "Sekaligus melatih Writing Task 2 untuk IELTS.",
    ],
    outcome:
      "Draf proposal riset 1.000 kata yang berangkat dari skripsi ANN penyakit jantung, lengkap dengan literature review dan sitasi yang benar.",
    resources: [
      { name: "Keshav, How to Read a Paper", kind: "Artikel", url: "http://ccr.sigcomm.org/online/files/p83-keshavA.pdf" },
      { name: "Swales & Feak, Academic Writing for Graduate Students", kind: "Buku" },
      { name: "Zotero (manajer referensi)", kind: "Alat", url: "https://www.zotero.org/" },
      { name: "Semantic Scholar dan Google Scholar", kind: "Pencarian literatur", url: "https://www.semanticscholar.org/" },
    ],
    modules: [
      { id: "01", title: "Membaca paper", summary: "Metode tiga tahap dan cara mencatat paper.", topics: ["three-pass", "catatan paper"], read: "Keshav", status: "soon" },
      { id: "02", title: "Mencari literatur", summary: "Kata kunci, database, dan Zotero.", topics: ["Scopus", "Scholar", "Zotero"], read: "-", status: "soon" },
      { id: "03", title: "Literature review", summary: "Matriks sintesis dan menulis review tematik, bukan per paper.", topics: ["matriks sintesis", "review tematik"], read: "Swales & Feak 6", status: "soon" },
      { id: "04", title: "Research gap dan pertanyaan riset", summary: "Dari gap ke research questions dan objectives.", topics: ["gap", "RQ", "objectives"], read: "-", status: "soon" },
      { id: "05", title: "Struktur IMRaD", summary: "Introduction, Method, Results, and Discussion.", topics: ["IMRaD", "abstrak"], read: "-", status: "soon" },
      { id: "06", title: "Bahasa Inggris akademik", summary: "Hedging, tense, parafrase, dan menghindari plagiarisme.", topics: ["hedging", "parafrase", "tense"], read: "Swales & Feak", status: "soon" },
      { id: "07", title: "Metodologi riset CS", summary: "Desain eksperimen, baseline, metrik, dan ancaman validitas.", topics: ["eksperimen", "baseline", "validitas"], read: "-", status: "soon" },
      { id: "08", title: "Menulis proposal 1.000 kata", summary: "Struktur proposal yang diminta UTM dan MIS.", topics: ["proposal", "timeline", "kontribusi"], read: "-", status: "soon" },
      { id: "09", title: "Sitasi dan referensi", summary: "Gaya IEEE dan APA serta etika sitasi.", topics: ["IEEE", "APA"], read: "-", status: "soon" },
      { id: "10", title: "Revisi", summary: "Swasunting, umpan balik, dan versi final.", topics: ["revisi", "feedback"], read: "-", status: "soon" },
    ],
  },
  {
    id: "python-ml",
    num: 6,
    title: "Python dan ML Praktis",
    en: "Practical Python & Machine Learning",
    color: "--t-ml",
    priority: "Diperdalam sambil jalan",
    weeks: 10,
    hoursPerWeek: "2–4",
    summary:
      "NumPy, pandas, scikit-learn, dan PyTorch dengan eksperimen yang bisa direproduksi. Puncaknya: membangun ulang skripsi penyakit jantung dengan pipeline modern sebagai portofolio.",
    why: [
      "Sudah kuat (Pembelajaran Mesin A, Python untuk Analisa Data A); tinggal naik level.",
      "Dipakai untuk mengimplementasikan algoritma dari jalur lain.",
      "Portofolio GitHub memperkuat proposal dan aplikasi beasiswa.",
    ],
    outcome:
      "Repositori proyek ML yang rapi dan dapat direproduksi, siap ditautkan di CV dan proposal riset.",
    resources: [
      { name: "Géron, Hands-On Machine Learning (ed. 3)", kind: "Buku utama" },
      { name: "Dokumentasi resmi scikit-learn", kind: "Referensi", url: "https://scikit-learn.org/stable/user_guide.html" },
      { name: "Tutorial resmi PyTorch", kind: "Referensi", url: "https://pytorch.org/tutorials/" },
    ],
    modules: [
      { id: "01", title: "Python ilmiah", summary: "NumPy, vektorisasi, dan pandas.", topics: ["NumPy", "pandas", "vektorisasi"], read: "Géron 2", status: "soon" },
      { id: "02", title: "Visualisasi data", summary: "matplotlib dan EDA yang informatif.", topics: ["matplotlib", "EDA"], read: "-", status: "soon" },
      { id: "03", title: "Pipeline scikit-learn", summary: "Preprocessing, ColumnTransformer, dan Pipeline.", topics: ["Pipeline", "preprocessing"], read: "Géron 2", status: "soon" },
      { id: "04", title: "Evaluasi model", summary: "Cross-validation, metrik, dan kebocoran data.", topics: ["CV", "metrik", "data leakage"], read: "Géron 3", status: "soon" },
      { id: "05", title: "Model klasik", summary: "Regresi, SVM, random forest, dan gradient boosting.", topics: ["SVM", "random forest", "boosting"], read: "Géron 4–7", status: "soon" },
      { id: "06", title: "PyTorch dasar", summary: "Tensor, autograd, dan Dataset/DataLoader.", topics: ["tensor", "autograd", "DataLoader"], read: "PyTorch tutorials", status: "soon" },
      { id: "07", title: "Neural network", summary: "MLP, training loop, regularisasi.", topics: ["MLP", "training loop", "dropout"], read: "Géron 10–11", status: "soon" },
      { id: "08", title: "CNN dan transfer learning", summary: "Konvolusi dan fine-tuning model pralatih.", topics: ["CNN", "transfer learning"], read: "Géron 14", status: "soon" },
      { id: "09", title: "Eksperimen reproducible", summary: "Seed, virtual environment, git, dan pelaporan hasil.", topics: ["seed", "venv", "git"], read: "-", status: "soon" },
      { id: "10", title: "Proyek portofolio", summary: "Membangun ulang skripsi penyakit jantung dengan pipeline modern.", topics: ["proyek", "README", "laporan"], read: "-", status: "soon" },
    ],
  },
];

// Fase belajar menuju pendaftaran (sekitar November 2027).
export const PHASES = [
  {
    when: "Nov 2026 – Jan 2027",
    title: "Fase 1: Bahasa formal",
    items: ["Matematika Diskrit modul 1–4", "Teori Komputasi modul 1–4", "Python: implementasikan DFA/NFA sendiri"],
  },
  {
    when: "Feb – Apr 2027",
    title: "Fase 2: Dua prasyarat",
    items: ["Teori Komputasi modul 5–9", "AI Klasik modul 1–6", "Matematika Diskrit modul 5–7"],
  },
  {
    when: "Mei – Jul 2027",
    title: "Fase 3: Kompleksitas & algoritma",
    items: ["Teori Komputasi modul 10–12", "AI Klasik modul 7–12", "Algoritma Lanjut modul 1–6", "Ujian IELTS"],
  },
  {
    when: "Agu – Okt 2027",
    title: "Fase 4: Riset & portofolio",
    items: ["Algoritma Lanjut modul 7–12", "Riset & Menulis: proposal 1.000 kata", "Python & ML: proyek portofolio"],
  },
];

export function findTrack(id) {
  return TRACKS.find((t) => t.id === id);
}
