// server.js
const https = require('https');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');

// Polyfill for fetch (Node.js 18+ has it built-in)
if (!global.fetch) {
  global.fetch = require('node-fetch');
}

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const cors = require("cors");
const compression = require('compression');

app.use(compression());
app.use(cors({ origin: "*" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));  // Serve static files (HTML, CSS, JS, Images)

// Routes
const vimshottariRouter = require("./routes/vimshottari");
const astrologyRouter = require("./routes/astrology");
const matchRouter = require("./routes/match");
const horoscopeRouter = require("./routes/horoscope");

app.use("/api/vimshottari", vimshottariRouter);
app.use("/api/astrology", astrologyRouter);
app.use("/api/match", matchRouter);
app.use("/api/horoscope", horoscopeRouter);

// ===== MSG91 Helper =====
function sendMsg91(phoneNumber, otp) {
  const cleanPhone = phoneNumber.replace(/\D/g, '');
  const mobile = `91${cleanPhone}`;
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  // We pass 'otp' param so MSG91 sends OUR generated code
  const path = `/api/v5/otp?otp_expiry=5&template_id=${templateId}&mobile=${mobile}&authkey=${authKey}&realTimeResponse=1&otp=${otp}`;

  const options = {
    method: 'POST',
    hostname: 'control.msg91.com',
    path: path,
    headers: {
      'content-type': 'application/json'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => console.log('MSG91 Result:', data));
  });

  req.on('error', (e) => console.error('MSG91 Error:', e));
  req.write('{}');
  req.end();
}

// ===== File upload setup =====
const uploadDir = path.join(__dirname, 'uploads');
const upload = multer({ dest: uploadDir });

app.use('/uploads', express.static(uploadDir));


app.post('/upload', upload.single('file'), (req, res) => {
  // ... (keeping upload logic if valid) ...
  return res.json({ ok: true, url: req.file ? '/uploads/' + req.file.filename : '' });
});
const MONGO_URI = 'mongodb+srv://murugannagaraja781_db_user:NewLife2025@cluster0.tp2gekn.mongodb.net/astrofive';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('MongoDB Error:', err));

// Schemas
const UserSchema = new mongoose.Schema({
  userId: { type: String, unique: true },
  phone: { type: String, unique: true },
  name: String,
  role: { type: String, enum: ['client', 'astrologer', 'superadmin'], default: 'client' },
  isOnline: { type: Boolean, default: false },
  isChatOnline: { type: Boolean, default: false },
  isAudioOnline: { type: Boolean, default: false },
  isVideoOnline: { type: Boolean, default: false },
  isBanned: { type: Boolean, default: false },
  skills: [String],
  price: { type: Number, default: 20 },
  walletBalance: { type: Number, default: 369 },
  experience: { type: Number, default: 0 },
  image: { type: String, default: '' }
});
const User = mongoose.model('User', UserSchema);

const SessionSchema = new mongoose.Schema({
  sessionId: String,
  fromUserId: String,
  toUserId: String,
  type: String,
  startTime: Number,
  endTime: Number,
  duration: Number
});
const Session = mongoose.model('Session', SessionSchema);

const ChatMessageSchema = new mongoose.Schema({
  sessionId: String,
  fromUserId: String,
  toUserId: String,
  text: String,
  timestamp: Number
});
const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);


// ===== Seed Data =====
async function seedDatabase() {
  const count = await User.countDocuments();
  if (count > 0) return; // Already seeded

  console.log('--- Seeding Database ---');

  const create = async (name, phone, role) => {
    const userId = crypto.randomUUID();
    await User.create({
      userId, name, phone, role,
      skills: role === 'astrologer' ? ['Vedic', 'Prashana'] : [],
      price: 20,
      walletBalance: 369
    });
  };

  await create('Astro Maveeran', '9000000001', 'astrologer');
  await create('Thiru', '9000000002', 'astrologer');
  await create('Lakshmi', '9000000003', 'astrologer');
  await create('Client John', '8000000001', 'client');
  await create('Client Sarah', '8000000002', 'client');
  await create('Client Mike', '8000000003', 'client');

  console.log('--- Database Seeded ---');
}
seedDatabase();

