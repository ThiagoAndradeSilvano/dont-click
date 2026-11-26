import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'players.json');

const app = express();
const PORT = process.env.PORT || 3088;
const COOKIE_NAME = 'dc_sid';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

/*
 * GERADORES REPETÍVEIS ("Automação Duvidosa" — estilo Cookie Clicker, custo sobe 16% por nível)
 * Calibrados matematicamente para uma jornada viciante de ~18 a 22 minutos até zerar todos os 16 upgrades!
 */
const GENERATORS = [
  {
    id: 'ghost_finger',
    name: 'Dedo Indicador Terceirizado',
    baseCost: 15,
    cps: 0.5,
    desc: 'Aperta o botão sem vontade uma vez a cada dois segundos.',
  },
  {
    id: 'pigeon',
    name: 'Pombo Treinado com Milho',
    baseCost: 90,
    cps: 2.5,
    desc: 'Bica o botão esquerdo em troca de farelo imaginário.',
  },
  {
    id: 'oscillating_fan',
    name: 'Ventilador Amarrado no Mouse',
    baseCost: 480,
    cps: 11,
    desc: 'Toda vez que gira pra direita puxa o fio e dá uns cliques.',
  },
  {
    id: 'nephew',
    name: 'Sobrinho que Mexe com PC',
    baseCost: 2200,
    cps: 42,
    desc: 'Clica rápido enquanto baixa 4 antivírus diferentes sem querer.',
  },
  {
    id: 'excel_macro',
    name: 'Planilha do Excel com Macro Travada',
    baseCost: 9500,
    cps: 150,
    desc: 'Ninguém sabe quem fez em 2011, mas se fechar para tudo.',
  },
  {
    id: 'lan_house',
    name: 'Lan House Abandonada de 2007',
    baseCost: 42000,
    cps: 520,
    desc: '14 computadores com teclado engordurado clicando 24h.',
  },
];

const GEN_MAP = Object.fromEntries(GENERATORS.map((g) => [g.id, g]));

function getGeneratorCost(gen, ownedCount) {
  return Math.floor(gen.baseCost * Math.pow(1.16, ownedCount));
}

/*
 * 16 UPGRADES DE INTERFACE / POWER-UPS (~20 MINUTOS DE PROGRESSÃO):
 * - Itens 1 a 12: Comprados no modo mudo (~15 min de jogo)
 * - Item 13 ('cloud_sync' — faltando exatamente os 3 últimos!): Dispara o ERRO FALADO onde o cara aparece pela 1ª vez!
 * - Itens 14, 15 e 16 (os 3 últimos power-ups!): Pega após voltar do erro (~4-5 min finais) até ouvir "pode meter o pé"!
 */
