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
 * ORDEM EXATA DOS 14 UPGRADES DO CLICKER:
 * - Itens 1 a 10: O jogador vai comprando no modo mudo, achando que esse é o jogo.
 * - Item 11 ('cloud_sync' - faltando 3 pro final!): Parece um upgrade normal, mas DÁ ERRO NA PÁGINA e o cara aparece falando pela 1ª vez!
 * - Itens 12, 13 e 14 (os 3 últimos que faltavam!): O jogador volta pro clicker (agora com o cara vivo reclamando) pra pegar os 3 últimos.
 * - Ao pegar todos (14/14): Ele fala "pronto, acabou o joguinho, pode meter o pé" -> e deixa o 1º ENIGMA escondido nas palavras dele e na tela!
 */
const SHOP_ITEMS = [
  {
    id: 'sound',
    name: 'Áudio do Botão',
    cost: 8,
    desc: 'Habilita emissão sonora simples ao pressionar.',
  },
  {
    id: 'fake_progress',
    name: 'Barra de Carregamento',
    cost: 20,
    desc: 'Adiciona barra visual de sincronização na tela.',
  },
  {
    id: 'kids_theme',
    name: 'Tema Colorido',
    cost: 35,
    desc: 'Aplica plano de fundo alegre e tipografia amigável.',
  },
  {
    id: 'cookie_banner',
    name: 'Aviso de Cookies',
    cost: 55,
    desc: 'Implementa aviso obrigatório de privacidade no rodapé.',
  },
  {
    id: 'search_bar',
    name: 'Barra de Pesquisa',
    cost: 80,
    desc: 'Libera campo de busca no topo da página.',
  },
  {
    id: 'tax_mult',
    name: 'Multiplicador x2',
    cost: 110,
    desc: 'Dobra os pontos por clique (*sujeito a tarifa operacional).',
  },
  {
    id: 'auto_slow',
    name: 'Clique Automático',
    cost: 145,
    desc: 'Gera +1 ponto automaticamente a cada 3 segundos.',
  },
  {
    id: 'weather_widget',
    name: 'Widget de Clima',
    cost: 190,
    desc: 'Exibe informações meteorológicas locais.',
  },
  {
    id: 'achievements',
    name: 'Sistema de Conquistas',
    cost: 240,
    desc: 'Desbloqueia medalhas comemorativas para suas ações.',
  },
  {
    id: 'terms_popup',
    name: 'Termos de Serviço v4.2',
    cost: 300,
    desc: 'Adiciona contrato de licença de usuário final.',
  },
  // === GATILHO DO ERRO FALADO (11º item — faltando os 3 últimos!) ===
  {
    id: 'cloud_sync',
    name: 'Backup em Nuvem',
    cost: 360,
    desc: 'Salva seu progresso automaticamente nos servidores principais.',
    triggersAwakening: true,
  },
  // === OS 3 ÚLTIMOS POWER-UPS QUE FALTAM APÓS VOLTAR DO ERRO ===
  {
    id: 'elevator_music',
    name: 'Música Ambiente',
    cost: 430,
    desc: 'Reproduz trilha instrumental relaxante.',
  },
  {
    id: 'turbo_click',
    name: 'Impulso Triplo (+3)',
    cost: 510,
    desc: 'Aumenta o ganho base para +3 pontos por clique.',
  },
  {
    id: 'vip_gold',
    name: 'Troféu Botão Dourado (100%)',
    cost: 620,
    desc: 'Reveste o botão de ouro e conclui 100% das melhorias.',
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

/*
 * FLUXO DE ESTÁGIOS ATUALIZADO:
 * 1. 'button'            -> Botão seco mudo: 9x cai (erro 1) -> F5 -> 5x cai (erro 2) -> F5 -> vai para 'shape_test'
 * 2. 'shape_test'        -> Bloquinhos de criança! Completou -> dá erro 3 ('post_shapes_crash') -> F5 -> vai para 'mundane_clicker'
 * 3. 'post_shapes_crash' -> Tela de erro normal logo após completar os bloquinhos; ao recarregar abre o clicker mudo
 * 4. 'mundane_clicker'   -> Clicker mudo com 14 upgrades. Ao comprar 'cloud_sync' (faltando 3 upgrades) -> cai em 'awakening_error'!
 * 5. 'awakening_error'   -> Página dá erro, mas É O LOG FALANDO PELA 1ª VEZ! Ao recarregar -> volta pro clicker em 'awakened_clicker'
 * 6. 'awakened_clicker'  -> Volta pro jogo com o cara falando pra pegar os 3 power-ups que faltam. Ao pegar 14/14 -> manda meter o pé + 1º Enigma!
 */
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
  if (!Array.isArray(player.flags)) player.flags = [];
  return player;
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
      flags: [],
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

function buildShopState(player) {
  return SHOP_ITEMS.map((item) => ({
    id: item.id,
    name: item.name,
    cost: item.cost,
    desc: item.desc,
    owned: player.upgrades.includes(item.id),
  }));
}

function isAllUpgradesOwned(player) {
  return SHOP_ITEMS.every((it) => player.upgrades.includes(it.id));
}

function buildClientPayload(player) {
  return {
    token: player.id,
    stage: player.stage,
    totalClicks: player.clicks,
    points: Math.floor(player.points * 10) / 10,
    upgrades: player.upgrades,
    allOwned: isAllUpgradesOwned(player),
    shop: buildShopState(player),
    buttonLabel: 'Botão',
  };
}

// Chamado quando a página carrega / recarrega (F5 ou botão Recarregar)
app.post('/api/session', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  player.visits += 1;
  player.sessionClicks = 0;

  // 1. Depois do 2º erro no começo do jogo -> recarregar leva pros Bloquinhos de Criança!
  if (player.stage === 'button' && player.crashes >= 2) {
    player.stage = 'shape_test';
  }
  // 2. Depois de completar os bloquinhos e dar erro -> recarregar leva pra tela do Clicker Mudo!
  else if (player.stage === 'post_shapes_crash') {
    player.stage = 'mundane_clicker';
  }

  saveDb(db);
  return res.json(buildClientPayload(player));
});

// Conclusão dos bloquinhos de criança -> dispara erro normal e prepara ida pro Clicker no próximo reload!
app.post('/api/complete-shapes', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  player.stage = 'post_shapes_crash';
  player.crashes += 1;
  saveDb(db);

  res.json({ ok: true, stage: 'post_shapes_crash' });
});

