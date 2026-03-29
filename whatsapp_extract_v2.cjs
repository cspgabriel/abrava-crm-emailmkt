const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

(async () => {
    const userDataDir = path.join(__dirname, '.whatsapp_profile');
    const possiblePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
    ];
    let executablePath = possiblePaths.find(p => fs.existsSync(p));

    // Abriremos o navegador e ele voltará automaticamente para a conversa focada pela sessão
    const browser = await puppeteer.launch({ executablePath, headless: false, userDataDir, args: ['--start-maximized'] });
    const page = (await browser.pages())[0] || await browser.newPage();
    await page.goto('https://web.whatsapp.com/', { waitUntil: 'domcontentloaded' });

    console.log("[AÇÃO] Aguardando a interface inicializar...");
    await new Promise(r => setTimeout(r, 15000)); 
    
    // Backup completo do dom para caso o scraper falhe e a IA queira debugar
    const html = await page.evaluate(() => document.body.innerHTML);
    fs.writeFileSync('zap_dom.html', html);
    
    console.log("[INFO] Extraindo dados da tela atuamente visível...");
    const mensagens = await page.evaluate(async () => {
        // WhatsApp rows (funciona bem em versões mais recentes)
        const nodos = Array.from(document.querySelectorAll('div[role="row"]')).slice(-40);
        const resultados = [];
        
        for (const nodo of nodos) {
            const innerTextCompleto = nodo.innerText.trim();
            if (!innerTextCompleto) continue; // pula vazios

            const enviadaPorMim = nodo.innerHTML.includes('message-out') || nodo.innerHTML.includes('data-id="true');
            const remetente = enviadaPorMim ? 'Eu' : 'Elis';

            // Captura de texto
            const textoNode = nodo.querySelector('span.selectable-text');
            const texto = textoNode ? textoNode.innerText : innerTextCompleto;
            
            // Captura de audio
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
            
            // Captura de imagem
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
            
            resultados.push({
                remetente,
                texto: texto || '',
                temAudio: !!audioNode,
                audioB64,
                temImagem: !!imgNode,
                imgB64
            });
        }
        return resultados;
    });

    const mediaDir = path.join(__dirname, 'cliente_media');
    if (!fs.existsSync(mediaDir)) fs.mkdirSync(mediaDir);

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
            texto: m.texto,
            temAudio: m.temAudio,
            audioPath,
            temImagem: m.temImagem,
            imgPath
        };
    });

    fs.writeFileSync('elis_solicitacoes.json', JSON.stringify(finalJson, null, 2));
    console.log("FINALIZADO_COM_SUCESSO");
    await browser.close();
})();
