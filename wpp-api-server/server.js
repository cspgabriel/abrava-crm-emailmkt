require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const qrcode = require('qrcode-terminal');
const qrcodeImg = require('qrcode');

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');

const app = express();
const PORT = process.env.PORT || 8787;
const X_API_KEY = process.env.X_API_KEY || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://abravacom.com.br';
let TRUSTED_ORIGINS = (process.env.ALLOWED_ORIGINS || ALLOWED_ORIGIN)
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

// In development (no X_API_KEY), automatically trust localhost origins
if (!X_API_KEY) {
  TRUSTED_ORIGINS.push('http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173');
  TRUSTED_ORIGINS = [...new Set(TRUSTED_ORIGINS)]; // remove duplicates
}

app.use(bodyParser.json());
// Simple CORS with array of trusted origins - Express cors() handles this correctly
app.use(cors({
  origin: TRUSTED_ORIGINS,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization']
}));

// Serve CRM static build at /crm if present
const path = require('path');
const crmStaticPath = path.join(__dirname, '..', 'abravacom-main', 'crm', 'dist');
const fs = require('fs');
// LocalAuth persistence
const authDir = path.join(__dirname, '.wwebjs_auth');
if (!fs.existsSync(authDir)) fs.mkdirSync(authDir, { recursive: true });

// WhatsApp session folder name - different versions use different prefixes
const SESSION_CLIENT_ID = 'session-abravacon-wpp'; // matches whatsapp-web.js v1.20.0
const sessionPath = path.join(authDir, SESSION_CLIENT_ID);
const doesSessionExist = fs.existsSync(sessionPath) && 
  fs.readdirSync(sessionPath).length > 0;

let lastQr = null; // store latest QR as data URL for frontend retrieval
console.log('[WPP] LocalAuth directory:', authDir);
console.log('[WPP] Session path:', sessionPath);
console.log('[WPP] Previous session found:', doesSessionExist);

if (fs.existsSync(crmStaticPath)) {
  app.use('/crm', express.static(crmStaticPath));
  // For SPA routing, serve index.html for unknown /crm routes
  app.get('/crm/*', (req, res) => {
    res.sendFile(path.join(crmStaticPath, 'index.html'));
  });
}

// Basic auth middleware
app.use((req, res, next) => {
  // Public status endpoints for quick browser checks (read-only, safe to expose)
  if (req.method === 'GET' && (
    req.path === '/' || 
    req.path === '/healthz' || 
    req.path === '/status' || 
    req.path === '/qr' || 
    req.path === '/session-check'
  )) {
    return next();
  }

  const key = req.header('x-api-key') || req.query.api_key;
  const origin = (req.header('origin') || '').trim();
  if (!X_API_KEY) return next(); // if not configured, allow (developer mode)
  if (key && key === X_API_KEY) return next();

  // Fallback for browser CRM calls from trusted origins when header/query key is stripped/missing.
  if (
    origin && TRUSTED_ORIGINS.includes(origin) && (
      (req.method === 'POST' && req.path === '/send') ||
      (req.method === 'POST' && req.path === '/schedule') ||
      (req.method === 'GET' && req.path === '/schedules') ||
      (req.method === 'POST' && req.path.startsWith('/schedules'))
    )
  ) {
    console.warn(`[WPP] Auth fallback por origin confiavel: ${origin}`);
    return next();
  }

  return res.status(401).json({
    error: 'Unauthorized',
    detail: 'Invalid or missing API key',
    origin,
    trustedOrigin: origin ? TRUSTED_ORIGINS.includes(origin) : false
  });
});

// Initialize WhatsApp client with LocalAuth to persist session
const WPP_HEADLESS = (process.env.WPP_HEADLESS || 'true') === 'true';
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: authDir, clientId: SESSION_CLIENT_ID }),
  puppeteer: {
    headless: WPP_HEADLESS,
    timeout: 60000, // 60s timeout instead of default 30s
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu-compositing',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-default-apps',
      '--disable-breakpad',
      '--disable-client-side-phishing-detection',
      '--disable-component-extensions-with-background-pages',
      '--disable-component-extensions-with-default-apps',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-sync',
      '--metrics-recording-only',
      '--mute-audio',
      '--enable-automation',
      '--enable-features=NetworkService,NetworkServiceInProcess',
      // FIX: Profile error flags
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-blink-features=AutomationControlled',
      '--disable-profile-guided-optimization',
      '--no-service-autorun',
      '--no-default-browser-check',
      '--disable-client-side-phishing-detection',
      '--disable-component-update',
      '--disable-default-plugins',
      '--disable-device-discovery-notifications',
      '--disable-extensions-file-access-check',
      '--disable-extensions-http-throttling',
      '--disable-infobars',
      '--disable-installation-detection',
      '--disable-preconnect',
      '--disable-translate',
      '--disable-watchdog',
      '--no-pings',
      '--no-suggestions-ui'
    ],
  },
  restartOnAuthFail: true,
  qrMaxRetries: 5,
  takeoverOnConflict: true
});

