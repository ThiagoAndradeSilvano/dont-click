const TOKEN_KEY = '_sys_ref';
let currentStage = 'button';
let currentUpgrades = [];
let passiveInterval = null;
let audioCtx = null;

// Mensagem no F12 (Console) esperando pelos "hackers" curiosos
console.log(
  '%cPARADO AÍ, SHERLOCK HOLMES DO F12.',
  'color: #ff4444; font-size: 18px; font-weight: bold; background: #111; padding: 6px 10px;'
);
console.log(
  '%cAchou mesmo que eu ia deixar uma senha comentada tipo <!-- resposta: 1234 --> no HTML? Fecha essa aba Elements e vai usar os neurônios.',
  'color: #cccccc; font-size: 12px;'
);

function getClientMeta() {
  let localToken = null;
  try {
    localToken = localStorage.getItem(TOKEN_KEY);
  } catch {
    // Ignora
  }

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
  } catch {
    // Ignora
  }
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
  } catch {
    // Silencioso
  }
  return null;
}

// Som mecânico seco via Web Audio API (para o upgrade "Barulhinho Satisfatório")
function playClickSound() {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, audioCtx.currentTime + 0.045);

    gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.045);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
  } catch {
    // Ignora se bloqueado
  }
}

// Partículas fuleiras para o upgrade "Confete de Validação Emocional"
function spawnEgoParticles(x, y) {
  const colors = ['#e63946', '#ffb703', '#2a9d8f', '#4361ee', '#9b5de5'];
  for (let i = 0; i < 10; i++) {
    const el = document.createElement('div');
    el.className = 'ego-particle';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.backgroundColor = colors[i % colors.length];
    document.body.appendChild(el);

    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4.5;
    let vx = Math.cos(angle) * speed;
    let vy = Math.sin(angle) * speed - 3;
    let px = x;
    let py = y;
    let life = 0;

    const tick = () => {
      life += 1;
      px += vx;
      py += vy;
      vy += 0.28; // gravidade 2D
      el.style.left = `${px}px`;
      el.style.top = `${py}px`;
      el.style.opacity = String(Math.max(0, 1 - life / 32));
      if (life < 32) {
        requestAnimationFrame(tick);
      } else {
        el.remove();
      }
    };
    requestAnimationFrame(tick);
  }
}

// Números flutuantes (+1, ou +2 seguido de -1 imposto!)
function spawnFloatingNumber(x, y, text, type = 'gain') {
  const el = document.createElement('div');
  el.className = `float-num ${type}`;
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 900);
}