const SHOP_ITEMS = [
  {
    id: 'sound',
    name: 'Áudio do Botão',
    cost: 12,
    desc: 'Habilita emissão sonora simples ao pressionar.',
  },
  {
    id: 'click_plus_1',
    name: 'Dedo Calibrado (+1/clique)',
    cost: 45,
    desc: 'Aumenta o clique manual base em +1 ponto.',
  },
  {
    id: 'fake_progress',
    name: 'Barra de Carregamento',
    cost: 120,
    desc: 'Adiciona barra visual de sincronização do sistema.',
  },
  {
    id: 'kids_theme',
    name: 'Tema Colorido Amigável',
    cost: 280,
    desc: 'Substitui o visual cinza por um plano de fundo alegre.',
  },
  {
    id: 'cookie_banner',
    name: 'Conformidade de Cookies',
    cost: 650,
    desc: 'Implementa aviso obrigatório de privacidade no rodapé.',
  },
  {
    id: 'click_plus_4',
    name: 'Mola Lubrificada (+4/clique)',
    cost: 1400,
    desc: 'Adiciona +4 pontos ao clique manual.',
  },
  {
    id: 'search_bar',
    name: 'Barra de Pesquisa',
    cost: 3000,
    desc: 'Libera campo de busca global no topo da página.',
  },
  {
    id: 'tax_mult',
    name: 'Multiplicador Corporativo x2',
    cost: 6500,
    desc: 'Dobra os pontos do clique manual (*sujeito a tarifa na fonte).',
  },
  {
    id: 'weather_widget',
    name: 'Widget de Clima & Relógio',
    cost: 13500,
    desc: 'Exibe condições meteorológicas do seu ambiente atual.',
  },
  {
    id: 'achievements',
    name: 'Sistema de Conquistas',
    cost: 26000,
    desc: 'Habilita medalhas comemorativas e eventos aleatórios na tela.',
  },
  {
    id: 'terms_popup',
    name: 'Contrato de Licença v4.2',
    cost: 50000,
    desc: 'Regulamenta juridicamente seus cliques acumulados.',
  },
  {
    id: 'gen_boost',
    name: 'Café Quente pra Equipe (Produção x2)',
    cost: 95000,
    desc: 'Dobra a produção por segundo de todas as automações!',
  },
  // === 13º ITEM (FALTANDO OS 3 ÚLTIMOS!): DISPARA O ERRO ONDE ELE APARECE FALANDO! ===
  {
    id: 'cloud_sync',
    name: 'Backup em Nuvem Oficial',
    cost: 175000,
    desc: 'Conecta e salva seu progresso nos servidores centrais.',
    triggersAwakening: true,
  },
  // === OS 3 ÚLTIMOS POWER-UPS APÓS VOLTAR DO ERRO (~16 min -> ~20 min) ===
  {
    id: 'elevator_music',
    name: 'Rádio Ambiente Relaxante',
    cost: 280000,
    desc: 'Desbloqueia trilha musical exclusiva de sala de espera.',
  },
  {
    id: 'turbo_click',
    name: 'Overclock Geral (Tudo x3)',
    cost: 460000,
    desc: 'Triplica tanto seus cliques manuais quanto toda a produção automática!',
  },
  {
    id: 'vip_gold',
    name: 'Troféu Botão Dourado (100%)',
    cost: 850000,
    desc: 'Reveste o botão de ouro puro e conclui 100% do jogo.',
  },
];

const SHOP_MAP = Object.fromEntries(SHOP_ITEMS.map((it) => [it.id, it]));

function loadDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial = { totalGlobalClicks: 0, players: {} };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch {
    return { totalGlobalClicks: 0, players: {} };
  }
}

function saveDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function computeFingerprintHash(ip, clientMeta = {}) {
  const raw = [
    ip,
    clientMeta.userAgent || '',
    clientMeta.screen || '',
    clientMeta.timezone || '',
    clientMeta.language || '',
  ].join('|');
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
}

function normalizePlayer(player) {
  const validStages = [
    'button',
    'shape_test',
    'post_shapes_crash',
    'mundane_clicker',
    'awakening_error',
    'awakened_clicker',
  ];
  if (!validStages.includes(player.stage)) player.stage = 'button';
  if (typeof player.sessionClicks !== 'number') player.sessionClicks = 0;
  if (typeof player.crashes !== 'number') player.crashes = 0;
  if (typeof player.firstCrashClicks !== 'number') player.firstCrashClicks = 9;
  if (typeof player.points !== 'number') player.points = 0;
  if (!Array.isArray(player.upgrades)) player.upgrades = [];
  if (!player.generators || typeof player.generators !== 'object') player.generators = {};
  if (!Array.isArray(player.flags)) player.flags = [];
  if (!Array.isArray(player.sessionClickTimestamps)) player.sessionClickTimestamps = [];
  if (!player.clickerStartedAt) player.clickerStartedAt = null;
  return player;
}

/*
 * DETECTOR PSICOLÓGICO DE CONTAGEM HUMANA ("1... 2... 3... 4... 5... 6... 7... 8... 9"):
 * Analisa os intervalos em milissegundos entre os cliques até o 1º erro.
 * - Quem clica metralhando rápido (< 260ms de média): NÃO está contando mentalmente.
 * - Quem clica caótico (ora 200ms, ora 1800ms): NÃO está contando, está explorando.
 * - Quem abre em outro aparelho/aba SÓ PRA CONTAR clica cadenciado (média entre 340ms e 1800ms,
 *   com baixo coeficiente de variação entre os intervalos)!
 */