// In-Memory cache for socket mapping (Ephemeral)
const userSockets = new Map(); // userId -> socketId
const socketToUser = new Map(); // socketId -> userId
const userActiveSession = new Map(); // userId -> sessionId
const activeSessions = new Map(); // sessionId -> { type, users... }
const pendingMessages = new Map();
const otpStore = new Map();

// --- Static Files & Root Route ---
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Store OTPs in memory { phone: { otp, expires } }
// const otpStore = new Map(); // This was already declared above, moving it here for context with the new code.

// ===== Daily Horoscope Logic =====
let dailyHoroscope = { date: '', content: '' };

function generateTamilHoroscope() {
  const now = new Date();
  const dateStr = now.toDateString();

  if (dailyHoroscope.date === dateStr) return dailyHoroscope.content;

  // Tamil Templates (Grammatically Correct Parts)
  const intros = [
    "இன்று சந்திராஷ்டமம் விலகி இருப்பதால்,",
    "குரு பார்வையின் பலத்தால்,",
    "சுக்ரனின் ஆதிக்கத்தால்,",
    "ராகு கேது பெயர்ச்சியின் தாக்கத்தால்,",
    "நவக்கிரகங்களின் சாதகமான நிலையால்,"
  ];

  const middles = [
    "தொழில் மற்றும் வியாபாரத்தில் நல்ல முன்னேற்றம் உண்டாகும்.",
    "குடும்பத்தில் மகிழ்ச்சியும் நிம்மதியும் நிலவும்.",
    "எதிர்பாராத தனவரவு மற்றும் அதிர்ஷ்டம் உண்டாகும்.",
    "நீண்ட நாள் கனவுகள் இன்று நனவாகும் வாய்ப்புள்ளது.",
    "உடல் ஆரோக்கியத்தில் நல்ல முன்னேற்றம் ஏற்படும்."
  ];

  const ends = [
    " இறைவனை வழிபட்டு நாளை தொடங்குவது சிறப்பு.",
    " தான தர்மங்கள் செய்வது மேலும் நன்மை தரும்.",
    " நிதானமாக செயல்பட்டால் வெற்றி நிச்சயம்.",
    " குலதெய்வ வழிபாடு மனதை அமைதிப்படுத்தும்."
  ];

  // Combine randomly
  const i = intros[Math.floor(Math.random() * intros.length)];
  const m = middles[Math.floor(Math.random() * middles.length)];
  const e = ends[Math.floor(Math.random() * ends.length)];

  dailyHoroscope = {
    date: dateStr,
    content: `${i} ${m}${e}`
  };

  return dailyHoroscope.content;
}

// Init on start
generateTamilHoroscope();

// --- Endpoints ---

// Daily Horoscope API
app.get('/api/daily-horoscope', (req, res) => {
  const content = generateTamilHoroscope(); // Check and update if new day
  res.json({ ok: true, content });
});

// OTP Send (Mock)
app.post('/api/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.json({ ok: false, error: 'Phone required' });

  // Generate 4-digit OTP
  const otp = Math.floor(1000 + Math.random() * 9000).toString();

  // Super Admin Bypass (Don't send SMS)
  if (phone === '9876543210') {
    console.log('Super Admin Login Attempt');
    return res.json({ ok: true });
  }

  // Send via MSG91 for everyone else
  sendMsg91(phone, otp);

  otpStore.set(phone, { otp, expires: Date.now() + 300000 }); // 5 min
  console.log(`OTP for ${phone}: ${otp}`); // Log for debug
  res.json({ ok: true });
});

