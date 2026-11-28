// ============================================================================
// CONTO 2: A PRINCESA DE PLÁSTICO — TEATRO REAL DE COMPENSADO & PAPELÃO
// Palco teatral interativo Point-and-Click (clique direto nos atores/objetos no palco + barra de apoio),
// suporte híbrido automático para PNGs recortados (`/story2/chars/*` e `/story2/scenes/*`) + ilustrações
// ricas em camadas estilo Paper Mario/Fantoche Recortado, balões de fala vivos no palco, Alforje equipável
// e Enigma Multi-Camadas "Don't Believe His Lies" (Negativo Escuro + Bloco de Notas + URL `/1697` -> `/talia`).
// ============================================================================

export function runStory2Princesa({
  app,
  setOperatorRemark,
  triggerRisadaVoiceReaction,
  resetIdleChillTimer,
  playBeep,
  finishStory,
  returnToCave,
  caveState,
}) {
  document.body.className = 'story-mode-2';
  document.title = 'naoclique // livro II';
  if (resetIdleChillTimer) resetIdleChillTimer();

  let isAlive = true;
  let scrollSeq = 0;
  let bubbleTimer = null;

  // ---- ÁUDIO SINTÉTICO PRÓPRIO DO TEATRO DE PAPELÃO ----
  let s2Audio = null;
  function getAudio() {
    try {
      if (!s2Audio) {
        const AC = window.AudioContext || window.webkitAudioContext;
        s2Audio = new AC();
      }
      if (s2Audio.state === 'suspended') s2Audio.resume();
      return s2Audio;
    } catch {
      return null;
    }
  }

  function playToyFanfare(ok = true) {
    const ctx = getAudio();
    if (!ctx) return;
    const notes = ok ? [523.25, 659.25, 783.99] : [311.13, 233.08];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = ok ? 'triangle' : 'sawtooth';
      const t = ctx.currentTime + idx * 0.085;
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.065, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.16);
    });
  }

  function playSneezeBurst() {
    const ctx = getAudio();
    if (!ctx) return;
    const dur = 0.26;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 920;
    const g = ctx.createGain();
    g.gain.value = 0.16;
    src.connect(bp);
    bp.connect(g);
    g.connect(ctx.destination);
    src.start();
  }

  function playCardboardCreak() {
    const ctx = getAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(115, ctx.currentTime + 0.07);
    g.gain.setValueAtTime(0.04, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.075);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  // ---- ESTADO COMPLETO DO AVENTUREIRO NO CONTO 2 ----
  const st = {
    room: 'tavern',
    unlockedRooms: new Set(['tavern', 'stable']),
    coins: 60,
    selectedItem: null,
    bag: [],
    actorMood: 'normal', // 'normal' | 'happy' | 'angry'

    mugChecked: false,
    boughtCarrot: false,
    boughtAcai: false,
    boughtRuler: false,

    horseSigned: false,
    horseFed: false,
    saddleBagChecked: false,

    rhPassed: false,
    rhStep: 0,

    medBoxOpened: false,
    scriptRead: false,
    negativeFound: false,

    curtainOpened: false,
    dustLevel: 90,
    dragonAllergy: 100,
    dragonAsleep: false,
    collarInspected: false,

    breakers: [false, true, false, false], // meta: 110 + 75 + 35 = 220V (ON, OFF, ON, ON)
    elevatorPowered: false,
    elevatorUnlocked: false,

    guardCleared: false,
  };

  const ITEMS_DB = {
    regua: { id: 'regua', icon: '📏', name: 'Espada Faber 30cm', desc: 'Régua escolar acrílica pintada com spray prateado.' },
    cenoura: { id: 'cenoura', icon: '🥕', name: 'Cenoura Orgânica', desc: 'Exigência nº 1 da Convenção Coletiva dos Corcéis.' },
    termo_clt: { id: 'termo_clt', icon: '📋', name: 'Acordo de Hora-Galope', desc: 'Formulário sindical encontrado no alforje do estábulo.' },
    acai: { id: 'acai', icon: '🥣', name: 'Açaí 500ml c/ Leite Ninho', desc: 'Sem isso ninguém pisa no tapete da Princesa.' },
    cracha_rh: { id: 'cracha_rh', icon: '🪪', name: 'Crachá "Herói PJ"', desc: 'Aprovado no Fit Cultural do Troll Sênior de People.' },
    lenco: { id: 'lenco', icon: '🧻', name: 'Lenço Anti-Pó', desc: 'Remove ácaro cenográfico acumulado desde 1998.' },
    neosoro: { id: 'neosoro', icon: '💧', name: 'Descongestionante Dracônico', desc: 'Cloridrato nasal pra narina soltadora de brasa.' },
    roteiro_1697: {
      id: 'roteiro_1697',
      icon: '📜',
      name: 'Folha de Paris (1697)',
      desc: 'Perrault, 1697: "SETE fadas boas convidadas ao batizado." (Margem rabiscada: /1697)',
    },
    placa_hex: {
      id: 'placa_hex',
      icon: '🏷️',
      name: 'Coleira Nº 0x2F',
      desc: 'Placa de latão do Dragão: "LOTE MECÂNICO #0x2F — Voltagem Auxiliar: 220V".',
    },
    negativo_02: {
      id: 'negativo_02',
      icon: '🎞️',
      name: 'Negativo Escuro #02',
      desc: 'Chapa subexposta, quase toda preta. Ninguém pendura no varal uma foto que não tem nada... ou tem?',
    },
  };

  const hasItem = (id) => st.bag.includes(id);
  const addItem = (id) => {
    if (!st.bag.includes(id)) st.bag.push(id);
  };

  const ROOMS_ORDER = [
    { id: 'tavern', short: '1. Taverna', icon: '🍺' },
    { id: 'stable', short: '2. Estábulo', icon: '🐴' },
    { id: 'bridge', short: '3. Ponte RH', icon: '💼' },
    { id: 'backstage', short: '4. Bastidores', icon: '🎞️' },
    { id: 'dragon', short: '5. Dragão', icon: '🐉' },
    { id: 'elevator', short: '6. Casa Máq.', icon: '⚡' },
    { id: 'penthouse', short: '7. Torre Real', icon: '👑' },
  ];

  app.innerHTML = `
    <div class="story-shell s2-shell">
      <div class="operator-feed story-main-log">
        <span class="operator-tag">log</span>
        <span id="operator-msg"></span>
      </div>

      <div class="s2-topbar">
        <button type="button" class="story-back-btn" id="s2-back">← Voltar para a Caverna</button>
        <div class="s2-map-bar" id="s2-map-bar"></div>
        <div class="s2-wallet" id="s2-wallet">🪙 60 Moedas</div>
      </div>

      <div class="s2-main-grid">
        <div class="s2-stage-panel">
          <div class="s2-room-header" id="s2-room-header"></div>

          <div class="s2-theater-proscenium">
            <div class="s2-curtain-valance"></div>
            <div class="s2-curtain-side left"></div>
            <div class="s2-curtain-side right"></div>
            <div class="s2-stage-bubble" id="s2-stage-bubble"></div>
            <div class="s2-scene-canvas" id="s2-scene-canvas"></div>
            <div class="s2-stage-floor"></div>
          </div>

          <div class="s2-hotspots-bar" id="s2-hotspots-bar"></div>
          <div class="s2-subpanel" id="s2-subpanel"></div>
        </div>

        <aside class="s2-side-inv">
          <div class="s2-inv-hdr">🎒 ALFORJE DE CENA</div>
          <div class="s2-inv-hint">Clique num item para <strong>segurar na mão</strong> e clique no personagem/objeto no palco!</div>
          <div class="s2-inv-list" id="s2-inv-list"></div>
          <div class="s2-clue-tracker" id="s2-clue-tracker"></div>
        </aside>
      </div>

      <div class="story-npc-feed story-log-pink">
        <span class="story-npc-tag">narrador</span>
        <span id="story-npc-msg"></span>
      </div>
    </div>
  `;

  document.getElementById('s2-back')?.addEventListener('click', () => {
    isAlive = false;
    scrollSeq++;
    if (bubbleTimer) clearTimeout(bubbleTimer);
    returnToCave(caveState);
  });

  function showStageBubble(speaker, text, mood = 'normal') {
    st.actorMood = mood;
    const b = document.getElementById('s2-stage-bubble');
    if (!b) return;
    if (bubbleTimer) clearTimeout(bubbleTimer);
    b.innerHTML = `<strong>${speaker}:</strong> "${text}"`;
    b.classList.add('visible');
    // Atualiza retrato caso mude o humor (normal/happy/angry)
    const portraitSlot = document.getElementById('s2-actor-slot');
    if (portraitSlot && portraitSlot.dataset.actor) {
      portraitSlot.innerHTML = renderCharacterCutout(portraitSlot.dataset.actor, mood);
    }
    bubbleTimer = setTimeout(() => {
      b.classList.remove('visible');
    }, 5200);
  }

  async function sayNarrator(text) {
    const mySeq = ++scrollSeq;
    const el = document.getElementById('story-npc-msg');
    if (!el) return;
    el.textContent = '';
    for (let i = 0; i < text.length; i++) {
      if (!isAlive || mySeq !== scrollSeq) return;
      el.textContent += text[i];
      await new Promise((r) => setTimeout(r, 12));
    }
  }

  async function narratorThenLog(narText, logText = null, priority = 'action') {
    const expected = scrollSeq + 1;
    await sayNarrator(narText);
    if (!isAlive || expected !== scrollSeq || !logText) return;
    await new Promise((r) => setTimeout(r, 550));
    if (!isAlive || expected !== scrollSeq) return;
    setOperatorRemark(logText, { priority, key: true });
  }

  // ---- RETRATOS RECORTADOS DE PAPELÃO (Híbrido: carrega `/story2/chars/{id}_{mood}.png` se existir + SVG Rico Ilustrado!) ----
  function renderFallbackActorSvg(actorId, mood) {
    if (actorId === 'bardo') {
      const mouth = mood === 'happy' ? 'M92 126 Q105 135 118 125' : mood === 'angry' ? 'M94 131 Q105 123 116 131' : 'M95 128 L115 127';
      return `
        <svg viewBox="0 0 210 210" class="s2-cutout-svg">
          <g filter="drop-shadow(0 6px 0 rgba(20,5,12,0.55))">
            <!-- Base recortada branca tipo Paper Mario -->
            <path d="M46 202 L56 142 C58 128 74 122 86 120 L86 112 C74 106 68 92 70 76 C62 72 56 62 64 52 C74 38 104 32 132 42 C148 48 156 62 142 74 C144 92 136 106 124 112 L124 120 C140 124 154 134 160 152 L168 202 Z" fill="#fdf2f8" stroke="#290916" stroke-width="4"/>
            <!-- Gibão listrado renascentista surrado -->
            <path d="M54 200 L63 146 C68 132 142 132 148 148 L160 200 Z" fill="#9d174d" stroke="#290916" stroke-width="3"/>
            <path d="M84 135 L80 200 M105 134 L105 200 M126 135 L130 200" stroke="#fbcfe8" stroke-width="4"/>
            <!-- Gola babado de papel crepom -->
            <path d="M76 134 Q85 145 95 134 Q105 145 115 134 Q125 145 134 134" fill="#fff" stroke="#290916" stroke-width="2.5"/>
            <!-- Rosto expressivo com olheiras de CLT -->
            <ellipse cx="105" cy="96" rx="28" ry="32" fill="#fed7aa" stroke="#290916" stroke-width="3"/>
            <path d="M84 88 Q92 84 98 88 M112 88 Q118 84 126 88" stroke="#290916" stroke-width="3" fill="none"/>
            <circle cx="92" cy="96" r="3.5" fill="#290916"/><circle cx="118" cy="96" r="3.5" fill="#290916"/>
            <path d="M86 103 Q92 107 98 103 M112 103 Q118 107 124 103" stroke="#c2410c" stroke-width="1.5" fill="none"/>
            <path d="M105 95 L101 112 L108 113" stroke="#9a3412" stroke-width="2.5" fill="none"/>
            <path d="${mouth}" stroke="#290916" stroke-width="3" fill="none" stroke-linecap="round"/>
            <!-- Boina de veludo + Pena quebrada presa com fita crepe -->
            <path d="M66 74 C64 46 112 36 140 54 C150 60 146 76 132 76 Z" fill="#db2777" stroke="#290916" stroke-width="3"/>
            <path d="M126 48 Q154 22 168 30 Q154 48 134 56" fill="#fde047" stroke="#290916" stroke-width="2.5"/>
            <rect x="136" y="38" width="14" height="7" fill="#fef3c7" stroke="#78350f" stroke-width="1.5" transform="rotate(28 136 38)"/>
            <!-- Alaúde remendado -->
            <ellipse cx="142" cy="176" rx="22" ry="17" fill="#d97706" stroke="#290916" stroke-width="3" transform="rotate(-24 142 176)"/>
            <line x1="126" y1="184" x2="174" y2="152" stroke="#290916" stroke-width="5"/>
          </g>
        </svg>
      `;
    }
    if (actorId === 'cavalo') {
      const smile = mood === 'happy' ? 'M84 128 Q102 140 116 126' : mood === 'angry' ? 'M84 134 Q98 122 114 134' : 'M85 130 L112 128';
      return `
        <svg viewBox="0 0 210 210" class="s2-cutout-svg">
          <g filter="drop-shadow(0 6px 0 rgba(15,10,24,0.6))">
            <!-- Silhueta de recorte branco -->
            <path d="M44 204 L54 138 L72 124 L68 58 L82 32 L98 52 L114 30 L124 58 L138 98 L132 128 L158 142 L166 204 Z" fill="#fff" stroke="#1e293b" stroke-width="4"/>
            <!-- Colete Reflexivo de Greve Sindical -->
            <path d="M52 202 L62 142 L150 142 L160 202 Z" fill="#eab308" stroke="#1e293b" stroke-width="3"/>
            <rect x="58" y="166" width="96" height="10" fill="#fef08a"/>
            <text x="106" y="194" text-anchor="middle" fill="#1e293b" font-family="monospace" font-weight="bold" font-size="11">GREVE GERAL</text>
            <!-- Pescoço e Focinho Equino Expressivo -->
            <path d="M78 142 L76 62 L124 62 L134 114 C136 132 118 144 98 142 Z" fill="#f1f5f9" stroke="#1e293b" stroke-width="3"/>
            <!-- Orelhas e Crina Estilosa -->
            <polygon points="78,62 72,34 90,54" fill="#e2e8f0" stroke="#1e293b" stroke-width="3"/>
            <polygon points="108,54 118,32 124,62" fill="#e2e8f0" stroke="#1e293b" stroke-width="3"/>
            <path d="M90 50 Q105 36 114 56" fill="#f472b6" stroke="#1e293b" stroke-width="2.5"/>
            <!-- Óculos Aviador Espelhados -->
            <rect x="72" y="72" width="26" height="18" rx="5" fill="#09090b" stroke="#fbbf24" stroke-width="2.5"/>
            <rect x="104" y="72" width="26" height="18" rx="5" fill="#09090b" stroke="#fbbf24" stroke-width="2.5"/>
            <line x1="98" y1="79" x2="104" y2="79" stroke="#fbbf24" stroke-width="3"/>
            <line x1="76" y1="76" x2="86" y2="86" stroke="#38bdf8" stroke-width="2"/>
            <line x1="108" y1="76" x2="118" y2="86" stroke="#38bdf8" stroke-width="2"/>
            <!-- Narinas e Boca -->
            <circle cx="90" cy="112" r="3.5" fill="#334155"/><circle cx="112" cy="112" r="3.5" fill="#334155"/>
            <path d="${smile}" stroke="#1e293b" stroke-width="3" fill="none" stroke-linecap="round"/>
          </g>
        </svg>
      `;
    }
    if (actorId === 'troll') {
      const mouth = mood === 'happy' ? 'M88 122 Q105 134 122 122' : mood === 'angry' ? 'M88 128 Q105 116 122 128' : 'M90 124 Q105 129 120 123';
      return `
        <svg viewBox="0 0 210 210" class="s2-cutout-svg">
          <g filter="drop-shadow(0 6px 0 rgba(10,12,28,0.65))">
            <path d="M38 204 L48 134 L72 122 L52 88 L72 82 C76 54 134 54 138 82 L158 88 L138 122 L162 134 L172 204 Z" fill="#fff" stroke="#14532d" stroke-width="4"/>
            <!-- Terno Corporativo Apertado + Gravata Rosa -->
            <path d="M46 202 L56 138 L154 138 L164 202 Z" fill="#1e293b" stroke="#0f172a" stroke-width="3"/>
            <polygon points="94,138 116,138 105,162" fill="#f8fafc"/>
            <polygon points="105,144 98,184 105,194 112,184" fill="#ec4899" stroke="#0f172a" stroke-width="2"/>
            <!-- Crachá Pendurado & Caneca "RH <3" -->
            <rect x="124" y="156" width="22" height="28" rx="2" fill="#fef08a" stroke="#0f172a" stroke-width="2"/>
            <text x="135" y="174" text-anchor="middle" fill="#0f172a" font-family="monospace" font-weight="bold" font-size="8">FIT</text>
            <!-- Cabeça de Troll Orelhudo com Cabelinho Lambido -->
            <polygon points="74,88 50,82 70,104" fill="#4ade80" stroke="#14532d" stroke-width="3"/>
            <polygon points="136,88 160,82 140,104" fill="#4ade80" stroke="#14532d" stroke-width="3"/>
            <ellipse cx="105" cy="96" rx="34" ry="34" fill="#4ade80" stroke="#14532d" stroke-width="3"/>
            <path d="M78 72 Q105 56 132 72" stroke="#14532d" stroke-width="5" fill="none"/>
            <!-- Óculos Meia-Lua de Recrutador -->
            <rect x="80" y="88" width="20" height="12" rx="3" fill="#e0f2fe" stroke="#0f172a" stroke-width="2.5"/>
            <rect x="110" y="88" width="20" height="12" rx="3" fill="#e0f2fe" stroke="#0f172a" stroke-width="2.5"/>
            <line x1="100" y1="93" x2="110" y2="93" stroke="#0f172a" stroke-width="2.5"/>
            <circle cx="90" cy="94" r="2.5" fill="#0f172a"/><circle cx="120" cy="94" r="2.5" fill="#0f172a"/>
            <!-- Presinha inferior + Sorriso Falso de LinkedIn -->
            <path d="${mouth}" stroke="#14532d" stroke-width="3" fill="none"/>
            <polygon points="94,124 98,116 102,125" fill="#fff" stroke="#14532d" stroke-width="1.5"/>
          </g>
        </svg>
      `;
    }
    if (actorId === 'dragao') {
      const asleep = st.dragonAsleep || mood === 'happy';
      return `
        <svg viewBox="0 0 240 210" class="s2-cutout-svg">
          <g filter="drop-shadow(0 6px 0 rgba(20,5,10,0.65))">
            <!-- Asa de Papelão Costurada -->
            <path d="M138 118 L206 68 L194 138 L152 152 Z" fill="#9f1239" stroke="#290916" stroke-width="3.5"/>
            <line x1="148" y1="115" x2="195" y2="82" stroke="#fda4af" stroke-width="2" stroke-dasharray="5 4"/>
            <!-- Corpo Escamoso Gordinho + Barriga Costurada -->
            <ellipse cx="128" cy="154" rx="68" ry="44" fill="${asleep ? '#64748b' : '#e11d48'}" stroke="#290916" stroke-width="3.5"/>
            <ellipse cx="116" cy="160" rx="42" ry="28" fill="#fecdd3" stroke="#290916" stroke-width="2"/>
            <!-- COLEIRA DE LATÃO #0x2F (CLICÁVEL NO PALCO!) -->
            <rect x="74" y="116" width="54" height="16" rx="4" fill="#f59e0b" stroke="#451a03" stroke-width="2.5" transform="rotate(14 74 116)"/>
            <text x="101" y="133" text-anchor="middle" fill="#451a03" font-family="monospace" font-weight="bold" font-size="9" transform="rotate(14 101 133)">#0x2F</text>
            <!-- Cabeça de Dragão com Bolsa Térmica na Cabeça e Nariz Vermelho de Rinite! -->
            <ellipse cx="88" cy="88" rx="38" ry="30" fill="${asleep ? '#64748b' : '#e11d48'}" stroke="#290916" stroke-width="3.5"/>
            <ellipse cx="78" cy="48" rx="20" ry="9" fill="#38bdf8" stroke="#0c4a6e" stroke-width="2.5"/>
            <!-- Focinho inchado de alergia -->
            <circle cx="54" cy="92" r="14" fill="${asleep ? '#94a3b8' : '#fb7185'}" stroke="#290916" stroke-width="3"/>
            <circle cx="50" cy="90" r="3.5" fill="#290916"/><circle cx="59" cy="93" r="3.5" fill="#290916"/>
            ${
              asleep
                ? `<path d="M78 82 Q86 88 94 82" stroke="#290916" stroke-width="3" fill="none"/>
                   <text x="116" y="64" fill="#bae6fd" font-family="monospace" font-weight="bold" font-size="16">Zzz...</text>`
                : `<circle cx="86" cy="80" r="6" fill="#fef08a" stroke="#290916" stroke-width="2"/>
                   <circle cx="86" cy="80" r="2.5" fill="#290916"/>
                   <!-- Gotinha no nariz -->
                   <path d="M52 106 Q48 118 53 120 Q58 118 54 106 Z" fill="#7dd3fc" stroke="#0284c7" stroke-width="1.5"/>`
            }
          </g>
        </svg>
      `;
    }
    // princesa
    const pMouth = mood === 'happy' ? 'M98 118 Q106 125 114 118' : 'M100 120 A5 5 0 1 0 110 120 A5 5 0 1 0 100 120'; // bola de chiclete!
    return `
      <svg viewBox="0 0 210 210" class="s2-cutout-svg">
        <g filter="drop-shadow(0 6px 0 rgba(35,4,18,0.65))">
          <path d="M48 204 L62 132 L78 118 L72 66 L88 42 L105 56 L122 42 L138 66 L132 118 L148 132 L162 204 Z" fill="#fff" stroke="#500724" stroke-width="4"/>
          <!-- Vestido/Roupão Rosa Cheio de Plumas -->
          <path d="M54 202 L68 136 L142 136 L156 202 Z" fill="#ec4899" stroke="#500724" stroke-width="3"/>
          <ellipse cx="105" cy="136" rx="40" ry="11" fill="#fbcfe8" stroke="#500724" stroke-width="2.5"/>
          <!-- Cabelão Loiro Pintado + Coroa Torta -->
          <path d="M72 74 C68 122 72 142 82 146 L128 146 C138 142 142 122 138 74 Z" fill="#fde047" stroke="#713f12" stroke-width="3"/>
          <polygon points="82,66 88,44 99,58 105,40 112,58 122,44 128,66" fill="#fbbf24" stroke="#713f12" stroke-width="2.5"/>
          <!-- Rosto Entediado + Óculos Fashion na Testa + Chiclete -->
          <ellipse cx="105" cy="98" rx="25" ry="28" fill="#fed7aa" stroke="#500724" stroke-width="2.5"/>
          <rect x="83" y="72" width="19" height="10" rx="4" fill="#db2777" stroke="#500724" stroke-width="2"/>
          <rect x="108" y="72" width="19" height="10" rx="4" fill="#db2777" stroke="#500724" stroke-width="2"/>
          <path d="M88 94 L98 94 M112 94 L122 94" stroke="#500724" stroke-width="3"/>
          <circle cx="93" cy="98" r="2.5" fill="#500724"/><circle cx="117" cy="98" r="2.5" fill="#500724"/>
          <path d="${pMouth}" fill="${mood === 'happy' ? 'none' : '#f472b6'}" stroke="#500724" stroke-width="2.5"/>
          <!-- Smartphone com Capinha de Strass na Mão -->
          <rect x="128" y="114" width="22" height="36" rx="4" fill="#09090b" stroke="#fde047" stroke-width="2.5" transform="rotate(10 128 114)"/>
        </g>
      </svg>
    `;
  }

  function renderCharacterCutout(actorId, mood = 'normal') {
    const pngPath = `/story2/chars/${actorId}_${mood}.png`;
    return `
      <div class="s2-cutout-wrap">
        <img
          src="${pngPath}"
          alt=""
          class="s2-cutout-png"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
        />
        <div class="s2-cutout-fallback" style="display:none;">
          ${renderFallbackActorSvg(actorId, mood)}
        </div>
      </div>
    `;
  }

  function renderMapAndInventory() {
    const mapEl = document.getElementById('s2-map-bar');
    const walEl = document.getElementById('s2-wallet');
    const invEl = document.getElementById('s2-inv-list');
    const clueEl = document.getElementById('s2-clue-tracker');

    if (walEl) walEl.textContent = `🪙 ${st.coins} Moedas`;

    if (mapEl) {
      mapEl.innerHTML = ROOMS_ORDER.map((r) => {
        const unlocked = st.unlockedRooms.has(r.id);
        const active = st.room === r.id;
        return `
          <button type="button" class="s2-map-btn ${active ? 'active' : ''}" data-goto="${r.id}" ${unlocked ? '' : 'disabled'}>
            <span class="s2-map-ico">${unlocked ? r.icon : '🔒'}</span><span class="s2-map-lbl"> ${r.short}</span>
          </button>
        `;
      }).join('');

      mapEl.querySelectorAll('[data-goto]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const target = btn.getAttribute('data-goto');
          if (target && st.unlockedRooms.has(target) && st.room !== target) {
            playCardboardCreak();
            st.actorMood = 'normal';
            document.getElementById('s2-stage-bubble')?.classList.remove('visible');
            st.room = target;
            renderRoom(true);
          }
        });
      });
    }

    if (invEl) {
      if (st.bag.length === 0) {
        invEl.innerHTML = `<div class="s2-inv-empty">Mochila vazia. Clique nos objetos do palco para coletar!</div>`;
      } else {
        invEl.innerHTML = st.bag
          .map((id) => {
            const it = ITEMS_DB[id];
            if (!it) return '';
            const sel = st.selectedItem === id;
            const dlBtn =
              id === 'negativo_02'
                ? `<a href="/story2/negativo_torre_02.png" download="negativo_torre_02.png" class="s2-dl-mini" onclick="event.stopPropagation();">⬇ Baixar .PNG</a>`
                : '';
            return `
              <div class="s2-inv-card ${sel ? 'selected' : ''}" data-pick-item="${id}">
                <div class="s2-inv-card-top">
                  <span>${it.icon} <strong>${it.name}</strong></span>
                  <span class="s2-inv-equip-tag">${sel ? '✋ NA MÃO' : 'Pegar'}</span>
                </div>
                <div class="s2-inv-card-desc">${it.desc}</div>
                ${dlBtn}
              </div>
            `;
          })
          .join('');

        invEl.querySelectorAll('[data-pick-item]').forEach((card) => {
          card.addEventListener('click', () => {
            playBeep();
            const id = card.getAttribute('data-pick-item');
            st.selectedItem = st.selectedItem === id ? null : id;
            renderMapAndInventory();
          });
        });
      }
    }

    if (clueEl) {
      const c1 = st.scriptRead ? '✅ Paris 1697 (7 Fadas // /1697)' : '⬜ Folha Rasgada nos Bastidores';
      const c2 = st.collarInspected ? '✅ Coleira do Dragão (#0x2F)' : '⬜ Placa na Coleira do Dragão';
      const c3 = st.negativeFound ? '✅ Negativo Escuro #02 (.PNG)' : '⬜ Varal da Câmara Escura';
      clueEl.innerHTML = `
        <div class="s2-clue-hdr">🔎 PISTAS DO LACRE II (${[st.scriptRead, st.collarInspected, st.negativeFound].filter(Boolean).length}/3)</div>
        <div>${c1}</div>
        <div>${c2}</div>
        <div>${c3}</div>
      `;
    }
  }

  // ---- MONTA O PALCO TEATRAL CLICÁVEL DE CADA CENÁRIO ----
  function renderInteractiveStageHtml(room) {
    // Cordas visíveis no teto segurando nuvens de papelão pintadas
    const hangingClouds = `
      <div class="s2-hanging-prop" style="left:11%; top:0;">
        <div class="s2-string"></div>
        <div class="s2-cardboard-cloud">☁️</div>
      </div>
      <div class="s2-hanging-prop" style="right:13%; top:0; animation-delay:-1.4s;">
        <div class="s2-string" style="height:26px;"></div>
        <div class="s2-cardboard-cloud">⭐</div>
      </div>
    `;

    if (room === 'tavern') {
      return `
        <div class="s2-stage-room s2-bg-tavern" style="--s2-scene:url('/story2/scenes/tavern.webp');">
          ${hangingClouds}
          <div class="s2-cardboard-sign">🍺 TAVERNA &amp; AÇAITERIA DO REI</div>

          <button type="button" class="s2-stage-prop" data-stage-act="mug" style="left:12%; bottom:26px;" title="Levantar Caneco Virado">
            <span class="s2-prop-emoji">${st.mugChecked ? '🫗' : '🍺'}</span>
            <span class="s2-prop-tag">${st.mugChecked ? 'Vazio' : 'Caneco Suspeito'}</span>
          </button>

          <div class="s2-actor-hitbox" id="s2-actor-slot" data-actor="bardo" data-stage-act="bard" style="left:36%; bottom:8px;" title="Falar com o Bardo">
            ${renderCharacterCutout('bardo', st.actorMood)}
          </div>

          <div class="s2-menu-board">
            <div class="s2-menu-hdr">TABELA DE PREÇOS</div>
            <button type="button" class="s2-menu-item" data-stage-act="buy_carrot" ${st.boughtCarrot ? 'disabled' : ''}>🥕 Cenoura Sindical <span>25🪙</span></button>
            <button type="button" class="s2-menu-item" data-stage-act="buy_acai" ${st.boughtAcai ? 'disabled' : ''}>🥣 Açaí 500ml Real <span>45🪙</span></button>
            <button type="button" class="s2-menu-item" data-stage-act="buy_ruler" ${st.boughtRuler ? 'disabled' : ''}>📏 Espada Faber 30cm <span>15🪙</span></button>
          </div>
        </div>
      `;
    }

    if (room === 'stable') {
      return `
        <div class="s2-stage-room s2-bg-stable" style="--s2-scene:url('/story2/scenes/stable.webp');">
          ${hangingClouds}
          <div class="s2-cardboard-sign warn">⚠️ SINDICATO DOS CORCÉIS — GREVE POR TEMPO INDETERMINADO</div>

          <div class="s2-actor-hitbox" id="s2-actor-slot" data-actor="cavalo" data-stage-act="horse" style="left:33%; bottom:6px;" title="Clicar no Corcel (ou usar item da mão)">
            ${renderCharacterCutout('cavalo', st.horseSigned && st.horseFed ? 'happy' : st.actorMood)}
          </div>

          <button type="button" class="s2-stage-prop" data-stage-act="saddlebag" style="right:14%; bottom:28px;" title="Vasculhar Alforje na Cerca">
            <span class="s2-prop-emoji">👜</span>
            <span class="s2-prop-tag">${st.saddleBagChecked ? 'Alforje Vazio' : 'Alforje na Cerca'}</span>
          </button>
        </div>
      `;
    }

    if (room === 'bridge') {
      return `
        <div class="s2-stage-room s2-bg-bridge" style="--s2-scene:url('/story2/scenes/bridge.webp');">
          ${hangingClouds}
          <div class="s2-cardboard-sign">💼 POSTO DE TRIAGEM — PEOPLE &amp; CULTURA</div>
          <div class="s2-actor-hitbox" id="s2-actor-slot" data-actor="troll" data-stage-act="troll" style="left:38%; bottom:6px;" title="Troll Sênior de RH">
            ${renderCharacterCutout('troll', st.rhPassed ? 'happy' : st.actorMood)}
          </div>
        </div>
      `;
    }

    if (room === 'backstage') {
      return `
        <div class="s2-stage-room s2-bg-backstage" style="--s2-scene:url('/story2/scenes/backstage.webp');">
          <div class="s2-red-darkroom-lamp">🔴 LUZ DE REVELAÇÃO</div>

          <button type="button" class="s2-stage-prop" data-stage-act="meds" style="left:14%; bottom:24px;">
            <span class="s2-prop-emoji">🧰</span>
            <span class="s2-prop-tag">${st.medBoxOpened ? 'Maleta Vazia' : 'Primeiros Socorros'}</span>
          </button>

          <button type="button" class="s2-stage-prop" data-stage-act="page1697" style="left:43%; bottom:26px;">
            <span class="s2-prop-emoji">📜</span>
            <span class="s2-prop-tag">Folha de 1697 ${st.scriptRead ? '✓' : ''}</span>
          </button>

          <button type="button" class="s2-stage-prop dark-neg" data-stage-act="negative" style="right:13%; top:54px;">
            <span class="s2-prop-emoji">🎞️</span>
            <span class="s2-prop-tag">Negativo #02 ${st.negativeFound ? '✓' : ''}</span>
          </button>
        </div>
      `;
    }

    if (room === 'dragon') {
      return `
        <div class="s2-stage-room s2-bg-dragon" style="--s2-scene:url('/story2/scenes/dragon.webp');">
          <button type="button" class="s2-stage-prop" data-stage-act="curtain" style="left:10%; top:38px;" ${st.curtainOpened ? 'disabled' : ''}>
            <span class="s2-prop-emoji">${st.curtainOpened ? '🪟' : ' drapes' ? '🧱' : '🪟'}</span>
            <span class="s2-prop-tag">${st.curtainOpened ? 'Janela Aberta ✓' : 'Cortina Empoada'}</span>
          </button>

          <div class="s2-actor-hitbox" id="s2-actor-slot" data-actor="dragao" data-stage-act="dragon" style="left:36%; bottom:6px;" title="Clicar no Dragão com item equipado">
            ${renderCharacterCutout('dragao', st.dragonAsleep ? 'happy' : st.actorMood)}
          </div>

          <button type="button" class="s2-stage-prop" data-stage-act="collar" style="right:13%; bottom:28px;">
            <span class="s2-prop-emoji">🏷️</span>
            <span class="s2-prop-tag">Coleira de Latão ${st.collarInspected ? '✓' : ''}</span>
          </button>
        </div>
      `;
    }

    if (room === 'elevator') {
      const volts = [110, 45, 75, 35];
      const curSum = st.breakers.reduce((acc, on, idx) => acc + (on ? volts[idx] : 0), 0);
      return `
        <div class="s2-stage-room s2-bg-elevator" style="--s2-scene:url('/story2/scenes/elevator.webp');">
          <div class="s2-cardboard-sign">${curSum === 220 ? '⚡ 220V ESTABILIZADO!' : `⚡ PAINEL AUXILIAR: ${curSum}V (META: 220V)`}</div>

          <div class="s2-breakers-box">
            ${volts
              .map(
                (v, i) => `
              <button type="button" class="s2-breaker-switch ${st.breakers[i] ? 'on' : ''}" data-stage-act="brk_${i}">
                <span class="s2-brk-v">${v}V</span>
                <span class="s2-brk-lever">${st.breakers[i] ? 'ON' : 'OFF'}</span>
              </button>
            `
              )
              .join('')}
          </div>

          <button type="button" class="s2-stage-prop" data-stage-act="badge_reader" style="right:16%; bottom:34px;">
            <span class="s2-prop-emoji">${st.elevatorUnlocked ? '🟢' : '🪪'}</span>
            <span class="s2-prop-tag">${st.elevatorUnlocked ? 'Elevador Aberto!' : 'Leitor de Crachá PJ'}</span>
          </button>
        </div>
      `;
    }

    // penthouse
    return `
      <div class="s2-stage-room s2-bg-penthouse" style="--s2-scene:url('/story2/scenes/penthouse.webp');">
        <div class="s2-cardboard-sign">👑 COBERTURA REAL // GRAVANDO STORIES AO VIVO</div>

        <div class="s2-ringlight-prop" style="left:16%; bottom:18px;">💡</div>

        <div class="s2-actor-hitbox" id="s2-actor-slot" data-actor="princesa" data-stage-act="princess" style="left:37%; bottom:6px;" title="Falar / Entregar Açaí pra Princesa">
          ${renderCharacterCutout('princesa', st.guardCleared ? 'happy' : st.actorMood)}
        </div>

        ${
          st.guardCleared
            ? `<button type="button" class="s2-stage-prop gold-book" data-stage-act="take_book" style="right:13%; bottom:28px;">
                 <span class="s2-prop-emoji">📕</span>
                 <span class="s2-prop-tag">Pegar Livro II!</span>
               </button>`
            : ''
        }
      </div>
    `;
  }

  function handleStageAction(act) {
    if (!act) return;

    // ---- TAVERNA ----
    if (act === 'mug') {
      playBeep();
      if (!st.mugChecked) {
        st.mugChecked = true;
        st.coins += 25;
        playToyFanfare(true);
        showStageBubble('Bardo', 'Ei! Essa gorjeta de 25 moedas era minha... ah, tanto faz, nem recebo comissão.', 'angry');
        narratorThenLog(
          'Debaixo do caneco virado havia +25 moedas esquecidas pelo último figurante!',
          null,
          'action'
        );
        renderRoom(false);
      } else {
        showStageBubble('Bardo', 'Já limpou o balcão todo, mão-leve.', 'normal');
      }
      return;
    }

    if (act === 'bard') {
      playBeep();
      showStageBubble('Bardo', 'O Corcel ali fora exige acordo assinado + cenoura. E a Princesa só abre a porta se levar Açaí!', 'normal');
      narratorThenLog(
        'O Bardo afina o alaúde colado com fita crepe e aponta para a saída do Estábulo.',
        null,
        'action'
      );
      return;
    }

    if (act === 'buy_carrot') {
      playBeep();
      if (st.coins < 25) {
        showStageBubble('Bardo', 'Sem fiado! Levanta aquele caneco ali no canto se tiver duro.', 'angry');
        return;
      }
      st.coins -= 25;
      st.boughtCarrot = true;
      addItem('cenoura');
      playToyFanfare(true);
      showStageBubble('Bardo', 'Uma Cenoura com selo sindical saindo!', 'happy');
      renderRoom(false);
      return;
    }

    if (act === 'buy_acai') {
      playBeep();
      if (st.coins < 45) {
        showStageBubble('Bardo', 'Faltam moedas pro Açaí! Vasculha o caneco aqui ou o alforje lá no Estábulo!', 'angry');
        return;
      }
      st.coins -= 45;
      st.boughtAcai = true;
      addItem('acai');
      playToyFanfare(true);
      showStageBubble('Bardo', 'Caprichei no Leite Ninho! Não deixa entornar na escada.', 'happy');
      narratorThenLog(
        'Você guardou o Açaí 500ml no Alforje.',
        null,
        'action'
      );
      renderRoom(false);
      return;
    }

    if (act === 'buy_ruler') {
      playBeep();
      if (st.coins < 15) return;
      st.coins -= 15;
      st.boughtRuler = true;
      addItem('regua');
      showStageBubble('Bardo', 'Cuidado pra não quebrar a ponta do 30cm, herói!', 'happy');
      narratorThenLog(
        'Você comprou a Espada Faber 30cm pintada de prata.',
        null,
        'action'
      );
      renderRoom(false);
      return;
    }

    // ---- ESTÁBULO ----
    if (act === 'saddlebag') {
      playBeep();
      if (!st.saddleBagChecked) {
        st.saddleBagChecked = true;
        st.coins += 15;
        addItem('termo_clt');
        playToyFanfare(true);
        showStageBubble('Corcel', 'Achou a minuta do Acordo aí? Equipa ela na mão e traz aqui pra eu carimbar o casco!', 'normal');
        narratorThenLog(
          'No alforje da cerca havia um Acordo de Hora-Galope e +15 moedas!',
          null,
          'action'
        );
        renderRoom(false);
      } else {
        sayNarrator('O alforje da cerca já foi vasculhado.');
      }
      return;
    }

    if (act === 'horse') {
      playBeep();
      if (st.selectedItem === 'termo_clt' && !st.horseSigned) {
        st.horseSigned = true;
        st.selectedItem = null;
        playToyFanfare(true);
        showStageBubble('Corcel', 'Contrato assinado! Agora equipa minha Cenoura Orgânica na mão e manda pra cá!', 'happy');
        renderRoom(false);
        return;
      }
      if (st.selectedItem === 'cenoura' && !st.horseFed) {
        st.horseFed = true;
        st.selectedItem = null;
        playToyFanfare(true);
        showStageBubble(
          'Corcel',
          st.horseSigned ? 'Crocante! Pauta 100% atendida, bora galopar até a Ponte!' : 'Boa cenoura! Falta só o Acordo de Hora-Galope ali no alforje da cerca!',
          'happy'
        );
        renderRoom(false);
        return;
      }
      if (st.selectedItem === 'regua') {
        playToyFanfare(false);
        showStageBubble('Corcel', 'Tá me ameaçando com material escolar, patrão?! Vou chamar o ministério!', 'angry');
        return;
      }
      if (st.horseSigned && st.horseFed) {
        st.unlockedRooms.add('bridge');
        st.room = 'bridge';
        playToyFanfare(true);
        narratorThenLog(
          'POCOTÓ! O Corcel te leva em trote sindicalizado até a Ponte Levadiça de RH!',
          null,
          'urgent'
        );
        renderRoom(true);
        return;
      }
      const pend = [];
      if (!st.horseSigned) pend.push('📋 Acordo de Hora-Galope');
      if (!st.horseFed) pend.push('🥕 Cenoura Orgânica');
      showStageBubble('Corcel', `Nada de carona no grito! Equipe na mochila à direita e me entregue: ${pend.join(' + ')}.`, 'angry');
      return;
    }

    if (act === 'troll') {
      playBeep();
      showStageBubble(
        'Troll de RH',
        st.rhPassed ? 'Você já tem nosso Fit Cultural no sangue! Siga para os Bastidores ou para o Covil!' : 'Responda nosso quiz comportamental abaixo com bastante brilho no olho!',
        st.rhPassed ? 'happy' : 'normal'
      );
      return;
    }

    // ---- BASTIDORES ----
    if (act === 'meds') {
      playBeep();
      if (!st.medBoxOpened) {
        st.medBoxOpened = true;
        addItem('lenco');
        addItem('neosoro');
        playToyFanfare(true);
        narratorThenLog(
          'Você pegou Lenços Anti-Pó e o Descongestionante Dracônico na maleta médica!',
          null,
          'action'
        );
        renderRoom(false);
      } else {
        sayNarrator('A maleta médica já está vazia.');
      }
      return;
    }

    if (act === 'page1697') {
      playBeep();
      st.scriptRead = true;
      addItem('roteiro_1697');
      renderMapAndInventory();
      const sub = document.getElementById('s2-subpanel');
      if (sub) {
        sub.innerHTML = `
          <div class="s2-doc-callout">
            <strong>📜 FOLHA RASGADA — PARIS, 1697 (Charles Perrault):</strong><br/>
            <em>"Em 'La Belle au bois dormant', foram postos sete estojos de ouro maciço para as <strong>SETE fadas boas</strong> convidadas ao batizado — antes que a oitava amaldiçoasse o fuso."</em><br/>
            <span style="font-family:monospace; font-size:11.5px; color:#831843;">[Rabisco à caneta na margem: "arquivo arquivado sob a rota <strong>/1697</strong>"]</span>
          </div>
        `;
      }
      narratorThenLog(
        'Você guardou a página francesa de 1697 no Alforje (repare no rabisco "/1697" na margem!).',
        null,
        'action'
      );
      return;
    }

    if (act === 'negative') {
      playBeep();
      st.negativeFound = true;
      addItem('negativo_02');
      playToyFanfare(true);
      renderMapAndInventory();
      const sub = document.getElementById('s2-subpanel');
      if (sub) {
        sub.innerHTML = `
          <div class="s2-doc-callout" style="background:#120810; color:#fda4af; border-color:#f43f5e;">
            <div style="display:flex; gap:14px; align-items:center; flex-wrap:wrap;">
              <img src="/story2/negativo_torre_02.png" alt="Negativo #02" style="width:128px; height:72px; border:2px solid #f43f5e; background:#000;" />
              <div style="flex:1; min-width:220px;">
                <strong>🎞️ NEGATIVO SUBEXPOSTO #02 COLETADO!</strong><br/>
                Parece um quadro 100% preto a olho nu, mas esconde <strong>duas camadas reais fora do navegador</strong> (no brilho da imagem E nos bytes do Bloco de Notas).<br/>
                <a href="/story2/negativo_torre_02.png" download="negativo_torre_02.png" class="s2-dl-big">⬇ Baixar negativo_torre_02.png no PC</a>
              </div>
            </div>
          </div>
        `;
      }
      narratorThenLog(
        'Você recolheu a chapa escura negativo_torre_02.png do varal de revelação!',
        'pera... isso aí não é cenário de papelão não. é um arquivo de verdade. quem pendura um .png num varal dentro de um livro??',
        'urgent'
      );
      return;
    }

    // ---- DRAGÃO ----
    if (act === 'curtain') {
      playCardboardCreak();
      st.curtainOpened = true;
      st.dustLevel = Math.max(0, st.dustLevel - 45);
      showStageBubble('Dragão', '*SNIF*... ufa, entrou um ventinho fresco na masmorra!', 'normal');
      narratorThenLog(
        'Você abriu a cortina mofada! Metade da nuvem de poeira saiu pela janela.',
        null,
        'action'
      );
      renderRoom(false);
      return;
    }

    if (act === 'dragon') {
      if (st.dragonAsleep) {
        showStageBubble('Dragão', 'Zzzzz... *ronco desentupido*...', 'happy');
        return;
      }
      if (st.selectedItem === 'lenco') {
        playBeep();
        st.dustLevel = Math.max(0, st.dustLevel - 45);
        st.selectedItem = null;
        showStageBubble(
          'Dragão',
          st.dustLevel === 0 ? 'Limpou tudo! Agora pinga aquele descongestionante mágico aqui!' : 'Ainda tá vindo ácaro daquela cortina fechada ali atrás!',
          'normal'
        );
        renderRoom(false);
        return;
      }
      if (st.selectedItem === 'neosoro') {
        if (st.dustLevel > 0) {
          playSneezeBurst();
          showStageBubble('Dragão', 'ATCHIMMM!! Com essa poeira toda no ar eu espirro o remédio longe!!', 'angry');
          return;
        }
        st.dragonAllergy = 0;
        st.dragonAsleep = true;
        st.selectedItem = null;
        st.unlockedRooms.add('elevator');
        playToyFanfare(true);
        showStageBubble('Dragão', 'SNIFFFF... ahhh, respirando em HD! Vou tirar um cochilo... Zzz...', 'happy');
        narratorThenLog(
          'O Dragão apagou num sono sereno, liberando a passagem para a Casa de Máquinas!',
          null,
          'urgent'
        );
        renderRoom(false);
        return;
      }
      if (st.selectedItem === 'regua') {
        playSneezeBurst();
        st.dustLevel = Math.min(100, st.dustLevel + 20);
        showStageBubble('Dragão', 'AI!! Para de bater na minha escama com régua escolar, levantou mais pó!!', 'angry');
        renderRoom(false);
        return;
      }
      showStageBubble('Dragão', '*ATCHIM!* Equipe o Lenço ou o Descongestionante na mochila à direita antes de clicar em mim!', 'angry');
      return;
    }

    if (act === 'collar') {
      playBeep();
      if (!st.dragonAsleep) {
        playSneezeBurst();
        showStageBubble('Dragão', 'ATCHIM!! Sai de perto do meu pescoço enquanto tô em crise!', 'angry');
        return;
      }
      st.collarInspected = true;
      addItem('placa_hex');
      renderMapAndInventory();
      const sub = document.getElementById('s2-subpanel');
      if (sub) {
        sub.innerHTML = `
          <div class="s2-doc-callout">
            <strong>🏷️ COLEIRA DE LATÃO DO DRAGÃO:</strong><br/>
            <code>UNIDADE MECÂNICA DE SOPRO — LOTE #0x2F // TENSÃO DO ELEVADOR: 220V EXATOS</code>
          </div>
        `;
      }
      narratorThenLog(
        'Na coleira de latão está gravado em hexadecimal: LOTE #0x2F e Tensão 220V.',
        null,
        'action'
      );
      return;
    }

    // ---- CASA DE MÁQUINAS ----
    if (act.startsWith('brk_')) {
      playBeep();
      const idx = Number(act.split('_')[1]);
      const volts = [110, 45, 75, 35];
      st.breakers[idx] = !st.breakers[idx];
      const sum = st.breakers.reduce((acc, on, k) => acc + (on ? volts[k] : 0), 0);
      if (sum === 220) {
        playToyFanfare(true);
        sayNarrator('CLACK! Tensão estabilizada em exatos 220V! Agora equipe o Crachá PJ na mão e clique no Leitor.');
      }
      renderRoom(false);
      return;
    }

    if (act === 'badge_reader') {
      playBeep();
      const volts = [110, 45, 75, 35];
      const curSum = st.breakers.reduce((acc, on, k) => acc + (on ? volts[k] : 0), 0);
      if (curSum !== 220) {
        playToyFanfare(false);
        sayNarrator(`Leitor sem energia correta (${curSum}V). Ligue apenas as chaves que somam exatos 220V!`);
        return;
      }
      if (!st.elevatorUnlocked && st.selectedItem !== 'cracha_rh') {
        sayNarrator('Equipe o 🪪 Crachá "Herói PJ" na mão (no Alforje à direita) e clique no leitor!');
        return;
      }
      st.elevatorUnlocked = true;
      st.selectedItem = null;
      st.unlockedRooms.add('penthouse');
      playToyFanfare(true);
      narratorThenLog(
        'DING! Portas do elevador destravadas para a Cobertura Real!',
        null,
        'action'
      );
      renderRoom(false);
      return;
    }

    // ---- COBERTURA DA PRINCESA ----
    if (act === 'princess') {
      playBeep();
      if (st.guardCleared) {
        showStageBubble('Princesa', 'Já dei 5 estrelas no app, querido! Pega logo aquele Livro II empoeirado ali no canto e fecha a porta!', 'happy');
        return;
      }
      if (!hasItem('acai')) {
        showStageBubble('Princesa', 'Oi?? Subiu na minha torre sem o Açaí 500ml?! Volta lá na Taverna pelo mapa acima e traz!', 'angry');
        return;
      }
      if (st.selectedItem !== 'acai') {
        showStageBubble('Princesa', 'Tô vendo o copo na tua mochila! Clique no 🥣 Açaí ali na direita pra segurar na mão e me entregar!', 'normal');
        return;
      }
      st.guardCleared = true;
      st.selectedItem = null;
      playToyFanfare(true);
      showStageBubble('Princesa', 'Até que enfim! Não vou casar com entregador PJ, mas pode levar aquele Livro II brega ali do pufe!', 'happy');
      narratorThenLog(
        'A Princesa pega o Açaí, volta pros stories e libera o Livro II sobre o pufe!',
        'mano kkkkkkk a jornada épica inteira era um frete de açaí sem gorjeta. pega esse livro e vamo vazar.',
        'urgent'
      );
      renderRoom(false);
      return;
    }

    if (act === 'take_book') {
      playBeep();
      isAlive = false;
      scrollSeq++;
      if (bubbleTimer) clearTimeout(bubbleTimer);
      finishStory();
    }
  }

  function renderRoom(announceArrival = false) {
    renderMapAndInventory();

    const hdr = document.getElementById('s2-room-header');
    const canvas = document.getElementById('s2-scene-canvas');
    const spots = document.getElementById('s2-hotspots-bar');
    const sub = document.getElementById('s2-subpanel');
    if (!hdr || !canvas || !spots || !sub) return;

    canvas.innerHTML = renderInteractiveStageHtml(st.room);
    sub.innerHTML = '';

    // Bind de todos os objetos/personagens clicáveis direto dentro do palco!
    canvas.querySelectorAll('[data-stage-act]').forEach((el) => {
      el.addEventListener('click', () => handleStageAction(el.getAttribute('data-stage-act')));
    });

    if (st.room === 'tavern') {
      hdr.innerHTML = `<span>🍺 PALCO 1 — TAVERNA DE COMPENSADO</span><span>Clique nos itens/personagem no palco!</span>`;
      if (announceArrival) sayNarrator('O Bardo boceja encostado no balcão de madeira compensada presa com fita crepe.');
      spots.innerHTML = `
        <button type="button" class="s2-spot-btn" data-bar-act="mug">🍺 Olhar Caneco ${st.mugChecked ? '✓' : ''}</button>
        <button type="button" class="s2-spot-btn" data-bar-act="bard">🎭 Falar com Bardo</button>
        <button type="button" class="s2-spot-btn" id="s2-goto-stable">🐴 Ir ao Estábulo ➡️</button>
      `;
      document.getElementById('s2-goto-stable')?.addEventListener('click', () => {
        playCardboardCreak();
        st.room = 'stable';
        renderRoom(true);
      });
    } else if (st.room === 'stable') {
      hdr.innerHTML = `<span>🐴 PALCO 2 — ESTÁBULO SINDICALIZADO</span><span>${st.horseSigned && st.horseFed ? '✅ Greve Encerrada' : '⚠️ Greve Ativa'}</span>`;
      if (announceArrival) sayNarrator('O Corcel de colete amarelo cruza os cascos em frente à faixa sindical.');
      spots.innerHTML = `
        <button type="button" class="s2-spot-btn" data-bar-act="saddlebag">👜 Vasculhar Alforje ${st.saddleBagChecked ? '✓' : ''}</button>
        <button type="button" class="s2-spot-btn" data-bar-act="horse">${st.horseSigned && st.horseFed ? '🏇 Galopar até a Ponte RH ➡️' : '🐴 Entregar Item / Falar com Corcel'}</button>
      `;
    } else if (st.room === 'bridge') {
      hdr.innerHTML = `<span>💼 PALCO 3 — PONTE DO TROLL SÊNIOR DE RH</span><span>${st.rhPassed ? '✅ Aprovado no Fit Cultural' : 'Entrevista Eliminatória'}</span>`;
      const RH_ROUNDS = [
        {
          q: '1/3 — "Aqui no Reino somos uma família! Se o Dragão incendiar sua folga no domingo às 23h, qual seu mindset?"',
          opts: [
            { txt: '"Visto a armadura da empresa com brilho no olho porque crise é oportunidade!"', ok: true },
            { txt: '"Desligo o pombo-correio e só visualizo na segunda às 9h."', ok: false },
            { txt: '"Processo o Reino no Ministério Público Medieval."', ok: false },
          ],
        },
        {
          q: '2/3 — "Se você fosse um objeto da masmorra real, qual seria para gerar sinergia no squad?"',
          opts: [
            { txt: '"Uma guilhotina, pra cortar dinâmica de RH."', ok: false },
            { txt: '"Uma tocha resiliente que ilumina os KPIs do time mesmo na umidade!"', ok: true },
            { txt: '"Um balde furado."', ok: false },
          ],
        },
        {
          q: '3/3 — "Sobre bolsa-auxílio: pagamos 100% em aprendizado exponencial e café frio. Topa o desafio?"',
          opts: [
            { txt: '"Com certeza! Propósito vale muito mais que ouro!"', ok: true },
            { txt: '"Nem ferrando, cadê o pagamento?"', ok: false },
          ],
        },
      ];

      if (!st.rhPassed) {
        spots.innerHTML = '';
        const cur = RH_ROUNDS[st.rhStep];
        sub.innerHTML = `
          <div class="s2-quiz-box">
            <div class="s2-quiz-q">${cur.q}</div>
            <div class="s2-quiz-opts">
              ${cur.opts.map((o) => `<button type="button" class="s2-quiz-btn" data-rh-ok="${o.ok}">${o.txt}</button>`).join('')}
            </div>
          </div>
        `;
        sub.querySelectorAll('.s2-quiz-btn').forEach((b) => {
          b.addEventListener('click', () => {
            playBeep();
            if (b.getAttribute('data-rh-ok') === 'true') {
              st.rhStep += 1;
              if (st.rhStep >= RH_ROUNDS.length) {
                st.rhPassed = true;
                addItem('cracha_rh');
                st.unlockedRooms.add('backstage');
                st.unlockedRooms.add('dragon');
                playToyFanfare(true);
                showStageBubble('Troll de RH', 'UAU, arrepiei! Match cultural de 100%! Toma teu Crachá PJ!', 'happy');
                narratorThenLog(
                  'Aprovado! Você recebeu o Crachá "Herói PJ" e liberou os Bastidores e o Covil do Dragão!',
                  null,
                  'urgent'
                );
              } else {
                showStageBubble('Troll de RH', 'Adorei a proatividade! Anotado no assessment, próxima pergunta...', 'happy');
              }
              renderRoom(false);
            } else {
              st.rhStep = 0;
              playToyFanfare(false);
              showStageBubble('Troll de RH', 'Eita, senti uma energia meio desalinhada aos nossos valores... Voltando à 1ª pergunta!', 'angry');
              if (!(triggerRisadaVoiceReaction && triggerRisadaVoiceReaction({ cooldownMs: 50000 }))) {
                setOperatorRemark('foi sincero na entrevista de RH e tomou fumo na hora kkkkk mente pô!', { priority: 'action' });
              }
              renderRoom(false);
            }
          });
        });
      } else {
        spots.innerHTML = `
          <button type="button" class="s2-spot-btn" id="s2-b-go-back">🎞️ Explorar Bastidores &amp; Câmara Escura ➡️</button>
          <button type="button" class="s2-spot-btn" id="s2-b-go-drag">🐉 Ir ao Covil do Dragão ➡️</button>
        `;
        document.getElementById('s2-b-go-back')?.addEventListener('click', () => {
          playCardboardCreak();
          st.room = 'backstage';
          renderRoom(true);
        });
        document.getElementById('s2-b-go-drag')?.addEventListener('click', () => {
          playCardboardCreak();
          st.room = 'dragon';
          renderRoom(true);
        });
      }
    } else if (st.room === 'backstage') {
      hdr.innerHTML = `<span>🎞️ PALCO 4 — BASTIDORES &amp; CÂMARA ESCURA</span><span>Vasculhe os 3 itens no palco!</span>`;
      if (announceArrival) sayNarrator('Atrás das torres de papelão há escoras de madeira, uma maleta médica e um varal de revelação fotográfica.');
      spots.innerHTML = `
        <button type="button" class="s2-spot-btn" data-bar-act="meds">🧰 Maleta Médica ${st.medBoxOpened ? '✓' : ''}</button>
        <button type="button" class="s2-spot-btn" data-bar-act="page1697">📜 Folha de 1697 ${st.scriptRead ? '✓' : ''}</button>
        <button type="button" class="s2-spot-btn" data-bar-act="negative">🎞️ Negativo #02 ${st.negativeFound ? '✓' : ''}</button>
        <button type="button" class="s2-spot-btn" id="s2-bs-dragon">🐉 Seguir pro Dragão ➡️</button>
      `;
      document.getElementById('s2-bs-dragon')?.addEventListener('click', () => {
        playCardboardCreak();
        st.room = 'dragon';
        renderRoom(true);
      });
    } else if (st.room === 'dragon') {
      hdr.innerHTML = `<span>🐉 PALCO 5 — COVIL DO DRAGÃO ASMÁTICO</span><span>Poeira no Ar: ${st.dustLevel}%</span>`;
      if (announceArrival) sayNarrator(st.dragonAsleep ? 'O Dragão dorme aliviado no meio do palco.' : 'O Dragão funga alto com uma bolsa de gelo na cabeça!');
      spots.innerHTML = `
        <button type="button" class="s2-spot-btn" data-bar-act="curtain" ${st.curtainOpened ? 'disabled' : ''}>🪟 Abrir Cortina (-45% Pó)</button>
        <button type="button" class="s2-spot-btn" data-bar-act="dragon">🐉 Usar Item no Dragão</button>
        <button type="button" class="s2-spot-btn" data-bar-act="collar">🏷️ Ler Coleira #0x2F ${st.collarInspected ? '✓' : ''}</button>
        ${st.dragonAsleep ? `<button type="button" class="s2-spot-btn" id="s2-dr-elev">⚡ Casa de Máquinas ➡️</button>` : ''}
      `;
      document.getElementById('s2-dr-elev')?.addEventListener('click', () => {
        playCardboardCreak();
        st.room = 'elevator';
        renderRoom(true);
      });
    } else if (st.room === 'elevator') {
      const volts = [110, 45, 75, 35];
      const curSum = st.breakers.reduce((acc, on, k) => acc + (on ? volts[k] : 0), 0);
      hdr.innerHTML = `<span>⚡ PALCO 6 — CASA DE MÁQUINAS DO ELEVADOR</span><span>Soma Atual: ${curSum}V / 220V</span>`;
      if (announceArrival) sayNarrator('Clique nas alavancas no palco para cravar 220V e passe o Crachá PJ no leitor!');
      spots.innerHTML = `
        <button type="button" class="s2-spot-btn" data-bar-act="badge_reader">🪪 Passar Crachá PJ no Leitor</button>
        ${st.elevatorUnlocked ? `<button type="button" class="s2-spot-btn" id="s2-el-top">👑 Subir à Cobertura Real ➡️</button>` : ''}
      `;
      document.getElementById('s2-el-top')?.addEventListener('click', () => {
        playCardboardCreak();
        st.room = 'penthouse';
        renderRoom(true);
      });
    } else if (st.room === 'penthouse') {
      hdr.innerHTML = `<span>👑 PALCO 7 — COBERTURA DA PRINCESA DE PLÁSTICO</span><span>Topo da Torre</span>`;
      if (announceArrival) sayNarrator('A Princesa masca chiclete em frente ao ring light esperando o delivery.');
      const missingClues = !st.scriptRead || !st.collarInspected || !st.negativeFound;
      if (missingClues) {
        sub.innerHTML = `
          <div class="s2-doc-callout" style="border-color:#b45309; background:#fffbeb; color:#78350f;">
            ⚠️ <strong>Atenção antes de sair:</strong> Faltam pistas importantes pra resolver o Lacre do Livro II (${!st.scriptRead ? '[Folha 1697 nos Bastidores] ' : ''}${!st.negativeFound ? '[Negativo #02 nos Bastidores] ' : ''}${!st.collarInspected ? '[Coleira #0x2F no Dragão]' : ''}). Você pode voltar pelo mapa acima!
          </div>
        `;
      }
      spots.innerHTML = !st.guardCleared
        ? `<button type="button" class="s2-spot-btn" data-bar-act="princess">🥣 Entregar Açaí pra Princesa (Segurar na Mão)</button>`
        : `<button type="button" class="s2-spot-btn" data-bar-act="take_book" style="background:#be185d; color:#fff; border-color:#fde047;">📕 Pegar Livro II e Voltar pra Caverna</button>`;
    }

    spots.querySelectorAll('[data-bar-act]').forEach((b) => {
      b.addEventListener('click', () => handleStageAction(b.getAttribute('data-bar-act')));
    });
  }

  // Verifica se já existe clipe de voz de entrada do Conto 2 (`/voices/story2_entrada.mp3`), senão usa texto + eco!
  renderRoom(false);
  fetch('/voices/story2_entrada.mp3', { method: 'HEAD' })
    .then((r) => r.ok && (r.headers.get('content-type') || '').includes('audio'))
    .catch(() => false)
    .then(async (hasVoice) => {
      if (!isAlive) return;
      // Regra: o narrador do conto termina primeiro, ~650ms de respiro, e só então o `log` mete o bedelho
      await sayNarrator('As cortinas se abrem no Reino de Compensado! Clique diretamente nos personagens e objetos no palco (ou use o Alforje à direita).');
      await new Promise((r) => setTimeout(r, 650));
      {
        if (!isAlive) return;
        if (hasVoice) {
          // Cravado no envelope real do story2_entrada.mp3 (7.16s): 0.06 "puta merda" → 0.80 "agora é" → 1.46 "teatrinho..." → 4.68 "vê se..."
          setOperatorRemark('puta merda, agora é teatrinho de papelão colado com fita crepe?! vê se não demora nessa bosta rosa, mano.', {
            priority: 'urgent',
            delayBefore: 120,
            voiceUrl: '/voices/story2_entrada.mp3',
            steps: [
              { pause: 60 },
              { text: 'puta merda, ', durationMs: 580 },
              { pause: 160 },
              { text: 'agora é ', durationMs: 420 },
              { pause: 240 },
              { text: 'teatrinho de papelão colado com fita crepe?! ', durationMs: 2740 },
              { pause: 480 },
              { text: 'vê se não demora nessa bosta rosa, mano.', durationMs: 2020 },
            ],
          });
        } else {
          setOperatorRemark(
            'puta merda, saímos duma guarita gelada direto pra um teatrinho de papelão colado com fita crepe?! vê se acha logo o livro dessa bosta rosa.',
            { priority: 'urgent' }
          );
        }
      }
    });
}
