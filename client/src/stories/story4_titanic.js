// CONTO 4: NAUFRÁGIO DA PORTA GIGANTE (Sobrevivência & Equilíbrio no Gelo — Paródia de Titanic!)
export function runStory4Titanic({ app, setOperatorRemark, playBeep, finishStory, returnToCave, caveState }) {
  document.body.className = 'story-mode-4';

  let tilt = 0; // -45 a +45 graus (se passar de ±38 vira!)
  let temp = 100; // calor corporal
  let elapsed = 0;
  const TARGET_SEC = 28;
  let companionOnDoor = false;
  let timerId = null;

  app.innerHTML = `
    <div class="story-shell">
      <button type="button" class="story-back-btn" id="s4-back">← Voltar para a Caverna</button>
      <div class="operator-feed story-log-ice">
        <span class="operator-tag">telégrafo</span>
        <span id="operator-msg"></span>
      </div>

      <div style="background:rgba(7, 25, 45, 0.9); border:2px solid #0284c7; padding:24px; border-radius:8px; text-align:center;">
        <div style="display:flex; justify-content:space-between; font-size:13px; color:#7dd3fc; margin-bottom:14px;">
          <span id="s4-time">Resgate em: 28s</span>
          <span id="s4-temp">Calor Corporal: 100%</span>
        </div>

        <div style="height:160px; display:flex; flex-direction:column; justify-content:center; align-items:center; background:linear-gradient(180deg, #082f49 0%, #0c4a6e 65%, #0284c7 100%); border:1px solid #0369a1; border-radius:6px; margin-bottom:18px; position:relative; overflow:hidden;">
          <div id="s4-door" style="width:260px; height:26px; background:#78350f; border:3px solid #451a03; border-radius:4px; transition:transform 0.12s; display:flex; justify-content:space-around; align-items:center; font-size:12px; color:#fef3c7;">
            <span>🧍 Você</span>
            <span id="s4-comp">${companionOnDoor ? '🥶 Jack' : '🌊 (Na água)'}</span>
          </div>
          <div style="margin-top:14px; font-size:12px; color:#bae6fd;" id="s4-tilt-label">Inclinação da Porta: 0°</div>
        </div>

        <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
          <button type="button" id="s4-left" style="padding:12px 18px; background:#0369a1; color:#fff; border:2px solid #38bdf8; border-radius:6px; font-family:inherit; cursor:inherit;">⬅️ Inclinar Esquerda</button>
          <button type="button" id="s4-pull" style="padding:12px 18px; background:#0284c7; color:#fff; border:2px solid #7dd3fc; border-radius:6px; font-family:inherit; cursor:inherit;">🤝 Puxar o Coitado pra Porta</button>
          <button type="button" id="s4-warm" style="padding:12px 18px; background:#0ea5e9; color:#082f49; font-weight:bold; border:2px solid #e0f2fe; border-radius:6px; font-family:inherit; cursor:inherit;">🔥 Esfregar as Mãos (+Calor)</button>
          <button type="button" id="s4-right" style="padding:12px 18px; background:#0369a1; color:#fff; border:2px solid #38bdf8; border-radius:6px; font-family:inherit; cursor:inherit;">Inclinar Direita ➡️</button>
        </div>
      </div>
    </div>
  `;

  const cleanup = () => {
    if (timerId) { clearInterval(timerId); timerId = null; }
  };

  document.getElementById('s4-back')?.addEventListener('click', () => {
    cleanup();
    returnToCave(caveState);
  });

  setOperatorRemark(
    'TEM ESPAÇO PRA QUATRO PESSOAS NESSA PORTA, SUA ARROMBADA!! puxa o cara pra cima e equilibra essa tábua antes que eu morra de raiva.',
    { delayBefore: 200, priority: 'urgent' }
  );

  function updateUI() {
    const doorEl = document.getElementById('s4-door');
    const compEl = document.getElementById('s4-comp');
    const tiltEl = document.getElementById('s4-tilt-label');
    const timeEl = document.getElementById('s4-time');
    const tempEl = document.getElementById('s4-temp');
    if (!doorEl) { cleanup(); return; }

    doorEl.style.transform = `rotate(${tilt}deg)`;
    compEl.textContent = companionOnDoor ? '🥶 Jack (Coube!)' : '🌊 (Congelando)';
    tiltEl.textContent = `Inclinação da Porta: ${Math.round(tilt)}°`;
    timeEl.textContent = `Resgate em: ${Math.max(0, TARGET_SEC - elapsed)}s`;
    tempEl.textContent = `Calor Corporal: ${Math.max(0, Math.round(temp))}%`;
  }

  document.getElementById('s4-left')?.addEventListener('click', () => { playBeep(); tilt -= 10; updateUI(); });
  document.getElementById('s4-right')?.addEventListener('click', () => { playBeep(); tilt += 10; updateUI(); });
  document.getElementById('s4-warm')?.addEventListener('click', () => { playBeep(); temp = Math.min(100, temp + 16); updateUI(); });
  document.getElementById('s4-pull')?.addEventListener('click', () => {
    playBeep();
    if (!companionOnDoor) {
      companionOnDoor = true;
      tilt += 14;
      setOperatorRemark('viu só? coube perfeitamente. cinema mentiroso do caralho.', { priority: 'action' });
    }
    updateUI();
  });

  timerId = setInterval(async () => {
    if (!document.getElementById('s4-door')) { cleanup(); return; }
    elapsed += 1;
    // Onda aleatória balançando a porta e frio constante
    tilt += (Math.random() - 0.5) * 18 + (tilt >= 0 ? 1.5 : -1.5);
    temp -= companionOnDoor ? 3.5 : 5.5;

    if (Math.abs(tilt) >= 38 || temp <= 0) {
      tilt = 0;
      temp = 100;
      elapsed = 0;
      companionOnDoor = false;
      setOperatorRemark('virou a porta no gelo igual um amador. reiniciando a cena dramática.', { priority: 'urgent' });
    }

    if (elapsed >= TARGET_SEC) {
      cleanup();
      setOperatorRemark('bote de resgate chegou. pega o livro congelado e vaza desse oceano.', { priority: 'urgent' });
      await finishStory();
      return;
    }
    updateUI();
  }, 1000);
}
