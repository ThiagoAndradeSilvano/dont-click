// CONTO 1: FRONTEIRA DA BUROCRACIA (Versão Completa — 5 Dias, Manual com Abas, Raio-X, Suborno, Balança e Cifras!)
export function runStory1Burocracia({ app, setOperatorRemark, playBeep, finishStory, returnToCave, caveState }) {
  document.body.className = 'story-mode-1';

  const KINGDOM_CITIES = {
    'Vale do Boleto': ['Serasa Sul', 'Carnê Alto', 'Fatura Nova'],
    'Pântano Fiscal': ['Lama Seca', 'Brejo Branco', 'Imposto Velho'],
    'Bosque MEI': ['Pinheiro Simples', 'Folha Única', 'Ramo Verde'],
    'Ponte Leste': ['Pedágio 1', 'Arco de Pedra', 'Viga Norte'],
    'Torre Cinza': ['Cúpula Alta', 'Degrau 99', 'Sótão Sul'],
    'Vila do Meio': ['Praça Central', 'Beco Torto', 'Mercado Baixo'],
  };

  const DAYS = [
    {
      day: 1,
      title: 'DIA 1 — PORTARIA DO SUBMUNDO',
      rules: [
        '1. Passaporte deve estar dentro da validade (>= 2026).',
        '2. Selo oficial deve ser AUTÊNTICO (nunca RASURADO ou FALSO).',
        '3. Use o Raio-X: proibido entrar com explosivos ou armas ocultas.',
      ],
      applicants: [
        {
          name: 'Geraldo, o Duende',
          species: 'Duende',
          origin: 'Vale do Boleto',
          city: 'Serasa Sul',
          birth: 1984,
          expiry: 2028,
          seal: 'AUTÊNTICO',
          weightDeclared: 42,
          weightActual: 42,
          bag: 'Mochila de couro',
          xray: 'Moedas de cobre e 3 carnês.',
          speech: 'bom dia seu guarda, tô só indo pagar um carnê atrasado ali na esquina.',
          valid: true,
          reason: 'Tudo em ordem.',
        },
        {
          name: 'Cláudio, o Ogro',
          species: 'Ogro',
          origin: 'Pântano Fiscal',
          city: 'Lama Seca',
          birth: 1979,
          expiry: 2019,
          seal: 'AUTÊNTICO',
          weightDeclared: 180,
          weightActual: 180,
          bag: 'Marmita de barro',
          xray: 'Feijão tropeiro e uma colher torta.',
          speech: 'passa logo aí chefe, meu documento venceu só ontem... faz sete anos.',
          valid: false,
          reason: 'Passaporte vencido (2019 < 2026).',
        },
        {
          name: 'Fada Morgana Júnior',
          species: 'Fada',
          origin: 'Bosque MEI',
          city: 'Pinheiro Simples',
          birth: 1998,
          expiry: 2027,
          seal: 'RASURADO',
          weightDeclared: 38,
          weightActual: 38,
          bag: 'Bolsa brilhante',
          xray: 'Pó brilhante e espelhinho.',
          speech: 'esse carimbo borrado foi a chuva tá? juro pela minha asa.',
          valid: false,
          reason: 'Selo rasurado/falsificado.',
        },
        {
          name: 'Valdir, o Goblin',
          species: 'Goblin',
          origin: 'Vila do Meio',
          city: 'Beco Torto',
          birth: 1991,
          expiry: 2029,
          seal: 'AUTÊNTICO',
          weightDeclared: 51,
          weightActual: 51,
          bag: 'Caixa de ferramentas',
          xray: '⚠️ BANANAS DE DINAMITE + PAVIO!',
          speech: 'são só uns alicates e uma chave de fenda comum, confia.',
          valid: false,
          reason: 'Contrabando de explosivos detectado no Raio-X.',
        },
      ],
    },
    {
      day: 2,
      title: 'DIA 2 — BALANÇA & VACINAÇÃO',
      rules: [
        '1. Regras do Dia 1 continuam valendo.',
        '2. Peso na Balança DEVE bater com o declarado (tolerância ±2 kg).',
        '3. Ogros e Trolls exigem Vacina Antitetânica EM DIA.',
      ],
      applicants: [
        {
          name: 'Tadeu, o Troll',
          species: 'Troll',
          origin: 'Ponte Leste',
          city: 'Pedágio 1',
          birth: 1980,
          expiry: 2029,
          seal: 'AUTÊNTICO',
          vaccine: 'EM DIA',
          weightDeclared: 210,
          weightActual: 211,
          bag: 'Malote de notas',
          xray: 'Notas amassadas e um termo de cobrança.',
          speech: 'tô com a vacina, o documento e o peso certinho. me deixa trabalhar.',
          valid: true,
          reason: 'Tudo dentro das regras (tolerância ±2kg).',
        },
        {
          name: 'Elfo Suspeito',
          species: 'Elfo',
          origin: 'Bosque MEI',
          city: 'Folha Única',
          birth: 1994,
          expiry: 2028,
          seal: 'AUTÊNTICO',
          vaccine: 'EM DIA',
          weightDeclared: 62,
          weightActual: 94,
          bag: 'Capa pesada',
          xray: 'Barras de chumbo costuradas no forro.',
          speech: 'eu juro que engordei só no almoço de hoje... toma 40 créditos aí pra esquecer a balança.',
          valid: false,
          reason: 'Divergência absurda na balança (62kg vs 94kg) + contrabando.',
          bribe: 40,
        },
        {
          name: 'Bárbara, a Ogra',
          species: 'Ogro',
          origin: 'Pântano Fiscal',
          city: 'Brejo Branco',
          birth: 1988,
          expiry: 2027,
          seal: 'AUTÊNTICO',
          vaccine: 'ATRASADA',
          weightDeclared: 165,
          weightActual: 165,
          bag: 'Clava de madeira',
          xray: 'Madeira maciça sem metais.',
          speech: 'eu tenho medo de agulha moço, releva essa vacina aí.',
          valid: false,
          reason: 'Ogro sem vacina antitetânica em dia.',
        },
        {
          name: 'Sérgio, o Contador',
          species: 'Humano',
          origin: 'Vale do Boleto',
          city: 'Fatura Nova',
          birth: 1975,
          expiry: 2027,
          seal: 'AUTÊNTICO',
          vaccine: 'N/A',
          weightDeclared: 78,
          weightActual: 77,
          bag: 'Pasta executiva',
          xray: 'Calculadora científica e 400 guias de DARF.',
          speech: 'tudo declarado nos conformes. nem um centavo nem um grama fora.',
          valid: true,
          reason: 'Documentação e peso corretos.',
        },
      ],
    },
    {
      day: 3,
      title: 'DIA 3 — CRACHÁS & AUTORIZAÇÃO',
      rules: [
        '1. Regras anteriores continuam valendo.',
        '2. BLOQUEIO TOTAL: Ninguém vindo de Nárnia pode entrar.',
        '3. Nome no Passaporte DEVE ser idêntico ao do Crachá.',
        '4. Quem declara Profissão exige Autorização de Trabalho VÁLIDA.',
      ],
      applicants: [
        {
          name: 'Sr. Tumnus Jr.',
          species: 'Fauno',
          origin: 'Nárnia',
          city: 'Poste de Luz',
          birth: 1990,
          expiry: 2030,
          seal: 'AUTÊNTICO',
          badgeName: 'Sr. Tumnus Jr.',
          job: 'Visitante',
          workPermit: 'N/A',
          weightDeclared: 70,
          weightActual: 70,
          bag: 'Guarda-chuva',
          xray: 'Tecido e haste de madeira.',
          speech: 'vim só visitar o guarda-roupa, tudo legalizado!',
          valid: false,
          reason: 'Origem bloqueada (Nárnia).',
        },
        {
          name: 'Mago Patrício',
          species: 'Mago',
          origin: 'Torre Cinza',
          city: 'Cúpula Alta',
          birth: 1965,
          expiry: 2029,
          seal: 'AUTÊNTICO',
          badgeName: 'Mago Patrício',
          job: 'Alquimista',
          workPermit: 'VÁLIDA (Tipo B)',
          weightDeclared: 75,
          weightActual: 75,
          bag: 'Cajado sem bateria',
          xray: 'Tubos de ensaio vazios.',
          speech: 'tô há 4 horas nessa fila. confere minha autorização e aprova logo isso.',
          valid: true,
          reason: 'Documentação 100% válida.',
        },
        {
          name: 'Roberto Silva',
          species: 'Humano',
          origin: 'Vila do Meio',
          city: 'Praça Central',
          birth: 1986,
          expiry: 2028,
          seal: 'AUTÊNTICO',
          badgeName: 'Joberto Silva',
          job: 'Desempregado',
          workPermit: 'N/A',
          weightDeclared: 80,
          weightActual: 80,
          bag: 'Mochila escolar',
          xray: 'Documentos misturados.',
          speech: 'é que no cartório erraram meu nome no crachá, mas sou eu mesmo!',
          valid: false,
          reason: 'Divergência de nome entre passaporte e crachá.',
        },
        {
          name: 'Bruna, a Ferreira',
          species: 'Anã',
          origin: 'Ponte Leste',
          city: 'Arco de Pedra',
          birth: 1982,
          expiry: 2029,
          seal: 'AUTÊNTICO',
          badgeName: 'Bruna, a Ferreira',
          job: 'Ferreira',
          workPermit: 'VENCIDA (2024)',
          weightDeclared: 68,
          weightActual: 68,
          bag: 'Martelo pequeno',
          xray: 'Martelo de ferro comum.',
          speech: 'esqueci de renovar a autorização de trabalho, mas eu só vou bater prego!',
          valid: false,
          reason: 'Autorização de trabalho vencida.',
        },
      ],
    },
    {
      day: 4,
      title: 'DIA 4 — AUDITORIA GEOGRÁFICA & O AGENTE',
      rules: [
        '1. Regras anteriores continuam valendo.',
        '2. VERIFIQUE A ABA "REINOS & CIDADES" no Manual: a Cidade deve pertencer ao Reino declarado!',
      ],
      applicants: [
        {
          name: 'Lucas, o Bardo',
          species: 'Humano',
          origin: 'Vale do Boleto',
          city: 'Beco Torto',
          birth: 1995,
          expiry: 2028,
          seal: 'AUTÊNTICO',
          badgeName: 'Lucas, o Bardo',
          job: 'Músico',
          workPermit: 'VÁLIDA',
          weightDeclared: 71,
          weightActual: 71,
          bag: 'Alaúde',
          xray: 'Cordas de nylon e madeira.',
          speech: 'sou nascido e criado lá em Beco Torto, no Vale do Boleto!',
          valid: false,
          reason: 'Cidade "Beco Torto" pertence à Vila do Meio, não ao Vale do Boleto!',
        },
        {
          name: 'Agente K. (Anônimo)',
          species: 'Humano',
          origin: 'Torre Cinza',
          city: 'Sótão Sul',
          birth: 1978,
          expiry: 2030,
          seal: 'AUTÊNTICO',
          badgeName: 'Agente K. (Anônimo)',
          job: 'Arquivista',
          workPermit: 'VÁLIDA',
          weightDeclared: 76,
          weightActual: 76,
          bag: 'Maleta cifrada',
          xray: '📄 BILHETE NO FORRO: PROTOCOLO 01001101 01010101 01010010 01001111',
          speech: 'não pergunta nada. só passa o Raio-X na minha maleta, guarda o código binário e carimba verde.',
          valid: true,
          reason: 'Documentos impecáveis. (Pista binária registrada!)',
          isLoreSecret: true,
        },
        {
          name: 'Gorgon, o Pedreiro',
          species: 'Troll',
          origin: 'Ponte Leste',
          city: 'Viga Norte',
          birth: 1981,
          expiry: 2028,
          seal: 'AUTÊNTICO',
          vaccine: 'EM DIA',
          badgeName: 'Gorgon, o Pedreiro',
          job: 'Pedreiro',
          workPermit: 'VÁLIDA',
          weightDeclared: 205,
          weightActual: 206,
          bag: 'Saco de cimento',
          xray: 'Pó mineral comum.',
          speech: 'tudo certinho chefe, Viga Norte fica na Ponte Leste mesmo.',
          valid: true,
          reason: 'Tudo em ordem.',
        },
        {
          name: 'Sílvia, a Bruxa',
          species: 'Bruxa',
          origin: 'Bosque MEI',
          city: 'Lama Seca',
          birth: 1989,
          expiry: 2029,
          seal: 'AUTÊNTICO',
          badgeName: 'Sílvia, a Bruxa',
          job: 'Autônoma',
          workPermit: 'VÁLIDA',
          weightDeclared: 58,
          weightActual: 58,
          bag: 'Vassoura dobrável',
          xray: 'Cabo de madeira e palha.',
          speech: 'vim do Bosque MEI, lá da cidade de Lama Seca. pode confiar.',
          valid: false,
          reason: 'Lama Seca fica no Pântano Fiscal, não no Bosque MEI!',
        },
      ],
    },
    {
      day: 5,
      title: 'DIA 5 — AUDITORIA DO SISTEMA & PASSAPORTE 000-NK',
      rules: [
        '1. Regras anteriores continuam valendo.',
        '2. PROIBIDO entrar cidadãos nascidos ANTES de 1900 (exceto Magos com Licença Tipo B).',
      ],
      applicants: [
        {
          name: 'Conde Drácula Neto',
          species: 'Vampiro',
          origin: 'Pântano Fiscal',
          city: 'Imposto Velho',
          birth: 1842,
          expiry: 2030,
          seal: 'AUTÊNTICO',
          badgeName: 'Conde Drácula Neto',
          job: 'Nobre',
          workPermit: 'VÁLIDA',
          weightDeclared: 66,
          weightActual: 66,
          bag: 'Caixão portátil',
          xray: 'Terra velha e um guarda-sol.',
          speech: 'eu tenho cara de jovem mas nasci em 1842. releva aí, sangue bom.',
          valid: false,
          reason: 'Nascido antes de 1900 (1842) e não é Mago Tipo B.',
        },
        {
          name: 'Mago Arquimedes',
          species: 'Mago',
          origin: 'Torre Cinza',
          city: 'Degrau 99',
          birth: 1880,
          expiry: 2031,
          seal: 'AUTÊNTICO',
          badgeName: 'Mago Arquimedes',
          job: 'Pesquisador',
          workPermit: 'VÁLIDA (Tipo B)',
          weightDeclared: 69,
          weightActual: 70,
          bag: 'Grimório antigo',
          xray: 'Pergaminhos e óculos reservas.',
          speech: 'sim, nasci em 1880. e sim, tenho a Licença Tipo B bem ali no documento.',
          valid: true,
          reason: 'Exceção válida: Mago com Licença Tipo B.',
        },
        {
          name: 'Inspetor-Chefe Vagner',
          species: 'Humano',
          origin: 'Vila do Meio',
          city: 'Mercado Baixo',
          birth: 1972,
          expiry: 2029,
          seal: 'FALSO (Tinta Brilhante)',
          badgeName: 'Inspetor-Chefe Vagner',
          job: 'Auditor',
          workPermit: 'VÁLIDA',
          weightDeclared: 85,
          weightActual: 85,
          bag: 'Pasta de auditoria',
          xray: 'Prancheta e carimbos falsos.',
          speech: 'sou o Inspetor-Chefe! me aprova imediatamente ou te demito! (Teste de integridade)',
          valid: false,
          reason: 'Selo FALSO no passaporte do próprio auditor!',
        },
        {
          name: 'Sujeito 000-NK',
          species: 'Desconhecido',
          origin: 'Torre Cinza',
          city: 'Cúpula Alta',
          birth: 1929,
          expiry: 2035,
          seal: 'AUTÊNTICO',
          badgeName: 'Sujeito 000-NK',
          job: 'Portador',
          workPermit: 'VÁLIDA',
          weightDeclared: 72,
          weightActual: 72,
          bag: 'Envelope lacrado do Sistema',
          xray: '🔐 GRAVADO NO METAL: CÉSAR +3 → EHUOLP',
          speech: 'não olha pra minha cara. olha pro Raio-X do envelope e fecha logo esse plantão.',
          valid: true,
          reason: 'Passaporte autorizado pelo núcleo. (Pista César +3 registrada!)',
          isLoreSecret: true,
        },
      ],
    },
  ];

  let dayIdx = 0;
  let appIdx = 0;
  let errors = 0;
  let credits = 0;
  let activeTab = 'rules'; // 'rules' | 'cities' | 'seals'
  let usedXray = false;
  let usedScale = false;

  app.innerHTML = `
    <div class="story-shell">
      <button type="button" class="story-back-btn" id="s1-back">← Voltar para a Caverna</button>
      <div class="operator-feed story-log-sepia">
        <span class="operator-tag">interfone</span>
        <span id="operator-msg"></span>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1.15fr; gap:16px; background:#d6c3a1; border:4px solid #1c130a; padding:18px; box-shadow:6px 6px 0 #140e08;">
        <div style="display:flex; flex-direction:column; gap:10px;">
          <div style="background:#24190c; color:#f5e6c8; padding:10px; font-weight:bold; font-size:13px; display:flex; justify-content:space-between;">
            <span id="s1-day-title"></span>
            <span id="s1-credits">💰 0 cr</span>
          </div>

          <div style="display:flex; gap:4px;">
            <button type="button" class="s1-tab" data-tab="rules" style="flex:1; padding:6px; background:#453522; color:#f5e6c8; border:1px solid #1c130a; font-family:inherit; font-size:11px; cursor:inherit;">📜 Regras</button>
            <button type="button" class="s1-tab" data-tab="cities" style="flex:1; padding:6px; background:#785a3a; color:#f5e6c8; border:1px solid #1c130a; font-family:inherit; font-size:11px; cursor:inherit;">🗺️ Reinos</button>
            <button type="button" class="s1-tab" data-tab="seals" style="flex:1; padding:6px; background:#785a3a; color:#f5e6c8; border:1px solid #1c130a; font-family:inherit; font-size:11px; cursor:inherit;">🔍 Selos</button>
          </div>

          <div style="background:#efe3cc; border:2px solid #785a3a; padding:10px; font-size:11.5px; min-height:92px;" id="s1-manual-body"></div>

          <div style="background:#3a2b1a; color:#f5e6c8; padding:12px; border:2px solid #1c130a; min-height:110px;">
            <div style="font-size:10px; opacity:0.75; margin-bottom:4px;">GUICHÊ DE ATENDIMENTO</div>
            <div style="font-size:15px; font-weight:bold; margin-bottom:6px;" id="s1-app-name"></div>
            <div style="font-size:12.5px; font-style:italic; line-height:1.4;" id="s1-app-speech"></div>
          </div>

          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" id="s1-scale-btn" style="flex:1; padding:8px; background:#453522; color:#f5e6c8; border:2px solid #1c130a; font-family:inherit; font-weight:bold; font-size:12px; cursor:inherit;">⚖️ Balança</button>
            <button type="button" id="s1-xray-btn" style="flex:1; padding:8px; background:#1e293b; color:#38bdf8; border:2px solid #0f172a; font-family:inherit; font-weight:bold; font-size:12px; cursor:inherit;">🩻 Raio-X Bagagem</button>
          </div>
          <div id="s1-tool-readout" style="background:#1c130a; color:#fde047; padding:8px; font-size:12px; min-height:34px;">Aguardando inspeção...</div>
          <div style="font-size:12px; font-weight:bold;" id="s1-score"></div>
        </div>

        <div style="background:#f5ebd6; border:2px solid #5c4328; padding:16px; display:flex; flex-direction:column; justify-content:space-between; gap:12px;">
          <div>
            <div style="border-bottom:2px dashed #8c6d46; padding-bottom:6px; margin-bottom:10px; font-weight:bold; font-size:14px;">DOCUMENTAÇÃO APRESENTADA</div>
            <div id="s1-passport" style="font-size:12.5px; line-height:1.65;"></div>
          </div>

          <div id="s1-bribe-box" style="display:none; background:#fef3c7; border:2px dashed #d97706; padding:8px; font-size:12px;"></div>

          <div style="display:flex; gap:12px; margin-top:8px;">
            <button type="button" id="s1-approve" style="flex:1; padding:14px; background:#15803d; color:#fff; border:3px solid #052e16; font-family:inherit; font-weight:bold; font-size:14px; cursor:inherit;">✅ APROVAR</button>
            <button type="button" id="s1-deny" style="flex:1; padding:14px; background:#b91c1c; color:#fff; border:3px solid #450a0a; font-family:inherit; font-weight:bold; font-size:14px; cursor:inherit;">❌ NEGAR</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('s1-back')?.addEventListener('click', () => returnToCave(caveState));

  setOperatorRemark(
    'Atenção, Inspetor. Bem-vindo ao seu turno na Portaria do Submundo. Confira o Manual à esquerda, use a Balança e o Raio-X na bagagem e carimbe APROVAR ou NEGAR. Três infrações causam demissão.',
    { delayBefore: 200, priority: 'urgent' }
  );

  function renderManualTab() {
    const body = document.getElementById('s1-manual-body');
    if (!body) return;
    app.querySelectorAll('.s1-tab').forEach((t) => {
      t.style.background = t.getAttribute('data-tab') === activeTab ? '#24190c' : '#785a3a';
    });

    if (activeTab === 'rules') {
      body.innerHTML = DAYS[dayIdx].rules.map((r) => `<div>${r}</div>`).join('');
    } else if (activeTab === 'cities') {
      body.innerHTML = Object.entries(KINGDOM_CITIES)
        .map(([k, cities]) => `<div><strong>${k}:</strong> ${cities.join(', ')}</div>`)
        .join('');
    } else {
      body.innerHTML = `
        <div><strong>✅ AUTÊNTICO:</strong> Válido para entrada.</div>
        <div><strong>❌ RASURADO / FALSO:</strong> Negar imediatamente.</div>
        <div><strong>⚠️ DICA:</strong> Sempre cheque o Raio-X no Dia 4 e 5!</div>
      `;
    }
  }

  app.querySelectorAll('.s1-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      playBeep();
      activeTab = btn.getAttribute('data-tab');
      renderManualTab();
    });
  });

  function renderApplicant() {
    const dayObj = DAYS[dayIdx];
    const person = dayObj.applicants[appIdx];
    usedXray = false;
    usedScale = false;

    document.getElementById('s1-day-title').textContent = `${dayObj.title} (${appIdx + 1}/${dayObj.applicants.length})`;
    document.getElementById('s1-credits').textContent = `💰 ${credits} cr`;
    document.getElementById('s1-app-name').textContent = `${person.name} [${person.species}]`;
    document.getElementById('s1-app-speech').textContent = `"${person.speech}"`;
    document.getElementById('s1-tool-readout').textContent = 'Aguardando inspeção...';
    document.getElementById('s1-score').textContent = `Infrações cometidas: ${errors}/3`;

    const bribeBox = document.getElementById('s1-bribe-box');
    if (person.bribe) {
      bribeBox.style.display = 'block';
      bribeBox.innerHTML = `💵 Oferta de suborno: <strong>+${person.bribe} créditos</strong> se você ignorar as regras e clicar em Aprovar.`;
    } else {
      bribeBox.style.display = 'none';
    }

    document.getElementById('s1-passport').innerHTML = `
      <div><strong>Nome (Passaporte):</strong> ${person.name}</div>
      ${person.badgeName ? `<div><strong>Nome (Crachá):</strong> ${person.badgeName}</div>` : ''}
      <div><strong>Nascimento:</strong> ${person.birth}</div>
      <div><strong>Reino:</strong> ${person.origin}</div>
      <div><strong>Cidade:</strong> ${person.city}</div>
      <div><strong>Validade:</strong> ${person.expiry}</div>
      <div><strong>Selo:</strong> ${person.seal}</div>
      <div><strong>Peso Declarado:</strong> ${person.weightDeclared} kg</div>
      ${person.vaccine ? `<div><strong>Vacina Antitetânica:</strong> ${person.vaccine}</div>` : ''}
      ${person.job ? `<div><strong>Profissão:</strong> ${person.job} | <strong>Autorização:</strong> ${person.workPermit}</div>` : ''}
      <div><strong>Bagagem:</strong> ${person.bag}</div>
    `;
    renderManualTab();
  }

  document.getElementById('s1-scale-btn')?.addEventListener('click', () => {
    playBeep();
    const person = DAYS[dayIdx].applicants[appIdx];
    usedScale = true;
    document.getElementById('s1-tool-readout').textContent = `⚖️ Balança física: ${person.weightActual} kg (Declarado: ${person.weightDeclared} kg)`;
  });

  document.getElementById('s1-xray-btn')?.addEventListener('click', () => {
    playBeep();
    const person = DAYS[dayIdx].applicants[appIdx];
    usedXray = true;
    document.getElementById('s1-tool-readout').textContent = `🩻 Raio-X: ${person.xray}`;
    if (person.isLoreSecret) {
      setOperatorRemark('Aviso do Scanner: código anômalo detectado no forro. Mantenha o protocolo padrão.', { priority: 'action' });
    }
  });

  async function decide(approved) {
    playBeep();
    const dayObj = DAYS[dayIdx];
    const person = dayObj.applicants[appIdx];

    if (approved === person.valid) {
      credits += 25;
      setOperatorRemark(approved ? 'Entrada autorizada dentro das normas. +25 créditos. Próximo.' : `Entrada barrada conforme o regulamento: ${person.reason}`, { priority: 'action' });
    } else {
      errors += 1;
      if (approved && person.bribe) {
        credits += person.bribe;
        setOperatorRemark('ALERTA DE CORRUPÇÃO: Suborno detectado no guichê! Infração registrada.', { priority: 'urgent' });
      } else {
        setOperatorRemark(`INFRAÇÃO (${errors}/3): ${person.reason}`, { priority: 'urgent' });
      }
      if (errors >= 3) {
        dayIdx = 0;
        appIdx = 0;
        errors = 0;
        credits = 0;
        setOperatorRemark('TRÊS INFRAÇÕES! Você foi demitido e rebaixado ao Dia 1.', { priority: 'urgent' });
        renderApplicant();
        return;
      }
    }

    appIdx += 1;
    if (appIdx >= dayObj.applicants.length) {
      dayIdx += 1;
      appIdx = 0;
      if (dayIdx >= DAYS.length) {
        setOperatorRemark('Auditoria de 5 dias concluída. Registro oficial do turno emitido (Livro I).', { priority: 'urgent' });
        await finishStory();
        return;
      }
      setOperatorRemark(`Fim do Dia ${dayIdx}. Novas diretrizes burocráticas foram adicionadas ao manual para amanhã.`, { priority: 'action' });
    }
    renderApplicant();
  }

  document.getElementById('s1-approve')?.addEventListener('click', () => decide(true));
  document.getElementById('s1-deny')?.addEventListener('click', () => decide(false));

  renderApplicant();
}