let isStartingClient = false;
let reconnectTimer = null;
let lastInitError = null; // Track last error for better debugging

function scheduleReconnect(reason) {
  if (reconnectTimer) {
    console.log('[WPP] ⏭️  Reconnect ja agendado, ignorando evento duplicado.');
    return;
  }
  console.warn(`[WPP] ⚠️  Reconexao agendada em 5s. Motivo: ${reason || 'desconhecido'}`);
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    await startClient();
  }, 5000);
}

client.on('qr', async (qr) => {
  console.log('[WPP] 📸 QR CODE RECEBIDO');
  console.log('[WPP]    ✨ Sessão ainda não autenticada');
  console.log('[WPP]    👉 Escaneie o QR code com seu WhatsApp para autenticar');
  try {
    const dataUrl = await qrcodeImg.toDataURL(qr);
    lastQr = dataUrl;
  } catch (e) {
    console.error('[WPP] Erro ao gerar dataURL do QR:', e);
  }
  qrcode.generate(qr, { small: true });
});

// endpoint to fetch current QR as data URL
app.get('/qr', (req, res) => {
  if (!lastQr) return res.status(404).json({ ok: false, msg: 'No QR available' });
  res.json({ ok: true, qr: lastQr });
});

client.on('ready', () => {
  const phone = client.info?.wid?.user || 'desconhecido';
  const pushname = client.info?.pushname || 'sem-nome';
  console.log('\n' + '═'.repeat(70));
  console.log('🎉 ✅ WHATSAPP CONECTADO COM SUCESSO!');
  console.log('═'.repeat(70));
  console.log(`📱 NÚMERO DA CONTA: ${phone}`);
  console.log(`👤 NOME DA CONTA:   ${pushname}`);
  console.log(`🔄 TIPO DE SESSÃO:  ${doesSessionExist ? '✅ RESTAURADA (Sem QR necessário!)' : '⚠️  PRIMEIRA VEZ (QR foi escaneado)'}`);
  console.log('═'.repeat(70) + '\n');
  lastInitError = null;
});

client.on('authenticated', () => {
  console.log('[WPP] 🔐 Sessão authenticada! QR será limpo.');
  lastQr = null;
});

client.on('auth_failure', (msg) => {
  console.error('[WPP] ❌ FALHA DE AUTENTICAÇÃO!');
  console.error(`[WPP]    Motivo: ${msg}`);
  lastInitError = `auth_failure: ${msg}`;
  scheduleReconnect('auth_failure');
});

client.on('disconnected', (reason) => {
  console.warn('[WPP] 🔌 DESCONECTADO!');
  console.warn(`[WPP]    Motivo: ${reason}`);
  lastInitError = `disconnected: ${reason}`;
  scheduleReconnect(String(reason || 'disconnected'));
});

client.on('qr', async (qr) => {
  console.log('[WPP] 📸 QR CODE RECEBIDO');
  console.log('[WPP]    ✨ Sessão ainda não autenticada');
  console.log('[WPP]    👉 Escaneie o QR code com seu WhatsApp para autenticar');
  try {
    const dataUrl = await qrcodeImg.toDataURL(qr);
    lastQr = dataUrl;
  } catch (e) {
    console.error('[WPP] Erro ao gerar dataURL do QR:', e);
  }
  qrcode.generate(qr, { small: true });
});

// endpoint to fetch current QR as data URL
app.get('/qr', (req, res) => {
  if (!lastQr) return res.status(404).json({ ok: false, msg: 'No QR available' });
  res.json({ ok: true, qr: lastQr });
});

