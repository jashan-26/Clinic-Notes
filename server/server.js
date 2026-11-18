import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import {
  analyzeNotes,
  summarizeNotes,
  summarizeConsultation,
  diarizeConversation,
} from './anthropic.js';
import { PharmacyGateway } from './pharmacy/gateway.js';
import {
  verifyApprovedClinician,
  isServerSupabaseConfigured,
  supabaseAdmin,
} from './supabaseAdmin.js';
import adminRoutes from './adminRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';

// Setup Socket.IO with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global IP Rate Limiter
const rateLimits = new Map();
function simpleRateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 120; // 120 requests per minute

  const record = rateLimits.get(ip) || { count: 0, resetTime: now + windowMs };
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count += 1;
  }
  rateLimits.set(ip, record);

  if (record.count > maxRequests) {
    return res.status(429).json({
      error: 'Too many requests. Please slow down.',
    });
  }
  next();
}

app.use('/api', simpleRateLimiter);

// Per-User Rate Limiter for Claude AI Endpoints
const userAiLimits = new Map();
function userAiRateLimiter(req, res, next) {
  const userId = req.user?.id || req.ip || 'anonymous';
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxAiRequests = 30; // 30 AI requests per minute per user

  const record = userAiLimits.get(userId) || { count: 0, resetTime: now + windowMs };
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
  } else {
    record.count += 1;
  }
  userAiLimits.set(userId, record);

  if (record.count > maxAiRequests) {
    return res.status(429).json({
      error: 'AI request limit reached for this account. Please wait a minute before analyzing further.',
    });
  }
  next();
}

// Initialize Pharmacy Gateway
const pharmacyGateway = new PharmacyGateway();

/* -------------------------------------------------------------
   HEALTH & METRICS (Pings Supabase to prevent free-tier pause)
   ------------------------------------------------------------- */
app.get('/api/health', async (req, res) => {
  let dbStatus = 'Demo In-Memory Mode';

  if (isServerSupabaseConfigured && supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin.from('hospitals').select('id').limit(1);
      dbStatus = error ? `Supabase Connected (Query Notice: ${error.message})` : 'Supabase Postgres (Healthy)';
    } catch (e) {
      dbStatus = `Supabase Unreachable: ${e.message}`;
    }
  }

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    demoMode: !process.env.ANTHROPIC_API_KEY,
    database: dbStatus,
    supabaseConfigured: isServerSupabaseConfigured,
    engine: process.env.ANTHROPIC_API_KEY ? 'Anthropic Claude Sonnet 4.6' : 'High-Fidelity Sandbox Simulator',
    providersConfigured: ['apollo', 'blinkit', 'zepto', 'tata1mg', 'pharmeasy'],
  });
});

/* -------------------------------------------------------------
   DEV / DEMO AUTH HELPER (When VITE_REQUIRE_EMAIL_CONFIRMATION=false)
   ------------------------------------------------------------- */
app.post('/api/auth/dev-auto-confirm', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    if (!isServerSupabaseConfigured || !supabaseAdmin) {
      return res.json({ success: true, message: 'Running in demo mode' });
    }

    const { data: usersData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
    if (listErr) throw listErr;

    const user = usersData?.users?.find((u) => u.email?.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return res.status(404).json({ error: 'User not found in Supabase Auth' });
    }

    await supabaseAdmin.auth.admin.updateUserById(user.id, { email_confirm: true });
    res.json({ success: true, email: user.email, confirmed: true });
  } catch (err) {
    console.error('Error auto-confirming email:', err);
    res.status(500).json({ error: 'Failed to auto-confirm email' });
  }
});

/* -------------------------------------------------------------
   ADMIN PORTAL ROUTES
   ------------------------------------------------------------- */
app.use('/api/admin', adminRoutes);

/* -------------------------------------------------------------
   TAB 1: DOCTOR NOTES ENDPOINTS
   ------------------------------------------------------------- */
app.post('/api/analyze-notes', verifyApprovedClinician, userAiRateLimiter, async (req, res) => {
  try {
    const { transcript, language } = req.body;
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'Valid transcript string is required' });
    }

    const result = await analyzeNotes(transcript, language);
    res.json(result);
  } catch (error) {
    console.error('Error in /api/analyze-notes:', error);
    res.status(500).json({ error: 'Failed to analyze notes' });
  }
});

app.post('/api/summarize-notes', verifyApprovedClinician, userAiRateLimiter, async (req, res) => {
  try {
    const { transcript, language, maskPhi } = req.body;
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'Valid transcript string is required' });
    }

    const summary = await summarizeNotes(transcript, language, maskPhi);
    res.json(summary);
  } catch (error) {
    console.error('Error in /api/summarize-notes:', error);
    res.status(500).json({ error: 'Failed to summarize notes' });
  }
});

/* -------------------------------------------------------------
   TAB 2: CONSULTATION ENDPOINTS
   ------------------------------------------------------------- */
app.post('/api/summarize-consultation', verifyApprovedClinician, userAiRateLimiter, async (req, res) => {
  try {
    const { dialogue, language } = req.body;
    if (!dialogue || !Array.isArray(dialogue) || dialogue.length === 0) {
      return res.status(400).json({ error: 'Dialogue array is required' });
    }

    const result = await summarizeConsultation(dialogue, language);
    res.json(result);
  } catch (error) {
    console.error('Error in /api/summarize-consultation:', error);
    res.status(500).json({ error: 'Failed to summarize consultation' });
  }
});