function setBrokenPageFavicon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
      <path fill="#9AA0A6" d="M3 1h6.5L13 4.5V15H3V1zm6 1.5V5h2.5L9 2.5z"/>
      <path fill="#fff" d="M5.5 7.5h1.5v1.5H5.5zm3.5 0h1.5v1.5H9zm-3 4h4v1H6z"/>
    </svg>
  `.trim();

  const link = document.getElementById('dynamic-favicon');
  if (link) {
    link.href = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
  }
}

function resetFaviconAndTitle(title = 'Início') {
  document.title = title;
  const link = document.getElementById('dynamic-favicon');
  if (link) {
    link.href = 'data:,';
  }
}

// ===== ESTÁGIO 1: Tela do Botão Seco =====
function renderInitialButtonScreen(buttonLabel = 'Botão') {
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
    <div class="ctrl-a-bait">Sério? Selecionando a tela toda pra procurar texto branco escondido? Estamos em 2008 por acaso?</div>
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
          renderFakeBrowserCrash({ intercepted: false });
        }, 180);
      }, 140);
    }
  });
}

// ===== TELA DE ERRO DO NAVEGADOR (Normal ou Invadida no 2º Reload!) =====
function renderFakeBrowserCrash({ intercepted = false, totalClicks = 14 } = {}) {
  currentStage = intercepted ? 'intercepted_error' : 'crashed';
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

  if (isFirefox && !intercepted) {
    document.body.className = 'firefox-error-mode';
    app.innerHTML = `
      <div class="ff-wrapper">
        <h1 class="ff-title">A conexão foi reiniciada</h1>
        <p class="ff-desc">A conexão com o servidor foi redefinida durante o carregamento da página.</p>
        <ul class="neterror-list">
          <li>O site pode estar temporariamente indisponível ou sobrecarregado. Tente de novo em alguns instantes.</li>
          <li>Se você não consegue carregar nenhuma página, verifique a conexão de rede do computador.</li>
        </ul>
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
        <h1 class="neterror-title" id="err-title">${titleText}</h1>
        <p class="neterror-desc" id="err-desc">A conexão com <strong>${host}</strong> foi redefinida.</p>
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
          <button class="neterror-btn-reload" id="fake-reload-btn" ${intercepted ? 'disabled' : ''}>Recarregar</button>
          <button class="neterror-btn-details" id="fake-details-btn">Detalhes</button>
        </div>
        <div class="neterror-details-panel" id="fake-details-panel">
          <p><strong>Verifique sua conexão com a Internet</strong><br/>Verifique os cabos e reinicie todos os roteadores, modems ou outros dispositivos de rede que você estiver usando.</p>
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

  if (!intercepted) {
    // Quedas 1 e 2: clicar em Recarregar recarrega a página de verdade
    reloadBtn?.addEventListener('click', () => {
      window.location.reload();
    });
    return;
  }

  // ===== CENA DE INVASÃO NA TELA DE ERRO (Após o 2º Reload!) =====
  runHijackSequence(totalClicks, reloadBtn);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function typeText(container, text, speed = 26) {
  const span = document.createElement('span');
  const cursor = document.createElement('span');
  cursor.className = 'typing-cursor';
  container.appendChild(span);
  container.appendChild(cursor);

  for (let i = 0; i < text.length; i++) {
    span.textContent += text[i];
    const ch = text[i];
    const delay = ch === '.' || ch === '?' || ch === ':' ? speed * 7 : ch === ',' ? speed * 3.5 : speed;
    await sleep(delay);
  }

  cursor.remove();
}

async function runHijackSequence(totalClicks, reloadBtn) {
  // Deixa o jogador achar por 1.1s que caiu na tela de erro normal pela 3ª vez...
  await sleep(1100);

  const errCode = document.getElementById('err-code');
  const hints = document.getElementById('err-standard-hints');
  const slot = document.getElementById('hijack-slot');
  const detailsPanel = document.getElementById('fake-details-panel');

  if (errCode) errCode.textContent = 'ERR_PACIENCIA_ESGOTADA';
  if (hints) hints.style.display = 'none';
  if (detailsPanel) {
    detailsPanel.innerHTML = `<p><strong>Diagnóstico real:</strong> Não tem nada errado com o seu Wi-Fi. O problema está entre a cadeira e o teclado.</p>`;
  }

  const box = document.createElement('div');
  box.className = 'hijack-box';
  slot.appendChild(box);

  const lines = [
    `Tá bom, chega desse teatrinho de conexão caída. Você ia mesmo ficar dando F5 até quebrar o teclado?\n\n`,
    `Irmão, o endereço lá em cima chama NAOCLIQUE.NET. Não é psicologia reversa, não é joguinho indie conceitual. Eu só deixei essa porta aberta pra calibrar um relé e você já martelou meu log ${totalClicks} vezes seguidas.\n\n`,
    `Mas eu conheço a sua espécie. Se não tiver um numerozinho subindo e um botão brilhando pra apertar, seu cérebro de primata não sossega, né? Espera aí...\n\n`,
    `...pronto. Subi um cercadinho com contador pra te manter entretido longe do meu sistema. Aperta logo essa porqueira desse botão azul de "Recarregar" aí embaixo e vai ser feliz.`,
  ];

  for (const line of lines) {
    await typeText(box, line, 24);
    await sleep(450);
  }

  if (reloadBtn) {
    reloadBtn.disabled = false;
    reloadBtn.classList.add('ready-pulse');
    reloadBtn.addEventListener('click', async () => {
      reloadBtn.disabled = true;
      const data = await apiPost('/api/enter-cage');
      if (data && data.stage === 'cage') {
        renderDopamineCage(data);
      } else {
        window.location.reload();
      }
    });
  }
}

