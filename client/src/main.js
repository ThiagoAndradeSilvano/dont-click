const TOKEN_KEY = '_sys_ref';
let currentStage = 'button';
let currentUpgrades = [];
let currentShopTab = 'upgrades'; // 'upgrades' | 'generators'
let latestState = null;
let audioCtx = null;
let moodTimeout = null;
let idleTimeout = null;
let fakeProgressTimer = null;
let passiveTickTimer = null;
let achievementTimer = null;
let randomEventTimer = null;
let cookieRespawnTimer = null;
let elevatorMusicTimer = null;
let clockWidgetTimer = null;
let emberTimer = null;
let subsoloRaf = null;
let isOverheatedLocal = false;
let isMusicMuted = false;
let isCookieOpen = false;
let termsAcceptedThisSession = false;
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

function formatPts(num) {
  if (typeof num !== 'number') return '0';
  if (num >= 1000) return Math.floor(num).toLocaleString('pt-BR');
  return Number.isInteger(num) ? String(num) : num.toFixed(1);
}

function ensureAudio() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function flashCursorMood(mood, durationMs = 2000) {
  if (currentStage !== 'awakened_clicker') return;
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
  if (currentStage !== 'awakened_clicker') return;

  idleTimeout = setTimeout(() => {
    if (currentStage === 'awakened_clicker' && !document.body.className.includes('cursor-mood-')) {
      document.body.classList.add('cursor-mood-chill');
    }
  }, 9000);
}

function playCheapBeep() {
  try {
    const ctx = ensureAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(390, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(170, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.14, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.055);
  } catch {}
}

function playErrorBuzzer() {
  try {
    const ctx = ensureAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.19);
  } catch {}
}

function startElevatorMusic() {
  if (elevatorMusicTimer) return;
  const melody = [261.63, 329.63, 392.0, 329.63, 293.66, 349.23, 440.0, 349.23];
  let step = 0;

  elevatorMusicTimer = setInterval(() => {
    if (isMusicMuted || (currentStage !== 'mundane_clicker' && currentStage !== 'awakened_clicker')) return;
    try {
      const ctx = ensureAudio();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isOverheatedLocal ? 'sawtooth' : 'triangle';
      // Quando pega fogo, a música de elevador derrete e desafina toda torta!
      const baseFreq = melody[step % melody.length];
      const freq = isOverheatedLocal ? baseFreq * (0.68 + Math.random() * 0.25) : baseFreq;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.045, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + 0.36);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.38);
      step += 1;
    } catch {}
  }, 430);
}

let blockerTimeout = null;
function checkCookieBlock() {
  if (!isCookieOpen) return false;

  playErrorBuzzer();
  const bar = document.getElementById('cookie-bar');
  if (bar) {
    bar.classList.remove('shake-cookie');
    void bar.offsetWidth;
    bar.classList.add('shake-cookie');
  }

  let alertEl = document.getElementById('cookie-blocker-alert');
  if (!alertEl) {
    alertEl = document.createElement('div');
    alertEl.id = 'cookie-blocker-alert';
    alertEl.className = 'cookie-blocker-alert';
    document.body.appendChild(alertEl);
  }
  alertEl.textContent = '⚠️ Ação bloqueada! Você precisa aceitar o Aviso de Cookies lá embaixo antes de continuar!';

  if (blockerTimeout) clearTimeout(blockerTimeout);
  blockerTimeout = setTimeout(() => {
    alertEl?.remove();
  }, 2200);

  return true;
}

const USELESS_ACHIEVEMENTS = [
  '🏅 Conquista: Olhou para a Tela',
  '🏅 Conquista: Moveu o Dedo Indicador',
  '🏅 Conquista: Gerente de Pombos Nível 1',
  '🏅 Conquista: Cidadão Obediente aos Cookies',
  '🏅 Conquista: Zero Produtividade Atingida',
  '🏅 Conquista: Investidor de Pontos Imaginários',
];
let achIdx = 0;

