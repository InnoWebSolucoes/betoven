/* Interações e animações do site. */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const D = window.BTV, F = window.BTVfmt;
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const desktopMQ = matchMedia('(min-width: 901px)');
  const hasGSAP = !!(window.gsap && window.ScrollTrigger);
  const icon = n => `<svg class="ico" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  /* ---------- scroll suave ---------- */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ duration: 1.15, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    window.__lenis = lenis;
    if (hasGSAP) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(t => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  } else {
    root.classList.add('no-smooth');
  }
  const scrollToTarget = (target, offset = 0) => {
    if (lenis) lenis.scrollTo(target, { offset, duration: 1.4 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    else window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY + offset, behavior: reduce ? 'auto' : 'smooth' });
  };

  /* ---------- toast ---------- */
  const toastEl = $('.toast');
  let toastT;
  window.BTVtoast = msg => {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('is-on'), 4200);
  };

  /* ---------- menu móvel ---------- */
  const menuBtn = $('.hdr__menu'), menu = $('#menu');
  const menuOpen = () => document.body.classList.contains('menu-open');
  function openMenu() {
    document.body.classList.add('menu-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
    if (lenis) lenis.stop();
  }
  function closeMenu() {
    if (!menuOpen()) return;
    document.body.classList.remove('menu-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start();
  }
  menuBtn.addEventListener('click', () => (menuOpen() ? closeMenu() : openMenu()));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });

  /* ---------- links internos + abrir marcação ---------- */
  document.addEventListener('click', e => {
    const book = e.target.closest('[data-book]');
    if (book && !book.closest('#booking')) {
      e.preventDefault();
      closeMenu();
      window.BTVbooking.open(book.dataset.book || null);
      return;
    }
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id === '#top' || id === '#' ? 0 : $(id);
    if (target == null) return;
    e.preventDefault();
    closeMenu();
    scrollToTarget(target, target === 0 ? 0 : -10);
  });

  /* ---------- divisão em palavras ---------- */
  function splitWords(el) {
    const wrap = node => {
      const o = document.createElement('span'), i = document.createElement('span');
      o.className = 'wm'; i.className = 'wi';
      i.appendChild(node); o.appendChild(i);
      return o;
    };
    const walk = parent => {
      [...parent.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(p => {
            if (!p) return;
            frag.appendChild(/^\s+$/.test(p) ? document.createTextNode(' ') : wrap(document.createTextNode(p)));
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) {
          if (n.hasAttribute('data-nosplit') || n.tagName === 'BR') return;
          if (n.classList.contains('line')) return walk(n);
          const holder = wrap(document.createTextNode(''));
          n.replaceWith(holder);
          holder.firstChild.textContent = '';
          holder.firstChild.appendChild(n);
        }
      });
    };
    walk(el);
    $$('.wi', el).forEach((w, i) => w.style.setProperty('--i', i));
  }

  /* ---------- revelar ao entrar no ecrã ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -10% 0px', threshold: 0.01 });
  $$('[data-split]').forEach(el => {
    splitWords(el);
    if (el.dataset.split !== 'hero') io.observe(el);
  });
  $$('[data-reveal]').forEach(el => io.observe(el));

  const playObserver = (sec, threshold = 0.3) =>
    new IntersectionObserver(es => es.forEach(e => sec.classList.toggle('is-playing', e.isIntersecting)), { threshold }).observe(sec);

  /* ---------- pré-carregamento ---------- */
  function runLoader() {
    const loader = $('.loader'), num = $('.loader__count span');
    return new Promise(resolve => {
      if (!loader) return resolve();
      if (lenis) lenis.stop();
      const minTime = reduce ? 200 : 1300, t0 = performance.now();
      let ready = false, shown = 0;
      const loaded = document.readyState === 'complete' ? Promise.resolve() : new Promise(r => window.addEventListener('load', r, { once: true }));
      Promise.race([
        Promise.all([document.fonts ? document.fonts.ready : null, loaded]),
        new Promise(r => setTimeout(r, 4000)),
      ]).then(() => { ready = true; });
      const tick = now => {
        const elapsed = now - t0;
        const target = ready && elapsed >= minTime ? 100 : Math.min(92, (elapsed / minTime) * 92);
        shown += (target - shown) * 0.14;
        if (target === 100 && shown > 99.3) shown = 100;
        num.textContent = Math.round(shown);
        if (shown < 100) return requestAnimationFrame(tick);
        loader.classList.add('is-done');
        setTimeout(() => loader.classList.add('is-gone'), 1150);
        if (lenis) lenis.start();
        resolve();
      };
      requestAnimationFrame(tick);
    });
  }

  /* ---------- cabeçalho, dock, navegação ativa ---------- */
  const hdr = $('.hdr'), dock = $('.dock'), finalSec = $('.final');
  let lastY = window.scrollY;
  function onScroll() {
    const y = window.scrollY;
    hdr.classList.toggle('is-scrolled', y > 30);
    hdr.classList.toggle('is-hidden', y > lastY && y > 600 && !menuOpen());
    lastY = y;
    const ft = finalSec.getBoundingClientRect().top;
    dock.classList.toggle('is-on', y > window.innerHeight * 0.9 && ft > window.innerHeight * 0.55);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const navLinks = $$('.hdr__nav a');
  const navIO = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  navLinks.forEach(a => { const s = $(a.getAttribute('href')); if (s) navIO.observe(s); });

  /* ---------- vídeos ---------- */
  $$('video[data-src-wide]').forEach(v => {
    v.dataset.posterWide = v.getAttribute('poster');
    const pick = () => {
      const wide = desktopMQ.matches;
      const src = wide ? v.dataset.srcWide : v.dataset.srcTall;
      if (v.getAttribute('src') === src) return;
      v.poster = wide ? v.dataset.posterWide : v.dataset.posterTall;
      v.src = src;
      if (!v.paused || v.dataset.inView) v.play().catch(() => {});
    };
    pick();
    desktopMQ.addEventListener('change', pick);
  });
  const vio = new IntersectionObserver(es => es.forEach(e => {
    const v = e.target;
    v.dataset.inView = e.isIntersecting ? '1' : '';
    if (e.isIntersecting && !v.dataset.userPaused && !reduce) v.play().catch(() => {});
    else v.pause();
  }), { threshold: 0.05 });
  $$('video[data-autoplay]').forEach(v => { v.muted = true; vio.observe(v); });

  const stage = $('.stage'), stageVideo = $('.stage__video'), stageToggle = $('[data-video-toggle]');
  function toggleStage() {
    if (stageVideo.paused) {
      delete stageVideo.dataset.userPaused;
      stageVideo.play().catch(() => {});
      stage.classList.remove('is-paused');
      stageToggle.setAttribute('aria-label', 'Pausar vídeo');
      stage.dataset.cursor = 'Pausar';
    } else {
      stageVideo.dataset.userPaused = '1';
      stageVideo.pause();
      stage.classList.add('is-paused');
      stageToggle.setAttribute('aria-label', 'Reproduzir vídeo');
      stage.dataset.cursor = 'Play';
    }
    if (cursorLabel && stage.matches(':hover')) cursorLabel.textContent = stage.dataset.cursor;
  }
  stage.dataset.cursor = 'Pausar';
  if (reduce) { stageVideo.dataset.userPaused = '1'; stage.classList.add('is-paused'); stage.dataset.cursor = 'Play'; }
  stage.addEventListener('click', e => { if (!e.target.closest('.chip')) toggleStage(); });

  /* ---------- marquee ---------- */
  const track = $('.marquee__track');
  if (track) {
    track.innerHTML += track.innerHTML;
    if (lenis && hasGSAP) {
      let x = 0, dir = 1, vel = 0, half = track.scrollWidth / 2;
      window.addEventListener('resize', () => { half = track.scrollWidth / 2; });
      lenis.on('scroll', e => { vel = e.velocity; if (e.direction) dir = e.direction; });
      gsap.ticker.add((time, dt) => {
        x -= (0.06 * dt + Math.min(Math.abs(vel), 60) * 0.5) * dir;
        if (x <= -half) x += half;
        if (x > 0) x -= half;
        track.style.transform = `translate3d(${x.toFixed(2)}px,0,0)`;
        vel *= 0.9;
      });
    }
  }

  /* ---------- contadores ---------- */
  const cio = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    cio.unobserve(e.target);
    const el = e.target, to = +el.dataset.count;
    if (reduce) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 1900;
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }), { threshold: 0.5 });
  $$('[data-count]').forEach(el => cio.observe(el));

  /* ---------- manifesto: palavras divididas para acender com o scroll ---------- */
  const mfText = $('[data-scrub-words]');
  if (mfText) {
    const walk = parent => [...parent.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(p => {
          if (!p) return;
          if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(' ')); return; }
          const w = document.createElement('span');
          w.className = 'mw'; w.textContent = p;
          frag.appendChild(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && !n.hasAttribute('data-nosplit')) {
        walk(n);
      }
    });
    walk(mfText);
  }

  /* ---------- sessão: gráfico interativo ---------- */
  const session = $('.session');
  if (session) {
    const STEPS = [
      { t0: 0, t1: 30, title: 'Visagismo', badge: 'Passo 1 · 30 min',
        text: 'Análise do rosto, do subtom e da história do cabelo. Definimos juntos o desenho e o tom.' },
      { t0: 30, t1: 120, title: 'Desenho à mão livre', badge: 'Passo 2 · 1 h 30 min',
        text: 'Primer Olaplex e Metal Detox protegem a fibra. A luz é pintada madeixa a madeixa, com a técnica francesa original.' },
      { t0: 120, t1: 165, title: 'Gloss & tonalização', badge: 'Passo 3 · 45 min',
        text: 'O tom é afinado ao detalhe, entre mel, caramelo, bege ou pérola, para um brilho que dura.' },
      { t0: 165, t1: 210, title: 'Tratamento & styling', badge: 'Passo 4 · 45 min',
        text: 'Reposição lipídica, queratina e infravermelhos. Sai com o styling feito e uma prescrição para casa.' },
    ];
    const W = 700, H = 240, TOTAL = 210;
    const RAW = [[0, .16], [15, .17], [30, .19], [55, .34], [85, .6], [120, .82], [140, .84], [160, .7], [185, .73], [210, .76]];
    const X = m => (m / TOTAL) * W, Y = v => H - 18 - v * (H - 40);
    const pts = RAW.map(([m, v]) => [X(m), Y(v)]);
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    const svg = $('.chart__svg', session);
    const line = $('.chart__line', svg);
    $('.chart__base', svg).setAttribute('d', d);
    line.setAttribute('d', d);
    $('.chart__area', svg).setAttribute('d', `${d} L${W},${H} L0,${H} Z`);
    let grid = '';
    for (let i = 1; i < 4; i++) grid += `<line x1="0" x2="${W}" y1="${(i * H) / 4}" y2="${(i * H) / 4}"/>`;
    [30, 120, 165].forEach(m => { grid += `<line class="is-mark" x1="${X(m)}" x2="${X(m)}" y1="0" y2="${H}"/>`; });
    $('.chart__grid', svg).innerHTML = grid;
    $('.chart__axis', session).innerHTML = Array.from({ length: 8 }, (_, i) =>
      `<span style="left:${((i * 30) / TOTAL) * 100}%">${Math.floor((i * 30) / 60)}:${String((i * 30) % 60).padStart(2, '0')}</span>`).join('');

    const len = line.getTotalLength();
    const yAt = x => {
      let lo = 0, hi = len;
      for (let k = 0; k < 22; k++) { const mid = (lo + hi) / 2; if (line.getPointAtLength(mid).x < x) lo = mid; else hi = mid; }
      return line.getPointAtLength(lo).y;
    };
    const doneRect = $('#chartDone rect'), actRect = $('#chartActive rect');
    const band = $('.chart__band', session), dot = $('.chart__dot', session);
    const info = $('.session__info', session);
    const q = k => $(`[data-s="${k}"]`, session);
    const media = $$('.session__media img', session), stepBtns = $$('.session__steps button', session);
    const strand = $('.strand', session);
    const fmtT = m => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
    const dotPos = { x: X(STEPS[0].t1) };
    const placeDot = () => { dot.style.left = (dotPos.x / W) * 100 + '%'; dot.style.top = (yAt(dotPos.x) / H) * 100 + '%'; };
    let cur = -1;

    function setStep(i, instant) {
      i = (i + STEPS.length) % STEPS.length;
      if (i === cur) return;
      const s = STEPS[i], x0 = X(s.t0), x1 = X(s.t1);
      const dur = instant || reduce ? 0 : 1.1;
      if (hasGSAP) {
        gsap.to(doneRect, { attr: { width: x1 }, duration: dur, ease: 'power3.inOut' });
        gsap.to(actRect, { attr: { x: x0, width: x1 - x0 }, duration: dur, ease: 'power3.inOut' });
        gsap.to(dotPos, { x: x1, duration: dur, ease: 'power3.inOut', onUpdate: placeDot, onComplete: placeDot });
      } else {
        doneRect.setAttribute('width', x1);
        actRect.setAttribute('x', x0); actRect.setAttribute('width', x1 - x0);
        dotPos.x = x1; placeDot();
      }
      band.style.left = (x0 / W) * 100 + '%';
      band.style.width = ((x1 - x0) / W) * 100 + '%';
      q('time').textContent = `${fmtT(s.t0)} às ${fmtT(s.t1)}`;
      q('title').textContent = s.title;
      q('text').textContent = s.text;
      q('idx').textContent = i + 1;
      q('badge').textContent = s.badge;
      info.classList.remove('is-swap'); void info.offsetWidth; info.classList.add('is-swap');
      media.forEach((m, k) => m.classList.toggle('is-active', k === i));
      stepBtns.forEach((b, k) => {
        b.classList.toggle('is-active', k === i);
        b.classList.toggle('is-done', k < i);
        b.setAttribute('aria-selected', k === i);
      });
      strand.dataset.step = i;
      cur = i;
    }
    setStep(0, true);
    q('prev').addEventListener('click', () => setStep(cur - 1));
    q('next').addEventListener('click', () => setStep(cur + 1));
    stepBtns.forEach((b, i) => {
      b.addEventListener('click', () => setStep(i));
      if (!reduce) $('i', b).addEventListener('animationend', () => { if (b.classList.contains('is-active')) setStep(i + 1); });
    });
    const card = $('.session__card', session);
    card.addEventListener('mouseenter', () => session.classList.add('is-paused'));
    card.addEventListener('mouseleave', () => session.classList.remove('is-paused'));
    window.addEventListener('resize', placeDot);
    playObserver(session, 0.35);
  }

  /* ---------- princípios: cartões empilhados ---------- */
  const pcards = $$('.pcard');
  if (pcards.length) {
    const pio = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      $('.pcard__t', e.target).classList.add('is-in');
      pio.unobserve(e.target);
    }), { threshold: 0.25 });
    pcards.forEach(c => {
      pio.observe(c);
      $$('.pcard__tags li', c).forEach((li, k) => li.style.setProperty('--k', k));
    });
    if (!reduce) {
      const media = pcards.map(c => $('.pcard__media > *', c));
      const shades = pcards.map(c => $('.pcard__shade', c));
      let tops = [], queued = false;
      const measure = () => { tops = pcards.map(c => parseFloat(getComputedStyle(c).top) || 0); };
      const clamp01 = v => Math.max(0, Math.min(1, v));
      const update = () => {
        queued = false;
        const vh = window.innerHeight;
        pcards.forEach((c, i) => {
          const r = c.getBoundingClientRect();
          const enter = clamp01((vh - r.top) / Math.max(1, vh - tops[i]));
          media[i].style.transform = `scale(${(1.28 - 0.28 * enter).toFixed(4)})`;
          const next = pcards[i + 1];
          let p = 0;
          if (next) {
            const nt = next.getBoundingClientRect().top;
            p = clamp01((vh - nt) / Math.max(1, vh - tops[i + 1]));
          }
          c.style.transform = `scale(${(1 - p * 0.07).toFixed(4)})`;
          shades[i].style.opacity = (p * 0.55).toFixed(3);
        });
      };
      const queue = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
      measure();
      update();
      window.addEventListener('scroll', queue, { passive: true });
      window.addEventListener('resize', () => { measure(); queue(); });
    }
  }

  /* ---------- rituais de assinatura ---------- */
  const ritualsEl = $('.rituals');
  if (ritualsEl) {
    const R = [
      { id: 'balayage', img: '/beethoven/assets/img/work-03.webp', tag: 'Mais pedido', blurb: 'O desenho de luz completo: visagismo, proteção Olaplex, gloss, tratamento e styling.' },
      { id: 'manutencao', img: '/beethoven/assets/img/work-02.webp', blurb: 'Refresca o desenho até seis meses depois da sua balayage.' },
      { id: 'correcao', img: '/beethoven/assets/img/work-09.webp', blurb: 'Para recuperar o tom certo depois de uma má experiência.' },
      { id: 'faceframing', img: '/beethoven/assets/img/people-10.webp', blurb: 'Luz pensada para a moldura do rosto e o topo da cabeça.' },
      { id: 'gloss', img: '/beethoven/assets/img/work-06.webp', blurb: 'O banho de cor que refresca o tom e devolve o brilho.' },
    ];
    ritualsEl.innerHTML = R.map((r, i) => {
      const s = D.services.find(x => x.id === r.id);
      return `<article class="ritual" data-book="${s.id}" role="button" tabindex="0" aria-label="Marcar ${s.name}" style="--d:${(i % 3) * 120}ms">
        <div class="ritual__img"><img src="${r.img}" alt="" loading="lazy"></div>
        <div class="ritual__body">
          ${r.tag ? `<span class="ritual__tag">${r.tag}</span>` : ''}
          <h3>${s.name}</h3>
          <p>${r.blurb}</p>
          <div class="ritual__row">
            <span class="ritual__meta"><span>${icon('clock')}${F.dur(s.dur)}</span><span>${s.from ? 'desde ' : ''}${F.eur(s.price)}</span></span>
            <span class="ritual__go">${icon('arrow')}</span>
          </div>
        </div>
      </article>`;
    }).join('');
    const rio = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); rio.unobserve(e.target); }
    }), { threshold: 0.2 });
    $$('.ritual', ritualsEl).forEach(r => {
      rio.observe(r);
      r.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); window.BTVbooking.open(r.dataset.book); }
      });
    });
  }

  /* ---------- serviços ---------- */
  const svcList = $('.svc-list'), svcChips = $('.services .chips');
  if (svcList) {
    const CATS = [{ id: 'all', label: 'Todos' }].concat(D.categories.filter(c => c.id !== 'destaque'));
    const count = id => D.services.filter(s => id === 'all' || s.cat === id).length;
    let cat = 'all';
    svcChips.innerHTML = CATS.map(c =>
      `<button class="chip-btn${c.id === cat ? ' is-active' : ''}" role="tab" aria-selected="${c.id === cat}" data-svc-cat="${c.id}">${c.label}<sup>${count(c.id)}</sup></button>`).join('');
    const render = () => {
      const list = D.services.filter(s => cat === 'all' || s.cat === cat);
      svcList.innerHTML = list.map((s, i) => `<li class="svc" style="--i:${i}" data-img="${s.img}">
        <button class="svc__row" aria-expanded="false" aria-controls="svc-${s.id}">
          <span class="svc__n">${String(i + 1).padStart(2, '0')}</span>
          <span class="svc__main"><span class="svc__name">${s.name}</span>
            <span class="svc__meta"><span>${icon('clock')}${F.dur(s.dur)}</span><span>${s.short}</span>${s.featured ? '<span class="svc__tag">Popular</span>' : ''}</span></span>
          <span class="svc__price"><small>${s.from ? 'desde' : 'preço'}</small>${F.eur(s.price)}</span>
          <span class="svc__toggle">${icon('plus')}</span>
        </button>
        <div class="svc__more" id="svc-${s.id}"><div><div class="svc__inner">
          <ul>${s.includes.map(x => `<li>${x}</li>`).join('')}</ul>
          <button class="btn btn--dark" data-book="${s.id}">Marcar este serviço${icon('arrow')}</button>
        </div></div></div>
      </li>`).join('');
      if (hasGSAP) ScrollTrigger.refresh();
    };
    render();
    svcChips.addEventListener('click', e => {
      const b = e.target.closest('[data-svc-cat]');
      if (!b || b.dataset.svcCat === cat) return;
      cat = b.dataset.svcCat;
      $$('.chip-btn', svcChips).forEach(c => { const on = c === b; c.classList.toggle('is-active', on); c.setAttribute('aria-selected', on); });
      render();
    });
    svcList.addEventListener('click', e => {
      const row = e.target.closest('.svc__row');
      if (!row) return;
      const li = row.parentElement, open = !li.classList.contains('is-open');
      $$('.svc.is-open', svcList).forEach(o => { o.classList.remove('is-open'); $('.svc__row', o).setAttribute('aria-expanded', 'false'); });
      li.classList.toggle('is-open', open);
      row.setAttribute('aria-expanded', open);
      hidePreview();
      if (hasGSAP) setTimeout(() => ScrollTrigger.refresh(), 750);
    });

    // pré-visualização que segue o cursor
    const pv = $('.svc-preview'), pvImg = $('img', pv);
    let tx = 0, ty = 0, cx = 0, cy = 0, pvOn = false, raf = 0;
    const loop = () => {
      cx += (tx - cx) * 0.16; cy += (ty - cy) * 0.16;
      pv.style.left = cx + 'px'; pv.style.top = cy + 'px';
      raf = pvOn ? requestAnimationFrame(loop) : 0;
    };
    function hidePreview() { pvOn = false; pv.classList.remove('is-on'); }
    if (finePointer) {
      svcList.addEventListener('mousemove', e => {
        tx = Math.min(e.clientX + 170, window.innerWidth - 140); ty = e.clientY;
        const row = e.target.closest('.svc__row'), li = row && row.parentElement;
        if (!li || li.classList.contains('is-open')) return hidePreview();
        if (pvImg.getAttribute('src') !== li.dataset.img) pvImg.src = li.dataset.img;
        if (!pvOn) { pvOn = true; cx = tx; cy = ty; pv.classList.add('is-on'); if (!raf) raf = requestAnimationFrame(loop); }
      });
      svcList.addEventListener('mouseleave', hidePreview);
    }
  }

  /* ---------- trabalhos: galeria + lightbox ---------- */
  const works = $$('.work');
  const wCount = $('.works__count b'), wBar = $('.works__progress i'), wTrack = $('.works__track');
  $('.works__count span').textContent = String(works.length).padStart(2, '0');
  const setWorksProgress = p => {
    p = Math.max(0, Math.min(1, p));
    wCount.textContent = String(Math.round(p * (works.length - 1)) + 1).padStart(2, '0');
    wBar.style.transform = `scaleX(${Math.max(0.08, p)})`;
  };
  wTrack.addEventListener('scroll', () => {
    const max = wTrack.scrollWidth - wTrack.clientWidth;
    if (max > 0) setWorksProgress(wTrack.scrollLeft / max);
  }, { passive: true });

  const lb = $('.lb'), lbImg = $('.lb__fig img', lb), lbCap = $('.lb__fig figcaption', lb);
  let lbIdx = 0, lbLast = null;
  function showLb(i) {
    lbIdx = (i + works.length) % works.length;
    const img = $('img', works[lbIdx]);
    lbImg.src = img.src; lbImg.alt = img.alt;
    lbCap.textContent = `${String(lbIdx + 1).padStart(2, '0')} · ${img.alt}`;
  }
  function openLb(i) {
    lbLast = document.activeElement;
    showLb(i);
    lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false');
    if (lenis) lenis.stop();
    $('.lb__close', lb).focus({ preventScroll: true });
  }
  function closeLb() {
    if (!lb.classList.contains('is-open')) return;
    lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start();
    if (lbLast) lbLast.focus({ preventScroll: true });
  }
  works.forEach((w, i) => {
    w.tabIndex = 0;
    w.setAttribute('role', 'button');
    w.setAttribute('aria-label', 'Ampliar: ' + $('img', w).alt);
    w.addEventListener('click', () => openLb(i));
    w.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLb(i); } });
  });
  $('.lb__close', lb).addEventListener('click', closeLb);
  $('.lb__prev', lb).addEventListener('click', () => showLb(lbIdx - 1));
  $('.lb__next', lb).addEventListener('click', () => showLb(lbIdx + 1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') showLb(lbIdx - 1);
    if (e.key === 'ArrowRight') showLb(lbIdx + 1);
  });
  let touchX = null;
  lb.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) showLb(lbIdx + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ---------- avaliações ---------- */
  const reviews = $('.reviews');
  if (reviews) {
    const qStage = $('.quotes__stage', reviews), dots = $('.quotes__dots', reviews);
    qStage.innerHTML = D.reviews.map((r, i) => `<figure class="quote${i === 0 ? ' is-active' : ''}" aria-hidden="${i !== 0}">
      <div class="quote__mark" aria-hidden="true">“</div>
      <blockquote class="quote__text" data-split="manual">${r.text}</blockquote>
      <figcaption class="quote__by"><span class="quote__av" aria-hidden="true">${r.initials}</span>
        <span><b>${r.name}</b><small>${r.service} · ${r.date}${r.translated ? '<span class="tr">traduzido do inglês</span>' : ''}</small></span>
        <span class="stars" aria-label="5 estrelas">${'<svg><use href="#i-star"/></svg>'.repeat(5)}</span></figcaption>
    </figure>`).join('');
    dots.innerHTML = D.reviews.map((r, i) => `<button aria-label="Avaliação ${i + 1}" class="${i === 0 ? 'is-active' : ''}"><i></i></button>`).join('');
    const quotes = $$('.quote', qStage), dotBtns = $$('button', dots);
    quotes.forEach(q => splitWords($('.quote__text', q)));
    let cur = 0;
    const set = i => {
      i = (i + quotes.length) % quotes.length;
      quotes.forEach((q, k) => {
        q.classList.toggle('is-active', k === i);
        q.setAttribute('aria-hidden', k !== i);
        $('.quote__text', q).classList.toggle('is-in', k === i);
      });
      dotBtns.forEach((b, k) => { b.classList.remove('is-active'); b.classList.toggle('is-done', k < i); });
      void dots.offsetWidth;
      dotBtns[i].classList.add('is-active');
      cur = i;
    };
    $('[data-q="prev"]', reviews).addEventListener('click', () => set(cur - 1));
    $('[data-q="next"]', reviews).addEventListener('click', () => set(cur + 1));
    dotBtns.forEach((b, i) => {
      b.addEventListener('click', () => set(i));
      if (!reduce) $('i', b).addEventListener('animationend', () => { if (b.classList.contains('is-active')) set(i + 1); });
    });
    new IntersectionObserver((es, o) => es.forEach(e => {
      if (e.isIntersecting) { $('.quote__text', quotes[cur]).classList.add('is-in'); o.disconnect(); }
    }), { threshold: 0.3 }).observe(qStage);
    let sx = null;
    qStage.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
    qStage.addEventListener('touchend', e => {
      if (sx == null) return;
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) set(cur + (dx < 0 ? 1 : -1));
      sx = null;
    });
    playObserver(reviews, 0.3);
  }

  /* ---------- percurso: linha que se desenha ---------- */
  const journey = $('.journey__track');
  if (journey) {
    const stops = $$('.journey__stops li', journey);
    const setP = p => {
      journey.querySelector('.journey__line').style.setProperty('--p', p.toFixed(4));
      stops.forEach((li, k) => li.classList.toggle('is-on', p >= (k / (stops.length - 1)) * 0.94 + 0.02));
    };
    if (hasGSAP && !reduce) {
      ScrollTrigger.create({ trigger: journey, start: 'top 80%', end: 'bottom 50%', scrub: true, onUpdate: self => setP(self.progress) });
    } else {
      setP(1);
    }
  }

  /* ---------- horário + aberto/fechado (hora de Lisboa) ---------- */
  (function hours() {
    const list = $('[data-hours]'), status = $('[data-status]');
    if (!list) return;
    const NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Lisbon', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date()).map(p => [p.type, p.value]));
    const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
    const min = +parts.hour * 60 + +parts.minute;
    list.innerHTML = [1, 2, 3, 4, 5, 6, 0].map(d => {
      const h = D.hours[d];
      return `<li class="${d === wd ? 'is-today' : ''}${h ? '' : ' is-closed'}"><span>${NAMES[d]}</span><span>${h ? `${F.hhmm(h[0])} às ${F.hhmm(h[1])}` : 'Fechado'}</span></li>`;
    }).join('');
    const h = D.hours[wd];
    const open = !!h && min >= h[0] && min < h[1];
    status.textContent = open ? `Aberto · fecha às ${F.hhmm(h[1])}` : 'Fechado agora';
    status.classList.toggle('is-closed', !open);
  })();

  /* ---------- cursor + botões magnéticos ---------- */
  const cursor = $('.cursor'), cursorLabel = cursor && $('span', cursor);
  if (finePointer && cursor) {
    let mx = 0, my = 0, cx = 0, cy = 0;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      const t = e.target.closest('[data-cursor]');
      if (t && !root.classList.contains('is-locked')) { cursorLabel.textContent = t.dataset.cursor; cursor.classList.add('is-on'); }
      else cursor.classList.remove('is-on');
    });
    const move = () => {
      cx += (mx - cx) * 0.2; cy += (my - cy) * 0.2;
      cursor.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
    };
    if (hasGSAP) gsap.ticker.add(move); else (function f() { move(); requestAnimationFrame(f); })();
  }
  if (finePointer && !reduce) {
    $$('[data-magnetic]').forEach(b => {
      b.addEventListener('mousemove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
      });
      b.addEventListener('mouseleave', () => { b.style.transform = ''; });
    });
  }

  /* ---------- animações ligadas ao scroll (GSAP) ---------- */
  function splitChars(el) {
    [...el.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        [...n.textContent].forEach(ch => {
          if (/\s/.test(ch)) { frag.appendChild(document.createTextNode(' ')); return; }
          const s = document.createElement('span');
          s.className = 'final__char'; s.textContent = ch;
          frag.appendChild(s);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && n.tagName !== 'svg') {
        splitChars(n);
      }
    });
  }

  if (hasGSAP) {
    $$('.final__line').forEach(splitChars);
    const mm = gsap.matchMedia();
    mm.add({ desk: '(min-width: 901px)', motion: '(prefers-reduced-motion: no-preference)' }, ctx => {
      const { desk, motion } = ctx.conditions;
      if (!motion) return;

      // manifesto: cada palavra acende ao passar
      if (mfText) {
        root.classList.add('has-scrub');
        gsap.to($$('.mw', mfText), {
          opacity: 1, ease: 'none', stagger: 0.1,
          scrollTrigger: { trigger: mfText, start: 'top 80%', end: 'bottom 52%', scrub: true },
        });
        $$('.mf-img', mfText).forEach(pill => {
          gsap.fromTo(pill, { scale: 0, rotate: -14 }, {
            scale: 1, rotate: 0, ease: 'back.out(1.7)',
            scrollTrigger: { trigger: pill, start: 'top 90%', end: 'top 62%', scrub: true },
          });
        });
      }

      // rituais: parallax da imagem dentro do cartão
      $$('.ritual__img').forEach(el => {
        gsap.fromTo(el, { yPercent: -9 }, {
          yPercent: 9, ease: 'none',
          scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });

      // sessão: imagem com parallax suave
      gsap.fromTo('.session__media', { y: 60 }, {
        y: -30, ease: 'none',
        scrollTrigger: { trigger: '.session__grid', start: 'top bottom', end: 'bottom top', scrub: true },
      });

      gsap.fromTo('.stage', { scale: desk ? 0.86 : 0.94 }, {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: '.wrap--stage', start: 'top 92%', end: 'top 10%', scrub: true },
      });
      gsap.fromTo('.stage__video', { scale: 1.22 }, {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: '.wrap--stage', start: 'top bottom', end: 'bottom top', scrub: true },
      });
      gsap.to('.hero__title', {
        yPercent: -14, opacity: 0.35, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: '55% top', scrub: true },
      });

      if (desk) {
        const sec = $('.works'), trk = $('.works__track');
        const dist = () => Math.max(0, trk.scrollWidth - window.innerWidth);
        const tween = gsap.to(trk, {
          x: () => -dist(), ease: 'none',
          scrollTrigger: {
            trigger: sec, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.8,
            invalidateOnRefresh: true, anticipatePin: 1, onUpdate: self => setWorksProgress(self.progress),
          },
        });
        $$('.work__img img', trk).forEach(img => {
          gsap.fromTo(img, { xPercent: -5, scale: 1.16 }, {
            xPercent: 5, scale: 1.16, ease: 'none',
            scrollTrigger: { trigger: img.closest('.work'), containerAnimation: tween, start: 'left right', end: 'right left', scrub: true },
          });
        });
      }

      gsap.fromTo('.about__img:not(.about__img--sm) img', { yPercent: -14 }, {
        yPercent: 0, ease: 'none',
        scrollTrigger: { trigger: '.about__media', start: 'top bottom', end: 'bottom top', scrub: true },
      });
      gsap.fromTo('.about__img--sm', { yPercent: 18 }, {
        yPercent: -6, ease: 'none',
        scrollTrigger: { trigger: '.about__media', start: 'top bottom', end: 'bottom top', scrub: true },
      });

      gsap.from('.final__char', {
        yPercent: 115, rotate: 8, ease: 'power3.out', stagger: 0.035,
        scrollTrigger: { trigger: '.final__title', start: 'top 88%', end: 'top 38%', scrub: 1 },
      });
      gsap.from('.footer__word', {
        yPercent: 40, opacity: 0, ease: 'none',
        scrollTrigger: { trigger: '.footer', start: 'top bottom', end: 'bottom bottom', scrub: true },
      });
    });
  }

  /* ---------- arranque ---------- */
  runLoader().then(() => {
    $('.hero').classList.add('is-in');
    $('.hero__title').classList.add('is-in');
    if (hasGSAP) ScrollTrigger.refresh();
  });
  window.addEventListener('load', () => { if (hasGSAP) ScrollTrigger.refresh(); });
})();