// OTP Verify (DB Lookup)
app.post('/api/verify-otp', async (req, res) => {
  const { phone, otp } = req.body;

  // --- Super Admin Backdoor ---
  if (phone === '9876543210' && otp === '1369') {
    let user = await User.findOne({ phone });
    if (!user) {
      user = await User.create({
        userId: crypto.randomUUID(),
        phone,
        name: 'Super Admin',
        role: 'superadmin',
        walletBalance: 100000
      });
    } else if (user.role !== 'superadmin') {
      user.role = 'superadmin';
      await user.save();
    }
    return res.json({ ok: true, userId: user.userId, name: user.name, role: user.role, phone: user.phone, walletBalance: user.walletBalance, image: user.image });
  }

  // --- Normal User Verification ---
  // --- Normal User Verification ---
  // Allow 1234 as universal test OTP
  if (otp === '1234') {
    // Proceed to find/create user
  } else {
    const entry = otpStore.get(phone);
    if (!entry) return res.json({ ok: false, error: 'No OTP requested' });
    if (Date.now() > entry.expires) return res.json({ ok: false, error: 'Expired' });
    if (entry.otp !== otp) return res.json({ ok: false, error: 'Invalid OTP' });
    otpStore.delete(phone);
  }

  try {
    let user = await User.findOne({ phone });

    // Check Ban
    if (user && user.isBanned) {
      return res.json({ ok: false, error: 'Account Banned by Admin' });
    }

    if (!user) {
      // Create new client
      const userId = crypto.randomUUID();
      user = await User.create({
        userId, phone, name: `User ${phone.slice(-4)}`, role: 'client'
      });
    }

    // Ensure role is respected (if changed by admin)
    res.json({ ok: true, userId: user.userId, name: user.name, role: user.role, phone: user.phone, walletBalance: user.walletBalance, image: user.image });
  } catch (e) {
    res.status(500).json({ ok: false, error: 'DB Error' });
  }
});

function startSessionRecord(sessionId, type, u1, u2) {
  activeSessions.set(sessionId, {
    type,
    users: [u1, u2],
    startedAt: Date.now(),
  });
  userActiveSession.set(u1, sessionId);
  userActiveSession.set(u2, sessionId);
}


function getOtherUserIdFromSession(sessionId, userId) {
  const s = activeSessions.get(sessionId);
  if (!s) return null;
  const [u1, u2] = s.users;
  return u1 === userId ? u2 : u2 === userId ? u1 : null;
}

// Helper: End Session & Calculate Wallet
async function endSessionRecord(sessionId) {
  const s = activeSessions.get(sessionId);
  if (!s) return;

  // Cleanup user pointers
  s.users.forEach((u) => {
    if (userActiveSession.get(u) === sessionId) {
      userActiveSession.delete(u);
    }
  });

  activeSessions.delete(sessionId);

  const endTime = Date.now();
  const durationMs = endTime - s.startedAt;
  const durationMin = Math.ceil(durationMs / 60000); // Charged per minute

  // Update Session in DB
  await Session.updateOne({ sessionId }, { endTime, duration: durationMs });

  // Wallet Logic
  try {
    const [u1, u2] = s.users;
    // Identify Client/Astro. usually we assume one is client one is astro?
    // Or we fetch roles.
    const user1 = await User.findOne({ userId: u1 });
    const user2 = await User.findOne({ userId: u2 });

    if (!user1 || !user2) return;

    const client = user1.role === 'client' ? user1 : user2;
    const astro = user1.role === 'astrologer' ? user1 : user2;

    if (client.role === 'client' && astro.role === 'astrologer') {
      const cost = durationMin * astro.price;
      if (client.walletBalance >= cost) {
        client.walletBalance -= cost;
        astro.walletBalance += cost;
        await client.save();
        await astro.save();
        console.log(`Wallet: Deducted ₹${cost} from ${client.name} for ${durationMin} mins.`);

        // Notify Clients of new balance
        const s1 = userSockets.get(client.userId);
        if (s1) io.to(s1).emit('wallet-update', { balance: client.walletBalance });

        const s2 = userSockets.get(astro.userId);
        if (s2) io.to(s2).emit('wallet-update', { balance: astro.walletBalance });
      }
    }
  } catch (e) { console.error('Wallet Error', e); }
}

