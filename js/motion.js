/* Motion da landing page BringData (GSAP + ScrollTrigger).
   Cada seção anima o que ela conta, e tudo roda em loop enquanto está na tela. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Sempre ativos (não dependem de animação) ---------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', scrollY > 20);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Spotlight do Magic Bento: brilho segue o ponteiro
  $$('.card').forEach((c) => c.addEventListener('pointermove', (e) => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', e.clientX - r.left + 'px');
    c.style.setProperty('--my', e.clientY - r.top + 'px');
  }));

  // Sistemas do hero: no celular viram carrossel contínuo (cópias só para o loop, fora do leitor de tela)
  const chipBox = $('.chips');
  const chipLinks = $$('a', chipBox);
  chipLinks.forEach((a, k) => {
    a.dataset.k = k;
    const c = a.cloneNode(true);
    c.classList.add('clone');
    c.setAttribute('aria-hidden', 'true');
    c.tabIndex = -1;
    chipBox.append(c);
  });
  const setLoop = () => chipBox.style.setProperty('--set', chipLinks.reduce((w, a) => w + a.offsetWidth + 10, 0) + 'px');
  addEventListener('resize', setLoop);
  if (document.fonts) document.fonts.ready.then(setLoop); else setLoop();

  // Ticks dos prazos (um quadradinho por dia)
  $$('[data-ticks]').forEach((t) => { for (let i = 0; i < +t.dataset.ticks; i++) t.append(document.createElement('i')); });

  // Modal do vídeo
  const modal = $('#vmodal');
  const mVideo = $('video', modal);
  const openVideo = (btn) => {
    const f = 'videos/' + btn.dataset.video;
    mVideo.replaceChildren();
    [[f + '.mp4', '(min-width: 640px), (orientation: landscape)'], [f + '_vertical.mp4', null]].forEach(([src, media]) => {
      const s = document.createElement('source');
      s.src = src; s.type = 'video/mp4';
      if (media) s.media = media;
      mVideo.append(s);
    });
    mVideo.poster = f + '.jpg';
    mVideo.setAttribute('aria-label', btn.dataset.label);
    mVideo.load();
    modal.showModal();
    if (window.gsap && !reduce) gsap.fromTo(modal, { opacity: 0, scale: 0.92, y: 20, filter: 'blur(8px)' }, { opacity: 1, scale: 1, y: 0, filter: 'blur(0px)', duration: 0.5, ease: 'power3.out' });
    mVideo.play().catch(() => { /* navegador pode exigir outro clique: os controles ficam visíveis */ });
  };
  const closeVideo = () => { mVideo.pause(); modal.close(); };
  $$('.watch').forEach((b) => b.addEventListener('click', () => openVideo(b)));
  $('.vclose', modal).addEventListener('click', closeVideo);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeVideo(); });
  modal.addEventListener('close', () => { mVideo.pause(); mVideo.replaceChildren(); mVideo.load(); });

  if (reduce || !window.gsap || !window.ScrollTrigger) {
    document.documentElement.classList.remove('motion');
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  // Liga e desliga loops conforme a seção entra e sai da tela
  const whileVisible = (trigger, tl) => ScrollTrigger.create({
    trigger, start: 'top 90%', end: 'bottom top',
    onToggle: (self) => (self.isActive ? tl.play() : tl.pause()),
  });

  /* ---------- Divide títulos em palavras (Blur Text / Texts reveal) ---------- */
  const splitWords = (root) => {
    let n = 0;
    const walk = (node, grad) => [...node.childNodes].forEach((c) => {
      if (c.nodeType === 3) {
        const frag = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach((w) => {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.append(w); return; }
          const s = document.createElement('span');
          s.className = 'w' + (grad ? ' grad-text' : '');
          s.style.setProperty('--i', n++);
          s.textContent = w;
          frag.append(s);
        });
        c.replaceWith(frag);
      } else if (c.nodeType === 1) {
        const g = c.classList.contains('grad-text');
        walk(c, grad || g);
        if (g) c.classList.remove('grad-text');
      }
    });
    root.setAttribute('aria-label', root.textContent.replace(/\s+/g, ' ').trim());
    walk(root, false);
    return $$('.w', root);
  };

  // Loop das palavras: a cada ciclo as palavras saem com blur e voltam em cascata
  const wordLoop = (words, every) => gsap.timeline({ repeat: -1, repeatDelay: every, paused: true })
    .to(words, { opacity: 0, yPercent: -40, filter: 'blur(10px)', duration: 0.35, stagger: 0.02, ease: 'power2.in' })
    .fromTo(words, { yPercent: 60, opacity: 0, filter: 'blur(12px)' }, { yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.8, stagger: 0.045, ease: 'power3.out' });

  /* ---------- HERO ---------- */
  const hero = $('#hero');
  const h1Words = splitWords($('h1', hero));
  const intro = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } })
    .from('.hero .pill', { y: 20, opacity: 0, filter: 'blur(8px)', duration: 0.8 })
    .from(h1Words, { yPercent: 70, opacity: 0, filter: 'blur(14px)', duration: 1, stagger: 0.05 }, '-=0.5')
    .from('.hero .lead', { y: 20, opacity: 0, filter: 'blur(8px)', duration: 0.8 }, '-=0.6')
    .from('.hero-ctas > *', { y: 16, opacity: 0, duration: 0.6, stagger: 0.08 }, '-=0.5')
    .from('.hero-icon', { scale: 0.5, opacity: 0, duration: 1, ease: 'back.out(1.7)' }, '-=0.3')
    .from('.chips a', { y: 14, opacity: 0, stagger: 0.07, duration: 0.5 }, '-=0.6');

  // Destaque "atende o cidadão" sai e volta em loop
  const gradWords = $$('.w.grad-text', hero);
  const heroLoop = wordLoop(gradWords, 4.5);
  intro.eventCallback('onComplete', () => whileVisible(hero, heroLoop));
  // A entrada do hero começa quando o pré-carregamento solta a página (ou em 5,5 s, no pior caso)
  const startIntro = () => { if (!intro.isActive() && intro.progress() === 0) intro.play(); };
  if (window.__bdReady) startIntro();
  else { addEventListener('bd:ready', startIntro, { once: true }); setTimeout(startIntro, 5500); }

  // Fluxo de dados: cada sistema manda um pulso até a IA, que acende ao receber
  const svg = $('.flow', hero);
  const icon = $('.hero-icon', hero);
  const rings = $$('.ring', icon);
  const chips = $$('.chips a:not(.clone)', hero);
  let flowTl = null;
  const STEP = 0.9; // intervalo entre os pulsos de cada sistema
  const TRAVEL = 1.8; // tempo do pulso até o ícone
  const receive = (i) => {
    $$('.chips a', hero).forEach((c) => c.classList.toggle('lit', +c.dataset.k === i));
    gsap.fromTo(rings[0], { scale: 1, opacity: 0.35 }, { scale: 1.25, opacity: 0, duration: 1.4, ease: 'power2.out' }); // pulso discreto
    gsap.fromTo(icon, { scale: 1.025 }, { scale: 1, duration: 0.8, ease: 'power2.out' });
  };
  const drawFlows = () => {
    if (flowTl) flowTl.kill();
    flowTl = gsap.timeline({ repeat: -1, delay: 0.8 });
    const hr = hero.getBoundingClientRect();
    const ir = icon.getBoundingClientRect();
    const ix = ir.left + ir.width / 2 - hr.left;
    const iy = ir.bottom - hr.top + 2; // para na borda de baixo do símbolo, sem cruzá-lo
    const ns = 'http://www.w3.org/2000/svg';
    svg.setAttribute('viewBox', `0 0 ${hr.width} ${hr.height}`);
    svg.innerHTML = '<defs><linearGradient id="flowGrad" gradientUnits="userSpaceOnUse" x1="0" y1="' + hr.height + '" x2="0" y2="' + iy + '"><stop offset="0" stop-color="#144269"/><stop offset=".5" stop-color="#90BBDD"/><stop offset="1" stop-color="#F2F7FA"/></linearGradient></defs>';
    chips.forEach((a, i) => {
      const r = a.getBoundingClientRect();
      const x = r.left + r.width / 2 - hr.left; // sai do meio de cima de cada pílula
      const y = r.top - hr.top;
      const d = `M${x},${y} C${x},${y - (y - iy) * 0.6} ${ix},${iy + (y - iy) * 0.5} ${ix},${iy}`;
      const base = document.createElementNS(ns, 'path');
      base.setAttribute('d', d); base.setAttribute('class', 'base');
      const pulse = document.createElementNS(ns, 'path');
      pulse.setAttribute('d', d); pulse.setAttribute('class', 'pulse');
      svg.append(base, pulse);
      const len = pulse.getTotalLength();
      const seg = Math.min(70, len * 0.3);
      pulse.style.strokeDasharray = `${seg} ${len + seg}`;
      pulse.style.strokeDashoffset = seg;
      flowTl
        .fromTo(pulse, { strokeDashoffset: seg }, { strokeDashoffset: -len, duration: TRAVEL, ease: 'power1.in' }, i * STEP)
        .call(receive, [i], i * STEP + TRAVEL);
    });
  };
  if (document.fonts) document.fonts.ready.then(() => setTimeout(drawFlows, 1200)); else setTimeout(drawFlows, 1200);
  let rz;
  addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(drawFlows, 250); });

  // Ao rolar, o hero se afasta e as ondas abrem
  const heroOut = { trigger: hero, start: 'bottom bottom', end: 'bottom top', scrub: true };
  gsap.to(['.hero .wrap', svg], { yPercent: -10, opacity: 0.15, ease: 'none', scrollTrigger: heroOut });
  gsap.to('.hero-wave.l', { xPercent: -30, ease: 'none', scrollTrigger: heroOut });
  gsap.to('.hero-wave.r', { xPercent: 30, ease: 'none', scrollTrigger: heroOut });

  /* ---------- Títulos das seções: entram por palavra e repetem em loop ---------- */
  $$('[data-words]').forEach((h) => {
    if (h.closest('#hero')) return;
    const words = splitWords(h);
    gsap.set(words, { yPercent: 70, opacity: 0, filter: 'blur(12px)' });
    ScrollTrigger.create({
      trigger: h, start: 'top 85%', once: true,
      onEnter: () => gsap.to(words, {
        yPercent: 0, opacity: 1, filter: 'blur(0px)', duration: 0.9, stagger: 0.05, ease: 'power3.out',
        clearProps: 'filter', // sem loop: título que some e volta parece quebrado para quem está lendo
      }),
    });
  });

  /* ---------- Reveal dos blocos ---------- */
  $$('.sys.reveal').forEach((c) => [...c.children].forEach((ch, i) => ch.style.setProperty('--i', i)));
  ScrollTrigger.batch('.reveal', {
    start: 'top 96%', once: true,
    // Entrada em CSS (.in): antes o clearProps devolvia o translateY do CSS e o card pulava 24px no fim
    onEnter: (els) => els.forEach((el, i) => { el.style.setProperty('--d', i * 0.08 + 's'); el.classList.add('in'); setTimeout(() => el.classList.add('done'), 1800 + i * 80); }), // done: devolve hover e transições próprias
  });

  // 3D tilt com reflexo (transitions.dev) nas telas do bento
  $$('.demo').forEach((d) => {
    d.addEventListener('pointermove', (e) => {
      const r = d.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      d.style.setProperty('--gx', px * 100 + '%');
      d.style.setProperty('--gy', py * 100 + '%');
      gsap.to(d, { rotationY: (px - 0.5) * 8, rotationX: (0.5 - py) * 6, transformPerspective: 900, duration: 0.5, ease: 'power2.out' });
    });
    d.addEventListener('pointerleave', () => gsap.to(d, { rotationX: 0, rotationY: 0, duration: 0.8, ease: 'elastic.out(1,0.5)' }));
  });

  /* ---------- Prazos: curva desenha, dias rolam no tambor e enchem o calendário ---------- */
  // Revela uma vez ao entrar (preso à rolagem, a curva ficava cortada com borda reta quando a pessoa parava)
  gsap.fromTo('.deadline .art', { clipPath: 'inset(0 100% 0 0)' }, {
    clipPath: 'inset(0 0% 0 0)', duration: 1.6, ease: 'power2.inOut',
    scrollTrigger: { trigger: '#prazos', start: 'top 75%', once: true },
  });
  // Spinning counter (transitions.dev): cada dígito é um tambor de 0 a 9
  const drums = $$('[data-count]').map((b) => {
    const target = String(b.dataset.count);
    b.textContent = '';
    b.classList.add('drum');
    b.setAttribute('aria-label', target);
    const cols = [...target].map(() => {
      const col = document.createElement('span');
      col.className = 'col';
      for (let d = 0; d <= 9; d++) { const s = document.createElement('span'); s.textContent = d; col.append(s); }
      b.append(col);
      return col;
    });
    return { cols, digits: [...target].map(Number) };
  });
  const deadlineTl = gsap.timeline({ repeat: -1, repeatDelay: 3.5, paused: true });
  drums.forEach(({ cols, digits }, k) => {
    const ticks = $$('i', $$('[data-ticks]')[k]);
    deadlineTl
      .set(cols, { yPercent: 0 }, 0)
      .add(() => ticks.forEach((t) => t.classList.remove('on')), 0)
      .to(cols, { yPercent: (i) => -10 * digits[i], duration: 1.6, ease: 'back.out(1.4)', stagger: 0.12 }, 0.2 + k * 0.3)
      .add(() => ticks.forEach((t, i) => gsap.delayedCall(i * 0.045, () => t.classList.add('on'))), 0.2 + k * 0.3);
  });
  deadlineTl.to({}, { duration: 2.5 });
  whileVisible('#prazos', deadlineTl);

  /* ---------- Ícones da contratação se desenham em loop ---------- */
  $$('.feat .ico').forEach((ico) => {
    const shapes = $$('path, rect', ico);
    shapes.forEach((s) => { const l = s.getTotalLength(); s.style.strokeDasharray = l; s.style.strokeDashoffset = l; });
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 3, paused: true })
      .to(shapes, { strokeDashoffset: 0, duration: 1.4, stagger: 0.15, ease: 'power2.inOut' })
      .to(shapes, { strokeDashoffset: (i, s) => -s.getTotalLength(), duration: 0.9, ease: 'power2.in', delay: 3.5 })
      .set(shapes, { strokeDashoffset: (i, s) => s.getTotalLength() });
    whileVisible(ico, tl);
  });

  /* ---------- Quem desenvolve: onda em parallax + certificações ---------- */
  gsap.fromTo('.about-art .bg', { scale: 1.25, yPercent: -6 }, {
    scale: 1, yPercent: 6, ease: 'none',
    scrollTrigger: { trigger: '.about', start: 'top bottom', end: 'bottom top', scrub: true },
  });
  const certs = $$('.certs li');
  const certTl = gsap.timeline({ repeat: -1, repeatDelay: 2, paused: true })
    .to(certs, { borderColor: 'rgba(144,187,221,.7)', color: '#F2F7FA', duration: 0.3, stagger: { each: 0.6, yoyo: true, repeat: 1 } });
  whileVisible('.certs', certTl);

  /* ---------- FAQ: acordeão suave ---------- */
  $$('.faq details').forEach((d) => {
    const sum = $('summary', d);
    const body = $('p', d);
    sum.addEventListener('click', (e) => {
      e.preventDefault();
      if (!d.open) {
        d.open = true;
        gsap.fromTo(body, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.45, ease: 'power3.out' });
      } else {
        gsap.to(body, { height: 0, opacity: 0, duration: 0.35, ease: 'power3.in', onComplete: () => { d.open = false; gsap.set(body, { clearProps: 'all' }); } });
      }
    });
  });

  /* ---------- CTA: a mão sobe "oferecendo" a conversa ---------- */
  gsap.fromTo('.cta-hand', { yPercent: 30 }, {
    yPercent: 0, ease: 'none',
    scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom bottom', scrub: 1 },
  });

  addEventListener('load', () => ScrollTrigger.refresh());
})();
