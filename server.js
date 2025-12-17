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
  totalEarnings: { type: Number, default: 0 }, // Phase 16: Lifetime Earnings
  experience: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false }, // Blue Tick
  isDocumentVerified: { type: Boolean, default: false }, // Document Badge
  image: { type: String, default: '' },
  birthDetails: {
    dob: String,
    tob: String,
    pob: String,
    lat: Number,
    lon: Number
  },
  // Phase Extra: Persistent Intake Form Details
  intakeDetails: {
    gender: String,
    marital: String,
    occupation: String,
    topic: String,
    partner: {
      name: String,
      dob: String,
      tob: String,
      pob: String
    }
  }
});
const User = mongoose.model('User', UserSchema);

const SessionSchema = new mongoose.Schema({
  sessionId: { type: String, unique: true },

  // Phase 0: Core Billing Fields
  clientId: String,
  astrologerId: String,
  clientConnectedAt: Number, // Timestamp
  astrologerConnectedAt: Number, // Timestamp
  actualBillingStart: Number, // Timestamp
  sessionEndAt: Number, // Timestamp
  status: { type: String, enum: ['active', 'ended'], default: 'active' },

  // Legacy/Compatibility Fields
  fromUserId: String,
  toUserId: String,
  type: String,
  startTime: Number,
  endTime: Number,
  duration: Number
});
const Session = mongoose.model('Session', SessionSchema);

const PairMonthSchema = new mongoose.Schema({
  pairId: { type: String, required: true, index: true }, // client_id + "_" + astrologer_id
  clientId: String,
  astrologerId: String,
  yearMonth: { type: String, required: true }, // "YYYY-MM"
  currentSlab: { type: Number, default: 0 },
  slabLockedAt: { type: Number, default: 0 }, // seconds
  resetAt: Date
});
// Compound index for unique pair in a month
PairMonthSchema.index({ pairId: 1, yearMonth: 1 }, { unique: true });
const PairMonth = mongoose.model('PairMonth', PairMonthSchema);

const BillingLedgerSchema = new mongoose.Schema({
  billingId: { type: String, unique: true },
  sessionId: { type: String, required: true, index: true },
  minuteIndex: { type: Number, required: true },
  chargedToClient: Number,
  creditedToAstrologer: Number,
  adminAmount: Number,
  reason: { type: String, enum: ['first_60', 'slab', 'rounded', 'payout_withdrawal'] },
  createdAt: { type: Date, default: Date.now }
});
const BillingLedger = mongoose.model('BillingLedger', BillingLedgerSchema);

