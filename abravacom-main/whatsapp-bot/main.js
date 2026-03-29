c:\Users\marke\AppData\Local\Packages\5319275A.WhatsAppDesktop_cv1g1gvanyjgm\LocalState\sessions\68D82E0B5EA40ED75C515BF18B5ECC52668E5034\transfers\2026-12\WhatsApp Image 2026-03-23 at 15.11.59.jpegconst { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { initializeApp } = require('firebase/app');
const { initializeFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');
const path = require('path');
const fs = require('fs');

// Verifica caminhos padrões de navegadores no Windows (já que o pkg não inclui o Chromium de 200MB)
const chromePaths = [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe"
];
const localBrowserPath = chromePaths.find(p => fs.existsSync(p)) || "";

// Carrega o .env da raiz do projeto principal usando path absoluto (à prova de falhas)
let envPath = path.resolve(process.pkg ? path.dirname(process.execPath) : __dirname, '.env');
if (!fs.existsSync(envPath)) {
    envPath = path.resolve(process.pkg ? path.dirname(process.execPath) : __dirname, '../.env');
}
require('dotenv').config({ path: envPath });

console.log('Verificando chaves de ambiente...');
console.log('-> Firebase Project ID:', process.env.VITE_FIREBASE_PROJECT_ID || '(hardcoded: finance8-96cb0)');

// Impede que o terminal feche imediatamente ao dar erro
process.on('uncaughtException', (err) => {
    console.error('\n❌ ERRO FATAL: O programa encontrou um erro e não pode continuar.\n');
    console.error(err);
    console.log('\n⏳ Fechando em 60 segundos para você ler o erro acima...');
    setTimeout(() => process.exit(1), 60000);
});
process.on('unhandledRejection', async (reason, promise) => {
    if (reason && reason.message && reason.message.includes('Execution context was destroyed')) {
        console.log('\n⚠️ WhatsApp Web recarregou o portal de forma violenta durante a sincronização inicial.');
        console.log('🔄 Não se preocupe: a sua sessão (QR Code) JÁ FOI SALVA com sucesso!');
        console.log('🔄 O robô está reiniciando a conexão internamente em 5 segundos para pular a tela de sincronização...\n');
        try {
            await client.destroy();
        } catch(e) {}
        setTimeout(() => {
            console.log('Tentando conectar novamente...');
            client.initialize();
        }, 5000);
        return; // Bloqueia o fechamento do aplicativo
    }
    console.error('\n❌ ERRO FATAL: Promessa rejeitada inesperadamente.\n');
    console.error(reason);
    console.log('\n⏳ Fechando em 60 segundos para você ler o erro acima...');
    setTimeout(() => process.exit(1), 60000);
});

// Firebase Configuration (hardcoded para funcionar em qualquer máquina)
const firebaseConfig = {
  apiKey: "AIzaSyAjsurNMA4OxzpuZ8EfXvAmXGN-TqkT9H8",
  authDomain: "finance8-96cb0.firebaseapp.com",
  projectId: "finance8-96cb0",
  storageBucket: "finance8-96cb0.firebasestorage.app",
  messagingSenderId: "589745239376",
  appId: "1:589745239376:web:efd94d2a73e42506aa2855"
};

const app = initializeApp(firebaseConfig);

// FORÇA HTTP Long Polling ao invés de GRPC (corrige o bug do Node 24)
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
});

// WhatsApp Client Initialization
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: path.join(process.pkg ? path.dirname(process.execPath) : __dirname, '.wwebjs_auth')
    }), // Saves session locally exactly where the .exe is
    puppeteer: {
        executablePath: localBrowserPath, // OBRIGATÓRIO PARA O .EXE NO PC DA ELIS FUNCIONAR!
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--js-flags=--expose-gc'
        ],
        headless: false
    }
});

client.on('qr', (qr) => {
    console.log('\n\n--- ESCANEIE ESTE QR CODE COM O WHATSAPP DA AGÊNCIA ---\n');
    qrcode.generate(qr, { small: true });
    
    // Dispara via socket para renderizar na interface web
    if (global.io) {
        global.io.emit('qr_code', qr);
    }
});