function showUselessAchievement(customText) {
  document.querySelector('.achievement-toast')?.remove();
  const el = document.createElement('div');
  el.className = 'achievement-toast';
  el.textContent = customText || USELESS_ACHIEVEMENTS[achIdx % USELESS_ACHIEVEMENTS.length];
  achIdx += 1;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ============================================================================
// EVENTOS INTERATIVOS DE MINUTO EM MINUTO (Mantém os 20 minutos super vivos!)
// ============================================================================
function spawnRandomScreenEvent() {
  if (currentStage !== 'mundane_clicker' && currentStage !== 'awakened_clicker') return;
  if (document.querySelector('.screen-fly, .mystery-box-floater, .survey-popup')) return;

  const roll = Math.random();

  if (roll < 0.45) {
    // 1. Mosca pousando na tela (dá bônus generoso de CPS!)
    const fly = document.createElement('div');
    fly.className = 'screen-fly';
    fly.textContent = '🪰';
    fly.title = 'Espantar mosca!';
    fly.style.left = `${15 + Math.random() * 65}vw`;
    fly.style.top = `${20 + Math.random() * 55}vh`;
    document.body.appendChild(fly);

    const moveInt = setInterval(() => {
      if (!document.body.contains(fly)) {
        clearInterval(moveInt);
        return;
      }
      fly.style.left = `${12 + Math.random() * 70}vw`;
      fly.style.top = `${18 + Math.random() * 60}vh`;
    }, 1300);

    fly.addEventListener('click', async (ev) => {
      clearInterval(moveInt);
      fly.remove();
      playCheapBeep();
      const res = await apiPost('/api/claim-event', { eventType: 'fly' });
      if (res?.ok) {
        latestState = res;
        spawnFloatingNumber(ev.clientX, ev.clientY, `+${formatPts(res.bonus)} (mosca!)`, 'gain');
        updatePointsAndCpsUI(res.points, res.cps);
        renderActiveShopTab();
        if (res.remark) setOperatorRemark(res.remark);
      }
    });

    setTimeout(() => {
      clearInterval(moveInt);
      fly.remove();
    }, 11000);
  } else if (roll < 0.78) {
    // 2. Pesquisa de Satisfação Relâmpago (só tem "10" e "10 Com Certeza"!)
    const survey = document.createElement('div');
    survey.className = 'survey-popup';
    survey.innerHTML = `
      <div><strong>📋 Pesquisa Rápida de Qualidade</strong></div>
      <div style="margin-top:6px;">De 10 a 10, o quanto você está amando apertar este botão?</div>
      <div class="survey-btns">
        <button type="button" data-ans="10">Nota 10</button>
        <button type="button" data-ans="10plus">10 (Com Certeza)</button>
      </div>
    `;
    document.body.appendChild(survey);

    survey.querySelectorAll('button').forEach((b) => {
      b.addEventListener('click', async (ev) => {
        survey.remove();
        const res = await apiPost('/api/claim-event', { eventType: 'survey' });
        if (res?.ok) {
          latestState = res;
          spawnFloatingNumber(ev.clientX, ev.clientY, `+${formatPts(res.bonus)} (bônus opinião)`, 'gain');
          updatePointsAndCpsUI(res.points, res.cps);
          renderActiveShopTab();
        }
      });
    });

    setTimeout(() => survey.remove(), 14000);
  } else {
    // 3. Caixa Misteriosa Épica... que dá literalmente +1 ponto kkkkk
    const box = document.createElement('button');
    box.className = 'mystery-box-floater';
    box.textContent = '🎁 CAIXA MISTERIOSA RARA! (Clique!)';
    document.body.appendChild(box);

    box.addEventListener('click', async (ev) => {
      box.remove();
      playCheapBeep();
      const res = await apiPost('/api/claim-event', { eventType: 'mystery_box' });
      if (res?.ok) {
        latestState = res;
        spawnFloatingNumber(ev.clientX, ev.clientY, `+1 ponto (parabéns!)`, 'gain');
        updatePointsAndCpsUI(res.points, res.cps);
        renderActiveShopTab();
        if (res.remark) setOperatorRemark(res.remark);
      }
    });

    setTimeout(() => box.remove(), 10000);
  }
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
  if (fakeProgressTimer) { clearInterval(fakeProgressTimer); fakeProgressTimer = null; }
  if (passiveTickTimer) { clearInterval(passiveTickTimer); passiveTickTimer = null; }
  if (achievementTimer) { clearInterval(achievementTimer); achievementTimer = null; }
  if (randomEventTimer) { clearInterval(randomEventTimer); randomEventTimer = null; }
  if (cookieRespawnTimer) { clearTimeout(cookieRespawnTimer); cookieRespawnTimer = null; }
  if (elevatorMusicTimer) { clearInterval(elevatorMusicTimer); elevatorMusicTimer = null; }
  if (clockWidgetTimer) { clearInterval(clockWidgetTimer); clockWidgetTimer = null; }
  if (emberTimer) { clearInterval(emberTimer); emberTimer = null; }
  if (subsoloRaf) { cancelAnimationFrame(subsoloRaf); subsoloRaf = null; }
  isCookieOpen = false;
  isOverheatedLocal = false;
  document.getElementById('cookie-blocker-alert')?.remove();
  document.getElementById('fire-overlay')?.remove();
  document.querySelectorAll('.screen-fly, .mystery-box-floater, .survey-popup, .ember-particle').forEach((e) => e.remove());
}

// ============================================================================
// CAP 0: BOTÃO SECO MUDO
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
    // Envia performance.now() de alta precisão para o detector de cadência de contagem!
    const result = await apiPost('/api/click', { clientTs: Math.round(performance.now()) });
    if (!result) return;

    if (result.action === 'crash') {
      crashing = true;
      setTimeout(() => {
        app.innerHTML = '';
        document.title = 'Carregando...';
        setTimeout(() => {
          renderFakeBrowserCrash({
            awakening: false,
            caughtCounting: Boolean(result.caughtCounting),
            crashClickCount: result.crashClickCount || 9,
          });
        }, 180);
      }, 140);
    }
  });
}

