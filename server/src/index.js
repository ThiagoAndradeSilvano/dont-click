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

// Catálogo expandido de "Upgrades Merda / Funções Idiotas de App" (pra pessoa acreditar que esse é o jogo!)
const BORING_SHOP = {
  sound: {
    id: 'sound',
    name: 'Áudio do Botão',
    cost: 8,
    desc: 'Habilita emissão sonora simples ao pressionar.',
  },
  fake_progress: {
    id: 'fake_progress',
    name: 'Barra de Carregamento',
    cost: 20,
    desc: 'Adiciona barra visual de sincronização do sistema.',
  },
  kids_theme: {
    id: 'kids_theme',
    name: 'Tema Colorido',
    cost: 35,
    desc: 'Aplica plano de fundo alegre e tipografia amigável.',
  },
  cookie_banner: {
    id: 'cookie_banner',
    name: 'Conformidade de Cookies',
    cost: 55,
    desc: 'Implementa aviso obrigatório de privacidade no rodapé.',
  },
  search_bar: {
    id: 'search_bar',
    name: 'Barra de Pesquisa',
    cost: 80,
    desc: 'Libera campo de busca global no cabeçalho.',
  },
  tax_mult: {
    id: 'tax_mult',
    name: 'Multiplicador x2',
    cost: 110,
    desc: 'Dobra os pontos por clique (*sujeito a tarifa operacional).',
  },
  auto_slow: {
    id: 'auto_slow',
    name: 'Clique Automático Básico',
    cost: 145,
    desc: 'Gera +1 ponto automaticamente a cada 3 segundos.',
  },
  weather_widget: {
    id: 'weather_widget',
    name: 'Widget de Clima',
    cost: 190,
    desc: 'Exibe informações meteorológicas em tempo real.',
  },
  achievements: {
    id: 'achievements',
    name: 'Sistema de Conquistas',
    cost: 240,
    desc: 'Desbloqueia medalhas comemorativas para suas ações.',
  },
  terms_popup: {
    id: 'terms_popup',
    name: 'Termos de Serviço v4.2',
    cost: 300,
    desc: 'Adiciona contrato de licença de usuário final.',
  },
  elevator_music: {
    id: 'elevator_music',
    name: 'Música Ambiente',
    cost: 370,
    desc: 'Reproduz trilha instrumental de espera corporativa.',
  },
  turbo_click: {
    id: 'turbo_click',
    name: ' Impulso Triplo (+3)',
    cost: 440,
    desc: 'Aumenta o ganho base para +3 pontos por clique.',
  },
  vip_gold: {
    id: 'vip_gold',
    name: 'Acabamento Dourado VIP',
    cost: 530,
    desc: 'Reveste o botão principal com pintura especial.',
  },
  unlock_menu: {
    id: 'unlock_menu',
    name: 'Liberar Painel Principal',
    cost: 650,
    desc: 'Inicia teste final de aptidão para acessar o sistema completo.',
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
  const validStages = ['button', 'mundane_clicker', 'shape_test', 'awakening_error', 'awakened_hub'];
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
  return Object.values(BORING_SHOP).map((item) => ({
    id: item.id,
    name: item.name,
    cost: item.cost,
    desc: item.desc,
    owned: player.upgrades.includes(item.id),
  }));
}

function buildClientPayload(player) {
  return {
    token: player.id,
    stage: player.stage,
    totalClicks: player.clicks,
    points: Math.floor(player.points * 10) / 10,
    upgrades: player.upgrades,
    shop: buildShopState(player),
    buttonLabel: 'Botão',
  };
}

app.post('/api/session', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  player.visits += 1;
  player.sessionClicks = 0;

  if (player.stage === 'button' && player.crashes >= 2) {
    player.stage = 'mundane_clicker';
  }

  saveDb(db);
  return res.json(buildClientPayload(player));
});

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

  // ESTÁGIO 1: Botão Seco Mudo
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

  // Cálculo de ganho com os upgrades idiotas:
  // Base = 1 (ou 3 se tiver turbo_click)
  // Se tiver tax_mult (Multiplicador x2), dobra o bruto mas cobra metade de tarifa kkkkk!
  // Porém com turbo_click, +3 vira +6 bruto e -2 de tarifa = +4 líquido (assim o jogador consegue avançar bem!)
  const hasTurbo = player.upgrades.includes('turbo_click');
  const hasTaxMult = player.upgrades.includes('tax_mult');

  let grossGain = hasTurbo ? 3 : 1;
  let tax = 0;

  if (hasTaxMult) {
    grossGain = grossGain * 2;
    tax = hasTurbo ? 2 : 1; // Sem turbo: +2 - 1 = +1 (troll total!). Com turbo: +6 - 2 = +4!
  }

  const netGain = grossGain - tax;
  player.points = Math.round((player.points + netGain) * 10) / 10;

  let remark = null;
  if (player.stage === 'awakened_hub') {
    if (player.sessionClicks === 10 && !player.flags.includes('awk_10')) {
      player.flags.push('awk_10');
      remark = 'sério msm q vc voltou a clicar nessa merda dourada dps de tudo q eu falei?';
    } else if (player.sessionClicks === 30 && !player.flags.includes('awk_30')) {
      player.flags.push('awk_30');
      remark = 'eu botei musiquinha de elevador e solzinho do paint pra te espantar e vc aí felizão';
    } else if (player.sessionClicks === 60 && !player.flags.includes('awk_60')) {
      player.flags.push('awk_60');
      remark = 'tá bom vai clicando... eu ia pegar um café msm... quer dizer. esquece.';
    }
  }

  saveDb(db);

  return res.json({
    ok: true,
    token: player.id,
    stage: player.stage,
    points: player.points,
    totalClicks: player.clicks,
    grossGain,
    tax,
    remark,
    shop: buildShopState(player),
  });
});

