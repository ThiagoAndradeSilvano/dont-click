// CONTO 1: FRONTEIRA DA BUROCRACIA (Estilo Papers, Please — 3 Dias de Plantão)
export function runStory1Burocracia({ app, setOperatorRemark, playBeep, finishStory, returnToCave, caveState }) {
  document.body.className = 'story-mode-1';

  const DAYS = [
    {
      day: 1,
      title: 'DIA 1 — PORTARIA DO SUBMUNDO',
      rules: [
        '1. Passaporte deve estar dentro da validade (>= 2026).',
        '2. Selo oficial do reino deve ser AUTÊNTICO (não rasurado).',
        '3. Proibido porte de itens explosivos na bagagem.',
      ],
      applicants: [
        {
          name: 'Geraldo, o Duende',
          species: 'Duende',
          origin: 'Vale do Boleto',
          expiry: 2028,
          seal: 'AUTÊNTICO',
          weightDeclared: 42,
          weightActual: 42,
          bag: 'Moedas de cobre',
          speech: 'bom dia seu guarda, tô só indo pagar um carnê atrasado ali na esquina.',
          valid: true,
          reason: 'Tudo em ordem.',
        },
        {
          name: 'Cláudio, o Ogro',
          species: 'Ogro',
          origin: 'Pântano Fiscal',
          expiry: 2019,
          seal: 'AUTÊNTICO',
          weightDeclared: 180,
          weightActual: 180,
          bag: 'Marmita de barro',
          speech: 'passa logo aí chefe, meu documento venceu só ontem... faz sete anos.',
          valid: false,
          reason: 'Passaporte vencido (2019 < 2026).',
        },
        {
          name: 'Fada Morgana Júnior',
          species: 'Fada',
          origin: 'Bosque MEI',
          expiry: 2027,
          seal: 'RASURADO',
          weightDeclared: 38,
          weightActual: 38,
          bag: 'Pó de pirlimpimpim',
          speech: 'esse carimbo borrado foi a chuva tá? juro pela minha asa.',
          valid: false,
          reason: 'Selo rasurado/falsificado.',
        },
      ],
    },
    {
      day: 2,
      title: 'DIA 2 — AUDITORIA DE PESO E VACINA',
      rules: [
        '1. Todas as regras do Dia 1 continuam valendo.',
        '2. Peso na balança DEVE bater com o declarado (tolerância ±2kg).',
        '3. Ogros e Trolls precisam de Vacina Antitetânica EM DIA.',
      ],
      applicants: [
        {
          name: 'Tadeu, o Troll',
          species: 'Troll',
          origin: 'Ponte Leste',
          expiry: 2029,
          seal: 'AUTÊNTICO',
          vaccine: 'EM DIA',
          weightDeclared: 210,
          weightActual: 211,
          bag: 'Pedágio em notas',
          speech: 'tô com a vacina, o documento e o peso certinho. me deixa trabalhar.',
          valid: true,
          reason: 'Tudo dentro das regras.',
        },
        {
          name: 'Elfo Suspeito',
          species: 'Elfo',
          origin: 'Floresta Sonegada',
          expiry: 2028,
          seal: 'AUTÊNTICO',
          vaccine: 'EM DIA',
          weightDeclared: 62,
          weightActual: 94,
          bag: 'Roupas leves',
          speech: 'eu juro que engordei só no almoço de hoje, seu fiscal.',
          valid: false,
          reason: 'Divergência absurda na balança (62kg vs 94kg).',
          bribe: true,
        },
        {
          name: 'Bárbara, a Ogra',
          species: 'Ogro',
          origin: 'Caverna Sul',
          expiry: 2027,
          seal: 'AUTÊNTICO',
          vaccine: 'ATRASADA',
          weightDeclared: 165,
          weightActual: 165,
          bag: 'Clava de madeira',
          speech: 'eu tenho medo de agulha moço, releva essa vacina aí.',
          valid: false,
          reason: 'Ogro sem vacina antitetânica em dia.',
        },
      ],
    },
    {
      day: 3,
      title: 'DIA 3 — ALERTA MÁXIMO DE SEGURANÇA',
      rules: [
        '1. Todas as regras anteriores continuam valendo.',
        '2. BLOQUEIO TOTAL: Ninguém vindo de Nárnia pode entrar.',
        '3. Nome no passaporte NÃO pode divergir do crachá de entrada.',
      ],
      applicants: [
        {
          name: 'Sr. Tumnus Jr.',
          species: 'Fauno',
          origin: 'Nárnia',
          expiry: 2030,
          seal: 'AUTÊNTICO',
          vaccine: 'EM DIA',
          weightDeclared: 70,
          weightActual: 70,
          bag: 'Guarda-chuva',
          speech: 'vim só visitar o guarda-roupa, tudo legalizado!',
          valid: false,
          reason: 'Origem bloqueada (Nárnia).',
        },
        {
          name: 'Mago Patrício',
          species: 'Mago',
          origin: 'Torre Cinza',
          expiry: 2029,
          seal: 'AUTÊNTICO',
          vaccine: 'EM DIA',
          weightDeclared: 75,
          weightActual: 75,
          bag: 'Cajado sem bateria',
          speech: 'tô há 4 horas nessa fila. aprova logo isso antes que eu transforme sua mesa em sapo.',
          valid: true,
          reason: 'Documentação 100% válida.',
        },
        {
          name: 'Roberto (Crachá: Joberto)',
          species: 'Humano',
          origin: 'Vila do Meio',
          expiry: 2028,
          seal: 'AUTÊNTICO',
          vaccine: 'EM DIA',
          weightDeclared: 80,
          weightActual: 80,
          bag: 'Documentos misturados',
          speech: 'é que no cartório erraram meu nome no crachá, mas sou eu mesmo!',
          valid: false,
          reason: 'Divergência de nome entre passaporte e crachá.',
        },
      ],
    },
  ];

  let dayIdx = 0;
  let appIdx = 0;
  let errors = 0;
  let checkedScale = false;

  app.innerHTML = `
    <div class="story-shell">
      <button type="button" class="story-back-btn" id="s1-back">← Voltar para a Caverna</button>
      <div class="operator-feed story-log-sepia">
        <span class="operator-tag">interfone</span>
        <span id="operator-msg"></span>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1.15fr; gap:16px; background:#d6c3a1; border:4px solid #1c130a; padding:18px; box-shadow:6px 6px 0 #140e08;">
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div style="background:#24190c; color:#f5e6c8; padding:10px; font-weight:bold; font-size:13px;" id="s1-day-title"></div>
          <div style="background:#efe3cc; border:2px solid #785a3a; padding:10px; font-size:12px;" id="s1-rules"></div>
          <div style="background:#3a2b1a; color:#f5e6c8; padding:14px; border:2px solid #1c130a; min-height:130px;">
            <div style="font-size:11px; opacity:0.75; margin-bottom:6px;">GUICHÊ DE ATENDIMENTO</div>
            <div style="font-size:16px; font-weight:bold; margin-bottom:8px;" id="s1-app-name"></div>
            <div style="font-size:13px; font-style:italic; line-height:1.45;" id="s1-app-speech"></div>
          </div>
          <div style="display:flex; gap:8px; align-items:center;">
            <button type="button" id="s1-scale-btn" style="padding:8px 12px; background:#453522; color:#f5e6c8; border:2px solid #1c130a; font-family:inherit; font-weight:bold; cursor:inherit;">⚖️ Pesar na Balança</button>
            <span id="s1-scale-readout" style="font-size:13px; font-weight:bold;">Aguardando pesagem...</span>
          </div>
          <div style="font-size:12px; font-weight:bold;" id="s1-score"></div>
        </div>

        <div style="background:#f5ebd6; border:2px solid #5c4328; padding:16px; display:flex; flex-direction:column; justify-content:space-between; gap:12px;">
          <div>
            <div style="border-bottom:2px dashed #8c6d46; padding-bottom:6px; margin-bottom:10px; font-weight:bold; font-size:14px;">PASSAPORTE OFICIAL DO SUBMUNDO</div>
            <div id="s1-passport" style="font-size:13px; line-height:1.7;"></div>
          </div>

          <div style="display:flex; gap:12px; margin-top:10px;">
            <button type="button" id="s1-approve" style="flex:1; padding:14px; background:#15803d; color:#fff; border:3px solid #052e16; font-family:inherit; font-weight:bold; font-size:14px; cursor:inherit;">✅ APROVAR</button>
            <button type="button" id="s1-deny" style="flex:1; padding:14px; background:#b91c1c; color:#fff; border:3px solid #450a0a; font-family:inherit; font-weight:bold; font-size:14px; cursor:inherit;">❌ NEGAR</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('s1-back')?.addEventListener('click', () => returnToCave(caveState));

  setOperatorRemark(
    'olha que lindo, até no subsolo tem fila de repartição pública. lê as regras na esquerda e carimba essa merda direito.',
    { delayBefore: 200, priority: 'urgent' }
  );

  function renderApplicant() {
    const dayObj = DAYS[dayIdx];
    const person = dayObj.applicants[appIdx];
    checkedScale = false;

    document.getElementById('s1-day-title').textContent = `${dayObj.title} (${appIdx + 1}/${dayObj.applicants.length})`;
    document.getElementById('s1-rules').innerHTML = dayObj.rules.map((r) => `<div>${r}</div>`).join('');
    document.getElementById('s1-app-name').textContent = `${person.name} [${person.species}]`;
    document.getElementById('s1-app-speech').textContent = `"${person.speech}"`;
    document.getElementById('s1-scale-readout').textContent = 'Aguardando pesagem...';
    document.getElementById('s1-score').textContent = `Infrações cometidas: ${errors}/3`;

    document.getElementById('s1-passport').innerHTML = `
      <div><strong>Nome:</strong> ${person.name}</div>
      <div><strong>Origem:</strong> ${person.origin}</div>
      <div><strong>Validade:</strong> ${person.expiry}</div>
      <div><strong>Selo:</strong> ${person.seal}</div>
      <div><strong>Peso Declarado:</strong> ${person.weightDeclared} kg</div>
      ${person.vaccine ? `<div><strong>Vacina Antitetânica:</strong> ${person.vaccine}</div>` : ''}
      <div><strong>Bagagem:</strong> ${person.bag}</div>
    `;
  }

  document.getElementById('s1-scale-btn')?.addEventListener('click', () => {
    playBeep();
    const person = DAYS[dayIdx].applicants[appIdx];
    checkedScale = true;
    document.getElementById('s1-scale-readout').textContent = `Balança: ${person.weightActual} kg`;
    if (person.bribe) {
      setOperatorRemark('o cara declarou 62kg e pesa 94kg. se vc aprovar isso eu mesmo te demito.', { priority: 'action' });
    }
  });

  async function decide(approved) {
    playBeep();
    const dayObj = DAYS[dayIdx];
    const person = dayObj.applicants[appIdx];

    if (approved === person.valid) {
      setOperatorRemark(approved ? 'aprovado dentro da lei. próximo.' : `negado certinho: ${person.reason}`, { priority: 'action' });
    } else {
      errors += 1;
      setOperatorRemark(`ERROU a papelada! Motivo real: ${person.reason}`, { priority: 'urgent' });
      if (errors >= 3) {
        dayIdx = 0;
        appIdx = 0;
        errors = 0;
        setOperatorRemark('três multas no mesmo plantão. parabéns, voltou pro Dia 1.', { priority: 'urgent' });
        renderApplicant();
        return;
      }
    }

    appIdx += 1;
    if (appIdx >= dayObj.applicants.length) {
      dayIdx += 1;
      appIdx = 0;
      if (dayIdx >= DAYS.length) {
        setOperatorRemark('fim do expediente. pega esse livro idiota e vaza desse guichê.', { priority: 'urgent' });
        await finishStory();
        return;
      }
      setOperatorRemark(`fim do Dia ${dayIdx}. amanhã tem regra nova pra piorar sua vida.`, { priority: 'action' });
    }
    renderApplicant();
  }

  document.getElementById('s1-approve')?.addEventListener('click', () => decide(true));
  document.getElementById('s1-deny')?.addEventListener('click', () => decide(false));

  renderApplicant();
}