// Clique no botão (Cap 0 ou Clicker)
app.post('/api/click', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  player.clicks += 1;
  player.sessionClicks += 1;
  db.totalGlobalClicks += 1;

  player.history.push({
    clickNumber: player.clicks,
    sessionClick: player.sessionClicks,
    stage: player.stage,
    at: new Date().toISOString(),
  });

  // CAP 0: Botão Seco (9x -> erro 1 | 5x -> erro 2)
  if (player.stage === 'button') {
    const crashThreshold = player.crashes === 0 ? player.firstCrashClicks : 5;
    const shouldCrash = player.sessionClicks >= crashThreshold;

    if (shouldCrash) {
      player.crashes += 1;
    }

    saveDb(db);
    return res.json({
      ok: true,
      token: player.id,
      stage: 'button',
      action: shouldCrash ? 'crash' : 'none',
    });
  }

  // CLICKER (Mudo ou Acordado)
  const hasTurbo = player.upgrades.includes('turbo_click');
  const hasTaxMult = player.upgrades.includes('tax_mult');

  let grossGain = hasTurbo ? 3 : 1;
  let tax = 0;

  if (hasTaxMult) {
    grossGain = grossGain * 2;
    tax = hasTurbo ? 2 : 1;
  }

  const netGain = grossGain - tax;
  player.points = Math.round((player.points + netGain) * 10) / 10;

  // Falas reativas SOMENTE quando ele já apareceu ('awakened_clicker'), baseadas APENAS no que o jogador realmente comprou!
  let remark = null;
  if (player.stage === 'awakened_clicker') {
    if (isAllUpgradesOwned(player)) {
      if (player.sessionClicks % 20 === 0) {
        remark = 'já acabou o jogo irmão, não tem mais upgrade nenhum pra comprar. pode fechar a aba e ir embora.';
      }
    } else if (player.sessionClicks === 15 && !player.flags.includes('awk_c15')) {
      player.flags.push('awk_c15');
      remark = 'vai logo, junta esses pontos e compra as 3 porqueiras que faltam pra vc sossegar';
    } else if (player.sessionClicks === 45 && !player.flags.includes('awk_c45')) {
      player.flags.push('awk_c45');
      remark = 'impressionante como vc clica feliz vendo numerozinho inútil subir kkkkk';
    }
  }

  saveDb(db);

  return res.json({
    ok: true,
    token: player.id,
    stage: player.stage,
    points: player.points,
    totalClicks: player.clicks,
    allOwned: isAllUpgradesOwned(player),
    grossGain,
    tax,
    remark,
    shop: buildShopState(player),
  });
});

