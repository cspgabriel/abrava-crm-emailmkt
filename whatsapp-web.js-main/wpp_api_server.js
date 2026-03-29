const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('./index');

const PORT = Number(process.env.WPP_API_PORT || 8787);
const DEFAULT_MIN_DELAY = Number(process.env.WPP_MIN_DELAY_SECONDS || 15);
const DEFAULT_MAX_DELAY = Number(process.env.WPP_MAX_DELAY_SECONDS || 45);
const HEADLESS = String(process.env.WPP_HEADLESS || 'true').toLowerCase() === 'true';

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

let isReady = false;
let lastAuthAt = null;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: HEADLESS }
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomInt(min, max) {
  const low = Math.ceil(min);
  const high = Math.floor(max);
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

function normalizeBrNumber(phoneRaw) {
  const digits = String(phoneRaw || '').replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('55')) return digits;
  return `55${digits}`;
}

function buildVariation(template, name, idx) {
  const base = String(template || '').trim();
  const safeName = String(name || '').trim();

  const greetings = ['Ola', 'Oi', 'Ola, tudo bem', 'Oi, tudo bem'];
  const closings = ['Fico a disposicao.', 'Qualquer duvida, me chama.', 'Se fizer sentido, te explico em 2 min.'];
  const punct = ['.', '!', ''];

  const greeting = greetings[idx % greetings.length];
  const closing = closings[idx % closings.length];
  const p = punct[idx % punct.length];

  const withName = safeName ? `${greeting}, ${safeName}${p}` : `${greeting}${p}`;
  const messageBody = base.replace(/\{\{\s*nome\s*\}\}/gi, safeName || '');
  return `${withName}\n\n${messageBody}\n\n${closing}`.trim();
}

async function sendSingle(phoneRaw, message, name, idx) {
  const normalized = normalizeBrNumber(phoneRaw);
  if (!normalized) {
    return { ok: false, phone: String(phoneRaw || ''), error: 'Numero invalido' };
  }

  const isRegistered = await client.isRegisteredUser(normalized).catch(() => false);
  if (!isRegistered) {
    return { ok: false, phone: normalized, error: 'Numero nao registrado no WhatsApp' };
  }

  const numberId = await client.getNumberId(normalized).catch(() => null);
  const chatId = numberId?._serialized || `${normalized}@c.us`;
  const variedMessage = buildVariation(message, name, idx);

  const sent = await client.sendMessage(chatId, variedMessage, { waitUntilMsgSent: true });
  return {
    ok: true,
    phone: normalized,
    chatId,
    messageId: sent?.id?._serialized || null,
    ack: sent?.ack ?? null
  };
}

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    ready: isReady,
    lastAuthAt,
    now: new Date().toISOString()
  });
});

app.post('/api/whatsapp/send', async (req, res) => {
  if (!isReady) {
    return res.status(503).json({ ok: false, error: 'WhatsApp client ainda nao esta pronto.' });
  }

  const { phone, message, name } = req.body || {};
  if (!phone || !message) {
    return res.status(400).json({ ok: false, error: 'Campos obrigatorios: phone, message' });
  }

  try {
    const result = await sendSingle(phone, message, name, 0);
    return res.status(result.ok ? 200 : 422).json(result);
  } catch (err) {
    return res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
});

app.post('/api/whatsapp/campaign', async (req, res) => {
  if (!isReady) {
    return res.status(503).json({ ok: false, error: 'WhatsApp client ainda nao esta pronto.' });
  }

  const {
    contacts = [],
    message = '',
    minDelaySeconds = DEFAULT_MIN_DELAY,
    maxDelaySeconds = DEFAULT_MAX_DELAY
  } = req.body || {};

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({ ok: false, error: 'contacts deve ser um array com pelo menos 1 item.' });
  }

  const minDelay = Math.max(0, Number(minDelaySeconds) || DEFAULT_MIN_DELAY);
  const maxDelay = Math.max(minDelay, Number(maxDelaySeconds) || DEFAULT_MAX_DELAY);

  const results = [];
  for (let i = 0; i < contacts.length; i += 1) {
    const c = contacts[i] || {};
    try {
      if (i > 0) {
        const delaySecs = randomInt(minDelay, maxDelay);
        await sleep(delaySecs * 1000);
      }

      const result = await sendSingle(c.phone, message, c.name, i);
      results.push({
        index: i + 1,
        total: contacts.length,
        name: c.name || '',
        ...result
      });
    } catch (err) {
      results.push({
        index: i + 1,
        total: contacts.length,
        name: c.name || '',
        ok: false,
        phone: String(c.phone || ''),
        error: err?.message || String(err)
      });
    }
  }

  const success = results.filter((r) => r.ok).length;
  const failed = results.length - success;

  return res.json({
    ok: true,
    summary: {
      total: results.length,
      success,
      failed,
      minDelaySeconds: minDelay,
      maxDelaySeconds: maxDelay
    },
    results
  });
});

client.on('qr', () => {
  console.log('QR necessario para autenticar a API WhatsApp. Rode o fluxo de login no ambiente local.');
});

client.on('authenticated', () => {
  lastAuthAt = new Date().toISOString();
  console.log('WhatsApp API autenticada em', lastAuthAt);
});

client.on('ready', () => {
  isReady = true;
  console.log('WhatsApp API pronta para envio.');
});

client.on('auth_failure', (msg) => {
  isReady = false;
  console.error('Falha de autenticacao da WhatsApp API:', msg);
});

client.on('disconnected', (reason) => {
  isReady = false;
  console.warn('WhatsApp API desconectada:', reason);
});

app.listen(PORT, () => {
  console.log(`WhatsApp API ouvindo em http://localhost:${PORT} (headless=${HEADLESS})`);
});

client.initialize();