client.on('ready', () => {
  const phone = client.info?.wid?.user || 'desconhecido';
  const pushname = client.info?.pushname || 'sem-nome';
  console.log('\n' + '═'.repeat(70));
  console.log('🎉 ✅ WHATSAPP CONECTADO COM SUCESSO!');
  console.log('═'.repeat(70));
  console.log(`📱 NÚMERO DA CONTA: ${phone}`);
  console.log(`👤 NOME DA CONTA:   ${pushname}`);
  console.log(`🔄 TIPO DE SESSÃO:  ${doesSessionExist ? '✅ RESTAURADA (Sem QR necessário!)' : '⚠️  PRIMEIRA VEZ (QR foi escaneado)'}`);
  console.log('═'.repeat(70) + '\n');
  lastInitError = null;
});

client.on('authenticated', () => {
  console.log('[WPP] 🔐 Sessão authenticada! QR será limpo.');
  lastQr = null;
});

client.on('auth_failure', (msg) => {
  console.error('[WPP] ❌ FALHA DE AUTENTICAÇÃO!');
  console.error(`[WPP]    Motivo: ${msg}`);
  lastInitError = `auth_failure: ${msg}`;
  scheduleReconnect('auth_failure');
});

client.on('disconnected', (reason) => {
  console.warn('[WPP] 🔌 DESCONECTADO!');
  console.warn(`[WPP]    Motivo: ${reason}`);
  lastInitError = `disconnected: ${reason}`;
  scheduleReconnect(String(reason || 'disconnected'));
});

// Captura global para evitar crash por unhandled rejection do whatsapp-web.js
process.on('unhandledRejection', (reason) => {
  console.error('UnhandledRejection capturada (não fatal):', reason?.message || reason);
});

async function forceKillBrowser() {
  try {
    if (client.pupBrowser) {
      console.log('[WPP] Forçando fechamento do navegador...');
      await Promise.race([
        client.pupBrowser.close(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000))
      ]).catch(() => {});
      client.pupBrowser = null;
    }
    if (client.pupPage) client.pupPage = null;
    if (client.pupBrowser && client.pupBrowser.process?.()) {
      try {
        client.pupBrowser.process?.().kill('SIGKILL');
      } catch (e) {}
    }
  } catch (ex) {
    console.warn('[WPP] Erro na destruição forçada:', ex?.message || ex);
  }
}

async function startClient() {
  if (isStartingClient) {
    console.log('[WPP] 🔄 Inicializacao ja em andamento; aguardando tentativa atual.');
    return;
  }
  isStartingClient = true;
  lastInitError = null;
  let attempt = 0;
  const MAX_ATTEMPTS = 8;
  
  // Se há sessão anterior, tenta sem QR primeiro (reconexão rápida)
  if (doesSessionExist && !lastQr) {
    console.log('[WPP] 🔄 SESSÃO ANTERIOR DETECTADA - Tentando reconectar sem QR...');
    console.log(`[WPP]    📂 Caminho: ${sessionPath}`);
  } else if (!doesSessionExist) {
    console.log('[WPP] 🆕 Nenhuma sessão anterior encontrada - será necessário novo QR');
  }
  
  try {
    while (attempt < MAX_ATTEMPTS) {
      attempt++;
      try {
        console.log(`[WPP] ⏳ Tentativa ${attempt}/${MAX_ATTEMPTS} de inicialização...`);
        if (doesSessionExist && attempt === 1) {
          console.log('[WPP]    ↳ 🚀 Restaurando sessão persistente...');
        } else if (attempt > 1) {
          console.log(`[WPP]    ↳ Aguardando... (pode levar até 60s na primeira vez)`);
        }
        await client.initialize();
        console.log('[WPP] ✅ Cliente inicializado com sucesso!');
        lastInitError = null;
        break;
      } catch (err) {
        const errMsg = err?.message || String(err);
        lastInitError = errMsg; // Store for status endpoint
        
        console.error(`[WPP] ❌ Falha na tentativa ${attempt}/${MAX_ATTEMPTS}:`);
        console.error(`[WPP]    Erro: ${errMsg}`);
        
        // Identifica o tipo de erro para melhor tratamento
        if (errMsg.includes('Execution context was destroyed')) {
          console.log('[WPP]    📋 Tipo: Erro de navegação (página foi recarregada)');
        } else if (errMsg.includes('timeout') || errMsg.includes('Timed out')) {
          console.log('[WPP]    📋 Tipo: Timeout (WhatsApp Web carregando lentamente)');
        } else if (errMsg.includes('already running')) {
          console.log('[WPP]    📋 Tipo: Instância anterior rodando (limpeza agressiva)');
          await forceKillBrowser();
          await new Promise(r => setTimeout(r, 500));
        } else if (errMsg.includes('auth')) {
          console.log('[WPP]    📋 Tipo: Erro de autenticação');
        }
        
        // Força reset completo do estado do navegador
        await forceKillBrowser();
        
        if (attempt < MAX_ATTEMPTS) {
          const delayMs = Math.min(6000, 1000 * attempt); // exponential backoff: 1s, 2s, 3s, etc (max 6s)
          console.log(`[WPP]    ⏸️  Aguardando ${delayMs / 1000}s antes de tentar novamente...`);
          await new Promise(r => setTimeout(r, delayMs));
        } else {
          console.error('[WPP] 🛑 MÁXIMO DE TENTATIVAS ATINGIDO!');
          console.error('[WPP]    Verifique:');
          console.error('[WPP]    1. Sua conexão de internet');
          console.error('[WPP]    2. Banco de dados de sessão: ' + sessionPath);
          console.error('[WPP]    3. Se necessário, execute: npm run session:clear');
        }
      }
    }
  } finally {
    isStartingClient = false;
  }
}

