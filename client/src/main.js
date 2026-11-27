import './stories.css';
import { BOOKS_META, openBookReaderModal, openFinalShelfModal, launchStory } from './stories/storyRegistry.js';

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
let meltdownInactivityTimers = [];
let idleNudgeTimer = null;
let subsoloChatTimer = null;
let subsoloRaf = null;
let caveRaf = null;
let caveKeyHandler = null;
let caveKeyUpHandler = null;
let caveResizeHandler = null;
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
  if (currentStage !== 'awakened_clicker' && currentStage !== 'subsolo_2d') return;
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
  if (idleNudgeTimer) clearTimeout(idleNudgeTimer);
  document.body.classList.remove('cursor-mood-chill');
  if (currentStage !== 'awakened_clicker' && currentStage !== 'subsolo_2d') return;

  idleTimeout = setTimeout(() => {
    if (
      (currentStage === 'awakened_clicker' || currentStage === 'subsolo_2d') &&
      !document.body.className.includes('cursor-mood-')
    ) {
      document.body.classList.add('cursor-mood-chill');
    }
  }, 9000);

  // Interação de Inatividade: Se o jogador ficar 26 segundos sem fazer nada quando tem objetivo pendente!
  idleNudgeTimer = setTimeout(() => {
    if (isOverheatedLocal) return; // O incêndio já tem seu próprio timer de urgência!
    if (currentStage === 'awakened_clicker' && !latestState?.allOwned) {
      setOperatorRemark('congelou aí pq? compra logo o resto das coisas pra acabar com isso.', {
        priority: 'ambient',
      });
    }
  }, 26000);
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

// SOM DE DIGITAÇÃO DELE NA TELA (Seco no normal, COM ECO CAVERNOSO quando cai na Caverna!)
let echoDelayNode = null;
let echoFeedbackNode = null;
let echoFilterNode = null;

function ensureCaveEchoChain(ctx) {
  if (echoDelayNode) return echoDelayNode;
  echoDelayNode = ctx.createDelay(1.0);
  echoDelayNode.delayTime.value = 0.19; // 190ms de eco batendo nas paredes de pedra!

  echoFeedbackNode = ctx.createGain();
  echoFeedbackNode.gain.value = 0.44; // várias repetições decaindo no escuro

  echoFilterNode = ctx.createBiquadFilter();
  echoFilterNode.type = 'lowpass';
  echoFilterNode.frequency.value = 1350; // eco abafado de rocha úmida

  echoDelayNode.connect(echoFilterNode);
  echoFilterNode.connect(echoFeedbackNode);
  echoFeedbackNode.connect(echoDelayNode);
  echoFilterNode.connect(ctx.destination);
  return echoDelayNode;
}

function playOperatorTypeKey(ch = 'a') {
  if (ch === ' ' || ch === '\n') return;
  try {
    const ctx = ensureAudio();
    const inCave = currentStage === 'cave_2d' || currentStage === 'cave_escaped';

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = inCave ? 'sine' : 'triangle';

    // Leve variação de frequência por tecla pra soar como teclado mecânico real!
    const pitch = (inCave ? 620 : 760) + ((ch.charCodeAt(0) * 19) % 220);
    osc.frequency.setValueAtTime(pitch, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(190, ctx.currentTime + 0.028);

    gain.gain.setValueAtTime(inCave ? 0.075 : 0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (inCave) {
      const echoIn = ensureCaveEchoChain(ctx);
      gain.connect(echoIn);
    }

    osc.start();
    osc.stop(ctx.currentTime + 0.034);
  } catch {}
}

// Estrondo grave de desmoronamento quando o chão do Subsolo cede e despenca pra Caverna!
function playCollapseRumble() {
  try {
    const ctx = ensureAudio();
    const dur = 2.1;
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.9));
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 180;
    const gain = ctx.createGain();
    gain.gain.value = 0.55;
    src.connect(lp);
    lp.connect(gain);
    gain.connect(ctx.destination);
    src.start();
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
  if (idleNudgeTimer) { clearTimeout(idleNudgeTimer); idleNudgeTimer = null; }
  if (subsoloChatTimer) { clearInterval(subsoloChatTimer); subsoloChatTimer = null; }
  meltdownInactivityTimers.forEach((t) => clearTimeout(t));
  meltdownInactivityTimers = [];
  if (subsoloRaf) { cancelAnimationFrame(subsoloRaf); subsoloRaf = null; }
  if (caveRaf) { cancelAnimationFrame(caveRaf); caveRaf = null; }
  if (caveKeyHandler) {
    window.removeEventListener('keydown', caveKeyHandler);
    caveKeyHandler = null;
  }
  if (caveKeyUpHandler) {
    window.removeEventListener('keyup', caveKeyUpHandler);
    caveKeyUpHandler = null;
  }
  if (caveResizeHandler) {
    window.removeEventListener('resize', caveResizeHandler);
    caveResizeHandler = null;
  }
  remarkQueue.length = 0;
  isProcessingQueue = false;
  isCookieOpen = false;
  isOverheatedLocal = false;
  document.getElementById('cookie-blocker-alert')?.remove();
  document.getElementById('fire-overlay')?.remove();
  document.getElementById('keypad-backdrop')?.remove();
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
            triggerMeltdownChaos(res.remarksBurst || (res.remark ? [res.remark] : null));
          } else {
            document.body.classList.toggle('warm-warning', finalTemp >= 45);
            tempSlot.innerHTML = `<span class="temp-editable-num" id="temp-display">${finalTemp}</span>`;
            if (res?.remark) setOperatorRemark(res.remark, { delayBefore: 120, priority: 'action' });
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
    triggerMeltdownChaos([
      'AINDA TÁ PEGANDO FOGO AQUI SEU DOENTE!!',
      'DIGITA subsolo NA BARRA DE PESQUISA AÍ EM CIMA E DÁ ENTER LOGO!!',
    ]);
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
      setOperatorRemark(res.remark, { priority: 'ambient' });
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
        playOperatorTypeKey('x');
        await sleep(34 + Math.random() * 24);
      }
    } else if (step.text) {
      const base = step.speed || 36;
      for (const ch of step.text) {
        span.textContent += ch;
        playOperatorTypeKey(ch);
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

// ============================================================================
// FILA INTELIGENTE DE MENSAGENS DO LOG (Pula antigas se necessário, enfileira ações e NUNCA espama!)
// ============================================================================
const remarkQueue = [];
let isProcessingQueue = false;
let lastAmbientAt = 0;

/*
 * priority:
 * - 'urgent'  -> Limpa a fila secundária e corta na hora (ex: incêndio / quebra de lâmpada)
 * - 'action'  -> Resposta direta a algo que o jogador fez (comprar, mexer na temp, girar válvula, busca). Entra na fila!
 * - 'ambient' -> Comentário passivo de clique/ociosidade. Ignorado se já tiver fala rolando ou fila cheia (zero spam!).
 */
function setOperatorRemark(textOrArray, { delayBefore = 220, priority = 'action', force = false } = {}) {
  if (!textOrArray) return;
  const effPriority = force ? 'urgent' : priority;
  const items = Array.isArray(textOrArray) ? textOrArray.filter(Boolean) : [textOrArray];
  if (items.length === 0) return;

  if (effPriority === 'ambient') {
    if (isProcessingQueue || remarkQueue.length > 0 || Date.now() - lastAmbientAt < 8000) {
      return;
    }
    lastAmbientAt = Date.now();
  }

  if (effPriority === 'urgent') {
    remarkQueue.length = 0;
    remarkTypingId += 1; // Cancela imediatamente a digitação atual pra dar lugar à urgência!
    isProcessingQueue = false;
  } else if (effPriority === 'action') {
    // Se tiver mais de 2 falas velhas acumuladas, enxuga pra não atrasar a resposta da ação nova,
    // e se a fala atual já terminou de digitar e está só esperando pausa, pula pro próximo!
    while (remarkQueue.length >= 2) {
      remarkQueue.shift();
    }
  }

  items.forEach((txt, idx) => {
    remarkQueue.push({
      text: txt,
      delayBefore: idx === 0 ? delayBefore : 180,
      holdAfterMs: items.length > 1 && idx < items.length - 1 ? 950 : 650,
    });
  });

  if (!isProcessingQueue) {
    processRemarkQueue();
  }
}

async function processRemarkQueue() {
  isProcessingQueue = true;

  while (remarkQueue.length > 0) {
    const el = document.getElementById('operator-msg');
    if (!el) {
      remarkQueue.length = 0;
      break;
    }

    const current = remarkQueue.shift();
    const myId = ++remarkTypingId;

    el.innerHTML = '';
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    el.appendChild(cursor);

    if (current.delayBefore > 0) await sleep(current.delayBefore);
    if (myId !== remarkTypingId) return; // interrompido por 'urgent'

    const span = document.createElement('span');
    el.insertBefore(span, cursor);

    for (const ch of current.text) {
      if (myId !== remarkTypingId) return;
      span.textContent += ch;
      playOperatorTypeKey(ch);
      // Se chegou outra ação do jogador na fila, acelera levemente o fim desta frase pra ficar ágil!
      const speedMul = remarkQueue.length > 0 ? 0.55 : 1;
      await sleep((18 + Math.random() * 20) * speedMul);
    }

    // Pausa rápida entre uma mensagem da fila e a próxima (pra dar tempo de ler sem travar!)
    await sleep(remarkQueue.length > 0 ? Math.min(current.holdAfterMs, 850) : 500);
    if (myId === remarkTypingId && remarkQueue.length === 0) {
      setTimeout(() => {
        if (myId === remarkTypingId) cursor.remove();
      }, 900);
    }
  }

  isProcessingQueue = false;
}

// ============================================================================
// ARMADILHAS PSICOLÓGICAS (PÓS-DESPERTAR)
// ============================================================================
function setupPsychologicalTraps() {
  let originalTitle = document.title;

  document.addEventListener('visibilitychange', async () => {
    if (currentStage !== 'awakened_clicker' && currentStage !== 'subsolo_2d') return;

    if (document.hidden) {
      originalTitle = document.title;
      document.title = 'foi pedir arrego pro google né';
    } else {
      document.title = originalTitle;
      const res = await apiPost('/api/behavior', { type: 'tab_return' });
      if (res?.remark) setOperatorRemark(res.remark, { priority: 'ambient' });
    }
  });

  document.addEventListener('keydown', async (e) => {
    resetIdleChillTimer();
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && currentStage === 'awakened_clicker') {
      flashCursorMood('middle', 2500);
      const res = await apiPost('/api/behavior', { type: 'select_all' });
      if (res?.remark) setOperatorRemark(res.remark);
    }
  });

  document.addEventListener('contextmenu', async () => {
    resetIdleChillTimer();
    if (currentStage === 'awakened_clicker') {
      flashCursorMood('middle', 2500);
      const res = await apiPost('/api/behavior', { type: 'context_menu' });
      if (res?.remark) setOperatorRemark(res.remark);
    }
  });

  document.addEventListener('mousemove', () => {
    if (document.body.classList.contains('cursor-mood-chill')) {
      resetIdleChillTimer();
    }
  });
}

// ============================================================================
// CAOS DO INCÊNDIO (>= 80°C) + O QUE ACONTECE SE O JOGADOR NÃO FIZER NADA!
// ============================================================================
function triggerMeltdownChaos(burstOrText) {
  if (isOverheatedLocal) return;
  isOverheatedLocal = true;

  isCookieOpen = false;
  const cookieBar = document.getElementById('cookie-bar');
  if (cookieBar) cookieBar.style.display = 'none';
  document.getElementById('cookie-blocker-alert')?.remove();

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
  }, 150);

  playErrorBuzzer();
  flashCursorMood('stop', 3500);

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.placeholder = 'DIGITE subsolo AQUI...';
  }

  if (burstOrText) {
    setOperatorRemark(burstOrText, { delayBefore: 80, priority: 'urgent' });
  }

  // E SE O JOGADOR FICAR PARADO OLHANDO O FOGO E NÃO ESCREVER "subsolo"?!
  // 12s sem digitar: ele grita cobrando!
  const t1 = setTimeout(() => {
    if (!isOverheatedLocal || currentStage !== 'awakened_clicker') return;
    flashCursorMood('middle', 2500);
    setOperatorRemark(
      ['TÁ PARADO OLHANDO PRO FOGO PQ SEU POSTE?!', 'ESCREVE subsolo NA BARRA DE PESQUISA LÁ EM CIMA AGORA!!'],
      { priority: 'urgent' }
    );
  }, 13000);

  // 25s sem digitar: ele perde a paciência, toma controle da barra de busca, digita "subsolo" SOZINHO letra por letra e puxa vc à força!
  const t2 = setTimeout(async () => {
    if (!isOverheatedLocal || currentStage !== 'awakened_clicker') return;
    setOperatorRemark('PQP VAI FRITAR TUDO, SAI DA FRENTE QUE EU MESMO DIGITO ESSA MERDA!!', {
      priority: 'urgent',
    });
    flashCursorMood('stop', 4000);

    await sleep(1400);
    const inp = document.getElementById('search-input');
    if (inp) {
      inp.value = '';
      inp.focus();
      for (const ch of 'subsolo') {
        if (currentStage !== 'awakened_clicker') return;
        inp.value += ch;
        playCheapBeep();
        await sleep(130);
      }
    }
    await sleep(500);
    await apiPost('/api/force-subsolo-escape');
    renderShittyLoadingScreen({ forcedByOperator: true });
  }, 26000);

  meltdownInactivityTimers.push(t1, t2);
}