// Tick do "Clique Automático Básico" (+1 a cada 3s)
app.post('/api/passive-tick', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  if ((player.stage === 'mundane_clicker' || player.stage === 'awakened_hub') && player.upgrades.includes('auto_slow')) {
    player.points = Math.round((player.points + 1) * 10) / 10;
    saveDb(db);
  }
  res.json({
    points: player.points,
    shop: buildShopState(player),
  });
});

app.post('/api/buy', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  const { itemId } = req.body || {};
  const item = BORING_SHOP[itemId];

  if (!item || (player.stage !== 'mundane_clicker' && player.stage !== 'awakened_hub')) {
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

  if (item.id === 'unlock_menu' && player.stage === 'mundane_clicker') {
    player.stage = 'shape_test';
  }

  let remark = null;
  if (player.stage === 'awakened_hub') {
    const snark = {
      sound: 'comprou barulhinho agr? atrasado hein',
      fake_progress: 'essa barra trava no 99% pra sempre kkkkk botei só pra dar agonia',
      kids_theme: 'papel de parede de creche combinou certinho com a tua cara',
      cookie_banner: 'vc literalmente pagou ponto pra bloquear a própria tela com aviso de cookie mano',
      search_bar: 'nem adianta pesquisar resposta aí que eu tô vendo tudo',
      tax_mult: 'dobrou os pontos e dobrou a taxa junto, negócios né pae',
      auto_slow: '1 ponto a cada 3 segundos... velocidade de tartaruga manca',
      weather_widget: 'previsão do tempo num site fechado, utilidade pública zero',
      achievements: 'medalhinha por existir, geração troféu de participação é foda',
      terms_popup: 'ninguém lê essa merda msm, botei receita de bolo no meio',
      elevator_music: 'curtiu esse tecladinho casio de consultório de dentista?',
      turbo_click: 'tá com pressa pra chegar onde irmão?',
      vip_gold: 'pintou o botão de amarelo achando que virou milionário kkkkk',
    };
    remark = snark[item.id] || null;
  }

  saveDb(db);

  return res.json({
    ok: true,
    bought: item.id,
    remark,
    ...buildClientPayload(player),
  });
});