function detectDeliberateCounting(timestamps = []) {
  if (timestamps.length < 7) return false;

  const intervals = [];
  for (let i = 1; i < timestamps.length; i++) {
    intervals.push(timestamps[i] - timestamps[i - 1]);
  }

  // Ignora o 1º intervalo caso a pessoa tenha testado o 1º clique e depois começado a contar do 2 em diante,
  // checando tanto todos os intervalos quanto os últimos 6 intervalos!
  const checkSlice = (arr) => {
    if (arr.length < 6) return false;
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
    // Cadência humana de contar "um... dois... três...": entre 0.34s e 1.85s por clique
    if (mean < 340 || mean > 1850) return false;

    const variance = arr.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / arr.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / mean; // coeficiente de variação

    // Se a variação de ritmo for menor que 23% e nenhum clique foi metralhado (<220ms), a pessoa está contando no compasso!
    const minInt = Math.min(...arr);
    return cv <= 0.23 && minInt >= 220;
  };

  return checkSlice(intervals) || checkSlice(intervals.slice(1));
}

function resolvePlayer(req, res, clientMeta = {}) {
  const db = loadDb();
  const ip = getClientIp(req);
  const fpHash = computeFingerprintHash(ip, clientMeta);

  let playerId = req.cookies[COOKIE_NAME];

  if ((!playerId || !db.players[playerId]) && clientMeta.localToken && db.players[clientMeta.localToken]) {
    playerId = clientMeta.localToken;
  }

  if (!playerId || !db.players[playerId]) {
    const existingByFp = Object.values(db.players).find((p) => p.fpHash === fpHash);
    if (existingByFp) {
      playerId = existingByFp.id;
    }
  }

  const now = new Date().toISOString();
  if (!playerId || !db.players[playerId]) {
    playerId = crypto.randomUUID();
    db.players[playerId] = {
      id: playerId,
      fpHash,
      ip,
      clicks: 0,
      sessionClicks: 0,
      crashes: 0,
      firstCrashClicks: 9,
      stage: 'button',
      points: 0,
      upgrades: [],
      generators: {},
      flags: [],
      clickerStartedAt: null,
      visits: 0,
      firstSeenAt: now,
      lastSeenAt: now,
      history: [],
    };
  }

  const player = normalizePlayer(db.players[playerId]);
  player.lastSeenAt = now;
  player.fpHash = fpHash;

  res.cookie(COOKIE_NAME, playerId, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });

  return { db, player };
}

function computeTotalCps(player) {
  let raw = 0;
  for (const gen of GENERATORS) {
    const count = player.generators[gen.id] || 0;
    raw += count * gen.cps;
  }
  if (player.upgrades.includes('gen_boost')) raw *= 2;
  if (player.upgrades.includes('turbo_click')) raw *= 3;
  return Math.round(raw * 10) / 10;
}

function computeManualClickValues(player) {
  let base = 1;
  if (player.upgrades.includes('click_plus_1')) base += 1;
  if (player.upgrades.includes('click_plus_4')) base += 4;
  // +2% do CPS somado ao clique manual pra clicar sempre valer muito a pena durante os 20 minutos!
  const cpsBonus = Math.floor(computeTotalCps(player) * 0.04);
  base += cpsBonus;

  if (player.upgrades.includes('turbo_click')) base *= 3;

  let grossGain = base;
  let tax = 0;

  if (player.upgrades.includes('tax_mult')) {
    grossGain = base * 2;
    // Cobra 45% de tarifa pra trollar no começo (+2 -1 = +1 quando base=1!), mas dá uma leve ajudinha quando base cresce
    tax = base === 1 ? 1 : Math.max(1, Math.floor(base * 0.65));
  }

  return { grossGain, tax, netGain: grossGain - tax };
}

