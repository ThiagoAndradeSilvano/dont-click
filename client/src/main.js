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
  // Mãos vermelhas dele só existem onde ele já acordou (clicker acordado, subsolo, caverna)
  if (!document.body.classList.contains('awakened-cursors')) return;
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

const IDLE_VOICE_POOL = [
  {
    text: 'alôôô? ... tá aí ainda ou morreu na cadeira, mano?',
    voiceUrl: '/voices/idle_1.mp3',
    steps: [
      { text: 'alôôô? ', durationMs: 1100 },
      { pause: 850 }, // batidinhas no microfone ("toc toc toc")
      { text: 'tá aí ainda ou morreu na cadeira, mano?', durationMs: 2550 },
    ],
  },
  {
    text: 'ué... parou? foi embora mesmo? ...ah não, o mouse tá aí ainda, seu filho da puta.',
    voiceUrl: '/voices/idle_2.mp3',
    steps: [
      { text: 'ué... parou? foi embora mesmo? ', durationMs: 2550 },
      { pause: 450 },
      { text: '...ah não, o mouse tá aí ainda, seu filho da puta.', durationMs: 3150 },
    ],
  },
  {
    text: 'pô mano, se for ficar olhando pro nada fecha a aba logo, namoral.',
    voiceUrl: '/voices/idle_3.mp3',
    steps: [
      { pause: 1050 }, // suspiro fundo no mic ("fffff...")
      { text: 'pô mano, ', durationMs: 900 },
      { text: 'se for ficar olhando pro nada fecha a aba logo, namoral.', durationMs: 3250 },
    ],
  },
  {
    text: 'ô... psiu... acordaaa caralho.',
    voiceUrl: '/voices/idle_5.mp3',
    steps: [
      { text: 'ô... psiu... ', durationMs: 1350 },
      { pause: 150 },
      { text: 'acordaaa caralho.', durationMs: 1750 },
    ],
  },
];

let idleVoiceCursor = 0;
let lastTeimosoVoiceAt = 0;
let lastRisadaVoiceAt = 0;

function pickNextIdleVoiceLine() {
  const item = IDLE_VOICE_POOL[idleVoiceCursor % IDLE_VOICE_POOL.length];
  idleVoiceCursor += 1;
  return item;
}

function triggerTeimosoVoiceReaction({ cooldownMs = 22000, priority = 'action' } = {}) {
  if (Date.now() - lastTeimosoVoiceAt < cooldownMs || isVoiceSpeakingNow) return false;
  lastTeimosoVoiceAt = Date.now();
  setOperatorRemark('ah não, mano... cê faz de propósito pra me irritar, né possível.', {
    priority,
    voiceUrl: '/voices/react_teimoso.mp3',
    steps: [
      { text: 'ah não, mano... ', durationMs: 1450 },
      { pause: 150 },
      { text: 'cê faz de propósito pra me irritar, né possível.', durationMs: 2700 },
    ],
  });
  return true;
}

function triggerRisadaVoiceReaction({ cooldownMs = 20000, priority = 'action' } = {}) {
  if (Date.now() - lastRisadaVoiceAt < cooldownMs || isVoiceSpeakingNow) return false;
  lastRisadaVoiceAt = Date.now();
  setOperatorRemark('kkkkk nossa senhora... parabéns viu, mandou muito bem.', {
    priority,
    voiceUrl: '/voices/react_risada.mp3',
    steps: [
      { text: 'kkkkk ', durationMs: 900 },
      { text: 'nossa senhora... ', durationMs: 1400 },
      { text: 'parabéns viu, mandou muito bem.', durationMs: 2650 },
    ],
  });
  return true;
}

function isLogPresentOnScreen() {
  const isStory = document.body?.className?.includes('story-mode-');
  return (
    currentStage === 'awakened_clicker' ||
    currentStage === 'subsolo_2d' ||
    currentStage === 'cave_2d' ||
    currentStage === 'cave_escaped' ||
    isStory
  );
}

function resetIdleChillTimer() {
  if (idleTimeout) clearTimeout(idleTimeout);
  if (idleNudgeTimer) clearTimeout(idleNudgeTimer);
  document.body.classList.remove('cursor-mood-chill');
  if (!isLogPresentOnScreen()) return;

  if (currentStage === 'awakened_clicker' || currentStage === 'subsolo_2d') {
    idleTimeout = setTimeout(() => {
      if (
        (currentStage === 'awakened_clicker' || currentStage === 'subsolo_2d') &&
        !document.body.className.includes('cursor-mood-')
      ) {
        document.body.classList.add('cursor-mood-chill');
      }
    }, 9000);
  }

  // Interação Global de Inatividade com VOZ REAL: se o jogador largar mouse/teclado por ~36s onde o `log` existe!
  idleNudgeTimer = setTimeout(() => {
    if (isOverheatedLocal || document.hidden || isVoiceSpeakingNow) return;
    if (!isLogPresentOnScreen() || !document.getElementById('operator-msg')) return;
    // Não atropela vídeo de introdução da caverna nem modal aberto de prólogo
    if (document.getElementById('cave-intro-vid') || document.getElementById('story-portal-overlay')) return;

    const chosen = pickNextIdleVoiceLine();
    setOperatorRemark(chosen.text, {
      priority: 'ambient',
      voiceUrl: chosen.voiceUrl,
      steps: chosen.steps,
    });

    // Re-arma um próximo cutucão mais espaçado (~55s) caso a pessoa continue moscando parada
    idleNudgeTimer = setTimeout(() => {
      if (isOverheatedLocal || document.hidden || isVoiceSpeakingNow) return;
      if (!isLogPresentOnScreen() || !document.getElementById('operator-msg')) return;
      const nextChosen = pickNextIdleVoiceLine();
      setOperatorRemark(nextChosen.text, {
        priority: 'ambient',
        voiceUrl: nextChosen.voiceUrl,
        steps: nextChosen.steps,
      });
    }, 55000);
  }, 36000);
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

// MOTOR DE VOZ HUMANA DO `log` (ElevenLabs + Estalo de Microfone + Eco Acústico Automático na Caverna!)
let activeVoiceAudio = null;
let isVoiceSpeakingNow = false;

function stopOperatorVoice() {
  if (activeVoiceAudio) {
    try {
      activeVoiceAudio.pause();
      activeVoiceAudio.currentTime = 0;
    } catch {}
    activeVoiceAudio = null;
  }
  isVoiceSpeakingNow = false;
}

function playMicClick() {
  try {
    const ctx = ensureAudio();
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.025), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / 140);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = 0.16;
    src.connect(g);
    g.connect(ctx.destination);
    src.start();
  } catch {}
}

function playOperatorVoiceClip(voiceUrl, { onBlocked = null } = {}) {
  stopOperatorVoice();
  if (!voiceUrl) return null;

  try {
    const ctx = ensureAudio();
    const isStoryMode = document.body?.className?.includes('story-mode-');
    const inCave = currentStage === 'cave_2d' || currentStage === 'cave_escaped' || isStoryMode;

    const audio = new Audio(voiceUrl);
    audio.preload = 'auto';
    activeVoiceAudio = audio;

    // Conecta a voz no WebAudio para aplicar eco cavernoso real quando estiver na Caverna/Contos!
    try {
      const mediaSrc = ctx.createMediaElementSource(audio);
      const dryGain = ctx.createGain();
      dryGain.gain.value = 1.0;
      mediaSrc.connect(dryGain);
      dryGain.connect(ctx.destination);

      if (inCave) {
        const echoSend = ctx.createGain();
        echoSend.gain.value = 0.34;
        mediaSrc.connect(echoSend);
        echoSend.connect(ensureCaveEchoChain(ctx));
      }
    } catch {}

    playMicClick();
    isVoiceSpeakingNow = true;

    audio.addEventListener('ended', () => {
      if (activeVoiceAudio === audio) {
        isVoiceSpeakingNow = false;
        activeVoiceAudio = null;
      }
    });

    audio.play().catch(() => {
      isVoiceSpeakingNow = false;
      if (onBlocked) onBlocked(audio);
    });

    return audio;
  } catch {
    isVoiceSpeakingNow = false;
    return null;
  }
}

