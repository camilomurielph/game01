const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');

const DATA = '/data/users.json';
const JWT_SECRET = process.env.JWT_SECRET || 'please-change-me-in-production';
const PORT = 3000;

let users = [];
try { users = JSON.parse(fs.readFileSync(DATA, 'utf8')); } catch {}
let nextId = users.reduce((m, u) => Math.max(m, u.id || 0), 0) + 1;

function save() {
  fs.mkdirSync('/data', { recursive: true });
  fs.writeFileSync(DATA, JSON.stringify(users));
}
const findUser = n => users.find(u => u.username === n);
const findById = id => users.find(u => u.id === id);

const app = express();
app.use(express.json({ limit: '16kb' }));

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Faltan datos' });
  if (username.length < 3 || username.length > 20) return res.status(400).json({ error: 'Usuario: 3-20 caracteres' });
  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) return res.status(400).json({ error: 'Usuario: solo letras, números, _ . -' });
  if (password.length < 6) return res.status(400).json({ error: 'Contraseña: mínimo 6 caracteres' });
  if (findUser(username)) return res.status(409).json({ error: 'Ese usuario ya existe' });

  const hash = await bcrypt.hash(password, 10);
  const user = {
    id: nextId++, username, password: hash,
    best_round: 0, best_kills: 0, best_class: null,
    created_at: Date.now(), updated_at: Date.now()
  };
  users.push(user); save();
  const token = jwt.sign({ uid: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, username, best_round: 0 });
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Faltan datos' });
  const u = findUser(username);
  if (!u) return res.status(401).json({ error: 'Credenciales inválidas' });
  const ok = await bcrypt.compare(password, u.password);
  if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });
  const token = jwt.sign({ uid: u.id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ token, username: u.username, best_round: u.best_round || 0 });
});

function auth(req, res, next) {
  try {
    const t = (req.headers.authorization || '').replace('Bearer ', '');
    req.user = findById(jwt.verify(t, JWT_SECRET).uid);
    if (!req.user) return res.status(401).json({ error: 'No autorizado' });
    next();
  } catch { res.status(401).json({ error: 'No autorizado' }); }
}

app.post('/api/score', auth, (req, res) => {
  const r = Math.max(0, Math.floor(Number(req.body.round) || 0));
  const k = Math.max(0, Math.floor(Number(req.body.kills) || 0));
  const u = req.user;
  if (r > (u.best_round || 0)) {
    u.best_round = r; u.best_kills = k; u.best_class = req.body.class || null;
    u.updated_at = Date.now(); save();
    return res.json({ updated: true, best_round: r });
  }
  res.json({ updated: false, best_round: u.best_round || 0 });
});

app.get('/api/leaderboard', (_, res) => {
  const top = users
    .filter(u => u.best_round > 0)
    .sort((a, b) => (b.best_round - a.best_round) || (b.best_kills - a.best_kills))
    .slice(0, 50)
    .map(u => ({ username: u.username, best_round: u.best_round, best_kills: u.best_kills, best_class: u.best_class }));
  res.json(top);
});

app.get('/api/me', auth, (req, res) => {
  const u = req.user;
  res.json({ username: u.username, best_round: u.best_round || 0, best_kills: u.best_kills || 0, best_class: u.best_class });
});

app.listen(PORT, () => console.log('API on :' + PORT));