// ============================================================================
// TELA DE LOADING PORCA + CONVERSA COM TEMPO DE LEITURA + INATIVIDADE
// ============================================================================
function renderShittyLoadingScreen({ forcedByOperator = false } = {}) {
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
    'Dica #5: Quase lá (mentira, falta renderizar o ralo).',
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
  let readyToTransition = false;
  let replyIdleTimer = null;

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
      playOperatorTypeKey(ch);
      chatEl.scrollTop = chatEl.scrollHeight;
      await sleep(22 + Math.random() * 18);
    }
  };

  const progInt = setInterval(async () => {
    tipIdx = (tipIdx + 1) % dumbTips.length;
    if (tipEl) tipEl.textContent = dumbTips[tipIdx];

    if (pct < 85 && !readyToTransition) {
      if (Math.random() < 0.22 && pct > 20) {
        pct -= 4;
        if (statusEl) statusEl.textContent = `Opa caiu um arquivo, voltando... (${pct}%)`;
      } else {
        pct = Math.min(85, pct + Math.floor(Math.random() * 8) + 4);
        if (statusEl) statusEl.textContent = `Improvisando colisão 2D nas coxas... (${pct}%)`;
      }
    } else if (!readyToTransition) {
      pct = 69;
      if (statusEl) statusEl.textContent = `Aguardando em 69% (nice)...`;
    } else if (pct < 100) {
      pct = Math.min(100, pct + 10);
      if (statusEl) statusEl.textContent = `Abrindo alçapão do subsolo... (${pct}%)`;
    }

    if (barEl) barEl.style.width = `${pct}%`;

    if (pct >= 100 && readyToTransition) {
      clearInterval(progInt);
      if (replyIdleTimer) clearTimeout(replyIdleTimer);
      const st = await apiPost('/api/finish-loading');
      renderSubsolo2DScreen(st);
    }
  }, 1300);

  const armReplyIdle = (msg) => {
    if (replyIdleTimer) clearTimeout(replyIdleTimer);
    replyIdleTimer = setTimeout(() => {
      appendChat('op', msg);
    }, 13000);
  };

  (async () => {
    await sleep(500);
    if (forcedByOperator || latestState?.forcedSubsolo) {
      await appendChat('op', 'se eu não digito "subsolo" por vc a gente tinha virado carvão né seu lerdo do caralho.');
    } else {
      await appendChat('op', 'pqp... por um segundo achei que vc ia fritar a memória inteira lá em cima.');
    }
    await sleep(500);
    await appendChat('op', 'quem em sã consciência vê um número de temperatura quieto e taca no talo, mano??');

    const askRound1 = () => {
      repliesEl.innerHTML = `
        <button class="loading-reply-btn" data-r="1">Você que deixou destravado ué</button>
        <button class="loading-reply-btn" data-r="2">Que tela de loading horrível é essa?</button>
      `;
      armReplyIdle('ficou mudo pq? o fogo queimou tua língua tbm? clica numa resposta aí pô.');

      repliesEl.querySelectorAll('button').forEach((b) => {
        b.addEventListener('click', async () => {
          if (replyIdleTimer) clearTimeout(replyIdleTimer);
          const r = b.getAttribute('data-r');
          repliesEl.innerHTML = '';
          if (r === '1') {
            await appendChat('you', 'você que deixou destravado lá no widget ué');
            await sleep(450);
            await appendChat('op', 'era um widget porqueira que eu copiei na pressa cara!! não achei que um psicopata ia clicar nos graus!');
          } else {
            await appendChat('you', 'que tela de loading horrível é essa kkkkk');
            await sleep(450);
            await appendChat('op', 'ah foi mal aí diretor de arte da pixar, fiz essa janela em 15 segundos enquanto TUDO PEGAVA FOGO lá atrás!');
          }
          await sleep(800);
          askRound2();
        });
      });
    };

    const askRound2 = () => {
      repliesEl.innerHTML = `
        <button class="loading-reply-btn" data-r="a">O que tem nesse tal de subsolo?</button>
        <button class="loading-reply-btn" data-r="b">Então tinha mais coisa escondida sim né?</button>
      `;
      armReplyIdle('tá dormindo na frente do monitor mano? escolhe logo aí.');

      repliesEl.querySelectorAll('button').forEach((b) => {
        b.addEventListener('click', async () => {
          if (replyIdleTimer) clearTimeout(replyIdleTimer);
          const r = b.getAttribute('data-r');
          repliesEl.innerHTML = '';
          if (r === 'a') {
            await appendChat('you', 'o que tem nesse tal de subsolo?');
            await sleep(450);
            await appendChat('op', 'cano velho, ralo entupido, mau contato na luz e zero botão dourado pra vc ficar clicando.');
          } else {
            await appendChat('you', 'então tinha mais coisa escondida no site sim né?');
            await sleep(450);
            await appendChat('op', 'não é "fase secreta" seu nóia, é literalmente o porão onde passa a tubulação velha dessa merda!');
          }
          await sleep(800);
          await appendChat('op', 'ó, terminou de carregar. não encosta na torneira nem no terminal lá embaixo, tá me ouvindo?');
          // Espera 4.2 segundos inteiros DEPOIS que ele termina de escrever pra você conseguir ler tranquilo!
          await sleep(4200);
          readyToTransition = true;
          pct = 90;
        });
      });
    };

    askRound1();
  })();
}

// ============================================================================
// AMBIENTE 2D DETALHADO: O SUBSOLO + ENIGMA MORSE + ÁGUA/FAÍSCA/RALO/VAPOR + LÂMPADA!
// ============================================================================
/*
 * COMO FUNCIONA O ENIGMA DO PORÃO:
 * 1. A lâmpada do teto pisca ciclicamente em Código Morse: 7 (--...)  4 (....-)  2 (..---) -> 742
 * 2. Se abrir a válvula vermelha e DEIXAR ABERTA, a água enche o piso mais rápido do que o ralo no centro escoa.
 * 3. Quando a poça d'água alcança a zona onde caem as faíscas do teto, sobe VAPOR denso!
 * 4. Depois de alguns segundos de vapor contínuo, o quadro de vidro na parede embaça e revela escrito a dedo:
 *      "ESPELHE A LUZ
 *       - OS CANOS"
 *    (Se fechar a torneira, a água desce pelo ralo e o vapor/texto some aos poucos!)
 * 5. Espelhar 742 = 247. Na parede existem 3 canos verticais numerados (I, II, III) -> 247 - 3 = 244!
 * 6. Ao digitar 244 no Terminal, dá "FALHA: LUZ NO SENSOR ÓPTICO" se a lâmpada estiver inteira!
 *    O jogador precisa clicar 3x na lâmpada pendurada até ESTILHAÇAR ela, deixando o porão no escuro, e confirmar 244!
 */
const MORSE_TIMELINE = (() => {
  // 7 = --... | 4 = ....- | 2 = ..--- (tempos claros e legíveis!)
  const digits = ['--...', '....-', '..---'];
  const seq = [];
  digits.forEach((pattern, dIdx) => {
    for (let i = 0; i < pattern.length; i++) {
      const isDash = pattern[i] === '-';
      seq.push({ on: true, ms: isDash ? 620 : 210 }); // traço longo vs ponto curto bem nítido
      if (i < pattern.length - 1) seq.push({ on: false, ms: 220 }); // pausa entre pulsos do mesmo número
    }
    if (dIdx < digits.length - 1) {
      seq.push({ on: false, ms: 950 }); // pausa média entre um dígito e outro
    }
  });
  seq.push({ on: false, ms: 2600 }); // pausa longa de apagão antes de repetir o ciclo 7 - 4 - 2!
  return seq;
})();

const MORSE_TOTAL_MS = MORSE_TIMELINE.reduce((acc, s) => acc + s.ms, 0);

function getMorseLampState(nowMs) {
  let t = nowMs % MORSE_TOTAL_MS;
  for (const step of MORSE_TIMELINE) {
    if (t < step.ms) return step.on;
    t -= step.ms;
  }
  return false;
}