function buildShopState(player) {
  return SHOP_ITEMS.map((item) => ({
    id: item.id,
    name: item.name,
    cost: item.cost,
    desc: item.desc,
    owned: player.upgrades.includes(item.id),
  }));
}

function buildGeneratorsState(player) {
  let mult = 1;
  if (player.upgrades.includes('gen_boost')) mult *= 2;
  if (player.upgrades.includes('turbo_click')) mult *= 3;

  return GENERATORS.map((gen) => {
    const count = player.generators[gen.id] || 0;
    return {
      id: gen.id,
      name: gen.name,
      cost: getGeneratorCost(gen, count),
      cps: Math.round(gen.cps * mult * 10) / 10,
      count,
      desc: gen.desc,
    };
  });
}

function isAllUpgradesOwned(player) {
  return SHOP_ITEMS.every((it) => player.upgrades.includes(it.id));
}

function getMinutesInClicker(player) {
  if (!player.clickerStartedAt) return 15;
  const diffMs = Date.now() - new Date(player.clickerStartedAt).getTime();
  return Math.max(1, Math.round(diffMs / 60000));
}

function buildClientPayload(player) {
  return {
    token: player.id,
    stage: player.stage,
    totalClicks: player.clicks,
    points: Math.floor(player.points * 10) / 10,
    cps: computeTotalCps(player),
    upgrades: player.upgrades,
    generators: buildGeneratorsState(player),
    allOwned: isAllUpgradesOwned(player),
    minutesPlayed: getMinutesInClicker(player),
    shop: buildShopState(player),
    buttonLabel: 'Botão',
  };
}

// Sessão / Reload
app.post('/api/session', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  player.visits += 1;
  player.sessionClicks = 0;
  player.sessionClickTimestamps = [];

  if (player.stage === 'button' && player.crashes >= 2) {
    player.stage = 'shape_test';
  } else if (player.stage === 'post_shapes_crash') {
    player.stage = 'mundane_clicker';
    if (!player.clickerStartedAt) player.clickerStartedAt = new Date().toISOString();
  }

  saveDb(db);
  return res.json(buildClientPayload(player));
});

// Conclusão dos bloquinhos -> Erro normal -> próximo F5 abre o Clicker!
app.post('/api/complete-shapes', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  player.stage = 'post_shapes_crash';
  player.crashes += 1;
  saveDb(db);
  res.json({ ok: true, stage: 'post_shapes_crash' });
});

// Clique Manual
app.post('/api/click', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  player.clicks += 1;
  player.sessionClicks += 1;
  db.totalGlobalClicks += 1;

  // Para não inflar o JSON em sessões de 20 minutos, guardamos os primeiros 50 cliques detalhados e os últimos 30
  if (player.history.length < 80) {
    player.history.push({
      clickNumber: player.clicks,
      sessionClick: player.sessionClicks,
      stage: player.stage,
      at: new Date().toISOString(),
    });
  }

  if (player.stage === 'button') {
    const nowMs = typeof req.body?.clientTs === 'number' ? req.body.clientTs : Date.now();
    player.sessionClickTimestamps.push(nowMs);

    const isFirstCrashRun = player.crashes === 0;
    const crashThreshold = isFirstCrashRun ? player.firstCrashClicks : 5;
    const shouldCrash = player.sessionClicks >= crashThreshold;

    let caughtCounting = false;
    if (shouldCrash) {
      if (isFirstCrashRun && detectDeliberateCounting(player.sessionClickTimestamps)) {
        caughtCounting = true;
        if (!player.flags.includes('caught_counting_first_crash')) {
          player.flags.push('caught_counting_first_crash');
        }
        console.log(`[PEGAMOS NO PULO!] Jogador ${player.id.slice(0, 8)} clicou contando no ritmo até o 9º clique!`);
      }
      player.crashes += 1;
    }

    saveDb(db);
    return res.json({
      ok: true,
      token: player.id,
      stage: 'button',
      action: shouldCrash ? 'crash' : 'none',
      caughtCounting,
      crashClickCount: crashThreshold,
    });
  }

  const { grossGain, tax, netGain } = computeManualClickValues(player);
  player.points = Math.round((player.points + netGain) * 10) / 10;

  let remark = null;
  if (player.stage === 'awakened_clicker') {
    if (isAllUpgradesOwned(player)) {
      if (player.sessionClicks % 25 === 0) {
        remark = 'já zerou tudo irmão, não tem mais upgrade nenhum. fecha a aba e mete o pé logo.';
      }
    } else if (player.sessionClicks === 20 && !player.flags.includes('awk_c20')) {
      player.flags.push('awk_c20');
      remark = 'vai logo, junta esses pontos e compra as 3 porqueiras que faltam pra vc sossegar';
    } else if (player.sessionClicks === 55 && !player.flags.includes('awk_c55')) {
      player.flags.push('awk_c55');
      remark = 'o cara tem pombo e ventilador amarrado no mouse clicando pra ele e ainda clica na mão kkkkk';
    }
  }

  saveDb(db);

  return res.json({
    ok: true,
    ...buildClientPayload(player),
    grossGain,
    tax,
    remark,
  });
});

