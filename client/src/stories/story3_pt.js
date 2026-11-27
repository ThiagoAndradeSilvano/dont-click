// CONTO 3: CORREDOR 0999 P.T. (Terror P&B granulado em loop — paródia de P.T. / Kojima!)
export function runStory3PT({ app, setOperatorRemark, playBeep, finishStory, returnToCave, caveState }) {
  document.body.className = 'story-mode-3';

  const LOOPS = [
    {
      loop: 1,
      anomaly: 'radio',
      desc: 'Corredor silencioso. Um rádio antigo chia na mesinha, um relógio marca 23:59 e há uma foto de família na parede.',
      log: 'nossa que inovador, um corredor escuro em preto e branco com rádio chiando. aposto que o desenvolvedor se acha o próprio Kojima.',
      items: {
        radio: 'O rádio repete ao contrário: "NÃO OLHE PARA A PORTA." (Anomalia encontrada!)',
        clock: 'O relógio marca 23:59 normalmente.',
        photo: 'Foto embaçada de alguém olhando para o nada.',
      },
    },
    {
      loop: 2,
      anomaly: 'clock',
      desc: 'Você abriu a porta... e voltou pro mesmo corredor. Algo mudou nos detalhes.',
      log: 'parabéns, andou 10 metros pra voltar pro mesmo lugar. verifica o que bugou nesse loop.',
      items: {
        radio: 'Apenas estática branca normal.',
        clock: 'Os ponteiros do relógio estão girando ao contrário marcando 09:99! (Anomalia!)',
        photo: 'A foto continua parada.',
      },
    },
    {
      loop: 3,
      anomaly: 'photo',
      desc: 'Loop 3. O cheiro de mofo e clichê psicológico aumentou.',
      log: 'mais um corredor igual. juro por deus que se aparecer uma geladeira balançando no teto eu fecho essa aba.',
      items: {
        radio: 'Só chiado de fita velha.',
        clock: 'Travado em 23:59.',
        photo: 'Os olhos na foto estão arrancados e sangrando tinta preta! (Anomalia!)',
      },
    },
    {
      loop: 4,
      anomaly: 'mirror',
      desc: 'Loop 4. Um espelho rachado surgiu na parede lateral do corredor.',
      log: 'espelho em jogo de terror. deixa eu adivinhar: tem alguém atrás de vc mas quando vira não tem ninguém.',
      items: {
        radio: 'Silêncio absoluto.',
        clock: '23:59.',
        photo: 'Moldura vazia.',
        mirror: 'Seu reflexo no espelho está sorrindo enquanto você está sério! (Anomalia!)',
      },
    },
    {
      loop: 5,
      anomaly: 'door',
      desc: 'Loop Final (5/5). A luz do corredor está piscando freneticamente.',
      log: 'último loop dessa punhetação artística. acha logo o que tá errado e sai daqui.',
      items: {
        radio: 'Desligado.',
        clock: '23:59.',
        photo: 'Queimada.',
        mirror: 'Totalmente preto.',
        door: 'A fresta da porta do fundo está entreaberta revelando a saída real 0999! (Anomalia!)',
      },
    },
  ];

  let loopIdx = 0;
  let foundAnomaly = false;

  app.innerHTML = `
    <div class="story-shell">
      <div class="operator-feed story-main-log">
        <span class="operator-tag">log</span>
        <span id="operator-msg"></span>
      </div>
      <button type="button" class="story-back-btn" id="s3-back">← Voltar para a Caverna</button>

      <div class="story-stage-area" style="background:#0c0c0e; border:2px solid #27272a; padding:24px; filter:grayscale(100%) contrast(1.15); position:relative;">
        <div style="display:flex; justify-content:space-between; font-size:12px; color:#71717a; margin-bottom:14px;">
          <span id="s3-loop-label">VHS // REC 0999</span>
          <span id="s3-status">INVESTIGUE O CORREDOR</span>
        </div>

        <p id="s3-desc" style="font-size:14px; line-height:1.6; color:#e4e4e7; margin-bottom:20px;"></p>

        <div id="s3-corridor" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:12px; margin-bottom:22px;"></div>

        <div id="s3-inspect-log" style="min-height:42px; padding:10px; background:#18181b; border-left:3px solid #a1a1aa; font-size:13px; margin-bottom:18px;">
          Clique nos elementos do corredor para encontrar a anomalia deste loop.
        </div>

        <button type="button" id="s3-next-door" style="width:100%; padding:14px; background:#27272a; color:#f4f4f5; border:1px solid #52525b; font-family:inherit; font-weight:bold; cursor:inherit;">🚪 ATRAVESSAR A PORTA DO CORREDOR</button>
      </div>
    </div>
  `;

  document.getElementById('s3-back')?.addEventListener('click', () => returnToCave(caveState));

  function renderLoop() {
    const data = LOOPS[loopIdx];
    foundAnomaly = false;

    document.getElementById('s3-loop-label').textContent = `VHS // LOOP ${data.loop} de ${LOOPS.length}`;
    document.getElementById('s3-status').textContent = 'ANOMALIA: PENDENTE';
    document.getElementById('s3-desc').textContent = data.desc;
    document.getElementById('s3-inspect-log').textContent = 'Clique nos elementos do corredor para encontrar a anomalia deste loop.';
    setOperatorRemark(data.log, { priority: 'urgent' });

    const labels = {
      radio: '📻 Rádio Antigo',
      clock: '🕰️ Relógio de Parede',
      photo: '🖼️ Quadro / Foto',
      mirror: '🪞 Espelho Rachado',
      door: '🚪 Fresta da Porta',
    };

    const grid = document.getElementById('s3-corridor');
    grid.innerHTML = Object.keys(data.items)
      .map(
        (key) =>
          `<button type="button" class="s3-obj" data-k="${key}" style="padding:18px 10px; background:#18181b; color:#e4e4e7; border:1px solid #3f3f46; font-family:inherit; cursor:inherit;">${labels[key]}</button>`
      )
      .join('');

    grid.querySelectorAll('.s3-obj').forEach((btn) => {
      btn.addEventListener('click', () => {
        playBeep();
        const k = btn.getAttribute('data-k');
        document.getElementById('s3-inspect-log').textContent = data.items[k];
        if (k === data.anomaly) {
          foundAnomaly = true;
          document.getElementById('s3-status').textContent = 'ANOMALIA DETECTADA ✓';
        }
      });
    });
  }

  document.getElementById('s3-next-door')?.addEventListener('click', async () => {
    playBeep();
    if (!foundAnomaly) {
      loopIdx = 0;
      setOperatorRemark('vc entrou na porta sem achar a anomalia. parabéns, reiniciou pro Loop 1.', { priority: 'urgent' });
      renderLoop();
      return;
    }

    loopIdx += 1;
    if (loopIdx >= LOOPS.length) {
      setOperatorRemark('acabou o terror conceitual. pega o livro e vamos embora antes que o Kojima cobre direitos autorais.', { priority: 'urgent' });
      await finishStory();
      return;
    }
    renderLoop();
  });

  renderLoop();
}