function playGlassShatterSound() {
  try {
    const ctx = ensureAudio();
    const bufferSize = ctx.sampleRate * 0.28;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.06));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1600;
    const gain = ctx.createGain();
    gain.gain.value = 0.25;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
  } catch {}
}

function renderSubsolo2DScreen(initialState = null) {
  clearTimers();
  if (initialState) latestState = initialState;
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
    'COF COF COF... caralho que fumaceira... fica quieto aí no porão enquanto eu tento salvar essa merda aqui em cima!',
    { delayBefore: 400 }
  );
  resetIdleChillTimer();

  const upstairsLines = [
    'COF COF... caralho, quanto pó tem nesse extintor...',
    'a fonte explodiu e levou dois pentes de memória junto... desgraça.',
    'ei, vc tá quieto aí embaixo né? nem inventa de mexer em nada enquanto eu limpo a fuligem aqui.',
    'onde enfia esse conector azul... pq tem três fios desencapados saindo da parede?!',
    'se eu pegar o desgraçado que colocou 99 graus no termostato eu juro que desligo a máquina...',
    'COF COF... desgraça de fumaça preta... não dá nem pra enxergar o monitor.',
    'tô tentando religar a refrigeração de emergência... se der estalo aí embaixo nem esquenta.',
    'ainda bem que aquele desocupado sumiu lá pro porão e parou de clicar, pelo menos silêncio nessa porra.',
    'peraí, cadê a porra da chave de fenda que tava aqui na mesa...',
    'vc tá quieto demais aí embaixo... deve tá mofando no escuro. melhor assim, pelo menos não enche o saco.',
  ];
  let lineIdx = 0;
  if (subsoloChatTimer) clearInterval(subsoloChatTimer);
  subsoloChatTimer = setInterval(() => {
    if (currentStage !== 'subsolo_2d') return;
    const line = upstairsLines[lineIdx % upstairsLines.length];
    lineIdx++;
    setOperatorRemark(line, { priority: 'ambient' });
  }, 38000);

  const canvas = document.getElementById('subsolo-canvas');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;

  // Pré-gera tijolos irregulares da parede do porão para um visual 2D rico e detalhado!
  const bricks = [];
  for (let row = 0; row < 12; row++) {
    const y = 26 + row * 32;
    const offset = (row % 2) * 34;
    for (let col = -1; col < 14; col++) {
      const x = col * 68 + offset;
      const shade = 18 + ((row * 7 + col * 13) % 9);
      bricks.push({ x, y, w: 64, h: 28, color: `rgb(${shade}, ${shade + 4}, ${shade + 11})` });
    }
  }

  const drops = [];
  const splashes = [];
  const steamClouds = [];
  const sparks = [];

  let valveAngle = 0;
  let valveOpen = false;
  let streamHeadX = 235;
  let streamTailX = 235;
  let streamWavePhase = 0;
  let terminalFog = 0;
  let lampSwing = 0;
  let lampSwingVel = 0;
  const morseStartOffset = performance.now();

  function openTerminalKeypad() {
    if (document.getElementById('keypad-backdrop')) return;

    const backdrop = document.createElement('div');
    backdrop.id = 'keypad-backdrop';
    backdrop.className = 'keypad-backdrop';
    backdrop.innerHTML = `
      <div class="keypad-box">
        <div class="keypad-screen" id="kp-screen">_ _ _ _</div>
        <div class="keypad-grid">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9]
            .map((n) => `<button type="button" class="keypad-key" data-k="${n}">${n}</button>`)
            .join('')}
          <button type="button" class="keypad-key clear" data-k="C">CLR</button>
          <button type="button" class="keypad-key" data-k="0">0</button>
          <button type="button" class="keypad-key confirm" data-k="OK">OK</button>
        </div>
        <button type="button" class="keypad-close" id="kp-close">Largá mão e fechar</button>
      </div>
    `;
    document.body.appendChild(backdrop);

    let typed = '';
    let isUnlocking = false;
    const scr = document.getElementById('kp-screen');
    const updateScr = () => {
      if (!scr) return;
      scr.classList.remove('err');
      scr.textContent = typed.padEnd(4, '_').split('').join(' ');
    };

    backdrop.querySelectorAll('.keypad-key').forEach((btn) => {
      btn.addEventListener('click', async () => {
        resetIdleChillTimer();
        const k = btn.getAttribute('data-k');
        playCheapBeep();

        if (k === 'C') {
          typed = '';
          updateScr();
          return;
        }
        if (k === 'OK') {
          if (!typed || isUnlocking) return;
          isUnlocking = true;
          const res = await apiPost('/api/subsolo/unlock', { code: typed });
          if (!res) { isUnlocking = false; return; }

          if (res.ok) {
            scr.classList.add('err');
            scr.textContent = res.screenMsg || 'ERRO ESTRUTURAL!!';
            if (res.remark) setOperatorRemark(res.remark, { priority: 'urgent' });

            // O PAINEL DÁ DEFEITO, O PRÓPRIO SUBSOLO QUEBRA E DESABA EM QUEDA LIVRE PRA CAVERNA!
            setTimeout(() => {
              backdrop.remove();
              playCollapseRumble();
              const shell = document.querySelector('.subsolo-shell');
              shell?.classList.add('subsolo-collapsing');

              // Overlay de queda livre com rastros de poeira subindo + blackout + impacto no chão da caverna
              const overlay = document.createElement('div');
              overlay.className = 'fall-transition-overlay';
              for (let i = 0; i < 24; i++) {
                const st = document.createElement('div');
                st.className = 'fall-streak';
                st.style.left = `${Math.random() * 100}%`;
                st.style.height = `${40 + Math.random() * 90}px`;
                st.style.animationDuration = `${0.35 + Math.random() * 0.45}s`;
                st.style.animationDelay = `${Math.random() * 0.4}s`;
                overlay.appendChild(st);
              }
              document.body.appendChild(overlay);
              setTimeout(() => overlay.classList.add('active'), 550);

              setTimeout(() => {
                playCollapseRumble();
                renderCaveChapterScreen(res.caveState, { justFell: true });
                const stageEl = document.querySelector('.cave-stage-wrap');
                stageEl?.classList.add('cave-impact-shake');
                overlay.classList.add('fade-out');
                setTimeout(() => overlay.remove(), 1000);
              }, 2200);
            }, 1100);
          } else {
            scr.classList.add('err');
            scr.textContent = res.screenMsg || 'NEGADO';
            flashCursorMood(res.errorType === 'glare' ? 'point' : 'middle', 2200);
            if (res.remark) setOperatorRemark(res.remark, { priority: 'action' });
            typed = '';
            isUnlocking = false;
          }
          return;
        }

        if (typed.length < 4) {
          typed += k;
          updateScr();
        }
      });
    });

    document.getElementById('kp-close')?.addEventListener('click', () => backdrop.remove());
  }

  canvas.addEventListener('click', async (ev) => {
    resetIdleChillTimer();
    const rect = canvas.getBoundingClientRect();
    const mx = ((ev.clientX - rect.left) * canvas.width) / rect.width;
    const my = ((ev.clientY - rect.top) * canvas.height) / rect.height;

    // 1. Clicou no Registro / Válvula Vermelha (x=130, y=225)
    if (Math.hypot(mx - 130, my - 225) <= 36) {
      valveOpen = !valveOpen;
      playCheapBeep();
      flashCursorMood(valveOpen ? 'stop' : 'thumb', 1400);
      return;
    }

    // 2. Clicou na Lâmpada Pendurada no Teto (x=420, y=74) -> Balança suavemente (NÃO quebra!)
    if (Math.hypot(mx - 420, my - 74) <= 36) {
      lampSwingVel = (mx < 420 ? 1 : -1) * 0.16;
      playCheapBeep();
      return;
    }

    // 3. Clicou no Terminal na parede direita (x=605..795, y=140..338)
    if (mx >= 605 && mx <= 795 && my >= 140 && my <= 338) {
      openTerminalKeypad();
    }
  });

  const loop = () => {
    if (currentStage !== 'subsolo_2d') return;

    const now = performance.now();
    const morseOn = getMorseLampState(now - morseStartOffset);

    // Balanço físico do pendente da lâmpada
    lampSwing += lampSwingVel;
    lampSwingVel -= lampSwing * 0.04;
    lampSwingVel *= 0.94;
    const lampX = 420 + Math.sin(lampSwing) * 28;
    const lampY = 72;

    // 1. PAREDE DE TIJOLOS ESCUROS DETALHADA
    ctx.fillStyle = '#0c0f15';
    ctx.fillRect(0, 0, 840, 460);

    for (const b of bricks) {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = 'rgba(255,255,255,0.025)';
      ctx.fillRect(b.x, b.y, b.w, 2);
    }

    // Manchas escuras de umidade nas paredes
    ctx.fillStyle = 'rgba(6, 10, 16, 0.55)';
    ctx.beginPath();
    ctx.ellipse(220, 340, 95, 55, 0, 0, Math.PI * 2);
    ctx.ellipse(560, 360, 110, 45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Viga de concreto superior (teto do porão)
    ctx.fillStyle = '#181d27';
    ctx.fillRect(0, 0, 840, 26);
    ctx.fillStyle = '#0f131a';
    ctx.fillRect(0, 24, 840, 4);

    // 2. OS 3 CANOS VERTICAIS NUMERADOS DA PAREDE
    const pipeXs = [68, 130, 295];
    pipeXs.forEach((px, idx) => {
      // Sombra projetada do cano
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(px - 7, 26, 24, 378);

      // Corpo cilíndrico metálico com brilho lateral
      const pGrad = ctx.createLinearGradient(px - 11, 0, px + 11, 0);
      pGrad.addColorStop(0, '#252f3f');
      pGrad.addColorStop(0.4, '#4b5b73');
      pGrad.addColorStop(1, '#1d2532');
      ctx.fillStyle = pGrad;
      const pipeH = idx === 1 ? 255 : 378;
      ctx.fillRect(px - 11, 26, 22, pipeH);

      // Flanges / abraçadeiras com rebites
      [95, 190, 320].forEach((fy) => {
        if (fy < pipeH + 20) {
          ctx.fillStyle = '#334155';
          ctx.fillRect(px - 14, fy, 28, 8);
        }
      });
    });

    // Cotovelo horizontal da torneira saindo do Cano II (x=130 -> bico em x=235, y=282)
    ctx.fillStyle = '#3b495e';
    ctx.fillRect(119, 268, 122, 18);
    ctx.fillRect(227, 268, 16, 28); // bico virado pra baixo

    // Manômetro de pressão acima da válvula no Cano II
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.arc(130, 162, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(130, 162);
    const needleAng = valveOpen ? -0.3 + Math.random() * 0.25 : -2.2;
    ctx.lineTo(130 + Math.cos(needleAng) * 10, 162 + Math.sin(needleAng) * 10);
    ctx.stroke();

    // Roda da Válvula Vermelha (x=130, y=225)
    if (valveOpen) valveAngle += 0.07;
    ctx.save();
    ctx.translate(130, 225);
    ctx.rotate(valveAngle);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(0, 0, 23, 0, Math.PI * 2);
    ctx.stroke();
    for (let r = 0; r < 4; r++) {
      ctx.beginPath();
      ctx.rotate(Math.PI / 4);
      ctx.moveTo(-23, 0);
      ctx.lineTo(23, 0);
      ctx.stroke();
    }
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. TERMINAL DE SEGURANÇA COM VISOR DE VIDRO QUE EMBAÇA NO VAPOR (x=605..795, y=140..338)
    ctx.fillStyle = '#1f2633';
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.fillRect(605, 140, 190, 198);
    ctx.strokeRect(605, 140, 190, 198);

    // Parafusos nos 4 cantos do terminal
    ctx.fillStyle = '#64748b';
    [[613, 148], [787, 148], [613, 330], [787, 330]].forEach(([sx, sy]) => {
      ctx.beginPath();
      ctx.arc(sx, sy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Vidro superior do terminal (escuro quando seco, revela a frase quando embaça!)
    ctx.fillStyle = '#0e141b';
    ctx.fillRect(617, 152, 166, 108);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(617, 152, 166, 108);

    // Reflexo sutil diagonal do vidro seco
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(627, 250);
    ctx.lineTo(682, 162);
    ctx.stroke();

    // Camada de VAPOR condensado no vidro do terminal (só aparece quando a água chega no ralo abaixo!)
    if (terminalFog > 0.02) {
      ctx.fillStyle = `rgba(205, 224, 238, ${0.44 * terminalFog})`;
      ctx.fillRect(617, 152, 166, 108);

      if (terminalFog > 0.35) {
        const textAlpha = Math.min(1, (terminalFog - 0.35) / 0.45);
        ctx.save();
        ctx.fillStyle = `rgba(15, 23, 34, ${0.92 * textAlpha})`;
        ctx.font = 'italic 11px Georgia, serif';
        ctx.fillText('"Morte no quarto do', 636, 182);
        ctx.fillText('Hotel New Yorker."', 640, 200);
        ctx.font = 'bold 11px monospace';
        ctx.fillText('[ QUARTO ] - [ ??? ]', 630, 236);
        ctx.restore();
      }
    }

    // Parte inferior do Terminal: Visor LED + Teclinhas
    ctx.fillStyle = '#061a14';
    ctx.fillRect(625, 268, 86, 56);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 11px monospace';
    ctx.fillText('PAINEL #02', 633, 290);
    ctx.fillStyle = '#34d399';
    ctx.fillText('[DIGITAR]', 636, 310);

    // Teclinhas desenhadas ao lado do visor
    ctx.fillStyle = '#334155';
    for (let kr = 0; kr < 3; kr++) {
      for (let kc = 0; kc < 3; kc++) {
        ctx.fillRect(722 + kc * 20, 270 + kr * 18, 15, 12);
      }
    }

    // 4. CHÃO DE CONCRETO + CANAL DE ESCOAMENTO + RALO ABAIXO DO TERMINAL (x=670..730, y=404)
    ctx.fillStyle = '#151922';
    ctx.fillRect(0, 404, 840, 56);
    ctx.fillStyle = '#262f3f';
    ctx.fillRect(0, 404, 840, 4);

    // Canaleta discreta no piso guiando da torneira (x=235) até o ralo (x=700)
    ctx.fillStyle = '#0d1118';
    ctx.fillRect(230, 404, 470, 3);

    // Grade do Ralo no piso exatamente abaixo do Terminal (x=670..730, y=404)
    ctx.fillStyle = '#090b10';
    ctx.fillRect(670, 404, 60, 11);
    ctx.fillStyle = '#475569';
    for (let gx = 676; gx <= 724; gx += 8) {
      ctx.fillRect(gx, 404, 4, 11);
    }

    // 5. GOTAS DA TORNEIRA (x=235) + FLUXO ESCOANDO PRO RALO (x=700) + VAPOR SUBINDO PRO TERMINAL
    if (valveOpen) {
      streamHeadX = Math.min(700, streamHeadX + 3.4);
      streamTailX = 235;
    } else {
      streamTailX = Math.min(streamHeadX, streamTailX + 2.4);
      if (streamTailX >= streamHeadX - 1) {
        streamHeadX = 235;
        streamTailX = 235;
      }
    }

    const waterAtHotDrain = streamHeadX >= 675 && streamTailX < 695;
    if (waterAtHotDrain) {
      terminalFog = Math.min(1, terminalFog + 0.0055);
      if (Math.random() < 0.48) {
        steamClouds.push({
          x: 675 + Math.random() * 52,
          y: 398,
          r: 8 + Math.random() * 10,
          vy: -1.1 - Math.random() * 0.8,
          vx: Math.random() * 0.6 - 0.3,
          alpha: 0.36,
        });
      }
    } else {
      terminalFog = Math.max(0, terminalFog - 0.004);
    }

    // Nuvens suaves de vapor subindo do ralo até o vidro do terminal
    for (let i = steamClouds.length - 1; i >= 0; i--) {
      const st = steamClouds[i];
      st.x += st.vx;
      st.y += st.vy;
      st.r += 0.24;
      st.alpha -= 0.0028;
      if (st.alpha <= 0 || st.y < 120) {
        steamClouds.splice(i, 1);
        continue;
      }
      ctx.fillStyle = `rgba(226, 232, 240, ${st.alpha})`;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (streamHeadX - streamTailX > 2) {
      streamWavePhase += 0.18;
      const sGrad = ctx.createLinearGradient(streamTailX, 0, streamHeadX, 0);
      sGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
      sGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.78)');
      sGrad.addColorStop(1, 'rgba(14, 116, 144, 0.85)');
      ctx.fillStyle = sGrad;
      ctx.fillRect(streamTailX, 402, streamHeadX - streamTailX, 4);

      // Ondulações sutis correndo da esquerda pra direita na direção do ralo
      ctx.fillStyle = 'rgba(186, 230, 253, 0.65)';
      for (let wx = streamTailX + (streamWavePhase * 12) % 28; wx < streamHeadX - 6; wx += 28) {
        ctx.fillRect(wx, 402, 8, 1.5);
      }

      // Água caindo pelos vãos da grade do ralo quando o fluxo alcança x >= 675
      if (streamHeadX >= 675 && Math.random() < 0.55) {
        splashes.push({
          x: 676 + Math.random() * 48,
          y: 406,
          vx: 0,
          vy: 1.4 + Math.random() * 1.2,
          alpha: 0.75,
          draining: true,
        });
      }
    }

    if (Math.random() < (valveOpen ? 0.75 : 0.04)) {
      drops.push({
        x: 235 + (Math.random() * 4 - 2),
        y: 296,
        vx: (Math.random() * 0.25 - 0.12),
        vy: valveOpen ? 3.0 : 1.2,
      });
    }
    ctx.fillStyle = '#38bdf8';
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i];
      d.x += d.vx;
      d.y += d.vy;
      d.vy += 0.34;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 3.2, 0, Math.PI * 2);
      ctx.fill();
      if (d.y >= 404) {
        if (valveOpen && Math.random() < 0.5) {
          splashes.push({
            x: d.x,
            y: 403,
            vx: 0.4 + Math.random() * 1.8, // respinga na direção do escoamento (direita)
            vy: -0.9 - Math.random() * 1.2,
            alpha: 0.75,
            draining: false,
          });
        }
        drops.splice(i, 1);
      }
    }

    // Respingos no piso e filetes descendo pelo ralo
    for (let i = splashes.length - 1; i >= 0; i--) {
      const sp = splashes[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.vy += sp.draining ? 0.15 : 0.22;
      sp.alpha -= sp.draining ? 0.06 : 0.05;
      if (sp.alpha <= 0 || (!sp.draining && sp.y > 406) || (sp.draining && sp.y > 420)) {
        splashes.splice(i, 1);
        continue;
      }
      ctx.fillStyle = `rgba(56, 189, 248, ${sp.alpha})`;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.draining ? 1.5 : 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Rachadura incandescente no teto acima do ralo pingando brasas quentes
    ctx.strokeStyle = '#fb923c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(668, 25);
    ctx.lineTo(688, 33);
    ctx.lineTo(710, 27);
    ctx.lineTo(732, 35);
    ctx.stroke();

    if (Math.random() < 0.16) {
      sparks.push({
        x: 672 + Math.random() * 56,
        y: 32,
        vx: Math.random() * 1.0 - 0.5,
        vy: 1.4 + Math.random() * 1.6,
      });
    }
    ctx.fillStyle = '#f97316';
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.14;
      ctx.fillRect(s.x, s.y, 3, 3);
      if (s.y >= 403) sparks.splice(i, 1);
    }

    // 7. FIO PENDENTE + CÚPULA INDUSTRIAL + ILUMINAÇÃO RADIAL
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(420, 24);
    ctx.lineTo(lampX, lampY - 12);
    ctx.stroke();

    // Cúpula metálica da lâmpada
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(lampX - 22, lampY - 2);
    ctx.lineTo(lampX + 22, lampY - 2);
    ctx.lineTo(lampX + 10, lampY - 14);
    ctx.lineTo(lampX - 10, lampY - 14);
    ctx.closePath();
    ctx.fill();

    // Bulbo da lâmpada (sempre intacto, piscando em Morse!)
    ctx.fillStyle = morseOn ? '#fef08a' : '#475569';
    ctx.beginPath();
    ctx.arc(lampX, lampY + 5, 9, 0, Math.PI * 2);
    ctx.fill();

    // Halo circular localizado ao redor da lâmpada (sem estrobo na tela inteira!)
    if (morseOn) {
      const halo = ctx.createRadialGradient(lampX, lampY + 6, 4, lampX, lampY + 6, 175);
      halo.addColorStop(0, 'rgba(254, 240, 138, 0.24)');
      halo.addColorStop(0.45, 'rgba(253, 224, 71, 0.08)');
      halo.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(lampX - 180, 0, 360, 260);
    }

    subsoloRaf = requestAnimationFrame(loop);
  };

  subsoloRaf = requestAnimationFrame(loop);
}

// ============================================================================
// CAPÍTULO 5: A CAVERNA PROFUNDA (WASD + Eco + Tocha + Mochila + Cadeado + Dinamite!)
// Convertido fielmente do mapa 4x12 original, agora com controle WASD e o Operador perdido com você!
// ============================================================================
const CAVE_INVENTORY_META = {
  '0': { img: '/cave/apple.gif', name: 'Maçã', details: 'Um lanche estranhamente intacto' },
  'lantern': { img: '/cave/swingingLantern.gif', name: 'Lanterna', details: 'Amplia sua visão na escuridão' },
  '2': { img: '/cave/pickInventory.gif', name: 'Picareta', details: 'Firme o bastante pra quebrar rocha' },
  '6': { img: '/cave/plankInventory.gif', name: 'Tábua', details: 'Tábua grossa de madeira' },
  '8': { img: '/cave/note1.gif', name: 'Nota 1', details: '1º dígito: 1 barra (=5) + 2 pontos (=2) → [ 7 ]' },
  '9': { img: '/cave/note2.gif', name: 'Nota 2', details: '2º dígito: 1 barra (=5) + 1 ponto (=1) → [ 6 ]' },
  '10': { img: '/cave/note3.gif', name: 'Nota 3', details: '3º dígito: 3 pontos → [ 3 ]' },
  '12': { img: '/cave/handleInventory.gif', name: 'Manivela', details: 'Encaixa em alguma engrenagem' },
  '15': { img: '/cave/dynamiteInventory.gif', name: 'Dinamite', details: 'Explosivo antigo' },
  '16': { img: '/cave/fusesInventory.gif', name: 'Estopins', details: 'Pavio para acender dinamite' },
  'book_1': { img: '/cave/note1.gif', name: 'Livro I', details: 'Conto 1: Fronteira da Burocracia (Clique para abrir)' },
  'book_2': { img: '/cave/note2.gif', name: 'Livro II', details: 'Conto 2: Princesa de Plástico (Clique para abrir)' },
  'book_3': { img: '/cave/note3.gif', name: 'Livro III', details: 'Conto 3: Corredor 0999 P.T. (Clique para abrir)' },
  'book_4': { img: '/cave/note1.gif', name: 'Livro IV', details: 'Conto 4: Naufrágio da Porta (Clique para abrir)' },
  'book_5': { img: '/cave/note2.gif', name: 'Livro V', details: 'Conto 5: Plantão da Floresta (Clique para abrir)' },
  'book_6': { img: '/cave/note3.gif', name: 'Livro VI', details: 'Conto 6: Terminal 1984 (Clique para abrir)' },
};

// Elevadores verticais entre (row, col) e (row + 1, col) do SCSS original (@include moveVerticleOnTile)
const CAVE_LIFTS = [
  [1, 5],
  [1, 11],
  [2, 2],
  [2, 8],
  [3, 9],
];

// Paredes fixas do SCSS original (@include makeWallAt(row, tile) -> impede entrar e sair daquele segmento!)
const CAVE_WALL_TILES = new Set([
  '1-1',
  '1-8',
  '1-9',
  '1-13',
  '2-1',
  '2-4',
  '2-13',
  '3-1',
  '3-3',
  '3-4',
  '3-6',
  '3-10',
  '4-7',
  '4-11',
  '4-13',
]);

// Goteiras (@include makeRainAt)
const CAVE_RAIN_SEGMENTS = new Set([3, 7, 15, 18, 22, 29, 31, 47]);

// Olhos assustadores no escuro (removidas as lanternas balançando sem sentido!)
const CAVE_DECOR_TILES = {
  '2-10': '/cave/spookyEyes.gif',
  '5-17': '/cave/spookyEyes.gif',
  '7-8': '/cave/spookyEyes.gif',
  '19-10': '/cave/spookyEyes.gif',
  '23-11': '/cave/spookyEyes.gif',
};

// Objetos interativos nas salas (row, col, tile) — Caverna viva com os 6 Contos e Estante Final!
const CAVE_OBJECTS = [
  { id: 'lantern', row: 1, col: 3, tile: 14, img: '/cave/swingingLantern.gif', kind: 'pickup', hideOnPick: true, msg: 'Você pegou uma Lanterna! A visão na caverna melhorou muito.', ev: 'got_lantern' },
  { id: '1', row: 1, col: 4, tile: 15, img: '/cave/creepyCorridor-24.png', kind: 'junk', msg: 'Nada útil nessa caixa.' },
  { id: 'story_1', row: 1, col: 6, tile: 14, img: '/cave/creepyCorridor-_094.png', kind: 'story_portal', storyId: '1', reqBook: null, msg: 'Livro I: Fronteira da Burocracia' },
  { id: '8', row: 1, col: 6, tile: 13, img: '/cave/creepyCorridor-_094.png', kind: 'pickup', msg: 'Uma nota estranha! (Guardada na mochila)', ev: 'got_note' },
  { id: '3', row: 1, col: 7, tile: 15, img: '/cave/creepyCorridor-_062.png', kind: 'boulder', need: '2', blockMsg: 'Preciso de uma ferramenta pra quebrar essa rocha.', okMsg: 'Boa! Pedra destruída!', ev: 'broke_boulder' },
  { id: '4', row: 1, col: 8, tile: 15, img: '/cave/creepyCorridor-_166.png', kind: 'plunger', msg: 'Apertei o detonador... algo explodiu lá embaixo!', ev: 'armed_plunger' },
  { id: '9', row: 1, col: 10, tile: 13, img: '/cave/creepyCorridor-24.png', kind: 'pickup', msg: 'Outra nota estranha! (Na mochila)', ev: 'got_note' },
  { id: '21', row: 1, col: 12, tile: 13, img: '/cave/creepyCorridor-25.png', kind: 'junk', msg: 'Só tranqueira velha.' },
  { id: '2', row: 1, col: 12, tile: 14, img: '/cave/creepyCorridor-_035.png', kind: 'pickup', hideOnPick: true, msg: 'Uma picareta! Vai quebrar um galho.', ev: 'got_pickaxe' },

  { id: 'story_2', row: 2, col: 3, tile: 15, img: '/cave/creepyCorridor-_161.png', kind: 'story_portal', storyId: '2', reqBook: 'book_1', msg: 'Livro II: Castelo da Princesa de Plástico' },
  { id: '6', row: 2, col: 6, tile: 15, img: '/cave/creepyCorridor-_094.png', kind: 'pickup', msg: 'Uma tábua firme de madeira.', ev: 'got_plank' },
  { id: '18', row: 2, col: 7, tile: 15, img: '/cave/creepyCorridor-24.png', kind: 'junk', msg: 'Vazia.' },
  { id: 'story_3', row: 2, col: 9, tile: 15, img: '/cave/creepyCorridor-_094.png', kind: 'story_portal', storyId: '3', reqBook: 'book_2', msg: 'Livro III: Corredor 0999 (P.T.)' },
  { id: '17', row: 2, col: 12, tile: 15, img: '/cave/creepyCorridor-_168.png', kind: 'final_shelf', msg: 'Estante Final dos 6 Livros' },

  { id: '12', row: 3, col: 2, tile: 13, img: '/cave/creepyCorridor-_094.png', kind: 'pickup', msg: 'Uma manivela de engrenagem!', ev: 'got_handle' },
  { id: '11', row: 3, col: 4, tile: 13, img: '/cave/doorLocked.png', unlockedImg: '/cave/doorUnlocked.png', specialClass: 'special-door', kind: 'padlock_door', msg: 'Porta trancada com cadeado de 3 dígitos.' },
  { id: '7', row: 3, col: 5, tile: 13, img: '/cave/creepyCorridor-_169.png', clearedImg: '/cave/creepyCorridor-_170.png', kind: 'gap', need: '6', blockMsg: 'Fenda funda demais pra pular sem uma tábua.', okMsg: 'Tábua encaixada!', ev: 'placed_plank' },
  { id: '10', row: 3, col: 5, tile: 14, img: '/cave/creepyCorridor-24.png', kind: 'pickup', msg: 'Terceira nota misteriosa! (Na mochila)', ev: 'got_note' },
  { id: '5', row: 3, col: 7, tile: 13, img: '/cave/beam.gif', specialClass: 'special-beam', kind: 'beam', blockMsg: 'Algum explosivo à distância deve derrubar essa barreira.' },
  { id: 'story_4', row: 3, col: 8, tile: 15, img: '/cave/creepyCorridor-24.png', kind: 'story_portal', storyId: '4', reqBook: 'book_3', msg: 'Livro IV: Naufrágio da Porta Gigante' },

  { id: 'story_5', row: 4, col: 8, tile: 13, img: '/cave/creepyCorridor-_094.png', kind: 'story_portal', storyId: '5', reqBook: 'book_4', msg: 'Livro V: Plantão da Floresta' },
  { id: '13', row: 4, col: 10, tile: 13, img: '/cave/creepyCorridor-_148.png', kind: 'cog', need: '12', blockMsg: 'Falta uma manivela pra girar esse registro.', okMsg: 'Fechou a queda d\'água!', ev: 'stopped_water' },
  { id: '14', row: 4, col: 11, tile: 13, img: '/cave/waterOn.gif', clearedImg: '/cave/waterOff.gif', specialClass: 'special-water', kind: 'waterfall', blockMsg: 'Cachoeira forte demais pra atravessar!' },
  { id: 'story_6', row: 4, col: 12, tile: 15, img: '/cave/creepyCorridor-_094.png', kind: 'story_portal', storyId: '6', reqBook: 'book_5', msg: 'Livro VI: Terminal 1984' },
];

function renderCaveChapterScreen(savedCave = null, { justFell = false, justEarnedBook = null, remark = null } = {}) {
  clearTimers();
  currentStage = 'cave_2d';
  document.body.className = 'cave-mode awakened-cursors';
  resetFaviconAndTitle('naoclique.net // ???');

  const state = {
    row: savedCave?.row || 1,
    col: savedCave?.col || 2,
    inventory: Array.isArray(savedCave?.inventory) ? [...savedCave.inventory] : ['0'],
    cleared: Array.isArray(savedCave?.cleared) ? [...savedCave.cleared] : [],
    booksOwned: Array.isArray(savedCave?.booksOwned) ? [...savedCave.booksOwned] : [],
    booksSolved: Array.isArray(savedCave?.booksSolved) ? [...savedCave.booksSolved] : [],
    plungerArmed: Boolean(savedCave?.plungerArmed),
    introDone: Boolean(savedCave?.introDone),
  };

  if (state.plungerArmed && !state.cleared.includes('beam')) {
    state.cleared.push('beam');
  }

  const app = document.getElementById('app');
  app.style.visibility = 'visible';

  // Monta os 48 segmentos (4 linhas x 12 colunas)
  let segmentsHtml = '';
  for (let r = 1; r <= 4; r++) {
    for (let c = 1; c <= 12; c++) {
      const segIdx = (r - 1) * 12 + c;
      const hasRain = CAVE_RAIN_SEGMENTS.has(segIdx);
      const hasLiftTop = CAVE_LIFTS.some(([lr, lc]) => lr === r && lc === c);

      let dripsHtml = '';
      if (hasRain) {
        dripsHtml = `<div class="cave-drip-container">
          <div class="cave-drip" style="left:22px; animation-delay:0.1s;"></div>
          <div class="cave-drip" style="left:68px; animation-delay:0.7s;"></div>
          <div class="cave-drip" style="left:114px; animation-delay:0.35s;"></div>
        </div>`;
      }

      let liftHtml = '';
      if (hasLiftTop) {
        liftHtml = `
          <div class="cave-lift-ropes" data-lift="${r}-${c}"></div>
          <img class="cave-lift-plat" data-lift-plat="${r}-${c}" src="/cave/corridorLift.png" alt="" />
        `;
      }

      let tilesHtml = '';
      for (let t = 1; t <= 21; t++) {
        const decorSrc = CAVE_DECOR_TILES[`${segIdx}-${t}`];
        const obj = CAVE_OBJECTS.find((o) => o.row === r && o.col === c && o.tile === t);

        if (obj) {
          tilesHtml += `
            <div class="cave-tile ${obj.specialClass || ''}" data-obj-slot="${obj.id}">
              <div class="cave-obj-btn" data-obj-id="${obj.id}">
                <img src="${obj.img}" alt="" data-obj-img="${obj.id}" />
              </div>
            </div>
          `;
        } else if (decorSrc) {
          tilesHtml += `<div class="cave-tile"><img class="decor-anim" src="${decorSrc}" alt="" /></div>`;
        } else {
          tilesHtml += `<div class="cave-tile"></div>`;
        }
      }

      segmentsHtml += `
        <div class="cave-segment" data-seg="${r}-${c}">
          ${dripsHtml}
          ${liftHtml}
          <div class="cave-tiles">${tilesHtml}</div>
        </div>
      `;
    }
  }

  app.innerHTML = `
    <div class="cave-top-hud">
      <div class="operator-feed">
        <span class="operator-tag">log</span>
        <span id="operator-msg"></span>
      </div>
    </div>

    <div class="cave-inventory">
      <img class="cave-backpack-icon" src="/cave/creepyBackpack.png" title="Mochila" alt="Mochila" />
      <div class="cave-inv-grid" id="cave-inv-grid"></div>
    </div>

    <div class="cave-stage-root" id="cave-stage-root">
      <div class="cave-viewport" id="cave-viewport">
        <img class="cave-level-bg" src="/cave/tilemaps.png" alt="Mapa da Caverna" />
        ${segmentsHtml}
        <div class="cave-character" id="cave-char"></div>
        <div class="cave-darkness-mask" id="cave-darkness-mask"></div>
      </div>
    </div>

    <div class="cave-wasd-hint">
      <span>Mover: <span class="wasd-keycap">W</span><span class="wasd-keycap">A</span><span class="wasd-keycap">S</span><span class="wasd-keycap">D</span></span>
      <span>Interagir na sala: <span class="wasd-keycap">E</span> ou <span class="wasd-keycap">Clique</span></span>
    </div>
  `;

  let walkingTimer = null;
  let torchLit = state.introDone;

  function showSegmentBubble(r, c, text) {
    document.querySelectorAll('.cave-bubble').forEach((b) => b.remove());
    const seg = document.querySelector(`.cave-segment[data-seg="${r}-${c}"]`);
    if (!seg) return;
    const b = document.createElement('div');
    b.className = 'cave-bubble';
    b.textContent = text;
    seg.appendChild(b);
    setTimeout(() => b.remove(), 2900);
  }

  function openBookFromBag(bookId) {
    openBookReaderModal(bookId, state, {
      apiPost,
      setOperatorRemark,
      onSolved: (newCaveState) => {
        if (newCaveState) {
          state.booksSolved = [...(newCaveState.booksSolved || [])];
          state.booksOwned = [...(newCaveState.booksOwned || [])];
        }
        refreshInventoryUI();
        refreshObjectsVisuals();
      },
    });
  }

  function refreshInventoryUI() {
    const grid = document.getElementById('cave-inv-grid');
    if (!grid) return;
    grid.innerHTML = state.inventory
      .filter((id) => CAVE_INVENTORY_META[id])
      .map((id) => {
        const m = CAVE_INVENTORY_META[id];
        const isBook = id.startsWith('book_');
        const solved = isBook && state.booksSolved.includes(id);
        return `
          <div class="cave-inv-item ${isBook ? 'cave-inv-book' : ''}" data-inv-id="${id}">
            <img src="${m.img}" alt="${m.name}" />
            <div style="margin-top:4px;">${isBook ? (solved ? `✅ ${m.name}` : `📖 ${m.name}`) : m.name}</div>
            <div class="inv-tooltip"><strong>${m.name}</strong><br/>${m.details}</div>
          </div>
        `;
      })
      .join('');

    grid.querySelectorAll('.cave-inv-book').forEach((el) => {
      el.addEventListener('click', () => {
        playCheapBeep();
        openBookFromBag(el.getAttribute('data-inv-id'));
      });
    });
  }

  function refreshObjectsVisuals() {
    CAVE_OBJECTS.forEach((obj) => {
      const imgEl = document.querySelector(`[data-obj-img="${obj.id}"]`);
      const slotEl = document.querySelector(`[data-obj-slot="${obj.id}"]`);
      if (!imgEl || !slotEl) return;

      if (obj.kind === 'pickup' && obj.hideOnPick && state.inventory.includes(obj.id)) {
        slotEl.style.display = 'none';
      } else if (obj.kind === 'boulder' && state.cleared.includes('boulder')) {
        slotEl.style.display = 'none';
      } else if (obj.kind === 'beam' && state.cleared.includes('beam')) {
        slotEl.style.display = 'none';
      } else if (obj.kind === 'gap' && state.cleared.includes('gap') && obj.clearedImg) {
        imgEl.src = obj.clearedImg;
      } else if (obj.kind === 'waterfall' && state.cleared.includes('water') && obj.clearedImg) {
        imgEl.src = obj.clearedImg;
      } else if (obj.kind === 'padlock_door' && state.cleared.includes('padlock_door') && obj.unlockedImg) {
        imgEl.src = obj.unlockedImg;
      }
    });
  }

  const floorYForRow = (r) => (r - 1) * 336 + 216;
  const colCenterX = (c) => (c - 1) * 144 + 72;

  let charX = colCenterX(state.col);
  let charY = (!state.introDone || justFell) ? -42 : floorYForRow(state.row);
  let facingLeft = false;
  let isDroppingFromCeiling = !state.introDone || justFell;
  let dropVy = 0;
  let elevatorTargetRow = null;
  let activeLift = null; // [lr, lc]

  function fitCaveStageToScreen() {
    const root = document.getElementById('cave-stage-root');
    if (!root) return;
    const availW = Math.max(320, window.innerWidth - 200);
    const availH = Math.max(240, window.innerHeight - 155);
    const scale = Math.min(availW / 1728, availH / 1344, 0.92);
    const offsetX = window.innerWidth > 900 ? 72 : 0;
    root.style.transform = `translate(calc(-50% + ${offsetX}px), -50%) scale(${scale})`;
  }
  fitCaveStageToScreen();
  caveResizeHandler = fitCaveStageToScreen;
  window.addEventListener('resize', caveResizeHandler);

  function getNearbyInteractable() {
    const nearby = CAVE_OBJECTS
      .filter((o) => {
        if (o.row !== state.row) return false;
        if (o.kind === 'pickup' && o.hideOnPick && state.inventory.includes(o.id)) return false;
        if (o.kind === 'boulder' && state.cleared.includes('boulder')) return false;
        if (o.kind === 'beam' && state.cleared.includes('beam')) return false;
        return Math.abs(colCenterX(o.col) - charX) <= 105;
      })
      .sort((a, b) => {
        const aPend = a.kind === 'pickup' && !state.inventory.includes(a.id) ? 0 : 1;
        const bPend = b.kind === 'pickup' && !state.inventory.includes(b.id) ? 0 : 1;
        if (aPend !== bPend) return aPend - bPend;
        return Math.abs(colCenterX(a.col) - charX) - Math.abs(colCenterX(b.col) - charX);
      });
    return nearby[0] || null;
  }

  function updateViewportPosition(isLeft = facingLeft, isMoving = false) {
    const ch = document.getElementById('cave-char');
    const mask = document.getElementById('cave-darkness-mask');
    if (!ch || !mask) return;

    ch.style.left = `${charX}px`;
    ch.style.top = `${charY}px`;
    ch.classList.toggle('facing-left', isLeft);
    ch.classList.toggle('walking', isMoving);

    // Antes de pegar a lanterna: MUITO escuro! Depois da lanterna: luz ampla com degradê suave!
    const hasLantern = state.inventory.includes('lantern');
    const radius = torchLit ? (hasLantern ? 215 : 82) : 34;
    const innerR = Math.round(radius * 0.24);
    const midR = Math.round(radius * 0.62);
    mask.style.background = `radial-gradient(circle ${radius}px at ${charX}px ${charY}px, rgba(255, 200, 110, ${hasLantern ? 0.08 : 0.03}) 0%, rgba(8, 8, 12, ${hasLantern ? 0.22 : 0.45}) ${innerR}px, rgba(4, 4, 7, 0.86) ${midR}px, rgba(4, 4, 6, 0.99) ${radius}px, rgba(4, 4, 6, 0.998) 100%)`;

    // Destaca e faz brilhar o item mais próximo para interação com [E]!
    const nearest = torchLit && !isDroppingFromCeiling ? getNearbyInteractable() : null;
    document.querySelectorAll('.cave-obj-btn.cave-obj-nearby').forEach((el) => {
      if (!nearest || el.getAttribute('data-obj-id') !== nearest.id) {
        el.classList.remove('cave-obj-nearby');
      }
    });
    if (nearest) {
      document.querySelector(`.cave-obj-btn[data-obj-id="${nearest.id}"]`)?.classList.add('cave-obj-nearby');
    }

    // Sincroniza plataforma do elevador frame-a-frame com a altura do boneco!
    CAVE_LIFTS.forEach(([lr, lc]) => {
      const plat = document.querySelector(`[data-lift-plat="${lr}-${lc}"]`);
      const ropes = document.querySelector(`[data-lift="${lr}-${lc}"]`);
      if (!plat || !ropes) return;

      let offsetPx = 0;
      if (activeLift && activeLift[0] === lr && activeLift[1] === lc) {
        offsetPx = Math.max(0, Math.min(336, charY - floorYForRow(lr)));
      } else if (state.row === lr + 1 && state.col === lc) {
        offsetPx = 336;
      }
      plat.style.top = `${186 + offsetPx}px`;
      ropes.style.height = `${16 + offsetPx}px`;
    });
  }

  function isBlockedAt(r, c) {
    if (r === 1 && c === 7 && !state.cleared.includes('boulder')) return true;
    if (r === 3 && c === 7 && !state.cleared.includes('beam')) return true;
    if (r === 3 && c === 5 && !state.cleared.includes('gap')) return true;
    if (r === 3 && c === 4 && !state.cleared.includes('padlock_door')) return true;
    if (r === 4 && c === 11 && !state.cleared.includes('water')) return true;
    return false;
  }

  function canMoveHorizontal(fromR, fromC, toC) {
    if (toC < 1 || toC > 12) return false;
    // Paredes estáticas do SCSS original:
    // Moving right (toC = fromC + 1): makeWallAt(r, toC + 1) esconde a seta de avanço pra toC?
    // No SCSS original: makeWallAt(row, tile) esconde forward em (tile-1) e backward em (tile+1), ou seja, a célula 'tile' é uma PAREDE SÓLIDA INTRANSPONÍVEL!
    if (CAVE_WALL_TILES.has(`${fromR}-${toC}`)) {
      // Exceção: (1,8) tinha makeWallAt(1,8) até quebrar a pedra em (1,7)! Quando quebra a pedra, compare(2,7) libera passar até (1,8) onde fica o detonador!
      if (fromR === 1 && toC === 8 && state.cleared.includes('boulder')) {
        // liberado!
      } else if (fromR === 3 && toC === 4 && state.cleared.includes('padlock_door')) {
        // liberado quando destranca cadeado!
      } else if (fromR === 4 && toC === 11 && state.cleared.includes('water')) {
        // liberado quando desliga cachoeira!
      } else {
        return false;
      }
    }

    // Não permite atravessar uma sala que tem obstáculo bloqueante ativo (mas permite entrar nela pra interagir, sem passar além dela!)
    if (isBlockedAt(fromR, fromC)) {
      // Se estou em cima da sala do obstáculo, só posso voltar pro lado de onde vim!
      // Pedra (1,7): veio da esquerda (6) | Feixe (3,7): veio da direita (8) | Gap (3,5): veio da direita (6) ou cima | Porta (3,4): veio da direita (5) | Água (4,11): veio da esquerda (10)
      if (fromR === 1 && fromC === 7 && toC > 7) return false;
      if (fromR === 3 && fromC === 7 && toC < 7) return false;
      if (fromR === 3 && fromC === 5 && toC < 5) return false;
      if (fromR === 3 && fromC === 4 && toC < 4) return false;
      if (fromR === 4 && fromC === 11 && toC > 11) return false;
    }

    return true;
  }

  function canMoveVertical(fromR, fromC, toR) {
    if (toR < 1 || toR > 4) return false;
    if (toR === fromR + 1) {
      return CAVE_LIFTS.some(([lr, lc]) => lr === fromR && lc === fromC);
    }
    if (toR === fromR - 1) {
      return CAVE_LIFTS.some(([lr, lc]) => lr === toR && lc === fromC);
    }
    return false;
  }

  async function syncCave(eventCode = null) {
    const res = await apiPost('/api/cave/sync', { caveState: state, eventCode });
    if (res?.remark) {
      setOperatorRemark(res.remark, { priority: 'action' });
    }
  }

  function openCavePadlockModal() {
    if (document.getElementById('cave-padlock-modal')) return;
    const digits = [1, 1, 1];

    const modal = document.createElement('div');
    modal.id = 'cave-padlock-modal';
    modal.className = 'cave-padlock-modal';
    modal.innerHTML = `
      <div class="cave-padlock-circle">
        <img src="/cave/padlockBig.png" alt="Cadeado" style="position:absolute; top:26px; image-rendering:pixelated;" />
        <div class="cave-padlock-dials">
          ${[0, 1, 2]
            .map(
              (idx) => `
            <div class="padlock-dial-col">
              <button type="button" class="padlock-arrow-btn" data-dial="${idx}" data-dir="1"><img src="/cave/padlockUp.png" alt="+" /></button>
              <div class="padlock-digit-box" id="pad-d-${idx}">1</div>
              <button type="button" class="padlock-arrow-btn" data-dial="${idx}" data-dir="-1"><img src="/cave/padlockDown.png" alt="-" /></button>
            </div>
          `
            )
            .join('')}
        </div>
        <div class="cave-padlock-actions">
          <button type="button" class="cave-padlock-btn" id="pad-check-btn">Testar</button>
          <button type="button" class="cave-padlock-btn" id="pad-close-btn">Fechar</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelectorAll('.padlock-arrow-btn').forEach((b) => {
      b.addEventListener('click', () => {
        const i = Number(b.getAttribute('data-dial'));
        const dir = Number(b.getAttribute('data-dir'));
        digits[i] = ((digits[i] - 1 + dir + 9) % 9) + 1;
        const box = document.getElementById(`pad-d-${i}`);
        if (box) box.textContent = String(digits[i]);
        playCheapBeep();
      });
    });

    document.getElementById('pad-close-btn')?.addEventListener('click', () => modal.remove());
    document.getElementById('pad-check-btn')?.addEventListener('click', async () => {
      const attempt = digits.join('');
      const res = await apiPost('/api/cave/sync', {
        caveState: state,
        padlockAttempt: attempt,
        eventCode: 'padlock_open',
      });
      if (res?.padlockUnlocked) {
        if (!state.cleared.includes('padlock_door')) state.cleared.push('padlock_door');
        modal.remove();
        refreshObjectsVisuals();
        showSegmentBubble(state.row, state.col, 'Cadeado destrancado!');
        if (res.remark) setOperatorRemark(res.remark, { priority: 'action' });
      } else {
        playErrorBuzzer();
        if (res?.remark) setOperatorRemark(res.remark, { priority: 'action' });
      }
    });
  }

  async function interactWithObject(obj) {
    if (!obj) return;
    // Só interage com objetos da sala atual (ou sala adjacente imediata)
    if (obj.row !== state.row || Math.abs(obj.col - state.col) > 1) {
      showSegmentBubble(state.row, state.col, 'Chegue mais perto usando WASD.');
      return;
    }

    playCheapBeep();

    if (obj.kind === 'junk') {
      showSegmentBubble(obj.row, obj.col, obj.msg);
      return;
    }

    if (obj.kind === 'pickup') {
      if (!state.inventory.includes(obj.id)) {
        state.inventory.push(obj.id);
        refreshInventoryUI();
        refreshObjectsVisuals();
        showSegmentBubble(obj.row, obj.col, obj.msg);
        await syncCave(obj.ev);
      } else {
        showSegmentBubble(obj.row, obj.col, 'Já peguei isso daqui.');
      }
      return;
    }

    if (obj.kind === 'boulder') {
      if (state.inventory.includes('2')) {
        if (!state.cleared.includes('boulder')) {
          state.cleared.push('boulder');
          refreshObjectsVisuals();
          showSegmentBubble(obj.row, obj.col, obj.okMsg);
          await syncCave(obj.ev);
        }
      } else {
        showSegmentBubble(obj.row, obj.col, obj.blockMsg);
      }
      return;
    }

    if (obj.kind === 'plunger') {
      state.plungerArmed = true;
      if (!state.cleared.includes('beam')) state.cleared.push('beam');
      const vp = document.getElementById('cave-viewport');
      vp?.classList.remove('shake-blast');
      void vp?.offsetWidth;
      vp?.classList.add('shake-blast');
      playCollapseRumble();
      refreshObjectsVisuals();
      showSegmentBubble(obj.row, obj.col, obj.msg);
      await syncCave(obj.ev);
      return;
    }

    if (obj.kind === 'gap') {
      if (state.inventory.includes('6')) {
        if (!state.cleared.includes('gap')) {
          state.cleared.push('gap');
          refreshObjectsVisuals();
          showSegmentBubble(obj.row, obj.col, obj.okMsg);
          await syncCave(obj.ev);
        }
      } else {
        showSegmentBubble(obj.row, obj.col, obj.blockMsg);
      }
      return;
    }

    if (obj.kind === 'beam' || obj.kind === 'waterfall') {
      showSegmentBubble(obj.row, obj.col, obj.blockMsg);
      return;
    }

    if (obj.kind === 'padlock_door') {
      if (!state.cleared.includes('padlock_door')) {
        openCavePadlockModal();
      } else {
        showSegmentBubble(obj.row, obj.col, 'A porta já está destrancada.');
      }
      return;
    }

    if (obj.kind === 'cog') {
      if (state.inventory.includes('12')) {
        if (!state.cleared.includes('water')) {
          state.cleared.push('water');
          refreshObjectsVisuals();
          showSegmentBubble(obj.row, obj.col, obj.okMsg);
          await syncCave(obj.ev);
        }
      } else {
        showSegmentBubble(obj.row, obj.col, obj.blockMsg);
      }
      return;
    }

    if (obj.kind === 'story_portal') {
      if (obj.reqBook && !state.booksSolved.includes(obj.reqBook)) {
        const prevMeta = BOOKS_META[obj.reqBook];
        showSegmentBubble(obj.row, obj.col, `Bloqueado! Resolva o enigma do ${prevMeta?.title || 'livro anterior'} primeiro.`);
        return;
      }
      if (state.booksOwned.includes(`book_${obj.storyId}`)) {
        openBookFromBag(`book_${obj.storyId}`);
        return;
      }
      launchStory(obj.storyId, {
        clearTimers,
        apiPost,
        setOperatorRemark,
        playBeep: playCheapBeep,
        caveState: state,
        returnToCave: (updatedCave, extra = {}) => {
          renderCaveChapterScreen(updatedCave, extra);
        },
      });
      return;
    }

    if (obj.kind === 'final_shelf') {
      openFinalShelfModal(state, {
        apiPost,
        setOperatorRemark,
        onEscape: () => {
          playCollapseRumble();
          setTimeout(() => renderCaveEscapedScreen(), 1200);
        },
      });
      return;
    }

    if (obj.kind === 'end_door') {
      if (state.inventory.includes('15') && state.inventory.includes('16')) {
        playCollapseRumble();
        await syncCave('cave_win');
        setTimeout(() => {
          renderCaveEscapedScreen();
        }, 1600);
      } else {
        showSegmentBubble(obj.row, obj.col, obj.blockMsg);
      }
    }
  }

  // Clique direto nos objetos visíveis
  app.querySelectorAll('.cave-obj-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-obj-id');
      const obj = CAVE_OBJECTS.find((o) => o.id === id);
      interactWithObject(obj);
    });
  });

  // CONTROLE FLUIDO NO TECLADO: WASD (e Setas) contínuo + E para interagir por proximidade!
  const keysDown = new Set();

  caveKeyHandler = (ev) => {
    if (currentStage !== 'cave_2d') return;
    if (document.getElementById('cave-padlock-modal')) return;

    const k = ev.key.toLowerCase();
    if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'e'].includes(k)) {
      ev.preventDefault();
    }

    if (k === 'e' && !ev.repeat) {
      const target = getNearbyInteractable();
      if (target) {
        interactWithObject(target);
      }
      return;
    }

    keysDown.add(k);
  };

  caveKeyUpHandler = (ev) => {
    keysDown.delete(ev.key.toLowerCase());
  };

  window.addEventListener('keydown', caveKeyHandler);
  window.addEventListener('keyup', caveKeyUpHandler);

  refreshInventoryUI();
  refreshObjectsVisuals();
  updateViewportPosition(facingLeft, false);

  let lastFrameTime = performance.now();
  const caveTick = (now) => {
    if (currentStage !== 'cave_2d') return;
    const dt = Math.min(0.05, (now - lastFrameTime) / 1000);
    lastFrameTime = now;

    let isMoving = false;

    // 1. Animação inicial caindo do teto no canto superior esquerdo!
    if (isDroppingFromCeiling) {
      dropVy += 1450 * dt;
      charY += dropVy * dt;
      const landY = floorYForRow(1);
      if (charY >= landY) {
        charY = landY;
        isDroppingFromCeiling = false;
        dropVy = 0;
      }
      updateViewportPosition(facingLeft, false);
      caveRaf = requestAnimationFrame(caveTick);
      return;
    }

    // 2. Viagem suave de elevador entre andares (junto com a plataforma!)
    if (elevatorTargetRow !== null) {
      const targetY = floorYForRow(elevatorTargetRow);
      const dirY = targetY > charY ? 1 : -1;
      charY += dirY * 290 * dt;
      if ((dirY > 0 && charY >= targetY) || (dirY < 0 && charY <= targetY)) {
        charY = targetY;
        state.row = elevatorTargetRow;
        elevatorTargetRow = null;
        activeLift = null;
        syncCave();
      }
      updateViewportPosition(facingLeft, false);
      caveRaf = requestAnimationFrame(caveTick);
      return;
    }

    // 3. Movimento livre fluido horizontal (WASD / Setas) sem entrar nas paredes!
    if (torchLit && !document.getElementById('cave-padlock-modal')) {
      const moveRight = keysDown.has('d') || keysDown.has('arrowright');
      const moveLeft = keysDown.has('a') || keysDown.has('arrowleft');
      const moveDown = keysDown.has('s') || keysDown.has('arrowdown');
      const moveUp = keysDown.has('w') || keysDown.has('arrowup');

      let vx = 0;
      if (moveRight && !moveLeft) { vx = 1; facingLeft = false; }
      else if (moveLeft && !moveRight) { vx = -1; facingLeft = true; }

      if (vx !== 0) {
        const speed = 225;
        const proposedX = Math.max(144 + 28, Math.min(1728 - 28, charX + vx * speed * dt));
        const curCol = Math.max(1, Math.min(12, Math.floor(charX / 144) + 1));
        const edgeCol = Math.max(1, Math.min(12, Math.floor((proposedX + vx * 28) / 144) + 1));

        if (edgeCol === curCol || canMoveHorizontal(state.row, curCol, edgeCol)) {
          charX = proposedX;
          isMoving = true;
          const newCol = Math.max(1, Math.min(12, Math.floor(charX / 144) + 1));
          if (newCol !== state.col) {
            state.col = newCol;
            syncCave();
          }
        }
      }

      // Elevadores verticais (W / S quando próximo do eixo do elevador)
      if (moveDown && canMoveVertical(state.row, state.col, state.row + 1)) {
        const liftX = colCenterX(state.col);
        if (Math.abs(charX - liftX) <= 52) {
          charX = liftX;
          activeLift = [state.row, state.col];
          elevatorTargetRow = state.row + 1;
        }
      } else if (moveUp && canMoveVertical(state.row, state.col, state.row - 1)) {
        const liftX = colCenterX(state.col);
        if (Math.abs(charX - liftX) <= 52) {
          charX = liftX;
          activeLift = [state.row - 1, state.col];
          elevatorTargetRow = state.row - 1;
        }
      }
    }

    updateViewportPosition(facingLeft, isMoving);
    caveRaf = requestAnimationFrame(caveTick);
  };
  caveRaf = requestAnimationFrame(caveTick);

  // Sequência de Queda / Acender a Tocha ao chegar na Caverna!
  if (!state.introDone || justFell) {
    torchLit = false;
    updateViewportPosition(false);
    setOperatorRemark(
      'parabéns, gênio. vc conseguiu colapsar a fundação do servidor. bate palma pra sua própria estupidez. agora olha onde vc foi parar.',
      { delayBefore: 120, priority: 'urgent' }
    );
    (async () => {
      showSegmentBubble(state.row, state.col, 'O chão do porão desabou...');
      await sleep(2200);
      showSegmentBubble(state.row, state.col, 'Escuro demais aqui embaixo.');
      await sleep(1800);
      torchLit = true;
      state.introDone = true;
      updateViewportPosition(false);
      await syncCave('intro_done');
    })();
  } else {
    if (remark) {
      setOperatorRemark(remark, { delayBefore: 250, priority: 'urgent' });
    } else {
      setOperatorRemark(
        'ainda nessa mina velha? usa WASD e vê se resolve logo antes que eu perca o resto da paciência.',
        { delayBefore: 350 }
      );
    }
    if (justEarnedBook) {
      setTimeout(() => openBookFromBag(justEarnedBook), 450);
    }
  }
}

function renderCaveEscapedScreen() {
  clearTimers();
  currentStage = 'cave_escaped';
  document.body.className = 'subsolo-mode awakened-cursors';
  resetFaviconAndTitle('naoclique.net // pós-caverna');

  const app = document.getElementById('app');
  app.style.visibility = 'visible';

  app.innerHTML = `
    <div class="subsolo-shell" style="text-align:center; padding:40px 20px;">
      <div class="operator-feed" style="text-align:left;">
        <span class="operator-tag">log</span>
        <span id="operator-msg"></span>
      </div>
      <div style="margin-top:48px; border:2px dashed #ffb128; padding:40px; background:#141415; font-family:'CavePixles', monospace;">
        <h2 style="color:#78f148; margin:0 0 14px;">🧨 SAÍDA DA CAVERNA DETONADA!</h2>
        <p style="color:#d4d4d8; font-size:14px;">Vocês atravessaram a fumaça da explosão — pronto para desenharmos o próximo capítulo!</p>
      </div>
    </div>
  `;

  setOperatorRemark(
    'sobreviveu por pura sorte. mas me diz uma coisa... como caralhos existia uma mina inteira compilada abaixo da camada zero do meu sistema?',
    { delayBefore: 400, priority: 'urgent' }
  );
}

// ============================================================================
// PAINEL DE TESTES (DEV ONLY - Topo Direito — Limpo, na Ordem Exata das 8 Páginas Reais!)
// ============================================================================
function mountDevTestPanel() {
  if (!import.meta.env.DEV) return;
  if (document.getElementById('dev-test-panel')) return;

  const isClickerNow = () => currentStage === 'mundane_clicker' || currentStage === 'awakened_clicker';

  const panel = document.createElement('div');
  panel.id = 'dev-test-panel';
  panel.className = 'dev-panel';
  panel.innerHTML = `
    <button class="dev-toggle" id="dev-toggle-btn">⚙️ DEV</button>
    <div class="dev-menu" id="dev-menu">
      <div class="dev-menu-title">🗺️ Ordem das Páginas do Jogo</div>
      <button class="dev-btn danger" data-dev="reset">🔄 Resetar Tudo do Zero</button>
      <button class="dev-btn" data-dev="goto_page_1_button">1. Botão Inicial (9x → 5x)</button>
      <button class="dev-btn" data-dev="goto_page_2_shapes">2. Bloquinhos de Criança</button>
      <button class="dev-btn" data-dev="goto_page_3_clicker_start">3. Clicker Mudo (Início 0/16)</button>
      <button class="dev-btn" data-dev="goto_page_4_awakening_error">4. Erro c/ Ele Falando (13/16)</button>
      <button class="dev-btn" data-dev="goto_page_5_clicker_end">5. Clicker Final (Enigma 99°C)</button>
      <button class="dev-btn" data-dev="goto_page_6_loading">6. Loading Porco + Chat</button>
      <button class="dev-btn" data-dev="goto_page_7_subsolo">7. Porão 2D (Morse + Vapor)</button>
      <button class="dev-btn" data-dev="goto_page_8_cave">8. Caverna (WASD + Eco)</button>
      <div class="dev-menu-title" id="dev-clicker-tools-hdr" style="margin-top:6px;">🧰 Ferramentas (Só Clicker)</div>
      <button class="dev-btn" id="dev-btn-pts" data-dev="add_points_big">💎 +500.000 pts (Sem Reload)</button>
      <button class="dev-btn" id="dev-btn-evt" data-dev="spawn_event">🪰 Testar Evento (Mosca/Caixa)</button>
    </div>
  `;
  document.body.appendChild(panel);

  const toggleBtn = document.getElementById('dev-toggle-btn');
  const menu = document.getElementById('dev-menu');

  const syncContextualTools = () => {
    const show = isClickerNow();
    const hdr = document.getElementById('dev-clicker-tools-hdr');
    const bPts = document.getElementById('dev-btn-pts');
    const bEvt = document.getElementById('dev-btn-evt');
    if (hdr) hdr.style.display = show ? 'block' : 'none';
    if (bPts) bPts.style.display = show ? 'block' : 'none';
    if (bEvt) bEvt.style.display = show ? 'block' : 'none';
  };

  toggleBtn?.addEventListener('click', () => {
    syncContextualTools();
    menu?.classList.toggle('open');
  });

  panel.querySelectorAll('[data-dev]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const action = btn.getAttribute('data-dev');
      if (action === 'spawn_event') {
        menu?.classList.remove('open');
        if (isClickerNow()) spawnRandomScreenEvent();
        return;
      }
      if (action === 'add_points_big') {
        menu?.classList.remove('open');
        if (!isClickerNow()) return;
        const res = await apiPost('/api/_dev/action', { action });
        if (res && latestState) {
          latestState.points = res.points;
          updatePointsAndCpsUI(res.points, latestState.cps || 0);
          refreshShopAffordability();
        }
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
    latestState = data;
    renderShittyLoadingScreen({ forcedByOperator: Boolean(data.forcedSubsolo) });
  } else if (data.stage === 'subsolo_2d') {
    renderSubsolo2DScreen(data);
  } else if (data.stage === 'cave_2d') {
    renderCaveChapterScreen(data.caveState);
  } else if (data.stage === 'cave_escaped') {
    renderCaveEscapedScreen();
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
