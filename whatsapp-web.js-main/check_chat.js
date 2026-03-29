const { Client, LocalAuth } = require('./index');

const number = '5521993165605@c.us';

const client = new Client({ authStrategy: new LocalAuth(), puppeteer: { headless: true } });

client.on('ready', async () => {
  console.log('Client ready — buscando chat para', number);
  try {
    const chat = await client.getChatById(number).catch(() => null);
    if (!chat) {
      console.log('Chat não encontrado para', number);
    } else {
      console.log('Chat encontrado:', chat.id._serialized, 'nome:', chat.name || chat.formattedTitle);
      const msgs = await chat.fetchMessages({ limit: 10 }).catch(() => []);
      console.log('Últimas mensagens do chat:', msgs.map(m => ({ id: m.id?._serialized, from: m.from, body: m.body, timestamp: m.timestamp }))); 
    }
  } catch (e) {
    console.error('Erro ao buscar chat:', e);
  } finally {
    await client.destroy();
    process.exit(0);
  }
});

client.initialize();
