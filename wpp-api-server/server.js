const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const qrcode = require('qrcode-terminal');
const qrcodeImg = require('qrcode');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Carrega variáveis de ambiente - Ajustado para PKG
const dotEnvPath = process.pkg 
    ? path.join(path.dirname(process.execPath), '.env') 
    : path.join(__dirname, '.env');
require('dotenv').config({ path: dotEnvPath });

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const P = require('pino');

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
    // ensure preflight requests receive the Access-Control-Allow-Origin header
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, x-api-key, Authorization, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
    return res.sendStatus(200);
  }
  next();
});

// ====================  STATE  ====================
const authDir = process.pkg 
  ? path.join(path.dirname(process.execPath), 'baileys_auth') 
  : path.join(__dirname, 'baileys_auth');

if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

const doesSessionExist = fs.existsSync(authDir) && fs.readdirSync(authDir).length > 0;

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

// Baileys socket instance
let sock = null;
let retryCount = 0;
const MAX_RETRIES = 8;

console.log('[WPP] 📂 Baileys Auth directory:', authDir);
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
  const isVercel = origin.includes('vercel.app');
  const isAbravacom = origin.includes('abravacom.com.br');
  const isLocalhost = origin.includes('localhost');
  const isTrusted = isVercel || isAbravacom || isLocalhost || TRUSTED_ORIGINS.includes(origin);

  if (isTrusted && (
    (req.method === 'POST' && req.path === '/send') ||
    (req.method === 'POST' && req.path === '/logout') ||
    (req.method === 'POST' && req.path === '/schedule') ||
    (req.method === 'GET' && req.path === '/schedules') ||
    (req.method === 'POST' && req.path.startsWith('/schedules'))
  )) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized', detail: 'Invalid or missing API key' });
});

// ====================  BAILEYS CLIENT  ====================

