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
    'shitty_loading',
    'subsolo_2d',
    'cave_2d',
    'cave_escaped',
  ];
  if (!validStages.includes(player.stage)) player.stage = 'button';
  if (typeof player.sessionClicks !== 'number') player.sessionClicks = 0;
  if (typeof player.crashes !== 'number') player.crashes = 0;
  if (typeof player.firstCrashClicks !== 'number') player.firstCrashClicks = 9;
  if (typeof player.points !== 'number') player.points = 0;
  if (typeof player.temperature !== 'number') player.temperature = 23;
  if (typeof player.postMaxClicks !== 'number') player.postMaxClicks = 0;
  if (typeof player.overheated !== 'boolean') player.overheated = false;
  if (typeof player.forcedSubsolo !== 'boolean') player.forcedSubsolo = false;
  if (typeof player.lampBroken !== 'boolean') player.lampBroken = false;
  if (typeof player.subsoloSolved !== 'boolean') player.subsoloSolved = false;
  if (!player.caveState || typeof player.caveState !== 'object') {
    player.caveState = {
      row: 1,
      col: 2,
      inventory: ['0'], // começa com a maçã na mochila igual no original!
      cleared: [], // ex: 'boulder', 'beam', 'gap', 'water', 'padlock_door'
      plungerArmed: false,
      introDone: false,
    };
  }
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
    temperature: player.temperature,
    overheated: player.overheated,
    forcedSubsolo: player.forcedSubsolo,
    lampBroken: player.lampBroken,
    subsoloSolved: player.subsoloSolved,
    caveState: player.caveState,
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
    if (isAllUpgradesOwned(player) && !player.overheated) {
      player.postMaxClicks += 1;
      // Bem espaçado pra não espamar, e na maioria das vezes NÃO fala de clima (só solta uma referência bem sutil lá na frente!)
      if (player.postMaxClicks === 30) {
        remark = 'mano já deu 16 de 16, acabou o jogo. para de gastar o botão à toa.';
      } else if (player.postMaxClicks === 75) {
        remark = 'vc tem algum problema com encerramento de ciclos? não tem mais nada pra comprar cara.';
      } else if (player.postMaxClicks === 130) {
        remark = 'vai lá fora ver se tá chovendo, sei lá... qualquer coisa é melhor que mofar aqui dentro.';
      } else if (player.postMaxClicks === 200) {
        remark = 'sério, até eu tô suando de agonia vendo vc clicar nesse botão dourado sem parar.';
      } else if (player.postMaxClicks > 200 && player.postMaxClicks % 120 === 0) {
        remark = 'ainda clicando no nada... paciência de monge ou falta do que fazer msm.';
      }
    } else if (!player.overheated && player.sessionClicks === 35 && !player.flags.includes('awk_c35')) {
      player.flags.push('awk_c35');
      remark = 'junta logo esses pontos e compra as 3 porqueiras que faltam pra vc sossegar';
    } else if (!player.overheated && player.sessionClicks === 110 && !player.flags.includes('awk_c110')) {
      player.flags.push('awk_c110');
      remark = 'tem pombo e ventilador clicando por vc e vc ainda martelando na mão kkkkk';
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
  } else if (player.overheated && ['subsolo', 'o subsolo', '/subsolo'].includes(query)) {
    // COMANDO DE FUGA DIGITADO NO MEIO DO INCÊNDIO! Vai pro Loading Porco!
    player.stage = 'shitty_loading';
    saveDb(db);
    return res.json({
      mode: 'escape_to_loading',
      stage: 'shitty_loading',
    });
  } else if (player.overheated) {
    remark = `NÃO É "${query.slice(0, 18)}" SEU CEGO!! DIGITA subsolo AÍ EM CIMA E DÁ ENTER LOGO ANTES QUE FRITE TUDO!!`;
    mood = 'middle';
  } else if (['clima', 'temperatura', 'graus', 'calor', 'frio', '23', '23°c', 'termostato'].includes(query)) {
    remark = 'é só um widget vagabundo marcando a temperatura da sala, não tem previsão nenhuma aí não';
    mood = 'stop';
  } else if (['subsolo', '/subsolo'].includes(query)) {
    remark = 'que porra de subsolo mano? não tem motivo nenhum pra descer lá agora.';
    mood = 'stop';
  } else if (['sair', 'fechar', 'quit', 'exit'].includes(query)) {
    remark = 'o X da aba fica lá em cima no canto direito irmão, mete o pé';
    mood = 'point';
  } else if (['senha', 'resposta', 'codigo', 'código', 'segredo', 'ajuda', 'dica', 'enigma'].includes(query)) {
    remark = `kkkkkk o cara digitou "${query}" achando que eu vou dar colher de chá`;
    mood = 'middle';
  } else if (['quem é vc', 'quem e vc', 'quem é você', 'oi', 'ola', 'olá', 'alo'].includes(query)) {
    remark = 'não te interessa quem eu sou irmão, termina teus cliques e vaza';
    mood = 'stop';
  }

  return res.json({ mode: 'awakened', remark, mood });
});