// Phase 15: Withdrawal Schema
const WithdrawalSchema = new mongoose.Schema({
  astroId: String,
  amount: Number,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
  processedAt: Date
});
const Withdrawal = mongoose.model('Withdrawal', WithdrawalSchema);


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
      // Secure Name Generation (No phone parts)
      const randomSuffix = crypto.randomBytes(2).toString('hex'); // 4 chars e.g. 'a1b2'
      user = await User.create({
        userId, phone, name: `User_${randomSuffix}`, role: 'client'
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
  // Phase 1/2: Use tracked billable seconds if available
  const billableSeconds = s.elapsedBillableSeconds || 0;

  // Update Session in DB
  await Session.updateOne({ sessionId }, {
    endTime,
    duration: billableSeconds * 1000
  });

  // Update PairMonth Cumulative Seconds (Phase 4)
  if (s.pairMonthId) {
    await PairMonth.updateOne(
      { _id: s.pairMonthId },
      { $inc: { slabLockedAt: billableSeconds } }
    );
  }

  // Phase 3: Early Exit Handling (< 60s)
  if (billableSeconds > 0 && billableSeconds < 60) {
    console.log(`Session ${sessionId}: Early exit at ${billableSeconds}s. Charging pro-rata.`);
    await processBillingCharge(sessionId, billableSeconds, 1, 'early_exit');
  }

  // Note: If billableSeconds >= 60, the minute ticks would have handled the charges.
  // We do NOT run the old legacy billing logic here.
}

// --- Phase 3: Billing Helper ---
const SLAB_RATES = {
  1: 0.30, // 30% to Astro
  2: 0.35, // 35%
  3: 0.40, // 40%
  4: 0.50  // 50%
};

async function processBillingCharge(sessionId, durationSeconds, minuteIndex, type) {
  try {
    const session = await Session.findOne({ sessionId });
    if (!session) return;

    // Fetch Astrologer Price
    const astro = await User.findOne({ userId: session.astrologerId });
    if (!astro) return;

    const client = await User.findOne({ userId: session.clientId });
    if (!client) return;

    const pricePerMin = astro.price || 0;

    let amountToCharge = 0;
    let adminShare = 0;
    let astroShare = 0;
    let reason = '';

    // Logic: First 60 Seconds (Admin Only)
    // If type == 'first_60_full' (called at 60s tick)
    // If type == 'early_exit' (called at endSession if < 60s)

    if (type === 'first_60_full') {
      amountToCharge = pricePerMin;
      adminShare = amountToCharge;
      astroShare = 0;
      reason = 'first_60';
    } else if (type === 'early_exit') {
      // Pro-rata: (Price / 60) * seconds
      amountToCharge = (pricePerMin / 60) * durationSeconds;
      adminShare = amountToCharge; // 100% to Admin
      astroShare = 0;
      reason = 'first_60_partial';
    } else if (type === 'slab') {
      // Phase 5: Standard Minute Billing
      const currentSlab = activeSessions.get(sessionId)?.currentSlab || 3; // Default to 3 if missing
      const rate = SLAB_RATES[currentSlab] || 0.30;

      amountToCharge = pricePerMin;
      astroShare = amountToCharge * rate;
      adminShare = amountToCharge - astroShare;
      reason = `slab_${currentSlab}`;
    } else {
      // Unknown
      return;
    }

    // Deduct from Client
    if (client.walletBalance >= amountToCharge) {
      client.walletBalance -= amountToCharge;
      await client.save();

      // Credit Astrologer (if > 0)
      if (astroShare > 0) {
        astro.walletBalance += astroShare;
        astro.totalEarnings = (astro.totalEarnings || 0) + astroShare; // Phase 16
        await astro.save();
      }

      // Admin Share is just recorded in Ledger, or we could credit a SuperAdmin wallet.
      // Task says: "Deduct from client, credit 0 to astro, rest to Admin"

      // Create Ledger Entry
      await BillingLedger.create({
        billingId: crypto.randomUUID(),
        sessionId,
        minuteIndex,
        chargedToClient: amountToCharge,
        creditedToAstrologer: astroShare,
        adminAmount: adminShare,
        reason
      });

      console.log(`Billing: ${reason} | Charge: ${amountToCharge} | Admin: ${adminShare} | Astro: ${astroShare}`);

      // Notify Wallets
      const s1 = userSockets.get(client.userId);
      if (s1) io.to(s1).emit('wallet-update', { balance: client.walletBalance });

      const s2 = userSockets.get(astro.userId);
      if (s2) io.to(s2).emit('wallet-update', { balance: astro.walletBalance });

    } else {
      console.log(`Billing Failed: Insufficient funds for ${client.name}`);
      // Handle forced termination?
      io.to(userSockets.get(session.clientId)).emit('session-ended', { reason: 'insufficient_funds' });
      io.to(userSockets.get(session.astrologerId)).emit('session-ended', { reason: 'insufficient_funds' });
      // Call endSessionRecord? Be careful of recursion.
    }

  } catch (e) {
    console.error('Billing Error:', e);
  }
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
        // If superadmin, join room
        if (user.role === 'superadmin') {
          socket.join('superadmin');
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
        if (data.birthDetails) {
          user.birthDetails = { ...user.birthDetails, ...data.birthDetails };
        }

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
      // Resolve roles (Assuming User model has role)
      const fromUser = await User.findOne({ userId: fromUserId });
      const toUser = await User.findOne({ userId: toUserId });

      let clientId = null;
      let astrologerId = null;

      if (fromUser && fromUser.role === 'client') clientId = fromUserId;
      if (fromUser && fromUser.role === 'astrologer') astrologerId = fromUserId;
      if (toUser && toUser.role === 'client') clientId = toUserId;
      if (toUser && toUser.role === 'astrologer') astrologerId = toUserId;

      await Session.create({
        sessionId, fromUserId, toUserId, type, startTime: Date.now(),
        clientId, astrologerId
      });

      activeSessions.set(sessionId, {
        type,
        users: [fromUserId, toUserId],
        startedAt: Date.now(),
        clientId,
        astrologerId,
        elapsedBillableSeconds: 0,
        lastBilledMinute: 0,
        actualBillingStart: null // Will be set by handleUserConnection
      });
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

  // --- Save Intake Details ---
  socket.on('save-intake-details', async (data, cb) => {
    const userId = socketToUser.get(socket.id);
    if (!userId) return;
    try {
      // Data contains the full birthData object from frontend
      // We extract what we need for persistent storage
      const u = await User.findOne({ userId });
      if (u) {
        // Update regular birth details
        u.birthDetails = {
          dob: `${data.year}-${String(data.month).padStart(2, '0')}-${String(data.day).padStart(2, '0')}`,
          tob: `${String(data.hour).padStart(2, '0')}:${String(data.minute).padStart(2, '0')}`,
          pob: data.city,
          lat: data.latitude,
          lon: data.longitude
        };
        u.name = data.name; // Update name if changed

        // Update Intake Details
        u.intakeDetails = {
          gender: data.gender,
          marital: data.marital,
          occupation: data.occupation,
          topic: data.topic,
          partner: data.partner
        };
        await u.save();
        if (typeof cb === 'function') cb({ ok: true });

        // --- REAL-TIME UPDATE TO PARTNER ---
        // If user is in a session, send the updated details to the other person (Astrologer) immediately.
        const sessionId = userActiveSession.get(userId);
        if (sessionId) {
          const partnerId = getOtherUserIdFromSession(sessionId, userId);
          if (partnerId) {
            const partnerSocket = userSockets.get(partnerId);
            if (partnerSocket) {
              io.to(partnerSocket).emit('client-birth-chart', {
                sessionId,
                fromUserId: userId,
                birthData: data
              });
            }
          }
        }
      }
    } catch (e) { console.error(e); }
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
    } catch (err) { console.error('typing error', err); }
  });

  // --- Phase 1: Connection & Billing Start ---
  socket.on('session-connect', async (data) => {
    try {
      const { sessionId } = data || {};
      const userId = socketToUser.get(socket.id);

      if (!userId || !sessionId) return;

      console.log(`Session Connect: User ${userId} joined Session ${sessionId}`);

      await handleUserConnection(sessionId, userId);

    } catch (err) {
      console.error('session-connect error:', err);
    }
  });

  async function handleUserConnection(sessionId, userId) {
    const session = await Session.findOne({ sessionId });
    if (!session) return;

    // Determine which timestamp to update
    const now = Date.now();
    let updated = false;

    if (userId === session.clientId) {
      if (!session.clientConnectedAt) {
        session.clientConnectedAt = now;
        updated = true;
        console.log(`Session ${sessionId}: Client connected at ${now}`);
      }
    } else if (userId === session.astrologerId) {
      if (!session.astrologerConnectedAt) {
        session.astrologerConnectedAt = now;
        updated = true;
        console.log(`Session ${sessionId}: Astrologer connected at ${now}`);
      }
    }

    if (updated) {
      await session.save();
    }

    // Check if billing can start
    if (session.clientConnectedAt && session.astrologerConnectedAt && !session.actualBillingStart) {
      const maxTime = Math.max(session.clientConnectedAt, session.astrologerConnectedAt);
      const billingStart = maxTime + 2000; // 2 seconds buffer

      session.actualBillingStart = billingStart;
      await session.save();

      // Update in-memory map for the ticker
      const activeSession = activeSessions.get(sessionId);
      if (activeSession) {
        activeSession.actualBillingStart = billingStart;

        // --- Phase 4: Init Pair Slab ---
        try {
          const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
          const pairId = `${session.clientId}_${session.astrologerId}`;

          let pairRec = await PairMonth.findOne({ pairId, yearMonth: currentMonth });
          if (!pairRec) {
            console.log(`Creating PairMonth for ${pairId} (Starting Slab 3)`);
            pairRec = await PairMonth.create({
              pairId,
              clientId: session.clientId,
              astrologerId: session.astrologerId,
              yearMonth: currentMonth,
              currentSlab: 3, // Default Slab 3
              slabLockedAt: 0
            });
          }

          activeSession.pairMonthId = pairRec._id;
          activeSession.currentSlab = pairRec.currentSlab;
          activeSession.initialPairSeconds = pairRec.slabLockedAt || 0;
          console.log(`Session ${sessionId} initialized with Slab ${activeSession.currentSlab}, InitialSecs: ${activeSession.initialPairSeconds}`);
        } catch (e) {
          console.error('PairMonth Init Error', e);
        }
      }

      console.log(`Session ${sessionId}: Billing starts at ${billingStart} (Buffer applied)`);

      // Notify both parties
      io.to(userSockets.get(session.clientId)).emit('billing-started', { startTime: billingStart });
      io.to(userSockets.get(session.astrologerId)).emit('billing-started', { startTime: billingStart });
    }
  }

  // --- Phase 2: Session Timer Engine ---
  setInterval(tickSessions, 1000);

  // Phase 4 Helper
  function getSlabBySeconds(seconds) {
    if (seconds <= 300) return 1;
    if (seconds <= 600) return 2;
    if (seconds <= 900) return 3;
    if (seconds <= 1200) return 4;
    return 4; // Max slab 4+
  }

  function tickSessions() {
    const now = Date.now();
    for (const [sessionId, session] of activeSessions) {
      // 1. Check if Billing Started
      if (!session.actualBillingStart || now < session.actualBillingStart) continue;

      // 2. Check Connections (BOTH must be connected)
      // We check if the socket ID for the user is present in userSockets AND if that socket is actually connected?
      // userSockets only has entry if registered.
      // We assume if they serve 'disconnect' event, they are removed from userSockets/socketToUser?
      // Checking 'disconnect' handler: it conditionally removes from userSockets.
      // Yes, if (userSockets.get(userId) === socket.id) userSockets.delete(userId);

      const clientSocketId = userSockets.get(session.clientId);
      const astroSocketId = userSockets.get(session.astrologerId);

      const isClientConnected = !!clientSocketId;
      const isAstroConnected = !!astroSocketId;

      if (isClientConnected && isAstroConnected) {
        session.elapsedBillableSeconds++;
        if (session.elapsedBillableSeconds % 5 === 0) console.log(`Session ${sessionId}: Tick ${session.elapsedBillableSeconds}s`);

        // Phase 3: First Minute Check (at 60s exactly)
        if (session.elapsedBillableSeconds === 60) {
          console.log(`Session ${sessionId}: First 60s completed.`);
          processBillingCharge(sessionId, 60, 1, 'first_60_full');
          // Note: lastBilledMinute update is below
        }

        // Phase 4: Check Slab Upgrade
        if (session.pairMonthId) {
          const totalSeconds = (session.initialPairSeconds || 0) + session.elapsedBillableSeconds;
          const calculatedSlab = getSlabBySeconds(totalSeconds);
          const effectiveSlab = Math.max(calculatedSlab, session.currentSlab || 0);

          if (effectiveSlab > session.currentSlab) {
            console.log(`Session ${sessionId}: Slab Upgraded ${session.currentSlab} -> ${effectiveSlab}`);
            session.currentSlab = effectiveSlab;
            PairMonth.updateOne({ _id: session.pairMonthId }, { currentSlab: effectiveSlab }).exec();
          }
        }

        // Check Minute Boundary (Future Slabs > 1)
        // Phase 5: Post-First-Minute Billing
        if (session.elapsedBillableSeconds > 60) {
          const eligibleSeconds = session.elapsedBillableSeconds - 60;
          const eligibleMinutes = Math.floor(eligibleSeconds / 60);
          // Total billed = 1 (first min) + eligibleMinutes
          const totalShouldBeBilled = 1 + eligibleMinutes;

          if (totalShouldBeBilled > session.lastBilledMinute) {
            console.log(`Session ${sessionId}: Minute ${totalShouldBeBilled} reached.`);
            processBillingCharge(sessionId, 60, totalShouldBeBilled, 'slab');
            session.lastBilledMinute = totalShouldBeBilled;
          }
        }
      } else {
        // Paused
        // console.log(`Session ${sessionId} Paused. Client: ${isClientConnected}, Astro: ${isAstroConnected}`);
      }
    }
  }


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

  // --- Admin: Get All Users ---
  socket.on('get-all-users', async (cb) => {
    if (!await checkAdmin(socket.id)) return cb({ ok: false });
    try {
      const users = await User.find({}).sort({ role: 1, name: 1 }); // Sort by role then name
      cb({ ok: true, users });
    } catch (e) { cb({ ok: false }); }
  });

  // --- Admin: Edit User (Name Only) ---
  socket.on('admin-edit-user', async (data, cb) => {
    if (!await checkAdmin(socket.id)) return cb({ ok: false, error: 'Unauthorized' });
    try {
      const { targetUserId, updates } = data || {};
      if (!targetUserId || !updates || !updates.name) return cb({ ok: false, error: 'Invalid Data' });

      const u = await User.findOne({ userId: targetUserId });
      if (!u) return cb({ ok: false, error: 'User not found' });

      u.name = updates.name;
      await u.save();

      console.log(`Admin edited user ${u.userId}: Name -> ${u.name}`);

      if (u.role === 'astrologer') broadcastAstroUpdate();

      cb({ ok: true });
    } catch (e) {
      console.error(e);
      cb({ ok: false, error: 'Internal Error' });
    }
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

  // Phase 10: Ledger Stats
  socket.on('admin-get-ledger-stats', async (data, cb) => {
    if (!await checkAdmin(socket.id)) return cb({ ok: false });
    try {
      // Get billing stats
      const billingStats = await BillingLedger.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$chargedToClient' },
            totalAstroPayout: { $sum: '$creditedToAstrologer' },
            totalAdminRevenue: { $sum: '$adminAmount' },
            totalMinutes: { $sum: 1 }
          }
        }
      ]);

      // Get user counts
      const totalUsers = await User.countDocuments();
      const activeSessionCount = activeSessions.size;

      // Get full ledger for breakdown
      const fullLedger = await BillingLedger.find({}).sort({ createdAt: -1 }).limit(100);

      const billing = billingStats[0] || {};

      // Map to expected format
      const stats = {
        totalRevenue: billing.totalRevenue || 0,
        adminProfit: billing.totalAdminRevenue || 0,
        astroPayout: billing.totalAstroPayout || 0,
        totalDuration: (billing.totalMinutes || 0) * 60, // Convert minutes to seconds
        totalUsers: totalUsers,
        activeSessions: activeSessionCount
      };

      cb({ ok: true, stats, fullLedger });
    } catch (e) {
      console.error(e);
      cb({ ok: false });
    }
  });

  // --- Withdrawal Logic ---
  socket.on('request-withdrawal', async (data, cb) => {
    const userId = socketToUser.get(socket.id);
    if (!userId) return;
    try {
      const amount = parseInt(data.amount);
      if (!amount || amount < 100) return cb({ ok: false, error: 'Minimum limit 100' });

      // Check Balance
      const u = await User.findOne({ userId });
      if (!u || u.walletBalance < amount) return cb({ ok: false, error: 'Insufficient Balance' });

      const w = await Withdrawal.create({
        astroId: userId,
        amount,
        status: 'pending',
        requestedAt: Date.now()
      });

      // Notify Super Admins
      io.to('superadmin').emit('admin-notification', {
        type: 'withdrawal_request',
        text: `💰 New Withdrawal Request: ${u.name} requested ₹${amount}`,
        data: { withdrawalId: w._id, astroName: u.name, amount }
      });

      cb({ ok: true });
    } catch (e) {
      console.error(e);
      cb({ ok: false, error: 'Error' });
    }
  });

  socket.on('approve-withdrawal', async (data, cb) => {
    try {
      const { withdrawalId } = data;
      const w = await Withdrawal.findById(withdrawalId);
      if (!w || w.status !== 'pending') return cb({ ok: false, error: 'Invalid Request' });

      const u = await User.findOne({ userId: w.astroId });
      if (!u) return cb({ ok: false, error: 'User not found' });

      if (u.walletBalance < w.amount) return cb({ ok: false, error: 'User Insufficient Balance' });

      // Deduct
      u.walletBalance -= w.amount;
      await u.save();

      // Update Request
      w.status = 'approved';
      w.processedAt = Date.now();
      await w.save();

      // Notify Astro
      const sId = userSockets.get(u.userId);
      if (sId) {
        io.to(sId).emit('wallet-update', { balance: u.walletBalance });
        io.to(sId).emit('app-notification', { text: `✅ Your withdrawal of ₹${w.amount} is approved!` });
      }

      cb({ ok: true, balance: u.walletBalance });
    } catch (e) {
      console.error(e);
      cb({ ok: false, error: 'Error' });
    }
  });

  socket.on('get-withdrawals', async (cb) => {
    try {
      const list = await Withdrawal.find().sort({ requestedAt: -1 }).limit(50);
      const enriched = [];
      for (const w of list) {
        const u = await User.findOne({ userId: w.astroId });
        enriched.push({ ...w.toObject(), astroName: u ? u.name : 'Unknown' });
      }
      cb({ ok: true, list: enriched });
    } catch (e) { cb({ ok: false, list: [] }); }
  });
  // --- End Withdrawal Logic ---

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