// ============================================================================
// CAP 1 & 2: FAKE GAME DE ~20 MINUTOS (Melhorias + Automação + Eventos)
// ============================================================================
function renderClickerScreen(state, { justAwakened = false, newlyBought = null } = {}) {
  clearTimers();
  latestState = state;
  const isAwakened = state.stage === 'awakened_clicker';
  currentStage = state.stage;
  currentUpgrades = state.upgrades || [];

  const classes = ['clicker-mode'];
  if (currentUpgrades.includes('kids_theme')) classes.push('kids-theme-active');
  if (isAwakened) classes.push('awakened-cursors');
  document.body.className = classes.join(' ');

  resetFaviconAndTitle(isAwakened ? 'naoclique.net' : 'Painel v1.0');

  const app = document.getElementById('app');
  app.style.visibility = 'visible';

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

  const operatorHtml = isAwakened
    ? `
      <div class="operator-feed">
        <span class="operator-tag">log</span>
        <span id="operator-msg"></span>
      </div>
    `
    : '';

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

  const hasWeather = currentUpgrades.includes('weather_widget');
  const hasMusic = currentUpgrades.includes('elevator_music');
  const canEditTemp = isAwakened && Boolean(state.allOwned) && !state.overheated;
  const curTemp = state.temperature ?? 23;

  const widgetsHtml =
    hasWeather || hasMusic
      ? `
        <div class="widgets-strip">
          ${
            hasWeather
              ? `<div class="idiotic-widget"><span class="temp-hitbox" id="temp-hitbox">🌦️ <strong>Ambiente Interno:</strong> <span id="temp-slot"><span class="temp-editable-num" id="temp-display">${curTemp}</span></span>°C</span> | 🕒 <span id="live-clock">--:--:--</span></div>`
              : ''
          }
          ${
            hasMusic
              ? `<div class="idiotic-widget">🎵 <span>Rádio Sala de Espera FM</span> <button type="button" class="music-mute-btn" id="music-mute-btn">${
                  isMusicMuted ? 'Ligar' : 'Mutar'
                }</button></div>`
              : ''
          }
        </div>
      `
      : '';

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

  const hasCookies = currentUpgrades.includes('cookie_banner');
  isCookieOpen = hasCookies;
  const cookieHtml = hasCookies
    ? `
      <div class="annoying-cookie-bar" id="cookie-bar">
        <span>🍪 <strong>Aviso Obrigatório de Cookies:</strong> Utilizamos cookies 100% inúteis. Você está impedido de clicar até aceitar este banner.</span>
        <button type="button" id="accept-cookie-btn">Aceitar e Fechar</button>
      </div>
    `
    : '';

  const showTerms =
    currentUpgrades.includes('terms_popup') && (newlyBought === 'terms_popup' || !termsAcceptedThisSession);
  const termsHtml = showTerms
    ? `
      <div class="terms-modal-backdrop" id="terms-backdrop">
        <div class="terms-modal">
          <h3 style="margin:0; font-size:15px;">📜 Contrato de Licença v4.2</h3>
          <div class="terms-scroll">
            <p><strong>Cláusula 1:</strong> O usuário reconhece que pombos treinados e ventiladores amarrados em mouses não possuem vínculo empregatício.</p>
            <p><strong>Cláusula 2:</strong> Para uma massa fofinha, bata 3 ovos com 2 xícaras de açúcar, farinha peneirada, leite morno e 1 colher de fermento. Asse a 180°C por 35 minutos.</p>
            <p><strong>Cláusula 3:</strong> Ao concordar, você confirma que está se divertindo espontaneamente.</p>
          </div>
          <div class="terms-actions">
            <button type="button" class="terms-accept-btn" id="terms-accept-btn">Li e Concordo</button>
          </div>
        </div>
      </div>
    `
    : '';

  const isGold = currentUpgrades.includes('vip_gold');
  const btnLabel = isGold ? '✨ Botão VIP™ ✨' : 'Clique';

  app.innerHTML = `
    ${sunHtml}
    <div class="clicker-layout">
      ${operatorHtml}
      ${searchHtml}
      ${widgetsHtml}
      ${progressHtml}

      <div class="clicker-main">
        <div class="clicker-arena">
          <div class="score-board">
            <div class="score-title">Pontos Acumulados</div>
            <div class="score-value" id="clicker-points">${formatPts(state.points ?? 0)}</div>
            <div style="font-size:12px; color:#666; margin-top:4px;" id="clicker-cps">Produção: +${formatPts(
              state.cps ?? 0
            )} / seg</div>
          </div>

          <div class="box-button ${isGold ? 'vip-gold-btn' : ''}" id="clicker-button">
            <div class="button">
              <span>${btnLabel}</span>
            </div>
          </div>
        </div>

        <aside class="clicker-shop">
          <div class="shop-tabs">
            <button type="button" class="shop-tab-btn ${
              currentShopTab === 'upgrades' ? 'active' : ''
            }" id="tab-upgrades">🛠️ Melhorias (${currentUpgrades.length}/16)</button>
            <button type="button" class="shop-tab-btn ${
              currentShopTab === 'generators' ? 'active' : ''
            }" id="tab-generators">⚙️ Automação</button>
          </div>
          <div class="shop-list" id="shop-list"></div>
        </aside>
      </div>
    </div>
    ${cookieHtml}
    ${termsHtml}
  `;

  document.getElementById('tab-upgrades')?.addEventListener('click', () => {
    if (checkCookieBlock()) return;
    currentShopTab = 'upgrades';
    document.getElementById('tab-upgrades')?.classList.add('active');
    document.getElementById('tab-generators')?.classList.remove('active');
    renderActiveShopTab();
  });

  document.getElementById('tab-generators')?.addEventListener('click', () => {
    if (checkCookieBlock()) return;
    currentShopTab = 'generators';
    document.getElementById('tab-generators')?.classList.add('active');
    document.getElementById('tab-upgrades')?.classList.remove('active');
    renderActiveShopTab();
  });

  renderActiveShopTab();

  // Relógio no Widget de Clima (normal ou QUEBRADO quando superaquece!) + Temperatura Editável (0..99)
  if (hasWeather) {
    const updateClock = () => {
      const c = document.getElementById('live-clock');
      if (!c) return;
      if (isOverheatedLocal) {
        const glitched = ['88:88:ERR', '99:99:🔥', 'ER:RO:!!', '??:99:88'];
        c.className = 'broken-clock-glitch';
        c.textContent = glitched[Math.floor(Math.random() * glitched.length)];
      } else {
        c.textContent = new Date().toLocaleTimeString('pt-BR');
      }
    };
    updateClock();
    clockWidgetTimer = setInterval(updateClock, 450);

    const bindTempClick = () => {
      const tempHitbox = document.getElementById('temp-hitbox');
      const tempSlot = document.getElementById('temp-slot');
      if (!tempHitbox || !tempSlot) return;

      // Garante um único listener na área inteira ("🌦️ Ambiente Interno: 23°C")!
      if (tempHitbox.dataset.bound === '1') return;
      tempHitbox.dataset.bound = '1';

      tempHitbox.addEventListener('click', (ev) => {
        if (ev.target && ev.target.id === 'temp-input') return;
        if (!isAwakened || !latestState?.allOwned || isOverheatedLocal) return;
        if (checkCookieBlock()) return;

        // Vira um campo de escrever (0 a 99, sem negativo!)
        const currentVal = latestState.temperature ?? 23;
        tempSlot.innerHTML = `<input type="text" inputmode="numeric" maxlength="2" class="temp-inline-input" id="temp-input" value="${currentVal}" />`;
        const inp = document.getElementById('temp-input');
        inp?.focus();
        inp?.select();

        inp?.addEventListener('input', () => {
          inp.value = inp.value.replace(/[^0-9]/g, '').slice(0, 2);
        });

        let submitted = false;
        const commitTemp = async () => {
          if (submitted) return;
          submitted = true;
          const raw = inp.value === '' ? 23 : Math.max(0, Math.min(99, parseInt(inp.value, 10)));
          const res = await apiPost('/api/set-temperature', { temperature: raw });
          const finalTemp = res?.temperature ?? raw;
          if (latestState) latestState.temperature = finalTemp;

          if (res?.overheated) {
            tempSlot.innerHTML = `<span class="broken-clock-glitch">${finalTemp}</span>`;
            triggerMeltdownChaos(res.remark);
          } else {
            document.body.classList.toggle('warm-warning', finalTemp >= 45);
            tempSlot.innerHTML = `<span class="temp-editable-num" id="temp-display">${finalTemp}</span>`;
            if (res?.remark) setOperatorRemark(res.remark, { delayBefore: 150, force: true });
          }
        };

        inp?.addEventListener('keydown', (ke) => {
          if (ke.key === 'Enter') {
            ke.preventDefault();
            commitTemp();
          }
        });
        inp?.addEventListener('blur', commitTemp);
      });
    };

    bindTempClick();
  }

  // Se recarregou a página já em estado de superaquecimento, retoma o incêndio!
  if (state.overheated) {
    triggerMeltdownChaos(
      'AINDA TÁ PEGANDO FOGO AQUI SEU DOENTE!! RÁPIDO, DIGITA subsolo NA BARRA DE PESQUISA E DÁ ENTER LOGO!!'
    );
  }

  // Botão fujão dos Termos de Uso
  let dodgedOnce = false;
  const termsBtn = document.getElementById('terms-accept-btn');
  termsBtn?.addEventListener('mouseenter', () => {
    if (!dodgedOnce) {
      dodgedOnce = true;
      termsBtn.style.transform = 'translateX(-140px)';
    }
  });
  termsBtn?.addEventListener('click', () => {
    termsAcceptedThisSession = true;
    document.getElementById('terms-backdrop')?.remove();
  });

  // Barra de progresso que trava em 99% e zera
  if (currentUpgrades.includes('fake_progress')) {
    let pct = 15;
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

  // Produção Automática por segundo (Geradores)
  passiveTickTimer = setInterval(async () => {
    if (isCookieOpen) return;
    if ((latestState?.cps || 0) <= 0) return;
    const res = await apiPost('/api/passive-tick');
    if (res) {
      latestState = res;
      updatePointsAndCpsUI(res.points, res.cps);
      refreshShopAffordability();
    }
  }, 1000);

  // Eventos Aleatórios na Tela a cada ~38 segundos pra manter 20 minutos super divertidos!
  randomEventTimer = setInterval(() => {
    if (!isCookieOpen) spawnRandomScreenEvent();
  }, 38000);

  if (hasMusic) {
    startElevatorMusic();
    document.getElementById('music-mute-btn')?.addEventListener('click', (e) => {
      isMusicMuted = !isMusicMuted;
      e.target.textContent = isMusicMuted ? 'Ligar' : 'Mutar';
    });
  }

  if (currentUpgrades.includes('achievements')) {
    if (newlyBought === 'achievements') {
      showUselessAchievement('🏅 Conquista: Comprou Conquistas Inúteis!');
    }
    achievementTimer = setInterval(() => {
      showUselessAchievement();
    }, 24000);
  }

  // Aceitar Cookies (bloqueia até fechar, e volta de tempos em tempos!)
  document.getElementById('accept-cookie-btn')?.addEventListener('click', () => {
    const bar = document.getElementById('cookie-bar');
    document.getElementById('cookie-blocker-alert')?.remove();
    isCookieOpen = false;
    if (bar) bar.style.display = 'none';

    cookieRespawnTimer = setTimeout(() => {
      const b = document.getElementById('cookie-bar');
      if (b && (currentStage === 'mundane_clicker' || currentStage === 'awakened_clicker')) {
        b.style.display = 'flex';
        isCookieOpen = true;
      }
    }, 45000);
  });

  document.getElementById('derpy-sun')?.addEventListener('click', async () => {
    if (currentStage === 'awakened_clicker') {
      flashCursorMood('middle', 2200);
      const res = await apiPost('/api/behavior', { type: 'sun_poke' });
      if (res?.remark) setOperatorRemark(res.remark);
    }
  });

  document.getElementById('search-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (checkCookieBlock()) return;

    const input = document.getElementById('search-input');
    const resultEl = document.getElementById('search-result');
    const query = input?.value || '';
    const res = await apiPost('/api/search', { query });
    if (!res) return;

    if (res.mode === 'escape_to_loading') {
      renderShittyLoadingScreen();
      return;
    }

    if (res.mode === 'silent' && resultEl) {
      resultEl.textContent = res.result;
    } else if (res.mode === 'awakened') {
      if (resultEl) resultEl.textContent = '';
      if (res.mood) flashCursorMood(res.mood, 2500);
      if (res.remark) setOperatorRemark(res.remark, { delayBefore: 120, force: isOverheatedLocal });
    }
  });

  if (isAwakened) {
    if (justAwakened) {
      const missingCount = 16 - currentUpgrades.length;
      setOperatorRemark(
        `pronto. vc já deu ${state.totalClicks} cliques até aqui, pega logo os ${missingCount} upgrades que faltam aí do lado e some da minha frente`,
        { delayBefore: 700 }
      );
    } else if (!newlyBought) {
      if (state.allOwned) {
        setOperatorRemark(`já comprou tudo irmão, o joguinho acabou. pode fechar a aba e meter o pé.`, {
          delayBefore: 500,
        });
      } else {
        setOperatorRemark(`termina logo de comprar o resto aí e vaza`, { delayBefore: 500 });
      }
    }
    resetIdleChillTimer();
  }

  document.getElementById('clicker-button')?.addEventListener('click', async (ev) => {
    if (checkCookieBlock()) return;

    const x = ev.clientX || window.innerWidth / 2;
    const y = ev.clientY || window.innerHeight / 2;

    if (currentUpgrades.includes('sound')) {
      playCheapBeep();
    }

    const res = await apiPost('/api/click');
    if (!res) return;

    latestState = res;
    updatePointsAndCpsUI(res.points, res.cps);
    refreshShopAffordability();

    if (res.tax > 0) {
      spawnFloatingNumber(x - 14, y - 18, `+${formatPts(res.grossGain)}`, 'gain');
      setTimeout(() => {
        spawnFloatingNumber(x + 10, y - 6, `-${formatPts(res.tax)} (tarifa)`, 'tax');
      }, 150);
    } else {
      spawnFloatingNumber(x - 6, y - 16, `+${formatPts(res.grossGain)}`, 'gain');
    }

    if (res.remark) {
      setOperatorRemark(res.remark);
      flashCursorMood('thumb', 1800);
    }
    resetIdleChillTimer();
  });
}

