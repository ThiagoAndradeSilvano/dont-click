// ============================================================================
// CONTO 1: FRONTEIRA DA BUROCRACIA — ALFÂNDEGA DE DESCARTE (PAPERS, PLEASE REAL!)
// Hub largo de cabine, persiana metálica, alavanca PRÓXIMO!, documentos arrastáveis na mesa,
// brasões gráficos reais (sem entregar "FALSO" em texto!), modo Discrepância + Interrogatório + DETER,
// Scanner Raio-X visual, Cartaz de Procurados, Lanterna UV, Impressora Térmica de Multa e Contas Noturnas!
// ============================================================================

export function runStory1Burocracia({ app, setOperatorRemark, playBeep, finishStory, returnToCave, caveState }) {
  document.body.className = 'story-mode-1';

  // ---- ÁUDIO DEDICADO DA CABINE (Web Audio API — zero dependência externa!) ----
  let boothAudio = null;
  function getAudio() {
    try {
      if (!boothAudio) {
        const AC = window.AudioContext || window.webkitAudioContext;
        boothAudio = new AC();
      }
      if (boothAudio.state === 'suspended') boothAudio.resume();
      return boothAudio;
    } catch {
      return null;
    }
  }

  function playMegaphoneCall() {
    const ctx = getAudio();
    if (!ctx) return;
    // Clássico "BÉÉÉ-DÃÃ" abafado de alto-falante de fronteira!
    [
      [290, 0, 0.16],
      [215, 0.18, 0.28],
    ].forEach(([freq, delay, dur]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
      filter.type = 'bandpass';
      filter.frequency.value = 680;
      gain.gain.setValueAtTime(0.13, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + dur + 0.02);
    });
  }

  function playShutterClank() {
    const ctx = getAudio();
    if (!ctx) return;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.22, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420;
    const g = ctx.createGain();
    g.gain.value = 0.22;
    src.connect(lp);
    lp.connect(g);
    g.connect(ctx.destination);
    src.start();
  }

  function playPaperSlide() {
    const ctx = getAudio();
    if (!ctx) return;
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.09, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) {
      d[i] = (Math.random() * 2 - 1) * 0.35 * (1 - i / d.length);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 1800;
    const g = ctx.createGain();
    g.gain.value = 0.1;
    src.connect(hp);
    hp.connect(g);
    g.connect(ctx.destination);
    src.start();
  }

  function playHeavyStampSound() {
    const ctx = getAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(145, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(42, ctx.currentTime + 0.11);
    g.gain.setValueAtTime(0.32, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
    playShutterClank();
  }

  function playCitationPrinter() {
    const ctx = getAudio();
    if (!ctx) return;
    for (let i = 0; i < 6; i++) {
      const t = ctx.currentTime + i * 0.09;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(520 + (i % 2) * 90, t);
      g.gain.setValueAtTime(0.07, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
      osc.connect(g);
      g.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.055);
    }
  }

  function playIntercomTick() {
    const ctx = getAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(340 + Math.random() * 60, ctx.currentTime);
    g.gain.setValueAtTime(0.018, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.018);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.02);
  }

  // ---- GEOGRAFIA OFICIAL & BRASÕES GRÁFICOS (Sem entregar "FALSO" escrito!) ----
  const KINGDOMS = {
    'Vale do Boleto': {
      cls: 'kingdom-boleto',
      cities: ['Serasa Sul', 'Carnê Alto', 'Fatura Nova'],
      emblemDesc: 'Triângulo apontando para CIMA com 3 estrelas no topo',
    },
    'Pântano Fiscal': {
      cls: 'kingdom-pantano',
      cities: ['Lama Seca', 'Brejo Branco', 'Imposto Velho'],
      emblemDesc: 'Losango duplo com cruz central',
    },
    'Bosque MEI': {
      cls: 'kingdom-bosque',
      cities: ['Pinheiro Simples', 'Folha Única', 'Ramo Verde'],
      emblemDesc: 'Árvore de 2 copas com sol à DIREITA',
    },
    'Ponte Leste': {
      cls: 'kingdom-ponte',
      cities: ['Pedágio 1', 'Arco de Pedra', 'Viga Norte'],
      emblemDesc: 'Arco de pedra com 2 pilares verticais',
    },
    'Torre Cinza': {
      cls: 'kingdom-torre',
      cities: ['Cúpula Alta', 'Degrau 99', 'Sótão Sul'],
      emblemDesc: 'Torre com olho central ABERTO',
    },
    'Vila do Meio': {
      cls: 'kingdom-vila',
      cities: ['Praça Central', 'Beco Torto', 'Mercado Baixo'],
      emblemDesc: 'Engrenagem de 4 pontas com círculo interno',
    },
  };

  // Desenha o Brasão SVG Real ou Falsificado (invertido / faltando peça!)
  function renderSealSvg(kingdom, isForged = false, size = 38) {
    const color = '#5b2323';
    let inner = '';
    if (kingdom === 'Vale do Boleto') {
      // Verdadeiro: triângulo pra cima + 3 bolinhas | Falso: triângulo pra BAIXO + 1 bolinha!
      inner = isForged
        ? `<polygon points="12,14 28,14 20,29" fill="none" stroke="${color}" stroke-width="2"/><circle cx="20" cy="10" r="2" fill="${color}"/>`
        : `<polygon points="20,12 11,27 29,27" fill="none" stroke="${color}" stroke-width="2"/><circle cx="14" cy="9" r="1.6" fill="${color}"/><circle cx="20" cy="7.5" r="1.6" fill="${color}"/><circle cx="26" cy="9" r="1.6" fill="${color}"/>`;
    } else if (kingdom === 'Pântano Fiscal') {
      inner = isForged
        ? `<polygon points="20,9 30,20 20,31 10,20" fill="none" stroke="${color}" stroke-width="2"/>` // sem cruz!
        : `<polygon points="20,9 30,20 20,31 10,20" fill="none" stroke="${color}" stroke-width="2"/><line x1="14" y1="20" x2="26" y2="20" stroke="${color}" stroke-width="2"/><line x1="20" y1="14" x2="20" y2="26" stroke="${color}" stroke-width="2"/>`;
    } else if (kingdom === 'Bosque MEI') {
      // Verdadeiro: sol à direita | Falso: sol à ESQUERDA e 1 copa só!
      inner = isForged
        ? `<line x1="22" y1="15" x2="22" y2="30" stroke="${color}" stroke-width="2.2"/><circle cx="22" cy="16" r="5" fill="none" stroke="${color}" stroke-width="2"/><circle cx="12" cy="11" r="2.5" fill="${color}"/>`
        : `<line x1="18" y1="14" x2="18" y2="30" stroke="${color}" stroke-width="2.2"/><polygon points="18,9 12,18 24,18" fill="none" stroke="${color}" stroke-width="1.8"/><polygon points="18,15 11,24 25,24" fill="none" stroke="${color}" stroke-width="1.8"/><circle cx="27" cy="11" r="2.5" fill="${color}"/>`;
    } else if (kingdom === 'Ponte Leste') {
      inner = isForged
        ? `<path d="M 10 16 Q 20 28 30 16" fill="none" stroke="${color}" stroke-width="2.2"/>` // arco invertido sem pilares!
        : `<path d="M 10 26 Q 20 11 30 26" fill="none" stroke="${color}" stroke-width="2.2"/><line x1="13" y1="20" x2="13" y2="29" stroke="${color}" stroke-width="2.2"/><line x1="27" y1="20" x2="27" y2="29" stroke="${color}" stroke-width="2.2"/>`;
    } else if (kingdom === 'Torre Cinza') {
      inner = isForged
        ? `<rect x="14" y="11" width="12" height="19" fill="none" stroke="${color}" stroke-width="2"/><line x1="16" y1="18" x2="24" y2="22" stroke="${color}" stroke-width="2"/><line x1="24" y1="18" x2="16" y2="22" stroke="${color}" stroke-width="2"/>` // X em vez de olho!
        : `<rect x="14" y="11" width="12" height="19" fill="none" stroke="${color}" stroke-width="2"/><ellipse cx="20" cy="20" rx="4" ry="2.5" fill="none" stroke="${color}" stroke-width="1.6"/><circle cx="20" cy="20" r="1.3" fill="${color}"/>`;
    } else {
      inner = isForged
        ? `<circle cx="20" cy="20" r="7" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="3 3"/>`
        : `<circle cx="20" cy="20" r="6.5" fill="none" stroke="${color}" stroke-width="2"/><circle cx="20" cy="20" r="2.2" fill="${color}"/><line x1="20" y1="10" x2="20" y2="13" stroke="${color}" stroke-width="2.2"/><line x1="20" y1="27" x2="20" y2="30" stroke="${color}" stroke-width="2.2"/><line x1="10" y1="20" x2="13" y2="20" stroke="${color}" stroke-width="2.2"/><line x1="27" y1="20" x2="30" y2="20" stroke="${color}" stroke-width="2.2"/>`;
    }

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style="display:block;">
        <circle cx="20" cy="20" r="17.5" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="4 1.5"/>
        <circle cx="20" cy="20" r="14.5" fill="none" stroke="${color}" stroke-width="1"/>
        ${inner}
      </svg>
    `;
  }

  // Gerador de Retratos Pixel/SVG Expressivos (Permite foto de passaporte diferente da cara real!)
  function renderPortraitSvg(look = {}, scale = 1) {
    const {
      skin = '#c69c72',
      coat = '#2b3336',
      hair = 'short', // 'short' | 'bald' | 'long' | 'hood' | 'horns' | 'hat' | 'glitch'
      hairColor = '#1e1915',
      glasses = false,
      beard = false,
      scar = false,
      eyes = 'normal', // 'normal' | 'narrow' | 'wide' | 'hollow'
    } = look;

    const w = Math.round(130 * scale);
    const h = Math.round(150 * scale);

    let hairSvg = '';
    if (hair === 'short') hairSvg = `<path d="M36 44 Q65 22 94 44 L92 54 Q65 40 38 54 Z" fill="${hairColor}"/>`;
    if (hair === 'long') hairSvg = `<path d="M32 45 Q65 18 98 45 L102 102 L88 102 L88 56 Q65 40 42 56 L42 102 L28 102 Z" fill="${hairColor}"/>`;
    if (hair === 'hood') hairSvg = `<path d="M24 115 L30 36 Q65 14 100 36 L106 115 L88 115 L86 50 Q65 36 44 50 L42 115 Z" fill="#18181b"/>`;
    if (hair === 'horns') hairSvg = `<polygon points="38,44 26,18 48,36" fill="#451a03"/><polygon points="92,44 104,18 82,36" fill="#451a03"/>`;
    if (hair === 'hat') hairSvg = `<rect x="24" y="38" width="82" height="8" fill="#1c1917"/><rect x="40" y="18" width="50" height="22" fill="#292524"/>`;
    if (hair === 'glitch') hairSvg = `<rect x="34" y="28" width="62" height="16" fill="#09090b"/><rect x="28" y="36" width="24" height="6" fill="#dc2626"/>`;

    const eyeSvg =
      eyes === 'hollow'
        ? `<rect x="46" y="59" width="11" height="8" fill="#09090b"/><rect x="73" y="59" width="11" height="8" fill="#09090b"/><circle cx="51" cy="63" r="1.5" fill="#ef4444"/><circle cx="78" cy="63" r="1.5" fill="#ef4444"/>`
        : eyes === 'narrow'
          ? `<line x1="47" y1="63" x2="57" y2="63" stroke="#18120c" stroke-width="3"/><line x1="73" y1="63" x2="83" y2="63" stroke="#18120c" stroke-width="3"/>`
          : `<circle cx="52" cy="63" r="3.2" fill="#18120c"/><circle cx="78" cy="63" r="3.2" fill="#18120c"/>`;

    const glassesSvg = glasses
      ? `<rect x="44" y="57" width="16" height="12" fill="none" stroke="#1c1917" stroke-width="2"/><rect x="70" y="57" width="16" height="12" fill="none" stroke="#1c1917" stroke-width="2"/><line x1="60" y1="63" x2="70" y2="63" stroke="#1c1917" stroke-width="2"/>`
      : '';

    const beardSvg = beard ? `<path d="M42 78 Q65 104 88 78 L84 94 Q65 108 46 94 Z" fill="${hairColor}" opacity="0.88"/>` : '';
    const scarSvg = scar ? `<line x1="74" y1="51" x2="83" y2="75" stroke="#7f1d1d" stroke-width="2.2"/>` : '';

    return `
      <svg width="${w}" height="${h}" viewBox="0 0 130 150" xmlns="http://www.w3.org/2000/svg" style="display:block;">
        <!-- Ombros / Casaco -->
        <path d="M16 150 L24 106 Q65 96 106 106 L114 150 Z" fill="${coat}" stroke="#120e0a" stroke-width="2.5"/>
        <rect x="54" y="92" width="22" height="18" fill="${skin}"/>
        <!-- Rosto -->
        <rect x="38" y="38" width="54" height="60" rx="14" fill="${skin}" stroke="#291d12" stroke-width="2.2"/>
        ${beardSvg}
        ${eyeSvg}
        ${glassesSvg}
        ${scarSvg}
        <!-- Nariz e Boca séria -->
        <line x1="65" y1="63" x2="63" y2="75" stroke="#4a3520" stroke-width="2"/>
        <line x1="55" y1="84" x2="75" y2="84" stroke="#291d12" stroke-width="2.4"/>
        ${hairSvg}
      </svg>
    `;
  }

  // ---- OS 5 DIAS COMPLETOS COM PROGRESSÃO REAL DE MECÂNICAS & LORE ----
  // Data oficial do posto: 24/11/2026
  const CURRENT_DATE_STR = '24.11.2026';

  const DAYS = [
    {
      day: 1,
      codeTitle: 'DIA 1 — REABERTURA DA ALFÂNDEGA DE DESCARTE',
      bulletin:
        'BOLETIM OFICIAL Nº 01:\nTodo pacote de memória e entidade descartada deve apresentar PASSAPORTE válido (>= 2026) e BRASÃO AUTÊNTICO do Reino (confira a aba Brasões no Manual!).\nSalário: +10 cr por acerto. Custo diário da cabine: 20 cr.',
      supervisorIntro:
        'KSHHH— Posto 04 ativo. Chame o primeiro da fila no botão vermelho PRÓXIMO!, confira a data de validade e o desenho do brasão no Manual, bata o carimbo na gaveta à direita e devolva o passaporte pela fresta.',
      logIntro:
        'mano... que porra de lugar é esse?! a gente entrou num livro e virou fiscal de alfândega num guichê caindo aos pedaços?! quem tá falando nesse interfone velho?!',
      rules: [
        '• Todo viajante deve ter PASSAPORTE.',
        '• Validade deve ser 2026 ou posterior (Data hoje: 24.11.2026).',
        '• Compare o desenho do BRASÃO no passaporte com a aba [Brasões] do Manual!',
      ],
      wanted: [],
      unlockDiscrepancy: false,
      unlockXray: false,
      unlockUV: false,
      applicants: [
        {
          name: 'Geraldo, o Contínuo',
          sex: 'M',
          birth: '1981',
          kingdom: 'Vale do Boleto',
          city: 'Serasa Sul',
          expiry: '12.2028',
          weightPass: 68,
          weightReal: 68,
          forgedSeal: false,
          look: { skin: '#d6a982', coat: '#293241', hair: 'short', hairColor: '#292018', glasses: true },
          speech: 'noite chefe. só vim arquivar uns carnês prescritos no depósito, tá tudo em dia.',
          xrayDesc: 'Apenas chaves e uma marmita vazia.',
          xrayBad: false,
          valid: true,
          violationReason: 'Documentação estava 100% regular.',
        },
        {
          name: 'Cláudio Barroso',
          sex: 'M',
          birth: '1974',
          kingdom: 'Pântano Fiscal',
          city: 'Lama Seca',
          expiry: '04.2021', // VENCIDO!
          weightPass: 92,
          weightReal: 92,
          forgedSeal: false,
          look: { skin: '#9ca87c', coat: '#3f3624', hair: 'bald', beard: true, hairColor: '#1f2419' },
          speech: 'ô meu consagrado, releva a data aí... cinco aninhos vencido não mata ninguém pô.',
          xrayDesc: 'Nada ilegal.',
          xrayBad: false,
          valid: false,
          violationReason: 'Passaporte vencido (04.2021 < 2026).',
        },
        {
          name: 'Morgana S. Faria',
          sex: 'F',
          birth: '1993',
          kingdom: 'Bosque MEI',
          city: 'Pinheiro Simples',
          expiry: '09.2028',
          weightPass: 56,
          weightReal: 56,
          forgedSeal: true, // BRASÃO DESENHADO ERRADO (Sol na esquerda e 1 copa!)
          look: { skin: '#e2bca0', coat: '#1e3f35', hair: 'long', hairColor: '#581c1c' },
          speech: 'tudo certinho viu? eu mesma mandei plastificar lá no Bosque MEI ontem.',
          xrayDesc: 'Caneta tinteiro usada pra falsificar carimbo.',
          xrayBad: false,
          valid: false,
          violationReason: 'Brasão falsificado do Bosque MEI (desenho adulterado).',
          logReactAfter: 'caralho vc viu o carimbo torto ou só chutou? tem até falsificador de documento dentro dessa merda kkkkk',
        },
      ],
    },
    {
      day: 2,
      codeTitle: 'DIA 2 — BALANÇA DIGITAL, DISCREPÂNCIAS & RAIO-X',
      bulletin:
        'BOLETIM OFICIAL Nº 02:\nContrabandistas estão entrando com carga oculta no corpo.\nNOVO EQUIPAMENTO LIBERADO: Modo [🔍 DISCREPÂNCIA] e [🩻 RAIO-X].\nSe o PESO no visor LED diferir em mais de 3kg do Passaporte, ou a CIDADE não pertencer ao Reino (veja aba Mapa), marque os 2 campos em [🔍 DISCREPÂNCIA] para INTERROGAR e DETER!',
      supervisorIntro:
        'KSHHH— Dia 2. Cidadãos de fora agora também exigem TICKET DE ENTRADA com data de 2026. Se achar divergência de peso, foto ou cidade, clique em [🔍 DISCREPÂNCIA] e aponte os dois itens conflitantes.',
      logIntro:
        'botaram até balança e raio-x na tua cabine agora mano... parece que esse setor inteiro foi feito pra filtrar o que presta e o que vai pro lixo do disco.',
      rules: [
        '• Regras do Dia 1 continuam valendo.',
        '• Obrigatório apresentar TICKET DE ENTRADA válido (2026).',
        '• Confira a aba [Mapa]: a Cidade deve pertencer ao Reino do passaporte.',
        '• Se Peso LED ≠ Peso Passaporte (>3kg), use [🔍 Discrepância] → Raio-X → Negar/Deter!',
      ],
      wanted: [],
      unlockDiscrepancy: true,
      unlockXray: true,
      unlockUV: false,
      applicants: [
        {
          name: 'Tadeu Pedreira',
          sex: 'M',
          birth: '1980',
          kingdom: 'Ponte Leste',
          city: 'Pedágio 1',
          expiry: '11.2029',
          weightPass: 88,
          weightReal: 89,
          forgedSeal: false,
          entryTicket: { code: 'TK-882', validYear: '2026', purpose: 'TRÂNSITO' },
          look: { skin: '#b58463', coat: '#453222', hair: 'short', beard: true, hairColor: '#1c1613' },
          speech: 'trouxe passaporte e o ticket novo que pediram hoje na rádio. confere aí.',
          xrayDesc: 'Cinto de fivela comum.',
          xrayBad: false,
          valid: true,
          violationReason: 'Viajante estava totalmente regular.',
        },
        {
          name: 'Valdir Serpente',
          sex: 'M',
          birth: '1991',
          kingdom: 'Vila do Meio',
          city: 'Beco Torto',
          expiry: '08.2029',
          weightPass: 64,
          weightReal: 96, // +32 KG DE CONTRABANDO!!
          forgedSeal: false,
          entryTicket: { code: 'TK-904', validYear: '2026', purpose: 'COMÉRCIO' },
          bribe: 35,
          look: { skin: '#cfb195', coat: '#1e293b', hair: 'hat', eyes: 'narrow' },
          speech: 'é que essa jaqueta de inverno pesa um pouquinho chefe... aceita esses 35 créditos pro café.',
          interrogateReply: 'TÁ BOM, TÁ BOM! São só umas bananas de dinamite coladas na costela, não aperta o botão vermelho!!',
          xrayDesc: '⚠️ CONTRABANDO GRAVE: 6 Bananas de Dinamite + Detonador presos ao tórax!',
          xrayBad: true,
          discrepancyType: 'weight',
          valid: false,
          canDetain: true,
          violationReason: 'Excesso de 32kg na balança com explosivos colados no corpo.',
          logReactAfter: 'o maluco tava com seis bananas de dinamite amarradas na barriga mano kkkkkkk ainda tentou te comprar no cafézinho!',
        },
        {
          name: 'Lucas Saltério',
          sex: 'M',
          birth: '1995',
          kingdom: 'Vale do Boleto',
          city: 'Lama Seca', // CIDADE DO PÂNTANO FISCAL, NÃO DO VALE DO BOLETO!
          expiry: '05.2028',
          weightPass: 71,
          weightReal: 71,
          forgedSeal: false,
          entryTicket: { code: 'TK-410', validYear: '2026', purpose: 'VISITA' },
          look: { skin: '#d8b49a', coat: '#312e81', hair: 'long', hairColor: '#3f2718' },
          speech: 'sou nascido e criado em Lama Seca, capital orgulhosa do Vale do Boleto!',
          interrogateReply: 'Como assim Lama Seca não fica no Vale do Boleto?! O cara que me vendeu esse documento me garantiu!',
          xrayDesc: 'Nenhum metal oculto.',
          xrayBad: false,
          discrepancyType: 'city',
          valid: false,
          violationReason: 'Cidade emissora "Lama Seca" pertence ao Pântano Fiscal (veja aba Mapa).',
        },
      ],
    },
    {
      day: 3,
      codeTitle: 'DIA 3 — PROCURADOS NA PAREDE & IDENTIDADE ROUBADA',
      bulletin:
        'BOLETIM OFICIAL Nº 03:\nTrês fugitivos de memória corrompida escaparam hoje cedo — confira os ROSTOS no cartaz colado na janela!\nAlém disso, trabalhadores devem portar PERMISSÃO DE TRABALHO com NOME IDÊNTICO ao Passaporte.',
      supervisorIntro:
        'KSHHH— Dia 3. Fixamos o Cartaz de Procurados no vidro da sua cabine. Compare sempre o rosto real do sujeito com a foto do passaporte e com o cartaz de procurados. Se for fugitivo, DETENHA.',
      logIntro:
        'pera aí... "fugitivos de memória corrompida"?! mano, lê nas entrelinhas o que esse supervisor tá falando... isso aqui não é só um conto bobo não.',
      rules: [
        '• Regras anteriores continuam valendo.',
        '• Compare o ROSTO na janela com o Cartaz de PROCURADOS e com a FOTO do passaporte!',
        '• Se o Ticket indicar "TRABALHO", exija PERMISSÃO DE TRABALHO com o mesmo nome e validade >= 2026.',
      ],
      wanted: [
        { name: 'Ígor Navalha', look: { skin: '#c49a76', coat: '#3f1d1d', hair: 'bald', scar: true, eyes: 'narrow' } },
        { name: 'Dona Zulmira', look: { skin: '#d9b89c', coat: '#365314', hair: 'long', glasses: true, hairColor: '#52525b' } },
      ],
      unlockDiscrepancy: true,
      unlockXray: true,
      unlockUV: false,
      applicants: [
        {
          name: 'Mago Patrício',
          sex: 'M',
          birth: '1968',
          kingdom: 'Torre Cinza',
          city: 'Cúpula Alta',
          expiry: '12.2030',
          weightPass: 74,
          weightReal: 74,
          forgedSeal: false,
          entryTicket: { code: 'TK-512', validYear: '2026', purpose: 'TRABALHO' },
          workPermit: { holder: 'Mago Patrício', role: 'Arquivista', until: '2028' },
          look: { skin: '#d6b498', coat: '#3b3355', hair: 'hat', beard: true, hairColor: '#71717a' },
          speech: 'trouxe o passaporte, o ticket e a permissão de arquivista. tô atrasado pro turno.',
          xrayDesc: 'Óculos reserva no bolso.',
          xrayBad: false,
          valid: true,
          violationReason: 'Todos os 3 documentos estavam corretos.',
        },
        {
          name: 'Roberto Nogueira', // mas a cara na janela é o procurado ÍGOR NAVALHA com cicatriz!
          sex: 'M',
          birth: '1985',
          kingdom: 'Ponte Leste',
          city: 'Arco de Pedra',
          expiry: '10.2028',
          weightPass: 82,
          weightReal: 82,
          forgedSeal: false,
          entryTicket: { code: 'TK-619', validYear: '2026', purpose: 'TRÂNSITO' },
          look: { skin: '#c49a76', coat: '#3f1d1d', hair: 'bald', scar: true, eyes: 'narrow' },
          photoLook: { skin: '#c49a76', coat: '#1e3a5f', hair: 'short', scar: false, eyes: 'normal' }, // foto diferente da cara!
          speech: 'cortei o cabelo hoje cedo seu guarda, por isso tô um pouco diferente da foto.',
          interrogateReply: 'Maldito cartaz!! Sai da frente que eu não vou voltar pra jaula de descarte!!',
          xrayDesc: '⚠️ Lâmina serrilhada escondida na manga!',
          xrayBad: true,
          discrepancyType: 'face',
          valid: false,
          canDetain: true,
          violationReason: 'Fugitivo procurado (Ígor Navalha) usando passaporte roubado!',
        },
        {
          name: 'Helena Viana',
          sex: 'F',
          birth: '1990',
          kingdom: 'Bosque MEI',
          city: 'Ramo Verde',
          expiry: '07.2029',
          weightPass: 61,
          weightReal: 61,
          forgedSeal: false,
          entryTicket: { code: 'TK-701', validYear: '2026', purpose: 'TRABALHO' },
          workPermit: { holder: 'Heloísa Viana', role: 'Botânica', until: '2027' }, // NOME DIFERENTE!
          look: { skin: '#cca080', coat: '#14532d', hair: 'long', hairColor: '#291d12', glasses: true },
          speech: 'a digitação do RH trocou duas letrinhas no meu nome, mas dá um desconto vai...',
          interrogateReply: 'É permissão da minha irmã gêmea tá bom?! Eu perdi a minha na mudança!',
          xrayDesc: 'Bolsa comum sem contrabando.',
          xrayBad: false,
          discrepancyType: 'name',
          valid: false,
          violationReason: 'Divergência de nome: "Helena Viana" vs "Heloísa Viana" na Permissão.',
        },
      ],
    },
    {
      day: 4,
      codeTitle: 'DIA 4 — SURTO EPIDÊMICO & O MENSAGEIRO CIFRADO',
      bulletin:
        'BOLETIM OFICIAL Nº 04:\nDevido à praga de ferrugem no Pântano Fiscal e Vila do Meio, viajantes desses DOIS reinos exigem CERTIFICADO DE VACINAÇÃO em dia.\nAtenção redobrada a mensageiros anônimos na fila.',
      supervisorIntro:
        'KSHHH— Dia 4. Exija o cartão amarelo de vacina para qualquer um vindo do Pântano Fiscal ou Vila do Meio. E não aceite conversa paralela de encapuzados.',
      logIntro:
        'quatro dias trancado nessa cabine escura... mas fica de olho aberto, se o supervisor mandou ignorar encapuzado é justamente aí que tem caroço nesse angu.',
      rules: [
        '• Regras anteriores continuam valendo.',
        '• Viajantes de PÂNTANO FISCAL ou VILA DO MEIO devem ter CERTIFICADO DE VACINA (Lote válido 2026).',
        '• Sempre passe o Raio-X em bagagens suspeitas ou metálicas!',
      ],
      wanted: [
        { name: 'Dona Zulmira', look: { skin: '#d9b89c', coat: '#365314', hair: 'long', glasses: true, hairColor: '#52525b' } },
      ],
      unlockDiscrepancy: true,
      unlockXray: true,
      unlockUV: false,
      applicants: [
        {
          name: 'Bárbara Brejeira',
          sex: 'F',
          birth: '1988',
          kingdom: 'Pântano Fiscal',
          city: 'Brejo Branco',
          expiry: '03.2028',
          weightPass: 72,
          weightReal: 72,
          forgedSeal: false,
          entryTicket: { code: 'TK-811', validYear: '2026', purpose: 'VISITA' },
          vaccineCert: { status: 'VENCIDA (2022)', batch: 'LT-09' }, // VACINA VENCIDA!
          look: { skin: '#a3b18a', coat: '#3f3f46', hair: 'long', hairColor: '#1c1917' },
          speech: 'trouxe até o cartãozinho amarelo de vacina ó! pode bater o verde sem medo.',
          xrayDesc: 'Frascos de xarope.',
          xrayBad: false,
          valid: false,
          violationReason: 'Certificado de Vacinação vencido (2022) vindo do Pântano Fiscal.',
        },
        {
          name: 'Agente K. (Arquivista)',
          sex: 'M',
          birth: '1978',
          kingdom: 'Torre Cinza',
          city: 'Sótão Sul',
          expiry: '11.2030',
          weightPass: 75,
          weightReal: 75,
          forgedSeal: false,
          entryTicket: { code: 'TK-004', validYear: '2026', purpose: 'DIPLOMÁTICO' },
          look: { skin: '#cbb59d', coat: '#18181b', hair: 'hood', eyes: 'narrow' },
          speech: 'psiu. meus papéis tão limpos, não faz alarde... mas liga o Raio-X na minha pasta antes de me aprovar. vc vai precisar disso pro Livro.',
          xrayDesc: '📄 CHAPA METÁLICA GRAVADA (PARTE 1/2):\n01001101  01010101  01010010  01001111',
          xrayBad: false,
          isLoreSecret1: true,
          valid: true,
          violationReason: 'Agente K. possuía documentação diplomática 100% válida.',
        },
        {
          name: 'Sérgio Contábil',
          sex: 'M',
          birth: '1976',
          kingdom: 'Vila do Meio',
          city: 'Praça Central',
          expiry: '06.2029',
          weightPass: 79,
          weightReal: 79,
          forgedSeal: false,
          entryTicket: { code: 'TK-899', validYear: '2026', purpose: 'COMÉRCIO' },
          vaccineCert: { status: 'IMUNIZADO (2026)', batch: 'LT-94' },
          look: { skin: '#d4a682', coat: '#334155', hair: 'short', glasses: true, hairColor: '#27272a' },
          speech: 'sou da Vila do Meio mas tomei o reforço da vacina semana passada, tudo nos conformes.',
          xrayDesc: 'Calculadora e pastas limpas.',
          xrayBad: false,
          valid: true,
          violationReason: 'Documentação e vacina de Sérgio estavam em dia.',
        },
      ],
    },
    {
      day: 5,
      codeTitle: 'DIA 5 — AUDITORIA FINAL, LUZ NEGRA UV & SUJEITO 000-NK',
      bulletin:
        'BOLETIM OFICIAL Nº 05 (ÚLTIMO TURNO):\nFalsificadores de elite estão imprimindo passaportes perfeitos a olho nu!\nNOVO EQUIPAMENTO NA MESA: [🟣 LANTERNA UV]. Ligue a luz negra sobre a mesa: todo passaporte legítimo revela o selo fluorescente "AUTÊNTICO // SETOR 0". Se aparecer "FALSO / NULO", NEGUE ou DETENHA!',
      supervisorIntro:
        'KSHHH— Último turno da auditoria, Inspetor. Acenda a [🟣 LANTERNA UV] em TODOS os passaportes hoje. Se passar deste turno sem ser demitido, emitiremos o seu Registro Final.',
      logIntro:
        'último dia dessa loucura mano!! usa essa luz roxa aí nos papéis pra ninguém te passar a perna na reta final, vamo pegar logo esse livro e cair fora!',
      rules: [
        '• Todas as regras anteriores continuam valendo!',
        '• OBRIGATÓRIO ligar a [🟣 Lanterna UV]: passaportes reais brilham "AUTÊNTICO // SETOR 0". Se brilhar "CLONE FALSO", é fraude!',
      ],
      wanted: [
        { name: 'Dona Zulmira', look: { skin: '#d9b89c', coat: '#365314', hair: 'long', glasses: true, hairColor: '#52525b' } },
      ],
      unlockDiscrepancy: true,
      unlockXray: true,
      unlockUV: true,
      applicants: [
        {
          name: 'Auditor-Chefe Vagner',
          sex: 'M',
          birth: '1970',
          kingdom: 'Vale do Boleto',
          city: 'Fatura Nova',
          expiry: '12.2030',
          weightPass: 84,
          weightReal: 84,
          forgedSeal: false,
          uvText: '⚠️ CLONE FALSO // SEM REGISTRO', // PEGO SÓ NA LUZ UV!!
          entryTicket: { code: 'TK-999', validYear: '2026', purpose: 'AUDITORIA' },
          bribe: 80,
          look: { skin: '#cfa382', coat: '#450a0a', hair: 'short', glasses: true, beard: true, hairColor: '#3f3f46' },
          speech: 'sou o Auditor Regional! nem precisa ligar essa lanterninha roxa em mim não... toma 80 créditos de bônus e bate o verde logo!',
          interrogateReply: 'Apaga essa luz roxa seu idiota!! Quer estragar meu esquema aqui dentro?!',
          xrayDesc: 'Maleta cheia de carimbos clonados.',
          xrayBad: true,
          valid: false,
          canDetain: true,
          violationReason: 'Passaporte clonado revelado na Luz Negra UV ("CLONE FALSO") + tentativa de suborno!',
          logReactAfter: 'KKKKKKK o próprio auditor era falsificado na luz negra!! se vc cai no papinho dele já era!',
        },
        {
          name: 'Clara Mendonça', // Mas o rosto E a marca UV revelam a procurada Dona Zulmira!
          sex: 'F',
          birth: '1964',
          kingdom: 'Bosque MEI',
          city: 'Folha Única',
          expiry: '08.2028',
          weightPass: 60,
          weightReal: 60,
          forgedSeal: true,
          uvText: '⚠️ DOCUMENTO ADULTERADO',
          entryTicket: { code: 'TK-940', validYear: '2026', purpose: 'TRÂNSITO' },
          look: { skin: '#d9b89c', coat: '#365314', hair: 'long', glasses: true, hairColor: '#52525b' },
          speech: 'só uma senhorinha indo visitar os netos no bosque, meu filho...',
          xrayDesc: 'Chaves mestras no casaco.',
          xrayBad: false,
          valid: false,
          canDetain: true,
          violationReason: 'Fugitiva procurada (Dona Zulmira) + selo e UV falsos.',
        },
        {
          name: 'Sujeito 000-NK',
          sex: '?',
          birth: '1929',
          kingdom: 'Torre Cinza',
          city: 'Cúpula Alta',
          expiry: '12.2035',
          weightPass: 72,
          weightReal: 72,
          forgedSeal: false,
          uvText: 'AUTÊNTICO // CÉSAR +3 → EHUOLP', // PARTE 2 DO ENIGMA NA LUZ UV!!
          entryTicket: { code: 'TK-000', validYear: '2026', purpose: 'ARQUIVO RAIZ' },
          look: { skin: '#d4d4d8', coat: '#09090b', hair: 'glitch', eyes: 'hollow' },
          speech: '...acende a luz roxa no meu passaporte. junta com os números do Agente K. de ontem... e me deixa passar.',
          xrayDesc: '🔐 RAIO-X E LUZ UV CONFIRMAM: CÉSAR +3 → EHUOLP (Documentos autênticos do núcleo!)',
          xrayBad: false,
          isLoreSecret2: true,
          valid: true,
          violationReason: 'Sujeito 000-NK tinha autorização autêntica de Arquivo Raiz.',
        },
      ],
    },
  ];

  // ---- ESTADO DO JOGO ----
  let dayIdx = 0;
  let appIdx = -1; // começa precisando chamar o 1º no botão PRÓXIMO!
  let credits = 30;
  let citationsToday = 0;
  let totalApprovedToday = 0;
  let totalDetainedToday = 0;

  let travelerState = 'waiting_call'; // 'waiting_call' | 'present' | 'stamped' | 'transitioning'
  let currentStamp = null; // 'approved' | 'denied' | null
  let stampBarOpen = false;
  let inspectMode = false;
  let selectedDiscFields = [];
  let discrepancyVerified = false;
  let canDetainNow = false;
  let uvOn = false;
  let xrayActive = false;
  let activeRuleTab = 'rules'; // 'rules' | 'map' | 'seals'
  let capturedClue1 = false;
  let capturedClue2 = false;
  let topZ = 15;

  // ---- MONTAGEM DO HUB COMPLETO ----
  app.innerHTML = `
    <div class="story-shell pp-shell">
      <div class="operator-feed story-main-log">
        <span class="operator-tag">log</span>
        <span id="operator-msg"></span>
      </div>

      <div class="pp-topbar">
        <button type="button" class="story-back-btn" id="pp-back-cave">← Voltar para a Caverna</button>
        <div class="pp-status-pills">
          <div class="pp-pill" id="pp-hud-day">DIA 1 / 5</div>
          <div class="pp-pill" id="pp-hud-queue">FILA: 3 RESTANTES</div>
          <div class="pp-pill gold" id="pp-hud-credits">💰 30 CRÉDITOS</div>
          <div class="pp-pill warn" id="pp-hud-citations">⚠️ MULTAS HOJE: 0 / 3</div>
        </div>
      </div>

      <div class="pp-booth-grid" id="pp-booth-grid">
        <!-- ESQUERDA: FILA + JANELA DA CABINE + BOTÕES TÁTICOS + MANUAL -->
        <div class="pp-left-col">
          <div class="pp-queue-strip">
            <div class="pp-queue-silhouettes" id="pp-queue-silhouettes"></div>
            <button type="button" class="pp-megaphone-btn pulse-call" id="pp-next-btn">📢 PRÓXIMO!</button>
          </div>

          <div class="pp-booth-window" id="pp-window">
            <div class="pp-window-bars"></div>
            <div id="pp-wanted-mount"></div>
            <div class="pp-speech-bubble" id="pp-speech" style="display:none;"></div>

            <div class="pp-traveler-stage" id="pp-traveler-stage"></div>

            <div class="pp-xray-screen" id="pp-xray-screen">
              <div style="font-size:11px; letter-spacing:1px; margin-bottom:6px; color:#6ee7b7;">[ SCANNER CORPORAL // RAIO-X ]</div>
              <div id="pp-xray-text" style="font-size:12.5px; line-height:1.45; font-weight:bold; white-space:pre-line;"></div>
              <button type="button" id="pp-xray-close" style="margin-top:10px; background:#064e3b; color:#ecfdf5; border:1px solid #34d399; padding:4px 10px; font-family:inherit; font-size:11px; cursor:inherit;">Fechar Scanner</button>
            </div>

            <div class="pp-shutter" id="pp-shutter">POSTO 04 // FECHADO</div>
          </div>

          <div class="pp-counter-leds">
            <div class="pp-led-box pp-field" data-disc-key="today_date" title="Data Oficial no Relógio da Cabine">
              <span style="opacity:0.7; font-size:10px;">DATA:</span>
              <span>${CURRENT_DATE_STR}</span>
            </div>
            <div class="pp-led-box pp-field" id="pp-led-weight" data-disc-key="real_weight" title="Balança do Piso da Cabine">
              <span style="opacity:0.7; font-size:10px;">PESO:</span>
              <span id="pp-weight-val">-- KG</span>
            </div>
          </div>

          <div class="pp-booth-tools" id="pp-tools-bar">
            <button type="button" class="pp-tool-btn" id="pp-btn-disc" disabled>🔍 DISCREPÂNCIA</button>
            <button type="button" class="pp-tool-btn" id="pp-btn-xray" disabled>🩻 RAIO-X</button>
            <button type="button" class="pp-tool-btn" id="pp-btn-uv" style="display:none;">🟣 LANTERNA UV</button>
            <button type="button" class="pp-tool-btn" id="pp-btn-interrogate" style="display:none; background:#7c2d12; color:#ffedd5;">🎙️ INTERROGAR</button>
            <button type="button" class="pp-tool-btn detain-btn" id="pp-btn-detain" style="display:none;">🚨 DETER VIAJANTE (GUARDAS!)</button>
          </div>

          <div class="pp-rulebook">
            <div class="pp-rulebook-tabs">
              <button type="button" class="pp-rb-tab active" data-rbtab="rules">📜 Regras</button>
              <button type="button" class="pp-rb-tab" data-rbtab="map">🗺️ Mapa</button>
              <button type="button" class="pp-rb-tab" data-rbtab="seals">🛡️ Brasões</button>
              <button type="button" class="pp-rb-tab" data-rbtab="notes">🔐 Notas</button>
            </div>
            <div class="pp-rulebook-content" id="pp-rb-body"></div>
          </div>
        </div>

        <!-- DIREITA: MESA GRANDE DE MADEIRA + DOCUMENTOS ARRASTÁVEIS + CARIMBOS -->
        <div class="pp-desk-surface" id="pp-desk">
          <div class="pp-drop-slot">
            <span>🪟 FRESTA DE DEVOLUÇÃO:</span>
            <button type="button" class="pp-give-btn" id="pp-give-btn" disabled>Entregar Passaporte Carimbado ↩</button>
          </div>

          <div id="pp-docs-layer"></div>

          <!-- Gaveta lateral deslizante dos 2 Carimbos Pesados -->
          <div class="pp-stamp-bar" id="pp-stamp-bar">
            <button type="button" class="pp-stamp-tab" id="pp-stamp-toggle">CARIMBOS</button>
            <div class="pp-stamp-body">
              <button type="button" class="pp-heavy-stamp green" id="pp-stamp-approve" disabled>
                <span style="font-size:18px;">✅</span>
                <span>APROVAR</span>
              </button>
              <button type="button" class="pp-heavy-stamp red" id="pp-stamp-deny" disabled>
                <span style="font-size:18px;">❌</span>
                <span>NEGAR</span>
              </button>
            </div>
          </div>

          <div id="pp-citation-mount"></div>
        </div>

        <!-- Overlay de Boletim Matinal / Contas da Noite -->
        <div id="pp-overlay-mount"></div>
      </div>

      <div class="story-npc-feed story-log-sepia">
        <span class="story-npc-tag">supervisor</span>
        <span id="story-npc-msg"></span>
      </div>
    </div>
  `;

  // ---- SISTEMA SINCRONIZADO DE VOZES (Supervisor primeiro -> pausa humana -> `log` sem atropelar!) ----
  let intercomSeq = 0;
  let isAlive = true;

  async function saySupervisor(text) {
    const mySeq = ++intercomSeq;
    const el = document.getElementById('story-npc-msg');
    if (!el) return;
    el.textContent = '';
    for (let i = 0; i < text.length; i++) {
      if (!isAlive || mySeq !== intercomSeq) return;
      el.textContent += text[i];
      if (i % 2 === 0 && text[i] !== ' ') playIntercomTick();
      await new Promise((r) => setTimeout(r, 16));
    }
  }

  async function supervisorThenLog(supText, logText = null, logPriority = 'action') {
    const expected = intercomSeq + 1;
    await saySupervisor(supText);
    if (!isAlive || expected !== intercomSeq || !logText) return;
    await new Promise((r) => setTimeout(r, 700));
    if (!isAlive || expected !== intercomSeq) return;
    setOperatorRemark(logText, { priority: logPriority });
  }

  document.getElementById('pp-back-cave')?.addEventListener('click', () => {
    isAlive = false;
    intercomSeq++;
    returnToCave(caveState);
  });

  // ---- TORNA QUALQUER DOCUMENTO NA MESA ARRASTÁVEL COM O MOUSE! ----
  function makeDraggable(el) {
    let dragging = false;
    let startX = 0;
    let startY = 0;
    let origLeft = 0;
    let origTop = 0;

    el.addEventListener('pointerdown', (e) => {
      if (inspectMode && e.target.closest('.pp-field')) return;
      if (e.target.closest('button')) return;
      dragging = true;
      el.style.zIndex = String(++topZ);
      startX = e.clientX;
      startY = e.clientY;
      origLeft = parseFloat(el.style.left) || 0;
      origTop = parseFloat(el.style.top) || 0;
      el.setPointerCapture(e.pointerId);
      playPaperSlide();
    });

    el.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const desk = document.getElementById('pp-desk');
      if (!desk) return;
      const maxX = Math.max(40, desk.clientWidth - el.offsetWidth - 10);
      const maxY = Math.max(40, desk.clientHeight - el.offsetHeight - 10);
      const nx = Math.max(6, Math.min(maxX, origLeft + (e.clientX - startX)));
      const ny = Math.max(48, Math.min(maxY, origTop + (e.clientY - startY)));
      el.style.left = `${nx}px`;
      el.style.top = `${ny}px`;
    });

    el.addEventListener('pointerup', () => {
      dragging = false;
    });
  }

  // ---- RENDERIZAÇÃO DO MANUAL COM ABAS (Regras, Mapa, Brasões Visuais Reais e Notas Cifradas) ----
  function renderRulebook() {
    const body = document.getElementById('pp-rb-body');
    if (!body) return;
    const dayObj = DAYS[dayIdx];

    app.querySelectorAll('.pp-rb-tab').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-rbtab') === activeRuleTab);
    });

    if (activeRuleTab === 'rules') {
      body.innerHTML = `
        <div style="font-weight:bold; margin-bottom:5px; border-bottom:1px solid #8c6d46;">DIRETRIZES — DIA ${dayObj.day}</div>
        ${dayObj.rules.map((r) => `<div style="margin-bottom:4px;">${r}</div>`).join('')}
      `;
    } else if (activeRuleTab === 'map') {
      body.innerHTML = `
        <div class="pp-field" data-disc-key="rulebook_map" style="font-weight:bold; margin-bottom:5px; border-bottom:1px solid #8c6d46;">
          JURISDIÇÕES OFICIAIS (Clique aqui na Discrepância de Cidade)
        </div>
        ${Object.entries(KINGDOMS)
          .map(([k, info]) => `<div style="margin-bottom:3px;"><strong>${k}:</strong> ${info.cities.join(', ')}</div>`)
          .join('')}
      `;
    } else if (activeRuleTab === 'seals') {
      body.innerHTML = `
        <div style="font-weight:bold; margin-bottom:6px; border-bottom:1px solid #8c6d46;">CATÁLOGO OFICIAL DE BRASÕES</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
          ${Object.entries(KINGDOMS)
            .map(
              ([k]) => `
            <div style="display:flex; align-items:center; gap:6px; background:#dfd0b4; padding:4px; border:1px solid #8c6d46;">
              ${renderSealSvg(k, false, 30)}
              <span style="font-size:10px; font-weight:bold; line-height:1.15;">${k}</span>
            </div>
          `
            )
            .join('')}
        </div>
      `;
    } else {
      body.innerHTML = `
        <div style="font-weight:bold; margin-bottom:5px; border-bottom:1px solid #8c6d46;">ANOTAÇÕES INTERCEPTADAS</div>
        <div style="margin-bottom:6px;">
          <strong>Parte 1 (Dia 4 - Raio-X):</strong><br/>
          ${capturedClue1 ? `<code style="color:#7c2d12; font-weight:bold;">01001101 01010101 01010010 01001111</code>` : '<em>Ainda não encontrada.</em>'}
        </div>
        <div>
          <strong>Parte 2 (Dia 5 - Luz UV):</strong><br/>
          ${capturedClue2 ? `<code style="color:#581c87; font-weight:bold;">CÉSAR +3 → EHUOLP</code>` : '<em>Ainda não encontrada.</em>'}
        </div>
      `;
    }

    bindDiscrepancyClicks();
  }

  app.querySelectorAll('.pp-rb-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      playBeep();
      activeRuleTab = btn.getAttribute('data-rbtab');
      renderRulebook();
    });
  });

  // ---- ATUALIZA HUD, FILA E FERRAMENTAS ----
  function updateHudAndQueue() {
    const dayObj = DAYS[dayIdx];
    const remaining = Math.max(0, dayObj.applicants.length - (appIdx + 1));

    document.getElementById('pp-hud-day').textContent = `DIA ${dayObj.day} / 5`;
    document.getElementById('pp-hud-queue').textContent =
      travelerState === 'waiting_call'
        ? `FILA LÁ FORA: ${dayObj.applicants.length - appIdx}`
        : `RESTANTES HOJE: ${remaining}`;
    document.getElementById('pp-hud-credits').textContent = `💰 ${credits} CR`;
    document.getElementById('pp-hud-citations').textContent = `⚠️ MULTAS HOJE: ${citationsToday} / 3`;

    // Silhuetas na fila
    const qEl = document.getElementById('pp-queue-silhouettes');
    const qCount = travelerState === 'waiting_call' ? dayObj.applicants.length - appIdx : remaining;
    if (qEl) {
      qEl.innerHTML = Array.from({ length: Math.max(0, qCount) })
        .map((_, i) => `<div class="pp-q-person ${i === 0 && travelerState === 'present' ? 'walking-in' : ''}"></div>`)
        .join('');
    }

    // Cartaz de Procurados (Dia 3+)
    const wantedMount = document.getElementById('pp-wanted-mount');
    if (wantedMount) {
      if (dayObj.wanted && dayObj.wanted.length > 0) {
        wantedMount.innerHTML = `
          <div class="pp-wanted-strip pp-field" data-disc-key="wanted_poster" title="Cartaz Oficial de Procurados">
            <div class="pp-wanted-strip-title">PROCURADOS</div>
            <div class="pp-wanted-faces">
              ${dayObj.wanted.map((w) => `<div title="${w.name}">${renderPortraitSvg(w.look, 0.31)}</div>`).join('')}
            </div>
          </div>
        `;
      } else {
        wantedMount.innerHTML = '';
      }
    }

    // Botões de equipamentos desbloqueados por Dia!
    const btnDisc = document.getElementById('pp-btn-disc');
    const btnXray = document.getElementById('pp-btn-xray');
    const btnUv = document.getElementById('pp-btn-uv');
    const btnInter = document.getElementById('pp-btn-interrogate');
    const btnDetain = document.getElementById('pp-btn-detain');
    const nextBtn = document.getElementById('pp-next-btn');
    const giveBtn = document.getElementById('pp-give-btn');
    const stApp = document.getElementById('pp-stamp-approve');
    const stDen = document.getElementById('pp-stamp-deny');

    const hasActivePerson = travelerState === 'present' || travelerState === 'stamped';

    if (nextBtn) {
      nextBtn.disabled = travelerState !== 'waiting_call';
      nextBtn.classList.toggle('pulse-call', travelerState === 'waiting_call');
    }

    if (btnDisc) {
      btnDisc.style.display = dayObj.unlockDiscrepancy ? 'block' : 'none';
      btnDisc.disabled = !hasActivePerson;
      btnDisc.classList.toggle('active-mode', inspectMode);
    }
    if (btnXray) {
      btnXray.style.display = dayObj.unlockXray ? 'block' : 'none';
      btnXray.disabled = !hasActivePerson;
    }
    if (btnUv) {
      btnUv.style.display = dayObj.unlockUV ? 'block' : 'none';
      btnUv.disabled = !hasActivePerson;
      btnUv.classList.toggle('uv-active', uvOn);
    }
    if (btnInter) {
      btnInter.style.display = discrepancyVerified && hasActivePerson ? 'block' : 'none';
    }
    if (btnDetain) {
      btnDetain.style.display = canDetainNow && hasActivePerson ? 'block' : 'none';
    }

    if (stApp) stApp.disabled = !hasActivePerson;
    if (stDen) stDen.disabled = !hasActivePerson;
    if (giveBtn) giveBtn.disabled = travelerState !== 'stamped';
  }

  // ---- BOLETIM DE ABERTURA DE CADA DIA ----
  function showMorningBulletin() {
    const dayObj = DAYS[dayIdx];
    appIdx = -1;
    citationsToday = 0;
    totalApprovedToday = 0;
    totalDetainedToday = 0;
    travelerState = 'waiting_call';
    inspectMode = false;
    uvOn = false;
    document.getElementById('pp-desk')?.classList.remove('uv-lit', 'pp-inspect-mode');
    document.getElementById('pp-docs-layer').innerHTML = '';
    document.getElementById('pp-citation-mount').innerHTML = '';
    document.getElementById('pp-shutter')?.classList.remove('open');
    document.getElementById('pp-shutter').textContent = `POSTO 04 // DIA ${dayObj.day}`;
    document.getElementById('pp-speech').style.display = 'none';
    document.getElementById('pp-traveler-stage').className = 'pp-traveler-stage';
    document.getElementById('pp-weight-val').textContent = '-- KG';

    renderRulebook();
    updateHudAndQueue();

    const mount = document.getElementById('pp-overlay-mount');
    mount.innerHTML = `
      <div class="pp-day-overlay">
        <div style="font-size:12px; letter-spacing:3px; color:#a89984;">MINISTÉRIO DA MEMÓRIA MORTA</div>
        <h2 style="margin:0; font-size:24px; color:#fde68a; letter-spacing:1px;">${dayObj.codeTitle}</h2>
        <div class="pp-night-ledger" style="white-space:pre-line;">${dayObj.bulletin}</div>
        <button type="button" class="pp-megaphone-btn" id="pp-start-shift-btn" style="padding:12px 28px; font-size:14px;">🔓 DESTRAVAR GUICHÊ E INICIAR TURNO</button>
      </div>
    `;

    document.getElementById('pp-start-shift-btn')?.addEventListener('click', () => {
      playShutterClank();
      mount.innerHTML = '';
      supervisorThenLog(dayObj.supervisorIntro, dayObj.logIntro, 'urgent');
    });
  }

  // ---- CHAMAR PRÓXIMO VIAJANTE NO MEGAFONE! ----
  document.getElementById('pp-next-btn')?.addEventListener('click', () => {
    if (travelerState !== 'waiting_call') return;
    const dayObj = DAYS[dayIdx];
    appIdx += 1;
    const person = dayObj.applicants[appIdx];
    if (!person) return;

    playMegaphoneCall();
    playShutterClank();

    travelerState = 'present';
    currentStamp = null;
    discrepancyVerified = false;
    canDetainNow = false;
    selectedDiscFields = [];
    inspectMode = false;
    xrayActive = false;
    document.getElementById('pp-xray-screen')?.classList.remove('active');
    document.getElementById('pp-desk')?.classList.remove('pp-inspect-mode');

    // Abre a persiana e traz o viajante caminhando!
    const shutter = document.getElementById('pp-shutter');
    shutter?.classList.add('open');

    const stage = document.getElementById('pp-traveler-stage');
    stage.innerHTML = `<div class="pp-field" data-disc-key="person_face" title="Rosto Real do Viajante">${renderPortraitSvg(person.look, 1.05)}</div>`;
    stage.className = 'pp-traveler-stage';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => stage.classList.add('present'));
    });

    // Peso na balança do piso
    document.getElementById('pp-weight-val').textContent = `${person.weightReal} KG`;

    // Balão de fala
    const sp = document.getElementById('pp-speech');
    sp.textContent = `"${person.speech}"`;
    sp.style.display = 'block';

    // Joga os documentos na mesa com leve atraso físico!
    setTimeout(() => {
      playPaperSlide();
      spawnDocumentsOnDesk(person);
      bindDiscrepancyClicks();
      updateHudAndQueue();

      if (person.isLoreSecret2) {
        setOperatorRemark(
          'pera aí mano... olha a cara desse último sujeito na janela... "000-NK"?! pq esse código tá me dando um frio na espinha?!',
          { priority: 'urgent' }
        );
      }
    }, 320);

    updateHudAndQueue();
  });

  // ---- ESPALHA OS PAPÉIS DO VIAJANTE PELA MESA ----
  function spawnDocumentsOnDesk(person) {
    const layer = document.getElementById('pp-docs-layer');
    if (!layer) return;
    layer.innerHTML = '';

    const kInfo = KINGDOMS[person.kingdom] || KINGDOMS['Vale do Boleto'];
    const passPhotoLook = person.photoLook || person.look;
    const uvLabel = person.uvText || '✦ AUTÊNTICO // SETOR 0';

    // 1. PASSAPORTE PRINCIPAL
    const passEl = document.createElement('div');
    passEl.className = 'pp-doc-item pp-passport-doc';
    passEl.id = 'pp-doc-passport';
    passEl.style.left = '34px';
    passEl.style.top = '74px';
    passEl.style.zIndex = String(++topZ);
    passEl.innerHTML = `
      <div class="pp-pass-header ${kInfo.cls}">
        <span>PASSAPORTE // ${person.kingdom.toUpperCase()}</span>
        <span>${person.sex}</span>
      </div>
      <div class="pp-pass-body">
        <div class="pp-pass-photo pp-field" data-disc-key="pass_photo" title="Foto do Passaporte">
          ${renderPortraitSvg(passPhotoLook, 0.56)}
        </div>
        <div>
          <div><strong>Nome:</strong> <span class="pp-field" data-disc-key="pass_name">${person.name}</span></div>
          <div><strong>Nasc.:</strong> ${person.birth}</div>
          <div><strong>Cidade:</strong> <span class="pp-field" data-disc-key="pass_city">${person.city}</span></div>
          <div><strong>Peso:</strong> <span class="pp-field" data-disc-key="pass_weight">${person.weightPass} kg</span></div>
          <div><strong>Expira:</strong> <span class="pp-field" data-disc-key="pass_exp">${person.expiry}</span></div>
        </div>
      </div>
      <div class="pp-pass-footer">
        <div class="pp-field" data-disc-key="pass_seal" title="Brasão Impresso">
          ${renderSealSvg(person.kingdom, person.forgedSeal, 38)}
        </div>
        <div class="pp-uv-mark">${uvLabel}</div>
        <div id="pp-stamp-mark-slot"></div>
      </div>
    `;
    layer.appendChild(passEl);
    makeDraggable(passEl);

    // 2. TICKET DE ENTRADA (Dia 2+)
    if (person.entryTicket) {
      const tk = document.createElement('div');
      tk.className = 'pp-doc-item pp-permit-doc';
      tk.style.left = '322px';
      tk.style.top = '78px';
      tk.style.zIndex = String(++topZ);
      tk.innerHTML = `
        <div class="pp-permit-header">TICKET DE ENTRADA // ${person.entryTicket.code}</div>
        <div><strong>Finalidade:</strong> ${person.entryTicket.purpose}</div>
        <div><strong>Ano Válido:</strong> <span class="pp-field" data-disc-key="ticket_year">${person.entryTicket.validYear}</span></div>
        <div style="margin-top:6px; font-size:10px; opacity:0.75;">Válido apenas para o titular na data corrente.</div>
      `;
      layer.appendChild(tk);
      makeDraggable(tk);
    }

    // 3. PERMISSÃO DE TRABALHO (Dia 3+)
    if (person.workPermit) {
      const wp = document.createElement('div');
      wp.className = 'pp-doc-item pp-permit-doc';
      wp.style.background = '#efe8f6';
      wp.style.borderColor = '#4c1d95';
      wp.style.left = '318px';
      wp.style.top = '235px';
      wp.style.zIndex = String(++topZ);
      wp.innerHTML = `
        <div class="pp-permit-header" style="border-color:#4c1d95;">PERMISSÃO DE TRABALHO</div>
        <div><strong>Titular:</strong> <span class="pp-field" data-disc-key="permit_name">${person.workPermit.holder}</span></div>
        <div><strong>Função:</strong> ${person.workPermit.role}</div>
        <div><strong>Validade:</strong> ${person.workPermit.until}</div>
      `;
      layer.appendChild(wp);
      makeDraggable(wp);
    }

    // 4. CERTIFICADO DE VACINAÇÃO AMARELO (Dia 4+)
    if (person.vaccineCert) {
      const vc = document.createElement('div');
      vc.className = 'pp-doc-item pp-vaccine-doc';
      vc.style.left = '66px';
      vc.style.top = '325px';
      vc.style.zIndex = String(++topZ);
      vc.innerHTML = `
        <div style="font-weight:bold; border-bottom:1px solid #854d0e; margin-bottom:4px;">💉 PROFILAXIA SANITÁRIA</div>
        <div><strong>Portador:</strong> ${person.name}</div>
        <div><strong>Situação:</strong> <span class="pp-field" data-disc-key="vac_status">${person.vaccineCert.status}</span></div>
        <div><strong>Lote:</strong> ${person.vaccineCert.batch}</div>
      `;
      layer.appendChild(vc);
      makeDraggable(vc);
    }

    // 5. NOTA DE SUBORNO JOGADA DISCRETAMENTE NA MESA!
    if (person.bribe) {
      const br = document.createElement('div');
      br.className = 'pp-doc-item pp-bribe-note';
      br.style.left = '345px';
      br.style.top = '385px';
      br.style.zIndex = String(++topZ);
      br.innerHTML = `
        <div style="font-weight:bold;">💵 +${person.bribe} CRÉDITOS VIVOS</div>
        <div style="margin-top:3px;">"Bate o carimbo VERDE no meu passaporte que esse dinheiro fica na sua gaveta..."</div>
      `;
      layer.appendChild(br);
      makeDraggable(br);
    }
  }

  // ---- MODO DISCREPÂNCIA (Conecta 2 campos conflitantes igual ao Papers, Please!) ----
  function bindDiscrepancyClicks() {
    app.querySelectorAll('.pp-field').forEach((el) => {
      if (el.dataset.boundDisc === '1') return;
      el.dataset.boundDisc = '1';

      el.addEventListener('click', (e) => {
        if (!inspectMode) return;
        e.stopPropagation();
        playBeep();

        const key = el.getAttribute('data-disc-key');
        if (!key) return;

        if (selectedDiscFields.some((x) => x.key === key)) return;
        el.classList.add('selected-disc');
        selectedDiscFields.push({ key, el });

        if (selectedDiscFields.length === 2) {
          evaluateDiscrepancyPair(selectedDiscFields[0].key, selectedDiscFields[1].key);
          setTimeout(() => {
            app.querySelectorAll('.pp-field.selected-disc').forEach((n) => n.classList.remove('selected-disc'));
            selectedDiscFields = [];
          }, 550);
        }
      });
    });
  }

  function evaluateDiscrepancyPair(k1, k2) {
    const person = DAYS[dayIdx].applicants[appIdx];
    if (!person) return;
    const pair = new Set([k1, k2]);

    let matched = false;
    if (pair.has('real_weight') && pair.has('pass_weight') && Math.abs(person.weightReal - person.weightPass) > 3) {
      matched = true;
    } else if (pair.has('pass_city') && pair.has('rulebook_map') && person.discrepancyType === 'city') {
      matched = true;
    } else if (pair.has('person_face') && (pair.has('pass_photo') || pair.has('wanted_poster')) && person.discrepancyType === 'face') {
      matched = true;
    } else if (pair.has('pass_name') && pair.has('permit_name') && person.discrepancyType === 'name') {
      matched = true;
    } else if (pair.has('today_date') && pair.has('pass_exp') && Number(person.expiry.split('.')[1]) < 2026) {
      matched = true;
    }

    inspectMode = false;
    document.getElementById('pp-desk')?.classList.remove('pp-inspect-mode');

    if (matched) {
      discrepancyVerified = true;
      if (person.canDetain) canDetainNow = true;
      saySupervisor('KSHHH— Discrepância confirmada no sistema! Microfone de interrogatório liberado.');
    } else {
      saySupervisor('KSHHH— Nenhuma correlação irregular entre esses dois itens.');
    }
    updateHudAndQueue();
  }

  document.getElementById('pp-btn-disc')?.addEventListener('click', () => {
    playBeep();
    inspectMode = !inspectMode;
    selectedDiscFields = [];
    app.querySelectorAll('.pp-field.selected-disc').forEach((n) => n.classList.remove('selected-disc'));
    document.getElementById('pp-desk')?.classList.toggle('pp-inspect-mode', inspectMode);
    if (inspectMode) {
      saySupervisor('Modo Inspeção ativo: clique em DOIS elementos conflitantes (ex: Peso LED + Peso no Passaporte, ou Cidade + Aba Mapa).');
    }
    updateHudAndQueue();
  });

  // ---- BOTÃO INTERROGAR ----
  document.getElementById('pp-btn-interrogate')?.addEventListener('click', () => {
    const person = DAYS[dayIdx].applicants[appIdx];
    if (!person) return;
    playMegaphoneCall();
    const sp = document.getElementById('pp-speech');
    if (sp) {
      sp.textContent = `"${person.interrogateReply || 'Não tenho mais nada a declarar!! Me devolve logo esse passaporte!'}"`;
    }
    if (person.canDetain) canDetainNow = true;
    updateHudAndQueue();
  });

  // ---- SCANNER RAIO-X ----
  document.getElementById('pp-btn-xray')?.addEventListener('click', () => {
    const person = DAYS[dayIdx].applicants[appIdx];
    if (!person) return;
    playShutterClank();
    xrayActive = true;
    const screen = document.getElementById('pp-xray-screen');
    const txt = document.getElementById('pp-xray-text');
    if (txt) txt.textContent = person.xrayDesc;
    screen?.classList.add('active');

    if (person.xrayBad && person.canDetain) {
      canDetainNow = true;
      updateHudAndQueue();
    }

    if (person.isLoreSecret1 && !capturedClue1) {
      capturedClue1 = true;
      renderRulebook();
      supervisorThenLog(
        'KSHHH— Objeto metálico com gravação binária detectado, mas sem explosivos. Protocolo permite passagem.',
        'opa opa opa!! anotou esses zeros e uns que apareceram no raio-x?! já copiei pra tua aba [Notas] ali no manual, isso é pista do livro ctz!',
        'urgent'
      );
    }
  });

  document.getElementById('pp-xray-close')?.addEventListener('click', () => {
    playBeep();
    document.getElementById('pp-xray-screen')?.classList.remove('active');
  });

  // ---- LANTERNA DE LUZ NEGRA UV (Dia 5) ----
  document.getElementById('pp-btn-uv')?.addEventListener('click', () => {
    const person = DAYS[dayIdx].applicants[appIdx];
    playBeep();
    uvOn = !uvOn;
    document.getElementById('pp-desk')?.classList.toggle('uv-lit', uvOn);
    updateHudAndQueue();

    if (uvOn && person?.canDetain && !person.valid) {
      canDetainNow = true;
      updateHudAndQueue();
    }

    if (uvOn && person?.isLoreSecret2 && !capturedClue2) {
      capturedClue2 = true;
      renderRulebook();
      supervisorThenLog(
        'KSHHH— Selo UV de Arquivo Raiz verificado. Autorize passagem imediata do Sujeito 000-NK.',
        'CARALHO OLHA NO PASSAPORTE DELE COM A LUZ ROXA: "CÉSAR +3 → EHUOLP"!! salvou na aba [Notas] tbm! aprova logo esse bicho sinistro pra gente vazar daqui!!',
        'urgent'
      );
    }
  });

  // ---- GAVETA DE CARIMBOS PESADOS (APROVAR / NEGAR) ----
  document.getElementById('pp-stamp-toggle')?.addEventListener('click', () => {
    playShutterClank();
    stampBarOpen = !stampBarOpen;
    document.getElementById('pp-stamp-bar')?.classList.toggle('open', stampBarOpen);
  });

  function applyStamp(kind) {
    if (travelerState !== 'present' && travelerState !== 'stamped') return;
    playHeavyStampSound();
    currentStamp = kind;
    travelerState = 'stamped';

    // Se o passaporte estiver escondido pro canto, puxa suavemente pra área visível
    const slot = document.getElementById('pp-stamp-mark-slot');
    if (slot) {
      slot.innerHTML = `<div class="pp-ink-stamp ${kind}">${kind === 'approved' ? 'APROVADO' : 'NEGADO'}</div>`;
    }
    updateHudAndQueue();
  }

  document.getElementById('pp-stamp-approve')?.addEventListener('click', () => applyStamp('approved'));
  document.getElementById('pp-stamp-deny')?.addEventListener('click', () => applyStamp('denied'));

  // ---- BOTÃO DE DETER VIAJANTE (GUARDAS LEVAM PRESO + BÔNUS DE +5 CR!) ----
  document.getElementById('pp-btn-detain')?.addEventListener('click', () => {
    if (travelerState !== 'present' && travelerState !== 'stamped') return;
    playMegaphoneCall();
    finishCurrentTraveler('detained');
  });

  // ---- ENTREGAR PASSAPORTE CARIMBADO PELA FRESTA ----
  document.getElementById('pp-give-btn')?.addEventListener('click', () => {
    if (travelerState !== 'stamped' || !currentStamp) return;
    playPaperSlide();
    finishCurrentTraveler(currentStamp);
  });

  // ---- RESOLUÇÃO DO VIAJANTE + IMPRESSORA DE MULTA SE ERROU! ----
  const logCitationMocks = [
    'kkkkkk já saiu o papelzinho rosa da multa cantando na mesa! lê a porra do manual direito mano!',
    'mais uma infração pro teu currículo de porteiro... se tomar 3 no mesmo dia os caras te chutam de volta pro começo do turno!',
    'pqp deixou passar coisa errada na cara dura e a impressora já te dedurou na hora!',
  ];
  let mockIdx = 0;

  async function finishCurrentTraveler(decision) {
    const dayObj = DAYS[dayIdx];
    const person = dayObj.applicants[appIdx];
    if (!person) return;

    travelerState = 'transitioning';
    stampBarOpen = false;
    document.getElementById('pp-stamp-bar')?.classList.remove('open');
    document.getElementById('pp-xray-screen')?.classList.remove('active');
    document.getElementById('pp-speech').style.display = 'none';
    document.getElementById('pp-docs-layer').innerHTML = '';

    const stage = document.getElementById('pp-traveler-stage');
    if (decision === 'detained') stage.classList.add('detained');
    else if (decision === 'approved') stage.classList.add('leaving-ok');
    else stage.classList.add('leaving-denied');

    const approved = decision === 'approved';
    const isCorrect = decision === 'detained' ? !person.valid : approved === person.valid;

    if (approved && person.bribe) {
      credits += person.bribe; // embolsou o suborno por baixo do pano (mas toma multa!)
    }

    if (isCorrect) {
      credits += 10;
      if (decision === 'detained') {
        credits += 5; // bônus dos guardas!
        totalDetainedToday += 1;
      } else if (approved) {
        totalApprovedToday += 1;
      }

      const supMsg =
        decision === 'detained'
          ? 'KSHHH— Suspeito detido pela guarda! +10 cr (+5 cr bônus de detenção). Chame o próximo.'
          : 'KSHHH— Processamento correto (+10 cr). Chame o próximo da fila.';

      await supervisorThenLog(supMsg, person.logReactAfter || null, 'action');
    } else {
      citationsToday += 1;
      credits = Math.max(0, credits - 10);
      playCitationPrinter();

      // Imprime o Ticket Rosa de Multa na mesa!
      const citMount = document.getElementById('pp-citation-mount');
      if (citMount) {
        citMount.innerHTML = `
          <div class="pp-citation-slip">
            <div style="font-weight:900; border-bottom:1px solid #991b1b; margin-bottom:4px;">⚠️ NOTIFICAÇÃO PROTOCOLAR (${citationsToday}/3)</div>
            <div><strong>Infrator:</strong> Posto 04</div>
            <div><strong>Motivo:</strong> ${person.violationReason}</div>
            <div style="margin-top:4px; font-weight:bold;">PENALIDADE: -10 CRÉDITOS</div>
          </div>
        `;
      }

      if (citationsToday >= 3) {
        await supervisorThenLog(
          'KSHHH— TRÊS INFRAÇÕES GRAVES NO MESMO TURNO! Turno anulado. Recomece a auditoria deste dia imediatamente!',
          'conseguiu ser demitido do dia inteiro mano!! pelo menos não voltou pro Dia 1, refaz esse turno prestando atenção agora!',
          'urgent'
        );
        setTimeout(() => showMorningBulletin(), 1800);
        return;
      }

      await supervisorThenLog(
        `KSHHH— VIOLAÇÃO REGISTRADA (${citationsToday}/3): ${person.violationReason}`,
        logCitationMocks[mockIdx++ % logCitationMocks.length],
        'action'
      );
    }

    setTimeout(() => {
      document.getElementById('pp-shutter')?.classList.remove('open');
      playShutterClank();

      if (appIdx + 1 >= dayObj.applicants.length) {
        setTimeout(() => showNightEndOfShift(), 550);
      } else {
        travelerState = 'waiting_call';
        updateHudAndQueue();
      }
    }, 520);
  }

  // ---- TELA DE FECHAMENTO NOTURNO (Salário vs Aluguel/Aquecimento da Cabine!) ----
  function showNightEndOfShift() {
    const dayObj = DAYS[dayIdx];
    const mount = document.getElementById('pp-overlay-mount');

    // Se fechou o Dia 5 -> VITÓRIA DO CONTO 1!
    if (dayIdx + 1 >= DAYS.length) {
      mount.innerHTML = `
        <div class="pp-day-overlay">
          <div style="font-size:12px; letter-spacing:3px; color:#4ade80;">AUDITORIA DE 5 DIAS CONCLUÍDA</div>
          <h2 style="margin:0; font-size:24px; color:#fde68a;">LIVRO I LIBERADO — ALFÂNDEGA ENCERRADA</h2>
          <div class="pp-night-ledger">
            <div style="margin-bottom:8px; color:#fcd34d; font-weight:bold;">RESUMO DAS PISTAS INTERCEPTADAS NO CONTO:</div>
            <div>• Dia 4 (Agente K. / Raio-X): <code>01001101 01010101 01010010 01001111</code></div>
            <div>• Dia 5 (Sujeito 000-NK / UV): <code>CÉSAR +3 → EHUOLP</code></div>
            <div style="margin-top:10px; font-size:12px; opacity:0.85;">Use essas duas pistas para resolver o enigma na Última Página do Livro I na sua mochila!</div>
          </div>
          <button type="button" class="pp-megaphone-btn" id="pp-claim-book1" style="background:#15803d; border-color:#052e16; padding:14px 28px; font-size:14px;">📕 RECOLHER LIVRO I E VOLTAR À CAVERNA</button>
        </div>
      `;

      supervisorThenLog(
        'KSHHH— Auditoria finalizada com êxito. Emitindo volume físico para arquivamento externo.',
        'acabou os 5 dias dessa repartição maldita!! pega logo esse Livro I aí na frente que já guardamos as duas cifras pra abrir o cadeado dele!',
        'urgent'
      );

      document.getElementById('pp-claim-book1')?.addEventListener('click', async () => {
        isAlive = false;
        playHeavyStampSound();
        await finishStory();
      });
      return;
    }

    // Fechamento normal dos Dias 1 a 4 (com cobrança de Energia e Aquecimento da Cabine!)
    const upkeepCost = 20;
    const afterUpkeep = Math.max(0, credits - upkeepCost);

    mount.innerHTML = `
      <div class="pp-day-overlay">
        <div style="font-size:12px; letter-spacing:3px; color:#a89984;">FIM DO EXPEDIENTE — NOITE DO DIA ${dayObj.day}</div>
        <h2 style="margin:0; font-size:22px; color:#fde68a;">BALANÇO FINANCEIRO DO POSTO 04</h2>
        <div class="pp-night-ledger">
          <div class="pp-ledger-row"><span>Saldo acumulado no caixa:</span><span>${credits} cr</span></div>
          <div class="pp-ledger-row"><span>Detenções realizadas hoje:</span><span>${totalDetainedToday}</span></div>
          <div class="pp-ledger-row"><span>Infrações cometidas hoje:</span><span>${citationsToday}</span></div>
          <div class="pp-ledger-row" style="color:#fca5a5;"><span>Taxa de Energia & Aquecimento da Cabine:</span><span>-${upkeepCost} cr</span></div>
          <div class="pp-ledger-row" style="font-weight:bold; color:#fde047; margin-top:6px;"><span>SALDO PARA AMANHÃ:</span><span>${afterUpkeep} cr</span></div>
        </div>
        <button type="button" class="pp-megaphone-btn" id="pp-next-day-btn" style="padding:12px 26px; font-size:14px;">🌙 DORMIR E AVANÇAR PARA O DIA ${dayObj.day + 1} ➡️</button>
      </div>
    `;

    document.getElementById('pp-next-day-btn')?.addEventListener('click', () => {
      playShutterClank();
      credits = afterUpkeep;
      dayIdx += 1;
      showMorningBulletin();
    });
  }

  // Inicia no Boletim Oficial do Dia 1!
  showMorningBulletin();
}
