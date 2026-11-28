// CONTO 5: PLANTÃO DA FLORESTA (Detetive & Interrogatório Sombrio — Chapeuzinho/Lobo)
export function runStory5Floresta({ app, setOperatorRemark, playBeep, finishStory, returnToCave, caveState }) {
  document.body.className = 'story-mode-5';

  const CLUES = [
    { id: 'c1', title: '🐾 Pegadas de Bota Nº 42', desc: 'Rastros de lama pesada saindo pela janela dos fundos, NÃO são patas.' },
    { id: 'c2', title: '🧺 Recibo da Padaria', desc: 'A cesta tinha só pão amanhecido e um boleto da Vovó vencido há 3 meses.' },
    { id: 'c3', title: '🪓 Machado Limpo', desc: 'O machado do Lenhador está encostado na porta sem um único arranhão ou lasca.' },
  ];

  const SUSPECTS = [
    {
      id: 'vovo',
      name: '👵 A Vovó',
      alibi: '"Eu tava dormindo com minha touca! Nunca saí da cama, quem roubou os doces foi o Lobo!"',
      detail: 'Mas tem lama fresca de bota nº 42 debaixo da cama dela e ela calça exatamente 42.',
      guilty: true,
    },
    {
      id: 'lobo',
      name: '🐺 O Lobo',
      alibi: '"Eu sou vegano desde 2023, meu chapa. Só passei aqui pra cobrar o aluguel atrasado da cabana."',
      detail: 'Mostrou o extrato do Pix de cobrança. Não tem motivo nenhum pra roubar pão duro.',
      guilty: false,
    },
    {
      id: 'lenhador',
      name: '🪓 O Lenhador',
      alibi: '"Passei a noite inteira cortando lenha lá fora, nem entrei nessa cabana."',
      detail: 'O machado dele tá limpo demais pra quem supostamente cortou lenha, mas ele não usa bota 42.',
      guilty: false,
    },
  ];

  const inspectedClues = new Set();
  const interrogated = new Set();

  app.innerHTML = `
    <div class="story-shell">
      <div class="operator-feed story-main-log">
        <span class="operator-tag">log</span>
        <span id="operator-msg"></span>
      </div>
      <button type="button" class="story-back-btn" id="s5-back">← Voltar para a Caverna</button>

      <div class="story-stage-area" style="background:#261012; border:3px solid #7f1d1d; padding:22px; display:grid; grid-template-columns:1fr 1fr; gap:18px;">
        <div>
          <div style="font-size:12px; color:#fca5a5; margin-bottom:8px;">1. EVIDÊNCIAS NA CABANA</div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${CLUES.map(
              (c) =>
                `<button type="button" class="s5-clue" data-clue="${c.id}" style="padding:10px; background:#3b181b; color:#fecaca; border:1px solid #991b1b; text-align:left; font-family:inherit; cursor:inherit;">${c.title}</button>`
            ).join('')}
          </div>

          <div style="font-size:12px; color:#fca5a5; margin:16px 0 8px;">2. INTERROGAR SUSPEITOS</div>
          <div style="display:flex; flex-direction:column; gap:8px;">
            ${SUSPECTS.map(
              (s) =>
                `<button type="button" class="s5-susp" data-susp="${s.id}" style="padding:10px; background:#3b181b; color:#fecaca; border:1px solid #991b1b; text-align:left; font-family:inherit; cursor:inherit;">${s.name}</button>`
            ).join('')}
          </div>
        </div>

        <div style="display:flex; flex-direction:column; justify-content:space-between; gap:12px; background:#140708; padding:16px; border:1px solid #7f1d1d;">
          <div>
            <div style="font-size:11px; color:#f87171; margin-bottom:8px;">CADERNO DE ANOTAÇÕES</div>
            <div id="s5-notes" style="font-size:13px; line-height:1.55; color:#f5e6d3; min-height:140px;">
              Examine as 3 evidências e interrogue os 3 suspeitos antes de dar a voz de prisão.
            </div>
          </div>

          <div>
            <div style="font-size:11px; color:#fca5a5; margin-bottom:8px;">3. QUEM FORJOU O CRIME?</div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              ${SUSPECTS.map(
                (s) =>
                  `<button type="button" class="s5-accuse" data-acc="${s.id}" style="flex:1; padding:10px; background:#991b1b; color:#fff; border:1px solid #fecaca; font-family:inherit; font-weight:bold; cursor:inherit;">Prender ${s.name.split(' ')[1]}</button>`
              ).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('s5-back')?.addEventListener('click', () => returnToCave(caveState));

  setOperatorRemark(
    'sério que ninguém percebe que toda história da floresta tem álibi furado? olha as provas e prende quem tá mentindo.',
    { delayBefore: 200, priority: 'urgent' }
  );

  app.querySelectorAll('.s5-clue').forEach((btn) => {
    btn.addEventListener('click', () => {
      playBeep();
      const id = btn.getAttribute('data-clue');
      const clue = CLUES.find((c) => c.id === id);
      inspectedClues.add(id);
      document.getElementById('s5-notes').innerHTML = `<strong>${clue.title}</strong><br/><br/>${clue.desc}`;
    });
  });

  app.querySelectorAll('.s5-susp').forEach((btn) => {
    btn.addEventListener('click', () => {
      playBeep();
      const id = btn.getAttribute('data-susp');
      const s = SUSPECTS.find((x) => x.id === id);
      interrogated.add(id);
      document.getElementById('s5-notes').innerHTML = `
        <strong>${s.name}</strong><br/>
        <em>${s.alibi}</em><br/><br/>
        ${inspectedClues.size >= 2 ? `🔍 <strong>Observação:</strong> ${s.detail}` : '<em>(Analise mais evidências na sala para notar contradições.)</em>'}
      `;
    });
  });

  app.querySelectorAll('.s5-accuse').forEach((btn) => {
    btn.addEventListener('click', async () => {
      playBeep();
      const id = btn.getAttribute('data-acc');
      if (inspectedClues.size < 3 || interrogated.size < 3) {
        setOperatorRemark('vc nem olhou todas as pistas e depoimentos ainda, detetive de araque. investiga tudo primeiro.', { priority: 'action', key: true });
        return;
      }

      const target = SUSPECTS.find((x) => x.id === id);
      if (target?.guilty) {
        setOperatorRemark('era a vovó sonegadora o tempo todo. caso encerrado, pega o quinto livro.', { priority: 'urgent' });
        await finishStory();
      } else {
        setOperatorRemark('prendeu o suspeito errado. lê a porra da pista da bota 42 de novo.', { priority: 'urgent' });
      }
    });
  });
}