async function startClient() {
  if (isStartingClient) {
    console.log('[WPP] ⏳ Inicialização em andamento...');
    return;
  }
  isStartingClient = true;
  lastInitError = null;
  
  console.log('[WPP] 🚀 Iniciando motor Baileys (WebSocket puro — sem navegador)...');
  connectionState = doesSessionExist && !previousSessionAttempted ? 'restoring' : 'waiting-qr';
  previousSessionAttempted = true;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(authDir);
    // Buscar versão mais recente do WhatsApp Web
    let version;
    try {
      const { version: latestVersion, isLatest } = await fetchLatestBaileysVersion();
      version = latestVersion;
      console.log(`[WPP] 📦 WA Web version: ${version.join('.')} (latest: ${isLatest})`);
    } catch (e) {
      // Fallback para versão conhecida estável
      version = [2, 3000, 1023141209];
      console.log(`[WPP] 📦 WA Web version (fallback): ${version.join('.')}`);
    }

    // Encerrar socket anterior se existir
    if (sock) {
      try { sock.end(); } catch (e) {}
      sock = null;
      // Cooldown para o WhatsApp liberar a conexão anterior
      console.log('[WPP] ⏳ Aguardando liberação da conexão anterior (3s)...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      logger: P({ level: 'error' }),
      browser: ['Ubuntu', 'Chrome', '20.0.04'],
      syncFullHistory: false,
      shouldSyncHistoryMessage: () => false, // Evita bad-request em contas com muito histórico
      markOnlineOnConnect: true,
      defaultQueryTimeoutMs: undefined,
      connectTimeoutMs: 60000,
      generateHighQualityLinkPreview: false,
      patchMessageBeforeSending: (message) => {
        const requiresPatch = !!(
          message.buttonsMessage 
          || message.templateMessage
          || message.listMessage
        );
        if (requiresPatch) {
          message = {
            viewOnceMessage: {
              message: {
                messageContextInfo: {
                  deviceListMetadata: {},
                  deviceListMetadataVersion: 2
                },
                ...message
              }
            }
          };
        }
        return message;
      }
    });

    // Salvar credenciais quando atualizadas
    sock.ev.on('creds.update', saveCreds);

    // ====================  CONNECTION EVENTS  ====================
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // QR Code gerado
      if (qr) {
        console.log('[WPP] 📸 QR Code gerado - escaneie com WhatsApp');
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
      }

      // Conexão aberta (equivale ao 'ready' do whatsapp-web.js)
      if (connection === 'open') {
        retryCount = 0;
        lastInitError = null;
        lastQr = null;
        connectionState = 'ready';
        previousSessionFailed = false;
        isStartingClient = false;

        const phone = sock.user?.id?.split(':')[0] || sock.user?.id?.split('@')[0] || 'desconhecido';
        const pushname = sock.user?.name || 'sem-nome';
        
        console.log('\n' + '═'.repeat(70));
        console.log('🎉 ✅ WHATSAPP CONECTADO COM SUCESSO! (Motor: Baileys)');
        console.log('═'.repeat(70));
        console.log(`📱 NÚMERO: ${phone}`);
        console.log(`👤 NOME:   ${pushname}`);
        console.log(`🔄 SESSÃO: ${previousSessionFound && !previousSessionFailed ? '✅ RESTAURADA' : '⚠️  NOVA'}`);
        console.log('═'.repeat(70) + '\n');
      }

      // Conexão fechada
      if (connection === 'close') {
        lastQr = null;
        const statusCode = lastDisconnect?.error?.output?.statusCode 
          || lastDisconnect?.error?.code 
          || 'unknown';
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        
        console.log(`[WPP] 🔌 Desconectado. Código: ${statusCode}`);
        
        if (statusCode === DisconnectReason.loggedOut) {
          // Logout intencional — limpar sessão
          connectionState = 'waiting-qr';
          lastInitError = 'Logged out';
          console.log('[WPP] 🚪 Logout detectado. Limpando sessão...');
          try {
            fs.rmSync(authDir, { recursive: true, force: true });
            fs.mkdirSync(authDir, { recursive: true });
          } catch (e) {}
          previousSessionFound = false;
          previousSessionFailed = false;
          previousSessionErrorStack = null;
          isStartingClient = false;
          // Reconectar para gerar novo QR
          scheduleReconnect('loggedOut');
        } else if (statusCode === 405) {
          // 405 = connectionReplaced — outra instância Baileys está ativa
          // Pode ser test-baileys.js, outra aba, ou reconexão rápida demais
          connectionState = 'error';
          lastInitError = 'Conflito: outra sessão WebSocket ativa (405). Feche test-baileys.js se estiver rodando.';
          isStartingClient = false;
          
          // Limpar sessão corrompida se não tinha sessão antes
          if (!previousSessionFound) {
            console.log('[WPP] ⚠️ 405 sem sessão prévia — limpando pasta auth...');
            try {
              fs.rmSync(authDir, { recursive: true, force: true });
              fs.mkdirSync(authDir, { recursive: true });
            } catch (e) {}
          }
          
          if (retryCount < MAX_RETRIES) {
            retryCount++;
            // Esperar mais tempo no 405 — dar tempo para a outra instância liberar
            const delay = Math.min(retryCount * 5 + 5, 30);
            console.log(`[WPP] ⚠️ 405 (conflito). Outra instância pode estar ativa.`);
            console.log(`[WPP] 💡 Dica: feche test-baileys.js (porta 8989) se estiver rodando.`);
            console.log(`[WPP] 🔄 Tentando novamente em ${delay}s... (${retryCount}/${MAX_RETRIES})`);
            setTimeout(() => startClient(), delay * 1000);
          } else {
            console.error('[WPP] ❌ Máximo de tentativas com 405. Verifique se há outra instância rodando.');
          }
        } else if (shouldReconnect && retryCount < MAX_RETRIES) {
          connectionState = 'error';
          lastInitError = `Disconnected (code: ${statusCode})`;
          isStartingClient = false;
          retryCount++;
          const delay = Math.min(retryCount * 3, 15);
          console.log(`[WPP] 🔄 Reconectando em ${delay}s... (tentativa ${retryCount}/${MAX_RETRIES})`);
          setTimeout(() => startClient(), delay * 1000);
        } else {
          connectionState = 'error';
          lastInitError = `Disconnected (code: ${statusCode}). Max retries reached.`;
          isStartingClient = false;
          console.error('[WPP] ❌ Máximo de tentativas atingido.');
        }
      }
    });

    // Evento de mensagens recebidas (log para debug)
    sock.ev.on('messages.upsert', async (m) => {
      if (m.type === 'notify') {
        for (const msg of m.messages) {
          if (!msg.key.fromMe && msg.message) {
            const jid = msg.key.remoteJid;
            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || '';
            if (text) {
              console.log(`[WPP] 📩 Mensagem de ${jid}: ${text.substring(0, 80)}${text.length > 80 ? '...' : ''}`);
            }
          }
        }
      }
    });

  } catch (err) {
    const errMsg = err?.message || String(err);
    console.error('[WPP] ❌ Erro ao iniciar Baileys:', errMsg);
    lastInitError = errMsg;
    connectionState = 'error';
    previousSessionFailed = true;
    previousSessionErrorStack = err?.stack || errMsg;
    isStartingClient = false;
  }
}

