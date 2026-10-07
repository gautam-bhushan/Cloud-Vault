const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'cloudvault-demo-secret-change-me';

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, 'data');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = { users: [], files: [], shares: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}
function writeDB(db) { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }

function publicUser(user) { return { id: user.id, name: user.name, email: user.email }; }
function signToken(user) { return jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '12h' }); }
function auth(req, res, next) {
  const raw = req.headers.authorization || '';
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Authentication required' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const db = readDB();
    const user = db.users.find(u => u.id === payload.userId);
    if (!user) return res.status(401).json({ message: 'User not found' });
    req.user = user;
    next();
  } catch { return res.status(401).json({ message: 'Invalid or expired token' }); }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${crypto.randomBytes(5).toString('hex')}-${safe}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(ROOT, 'public')));

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ message: 'All fields are required' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  const db = readDB();
  const normalized = email.trim().toLowerCase();
  if (db.users.some(u => u.email === normalized)) return res.status(409).json({ message: 'Email already registered' });
  const user = { id: crypto.randomUUID(), name: name.trim(), email: normalized, passwordHash: await bcrypt.hash(password, 10), createdAt: new Date().toISOString() };
  db.users.push(user); writeDB(db);
  res.json({ token: signToken(user), user: publicUser(user) });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  const db = readDB();
  const user = db.users.find(u => u.email === String(email || '').trim().toLowerCase());
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) return res.status(401).json({ message: 'Invalid email or password' });
  res.json({ token: signToken(user), user: publicUser(user) });
});

app.get('/api/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));

app.post('/api/files/upload', auth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Please select a file' });
  const db = readDB();
  const record = {
    id: crypto.randomUUID(),
    userId: req.user.id,
    originalName: req.file.originalname,
    storedName: req.file.filename,
    mimeType: req.file.mimetype || 'application/octet-stream',
    size: req.file.size,
    uploadedAt: new Date().toISOString()
  };
  db.files.push(record); writeDB(db);
  res.json({ message: 'File uploaded successfully', file: record });
});

app.get('/api/files', auth, (req, res) => {
  const db = readDB();
  const files = db.files.filter(f => f.userId === req.user.id).map(f => ({
    ...f,
    shareCode: db.shares.find(s => s.fileId === f.id)?.code || null
  })).sort((a,b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
  const storageUsed = files.reduce((sum, f) => sum + f.size, 0);
  res.json({ files, storageUsed, totalFiles: files.length });
});

app.get('/api/files/:id/download', auth, (req, res) => {
  const db = readDB();
  const file = db.files.find(f => f.id === req.params.id && f.userId === req.user.id);
  if (!file) return res.status(404).json({ message: 'File not found' });
  const fullPath = path.join(UPLOAD_DIR, file.storedName);
  if (!fs.existsSync(fullPath)) return res.status(404).json({ message: 'Stored file is missing' });
  res.download(fullPath, file.originalName);
});

app.delete('/api/files/:id', auth, (req, res) => {
  const db = readDB();
  const idx = db.files.findIndex(f => f.id === req.params.id && f.userId === req.user.id);
  if (idx < 0) return res.status(404).json({ message: 'File not found' });
  const file = db.files[idx];
  const fullPath = path.join(UPLOAD_DIR, file.storedName);
  if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  db.files.splice(idx, 1);
  db.shares = db.shares.filter(s => s.fileId !== file.id);
  writeDB(db);
  res.json({ message: 'File deleted' });
});

app.post('/api/files/:id/share', auth, (req, res) => {
  const db = readDB();
  const file = db.files.find(f => f.id === req.params.id && f.userId === req.user.id);
  if (!file) return res.status(404).json({ message: 'File not found' });
  let share = db.shares.find(s => s.fileId === file.id);
  if (!share) {
    share = { id: crypto.randomUUID(), fileId: file.id, code: crypto.randomBytes(4).toString('hex').toUpperCase(), createdAt: new Date().toISOString() };
    db.shares.push(share); writeDB(db);
  }
  res.json({ code: share.code, link: `/share.html?code=${share.code}` });
});

app.get('/api/share/:code', (req, res) => {
  const db = readDB();
  const share = db.shares.find(s => s.code === String(req.params.code).toUpperCase());
  if (!share) return res.status(404).json({ message: 'Share link not found' });
  const file = db.files.find(f => f.id === share.fileId);
  if (!file) return res.status(404).json({ message: 'File not found' });
  const owner = db.users.find(u => u.id === file.userId);
  res.json({ file: { originalName: file.originalName, mimeType: file.mimeType, size: file.size, uploadedAt: file.uploadedAt, ownerName: owner?.name || 'CloudVault User' } });
});

app.get('/api/share/:code/download', (req, res) => {
  const db = readDB();
  const share = db.shares.find(s => s.code === String(req.params.code).toUpperCase());
  if (!share) return res.status(404).json({ message: 'Share link not found' });
  const file = db.files.find(f => f.id === share.fileId);
  if (!file) return res.status(404).json({ message: 'File not found' });
  const fullPath = path.join(UPLOAD_DIR, file.storedName);
  if (!fs.existsSync(fullPath)) return res.status(404).json({ message: 'Stored file is missing' });
  res.download(fullPath, file.originalName);
});

app.get('*', (_req, res) => res.sendFile(path.join(ROOT, 'public', 'index.html')));

app.listen(PORT, () => {
  console.log(`CloudVault running at http://localhost:${PORT}`);
});
