const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const app = express();
app.use(cors());
app.use(express.json());

const DATA_PATH = path.join(__dirname, '../src/data');
const CHAR_PATH = path.join(DATA_PATH, 'characters.json');

function read(file) {
  const full = path.join(DATA_PATH, file);
  return fs.existsSync(full) ? JSON.parse(fs.readFileSync(full, 'utf-8')) : [];
}
function write(file, data) {
  const full = path.join(DATA_PATH, file);
  fs.writeFileSync(full, JSON.stringify(data, null, 2));
}

app.get('/api/maxchat', (req, res) => res.json(read('maxchat.json') || []));
app.post('/api/maxchat', (req, res) => {
  write('maxchat.json', req.body);
  res.json({ status: 'saved' });
});

app.get('/api/confessionals', (req, res) => res.json(read('confessionals.json')));
app.post('/api/confessionals', (req, res) => {
  write('confessionals.json', req.body);
  res.json({ status: 'saved' });
});

app.get('/api/reactions', (req, res) => res.json(read('reactions.json')));
app.post('/api/reactions', (req, res) => {
  write('reactions.json', req.body);
  res.json({ status: 'saved' });
});

app.get('/api/episodes', (req, res) => res.json(read('episodes.json')));
app.post('/api/episodes', (req, res) => {
  write('episodes.json', req.body);
  res.json({ status: 'saved' });
});

app.get('/api/monetization', (req, res) => res.json(read('monetization.json')));
app.post('/api/monetization', (req, res) => {
  write('monetization.json', req.body);
  res.json({ status: 'saved' });
});

app.get('/api/characters', (req, res) => res.json(read('characters.json')));
app.post('/api/characters', (req, res) => {
  const current = read('characters.json');
  const updated = [...new Set([...current, req.body.name])];
  write('characters.json', updated);
  res.json({ status: 'character added' });
});

app.post('/api/upload-characters', upload.single('file'), (req, res) => {
  const raw = fs.readFileSync(req.file.path, 'utf-8');
  let names = [];
  try {
    names = req.file.originalname.endsWith('.json')
      ? JSON.parse(raw)
      : raw.split('\n').map(n => n.trim()).filter(Boolean);
    const current = read('characters.json');
    const updated = [...new Set([...current, ...names])];
    write('characters.json', updated);
    res.json({ status: 'characters uploaded', count: names.length });
  } catch {
    res.status(400).json({ error: 'Invalid file format' });
  }
});

app.listen(3001, () => console.log('Server running on http://localhost:3001'));