function scheduleReconnect(reason) {
  if (reconnectTimer) return;
  console.warn(`[WPP] ⏳ Reconexão agendada em 5s. Motivo: ${reason}`);
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    await startClient();
  }, 5000);
}

// Erro não tratado
process.on('unhandledRejection', (reason) => {
  console.error('[WPP] UnhandledRejection:', reason?.message || reason);
});

// Iniciar o client
startClient().catch(e => console.error('[WPP] Fatal error:', e));



// ====================  REST ENDPOINTS  ====================

function buildStatusMessage() {
  // Only consider ready if connectionState is actually 'ready'
  const isActuallyReady = connectionState === 'ready' && !!sock?.user;
  
  const phone = isActuallyReady ? (sock.user?.id?.split(':')[0] || sock.user?.id?.split('@')[0] || null) : null;
  const accountName = isActuallyReady ? (sock.user?.name || null) : null;
  const sessionDirExists = fs.existsSync(authDir);
  const sessionFilesExist = sessionDirExists && fs.readdirSync(authDir).length > 0;
  
  return {
    ok: true,
    ready: isActuallyReady,
    phone: phone,
    accountName: accountName,
    connectionState,
    sessionPersisted: sessionFilesExist,
    previousSessionFound,
    previousSessionFailed,
    previousSessionError: previousSessionErrorStack || null,
    hasQR: !!lastQr,
    qr: lastQr,
    initializing: isStartingClient,
    lastError: lastInitError,
    retryCount,
    maxRetries: MAX_RETRIES,
    timestamp: new Date().toISOString()
  };
}

app.get('/', (req, res) => 
  res.json({ ok: true, message: 'WPP API Server (Baileys Engine)' })
);

app.get('/healthz', (req, res) => 
  res.json({ ok: true, service: 'wpp-api-server', engine: 'baileys' })
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
    engine: 'baileys',
    status: buildStatusMessage()
  });
});

