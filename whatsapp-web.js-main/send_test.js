const { Client, LocalAuth } = require('./index');

const number = '5521993165605'; // target without @c.us
const message = 'Teste: mensagem automática enviada pelo bot.';

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: false }
});

client.on('ready', async () => {
  console.log('Client ready — enviando mensagem para', number);
  try {
    const chatId = number.includes('@') ? number : `${number}@c.us`;
    const sent = await client.sendMessage(chatId, message);
    console.log('sendMessage returned:', sent);
    // wait a bit for delivery/ack to process
    await new Promise((res) => setTimeout(res, 3000));
    console.log('Verificando status da mensagem...');
    if (sent.id && sent.id._serialized) {
      try {
        const fetched = await client.getMessage(sent.id._serialized);
        console.log('Fetched message:', fetched.id?._serialized || fetched.id);
      } catch (e) {
        console.log('Não foi possível buscar a mensagem por id:', e.message || e);
      }
    }
    console.log('Se não receber a mensagem, cheque se o número está ativo no WhatsApp e se a sessão tem permissão para enviar.');
  } catch (err) {
    console.error('Falha ao enviar mensagem:', err);
  }
});

client.on('message_ack', (msg, ack) => {
  console.log('message_ack:', msg.id?._serialized, 'ack=', ack);
});

client.on('auth_failure', (msg) => {
  console.error('Falha de autenticação:', msg);
});

client.initialize();