startClient().catch(e => console.error('Erro fatal startClient:', e));

async function shutdown(signal) {
  console.log(`[WPP] Recebido ${signal}. Encerrando cliente com seguranca...`);
  try {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    // Força fechamento/limpeza do navegador primeiro
    await forceKillBrowser();
    console.log('[WPP] Navegador fechado. Destruindo cliente...');
    
    // Tenta destruir cliente com timeout
    await Promise.race([
      client.destroy().catch(e => console.warn('[WPP] Erro ao destruir cliente:', e?.message || e)),
      new Promise((_, reject) => setTimeout(() => reject(new Error('destroy_timeout')), 5000))
    ]).catch(() => {
      console.warn('[WPP] Timeout ao destruir cliente. Forçando saída...');
    });
  } catch (e) {
    console.warn('[WPP] Erro durante shutdown:', e?.message || e);
  } finally {
    console.log('[WPP] Encerrando processo...');
    process.exit(0);
  }
}

// Aggressive cleanup on shutdown - don't let Puppeteer keep the process alive
process.on('SIGINT', async () => {
  console.log('[WPP] SIGINT recebido. Iniciando encerramento forcado...');
  await shutdown('SIGINT');
  setTimeout(() => {
    console.error('[WPP] Processo nao encerrou em tempo. Forcando saida...');
    process.exit(1);
  }, 8000);
});

process.on('SIGTERM', async () => {
  console.log('[WPP] SIGTERM recebido. Iniciando encerramento forcado...');
  await shutdown('SIGTERM');
  setTimeout(() => {
    console.error('[WPP] Processo nao encerrou em tempo. Forcando saida...');
    process.exit(1);
  }, 8000);
});

app.get('/', (req, res) => res.json({ ok: true, message: 'WPP API Server', auth: 'required on /send' }));
app.get('/healthz', (req, res) => res.json({ ok: true, service: 'wpp-api-server' }));
app.get('/send', (req, res) => {
  res.status(200).json({
    ok: false,
    error: 'method_not_allowed',
    message: 'Use POST /send with JSON body: { phone, message, name? }'
  });
});

