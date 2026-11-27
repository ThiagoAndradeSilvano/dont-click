// ============================================================================
// CONTO 2: A PRINCESA DE PLÁSTICO — O REINO DOS BASTIDORES DE PAPELÃO (RPG POINT & CLICK COMPLETO!)
// Mundo interativo com Mapa de 7 Cenários conectados, Mochila Usável, Cenas Ilustradas em SVG Rico,
// Som Sintetizado Dedicado, Pergaminho Narrador vs `log` Ácido no Topo, e Pistas Cruzadas para o
// Enigma Nível "Don't Believe His Lies" (Negativo Esteganográfico + Bytes no Bloco de Notas + Hex + 1697)!
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
  if (resetIdleChillTimer) resetIdleChillTimer();

  let isAlive = true;
  let scrollSeq = 0;

  // ---- ÁUDIO SINTÉTICO PRÓPRIO DO REINO DE PLÁSTICO (Web Audio API) ----
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
      g.gain.setValueAtTime(0.09, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.17);
    });
  }

  function playSneezeBurst() {
    const ctx = getAudio();
    if (!ctx) return;
    const dur = 0.28;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.09));
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 950;
    const g = ctx.createGain();
    g.gain.value = 0.22;
    src.connect(bp);
    bp.connect(g);
    g.connect(ctx.destination);
    src.start();
  }

  // ---- ESTADO COMPLETO DO AVENTUREIRO NO CONTO 2 ----
  const st = {
    room: 'tavern', // 'tavern' | 'stable' | 'bridge' | 'backstage' | 'dragon' | 'elevator' | 'penthouse'
    unlockedRooms: new Set(['tavern', 'stable']),
    coins: 60,
    selectedItem: null,
    bag: [], // { id, icon, name, desc }

    // Taverna
    mugChecked: false,
    bardTalked: false,
    boughtCarrot: false,
    boughtAcai: false,
    boughtRuler: false,

    // Estábulo
    horseSigned: false,
    horseFed: false,
    saddleBagChecked: false,

    // Ponte do Troll de RH
    rhPassed: false,
    rhStep: 0,
    trollAnswers: [],

    // Bastidores de Papelão (Câmara Escura & Farmácia)
    medBoxOpened: false,
    scriptRead: false, // Pista C = 7 fadas boas (Perrault 1697)
    negativeFound: false,

    // Covil do Dragão Asmático
    curtainOpened: false,
    dustLevel: 90,
    dragonAllergy: 100,
    dragonAsleep: false,
    collarInspected: false, // Pista B = 0x2F (47 em decimal!)

    // Elevador Técnico da Torre (Enigma de Disjuntores 220V + Painel)
    breakers: [false, true, false, false], // meta: somar exatamente 220V -> [110, 0, 75, 35] => ON, OFF, ON, ON!
    elevatorPowered: false,
    elevatorUnlocked: false,

    // Cobertura Real (Princesa Influencer)
    guardCleared: false,
    princessSpoken: false,
  };

  const ITEMS_DB = {
    moeda_extra: { id: 'moeda_extra', icon: '🪙', name: 'Vale-Troco', desc: 'Moedas esquecidas debaixo do caneco.' },
    regua: { id: 'regua', icon: '📏', name: 'Espada Faber 30cm', desc: 'Régua escolar acrílica pintada com spray prateado.' },
    cenoura: { id: 'cenoura', icon: '🥕', name: 'Cenoura Orgânica', desc: 'Exigência nº 1 da Convenção Coletiva dos Corcéis.' },
    termo_clt: { id: 'termo_clt', icon: '📋', name: 'Acordo de Hora-Galope', desc: 'Formulário sindical encontrado no alforje do estábulo.' },
    acai: { id: 'acai', icon: '🥣', name: 'Açaí 500ml c/ Leite Ninho', desc: 'Sem isso ninguém pisa no tapete da Princesa.' },
    cracha_rh: { id: 'cracha_rh', icon: '🪪', name: 'Crachá "Herói PJ"', desc: 'Aprovado no Fit Cultural do Troll Sênior de People.' },
    lenco: { id: 'lenco', icon: '🧻', name: 'Lenço Anti-Pó', desc: 'Remove ácaro cenográfico acumulado desde 1998.' },
    neosoro: { id: 'neosoro', icon: '💧', name: 'Descongestionante Dracônico', desc: 'Cloridrato de nafazolina pra narina soltadora de brasa.' },
    roteiro_1697: {
      id: 'roteiro_1697',
      icon: '📜',
      name: 'Página Francesa (1697)',
      desc: 'Edição de Perrault: "Sete fadas boas foram convidadas ao batizado (não três!)."',
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
      desc: 'Foto quase 100% preta achada nos bastidores. Clique em Baixar para investigar no PC!',
    },
  };

  function hasItem(id) {
    return st.bag.includes(id);
  }
  function addItem(id) {
    if (!st.bag.includes(id)) st.bag.push(id);
  }

  const ROOMS_ORDER = [
    { id: 'tavern', short: '1. Taverna', icon: '🍺' },
    { id: 'stable', short: '2. Estábulo', icon: '🐴' },
    { id: 'bridge', short: '3. Ponte RH', icon: '💼' },
    { id: 'backstage', short: '4. Bastidores', icon: '📦' },
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
        <div class="s2-wallet" id="s2-wallet">🪙 60 Plásticos</div>
      </div>

      <div class="s2-main-grid">
        <div class="s2-stage-panel">
          <div class="s2-room-header" id="s2-room-header"></div>
          <div class="s2-scene-canvas" id="s2-scene-canvas"></div>
          <div class="s2-hotspots-bar" id="s2-hotspots-bar"></div>
          <div class="s2-subpanel" id="s2-subpanel"></div>
        </div>

        <aside class="s2-side-inv">
          <div class="s2-inv-hdr">🎒 ALFORJE DE PLÁSTICO</div>
          <div class="s2-inv-hint">Clique num item para <strong>equipar na mão</strong> antes de interagir com o cenário!</div>
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
    returnToCave(caveState);
  });

  async function sayNarrator(text) {
    const mySeq = ++scrollSeq;
    const el = document.getElementById('story-npc-msg');
    if (!el) return;
    el.textContent = '';
    for (let i = 0; i < text.length; i++) {
      if (!isAlive || mySeq !== scrollSeq) return;
      el.textContent += text[i];
      await new Promise((r) => setTimeout(r, 13));
    }
  }

  async function narratorThenLog(narText, logText = null, priority = 'action') {
    const expected = scrollSeq + 1;
    await sayNarrator(narText);
    if (!isAlive || expected !== scrollSeq || !logText) return;
    await new Promise((r) => setTimeout(r, 550));
    if (!isAlive || expected !== scrollSeq) return;
    setOperatorRemark(logText, { priority });
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
            ${unlocked ? r.icon : '🔒'} ${r.short}
          </button>
        `;
      }).join('');

      mapEl.querySelectorAll('[data-goto]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const target = btn.getAttribute('data-goto');
          if (target && st.unlockedRooms.has(target) && st.room !== target) {
            playBeep();
            st.room = target;
            renderRoom(true);
          }
        });
      });
    }

    if (invEl) {
      if (st.bag.length === 0) {
        invEl.innerHTML = `<div class="s2-inv-empty">Nenhum item ainda. Vasculhe os cenários!</div>`;
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
                  <span class="s2-inv-equip-tag">${sel ? 'NA MÃO' : 'Usar'}</span>
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
      const c1 = st.scriptRead ? '✅ Folha de 1697 (Fadas Boas = 7)' : '⬜ Folha Rasgada nos Bastidores';
      const c2 = st.collarInspected ? '✅ Placa da Coleira (#0x2F)' : '⬜ Coleira do Dragão';
      const c3 = st.negativeFound ? '✅ Negativo Escuro #02 (.PNG)' : '⬜ Câmara Escura dos Bastidores';
      clueEl.innerHTML = `
        <div class="s2-clue-hdr">🔎 ARQUIVOS DO LACRE II (${[st.scriptRead, st.collarInspected, st.negativeFound].filter(Boolean).length}/3)</div>
        <div>${c1}</div>
        <div>${c2}</div>
        <div>${c3}</div>
      `;
    }
  }

  // ---- ARTES SVG DE CADA SALA DO REINO DE PAPELÃO ----
  function getSceneSvg(room) {
    if (room === 'tavern') {
      return `
        <svg viewBox="0 0 680 230" class="s2-svg">
          <rect width="680" height="230" fill="#3b1629"/>
          <!-- Paredes falsas presas com fita crepe -->
          <rect x="20" y="16" width="640" height="165" fill="#59223d" stroke="#f472b6" stroke-width="2" stroke-dasharray="8 4"/>
          <rect x="115" y="10" width="38" height="12" fill="#fde68a" opacity="0.8" transform="rotate(-8 115 10)"/>
          <rect x="520" y="12" width="42" height="12" fill="#fde68a" opacity="0.8" transform="rotate(6 520 12)"/>
          <!-- Placa neon brega -->
          <rect x="225" y="26" width="230" height="36" rx="6" fill="#1f0916" stroke="#ec4899" stroke-width="2.5"/>
          <text x="340" y="49" text-anchor="middle" fill="#f9a8d4" font-family="monospace" font-weight="bold" font-size="14">TAVERNA &amp; AÇAITERIA DO REI</text>
          <!-- Balcão de compensado -->
          <rect x="60" y="126" width="560" height="78" fill="#7c2d4d" stroke="#290b19" stroke-width="3"/>
          <!-- Bardo Entediado -->
          <circle cx="195" cy="96" r="20" fill="#fbcfe8" stroke="#290b19" stroke-width="2.5"/>
          <path d="M174 84 L216 84 L205 64 L185 64 Z" fill="#db2777" stroke="#290b19" stroke-width="2"/>
          <circle cx="188" cy="94" r="2.5" fill="#290b19"/><circle cx="202" cy="94" r="2.5" fill="#290b19"/>
          <line x1="188" y1="105" x2="203" y2="104" stroke="#290b19" stroke-width="2.5"/>
          <!-- Caneco virado + Vitrine -->
          <rect x="98" y="102" width="22" height="24" rx="3" fill="#fbbf24" stroke="#290b19" stroke-width="2"/>
          <rect x="330" y="76" width="245" height="48" rx="4" fill="#2d0f1e" stroke="#f472b6" stroke-width="1.5"/>
          <text x="452" y="96" text-anchor="middle" fill="#fde047" font-family="monospace" font-size="11">🥕 CENOURA 25🪙 | 🥣 AÇAÍ 45🪙</text>
          <text x="452" y="114" text-anchor="middle" fill="#cbd5e1" font-family="monospace" font-size="11">📏 ESPADA FABER 30cm: 15🪙</text>
        </svg>
      `;
    }
    if (room === 'stable') {
      return `
        <svg viewBox="0 0 680 230" class="s2-svg">
          <rect width="680" height="230" fill="#2d1b2e"/>
          <rect x="0" y="168" width="680" height="62" fill="#4a2c3d"/>
          <!-- Faixa de Greve -->
          <rect x="170" y="20" width="340" height="38" fill="#fef08a" stroke="#1f121c" stroke-width="2.5"/>
          <text x="340" y="44" text-anchor="middle" fill="#831843" font-family="monospace" font-weight="bold" font-size="13">⚠️ SINDICATO EQUINO — PARALISAÇÃO TOTAL</text>
          <!-- Cavalo Branco de Óculos Escuros -->
          <rect x="255" y="105" width="120" height="62" rx="14" fill="#f8fafc" stroke="#1e293b" stroke-width="3"/>
          <rect x="235" y="68" width="44" height="58" rx="10" fill="#f8fafc" stroke="#1e293b" stroke-width="3"/>
          <!-- Óculos escuros do corcel -->
          <rect x="228" y="78" width="32" height="12" fill="#09090b"/>
          <line x1="260" y1="82" x2="275" y2="80" stroke="#09090b" stroke-width="2.5"/>
          <rect x="265" y="166" width="12" height="36" fill="#e2e8f0" stroke="#1e293b" stroke-width="2"/>
          <rect x="348" y="166" width="12" height="36" fill="#e2e8f0" stroke="#1e293b" stroke-width="2"/>
          <!-- Alforje pendurado na cerca -->
          <rect x="500" y="114" width="64" height="52" rx="8" fill="#9d174d" stroke="#1e293b" stroke-width="2.5"/>
          <text x="532" y="144" text-anchor="middle" fill="#fce7f3" font-family="monospace" font-size="10">ALFORJE</text>
        </svg>
      `;
    }
    if (room === 'bridge') {
      return `
        <svg viewBox="0 0 680 230" class="s2-svg">
          <rect width="680" height="230" fill="#1f1633"/>
          <!-- Fosso com patinhos de borracha -->
          <rect x="0" y="176" width="680" height="54" fill="#0ea5e9" opacity="0.55"/>
          <circle cx="120" cy="196" r="9" fill="#fde047"/><circle cx="550" cy="202" r="9" fill="#fde047"/>
          <!-- Ponte levadiça + Mesa corporativa -->
          <rect x="140" y="152" width="400" height="24" fill="#78350f" stroke="#1c1917" stroke-width="3"/>
          <rect x="245" y="104" width="190" height="50" fill="#e2e8f0" stroke="#334155" stroke-width="2.5"/>
          <text x="340" y="133" text-anchor="middle" fill="#0f172a" font-family="monospace" font-weight="bold" font-size="12">PEOPLE &amp; CULTURA REAL</text>
          <!-- Troll de Gravata e Crachá -->
          <circle cx="340" cy="72" r="26" fill="#86efac" stroke="#14532d" stroke-width="3"/>
          <rect x="322" y="64" width="14" height="9" fill="none" stroke="#14532d" stroke-width="2"/>
          <rect x="344" y="64" width="14" height="9" fill="none" stroke="#14532d" stroke-width="2"/>
          <polygon points="340,98 333,122 340,129 347,122" fill="#db2777"/>
        </svg>
      `;
    }
    if (room === 'backstage') {
      return `
        <svg viewBox="0 0 680 230" class="s2-svg">
          <rect width="680" height="230" fill="#1c151d"/>
          <!-- Torres de papelão seguradas por escoras de madeira -->
          <polygon points="90,180 150,35 210,180" fill="#a16207" stroke="#451a03" stroke-width="2.5"/>
          <line x1="150" y1="65" x2="235" y2="180" stroke="#78350f" stroke-width="5"/>
          <!-- Varal de Revelação Fotográfica Vermelho (Câmara Escura!) -->
          <line x1="360" y1="36" x2="620" y2="48" stroke="#f43f5e" stroke-width="2"/>
          <circle cx="490" cy="24" r="10" fill="#e11d48"/>
          <rect x="415" y="42" width="44" height="54" fill="#09090b" stroke="#fda4af" stroke-width="1.5"/>
          <rect x="510" y="46" width="44" height="54" fill="#020203" stroke="#fbbf24" stroke-width="2"/>
          <text x="532" y="114" text-anchor="middle" fill="#fda4af" font-family="monospace" font-size="10">NEGATIVO #02</text>
          <!-- Maleta de Primeiros Socorros + Folha 1697 -->
          <rect x="250" y="132" width="70" height="48" rx="5" fill="#fef2f2" stroke="#dc2626" stroke-width="2.5"/>
          <path d="M285 144 V168 M273 156 H297" stroke="#dc2626" stroke-width="5"/>
          <rect x="358" y="146" width="58" height="36" fill="#fef3c7" stroke="#92400e" stroke-width="2" transform="rotate(-6 358 146)"/>
          <text x="386" y="168" text-anchor="middle" fill="#78350f" font-family="monospace" font-weight="bold" font-size="10">1697</text>
        </svg>
      `;
    }
    if (room === 'dragon') {
      const awakeColor = st.dragonAsleep ? '#64748b' : '#be123c';
      return `
        <svg viewBox="0 0 680 230" class="s2-svg">
          <rect width="680" height="230" fill="#230f18"/>
          <!-- Cortina Empoeirada / Janela -->
          <rect x="65" y="24" width="110" height="135" fill="${st.curtainOpened ? '#bae6fd' : '#4c1d34'}" stroke="#1f0812" stroke-width="3"/>
          <text x="120" y="95" text-anchor="middle" fill="${st.curtainOpened ? '#0369a1' : '#f9a8d4'}" font-family="monospace" font-size="11">${st.curtainOpened ? 'AR PURO!' : 'CORTINA DE PÓ'}</text>
          <!-- Dragão Mecânico/Asmático -->
          <ellipse cx="390" cy="142" rx="115" ry="54" fill="${awakeColor}" stroke="#1f0812" stroke-width="3.5"/>
          <circle cx="285" cy="108" r="34" fill="${awakeColor}" stroke="#1f0812" stroke-width="3.5"/>
          <!-- Coleira de Latão com #0x2F -->
          <rect x="304" y="118" width="22" height="38" rx="4" fill="#f59e0b" stroke="#451a03" stroke-width="2" transform="rotate(24 304 118)"/>
          <text x="275" y="104" fill="#fff" font-family="monospace" font-weight="bold" font-size="14">${st.dragonAsleep ? 'Zzz...' : '*ATCHIM!!*'}</text>
          <!-- Nuvens de poeira -->
          ${
            st.dustLevel > 0
              ? `<circle cx="235" cy="145" r="${Math.max(8, st.dustLevel * 0.26)}" fill="rgba(203,213,225,0.42)"/>
                 <circle cx="485" cy="128" r="${Math.max(8, st.dustLevel * 0.22)}" fill="rgba(203,213,225,0.36)"/>`
              : ''
          }
        </svg>
      `;
    }
    if (room === 'elevator') {
      const volts = [110, 45, 75, 35];
      const curSum = st.breakers.reduce((acc, on, idx) => acc + (on ? volts[idx] : 0), 0);
      return `
        <svg viewBox="0 0 680 230" class="s2-svg">
          <rect width="680" height="230" fill="#18181b"/>
          <!-- Quadro de Disjuntores 220V -->
          <rect x="85" y="28" width="230" height="172" rx="6" fill="#27272a" stroke="#71717a" stroke-width="3"/>
          <text x="200" y="52" text-anchor="middle" fill="#fde047" font-family="monospace" font-weight="bold" font-size="12">QUADRO AUXILIAR (META: 220V)</text>
          <text x="200" y="74" text-anchor="middle" fill="${curSum === 220 ? '#4ade80' : '#f87171'}" font-family="monospace" font-weight="bold" font-size="16">ATUAL: ${curSum}V</text>
          ${volts
            .map(
              (v, i) => `
            <rect x="${108 + i * 48}" y="96" width="36" height="64" rx="4" fill="${st.breakers[i] ? '#16a34a' : '#3f3f46'}" stroke="#09090b" stroke-width="2"/>
            <text x="${126 + i * 48}" y="132" text-anchor="middle" fill="#fff" font-family="monospace" font-weight="bold" font-size="11">${v}V</text>
            <text x="${126 + i * 48}" y="176" text-anchor="middle" fill="#d4d4d8" font-family="monospace" font-size="10">CH${i + 1}</text>
          `
            )
            .join('')}
          <!-- Porta Metálica do Elevador de Carga -->
          <rect x="395" y="24" width="195" height="182" fill="#3f3f46" stroke="#ec4899" stroke-width="3"/>
          <line x1="492" y1="24" x2="492" y2="206" stroke="#18181b" stroke-width="3"/>
          <rect x="602" y="92" width="34" height="52" rx="4" fill="#09090b" stroke="#f472b6" stroke-width="2"/>
          <circle cx="619" cy="108" r="6" fill="${st.elevatorUnlocked ? '#4ade80' : '#ef4444'}"/>
        </svg>
      `;
    }
    // penthouse
    return `
      <svg viewBox="0 0 680 230" class="s2-svg">
        <rect width="680" height="230" fill="#4a0424"/>
        <!-- Ring Light + Celular no Tripé + Trono Inflável -->
        <circle cx="250" cy="92" r="28" fill="none" stroke="#fff" stroke-width="6"/>
        <line x1="250" y1="120" x2="250" y2="198" stroke="#94a3b8" stroke-width="4"/>
        <rect x="355" y="72" width="130" height="122" rx="22" fill="#f472b6" stroke="#831843" stroke-width="3"/>
        <!-- Princesa de Óculos & Celular na mão -->
        <circle cx="420" cy="96" r="22" fill="#fde68a" stroke="#831843" stroke-width="2.5"/>
        <polygon points="402,76 410,60 420,73 430,60 438,76" fill="#fbbf24" stroke="#831843" stroke-width="2"/>
        <rect x="394" y="114" width="18" height="28" rx="3" fill="#09090b" stroke="#38bdf8" stroke-width="1.5"/>
        <!-- Livro II trancado sobre o pufe -->
        <rect x="528" y="138" width="66" height="52" rx="5" fill="#be185d" stroke="#fde047" stroke-width="2.5"/>
        <text x="561" y="168" text-anchor="middle" fill="#fde047" font-family="monospace" font-weight="bold" font-size="11">LIVRO II</text>
      </svg>
    `;
  }

  function renderRoom(announceArrival = false) {
    renderMapAndInventory();

    const hdr = document.getElementById('s2-room-header');
    const canvas = document.getElementById('s2-scene-canvas');
    const spots = document.getElementById('s2-hotspots-bar');
    const sub = document.getElementById('s2-subpanel');
    if (!hdr || !canvas || !spots || !sub) return;

    canvas.innerHTML = getSceneSvg(st.room);
    sub.innerHTML = '';

    // ==================== SALA 1: TAVERNA & AÇAITERIA ====================
    if (st.room === 'tavern') {
      hdr.innerHTML = `<span>🍺 CENÁRIO 1 — TAVERNA DE COMPENSADO &amp; AÇAITERIA</span><span>Saída liberada: Estábulo ➡️</span>`;
      if (announceArrival) {
        sayNarrator('O cheiro de cola quente mistura-se ao xarope de guaraná. O Bardo boceja atrás do balcão.');
      }

      spots.innerHTML = `
        <button type="button" class="s2-spot-btn" id="s2-t-mug">🍺 Levantar Caneco Virado ${st.mugChecked ? '✓' : ''}</button>
        <button type="button" class="s2-spot-btn" id="s2-t-bard">🎭 Conversar com o Bardo</button>
        <button type="button" class="s2-spot-btn" id="s2-t-carrot" ${st.boughtCarrot ? 'disabled' : ''}>🥕 Comprar Cenoura (25 🪙)</button>
        <button type="button" class="s2-spot-btn" id="s2-t-acai" ${st.boughtAcai ? 'disabled' : ''}>🥣 Comprar Açaí 500ml (45 🪙)</button>
        <button type="button" class="s2-spot-btn" id="s2-t-ruler" ${st.boughtRuler ? 'disabled' : ''}>📏 Comprar Espada Faber (15 🪙)</button>
      `;

      document.getElementById('s2-t-mug')?.addEventListener('click', () => {
        playBeep();
        if (!st.mugChecked) {
          st.mugChecked = true;
          st.coins += 25;
          playToyFanfare(true);
          narratorThenLog(
            'Debaixo do caneco de plástico havia +25 moedas de troco esquecidas pelo último figurante!',
            'olha aí, saqueando gorjeta de figurante mal pago. agora já dá pra levar a cenoura e o açaí sem chorar.',
            'action'
          );
          renderRoom(false);
        } else {
          sayNarrator('Só restou uma rodela de guardanapo grudada no fundo.');
        }
      });

      document.getElementById('s2-t-bard')?.addEventListener('click', () => {
        playBeep();
        narratorThenLog(
          'Bardo: "Quer chegar na Torre? O Corcel no Estábulo entrou em greve por falta de acordo escrito e cenoura orgânica. E nem tente subir na Princesa sem o Açaí dela!"',
          'resumo da ópera: até num livrinho infantil o cavalo tem mais direitos trabalhistas que eu.',
          'action'
        );
      });

      document.getElementById('s2-t-carrot')?.addEventListener('click', () => {
        playBeep();
        if (st.coins < 25) {
          sayNarrator('Moedas insuficientes! Procure troco perdido pela taverna.');
          return;
        }
        st.coins -= 25;
        st.boughtCarrot = true;
        addItem('cenoura');
        playToyFanfare(true);
        sayNarrator('Você guardou a Cenoura Orgânica com selo sindical no alforje.');
        renderRoom(false);
      });

      document.getElementById('s2-t-acai')?.addEventListener('click', () => {
        playBeep();
        if (st.coins < 45) {
          narratorThenLog(
            'Faltam moedas para o Açaí de 45 plásticos! Vasculhe o balcão ou o estábulo atrás de moedas.',
            'quarenta e cinco contos num copo de gelo roxo com leite em pó. igualzinho na vida real kkkkk',
            'action'
          );
          return;
        }
        st.coins -= 45;
        st.boughtAcai = true;
        addItem('acai');
        playToyFanfare(true);
        narratorThenLog(
          'Você comprou o Açaí 500ml com Leite Ninho! Cuidado para não derreter.',
          'um nobre guerreiro medieval carregando copo de isopor no bolso. orgulho da literatura.',
          'action'
        );
        renderRoom(false);
      });

      document.getElementById('s2-t-ruler')?.addEventListener('click', () => {
        playBeep();
        if (st.coins < 15) {
          sayNarrator('Sem moedas suficientes.');
          return;
        }
        st.coins -= 15;
        st.boughtRuler = true;
        addItem('regua');
        narratorThenLog(
          'Você adquiriu a lendária Régua Acrílica de 30cm pintada de prata.',
          'gastou 15 moedas numa régua escolar quebrada mano. se faltar dinheiro pro açaí depois não reclama.',
          'action'
        );
        renderRoom(false);
      });
      return;
    }

    // ==================== SALA 2: ESTÁBULO SINDICALIZADO ====================
    if (st.room === 'stable') {
      hdr.innerHTML = `<span>🐴 CENÁRIO 2 — ESTÁBULO DO SINDICATO EQUINO</span><span>${st.unlockedRooms.has('bridge') ? 'Ponte RH Liberada ➡️' : '🔒 Ponte Bloqueada'}</span>`;
      if (announceArrival) {
        sayNarrator('O Corcel Branco cruza as patas dianteiras de óculos escuros em frente à faixa de greve.');
      }

      spots.innerHTML = `
        <button type="button" class="s2-spot-btn" id="s2-s-bag">👜 Vasculhar Alforje na Cerca ${st.saddleBagChecked ? '✓' : ''}</button>
        <button type="button" class="s2-spot-btn" id="s2-s-horse">🐴 Interagir com o Corcel (Usar Item na Mão)</button>
        <button type="button" class="s2-spot-btn" id="s2-s-mount">🏇 Montar e Galopar até a Ponte</button>
      `;

      document.getElementById('s2-s-bag')?.addEventListener('click', () => {
        playBeep();
        if (!st.saddleBagChecked) {
          st.saddleBagChecked = true;
          st.coins += 15;
          addItem('termo_clt');
          playToyFanfare(true);
          narratorThenLog(
            'Dentro do alforje havia um Acordo de Hora-Galope em branco e +15 moedas de plástico!',
            'achou a papelada do sindicato e mais uns trocados. assina e enfia na cara do pangaré.',
            'action'
          );
          renderRoom(false);
        } else {
          sayNarrator('O alforje da cerca já está vazio.');
        }
      });

      document.getElementById('s2-s-horse')?.addEventListener('click', () => {
        playBeep();
        if (st.selectedItem === 'termo_clt' && !st.horseSigned) {
          st.horseSigned = true;
          st.selectedItem = null;
          playToyFanfare(true);
          narratorThenLog(
            'Corcel: "Hmm... adicional de trote em piso de paralelepípedo assinado. Agora cadê meu vale-refeição crocante?"',
            'metade da burocracia equina já foi. agora equipa a cenoura na mochila ali na direita e entrega pra ele.',
            'action'
          );
          renderRoom(false);
          return;
        }
        if (st.selectedItem === 'cenoura' && !st.horseFed) {
          st.horseFed = true;
          st.selectedItem = null;
          playToyFanfare(true);
          narratorThenLog(
            'CRUNCH! O Corcel mastiga a cenoura orgânica satisfeito.',
            st.horseSigned
              ? 'pronto, barriga cheia e contrato assinado. já pode montar nele pra ir pra ponte!'
              : 'ele comeu a cenoura, mas ainda falta assinar o acordo no alforje da cerca!',
            'action'
          );
          renderRoom(false);
          return;
        }
        if (st.selectedItem === 'regua') {
          playToyFanfare(false);
          narratorThenLog(
            'Você cutuca o Corcel com a régua de 30cm e leva uma encarada sindical mortal.',
            'cê acabou de cometer assédio moral contra um cavalo sindicalizado mano kkkkk para com isso!',
            'action'
          );
          return;
        }

        const pend = [];
        if (!st.horseSigned) pend.push('📋 Acordo de Hora-Galope');
        if (!st.horseFed) pend.push('🥕 Cenoura Orgânica');
        sayNarrator(
          pend.length > 0
            ? `Corcel: "Sem chance, chefia! Equipe no seu Alforje à direita e me entregue: ${pend.join(' e ')}."`
            : 'Corcel: "Tudo nos conformes! Clique em Montar quando quiser partir pra Ponte."'
        );
      });

      document.getElementById('s2-s-mount')?.addEventListener('click', () => {
        playBeep();
        if (!st.horseSigned || !st.horseFed) {
          playToyFanfare(false);
          if (!(triggerRisadaVoiceReaction && triggerRisadaVoiceReaction({ cooldownMs: 35000 }))) {
            setOperatorRemark('tentou subir no lombo sem cumprir a pauta da greve e quase tomou coice na testa!', { priority: 'action' });
          }
          sayNarrator('O Corcel empina e recusa sair do lugar até receber o Acordo e a Cenoura!');
          return;
        }
        st.unlockedRooms.add('bridge');
        st.room = 'bridge';
        playToyFanfare(true);
        narratorThenLog(
          'POCOTÓ, POCOTÓ! O Corcel te leva em trote regulamentado até a Ponte Levadiça de RH!',
          'chegamos no fosso do castelo... e tem a porra de uma bancada da Gupy no meio da ponte.',
          'urgent'
        );
        renderRoom(false);
      });
      return;
    }

    // ==================== SALA 3: PONTE DO TROLL SÊNIOR DE RH ====================
    if (st.room === 'bridge') {
      hdr.innerHTML = `<span>💼 CENÁRIO 3 — PONTE DO TROLL DE PEOPLE &amp; CULTURA</span><span>${st.rhPassed ? 'Bastidores & Dragão Liberados ➡️' : '🔒 Entrevista Pendente'}</span>`;

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
          q: '2/3 — "Se você fosse um utensílio da masmorra real, qual seria para agregar sinergia ao squad?"',
          opts: [
            { txt: '"Uma guilhotina, pra cortar conversa fiada de RH."', ok: false },
            { txt: '"Uma tocha resiliente que ilumina os KPIs do time mesmo na umidade!"', ok: true },
            { txt: '"Um balde furado."', ok: false },
          ],
        },
        {
          q: '3/3 — "Sobre remuneração: a missão não paga ouro, paga exposição no pergaminho da Princesa e café requentado. De acordo?"',
          opts: [
            { txt: '"Perfeito! Meu verdadeiro tesouro é o aprendizado exponencial como PJ!"', ok: true },
            { txt: '"Nem ferrando, cadê as moedas?"', ok: false },
          ],
        },
      ];

      spots.innerHTML = st.rhPassed
        ? `
          <button type="button" class="s2-spot-btn" id="s2-go-backstage">📦 Entrar nos Bastidores de Papelão ➡️</button>
          <button type="button" class="s2-spot-btn" id="s2-go-dragon">🐉 Ir ao Salão do Dragão ➡️</button>
        `
        : `<div style="font-size:12.5px; font-weight:bold; color:#fce7f3;">Responda à dinâmica eliminatória abaixo sem demonstrar amor-próprio:</div>`;

      if (!st.rhPassed) {
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
                narratorThenLog(
                  'Troll de RH: "UAU, match total de cultura! Tome seu Crachá de Herói PJ — acesso liberado aos Bastidores e ao Covil!"',
                  'parabéns, humilhou sua dignidade com sucesso e ganhou um crachá de cartolina. vasculha os Bastidores primeiro!',
                  'urgent'
                );
              } else {
                sayNarrator('Troll de RH: "Anotado no seu perfil comportamental! Próxima pergunta..."');
              }
              renderRoom(false);
            } else {
              st.rhStep = 0;
              playToyFanfare(false);
              narratorThenLog(
                'Troll de RH: "Hmm, senti uma vibe meio tóxica e pouco colaborativa... Vamos reiniciar o assessment do zero!"',
                'falou a verdade na entrevista de emprego e rodou na hora kkkkk mente igual gente grande pô!',
                'action'
              );
              renderRoom(false);
            }
          });
        });
      } else {
        document.getElementById('s2-go-backstage')?.addEventListener('click', () => {
          playBeep();
          st.room = 'backstage';
          renderRoom(true);
        });
        document.getElementById('s2-go-dragon')?.addEventListener('click', () => {
          playBeep();
          st.room = 'dragon';
          renderRoom(true);
        });
      }
      return;
    }

    // ==================== SALA 4: BASTIDORES DE PAPELÃO & CÂMARA ESCURA ====================
    if (st.room === 'backstage') {
      hdr.innerHTML = `<span>📦 CENÁRIO 4 — BASTIDORES DE PAPELÃO &amp; CÂMARA ESCURA</span><span>🔍 Pistas Críticas Aqui!</span>`;
      if (announceArrival) {
        sayNarrator('Atrás das fachadas pintadas há escoras de madeira, uma maleta médica e um varal fotográfico iluminado por luz vermelha.');
      }

      spots.innerHTML = `
        <button type="button" class="s2-spot-btn" id="s2-b-meds">🧰 Abrir Maleta de Primeiros Socorros ${st.medBoxOpened ? '✓' : ''}</button>
        <button type="button" class="s2-spot-btn" id="s2-b-1697">📜 Ler Página Francesa Rasgada (1697) ${st.scriptRead ? '✓' : ''}</button>
        <button type="button" class="s2-spot-btn" id="s2-b-neg">🎞️ Examinar Varal da Câmara Escura ${st.negativeFound ? '✓' : ''}</button>
      `;

      document.getElementById('s2-b-meds')?.addEventListener('click', () => {
        playBeep();
        if (!st.medBoxOpened) {
          st.medBoxOpened = true;
          addItem('lenco');
          addItem('neosoro');
          playToyFanfare(true);
          narratorThenLog(
            'Você coletou um pacote de Lenços Anti-Pó e um frasco de Descongestionante Dracônico!',
            'kit rinite completo. guarda isso que o lagarto mecânico na próxima sala tá morrendo de catarro.',
            'action'
          );
          renderRoom(false);
        } else {
          sayNarrator('A maleta médica já foi esvaziada.');
        }
      });

      document.getElementById('s2-b-1697')?.addEventListener('click', () => {
        playBeep();
        st.scriptRead = true;
        addItem('roteiro_1697');
        sub.innerHTML = `
          <div class="s2-doc-callout">
            <strong>📜 FRAGMENTO BIBLIOGRÁFICO — PARIS, 1697 (Charles Perrault):</strong><br/>
            <em>"Em 'La Belle au bois dormant', nasceram sete convites de ouro maciço para as <strong>SETE fadas boas</strong> encontradas no reino — antes que a oitava, esquecida por todos, amaldiçoasse a roca."</em>
          </div>
        `;
        narratorThenLog(
          'Você guardou a anotação da edição francesa de 1697 no seu Alforje.',
          'viu ali? sete fadas boas no livro de 1697, nada daquelas três fadinhas coloridas de desenho animado. guarda esse número.',
          'action'
        );
        renderMapAndInventory();
      });

      document.getElementById('s2-b-neg')?.addEventListener('click', () => {
        playBeep();
        st.negativeFound = true;
        addItem('negativo_02');
        playToyFanfare(true);
        sub.innerHTML = `
          <div class="s2-doc-callout" style="background:#120810; color:#fda4af; border-color:#f43f5e;">
            <div style="display:flex; gap:14px; align-items:center; flex-wrap:wrap;">
              <img src="/story2/negativo_torre_02.png" alt="Negativo #02" style="width:128px; height:72px; border:2px solid #f43f5e; background:#000;" />
              <div style="flex:1; min-width:220px;">
                <strong>🎞️ NEGATIVO SUBEXPOSTO #02 COLETADO!</strong><br/>
                A olho nu parece um retângulo 100% preto, mas o papel fotográfico guarda <strong>duas camadas ocultas fora do navegador</strong>.<br/>
                <a href="/story2/negativo_torre_02.png" download="negativo_torre_02.png" class="s2-dl-big">⬇ Baixar negativo_torre_02.png no PC</a>
              </div>
            </div>
          </div>
        `;
        narratorThenLog(
          'No varal vermelho há uma chapa revelada quase totalmente escura: negativo_torre_02.png.',
          'opa... peraí mano. esse arquivo .png aí não é cenário bobo não, tem coisa escondida no escuro E dentro do arquivo. já baixa pro teu pc que na última página do livro o bicho vai pegar!',
          'urgent'
        );
        renderMapAndInventory();
      });
      return;
    }

    // ==================== SALA 5: SALÃO DO DRAGÃO ASMÁTICO ====================
    if (st.room === 'dragon') {
      hdr.innerHTML = `<span>🐉 CENÁRIO 5 — COVIL DO DRAGÃO ASMÁTICO</span><span>Poeira: ${st.dustLevel}% | Alergia: ${st.dragonAllergy}%</span>`;
      if (announceArrival) {
        sayNarrator(
          st.dragonAsleep
            ? 'O Dragão ronca sereno com as duas narinas desentupidas, deixando o corredor da Casa de Máquinas livre.'
            : 'ATCHIM!! O Dragão solta faíscas úmidas de rinite bloqueando a porta da Casa de Máquinas!'
        );
      }

      spots.innerHTML = `
        <button type="button" class="s2-spot-btn" id="s2-d-curtain" ${st.curtainOpened ? 'disabled' : ''}>🪟 Abrir Cortina Velha (-45% Poeira)</button>
        <button type="button" class="s2-spot-btn" id="s2-d-interact">🐉 Usar Item na Mão no Dragão</button>
        <button type="button" class="s2-spot-btn" id="s2-d-collar">🏷️ Examinar Coleira de Latão ${st.collarInspected ? '✓' : ''}</button>
        ${st.dragonAsleep ? `<button type="button" class="s2-spot-btn" id="s2-d-next">⚡ Passar para a Casa de Máquinas ➡️</button>` : ''}
      `;

      document.getElementById('s2-d-curtain')?.addEventListener('click', () => {
        playBeep();
        st.curtainOpened = true;
        st.dustLevel = Math.max(0, st.dustLevel - 45);
        narratorThenLog(
          'Você escancara a cortina de veludo mofado! Metade da nuvem de ácaros sai pela janela.',
          'boa, já baixou metade da carniça do ar. agora equipa o lenço na mochila pra limpar o resto antes do remédio!',
          'action'
        );
        renderRoom(false);
      });

      document.getElementById('s2-d-interact')?.addEventListener('click', () => {
        if (st.dragonAsleep) {
          sayNarrator('Deixe o coitado dormir em paz com o nariz desentupido!');
          return;
        }
        if (st.selectedItem === 'lenco') {
          playBeep();
          st.dustLevel = Math.max(0, st.dustLevel - 45);
          st.selectedItem = null;
          narratorThenLog(
            `Você passa o Lenço Anti-Pó no focinho escamoso! Poeira no salão caiu para ${st.dustLevel}%.`,
            st.dustLevel === 0
              ? 'zero poeira! agora equipa o descongestionante na mochila e manda nas ventas dele!'
              : 'ainda tem poeira voando da cortina fechada ali na esquerda!',
            'action'
          );
          renderRoom(false);
          return;
        }
        if (st.selectedItem === 'neosoro') {
          if (st.dustLevel > 0) {
            playSneezeBurst();
            narratorThenLog(
              'ATCHIM!! Ainda há poeira no salão (${st.dustLevel}%) — o Dragão espirrou o remédio longe! Abra a cortina e use o Lenço primeiro.',
              'não adianta pingar remédio no meio dessa nuvem de ácaro mano! zera a poeira antes!',
              'action'
            );
            return;
          }
          st.dragonAllergy = 0;
          st.dragonAsleep = true;
          st.selectedItem = null;
          st.unlockedRooms.add('elevator');
          playToyFanfare(true);
          narratorThenLog(
            'SNIFFFF... Ahhh! O Dragão respira fundo pelas duas narinas pela primeira vez em décadas, enrola o rabo e apaga num sono profundo!',
            'pronto, nocaute farmacêutico kkkkk não esquece de olhar a placa de latão na coleira dele antes de subir!',
            'urgent'
          );
          renderRoom(false);
          return;
        }
        if (st.selectedItem === 'regua') {
          playSneezeBurst();
          st.dustLevel = Math.min(100, st.dustLevel + 20);
          narratorThenLog(
            'TÉC! Você bateu com a régua acrílica na escama do Dragão, levantando ainda mais poeira!',
            'bater num dragão com uma régua de 30cm da papelaria... tua estratégia militar me emociona mano.',
            'action'
          );
          renderRoom(false);
          return;
        }
        sayNarrator('Selecione um item útil no seu Alforje à direita (ex: Lenço ou Descongestionante) antes de clicar no Dragão!');
      });

      document.getElementById('s2-d-collar')?.addEventListener('click', () => {
        playBeep();
        if (!st.dragonAsleep) {
          playSneezeBurst();
          sayNarrator('Chegar a mão no pescoço dele enquanto espirra labareda é suicídio! Faça-o dormir primeiro.');
          return;
        }
        st.collarInspected = true;
        addItem('placa_hex');
        sub.innerHTML = `
          <div class="s2-doc-callout">
            <strong>🏷️ GRAVAÇÃO NA COLEIRA DE LATÃO DO DRAGÃO:</strong><br/>
            <code>UNIDADE MECÂNICA DE SOPRO — SÉRIE #0x2F // ALIMENTAÇÃO DA TORRE: 220V EXATOS</code>
          </div>
        `;
        narratorThenLog(
          'Na coleira de latão do Dragão adormecido está gravado em baixo-relevo: SÉRIE #0x2F e Alimentação 220V.',
          'série hexadecimal 0x2F cravada no pescoço do bicho... guarda bem isso que tem cara de peça de conta pesada.',
          'action'
        );
        renderMapAndInventory();
      });

      document.getElementById('s2-d-next')?.addEventListener('click', () => {
        playBeep();
        st.room = 'elevator';
        renderRoom(true);
      });
      return;
    }

    // ==================== SALA 6: CASA DE MÁQUINAS & ELEVADOR 220V ====================
    if (st.room === 'elevator') {
      const volts = [110, 45, 75, 35];
      const curSum = st.breakers.reduce((acc, on, idx) => acc + (on ? volts[idx] : 0), 0);
      st.elevatorPowered = curSum === 220;

      hdr.innerHTML = `<span>⚡ CENÁRIO 6 — CASA DE MÁQUINAS DO ELEVADOR</span><span>Tensão: ${curSum}V / 220V</span>`;
      if (announceArrival) {
        sayNarrator('A trança loira pendurada era só um cabo de extensão desencapado! Ajuste os 4 disjuntores para cravar 220V e passe o Crachá PJ no leitor.');
      }

      spots.innerHTML = `
        ${volts
          .map(
            (v, i) =>
              `<button type="button" class="s2-spot-btn" data-toggle-brk="${i}">🔌 CH${i + 1} (${v}V): <strong>${st.breakers[i] ? 'ON' : 'OFF'}</strong></button>`
          )
          .join('')}
        <button type="button" class="s2-spot-btn" id="s2-el-badge">🪪 Passar Crachá no Leitor</button>
        ${st.elevatorUnlocked ? `<button type="button" class="s2-spot-btn" id="s2-el-up">🛗 Subir à Cobertura Real ➡️</button>` : ''}
      `;

      spots.querySelectorAll('[data-toggle-brk]').forEach((b) => {
        b.addEventListener('click', () => {
          playBeep();
          const idx = Number(b.getAttribute('data-toggle-brk'));
          st.breakers[idx] = !st.breakers[idx];
          const newSum = st.breakers.reduce((acc, on, k) => acc + (on ? volts[k] : 0), 0);
          if (newSum === 220) {
            playToyFanfare(true);
            sayNarrator('CLACK! Tensão estabilizada em exatos 220V! O leitor de crachá do elevador acendeu.');
          }
          renderRoom(false);
        });
      });

      document.getElementById('s2-el-badge')?.addEventListener('click', () => {
        playBeep();
        if (!st.elevatorPowered) {
          playToyFanfare(false);
          sayNarrator(`O leitor está apagado (Tensão atual: ${curSum}V). Combine as chaves para somar exatos 220V!`);
          return;
        }
        if (st.selectedItem !== 'cracha_rh' && !st.elevatorUnlocked) {
          sayNarrator('BIP VERMELHO! Equipe o Crachá "Herói PJ" na mão (no Alforje à direita) antes de encostar no leitor!');
          return;
        }
        st.elevatorUnlocked = true;
        st.selectedItem = null;
        st.unlockedRooms.add('penthouse');
        playToyFanfare(true);
        narratorThenLog(
          'DING! "Acesso concedido ao colaborador PJ." As portas do elevador de serviço se abrem!',
          'finalmente! bora ver quem é a dondoca no topo dessa torre de papelão.',
          'action'
        );
        renderRoom(false);
      });

      document.getElementById('s2-el-up')?.addEventListener('click', () => {
        playBeep();
        st.room = 'penthouse';
        renderRoom(true);
      });
      return;
    }

    // ==================== SALA 7: COBERTURA REAL DA PRINCESA DE PLÁSTICO ====================
    if (st.room === 'penthouse') {
      hdr.innerHTML = `<span>👑 CENÁRIO 7 — COBERTURA DA PRINCESA INFLUENCER</span><span>Fim da Torre</span>`;
      if (announceArrival) {
        sayNarrator('No topo da torre há um ring light aceso, um pufe rosa inflável e a Princesa gravando stories enquanto reclama da demora do delivery.');
      }

      const missingClues = !st.scriptRead || !st.collarInspected || !st.negativeFound;

      spots.innerHTML = !st.guardCleared
        ? `<button type="button" class="s2-spot-btn" id="s2-p-deliver">🥣 Entregar Açaí 500ml pra Princesa (Equipar na Mão)</button>`
        : `
          <button type="button" class="s2-spot-btn" id="s2-p-talk">💬 Ouvir o Fora da Princesa</button>
          <button type="button" class="s2-spot-btn" id="s2-p-takebook" style="background:#be185d; color:#fff; border-color:#fde047;">📕 Pegar Livro II e Voltar pra Caverna</button>
        `;

      if (missingClues) {
        sub.innerHTML = `
          <div class="s2-doc-callout" style="border-color:#b45309; background:#fffbeb; color:#78350f;">
            ⚠️ <strong>Dica de Explorador:</strong> Você ainda deixou pistas pra trás (${!st.scriptRead ? '[Folha 1697 nos Bastidores] ' : ''}${!st.negativeFound ? '[Negativo #02 nos Bastidores] ' : ''}${!st.collarInspected ? '[Coleira do Dragão]' : ''}). Recomendo coletar todas pelo mapa acima antes de fechar o conto!
          </div>
        `;
      }

      document.getElementById('s2-p-deliver')?.addEventListener('click', () => {
        playBeep();
        if (!hasItem('acai')) {
          sayNarrator('Princesa: "Oi?? Você subiu SETE cenários de mãos abanando sem meu Açaí?! Volta lá no Cenário 1 (Taverna) pelo mapa e traz!"');
          return;
        }
        if (st.selectedItem !== 'acai') {
          sayNarrator('Equipe o 🥣 Açaí 500ml no seu Alforje à direita para entregar na mão dela!');
          return;
        }
        st.guardCleared = true;
        st.selectedItem = null;
        playToyFanfare(true);
        narratorThenLog(
          'Princesa pega o copo: "Finalmente! Cinco estrelas só se o leite em pó não tiver virado pelota. Já pode pegar aquele livro velho empoeirado ali no pufe e fechar a porta por fora, tá?"',
          'mano kkkkkkk cê atravessou greve de cavalo, gupy de troll e catarro de dragão só pra fazer entrega do ifood pra blogueira medieval!! pega logo esse Livro II e vaza daqui!',
          'urgent'
        );
        renderRoom(false);
      });

      document.getElementById('s2-p-talk')?.addEventListener('click', () => {
        playBeep();
        sayNarrator('Princesa: "Casar?? Amigo, meu engajamento cai 40% se eu postar casal com PJ de régua acrílica. Leva logo esse Livro II que tá destonando da paleta do meu cenário!"');
      });

      document.getElementById('s2-p-takebook')?.addEventListener('click', async () => {
        playBeep();
        isAlive = false;
        scrollSeq++;
        await finishStory();
      });
    }
  }

  // Boas-vindas iniciais ao abrir o Conto 2
  renderRoom(false);
  narratorThenLog(
    'Bem-vindo ao Reino de Plástico! Use o Alforje à direita e navegue pelos 7 cenários para chegar ao topo da Torre — e não ignore o que encontrar escondido nos Bastidores.',
    'que cheiro de tinta guache barata é esse mano... até cenário de papelão escorado com cabo de vassoura meteram nesse livro! bora limpar logo isso.',
    'urgent'
  );
}
