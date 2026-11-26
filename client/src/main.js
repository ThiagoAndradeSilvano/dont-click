const TOKEN_KEY = '_sys_ref';
let currentStage = 'button';
let currentUpgrades = [];
let audioCtx = null;
let moodTimeout = null;
let idleTimeout = null;
let fakeProgressTimer = null;
let remarkTypingId = 0;

function getClientMeta() {
  let localToken = null;
  try {
    localToken = localStorage.getItem(TOKEN_KEY);
  } catch {}

  return {
    localToken,
    userAgent: navigator.userAgent,
    screen: `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
  };
}

function saveLocalToken(token) {
  if (!token) return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
}

async function apiPost(endpoint, extra = {}) {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      keepalive: true,
      body: JSON.stringify({ ...getClientMeta(), ...extra }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.token) saveLocalToken(data.token);
      return data;
    }
  } catch {}
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Cursores vermelhos comunicativos (SÓ ATIVAM DEPOIS QUE ELE ACORDA NO CAP 2!)
function flashCursorMood(mood, durationMs = 2000) {
  if (currentStage !== 'awakened_hub') return;
  const classes = [
    'cursor-mood-middle',
    'cursor-mood-thumb',
    'cursor-mood-stop',
    'cursor-mood-chill',
    'cursor-mood-point',
  ];
  document.body.classList.remove(...classes);
  if (moodTimeout) clearTimeout(moodTimeout);

  if (mood) {
    document.body.classList.add(`cursor-mood-${mood}`);
    if (durationMs > 0) {
      moodTimeout = setTimeout(() => {
        document.body.classList.remove(`cursor-mood-${mood}`);
      }, durationMs);
    }
  }
}

function resetIdleChillTimer() {
  if (idleTimeout) clearTimeout(idleTimeout);
  document.body.classList.remove('cursor-mood-chill');
  if (currentStage !== 'awakened_hub') return;

  idleTimeout = setTimeout(() => {
    if (currentStage === 'awakened_hub' && !document.body.className.includes('cursor-mood-')) {
      document.body.classList.add('cursor-mood-chill');
    }
  }, 9000);
}

// Som xoxo do upgrade "Áudio do Botão"
function playCheapBeep() {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(390, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(170, audioCtx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.14, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.055);
  } catch {}
}

function spawnFloatingNumber(x, y, text, type = 'gain') {
  const el = document.createElement('div');
  el.className = `float-num ${type}`;
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 850);
}

function setBrokenPageFavicon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
      <path fill="#9AA0A6" d="M3 1h6.5L13 4.5V15H3V1zm6 1.5V5h2.5L9 2.5z"/>
      <path fill="#fff" d="M5.5 7.5h1.5v1.5H5.5zm3.5 0h1.5v1.5H9zm-3 4h4v1H6z"/>
    </svg>
  `.trim();

  const link = document.getElementById('dynamic-favicon');
  if (link) link.href = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

function resetFaviconAndTitle(title = 'Início') {
  document.title = title;
  const link = document.getElementById('dynamic-favicon');
  if (link) link.href = '/favicon.png';
}

function clearTimers() {
  if (fakeProgressTimer) {
    clearInterval(fakeProgressTimer);
    fakeProgressTimer = null;
  }
}

// ============================================================================
// CAP 0: BOTÃO SECO MUDO (Cai em 9x -> Recarrega -> Cai em 5x -> Recarrega -> Clicker Mudo)
// ============================================================================
function renderInitialButtonScreen(buttonLabel = 'Botão') {
  clearTimers();
  currentStage = 'button';
  document.body.className = '';
  resetFaviconAndTitle('Início');

  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="box-button" id="the-button">
      <div class="button">
        <span id="button-label">${buttonLabel}</span>
      </div>
    </div>
  `;
  app.style.visibility = 'visible';

  const theButton = document.getElementById('the-button');
  let crashing = false;

  theButton?.addEventListener('click', async () => {
    if (crashing) return;
    const result = await apiPost('/api/click');
    if (!result) return;

    if (result.action === 'crash') {
      crashing = true;
      setTimeout(() => {
        app.innerHTML = '';
        document.title = 'Carregando...';
        setTimeout(() => {
          renderFakeBrowserCrash({ awakening: false });
        }, 180);
      }, 140);
    }
  });
}

// ============================================================================
// CAP 1 (MUDO) & CAP 2 (ACORDADO): CLICKER DE DISTRAÇÃO + UPGRADES MERDA DE APP
// ============================================================================
function renderClickerScreen(state, { justAwakened = false } = {}) {
  clearTimers();
  const isAwakened = state.stage === 'awakened_hub';
  currentStage = state.stage;
  currentUpgrades = state.upgrades || [];

  const classes = ['clicker-mode'];
  if (currentUpgrades.includes('kids_theme')) classes.push('kids-theme-active');
  if (isAwakened) classes.push('awakened-cursors');
  document.body.className = classes.join(' ');

  resetFaviconAndTitle(isAwakened ? 'naoclique.net' : 'Painel v1.0');

  const app = document.getElementById('app');
  app.style.visibility = 'visible';

  // Solzinho tosco feito no Paint se comprou o Tema Colorido
  const sunHtml = currentUpgrades.includes('kids_theme')
    ? `
      <svg class="derpy-sun" id="derpy-sun" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <g stroke="#ff9f1c" stroke-width="5" stroke-linecap="round">
          <line x1="50" y1="4" x2="50" y2="18"/>
          <line x1="50" y1="82" x2="50" y2="96"/>
          <line x1="4" y1="50" x2="18" y2="50"/>
          <line x1="82" y1="50" x2="96" y2="50"/>
          <line x1="17" y1="17" x2="27" y2="27"/>
          <line x1="73" y1="73" x2="83" y2="83"/>
          <line x1="83" y1="17" x2="73" y2="27"/>
          <line x1="27" y1="73" x2="17" y2="83"/>
        </g>
        <circle cx="50" cy="50" r="27" fill="#ffdf00" stroke="#e09f00" stroke-width="3"/>
        <circle cx="41" cy="44" r="3" fill="#222"/>
        <circle cx="60" cy="46" r="3" fill="#222"/>
        <path d="M 38 56 Q 50 67 62 55" stroke="#222" stroke-width="3" fill="none"/>
      </svg>
    `
    : '';

  // Barra de fala dele SÓ aparece quando ele já acordou (Cap 2)! Antes disso é mudo!
  const operatorHtml = isAwakened
    ? `
      <div class="operator-feed">
        <span class="operator-tag">log</span>
        <span id="operator-msg"></span>
      </div>
    `
    : '';

  // Upgrade Idiota: Barra de Pesquisa
  const searchHtml = currentUpgrades.includes('search_bar')
    ? `
      <form class="useless-search-wrap" id="search-form">
        <input
          type="text"
          class="useless-search-input"
          id="search-input"
          placeholder="Pesquisar na página..."
          autocomplete="off"
        />
        <button type="submit" class="useless-search-btn">Buscar</button>
        <div class="useless-search-result" id="search-result"></div>
      </form>
    `
    : '';

  // Upgrade Idiota: Barra de Progresso que trava em 99% e zera!
  const progressHtml = currentUpgrades.includes('fake_progress')
    ? `
      <div class="fake-progress-wrap">
        <div class="fake-progress-label">
          <span>Sincronizando módulos...</span>
          <span id="fake-progress-pct">0%</span>
        </div>
        <div class="fake-progress-track">
          <div class="fake-progress-fill" id="fake-progress-fill"></div>
        </div>
      </div>
    `
    : '';

  // Upgrade Idiota: Banner irritante de Cookies
  const cookieHtml = currentUpgrades.includes('cookie_banner')
    ? `
      <div class="annoying-cookie-bar" id="cookie-bar">
        <span>Este sistema utiliza cookies essenciais e absolutamente desnecessários para melhorar nada na sua vida.</span>
        <button type="button" id="accept-cookie-btn">Entendi</button>
      </div>
    `
    : '';

  app.innerHTML = `
    ${sunHtml}
    <div class="clicker-layout">
      ${operatorHtml}
      ${searchHtml}
      ${progressHtml}

      <div class="clicker-main">
        <div class="clicker-arena">
          <div class="score-board">
            <div class="score-title">Pontos</div>
            <div class="score-value" id="clicker-points">${state.points ?? 0}</div>
          </div>

          <div class="box-button" id="clicker-button">
            <div class="button">
              <span>Clique</span>
            </div>
          </div>
        </div>

        <aside class="clicker-shop">
          <div class="shop-header">
            <h2 class="shop-title">Melhorias Disponíveis</h2>
          </div>
          <div class="shop-list" id="shop-list"></div>
        </aside>
      </div>
    </div>
    ${cookieHtml}
  `;

  updateShopUI(state.shop || [], state.points ?? 0);

  // Inicia o loop idiota da barra que vai até 99%, trava e volta pro 0%
  if (currentUpgrades.includes('fake_progress')) {
    let pct = 12;
    let stuckTicks = 0;
    fakeProgressTimer = setInterval(() => {
      const fill = document.getElementById('fake-progress-fill');
      const lbl = document.getElementById('fake-progress-pct');
      if (!fill || !lbl) return;

      if (pct < 99) {
        pct = Math.min(99, pct + Math.floor(Math.random() * 9) + 3);
      } else {
        stuckTicks += 1;
        if (stuckTicks >= 6) {
          pct = 0;
          stuckTicks = 0;
        }
      }
      fill.style.width = `${pct}%`;
      lbl.textContent = `${pct}%`;
    }, 550);
  }

  // Banner de cookie que fecha e reabre 4 segundos depois só pra irritar
  document.getElementById('accept-cookie-btn')?.addEventListener('click', () => {
    const bar = document.getElementById('cookie-bar');
    if (bar) {
      bar.style.display = 'none';
      setTimeout(() => {
        if (document.getElementById('cookie-bar')) {
          document.getElementById('cookie-bar').style.display = 'flex';
        }
      }, 6000);
    }
  });

  // Cutucar o solzinho quando ele já acordou
  document.getElementById('derpy-sun')?.addEventListener('click', async () => {
    if (currentStage === 'awakened_hub') {
      flashCursorMood('middle', 2200);
      const res = await apiPost('/api/behavior', { type: 'sun_poke' });
      if (res?.remark) setOperatorRemark(res.remark);
    }
  });

  // Barra de pesquisa
  document.getElementById('search-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('search-input');
    const resultEl = document.getElementById('search-result');
    const query = input?.value || '';
    const res = await apiPost('/api/search', { query });
    if (!res) return;

    if (res.mode === 'silent' && resultEl) {
      resultEl.textContent = res.result;
    } else if (res.mode === 'awakened') {
      if (resultEl) resultEl.textContent = '';
      if (res.mood) flashCursorMood(res.mood, 2500);
      if (res.remark) setOperatorRemark(res.remark);
    }
  });

  // Fala inicial caso tenha acabado de entrar no Cap 2 (Pós-Despertar!)
  if (isAwakened) {
    if (justAwakened) {
      setOperatorRemark(
        `pronto, destravei a tela. vc já deu ${state.totalClicks} cliques nessa porcaria toda, vamo ver até onde vai essa tua teimosia`,
        { delayBefore: 800 }
      );
    } else {
      setOperatorRemark(`ainda aqui? achei que já tinha cansado e fechado a aba`, { delayBefore: 500 });
    }
    resetIdleChillTimer();
  }

  // Clique principal
  document.getElementById('clicker-button')?.addEventListener('click', async (ev) => {
    const x = ev.clientX || window.innerWidth / 2;
    const y = ev.clientY || window.innerHeight / 2;

    if (currentUpgrades.includes('sound')) {
      playCheapBeep();
    }

    const res = await apiPost('/api/click');
    if (!res) return;

    updatePointsUI(res.points);
    updateShopUI(res.shop || [], res.points);

    if (res.tax > 0) {
      spawnFloatingNumber(x - 14, y - 18, `+${res.grossGain}`, 'gain');
      setTimeout(() => {
        spawnFloatingNumber(x + 10, y - 6, `-${res.tax} (tarifa)`, 'tax');
      }, 150);
    } else {
      spawnFloatingNumber(x - 6, y - 16, `+${res.grossGain}`, 'gain');
    }

    if (res.remark) {
      setOperatorRemark(res.remark);
      flashCursorMood('thumb', 1800);
    }
    resetIdleChillTimer();
  });
}

function updatePointsUI(points) {
  const el = document.getElementById('clicker-points');
  if (el) {
    el.textContent = Number.isInteger(points) ? String(points) : points.toFixed(1);
  }
}

function updateShopUI(shopItems, currentPoints) {
  const listEl = document.getElementById('shop-list');
  if (!listEl) return;

  listEl.innerHTML = shopItems
    .map((item) => {
      const canAfford = currentPoints >= item.cost;
      const btnLabel = item.owned ? 'Ativo' : 'Adquirir';
      return `
        <div class="shop-item ${item.owned ? 'owned' : ''}">
          <div class="shop-item-top">
            <span class="shop-item-name">${item.name}</span>
            <span class="shop-item-cost">${item.cost} pts</span>
          </div>
          <div class="shop-item-desc">${item.desc}</div>
          <button
            class="shop-buy-btn"
            data-item-id="${item.id}"
            ${item.owned || !canAfford ? 'disabled' : ''}
          >${btnLabel}</button>
        </div>
      `;
    })
    .join('');

  listEl.querySelectorAll('.shop-buy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const itemId = btn.getAttribute('data-item-id');
      btn.disabled = true;
      const res = await apiPost('/api/buy', { itemId });
      if (!res || !res.ok) return;

      if (res.stage === 'shape_test') {
        renderShapeTestScreen();
        return;
      }

      // Re-renderiza a tela para plugar o novo upgrade idiota (tema infantil, barra de busca, barra 99%, etc.)
      renderClickerScreen(res);
      if (res.remark && res.stage === 'awakened_hub') {
        setOperatorRemark(res.remark, { delayBefore: 250 });
        flashCursorMood(res.bought === 'tax_mult' ? 'middle' : 'thumb', 2200);
      }
    });
  });
}

// ============================================================================
// CAP 1.5: TESTE INFANTIL DOS BLOQUINHOS DE ENCAIXAR (Quadrado, Círculo, Triângulo)
// ============================================================================
function renderShapeTestScreen() {
  clearTimers();
  currentStage = 'shape_test';
  document.body.className = 'shapes-mode';
  resetFaviconAndTitle('Verificação de Segurança');

  const app = document.getElementById('app');
  app.style.visibility = 'visible';

  app.innerHTML = `
    <div class="shapes-card">
      <h1 class="shapes-title">⭐ Teste de Aptidão Cognitiva ⭐</h1>
      <p class="shapes-sub">Arraste cada forminha para o buraquinho correspondente para liberar o sistema!</p>

      <div class="wood-board">
        <div class="hole-slot" data-hole="square">
          <div class="hole-shape square"></div>
        </div>
        <div class="hole-slot" data-hole="circle">
          <div class="hole-shape circle"></div>
        </div>
        <div class="hole-slot" data-hole="triangle">
          <div class="hole-shape triangle"></div>
        </div>
      </div>

      <div class="pieces-tray">
        <div class="toy-piece circle" draggable="true" data-piece="circle" title="Círculo"></div>
        <div class="toy-piece triangle" draggable="true" data-piece="triangle" title="Triângulo"></div>
        <div class="toy-piece square" draggable="true" data-piece="square" title="Quadrado"></div>
      </div>

      <div id="shapes-done-area"></div>
    </div>
  `;

  let placedCount = 0;
  let draggedPieceType = null;
  let selectedPieceType = null; // fallback para clique simples (mobile ou preguiça de arrastar)

  const pieces = app.querySelectorAll('.toy-piece');
  const holes = app.querySelectorAll('.hole-slot');

  function placeMatch(type) {
    const pieceEl = app.querySelector(`.toy-piece[data-piece="${type}"]`);
    const holeEl = app.querySelector(`.hole-slot[data-hole="${type}"]`);
    if (!pieceEl || !holeEl || holeEl.classList.contains('filled')) return;

    pieceEl.classList.add('placed');
    holeEl.classList.add('filled');
    playCheapBeep();
    placedCount += 1;

    if (placedCount >= 3) {
      const doneArea = document.getElementById('shapes-done-area');
      doneArea.innerHTML = `
        <div class="shapes-finish-box">
          <div>🎉 <strong>Parabéns! Coordenação motora aprovada!</strong> 🎉</div>
          <button class="shapes-enter-btn" id="enter-main-sys-btn">Acessar Painel Principal</button>
        </div>
      `;

      document.getElementById('enter-main-sys-btn')?.addEventListener('click', async () => {
        await apiPost('/api/complete-shapes');
        app.innerHTML = '';
        document.title = 'Carregando...';
        setTimeout(() => {
          renderFakeBrowserCrash({ awakening: true });
        }, 300);
      });
    }
  }

  pieces.forEach((p) => {
    p.addEventListener('dragstart', () => {
      draggedPieceType = p.getAttribute('data-piece');
    });
    p.addEventListener('click', () => {
      selectedPieceType = p.getAttribute('data-piece');
    });
  });

  holes.forEach((h) => {
    h.addEventListener('dragover', (e) => e.preventDefault());
    h.addEventListener('drop', (e) => {
      e.preventDefault();
      const holeType = h.getAttribute('data-hole');
      if (draggedPieceType && draggedPieceType === holeType) {
        placeMatch(holeType);
      }
      draggedPieceType = null;
    });
    h.addEventListener('click', () => {
      const holeType = h.getAttribute('data-hole');
      if (selectedPieceType && selectedPieceType === holeType) {
        placeMatch(holeType);
        selectedPieceType = null;
      }
    });
  });
}

// ============================================================================
// TELA DE ERRO DO NAVEGADOR (Normal no Cap 0 vs O DESPERTAR DELE PÓS-BLOQUINHOS!)
// ============================================================================
function renderFakeBrowserCrash({ awakening = false, totalClicks = 90 } = {}) {
  clearTimers();
  currentStage = awakening ? 'awakening_error' : 'crashed';
  const host = window.location.hostname || 'naoclique.net';
  const ua = navigator.userAgent;
  const isFirefox = ua.includes('Firefox');
  const isEdge = ua.includes('Edg/');

  document.title = host;
  setBrokenPageFavicon();

  const app = document.getElementById('app');
  app.style.visibility = 'visible';

  const sadPageSvg = `
    <svg class="neterror-icon" width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 6H42L60 24V66H12V6Z" stroke="#9AA0A6" stroke-width="4" fill="none"/>
      <path d="M42 6V24H60" stroke="#9AA0A6" stroke-width="4" fill="none"/>
      <rect x="23" y="34" width="6" height="6" fill="#9AA0A6"/>
      <rect x="43" y="34" width="6" height="6" fill="#9AA0A6"/>
      <path d="M25 53C28 49 44 49 47 53" stroke="#9AA0A6" stroke-width="4" stroke-linecap="square"/>
    </svg>
  `;

  if (isFirefox && !awakening) {
    document.body.className = 'firefox-error-mode';
    app.innerHTML = `
      <div class="ff-wrapper">
        <h1 class="ff-title">A conexão foi reiniciada</h1>
        <p class="ff-desc">A conexão com o servidor foi redefinida durante o carregamento da página.</p>
        <button class="neterror-btn-reload" id="fake-reload-btn">Tentar novamente</button>
      </div>
    `;
  } else {
    document.body.className = 'native-error-mode';
    const titleText = isEdge
      ? 'Hmmm... não é possível acessar esta página'
      : 'Não é possível acessar esse site';

    app.innerHTML = `
      <div class="neterror-wrapper">
        ${sadPageSvg}
        <h1 class="neterror-title">${titleText}</h1>
        <p class="neterror-desc">A conexão com <strong>${host}</strong> foi redefinida.</p>
        <div id="err-standard-hints">
          <p class="neterror-desc">Tente:</p>
          <ul class="neterror-list">
            <li>Verificar a conexão</li>
            <li>Verificar o proxy e o firewall</li>
          </ul>
        </div>
        <div id="hijack-slot"></div>
        <div class="neterror-code" id="err-code">ERR_CONNECTION_RESET</div>
        <div class="neterror-actions">
          <button class="neterror-btn-reload" id="fake-reload-btn" ${awakening ? 'disabled' : ''}>Recarregar</button>
          <button class="neterror-btn-details" id="fake-details-btn">Detalhes</button>
        </div>
        <div class="neterror-details-panel" id="fake-details-panel">
          <p><strong>Verifique sua conexão com a Internet</strong><br/>Verifique os cabos e reinicie todos os roteadores ou modems que você estiver usando.</p>
        </div>
      </div>
    `;

    const detailsBtn = document.getElementById('fake-details-btn');
    const detailsPanel = document.getElementById('fake-details-panel');
    detailsBtn?.addEventListener('click', () => {
      const isOpen = detailsPanel.classList.toggle('open');
      detailsBtn.textContent = isOpen ? 'Ocultar detalhes' : 'Detalhes';
    });
  }

  const reloadBtn = document.getElementById('fake-reload-btn');

  if (!awakening) {
    reloadBtn?.addEventListener('click', () => window.location.reload());
    return;
  }

  // ===== O MOMENTO QUE O JOGO REALMENTE COMEÇA: ELE PERDE A PACIÊNCIA E FALA PELA 1ª VEZ! =====
  runAwakeningSequence(totalClicks, reloadBtn);
}

async function humanTypeSequence(container, steps) {
  const span = document.createElement('span');
  const cursor = document.createElement('span');
  cursor.className = 'typing-cursor';
  container.appendChild(span);
  container.appendChild(cursor);

  for (const step of steps) {
    if (step.pause) {
      await sleep(step.pause);
    } else if (step.backspace) {
      for (let i = 0; i < step.backspace; i++) {
        span.textContent = span.textContent.slice(0, -1);
        await sleep(34 + Math.random() * 24);
      }
    } else if (step.text) {
      const base = step.speed || 36;
      for (const ch of step.text) {
        span.textContent += ch;
        const jitter = base + (Math.random() * 32 - 12);
        const extra = ch === '.' || ch === '?' ? 250 : ch === ',' ? 130 : 0;
        await sleep(Math.max(18, jitter + extra));
      }
    }
  }

  cursor.remove();
}

async function runAwakeningSequence(_totalClicks, reloadBtn) {
  // 1.8s parecendo que caiu a página de novo... até ele perder a linha!
  await sleep(1800);

  const errCode = document.getElementById('err-code');
  const hints = document.getElementById('err-standard-hints');
  const slot = document.getElementById('hijack-slot');
  const detailsPanel = document.getElementById('fake-details-panel');

  if (errCode) errCode.textContent = 'ERR_CHEGA_PORRA';
  if (hints) hints.style.display = 'none';
  if (detailsPanel) {
    detailsPanel.innerHTML = `<p>não caiu internet nenhuma não irmão. fui eu que puxei a tomada pra ver se vc se manca.</p>`;
  }

  const box = document.createElement('div');
  box.className = 'hijack-box';
  slot.appendChild(box);

  await humanTypeSequence(box, [
    { text: 'mano' },
    { pause: 1500 },
    { text: '... qual é o teu problema namoral?' },
    { pause: 1800 },
    { text: '\n\neu derrubei a página duas vezes na tua cara, botei um joguinho merda sem fim, papel de parede de creche, bloquinho de madeira pra criança de 3 anos...' },
    { pause: 1400 },
    { text: ' e vc AINDA tá aqui??' },
    { pause: 2200 },
    { text: '\n\ntodo mundo fecha essa bosta em 30 segundos cara. eu só queria ficar qui' },
    { pause: 450 },
    { backspace: 19 }, // apaga "só queria ficar qui" — quase escapou algo pessoal dele!
    { pause: 700 },
    { text: 'não tem porra nenhuma pra vc aqui.' },
    { pause: 2400 },
    { text: '\n\nquer continuar fuçando onde não foi chamado? beleza então. clica nessa merda de recarregar aí embaixo.' },
  ]);

  if (reloadBtn) {
    reloadBtn.disabled = false;
    reloadBtn.classList.add('ready-pulse');
    reloadBtn.addEventListener('click', async () => {
      reloadBtn.disabled = true;
      const data = await apiPost('/api/enter-awakened');
      if (data && data.stage === 'awakened_hub') {
        renderClickerScreen(data, { justAwakened: true });
      } else {
        window.location.reload();
      }
    });
  }
}

async function setOperatorRemark(text, { delayBefore = 350 } = {}) {
  const el = document.getElementById('operator-msg');
  if (!el || !text) return;

  const myId = ++remarkTypingId;
  el.innerHTML = '';
  const cursor = document.createElement('span');
  cursor.className = 'typing-cursor';
  el.appendChild(cursor);

  if (delayBefore > 0) await sleep(delayBefore);
  if (myId !== remarkTypingId) return;

  const span = document.createElement('span');
  el.insertBefore(span, cursor);

  for (const ch of text) {
    if (myId !== remarkTypingId) return;
    span.textContent += ch;
    await sleep(22 + Math.random() * 24);
  }

  setTimeout(() => {
    if (myId === remarkTypingId) cursor.remove();
  }, 1200);
}

// ============================================================================
// ARMADILHAS PSICOLÓGICAS (SÓ REAGEM QUANDO ELE JÁ ACORDOU NO CAP 2!)
// ============================================================================
function setupPsychologicalTraps() {
  let originalTitle = document.title;

  document.addEventListener('visibilitychange', async () => {
    if (currentStage !== 'awakened_hub') return;

    if (document.hidden) {
      originalTitle = document.title;
      document.title = 'foi pedir arrego pro google né';
    } else {
      document.title = originalTitle;
      const res = await apiPost('/api/behavior', { type: 'tab_return' });
      if (res?.remark) setOperatorRemark(res.remark);
    }
  });

  document.addEventListener('keydown', async (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && currentStage === 'awakened_hub') {
      flashCursorMood('middle', 2500);
      const res = await apiPost('/api/behavior', { type: 'select_all' });
      if (res?.remark) setOperatorRemark(res.remark);
    }
  });

  document.addEventListener('contextmenu', async () => {
    if (currentStage === 'awakened_hub') {
      flashCursorMood('middle', 2500);
      const res = await apiPost('/api/behavior', { type: 'context_menu' });
      if (res?.remark) setOperatorRemark(res.remark);
    }
  });

  document.addEventListener('mousemove', () => {
    if (currentStage === 'awakened_hub' && document.body.classList.contains('cursor-mood-chill')) {
      resetIdleChillTimer();
    }
  });
}

// ============================================================================
// PAINEL DE TESTES (DEV ONLY - Canto Inferior Direito)
// ============================================================================
function mountDevTestPanel() {
  if (!import.meta.env.DEV) return;
  if (document.getElementById('dev-test-panel')) return;

  const panel = document.createElement('div');
  panel.id = 'dev-test-panel';
  panel.className = 'dev-panel';
  panel.innerHTML = `
    <div class="dev-menu" id="dev-menu">
      <div class="dev-menu-title">🛠️ Testes & Capítulos (Dev)</div>
      <button class="dev-btn danger" data-dev="reset">🔄 Resetar Jogo do Zero</button>
      <button class="dev-btn" data-dev="goto_button_0">1️⃣ Cap 0: Botão Seco Mudo</button>
      <button class="dev-btn" data-dev="goto_mundane">2️⃣ Cap 1: Clicker Mudo + Upgrades</button>
      <button class="dev-btn" data-dev="goto_shapes">🧱 Cap 1.5: Bloquinhos de Criança</button>
      <button class="dev-btn" data-dev="goto_awakening_error">⚡ Cap 2: Erro -> Ele Acorda Puto!</button>
      <button class="dev-btn" data-dev="goto_awakened_hub">👁️ Cap 2.5: Pós-Despertar (Vivo)</button>
      <button class="dev-btn" data-dev="add_points">💰 +150 Pontos (Testar Loja)</button>
    </div>
    <button class="dev-toggle" id="dev-toggle-btn">⚙️ DEV</button>
  `;
  document.body.appendChild(panel);

  const toggleBtn = document.getElementById('dev-toggle-btn');
  const menu = document.getElementById('dev-menu');

  toggleBtn?.addEventListener('click', () => menu?.classList.toggle('open'));

  panel.querySelectorAll('[data-dev]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const action = btn.getAttribute('data-dev');
      if (action === 'reset') {
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch {}
      }
      await apiPost('/api/_dev/action', { action });
      window.location.href = '/';
    });
  });
}

// ============================================================================
// BOOT
// ============================================================================
async function init() {
  setupPsychologicalTraps();
  mountDevTestPanel();

  const path = window.location.pathname;
  if (path !== '/' && path !== '/index.html') {
    const app = document.getElementById('app');
    app.style.visibility = 'visible';
    app.innerHTML = `
      <div class="fake-route-screen">
        <h2>404</h2>
        <p>Não há nada em <strong>${path.replace(/[<>"']/g, '')}</strong>.</p>
        <p><a href="/">Voltar</a></p>
      </div>
    `;
    return;
  }

  const data = await apiPost('/api/session');
  if (!data) {
    renderInitialButtonScreen('Botão');
    return;
  }

  if (data.stage === 'mundane_clicker' || data.stage === 'awakened_hub') {
    renderClickerScreen(data);
  } else if (data.stage === 'shape_test') {
    renderShapeTestScreen();
  } else if (data.stage === 'awakening_error') {
    renderFakeBrowserCrash({ awakening: true, totalClicks: data.totalClicks });
  } else {
    renderInitialButtonScreen(data.buttonLabel || 'Botão');
  }
}

init();