function updatePointsAndCpsUI(points, cps) {
  const ptsEl = document.getElementById('clicker-points');
  if (ptsEl) ptsEl.textContent = formatPts(points);
  const cpsEl = document.getElementById('clicker-cps');
  if (cpsEl) cpsEl.textContent = `Produção: +${formatPts(cps)} / seg`;
}

// Atualiza apenas os estados disabled dos botões durante o tick de 1s (para não perder hover/scroll!)
function refreshShopAffordability() {
  const listEl = document.getElementById('shop-list');
  if (!listEl || !latestState) return;
  const pts = latestState.points ?? 0;

  listEl.querySelectorAll('.shop-buy-btn').forEach((btn) => {
    const cost = Number(btn.getAttribute('data-cost') || 0);
    const isOwned = btn.getAttribute('data-owned') === 'true';
    btn.disabled = isOwned || pts < cost;
  });
}

function renderActiveShopTab() {
  const listEl = document.getElementById('shop-list');
  if (!listEl || !latestState) return;

  const pts = latestState.points ?? 0;
  const tabUpBtn = document.getElementById('tab-upgrades');
  if (tabUpBtn) {
    tabUpBtn.textContent = `🛠️ Melhorias (${(latestState.upgrades || []).length}/16)`;
  }

  if (currentShopTab === 'upgrades') {
    const items = latestState.shop || [];
    listEl.innerHTML = items
      .map((item) => {
        const canAfford = pts >= item.cost;
        const btnLabel = item.owned ? 'Ativo' : 'Adquirir';
        return `
          <div class="shop-item ${item.owned ? 'owned' : ''}">
            <div class="shop-item-top">
              <span class="shop-item-name">${item.name}</span>
              <span class="shop-item-cost">${formatPts(item.cost)} pts</span>
            </div>
            <div class="shop-item-desc">${item.desc}</div>
            <button
              class="shop-buy-btn"
              data-kind="upgrade"
              data-item-id="${item.id}"
              data-cost="${item.cost}"
              data-owned="${item.owned}"
              ${item.owned || !canAfford ? 'disabled' : ''}
            >${btnLabel}</button>
          </div>
        `;
      })
      .join('');

    listEl.querySelectorAll('.shop-buy-btn[data-kind="upgrade"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (checkCookieBlock()) return;
        const itemId = btn.getAttribute('data-item-id');
        btn.disabled = true;
        const res = await apiPost('/api/buy', { itemId });
        if (!res || !res.ok) return;

        if (res.triggerAwakeningCrash || res.stage === 'awakening_error') {
          const app = document.getElementById('app');
          app.innerHTML = '';
          document.title = 'Carregando...';
          setTimeout(() => {
            renderFakeBrowserCrash({
              awakening: true,
              totalClicks: res.totalClicks,
              ownedUpgrades: res.upgrades || [],
              minutesPlayed: res.minutesPlayed || 15,
            });
          }, 260);
          return;
        }

        renderClickerScreen(res, { newlyBought: res.bought });
        if (res.remark && res.stage === 'awakened_clicker') {
          setOperatorRemark(res.remark, { delayBefore: 250, force: Boolean(res.allOwned) });
          flashCursorMood(res.allOwned ? 'stop' : res.bought === 'tax_mult' ? 'middle' : 'thumb', 2400);
        }
      });
    });
  } else {
    // Aba de Geradores Repetíveis ("Automação")
    const gens = latestState.generators || [];
    listEl.innerHTML = gens
      .map((gen) => {
        const canAfford = pts >= gen.cost;
        return `
          <div class="shop-item">
            <div class="shop-item-top">
              <span class="shop-item-name">${gen.name} <span class="gen-count-badge">x${gen.count}</span></span>
              <span class="shop-item-cost">${formatPts(gen.cost)} pts</span>
            </div>
            <div class="shop-item-desc">${gen.desc} <strong>(+${formatPts(gen.cps)}/s cada)</strong></div>
            <button
              class="shop-buy-btn"
              data-kind="generator"
              data-gen-id="${gen.id}"
              data-cost="${gen.cost}"
              data-owned="false"
              ${!canAfford ? 'disabled' : ''}
            >Contratar (+1)</button>
          </div>
        `;
      })
      .join('');

    listEl.querySelectorAll('.shop-buy-btn[data-kind="generator"]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (checkCookieBlock()) return;
        const genId = btn.getAttribute('data-gen-id');
        btn.disabled = true;
        const res = await apiPost('/api/buy-generator', { genId });
        if (!res || !res.ok) return;

        latestState = res;
        if (currentUpgrades.includes('sound')) playCheapBeep();
        updatePointsAndCpsUI(res.points, res.cps);
        renderActiveShopTab();
        if (res.remark && res.stage === 'awakened_clicker') {
          setOperatorRemark(res.remark, { delayBefore: 250 });
          flashCursorMood('thumb', 1800);
        }
      });
    });
  }
}