// Alterar a temperatura no Widget de Clima (0 a 99, sem negativo! Se passar de 80 -> QUEBRA O RELÓGIO E PEGA FOGO!)
app.post('/api/set-temperature', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);

  if (player.stage !== 'awakened_clicker' || !isAllUpgradesOwned(player)) {
    return res.status(400).json({ ok: false });
  }

  // Se já quebrou/superaqueceu, não dá mais pra voltar!
  if (player.overheated) {
    return res.json({
      ok: false,
      locked: true,
      temperature: player.temperature,
      overheated: true,
      remark: 'JÁ ERA O TERMOSTATO, QUEBROU A PORRA DO RELÓGIO!! DIGITA subsolo NA BARRA DE PESQUISA E DÁ ENTER LOGO!!',
    });
  }

  let rawTemp = Math.floor(Number(req.body?.temperature));
  if (Number.isNaN(rawTemp)) rawTemp = 23;
  // Trava estritamente entre 0 e 99 (sem negativo!)
  const clamped = Math.max(0, Math.min(99, rawTemp));
  player.temperature = clamped;

  let remark = null;
  let remarksBurst = null;
  if (clamped >= 80) {
    player.overheated = true;
    // Em vez de um textão gigante, manda rajadas curtas e rápidas de desespero!
    remarksBurst = [
      `PUTA QUE PARIU VC BOTOU ${clamped} GRAUS?!`,
      'QUEBROU A PORRA DO RELÓGIO, NÃO VOLTA MAIS PRO 23!! VAI DERRETER TUDO!',
      'RÁPIDO, DIGITA subsolo NA BARRA DE PESQUISA AÍ EM CIMA E APERTA ENTER AGORA!!',
    ];
  } else if (clamped >= 45) {
    remark = `tá maluco botando ${clamped} graus aqui dentro?! tá cheirando queimado, volta pro 23!`;
  } else if (clamped < 12) {
    remark = `${clamped} graus? quer congelar os pombos? para de fuçar nesse número mano`;
  } else if (clamped !== 23) {
    remark = 'ei!! quem mandou clicar na temperatura?? deixa no 23 quieto!';
  }

  saveDb(db);
  return res.json({
    ok: true,
    temperature: player.temperature,
    overheated: player.overheated,
    remark,
    remarksBurst,
  });
});

// Caso o jogador fique parado olhando pro fogo e NÃO escreva "subsolo", ele mesmo digita à força pra salvar tudo!
app.post('/api/force-subsolo-escape', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  player.overheated = true;
  player.forcedSubsolo = true;
  player.stage = 'shitty_loading';
  saveDb(db);
  res.json({ ok: true, stage: 'shitty_loading', forcedSubsolo: true });
});

// Conclui o Loading Porco e entra oficialmente no Novo Ambiente 2D ("Subsolo")!
app.post('/api/finish-loading', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  player.stage = 'subsolo_2d';
  saveDb(db);
  res.json({ ok: true, ...buildClientPayload(player) });
});

// Quebrar a lâmpada do Subsolo (necessário para tirar o reflexo de luz do visor sem cortar a energia!)
app.post('/api/subsolo/break-lamp', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  player.lampBroken = true;
  saveDb(db);
  res.json({
    ok: true,
    lampBroken: true,
    remark: 'CARALHO VC ESTOUROU A ÚNICA LÂMPADA DO PORÃO NA PORRADA?! agora fica no escuro aí igual morcego!',
  });
});

/*
 * VALIDAÇÃO DO ENIGMA DO SUBSOLO 2D (100% no servidor):
 * - A lâmpada pisca em Código Morse: 7 (--...)  4 (....-)  2 (..---)  -> Sinal: 742
 * - A placa metálica na parede informa a conta simples:
 *   "SENHA = SINAL - 42"
 *   -> 742 - 42 = 700!
 * - Ao digitar 700, o painel estremece toda a estrutura do porão e desaba na Caverna!
 */
