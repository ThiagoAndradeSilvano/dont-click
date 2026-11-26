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

// Garante que a pasta e o arquivo de persistência existam
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

// Cria um hash de identificação combinando IP + dados do navegador (caso limpe cookies/localStorage)
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

// Resolve ou cria o jogador silenciosamente
function resolvePlayer(req, res, clientMeta = {}) {
  const db = loadDb();
  const ip = getClientIp(req);
  const fpHash = computeFingerprintHash(ip, clientMeta);

  // 1. Tenta pelo cookie HttpOnly
  let playerId = req.cookies[COOKIE_NAME];

  // 2. Tenta pelo token que o client guardou no localStorage
  if ((!playerId || !db.players[playerId]) && clientMeta.localToken && db.players[clientMeta.localToken]) {
    playerId = clientMeta.localToken;
  }

  // 3. Tenta recuperar por IP + Fingerprint (ex: jogador abriu aba anônima ou limpou dados)
  if (!playerId || !db.players[playerId]) {
    const existingByFp = Object.values(db.players).find((p) => p.fpHash === fpHash);
    if (existingByFp) {
      playerId = existingByFp.id;
    }
  }

  // 4. Se realmente é novo, cria registro
  const now = new Date().toISOString();
  if (!playerId || !db.players[playerId]) {
    playerId = crypto.randomUUID();
    db.players[playerId] = {
      id: playerId,
      fpHash,
      ip,
      clicks: 0,
      sessionClicks: 0,
      visits: 0,
      firstSeenAt: now,
      lastSeenAt: now,
      history: [],
    };
  }

  const player = db.players[playerId];
  if (typeof player.sessionClicks !== 'number') {
    player.sessionClicks = 0;
  }
  player.lastSeenAt = now;
  player.fpHash = fpHash;

  // Renova o cookie silenciosamente (1 ano)
  res.cookie(COOKIE_NAME, playerId, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 365,
  });

  return { db, player };
}

// Chamado silenciosamente quando a página abre/recarrega
app.post('/api/session', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  player.visits += 1;
  // Ao recarregar, volta ao ciclo normal da tela (mas mantém player.clicks e history intactos!)
  player.sessionClicks = 0;
  saveDb(db);

  console.log(
    `[VISITA] Jogador ${player.id.slice(0, 8)} | Visitas: ${player.visits} | Cliques totais no histórico: ${player.clicks}`
  );

  res.json({
    token: player.id,
    buttonLabel: 'Não clique',
  });
});

// Chamado a cada clique no botão
app.post('/api/click', (req, res) => {
  const { db, player } = resolvePlayer(req, res, req.body);
  player.clicks += 1;
  player.sessionClicks += 1;
  db.totalGlobalClicks += 1;

  player.history.push({
    clickNumber: player.clicks,
    sessionClick: player.sessionClicks,
    at: new Date().toISOString(),
  });

  // Regra da tela atual:
  // O botão já começa como "Não clique" desde o início.
  // Cliques 1 até 7: nada muda na tela.
  // No 8º clique: dispara a tela de erro!
  const shouldCrash = player.sessionClicks >= 8;
  const buttonLabel = 'Não clique';

  saveDb(db);

  console.log(
    `[CLIQUE] Jogador ${player.id.slice(0, 8)} | Sessão: ${player.sessionClicks}/8 | Total Histórico: ${player.clicks} | Crash: ${shouldCrash}`
  );

  res.json({
    ok: true,
    token: player.id,
    buttonLabel,
    action: shouldCrash ? 'crash' : 'none',
  });
});

// Rotas internas só pra você (dev) inspecionar ou zerar o estado em localhost:3690/api/_debug
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/_debug', (_req, res) => {
    res.json(loadDb());
  });

  app.get('/api/_reset', (_req, res) => {
    const empty = { totalGlobalClicks: 0, players: {} };
    saveDb(empty);
    res.clearCookie(COOKIE_NAME);
    res.json({ reset: true, message: 'Cliques zerados para teste!' });
  });
}

app.listen(PORT, () => {
  console.log(`👁️  Servidor Don't Click rodando na porta ${PORT}`);
});