// Tick de 1 segundo da Produção Automática (Geradores)
app.post('/api/passive-tick', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  if (player.stage === 'mundane_clicker' || player.stage === 'awakened_clicker') {
    const cps = computeTotalCps(player);
    if (cps > 0) {
      player.points = Math.round((player.points + cps) * 10) / 10;
      saveDb(db);
    }
  }
  res.json(buildClientPayload(player));
});

// Recompensa de Eventos Aleatórios na Tela (Mosca na tela, Pesquisa de Satisfação, Caixa Misteriosa)
app.post('/api/claim-event', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  const { eventType } = req.body || {};

  if (player.stage !== 'mundane_clicker' && player.stage !== 'awakened_clicker') {
    return res.status(400).json({ ok: false });
  }

  const cps = computeTotalCps(player);
  let bonus = 1;
  if (eventType === 'fly') {
    // Matar a mosca dá ~18 segundos de produção (acelera muito de forma divertida!)
    bonus = Math.max(25, Math.floor(cps * 18));
  } else if (eventType === 'survey') {
    bonus = Math.max(15, Math.floor(cps * 10));
  } else if (eventType === 'mystery_box') {
    // Troll: Caixa misteriosa épica dá literalmente +1 ponto kkkkk
    bonus = 1;
  }

  player.points = Math.round((player.points + bonus) * 10) / 10;
  saveDb(db);

  let remark = null;
  if (player.stage === 'awakened_clicker') {
    if (eventType === 'fly') remark = 'matou uma mosca de pixel na tela por pontinho virtual, que orgulho hein';
    if (eventType === 'mystery_box') remark = 'kkkkkk ganhou +1 ponto na caixa brilhante, cai em qualquer isca msm';
  }

  res.json({
    ok: true,
    bonus,
    remark,
    ...buildClientPayload(player),
  });
});

// Compra de Gerador Repetível ("Automação")
app.post('/api/buy-generator', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  const { genId } = req.body || {};
  const gen = GEN_MAP[genId];

  if (!gen || (player.stage !== 'mundane_clicker' && player.stage !== 'awakened_clicker')) {
    return res.status(400).json({ ok: false });
  }

  const ownedCount = player.generators[gen.id] || 0;
  const cost = getGeneratorCost(gen, ownedCount);

  if (player.points < cost) {
    return res.json({ ok: false, ...buildClientPayload(player) });
  }

  player.points = Math.round((player.points - cost) * 10) / 10;
  player.generators[gen.id] = ownedCount + 1;
  saveDb(db);

  let remark = null;
  if (player.stage === 'awakened_clicker' && gen.id === 'lan_house' && player.generators[gen.id] === 1) {
    remark = 'comprou uma lan house falida de 2007 inteira só pra terminar logo kkkkk boa';
  }

  res.json({
    ok: true,
    boughtGen: gen.id,
    remark,
    ...buildClientPayload(player),
  });
});

