const TOKEN_KEY = '_sys_ref';

// Coleta metadados básicos e legais do navegador para identificar o jogador mesmo se limpar algo
function getClientMeta() {
  let localToken = null;
  try {
    localToken = localStorage.getItem(TOKEN_KEY);
  } catch {
    // Ignora caso armazenamento esteja bloqueado
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

// Registra visita silenciosamente ao abrir a página e recebe o rótulo atual do botão do servidor
async function initSession() {
  const appEl = document.getElementById('app');
  const labelEl = document.getElementById('button-label');

  try {
    const res = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(getClientMeta()),
    });
    if (res.ok) {
      const data = await res.json();
      saveLocalToken(data.token);
      if (labelEl && data.buttonLabel) {
        labelEl.textContent = data.buttonLabel;
      }
    }
  } catch {
    // Falha silenciosa para nunca quebrar a ilusão
  } finally {
    if (appEl) {
      appEl.style.visibility = 'visible';
    }
  }
}

// Registra o clique no back-end e recebe a reação decidida pelo servidor
async function registerClick() {
  const payload = JSON.stringify(getClientMeta());

  try {
    const res = await fetch('/api/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      keepalive: true,
      body: payload,
    });
    if (res.ok) {
      const data = await res.json();
      saveLocalToken(data.token);
      return data;
    }
  } catch {
    // Falha silenciosa
  }
  return null;
}

// Gera o favicon cinza de página quebrada igual ao do Chrome/Edge
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

// Renderiza o erro falso idêntico ao navegador do jogador
function triggerFakeBrowserCrash() {
  const host = window.location.hostname || 'localhost';
  const ua = navigator.userAgent;
  const isFirefox = ua.includes('Firefox');
  const isEdge = ua.includes('Edg/');

  // Título da aba idêntico ao de quando o site cai no Chrome/Edge
  document.title = host;
  setBrokenPageFavicon();

  const app = document.getElementById('app');

  if (isFirefox) {
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
    // Chrome / Edge / Opera / Brave
    document.body.className = 'native-error-mode';

    // Ícone clássico da folhinha triste pixelada do Chromium
    const sadPageSvg = `
      <svg class="neterror-icon" width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 6H42L60 24V66H12V6Z" stroke="#9AA0A6" stroke-width="4" fill="none"/>
        <path d="M42 6V24H60" stroke="#9AA0A6" stroke-width="4" fill="none"/>
        <rect x="23" y="34" width="6" height="6" fill="#9AA0A6"/>
        <rect x="43" y="34" width="6" height="6" fill="#9AA0A6"/>
        <path d="M25 53C28 49 44 49 47 53" stroke="#9AA0A6" stroke-width="4" stroke-linecap="square"/>
      </svg>
    `;

    const titleText = isEdge
      ? 'Hmmm... não é possível acessar esta página'
      : 'Não é possível acessar esse site';

    app.innerHTML = `
      <div class="neterror-wrapper">
        ${sadPageSvg}
        <h1 class="neterror-title">${titleText}</h1>
        <p class="neterror-desc">A conexão com <strong>${host}</strong> foi redefinida.</p>
        <p class="neterror-desc">Tente:</p>
        <ul class="neterror-list">
          <li>Verificar a conexão</li>
          <li>Verificar o proxy e o firewall</li>
        </ul>
        <div class="neterror-code">ERR_CONNECTION_RESET</div>
        <div class="neterror-actions">
          <button class="neterror-btn-reload" id="fake-reload-btn">Recarregar</button>
          <button class="neterror-btn-details" id="fake-details-btn">Detalhes</button>
        </div>
        <div class="neterror-details-panel" id="fake-details-panel">
          <p><strong>Verifique sua conexão com a Internet</strong><br/>Verifique os cabos e reinicie todos os roteadores, modems ou outros dispositivos de rede que você estiver usando.</p>
          <p><strong>Permita que o navegador acesse a rede nas configurações do firewall ou antivírus.</strong><br/>Se ele já estiver listado como um programa com permissão para acessar a rede, tente removê-lo da lista e adicioná-lo novamente.</p>
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

  // Se ele clicar no botão azul "Recarregar" da própria tela de erro (ou der F5), volta pro botão normal!
  document.getElementById('fake-reload-btn')?.addEventListener('click', () => {
    window.location.reload();
  });
}

// Configura o botão inicial
const theButton = document.getElementById('the-button');
const labelEl = document.getElementById('button-label');
let crashing = false;

theButton?.addEventListener('click', async () => {
  if (crashing) return;

  const result = await registerClick();
  if (!result) return;

  // Se o servidor mandar cair (8º clique da sessão), trava novos cliques e dispara a tela falsa de erro!
  if (result.action === 'crash') {
    crashing = true;
    setTimeout(() => {
      document.getElementById('app').innerHTML = '';
      document.title = 'Carregando...';

      setTimeout(() => {
        triggerFakeBrowserCrash();
      }, 180);
    }, 140);
    return;
  }

  // Caso contrário, atualiza o texto se o servidor mudou (ex: virou "Não clique" após o 3º clique)
  if (labelEl && result.buttonLabel) {
    labelEl.textContent = result.buttonLabel;
  }
});

initSession();
