const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Servir arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Salvar a instância na variável global para o console.log acessar a partir de qualquer arquivo
global.io = io;

// === SEQUESTRO DO CONSOLE (INTERCEPTADOR) ===
// Isso captura todos os logs do terminal do bot.js/main.js e manda pra tela web em tempo real!
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

const formatTime = () => new Date().toLocaleTimeString('pt-BR');

console.log = function(...args) {
    originalLog.apply(console, args);
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    if(global.io) global.io.emit('log', `<span class="text-blue-400">[${formatTime()}] [SISTEMA]</span> ${msg}`);
};

console.error = function(...args) {
    originalError.apply(console, args);
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    if(global.io) global.io.emit('log', `<span class="text-red-400">[${formatTime()}] [ERRO]</span> <span class="text-red-300">${msg}</span>`);
};

console.warn = function(...args) {
    originalWarn.apply(console, args);
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    if(global.io) global.io.emit('log', `<span class="text-yellow-400">[${formatTime()}] [AVISO]</span> ${msg}`);
};
// ============================================

io.on('connection', (socket) => {
    socket.emit('log', `<span class="text-green-400">[${formatTime()}] [CONECTADO]</span> Console de Agentes do ABRAVACOM Sincronizado.`);
    
    // Comando para LIGAR o bot
    socket.on('start_bot', () => {
        if(global.botRunning) {
            socket.emit('log', `<span class="text-yellow-400">[${formatTime()}] [AVISO]</span> O robô já está online!`);
            return;
        }
        
        socket.emit('log', `<span class="text-purple-400">[${formatTime()}] [AÇÃO]</span> Inicializando scripts centrais do robô...`);
        global.botRunning = true;
        
        // Chamamos o arquivo main.js original que construímos sem modificar a lógica base dele
        try {
            require('./main.js');
        } catch(e) {
            console.error("Falha ao iniciar main.js: ", e.message);
        }
    });
    
    // Comando para Desligar (Mata o processo)
    socket.on('stop_bot', () => {
        socket.emit('log', `<span class="text-red-500">[${formatTime()}] [OPERAÇÃO]</span> Desligamento forçado recebido. Fechando o executável.`);
        setTimeout(() => process.exit(0), 1500);
    });
});

const PORT = 5500;
server.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    originalLog(`[HUB] Servidor Web Inicializado na porta ${PORT}`);
    
    // Tenta abrir a interface como um Aplicativo Nativo (Chrome/Edge em modo app - sem bordas de site)
    const runChrome = `start chrome --app=${url}`;
    const runEdge = `start msedge --app=${url}`;
    
    exec(runChrome, (err) => {
        if(err) {
            exec(runEdge, (err2) => {
                if(err2) {
                    // Fallback para abrir no navegador padrao normal
                    exec(`start ${url}`);
                }
            });
        }
    });
});