// Compra de Upgrade de Interface / Power-up
app.post('/api/buy', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  const { itemId } = req.body || {};
  const item = SHOP_MAP[itemId];

  if (!item || (player.stage !== 'mundane_clicker' && player.stage !== 'awakened_clicker')) {
    return res.status(400).json({ ok: false });
  }

  if (player.upgrades.includes(item.id) || player.points < item.cost) {
    return res.json({ ok: false, ...buildClientPayload(player) });
  }

  player.points = Math.round((player.points - item.cost) * 10) / 10;
  player.upgrades.push(item.id);

  // GATILHO DO 13º ITEM ('cloud_sync' — faltando os 3 últimos!): DÁ ERRO E O CARA FALA PELA 1ª VEZ!
  if (item.triggersAwakening && player.stage === 'mundane_clicker') {
    player.stage = 'awakening_error';
    player.crashes += 1;
    saveDb(db);
    return res.json({
      ok: true,
      bought: item.id,
      triggerAwakeningCrash: true,
      ...buildClientPayload(player),
    });
  }

  let remark = null;
  if (player.stage === 'awakened_clicker') {
    if (isAllUpgradesOwned(player)) {
      const mins = getMinutesInClicker(player);
      remark = `pronto. 16 de 16. vc gastou ${mins} minutos da tua vida comprando pombo, ventilador e botão dourado. acabou o joguinho campeão, zerou. pode fechar a aba e meter o pé daqui.`;
    } else {
      const remaining = SHOP_ITEMS.length - player.upgrades.length;
      const itemRemarks = {
        elevator_music: `comprou musiquinha de sala de espera de dentista kkkkk faltam só ${remaining}, acaba logo com isso`,
        turbo_click: `triplicou tudo pra acabar mais rápido grazadeus. falta ${remaining}`,
        vip_gold: `botão dourado brega comprado. falta ${remaining}`,
      };
      remark = itemRemarks[item.id] || `menos um. faltam ${remaining} pra vc terminar esse brinquedinho e sumir.`;
    }
  }

  saveDb(db);

  return res.json({
    ok: true,
    bought: item.id,
    remark,
    ...buildClientPayload(player),
  });
});

app.post('/api/enter-awakened', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  player.stage = 'awakened_clicker';
  saveDb(db);
  res.json({ ok: true, ...buildClientPayload(player) });
});

app.post('/api/search', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  const query = String(req.body?.query || '').trim().toLowerCase();

  if (player.stage !== 'awakened_clicker') {
    return res.json({
      mode: 'silent',
      result: `0 resultados encontrados para "${query.slice(0, 30)}".`,
    });
  }

  saveDb(db);
  let remark = `tá pesquisando "${query.slice(0, 24)}" pq? acha que isso aqui é o google?`;
  let mood = 'stop';

  if (!query) {
    remark = 'vai pesquisar vento? digita direito pô';
  } else if (['sair', 'fechar', 'quit', 'exit'].includes(query)) {
    remark = 'o X da aba fica lá em cima no canto direito irmão, mete o pé';
    mood = 'point';
  } else if (['senha', 'resposta', 'codigo', 'código', 'segredo', 'ajuda', 'dica', 'enigma'].includes(query)) {
    remark = `kkkkkk o cara digitou "${query}" achando que tem alguma coisa escondida aqui`;
    mood = 'middle';
  } else if (['quem é vc', 'quem e vc', 'quem é você', 'oi', 'ola', 'olá', 'alo'].includes(query)) {
    remark = 'não te interessa quem eu sou irmão, termina teus cliques e vaza';
    mood = 'stop';
  }

  return res.json({ mode: 'awakened', remark, mood });
});

