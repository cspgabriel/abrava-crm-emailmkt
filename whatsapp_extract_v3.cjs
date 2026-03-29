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

    console.log('1. Iniciando o Chrome...');
    const browser = await puppeteer.launch({ executablePath, headless: false, userDataDir, args: ['--start-maximized'] });
    const page = (await browser.pages())[0] || await browser.newPage();
    await page.goto('https://web.whatsapp.com/', { waitUntil: 'domcontentloaded' });

    console.log('2. Aguardando o WhatsApp carregar...');
    await page.waitForSelector('#pane-side', { timeout: 60000 });
    
    console.log('3. Pesquisando por "Elis Martins"...');
    await new Promise(r => setTimeout(r, 2000));
    await page.click('div[contenteditable="true"][data-tab="3"]');
    await page.keyboard.type('Elis Martins');
    await new Promise(r => setTimeout(r, 2000));
    await page.keyboard.press('Enter');
    
    console.log('4. Aguardando a conversa abrir e carregar as mídias...');
    await new Promise(r => setTimeout(r, 6000));

    console.log('5. Extraindo mensagens (Textos, Imagens e Áudios)...');
    
    const mensagens = await page.evaluate(async () => {
        const rows = Array.from(document.querySelectorAll('div[role="row"]')).slice(-40);
        const resultados = [];
        
        for (const row of rows) {
            const isSentByMe = row.innerHTML.includes('message-out') || row.innerHTML.includes('data-id="true');
            const texto = row.innerText.trim();
            if (!texto && !row.innerHTML.includes('<img') && !row.innerHTML.includes('<audio')) continue;

            let audioB64 = null;
            const audioNode = row.querySelector('audio');
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
            const imgNode = row.querySelector('img[src^="blob:"]');
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
                remetente: isSentByMe ? 'Eu' : 'Elis',
                texto,
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
            audioPath,
            imgPath
        };
    });

    fs.writeFileSync('elis_solicitacoes.json', JSON.stringify(finalJson, null, 2));
    console.log('--- CONCLUSÃO ---');
    console.log(`Extraídas ${finalJson.length} mensagens com sucesso!`);
    await browser.close();
})();