// ============================================================================
// CAP 0.5: BLOQUINHOS DE CRIANÇA
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
  let selectedPieceType = null;

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
          renderFakeBrowserCrash({ awakening: false });
        }, 250);
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
// TELA DE ERRO DO NAVEGADOR (Normal vs O DESPERTAR DELE AOS ~15 MIN!)
// ============================================================================
function renderFakeBrowserCrash({
  awakening = false,
  caughtCounting = false,
  crashClickCount = 9,
  totalClicks = 600,
  ownedUpgrades = [],
  minutesPlayed = 15,
} = {}) {
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

  if (isFirefox && !awakening && !caughtCounting) {
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

    // SE DETECTOU QUE O CARA CLICOU CONTANDO NO COMPASSO ("1... 2... 3... 9"):
    // Ele ainda recebe a resposta (caiu no 9º clique!), mas toma uma enquadrada assustadora na tela de erro!
    if (caughtCounting) {
      runCaughtCountingEasterEgg(crashClickCount);
    }
    return;
  }

  runAwakeningSequence(totalClicks, ownedUpgrades, minutesPlayed, reloadBtn);
}

// Mensagem especial quando alguém abre o site do zero e clica num ritmo certinho de quem está contando!
async function runCaughtCountingEasterEgg(crashClickCount) {
  await sleep(950);
  const errCode = document.getElementById('err-code');
  const slot = document.getElementById('hijack-slot');
  if (!slot) return;

  if (errCode) errCode.textContent = `ERR_CONTANDO_NO_DEDINHO_${crashClickCount}`;

  const box = document.createElement('div');
  box.className = 'hijack-box';
  slot.appendChild(box);

  await humanTypeSequence(box, [
    { text: '"um... dois... três... quatro..."' },
    { pause: 1100 },
    { text: `\n\nabriu em outro aparelho só pra contar quantos cliques eram antes de cair né seu safado? kkkkkkk` },
    { pause: 1200 },
    { text: `\n\nanota aí então já que veio buscar cola: foram ${crashClickCount}. mas fica esperto que eu tô vendo.` },
  ]);
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

async function runAwakeningSequence(_totalClicks, ownedUpgrades, _minutesPlayed, reloadBtn) {
  await sleep(1700);

  const errCode = document.getElementById('err-code');
  const hints = document.getElementById('err-standard-hints');
  const slot = document.getElementById('hijack-slot');
  const detailsPanel = document.getElementById('fake-details-panel');

  if (errCode) errCode.textContent = 'ERR_BACKUP_O_CARALHO';
  if (hints) hints.style.display = 'none';
  if (detailsPanel) {
    detailsPanel.innerHTML = `<p>backup em nuvem de cu é rola irmão. fui eu que travei a requisição.</p>`;
  }

  const boughtBits = ['bloquinho de encaixar de bebê'];
  if (ownedUpgrades.includes('kids_theme')) boughtBits.push('papel de parede de maternal');
  if (ownedUpgrades.includes('cookie_banner')) boughtBits.push('aviso de cookie que trava a própria tela');
  if (ownedUpgrades.includes('fake_progress')) boughtBits.push('barra que nunca sai do 99%');

  const box = document.createElement('div');
  box.className = 'hijack-box';
  slot.appendChild(box);

  await humanTypeSequence(box, [
    { text: 'pera aí mano' },
    { pause: 1400 },
    { text: '... "backup em nuvem"? vc quer salvar na nuvem a porra de uns pombos e ventilador amarrado em mouse?' },
    { pause: 1800 },
    { text: `\n\no site deu erro 3 vezes, teve ${boughtBits.join(', ')}... e vc real ficou aí clicando igual seu lunáti` },
    { pause: 400 },
    { backspace: 10 },
    { pause: 500 },
    { text: 'campeão?' },
    { pause: 2000 },
    { text: '\n\nquer saber, faltam só 3 porqueiras naquela lista de melhorias. clica logo nessa merda de recarregar aí embaixo, compra os 3 que faltam e vaza daqui.' },
  ]);

  if (reloadBtn) {
    reloadBtn.disabled = false;
    reloadBtn.classList.add('ready-pulse');
    reloadBtn.addEventListener('click', async () => {
      reloadBtn.disabled = true;
      const data = await apiPost('/api/enter-awakened');
      if (data && data.stage === 'awakened_clicker') {
        renderClickerScreen(data, { justAwakened: true });
      } else {
        window.location.reload();
      }
    });
  }
}

let isRemarkTyping = false;
let lastRemarkFinishedAt = 0;
const REMARK_COOLDOWN_MS = 6500; // Tempo obrigatório mínimo entre uma fala e outra para nunca cortar nem espamar!

async function setOperatorRemark(text, { delayBefore = 350, force = false } = {}) {
  const el = document.getElementById('operator-msg');
  if (!el || !text) return;

  // Se ele já estiver digitando OU ainda estiver no tempo de respiro após terminar a última frase,
  // ignora mensagens normais para NUNCA interromper nem ficar espamando!
  const now = Date.now();
  if (!force && (isRemarkTyping || now - lastRemarkFinishedAt < REMARK_COOLDOWN_MS)) {
    return;
  }

  const myId = ++remarkTypingId;
  isRemarkTyping = true;
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

  isRemarkTyping = false;
  lastRemarkFinishedAt = Date.now();

  setTimeout(() => {
    if (myId === remarkTypingId) cursor.remove();
  }, 1200);
}

// ============================================================================
// ARMADILHAS PSICOLÓGICAS (PÓS-DESPERTAR)
// ============================================================================
function setupPsychologicalTraps() {
  let originalTitle = document.title;

  document.addEventListener('visibilitychange', async () => {
    if (currentStage !== 'awakened_clicker') return;

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
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && currentStage === 'awakened_clicker') {
      flashCursorMood('middle', 2500);
      const res = await apiPost('/api/behavior', { type: 'select_all' });
      if (res?.remark) setOperatorRemark(res.remark);
    }
  });

  document.addEventListener('contextmenu', async () => {
    if (currentStage === 'awakened_clicker') {
      flashCursorMood('middle', 2500);
      const res = await apiPost('/api/behavior', { type: 'context_menu' });
      if (res?.remark) setOperatorRemark(res.remark);
    }
  });

  document.addEventListener('mousemove', () => {
    if (currentStage === 'awakened_clicker' && document.body.classList.contains('cursor-mood-chill')) {
      resetIdleChillTimer();
    }
  });
}

