const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public')); // عشان يقرأ ملفات الـ HTML والـ JS

// إعدادات رفع الصور (Multer)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// قاعدة بيانات وهمية في الذاكرة (عشان نجرب بس)
let passwords = { open: "123", edit: "123456" };
let storyData = {
  recipient: "her", himName: "عمر", herName: "سارة",
  envelopeTopText: "A letter for", envelopeName: "سارة", envelopeEmoji: "❤",
  letterEmojis: ["😍", "🥹"],
  letterPages: ["رسالة صغيرة من القلب ❤", "اكتب كلامك هنا..."],
  heroTitle: "Our Story", heroSubtitle: "المكان الصغير اللي بيجمع حكايتنا ❤",
  counterCaption: "كل ثانية بتعدي وانت في قلبي ❤", giftBoxTitle: "مفاجأة صغيرة",
  startDate: "2023-01-01T00:00", songTitle: "", songClip: "", songUrl: "", songAutoplay: false,
  messagesRequireEditPassword: true,
  timeline: [], messages: [], memories: [], giftBox: { caption: "", src: "" }
};
let revisionCount = 1;

// --- مسارات الـ API (Endpoints) اللي الواجهة بتكلمها ---

app.get('/api/story/:slug/meta', (req, res) => {
  res.json({
    recipient: storyData.recipient, recipientName: storyData.herName,
    envelopeTopText: storyData.envelopeTopText, envelopeName: storyData.envelopeName,
    envelopeEmoji: storyData.envelopeEmoji, letterPages: storyData.letterPages,
    editButtonPlacement: 'bottom'
  });
});

app.post('/api/story/:slug/open', (req, res) => {
  if (req.body.password !== passwords.open) return res.status(401).json({ error: 'wrong_password' });
  res.json({ content: storyData, brandName: "Agency", whatsapp: "#" });
});

app.post('/api/gifts/:slug/login', (req, res) => {
  if (req.body.password !== passwords.edit) return res.status(401).json({ error: 'wrong_password' });
  res.json({ ok: true });
});

app.get('/api/story/:slug/content', (req, res) => {
  res.json({ content: storyData, revision: revisionCount });
});

app.post('/api/story/:slug/content', (req, res) => {
  storyData = { ...storyData, ...req.body.content };
  revisionCount++;
  res.json({ ok: true, content: storyData, revision: revisionCount });
});

app.get('/api/story/:slug/open-password', (req, res) => res.json({ password: passwords.open }));
app.post('/api/story/:slug/open-password', (req, res) => {
  passwords.open = req.body.password;
  res.json({ password: passwords.open });
});

app.get('/api/gifts/:slug/admin/password', (req, res) => res.json({ password: passwords.edit }));
app.post('/api/gifts/:slug/admin/password', (req, res) => {
  passwords.edit = req.body.password;
  res.json({ password: passwords.edit });
});

// التعامل مع الرسائل
app.post('/api/story/:slug/messages', (req, res) => {
  const newMsg = { id: Date.now(), text: req.body.text, from: req.body.from };
  storyData.messages.push(newMsg);
  res.json({ ok: true, messages: storyData.messages });
});

app.put('/api/story/:slug/messages/:id', (req, res) => {
  const msg = storyData.messages.find(m => String(m.id) === req.params.id);
  if (msg) msg.text = req.body.text;
  res.json({ ok: true, messages: storyData.messages });
});

app.delete('/api/story/:slug/messages/:id', (req, res) => {
  storyData.messages = storyData.messages.filter(m => String(m.id) !== req.params.id);
  res.json({ ok: true, messages: storyData.messages });
});

// التعامل مع رفع الصور
app.post('/api/gifts/:slug/admin/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no_file' });
  res.json({ url: `/uploads/${req.file.filename}` });
});

// توجيه أي مسار لصفحة الـ HTML عشان الواجهة تشتغل صح
app.get('/gift/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// تشغيل السيرفر
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 السيرفر شغال تمام! افتح اللينك ده في المتصفح:`);
  console.log(`http://localhost:${PORT}/gift/my-story`);
});