// ===== City Autocomplete API =====
app.post('/api/city-autocomplete', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length < 2) {
      return res.json({ ok: true, results: [] });
    }

    // Call Nominatim API to search for cities in India
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)},India&format=json&limit=50&countrycodes=in`;

    const response = await fetch(nominatimUrl, {
      headers: { 'User-Agent': 'AstroApp/1.0' }
    });

    if (!response.ok) {
      return res.json({ ok: true, results: [] });
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return res.json({ ok: true, results: [] });
    }

    // Process and prioritize results
    let results = data.map(item => ({
      name: item.name,
      state: item.address?.state || '',
      country: item.address?.country || 'India',
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      displayName: item.display_name
    }));

    // Prioritize Tamil Nadu cities
    const tamilNaduCities = results.filter(r => r.state === 'Tamil Nadu');
    const otherCities = results.filter(r => r.state !== 'Tamil Nadu');

    results = [...tamilNaduCities, ...otherCities];

    // Remove duplicates
    const seen = new Set();
    results = results.filter(r => {
      const key = `${r.name}-${r.state}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Limit to top 10 results
    results = results.slice(0, 10);

    res.json({ ok: true, results });
  } catch (error) {
    console.error('City autocomplete error:', error);
    res.json({ ok: false, error: 'Failed to fetch cities', results: [] });
  }
});

// ===== Get City Timezone =====
app.post('/api/city-timezone', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.json({ ok: false, error: 'Latitude and longitude required' });
    }

    // Call GeoNames Timezone API
    const geonamesUrl = `http://api.geonames.org/timezoneJSON?lat=${latitude}&lng=${longitude}&username=demo`;

    const response = await fetch(geonamesUrl);

    if (!response.ok) {
      return res.json({ ok: false, error: 'Failed to fetch timezone' });
    }

    const data = await response.json();

    if (data.status && data.status.value !== 0) {
      return res.json({ ok: false, error: 'Invalid coordinates' });
    }

    res.json({
      ok: true,
      timezone: data.timezoneId,
      gmtOffset: data.gmtOffset,
      dstOffset: data.dstOffset
    });
  } catch (error) {
    console.error('Timezone fetch error:', error);
    res.json({ ok: false, error: 'Failed to fetch timezone' });
  }
});

