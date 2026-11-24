/* Telas animadas do bento.
   Cada tela encena, em loop, o roteiro do vídeo do sistema: o pedido chega no celular,
   a IA raciocina e consulta os documentos da Câmara, a resposta sai e o servidor revisa.
   Os diálogos vêm dos próprios vídeos (dados fictícios, como avisa o rodapé). */
(() => {
  'use strict';

  const SCRIPTS = {
    atendimento: {
      head: { av: 'CM', name: 'Câmara de Exemplópolis', sub: 'WhatsApp · conta comercial' },
      tabs: ['WhatsApp', 'Site', 'Telefone'],
      panel: { title: 'Documentos da Câmara', items: ['Pauta da sessão de 18/11', 'PL 41/2026, feiras livres', 'Regimento Interno'] },
      steps: [
        ['user', 'boa tarde, qnd é a proxima sesão da câmara? e oq tem na pauta', '14:02'],
        ['think', ['Lendo a pergunta do cidadão…', 'Buscando na pauta publicada…']],
        ['scan', 0],
        ['ai', 'A próxima sessão é terça, 18/11, às 19h. Na pauta estão o PL 41, das feiras livres, e o PL 44, da praça central.', '14:02'],
        ['toast', 'A resposta sai dos documentos da Câmara'],
        ['user', 'esse da feira muda alguma coisa pra quem vende no sábado?', '14:03'],
        ['think', ['Abrindo o texto do PL 41…']],
        ['scan', 1],
        ['ai', 'Muda o horário. Pelo PL 41, a feira de sábado passa a ir das 6h às 13h, se for aprovado na terça.', '14:03'],
        ['wait', 1200],
        ['tab', 2],
        ['sub', 'Ligação · telefone da Câmara'],
        ['voice', 3800, 'A mesma pergunta chega por telefone'],
        ['toast', 'No telefone, a resposta sai em voz'],
        ['wait', 2200],
      ],
    },
  };

  const MAX_MSGS = 6;
  const hasGsap = () => Boolean(window.gsap);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const bars = (n) => {
    const wrap = el('span', 'bars');
    for (let i = 0; i < n; i++) {
      const b = el('i');
      b.style.height = 20 + Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.23)) * 80 + '%';
      b.style.setProperty('--d', i);
      wrap.append(b);
    }
    return wrap;
  };
  const pop = (node, from) => {
    if (!hasGsap()) return null;
    return gsap.fromTo(node, from || { opacity: 0, y: 10, scale: 0.94, filter: 'blur(6px)' },
      { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.45, ease: 'back.out(1.6)' });
  };

  // Espera "tempo visível": a cena para quando sai da tela.
  const sleep = (u, ms) => new Promise((done) => {
    let left = ms;
    let last = performance.now();
    const tick = (now) => {
      if (u.run) left -= now - last;
      last = now;
      if (left <= 0) done(); else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  function build(root, cfg) {
    root.replaceChildren();
    const aurora = el('div', 'aurora');
    aurora.append(el('i'), el('i'), el('i'));

    const head = el('div', 'cv-head');
    const who = el('span');
    const sub = el('span', 'cv-sub', cfg.head.sub);
    who.append(el('b', null, cfg.head.name), sub);
    head.append(el('span', 'cv-av', cfg.head.av), who);
    let tabs = null;
    if (cfg.tabs) {
      tabs = el('span', 'cv-tabs');
      cfg.tabs.forEach((t) => tabs.append(el('span', null, t)));
      tabs.append(el('i'));
      head.append(tabs);
    }

    const chat = el('div', 'cv-chat');
    const input = el('span', 'cv-input');
    const compose = el('div', 'cv-compose');
    compose.append(input, el('span', 'cv-send'));
    const voice = el('div', 'cv-voice');
    const voiceText = el('span');
    voice.append(el('span', 'mic'), bars(28), voiceText);
    const phone = el('div', 'cv-phone');
    phone.append(head, chat, compose, voice);

    const ai = el('span', 'cv-ai');
    const icon = el('img');
    icon.src = 'assets/icone-azul-claro.svg';
    icon.alt = '';
    ai.append(icon, 'AI Assistant');
    const think = el('div', 'cv-think');
    const items = el('div', 'cv-items');
    const panel = el('div', 'cv-panel');
    const lens = el('span', 'cv-lens');
    panel.append(ai, think, el('span', 'cv-ptitle', cfg.panel.title), items, lens);

    const stage = el('div', 'cv-stage');
    stage.append(phone, panel);
    const toast = el('div', 'cv-toast');
    root.append(aurora, stage, toast);
    return { root, cfg, stage, chat, input, sub, lens, send: compose.lastElementChild, tabs, voice, voiceText, think, items, toast, run: false, toastOn: false, proto: null };
  }

  const item = (text) => {
    const it = el('div', 'cv-item');
    const eq = el('span', 'eq');
    eq.append(el('i'), el('i'), el('i'));
    it.append(el('span', null, text), eq);
    return it;
  };

  function setTab(u, i, animate) {
    if (!u.tabs) return;
    const spans = [...u.tabs.querySelectorAll('span')];
    spans.forEach((s, k) => s.classList.toggle('on', k === i));
    const target = spans[i];
    const props = { x: target.offsetLeft - 2, width: target.offsetWidth };
    if (hasGsap()) gsap.to(u.tabs.querySelector('i'), { ...props, duration: animate ? 0.5 : 0, ease: 'power3.inOut' });
  }

  function reset(u) {
    u.chat.replaceChildren();
    u.input.textContent = '';
    u.input.classList.remove('typing');
    u.sub.textContent = u.cfg.head.sub;
    u.think.replaceChildren();
    u.items.replaceChildren(...u.cfg.panel.items.map(item));
    u.toastOn = false;
    u.proto = null;
    if (hasGsap()) gsap.set([u.toast, u.voice, u.lens], { autoAlpha: 0 });
    setTab(u, 0, false);
  }

  function addMsg(u, who, text, time) {
    const m = el('div', 'cv-msg ' + who);
    const body = el('span', null, text);
    m.append(body);
    if (time) m.append(el('time', null, time));
    u.chat.append(m);
    while (u.chat.children.length > MAX_MSGS) u.chat.firstElementChild.remove();
    pop(m);
    return body;
  }

  async function setToast(u, nodes) {
    if (u.toastOn) await gsap.to(u.toast, { opacity: 0, y: -8, scale: 0.95, filter: 'blur(6px)', duration: 0.25 });
    u.toast.replaceChildren(...nodes);
    gsap.fromTo(u.toast, { autoAlpha: 0, y: 14, scale: 0.9, filter: 'blur(8px)' },
      { autoAlpha: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 0.5, ease: 'back.out(1.7)' });
    u.toastOn = true;
  }

  const STEPS = {
    async wait(u, [ms]) { await sleep(u, ms); },

    async user(u, [text, time]) {
      u.input.classList.add('typing');
      for (let i = 1; i <= text.length; i++) {
        u.input.textContent = text.slice(0, i);
        await sleep(u, 26 + Math.random() * 34);
      }
      await sleep(u, 280);
      u.input.classList.remove('typing');
      u.input.textContent = '';
      gsap.fromTo(u.send, { scale: 0.7 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' });
      addMsg(u, 'me', text, time);
      await sleep(u, 450);
    },

    // "Reasoning stream" (transitions.dev): o raciocínio sobe uma linha por vez
    async think(u, [lines]) {
      for (const line of lines) {
        const prev = [...u.think.children];
        const s = el('span', null, line);
        u.think.append(s);
        if (prev.length) gsap.to(prev, { yPercent: -120, opacity: 0, duration: 0.4, onComplete: () => prev.forEach((p) => p.remove()) });
        gsap.fromTo(s, { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.4 });
        await sleep(u, 950);
      }
    },

    async scan(u, [hit]) {
      const its = [...u.items.children];
      its.forEach((i) => i.classList.remove('hit', 'miss'));
      // Lente de busca (React Bits Pro, Bento 17): salta de um documento ao outro
      const pr = u.lens.parentElement.getBoundingClientRect();
      const at = (it) => { const r = it.getBoundingClientRect(); return { x: r.right - pr.left - 22, y: r.top - pr.top + r.height / 2 - 8 }; };
      gsap.set(u.lens, { ...at(its[0]), autoAlpha: 1, scale: 0.6 });
      for (const it of its) {
        it.classList.add('scan');
        gsap.to(u.lens, { ...at(it), scale: 1, duration: 0.16, ease: 'power2.out' });
        await sleep(u, 190);
        it.classList.remove('scan');
      }
      if (hit == null) {
        its.forEach((i) => i.classList.add('miss'));
        gsap.to(u.lens, { x: '+=4', yoyo: true, repeat: 3, duration: 0.06 });
        await sleep(u, 300);
        gsap.to(u.lens, { autoAlpha: 0, duration: 0.3 });
        await sleep(u, 200);
        return;
      }
      gsap.to(u.lens, { ...at(its[hit]), duration: 0.3, ease: 'back.out(2)' });
      gsap.to(u.lens, { autoAlpha: 0, scale: 1.6, duration: 0.35, delay: 0.3 });
      its[hit].classList.add('hit');
      gsap.fromTo(its[hit], { scale: 0.92 }, { scale: 1, duration: 0.5, ease: 'back.out(3)' });
      await sleep(u, 500);
    },

    async ai(u, [text, time]) {
      const dots = el('div', 'cv-dots');
      dots.append(el('i'), el('i'), el('i'));
      u.chat.append(dots);
      pop(dots);
      await sleep(u, 1000);
      dots.remove();
      const body = addMsg(u, 'ai', '', time);
      const words = text.split(' ');
      for (let i = 1; i <= words.length; i++) {
        body.textContent = words.slice(0, i).join(' ');
        await sleep(u, 45);
      }
      await sleep(u, 700);
    },

    // Toast (transitions.dev): sobe com fade, blur e escala
    async toast(u, [text]) {
      await setToast(u, [el('span', null, text)]);
      await sleep(u, 1700);
    },

    // Spinner que vira check (transitions.dev)
    async check(u, [text]) {
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('class', 'cv-check');
      svg.setAttribute('viewBox', '0 0 16 16');
      const c = document.createElementNS(ns, 'circle');
      c.setAttribute('cx', '8'); c.setAttribute('cy', '8'); c.setAttribute('r', '6.5');
      const p = document.createElementNS(ns, 'path');
      p.setAttribute('d', 'M5 8.3l2 2 4-4.3');
      svg.append(c, p);
      await setToast(u, [svg, el('span', null, text)]);
      const spin = gsap.to(c, { rotation: 360, svgOrigin: '8 8', duration: 0.6, repeat: -1, ease: 'none' });
      await sleep(u, 1100);
      spin.kill();
      gsap.to(c, { strokeDasharray: '41 60', rotation: 0, duration: 0.3 });
      gsap.to(p, { strokeDashoffset: 0, duration: 0.4, delay: 0.15 });
      gsap.fromTo(u.toast, { scale: 1 }, { scale: 1.06, yoyo: true, repeat: 1, duration: 0.15, delay: 0.25 });
      await sleep(u, 1600);
    },

    // Texto que troca com blur (transitions.dev)
    async sub(u, [text]) {
      await gsap.to(u.sub, { opacity: 0, y: -4, filter: 'blur(4px)', duration: 0.2 });
      u.sub.textContent = text;
      gsap.fromTo(u.sub, { opacity: 0, y: 4, filter: 'blur(4px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.3 });
      await sleep(u, 400);
    },

    // Tabs sliding (transitions.dev): a pílula segue o canal ativo
    async tab(u, [i]) { setTab(u, i, true); await sleep(u, 600); },

    async voice(u, [ms, text]) {
      u.voiceText.textContent = text;
      gsap.fromTo(u.voice, { autoAlpha: 0, scale: 0.96 }, { autoAlpha: 1, scale: 1, duration: 0.4 });
      await sleep(u, ms);
      gsap.to(u.voice, { autoAlpha: 0, duration: 0.3 });
    },

  };

  // Ajudantes para as cenas próprias (js/scenes.js)
  const typeInto = async (u, node, text, min = 22, spread = 30) => {
    node.classList.add('typing');
    for (let i = 1; i <= text.length; i++) {
      node.textContent = text.slice(0, i);
      await sleep(u, min + Math.random() * spread);
    }
    node.classList.remove('typing');
  };
  const scramble = async (u, node, final) => {
    for (let f = 0; f < 14; f++) {
      node.textContent = final.replace(/\d/g, () => Math.floor(Math.random() * 10));
      await sleep(u, 45);
    }
    node.textContent = final;
  };
  const HELP = {
    el, sleep, pop, bars, type: typeInto, scramble,
    toast: (u, text) => STEPS.toast(u, [text]),
    check: (u, text) => STEPS.check(u, [text]),
  };

  async function sceneLoop(u, scene) {
    for (;;) {
      scene.reset();
      u.toastOn = false;
      gsap.set(u.toast, { autoAlpha: 0 });
      gsap.fromTo(u.stage, { opacity: 0, filter: 'blur(8px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.5 });
      await sleep(u, 500);
      await scene.run();
      await sleep(u, 1800);
      await gsap.to([u.stage, u.toast], { opacity: 0, filter: 'blur(8px)', duration: 0.4 });
      gsap.set(u.toast, { filter: 'blur(0px)' });
    }
  }

  function initScene(root, make) {
    root.replaceChildren();
    const aurora = el('div', 'aurora');
    aurora.append(el('i'), el('i'), el('i'));
    const stage = el('div', 'sc-stage');
    const toast = el('div', 'cv-toast');
    root.append(aurora, stage, toast);
    const u = { root, stage, toast, run: false, toastOn: false };
    const scene = make(u, HELP);
    if (reduce || !hasGsap()) { scene.reset(); scene.still?.(); return; }
    new IntersectionObserver(([e]) => { u.run = e.isIntersecting; }, { threshold: 0.25 }).observe(root);
    sceneLoop(u, scene).catch((err) => console.error('Cena parou:', root.dataset.cover, err));
  }

  async function loop(u) {
    for (;;) {
      reset(u);
      gsap.fromTo(u.stage, { opacity: 0, filter: 'blur(8px)' }, { opacity: 1, filter: 'blur(0px)', duration: 0.5 });
      await sleep(u, 500);
      for (const [type, ...args] of u.cfg.steps) await STEPS[type](u, args);
      await sleep(u, 1500);
      await gsap.to(u.stage, { opacity: 0, filter: 'blur(8px)', duration: 0.4 });
    }
  }

  // Sem animação: mostra a primeira pergunta e a primeira resposta, paradas.
  function staticFrame(u) {
    const first = (t) => u.cfg.steps.find(([type]) => type === t);
    const q = first('user');
    const a = first('ai');
    const s = first('scan');
    if (q) addMsg(u, 'me', q[1], q[2]);
    if (a) addMsg(u, 'ai', a[1], a[2]);
    if (s && s[1] != null) u.items.children[s[1]].classList.add('hit');
  }

  function init() {
    document.querySelectorAll('.demo[data-cover]').forEach((root) => {
      const make = window.BD_SCENES && window.BD_SCENES[root.dataset.cover];
      if (make) { initScene(root, make); return; }
      const cfg = SCRIPTS[root.dataset.cover];
      if (!cfg) return;
      const u = build(root, cfg);
      if (reduce || !hasGsap()) {
        u.items.replaceChildren(...cfg.panel.items.map(item));
        staticFrame(u);
        return;
      }
      new IntersectionObserver(([e]) => { u.run = e.isIntersecting; }, { threshold: 0.25 }).observe(root);
      loop(u).catch((err) => console.error('Tela animada parou:', root.dataset.cover, err));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
