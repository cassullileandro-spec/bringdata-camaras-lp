/* Cenas próprias do bento: cada sistema tem uma tela diferente, para dar vontade de ver.
   Atendimento continua como conversa no celular (js/covers.js); as demais são:
   ouvidoria = protocolo com o prazo da lei correndo, ata = gravação virando transcrição,
   redacao = documento sendo escrito, assistente = busca na base da Câmara.
   O motor (laço, pausa fora da tela, toast) está em js/covers.js. Dados fictícios. */
(() => {
  'use strict';

  const S = (window.BD_SCENES = {});
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs) => {
    const n = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v));
    return n;
  };

  /* ---------- Ouvidoria: o pedido vira protocolo e o prazo corre ---------- */
  S.ouvidoria = (u, h) => {
    const { el } = h;
    const LIMIT = 20;
    const ANSWER_DAY = 9;
    const wrap = el('div', 'sc sc-ouv');

    const ticket = el('div', 'sc-card sc-ticket');
    const top = el('div', 'sc-row');
    top.append(el('span', 'sc-chip', 'e-SIC · Lei 12.527/2011'), el('time', null, '23:14'));
    const who = el('div', 'sc-who');
    who.append(el('span', 'sc-av', 'CV'), el('span', null, 'Cidadã · WhatsApp'));
    const quote = el('p', 'sc-quote');
    const proto = el('div', 'sc-proto');
    const pn = el('b');
    proto.append(el('span', null, 'Protocolo'), pn);
    ticket.append(top, who, quote, proto);

    const side = el('div', 'sc-card sc-side');
    const gauge = el('div', 'sc-gauge');
    const svg = svgEl('svg', { viewBox: '0 0 100 100' });
    const R = 42;
    const C = 2 * Math.PI * R;
    svg.append(svgEl('circle', { cx: 50, cy: 50, r: R, class: 'trk' }), svgEl('circle', { cx: 50, cy: 50, r: R, class: 'arc' }));
    const arc = svg.lastChild;
    arc.style.strokeDasharray = C;
    const gText = el('div', 'sc-gtext');
    const gNum = el('b', null, '0');
    gText.append(el('span', null, 'dia'), gNum, el('span', null, `de ${LIMIT}`));
    gauge.append(svg, gText);
    const steps = el('ol', 'sc-steps');
    ['Pedido recebido', 'Protocolo aberto', 'Setor avisado', 'Resposta no WhatsApp'].forEach((t) => {
      const li = el('li');
      li.append(el('i'), el('span', null, t));
      steps.append(li);
    });
    const lis = [...steps.children];
    side.append(gauge, steps);
    wrap.append(ticket, side);
    u.stage.append(wrap);

    return {
      reset() {
        quote.textContent = '';
        pn.textContent = '';
        gNum.textContent = '0';
        lis.forEach((l) => l.classList.remove('on', 'now'));
        gsap.set(arc, { strokeDashoffset: C });
        gsap.set(proto, { autoAlpha: 0 });
      },
      still() {
        quote.textContent = 'e o laudo da reforma do prédio? quero ver';
        pn.textContent = '2026-000318';
        gNum.textContent = ANSWER_DAY;
        arc.style.strokeDashoffset = C * (1 - ANSWER_DAY / LIMIT);
        proto.style.opacity = 1;
        lis.forEach((l) => l.classList.add('on'));
      },
      async run() {
        await h.type(u, quote, 'e o laudo da reforma do prédio? quero ver');
        lis[0].classList.add('on');
        await h.sleep(u, 500);
        gsap.fromTo(proto, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4 });
        await h.scramble(u, pn, '2026-000318');
        lis[1].classList.add('on');
        await h.sleep(u, 400);
        lis[2].classList.add('now');
        for (let d = 1; d <= ANSWER_DAY; d++) {
          gNum.textContent = d;
          gsap.fromTo(gNum, { yPercent: -60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.25, ease: 'back.out(2)' });
          gsap.to(arc, { strokeDashoffset: C * (1 - d / LIMIT), duration: 0.3 });
          await h.sleep(u, 330);
        }
        lis[2].classList.replace('now', 'on');
        lis[3].classList.add('on');
        await h.check(u, 'Respondido no dia 9 de 20');
      },
    };
  };

  /* ---------- Ata: a gravação toca e vira transcrição com o minuto de cada voto ---------- */
  S.ata = (u, h) => {
    const { el } = h;
    const BARS = 64;
    const LINES = [
      { at: 0.03, t: '19:02', who: 'Pres. Lima', say: 'Declaro aberta a sessão.' },
      { at: 0.41, t: '01:12:40', who: 'Pres. Lima', say: 'Em votação o PL 41.', pin: 'PL 41' },
      { at: 0.43, t: '01:12:52', who: 'Ver. Carlos', say: 'Voto sim, senhor presidente.' },
      { at: 0.45, t: '01:13:30', who: 'Pres. Lima', say: 'Aprovado por 7 votos.' },
      { at: 0.61, t: '01:48:15', who: 'Pres. Lima', say: 'Em votação o PL 44.', pin: 'PL 44' },
    ];
    const MAX_LINES = 4;
    const wrap = el('div', 'sc sc-ata');

    const player = el('div', 'sc-card sc-player');
    const meta = el('div', 'sc-row');
    const name = el('span', 'sc-file');
    name.append(el('i', null, '▶'), 'sessao_terca.mp3');
    const clock = el('time', null, '00:00');
    meta.append(name, clock);
    const wave = el('div', 'sc-wave');
    const bars = [];
    for (let i = 0; i < BARS; i++) {
      const b = el('i');
      b.style.height = 18 + Math.abs(Math.sin(i * 0.9) * Math.cos(i * 0.31)) * 82 + '%';
      wave.append(b);
      bars.push(b);
    }
    const head = el('span', 'sc-head');
    wave.append(head);
    player.append(meta, wave);

    const doc = el('div', 'sc-card sc-trans');
    const docTop = el('div', 'sc-row');
    docTop.append(el('b', null, 'Minuta da ata'), el('span', 'sc-chip', 'transcrevendo'));
    const lines = el('div', 'sc-lines');
    doc.append(docTop, lines);
    wrap.append(player, doc);
    u.stage.append(wrap);
    const chip = docTop.lastChild;

    const fmt = (p) => {
      const s = Math.round(p * 10680); // 2h58
      const hh = Math.floor(s / 3600);
      const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      return hh ? `${hh}:${mm}:${String(s % 60).padStart(2, '0')}` : `${mm}:${String(s % 60).padStart(2, '0')}`;
    };
    const seek = (p, dur) => {
      gsap.to(head, { left: p * 100 + '%', duration: dur, ease: 'none', onUpdate() {
        const now = parseFloat(head.style.left) / 100;
        clock.textContent = fmt(now);
        bars.forEach((b, i) => b.classList.toggle('on', i / BARS <= now));
      } });
    };

    return {
      reset() {
        lines.replaceChildren();
        wave.querySelectorAll('.sc-pin').forEach((n) => n.remove());
        bars.forEach((b) => b.classList.remove('on'));
        head.style.left = '0%';
        clock.textContent = '00:00';
        chip.textContent = 'transcrevendo';
        chip.classList.remove('ok');
      },
      still() {
        LINES.slice(1, 4).forEach((l) => {
          const row = el('p');
          row.append(el('time', null, l.t), el('b', null, l.who), el('span', null, l.say));
          lines.append(row);
        });
      },
      async run() {
        for (const l of LINES) {
          seek(l.at, 0.9);
          await h.sleep(u, 950);
          if (l.pin) {
            const pin = el('span', 'sc-pin', l.pin);
            pin.style.left = l.at * 100 + '%';
            wave.append(pin);
            gsap.fromTo(pin, { y: 8, autoAlpha: 0, scale: 0.6 }, { y: 0, autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(2.4)' });
          }
          const row = el('p');
          const say = el('span');
          row.append(el('time', null, l.t), el('b', null, l.who), say);
          lines.append(row);
          while (lines.children.length > MAX_LINES) lines.firstElementChild.remove();
          h.pop(row, { opacity: 0, y: 8, filter: 'blur(4px)' });
          await h.type(u, say, l.say, 18, 22);
          await h.sleep(u, 350);
        }
        chip.textContent = 'pronta';
        chip.classList.add('ok');
        await h.check(u, 'Minuta pronta, com o minuto de cada voto');
      },
    };
  };

  /* ---------- Redação: o pedido do assessor vira o documento no modelo da Câmara ---------- */
  S.redacao = (u, h) => {
    const { el } = h;
    const wrap = el('div', 'sc sc-red');

    const ask = el('div', 'sc-card sc-ask');
    const askTop = el('div', 'sc-who');
    askTop.append(el('span', 'sc-av', 'AS'), el('span', null, 'Assessor · 10:41'));
    const askText = el('p', 'sc-quote');
    ask.append(askTop, askText);

    const paper = el('div', 'sc-paper');
    const kicker = el('span', 'sc-kicker', 'Câmara Municipal de Cidade Exemplo');
    const title = el('b', 'sc-title', 'Requerimento');
    const body = el('p', 'sc-body');
    const a = el('span');
    const fix = el('span', 'sc-fix');
    const b = el('span');
    body.append(a, fix, b);
    const sk = el('div', 'sc-sk');
    sk.append(el('i'), el('i'), el('i'));
    const sign = el('span', 'sc-sign', 'Sala das Sessões · Vereador(a)');
    paper.append(kicker, title, body, sk, sign);
    wrap.append(ask, paper);
    u.stage.append(wrap);
    const skl = [...sk.children];

    return {
      reset() {
        askText.textContent = '';
        a.textContent = '';
        b.textContent = '';
        fix.textContent = '';
        fix.className = 'sc-fix';
        gsap.set(paper, { autoAlpha: 0, y: 16, rotation: 1.5 });
        gsap.set(skl, { scaleX: 0 });
        gsap.set(sign, { autoAlpha: 0 });
      },
      still() {
        askText.textContent = 'requerimento cobrando o conserto da rua modelo, bairo exemplo. tem buraco perto da escola';
        a.textContent = 'Requer ao Poder Executivo o conserto da Rua Modelo, no ';
        fix.textContent = 'Bairro';
        fix.classList.add('done');
        b.textContent = ' Exemplo, onde há buraco perto da escola.';
        gsap.set(paper, { autoAlpha: 1, y: 0, rotation: 0 });
        gsap.set(skl, { scaleX: 1 });
        gsap.set(sign, { autoAlpha: 1 });
      },
      async run() {
        await h.type(u, askText, 'requerimento cobrando o conserto da rua modelo, bairo exemplo. tem buraco perto da escola', 18, 26);
        await h.sleep(u, 400);
        gsap.to(paper, { autoAlpha: 1, y: 0, rotation: 0, duration: 0.6, ease: 'back.out(1.6)' });
        await h.sleep(u, 600);
        await h.type(u, a, 'Requer ao Poder Executivo o conserto da Rua Modelo, no ', 14, 18);
        fix.classList.add('bad');
        await h.type(u, fix, 'bairo', 40, 20);
        await h.sleep(u, 700);
        await gsap.to(fix, { opacity: 0, y: -4, filter: 'blur(4px)', duration: 0.2 });
        fix.textContent = 'Bairro';
        fix.classList.replace('bad', 'done');
        gsap.fromTo(fix, { opacity: 0, y: 4 }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.3 });
        await h.sleep(u, 500);
        await h.type(u, b, ' Exemplo, onde há buraco perto da escola.', 14, 18);
        gsap.to(skl, { scaleX: 1, duration: 0.5, stagger: 0.15, ease: 'power2.out' });
        await h.sleep(u, 700);
        gsap.to(sign, { autoAlpha: 1, duration: 0.4 });
        await h.toast(u, 'No modelo que a Câmara já usa');
        await h.check(u, 'O assessor completa a justificativa');
      },
    };
  };

  /* ---------- Assistente: o pedido busca na base da Câmara e acha o que importa ---------- */
  S.assistente = (u, h) => {
    const { el } = h;
    const CARDS = [
      { k: 'Projetos protocolados', t: 'PL 112/2025 · Ver. Ana Reis', d: 'Hortas nas escolas municipais', tag: 'parecido', meter: 87 },
      { k: 'Lei Orgânica', t: 'Quem pode propor', d: 'O artigo vai citado na minuta', tag: 'vício de iniciativa', warn: true },
      { k: 'Modelos de redação', t: 'Projeto de lei', d: 'Estrutura que a Câmara usa', tag: 'modelo' },
    ];
    const wrap = el('div', 'sc sc-ast');
    const cmd = el('div', 'sc-cmd');
    const icon = el('img');
    icon.src = 'assets/icone-azul-claro.svg';
    icon.alt = '';
    const input = el('span', 'sc-input');
    const kbd = el('kbd', null, 'Enter');
    cmd.append(icon, input, kbd);

    const grid = el('div', 'sc-results');
    const cards = CARDS.map((c) => {
      const card = el('div', 'sc-card sc-res' + (c.warn ? ' warn' : ''));
      const tag = el('span', 'sc-chip', c.tag);
      card.append(el('span', 'sc-k', c.k), el('b', null, c.t), el('span', 'sc-d', c.d), tag);
      if (c.meter) {
        const m = el('span', 'sc-meter');
        const fill = el('i');
        m.append(fill);
        const pct = el('em', null, '0%');
        card.append(m, pct);
        card._meter = { fill, pct, value: c.meter };
      }
      grid.append(card);
      return card;
    });
    const draft = el('div', 'sc-draft');
    draft.append(el('b', null, 'Minuta'), el('span', null, 'Projeto de lei do Ver. Paulo · coautoria Ver. Ana Reis'));
    wrap.append(cmd, grid, draft);
    u.stage.append(wrap);

    return {
      reset() {
        input.textContent = '';
        gsap.set(cards, { autoAlpha: 0, y: 18, scale: 0.96 });
        gsap.set(draft, { autoAlpha: 0, y: 10 });
        cards.forEach((c) => {
          c.classList.remove('lit');
          if (c._meter) { gsap.set(c._meter.fill, { scaleX: 0 }); c._meter.pct.textContent = '0%'; }
        });
      },
      still() {
        input.textContent = 'faz um pl do ver. Paulo pra horta nas escolas munisipais';
        gsap.set([cards, draft], { autoAlpha: 1, y: 0, scale: 1 });
        cards.forEach((c) => c._meter && gsap.set(c._meter.fill, { scaleX: c._meter.value / 100 }));
      },
      async run() {
        await h.type(u, input, 'faz um pl do ver. Paulo pra horta nas escolas munisipais', 20, 28);
        await h.sleep(u, 250);
        gsap.fromTo(kbd, { scale: 0.85 }, { scale: 1, duration: 0.4, ease: 'back.out(3)' });
        await h.sleep(u, 300);
        gsap.to(cards, { autoAlpha: 1, y: 0, scale: 1, duration: 0.55, stagger: 0.18, ease: 'back.out(1.5)' });
        await h.sleep(u, 700);
        const m = cards[0]._meter;
        const n = { v: 0 };
        gsap.to(m.fill, { scaleX: m.value / 100, duration: 1, ease: 'power2.out' });
        gsap.to(n, { v: m.value, duration: 1, ease: 'power2.out', onUpdate: () => { m.pct.textContent = Math.round(n.v) + '%'; } });
        cards[0].classList.add('lit');
        await h.sleep(u, 1300);
        cards[1].classList.add('lit');
        gsap.fromTo(cards[1], { x: 0 }, { x: 3, yoyo: true, repeat: 3, duration: 0.06 });
        await h.sleep(u, 1200);
        cards[2].classList.add('lit');
        await h.sleep(u, 600);
        gsap.to(draft, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'back.out(1.6)' });
        await h.check(u, 'O servidor revisa antes de protocolar');
      },
    };
  };
})();