// ===== Socket.IO =====
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // --- Register user ---
  // --- Register user ---
  socket.on('register', (data, cb) => {
    try {
      const { name, phone, existingUserId } = data || {};
      const userId = data.userId || socketToUser.get(socket.id);

      User.findOne({ phone }).then(user => {
        if (!user) {
          if (typeof cb === 'function') cb({ ok: false, error: 'User not found' });
          return;
        }

        const userId = user.userId;
        userSockets.set(userId, socket.id);
        socketToUser.set(socket.id, userId);

        if (typeof cb === 'function') cb({ ok: true, userId: user.userId, role: user.role, name: user.name });
        console.log(`User registered: ${user.name} (${user.role})`);

        // If astro, broadcast update
        if (user.role === 'astrologer') {
          broadcastAstroUpdate();
        }
      });
    } catch (err) {
      console.error('register error', err);
      if (typeof cb === 'function') cb({ ok: false, error: 'Internal error' });
    }
  });

  async function broadcastAstroUpdate() {
    try {
      const astros = await User.find({ role: 'astrologer' });
      io.emit('astrologer-update', astros);
    } catch (e) { }
  }

  // --- Get Astrologers List ---
  socket.on('get-astrologers', async (cb) => {
    try {
      const astros = await User.find({ role: 'astrologer' });
      cb({ astrologers: astros });
    } catch (e) { cb({ astrologers: [] }); }
  });

  // --- Toggle Status (Astrologer Only) ---
  socket.on('toggle-status', async (data) => {
    const userId = socketToUser.get(socket.id);
    if (!userId) return;

    try {
      const update = {};
      if (data.type === 'chat') update.isChatOnline = !!data.online;
      if (data.type === 'audio') update.isAudioOnline = !!data.online;
      if (data.type === 'video') update.isVideoOnline = !!data.online;

      // We first get the user to calculate global isOnline
      let user = await User.findOne({ userId });
      if (user) {
        Object.assign(user, update);
        user.isOnline = user.isChatOnline || user.isAudioOnline || user.isVideoOnline;
        await user.save();
        broadcastAstroUpdate();
      }
    } catch (e) { console.error(e); }
  });

  // --- Update Profile ---
  socket.on('update-profile', async (data, cb) => {
    const userId = socketToUser.get(socket.id);
    if (!userId) return cb({ ok: false, error: 'Not logged in' });

    try {
      const user = await User.findOne({ userId });
      if (user) {
        if (data.price) user.price = parseInt(data.price);
        if (data.experience) user.experience = parseInt(data.experience);
        if (data.image) user.image = data.image; // URL

        await user.save();

        if (user.role === 'astrologer') broadcastAstroUpdate();
        cb({ ok: true, user });
      } else {
        cb({ ok: false, error: 'User not found' });
      }
    } catch (e) {
      console.error('Update Profile Error', e);
      cb({ ok: false, error: 'Internal Error' });
    }
  });

  // --- Session request (chat / audio / video) ---
  socket.on('request-session', async (data, cb) => {
    try {
      const { toUserId, type, birthData } = data || {};
      const fromUserId = socketToUser.get(socket.id);

      if (!fromUserId) return cb({ ok: false, error: 'Not registered' });
      if (!toUserId || !type) return cb({ ok: false, error: 'Missing fields' });

      // Check target status from DB? Or assume front-end checked?
      // Check userSockets for connectivity
      const targetSocketId = userSockets.get(toUserId);
      if (!targetSocketId) {
        return cb({ ok: false, error: 'User offline (socket)' });
      }

      if (userActiveSession.has(toUserId)) {
        return cb({ ok: false, error: 'User busy' });
      }

      const sessionId = crypto.randomUUID();

      // Store in DB
      await Session.create({
        sessionId, fromUserId, toUserId, type, startTime: Date.now()
      });

      activeSessions.set(sessionId, { type, users: [fromUserId, toUserId], startedAt: Date.now() });
      userActiveSession.set(fromUserId, sessionId);
      userActiveSession.set(toUserId, sessionId);

      io.to(targetSocketId).emit('incoming-session', {
        sessionId,
        fromUserId,
        type,
        birthData: birthData || null
      });

      console.log(`Session request: ${sessionId} (${type})`);
      cb({ ok: true, sessionId });
    } catch (err) {
      console.error('request-session error', err);
      cb({ ok: false, error: 'Internal error' });
    }
  });

  // --- Answer session ---
  socket.on('answer-session', (data) => {
    try {
      const { sessionId, toUserId, type, accept } = data || {};
      const fromUserId = socketToUser.get(socket.id);
      if (!fromUserId || !sessionId || !toUserId) return;

      const targetSocketId = userSockets.get(toUserId);
      if (!targetSocketId) return;

      if (!accept) {
        endSessionRecord(sessionId);
      }

      io.to(targetSocketId).emit('session-answered', {
        sessionId,
        fromUserId,
        type,
        accept: !!accept,
      });

      console.log(
        `Session answer: sessionId=${sessionId}, type=${type}, from=${fromUserId}, to=${toUserId}, accept=${!!accept}`
      );
    } catch (err) {
      console.error('answer-session error', err);
    }
  });

  // --- WebRTC signaling relay ---
  socket.on('signal', (data) => {
    try {
      const { sessionId, toUserId, signal } = data || {};
      const fromUserId = socketToUser.get(socket.id);
      if (!fromUserId || !sessionId || !toUserId || !signal) return;

      const targetSocketId = userSockets.get(toUserId);
      if (!targetSocketId) return;

      io.to(targetSocketId).emit('signal', {
        sessionId,
        fromUserId,
        signal,
      });
    } catch (err) {
      console.error('signal error', err);
    }
  });

  // --- Chat message (text / audio / file) ---
  socket.on('chat-message', (data) => {
    try {
      const { toUserId, sessionId, content, timestamp, messageId } = data || {};
      const fromUserId = socketToUser.get(socket.id);
      if (!fromUserId || !toUserId || !content || !messageId) return;

      const targetSocketId = userSockets.get(toUserId);

      if (!targetSocketId) {
        const list = pendingMessages.get(toUserId) || [];
        list.push({
          fromUserId,
          content,
          sessionId,
          timestamp: timestamp || Date.now(),
          messageId,
        });
        pendingMessages.set(toUserId, list);

        socket.emit('message-status', {
          messageId,
          status: 'queued',
        });
        console.log(
          `Queued message ${messageId} from ${fromUserId} to offline user ${toUserId}`
        );
        return;
      }

      socket.emit('message-status', {
        messageId,
        status: 'sent',
      });

      // Save to DB (Async)
      ChatMessage.create({
        sessionId,
        fromUserId,
        toUserId,
        text: content.text,
        timestamp: timestamp || Date.now()
      }).catch(e => console.error('ChatSave Error', e));

      io.to(targetSocketId).emit('chat-message', {
        fromUserId,
        content,
        sessionId: sessionId || null,
        timestamp: timestamp || Date.now(),
        messageId,
      });
    } catch (err) {
      console.error('chat-message error', err);
    }
  });

  // --- Get History ---
  socket.on('get-history', async (cb) => {
    try {
      const userId = socketToUser.get(socket.id);
      if (!userId) return cb({ ok: false });

      // Find sessions where user participated
      const sessions = await Session.find({ $or: [{ fromUserId: userId }, { toUserId: userId }] })
        .sort({ startTime: -1 })
        .limit(50);

      // Populate names (Mock style since we don't have populate setup easily, we'll fetch manually or send IDs)
      // Actually client can resolve names from its own list or we just send IDs + Time + Type

      cb({ ok: true, sessions });
    } catch (e) { console.error(e); cb({ ok: false }); }
  });

  // --- Receiver: delivered ack ---
  socket.on('message-delivered', (data) => {
    try {
      const { toUserId, messageId } = data || {};
      const fromUserId = socketToUser.get(socket.id);
      if (!fromUserId || !toUserId || !messageId) return;

      const targetSocketId = userSockets.get(toUserId);
      if (!targetSocketId) return;

      io.to(targetSocketId).emit('message-status', {
        messageId,
        status: 'delivered',
      });
    } catch (err) { console.error(err); }
  });

  // --- Receiver: read ack ---
  socket.on('message-read', (data) => {
    try {
      const { toUserId, messageId } = data || {};
      const fromUserId = socketToUser.get(socket.id);
      if (!fromUserId || !toUserId || !messageId) return;

      const targetSocketId = userSockets.get(toUserId);
      if (!targetSocketId) return;

      io.to(targetSocketId).emit('message-status', {
        messageId,
        status: 'read',
      });
    } catch (err) { console.error(err); }
  });

  // --- Typing indicator ---
  socket.on('typing', (data) => {
    try {
      const { toUserId, isTyping } = data || {};
      const fromUserId = socketToUser.get(socket.id);
      if (!fromUserId || !toUserId) return;

      const targetSocketId = userSockets.get(toUserId);
      if (!targetSocketId) return;

      io.to(targetSocketId).emit('typing', {
        fromUserId,
        isTyping: !!isTyping,
      });
    } catch (err) {
      console.error('typing error', err);
    }
  });

  // --- Client Birth Chart Data ---
  socket.on('client-birth-chart', (data, cb) => {
    try {
      const { toUserId, birthData } = data || {};
      const fromUserId = socketToUser.get(socket.id);
      if (!fromUserId || !toUserId) return cb({ ok: false, error: 'Invalid data' });

      const targetSocketId = userSockets.get(toUserId);
      if (!targetSocketId) return cb({ ok: false, error: 'Astrologer offline' });

      // Send birth chart data to astrologer
      io.to(targetSocketId).emit('client-birth-chart', {
        fromUserId,
        birthData
      });

      cb({ ok: true });
      console.log(`Birth chart sent from ${fromUserId} to ${toUserId}`);
    } catch (err) {
      console.error('client-birth-chart error', err);
      cb({ ok: false, error: err.message });
    }
  });

  // --- Session end (manual) ---
  socket.on('session-ended', (data) => {
    try {
      const { sessionId, toUserId, type, durationMs } = data || {};
      const fromUserId = socketToUser.get(socket.id);
      if (!fromUserId || !sessionId || !toUserId) return;

      endSessionRecord(sessionId);

      const targetSocketId = userSockets.get(toUserId);
      if (targetSocketId) {
        io.to(targetSocketId).emit('session-ended', {
          sessionId,
          fromUserId,
          type,
          durationMs,
        });
      }

      console.log(
        `Session ended (manual): sessionId=${sessionId}, type=${type}, from=${fromUserId}, to=${toUserId}, duration=${durationMs} ms`
      );
    } catch (err) {
      console.error('session-ended error', err);
    }
  });

  // --- ADMIN API ---
  const checkAdmin = async (sid) => {
    const uid = socketToUser.get(sid);
    if (!uid) return false;
    const u = await User.findOne({ userId: uid });
    return u && u.role === 'superadmin';
  };

  socket.on('get-all-users', async (cb) => {
    if (!await checkAdmin(socket.id)) return cb({ ok: false });
    const users = await User.find({}).sort({ role: 1 });
    cb({ ok: true, users });
  });

  socket.on('admin-update-role', async (data, cb) => {
    if (!await checkAdmin(socket.id)) return cb({ ok: false });
    try {
      await User.updateOne({ userId: data.userId }, { role: data.role });
      cb({ ok: true });
    } catch (e) { cb({ ok: false }); }
  });

  socket.on('admin-add-wallet', async (data, cb) => {
    if (!await checkAdmin(socket.id)) return cb({ ok: false });
    try {
      const u = await User.findOne({ userId: data.userId });
      u.walletBalance += parseInt(data.amount);
      await u.save();

      // Notify user
      const s = userSockets.get(data.userId);
      if (s) io.to(s).emit('wallet-update', { balance: u.walletBalance });

      cb({ ok: true });
    } catch (e) { cb({ ok: false }); }
  });

  socket.on('admin-toggle-ban', async (data, cb) => {
    if (!await checkAdmin(socket.id)) return cb({ ok: false });
    try {
      await User.updateOne({ userId: data.userId }, { isBanned: data.isBanned });
      cb({ ok: true });
      // If banned, disconnect socket?
      if (data.isBanned) {
        const s = userSockets.get(data.userId);
        if (s) io.to(s).emit('force-logout'); // Need to handle client side
      }
    } catch (e) { cb({ ok: false }); }
  });

  // --- Disconnect ---
  socket.on('disconnect', async () => {
    const userId = socketToUser.get(socket.id);
    if (userId) {
      console.log(`Socket disconnected: ${socket.id}, userId=${userId}`);
      socketToUser.delete(socket.id);

      if (userSockets.get(userId) === socket.id) {
        userSockets.delete(userId);
      }

      try {
        // If Astrologer, mark offline in DB
        const user = await User.findOne({ userId });
        if (user && user.role === 'astrologer') {
          user.isOnline = false;
          user.isChatOnline = false;
          user.isAudioOnline = false;
          user.isVideoOnline = false;
          await user.save();
          broadcastAstroUpdate();
          console.log(`Astrologer ${user.name} marked offline (DB)`);
        }
      } catch (e) { console.error('Disconnect DB error', e); }

      const sid = userActiveSession.get(userId);
      if (sid) {
        // We can optionally update Session end time in DB here
        const s = activeSessions.get(sid);
        if (s) {
          Session.updateOne({ sessionId: sid }, { endTime: Date.now(), duration: Date.now() - s.startedAt }).catch(() => { });
        }

        const otherUserId = getOtherUserIdFromSession(sid, userId);
        endSessionRecord(sid); // This cleans up memory maps

        if (otherUserId) {
          const targetSocketId = userSockets.get(otherUserId);
          if (targetSocketId) {
            io.to(targetSocketId).emit('session-ended', { sessionId: sid });
          }
        }
        console.log(
          `Session auto-ended due to disconnect: sessionId=${sid}, fromUserId=${userId}, otherUser=${otherUserId}`
        );
      }
    } else {
      console.log('Socket disconnected (no user):', socket.id);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