app.post('/api/subsolo/unlock', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  const code = String(req.body?.code || '').trim();

  if (code === '742') {
    return res.json({
      ok: false,
      errorType: 'raw_morse',
      screenMsg: 'FAÇA A CONTA!',
      remark: null,
    });
  }

  if (code !== '700' && code !== '244') {
    return res.json({
      ok: false,
      errorType: 'wrong',
      screenMsg: 'SENHA INCORRETA',
      remark: null,
    });
  }

  // ACERTOU 700! O PAINEL DÁ DEFEITO, O PISO DO SUBSOLO RACHA E DESPENCA NA CAVERNA!
  player.subsoloSolved = true;
  player.stage = 'cave_2d';
  saveDb(db);

  return res.json({
    ok: true,
    stage: 'cave_2d',
    collapse: true,
    screenMsg: 'ERRO ESTRUTURAL!!',
    remark: 'QUE PORRA DE ESTRONDO FOI ESSE AÍ EMBAIXO?! O QUE VC TÁ APRONTANDO?! ESPERA, O PISO TÁ AFUNDANDO—',
    caveState: player.caveState,
  });
});

// Sincroniza estado da Caverna (movimento, itens coletados, cadeado 7-9-4 e saída final!)
app.post('/api/cave/sync', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  const { caveState, eventCode, padlockAttempt } = req.body || {};

  if (caveState && typeof caveState === 'object') {
    player.caveState = {
      row: Math.max(1, Math.min(4, Number(caveState.row) || 1)),
      col: Math.max(1, Math.min(12, Number(caveState.col) || 2)),
      inventory: Array.isArray(caveState.inventory) ? caveState.inventory.slice(0, 20) : ['0'],
      cleared: Array.isArray(caveState.cleared) ? caveState.cleared.slice(0, 20) : [],
      plungerArmed: Boolean(caveState.plungerArmed),
      introDone: Boolean(caveState.introDone),
    };
  }

  // Validação do Cadeado da Caverna (Nota 1 = maia 7, Nota 2 = maia 6, Nota 3 = maia 3 -> 763, ou 794 do SCSS original!)
  let padlockUnlocked = false;
  if (typeof padlockAttempt === 'string') {
    if (padlockAttempt === '763' || padlockAttempt === '794') {
      padlockUnlocked = true;
      if (!player.caveState.cleared.includes('padlock_door')) {
        player.caveState.cleared.push('padlock_door');
      }
    }
  }

  if (eventCode === 'cave_win') {
    player.stage = 'cave_escaped';
  }

  // Falas do Operador completamente confuso/assustado porque NEM ELE sabe de onde veio essa caverna!
  const caveRemarks = {
    intro_done: 'mano... que porra de lugar é esse?? até o som do meu teclado tá dando eco aqui embaixo... eu NÃO programei caverna nenhuma!',
    got_pickaxe: 'uma picareta velha? quem deixou asset de joguinho de mina enterrado debaixo do meu código??',
    broke_boulder: 'boa, arrebentou a pedra. mas namoral, olha esses olhinhos piscando no escuro... eu tô começando a ficar cabreiro.',
    armed_plunger: 'caralho tremeu a caverna inteira!! vc apertou um detonador sem nem saber onde tá a bomba?!',
    got_plank: 'tábua podre na mochila... beleza, vamo sair logo desse buraco que esse eco tá me dando agonia.',
    placed_plank: 'ponte improvisada no grito. pelo menos o chão não cedeu de novo.',
    got_note: 'tem bilhete escrito aqui embaixo?? lê isso aí na mochila, não fui eu que escrevi essa letra não!',
    padlock_wrong: 'nada... o cadeado nem mexeu. olha direito aquelas 3 notas que vc achou nas caixas.',
    padlock_open: 'abriu!! esses traços e bolinhas nas notas eram números antigos... mano, de quem são essas anotações aqui embaixo??',
    got_handle: 'achou uma manivela de engrenagem. deve encaixar em algum mecanismo lá mais pro fundo.',
    stopped_water: 'fechou a cachoeira! vamo ver o que tem atrás dessa água.',
    got_dynamite: 'bananas de dinamite... só falta achar estopim agora pra gente explodir uma saída daqui.',
    got_fuses: 'pegou os estopins! agora junta com a dinamite naquela porta bloqueada lá de cima pra gente dar o fora!',
    cave_win: 'EXPLODIU!! caralho finalmente luz... espera. onde é que essa saída vai dar agora?!',
  };

  saveDb(db);
  res.json({
    ok: true,
    padlockUnlocked,
    caveState: player.caveState,
    remark: padlockAttempt && !padlockUnlocked ? caveRemarks.padlock_wrong : caveRemarks[eventCode] || null,
  });
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

    // Reseta sempre estados sujos de fases avançadas (fogo, temperatura, lâmpada quebrada, etc.)
    // antes de aplicar a página escolhida pra NUNCA vazar fogo ou travamento entre capítulos!
    const cleanBase = () => {
      player.sessionClicks = 0;
      player.sessionClickTimestamps = [];
      player.temperature = 23;
      player.overheated = false;
      player.forcedSubsolo = false;
      player.postMaxClicks = 0;
      player.lampBroken = false;
      player.subsoloSolved = false;
      player.flags = [];
    };

    if (action === 'goto_page_1_button') {
      // Página 1: Botão Branco Inicial
      cleanBase();
      player.stage = 'button';
      player.crashes = 0;
      player.clicks = 0;
      player.points = 0;
      player.upgrades = [];
      player.generators = {};
      player.clickerStartedAt = null;
    } else if (action === 'goto_page_2_shapes') {
      // Página 2: Bloquinhos de Criança
      cleanBase();
      player.stage = 'shape_test';
      player.crashes = 2;
      player.clicks = 14;
    } else if (action === 'goto_page_3_clicker_start') {
      // Página 3: Fake Game Clicker (Mudo - Começo 0/16)
      cleanBase();
      player.stage = 'mundane_clicker';
      player.crashes = 3;
      player.upgrades = [];
      player.generators = {};
      player.points = 0;
      player.clicks = 14;
      player.clickerStartedAt = new Date().toISOString();
    } else if (action === 'goto_page_4_awakening_error') {
      // Página 4: Tela de Erro onde Ele Fala pela 1ª Vez (após Backup em Nuvem)
      cleanBase();
      player.stage = 'awakening_error';
      player.crashes = 4;
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
      player.clicks = 640;
      player.clickerStartedAt = new Date(Date.now() - 16 * 60000).toISOString();
    } else if (action === 'goto_page_5_clicker_end') {
      // Página 5: Clicker com Ele Acordado + 16/16 Zerado (Enigma da Temperatura -> Incêndio -> "subsolo")
      cleanBase();
      player.stage = 'awakened_clicker';
      player.crashes = 4;
      player.upgrades = SHOP_ITEMS.map((i) => i.id);
      player.generators = {
        ghost_finger: 15,
        pigeon: 12,
        oscillating_fan: 10,
        nephew: 8,
        excel_macro: 6,
        lan_house: 4,
      };
      player.points = 125000;
      player.clicks = 720;
      player.clickerStartedAt = new Date(Date.now() - 20 * 60000).toISOString();
    } else if (action === 'goto_page_6_loading') {
      // Página 6: Loading Porco Windows 98 + Chat Interativo
      cleanBase();
      player.stage = 'shitty_loading';
      player.overheated = true;
      player.temperature = 99;
    } else if (action === 'goto_page_7_subsolo') {
      // Página 7: Porão / Subsolo 2D (Morse + Água/Ralo/Vapor + Lâmpada -> Senha 244)
      cleanBase();
      player.stage = 'subsolo_2d';
      player.overheated = true;
      player.temperature = 99;
    } else if (action === 'goto_page_8_cave') {
      // Página 8: Caverna Pixel Art (WASD + Eco + Mochila + Cadeado + Dinamite)
      cleanBase();
      player.stage = 'cave_2d';
      player.subsoloSolved = true;
      player.caveState = {
        row: 1,
        col: 2,
        inventory: ['0'],
        cleared: [],
        plungerArmed: false,
        introDone: false,
      };
    } else if (action === 'add_points_big') {
      if (player.stage === 'mundane_clicker' || player.stage === 'awakened_clicker') {
        player.points = Math.round((player.points + 500000) * 10) / 10;
      }
    }

    saveDb(db);
    res.json({ ok: true, stage: player.stage, points: player.points });
  });
}

app.listen(PORT, () => {
  console.log(`👁️  Servidor Don't Click rodando na porta ${PORT}`);
});
