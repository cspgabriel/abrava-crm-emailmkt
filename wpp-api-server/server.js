require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const qrcode = require('qrcode-terminal');
const qrcodeImg = require('qrcode');
const http = require('http');
const path = require('path');
const fs = require('fs');
const { exec, execSync } = require('child_process');

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

// ====================  SETUP  ====================
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8787;
const X_API_KEY = process.env.X_API_KEY || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://abravacom.com.br';

// Build trusted origins list
let TRUSTED_ORIGINS = (process.env.ALLOWED_ORIGINS || ALLOWED_ORIGIN)
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const apiDomains = [
  'https://abravacom.com.br',
  'https://www.abravacom.com.br',
  'https://wpp-api.abravacom.com.br',
  'https://abrava-crm-emailmkt-evc5.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'http://localhost:8787'
];

TRUSTED_ORIGINS = [...new Set([...TRUSTED_ORIGINS, ...apiDomains])];

if (!X_API_KEY) {
  TRUSTED_ORIGINS.push('http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://localhost:8787');
  TRUSTED_ORIGINS = [...new Set(TRUSTED_ORIGINS)];
}

console.log('[WPP] 🔐 CORS Trusted Origins:', TRUSTED_ORIGINS);

// ====================  MIDDLEWARE  ====================
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ⚡ CORS MUITO PERMISSIVO
app.use(cors({
  origin: function(origin, callback) {
    // Permitir TUDO se não tiver origin (requisições locais)
    if (!origin) return callback(null, true);
    
    // Permitir se estiver na lista
    if (TRUSTED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    
    // Permitir localhost, wpp-api.abravacom, e abravacom
    if (origin.includes('localhost') || 
        origin.includes('abravacom') ||
        origin.includes('wpp-api')) {
      return callback(null, true);
    }
    
    console.warn(`[WPP] ⚠️  CORS: Permitindo origen não esperada:`, origin);
    callback(null, true); // Permitir mesmo assim
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'x-api-key', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Type', 'X-API-Key'],
  maxAge: 86400
}));

// ⚡ Headers adicionais de CORS (meansegurança extra)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, x-api-key, Authorization, Accept');
  res.header('Access-Control-Expose-Headers', 'Content-Type, X-API-Key');
  
  // Pré-flight
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ====================  STATE  ====================
const authDir = path.join(__dirname, '.wwebjs_auth');
if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

const SESSION_CLIENT_ID = 'session-abravacon-wpp';
const sessionPath = path.join(authDir, SESSION_CLIENT_ID);
const doesSessionExist = fs.existsSync(sessionPath) && fs.readdirSync(sessionPath).length > 0;

let lastQr = null;
let isStartingClient = false;
let reconnectTimer = null;
let lastInitError = null;
let connectionState = doesSessionExist ? 'restoring' : 'waiting-qr'; // 'waiting-qr', 'restoring', 'ready', 'error'

// Track previous-session restore attempts and errors so the frontend can show
// a clear message when a stored session couldn't be restored.
let previousSessionFound = doesSessionExist;
let previousSessionAttempted = false;
let previousSessionFailed = false;
let previousSessionErrorStack = null;

console.log('[WPP] 📂 LocalAuth directory:', authDir);
console.log('[WPP] 📂 Session path:', sessionPath);
console.log('[WPP] 📋 Previous session found:', doesSessionExist);

// ====================  AUTH MIDDLEWARE  ====================
app.use((req, res, next) => {
  if (req.method === 'GET' && ['/', '/healthz', '/status', '/qr', '/session-check'].includes(req.path)) {
    return next();
  }
  const key = req.header('x-api-key') || req.query.api_key;
  const origin = (req.header('origin') || '').trim();
  if (!X_API_KEY) return next();
  if (key && key === X_API_KEY) return next();
  if (origin && TRUSTED_ORIGINS.includes(origin) && (
    (req.method === 'POST' && req.path === '/send') ||
    (req.method === 'POST' && req.path === '/schedule') ||
    (req.method === 'GET' && req.path === '/schedules') ||
    (req.method === 'POST' && req.path.startsWith('/schedules'))
  )) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized', detail: 'Invalid or missing API key' });
});

// ====================  WHATSAPP CLIENT  ====================
const WPP_HEADLESS = (process.env.WPP_HEADLESS || 'true') === 'true';
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: authDir, clientId: SESSION_CLIENT_ID }),
  puppeteer: {
    headless: WPP_HEADLESS,
    timeout: 60000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-blink-features=AutomationControlled',
      '--no-first-run',
      '--no-zygote',
      '--disable-extensions',
      '--disable-sync',
      '--mute-audio',
      '--enable-automation'
    ],
  },
  restartOnAuthFail: true,
  qrMaxRetries: 5,
  takeoverOnConflict: true
});