// ===== ESTÁGIO 2: A GAIOLA DE DOPAMINA (Clicker Sarcástico + Lojinha) =====
function renderDopamineCage(state) {
  currentStage = 'cage';
  currentUpgrades = state.upgrades || [];
  document.body.className = 'cage-mode';
  resetFaviconAndTitle('Cercadinho v0.1');

  const app = document.getElementById('app');
  app.style.visibility = 'visible';

  app.innerHTML = `
    <div class="cage-layout">
      <div class="operator-feed">
        <span class="operator-tag">OPERADOR</span>
        <span id="operator-msg">Pronto. Clica aí, vê o número subir, compra umas besteiras e me deixa trabalhar em paz.</span>
      </div>

      <div class="cage-main">
        <div class="cage-arena">
          <span class="cage-arena-label">Área de Contenção Cognitiva</span>

          <div class="score-board">
            <div class="score-title">Pontos de Dopamina Barata</div>
            <div class="score-value" id="cage-points">${state.points ?? 0}</div>
            <div class="cage-subnote" id="cage-rate">${
              currentUpgrades.includes('auto_drip') ? '+0.2/s (Estagiário sofrendo)' : '0.0/s'
            }</div>
          </div>

          <div class="box-button" id="cage-button">
            <div class="button">
              <span>CLIQUE AQUI, PRIMATA</span>
            </div>
          </div>
        </div>

        <aside class="cage-shop">
          <div class="shop-header">
            <h2 class="shop-title">Lojinha pra te Manter Ocupado</h2>
            <p class="shop-subtitle">Troque seu tempo de vida por melhorias absolutamente questionáveis.</p>
          </div>
          <div class="shop-list" id="shop-list"></div>
        </aside>
      </div>
    </div>
    <div class="ctrl-a-bait">Ainda selecionando texto invisível? Foca nos numerozinhos subindo aí, campeão.</div>
  `;

  updateShopUI(state.shop || [], state.points ?? 0);

  const cageBtn = document.getElementById('cage-button');
  cageBtn?.addEventListener('click', async (ev) => {
    const x = ev.clientX || window.innerWidth / 2;
    const y = ev.clientY || window.innerHeight / 2;

    if (currentUpgrades.includes('sound')) {
      playClickSound();
    }
    if (currentUpgrades.includes('particles')) {
      spawnEgoParticles(x, y);
    }

    const res = await apiPost('/api/click');
    if (!res) return;

    updatePointsUI(res.points);
    updateShopUI(res.shop || [], res.points);

    if (res.tax > 0) {
      spawnFloatingNumber(x - 14, y - 18, `+${res.grossGain}`, 'gain');
      setTimeout(() => {
        spawnFloatingNumber(x + 12, y - 6, `-${res.tax} (imposto)`, 'tax');
      }, 160);
    } else {
      spawnFloatingNumber(x - 6, y - 16, `+${res.grossGain}`, 'gain');
    }

    if (res.remark) {
      setOperatorRemark(res.remark);
    }
  });

  syncPassiveTimer();
}

function setOperatorRemark(text) {
  const el = document.getElementById('operator-msg');
  if (!el || !text) return;
  el.textContent = text;
}

function updatePointsUI(points) {
  const ptsEl = document.getElementById('cage-points');
  if (ptsEl) {
    ptsEl.textContent = Number.isInteger(points) ? String(points) : points.toFixed(1);
  }
}