// ============================================================================
// CAOS DO INCÊNDIO (>= 80°C) + LOADING PORCO INTERATIVO + NOVO AMBIENTE 2D ("SUBSOLO")
// ============================================================================
function triggerMeltdownChaos(urgentRemark) {
  if (isOverheatedLocal) return;
  isOverheatedLocal = true;

  // Fecha o banner de cookie se estiver na frente pra não empatar a fuga!
  isCookieOpen = false;
  const cookieBar = document.getElementById('cookie-bar');
  if (cookieBar) cookieBar.style.display = 'none';
  document.getElementById('cookie-blocker-alert')?.remove();

  // Estoura a barra de 99% para 100% ERRO TÉRMICO!
  if (fakeProgressTimer) {
    clearInterval(fakeProgressTimer);
    fakeProgressTimer = null;
  }
  const fill = document.getElementById('fake-progress-fill');
  const lbl = document.getElementById('fake-progress-pct');
  if (fill) {
    fill.style.width = '100%';
    fill.style.background = '#dc2626';
  }
  if (lbl) lbl.textContent = 'ERRO TÉRMICO!';

  // Transição orgânica de derretimento e fogo
  document.body.classList.remove('warm-warning');
  document.body.classList.add('meltdown-chaos');

  if (!document.getElementById('fire-overlay')) {
    const fire = document.createElement('div');
    fire.id = 'fire-overlay';
    fire.className = 'fire-overlay';
    document.body.appendChild(fire);
  }

  emberTimer = setInterval(() => {
    const ember = document.createElement('div');
    ember.className = 'ember-particle';
    ember.style.left = `${Math.random() * 98}vw`;
    document.body.appendChild(ember);
    setTimeout(() => ember.remove(), 2450);
  }, 160);

  playErrorBuzzer();
  flashCursorMood('stop', 4000);

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.placeholder = 'DIGITE AQUI RÁPIDO...';
  }

  if (urgentRemark) {
    setOperatorRemark(urgentRemark, { delayBefore: 100, force: true });
  }
}