// ====================  CLIENT EVENTS  ====================

// Evento: QR Code gerado (sessão nova)
client.on('qr', async (qr) => {
  console.log('[WPP] � QR Code gerado - escaneie com WhatsApp');
  
  connectionState = 'waiting-qr';
  
  try {
    const dataUrl = await qrcodeImg.toDataURL(qr);
    lastQr = dataUrl;
    console.log('[WPP] ✅ QR pronto no endpoint /qr');
  } catch (e) {
    console.error('[WPP] ❌ Erro ao gerar QR:', e.message);
    lastQr = null;
  }
  
  // Mostrar QR no terminal também
  qrcode.generate(qr, { small: true });
});

// Evento: Sessão autenticada
client.on('authenticated', () => {
  console.log('[WPP] 🔐 Autenticado! Aguarde conexão total...');
  lastQr = null;
  connectionState = 'ready';
});

// Evento: Cliente pronto (conectado)
client.on('ready', () => {
  const phone = client.info?.wid?.user || 'desconhecido';
  const pushname = client.info?.pushname || 'sem-nome';
  console.log('\n' + '═'.repeat(70));
  console.log('🎉 ✅ WHATSAPP CONECTADO COM SUCESSO!');
  console.log('═'.repeat(70));
  console.log(`📱 NÚMERO: ${phone}`);
  console.log(`👤 NOME:   ${pushname}`);
  console.log(`🔄 SESSÃO: ${previousSessionFound && !previousSessionFailed ? '✅ RESTAURADA' : '⚠️  NOVA'}`);
  console.log('═'.repeat(70) + '\n');
  
  lastInitError = null;
  lastQr = null;
});

// Evento: Falha de autenticação
client.on('auth_failure', (msg) => {
  console.error('[WPP] ❌ Falha na autenticação:', msg);
  connectionState = 'error';
  lastInitError = msg;
  scheduleReconnect('auth_failure');
});

// Evento: Desconectado
client.on('disconnected', (reason) => {
  console.warn('[WPP] 🔌 Desconectado:', reason);
  connectionState = 'error';
  lastInitError = String(reason || 'disconnected');
  scheduleReconnect('disconnected');
});

// Erro não tratado
process.on('unhandledRejection', (reason) => {
  console.error('[WPP] UnhandledRejection:', reason?.message || reason);
});

// ====================  CLIENT INITIALIZATION  ====================

function scheduleReconnect(reason) {
  if (reconnectTimer) return;
  console.warn(`[WPP] ⏳ Reconexão agendada em 5s. Motivo: ${reason}`);
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    await startClient();
  }, 5000);
}