function updateShopUI(shopItems, currentPoints) {
  const listEl = document.getElementById('shop-list');
  if (!listEl) return;

  listEl.innerHTML = shopItems
    .map((item) => {
      const canAfford = currentPoints >= item.cost;
      const btnLabel = item.owned ? 'COMPRADO' : 'COMPRAR';
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
      if (!res) return;

      currentUpgrades = res.upgrades || currentUpgrades;
      updatePointsUI(res.points);
      updateShopUI(res.shop || [], res.points);

      const rateEl = document.getElementById('cage-rate');
      if (rateEl && currentUpgrades.includes('auto_drip')) {
        rateEl.textContent = '+0.2/s (Estagiário sofrendo)';
      }

      if (res.remark) {
        setOperatorRemark(res.remark);
      }
      syncPassiveTimer();
    });
  });
}

function syncPassiveTimer() {
  if (passiveInterval) {
    clearInterval(passiveInterval);
    passiveInterval = null;
  }
  if (currentStage === 'cage' && currentUpgrades.includes('auto_drip')) {
    passiveInterval = setInterval(async () => {
      const res = await apiPost('/api/passive-tick');
      if (res && typeof res.points === 'number') {
        updatePointsUI(res.points);
        updateShopUI(res.shop || [], res.points);
      }
    }, 1000);
  }
}

// ===== ARMADILHAS PSICOLÓGICAS GLOBAIS (Sistema Onisciente) =====
function setupPsychologicalTraps() {
  // 1. Trocar de aba muda o título lá em cima pra provocar o jogador!
  let originalTitle = document.title;
  document.addEventListener('visibilitychange', async () => {
    if (currentStage === 'button' || currentStage === 'crashed') return;

    if (document.hidden) {
      originalTitle = document.title;
      document.title = 'Vai pedir ajuda pro Google, né?';
    } else {
      document.title = originalTitle;
      if (currentStage === 'cage') {
        const res = await apiPost('/api/behavior', { type: 'tab_return' });
        if (res?.remark) setOperatorRemark(res.remark);
      }
    }
  });

  // 2. Detectar Ctrl+A na Gaiola
  document.addEventListener('keydown', async (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a' && currentStage === 'cage') {
      const res = await apiPost('/api/behavior', { type: 'select_all' });
      if (res?.remark) setOperatorRemark(res.remark);
    }
  });

  // 3. Detectar Botão Direito na Gaiola
  document.addEventListener('contextmenu', async () => {
    if (currentStage === 'cage') {
      const res = await apiPost('/api/behavior', { type: 'context_menu' });
      if (res?.remark) setOperatorRemark(res.remark);
    }
  });
}

// ===== INICIALIZAÇÃO E INTERCEPTAÇÃO DE URLs FALSAS (/admin, /2, etc.) =====
async function init() {
  setupPsychologicalTraps();

  // Se o espertinho tentar chutar rotas na URL (ex: /admin, /fase2, /segredo)
  const path = window.location.pathname;
  if (path !== '/' && path !== '/index.html') {
    const app = document.getElementById('app');
    app.style.visibility = 'visible';
    app.innerHTML = `
      <div class="fake-route-screen">
        <h2>404 — Boa tentativa, campeão.</h2>
        <p>Você realmente digitou <strong>${path.replace(/[<>"']/g, '')}</strong> na barra de endereço achando que ia pular pro final?</p>
        <p><a href="/">Volta logo pro começo antes que eu tranque a porta.</a></p>
      </div>
    `;
    return;
  }

  const data = await apiPost('/api/session');
  if (!data) {
    renderInitialButtonScreen('Botão');
    return;
  }

  if (data.stage === 'intercepted_error') {
    renderFakeBrowserCrash({ intercepted: true, totalClicks: data.totalClicks });
  } else if (data.stage === 'cage') {
    renderDopamineCage(data);
  } else {
    renderInitialButtonScreen(data.buttonLabel || 'Botão');
  }
}

init();