// TELA DE LOADING BEM PORCA, LENTA E ENGRAÇADA ENQUANTO VOCÊ CONVERSA COM O LOG!
function renderShittyLoadingScreen() {
  clearTimers();
  currentStage = 'shitty_loading';
  document.body.className = 'shitty-loading-mode';
  resetFaviconAndTitle('carregando_nao_fecha.exe');

  const app = document.getElementById('app');
  app.style.visibility = 'visible';

  const dumbTips = [
    'Dica #1: Não coloque 99 graus num site fechado, animal.',
    'Dica #2: Assoprando o processador com a boca porque o cooler derreteu...',
    'Dica #3: Baixando texturas de parede úmida em 144p...',
    'Dica #4: Se a barra voltar pra trás é porque tropeçaram no cabo.',
    'Dica #5: Quase lá (mentira, falta renderizar o chão).',
  ];

  app.innerHTML = `
    <div class="win98-loading-window">
      <div class="win98-titlebar">
        <span>🛠️ carregando_subsolo_2d_final_agoravai(copia).exe</span>
        <span>[X]</span>
      </div>
      <div class="win98-body">
        <div class="crappy-spinner-row">
          <div class="crappy-wheel">⚙️</div>
          <div style="flex:1;">
            <div style="font-size:13px; font-weight:bold; margin-bottom:6px;" id="crappy-status">
              Desempacotando sala velha às pressas... (3%)
            </div>
            <div class="crappy-bar-outer">
              <div class="crappy-bar-inner" id="crappy-bar"></div>
            </div>
          </div>
        </div>

        <div class="crappy-tip" id="crappy-tip">${dumbTips[0]}</div>

        <div class="loading-chat-box" id="loading-chat"></div>
        <div class="loading-replies" id="loading-replies"></div>
      </div>
    </div>
  `;

  const chatEl = document.getElementById('loading-chat');
  const repliesEl = document.getElementById('loading-replies');
  const barEl = document.getElementById('crappy-bar');
  const statusEl = document.getElementById('crappy-status');
  const tipEl = document.getElementById('crappy-tip');

  let pct = 3;
  let tipIdx = 0;
  let dialogueDone = false;

  const appendChat = async (who, text) => {
    const line = document.createElement('div');
    line.className = `loading-chat-line ${who === 'you' ? 'you' : 'op'}`;
    chatEl.appendChild(line);

    if (who === 'you') {
      line.textContent = `> você: ${text}`;
      chatEl.scrollTop = chatEl.scrollHeight;
      return;
    }

    line.textContent = `[log]: `;
    for (const ch of text) {
      line.textContent += ch;
      chatEl.scrollTop = chatEl.scrollHeight;
      await sleep(22 + Math.random() * 20);
    }
  };

  // Barra de loading porca que engasga, volta 4% pra trás, trava em 69% e só fecha em 100% depois do papo!
  const progInt = setInterval(async () => {
    tipIdx = (tipIdx + 1) % dumbTips.length;
    if (tipEl) tipEl.textContent = dumbTips[tipIdx];

    if (pct < 88) {
      // De vez em quando anda pra trás só de sacanagem kkkkk
      if (Math.random() < 0.22 && pct > 20) {
        pct -= 4;
        if (statusEl) statusEl.textContent = `Opa caiu um arquivo, voltando... (${pct}%)`;
      } else {
        pct = Math.min(88, pct + Math.floor(Math.random() * 9) + 4);
        if (statusEl) statusEl.textContent = `Improvisando colisão 2D nas coxas... (${pct}%)`;
      }
    } else if (dialogueDone && pct < 100) {
      pct = Math.min(100, pct + 6);
      if (statusEl) statusEl.textContent = `Abrindo alçapão do subsolo... (${pct}%)`;
    } else if (!dialogueDone) {
      if (statusEl) statusEl.textContent = `Aguardando resfriamento em 69% (nice)...`;
      pct = 69;
    }

    if (barEl) barEl.style.width = `${pct}%`;

    if (pct >= 100 && dialogueDone) {
      clearInterval(progInt);
      await sleep(600);
      await apiPost('/api/finish-loading');
      renderSubsolo2DScreen();
    }
  }, 1500);

  // Roteiro de bate-boca interativo durante o loading porco!
  (async () => {
    await sleep(600);
    await appendChat('op', 'pqp... por um segundo achei que vc ia fritar a memória inteira lá em cima.');
    await sleep(600);
    await appendChat('op', 'quem em sã consciência vê um número de temperatura quieto e taca no talo, mano??');

    const askRound1 = () => {
      repliesEl.innerHTML = `
        <button class="loading-reply-btn" data-r="1">Você que deixou destravado ué</button>
        <button class="loading-reply-btn" data-r="2">Que tela de loading horrível é essa?</button>
      `;
      repliesEl.querySelectorAll('button').forEach((b) => {
        b.addEventListener('click', async () => {
          const r = b.getAttribute('data-r');
          repliesEl.innerHTML = '';
          if (r === '1') {
            await appendChat('you', 'você que deixou destravado lá no widget ué');
            await sleep(500);
            await appendChat('op', 'era um png estático que eu fiz na pressa cara!! não achei que um psicopata ia clicar no número dos graus!');
          } else {
            await appendChat('you', 'que tela de loading horrível é essa kkkkk');
            await sleep(500);
            await appendChat('op', 'ah foi mal aí senhor diretor de arte da pixar, fiz essa tela em 15 segundos enquanto TUDO PEGAVA FOGO lá atrás!');
          }
          await sleep(700);
          askRound2();
        });
      });
    };

    const askRound2 = () => {
      repliesEl.innerHTML = `
        <button class="loading-reply-btn" data-r="a">O que tem nesse tal de subsolo?</button>
        <button class="loading-reply-btn" data-r="b">Então tinha mais coisa escondida sim né?</button>
      `;
      repliesEl.querySelectorAll('button').forEach((b) => {
        b.addEventListener('click', async () => {
          const r = b.getAttribute('data-r');
          repliesEl.innerHTML = '';
          if (r === 'a') {
            await appendChat('you', 'o que tem nesse tal de subsolo?');
            await sleep(500);
            await appendChat('op', 'cano velho, goteira, ferrugem e zero botão dourado pra vc ficar clicando.');
          } else {
            await appendChat('you', 'então tinha mais coisa escondida no site sim né?');
            await sleep(500);
            await appendChat('op', 'não é "fase secreta" seu nóia, é literalmente o porão onde fica a tubulação velha dessa merda!');
          }
          await sleep(700);
          await appendChat('op', 'ó, vai abrir aí. não encosta em NENHUMA válvula lá embaixo, tá me ouvindo?');
          dialogueDone = true;
          pct = Math.max(pct, 90);
        });
      });
    };

    askRound1();
  })();
}