async function forceKillBrowser() {
  try {
    // ===== 1. Fechar conexão Puppeteer =====
    if (client.pupBrowser) {
      try {
        await Promise.race([
          client.pupBrowser.close(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
        ]).catch(() => {});
      } catch (e) {
        console.warn('[WPP] Erro ao fechar puppeteer:', e?.message);
      }
      client.pupBrowser = null;
    }
    if (client.pupPage) client.pupPage = null;

    // ===== 2. Matar processos Chrome/Chromium via Windows =====
    try {
      if (process.platform === 'win32') {
        console.log('[WPP] 🔪 Matando processos Chrome/Chromium no Windows...');
        try {
          execSync('taskkill /F /IM chrome.exe /T 2>nul', { stdio: 'ignore' });
        } catch (e) {}
        try {
          execSync('taskkill /F /IM chromium.exe /T 2>nul', { stdio: 'ignore' });
        } catch (e) {}
        
        // Aguardar um pouco para garantir liberação de recursos
        await new Promise(r => setTimeout(r, 1500));
      } else {
        // Linux/Mac
        try {
          execSync("killall -9 chrome 2>/dev/null || true", { stdio: 'ignore' });
          execSync("killall -9 chromium 2>/dev/null || true", { stdio: 'ignore' });
          await new Promise(r => setTimeout(r, 1500));
        } catch (e) {}
      }
    } catch (e) {
      console.warn('[WPP] Erro ao matar chrome process:', e?.message);
    }

    // ===== 3. Limpar lock files do Chromium =====
    try {
      const sessionPath = path.join(__dirname, '.wwebjs_auth', 'session-abravacon-wpp');
      if (fs.existsSync(sessionPath)) {
        // Lock files comum: LevelDB writing lock
        const lockFiles = [
          path.join(sessionPath, 'LOCK'),
          path.join(sessionPath, 'DEFAULT', 'LOCK'),
          path.join(sessionPath, 'Default', 'Cache', 'LOCK'),
          path.join(sessionPath, 'SingletonLock'),
        ];

        for (const lockFile of lockFiles) {
          if (fs.existsSync(lockFile)) {
            try {
              fs.unlinkSync(lockFile);
              console.log('[WPP] 🗑️  Removido lock file:', path.basename(lockFile));
            } catch (e) {
              // Pode estar em uso, é OK
            }
          }
        }
      }
    } catch (e) {
      // Silenciar erros de limpeza de lock files
    }

  } catch (e) {
    console.warn('[WPP] ⚠️  Erro ao forceKillBrowser:', e?.message);
  }
}

async function startClient() {
  if (isStartingClient) {
    console.log('[WPP] ⏳ Inicialização em andamento...');
    return;
  }
  isStartingClient = true;
  lastInitError = null;
  
  // If there's an existing session, try restoring it only ONCE. If it fails,
  // capture the full error stack, invalidate the old session and proceed to
  // start a fresh login (QR) flow. This avoids repeated noisy restore loops
  // and makes it explicit to the frontend that the previous session failed.
  if (doesSessionExist && !previousSessionAttempted) {
    previousSessionAttempted = true;
    console.log('[WPP] 🔄 Restaurando sessão anterior (1 tentativa)...');
    connectionState = 'restoring';
    try {
      await client.initialize();
      console.log('[WPP] ✅ Sessão restaurada!');
      lastInitError = null;
      previousSessionFailed = false;
      isStartingClient = false;
      return;
    } catch (err) {
      const errStack = err?.stack || err?.message || String(err);
      console.error('[WPP] ❌ Falha ao restaurar sessão anterior (não será tentado novamente):', errStack);
      lastInitError = errStack;
      previousSessionFailed = true;
      previousSessionErrorStack = errStack;
      connectionState = 'waiting-qr';

      try {
        if (errStack.includes('already running')) {
          console.log('[WPP] 🔪 Limpando browser...');
          await forceKillBrowser();
          await new Promise(r => setTimeout(r, 2000));
        } else {
          await forceKillBrowser();
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (e) {}

      try {
        fs.rmSync(sessionPath, { recursive: true, force: true });
        console.log('[WPP] 🗑️  Sessão antiga removida (invalidada para novo login)');
      } catch (e) {}

      // fallthrough to start fresh QR below
    }
  }
  
  console.log('[WPP] 📱 Iniciando com novo QR...');
  connectionState = 'waiting-qr';
  
  try {
    await client.initialize();
    console.log('[WPP] ✅ Pronto para receber QR!');
    lastInitError = null;
  } catch (err) {
    const errMsg = err?.message || String(err);
    console.error('[WPP] ❌ Erro ao iniciar:', errMsg);
    lastInitError = errMsg;
    connectionState = 'error';
    await forceKillBrowser();
  }
  
  isStartingClient = false;
}

startClient().catch(e => console.error('[WPP] Fatal error:', e));



// ====================  REST ENDPOINTS  ====================

function buildStatusMessage() {
  const ready = !!(client && client.info && client.info.wid);
  const info = client?.info ? {
    phone: client.info.wid?.user || null,
    accountName: client.info.pushname || null
  } : null;
  const sessionDirExists = fs.existsSync(sessionPath);
  const sessionFilesExist = sessionDirExists && fs.readdirSync(sessionPath).length > 0;
  
  return {
    ok: true,
    ready,
    phone: info?.phone || null,
    accountName: info?.accountName || null,
    connectionState,
    sessionPersisted: sessionFilesExist,
    previousSessionFound,
    previousSessionFailed,
    previousSessionError: previousSessionErrorStack || null,
    hasQR: !!lastQr,
    qr: lastQr,
    initializing: isStartingClient,
    lastError: lastInitError,
    timestamp: new Date().toISOString()
  };
}

app.get('/', (req, res) => 
  res.json({ ok: true, message: 'WPP API Server' })
);

app.get('/healthz', (req, res) => 
  res.json({ ok: true, service: 'wpp-api-server' })
);

// Status endpoint - reflects real connection state
app.get('/status', (req, res) => {
  try {
    res.json(buildStatusMessage());
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// QR Code endpoint
app.get('/qr', (req, res) => {
  if (!lastQr) {
    return res.status(404).json({ 
      ok: false,
      connectionState,
      error: 'No QR code available'
    });
  }
  res.json({ ok: true, qr: lastQr });
});

// Debug endpoint - shows current state
app.get('/debug', (req, res) => {
  res.json({
    ok: true,
    status: buildStatusMessage()
  });
});

// Session check endpoint
app.get('/session-check', (req, res) => {
  try {
    const sessionExists = fs.existsSync(sessionPath) && fs.readdirSync(sessionPath).length > 0;
    res.json({ 
      ok: true, 
      sessionExists,
      initializing: isStartingClient
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Emergency cleanup endpoint - kills Chrome locks but preserves session
app.post('/cleanup', async (req, res) => {
  try {
    console.log('[WPP] 🔧 Cleanup requested via HTTP');
    
    const locksBefore = (() => {
      let count = 0;
      const walk = (dir) => {
        try {
          fs.readdirSync(dir).forEach(f => {
            if (['LOCK', 'SingletonLock', '.lockfile'].some(p => f.includes(p))) count++;
            const stat = fs.statSync(path.join(dir, f));
            if (stat.isDirectory()) walk(path.join(dir, f));
          });
        } catch (e) {}
      };
      if (fs.existsSync(sessionPath)) walk(sessionPath);
      return count;
    })();
    
    await forceKillBrowser();
    
    res.json({ 
      ok: true, 
      message: 'Cleanup complete',
      locksFound: locksBefore,
      sessionPreserved: fs.existsSync(sessionPath) && fs.readdirSync(sessionPath).length > 0
    });
    
    // Auto-reconnect after short delay
    setTimeout(() => startClient(), 1500);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Send message endpoint
app.post('/send', async (req, res) => {
  try {
    const { phone, message, mediaBase64, filename, name } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: 'phone and message required' });
    }
    
    if (!client?.info?.wid) {
      return res.status(503).json({ 
        error: 'whatsapp_not_ready', 
        detail: 'WhatsApp session not initialized'
      });
    }
    
    const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;
    
    if (mediaBase64) {
      const media = MessageMedia.fromDataURL(mediaBase64);
      await client.sendMessage(chatId, media, { caption: message });
    } else {
      await client.sendMessage(chatId, message);
    }
    
    res.json({ ok: true, chatId });
  } catch (err) {
    console.error('[WPP] Send error:', err.message);
    res.status(500).json({ error: 'send_failed', detail: err.message });
  }
});

// Logout endpoint
app.post('/logout', async (req, res) => {
  try {
    connectionState = 'waiting-qr';
    lastQr = null;
    lastInitError = null;
    await client.destroy().catch(() => {});
    try { 
      fs.rmSync(authDir, { recursive: true, force: true }); 
    } catch (e) {}
    // Reset previous-session tracking after an explicit logout
    previousSessionFound = false;
    previousSessionAttempted = false;
    previousSessionFailed = false;
    previousSessionErrorStack = null;
    
    res.json({ ok: true, message: 'Logged out' });
    setTimeout(() => startClient(), 1000);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Reconnect endpoint
app.post('/reconnect', async (req, res) => {
  try {
    console.log('[WPP] Reconexão manual solicitada...');
    if (client?.pupBrowser) {
      await client.destroy().catch(() => {});
    }
    res.json({ ok: true, message: 'Reiniciando' });
    setTimeout(() => startClient(), 1000);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// ====================  SCHEDULING (simplified)  ====================

const SCHEDULES_FILE = path.join(__dirname, 'schedules.json');

function readSchedules() {
  try {
    if (!fs.existsSync(SCHEDULES_FILE)) return [];
    return JSON.parse(fs.readFileSync(SCHEDULES_FILE, 'utf8')) || [];
  } catch (e) {
    console.error('[WPP] Failed to read schedules:', e);
    return [];
  }
}

function writeSchedules(schedules) {
  try {
    fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(schedules, null, 2), 'utf8');
  } catch (e) {
    console.error('[WPP] Failed to write schedules:', e);
  }
}

app.post('/schedule', (req, res) => {
  try {
    const { phone, message, scheduledAt } = req.body;
    if (!phone || !message || !scheduledAt) {
      return res.status(400).json({ error: 'phone, message, scheduledAt required' });
    }
    
    const schedules = readSchedules();
    const id = `sch_${Date.now()}_${Math.floor(Math.random() * 9000 + 1000)}`;
    schedules.push({ id, phone, message, scheduledAt, status: 'scheduled' });
    writeSchedules(schedules);
    
    res.json({ ok: true, id });
  } catch (e) {
    console.error('[WPP] schedule error:', e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/schedules', (req, res) => {
  try {
    res.json({ ok: true, schedules: readSchedules() });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Background worker to process scheduled messages
setInterval(async () => {
  try {
    if (!client?.info?.wid) return;
    
    let schedules = readSchedules();
    let changed = false;
    const now = Date.now();
    
    for (let i = 0; i < schedules.length; i++) {
      if (schedules[i].status !== 'scheduled') continue;
      
      const when = new Date(schedules[i].scheduledAt).getTime();
      if (isNaN(when)) {
        schedules[i].status = 'failed';
        changed = true;
        continue;
      }
      
      if (when <= now) {
        try {
          const chatId = schedules[i].phone.includes('@c.us') 
            ? schedules[i].phone 
            : `${schedules[i].phone}@c.us`;
          await client.sendMessage(chatId, schedules[i].message);
          schedules[i].status = 'sent';
          changed = true;
        } catch (e) {
          schedules[i].status = 'failed';
          changed = true;
        }
      }
    }
    
    if (changed) writeSchedules(schedules);
  } catch (e) {
    console.error('[WPP] Schedule worker error:', e);
  }
}, 15000);

// ====================  GRACEFUL SHUTDOWN  ====================

async function shutdown(signal) {
  console.log(`[WPP] ${signal} recebido. Encerrando...`);
  try {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    await forceKillBrowser();
    await client.destroy().catch(() => {});
  } catch (e) {
    console.warn('[WPP] Erro durante shutdown:', e?.message);
  } finally {
    process.exit(0);
  }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// ====================  START SERVER  ====================

server.listen(PORT, () => {
  console.log(`\n[WPP] ✓ WPP API Server listening on port ${PORT}`);
  console.log('[WPP] 📍 Endpoints:');
  console.log('  GET  /status         → Connection status');
  console.log('  POST /send           → Send message');
  console.log('  POST /logout         → Disconnect');
  console.log(`[WPP] Auth: ${X_API_KEY ? 'X-API-KEY required' : 'DEV MODE'}\n`);
});
