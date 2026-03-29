const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

(async () => {
    const userDataDir = path.join(__dirname, '.whatsapp_profile');

    console.log(`[INFO] Iniciando Chrome em perfil local para extrair mídia...`);
    
    const possiblePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
    ];
    
    let executablePath = '';
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            executablePath = p;
            break;
        }
    }

    if (!executablePath) {
        console.error("[ERRO] Chrome não encontrado.");
        process.exit(1);
    }

    const browser = await puppeteer.launch({
        executablePath,
        headless: false,
        userDataDir,
        defaultViewport: null,
        args: ['--start-maximized']
    });

    const page = (await browser.pages())[0] || await browser.newPage();
    await page.goto('https://web.whatsapp.com/', { waitUntil: 'domcontentloaded' });

    console.log("\n[AÇÃO] Aguardando o carregamento do WhatsApp Web.");
    console.log("=> POR FAVOR: Se precisar, escaneie o QR Code.");

    try {
        await page.waitForSelector('#pane-side', { timeout: 180000 });
        console.log("\n[OK] WhatsApp Web logado com sucesso!");
    } catch (e) {
        console.error("\n[ERRO] Timeout no QR Code.");
        await browser.close();
        process.exit(1);
    }

    await new Promise(r => setTimeout(r, 6000));

    console.log("[INFO] Buscando a conversa 'Elis Martins'...");
    
    const searchBoxSelect = 'div[contenteditable="true"][data-tab="3"]';
    try {
        await page.waitForSelector(searchBoxSelect, { timeout: 10000 });
        await page.click(searchBoxSelect);
        await page.keyboard.type('Elis Martins');
        
        await new Promise(r => setTimeout(r, 2000));
        await page.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 4000));
        
        console.log("[OK] Conversa aberta!");
    } catch (e) {
        console.log("[AVISO] Clique na conversa da Elis manualmente.");
        await new Promise(r => setTimeout(r, 5000));
    }

    console.log("[INFO] Extraindo as mensagens COM ÁUDIO E IMAGEM... aguarde!\n");

    const mensagens = await page.evaluate(async () => {
        const nodos = Array.from(document.querySelectorAll('div.message-in, div.message-out')).slice(-30);
        const resultados = [];
        for (const nodo of nodos) {
            const enviadaPorMim = nodo.classList.contains('message-out');
            const remetente = enviadaPorMim ? 'Eu' : 'Elis';

            const textoNode = nodo.querySelector('span.selectable-text.copyable-text');
            const texto = textoNode ? textoNode.innerText : '';
            
            let audioB64 = null;
            const audioNode = nodo.querySelector('audio');
            if (audioNode && audioNode.src && audioNode.src.startsWith('blob:')) {
                try {
                    const res = await fetch(audioNode.src);
                    const blob = await res.blob();
                    audioB64 = await new Promise(resolve => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                } catch(e) {}
            }
            
            let imgB64 = null;
            const imgNode = nodo.querySelector('img[src^="blob:"]');
            if (imgNode) {
                try {
                    const res = await fetch(imgNode.src);
                    const blob = await res.blob();
                    imgB64 = await new Promise(resolve => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                } catch (e) {}
            }
            
            const metaNode = nodo.querySelector('[data-pre-plain-text]');
            const infoData = metaNode ? metaNode.getAttribute('data-pre-plain-text') : '';
            
            if (texto || audioB64 || imgB64) {
                resultados.push({
                    remetente,
                    info: infoData ? infoData.trim() : '',
                    texto,
                    audioB64,
                    imgB64
                });
            }
        }
        return resultados;
    });

    const mediaDir = path.join(__dirname, 'cliente_media');
    if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir);
    }

    let audioCount = 0;
    let imgCount = 0;

    const finalJson = mensagens.map(m => {
        let audioPath = null;
        let imgPath = null;
        if (m.audioB64) {
            audioCount++;
            audioPath = path.join(mediaDir, `audio_${audioCount}.ogg`);
            const base64Data = m.audioB64.split(',')[1];
            fs.writeFileSync(audioPath, Buffer.from(base64Data, 'base64'));
        }
        if (m.imgB64) {
            imgCount++;
            const ext = m.imgB64.includes('image/png') ? 'png' : 'jpg';
            imgPath = path.join(mediaDir, `imagem_${imgCount}.${ext}`);
            const base64Data = m.imgB64.split(',')[1];
            fs.writeFileSync(imgPath, Buffer.from(base64Data, 'base64'));
        }
        return {
            remetente: m.remetente,
            info: m.info,
            texto: m.texto,
            audioPath,
            imgPath
        };
    });

    fs.writeFileSync('elis_solicitacoes.json', JSON.stringify(finalJson, null, 2));
    
    console.log(`\n[OK] As mensagens, áudios e imagens foram salvas na pasta 'cliente_media' e em 'elis_solicitacoes.json'.`);
    console.log("Pode avisar lá na IA que o processo concluiu!");
    
    rl.close();
})();