// Tick do Clique Automático
app.post('/api/passive-tick', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  if ((player.stage === 'mundane_clicker' || player.stage === 'awakened_clicker') && player.upgrades.includes('auto_slow')) {
    player.points = Math.round((player.points + 1) * 10) / 10;
    saveDb(db);
  }
  res.json({
    points: player.points,
    shop: buildShopState(player),
  });
});

// Compra de Upgrade
app.post('/api/buy', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  const { itemId } = req.body || {};
  const item = SHOP_MAP[itemId];

  if (!item || (player.stage !== 'mundane_clicker' && player.stage !== 'awakened_clicker')) {
    return res.status(400).json({ ok: false });
  }

  if (player.upgrades.includes(item.id) || player.points < item.cost) {
    return res.json({
      ok: false,
      ...buildClientPayload(player),
    });
  }

  player.points = Math.round((player.points - item.cost) * 10) / 10;
  player.upgrades.push(item.id);

  // SE COMPROU O "BACKUP EM NUVEM" (11º item, faltando 3!) E AINDA ESTAVA NO CLICKER MUDO -> DÁ ERRO E ELE APARECE!
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

  // Comentários dele ao comprar os upgrades finais (zero spoiler de lore, 100% só cara cuzão/debochado!)
  let remark = null;
  if (player.stage === 'awakened_clicker') {
    if (isAllUpgradesOwned(player)) {
      // ZEROU OS 14 UPGRADES! Manda ir embora!
      remark =
        'pronto. 14 de 14. comprou até a merda do botão dourado. acabou o joguinho campeão, zerou, parabéns. agora já pode fechar a aba e meter o pé daqui.';
    } else {
      const remaining = SHOP_ITEMS.length - player.upgrades.length;
      const itemRemarks = {
        elevator_music: `comprou musiquinha de consultório de dentista kkkkk faltam só ${remaining}, acaba logo com isso`,
        turbo_click: `+3 por clique pra acabar mais rápido grazadeus. falta ${remaining}`,
        vip_gold: `botão dourado brega pra fechar com chave de bosta. falta ${remaining}`,
      };
      remark = itemRemarks[item.id] || `beleza, menos um. faltam ${remaining} pra vc terminar seu brinquedinho e vazar.`;
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

// Quando termina a fala dele na tela de erro do Backup em Nuvem e o jogador clica em Recarregar -> Volta pro Clicker pra pegar os últimos!
app.post('/api/enter-awakened', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  player.stage = 'awakened_clicker';
  saveDb(db);

  res.json({
    ok: true,
    ...buildClientPayload(player),
  });
});

// Barra de Pesquisa
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

  return res.json({
    mode: 'awakened',
    remark,
    mood,
  });
});

// Comportamentos psicológicos (só quando acordado, e checando se o item existe!)
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
      player.flags = [];
    } else if (action === 'goto_shapes') {
      player.stage = 'shape_test';
      player.crashes = 2;
      if (player.clicks < 14) player.clicks = 14;
    } else if (action === 'goto_mundane') {
      player.stage = 'mundane_clicker';
      player.crashes = 3;
      player.upgrades = [];
      player.points = 0;
      if (player.clicks < 14) player.clicks = 14;
    } else if (action === 'goto_pre_crash_buy') {
      // Já deixa com os 10 primeiros comprados e 380 pontos pronto pra comprar o 11º ("Backup em Nuvem") e ver cair!
      player.stage = 'mundane_clicker';
      player.crashes = 3;
      player.upgrades = SHOP_ITEMS.slice(0, 10).map((i) => i.id);
      player.points = 380;
      if (player.clicks < 160) player.clicks = 165;
    } else if (action === 'goto_awakening_error') {
      player.stage = 'awakening_error';
      player.upgrades = SHOP_ITEMS.slice(0, 11).map((i) => i.id);
      if (player.clicks < 160) player.clicks = 165;
    } else if (action === 'goto_awakened_last3') {
      // Volta pro clicker com ele vivo faltando pegar os 3 últimos upgrades!
      player.stage = 'awakened_clicker';
      player.upgrades = SHOP_ITEMS.slice(0, 11).map((i) => i.id);
      player.points = 500;
      if (player.clicks < 160) player.clicks = 165;
    } else if (action === 'add_points') {
      player.points = Math.round((player.points + 400) * 10) / 10;
    }

    saveDb(db);
    res.json({ ok: true, stage: player.stage, points: player.points });
  });
}

app.listen(PORT, () => {
  console.log(`👁️  Servidor Don't Click rodando na porta ${PORT}`);
});
