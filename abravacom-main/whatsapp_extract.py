import time
import os
import json
import base64
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

profile_path = os.path.join(os.getcwd(), '.whatsapp_profile')
options = Options()
options.add_argument(f"user-data-dir={profile_path}")

driver = webdriver.Chrome(options=options)

try:
    print("1. Abrindo WhatsApp...")
    driver.get("https://web.whatsapp.com/")
    WebDriverWait(driver, 60).until(EC.presence_of_element_located((By.ID, "pane-side")))
    time.sleep(3)
    
    print("2. Pesquisando Elis Martins...")
    search_box = None
    for selector in ['div[contenteditable="true"][data-tab="3"]', 'div[title="Caixa de texto de pesquisa"]']:
        try:
            search_box = driver.find_element(By.CSS_SELECTOR, selector)
            break
        except:
            pass
            
    if search_box:
        search_box.click()
        search_box.clear()
        search_box.send_keys("Elis Martins")
        time.sleep(4)
        
    print("3. Injetando clique direto no DOM do contato... (O ERRO ACABOU AQUI)")
    script_clique = """
    let clicou = false;
    document.querySelectorAll('span').forEach(s => {
        if (s.innerText.includes('Elis Martins') || s.title === 'Elis Martins') {
            let p = s.closest('div[role="listitem"]') || s.closest('div[role="row"]');
            if (p && !clicou) {
                p.click();
                clicou = true;
            }
        }
    });
    return clicou;
    """
    sucesso = driver.execute_script(script_clique)
    if not sucesso:
        print("Aviso: Falhou o clique via script! Tentando enter...")
        search_box.send_keys(Keys.ENTER)
        
    print("4. Aguardando o chat carregar e rolando histórico...")
    time.sleep(5)
    
    # Rolar para cima injetando scroll diretamente no DOM
    driver.execute_script("""
        let main = document.querySelector('#main');
        if (main) {
            let scroller = main.querySelector('div[data-testid="conversation-panel-messages"], div[role="application"]') || main;
            for(let i=0; i<10; i++) {
                setTimeout(() => scroller.scrollBy(0, -1500), i*600);
            }
        }
    """)
    time.sleep(7)
    
    print("5. Extraindo blobs de Áudio, Imagens e Textos...")
    js_extract = """
    async function extractMessages() {
        const chatContainer = document.querySelector('#main');
        if (!chatContainer) return [];
        
        const rows = Array.from(chatContainer.querySelectorAll('div[role="row"]')).slice(-80);
        const resultados = [];
        
        for (const row of rows) {
            const isSentByMe = row.innerHTML.includes('message-out') || row.innerHTML.includes('data-id="true');
            const remetente = isSentByMe ? 'Eu' : 'Elis';
            
            let texto = '';
            const tNode = row.querySelector('span.selectable-text');
            if (tNode) texto = tNode.innerText.trim();
            else texto = row.innerText.trim().split('\\n')[0];
            
            if (!texto && !row.innerHTML.includes('<img') && !row.innerHTML.includes('<audio')) continue;

            let audioB64 = null;
            const audioNode = row.querySelector('audio');
            // Só tenta baixar se for link do blob whatsapp local
            if (audioNode && audioNode.src && audioNode.src.startsWith('blob:')) {
                try {
                    const res = await fetch(audioNode.src);
                    const blob = await res.blob();
                    audioB64 = await new Promise(r => {
                        const reader = new FileReader();
                        reader.onloadend = () => r(reader.result);
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
                    imgB64 = await new Promise(r => {
                        const reader = new FileReader();
                        reader.onloadend = () => r(reader.result);
                        reader.readAsDataURL(blob);
                    });
                } catch(e) {}
            }
            
            resultados.push({ remetente, texto, audioB64, imgB64 });
        }
        return resultados;
    }
    const callback = arguments[arguments.length - 1];
    extractMessages().then(callback).catch(e => callback([]));
    """
    
    driver.set_script_timeout(30)
    mensagens = driver.execute_async_script(js_extract)
    
    media_dir = os.path.join(os.getcwd(), 'cliente_media')
    os.makedirs(media_dir, exist_ok=True)
    
    final_json = []
    aud_count = 0
    img_count = 0
    
    for m in mensagens:
        aud_path = None
        img_path = None
        if m.get('audioB64'):
            aud_count += 1
            aud_path = os.path.join(media_dir, f"audio_{aud_count}.ogg")
            with open(aud_path, 'wb') as f:
                f.write(base64.b64decode(m['audioB64'].split(',')[1]))
        if m.get('imgB64'):
            img_count += 1
            ext = 'png' if 'image/png' in m['imgB64'] else 'jpg'
            img_path = os.path.join(media_dir, f"imagem_{img_count}.{ext}")
            with open(img_path, 'wb') as f:
                f.write(base64.b64decode(m['imgB64'].split(',')[1]))
                
        final_json.append({
            "remetente": m["remetente"],
            "texto": m["texto"],
            "audioPath": aud_path,
            "imgPath": img_path
        })
        
    with open('elis_solicitacoes.json', 'w', encoding='utf-8') as f:
        json.dump(final_json, f, indent=2, ensure_ascii=False)
        
    print(f"--- SUCESSO! ---")
    print(f"Extraídas {len(final_json)} mensagens, {aud_count} áudios e {img_count} imagens da conversa!")

except Exception as e:
    print(f"Erro: {e}")
finally:
    time.sleep(10)
    driver.quit()