// Session check endpoint
app.get('/session-check', (req, res) => {
  try {
    const sessionExists = fs.existsSync(authDir) && fs.readdirSync(authDir).length > 0;
    res.json({ 
      ok: true, 
      sessionExists,
      initializing: isStartingClient
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Emergency cleanup endpoint
app.post('/cleanup', async (req, res) => {
  try {
    console.log('[WPP] 🔧 Cleanup requested via HTTP');
    
    // Encerrar socket
    if (sock) {
      try { sock.end(); } catch (e) {}
      sock = null;
    }
    
    res.json({ 
      ok: true, 
      message: 'Cleanup complete',
      sessionPreserved: fs.existsSync(authDir) && fs.readdirSync(authDir).length > 0
    });
    
    // Auto-reconnect after short delay
    isStartingClient = false;
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
    
    if (!sock || connectionState !== 'ready') {
      return res.status(503).json({ 
        error: 'whatsapp_not_ready', 
        detail: 'WhatsApp session not initialized'
      });
    }
    
    // Robust chatId resolution
    let chatId = phone;

    // Check if it's already a JID
    if (!chatId.includes('@')) {
      // Basic formatting: remove non-digits
      let cleanPhone = phone.replace(/\D/g, '');
      
      // Auto-prepend 55 for Brazilian numbers (10 or 11 digits without country code)
      if (cleanPhone.length >= 10 && cleanPhone.length <= 11 && !cleanPhone.startsWith('55')) {
          console.log(`[WPP] 🇧🇷 Prepending 55 to Brazilian number: ${cleanPhone}`);
          cleanPhone = `55${cleanPhone}`;
      }
      
      try {
          // Use onWhatsApp to verify the number exists (equivalent to getNumberId)
          const [result] = await sock.onWhatsApp(cleanPhone);
          if (result && result.exists) {
              chatId = result.jid;
              console.log(`[WPP] ✅ Resolved ${phone} -> ${chatId}`);
          } else {
              // Number not found on WhatsApp
              console.warn(`[WPP] ⚠️ Number ${cleanPhone} is not registered on WhatsApp.`);
              return res.status(404).json({ 
                  error: 'number_not_found', 
                  detail: `The number ${phone} is not registered on WhatsApp.` 
              });
          }
      } catch (e) {
          console.warn(`[WPP] ❌ Error in onWhatsApp for ${cleanPhone}:`, e.message);
          // Fallback to manual JID if onWhatsApp errors but we want to try anyway
          chatId = `${cleanPhone}@s.whatsapp.net`;
      }
    }
    
    if (mediaBase64) {
      // Baileys media send: extract mime type and buffer from data URL
      try {
        const matches = mediaBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
          const mimetype = matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          
          // Determine media type based on mimetype
          if (mimetype.startsWith('image/')) {
            await sock.sendMessage(chatId, { image: buffer, caption: message, mimetype });
          } else if (mimetype.startsWith('video/')) {
            await sock.sendMessage(chatId, { video: buffer, caption: message, mimetype });
          } else if (mimetype.startsWith('audio/')) {
            await sock.sendMessage(chatId, { audio: buffer, mimetype, ptt: false });
            // Send text separately since audio doesn't support caption
            if (message) await sock.sendMessage(chatId, { text: message });
          } else {
            // Document/file
            await sock.sendMessage(chatId, { 
              document: buffer, 
              mimetype, 
              fileName: filename || 'file',
              caption: message 
            });
          }
        } else {
          // Fallback: send as text if base64 parsing fails
          await sock.sendMessage(chatId, { text: message });
        }
      } catch (mediaErr) {
        console.error('[WPP] ❌ Erro ao enviar mídia:', mediaErr.message);
        // Fallback: try sending just the text
        await sock.sendMessage(chatId, { text: message });
      }
    } else {
      await sock.sendMessage(chatId, { text: message });
    }
    
    res.json({ ok: true, chatId });
  } catch (err) {
    console.error('[WPP] Send error:', err.message);
    
    // Categorize error
    if (err.message.includes('not a valid JID') || err.message.includes('invalid')) {
        return res.status(400).json({ 
            error: 'invalid_recipient', 
            detail: 'O número informado parece inválido ou não existe no WhatsApp.'
        });
    }
    
    res.status(500).json({ error: 'send_failed', detail: err.message });
  }
});

// Logout endpoint
app.post('/logout', async (req, res) => {
  try {
    console.log('[WPP] 🚪 Solicitando logout oficial...');
    connectionState = 'waiting-qr';
    lastQr = null;
    lastInitError = null;
    
    // Tenta logout oficial
    if (sock) {
      try {
        await sock.logout();
        console.log('[WPP] ✅ Logout oficial concluído.');
      } catch (e) {
        console.warn('[WPP] ⚠️ Erro no logout oficial:', e.message);
      }
      try { sock.end(); } catch (e) {}
      sock = null;
    }
    
    // Limpar sessão
    try { 
      if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true, force: true });
        fs.mkdirSync(authDir, { recursive: true });
        console.log('[WPP] 🗑️ Sessão local apagada.');
      }
    } catch (e) {
      console.warn('[WPP] Erro ao remover pasta de sessão:', e.message);
    }
    
    // Reset global state
    previousSessionFound = false;
    previousSessionAttempted = false;
    previousSessionFailed = false;
    previousSessionErrorStack = null;
    retryCount = 0;
    isStartingClient = false;
    
    res.json({ ok: true, message: 'Logged out successfully' });
    
    // Reinicia cliente em nova instância limpa após um curto delay
    console.log('[WPP] 🔄 Reiniciando motor para nova conta...');
    setTimeout(() => startClient(), 2000);
  } catch (e) {
    console.error('[WPP] Erro fatal no logout:', e.message);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Reconnect endpoint
app.post('/reconnect', async (req, res) => {
  try {
    console.log('[WPP] Reconexão manual solicitada...');
    if (sock) {
      try { sock.end(); } catch (e) {}
      sock = null;
    }
    retryCount = 0;
    isStartingClient = false;
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
    if (!sock || connectionState !== 'ready') return;
    
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
          let chatId = schedules[i].phone;
          if (!chatId.includes('@')) {
            chatId = `${chatId.replace(/\D/g, '')}@s.whatsapp.net`;
          }
          await sock.sendMessage(chatId, { text: schedules[i].message });
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
    if (sock) {
      try { sock.end(); } catch (e) {}
    }
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
  console.log(`\n[WPP] ✓ WPP API Server listening on port ${PORT} (Engine: Baileys — Browserless)`);
  console.log('[WPP] 📍 Endpoints:');
  console.log('  GET  /status         → Connection status');
  console.log('  POST /send           → Send message');
  console.log('  POST /logout         → Disconnect');
  console.log(`[WPP] Auth: ${X_API_KEY ? 'X-API-KEY required' : 'DEV MODE'}\n`);
});