app.post('/api/ai-diarize', async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'Transcript string is required' });
    }

    const result = await diarizeConversation(transcript);
    res.json(result);
  } catch (error) {
    console.error('Error in /api/ai-diarize:', error);
    res.status(500).json({ error: 'Failed to diarize conversation' });
  }
});

/* -------------------------------------------------------------
   PHARMACY GATEWAY ENDPOINTS
   ------------------------------------------------------------- */
app.get('/api/pharmacy/search', (req, res) => {
  try {
    const query = req.query.q || '';
    const results = pharmacyGateway.search(query);
    res.json({
      query,
      count: results.length,
      medicines: results,
    });
  } catch (error) {
    console.error('Error in pharmacy search:', error);
    res.status(500).json({ error: 'Failed to search medicines' });
  }
});

app.post('/api/pharmacy/order', async (req, res) => {
  try {
    const { items, provider, patientDetails, prescriptionAttached } = req.body;
    const order = await pharmacyGateway.placeOrder({
      items,
      provider,
      patientDetails,
      prescriptionAttached,
    });
    res.status(201).json(order);
  } catch (error) {
    if (error.code === 'PRESCRIPTION_REQUIRED') {
      return res.status(400).json({
        code: 'PRESCRIPTION_REQUIRED',
        error: error.message,
        details: 'Prescription-only medicine detected. Upload prescription or confirm clinical summary draft.',
      });
    }
    console.error('Error in placing pharmacy order:', error);
    res.status(500).json({ error: error.message || 'Failed to place order' });
  }
});

app.get('/api/pharmacy/order/:orderId/track', (req, res) => {
  const { orderId } = req.params;
  const order = pharmacyGateway.getOrderTracking(orderId);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

// Server-Sent Events (SSE) live order tracking stream
app.get('/api/pharmacy/order/:orderId/stream', (req, res) => {
  const { orderId } = req.params;
  const order = pharmacyGateway.getOrderTracking(orderId);
  if (!order) {
    return res.status(404).send('Order not found');
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial state
  res.write(`data: ${JSON.stringify(order)}\n\n`);

  const interval = setInterval(() => {
    const updated = pharmacyGateway.getOrderTracking(orderId);
    if (!updated) {
      clearInterval(interval);
      return res.end();
    }

    res.write(`data: ${JSON.stringify(updated)}\n\n`);

    if (updated.status === 'Delivered') {
      clearInterval(interval);
    }
  }, 3000);

  req.on('close', () => {
    clearInterval(interval);
  });
});

/* -------------------------------------------------------------
   SOCKET.IO ROOMS FOR TWO-DEVICE CONSULTATION
   ------------------------------------------------------------- */
const activeRooms = new Map();

io.on('connection', (socket) => {
  socket.on('join-room', ({ roomId, role, userName }) => {
    socket.join(roomId);

    if (!activeRooms.has(roomId)) {
      activeRooms.set(roomId, {
        doctor: null,
        patient: null,
        createdAt: Date.now(),
      });
    }

    const room = activeRooms.get(roomId);
    if (role === 'doctor') {
      room.doctor = { socketId: socket.id, name: userName || 'Dr. Sharma' };
    } else {
      room.patient = { socketId: socket.id, name: userName || 'Patient' };
    }

    io.to(roomId).emit('room-status', {
      roomId,
      hasDoctor: Boolean(room.doctor),
      hasPatient: Boolean(room.patient),
      patientName: room.patient?.name || null,
      doctorName: room.doctor?.name || null,
    });
  });

  socket.on('speech-chunk', ({ roomId, speaker, text, isFinal, timestamp }) => {
    io.to(roomId).emit('speech-chunk', {
      speaker,
      text,
      isFinal,
      timestamp: timestamp || Date.now(),
    });
  });

  socket.on('speaker-change', ({ roomId, currentSpeaker }) => {
    io.to(roomId).emit('speaker-change', { currentSpeaker });
  });

  socket.on('end-consultation', ({ roomId }) => {
    io.to(roomId).emit('consultation-ended', { timestamp: Date.now() });
  });

  socket.on('disconnect', () => {
    for (const [roomId, room] of activeRooms.entries()) {
      let changed = false;
      if (room.doctor?.socketId === socket.id) {
        room.doctor = null;
        changed = true;
      }
      if (room.patient?.socketId === socket.id) {
        room.patient = null;
        changed = true;
      }
      if (changed) {
        io.to(roomId).emit('room-status', {
          roomId,
          hasDoctor: Boolean(room.doctor),
          hasPatient: Boolean(room.patient),
        });
      }
    }
  });
});

// Serve static production build if present
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Server
server.listen(PORT, () => {
  console.log(`ClinicNotes Server running on http://localhost:${PORT}`);
  console.log(`Anthropic API Key configured: ${Boolean(process.env.ANTHROPIC_API_KEY)}`);
  console.log(`Supabase Server Service Key configured: ${isServerSupabaseConfigured}`);
});