app.post('/api/complete-shapes', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  player.stage = 'awakening_error';
  player.crashes += 1;
  saveDb(db);

  res.json({
    ok: true,
    stage: 'awakening_error',
    totalClicks: player.clicks,
    upgrades: player.upgrades,
  });
});

app.post('/api/enter-awakened', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  player.stage = 'awakened_hub';
  saveDb(db);

  res.json({
    ok: true,
    ...buildClientPayload(player),
  });
});

app.post('/api/search', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  const query = String(req.body?.query || '').trim().toLowerCase();

  if (player.stage !== 'awakened_hub') {
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
    remark = 'o X da aba fica lá em cima no canto direito irmão, ninguém tá te segurando aqui não';
    mood = 'point';
  } else if (['senha', 'resposta', 'codigo', 'código', 'segredo', 'ajuda', 'dica'].includes(query)) {
    remark = `kkkkkk o cara digitou "${query}" na barra de busca achando que eu ia entregar de bandeja`;
    mood = 'middle';
  } else if (['quem é vc', 'quem e vc', 'quem é você', 'oi', 'ola', 'olá', 'alo'].includes(query)) {
    remark = 'não te interessa quem eu sou. aqui não é bate-papo uol não';
    mood = 'stop';
  } else if (['ia', 'robo', 'robô', 'bot', 'chatgpt'].includes(query)) {
    remark = '...do que vc me chamou? lava essa boca antes de achar que eu sou script, seu merdinha';
    mood = 'middle';
  }

  return res.json({
    mode: 'awakened',
    remark,
    mood,
  });
});

app.post('/api/behavior', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  const { type } = req.body || {};

  if (player.stage !== 'awakened_hub') {
    return res.json({ ok: true, remark: null });
  }

  if (type && !player.flags.includes(`bh_${type}`)) {
    player.flags.push(`bh_${type}`);
    saveDb(db);
  }

  const reactions = {
    select_all: 'ctrl+a procurando texto escondido? para de viajar cara',
    context_menu: 'botão direito não vai te dar resposta nenhuma não fi',
    tab_return: 'ih voltou... foi pesquisar no google e quebrou a cara né',
    sun_poke: 'para de cutucar a porra do solzinho, foi mal desenhado de propósito tá?',
  };

  res.json({ ok: true, remark: reactions[type] || null });
});

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
    } else if (action === 'goto_mundane') {
      player.stage = 'mundane_clicker';
      if (player.crashes < 2) player.crashes = 2;
      if (player.clicks < 14) player.clicks = 14;
    } else if (action === 'goto_shapes') {
      player.stage = 'shape_test';
      if (!player.upgrades.includes('kids_theme')) player.upgrades.push('kids_theme');
      if (!player.upgrades.includes('unlock_menu')) player.upgrades.push('unlock_menu');
    } else if (action === 'goto_awakening_error') {
      player.stage = 'awakening_error';
      if (player.clicks < 180) player.clicks = 194;
      if (!player.upgrades.includes('kids_theme')) player.upgrades.push('kids_theme');
      if (!player.upgrades.includes('search_bar')) player.upgrades.push('search_bar');
      if (!player.upgrades.includes('fake_progress')) player.upgrades.push('fake_progress');
    } else if (action === 'goto_awakened_hub') {
      player.stage = 'awakened_hub';
      if (player.clicks < 180) player.clicks = 194;
      if (!player.upgrades.includes('kids_theme')) player.upgrades.push('kids_theme');
      if (!player.upgrades.includes('search_bar')) player.upgrades.push('search_bar');
      if (!player.upgrades.includes('fake_progress')) player.upgrades.push('fake_progress');
    } else if (action === 'add_points') {
      player.points = Math.round((player.points + 300) * 10) / 10;
    }

    saveDb(db);
    res.json({ ok: true, stage: player.stage, points: player.points });
  });
}

app.listen(PORT, () => {
  console.log(`👁️  Servidor Don't Click rodando na porta ${PORT}`);
});
