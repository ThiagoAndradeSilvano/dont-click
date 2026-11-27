// ============================================================================
// CONTO 1: FRONTEIRA DA BUROCRACIA — POSTO 04 DE ESTRADA-MORTA (PAPERS, PLEASE REAL!)
// Hub largo, persiana metálica, alavanca PRÓXIMO!, documentos arrastáveis, gaveta legível de carimbos,
// entrega animada do passaporte com reação facial + fala final do cliente, 4 Nações memoráveis,
// suporte híbrido para artes PNG geradas (`/story1/chars/char_X_normal|approved|denied.png`) + SVG rico!
// ============================================================================

export function runStory1Burocracia({ app, setOperatorRemark, playBeep, finishStory, returnToCave, caveState }) {
  document.body.className = 'story-mode-1';

  // ---- ÁUDIO DEDICADO DA CABINE (Web Audio API) ----
  let boothAudio = null;
  function getAudio() {
    try {
      if (!boothAudio) {
        const AC = window.AudioContext || window.webkitAudioContext;
        boothAudio = new AC();
      }
      if (boothAudio.state === 'suspended') boothAudio.resume();
      return boothAudio;
    } catch {
      return null;
    }
  }

  // Som rico completo de "PRÓXIMO!": Clack de microfone + Chiado de corneta AM + Voz rouca modulada ("BÉÉH-PRÓ-XI-MO!") + eco!
  function playMegaphoneCall() {
    const ctx = getAudio();
    if (!ctx) return;
    const t0 = ctx.currentTime;

    // 1. Clack seco de apertar o botão PTT do megafone
    const clickBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.03), ctx.sampleRate);
    const cd = clickBuf.getChannelData(0);
    for (let i = 0; i < cd.length; i++) cd[i] = (Math.random() * 2 - 1) * Math.exp(-i / 180);
    const clickSrc = ctx.createBufferSource();
    clickSrc.buffer = clickBuf;
    const clickGain = ctx.createGain();
    clickGain.gain.value = 0.25;
    clickSrc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickSrc.start(t0);

    // 2. Chiado estático abafado de rádio/alto-falante externo durante a chamada
    const hissDur = 0.72;
    const hissBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * hissDur), ctx.sampleRate);
    const hd = hissBuf.getChannelData(0);
    for (let i = 0; i < hd.length; i++) hd[i] = (Math.random() * 2 - 1) * 0.14;
    const hissSrc = ctx.createBufferSource();
    hissSrc.buffer = hissBuf;
    const hissBp = ctx.createBiquadFilter();
    hissBp.type = 'bandpass';
    hissBp.frequency.value = 1150;
    hissBp.Q.value = 1.8;
    const hissGain = ctx.createGain();
    hissGain.gain.setValueAtTime(0.08, t0 + 0.02);
    hissGain.gain.exponentialRampToValueAtTime(0.001, t0 + hissDur);
    hissSrc.connect(hissBp);
    hissBp.connect(hissGain);
    hissGain.connect(ctx.destination);
    hissSrc.start(t0 + 0.02);

    // 3. Sílabas graves distorcidas no alto-falante igual ao "PRÓ-XI-MO!" do Papers, Please!
    const syllables = [
      { f1: 320, f2: 280, start: 0.05, dur: 0.19, vol: 0.17 },
      { f1: 235, f2: 185, start: 0.27, dur: 0.34, vol: 0.19 },
    ];
    syllables.forEach((s) => {
      const osc = ctx.createOscillator();
      const sub = ctx.createOscillator();
      const bp = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      sub.type = 'square';
      osc.frequency.setValueAtTime(s.f1, t0 + s.start);
      osc.frequency.linearRampToValueAtTime(s.f2, t0 + s.start + s.dur);
      sub.frequency.setValueAtTime(s.f1 * 0.5, t0 + s.start);

      bp.type = 'bandpass';
      bp.frequency.value = 760;
      bp.Q.value = 2.4;

      gain.gain.setValueAtTime(0.001, t0 + s.start);
      gain.gain.linearRampToValueAtTime(s.vol, t0 + s.start + 0.025);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + s.start + s.dur);

      osc.connect(bp);
      sub.connect(bp);
      bp.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t0 + s.start);
      sub.start(t0 + s.start);
      osc.stop(t0 + s.start + s.dur + 0.02);
      sub.stop(t0 + s.start + s.dur + 0.02);
    });
  }

  // Buzzer metálico da catraca abrindo ("BZZZT-CLACK!")
  function playGateBuzzSound() {
    const ctx = getAudio();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(118, t0);
    g.gain.setValueAtTime(0.11, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.24);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.25);
  }

  // Passos crocantes na neve/cimento até entrar na porta da cabine!
  function playFootsteps(steps = 5, intervalMs = 130) {
    const ctx = getAudio();
    if (!ctx) return;
    for (let i = 0; i < steps; i++) {
      setTimeout(() => {
        if (!isAlive) return;
        const t = ctx.currentTime;
        const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.055), ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let k = 0; k < d.length; k++) {
          d[k] = (Math.random() * 2 - 1) * Math.exp(-k / (ctx.sampleRate * 0.015));
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 620 + (i % 2) * 140;
        const g = ctx.createGain();
        g.gain.value = 0.14;
        src.connect(lp);
        lp.connect(g);
        g.connect(ctx.destination);
        src.start(t);
      }, i * intervalMs);
    }
  }

  function playShutterClank() {
    const ctx = getAudio();
    if (!ctx) return;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.22, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    const g = ctx.createGain();
    g.gain.value = 0.22;
    src.connect(lp);
    lp.connect(g);
    g.connect(ctx.destination);
    src.start();
  }

  function playPaperSlide() {
    const ctx = getAudio();
    if (!ctx) return;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.09, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * 0.35 * (1 - i / d.length);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1800;
    const g = ctx.createGain();
    g.gain.value = 0.1;
    src.connect(hp);
    hp.connect(g);
    g.connect(ctx.destination);
    src.start();
  }

  function playHeavyStampSound() {
    const ctx = getAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(145, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(42, ctx.currentTime + 0.11);
    g.gain.setValueAtTime(0.32, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
    playShutterClank();
  }

  function playCitationPrinter() {
    const ctx = getAudio();
    if (!ctx) return;
    for (let i = 0; i < 6; i++) {
      const t = ctx.currentTime + i * 0.09;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(520 + (i % 2) * 90, t);
      g.gain.setValueAtTime(0.07, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.055);
    }
  }

  function playIntercomTick() {
    const ctx = getAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(340 + Math.random() * 60, ctx.currentTime);
    g.gain.setValueAtTime(0.018, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.018);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.02);
  }

  // ---- AS 4 NAÇÕES DE VOSTOK-CINZA (Claras, marcantes e zero barra de rolagem na aba Brasões!) ----
  const KINGDOMS = {
    'República de Vostok': {
      cls: 'kingdom-boleto',
      cities: ['Kievagrad', 'Porto Gelo', 'Usina Sete'],
    },
    'União de Karst': {
      cls: 'kingdom-pantano',
      cities: ['Ferrovelho', 'Mina Funda', 'Cinza Alta'],
    },
    'Principado de Alvor': {
      cls: 'kingdom-bosque',
      cities: ['Monte Claro', 'Vila Real', 'Ponte Dourada'],
    },
    'Costa de Salina': {
      cls: 'kingdom-ponte',
      cities: ['Baía Negra', 'Farol Sul', 'Doca Velha'],
    },
  };

  // Desenha o Brasão SVG Oficial ou Falsificado (4 brasões grandes e super fáceis de comparar!)
  function renderSealSvg(kingdom, isForged = false, size = 38) {
    const color = '#5b2323';
    let inner = '';
    if (kingdom === 'República de Vostok') {
      // Oficial: Estrela de 5 pontas / Triângulo pra CIMA com 3 pontos | Falso: Triângulo invertido pra BAIXO!
      inner = isForged
        ? `<polygon points="11,13 29,13 20,29" fill="none" stroke="${color}" stroke-width="2.2"/><circle cx="20" cy="9.5" r="2" fill="${color}"/>`
        : `<polygon points="20,11 11,27 29,27" fill="none" stroke="${color}" stroke-width="2.2"/><circle cx="14" cy="9" r="1.7" fill="${color}"/><circle cx="20" cy="7.5" r="1.7" fill="${color}"/><circle cx="26" cy="9" r="1.7" fill="${color}"/>`;
    } else if (kingdom === 'União de Karst') {
      // Oficial: Losango com picareta/cruz central | Falso: Losango VAZIO sem cruz!
      inner = isForged
        ? `<polygon points="20,8 31,20 20,32 9,20" fill="none" stroke="${color}" stroke-width="2.2"/>`
        : `<polygon points="20,8 31,20 20,32 9,20" fill="none" stroke="${color}" stroke-width="2.2"/><line x1="14" y1="20" x2="26" y2="20" stroke="${color}" stroke-width="2.2"/><line x1="20" y1="14" x2="20" y2="26" stroke="${color}" stroke-width="2.2"/>`;
    } else if (kingdom === 'Principado de Alvor') {
      // Oficial: Coroa de 3 pontas + Sol acima | Falso: Coroa torta sem o Sol!
      inner = isForged
        ? `<polygon points="11,27 11,17 17,22 20,15 23,22 29,17 29,27" fill="none" stroke="${color}" stroke-width="2"/>`
        : `<polygon points="11,28 11,18 17,23 20,16 23,23 29,18 29,28" fill="none" stroke="${color}" stroke-width="2"/><circle cx="20" cy="10.5" r="2.6" fill="${color}"/>`;
    } else {
      // Costa de Salina — Oficial: Âncora marítima com barra horizontal | Falso: Sem barra horizontal e invertida!
      inner = isForged
        ? `<line x1="20" y1="11" x2="20" y2="27" stroke="${color}" stroke-width="2.2"/><path d="M 12 18 Q 20 10 28 18" fill="none" stroke="${color}" stroke-width="2.2"/>`
        : `<circle cx="20" cy="11" r="2.2" fill="none" stroke="${color}" stroke-width="1.8"/><line x1="20" y1="13" x2="20" y2="28" stroke="${color}" stroke-width="2.2"/><line x1="14" y1="17" x2="26" y2="17" stroke="${color}" stroke-width="2"/><path d="M 12 23 Q 20 31 28 23" fill="none" stroke="${color}" stroke-width="2.2"/>`;
    }

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style="display:block;">
        <circle cx="20" cy="20" r="17.5" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="4 1.5"/>
        <circle cx="20" cy="20" r="14.5" fill="none" stroke="${color}" stroke-width="1"/>
        ${inner}
      </svg>
    `;
  }

  // ---- CATÁLOGO DOS 8 ARQUÉTIPOS DE PERSONAGENS (Pronto para carregar PNGs do GPT ou SVG expressivo!) ----
  // Assim que as imagens forem colocadas em `client/public/story1/chars/<charId>_<mood>.png`
  // (mood = 'normal' | 'approved' | 'denied'), o jogo carrega os PNGs automaticamente!
  const CHAR_LOOKS = {
    char_1: { skin: '#d8ae8b', coat: '#2b3a4a', lapel: '#1b2631', hair: 'parted', hairColor: '#2c221b', glasses: true, mustache: true },
    char_2: { skin: '#c49672', coat: '#3f3626', lapel: '#5c4d35', hair: 'ushanka', hairColor: '#231c16', beard: true },
    char_3: { skin: '#e6c2a8', coat: '#4a1c24', lapel: '#290f14', hair: 'waves', hairColor: '#5c1d18', beret: true },
    char_4: { skin: '#cfb195', coat: '#1e293b', lapel: '#0f172a', hair: 'fedora', hairColor: '#18181b', eyes: 'narrow' },
    char_5: { skin: '#c29572', coat: '#3b1d1d', lapel: '#1f0f0f', hair: 'buzz', hairColor: '#1c1917', scar: true, eyes: 'narrow' },
    char_6: { skin: '#d9b89c', coat: '#2e4028', lapel: '#1b2618', hair: 'bun', hairColor: '#71717a', glasses: true },
    char_7: { skin: '#cfa382', coat: '#3f1616', lapel: '#7f1d1d', hair: 'slick', hairColor: '#27272a', glasses: true, mustache: true },
    char_8: { skin: '#d4d4d8', coat: '#121216', lapel: '#050507', hair: 'hood', hairColor: '#09090b', eyes: 'hollow' },
  };

  function renderPortraitFallbackSvg(charId = 'char_1', mood = 'normal', scale = 1) {
    const look = CHAR_LOOKS[charId] || CHAR_LOOKS.char_1;
    const w = Math.round(136 * scale);
    const h = Math.round(158 * scale);

    // Boca e sobrancelhas mudam conforme 'normal' | 'approved' (feliz/aliviado) | 'denied' (puto/frustrado)!
    let mouthSvg = `<path d="M55 90 Q68 89 81 90" stroke="#2b1b10" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    let browLeft = `<line x1="47" y1="59" x2="60" y2="60" stroke="#231810" stroke-width="2.6" stroke-linecap="round"/>`;
    let browRight = `<line x1="76" y1="60" x2="89" y2="59" stroke="#231810" stroke-width="2.6" stroke-linecap="round"/>`;
    let blushSvg = '';

    if (mood === 'approved') {
      mouthSvg = `<path d="M53 87 Q68 99 83 87" stroke="#2b1b10" stroke-width="2.8" fill="#fef2f2" stroke-linecap="round"/>`;
      browLeft = `<path d="M47 58 Q53 54 60 57" stroke="#231810" stroke-width="2.5" fill="none"/>`;
      browRight = `<path d="M76 57 Q83 54 89 58" stroke="#231810" stroke-width="2.5" fill="none"/>`;
      blushSvg = `<ellipse cx="48" cy="79" rx="5" ry="2.5" fill="#dc2626" opacity="0.22"/><ellipse cx="88" cy="79" rx="5" ry="2.5" fill="#dc2626" opacity="0.22"/>`;
    } else if (mood === 'denied') {
      mouthSvg = `<path d="M54 94 Q68 84 82 94" stroke="#2b1b10" stroke-width="2.8" fill="none" stroke-linecap="round"/>`;
      browLeft = `<line x1="47" y1="56" x2="61" y2="62" stroke="#231810" stroke-width="3" stroke-linecap="round"/>`;
      browRight = `<line x1="75" y1="62" x2="89" y2="56" stroke="#231810" stroke-width="3" stroke-linecap="round"/>`;
    }

    let headGear = '';
    if (look.hair === 'parted') {
      headGear = `<path d="M36 48 Q52 24 82 28 Q100 32 100 50 L96 56 Q78 39 54 44 L40 55 Z" fill="${look.hairColor}"/>`;
    } else if (look.hair === 'ushanka') {
      headGear = `
        <rect x="31" y="22" width="74" height="28" rx="8" fill="#3a2e24" stroke="#1a140f" stroke-width="2"/>
        <rect x="27" y="42" width="14" height="26" rx="4" fill="#4a3b2e" stroke="#1a140f" stroke-width="2"/>
        <rect x="95" y="42" width="14" height="26" rx="4" fill="#4a3b2e" stroke="#1a140f" stroke-width="2"/>
        <rect x="42" y="29" width="52" height="16" rx="3" fill="#5c4b3b"/>
      `;
    } else if (look.hair === 'waves') {
      headGear = `
        <path d="M32 48 Q68 22 104 48 L108 112 L91 112 L91 58 Q68 42 45 58 L45 112 L28 112 Z" fill="${look.hairColor}"/>
        <ellipse cx="66" cy="31" rx="36" ry="12" fill="#7f1d1d" stroke="#290f14" stroke-width="2" transform="rotate(-7 66 31)"/>
      `;
    } else if (look.hair === 'fedora') {
      headGear = `
        <ellipse cx="68" cy="42" rx="48" ry="7" fill="#18181b" stroke="#09090b" stroke-width="2"/>
        <path d="M42 42 L48 18 Q68 13 88 18 L94 42 Z" fill="#27272a" stroke="#09090b" stroke-width="2"/>
        <rect x="45" y="34" width="46" height="5" fill="#7f1d1d"/>
      `;
    } else if (look.hair === 'buzz') {
      headGear = `<path d="M39 48 Q68 28 97 48 L95 54 Q68 38 41 54 Z" fill="${look.hairColor}"/>`;
    } else if (look.hair === 'bun') {
      headGear = `
        <circle cx="68" cy="21" r="13" fill="${look.hairColor}" stroke="#27272a" stroke-width="2"/>
        <path d="M36 50 Q68 26 100 50 L96 60 Q68 40 40 60 Z" fill="${look.hairColor}"/>
      `;
    } else if (look.hair === 'slick') {
      headGear = `<path d="M38 46 Q68 23 98 46 L96 53 Q68 36 40 53 Z" fill="${look.hairColor}"/>`;
    } else if (look.hair === 'hood') {
      headGear = `<path d="M22 126 L30 34 Q68 10 106 34 L114 126 L93 126 L90 50 Q68 34 46 50 L43 126 Z" fill="#111115" stroke="#000" stroke-width="2"/>`;
    }

    const eyesSvg =
      look.eyes === 'hollow'
        ? `<rect x="48" y="62" width="13" height="9" rx="2" fill="#09090b"/><rect x="75" y="62" width="13" height="9" rx="2" fill="#09090b"/><circle cx="54.5" cy="66.5" r="1.8" fill="#ef4444"/><circle cx="81.5" cy="66.5" r="1.8" fill="#ef4444"/>`
        : look.eyes === 'narrow'
          ? `<ellipse cx="54" cy="67" rx="5" ry="2.2" fill="#fff"/><circle cx="54" cy="67" r="1.8" fill="#140e08"/><ellipse cx="82" cy="67" rx="5" ry="2.2" fill="#fff"/><circle cx="82" cy="67" r="1.8" fill="#140e08"/>`
          : `<ellipse cx="54" cy="67" rx="5.5" ry="3.8" fill="#fff"/><circle cx="54" cy="67" r="2.3" fill="#140e08"/><ellipse cx="82" cy="67" rx="5.5" ry="3.8" fill="#fff"/><circle cx="82" cy="67" r="2.3" fill="#140e08"/>`;

    const glassesSvg = look.glasses
      ? `<rect x="45" y="60" width="18" height="13" rx="2" fill="rgba(255,255,255,0.12)" stroke="#1c1917" stroke-width="2"/><rect x="73" y="60" width="18" height="13" rx="2" fill="rgba(255,255,255,0.12)" stroke="#1c1917" stroke-width="2"/><line x1="63" y1="66" x2="73" y2="66" stroke="#1c1917" stroke-width="2"/>`
      : '';

    const beardSvg = look.beard
      ? `<path d="M41 80 Q68 112 95 80 L90 99 Q68 115 46 99 Z" fill="${look.hairColor}" opacity="0.9"/>`
      : '';
    const mustacheSvg = look.mustache
      ? `<path d="M55 84 Q68 79 81 84 Q68 87 55 84 Z" fill="${look.hairColor}"/>`
      : '';
    const scarSvg = look.scar
      ? `<line x1="78" y1="52" x2="88" y2="80" stroke="#7f1d1d" stroke-width="2.5"/><line x1="76" y1="62" x2="84" y2="60" stroke="#7f1d1d" stroke-width="1.6"/>`
      : '';

    return `
      <svg width="${w}" height="${h}" viewBox="0 0 136 158" xmlns="http://www.w3.org/2000/svg" style="display:block;">
        <!-- Casaco Pesado de Inverno + Gola -->
        <path d="M14 158 L24 110 Q68 98 112 110 L122 158 Z" fill="${look.coat}" stroke="#0e0a07" stroke-width="2.5"/>
        <polygon points="48,106 68,136 56,158 34,112" fill="${look.lapel}"/>
        <polygon points="88,106 68,136 80,158 102,112" fill="${look.lapel}"/>
        <!-- Pescoço e Orelhas -->
        <rect x="57" y="95" width="22" height="18" fill="${look.skin}"/>
        <ellipse cx="38" cy="70" rx="4" ry="8" fill="${look.skin}" stroke="#291d12" stroke-width="1.8"/>
        <ellipse cx="98" cy="70" rx="4" ry="8" fill="${look.skin}" stroke="#291d12" stroke-width="1.8"/>
        <!-- Rosto sombreado -->
        <rect x="39" y="38" width="58" height="65" rx="18" fill="${look.skin}" stroke="#291d12" stroke-width="2.2"/>
        <path d="M40 75 Q40 102 68 103 Q96 102 96 75" fill="rgba(0,0,0,0.07)"/>
        ${blushSvg}
        ${beardSvg}
        ${browLeft}
        ${browRight}
        ${eyesSvg}
        ${glassesSvg}
        ${scarSvg}
        <!-- Nariz sombreado -->
        <path d="M68 64 L65 78 L71 79" fill="none" stroke="#4a3520" stroke-width="2.2" stroke-linejoin="round"/>
        ${mustacheSvg}
        ${mouthSvg}
        ${headGear}
      </svg>
    `;
  }

  // Renderiza automaticamente o PNG em Pixel-Art nítida (de /story1/chars/) com fallback pro SVG!
  function renderCharacterArt(charId = 'char_1', mood = 'normal', scale = 1) {
    const w = Math.round(168 * scale);
    const h = Math.round(172 * scale);
    const pngPath = `/story1/chars/${charId}_${mood}.png`;
    const svgMarkup = renderPortraitFallbackSvg(charId, mood, scale);

    return `
      <div class="pp-char-art-wrap" style="width:${w}px; height:${h}px; position:relative; display:flex; align-items:flex-end; justify-content:center;">
        <img
          src="${pngPath}"
          alt=""
          style="width:100%; height:100%; object-fit:contain; object-position:bottom center; image-rendering:pixelated; display:block;"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
        />
        <div style="display:none;">${svgMarkup}</div>
      </div>
    `;
  }

  // ---- OS 5 DIAS COMPLETOS COM NOMES FORTES E REAÇÕES AO ENTREGAR PASSAPORTE ----
  const CURRENT_DATE_STR = '24.11.2026';

  const DAYS = [
    {
      day: 1,
      codeTitle: 'DIA 1 — REABERTURA DO POSTO 04 (ESTRADA-MORTA)',
      bulletin:
        'MINISTÉRIO DA ORDEM TERRITORIAL — BOLETIM Nº 01:\nApós a nevasca, a fronteira entre as 4 Nações foi reaberta sob vigilância militar.\nTodo viajante deve apresentar PASSAPORTE válido (>= 2026) e BRASÃO OFICIAL da sua Nação (compare na aba Brasões do Manual!).\nSalário: +10 cr por acerto. Aluguel & carvão à noite: 20 cr.',
      supervisorIntro:
        'KSHHH— Posto 04 em operação. Chame o primeiro no botão vermelho PRÓXIMO!, confira validade e brasão no Manual, puxe a gaveta CARIMBOS à direita e devolva o passaporte pela fresta.',
      logIntro:
        'mano... o livro sugou a gente pra dentro de uma guarita gelada no meio do nada!! tem até coronel chiando no rádio velho kkkkk faz o trampo aí pra gente ver onde essa história vai dar.',
      rules: [
        '• Todo viajante deve apresentar PASSAPORTE.',
        '• Validade deve ser 2026 ou posterior (Hoje: 24.11.2026).',
        '• Compare o desenho do BRASÃO no passaporte com a aba [Brasões]!',
      ],
      wanted: [],
      unlockDiscrepancy: false,
      unlockXray: false,
      unlockUV: false,
      applicants: [
        {
          charId: 'char_1',
          name: 'Dimitri Volkov',
          sex: 'M',
          birth: '1981',
          kingdom: 'República de Vostok',
          city: 'Kievagrad',
          expiry: '12.2028',
          weightPass: 68,
          weightReal: 68,
          forgedSeal: false,
          speech: 'bom dia, inspetor. vim transferir arquivos ferroviários de Kievagrad, meus papéis estão em ordem.',
          replyApproved: 'muito obrigado, camarada! bom turno aí nesse frio.',
          replyDenied: 'como assim negado?! meus documentos de Vostok estão perfeitos!!',
          xrayDesc: 'Apenas chaves e uma marmita vazia.',
          xrayBad: false,
          valid: true,
          violationReason: 'Documentação de Dimitri estava 100% regular.',
        },
        {
          charId: 'char_2',
          name: 'Boris Kovalenko',
          sex: 'M',
          birth: '1974',
          kingdom: 'União de Karst',
          city: 'Ferrovelho',
          expiry: '04.2021', // VENCIDO!
          weightPass: 92,
          weightReal: 92,
          forgedSeal: false,
          speech: 'ô chefe, releva a data aí... cinco aninhos vencido na nevasca não faz mal a ninguém pô.',
          replyApproved: 'hehehe valeu pela vista grossa, meu consagrado! fui!',
          replyDenied: 'droga... sabia que iam implicar com esse documento de 2021. tô voltando.',
          xrayDesc: 'Nada ilegal.',
          xrayBad: false,
          valid: false,
          violationReason: 'Passaporte vencido (04.2021 < 2026).',
        },
        {
          charId: 'char_3',
          name: 'Elena Rostova',
          sex: 'F',
          birth: '1993',
          kingdom: 'Principado de Alvor',
          city: 'Monte Claro',
          expiry: '09.2028',
          weightPass: 56,
          weightReal: 56,
          forgedSeal: true, // BRASÃO SEM O SOL ACIMA DA COROA!
          speech: 'boa tarde querido, meu passaporte saiu novinho ontem lá em Monte Claro.',
          replyApproved: 'obrigada docinho, nem reparou no meu carimbo artesanal...',
          replyDenied: 'tsc! que olho miserável o seu... quase passou batido esse brasão.',
          xrayDesc: 'Caneta tinteiro usada pra falsificar brasão.',
          xrayBad: false,
          valid: false,
          violationReason: 'Brasão falsificado do Principado de Alvor (faltando o sol acima da coroa).',
          logReactAfter: 'caralho vc pegou o brasão sem o solzinho no olho clínico msm?! tem até falsificador profissa nessa fronteira kkkkk',
        },
        {
          charId: 'char_6',
          name: 'Irina Vasilyeva',
          sex: 'F',
          birth: '1962',
          kingdom: 'Costa de Salina',
          city: 'Farol Sul',
          expiry: '06.2029',
          weightPass: 60,
          weightReal: 60,
          forgedSeal: false,
          speech: 'boa noite meu jovem, vim trazer conservas de peixe lá de Farol Sul. tá tudo certinho.',
          replyApproved: 'deus te abençoe, meu filho! bom descanso.',
          replyDenied: 'mas por que me barrou?! o brasão de âncora e a data estão perfeitos!',
          xrayDesc: 'Latas de sardinha e agulhas de tricô.',
          xrayBad: false,
          valid: true,
          violationReason: 'Passaporte de Irina estava 100% dentro das regras.',
        },
      ],
    },
    {
      day: 2,
      codeTitle: 'DIA 2 — BALANÇA DIGITAL, DISCREPÂNCIAS & RAIO-X',
      bulletin:
        'BOLETIM OFICIAL Nº 02:\nContrabandistas estão tentando cruzar com explosivos ocultos sob o sobretudo.\nEQUIPAMENTOS LIBERADOS: [🔍 DISCREPÂNCIA] e [🩻 RAIO-X].\nSe o PESO no piso diferir em >3kg do Passaporte, ou a CIDADE não pertencer à Nação (veja aba Mapa), marque os 2 campos em [🔍 DISCREPÂNCIA] para INTERROGAR e DETER!',
      supervisorIntro:
        'KSHHH— Dia 2. Exija também o TICKET DE ENTRADA (2026). Achou divergência de peso ou cidade? Clique em [🔍 DISCREPÂNCIA] e aponte os dois campos conflitantes.',
      logIntro:
        'ligaram balança no chão e scanner de raio-x na guarita agora mano... fica esperto pra não deixar maluco entrar com bomba.',
      rules: [
        '• Regras do Dia 1 continuam valendo.',
        '• Obrigatório apresentar TICKET DE ENTRADA válido (2026).',
        '• Confira a aba [Mapa]: a Cidade deve pertencer à Nação do passaporte.',
        '• Se Peso LED ≠ Peso Passaporte (>3kg), use [🔍 Discrepância] → Raio-X → Negar/Deter!',
      ],
      wanted: [],
      unlockDiscrepancy: true,
      unlockXray: true,
      unlockUV: false,
      applicants: [
        {
          charId: 'char_2',
          name: 'Mikhail Orlov',
          sex: 'M',
          birth: '1980',
          kingdom: 'Costa de Salina',
          city: 'Baía Negra',
          expiry: '11.2029',
          weightPass: 88,
          weightReal: 89,
          forgedSeal: false,
          entryTicket: { code: 'TK-882', validYear: '2026', purpose: 'TRÂNSITO' },
          speech: 'trouxe o passaporte de Salina e o ticket novo que exigiram hoje no rádio.',
          replyApproved: 'valeu chefe, seguir viagem antes que congele a estrada.',
          replyDenied: 'ei!! tá tudo dentro da lei, você vai tomar multa por me barrar!',
          xrayDesc: 'Cinto de couro comum.',
          xrayBad: false,
          valid: true,
          violationReason: 'Mikhail estava totalmente regular.',
        },
        {
          charId: 'char_4',
          name: 'Viktor Lazarev',
          sex: 'M',
          birth: '1991',
          kingdom: 'União de Karst',
          city: 'Mina Funda',
          expiry: '08.2029',
          weightPass: 64,
          weightReal: 96, // +32 KG DE CONTRABANDO!!
          forgedSeal: false,
          entryTicket: { code: 'TK-904', validYear: '2026', purpose: 'COMÉRCIO' },
          bribe: 35,
          speech: 'é só meu sobretudo pesado de lã, inspetor... fica com esses 35 créditos pro seu café.',
          interrogateReply: 'CALMA, NÃO CHAMA OS GUARDAS! São só dinamites de mineração presas no colete!!',
          replyApproved: 'hehehe negócios são negócios, inspetor... ninguém viu nada.',
          replyDenied: 'ufa... pelo menos você só me mandou voltar e não chamou a guarda!',
          xrayDesc: '⚠️ CONTRABANDO GRAVE: 6 Bananas de Dinamite + Detonador presos ao tórax!',
          xrayBad: true,
          discrepancyType: 'weight',
          valid: false,
          canDetain: true,
          violationReason: 'Excesso de 32kg na balança com explosivos colados no corpo.',
          logReactAfter: 'o maluco tava com seis bananas de dinamite amarradas na costela mano kkkkkkk ainda tentou te comprar no cafézinho!',
        },
        {
          charId: 'char_1',
          name: 'Anton Petrov',
          sex: 'M',
          birth: '1995',
          kingdom: 'República de Vostok',
          city: 'Farol Sul', // FAROL SUL É DA COSTA DE SALINA, NÃO DE VOSTOK!
          expiry: '05.2028',
          weightPass: 71,
          weightReal: 71,
          forgedSeal: false,
          entryTicket: { code: 'TK-410', validYear: '2026', purpose: 'VISITA' },
          speech: 'sou nascido e criado em Farol Sul, orgulho da República de Vostok!',
          interrogateReply: 'Farol Sul fica na Costa de Salina?! Maldito despachante da estação, me vendeu papel errado!',
          replyApproved: 'passou batido! partiu cruzar o portão.',
          replyDenied: 'vou atrás daquele falsificador safado que imprimiu a cidade errada...',
          xrayDesc: 'Nenhum metal oculto.',
          xrayBad: false,
          discrepancyType: 'city',
          valid: false,
          violationReason: 'Cidade "Farol Sul" pertence à Costa de Salina, não à República de Vostok.',
        },
        {
          charId: 'char_3',
          name: 'Sofia Lind',
          sex: 'F',
          birth: '1996',
          kingdom: 'Principado de Alvor',
          city: 'Ponte Dourada',
          expiry: '10.2028',
          weightPass: 58,
          weightReal: 58,
          forgedSeal: false,
          entryTicket: { code: 'TK-109', validYear: '2024', purpose: 'VISITA' }, // TICKET DE ENTRADA VENCIDO!
          speech: 'passaporte na mão e o ticket azul na mesa! rapidinho que tá nevando muito!',
          replyApproved: 'hehehe nem olhou o ano pequenininho no ticket né? tchauzinho!',
          replyDenied: 'ah droga, vi agora que peguei o ticket velho de 2024 na bolsa...',
          xrayDesc: 'Cachecol extra e luvas.',
          xrayBad: false,
          valid: false,
          violationReason: 'Ticket de Entrada vencido (Ano Válido: 2024 < 2026).',
        },
      ],
    },
    {
      day: 3,
      codeTitle: 'DIA 3 — PROCURADOS NA PAREDE & IDENTIDADE ROUBADA',
      bulletin:
        'BOLETIM OFICIAL Nº 03:\nDois criminosos foragidos escaparam hoje cedo — confira os ROSTOS no cartaz colado na janela!\nAlém disso, quem vier a TRABALHO deve portar PERMISSÃO DE TRABALHO com NOME IDÊNTICO ao Passaporte.',
      supervisorIntro:
        'KSHHH— Dia 3. Fixamos o Cartaz de Procurados no vidro. Compare sempre o rosto real na janela com a foto do passaporte e com o cartaz. Se for fugitivo, DETENHA.',
      logIntro:
        'colaram cartaz de procurado na janela igual filme policial antigo... olha bem pra cara do sujeito antes de bater o carimbo verde hein.',
      rules: [
        '• Regras anteriores continuam valendo.',
        '• Compare o ROSTO na janela com o Cartaz de PROCURADOS e com a FOTO do passaporte!',
        '• Se o Ticket indicar "TRABALHO", exija PERMISSÃO DE TRABALHO com nome idêntico.',
      ],
      wanted: [
        { name: 'Ígor Navalha', charId: 'char_5' },
        { name: 'Marta Krol', charId: 'char_6' },
      ],
      unlockDiscrepancy: true,
      unlockXray: true,
      unlockUV: false,
      applicants: [
        {
          charId: 'char_2',
          name: 'Pavel Morozov',
          sex: 'M',
          birth: '1968',
          kingdom: 'Principado de Alvor',
          city: 'Vila Real',
          expiry: '12.2030',
          weightPass: 74,
          weightReal: 74,
          forgedSeal: false,
          entryTicket: { code: 'TK-512', validYear: '2026', purpose: 'TRABALHO' },
          workPermit: { holder: 'Pavel Morozov', role: 'Relojoeiro', until: '2028' },
          speech: 'trouxe passaporte, ticket e permissão de relojoeiro. tudo certinho.',
          replyApproved: 'agradecido, inspetor! até a volta.',
          replyDenied: 'mas minha permissão de trabalho está impecável!! que absurdo!',
          xrayDesc: 'Lupa e engrenagens pequenas de relógio.',
          xrayBad: false,
          valid: true,
          violationReason: 'Todos os 3 documentos de Pavel estavam corretos.',
        },
        {
          charId: 'char_5', // Na janela é o procurado Ígor Navalha (char_5), mas a foto do passaporte roubado é char_1!
          photoCharId: 'char_1',
          name: 'Roman Belov',
          sex: 'M',
          birth: '1985',
          kingdom: 'Costa de Salina',
          city: 'Doca Velha',
          expiry: '10.2028',
          weightPass: 82,
          weightReal: 82,
          forgedSeal: false,
          entryTicket: { code: 'TK-619', validYear: '2026', purpose: 'TRÂNSITO' },
          speech: 'raspei o cabelo e peguei essa cicatriz na doca ontem, chefe... sou o Roman da foto sim.',
          interrogateReply: 'Maldito cartaz na janela!! Abre essa grade logo senão vai ter confusão!!',
          replyApproved: 'otário demais kkkkk passei com documento roubado na cara dura.',
          replyDenied: 'tsc... deu sorte que eu não puxei a faca aqui mesmo.',
          xrayDesc: '⚠️ Lâmina serrilhada escondida na manga!',
          xrayBad: true,
          discrepancyType: 'face',
          valid: false,
          canDetain: true,
          violationReason: 'Fugitivo procurado (Ígor Navalha) usando passaporte roubado de Roman Belov!',
        },
        {
          charId: 'char_3',
          name: 'Natasha Sokolova',
          sex: 'F',
          birth: '1990',
          kingdom: 'República de Vostok',
          city: 'Porto Gelo',
          expiry: '07.2029',
          weightPass: 61,
          weightReal: 61,
          forgedSeal: false,
          entryTicket: { code: 'TK-701', validYear: '2026', purpose: 'TRABALHO' },
          workPermit: { holder: 'Nadia Sokolova', role: 'Engenheira', until: '2027' }, // NOME DIFERENTE!
          speech: 'o escrivão trocou Natasha por Nadia na minha permissão, mas releva por favorzinho...',
          interrogateReply: 'Tá bom, peguei a permissão da minha irmã emprestada porque a minha atrasou!',
          replyApproved: 'ufa, salvou meu emprego! obrigada!',
          replyDenied: 'poxa vida... perder viagem inteira por causa de um nome trocado.',
          xrayDesc: 'Bolsa comum sem contrabando.',
          xrayBad: false,
          discrepancyType: 'name',
          valid: false,
          violationReason: 'Divergência de nome: "Natasha Sokolova" vs "Nadia Sokolova" na Permissão.',
        },
        {
          charId: 'char_7',
          name: 'Arthur Krol',
          sex: 'M',
          birth: '1972',
          kingdom: 'União de Karst',
          city: 'Mina Funda',
          expiry: '09.2029',
          weightPass: 83,
          weightReal: 83,
          forgedSeal: true, // BRASÃO DE KARST SEM A CRUZ INTERNA!
          entryTicket: { code: 'TK-755', validYear: '2026', purpose: 'COMÉRCIO' },
          speech: 'sou empresário de Mina Funda, meus papéis estão impecáveis. despacha logo isso!',
          replyApproved: 'assim que eu gosto, rapidez sem perguntas inúteis.',
          replyDenied: 'maldição! o gravador esqueceu a cruz dentro do losango de Karst!',
          xrayDesc: 'Charutos e relógio de bolso.',
          xrayBad: false,
          valid: false,
          violationReason: 'Brasão falsificado da União de Karst (losango vazio sem a cruz central).',
        },
      ],
    },
    {
      day: 4,
      codeTitle: 'DIA 4 — QUARENTENA SANITÁRIA & O DIPLOMATA',
      bulletin:
        'BOLETIM OFICIAL Nº 04:\nDevido ao surto de febre cinza na União de Karst e na Costa de Salina, viajantes dessas DUAS nações exigem CERTIFICADO DE VACINAÇÃO em dia (2026).\nAtenção a malas diplomáticas blindadas no Raio-X.',
      supervisorIntro:
        'KSHHH— Dia 4. Exija o cartão amarelo de vacina para qualquer um vindo da União de Karst ou Costa de Salina.',
      logIntro:
        'quatro dias trancado nessa guarita... fica de olho no raio-x hoje mano, vai que algum diplomata tá carregando segredo escondido na mala.',
      rules: [
        '• Regras anteriores continuam valendo.',
        '• Viajantes da UNIÃO DE KARST ou COSTA DE SALINA devem ter CERTIFICADO DE VACINA (2026).',
        '• Sempre passe o Raio-X em bagagens diplomáticas ou suspeitas!',
      ],
      wanted: [
        { name: 'Marta Krol', charId: 'char_6' },
      ],
      unlockDiscrepancy: true,
      unlockXray: true,
      unlockUV: false,
      applicants: [
        {
          charId: 'char_3',
          name: 'Olga Dragan',
          sex: 'F',
          birth: '1988',
          kingdom: 'União de Karst',
          city: 'Cinza Alta',
          expiry: '03.2028',
          weightPass: 64,
          weightReal: 64,
          forgedSeal: false,
          entryTicket: { code: 'TK-811', validYear: '2026', purpose: 'VISITA' },
          vaccineCert: { status: 'VENCIDA (2022)', batch: 'LT-09' }, // VACINA VENCIDA!
          speech: 'trouxe até o cartãozinho amarelo de vacina ó! pode bater o carimbo verde.',
          replyApproved: 'cof cof... obrigada moço, juro que é só um resfriadinho.',
          replyDenied: 'ah não, só porque a vacina venceu em 2022?! que burocracia infernal!',
          xrayDesc: 'Frascos de xarope na bolsa.',
          xrayBad: false,
          valid: false,
          violationReason: 'Certificado de Vacinação vencido (2022) vindo da União de Karst.',
        },
        {
          charId: 'char_4',
          name: 'Diplomata K.',
          sex: 'M',
          birth: '1978',
          kingdom: 'Principado de Alvor',
          city: 'Ponte Dourada',
          expiry: '11.2030',
          weightPass: 75,
          weightReal: 75,
          forgedSeal: false,
          entryTicket: { code: 'TK-004', validYear: '2026', purpose: 'DIPLOMÁTICO' },
          speech: 'psiu. meus documentos diplomáticos tão limpos... mas passa o Raio-X na minha pasta antes de carimbar. guardei uma placa de chumbo pra vc.',
          replyApproved: 'guarde bem esses números binários. amanhã o segundo mensageiro trará a chave.',
          replyDenied: 'você acabou de barrar um diplomata legítimo com imunidade, seu tolo!',
          xrayDesc: '📄 PLACA DE CHUMBO NA PASTA (PARTE 1/2):\n01001101  01010101  01010010  01001111',
          xrayBad: false,
          isLoreSecret1: true,
          valid: true,
          violationReason: 'Diplomata K. possuía documentação diplomática 100% válida.',
        },
        {
          charId: 'char_1',
          name: 'Hugo Varga',
          sex: 'M',
          birth: '1976',
          kingdom: 'Costa de Salina',
          city: 'Baía Negra',
          expiry: '06.2029',
          weightPass: 79,
          weightReal: 79,
          forgedSeal: false,
          entryTicket: { code: 'TK-899', validYear: '2026', purpose: 'COMÉRCIO' },
          vaccineCert: { status: 'IMUNIZADO (2026)', batch: 'LT-94' },
          speech: 'vim da Costa de Salina mas tomei o lote de 2026 semana passada, tudo certinho.',
          replyApproved: 'excelente trabalho, inspetor. tenha uma ótima noite!',
          replyDenied: 'ei! minha vacina é de 2026! olha direito antes de carimbar vermelho!',
          xrayDesc: 'Bússola marítima e notas fiscais.',
          xrayBad: false,
          valid: true,
          violationReason: 'Documentação e vacina de Hugo estavam em dia.',
        },
        {
          charId: 'char_2',
          name: 'Yuri Galkin',
          sex: 'M',
          birth: '1983',
          kingdom: 'Costa de Salina',
          city: 'Doca Velha',
          expiry: '11.2028',
          weightPass: 86,
          weightReal: 86,
          forgedSeal: false,
          entryTicket: { code: 'TK-912', validYear: '2026', purpose: 'TRÂNSITO' },
          // SEM CERTIFICADO DE VACINAÇÃO! (E veio da Costa de Salina em quarentena!)
          speech: 'vim direto de Doca Velha na Costa de Salina! saúde de ferro, nunca peguei nem gripe!',
          replyApproved: 'passei sem o cartão amarelo de vacina kkkkk valeu irmão!',
          replyDenied: 'esqueci o maldito comprovante de vacina no navio... volto amanhã.',
          xrayDesc: 'Garrafa térmica com chá quente.',
          xrayBad: false,
          valid: false,
          violationReason: 'Viajante da Costa de Salina sem Certificado de Vacinação obrigatório.',
        },
      ],
    },
    {
      day: 5,
      codeTitle: 'DIA 5 — AUDITORIA FINAL, LUZ NEGRA UV & O EMISSÁRIO FANTASMA',
      bulletin:
        'BOLETIM OFICIAL Nº 05 (ÚLTIMO TURNO):\nFalsificadores estão imprimindo passaportes idênticos aos originais!\nNOVO EQUIPAMENTO: [🟣 LANTERNA UV]. Ligue a luz negra sobre a mesa: todo passaporte real revela "AUTÊNTICO // CHANCELARIA". Se aparecer "CLONE FALSO", NEGUE ou DETENHA!',
      supervisorIntro:
        'KSHHH— Último turno da auditoria, Inspetor. Acenda a [🟣 LANTERNA UV] em TODOS os passaportes hoje.',
      logIntro:
        'último dia nessa guarita congelada mano!! usa essa luz roxa aí nos papéis pra ninguém te passar a perna na reta final, vamo pegar logo esse livro e cair fora!',
      rules: [
        '• Todas as regras anteriores continuam valendo!',
        '• OBRIGATÓRIO ligar a [🟣 Lanterna UV]: passaportes reais brilham "AUTÊNTICO // CHANCELARIA". Se brilhar "CLONE FALSO", é fraude!',
      ],
      wanted: [
        { name: 'Marta Krol', charId: 'char_6' },
      ],
      unlockDiscrepancy: true,
      unlockXray: true,
      unlockUV: true,
      applicants: [
        {
          charId: 'char_7',
          name: 'Comissário Vagner',
          sex: 'M',
          birth: '1970',
          kingdom: 'República de Vostok',
          city: 'Usina Sete',
          expiry: '12.2030',
          weightPass: 84,
          weightReal: 84,
          forgedSeal: false,
          uvText: '⚠️ CLONE FALSO // SEM REGISTRO', // PEGO SÓ NA LUZ UV!!
          entryTicket: { code: 'TK-999', validYear: '2026', purpose: 'AUDITORIA' },
          bribe: 80,
          speech: 'sou o Comissário Regional! nem precisa ligar essa lanterninha roxa em mim... toma 80 créditos de gratificação e bate o verde logo!',
          interrogateReply: 'Apaga essa luz roxa seu insolente!! Quer arruinar meu esquema na fronteira?!',
          replyApproved: 'hahaha sabia que todo inspetor tem seu preço. bom garoto.',
          replyDenied: 'maldito rato de guarita... você ainda vai ouvir falar de mim!',
          xrayDesc: 'Maleta cheia de matrizes falsas de passaporte.',
          xrayBad: true,
          valid: false,
          canDetain: true,
          violationReason: 'Passaporte clonado revelado na Luz Negra UV ("CLONE FALSO") + tentativa de suborno!',
          logReactAfter: 'KKKKKKK o próprio comissário era falsificado na luz negra!! se vc cai no papinho dele já era!',
        },
        {
          charId: 'char_6', // Procurada Marta Krol tentando passar com nome falso!
          name: 'Clara Mendonça',
          sex: 'F',
          birth: '1964',
          kingdom: 'Principado de Alvor',
          city: 'Vila Real',
          expiry: '08.2028',
          weightPass: 60,
          weightReal: 60,
          forgedSeal: true,
          uvText: '⚠️ DOCUMENTO ADULTERADO',
          entryTicket: { code: 'TK-940', validYear: '2026', purpose: 'TRÂNSITO' },
          speech: 'só uma senhora tranquila indo visitar os sobrinhos em Vila Real, meu jovem...',
          interrogateReply: 'Droga, esqueci que meu retrato ainda estava pregado nesse vidro maldito!',
          replyApproved: 'que rapaz gentil... adeusinho!',
          replyDenied: 'quase consegui cruzar... maldita fiscalização!',
          xrayDesc: 'Gazuas escondidas na gola do casaco.',
          xrayBad: false,
          discrepancyType: 'face',
          valid: false,
          canDetain: true,
          violationReason: 'Fugitiva procurada (Marta Krol) + brasão e UV adulterados.',
        },
        {
          charId: 'char_1',
          name: 'Leonid Kirov',
          sex: 'M',
          birth: '1989',
          kingdom: 'República de Vostok',
          city: 'Kievagrad',
          expiry: '07.2030',
          weightPass: 70,
          weightReal: 70,
          forgedSeal: false,
          uvText: '✦ AUTÊNTICO // CHANCELARIA',
          entryTicket: { code: 'TK-961', validYear: '2026', purpose: 'TRABALHO' },
          workPermit: { holder: 'Leonid Kirov', role: 'Telegrafista', until: '2029' },
          speech: 'pode bater a luz roxa, conferir o ticket e a permissão de telegrafista. tudo limpo!',
          replyApproved: 'muito obrigado, inspetor! bom final de expediente.',
          replyDenied: 'mas até na luz negra meu passaporte brilhou autêntico!! por que me negou?!',
          xrayDesc: 'Rolo de fio de cobre e alicate.',
          xrayBad: false,
          valid: true,
          violationReason: 'Documentação e selo UV de Leonid Kirov estavam 100% regulares.',
        },
        {
          charId: 'char_8',
          name: 'Emissário Fantasma',
          sex: '?',
          birth: '1929',
          kingdom: 'União de Karst',
          city: 'Cinza Alta',
          expiry: '12.2035',
          weightPass: 72,
          weightReal: 72,
          forgedSeal: false,
          uvText: 'AUTÊNTICO // CÉSAR +3 → EHUOLP', // PARTE 2 DO ENIGMA NA LUZ UV!!
          entryTicket: { code: 'TK-000', validYear: '2026', purpose: 'CHANCELARIA' },
          vaccineCert: { status: 'IMUNIZADO (2026)', batch: 'LT-00' },
          speech: '...acende a luz roxa no meu passaporte. junta com a placa de chumbo do Diplomata de ontem... e abre o portão.',
          replyApproved: '...o muro sempre cai quando alguém erra o discurso. boa sorte com o livro, inspetor.',
          replyDenied: '...sem a minha passagem, a fronteira nunca termina.',
          xrayDesc: '🔐 RAIO-X E LUZ UV CONFIRMAM: CÉSAR +3 → EHUOLP (Chancelaria Diplomática autêntica!)',
          xrayBad: false,
          isLoreSecret2: true,
          valid: true,
          violationReason: 'O Emissário possuía salvo-conduto e vacina autênticos da Chancelaria.',
        },
      ],
    },
  ];

  // ---- ESTADO DO JOGO ----
  let dayIdx = 0;
  let appIdx = -1;
  let credits = 30;
  let citationsToday = 0;
  let totalApprovedToday = 0;
  let totalDetainedToday = 0;

  let travelerState = 'waiting_call'; // 'waiting_call' | 'present' | 'stamped' | 'transitioning'
  let currentStamp = null; // 'approved' | 'denied' | null
  let stampBarOpen = false;
  let inspectMode = false;
  let selectedDiscFields = [];
  let discrepancyVerified = false;
  let canDetainNow = false;
  let uvOn = false;
  let activeRuleTab = 'rules';
  let capturedClue1 = false;
  let capturedClue2 = false;
  let topZ = 15;

  // ---- MONTAGEM DO HUB COMPLETO ----
  app.innerHTML = `
    <div class="story-shell pp-shell">
      <div class="operator-feed story-main-log">
        <span class="operator-tag">log</span>
        <span id="operator-msg"></span>
      </div>

      <div class="pp-topbar">
        <button type="button" class="story-back-btn" id="pp-back-cave">← Voltar para a Caverna</button>
        <div class="pp-status-pills">
          <div class="pp-pill" id="pp-hud-day">DIA 1 / 5</div>
          <div class="pp-pill" id="pp-hud-queue">FILA LÁ FORA: 4</div>
          <div class="pp-pill gold" id="pp-hud-credits">💰 30 CR</div>
          <div class="pp-pill warn" id="pp-hud-citations">⚠️ MULTAS HOJE: 0 / 3</div>
        </div>
      </div>

      <div class="pp-booth-grid" id="pp-booth-grid">
        <!-- ESQUERDA: FILA + JANELA DA CABINE + BOTÕES TÁTICOS + MANUAL -->
        <div class="pp-left-col">
          <div class="pp-queue-strip" id="pp-ext-scene">
            <div class="pp-ext-fence"></div>
            <div class="pp-ext-walkway"></div>
            <div class="pp-ext-snow"></div>

            <!-- Alto-falante na cerca que treme e solta ondas sonoras ao chamar! -->
            <div class="pp-ext-megaphone-pole" id="pp-ext-horn">📢</div>

            <!-- Catraca / Portão antes da cabine -->
            <div class="pp-ext-gate" id="pp-ext-gate"></div>

            <!-- A CABINE / GUARITA DE INSPEÇÃO ONDE OS BONEQUINHOS ENTRAM! -->
            <div class="pp-ext-booth" id="pp-ext-booth">
              <div class="pp-ext-booth-lamp"></div>
              <div class="pp-ext-booth-win"></div>
              <div class="pp-ext-booth-door"></div>
            </div>

            <!-- Guardas de prontidão na saída -->
            <div class="pp-ext-guard" style="left:252px;" title="Guarda da Fronteira"></div>
            <div class="pp-ext-guard" style="left:268px;" title="Guarda da Fronteira"></div>

            <!-- Bonequinhos vivos na fila e entrando/saindo da cabine -->
            <div id="pp-ext-walkers-layer"></div>

            <button type="button" class="pp-megaphone-btn pulse-call" id="pp-next-btn">📢 PRÓXIMO!</button>
          </div>

          <div class="pp-booth-window" id="pp-window">
            <div class="pp-window-bars"></div>
            <div id="pp-wanted-mount"></div>
            <div class="pp-speech-bubble" id="pp-speech" style="display:none;"></div>
            <div id="pp-returned-badge-mount"></div>

            <div class="pp-traveler-stage" id="pp-traveler-stage"></div>

            <div class="pp-xray-screen" id="pp-xray-screen">
              <div style="font-size:11px; letter-spacing:1px; margin-bottom:6px; color:#6ee7b7;">[ SCANNER CORPORAL // RAIO-X ]</div>
              <div id="pp-xray-text" style="font-size:12.5px; line-height:1.45; font-weight:bold; white-space:pre-line;"></div>
              <button type="button" id="pp-xray-close" style="margin-top:10px; background:#064e3b; color:#ecfdf5; border:1px solid #34d399; padding:4px 10px; font-family:inherit; font-size:11px; cursor:inherit;">Fechar Scanner</button>
            </div>

            <div class="pp-shutter" id="pp-shutter">POSTO 04 // FECHADO</div>
          </div>

          <div class="pp-counter-leds">
            <div class="pp-led-box pp-field" data-disc-key="today_date" title="Data Oficial no Relógio da Cabine">
              <span style="opacity:0.7; font-size:10px;">DATA:</span>
              <span>${CURRENT_DATE_STR}</span>
            </div>
            <div class="pp-led-box pp-field" id="pp-led-weight" data-disc-key="real_weight" title="Balança do Piso da Cabine">
              <span style="opacity:0.7; font-size:10px;">PESO:</span>
              <span id="pp-weight-val">-- KG</span>
            </div>
          </div>

          <div class="pp-booth-tools" id="pp-tools-bar">
            <button type="button" class="pp-tool-btn" id="pp-btn-disc" disabled>🔍 DISCREPÂNCIA</button>
            <button type="button" class="pp-tool-btn" id="pp-btn-xray" disabled>🩻 RAIO-X</button>
            <button type="button" class="pp-tool-btn" id="pp-btn-uv" style="display:none;">🟣 LANTERNA UV</button>
            <button type="button" class="pp-tool-btn" id="pp-btn-interrogate" style="display:none; background:#7c2d12; color:#ffedd5;">🎙️ INTERROGAR</button>
            <button type="button" class="pp-tool-btn detain-btn" id="pp-btn-detain" style="display:none;">🚨 DETER VIAJANTE (GUARDAS!)</button>
          </div>

          <div class="pp-rulebook">
            <div class="pp-rulebook-tabs">
              <button type="button" class="pp-rb-tab active" data-rbtab="rules">📜 Regras</button>
              <button type="button" class="pp-rb-tab" data-rbtab="map">🗺️ Mapa</button>
              <button type="button" class="pp-rb-tab" data-rbtab="seals">🛡️ Brasões</button>
              <button type="button" class="pp-rb-tab" data-rbtab="notes">🔐 Notas</button>
            </div>
            <div class="pp-rulebook-content" id="pp-rb-body"></div>
          </div>
        </div>

        <!-- DIREITA: MESA GRANDE DE MADEIRA + DOCUMENTOS ARRASTÁVEIS + CARIMBOS -->
        <div class="pp-desk-surface" id="pp-desk">
          <div class="pp-drop-slot">
            <span>🪟 FRESTA DE DEVOLUÇÃO:</span>
            <button type="button" class="pp-give-btn" id="pp-give-btn" disabled>Entregar Passaporte Carimbado ↩</button>
          </div>

          <div id="pp-docs-layer"></div>

          <!-- Gaveta lateral deslizante dos 2 Carimbos Pesados (Alça horizontal 100% nítida!) -->
          <div class="pp-stamp-bar" id="pp-stamp-bar">
            <button type="button" class="pp-stamp-tab" id="pp-stamp-toggle">◀ CARIMBOS</button>
            <div class="pp-stamp-body">
              <button type="button" class="pp-heavy-stamp green" id="pp-stamp-approve" disabled>
                <span style="font-size:19px;">✔</span>
                <span>APROVAR</span>
              </button>
              <button type="button" class="pp-heavy-stamp red" id="pp-stamp-deny" disabled>
                <span style="font-size:19px;">✖</span>
                <span>NEGAR</span>
              </button>
            </div>
          </div>

          <div id="pp-citation-mount"></div>
        </div>

        <!-- Overlay de Boletim Matinal / Contas da Noite -->
        <div id="pp-overlay-mount"></div>
      </div>

      <div class="story-npc-feed story-log-sepia">
        <span class="story-npc-tag">supervisor</span>
        <span id="story-npc-msg"></span>
      </div>
    </div>
  `;

  // ---- SISTEMA SINCRONIZADO DE VOZES ----
  let intercomSeq = 0;
  let isAlive = true;

  async function saySupervisor(text) {
    const mySeq = ++intercomSeq;
    const el = document.getElementById('story-npc-msg');
    if (!el) return;
    el.textContent = '';
    for (let i = 0; i < text.length; i++) {
      if (!isAlive || mySeq !== intercomSeq) return;
      el.textContent += text[i];
      if (i % 2 === 0 && text[i] !== ' ') playIntercomTick();
      await new Promise((r) => setTimeout(r, 16));
    }
  }

  async function supervisorThenLog(supText, logText = null, logPriority = 'action') {
    const expected = intercomSeq + 1;
    await saySupervisor(supText);
    if (!isAlive || expected !== intercomSeq || !logText) return;
    await new Promise((r) => setTimeout(r, 700));
    if (!isAlive || expected !== intercomSeq) return;
    setOperatorRemark(logText, { priority: logPriority });
  }

  document.getElementById('pp-back-cave')?.addEventListener('click', () => {
    isAlive = false;
    intercomSeq++;
    returnToCave(caveState);
  });

  // ---- ARRASTAR DOCUMENTOS ----
  function makeDraggable(el) {
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let origLeft = 0;
    let origTop = 0;

    el.addEventListener('pointerdown', (e) => {
      if (inspectMode && e.target.closest('.pp-field')) return;
      if (e.target.closest('button')) return;
      dragging = true;
      el.style.zIndex = String(++topZ);
      startX = e.clientX;
      startY = e.clientY;
      origLeft = parseFloat(el.style.left) || 0;
      origTop = parseFloat(el.style.top) || 0;
      el.setPointerCapture(e.pointerId);
      playPaperSlide();
    });

    el.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const desk = document.getElementById('pp-desk');
      if (!desk) return;
      const maxX = Math.max(40, desk.clientWidth - el.offsetWidth - 10);
      const maxY = Math.max(40, desk.clientHeight - el.offsetHeight - 10);
      const nx = Math.max(6, Math.min(maxX, origLeft + (e.clientX - startX)));
      const ny = Math.max(48, Math.min(maxY, origTop + (e.clientY - startY)));
      el.style.left = `${nx}px`;
      el.style.top = `${ny}px`;
    });

    el.addEventListener('pointerup', () => {
      dragging = false;
    });
  }

  // ---- RENDERIZAÇÃO DO MANUAL (Zero barra de rolagem na aba Brasões!) ----
  function renderRulebook() {
    const body = document.getElementById('pp-rb-body');
    if (!body) return;
    const dayObj = DAYS[dayIdx];

    app.querySelectorAll('.pp-rb-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-rbtab') === activeRuleTab);
    });

    body.classList.toggle('no-scroll', activeRuleTab === 'seals');

    if (activeRuleTab === 'rules') {
      body.innerHTML = `
        <div style="font-weight:bold; margin-bottom:5px; border-bottom:1px solid #8c6d46;">DIRETRIZES — DIA ${dayObj.day}</div>
        ${dayObj.rules.map((r) => `<div style="margin-bottom:4px;">${r}</div>`).join('')}
      `;
    } else if (activeRuleTab === 'map') {
      body.innerHTML = `
        <div class="pp-field" data-disc-key="rulebook_map" style="font-weight:bold; margin-bottom:6px; border-bottom:1px solid #8c6d46;">
          AS 4 NAÇÕES & SUAS CIDADES (Clique na Discrepância)
        </div>
        ${Object.entries(KINGDOMS)
          .map(([k, info]) => `<div style="margin-bottom:5px;"><strong>${k}:</strong><br/><span style="opacity:0.9;">${info.cities.join(' • ')}</span></div>`)
          .join('')}
      `;
    } else if (activeRuleTab === 'seals') {
      body.innerHTML = `
        <div style="font-weight:bold; margin-bottom:6px; border-bottom:1px solid #8c6d46;">BRASÕES OFICIAIS DAS 4 NAÇÕES</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:7px;">
          ${Object.entries(KINGDOMS)
            .map(
              ([k]) => `
            <div style="display:flex; align-items:center; gap:8px; background:#dfd0b4; padding:6px 7px; border:1px solid #8c6d46; border-radius:2px;">
              ${renderSealSvg(k, false, 34)}
              <span style="font-size:10.5px; font-weight:bold; line-height:1.2;">${k}</span>
            </div>
          `
            )
            .join('')}
        </div>
      `;
    } else {
      body.innerHTML = `
        <div style="font-weight:bold; margin-bottom:5px; border-bottom:1px solid #8c6d46;">ANOTAÇÕES INTERCEPTADAS</div>
        <div style="margin-bottom:6px;">
          <strong>Parte 1 (Dia 4 - Raio-X):</strong><br/>
          ${capturedClue1 ? `<code style="color:#7c2d12; font-weight:bold;">01001101 01010101 01010010 01001111</code>` : '<em>Ainda não encontrada.</em>'}
        </div>
        <div>
          <strong>Parte 2 (Dia 5 - Luz UV):</strong><br/>
          ${capturedClue2 ? `<code style="color:#581c87; font-weight:bold;">CÉSAR +3 → EHUOLP</code>` : '<em>Ainda não encontrada.</em>'}
        </div>
      `;
    }

    bindDiscrepancyClicks();
  }

  app.querySelectorAll('.pp-rb-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      playBeep();
      activeRuleTab = btn.getAttribute('data-rbtab');
      renderRulebook();
    });
  });

  // ---- MINI-CENA EXTERNA: FILA DE BONEQUINHOS CAMINHANDO E ENTRANDO NA CABINE! ----
  function getCoatColorForPerson(p) {
    const map = {
      char_1: '#2b3a4a',
      char_2: '#4a3d2b',
      char_3: '#6b2130',
      char_4: '#1e293b',
      char_5: '#522522',
      char_6: '#364a2e',
      char_7: '#5c1919',
      char_8: '#111115',
    };
    return map[p?.charId] || '#2b3336';
  }

  function renderWaitingWalkers() {
    const layer = document.getElementById('pp-ext-walkers-layer');
    if (!layer) return;
    const dayObj = DAYS[dayIdx];
    const startIdx = appIdx + 1;
    const waitingList = dayObj.applicants.slice(startIdx);

    // Fila parada antes da catraca (x=134 pra trás: 134, 108, 82, 56...)
    layer.innerHTML = waitingList
      .map((p, idx) => {
        const leftPx = Math.max(8, 134 - idx * 24);
        const coat = getCoatColorForPerson(p);
        return `
          <div class="pp-mini-walker" data-q-idx="${idx}" style="left:${leftPx}px;">
            <div class="pp-mini-walker-head"></div>
            <div class="pp-mini-walker-body" style="background:${coat};"></div>
            <div class="pp-mini-walker-legs"></div>
          </div>
        `;
      })
      .join('');
  }

  function triggerMegaphoneVisualWaves() {
    const scene = document.getElementById('pp-ext-scene');
    const horn = document.getElementById('pp-ext-horn');
    if (horn) {
      horn.classList.remove('ringing');
      void horn.offsetWidth;
      horn.classList.add('ringing');
    }
    if (scene) {
      [0, 190, 380].forEach((delay) => {
        setTimeout(() => {
          if (!isAlive) return;
          const ring = document.createElement('div');
          ring.className = 'pp-sound-ring';
          scene.appendChild(ring);
          setTimeout(() => ring.remove(), 700);
        }, delay);
      });
    }
  }

  // Anima o 1º boneco da fila passando pela catraca e ENTRANDO na porta da cabine, enquanto os de trás avançam!
  async function animateMiniWalkerEnteringBooth(person) {
    const layer = document.getElementById('pp-ext-walkers-layer');
    const gate = document.getElementById('pp-ext-gate');
    const booth = document.getElementById('pp-ext-booth');
    if (!layer) return;

    booth?.classList.add('calling');
    playGateBuzzSound();
    gate?.classList.add('open');

    const firstWalker = layer.querySelector('.pp-mini-walker[data-q-idx="0"]');
    const otherWalkers = layer.querySelectorAll('.pp-mini-walker:not([data-q-idx="0"])');

    playFootsteps(5, 125);

    if (firstWalker) {
      firstWalker.classList.add('walking');
      firstWalker.style.left = '214px'; // caminha exatamente até a portinha escura da cabine!
    }

    // Os de trás na fila dão um passo pra frente ocupando a vaga!
    otherWalkers.forEach((w) => {
      const idx = Number(w.getAttribute('data-q-idx'));
      w.classList.add('walking');
      w.style.left = `${Math.max(8, 134 - (idx - 1) * 24)}px`;
    });

    await new Promise((r) => setTimeout(r, 660));

    // O bonequinho entra pela porta da cabine (some na porta e acende a janela amarela com a sombra dele lá dentro!)
    if (firstWalker) {
      firstWalker.style.opacity = '0';
      firstWalker.style.transform = 'scale(0.6)';
    }
    otherWalkers.forEach((w) => w.classList.remove('walking'));
    gate?.classList.remove('open');
    booth?.classList.remove('calling');
    booth?.classList.add('occupied');

    await new Promise((r) => setTimeout(r, 180));
    renderWaitingWalkers();
  }

  // Anima o bonequinho SAINDO da cabine no fim do atendimento (direita se aprovado, esquerda se negado, ou escoltado pelos guardas!)
  function animateMiniWalkerExitingBooth(person, decision) {
    const scene = document.getElementById('pp-ext-scene');
    const booth = document.getElementById('pp-ext-booth');
    booth?.classList.remove('occupied', 'calling');
    if (!scene) return;

    const walker = document.createElement('div');
    walker.className = 'pp-mini-walker walking';
    walker.style.left = '214px';
    walker.innerHTML = `
      <div class="pp-mini-walker-head"></div>
      <div class="pp-mini-walker-body" style="background:${getCoatColorForPerson(person)};"></div>
      <div class="pp-mini-walker-legs"></div>
    `;
    scene.appendChild(walker);

    playFootsteps(4, 130);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (decision === 'approved') {
          walker.style.left = '395px'; // cruza a fronteira pra direita!
        } else if (decision === 'detained') {
          walker.style.left = '262px'; // levado até os 2 guardas!
          setTimeout(() => { walker.style.opacity = '0'; }, 480);
        } else {
          walker.style.left = '-24px'; // volta cabisbaixo pra esquerda!
        }
      });
    });

    setTimeout(() => walker.remove(), 780);
  }

  // ---- ATUALIZA HUD, FILA E FERRAMENTAS ----
  function updateHudAndQueue() {
    const dayObj = DAYS[dayIdx];
    const totalInDay = dayObj.applicants.length;
    const waitingOutside = Math.max(0, totalInDay - (appIdx + 1));

    document.getElementById('pp-hud-day').textContent = `DIA ${dayObj.day} / 5`;
    document.getElementById('pp-hud-queue').textContent =
      travelerState === 'waiting_call'
        ? `FILA LÁ FORA: ${waitingOutside}`
        : `ATENDENDO ${appIdx + 1}/${totalInDay} (FILA: ${waitingOutside})`;
    document.getElementById('pp-hud-credits').textContent = `💰 ${credits} CR`;
    document.getElementById('pp-hud-citations').textContent = `⚠️ MULTAS HOJE: ${citationsToday} / 3`;

    if (travelerState === 'waiting_call') {
      renderWaitingWalkers();
    }

    // Cartaz de Procurados (Dia 3+)
    const wantedMount = document.getElementById('pp-wanted-mount');
    if (wantedMount) {
      if (dayObj.wanted && dayObj.wanted.length > 0) {
        wantedMount.innerHTML = `
          <div class="pp-wanted-strip pp-field" data-disc-key="wanted_poster" title="Cartaz Oficial de Procurados">
            <div class="pp-wanted-strip-title">PROCURADOS</div>
            <div class="pp-wanted-faces">
              ${dayObj.wanted.map((w) => `<div title="${w.name}">${renderCharacterArt(w.charId, 'normal', 0.28)}</div>`).join('')}
            </div>
          </div>
        `;
      } else {
        wantedMount.innerHTML = '';
      }
    }

    const btnDisc = document.getElementById('pp-btn-disc');
    const btnXray = document.getElementById('pp-btn-xray');
    const btnUv = document.getElementById('pp-btn-uv');
    const btnInter = document.getElementById('pp-btn-interrogate');
    const btnDetain = document.getElementById('pp-btn-detain');
    const nextBtn = document.getElementById('pp-next-btn');
    const giveBtn = document.getElementById('pp-give-btn');
    const stApp = document.getElementById('pp-stamp-approve');
    const stDen = document.getElementById('pp-stamp-deny');

    const hasActivePerson = travelerState === 'present' || travelerState === 'stamped';

    if (nextBtn) {
      nextBtn.disabled = travelerState !== 'waiting_call';
      nextBtn.classList.toggle('pulse-call', travelerState === 'waiting_call');
    }

    if (btnDisc) {
      btnDisc.style.display = dayObj.unlockDiscrepancy ? 'block' : 'none';
      btnDisc.disabled = !hasActivePerson;
      btnDisc.classList.toggle('active-mode', inspectMode);
    }
    if (btnXray) {
      btnXray.style.display = dayObj.unlockXray ? 'block' : 'none';
      btnXray.disabled = !hasActivePerson;
    }
    if (btnUv) {
      btnUv.style.display = dayObj.unlockUV ? 'block' : 'none';
      btnUv.disabled = !hasActivePerson;
      btnUv.classList.toggle('uv-active', uvOn);
    }
    if (btnInter) {
      btnInter.style.display = discrepancyVerified && hasActivePerson ? 'block' : 'none';
    }
    if (btnDetain) {
      btnDetain.style.display = canDetainNow && hasActivePerson ? 'block' : 'none';
    }

    if (stApp) stApp.disabled = !hasActivePerson;
    if (stDen) stDen.disabled = !hasActivePerson;
    if (giveBtn) giveBtn.disabled = travelerState !== 'stamped';
  }

  // ---- BOLETIM DE ABERTURA DE CADA DIA ----
  function showMorningBulletin() {
    const dayObj = DAYS[dayIdx];
    appIdx = -1;
    citationsToday = 0;
    totalApprovedToday = 0;
    totalDetainedToday = 0;
    travelerState = 'waiting_call';
    inspectMode = false;
    uvOn = false;
    document.getElementById('pp-desk')?.classList.remove('uv-lit', 'pp-inspect-mode');
    document.getElementById('pp-ext-booth')?.classList.remove('occupied', 'calling');
    document.getElementById('pp-ext-gate')?.classList.remove('open');
    document.getElementById('pp-docs-layer').innerHTML = '';
    document.getElementById('pp-citation-mount').innerHTML = '';
    document.getElementById('pp-returned-badge-mount').innerHTML = '';
    document.getElementById('pp-shutter')?.classList.remove('open');
    document.getElementById('pp-shutter').textContent = `POSTO 04 // DIA ${dayObj.day}`;
    document.getElementById('pp-speech').style.display = 'none';
    document.getElementById('pp-traveler-stage').className = 'pp-traveler-stage';
    document.getElementById('pp-weight-val').textContent = '-- KG';

    renderRulebook();
    updateHudAndQueue();

    const mount = document.getElementById('pp-overlay-mount');
    mount.innerHTML = `
      <div class="pp-day-overlay">
        <div style="font-size:12px; letter-spacing:3px; color:#a89984;">MINISTÉRIO DA ORDEM TERRITORIAL // FRONTEIRA LESTE</div>
        <h2 style="margin:0; font-size:24px; color:#fde68a; letter-spacing:1px;">${dayObj.codeTitle}</h2>
        <div class="pp-night-ledger" style="white-space:pre-line;">${dayObj.bulletin}</div>
        <button type="button" class="pp-megaphone-btn" id="pp-start-shift-btn" style="padding:12px 28px; font-size:14px;">🔓 DESTRAVAR GUICHÊ E INICIAR TURNO</button>
      </div>
    `;

    document.getElementById('pp-start-shift-btn')?.addEventListener('click', () => {
      playShutterClank();
      mount.innerHTML = '';
      supervisorThenLog(dayObj.supervisorIntro, dayObj.logIntro, 'urgent');
    });
  }

  // ---- CHAMAR PRÓXIMO VIAJANTE NO MEGAFONE (Com cena externa do boneco caminhando até entrar na cabine!) ----
  let isCallingNext = false;
  document.getElementById('pp-next-btn')?.addEventListener('click', async () => {
    if (travelerState !== 'waiting_call' || isCallingNext) return;
    isCallingNext = true;
    const nextBtnEl = document.getElementById('pp-next-btn');
    if (nextBtnEl) {
      nextBtnEl.disabled = true;
      nextBtnEl.classList.remove('pulse-call');
    }

    const dayObj = DAYS[dayIdx];
    const nextPerson = dayObj.applicants[appIdx + 1];
    if (!nextPerson) {
      isCallingNext = false;
      return;
    }

    // 1. Megafone toca + ondas sonoras visuais na cerca + catraca abre e o bonequinho caminha até entrar na cabine!
    playMegaphoneCall();
    triggerMegaphoneVisualWaves();

    travelerState = 'transitioning';
    currentStamp = null;
    discrepancyVerified = false;
    canDetainNow = false;
    selectedDiscFields = [];
    inspectMode = false;
    document.getElementById('pp-returned-badge-mount').innerHTML = '';
    document.getElementById('pp-xray-screen')?.classList.remove('active');
    document.getElementById('pp-desk')?.classList.remove('pp-inspect-mode');

    await animateMiniWalkerEnteringBooth(nextPerson);
    if (!isAlive) return;

    // 2. Agora que o bonequinho entrou na porta da cabine lá fora, avança o índice e sobe a persiana metálica!
    appIdx += 1;
    const person = dayObj.applicants[appIdx];
    travelerState = 'present';

    playShutterClank();
    const shutter = document.getElementById('pp-shutter');
    shutter?.classList.add('open');

    const stage = document.getElementById('pp-traveler-stage');
    stage.innerHTML = `<div class="pp-field" data-disc-key="person_face" title="Rosto Real do Viajante">${renderCharacterArt(person.charId, 'normal', 1.06)}</div>`;
    stage.className = 'pp-traveler-stage';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => stage.classList.add('present'));
    });

    document.getElementById('pp-weight-val').textContent = `${person.weightReal} KG`;

    const sp = document.getElementById('pp-speech');
    sp.textContent = `"${person.speech}"`;
    sp.style.display = 'block';

    setTimeout(() => {
      if (!isAlive) return;
      isCallingNext = false;
      playPaperSlide();
      spawnDocumentsOnDesk(person);
      bindDiscrepancyClicks();
      updateHudAndQueue();

      if (person.isLoreSecret2) {
        setOperatorRemark(
          'caralho olha o naipe desse emissário encapuzado na janela mano... passa a luz roxa no documento dele logo.',
          { priority: 'urgent' }
        );
      }
    }, 300);

    updateHudAndQueue();
  });

  // ---- ESPALHA OS PAPÉIS DO VIAJANTE PELA MESA ----
  function spawnDocumentsOnDesk(person) {
    const layer = document.getElementById('pp-docs-layer');
    if (!layer) return;
    layer.innerHTML = '';

    const kInfo = KINGDOMS[person.kingdom] || KINGDOMS['República de Vostok'];
    const passPhotoChar = person.photoCharId || person.charId;
    const uvLabel = person.uvText || '✦ AUTÊNTICO // CHANCELARIA';

    // 1. PASSAPORTE PRINCIPAL
    const passEl = document.createElement('div');
    passEl.className = 'pp-doc-item pp-passport-doc';
    passEl.id = 'pp-doc-passport';
    passEl.style.left = '34px';
    passEl.style.top = '74px';
    passEl.style.zIndex = String(++topZ);
    passEl.innerHTML = `
      <div class="pp-pass-header ${kInfo.cls}">
        <span>PASSAPORTE // ${person.kingdom.toUpperCase()}</span>
        <span>${person.sex}</span>
      </div>
      <div class="pp-pass-body">
        <div class="pp-pass-photo pp-field" data-disc-key="pass_photo" title="Foto do Passaporte">
          ${renderCharacterArt(passPhotoChar, 'normal', 0.48)}
        </div>
        <div>
          <div><strong>Nome:</strong> <span class="pp-field" data-disc-key="pass_name">${person.name}</span></div>
          <div><strong>Nasc.:</strong> ${person.birth}</div>
          <div><strong>Cidade:</strong> <span class="pp-field" data-disc-key="pass_city">${person.city}</span></div>
          <div><strong>Peso:</strong> <span class="pp-field" data-disc-key="pass_weight">${person.weightPass} kg</span></div>
          <div><strong>Expira:</strong> <span class="pp-field" data-disc-key="pass_exp">${person.expiry}</span></div>
        </div>
      </div>
      <div class="pp-pass-footer">
        <div class="pp-field" data-disc-key="pass_seal" title="Brasão Impresso">
          ${renderSealSvg(person.kingdom, person.forgedSeal, 38)}
        </div>
        <div class="pp-uv-mark">${uvLabel}</div>
        <div id="pp-stamp-mark-slot"></div>
      </div>
    `;
    layer.appendChild(passEl);
    makeDraggable(passEl);

    // 2. TICKET DE ENTRADA (Dia 2+)
    if (person.entryTicket) {
      const tk = document.createElement('div');
      tk.className = 'pp-doc-item pp-permit-doc';
      tk.style.left = '322px';
      tk.style.top = '78px';
      tk.style.zIndex = String(++topZ);
      tk.innerHTML = `
        <div class="pp-permit-header">TICKET DE ENTRADA // ${person.entryTicket.code}</div>
        <div><strong>Finalidade:</strong> ${person.entryTicket.purpose}</div>
        <div><strong>Ano Válido:</strong> <span class="pp-field" data-disc-key="ticket_year">${person.entryTicket.validYear}</span></div>
        <div style="margin-top:6px; font-size:10px; opacity:0.75;">Válido apenas para o titular na data corrente.</div>
      `;
      layer.appendChild(tk);
      makeDraggable(tk);
    }

    // 3. PERMISSÃO DE TRABALHO (Dia 3+)
    if (person.workPermit) {
      const wp = document.createElement('div');
      wp.className = 'pp-doc-item pp-permit-doc';
      wp.style.background = '#efe8f6';
      wp.style.borderColor = '#4c1d95';
      wp.style.left = '318px';
      wp.style.top = '235px';
      wp.style.zIndex = String(++topZ);
      wp.innerHTML = `
        <div class="pp-permit-header" style="border-color:#4c1d95;">PERMISSÃO DE TRABALHO</div>
        <div><strong>Titular:</strong> <span class="pp-field" data-disc-key="permit_name">${person.workPermit.holder}</span></div>
        <div><strong>Função:</strong> ${person.workPermit.role}</div>
        <div><strong>Validade:</strong> ${person.workPermit.until}</div>
      `;
      layer.appendChild(wp);
      makeDraggable(wp);
    }

    // 4. CERTIFICADO DE VACINAÇÃO AMARELO (Dia 4+)
    if (person.vaccineCert) {
      const vc = document.createElement('div');
      vc.className = 'pp-doc-item pp-vaccine-doc';
      vc.style.left = '66px';
      vc.style.top = '325px';
      vc.style.zIndex = String(++topZ);
      vc.innerHTML = `
        <div style="font-weight:bold; border-bottom:1px solid #854d0e; margin-bottom:4px;">💉 PROFILAXIA SANITÁRIA</div>
        <div><strong>Portador:</strong> ${person.name}</div>
        <div><strong>Situação:</strong> <span class="pp-field" data-disc-key="vac_status">${person.vaccineCert.status}</span></div>
        <div><strong>Lote:</strong> ${person.vaccineCert.batch}</div>
      `;
      layer.appendChild(vc);
      makeDraggable(vc);
    }

    // 5. NOTA DE SUBORNO NA MESA
    if (person.bribe) {
      const br = document.createElement('div');
      br.className = 'pp-doc-item pp-bribe-note';
      br.style.left = '345px';
      br.style.top = '385px';
      br.style.zIndex = String(++topZ);
      br.innerHTML = `
        <div style="font-weight:bold;">💵 +${person.bribe} CRÉDITOS VIVOS</div>
        <div style="margin-top:3px;">"Bate o carimbo VERDE no meu passaporte que esse dinheiro fica na sua gaveta..."</div>
      `;
      layer.appendChild(br);
      makeDraggable(br);
    }
  }

  // ---- MODO DISCREPÂNCIA ----
  function bindDiscrepancyClicks() {
    app.querySelectorAll('.pp-field').forEach((el) => {
      if (el.dataset.boundDisc === '1') return;
      el.dataset.boundDisc = '1';

      el.addEventListener('click', (e) => {
        if (!inspectMode) return;
        e.stopPropagation();
        playBeep();

        const key = el.getAttribute('data-disc-key');
        if (!key) return;

        if (selectedDiscFields.some((x) => x.key === key)) return;
        el.classList.add('selected-disc');
        selectedDiscFields.push({ key, el });

        if (selectedDiscFields.length === 2) {
          evaluateDiscrepancyPair(selectedDiscFields[0].key, selectedDiscFields[1].key);
          setTimeout(() => {
            app.querySelectorAll('.pp-field.selected-disc').forEach((n) => n.classList.remove('selected-disc'));
            selectedDiscFields = [];
          }, 550);
        }
      });
    });
  }

  function evaluateDiscrepancyPair(k1, k2) {
    const person = DAYS[dayIdx].applicants[appIdx];
    if (!person) return;
    const pair = new Set([k1, k2]);

    let matched = false;
    if (pair.has('real_weight') && pair.has('pass_weight') && Math.abs(person.weightReal - person.weightPass) > 3) {
      matched = true;
    } else if (pair.has('pass_city') && pair.has('rulebook_map') && person.discrepancyType === 'city') {
      matched = true;
    } else if (pair.has('person_face') && (pair.has('pass_photo') || pair.has('wanted_poster')) && person.discrepancyType === 'face') {
      matched = true;
    } else if (pair.has('pass_name') && pair.has('permit_name') && person.discrepancyType === 'name') {
      matched = true;
    } else if (pair.has('today_date') && pair.has('pass_exp') && Number(person.expiry.split('.')[1]) < 2026) {
      matched = true;
    } else if (pair.has('today_date') && pair.has('ticket_year') && Number(person.entryTicket?.validYear) < 2026) {
      matched = true;
    }

    inspectMode = false;
    document.getElementById('pp-desk')?.classList.remove('pp-inspect-mode');

    if (matched) {
      discrepancyVerified = true;
      if (person.canDetain) canDetainNow = true;
      saySupervisor('KSHHH— Discrepância confirmada! Microfone de interrogatório liberado.');
    } else {
      saySupervisor('KSHHH— Nenhuma correlação irregular entre esses dois itens.');
    }
    updateHudAndQueue();
  }

  document.getElementById('pp-btn-disc')?.addEventListener('click', () => {
    playBeep();
    inspectMode = !inspectMode;
    selectedDiscFields = [];
    app.querySelectorAll('.pp-field.selected-disc').forEach((n) => n.classList.remove('selected-disc'));
    document.getElementById('pp-desk')?.classList.toggle('pp-inspect-mode', inspectMode);
    if (inspectMode) {
      saySupervisor('Modo Inspeção ativo: clique em DOIS campos conflitantes (ex: Peso LED + Peso no Passaporte, ou Cidade + Aba Mapa).');
    }
    updateHudAndQueue();
  });

  // ---- BOTÃO INTERROGAR ----
  document.getElementById('pp-btn-interrogate')?.addEventListener('click', () => {
    const person = DAYS[dayIdx].applicants[appIdx];
    if (!person) return;
    playMegaphoneCall();
    const sp = document.getElementById('pp-speech');
    if (sp) {
      sp.textContent = `"${person.interrogateReply || 'Não tenho mais nada a declarar!! Me devolve logo esse passaporte!'}"`;
    }
    if (person.canDetain) canDetainNow = true;
    updateHudAndQueue();
  });

  // ---- SCANNER RAIO-X ----
  document.getElementById('pp-btn-xray')?.addEventListener('click', () => {
    const person = DAYS[dayIdx].applicants[appIdx];
    if (!person) return;
    playShutterClank();
    const screen = document.getElementById('pp-xray-screen');
    const txt = document.getElementById('pp-xray-text');
    if (txt) txt.textContent = person.xrayDesc;
    screen?.classList.add('active');

    if (person.xrayBad && person.canDetain) {
      canDetainNow = true;
      updateHudAndQueue();
    }

    if (person.isLoreSecret1 && !capturedClue1) {
      capturedClue1 = true;
      renderRulebook();
      supervisorThenLog(
        'KSHHH— Placa de chumbo diplomática detectada, sem explosivos. Protocolo permite passagem.',
        'opa opa opa!! anotou esses zeros e uns que apareceram no raio-x?! já copiei pra tua aba [Notas] ali no manual, isso é pista do livro ctz!',
        'urgent'
      );
    }
  });

  document.getElementById('pp-xray-close')?.addEventListener('click', () => {
    playBeep();
    document.getElementById('pp-xray-screen')?.classList.remove('active');
  });

  // ---- LANTERNA DE LUZ NEGRA UV (Dia 5) ----
  document.getElementById('pp-btn-uv')?.addEventListener('click', () => {
    const person = DAYS[dayIdx].applicants[appIdx];
    playBeep();
    uvOn = !uvOn;
    document.getElementById('pp-desk')?.classList.toggle('uv-lit', uvOn);
    updateHudAndQueue();

    if (uvOn && person?.canDetain && !person.valid) {
      canDetainNow = true;
      updateHudAndQueue();
    }

    if (uvOn && person?.isLoreSecret2 && !capturedClue2) {
      capturedClue2 = true;
      renderRulebook();
      supervisorThenLog(
        'KSHHH— Salvo-conduto UV da Chancelaria verificado. Autorize passagem imediata do Emissário.',
        'CARALHO OLHA NO PASSAPORTE DELE COM A LUZ ROXA: "CÉSAR +3 → EHUOLP"!! salvou na aba [Notas] tbm! aprova logo esse cara pra gente vazar daqui!!',
        'urgent'
      );
    }
  });

  // ---- GAVETA DE CARIMBOS PESADOS (Alça legível que alterna ◀ / ▶) ----
  document.getElementById('pp-stamp-toggle')?.addEventListener('click', () => {
    playShutterClank();
    stampBarOpen = !stampBarOpen;
    document.getElementById('pp-stamp-bar')?.classList.toggle('open', stampBarOpen);
    const toggleBtn = document.getElementById('pp-stamp-toggle');
    if (toggleBtn) toggleBtn.textContent = stampBarOpen ? '▶ FECHAR' : '◀ CARIMBOS';
  });

  function applyStamp(kind) {
    if (travelerState !== 'present' && travelerState !== 'stamped') return;
    playHeavyStampSound();
    currentStamp = kind;
    travelerState = 'stamped';

    const slot = document.getElementById('pp-stamp-mark-slot');
    if (slot) {
      slot.innerHTML = `<div class="pp-ink-stamp ${kind}">${kind === 'approved' ? 'APROVADO' : 'NEGADO'}</div>`;
    }
    updateHudAndQueue();
  }

  document.getElementById('pp-stamp-approve')?.addEventListener('click', () => applyStamp('approved'));
  document.getElementById('pp-stamp-deny')?.addEventListener('click', () => applyStamp('denied'));

  // ---- DETER VIAJANTE ----
  document.getElementById('pp-btn-detain')?.addEventListener('click', () => {
    if (travelerState !== 'present' && travelerState !== 'stamped') return;
    playMegaphoneCall();
    finishCurrentTraveler('detained');
  });

  // ---- ENTREGAR PASSAPORTE PELA FRESTA COM ANIMAÇÃO FLUIDA + REAÇÃO DO CLIENTE! ----
  document.getElementById('pp-give-btn')?.addEventListener('click', () => {
    if (travelerState !== 'stamped' || !currentStamp) return;
    finishCurrentTraveler(currentStamp);
  });

  const logCitationMocks = [
    'kkkkkk já saiu o papelzinho rosa da multa cantando na mesa! lê a porra do manual direito mano!',
    'mais uma infração pro teu currículo de porteiro... se tomar 3 no mesmo dia os caras te chutam de volta pro começo do turno!',
    'pqp deixou passar coisa errada na cara dura e a impressora já te dedurou na hora!',
  ];
  let mockIdx = 0;

  async function finishCurrentTraveler(decision) {
    const dayObj = DAYS[dayIdx];
    const person = dayObj.applicants[appIdx];
    if (!person) return;

    travelerState = 'transitioning';
    stampBarOpen = false;
    document.getElementById('pp-stamp-bar')?.classList.remove('open');
    const toggleBtn = document.getElementById('pp-stamp-toggle');
    if (toggleBtn) toggleBtn.textContent = '◀ CARIMBOS';
    document.getElementById('pp-xray-screen')?.classList.remove('active');
    updateHudAndQueue();

    const stage = document.getElementById('pp-traveler-stage');
    const sp = document.getElementById('pp-speech');
    const retMount = document.getElementById('pp-returned-badge-mount');

    // 1. Se foi entrega de passaporte (APROVADO / NEGADO), desliza os papéis pela fresta, o cliente pega, muda de expressão e REAGE!
    if (decision === 'approved' || decision === 'denied') {
      playPaperSlide();
      document.querySelectorAll('#pp-docs-layer .pp-doc-item').forEach((docEl) => {
        docEl.classList.add('sliding-to-window');
      });

      await new Promise((r) => setTimeout(r, 400));
      document.getElementById('pp-docs-layer').innerHTML = '';

      // Troca o retrato na janela para a variação 'approved' (sorrindo/aliviado) ou 'denied' (irritado/frustrado)!
      const mood = decision === 'approved' ? 'approved' : 'denied';
      if (stage) {
        stage.innerHTML = `<div>${renderCharacterArt(person.charId, mood, 1.06)}</div>`;
      }
      if (retMount) {
        retMount.innerHTML = `<div class="pp-returned-pass-badge ${decision === 'approved' ? 'ok' : 'no'}">📘 Passaporte recolhido (${decision === 'approved' ? 'APROVADO' : 'NEGADO'})</div>`;
      }

      // Fala final do cliente ao pegar o documento!
      const farewell = decision === 'approved' ? person.replyApproved : person.replyDenied;
      if (sp && farewell) {
        sp.textContent = `"${farewell}"`;
        sp.style.display = 'block';
      }

      // Pausa gostosa de leitura pra ver a reação do cliente antes dele sair andando!
      await new Promise((r) => setTimeout(r, 1450));
    } else {
      // Se foi DETIDO pelos guardas!
      document.getElementById('pp-docs-layer').innerHTML = '';
      if (stage) {
        stage.innerHTML = `<div>${renderCharacterArt(person.charId, 'denied', 1.06)}</div>`;
      }
      if (sp) {
        sp.textContent = `"EI!! ME LARGA SEU GUARDA!! EU NÃO FIZ NADA!!"`;
        sp.style.display = 'block';
      }
      await new Promise((r) => setTimeout(r, 1150));
    }

    // 2. Agora o cliente sai pela direita (aprovado), esquerda (negado) ou arrastado (detido) — tanto na janela quanto lá fora na mini-cabine!
    if (sp) sp.style.display = 'none';
    if (retMount) retMount.innerHTML = '';
    animateMiniWalkerExitingBooth(person, decision);
    if (decision === 'detained') stage?.classList.add('detained');
    else if (decision === 'approved') stage?.classList.add('leaving-ok');
    else stage?.classList.add('leaving-denied');

    const approved = decision === 'approved';
    const isCorrect = decision === 'detained' ? !person.valid : approved === person.valid;

    if (approved && person.bribe) {
      credits += person.bribe;
    }

    if (isCorrect) {
      credits += 10;
      if (decision === 'detained') {
        credits += 5;
        totalDetainedToday += 1;
      } else if (approved) {
        totalApprovedToday += 1;
      }

      const supMsg =
        decision === 'detained'
          ? 'KSHHH— Suspeito detido pela guarda! +10 cr (+5 cr bônus de detenção). Chame o próximo.'
          : 'KSHHH— Processamento correto (+10 cr). Chame o próximo da fila.';

      await supervisorThenLog(supMsg, person.logReactAfter || null, 'action');
    } else {
      citationsToday += 1;
      credits = Math.max(0, credits - 10);
      playCitationPrinter();

      const citMount = document.getElementById('pp-citation-mount');
      if (citMount) {
        citMount.innerHTML = `
          <div class="pp-citation-slip">
            <div style="font-weight:900; border-bottom:1px solid #991b1b; margin-bottom:4px;">⚠️ NOTIFICAÇÃO PROTOCOLAR (${citationsToday}/3)</div>
            <div><strong>Infrator:</strong> Posto 04</div>
            <div><strong>Motivo:</strong> ${person.violationReason}</div>
            <div style="margin-top:4px; font-weight:bold;">PENALIDADE: -10 CRÉDITOS</div>
          </div>
        `;
      }

      if (citationsToday >= 3) {
        await supervisorThenLog(
          'KSHHH— TRÊS INFRAÇÕES GRAVES NO MESMO TURNO! Turno anulado. Recomece a auditoria deste dia imediatamente!',
          'conseguiu ser demitido do dia inteiro mano!! pelo menos não voltou pro Dia 1, refaz esse turno prestando atenção agora!',
          'urgent'
        );
        setTimeout(() => showMorningBulletin(), 1800);
        return;
      }

      await supervisorThenLog(
        `KSHHH— VIOLAÇÃO REGISTRADA (${citationsToday}/3): ${person.violationReason}`,
        logCitationMocks[mockIdx++ % logCitationMocks.length],
        'action'
      );
    }

    setTimeout(() => {
      document.getElementById('pp-shutter')?.classList.remove('open');
      playShutterClank();

      if (appIdx + 1 >= dayObj.applicants.length) {
        setTimeout(() => showNightEndOfShift(), 550);
      } else {
        travelerState = 'waiting_call';
        updateHudAndQueue();
      }
    }, 520);
  }

  // ---- TELA DE FECHAMENTO NOTURNO ----
  function showNightEndOfShift() {
    const dayObj = DAYS[dayIdx];
    const mount = document.getElementById('pp-overlay-mount');

    if (dayIdx + 1 >= DAYS.length) {
      mount.innerHTML = `
        <div class="pp-day-overlay">
          <div style="font-size:12px; letter-spacing:3px; color:#4ade80;">CONVOCAÇÃO DE 5 DIAS CONCLUÍDA</div>
          <h2 style="margin:0; font-size:24px; color:#fde68a;">LIVRO I LIBERADO — POSTO 04 ENCERRADO</h2>
          <div class="pp-night-ledger">
            <div style="margin-bottom:8px; color:#fcd34d; font-weight:bold;">RESUMO DAS PISTAS INTERCEPTADAS NO LIVRO:</div>
            <div>• Dia 4 (Diplomata K. / Raio-X): <code>01001101 01010101 01010010 01001111</code></div>
            <div>• Dia 5 (Emissário Fantasma / UV): <code>CÉSAR +3 → EHUOLP</code></div>
            <div style="margin-top:10px; font-size:12px; opacity:0.85;">Use essas duas pistas para resolver o enigma na Última Página do Livro I na sua mochila!</div>
          </div>
          <button type="button" class="pp-megaphone-btn" id="pp-claim-book1" style="background:#15803d; border-color:#052e16; padding:14px 28px; font-size:14px;">📕 RECOLHER LIVRO I E VOLTAR À CAVERNA</button>
        </div>
      `;

      supervisorThenLog(
        'KSHHH— Auditoria finalizada com êxito. Emitindo volume físico para arquivamento externo.',
        'acabou os 5 dias dessa guarita congelada!! pega logo esse Livro I aí na frente que já guardamos as duas cifras pra abrir o cadeado dele!',
        'urgent'
      );

      document.getElementById('pp-claim-book1')?.addEventListener('click', async () => {
        isAlive = false;
        playHeavyStampSound();
        await finishStory();
      });
      return;
    }

    const upkeepCost = 20;
    const afterUpkeep = Math.max(0, credits - upkeepCost);

    mount.innerHTML = `
      <div class="pp-day-overlay">
        <div style="font-size:12px; letter-spacing:3px; color:#a89984;">FIM DO EXPEDIENTE — NOITE DO DIA ${dayObj.day}</div>
        <h2 style="margin:0; font-size:22px; color:#fde68a;">BALANÇO FINANCEIRO DO POSTO 04</h2>
        <div class="pp-night-ledger">
          <div class="pp-ledger-row"><span>Saldo acumulado no caixa:</span><span>${credits} cr</span></div>
          <div class="pp-ledger-row"><span>Detenções realizadas hoje:</span><span>${totalDetainedToday}</span></div>
          <div class="pp-ledger-row"><span>Infrações cometidas hoje:</span><span>${citationsToday}</span></div>
          <div class="pp-ledger-row" style="color:#fca5a5;"><span>Aluguel & Carvão da Calefação:</span><span>-${upkeepCost} cr</span></div>
          <div class="pp-ledger-row" style="font-weight:bold; color:#fde047; margin-top:6px;"><span>SALDO PARA AMANHÃ:</span><span>${afterUpkeep} cr</span></div>
        </div>
        <button type="button" class="pp-megaphone-btn" id="pp-next-day-btn" style="padding:12px 26px; font-size:14px;">🌙 DORMIR E AVANÇAR PARA O DIA ${dayObj.day + 1} ➡️</button>
      </div>
    `;

    document.getElementById('pp-next-day-btn')?.addEventListener('click', () => {
      playShutterClank();
      credits = afterUpkeep;
      dayIdx += 1;
      showMorningBulletin();
    });
  }

  showMorningBulletin();
}