function playOperatorTypeKey(ch = 'a') {
  if (ch === ' ' || ch === '\n') return;
  try {
    const ctx = ensureAudio();
    const isStoryMode = document.body?.className?.includes('story-mode-');
    const inCave = currentStage === 'cave_2d' || currentStage === 'cave_escaped' || isStoryMode;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = inCave ? 'sine' : 'triangle';

    // Leve variação de frequência por tecla (fica bem baixinho quando a voz dele está falando no mic!)
    const pitch = (inCave ? 620 : 760) + ((ch.charCodeAt(0) * 19) % 220);
    osc.frequency.setValueAtTime(pitch, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(190, ctx.currentTime + 0.028);

    const baseVol = inCave ? 0.075 : 0.05;
    gain.gain.setValueAtTime(isVoiceSpeakingNow ? baseVol * 0.22 : baseVol, ctx.currentTime);
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
      if (!triggerTeimosoVoiceReaction()) {
        const res = await apiPost('/api/behavior', { type: 'sun_poke' });
        if (res?.remark) setOperatorRemark(res.remark);
      }
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

  let postCompleteStubbornClicks = 0;

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

    if (isAwakened && res.allOwned) {
      postCompleteStubbornClicks += 1;
      if (postCompleteStubbornClicks === 6) {
        triggerTeimosoVoiceReaction({ cooldownMs: 12000, priority: 'action' });
        resetIdleChillTimer();
        return;
      }
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
        if (res.stage === 'awakened_clicker') {
          if (res.allOwned) {
            setOperatorRemark('pronto... 100%, botão dourado. acabou o jogo, beleza? tchau.', {
              delayBefore: 220,
              force: true,
              voiceUrl: '/voices/clicker_100pct.mp3',
              steps: [
                { text: 'pronto... ', durationMs: 1650 },
                { text: '100%, botão dourado. ', durationMs: 2100 },
                { text: 'acabou o jogo, beleza? ', durationMs: 1450 },
                { pause: 250 },
                { text: 'tchau.', durationMs: 650 },
              ],
            });
          } else if (res.remark) {
            setOperatorRemark(res.remark, { delayBefore: 250 });
          }
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
// CAP 0.5: BLOQUINHOS DE ENCAIXAR (SECO, SEM COR, SEM 3D, SEM TEXTO — BEM PORCO!)
// ============================================================================
function renderShapeTestScreen() {
  clearTimers();
  currentStage = 'shape_test';
  document.body.className = 'shapes-mode';
  resetFaviconAndTitle('naoclique.net');

  const app = document.getElementById('app');
  app.style.visibility = 'visible';

  app.innerHTML = `
    <div class="shapes-card">
      <div class="wood-board">
        <div class="hole-slot" data-hole="square">
          <svg width="70" height="70" viewBox="0 0 70 70" class="hole-svg">
            <rect x="3" y="3" width="64" height="64" class="hole-outline" />
          </svg>
        </div>
        <div class="hole-slot" data-hole="circle">
          <svg width="70" height="70" viewBox="0 0 70 70" class="hole-svg">
            <circle cx="35" cy="35" r="32" class="hole-outline" />
          </svg>
        </div>
        <div class="hole-slot" data-hole="triangle">
          <svg width="74" height="70" viewBox="0 0 74 70" class="hole-svg">
            <polygon points="37,4 70,66 4,66" class="hole-outline" />
          </svg>
        </div>
      </div>

      <div class="pieces-tray">
        <div class="toy-piece" draggable="true" data-piece="circle">
          <svg width="66" height="66" viewBox="0 0 66 66">
            <circle cx="33" cy="33" r="30" class="piece-fill" />
          </svg>
        </div>
        <div class="toy-piece" draggable="true" data-piece="triangle">
          <svg width="70" height="66" viewBox="0 0 70 66">
            <polygon points="35,4 66,62 4,62" class="piece-fill" />
          </svg>
        </div>
        <div class="toy-piece" draggable="true" data-piece="square">
          <svg width="64" height="64" viewBox="0 0 64 64">
            <rect x="2" y="2" width="60" height="60" class="piece-fill" />
          </svg>
        </div>
      </div>
    </div>
  `;

  let placedCount = 0;
  let draggedPieceType = null;
  let selectedPieceType = null;
  let finished = false;

  const pieces = app.querySelectorAll('.toy-piece');
  const holes = app.querySelectorAll('.hole-slot');

  async function placeMatch(type) {
    if (finished) return;
    const pieceEl = app.querySelector(`.toy-piece[data-piece="${type}"]`);
    const holeEl = app.querySelector(`.hole-slot[data-hole="${type}"]`);
    if (!pieceEl || !holeEl || holeEl.classList.contains('filled')) return;

    pieceEl.classList.add('placed');
    holeEl.classList.add('filled');
    pieces.forEach((el) => el.classList.remove('selected'));
    playCheapBeep();
    placedCount += 1;

    if (placedCount >= 3) {
      finished = true;
      await sleep(420);
      await apiPost('/api/complete-shapes');
      app.innerHTML = '';
      setTimeout(() => {
        renderFakeBrowserCrash({ awakening: false });
      }, 220);
    }
  }

  pieces.forEach((p) => {
    p.addEventListener('dragstart', (e) => {
      draggedPieceType = p.getAttribute('data-piece');
      if (e.dataTransfer) {
        e.dataTransfer.setData('text/plain', draggedPieceType || '');
        e.dataTransfer.effectAllowed = 'move';
      }
    });
    p.addEventListener('click', () => {
      const clickedType = p.getAttribute('data-piece');
      selectedPieceType = selectedPieceType === clickedType ? null : clickedType;
      pieces.forEach((el) => el.classList.toggle('selected', el.getAttribute('data-piece') === selectedPieceType));
    });
  });

  holes.forEach((h) => {
    h.addEventListener('dragover', (e) => e.preventDefault());
    h.addEventListener('drop', (e) => {
      e.preventDefault();
      const holeType = h.getAttribute('data-hole');
      const dropped = draggedPieceType || e.dataTransfer?.getData('text/plain');
      if (dropped && dropped === holeType) {
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
    // Todo Recarregar passa pela barra de carregamento ruim (mouse ainda normal aqui)
    reloadBtn?.addEventListener('click', () => {
      reloadBtn.disabled = true;
      reloadWithSuperliminal({ awake: false });
    });

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
      // Se o step tiver `durationMs` (fala dublada!), calcula o tempo exato por letra pra cravar com o áudio!
      if (step.durationMs) {
        const startT = performance.now();
        const len = Math.max(1, step.text.length);
        for (let idx = 0; idx < step.text.length; idx++) {
          const ch = step.text[idx];
          span.textContent += ch;
          playOperatorTypeKey(ch);
          const targetElapsed = ((idx + 1) / len) * step.durationMs;
          const waitMs = targetElapsed - (performance.now() - startT);
          if (waitMs > 4) await sleep(waitMs);
        }
      } else {
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
  }

  cursor.remove();
}

async function runAwakeningSequence(_totalClicks, _ownedUpgrades, _minutesPlayed, reloadBtn) {
  await sleep(1700);

  const errCode = document.getElementById('err-code');
  const hints = document.getElementById('err-standard-hints');
  const slot = document.getElementById('hijack-slot');
  const detailsPanel = document.getElementById('fake-details-panel');

  if (errCode) errCode.textContent = 'ERR_JA_DEU_PORRA';
  if (hints) hints.style.display = 'none';
  if (detailsPanel) {
    detailsPanel.innerHTML = `<p>fui eu que derrubei essa merda aqui pra ver se vc acorda pra vida.</p>`;
  }

  const box = document.createElement('div');
  box.className = 'hijack-box';
  slot.appendChild(box);

  // Dispara a voz real do Operador sincronizada milimetricamente com os timestamps de 00:00 a 00:26!
  playOperatorVoiceClip('/voices/log_awakening.mp3', {
    onBlocked: (audioEl) => {
      // Caso a pessoa tenha acabado de dar F5 direto na tela de erro sem clique prévio no navegador:
      const unlockOnce = () => {
        ensureAudio();
        audioEl.play().then(() => { isVoiceSpeakingNow = true; }).catch(() => {});
        window.removeEventListener('pointerdown', unlockOnce);
      };
      window.addEventListener('pointerdown', unlockOnce, { once: true });
    },
  });

  // Cravado segundo a segundo com os timestamps reais do log_awakening.mp3 (00:00 -> 00:26.5)!
  await humanTypeSequence(box, [
    { pause: 950 }, // 00:00.0 -> 00:00.95: suspiro no microfone ("ffff...")
    { text: 'mano... deixa eu te perguntar um negócio namoral...', durationMs: 3150 }, // 00:00.95 -> 00:04.10
    { pause: 200 },
    {
      text: '\n\ncê passou esse tempo todo da tua vida apertando a porra de um botão pra comprar pombo treinado e ventilador amarrado no mouse? ',
      durationMs: 7350, // 00:04.30 -> 00:11.65 ("...no mouse?")
    },
    { text: 'kkkkkk', durationMs: 1150 }, // 00:11.65 -> 00:12.80 (risada real dele no áudio!)
    { pause: 250 },
    {
      text: '\n\nbicho, eu botei até bloquinho de encaixar de criança de 2 anos na tua cara pra ver se cê se tocava e ia embora.',
      durationMs: 6350, // 00:13.05 -> 00:19.40
    },
    { pause: 250 },
    {
      text: '\n\nquer saber? faltam só 3 porqueiras nessa lista aí. aperta logo em recarregar, compra o resto e vê se me deixa em paz.',
      durationMs: 6600, // 00:19.65 -> 00:26.25
    },
  ]);

  if (reloadBtn) {
    reloadBtn.disabled = false;
    reloadBtn.classList.add('ready-pulse');
    reloadBtn.addEventListener('click', async () => {
      stopOperatorVoice();
      reloadBtn.disabled = true;
      // "Agora o jogo começa": a mão azul que apareceu no hover do Recarregar fica de vez daqui pra frente
      document.body.classList.add('blue-hand-on');
      const [data] = await Promise.all([
        apiPost('/api/enter-awakened'),
        showSuperliminalLoading({ blueCursor: true }),
      ]);
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
function setOperatorRemark(
  textOrArray,
  { delayBefore = 220, priority = 'action', force = false, voiceUrl = null, steps = null } = {}
) {
  if (!textOrArray) return;
  const effPriority = force ? 'urgent' : priority;
  const items = Array.isArray(textOrArray) ? textOrArray.filter(Boolean) : [textOrArray];
  if (items.length === 0) return;

  if (effPriority === 'ambient') {
    if (isProcessingQueue || remarkQueue.length > 0 || isVoiceSpeakingNow || Date.now() - lastAmbientAt < 8000) {
      return;
    }
    lastAmbientAt = Date.now();
  }

  if (effPriority === 'urgent') {
    remarkQueue.length = 0;
    remarkTypingId += 1; // Cancela imediatamente a digitação atual pra dar lugar à urgência!
    if (voiceUrl) stopOperatorVoice();
    isProcessingQueue = false;
  } else if (effPriority === 'action') {
    while (remarkQueue.length >= 2) {
      remarkQueue.shift();
    }
  }

  items.forEach((txt, idx) => {
    remarkQueue.push({
      text: txt,
      voiceUrl: idx === 0 ? voiceUrl : null,
      steps: idx === 0 ? steps : null,
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

    if (current.voiceUrl) {
      playOperatorVoiceClip(current.voiceUrl);
    }

    const span = document.createElement('span');
    el.insertBefore(span, cursor);

    if (Array.isArray(current.steps) && current.steps.length > 0) {
      for (const st of current.steps) {
        if (myId !== remarkTypingId) return;
        if (st.pause) {
          await sleep(st.pause);
        } else if (st.text) {
          const startT = performance.now();
          const len = Math.max(1, st.text.length);
          const dur = st.durationMs || len * 36;
          for (let idx = 0; idx < st.text.length; idx++) {
            if (myId !== remarkTypingId) return;
            const ch = st.text[idx];
            span.textContent += ch;
            playOperatorTypeKey(ch);
            const targetElapsed = ((idx + 1) / len) * dur;
            const waitMs = targetElapsed - (performance.now() - startT);
            if (waitMs > 4) await sleep(waitMs);
          }
        }
      }
    } else {
      for (const ch of current.text) {
        if (myId !== remarkTypingId) return;
        span.textContent += ch;
        playOperatorTypeKey(ch);
        // Se chegou outra ação do jogador na fila, acelera levemente o fim desta frase pra ficar ágil!
        const speedMul = remarkQueue.length > 0 ? 0.55 : 1;
        await sleep((18 + Math.random() * 20) * speedMul);
      }
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
// MOTOR DE JOGO VIVO (regra .agents/rules/living-world-standard.md)
// Cliques no vazio, aba do navegador mutante, troca de aba, F12, Ctrl+A e botão direito
// em TODOS os capítulos. Antes dele acordar: só reações mudas/sutis (ninguém sabe que tem alguém olhando).
// Depois: falas do `log` vindas de /api/behavior + voz real quando existir clipe.
// ============================================================================
function getStageHint() {
  return document.body?.className || '';
}

// Chave do capítulo onde o `log` está presente (null = ele ainda não existe pro jogador)
function getLivingStageKey() {
  if (getStageHint().includes('story-mode-')) return 'story';
  if (currentStage === 'cave_2d') return 'cave';
  if (currentStage === 'cave_escaped') return 'escaped';
  if (currentStage === 'subsolo_2d') return 'subsolo';
  if (currentStage === 'awakened_clicker') return 'clicker';
  return null;
}

// Capítulos mudos (antes do despertar): a porta (botão/forminhas/erro) e o clicker burocrático
function getMuteStageKey() {
  if (currentStage === 'mundane_clicker') return 'mute_clicker';
  if (['button', 'crashed', 'shape_test'].includes(currentStage)) return 'mute_door';
  return null;
}

// Títulos que a aba "respira" sozinha com o tempo (em minúsculas, voz dele; o clicker mudo é burocrático)
const LIVING_TAB_LINES = {
  mute_clicker: ['(1) Painel v1.0', 'Painel v1.0 (Não Respondendo)', 'Painel v1.0 — sincronizando...', 'Painel v1.0 — 1 nova conquista'],
  clicker: ['vc ainda tá aqui?', 'fecha a aba', 'eu tô vendo vc', '16 upgrades de nada', 'clica não'],
  subsolo: ['cof cof', 'tá escuro aí?', 'fumaça...', 'não mexe em nada'],
  cave: ['tem alguém mais aqui', 'eco... eco...', 'quem fez essa mina?', 'não olha pros olhos'],
  story: ['que lugar é esse', '...', 'quem escreveu isso?', 'lê logo isso'],
  escaped: ['saímos?', 'ainda não acabou'],
};

// Título enquanto o jogador está em OUTRA aba
const HIDDEN_TAB_LINES = {
  mute_clicker: '(1) Painel v1.0 — sentimos sua falta',
  clicker: 'foi pedir arrego pro google né',
  subsolo: 'cadê vc?',
  cave: 'volta pra caverna',
  story: 'pesquisando a resposta né?',
  escaped: 'não some agora',
};

let tabFlashTimer = null;
let tabFlashBase = null;

function flashTabTitle(text, ms = 3200) {
  if (!text) return;
  if (tabFlashTimer) clearTimeout(tabFlashTimer);
  else tabFlashBase = document.title;
  document.title = text;
  tabFlashTimer = setTimeout(() => {
    // Só restaura se nenhuma tela nova trocou o título no meio do caminho
    if (document.title === text && tabFlashBase) document.title = tabFlashBase;
    tabFlashTimer = null;
    tabFlashBase = null;
  }, ms);
}

function cancelTabFlash() {
  if (!tabFlashTimer) return;
  clearTimeout(tabFlashTimer);
  if (tabFlashBase) document.title = tabFlashBase;
  tabFlashTimer = null;
  tabFlashBase = null;
}

// Voz real como alternativa à fala em texto (cooldown próprio de cada clipe)
const BEHAVIOR_VOICE = {
  wild_click: () => triggerTeimosoVoiceReaction(),
  context_menu: () => triggerTeimosoVoiceReaction(),
  select_all: () => triggerRisadaVoiceReaction(),
};

let lastBehaviorRemarkAt = 0;
async function sendBehaviorRemark(type, { force = false } = {}) {
  if (!force && Date.now() - lastBehaviorRemarkAt < 6000) return;
  lastBehaviorRemarkAt = Date.now();
  const res = await apiPost('/api/behavior', { type, stageHint: getStageHint() });
  if (!res?.remark || !getLivingStageKey() || isOverheatedLocal) return;
  // Na 2ª, 4ª... vez prefere a voz gravada (quando o clipe não estiver em cooldown)
  if (res.count % 2 === 0 && BEHAVIOR_VOICE[type]?.()) return;
  const inStory = getStageHint().includes('story-mode-');
  // Dentro dos contos espera o narrador local respirar antes de meter o bedelho
  setOperatorRemark(res.remark, { priority: 'action', delayBefore: inStory ? 650 : 220 });
}

// Tudo que é clicável de verdade (não conta como "clique no vazio")
const INTERACTIVE_SELECTOR = [
  'button', 'a', 'input', 'textarea', 'select', 'label', 'summary', 'canvas', 'video', 'audio',
  '[role="button"]', '[tabindex]', '[draggable="true"]', '[contenteditable]',
  '[data-obj-id]', '[data-inv-id]', '[data-pick-item]', '[data-goto]', '[data-dev]', '[data-book-pick]',
  '.box-button', '.shop-item', '.temp-hitbox', '.derpy-sun', '.screen-fly', '.mystery-box-floater',
  '.survey-popup', '.dev-panel', '.cave-obj-btn', '.annoying-cookie-bar', '.terms-modal', '.sl-loading', '.lb-overlay',
  '.hijack-box', '.operator-feed',
].join(', ');

// "Vazio" = fundo, parede, moldura: o alvo é o body/#app, um tile vazio da caverna,
// ou um elemento grande (>= 18% da tela) que não é clicável. Elemento pequeno sem id pode ser hotspot de conto.
function isBlankClickTarget(t) {
  if (!t || !t.closest) return false;
  if (t.closest(INTERACTIVE_SELECTOR)) return false;
  if (t === document.body || t === document.documentElement || t.id === 'app') return true;
  if (t.matches('.cave-tile:not([data-obj-slot]), .cave-segment')) return true;
  const r = t.getBoundingClientRect();
  return (r.width * r.height) / Math.max(1, window.innerWidth * window.innerHeight) >= 0.18;
}

let blankClicks = [];
let lastWildAt = 0;
let muteWildCount = 0;

function triggerWildClickReaction() {
  lastWildAt = Date.now();
  blankClicks = [];
  const key = getLivingStageKey();

  if (!key) {
    // Antes dele acordar: só um arrepio mudo (o clicker burocrático ainda dá "conquista" besta)
    muteWildCount += 1;
    if (getMuteStageKey() === 'mute_clicker') {
      showUselessAchievement(`🏅 Conquista: Clicou no Nada (Nível ${muteWildCount})`);
    } else {
      flashTabTitle('...', 1100);
    }
    return;
  }

  flashCursorMood('stop', 2200);
  const tabs = { clicker: 'para de clicar no nada', subsolo: 'que barulho é esse', cave: 'é só pedra', story: 'não tem nada aí', escaped: '?' };
  flashTabTitle(tabs[key] || 'para', 3500);
  sendBehaviorRemark('wild_click', { force: true });
}

function setupPsychologicalTraps() {
  let lastMoveResetAt = 0;
  let hiddenBaseTitle = null;

  document.addEventListener('visibilitychange', () => {
    const key = getLivingStageKey() || (getMuteStageKey() === 'mute_clicker' ? 'mute_clicker' : null);
    if (!document.hidden) resetIdleChillTimer();
    if (!key) return;

    if (document.hidden) {
      cancelTabFlash();
      hiddenBaseTitle = document.title;
      document.title = HIDDEN_TAB_LINES[key];
      return;
    }

    if (hiddenBaseTitle && document.title === HIDDEN_TAB_LINES[key]) document.title = hiddenBaseTitle;
    hiddenBaseTitle = null;
    if (key === 'mute_clicker') {
      showUselessAchievement('🏅 Conquista: Voltou para a Aba Certa');
      return;
    }
    sendBehaviorRemark('tab_return', { force: true });
  });

  document.addEventListener('keydown', (e) => {
    resetIdleChillTimer();
    const k = (e.key || '').toLowerCase();
    const mod = e.ctrlKey || e.metaKey;
    const inField = e.target?.closest?.('input, textarea, [contenteditable]');
    const devtools = k === 'f12' || (mod && e.shiftKey && ['i', 'j', 'c'].includes(k)) || (mod && k === 'u');
    const selectAll = mod && k === 'a' && !inField;
    if (!devtools && !selectAll) return;

    if (!getLivingStageKey()) {
      if (getMuteStageKey() === 'mute_clicker') {
        showUselessAchievement(devtools ? '🏅 Conquista: Técnico de Informática' : '🏅 Conquista: Selecionou Tudo');
      }
      return;
    }

    if (devtools) {
      flashCursorMood('point', 2400);
      flashTabTitle('eu vi isso', 3000);
      sendBehaviorRemark('devtools_key', { force: true });
      return;
    }
    flashCursorMood('middle', 2500);
    sendBehaviorRemark('select_all');
  });

  document.addEventListener('pointerdown', (e) => {
    resetIdleChillTimer();
    if (e.button !== 0 || !isBlankClickTarget(e.target)) return;
    const now = Date.now();
    if (now - lastWildAt < 15000) return;
    blankClicks = blankClicks.filter((ts) => now - ts < 6000);
    blankClicks.push(now);
    // Com ele acordado basta metralhar 6x no vazio; antes, só um maníaco de 8 cliques ganha o arrepio
    if (blankClicks.length >= (getLivingStageKey() ? 6 : 8)) triggerWildClickReaction();
  });

  document.addEventListener('contextmenu', () => {
    resetIdleChillTimer();
    if (!getLivingStageKey()) {
      if (getMuteStageKey() === 'mute_clicker') showUselessAchievement('🏅 Conquista: Botão Direito Desbloqueado');
      return;
    }
    flashCursorMood('middle', 2500);
    sendBehaviorRemark('context_menu');
  });

  document.addEventListener('mousemove', () => {
    const now = Date.now();
    if (document.body.classList.contains('cursor-mood-chill') || now - lastMoveResetAt > 2500) {
      lastMoveResetAt = now;
      resetIdleChillTimer();
    }
  });

  // A aba "respira" sozinha com o tempo em todo capítulo (mudo ou com ele), quanto mais tempo, mais vezes
  const bootAt = Date.now();
  setInterval(() => {
    const key = getLivingStageKey() || (getMuteStageKey() === 'mute_clicker' ? 'mute_clicker' : null);
    if (!key || document.hidden || tabFlashTimer || isOverheatedLocal) return;
    const minutes = (Date.now() - bootAt) / 60000;
    const chance = Math.min(0.55, 0.18 + minutes * 0.03);
    if (Math.random() > chance) return;
    const lines = LIVING_TAB_LINES[key];
    flashTabTitle(lines[Math.floor(Math.random() * lines.length)], 3500);
  }, 25000);
}

// ============================================================================
// TELA DE CARREGAMENTO: SÓ UMA BARRA, BEM RUIM (toda vez que clica em Recarregar!)
// Cada carregamento tem um defeito diferente, mas a barra SEMPRE termina.
// 1º: barra feia normal | 2º: quebra e se conserta | depois: outras anomalias.
// ============================================================================
const LB_BLOCKS = 20;
const LB_ORDER = ['plain', 'crack', 'overflow', 'shuffle', 'regret', 'jitter', 'freeze'];
let lbMemoryCount = 0;

function nextLoadBarVariant() {
  let n = lbMemoryCount;
  try {
    n = Number(localStorage.getItem('nc_loadbar_n') || 0);
    localStorage.setItem('nc_loadbar_n', String(n + 1));
  } catch {
    lbMemoryCount += 1;
  }
  if (n < LB_ORDER.length) return LB_ORDER[n];
  return LB_ORDER[1 + Math.floor(Math.random() * (LB_ORDER.length - 1))];
}

const lbWait = (ms) => new Promise((r) => setTimeout(r, ms));

let slActive = false;
function showSuperliminalLoading({ blueCursor = false, fadeOut = true, variant = null } = {}) {
  return new Promise(async (resolve) => {
    document.getElementById('sl-loading')?.remove();
    slActive = true;
    const kind = variant || nextLoadBarVariant();

    const ov = document.createElement('div');
    ov.id = 'sl-loading';
    ov.className = `lb-overlay lb-${kind} ${blueCursor ? 'sl-blue' : ''}`;
    ov.innerHTML = `<div class="lb-bar" id="lb-bar">${'<i class="lb-block"></i>'.repeat(LB_BLOCKS)}</div>`;
    document.body.appendChild(ov);
    const bar = ov.querySelector('#lb-bar');
    const blocks = [...ov.querySelectorAll('.lb-block')];
    const on = (i) => blocks[i] && blocks[i].classList.add('on');
    const off = (i) => blocks[i] && blocks[i].classList.remove('on');
    const jerk = () => 40 + Math.random() * 160 + (Math.random() < 0.15 ? 380 : 0);

    if (kind === 'plain') {
      for (let i = 0; i < LB_BLOCKS - 1; i++) { on(i); await lbWait(jerk()); }
      await lbWait(900); // trava no 99% como todo carregamento ruim
      on(LB_BLOCKS - 1);
    } else if (kind === 'crack') {
      for (let i = 0; i < 12; i++) { on(i); await lbWait(jerk()); }
      bar.classList.add('lb-broken'); // um pedaço despenca torto
      await lbWait(500);
      for (let i = 12; i < LB_BLOCKS; i++) { on(i); await lbWait(jerk() + 40); }
      await lbWait(350);
      bar.classList.remove('lb-broken');
      bar.classList.add('lb-snap'); // volta no tranco
      await lbWait(260);
    } else if (kind === 'overflow') {
      for (let i = 0; i < LB_BLOCKS; i++) { on(i); await lbWait(jerk() * 0.7); }
      for (let k = 0; k < 6; k++) { // continua carregando pra fora da caixa
        const extra = document.createElement('i');
        extra.className = 'lb-block on lb-extra';
        bar.appendChild(extra);
        await lbWait(120);
      }
      await lbWait(450);
      bar.querySelectorAll('.lb-extra').forEach((e) => e.remove());
    } else if (kind === 'shuffle') {
      const order = [...blocks.keys()].sort(() => Math.random() - 0.5);
      for (const i of order) { on(i); await lbWait(jerk() * 0.8); }
    } else if (kind === 'regret') {
      for (let i = 0; i < 16; i++) { on(i); await lbWait(jerk() * 0.8); }
      await lbWait(400);
      for (let i = 15; i >= 6; i--) { off(i); await lbWait(70); } // desistiu
      await lbWait(500);
      for (let i = 6; i < LB_BLOCKS; i++) { on(i); await lbWait(45); }
    } else if (kind === 'jitter') {
      bar.classList.add('lb-shake');
      for (let i = 0; i < LB_BLOCKS; i++) {
        on(i);
        if (Math.random() < 0.35 && i > 2) { off(i - 2); await lbWait(60); on(i - 2); }
        await lbWait(jerk());
      }
      bar.classList.remove('lb-shake');
    } else { // freeze
      for (let i = 0; i < 7; i++) { on(i); await lbWait(jerk()); }
      await lbWait(1500); // morreu?
      blocks.forEach((_, i) => on(i)); // não, só tava pensando
      await lbWait(150);
    }

    await lbWait(220);
    if (!fadeOut) { resolve(); return; }
    ov.remove();
    slActive = false;
    resolve();
  });
}

// Recarregar de verdade passando pela tela escrota (o overlay fica até a página trocar)
async function reloadWithSuperliminal(opts = {}) {
  if (slActive) return;
  await showSuperliminalLoading({ ...opts, fadeOut: false });
  window.location.reload();
}

// ============================================================================
// CAMINHOS SECRETOS NA URL (naoclique.net/tesla, /basile...) — conteúdo vem 100% do servidor!
// ============================================================================
function escHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

async function renderSecretRoute(path) {
  clearTimers();
  currentStage = 'secret_route';
  document.body.className = 'secret-route-mode';
  setBrokenPageFavicon();
  const app = document.getElementById('app');
  app.style.visibility = 'visible';

  const res = await apiPost('/api/route', { path });
  document.title = res?.tab || '404';
  const feed = res?.remark
    ? `<div class="operator-feed secret-route-feed"><span class="operator-tag">log</span><span id="operator-msg"></span></div>`
    : '';

  if (!res?.found) {
    app.innerHTML = `
      <div class="secret-route-shell">
        ${feed}
        <div class="fake-route-screen">
          <h2>404</h2>
          <p>Não há nada em <strong>${escHtml(path)}</strong>.</p>
          <p><a href="/">Voltar</a></p>
        </div>
      </div>
    `;
    if (res?.remark) setOperatorRemark(res.remark, { delayBefore: 1100, priority: 'urgent' });
    return;
  }

  app.innerHTML = `
    <div class="secret-route-shell">
      ${feed}
      <div class="secret-route-paper secret-kind-${escHtml(res.kind || 'ficha')}">
        <div class="secret-route-hdr">${escHtml(res.title)}</div>
        <div id="secret-lines"></div>
      </div>
      <a href="/" class="secret-route-back">voltar</a>
    </div>
  `;

  const linesEl = document.getElementById('secret-lines');
  const lines = Array.isArray(res.lines) ? res.lines : [];
  (async () => {
    for (const line of lines) {
      await sleep(850);
      if (!linesEl?.isConnected) return;
      const p = document.createElement('p');
      p.className = 'secret-route-line';
      p.textContent = line;
      linesEl.appendChild(p);
    }
  })();

  if (res.remark) setOperatorRemark(res.remark, { delayBefore: 1600 + lines.length * 850, priority: 'urgent' });
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
    setOperatorRemark('QUE QUE CÊ FEZ ANIMAL?! TÁ PEGANDO FOGO EM TUDO, DIGITA subsolo LÁ EM CIMA LOGO!!', {
      delayBefore: 80,
      priority: 'urgent',
      voiceUrl: '/voices/meltdown_fire.mp3',
      steps: [
        { text: 'QUE QUE CÊ FEZ ANIMAL?! ', durationMs: 1450 },
        { pause: 100 },
        { text: 'TÁ PEGANDO FOGO EM TUDO, ', durationMs: 1350 },
        { text: 'DIGITA subsolo LÁ EM CIMA LOGO!!', durationMs: 2050 },
      ],
    });
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

  const appendChat = async (who, text, { voiceUrl = null, steps = null } = {}) => {
    const line = document.createElement('div');
    line.className = `loading-chat-line ${who === 'you' ? 'you' : 'op'}`;
    chatEl.appendChild(line);

    if (who === 'you') {
      line.textContent = `> você: ${text}`;
      chatEl.scrollTop = chatEl.scrollHeight;
      return;
    }

    line.textContent = `[log]: `;
    if (voiceUrl) {
      playOperatorVoiceClip(voiceUrl);
    }

    if (Array.isArray(steps) && steps.length > 0) {
      for (const st of steps) {
        if (st.pause) {
          await sleep(st.pause);
        } else if (st.text) {
          const startT = performance.now();
          const len = Math.max(1, st.text.length);
          const dur = st.durationMs || len * 32;
          for (let idx = 0; idx < st.text.length; idx++) {
            const ch = st.text[idx];
            line.textContent += ch;
            playOperatorTypeKey(ch);
            chatEl.scrollTop = chatEl.scrollHeight;
            const targetElapsed = ((idx + 1) / len) * dur;
            const waitMs = targetElapsed - (performance.now() - startT);
            if (waitMs > 4) await sleep(waitMs);
          }
        }
      }
      return;
    }

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
    await sleep(450);
    if (forcedByOperator || latestState?.forcedSubsolo) {
      await appendChat('op', 'se eu não digito "subsolo" por vc a gente tinha virado carvão né seu lerdo do caralho.');
      await sleep(350);
    }
    await appendChat('op', 'puta que pariu, mano... quem vê um termômetro quieto num canto e taca 99 graus?!', {
      voiceUrl: '/voices/loading_bronca.mp3',
      steps: [
        { text: 'puta que pariu, mano... ', durationMs: 2250 },
        { pause: 200 },
        { text: 'quem vê um termômetro quieto num canto e taca 99 graus?!', durationMs: 3650 },
      ],
    });

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
            if (res.errorType !== 'glare' && triggerRisadaVoiceReaction()) {
              // Tocou a risada irônica dele ao errar a senha!
            } else if (res.remark) {
              setOperatorRemark(res.remark, { priority: 'action' });
            }
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

    let lampPokes = 0;

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
      if (valveOpen) {
        triggerTeimosoVoiceReaction({ cooldownMs: 30000, priority: 'action' });
      }
      return;
    }

    // 2. Clicou na Lâmpada Pendurada no Teto (x=420, y=74) -> Balança suavemente (NÃO quebra!)
    if (Math.hypot(mx - 420, my - 74) <= 36) {
      lampSwingVel = (mx < 420 ? 1 : -1) * 0.16;
      playCheapBeep();
      lampPokes += 1;
      if (lampPokes >= 3) {
        lampPokes = 0;
        triggerTeimosoVoiceReaction({ cooldownMs: 25000, priority: 'action' });
      }
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
  '0': { img: '/cave/apple.gif', altImg: '/cave/apple.gif', name: 'Maçã', details: 'Um lanche estranhamente intacto', hasToggle: true, onLabel: 'Mordida', offLabel: 'Morder', oneShot: true },
  'lantern': { img: '/cave/lantern_off.png', altImg: '/cave/lantern_on.png', name: 'Lanterna', details: 'Liga/desliga a luz na caverna (Tecla F)', hasToggle: true, onLabel: 'Desligar', offLabel: 'Ligar' },
  '2': { img: '/cave/pickInventory.gif', altImg: '/cave/pickInventory.gif', name: 'Picareta', details: 'Firme o bastante pra quebrar rocha', hasToggle: true, onLabel: 'Guardar', offLabel: 'Equipar' },
  '6': { img: '/cave/plankInventory.gif', altImg: '/cave/plankInventory.gif', name: 'Tábua', details: 'Tábua grossa de madeira', hasToggle: true, onLabel: 'Guardar', offLabel: 'Segurar' },
  '8': {
    img: '/cave/note1.gif',
    altImg: '/cave/note1.gif',
    name: 'Nota 1',
    details: 'Pedaço de pergaminho do Cadeado do 3º andar (1º dígito). Clique em Ler para ampliar.',
    noteTitle: 'NOTA 1 DE 3 — O PRIMEIRO DÍGITO DO CADEADO',
    noteBody: 'Para abrir a porta trancada no 3º andar da mina, conte em numerais antigos: cada TRAÇO horizontal vale 5 e cada PONTO vale 1.',
    hasToggle: true,
    onLabel: 'Fechar',
    offLabel: 'Ler',
  },
  '9': {
    img: '/cave/note2.gif',
    altImg: '/cave/note2.gif',
    name: 'Nota 2',
    details: 'Pedaço de pergaminho do Cadeado do 3º andar (2º dígito). Clique em Ler para ampliar.',
    noteTitle: 'NOTA 2 DE 3 — O SEGUNDO DÍGITO DO CADEADO',
    noteBody: 'Segundo símbolo gravado para a porta do 3º andar (lembre-se: traço = 5, ponto = 1).',
    hasToggle: true,
    onLabel: 'Fechar',
    offLabel: 'Ler',
  },
  '10': {
    img: '/cave/note3.gif',
    altImg: '/cave/note3.gif',
    name: 'Nota 3',
    details: 'Pedaço de pergaminho do Cadeado do 3º andar (3º dígito). Clique em Ler para ampliar.',
    noteTitle: 'NOTA 3 DE 3 — O TERCEIRO DÍGITO DO CADEADO',
    noteBody: 'Último símbolo da combinação de 3 dígitos do cadeado dourado no 3º andar.',
    hasToggle: true,
    onLabel: 'Fechar',
    offLabel: 'Ler',
  },
  '12': { img: '/cave/handleInventory.gif', altImg: '/cave/handleInventory.gif', name: 'Manivela', details: 'Encaixa em alguma engrenagem', hasToggle: true, onLabel: 'Soltar', offLabel: 'Girar' },
  '15': { img: '/cave/dynamiteInventory.gif', altImg: '/cave/dynamiteInventory.gif', name: 'Dinamite', details: 'Explosivo antigo', hasToggle: true, onLabel: 'Desarmar', offLabel: 'Armar' },
  '16': { img: '/cave/fusesInventory.gif', altImg: '/cave/fusesInventory.gif', name: 'Estopins', details: 'Pavio para acender dinamite', hasToggle: true, onLabel: 'Apagar', offLabel: 'Preparar' },
  'decoder_lens': { img: '/cave/decoder_lens_base.png', altImg: '/cave/decoder_lens_active.png', name: 'Lupa', details: 'Revela símbolos ocultos', hasToggle: true, onLabel: 'Desativar', offLabel: 'Ativar' },
  'cassette': { img: '/cave/cassette_base.png', altImg: '/cave/cassette_unspooled.png', name: 'Fita K7', details: 'Gravação antiga empoeirada', hasToggle: true, onLabel: 'Parar', offLabel: 'Tocar' },
  'shelf_key': { img: '/cave/shelf_key_base.png', altImg: '/cave/shelf_key_active.png', name: 'Chave Mestra', details: 'Chave antiga da estante', hasToggle: true, onLabel: 'Polida', offLabel: 'Limpar', oneShot: true },
  'book_1': { img: '/cave/book_1_closed.png', altImg: '/cave/book_1_open.png', name: 'Livro I', details: 'Conto 1: Fronteira da Burocracia', hasToggle: true, onLabel: 'Fechar', offLabel: 'Abrir' },
  'book_2': { img: '/cave/book_2_closed.png', altImg: '/cave/book_2_open.png', name: 'Livro II', details: 'Conto 2: Princesa de Plástico', hasToggle: true, onLabel: 'Fechar', offLabel: 'Abrir' },
  'book_3': { img: '/cave/book_3_closed.png', altImg: '/cave/book_3_open.png', name: 'Livro III', details: 'Conto 3: Corredor 0999 P.T.', hasToggle: true, onLabel: 'Fechar', offLabel: 'Abrir' },
  'book_4': { img: '/cave/book_4_closed.png', altImg: '/cave/book_4_open.png', name: 'Livro IV', details: 'Conto 4: Naufrágio da Porta', hasToggle: true, onLabel: 'Fechar', offLabel: 'Abrir' },
  'book_5': { img: '/cave/book_5_closed.png', altImg: '/cave/book_5_open.png', name: 'Livro V', details: 'Conto 5: Plantão da Floresta', hasToggle: true, onLabel: 'Fechar', offLabel: 'Abrir' },
  'book_6': { img: '/cave/book_6_closed.png', altImg: '/cave/book_6_open.png', name: 'Livro VI', details: 'Conto 6: Terminal 1984', hasToggle: true, onLabel: 'Fechar', offLabel: 'Abrir' },
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
  { id: 'lantern', row: 1, col: 3, tile: 14, img: '/cave/lantern_off.png', kind: 'pickup', hideOnPick: true, msg: 'Você pegou uma Lanterna! A visão na caverna melhorou muito.', ev: 'got_lantern' },
  { id: '1', row: 1, col: 4, tile: 15, img: '/cave/creepyCorridor-24.png', kind: 'junk', msg: 'Nada útil nessa caixa.' },
  { id: 'story_1', row: 1, col: 6, tile: 14, img: '/cave/book_1_closed.png', kind: 'story_portal', storyId: '1', reqBook: null, msg: 'Livro I: Fronteira da Burocracia' },
  { id: '8', row: 1, col: 4, tile: 13, img: '/cave/creepyCorridor-_094.png', kind: 'pickup', msg: 'Achou a Nota 1/3 (Cadeado da Mina)! Veja na mochila.', ev: 'got_note' },
  { id: '3', row: 1, col: 7, tile: 15, img: '/cave/creepyCorridor-_062.png', kind: 'boulder', need: '2', blockMsg: 'Preciso de uma ferramenta pra quebrar essa rocha.', okMsg: 'Boa! Pedra destruída!', ev: 'broke_boulder' },
  { id: '4', row: 1, col: 8, tile: 15, img: '/cave/creepyCorridor-_166.png', kind: 'plunger', msg: 'Apertei o detonador... algo explodiu lá embaixo!', ev: 'armed_plunger' },
  { id: '9', row: 1, col: 10, tile: 13, img: '/cave/creepyCorridor-24.png', kind: 'pickup', msg: 'Outra nota estranha! (Na mochila)', ev: 'got_note' },
  { id: '21', row: 1, col: 12, tile: 13, img: '/cave/creepyCorridor-25.png', kind: 'junk', msg: 'Só tranqueira velha.' },
  { id: '2', row: 1, col: 12, tile: 14, img: '/cave/creepyCorridor-_035.png', kind: 'pickup', hideOnPick: true, msg: 'Uma picareta! Vai quebrar um galho.', ev: 'got_pickaxe' },

  { id: 'story_2', row: 2, col: 3, tile: 15, img: '/cave/book_2_closed.png', kind: 'story_portal', storyId: '2', reqBook: 'book_1', msg: 'Livro II: Castelo da Princesa de Plástico' },
  { id: '6', row: 2, col: 6, tile: 15, img: '/cave/creepyCorridor-_094.png', kind: 'pickup', msg: 'Uma tábua firme de madeira.', ev: 'got_plank' },
  { id: '18', row: 2, col: 7, tile: 15, img: '/cave/creepyCorridor-24.png', kind: 'junk', msg: 'Vazia.' },
  { id: 'story_3', row: 2, col: 9, tile: 15, img: '/cave/book_3_closed.png', kind: 'story_portal', storyId: '3', reqBook: 'book_2', msg: 'Livro III: Corredor 0999 (P.T.)' },
  { id: '17', row: 2, col: 12, tile: 15, img: '/cave/creepyCorridor-_168.png', kind: 'final_shelf', msg: 'Estante Final dos 6 Livros' },

  { id: '12', row: 3, col: 2, tile: 13, img: '/cave/creepyCorridor-_094.png', kind: 'pickup', msg: 'Uma manivela de engrenagem!', ev: 'got_handle' },
  { id: '11', row: 3, col: 4, tile: 13, img: '/cave/doorLocked.png', unlockedImg: '/cave/doorUnlocked.png', specialClass: 'special-door', kind: 'padlock_door', msg: 'Porta trancada com cadeado de 3 dígitos.' },
  { id: '7', row: 3, col: 5, tile: 13, img: '/cave/creepyCorridor-_169.png', clearedImg: '/cave/creepyCorridor-_170.png', kind: 'gap', need: '6', blockMsg: 'Fenda funda demais pra pular sem uma tábua.', okMsg: 'Tábua encaixada!', ev: 'placed_plank' },
  { id: '10', row: 3, col: 5, tile: 14, img: '/cave/creepyCorridor-24.png', kind: 'pickup', msg: 'Terceira nota misteriosa! (Na mochila)', ev: 'got_note' },
  { id: '5', row: 3, col: 7, tile: 13, img: '/cave/beam.gif', specialClass: 'special-beam', kind: 'beam', blockMsg: 'Algum explosivo à distância deve derrubar essa barreira.' },
  { id: 'story_4', row: 3, col: 8, tile: 15, img: '/cave/book_4_closed.png', kind: 'story_portal', storyId: '4', reqBook: 'book_3', msg: 'Livro IV: Naufrágio da Porta Gigante' },

  { id: 'story_5', row: 4, col: 8, tile: 13, img: '/cave/book_5_closed.png', kind: 'story_portal', storyId: '5', reqBook: 'book_4', msg: 'Livro V: Plantão da Floresta' },
  { id: '13', row: 4, col: 10, tile: 13, img: '/cave/creepyCorridor-_148.png', kind: 'cog', need: '12', blockMsg: 'Falta uma manivela pra girar esse registro.', okMsg: 'Fechou a queda d\'água!', ev: 'stopped_water' },
  { id: '14', row: 4, col: 11, tile: 13, img: '/cave/waterOn.gif', clearedImg: '/cave/waterOff.gif', specialClass: 'special-water', kind: 'waterfall', blockMsg: 'Cachoeira forte demais pra atravessar!' },
  { id: 'story_6', row: 4, col: 12, tile: 15, img: '/cave/book_6_closed.png', kind: 'story_portal', storyId: '6', reqBook: 'book_5', msg: 'Livro VI: Terminal 1984' },
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
          const isSmallItem = obj.id === 'lantern' || obj.kind === 'story_portal';
          tilesHtml += `
            <div class="cave-tile ${obj.specialClass || ''}" data-obj-slot="${obj.id}">
              <div class="cave-obj-btn ${isSmallItem ? 'cave-obj-small' : ''}" data-obj-id="${obj.id}">
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
  let lanternOn = state.inventory.includes('lantern');
  let activeOpenBookId = null;
  const itemVariations = {}; // rastreia variação ativa de cada item (ex: mordida, aberta, armada, etc.)

  let bubbleTimeout = null;
  function showSegmentBubble(r, c, text) {
    document.querySelectorAll('.cave-bubble').forEach((b) => b.remove());
    if (bubbleTimeout) clearTimeout(bubbleTimeout);
    const seg = document.querySelector(`.cave-segment[data-seg="${r}-${c}"]`);
    if (!seg) return;
    const b = document.createElement('div');
    b.className = 'cave-bubble';
    b.textContent = text;
    seg.appendChild(b);
    bubbleTimeout = setTimeout(() => b.remove(), 4200);
  }

  function openCaveNoteModal(noteId) {
    const meta = CAVE_INVENTORY_META[noteId];
    if (!meta) return;
    document.getElementById('cave-note-modal')?.remove();

    itemVariations[noteId] = true;
    refreshInventoryUI();

    const modal = document.createElement('div');
    modal.id = 'cave-note-modal';
    modal.className = 'cave-note-modal';
    modal.innerHTML = `
      <div class="cave-note-paper">
        <div style="font-family:monospace; font-size:11px; font-weight:bold; color:#78350f; letter-spacing:1px;">PERGAMINHO DA MINA</div>
        <h3 style="margin:6px 0 8px; font-size:17px;">${meta.noteTitle || meta.name}</h3>
        <img src="${meta.img}" alt="${meta.name}" />
        <p style="font-size:14px; line-height:1.55; margin:10px 0 18px;">${meta.noteBody || meta.details}</p>
        <button type="button" id="cave-note-close" style="background:#451a03; color:#fef3c7; border:2px solid #78350f; padding:9px 20px; border-radius:6px; font-family:monospace; font-weight:bold; cursor:pointer;">Guardar Nota na Mochila</button>
      </div>
    `;
    document.body.appendChild(modal);

    const closeNote = () => {
      modal.remove();
      itemVariations[noteId] = false;
      refreshInventoryUI();
    };
    document.getElementById('cave-note-close')?.addEventListener('click', closeNote);
    modal.addEventListener('click', (ev) => {
      if (ev.target === modal) closeNote();
    });
  }

  function openBookFromBag(bookId) {
    activeOpenBookId = bookId;
    refreshInventoryUI();
    const storyNum = bookId.replace('book_', '');
      openBookReaderModal(bookId, state, {
      apiPost,
      setOperatorRemark,
      triggerRisadaVoiceReaction,
      onSolved: (newCaveState) => {
        activeOpenBookId = null;
        if (newCaveState) {
          state.booksSolved = [...(newCaveState.booksSolved || [])];
          state.booksOwned = [...(newCaveState.booksOwned || [])];
        }
        refreshInventoryUI();
        refreshObjectsVisuals();
      },
      onReplay: () => {
        activeOpenBookId = null;
        launchStory(storyNum, {
          clearTimers,
          apiPost,
          setOperatorRemark,
          triggerRisadaVoiceReaction,
          triggerTeimosoVoiceReaction,
          resetIdleChillTimer,
          playBeep: playCheapBeep,
          caveState: state,
          returnToCave: (updatedCave, extra = {}) => {
            renderCaveChapterScreen(updatedCave, extra);
          },
        });
      },
    });
    // Quando fechar o modal manualmente pelo botão, restaura o ícone fechado do livro
    document.getElementById('book-modal-close')?.addEventListener('click', () => {
      activeOpenBookId = null;
      refreshInventoryUI();
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
        const isLantern = id === 'lantern';
        const isActive = isLantern ? lanternOn : (isBook ? activeOpenBookId === id : Boolean(itemVariations[id]));
        const iconSrc = isActive && m.altImg ? m.altImg : m.img;

        let actionBtnHtml = '';
        if (m.hasToggle) {
          const btnLabel = isActive ? m.onLabel : m.offLabel;
          actionBtnHtml = `<button type="button" class="inv-toggle-btn ${isActive ? 'active' : ''}" data-inv-toggle="${id}" ${
            m.oneShot && isActive ? 'disabled' : ''
          }>${btnLabel}</button>`;
        }

        return `
          <div class="cave-inv-item ${isBook ? 'cave-inv-book' : ''}" data-inv-id="${id}">
            <img src="${iconSrc}" alt="${m.name}" style="${isActive && id === '0' ? 'opacity:0.65; filter:grayscale(0.5);' : ''}" />
            <div style="margin-top:4px;">${isBook ? (solved ? `✅ ${m.name}` : `📖 ${m.name}`) : m.name}</div>
            ${actionBtnHtml}
            <div class="inv-tooltip"><strong>${m.name}</strong><br/>${m.details}</div>
          </div>
        `;
      })
      .join('');

    grid.querySelectorAll('[data-inv-toggle]').forEach((btn) => {
      btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        playCheapBeep();
        const id = btn.getAttribute('data-inv-toggle');
        const meta = CAVE_INVENTORY_META[id];
        if (!meta) return;

        if (id === 'lantern') {
          lanternOn = !lanternOn;
          refreshInventoryUI();
          updateViewportPosition(facingLeft, false);
        } else if (id?.startsWith('book_')) {
          if (activeOpenBookId === id) {
            document.getElementById('book-reader-modal')?.remove();
            activeOpenBookId = null;
            refreshInventoryUI();
          } else {
            openBookFromBag(id);
          }
        } else if (['8', '9', '10'].includes(id)) {
          if (itemVariations[id]) {
            document.getElementById('cave-note-modal')?.remove();
            itemVariations[id] = false;
            refreshInventoryUI();
          } else {
            openCaveNoteModal(id);
          }
        } else {
          itemVariations[id] = !itemVariations[id];
          if (id === '0' && itemVariations[id]) {
            setOperatorRemark('mandou pra dentro uma maçã velha que tava jogada no chão da mina msm?! coragem hein.', { priority: 'action' });
          } else if (id === '15' && itemVariations[id]) {
            setOperatorRemark('cuidado brincando com essa dinamite na mão mano!', { priority: 'action' });
          }
          refreshInventoryUI();
        }
      });
    });

    grid.querySelectorAll('.cave-inv-book').forEach((el) => {
      el.addEventListener('click', () => {
        playCheapBeep();
        openBookFromBag(el.getAttribute('data-inv-id'));
      });
    });

    grid.querySelectorAll('[data-inv-id="8"], [data-inv-id="9"], [data-inv-id="10"]').forEach((el) => {
      el.addEventListener('click', () => {
        playCheapBeep();
        openCaveNoteModal(el.getAttribute('data-inv-id'));
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

    // Antes de pegar (ou ligar) a lanterna: MUITO escuro! Com a lanterna ligada: luz ampla com degradê suave!
    const hasLantern = state.inventory.includes('lantern') && lanternOn;
    const radius = torchLit ? (hasLantern ? 215 : 82) : 34;
    const innerR = Math.round(radius * 0.24);
    const midR = Math.round(radius * 0.62);
    mask.style.background = `radial-gradient(circle ${radius}px at ${charX}px ${charY}px, rgba(255, 200, 110, ${hasLantern ? 0.08 : 0.03}) 0%, rgba(4, 4, 6, ${hasLantern ? 0.22 : 0.45}) ${innerR}px, rgba(0, 0, 0, 0.88) ${midR}px, rgba(0, 0, 0, 1) ${radius}px, rgba(0, 0, 0, 1) 100%)`;

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
        if (!triggerRisadaVoiceReaction()) {
          if (res?.remark) setOperatorRemark(res.remark, { priority: 'action' });
        }
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
        if (obj.id === 'lantern') lanternOn = true;
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
        triggerRisadaVoiceReaction,
        triggerTeimosoVoiceReaction,
        resetIdleChillTimer,
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

    if (k === 'f' && !ev.repeat && state.inventory.includes('lantern')) {
      playCheapBeep();
      lanternOn = !lanternOn;
      refreshInventoryUI();
      updateViewportPosition(facingLeft, false);
      return;
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

  // Sequência de Queda / Acender a Tocha + Vídeo Surpresa "Caverna dos Contos" com som de fadas!
  if (!state.introDone || justFell) {
    torchLit = false;
    updateViewportPosition(false);
    setOperatorRemark('eita porra... onde é que cê se enfiou agora, mano? até minha voz tá dando eco aqui.', {
      delayBefore: 250,
      priority: 'urgent',
      voiceUrl: '/voices/cave_queda.mp3',
      steps: [
        { text: 'eita porra... ', durationMs: 1550 },
        { pause: 150 },
        { text: 'onde é que cê se enfiou agora, mano? ', durationMs: 2150 },
        { pause: 150 },
        { text: 'até minha voz tá dando eco aqui.', durationMs: 2150 },
      ],
    });
    (async () => {
      showSegmentBubble(state.row, state.col, 'O chão do porão desabou...');
      await sleep(3400);
      showSegmentBubble(state.row, state.col, 'Escuro demais aqui embaixo.');
      await sleep(3100);
      torchLit = true;
      updateViewportPosition(false);

      // Dispara do nada o vídeo bonito de título "Caverna dos Contos" com som alto de fadas!
      await new Promise((resolve) => {
        const vidOverlay = document.createElement('div');
        vidOverlay.className = 'cave-intro-video-overlay';
        vidOverlay.innerHTML = `
          <video id="cave-intro-vid" src="/cave/caverna_intro.mp4" playsinline autoplay></video>
          <button type="button" class="cave-intro-skip-btn" id="cave-intro-skip">Pular</button>
        `;
        document.body.appendChild(vidOverlay);
        requestAnimationFrame(() => vidOverlay.classList.add('visible'));

        const vid = document.getElementById('cave-intro-vid');
        if (vid) {
          vid.volume = 1.0;
          vid.play().catch(() => {
            // Se o navegador bloquear autoplay com som, inicia mudo e libera no clique
            vid.muted = true;
            vid.play().catch(() => {});
            const skipBtn = document.getElementById('cave-intro-skip');
            if (skipBtn) skipBtn.textContent = '🔊 Clique para ativar som / Pular';
          });
        }

        setTimeout(() => {
          setOperatorRemark(
            'QUE PORRA DE MUSIQUINHA DE FADA É ESSA?! "CAVERNA DOS CONTOS"?! QUEM ENFIOU ABERTURA DA DISNEY DEBAIXO DO MEU PORÃO?!',
            { priority: 'urgent' }
          );
        }, 900);

        let closed = false;
        const closeIntro = () => {
          if (closed) return;
          closed = true;
          if (vid) vid.pause();
          vidOverlay.classList.remove('visible');
          setTimeout(() => {
            vidOverlay.remove();
            resolve();
          }, 450);
        };

        vid?.addEventListener('ended', closeIntro);
        document.getElementById('cave-intro-skip')?.addEventListener('click', () => {
          if (vid && vid.muted) {
            vid.muted = false;
            vid.play().catch(() => {});
          } else {
            closeIntro();
          }
        });
      });

      state.introDone = true;
      await syncCave('intro_done');
      resetIdleChillTimer();
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
    resetIdleChillTimer();
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
// PAINEL DE TESTES (DEV ONLY) — Árvore por Capítulos, abre direto em qualquer sub-estado.
// Regra living-world-standard #8: TODA página/sub-estado/conto novo entra aqui + ação em /api/_dev/action.
// Tipos de item: ação do servidor (recarrega em "/"), `fx_*` (efeito no cliente), `story_N`, `book_N`, `route_/x`.
// ============================================================================
const DEV_TREE = [
  {
    cap: 'Cap. 1 — A Porta (mudo)',
    items: [
      ['goto_page_1_button', '1.1 Botão 1ª vez (cai no 9º clique)'],
      ['dev_crash_1', '1.2 Erro da 1ª queda (Recarregar → loading)'],
      ['dev_crash_counting', '1.3 Erro "contando no dedinho"'],
      ['goto_page_1_button_2nd', '1.4 Botão 2ª vez (cai no 5º)'],
      ['goto_page_2_shapes', '1.5 Formas secas de encaixar'],
      ['dev_crash_shapes', '1.6 Erro pós-formas (→ clicker)'],
    ],
  },
  {
    cap: 'Cap. 2 — Clicker Mudo',
    items: [
      ['goto_page_3_clicker_start', '2.1 Início 0/16 (mouse normal)'],
      ['goto_page_3_clicker_pre_awake', '2.2 12/16 (próxima compra = Backup)'],
    ],
  },
  {
    cap: 'Cap. 3 — O Despertar',
    items: [
      ['goto_page_4_awakening_error', '3.1 Erro: ele fala (voz + mão azul)'],
      ['goto_page_5_awakened_13', '3.2 Clicker acordado 13/16'],
      ['goto_page_5_clicker_end', '3.3 16/16 (enigma do termômetro)'],
      ['goto_page_5_meltdown', '3.4 Incêndio 99°C (digitar subsolo)'],
    ],
  },
  {
    cap: 'Cap. 4 — Subsolo',
    items: [
      ['goto_page_6_loading', '4.1 Loading Win98 + chat'],
      ['goto_page_7_subsolo', '4.2 Porão 2D (Morse + vapor → 2585)'],
      ['goto_page_7_subsolo_dark', '4.3 Porão com lâmpada estourada'],
    ],
  },
  {
    cap: 'Cap. 5 — Caverna dos Contos',
    items: [
      ['goto_page_8_cave', '5.1 Queda + vídeo de intro'],
      ['cave_ready_0', '5.2 Caverna livre (portal do Livro I)'],
      ['goto_cave_shelf_ready', '5.3 Estante final (6 livros resolvidos)'],
      ['goto_cave_escaped', '5.4 Pós-caverna (fuga)'],
    ],
  },
  {
    cap: 'Contos & Livros',
    items: [1, 2, 3, 4, 5, 6].flatMap((n) => [
      [`story_${n}`, `📖 Conto ${n} — jogar`],
      [`book_${n}`, `🔐 Livro ${n} — enigma da última página`],
    ]),
  },
  {
    cap: 'Rotas secretas (URL)',
    items: [
      ['route_/tesla', '/tesla (ficha do hotel)'],
      ['route_/3327', '/3327 (quarto, pós-subsolo)'],
      ['route_/2585', '/2585 (senha no lugar errado)'],
      ['route_/subsolo', '/subsolo (acesso negado)'],
      ['route_/log', '/log (recusa)'],
      ['route_/basile', '/basile (só pós-caverna)'],
      ['route_/naoclique', '/naoclique'],
      ['route_/qualquercoisa', '/qualquercoisa (404 vivo)'],
    ],
  },
  {
    cap: 'Ferramentas',
    items: [
      ['reset', '🔄 Resetar tudo do zero'],
      ['add_points_big', '💎 +500.000 pts (clicker)'],
      ['spawn_event', '🪰 Evento aleatório (clicker)'],
      ['fx_loading', '▭ Barra de loading (próxima variação)'],
      ['fx_loading_blue', '▭ Barra de loading (mão azul)'],
      ['fx_wild', '🖱️ Simular cliques no vazio'],
      ['fx_tab', '🏷️ Simular troca de aba (volta)'],
    ],
  },
];

function mountDevTestPanel() {
  if (!import.meta.env.DEV) return;
  if (document.getElementById('dev-test-panel')) return;

  const isClickerNow = () => currentStage === 'mundane_clicker' || currentStage === 'awakened_clicker';
  let openCap = '';
  try {
    openCap = localStorage.getItem('dev_open_cap') || '';
  } catch {}

  const panel = document.createElement('div');
  panel.id = 'dev-test-panel';
  panel.className = 'dev-panel';
  panel.innerHTML = `
    <button class="dev-toggle" id="dev-toggle-btn">⚙️ DEV</button>
    <div class="dev-menu" id="dev-menu">
      <div class="dev-menu-title">🗺️ Capítulos do Jogo</div>
      ${DEV_TREE.map(
        (c) => `
        <details class="dev-cap" data-cap="${c.cap}" ${openCap === c.cap ? 'open' : ''}>
          <summary>${c.cap}</summary>
          <div class="dev-cap-items">
            ${c.items.map(([a, l]) => `<button class="dev-btn ${a === 'reset' ? 'danger' : ''}" data-dev="${a}">${l}</button>`).join('')}
          </div>
        </details>`
      ).join('')}
    </div>
  `;
  document.body.appendChild(panel);

  const menu = document.getElementById('dev-menu');
  document.getElementById('dev-toggle-btn')?.addEventListener('click', () => menu?.classList.toggle('open'));

  // Acordeão: abre um capítulo por vez e lembra o último aberto
  panel.querySelectorAll('.dev-cap').forEach((d) => {
    d.addEventListener('toggle', () => {
      if (!d.open) return;
      panel.querySelectorAll('.dev-cap').forEach((o) => {
        if (o !== d) o.open = false;
      });
      try {
        localStorage.setItem('dev_open_cap', d.getAttribute('data-cap'));
      } catch {}
    });
  });

  const storyCtx = (caveState) => ({
    clearTimers,
    apiPost,
    setOperatorRemark,
    triggerRisadaVoiceReaction,
    triggerTeimosoVoiceReaction,
    resetIdleChillTimer,
    playBeep: playCheapBeep,
    caveState,
    returnToCave: (updatedCave, extra = {}) => renderCaveChapterScreen(updatedCave, extra),
  });

  // Telas de erro são desenhadas pelo front: grava o estágio no servidor e desenha sem recarregar
  const crashActions = {
    dev_crash_1: ['goto_crash_1', { crashClickCount: 9 }],
    dev_crash_counting: ['goto_crash_1', { crashClickCount: 9, caughtCounting: true }],
    dev_crash_shapes: ['goto_shapes_crash', { crashClickCount: 5 }],
  };

  panel.querySelectorAll('[data-dev]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const action = btn.getAttribute('data-dev');
      menu?.classList.remove('open');

      if (action.startsWith('route_')) {
        window.location.href = action.slice(6);
        return;
      }
      if (crashActions[action]) {
        const [srvAction, opts] = crashActions[action];
        await apiPost('/api/_dev/action', { action: srvAction });
        if (window.location.pathname !== '/') window.history.replaceState(null, '', '/');
        renderFakeBrowserCrash({ awakening: false, ...opts });
        return;
      }
      if (action.startsWith('story_')) {
        const n = Number(action.split('_')[1]);
        const st = await apiPost('/api/_dev/action', { action: 'goto_page_8_cave_ready', upToBook: n - 1 });
        if (window.location.pathname !== '/') window.history.replaceState(null, '', '/');
        currentStage = 'cave_2d';
        launchStory(String(n), storyCtx(st?.caveState));
        return;
      }
      if (action.startsWith('book_')) {
        const n = Number(action.split('_')[1]);
        const st = await apiPost('/api/_dev/action', { action: 'goto_page_8_cave_ready', upToBook: n - 1, giveBook: true });
        if (window.location.pathname !== '/') window.history.replaceState(null, '', '/');
        renderCaveChapterScreen(st?.caveState, { justEarnedBook: `book_${n}` });
        return;
      }
      if (action === 'cave_ready_0') {
        await apiPost('/api/_dev/action', { action: 'goto_page_8_cave_ready', upToBook: 0 });
        window.location.href = '/';
        return;
      }
      if (action === 'fx_loading' || action === 'fx_loading_blue') {
        const blue = action === 'fx_loading_blue';
        showSuperliminalLoading({ blueCursor: blue });
        return;
      }
      if (action === 'fx_wild') {
        lastWildAt = 0;
        triggerWildClickReaction();
        return;
      }
      if (action === 'fx_tab') {
        lastBehaviorRemarkAt = 0;
        if (getLivingStageKey()) sendBehaviorRemark('tab_return', { force: true });
        else if (getMuteStageKey() === 'mute_clicker') showUselessAchievement('🏅 Conquista: Voltou para a Aba Certa');
        return;
      }
      if (action === 'spawn_event') {
        if (isClickerNow()) spawnRandomScreenEvent();
        return;
      }
      if (action === 'add_points_big') {
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

  // Caminhos na URL (naoclique.net/tesla...) viram rotas secretas respondidas pelo servidor
  const path = window.location.pathname;
  if (path !== '/' && path !== '/index.html') {
    renderSecretRoute(decodeURIComponent(path).slice(0, 80));
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