app.post('/api/behavior', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  const { type } = req.body || {};

  if (player.stage !== 'awakened_clicker') {
    return res.json({ ok: true, remark: null });
  }

  if (type && !player.flags.includes(`bh_${type}`)) {
    player.flags.push(`bh_${type}`);
    saveDb(db);
  }

  const reactions = {
    select_all: 'ctrl+a procurando texto escondido? para de viajar cara',
    context_menu: 'botão direito não vai te dar nada aqui não fi',
    tab_return: 'voltou pq? achei que já tinha ido embora de vez',
    sun_poke: 'para de clicar nessa bosta de sol mal desenhado mano kkkkk',
  };

  res.json({ ok: true, remark: reactions[type] || null });
});

// Painel de Testes DEV
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/_debug', (_req, res) => {
    res.json(loadDb());
  });

  app.get('/api/_reset', (_req, res) => {
    const empty = { totalGlobalClicks: 0, players: {} };
    saveDb(empty);
    res.clearCookie(COOKIE_NAME);
    res.json({ reset: true });
  });

  app.post('/api/_dev/action', (req, res) => {
    const { action } = req.body || {};

    if (action === 'reset') {
      const empty = { totalGlobalClicks: 0, players: {} };
      saveDb(empty);
      res.clearCookie(COOKIE_NAME);
      return res.json({ ok: true });
    }

    const { db, player } = resolvePlayer(req, res, req.body);

    if (action === 'goto_button_0') {
      player.stage = 'button';
      player.crashes = 0;
      player.sessionClicks = 0;
      player.clicks = 0;
      player.points = 0;
      player.upgrades = [];
      player.generators = {};
      player.flags = [];
      player.clickerStartedAt = null;
    } else if (action === 'goto_shapes') {
      player.stage = 'shape_test';
      player.crashes = 2;
      if (player.clicks < 14) player.clicks = 14;
    } else if (action === 'goto_mundane') {
      player.stage = 'mundane_clicker';
      player.crashes = 3;
      player.upgrades = [];
      player.generators = {};
      player.points = 0;
      player.clickerStartedAt = new Date().toISOString();
    } else if (action === 'goto_pre_crash_buy') {
      // Simula ~15 minutos jogados: 12 upgrades comprados, geradores rodando e saldo pronto pra comprar "Backup em Nuvem" (175k)!
      player.stage = 'mundane_clicker';
      player.crashes = 3;
      player.upgrades = SHOP_ITEMS.slice(0, 12).map((i) => i.id);
      player.generators = {
        ghost_finger: 12,
        pigeon: 10,
        oscillating_fan: 8,
        nephew: 6,
        excel_macro: 4,
        lan_house: 2,
      };
      player.points = 185000;
      player.clicks = 640;
      player.clickerStartedAt = new Date(Date.now() - 16 * 60000).toISOString();
    } else if (action === 'goto_awakening_error') {
      player.stage = 'awakening_error';
      player.upgrades = SHOP_ITEMS.slice(0, 13).map((i) => i.id);
      player.generators = { pigeon: 8, oscillating_fan: 6, nephew: 4, lan_house: 1 };
      player.clicks = 640;
      player.clickerStartedAt = new Date(Date.now() - 16 * 60000).toISOString();
    } else if (action === 'goto_awakened_last3') {
      player.stage = 'awakened_clicker';
      player.upgrades = SHOP_ITEMS.slice(0, 13).map((i) => i.id);
      player.generators = {
        ghost_finger: 12,
        pigeon: 10,
        oscillating_fan: 8,
        nephew: 7,
        excel_macro: 5,
        lan_house: 3,
      };
      player.points = 300000;
      player.clicks = 680;
      player.clickerStartedAt = new Date(Date.now() - 17 * 60000).toISOString();
    } else if (action === 'add_points_small') {
      player.points = Math.round((player.points + 2500) * 10) / 10;
    } else if (action === 'add_points_big') {
      player.points = Math.round((player.points + 500000) * 10) / 10;
    }

    saveDb(db);
    res.json({ ok: true, stage: player.stage, points: player.points });
  });
}

app.listen(PORT, () => {
  console.log(`👁️  Servidor Don't Click rodando na porta ${PORT}`);
});
