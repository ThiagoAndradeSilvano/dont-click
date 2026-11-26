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

// Catálogo da lojinha com escrita humana, crua e debochada (zero cara de IA)
const CAGE_SHOP = {
  sound: {
    id: 'sound',
    name: 'barulhinho de clique',
    cost: 10,
    desc: 'faz tec quando aperta. igual brinquedo de cachorro.',
    afterBuyRemark: 'pronto, agora além de clicar igual maluco vc faz barulho. parabéns',
  },
  particles: {
    id: 'particles',
    name: 'confete vagabundo',
    cost: 25,
    desc: 'solta umas corzinhas pra parecer que vc tá indo super bem.',
    afterBuyRemark: 'olha lá que lindo os quadradinho caindo... emocionante né',
  },
  tax_mult: {
    id: 'tax_mult',
    name: 'dobrar pontos (confia)',
    cost: 45,
    desc: 'passa a ganhar +2 por clique. sem pegadinha.',
    afterBuyRemark: 'ganha 2 e me paga 1 de aluguel do botão kkkkkk achou que era festa?',
  },
  auto_drip: {
    id: 'auto_drip',
    name: 'script meia-boca',
    cost: 70,
    desc: 'clica sozinho bem devagar pq deu preguiça de otimizar.',
    afterBuyRemark: 'boa, agora nem clicar vc precisa mais. pode ficar só olhando pro nada',
  },
};

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
  if (typeof player.sessionClicks !== 'number') player.sessionClicks = 0;
  if (typeof player.crashes !== 'number') player.crashes = 0;
  if (!player.stage) player.stage = 'button'; // 'button' | 'intercepted_error' | 'cage'
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
  return Object.values(CAGE_SHOP).map((item) => ({
    id: item.id,
    name: item.name,
    cost: item.cost,
    desc: item.desc,
    owned: player.upgrades.includes(item.id),
  }));
}

// Chamado quando a página abre ou recarrega (F5 / botão Recarregar)
app.post('/api/session', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  player.visits += 1;
  player.sessionClicks = 0;

  // Se ele já caiu 2 vezes no botão inicial e acabou de recarregar (F5 ou botão Recarregar),
  // ele cai direto na tela de erro "invadida" pelo operador!
  if (player.stage === 'button' && player.crashes >= 2) {
    player.stage = 'intercepted_error';
  }

  saveDb(db);

  console.log(
    `[SESSÃO] Jogador ${player.id.slice(0, 8)} | Stage: ${player.stage} | Quedas: ${player.crashes} | Cliques totais: ${player.clicks}`
  );

  if (player.stage === 'intercepted_error') {
    return res.json({
      token: player.id,
      stage: 'intercepted_error',
      totalClicks: player.clicks,
    });
  }

  if (player.stage === 'cage') {
    return res.json({
      token: player.id,
      stage: 'cage',
      totalClicks: player.clicks,
      points: Math.floor(player.points * 10) / 10,
      upgrades: player.upgrades,
      shop: buildShopState(player),
    });
  }

  return res.json({
    token: player.id,
    stage: 'button',
    buttonLabel: 'Botão',
  });
});

// Transição quando o jogador clica no botão "Recarregar" ao final do monólogo na tela de erro invadida
app.post('/api/enter-cage', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);

  if (player.stage === 'intercepted_error' || player.crashes >= 2) {
    player.stage = 'cage';
    saveDb(db);
  }

  res.json({
    ok: true,
    stage: player.stage,
    totalClicks: player.clicks,
    points: Math.floor(player.points * 10) / 10,
    upgrades: player.upgrades,
    shop: buildShopState(player),
  });
});

