const { Client, LocalAuth } = require('./index');

const rawNumber = '5521993165605';
const text = `Teste ABRAVACOM ${new Date().toISOString()}`;

console.log('Iniciando envio one-shot para', rawNumber);

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true }
});

client.on('auth_failure', (msg) => {
  console.error('AUTH_FAILURE:', msg);
  process.exit(1);
});

client.on('qr', () => {
  console.log('QR necessário para autenticar esta sessão.');
});

client.on('authenticated', () => {
  console.log('AUTHENTICATED');
});

client.on('loading_screen', (percent, message) => {
  console.log('LOADING', percent, message);
});

client.on('disconnected', (reason) => {
  console.log('DISCONNECTED', reason);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED_REJECTION', err);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT_EXCEPTION', err);
});

client.on('ready', async () => {
  try {
    const registered = await client.isRegisteredUser(rawNumber);
    console.log('isRegisteredUser:', registered);
    if (!registered) {
      console.error('Numero nao registrado no WhatsApp:', rawNumber);
      await client.destroy();
      process.exit(2);
    }

    const wid = await client.getNumberId(rawNumber);
    const chatId = wid?._serialized || `${rawNumber}@c.us`;
    console.log('chatId usado:', chatId);

    const sent = await client.sendMessage(chatId, text, { waitUntilMsgSent: true });
    console.log('SENT_ID:', sent?.id?._serialized || '(sem id)');
    console.log('SENT_ACK:', sent?.ack);
    console.log('SENT_BODY:', sent?.body || text);

    await new Promise((r) => setTimeout(r, 1500));
    await client.destroy();
    process.exit(0);
  } catch (err) {
    console.error('SEND_ERROR:', err && err.stack ? err.stack : err);
    try { await client.destroy(); } catch (_) {}
    process.exit(1);
  }
});

client.initialize();