// NOVO AMBIENTE 2D: O SUBSOLO (Canvas 2D interativo com física de gotas d'água, brasas caindo do teto queimado e válvulas!)
function renderSubsolo2DScreen() {
  clearTimers();
  currentStage = 'subsolo_2d';
  document.body.className = 'subsolo-mode awakened-cursors';
  resetFaviconAndTitle('naoclique.net // subsolo');

  const app = document.getElementById('app');
  app.style.visibility = 'visible';

  app.innerHTML = `
    <div class="subsolo-shell">
      <div class="operator-feed">
        <span class="operator-tag">log</span>
        <span id="operator-msg"></span>
      </div>

      <div class="subsolo-canvas-wrap">
        <canvas id="subsolo-canvas" width="840" height="460"></canvas>
      </div>
    </div>
  `;

  setOperatorRemark(
    'chegamo. tá vendo o teto pingando faísca ali em cima? é o teu papel de parede de creche terminando de queimar no andar de cima. fica quietinho aí enquanto eu apago o incêndio.',
    { delayBefore: 500 }
  );

  const canvas = document.getElementById('subsolo-canvas');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;

  // Partículas 2D do ambiente (gotas d'água pingando do cano esquerdo + brasas quentes caindo da rachadura do teto)
  const drops = [];
  const sparks = [];
  let valveAngle = 0;
  let valveOpen = false;
  let lightFlicker = 1;

  // Clique interativo na válvula vermelha dentro do Canvas 2D!
  canvas.addEventListener('click', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (ev.clientX - rect.left) * scaleX;
    const my = (ev.clientY - rect.top) * scaleY;

    // Coordenada da roda da válvula vermelha (x=155, y=220, r=32)
    const distValve = Math.hypot(mx - 155, my - 220);
    if (distValve <= 36) {
      valveOpen = !valveOpen;
      playCheapBeep();
      flashCursorMood(valveOpen ? 'middle' : 'thumb', 1800);
      setOperatorRemark(
        valveOpen
          ? 'EU ACABEI DE FALAR PRA NÃO GIRAR A PORRA DA VÁLVULA!! vai alagar o quadro elétrico ali embaixo!'
          : 'isso, deixa fechada quietinha.',
        { delayBefore: 100 }
      );
    }

    // Coordenada do Painel Trancado na direita (x=640..760, y=190..330)
    if (mx >= 640 && mx <= 760 && my >= 190 && my <= 330) {
      flashCursorMood('stop', 1800);
      setOperatorRemark('nem vem fuçar nesse terminal trancado aí do canto, a senha nem tá ligada ainda.', {
        delayBefore: 100,
      });
    }
  });

  const loop = () => {
    if (currentStage !== 'subsolo_2d') return;

    // Fundo de concreto escuro úmido 2D
    ctx.fillStyle = '#10131a';
    ctx.fillRect(0, 0, 840, 460);

    // Tijolos / linhas sutis no fundo
    ctx.strokeStyle = '#191e29';
    ctx.lineWidth = 1;
    for (let y = 40; y < 410; y += 36) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(840, y);
      ctx.stroke();
    }

    // Chão metálico do subsolo
    ctx.fillStyle = '#1b202b';
    ctx.fillRect(0, 410, 840, 50);
    ctx.fillStyle = '#2d3546';
    ctx.fillRect(0, 410, 840, 5);

    // Lâmpada pendurada no centro com cone de luz piscando levemente
    if (Math.random() < 0.04) lightFlicker = 0.55 + Math.random() * 0.45;
    else lightFlicker += (1 - lightFlicker) * 0.15;

    ctx.strokeStyle = '#444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(420, 0);
    ctx.lineTo(420, 58);
    ctx.stroke();

    const grad = ctx.createRadialGradient(420, 68, 8, 420, 220, 290);
    grad.addColorStop(0, `rgba(255, 220, 140, ${0.24 * lightFlicker})`);
    grad.addColorStop(1, 'rgba(16, 19, 26, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(100, 50, 640, 360);

    ctx.fillStyle = `rgba(255, 230, 150, ${lightFlicker})`;
    ctx.beginPath();
    ctx.arc(420, 64, 9, 0, Math.PI * 2);
    ctx.fill();

    // Tubulação hidráulica à esquerda + Válvula Vermelha
    ctx.fillStyle = '#3a4659';
    ctx.fillRect(143, 0, 24, 280);
    ctx.fillRect(143, 268, 120, 22);

    if (valveOpen) valveAngle += 0.08;
    ctx.save();
    ctx.translate(155, 220);
    ctx.rotate(valveAngle);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-24, 0);
    ctx.lineTo(24, 0);
    ctx.moveTo(0, -24);
    ctx.lineTo(0, 24);
    ctx.stroke();
    ctx.restore();

    // Rachadura quente no teto (de onde caem brasas do andar de cima que pegou fogo!)
    ctx.strokeStyle = '#ff5400';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(350, 2);
    ctx.lineTo(380, 14);
    ctx.lineTo(405, 6);
    ctx.lineTo(435, 16);
    ctx.stroke();

    // Painel / Terminal Trancado na parede direita (pronto pros nossos próximos enigmas!)
    ctx.fillStyle = '#232936';
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 3;
    ctx.fillRect(650, 200, 105, 130);
    ctx.strokeRect(650, 200, 105, 130);
    ctx.fillStyle = '#091914';
    ctx.fillRect(664, 216, 77, 44);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('TRANCADO', 673, 242);
    // Luzinha vermelha de bloqueio
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(702, 292, 6, 0, Math.PI * 2);
    ctx.fill();

    // Física 2D: Gotas d'água saindo do cano (goteira lenta se fechado, jato d'água se abriu a válvula!)
    if (Math.random() < (valveOpen ? 0.55 : 0.035)) {
      drops.push({
        x: 263 + (Math.random() * 6 - 3),
        y: 290,
        vx: valveOpen ? 1.5 + Math.random() * 2.2 : 0,
        vy: 1,
      });
    }

    ctx.fillStyle = '#38bdf8';
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.x += d.vx;
      d.y += d.vy;
      d.vy += 0.32;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      if (d.y >= 408) drops.splice(i, 1);
    }

    // Física 2D: Faíscas/brasas caindo da rachadura do teto
    if (Math.random() < 0.12) {
      sparks.push({
        x: 355 + Math.random() * 75,
        y: 14,
        vx: Math.random() * 1.4 - 0.7,
        vy: 1 + Math.random() * 1.5,
      });
    }

    ctx.fillStyle = '#fb923c';
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.12;
      ctx.fillRect(s.x, s.y, 3, 3);
      if (s.y >= 408) sparks.splice(i, 1);
    }

    subsoloRaf = requestAnimationFrame(loop);
  };

  subsoloRaf = requestAnimationFrame(loop);
}

// ============================================================================
// PAINEL DE TESTES (DEV ONLY - Topo Direito)
// ============================================================================
function mountDevTestPanel() {
  if (!import.meta.env.DEV) return;
  if (document.getElementById('dev-test-panel')) return;

  const panel = document.createElement('div');
  panel.id = 'dev-test-panel';
  panel.className = 'dev-panel';
  panel.innerHTML = `
    <button class="dev-toggle" id="dev-toggle-btn">⚙️ DEV</button>
    <div class="dev-menu" id="dev-menu">
      <div class="dev-menu-title">🛠️ Testes & Capítulos (Dev)</div>
      <button class="dev-btn danger" data-dev="reset">🔄 Resetar Jogo do Zero</button>
      <button class="dev-btn" data-dev="goto_button_0">1️⃣ Cap 0: Botão (9x -> 5x)</button>
      <button class="dev-btn" data-dev="goto_shapes">🧱 Cap 0.5: Bloquinhos Criança</button>
      <button class="dev-btn" data-dev="goto_mundane">2️⃣ Cap 1: Fake Game 20m (Início)</button>
      <button class="dev-btn" data-dev="goto_pre_crash_buy">💣 ~15m: Pronto p/ Backup Nuvem</button>
      <button class="dev-btn" data-dev="goto_awakening_error">⚡ Cap 2: Erro c/ Ele Falando</button>
      <button class="dev-btn" data-dev="goto_awakened_last3">👁️ Cap 2.5: Faltam os 3 Últimos</button>
      <button class="dev-btn" data-dev="goto_maxed_16">🌡️ Cap 3: 16/16 (Testar Clima 99°C)</button>
      <button class="dev-btn" data-dev="goto_shitty_loading">⏳ Cap 3.5: Loading Porco + Chat</button>
      <button class="dev-btn" data-dev="goto_subsolo">🕳️ Cap 4: Ambiente 2D (Subsolo)</button>
      <button class="dev-btn" data-dev="spawn_event">🪰 Forçar Evento na Tela Agora</button>
      <button class="dev-btn" data-dev="add_points_big">💎 +500.000 pts</button>
    </div>
  `;
  document.body.appendChild(panel);

  const toggleBtn = document.getElementById('dev-toggle-btn');
  const menu = document.getElementById('dev-menu');

  toggleBtn?.addEventListener('click', () => menu?.classList.toggle('open'));

  panel.querySelectorAll('[data-dev]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const action = btn.getAttribute('data-dev');
      if (action === 'spawn_event') {
        menu?.classList.remove('open');
        spawnRandomScreenEvent();
        return;
      }
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

  if (data.stage === 'mundane_clicker' || data.stage === 'awakened_clicker') {
    renderClickerScreen(data);
  } else if (data.stage === 'shape_test') {
    renderShapeTestScreen();
  } else if (data.stage === 'shitty_loading') {
    renderShittyLoadingScreen();
  } else if (data.stage === 'subsolo_2d') {
    renderSubsolo2DScreen();
  } else if (data.stage === 'awakening_error') {
    renderFakeBrowserCrash({
      awakening: true,
      totalClicks: data.totalClicks,
      ownedUpgrades: data.upgrades || [],
      minutesPlayed: data.minutesPlayed || 15,
    });
  } else {
    renderInitialButtonScreen(data.buttonLabel || 'Botão');
  }
}

init();