client.on('ready', () => {
    console.log('\n✅ Tudo certo! O Robô do WhatsApp está conectado!');
    console.log('📡 Escutando novos leads do site em tempo real...\n');
    console.log('Mantenha esta janela aberta para o robô continuar funcionando.');
    
    // Dispara pro painel 
    if (global.io && client.info && client.info.wid) {
        global.io.emit('whatsapp_ready', client.info.wid.user);
    }
    
    // Avisa que o bot ficou online (Assíncrono para não travar o fluxo)
    const agencyNumber = process.env.AGENCY_WHATSAPP_NUMBER || "5521993165605";
    const cleanNumber = agencyNumber.replace(/\D/g, '');
    
    client.getNumberId(cleanNumber).then(numberId => {
        const formatted = numberId ? numberId._serialized : `${cleanNumber}@c.us`;
        const startupMessage = 
            `🤖 *ROBÔ ABRAVACOM — SISTEMA ONLINE*\n\n` +
            `Olá, *Elis Martins*! 👋\n\n` +
            `Sou o assistente virtual da *abravacom.com.br* e acabei de ser ativado com sucesso.\n\n` +
            `📡 *O que estou fazendo agora:*\n` +
            `• Monitorando o site em tempo real à procura de novos leads\n` +
            `• Cada simulação ou contato preenchido no portal será notificado aqui instantaneamente\n\n` +
            `💬 *O que posso fazer por você:*\n` +
            `• Avisar sobre cada novo lead assim que ele chegar\n` +
            `• Ajudar no envio e geração de mensagens personalizadas\n` +
            `• Manter você informada 24h por dia enquanto eu estiver ativo\n\n` +
            `🟢 _Estou online e operando. Pode deixar esta conversa aberta que eu cuido do resto!_`;
            
        return client.sendMessage(formatted, startupMessage);
    })
    .then(() => console.log(`📱 [Sucesso] Mensagem de ativação enviada para ${agencyNumber}`))
    .catch(e => console.log(`⚠️ [Aviso] Falha ao mandar mensagem: ${e ? e.message || e : 'Desconhecido'}`));

    // Desabilita o aviso chato do GRPC no terminal forçando alertas apenas para ERRO
    console.warn = () => {};

    // Inicia o processo de escuta via polling contínuo (A prova de falhas HTTP do Node24)
    startPollingLeads();
});

const processedLeads = new Set();
let isFirstRun = true;

async function startPollingLeads() {
    const leadsRef = collection(db, 'simulations');

    const checkNewLeads = async () => {
      c:\Users\marke\AppData\Local\Packages\5319275A.WhatsAppDesktop_cv1g1gvanyjgm\LocalState\sessions\68D82E0B5EA40ED75C515BF18B5ECC52668E5034\transfers\2026-12\WhatsApp Image 2026-03-23 at 15.11.59.jpeg  try {
            // Em vez de stream GRPC, fazemos requisições simples GET (HTTP)
            const snapshot = await getDocs(leadsRef);
            
            for (const document of snapshot.docs) {
                const data = document.data();
                const docId = document.id;

                // Ignora se já notificamos ou se é a carga inicial
                if (data.whatsappNotified === true || processedLeads.has(docId)) {
                    continue;
                }

                // Marca localmente para não repetir
                processedLeads.add(docId);

                // Na primeira carga, apenas memorizamos os antigos para não flodar o WhatsApp
                if (!isFirstRun) {
                    await sendWhatsAppAlert(data, docId);
                }
            }
            
            isFirstRun = false;
        } catch (error) {
            console.log("Erro ao buscar leads:", error.message);
        }
    };

    // Roda agora mesmo e depois a cada 15 segundos
    await checkNewLeads();
    setInterval(checkNewLeads, 15000);
}

async function sendWhatsAppAlert(lead, docId) {
    try {
        // The agency number to receive alerts (or the user's phone if configured differently)
        // If they want to message the lead directly, we would use lead.phone instead.
        // Assuming we notify the AGENCY about the lead:
        const agencyNumber = process.env.AGENCY_WHATSAPP_NUMBER || "5521993165605"; 
        if (!agencyNumber) {
            console.error("❌ Erro: O número da agência (AGENCY_WHATSAPP_NUMBER) não foi configurado no arquivo .env");
            return;
        }
        const cleanNumber = agencyNumber.replace(/\D/g, '');
        
        // Verifica se o número existe e pega o ID formatado corretamente (importante para números BR com 9º dígito)
        const numberId = await client.getNumberId(cleanNumber);
        const formattedNumber = numberId ? numberId._serialized : `${cleanNumber}@c.us`;

        const message = `*🔔 NOVO LEAD GERADO (FINANCE8)!*\n\n` +
                        `*Nome:* ${lead.userName || lead.name || 'N/A'}\n` +
                        `*WhatsApp:* ${lead.userPhone || lead.phone || 'N/A'}\n` +
                        `*E-mail:* ${lead.userEmail || lead.email || 'N/A'}\n` +
                        `*Origem:* ${lead.source || 'Portal/Simulador'}\n` +
                        `*Data:* ${lead.date || new Date().toLocaleString('pt-BR')}\n\n` +
                        `Para ver os detalhes da simulação na íntegra, acesse o CRM!`;

        await client.sendMessage(formattedNumber, message);
        console.log(`\n📨 Alerta enviado com sucesso para a agência sobre o lead: ${lead.name || lead.email}`);

        // OPTIONAL: mark as notified in Firebase to avoid duplicated alerts in the future
        try {
            const docRef = doc(db, 'simulations', docId);
            await updateDoc(docRef, { whatsappNotified: true });
        } catch (updateErr) {
            console.warn("Aviso: Lead alertado mas falha ao marcar no Firebase.");
        }

    } catch (error) {
        console.error("Erro ao enviar a mensagem de alerta:", error ? error.message || String(error) : "Erro Desconhecido");
    }
}

console.log("Iniciando o WhatsApp Web... Aguarde.");

// Catch auth failures or disconnects to surface in the UI if it crashes
client.on('auth_failure', msg => {
    console.error('FALHA DE AUTENTICAÇÃO:', msg);
});

client.on('disconnected', (reason) => {
    console.error('CLIENTE DESCONECTADO (Whatsapp Fechou):', reason);
});

client.initialize().catch(err => {
    console.error('ERRO CRÍTICO AO INICIALIZAR NAVEGADOR:', err.message);
});