// report current session status to avoid unnecessary QR prompts
app.get('/status', (req, res) => {
  try {
    const ready = !!(client && client.info && client.info.wid);
    const info = client && client.info ? {
      phone: client.info.wid?.user || null,
      accountName: client.info.pushname || null
    } : null;
    
    // Check if session files actually exist in disk
    const sessionDirExists = fs.existsSync(sessionPath);
    const sessionFilesExist = sessionDirExists && fs.readdirSync(sessionPath).length > 0;
    
    res.json({ 
      ok: true, 
      ready, 
      phone: info?.phone || null,
      accountName: info?.accountName || null,
      status: ready ? 'connected' : 'disconnected',
      statusMessage: ready 
        ? `✅ Conectado em ${info?.phone} (${info?.accountName})`
        : isStartingClient 
          ? '⏳ Inicializando...'
          : sessionFilesExist
            ? '🔄 Restaurando sessão persistente...'
            : '📸 Aguardando escaneamento de QR...',
      sessionPersisted: sessionFilesExist,  // Accurate session check from disk
      sessionDirectory: sessionDirExists,
      initializing: isStartingClient,
      hasQR: !!lastQr,
      lastError: lastInitError,  // Include last error for debugging
      isScanningQR: !ready && !!lastQr,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Check if persistent session exists (useful for frontend)
app.get('/session-check', (req, res) => {
  try {
    const authPath = path.join(authDir, 'abravacon-wpp');
    const sessionExists = fs.existsSync(authPath);
    const files = sessionExists ? fs.readdirSync(authPath) : [];
    res.json({ 
      ok: true, 
      sessionExists, 
      sessionPath: authPath,
      fileCount: files.length,
      initializing: isStartingClient
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/send', async (req, res) => {
  try {
    const { phone, message, mediaBase64, filename } = req.body;
    if (!phone || !message) return res.status(400).json({ error: 'phone and message required' });

    // Ensure client is ready before sending
    if (!client || !client.info || !client.info.wid) {
      return res.status(503).json({ error: 'whatsapp_not_ready', detail: 'WhatsApp session not initialized or disconnected' });
    }

    const chatId = phone.includes('@c.us') ? phone : `${phone}@c.us`;

    if (mediaBase64) {
      const media = MessageMedia.fromDataURL(mediaBase64);
      await client.sendMessage(chatId, media, { caption: message });
    } else {
      await client.sendMessage(chatId, message);
    }

    return res.json({ ok: true, chatId });
  } catch (err) {
    console.error('Send error', err.message);
    // Better error categorization
    if (err.message && err.message.includes('Cannot read properties')) {
      console.error('[WPP] Client state corrupted - attempting reconnect');
      return res.status(503).json({ error: 'client_corrupted', detail: 'WhatsApp client disconnected. Attempting automatic recovery...' });
    }
    return res.status(500).json({ error: 'send_failed', detail: err.message || 'Unknown send error' });
  }
});

// Simple scheduling support (persist to local file and background worker)
const SCHEDULES_FILE = path.join(__dirname, 'schedules.json');

function readSchedules() {
  try {
    if (!fs.existsSync(SCHEDULES_FILE)) return [];
    const raw = fs.readFileSync(SCHEDULES_FILE, 'utf8');
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('[WPP] Failed to read schedules file', e);
    return [];
  }
}

function writeSchedules(schedules) {
  try {
    fs.writeFileSync(SCHEDULES_FILE, JSON.stringify(schedules, null, 2), 'utf8');
  } catch (e) {
    console.error('[WPP] Failed to write schedules file', e);
  }
}

app.post('/schedule', (req, res) => {
  try {
    const { phone, message, name, scheduledAt } = req.body;
    if (!phone || !message || !scheduledAt) return res.status(400).json({ error: 'phone,message,scheduledAt required' });
    const schedules = readSchedules();
    const id = `sch_${Date.now()}_${Math.floor(Math.random()*9000+1000)}`;
    const entry = { id, phone, message, name: name || '', scheduledAt, createdAt: new Date().toISOString(), status: 'scheduled' };
    schedules.push(entry);
    writeSchedules(schedules);
    return res.json({ ok: true, id });
  } catch (e) {
    console.error('[WPP] schedule error', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/schedules', (req, res) => {
  try {
    const schedules = readSchedules();
    return res.json({ ok: true, schedules });
  } catch (e) {
    console.error('[WPP] schedules list error', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

app.put('/schedules/:id', (req, res) => {
  try {
    const id = req.params.id;
    const updates = req.body;
    const schedules = readSchedules();
    const idx = schedules.findIndex(s => s.id === id);
    if (idx === -1) return res.status(404).json({ ok: false, error: 'not_found' });
    schedules[idx] = { ...schedules[idx], ...updates };
    writeSchedules(schedules);
    return res.json({ ok: true, schedule: schedules[idx] });
  } catch (e) {
    console.error('[WPP] schedules update error', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

app.post('/schedules/:id/sendnow', async (req, res) => {
  try {
    const id = req.params.id;
    const schedules = readSchedules();
    const idx = schedules.findIndex(s => s.id === id);
    if (idx === -1) return res.status(404).json({ ok: false, error: 'not_found' });
    const entry = schedules[idx];
    if (!entry) return res.status(404).json({ ok: false, error: 'not_found' });
    try {
      const chatId = entry.phone.includes('@c.us') ? entry.phone : `${entry.phone}@c.us`;
      await client.sendMessage(chatId, entry.message);
      schedules[idx].status = 'sent';
      schedules[idx].sentAt = new Date().toISOString();
      writeSchedules(schedules);
      return res.json({ ok: true });
    } catch (e) {
      schedules[idx].status = 'failed';
      schedules[idx].error = String(e?.message || e);
      writeSchedules(schedules);
      return res.status(500).json({ ok: false, error: e?.message || String(e) });
    }
  } catch (e) {
    console.error('[WPP] schedules sendnow error', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

app.delete('/schedules/:id', (req, res) => {
  try {
    const id = req.params.id;
    let schedules = readSchedules();
    const before = schedules.length;
    schedules = schedules.filter(s => s.id !== id);
    writeSchedules(schedules);
    return res.json({ ok: true, removed: before - schedules.length });
  } catch (e) {
    console.error('[WPP] schedules delete error', e);
    return res.status(500).json({ ok: false, error: e.message });
  }
});

// Background worker to process scheduled messages
setInterval(async () => {
  try {
    const schedules = readSchedules();
    const now = Date.now();
    let changed = false;
    for (let i = 0; i < schedules.length; i++) {
      const s = schedules[i];
      if (s.status !== 'scheduled') continue;
      const when = new Date(s.scheduledAt).getTime();
      if (isNaN(when)) {
        schedules[i].status = 'failed';
        schedules[i].error = 'invalid_scheduledAt';
        changed = true;
        continue;
      }
      if (when <= now) {
        try {
          const chatId = s.phone.includes('@c.us') ? s.phone : `${s.phone}@c.us`;
          await client.sendMessage(chatId, s.message);
          schedules[i].status = 'sent';
          schedules[i].sentAt = new Date().toISOString();
          changed = true;
        } catch (e) {
          schedules[i].status = 'failed';
          schedules[i].error = String(e?.message || e);
          changed = true;
        }
      }
    }
    if (changed) writeSchedules(schedules);
  } catch (e) {
    console.error('[WPP] schedule worker error', e);
  }
}, 15 * 1000);

// logout endpoint to destroy session and force fresh QR on next start
app.post('/logout', async (req, res) => {
  try {
    await client.destroy();
    // remove local auth folder so next start forces re-auth
    try { fs.rmSync(authDir, { recursive: true, force: true }); } catch (e) {}
    res.json({ ok: true, message: 'Logged out and session cleared' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// reconnect endpoint for manual reconnection recovery
app.post('/reconnect', async (req, res) => {
  try {
    console.log('[WPP] Reconexao manual solicitada...');
    if (client && client.pupBrowser) {
      console.log('[WPP] Destruindo cliente existente...');
      await client.destroy().catch(e => console.warn('[WPP] Erro ao destruir:', e?.message));
    }
    res.json({ ok: true, message: 'Reiniciando cliente em background' });
    // Start reconnect after responding to avoid timeout
    setTimeout(() => startClient(), 1000);
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n[WPP] ✓ WPP API server listening on port ${PORT}`);
  console.log('[WPP] Public endpoints (no auth required):');
  console.log('  GET  /                → Health check');
  console.log('  GET  /healthz        → Health check');
  console.log('  GET  /status         → Session status (ready, phone, accountName)');
  console.log('  GET  /qr             → QR code to scan');
  console.log('  GET  /session-check  → Session persistence check');
  console.log('[WPP] Protected endpoints (require X-API-KEY or trusted origin):');
  console.log('  POST /send           → Send WhatsApp message');
  console.log('  POST /schedule       → Schedule message send');
  console.log('  GET  /schedules      → List scheduled messages');
  console.log('  POST /logout         → Disconnect WhatsApp');
  console.log(`[WPP] Trusted origins: ${TRUSTED_ORIGINS.join(', ')}`);
  console.log(`[WPP] Auth mode: ${X_API_KEY ? 'X-API-KEY required' : 'DEV MODE (localhost trusted)'}\\n`);
});
