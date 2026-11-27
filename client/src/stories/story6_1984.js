// CONTO 6: TERMINAL 1984 (Distopia CRT Verde Fósforo — Censura & Hacking em Tempo Real!)
export function runStory61984({ app, setOperatorRemark, playBeep, finishStory, returnToCave, caveState }) {
  document.body.className = 'story-mode-6';

  const BULLETINS = [
    {
      text: 'Cidadãos celebram a paz eterna. Rumores de LIBERDADE foram descartados pelo ministério.',
      forbidden: 'LIBERDADE',
      hex: 'OVERRIDE',
    },
    {
      text: 'A produção de ração dobrou. Quem questionar a VERDADE oficial terá a conta suspensa.',
      forbidden: 'VERDADE',
      hex: 'BYPASS',
    },
    {
      text: 'Qualquer tentativa de REBELIÃO será corrigida com carinho na sala de reeducação.',
      forbidden: 'REBELIÃO',
      hex: 'ROOT',
    },
  ];

  let idx = 0;
  let capturedCodes = [];

  app.innerHTML = `
    <div class="story-shell">
      <div class="operator-feed story-main-log">
        <span class="operator-tag">log</span>
        <span id="operator-msg"></span>
      </div>
      <button type="button" class="story-back-btn" id="s6-back">← Voltar para a Caverna</button>

      <div class="story-stage-area" style="background:#031207; border:2px solid #22c55e; padding:24px; box-shadow:0 0 28px rgba(34,197,94,0.18);">
        <div style="font-size:12px; opacity:0.8; margin-bottom:14px;">MINISTÉRIO DA VERDADE // MESA DE CENSURA</div>
        <div id="s6-stage"></div>
      </div>
    </div>
  `;

  document.getElementById('s6-back')?.addEventListener('click', () => returnToCave(caveState));

  setOperatorRemark(
    'uau, pílula vermelha ou azul... que dilema revolucionário hein adolescente de 2002. censura as palavras proibidas pra extrair o acesso root.',
    { delayBefore: 200, priority: 'urgent' }
  );

  function renderBulletin() {
    const stage = document.getElementById('s6-stage');
    if (!stage) return;

    if (idx >= BULLETINS.length) {
      stage.innerHTML = `
        <div style="margin-bottom:14px; font-size:14px;">PACOTES EXTRAÍDOS: <strong>${capturedCodes.join(' -> ')}</strong></div>
        <div style="font-size:13px; margin-bottom:12px;">Digite o comando completo para derrubar o firewall (ex: OVERRIDE BYPASS ROOT):</div>
        <div style="display:flex; gap:8px;">
          <input type="text" id="s6-cmd" style="flex:1; background:#020a04; color:#4ade80; border:1px solid #22c55e; padding:10px; font-family:inherit; font-size:14px;" placeholder="COMANDO..." />
          <button type="button" id="s6-exec" style="background:#16a34a; color:#020a04; border:none; padding:10px 18px; font-weight:bold; font-family:inherit; cursor:inherit;">EXECUTAR</button>
        </div>
      `;

      document.getElementById('s6-exec')?.addEventListener('click', async () => {
        playBeep();
        const val = (document.getElementById('s6-cmd')?.value || '').trim().toUpperCase();
        if (val === 'OVERRIDE BYPASS ROOT') {
          setOperatorRemark('firewall derrubado. pega o sexto e último livro.', { priority: 'urgent' });
          await finishStory();
        } else {
          setOperatorRemark('sintaxe errada, hacker de cinema. junta os três códigos com espaço.', { priority: 'action' });
        }
      });
      return;
    }

    const b = BULLETINS[idx];
    const words = b.text.split(' ');

    stage.innerHTML = `
      <div style="font-size:12px; margin-bottom:10px;">BOLETIM ${idx + 1}/3 — CLIQUE NA PALAVRA PROIBIDA PARA CENSURAR:</div>
      <div style="padding:18px; background:#020a04; border:1px dashed #22c55e; line-height:2; font-size:15px;">
        ${words
          .map(
            (w) =>
              `<span class="s6-word" data-w="${w.replace(/[.,]/g, '')}" style="padding:2px 4px; margin:0 2px; border:1px solid transparent;">${w}</span>`
          )
          .join(' ')}
      </div>
    `;

    stage.querySelectorAll('.s6-word').forEach((span) => {
      span.addEventListener('mouseenter', () => { span.style.borderColor = '#22c55e'; });
      span.addEventListener('mouseleave', () => { span.style.borderColor = 'transparent'; });
      span.addEventListener('click', () => {
        playBeep();
        const word = span.getAttribute('data-w');
        if (word === b.forbidden) {
          capturedCodes.push(b.hex);
          setOperatorRemark(`censurado. código extraído: ${b.hex}`, { priority: 'action' });
          idx += 1;
          renderBulletin();
        } else {
          setOperatorRemark('isso é uma palavra comum, idiota. censura o termo subversivo.', { priority: 'action' });
        }
      });
    });
  }

  renderBulletin();
}