// Clique no botão (tanto no estágio inicial quanto na Gaiola de Dopamina)
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

  // ESTÁGIO 1: Botão Seco (9 cliques na 1ª queda, 5 cliques na 2ª queda)
  if (player.stage === 'button') {
    const crashThreshold = player.crashes === 0 ? 9 : 5;
    const shouldCrash = player.sessionClicks >= crashThreshold;

    if (shouldCrash) {
      player.crashes += 1;
    }

    saveDb(db);

    console.log(
      `[CLIQUE BOTÃO] Jogador ${player.id.slice(0, 8)} | Sessão: ${player.sessionClicks}/${crashThreshold} | Quedas: ${player.crashes} | Crash: ${shouldCrash}`
    );

    return res.json({
      ok: true,
      token: player.id,
      stage: 'button',
      buttonLabel: 'Botão',
      action: shouldCrash ? 'crash' : 'none',
    });
  }

  // ESTÁGIO 2: A Gaiola de Dopamina (Clicker Sarcástico)
  const hasTaxMult = player.upgrades.includes('tax_mult');
  // Se comprou o multiplicador troll, ganha +2 bruto e perde -1 de imposto = continua ganhando +1 líquido!
  const grossGain = hasTaxMult ? 2 : 1;
  const tax = hasTaxMult ? 1 : 0;
  const netGain = grossGain - tax;

  player.points = Math.round((player.points + netGain) * 10) / 10;

  // Comentários reativos curtos e naturais conforme ele clica na gaiola
  let remark = null;
  if (player.sessionClicks === 15 && !player.flags.includes('cage_15')) {
    player.flags.push('cage_15');
    remark = '15 cliques já... vc realmente não tinha nada melhor pra fazer hoje né';
  } else if (player.sessionClicks === 40 && !player.flags.includes('cage_40')) {
    player.flags.push('cage_40');
    remark = 'mano vc sabe que esse número não serve pra porra nenhuma né? só perguntando';
  } else if (player.sessionClicks === 85 && !player.flags.includes('cage_85')) {
    player.flags.push('cage_85');
    remark = 'caralho vc ainda tá clicando nisso kkkkkk eu vou até pegar um café';
  }

  saveDb(db);

  return res.json({
    ok: true,
    token: player.id,
    stage: 'cage',
    points: player.points,
    totalClicks: player.clicks,
    grossGain,
    tax,
    remark,
    shop: buildShopState(player),
  });
});

// Tick passivo caso tenha comprado o "Estagiário Invisível"
app.post('/api/passive-tick', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  if (player.stage === 'cage' && player.upgrades.includes('auto_drip')) {
    player.points = Math.round((player.points + 0.2) * 10) / 10;
    saveDb(db);
  }
  res.json({
    points: player.points,
    shop: buildShopState(player),
  });
});

// Compra de upgrade na Lojinha Sarcástica
app.post('/api/buy', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  const { itemId } = req.body || {};
  const item = CAGE_SHOP[itemId];

  if (!item || player.stage !== 'cage') {
    return res.status(400).json({ ok: false, error: 'Item inexistente.' });
  }

  if (player.upgrades.includes(item.id)) {
    return res.json({
      ok: false,
      remark: 'já comprou esse pô, quer pagar duas vezes?',
      points: player.points,
      upgrades: player.upgrades,
      shop: buildShopState(player),
    });
  }

  if (player.points < item.cost) {
    return res.json({
      ok: false,
      remark: `tá duro irmão, custa ${item.cost} e vc só tem ${player.points}. clica mais aí`,
      points: player.points,
      upgrades: player.upgrades,
      shop: buildShopState(player),
    });
  }

  player.points = Math.round((player.points - item.cost) * 10) / 10;
  player.upgrades.push(item.id);
  saveDb(db);

  return res.json({
    ok: true,
    bought: item.id,
    remark: item.afterBuyRemark,
    points: player.points,
    upgrades: player.upgrades,
    shop: buildShopState(player),
  });
});

// Registra eventos psicológicos (ex: abriu F12, deu Ctrl+A, saiu da aba, tentou URL suspeita)
app.post('/api/behavior', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  const { type } = req.body || {};
  if (type && !player.flags.includes(`bh_${type}`)) {
    player.flags.push(`bh_${type}`);
    saveDb(db);
  }

  const reactions = {
    select_all: 'ctrl+a procurando texto escondido? para de viajar cara',
    context_menu: 'botão direito não vai te dar resposta nenhuma não fi',
    tab_return: 'ih voltou... foi pesquisar no google e quebrou a cara né',
  };

  res.json({ ok: true, remark: reactions[type] || null });
});

// Rotas internas de dev (Painel de Testes no canto da tela)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/_debug', (_req, res) => {
    res.json(loadDb());
  });

  app.get('/api/_reset', (_req, res) => {
    const empty = { totalGlobalClicks: 0, players: {} };
    saveDb(empty);
    res.clearCookie(COOKIE_NAME);
    res.json({ reset: true, message: 'Estado zerado! Pode testar do início em http://localhost:3690/' });
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
    } else if (action === 'goto_button_1') {
      player.stage = 'button';
      player.crashes = 1;
      player.sessionClicks = 0;
      if (player.clicks < 9) player.clicks = 9;
    } else if (action === 'goto_hijack') {
      player.stage = 'intercepted_error';
      player.crashes = 2;
      player.sessionClicks = 0;
      if (player.clicks < 14) player.clicks = 14;
    } else if (action === 'goto_cage') {
      player.stage = 'cage';
      if (player.crashes < 2) player.crashes = 2;
      if (player.clicks < 14) player.clicks = 14;
    } else if (action === 'add_points') {
      player.stage = 'cage';
      player.points = Math.round((player.points + 100) * 10) / 10;
    }

    saveDb(db);
    res.json({ ok: true, stage: player.stage, points: player.points });
  });
}

app.listen(PORT, () => {
  console.log(`👁️  Servidor Don't Click rodando na porta ${PORT}`);
});
