/* =========================================================
   VANDERLEI.EXE: toda a mágica (e a vergonha alheia)
   ========================================================= */
(function () {
  "use strict";

  const CFG = window.VAND_CONFIG || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FINE_POINTER = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const ic = (name, cls = "") => `<svg class="ic ${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const store = {
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* modo anônimo */ } }
  };
  const srcset = (base) => `${base}-480.webp 480w, ${base}-900.webp 900w`;
  const HEART_PATH = "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z";
  const HEART = typeof Path2D === "function" ? new Path2D(HEART_PATH) : null;

  function loadImg(src) {
    return new Promise((res) => { if (!src) return res(null); const i = new Image(); i.decoding = "async"; i.onload = () => res(src); i.onerror = () => res(null); i.src = src; });
  }

  /* ---------------------------------------------------------
     Desenho vetorial de corações e brilhos no canvas
     --------------------------------------------------------- */
  function drawHeart(ctx, x, y, size, color) {
    if (!HEART) return;
    ctx.save(); ctx.translate(x - size / 2, y - size / 2); ctx.scale(size / 24, size / 24);
    ctx.fillStyle = color; ctx.fill(HEART); ctx.restore();
  }
  function drawSpark(ctx, x, y, size, color) {
    const r = size / 2;
    ctx.save(); ctx.translate(x, y); ctx.fillStyle = color; ctx.beginPath();
    ctx.moveTo(0, -r); ctx.quadraticCurveTo(0, 0, r, 0); ctx.quadraticCurveTo(0, 0, 0, r); ctx.quadraticCurveTo(0, 0, -r, 0); ctx.quadraticCurveTo(0, 0, 0, -r);
    ctx.fill(); ctx.restore();
  }

  /* ---------------------------------------------------------
     Confete: carregado sob demanda (não pesa no carregamento)
     --------------------------------------------------------- */
  let confettiP = null;
  function loadConfetti() {
    if (window.confetti) return Promise.resolve(window.confetti);
    if (!confettiP) confettiP = new Promise((res) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js";
      s.async = true; s.onload = () => res(window.confetti || null); s.onerror = () => res(null);
      document.head.appendChild(s);
    });
    return confettiP;
  }
  const COLORS = ["#ff2e7e", "#ffc857", "#ff6fa8", "#ffffff", "#7a0f3a"];
  async function boom(opts = {}) {
    if (REDUCED) return;
    const c = await loadConfetti();
    if (c) c(Object.assign({ particleCount: 120, spread: 90, origin: { y: 0.6 }, colors: COLORS }, opts));
    else FX.burst(innerWidth / 2, innerHeight * 0.6, 40);
  }
  async function heartRain(duration = 2500) {
    if (REDUCED) return;
    const c = await loadConfetti();
    if (!c || typeof c.shapeFromPath !== "function") {
      for (let i = 0; i < 8; i++) setTimeout(() => FX.burst(rand(0, innerWidth), rand(0, innerHeight * 0.5), 18), i * 250);
      return;
    }
    const heart = c.shapeFromPath({ path: HEART_PATH });
    const end = Date.now() + duration;
    (function frame() {
      c({ particleCount: 3, angle: 60, spread: 60, origin: { x: 0 }, shapes: [heart], colors: COLORS, scalar: 2 });
      c({ particleCount: 3, angle: 120, spread: 60, origin: { x: 1 }, shapes: [heart], colors: COLORS, scalar: 2 });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }

  /* ---------------------------------------------------------
     Partículas de corações (rastro do mouse e explosões)
     --------------------------------------------------------- */
  const FX = (() => {
    const cv = $("#fx-canvas");
    const ctx = cv.getContext("2d");
    let parts = [], running = false;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    resize(); addEventListener("resize", resize, { passive: true });
    const tints = ["#ff2e7e", "#ff6fa8", "#ffc857", "#ff8fb8", "#ffe29a"];
    function add(x, y, o = {}) {
      parts.push({ x, y, vx: o.vx ?? rand(-1, 1), vy: o.vy ?? rand(-2.5, -0.5), life: 1, decay: o.decay ?? rand(0.012, 0.025), size: o.size ?? rand(12, 22), c: o.c ?? pick(tints), spark: o.spark ?? Math.random() < 0.2, rot: rand(-0.4, 0.4), grav: o.grav ?? 0.02 });
      if (parts.length > 220) parts.splice(0, parts.length - 220);
      if (!running) { running = true; requestAnimationFrame(loop); }
    }
    function burst(x, y, n = 24) {
      if (REDUCED) return;
      for (let i = 0; i < n; i++) {
        const a = (Math.PI * 2 * i) / n, s = rand(2, 6);
        add(x, y, { vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, decay: rand(0.01, 0.02), size: rand(12, 24), grav: 0.08 });
      }
    }
    function loop() {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      parts = parts.filter((p) => p.life > 0);
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.vy += p.grav; p.life -= p.decay;
        ctx.globalAlpha = Math.max(p.life, 0);
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        if (p.spark) drawSpark(ctx, 0, 0, p.size * 0.8, p.c); else drawHeart(ctx, 0, 0, p.size, p.c);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      if (parts.length) requestAnimationFrame(loop); else { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
    }
    return { add, burst };
  })();

  /* ---------------------------------------------------------
     LOADING CINEMATOGRÁFICO
     --------------------------------------------------------- */
  const LOADER_TITLE = "O amor que você tanto esperou está carregando…";
  const PHRASES = [
    "Verificando se ele ainda está solteiro…",
    "Analisando a concorrência…",
    "Preparando o Vanderlei…",
    "Passando perfume no algoritmo…",
    "Removendo fotos com a ex do backup…",
    "Consultando a mãe dele (ela aprovou 3 de 4 candidatas)…",
    "Enchendo a jacuzzi…",
    "Ensaiando o 'oi, sumida' perfeito…",
    "Polindo o teto solar…",
    "Desembaçando os óculos escuros…",
    "Negociando com o cupido (ele cobrou em Pix)…",
    "Aplicando filtro 'homem sério que gosta de vinho'…"
  ];

  async function runLoader() {
    const loader = $("#loader");
    const typed = $("#typed");
    const phraseEl = $("#loader-phrase");
    const fill = $("#progress-fill");
    const pct = $("#progress-pct");
    const eta = $("#progress-eta");
    const bar = $("#progress");
    const skipBtn = $("#skip");
    const photo = $("#loader-photo");
    let skipped = false, finished = false, hasPhoto = false;

    const stopCanvas = loaderCanvas($("#loader-canvas"));
    const base = CFG.ABERTURA_FOTO;
    if (base) {
      const big = innerWidth > 700 ? `${base}-900.webp` : `${base}-480.webp`;
      loadImg(big).then((src) => { if (src) { hasPhoto = true; photo.style.backgroundImage = `url("${src}")`; photo.classList.add("ready"); } });
    }
    setTimeout(() => skipBtn.classList.add("show"), 2000);
    skipBtn.addEventListener("click", () => { skipped = true; phraseEl.textContent = "Ok, ok… pulando a parte romântica."; });

    (async () => {
      await sleep(REDUCED ? 0 : 1000);
      for (let i = 0; i <= LOADER_TITLE.length; i++) {
        if (skipped) { typed.textContent = LOADER_TITLE; break; }
        typed.textContent = LOADER_TITLE.slice(0, i);
        await sleep(REDUCED ? 0 : rand(28, 60));
      }
    })();

    const order = PHRASES.slice(0, 3).concat(PHRASES.slice(3).sort(() => Math.random() - 0.5));
    let pi = 0;
    const phraseTimer = setInterval(() => {
      if (finished) return;
      phraseEl.classList.add("swap");
      setTimeout(() => { phraseEl.textContent = order[pi++ % order.length]; phraseEl.classList.remove("swap"); }, 350);
    }, 1400);

    const ETAS = ["Tempo estimado: 2 a 3 dias úteis", "Tempo estimado: depende do humor dele", "Tempo estimado: logo ali (mentira)"];
    let p = 0;
    const set = (v) => {
      p = v; fill.style.width = v + "%"; pct.textContent = Math.floor(v) + "%"; bar.setAttribute("aria-valuenow", Math.floor(v));
      const k = v / 100;
      photo.style.filter = `blur(${(1 - k) * 28}px) brightness(${0.22 + k * 0.23}) saturate(${0.6 + k * 0.6})`;
      photo.style.transform = `scale(${1.25 - k * 0.15})`;
    };
    const start = performance.now();
    while (p < 99 && !skipped) {
      await sleep(REDUCED ? 20 : rand(80, 200));
      let step = rand(1.2, 7);
      if (p > 30 && p < 34 && Math.random() < 0.6) step = 0.15;
      if (p > 62 && p < 66) eta.textContent = pick(ETAS);
      if (p > 70 && p < 90 && Math.random() < 0.1) { set(Math.max(p - rand(4, 8), 0)); phraseEl.textContent = "Ops… ele mudou de ideia. Convencendo de novo…"; continue; }
      set(Math.min(p + step, 99));
      if (performance.now() - start > 5000) break;
    }
    set(99);
    if (!skipped) {
      clearInterval(phraseTimer);
      phraseEl.textContent = "Hesitando dramaticamente…";
      await sleep(REDUCED ? 0 : 1000);
      phraseEl.textContent = "Ele disse SIM!";
    }
    finished = true;
    clearInterval(phraseTimer);
    set(100);
    eta.textContent = "Tempo estimado: AGORA. Respira.";
    await sleep(REDUCED ? 0 : 450);

    if (hasPhoto) {
      loader.classList.add("flash", "revealing");
      FX.burst(innerWidth / 2, innerHeight * 0.5, 30);
      await sleep(REDUCED ? 0 : skipped ? 1500 : 2800);
      loader.classList.remove("flash"); void loader.offsetWidth;
    }

    loader.classList.add("flash");
    FX.burst(innerWidth / 2, innerHeight * 0.4, 36);
    await sleep(REDUCED ? 0 : 250);
    loader.classList.add("done", "out");
    document.body.classList.remove("is-loading");
    window.scrollTo(0, 0);
    setTimeout(() => boom({ particleCount: 140, spread: 120, origin: { y: 0.35 } }), 500);
    setTimeout(() => { stopCanvas(); loader.remove(); onReady(); }, REDUCED ? 50 : 1300);
  }

  function loaderCanvas(cv) {
    const ctx = cv.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let w, h, raf, stop = false;
    const resize = () => { w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); addEventListener("resize", resize);
    const N = Math.min(50, Math.floor((innerWidth * innerHeight) / 22000));
    const mk = (initial) => ({ x: rand(0, w), y: initial ? rand(0, h) : h + 20, s: rand(8, 20), vy: rand(0.3, 1.1), sway: rand(0.5, 2), ph: rand(0, 6.28), a: rand(0.15, 0.6), heart: Math.random() < 0.6, c: pick(["255,46,126", "255,111,168", "255,200,87"]) });
    const ps = Array.from({ length: N }, () => mk(true));
    function loop() {
      if (stop) return;
      ctx.clearRect(0, 0, w, h);
      for (const q of ps) {
        q.y -= q.vy; q.ph += 0.02;
        if (q.y < -30) Object.assign(q, mk(false));
        const x = q.x + Math.sin(q.ph) * q.sway * 10;
        const col = `rgba(${q.c},${q.a})`;
        if (q.heart) drawHeart(ctx, x, q.y, q.s, col); else drawSpark(ctx, x, q.y, q.s * 0.6, col);
      }
      raf = requestAnimationFrame(loop);
    }
    if (!REDUCED) raf = requestAnimationFrame(loop);
    return () => { stop = true; cancelAnimationFrame(raf); removeEventListener("resize", resize); };
  }

  /* ---------------------------------------------------------
     PÁGINA PRINCIPAL
     --------------------------------------------------------- */
  function onReady() {
    setupReveal();
    setupCounters();
    setupToasts();
    Cinema.startLoading();
  }

  let revealIO = null;
  function observeReveal(els) { if (revealIO) els.forEach((el) => revealIO.observe(el)); }
  function setupReveal() {
    revealIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); revealIO.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    $$(".reveal").forEach((el, i) => { el.style.transitionDelay = (i % 4) * 80 + "ms"; revealIO.observe(el); });
  }

  // Barra de progresso no topo + vídeo do scroll
  function setupScrollProgress() {
    const bar = $("#scroll-progress");
    let ticking = false;
    const update = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? clamp(scrollY / max, 0, 1) : 0})`;
      Cinema.onScroll();
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener("resize", () => { Cinema.resize(); update(); }, { passive: true });
    update();
  }

  function animateNum(el, to, dur = 1800) {
    const from = parseInt(el.textContent.replace(/\D/g, ""), 10) || 0;
    const t0 = performance.now();
    (function tick(t) {
      const k = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(from + (to - from) * e).toLocaleString("pt-BR");
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }
  function bump(el) { el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }

  function setupCounters() {
    const section = $("#contadores");
    let visible = false;
    new IntersectionObserver((en) => { visible = en[0].isIntersecting; }).observe(section);
    const active = () => visible && !document.hidden;
    const elI = $("#c-inscritas"), elV = $("#c-vagas"), elC = $("#c-coracoes"), elS = $("#c-solteirice"), foot = $("#c-vagas-foot"), meter = $("#meter-fill");
    let inscritas = 1847 + Math.floor(rand(0, 300)) + (store.get("vand_bonus") || 0);
    let vagas = 7, coracoes = 312 + Math.floor(rand(0, 90));
    animateNum(elI, inscritas); animateNum(elC, coracoes); animateNum(elS, 99, 2500);
    setTimeout(() => (meter.style.transform = "scaleX(.99)"), 200);
    setTimeout(() => { elS.textContent = "100"; bump(elS); }, 6000);
    setTimeout(() => { elS.textContent = "127"; bump(elS); meter.style.transform = "scaleX(1)"; }, 11000);
    const foots = ["corre que tá acabando", "uma desistiu, abriu vaga!", "a mãe dele vetou uma", "acabou de esgotar… mentira", "duas brigaram pela mesma vaga", "ele criou mais uma (carente)"];
    setInterval(() => { if (!active()) return; inscritas += Math.floor(rand(1, 4)); elI.textContent = inscritas.toLocaleString("pt-BR"); bump(elI); }, 3800);
    setInterval(() => {
      if (!active()) return;
      if (vagas > 1 && Math.random() < 0.7) vagas--; else vagas += Math.floor(rand(1, 3));
      if (vagas > 9) vagas = 3;
      elV.textContent = vagas; bump(elV); foot.textContent = pick(foots);
    }, 6500);
    setInterval(() => { if (!active()) return; coracoes += 1; elC.textContent = coracoes.toLocaleString("pt-BR"); bump(elC); }, 9000);
  }

  function toast(icon, html, ms = 4800) {
    const box = $("#toasts");
    const t = document.createElement("div");
    t.className = "toast";
    t.innerHTML = `<span class="t-ic">${ic(icon)}</span><span>${html}</span>`;
    box.appendChild(t);
    while (box.children.length > 2) box.removeChild(box.firstChild);
    setTimeout(() => { t.classList.add("bye"); setTimeout(() => t.remove(), 450); }, ms);
  }

  function setupToasts() {
    const nomes = ["Fernanda", "Jéssica", "Camila", "Bruna", "Patrícia", "Larissa", "Aline", "Rafaela", "Tati", "Gabi", "Dona Neide", "Kelly", "Monique", "Jaque"];
    const cidades = ["Itaquaquecetuba", "Carapicuíba", "Pindamonhangaba", "Osasco", "Mogi das Cruzes", "Guarulhos", "Barueri", "Jundiaí", "Taboão da Serra", "Paris (do Paraná)", "Cocal do Sul", "Xique-Xique"];
    const acoes = [
      ["heart", (n, c) => `<b>${n}</b> de ${c} acabou de se inscrever`],
      ["eye", (n, c) => `<b>${n}</b> de ${c} curtiu uma foto dele de 2019`],
      ["circle-x", (n, c) => `<b>${n}</b> de ${c} foi <b>reprovada</b> por torcer pro time errado`],
      ["message-circle", (n, c) => `<b>${n}</b> de ${c} está digitando… há 40 minutos`],
      ["users", (n, c) => `<b>${n}</b> de ${c} perguntou se ele tem irmão`],
      ["car", (n, c) => `<b>${n}</b> de ${c} pediu carona no carro do teto solar`],
      ["eye", () => `<b>A mãe do Vanderlei</b> está online`],
      ["flame", () => `Pico de acessos! Servidor do amor em <b>chamas</b>`]
    ];
    const fire = () => { if (Cinema.inView()) return; const [i, f] = pick(acoes); toast(i, f(pick(nomes), pick(cidades))); };
    setTimeout(fire, 2500);
    (function loop() { setTimeout(() => { if (!document.hidden) fire(); loop(); }, rand(9000, 15000)); })();
  }

  /* ---------------------------------------------------------
     CINEMA: vídeo quebrado em quadros, controlado pelo scroll
     --------------------------------------------------------- */
  const Cinema = (() => {
    const sec = $("#cinema");
    const cv = $("#cinema-canvas");
    const ctx = cv.getContext("2d", { alpha: false });
    const caps = $$(".cap", sec);
    const hint = $("#cinema-hint");
    const barEl = $("#cinema-bar");
    const tc = $("#cinema-tc");
    const C = CFG.CINEMA || {};
    const N = C.quadros || 0;
    const small = innerWidth < 760 || !!(navigator.connection && navigator.connection.saveData);
    const folder = small ? C.pastaPequena : C.pastaGrande;
    const frames = new Array(N);
    let cur = -1, w = 0, h = 0, started = false, last = null;
    const url = (i) => `${folder}f-${String(i + 1).padStart(3, "0")}.webp`;

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      last = null; draw(cur < 0 ? 0 : cur);
    }
    function nearest(i) {
      for (let d = 0; d < N; d++) {
        if (frames[i - d] && frames[i - d].ok) return frames[i - d].img;
        if (frames[i + d] && frames[i + d].ok) return frames[i + d].img;
      }
      return null;
    }
    function draw(i) {
      const img = nearest(i);
      if (!img || !w || img === last) return;
      last = img;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const portrait = h > w;
      // No celular (retrato) o vídeo ocupa a faixa central com zoom suave, focado no motorista.
      const s = portrait ? Math.max(w / iw, (h * 0.62) / ih) : Math.max(w / iw, h / ih);
      const dw = iw * s, dh = ih * s;
      const fx = portrait ? 0.42 : 0.5;
      const dx = clamp(w / 2 - dw * fx, w - dw, 0), dy = (h - dh) / 2;
      ctx.fillStyle = "#050103"; ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, dx, dy, dw, dh);
    }
    function progress() {
      const total = sec.offsetHeight - innerHeight;
      return total > 0 ? clamp(-sec.getBoundingClientRect().top / total, 0, 1) : 0;
    }
    function onScroll() {
      if (!N) return;
      const r = sec.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = progress();
      const i = Math.round(p * (N - 1));
      if (i !== cur) { cur = i; draw(i); }
      barEl.style.transform = `scaleX(${p})`;
      const secs = p * (N / 12);
      tc.textContent = `00:00:${String(Math.floor(secs)).padStart(2, "0")}:${String(Math.floor((secs % 1) * 24)).padStart(2, "0")}`;
      caps.forEach((c) => c.classList.toggle("on", p >= +c.dataset.from && p < +c.dataset.to));
      hint.classList.toggle("gone", p > 0.04);
    }
    function load(i) {
      if (frames[i]) return Promise.resolve();
      const img = new Image();
      img.decoding = "async";
      frames[i] = { img, ok: false };
      return new Promise((res) => {
        img.onload = () => { frames[i].ok = true; if (cur < 0 || Math.abs(i - cur) < 6) { last = null; draw(cur < 0 ? 0 : cur); } res(); };
        img.onerror = () => res();
        img.src = url(i);
      });
    }
    async function startLoading() {
      if (started || !N) return; started = true;
      // Ordem espaçada: o scrub já funciona cedo e vai ganhando quadros
      const seen = new Set(), order = [];
      for (let step = 8; step >= 1; step = Math.floor(step / 2)) for (let i = 0; i < N; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
      let k = 0;
      const worker = async () => { while (k < order.length) await load(order[k++]); };
      await Promise.all([worker(), worker(), worker(), worker()]);
    }
    if (N) load(0).then(() => { resize(); onScroll(); });
    return { onScroll, resize, startLoading, inView: () => { const r = sec.getBoundingClientRect(); return r.bottom > innerHeight * 0.5 && r.top < innerHeight * 0.5; }, get frame() { return cur; }, get loaded() { return frames.filter((f) => f && f.ok).length; } };
  })();
  window.__vandCinema = Cinema;

  /* ---------------------------------------------------------
     Microinterações
     --------------------------------------------------------- */
  function setupMicro() {
    let lastT = 0;
    if (FINE_POINTER && !REDUCED) {
      addEventListener("pointermove", (e) => {
        if (document.body.classList.contains("is-loading")) return;
        const now = performance.now();
        if (now - lastT < 50) return; lastT = now;
        FX.add(e.clientX + rand(-4, 4), e.clientY + 6, { vx: rand(-0.5, 0.5), vy: rand(-1.4, -0.4), size: rand(9, 15), decay: 0.028, grav: -0.01 });
      }, { passive: true });
    }
    document.addEventListener("click", (e) => {
      const b = e.target.closest(".btn, .nav-cta, .ig-card, .vault-open");
      if (b) FX.burst(e.clientX, e.clientY, 14);
    });

    if (FINE_POINTER && !REDUCED) {
      $$(".tilt").forEach((el) => {
        el.addEventListener("pointermove", (e) => {
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          el.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
        });
        el.addEventListener("pointerleave", () => { el.style.transition = "transform .5s"; el.style.transform = ""; setTimeout(() => (el.style.transition = ""), 500); });
      });
      $$(".magnetic").forEach((el) => {
        el.addEventListener("pointermove", (e) => {
          const r = el.getBoundingClientRect();
          el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
        });
        el.addEventListener("pointerleave", () => (el.style.transform = ""));
      });
    }

    $$(".flag").forEach((f) => f.addEventListener("click", () => f.classList.toggle("flipped")));
    $$(".stars").forEach((s) => { const n = +s.dataset.n; s.setAttribute("role", "img"); s.setAttribute("aria-label", `${n} de 5 estrelas`); s.innerHTML = Array.from({ length: 5 }, (_, i) => ic("star", i < n ? "" : "off")).join(""); });

    const skills = $(".skills");
    new IntersectionObserver((en, io) => { if (en[0].isIntersecting) { skills.classList.add("in"); io.disconnect(); } }, { threshold: 0.3 }).observe(skills);

    const no = $("#btn-no"), yes = $("#btn-yes"), note = $("#decide-note");
    const noTexts = ["Não", "Tem certeza?", "Pensa bem…", "Ele chorou", "Última chance", "Erro 404", "Nem pensar", "Aperta o outro!"];
    let tries = 0;
    const flee = () => {
      tries++;
      const max = Math.min(140, innerWidth / 3);
      no.style.transform = `translate(${rand(-max, max)}px, ${rand(-60, 60)}px) rotate(${rand(-20, 20)}deg)`;
      no.textContent = noTexts[tries % noTexts.length];
      yes.style.transform = `scale(${Math.min(1 + tries * 0.08, 1.8)})`;
      if (tries === 5) note.textContent = "O botão “Não” foi demitido por baixo desempenho.";
    };
    no.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") flee(); });
    no.addEventListener("click", (e) => { e.preventDefault(); flee(); });
    yes.addEventListener("click", () => {
      heartRain(2000);
      note.textContent = "Sabia! Agora prova que é sério: faça o processo seletivo aqui embaixo.";
      setTimeout(() => $("#inscricao").scrollIntoView({ behavior: "smooth" }), 900);
    });

    $$("[data-close]").forEach((b) => b.addEventListener("click", () => (b.closest(".modal").hidden = true)));
    $$(".modal").forEach((m) => m.addEventListener("click", (e) => { if (e.target === m) m.hidden = true; }));
  }

  /* ---------------------------------------------------------
     Fotos: retrato rotativo, galeria, secretas e lightbox
     --------------------------------------------------------- */
  const LB = { list: [], i: 0 };
  function openLightbox(list, i = 0) {
    LB.list = list; LB.i = i; showLB();
    $("#lightbox").hidden = false;
    $("#lb-prev").hidden = $("#lb-next").hidden = list.length < 2;
  }
  function showLB() {
    const it = LB.list[LB.i];
    const img = $("#lightbox-img");
    img.src = `${it.foto}-900.webp`; img.alt = it.legenda || it.titulo || "";
    $("#lightbox-title").textContent = it.titulo || "";
    $("#lightbox-cap").textContent = it.legenda || "";
  }
  function stepLB(d) { LB.i = (LB.i + d + LB.list.length) % LB.list.length; showLB(); }

  function setupPhotos() {
    if (CFG.AVATAR_FOTO) loadImg(CFG.AVATAR_FOTO).then((src) => { if (src) { const av = $("#ig-avatar"); av.style.backgroundImage = `url("${src}")`; av.textContent = ""; } });

    // Retrato rotativo
    const retrato = (CFG.RETRATO || []).filter((r) => r && r.foto);
    if (retrato.length) {
      const frame = $("#portrait-frame"), badge = $("#portrait-badge");
      const layers = retrato.map((r, i) => {
        const im = document.createElement("img");
        im.className = "portrait-photo" + (i === 0 ? " on" : "");
        im.srcset = srcset(r.foto); im.sizes = "(max-width: 900px) 70vw, 380px";
        im.src = `${r.foto}-480.webp`; im.width = 380; im.height = 475;
        im.alt = i === 0 ? "Vanderlei Lopes, o candidato" : "";
        im.decoding = "async"; if (i > 0) im.loading = "lazy";
        im.style.objectPosition = r.pos || "50% 30%";
        frame.insertBefore(im, frame.firstChild);
        return im;
      });
      $("#monogram").hidden = true;
      frame.classList.add("has-photo");
      const setBadge = (r) => { badge.innerHTML = `${ic(r.icone || "heart")}<span></span>`; badge.querySelector("span").textContent = r.selo; };
      setBadge(retrato[0]);
      let idx = 0, visible = true;
      new IntersectionObserver((en) => { visible = en[0].isIntersecting; }).observe(frame);
      const go = (n) => {
        layers[idx].classList.remove("on");
        idx = (n + layers.length) % layers.length;
        layers[idx].classList.add("on");
        badge.classList.remove("pop"); void badge.offsetWidth; badge.classList.add("pop");
        setBadge(retrato[idx]);
      };
      if (layers.length > 1) {
        const tick = () => visible && !document.hidden && go(idx + 1);
        let timer = setInterval(tick, 4200);
        frame.addEventListener("click", () => { clearInterval(timer); go(idx + 1); timer = setInterval(tick, 4200); });
      }
    }

    // Galeria
    const g = $("#gallery");
    const fotos = (CFG.FOTOS || []).filter((f) => f && f.foto);
    fotos.forEach((f, i) => {
      const card = polaroid();
      card.innerHTML = `<div class="ph"><img srcset="${srcset(f.foto)}" sizes="(max-width: 480px) 90vw, (max-width: 900px) 45vw, 360px" src="${f.foto}-480.webp" width="360" height="450" loading="lazy" decoding="async" alt=""></div><p></p>`;
      card.querySelector("p").textContent = f.legenda;
      card.querySelector("img").alt = "Foto do Vanderlei";
      card.addEventListener("click", () => openLightbox(fotos, i));
      g.appendChild(card);
      observeReveal([card]);
    });
    renderSecrets();

    // Lightbox
    const close = () => ($("#lightbox").hidden = true);
    $("#lightbox-close").addEventListener("click", close);
    $("#lb-prev").addEventListener("click", () => stepLB(-1));
    $("#lb-next").addEventListener("click", () => stepLB(1));
    $("#lightbox").addEventListener("click", (e) => { if (e.target.id === "lightbox") close(); });
    addEventListener("keydown", (e) => {
      if (!$("#lightbox").hidden) { if (e.key === "ArrowLeft") stepLB(-1); if (e.key === "ArrowRight") stepLB(1); }
      if (e.key === "Escape") { close(); $$(".modal").forEach((m) => (m.hidden = true)); }
    });

    // Embeds oficiais do Instagram (opcional)
    const posts = (CFG.POSTS_INSTAGRAM || []).filter(Boolean);
    if (posts.length) {
      const box = $("#ig-embeds");
      posts.forEach((u) => {
        const bq = document.createElement("blockquote");
        bq.className = "instagram-media"; bq.setAttribute("data-instgrm-permalink", u); bq.setAttribute("data-instgrm-version", "14");
        bq.style.cssText = "background:#fff;border-radius:12px;margin:0;max-width:540px;width:100%;min-width:0";
        box.appendChild(bq);
      });
      const s = document.createElement("script"); s.async = true; s.src = "https://www.instagram.com/embed.js"; document.body.appendChild(s);
    }
  }

  function polaroid() {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "polaroid reveal";
    card.style.setProperty("--r", `${rand(-5, 5).toFixed(1)}deg`);
    return card;
  }

  let secretCards = [];
  const isUnlocked = () => store.get("vand_cofre") === true || window.__vandUnlocked === true;
  async function renderSecrets(justNow = false) {
    const g = $("#gallery");
    const secretas = (CFG.SECRETAS || []).filter(Boolean);
    const unlocked = isUnlocked();
    // Só baixa as fotos secretas depois do código (ninguém espia pelo carregamento da página)
    const exists = unlocked ? await Promise.all(secretas.map((s) => loadImg(`${s.foto}-480.webp`))) : secretas.map(() => null);
    secretCards.forEach((c) => c.remove());
    secretCards = [];
    const disponiveis = secretas.filter((s, i) => unlocked && exists[i]);
    secretas.forEach((s, i) => {
      const card = polaroid();
      card.classList.add("in");
      if (!unlocked) {
        card.classList.add("locked");
        card.innerHTML = `<div class="ph"><div class="lock">${ic("lock")}<b>Conteúdo confidencial</b><span>Só com o código secreto do cofre</span></div></div><p>Foto secreta nº ${i + 1}</p>`;
        card.setAttribute("aria-label", "Foto secreta trancada. Abrir o cofre");
        card.addEventListener("click", () => openVault());
      } else if (!exists[i]) {
        card.innerHTML = `<div class="ph"><div class="lock">${ic("hourglass")}<b>Em breve</b><span></span></div></div><p></p>`;
        card.querySelector(".lock span").textContent = s.emBreve || "Foto em produção.";
        card.querySelector("p").textContent = s.titulo.replace(/^Desbloqueado:\s*/, "");
        card.addEventListener("click", () => toast("hourglass", s.emBreve || "Foto em produção."));
      } else {
        card.innerHTML = `<span class="stamp">Desbloqueada</span><div class="ph"><img srcset="${srcset(s.foto)}" sizes="(max-width: 480px) 90vw, (max-width: 900px) 45vw, 360px" src="${s.foto}-480.webp" width="360" height="450" loading="lazy" decoding="async" alt=""></div><p></p>`;
        card.querySelector("p").textContent = s.titulo.replace(/^Desbloqueado:\s*/, "");
        card.querySelector("img").alt = "Foto secreta do Vanderlei";
        card.addEventListener("click", () => openLightbox(disponiveis, disponiveis.indexOf(s)));
        if (justNow) card.classList.add("just-unlocked");
      }
      g.appendChild(card);
      secretCards.push(card);
    });
    return disponiveis;
  }

  /* ---------------------------------------------------------
     COFRE SECRETO (código no controle da tela ou no teclado)
     --------------------------------------------------------- */
  const CODE = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  let vpos = 0;
  const WRONG = ["Errou. O Vanderlei sentiu daqui.", "Código errado. Tenta lembrar da infância.", "Quase! Só que não.", "Alarme do cofre ativado (mentira). Tenta de novo."];
  function openVault() {
    vpos = 0; paintDots();
    $(".vault-box").classList.toggle("open", isUnlocked());
    $("#vault-ic use").setAttribute("href", isUnlocked() ? "#i-lock-open" : "#i-lock");
    $("#vault-msg").textContent = isUnlocked() ? "O cofre já está aberto. Corre na galeria." : "Digite o código no controle. Dica: é o mesmo dos videogames da infância dele.";
    $("#vault").hidden = false;
  }
  function paintDots(state = "") {
    const d = $("#vault-dots");
    d.className = "vault-dots " + state;
    d.innerHTML = CODE.map((_, i) => `<i class="${i < vpos ? "on" : ""}"></i>`).join("");
  }
  function press(k) {
    if (k === CODE[vpos]) {
      vpos++; paintDots();
      if (vpos === CODE.length) { vpos = 0; paintDots("ok"); unlock(); }
    } else {
      vpos = k === CODE[0] ? 1 : 0;
      if (!$("#vault").hidden) { paintDots("err"); $("#vault-msg").textContent = pick(WRONG); setTimeout(() => paintDots(), 450); }
    }
  }
  async function unlock() {
    const first = !isUnlocked();
    store.set("vand_cofre", true);
    window.__vandUnlocked = true;
    if (!$("#vault").hidden) {
      $(".vault-box").classList.add("open");
      $("#vault-ic use").setAttribute("href", "#i-lock-open");
      $("#vault-msg").textContent = "COFRE ABERTO! Respira fundo…";
    }
    document.body.classList.add("supremo");
    setTimeout(() => document.body.classList.remove("supremo"), 2600);
    heartRain(3000);
    const disponiveis = await renderSecrets(true);
    setTimeout(() => {
      $("#vault").hidden = true;
      if (disponiveis.length) openLightbox(disponiveis, 0);
      else toast("hourglass", "Cofre aberto, mas as fotos ainda estão em produção.");
      if (first) setTimeout(() => toast("crown", "Você desbloqueou o <b>Modo Vanderlei Supremo</b>. As fotos ficam liberadas na galeria."), 800);
    }, 1400);
  }
  function setupVault() {
    $("#vault-open").addEventListener("click", openVault);
    $$(".pad button").forEach((b) => b.addEventListener("click", () => {
      b.classList.add("hit"); setTimeout(() => b.classList.remove("hit"), 120);
      if (navigator.vibrate) navigator.vibrate(12);
      press(b.dataset.k);
    }));
    addEventListener("keydown", (e) => {
      if (e.target.matches && e.target.matches("input, textarea")) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (!$("#vault").hidden && key.startsWith("Arrow")) e.preventDefault();
      if ($("#lightbox").hidden && (CODE.includes(key) || vpos > 0)) press(key);
    });
  }

  /* ---------------------------------------------------------
     QUIZ
     --------------------------------------------------------- */
  const QUIZ = [
    { icon: "utensils", q: "Qual seria o primeiro encontro ideal com o Vanderlei?", hint: "Pense bem. Ele vai contar pros amigos.", opts: [
      ["Jantar à luz de velas num restaurante chique", 2, "Chique! Ele vai pedir o prato mais barato e dizer que 'não tá com fome'."],
      ["Rodízio de pizza até alguém passar mal", 3, "Resposta de quem entende o coração (e o estômago) dele."],
      ["Jacuzzi com vinho e charuto, no estilo dele", 3, "Você claramente stalkeou as fotos. Aprovada na pesquisa de campo."],
      ["Missa das 7h com a mãe dele", 2, "A sogra já gostou de você. Ele, ainda não sabemos."]
    ]},
    { icon: "mic", q: "O Vanderlei te manda um áudio de 7 minutos. Você…", opts: [
      ["Ouço em 2x e respondo com 'kkkk sim'", 2, "Eficiência. Ele nunca vai perceber."],
      ["Ouço inteiro, com fone, emocionada", 3, "Isso é amor. Ou paciência de monge."],
      ["Mando um áudio de 8 minutos pra ganhar", 3, "Guerra de áudios: a base de todo relacionamento saudável."],
      ["Peço pra ele mandar por escrito", 0, "Ele não sabe digitar. Ele SÓ manda áudio."]
    ]},
    { icon: "wallet", q: "Chegou a conta do restaurante. Qual a sua posição?", opts: [
      ["Divide meio a meio, igualdade!", 2, "Justa. Ele vai fazer a conta no celular por 10 minutos."],
      ["Ele paga, ué. Ele que chamou", 1, "Ele vai pagar… parcelado em 3x no cartão da mãe."],
      ["Eu pago e ele me deve um favor", 3, "Estratégica! Ele vai te dever pra sempre."],
      ["A gente sai correndo", 0, "Ousada. Mas ele é lento. Vocês serão pegos."]
    ]},
    { icon: "ghost", q: "O Vanderlei sumiu por 3 dias sem responder. O que você faz?", opts: [
      ["Mando 'oi sumido' com figurinha", 3, "Linguagem nativa dele. Ele responde em 40 minutos."],
      ["Ligo pra mãe dele", 2, "Atitude! A mãe responde mais rápido que ele."],
      ["Aviso a polícia, os bombeiros e o Datena", 1, "Exagerada. E os bombeiros? Ele é um deles (nas fotos)."],
      ["Nem percebo, também sumi", 3, "Almas gêmeas do vácuo."]
    ]},
    { icon: "music", q: "Qual talento oculto você espera do Vanderlei?", opts: [
      ["Cantar sertanejo no karaokê com a mão no peito", 3, "Ele faz isso. Sem ser convidado."],
      ["Cozinhar um strogonoff de respeito", 2, "Ele faz. Com batata palha de marca genérica."],
      ["Escalar montanha de sandália", 2, "Tem foto provando. A sandália sobreviveu, a dignidade não sabemos."],
      ["Não ter talento nenhum, só beleza", 2, "Sincera. Ele vai aceitar como elogio."]
    ]},
    { icon: "cake-slice", q: "A mãe dele te convida pro almoço de domingo. Você…", opts: [
      ["Levo pudim e conquisto todo mundo", 3, "Aprovação automática da sogra. Jogada de mestre."],
      ["Vou e lavo a louça no final", 3, "Você acabou de ganhar mais pontos que ele em 20 anos."],
      ["Invento que tenho plantão", 0, "A mãe dele sabe. A mãe dele SEMPRE sabe."],
      ["Vou, mas como e saio correndo", 1, "Comeu e vazou. A tia vai comentar até o Natal."]
    ]},
    { icon: "dog", q: "Sobre pets, qual é a sua?", opts: [
      ["Amo cachorro, quanto mais melhor", 3, "Ele vai te amar. O cachorro dele também."],
      ["Gato, porque sou independente", 2, "Ele vai tentar ser amigo do gato. O gato vai ignorar."],
      ["Só tenho planta e ela tá morrendo", 1, "Ele cuida de você, você cuida da planta. Ou não."],
      ["O pet seria o próprio Vanderlei", 2, "Ele come, dorme e pede carinho. Faz sentido."]
    ]},
    { icon: "flag", q: "Qual red flag você tolera nele?", hint: "Escolha com sabedoria. Ele tem todas.", opts: [
      ["Ele comenta 'kkkkk' em post de velório", 1, "Ele não lê os posts. Só reage."],
      ["Dorme de meia", 2, "Inofensivo. Mas ele usa meia de time."],
      ["Chama todo mundo de 'meu bem'", 2, "Inclusive o motoboy. Você foi avisada."],
      ["Todas. Eu sou a green flag do casal", 3, "Maturidade emocional nível: casamento no civil."]
    ]}
  ];

  function setupQuiz() {
    const form = $("#quiz-form");
    const wrap = $("#quiz-steps");
    const L = "ABCD";

    QUIZ.forEach((item, qi) => {
      const fs = document.createElement("fieldset");
      fs.className = "step"; fs.dataset.step = String(qi + 1);
      fs.innerHTML = `<legend>${ic(item.icon, "q-ic")}${qi + 1}. ${item.q}</legend>${item.hint ? `<p class="q-hint">${item.hint}</p>` : ""}<div class="options" role="radiogroup"></div><p class="reaction" aria-live="polite"></p>`;
      const opts = fs.querySelector(".options");
      item.opts.forEach((o, oi) => {
        const lab = document.createElement("label");
        lab.className = "option";
        lab.innerHTML = `<input type="radio" name="q${qi + 1}" data-pts="${o[1]}"><span data-l="${L[oi]}"></span>`;
        lab.querySelector("input").value = o[0];
        lab.querySelector("span").appendChild(document.createTextNode(o[0]));
        lab.querySelector("input").addEventListener("change", () => {
          fs.querySelector(".reaction").textContent = o[2];
          const r = lab.getBoundingClientRect();
          FX.burst(r.left + 30, r.top + r.height / 2, 10);
        });
        opts.appendChild(lab);
      });
      wrap.appendChild(fs);
    });

    const steps = $$(".step", form);
    const total = steps.length;
    const next = $("#quiz-next"), prev = $("#quiz-prev");
    let cur = 0;

    function show(i, back = false) {
      steps.forEach((s) => s.classList.remove("active", "back-anim"));
      steps[i].classList.add("active");
      if (back) steps[i].classList.add("back-anim");
      cur = i;
      $("#quiz-progress-fill").style.transform = `scaleX(${i / (total - 1)})`;
      $("#quiz-step-label").textContent = i === 0 ? `Etapa 1 de ${total} · Identificação` : i === total - 1 ? `Etapa ${total} de ${total} · Grand finale` : `Etapa ${i + 1} de ${total} · Pergunta ${i} de ${QUIZ.length}`;
      prev.hidden = i === 0;
      next.innerHTML = i === 0 ? `Começar o teste ${ic("arrow-right")}` : i === total - 1 ? `Enviar candidatura ${ic("heart")}` : `Próxima ${ic("arrow-right")}`;
      if (i > 0) $("#quiz-card").scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function fieldErr(name, msg) {
      const field = form.elements[name].closest(".field");
      if (field) { field.classList.toggle("invalid", !!msg); field.querySelector(".err").textContent = msg || ""; }
      return !msg;
    }

    function validateData() {
      const f = form.elements;
      const nome = f.nome.value.trim();
      const idade = parseInt(f.idade.value, 10);
      const ig = f.instagram.value.trim().replace(/^@+/, "");
      const cidade = f.cidade.value.trim();
      let ok = true;
      ok = fieldErr("nome", nome.length < 2 ? "Até o Vanderlei tem nome. Preenche aí." : "") && ok;
      ok = fieldErr("idade", isNaN(idade) ? "Idade, por favor (prometemos não julgar)" : idade > 120 ? "Ok, vampira. Coloca a idade real." : "") && ok;
      ok = fieldErr("cidade", cidade.length < 2 ? "Ele precisa saber se vai de carro ou de busão" : "") && ok;
      ok = fieldErr("instagram", !/^[A-Za-z0-9._]{1,30}$/.test(ig) ? "Instagram inválido (ele vai stalkear, então capricha)" : "") && ok;
      const maior = f.maior.checked;
      $("#err-maior").textContent = maior ? "" : "Marque aqui pra confirmar que é +18 e que sabe que é zoeira.";
      ok = ok && maior;
      if (!isNaN(idade) && idade < 18) { blockMinor(); return false; }
      if (ok) f.instagram.value = ig;
      return ok;
    }

    const toggleChrome = (v) => { $(".quiz-progress").style.visibility = v; $("#quiz-step-label").style.visibility = v; };
    function blockMinor() { form.hidden = true; $("#blocked").hidden = false; toggleChrome("hidden"); }
    $("#blocked-back").addEventListener("click", () => {
      $("#blocked").hidden = true; form.hidden = false; form.elements.idade.value = ""; form.elements.idade.focus(); toggleChrome("");
    });

    next.addEventListener("click", () => {
      if (cur === 0) { if (!validateData()) return; }
      else if (cur < total - 1) {
        if (!steps[cur].querySelector("input:checked")) {
          steps[cur].querySelector(".reaction").textContent = pick(["Escolhe uma, não é prova do Enem.", "Indecisa? Ele também. Mas escolhe!", "Pular pergunta é red flag."]);
          steps[cur].querySelector(".options").animate([{ transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "none" }], { duration: 300 });
          return;
        }
      } else { return submit(); }
      show(cur + 1);
    });
    prev.addEventListener("click", () => cur > 0 && show(cur - 1, true));
    form.addEventListener("submit", (e) => e.preventDefault());
    form.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") { e.preventDefault(); next.click(); } });

    async function submit() {
      next.disabled = true;
      const f = form.elements;
      const answers = {};
      let pts = 0, max = 0;
      QUIZ.forEach((_, i) => {
        const c = form.querySelector(`input[name="q${i + 1}"]:checked`);
        answers["q" + (i + 1)] = c ? c.value : "";
        pts += c ? +c.dataset.pts : 0; max += 3;
      });
      const nome = f.nome.value.trim();
      const self = /vanderlei|vand/i.test(nome);
      const score = self ? 100 : clamp(Math.round((pts / max) * 100), 7, 100);

      let veredito, cls, icon, txt;
      if (self) {
        veredito = "AUTOAPROVADO"; cls = "ok"; icon = "crown"; txt = "Vanderlei, a gente sabe que é você. Para de se inscrever no próprio site.";
      } else if (score >= 75) {
        veredito = "APROVADA"; cls = "ok"; icon = "circle-check"; txt = pick([
          "Parabéns! Você foi oficialmente aprovada para a próxima fase: ser ignorada no direct por 2 dias úteis. Preparamos os convites (de papel reciclado).",
          "Os astros, a mãe dele e o grupo de amigos concordam: vocês são o casal do ano. Já pode escolher o nome do primeiro cachorro."
        ]);
      } else if (score >= 45) {
        veredito = "LISTA DE ESPERA"; cls = "wait"; icon = "hourglass"; txt = pick([
          "Você está na lista de espera, posição nº " + Math.floor(rand(12, 380)) + ". Fica de olho: ele costuma desistir de tudo em 2 semanas.",
          "Quase! O comitê ficou dividido. Um amigo votou sim, outro votou 'kkkk', e o terceiro tava comendo."
        ]);
      } else {
        veredito = "REPROVADA"; cls = "no"; icon = "heart-crack"; txt = pick([
          "Infelizmente o sistema detectou excesso de bom senso. Você é boa demais pra ele. Isso não é um elogio pra ele.",
          "Reprovada, mas com honra. Você claramente tem amor-próprio e isso é incompatível com o Vanderlei."
        ]);
      }

      $(".quiz-nav").hidden = true; form.hidden = true; $("#analyzing").hidden = false;
      $("#quiz-progress-fill").style.transform = "scaleX(1)";
      const msgs = ["Consultando os astros…", "Perguntando pra mãe dele…", "Comparando com a ex (ganhou de lavada)…", "Rodando inteligência artificial (e burrice natural)…", "Calculando química, física e biologia…", "Finalizando veredito dramático…"];
      const payload = Object.assign({
        timestamp: new Date().toISOString(),
        nome, idade: f.idade.value, instagram: "@" + f.instagram.value.replace(/^@+/, ""), cidade: f.cidade.value.trim(),
        mensagem: f.mensagem.value.trim(), score: String(score), veredito, userAgent: navigator.userAgent.slice(0, 200)
      }, answers);
      const sending = send(payload);
      for (let i = 0; i < msgs.length; i++) {
        $("#analyzing-text").textContent = msgs[i];
        $("#analyzing-fill").style.width = ((i + 1) / msgs.length) * 100 + "%";
        await sleep(REDUCED ? 100 : 600);
      }
      const sent = await sending;

      $("#analyzing").hidden = true; $("#result").hidden = false;
      const v = $("#verdict"); v.innerHTML = `${ic(icon)}<span></span>`; v.querySelector("span").textContent = veredito; v.className = "verdict " + cls;
      $("#verdict-text").textContent = txt;
      $("#cert-name").textContent = nome; $("#cert-city").textContent = payload.cidade;
      $("#cert-num").textContent = String(Math.floor(rand(1000, 9999)));
      const arc = $("#score-arc");
      arc.style.stroke = cls === "ok" ? "#3ddc97" : cls === "wait" ? "#ffc857" : "#ff5d5d";
      requestAnimationFrame(() => (arc.style.strokeDashoffset = String(327 - (327 * score) / 100)));
      animateNum($("#score-num"), score, 1800);
      setTimeout(() => ($("#score-num").textContent = score + "%"), 1850);
      $("#send-status").textContent = sent;
      $("#quiz-card").scrollIntoView({ behavior: "smooth", block: "start" });
      if (cls === "ok") { boom({ particleCount: 200, spread: 140 }); setTimeout(() => heartRain(2500), 400); }
      else if (cls === "wait") boom({ particleCount: 80 });
      else toast("heart-crack", "Uma lágrima foi derramada no servidor. Força, guerreira.");
      store.set("vand_bonus", (store.get("vand_bonus") || 0) + 1);
    }

    $("#restart").addEventListener("click", () => {
      form.reset(); $$(".reaction", form).forEach((r) => (r.textContent = ""));
      $("#result").hidden = true; form.hidden = false; $(".quiz-nav").hidden = false; next.disabled = false;
      $("#score-arc").style.strokeDashoffset = "327"; $("#score-num").textContent = "0%";
      show(0);
    });

    show(0);
  }

  async function send(payload) {
    const url = (CFG.GOOGLE_SCRIPT_URL || "").trim();
    const saveLocal = () => { const arr = store.get("vand_inscricoes") || []; arr.push(payload); store.set("vand_inscricoes", arr); };
    if (!url) {
      saveLocal();
      console.warn("[Vanderlei.exe] GOOGLE_SCRIPT_URL vazio em js/config.js. Inscrição salva só no localStorage ('vand_inscricoes').", payload);
      return "Inscrição registrada (modo de teste: planilha ainda não conectada).";
    }
    try {
      await fetch(url, { method: "POST", mode: "no-cors", body: new URLSearchParams(payload) });
      return "Sua candidatura foi enviada ao comitê. Ele vai visualizar e responder em breve (mentira).";
    } catch (err) {
      saveLocal();
      console.error("[Vanderlei.exe] Falha ao enviar:", err);
      return "O cupido tropeçou no Wi-Fi. Guardamos sua inscrição aqui e tentamos de novo depois.";
    }
  }

  /* ---------------------------------------------------------
     EASTER EGGS
     --------------------------------------------------------- */
  function modal(icon, title, text, btn = "Ok, me contenho") {
    $("#modal-ic").setAttribute("href", "#i-" + icon);
    $("#modal-title").textContent = title; $("#modal-text").textContent = text; $("#modal [data-close]").textContent = btn;
    $("#modal").hidden = false;
  }

  function setupEggs() {
    let clicks = 0, t;
    $("#portrait").addEventListener("click", (e) => {
      clicks++; clearTimeout(t); t = setTimeout(() => (clicks = 0), 1500);
      FX.burst(e.clientX, e.clientY, 8);
      if (clicks === 7) { clicks = 0; modal("eye", "Calma, calma!", "Sete cliques na foto dele? Ele é tímido. Tá vermelho até agora. (Mentira, ele printou e mandou no grupo.)"); }
    });
    let buf = "";
    addEventListener("keydown", (e) => {
      if (e.target.matches && e.target.matches("input, textarea")) return;
      if (e.key.length === 1) {
        buf = (buf + e.key.toLowerCase()).slice(-4);
        if (buf === "vand") { buf = ""; modal("message-circle", "Mensagem secreta desbloqueada", "Vanderlei, se você está lendo isso: a gente te ama, mas você precisa responder o grupo. Assinado: seus amigos.", "Ok, vou responder (mentira)"); }
      }
    });
    console.log("%cVANDERLEI.EXE", "font-size:32px;font-weight:900;color:#ff2e7e;text-shadow:2px 2px #ffc857");
    console.log("%cSe você abriu o console, você é dev. O Vanderlei gosta de gente inteligente (ele não entende nada disso, mas finge muito bem).", "font-size:13px;color:#e0b6c7");
  }

  /* ---------------------------------------------------------
     INIT
     --------------------------------------------------------- */
  function init() {
    if (CFG.INSTAGRAM_URL) $$("[data-ig]").forEach((a) => (a.href = CFG.INSTAGRAM_URL));
    setupMicro();
    setupPhotos();
    setupQuiz();
    setupVault();
    setupEggs();
    setupScrollProgress();
    runLoader();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
