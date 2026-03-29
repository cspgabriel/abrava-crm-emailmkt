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
driver.maximize_window()

try:
    print("1. Abrindo WhatsApp...")
    driver.get("https://web.whatsapp.com/")
    wait = WebDriverWait(driver, 60)
    wait.until(EC.presence_of_element_located((By.ID, "pane-side")))
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
        time.sleep(5)
        
    print("3. Forçando clique contínuo via JS até a conversa abrir...")
    driver.execute_script("""
        window.abriu = false;
        let tentou = 0;
        let intervalo = setInterval(() => {
            if(document.querySelector('#main')) {
                window.abriu = true;
                clearInterval(intervalo);
                return;
            }
            let els = Array.from(document.querySelectorAll('span'));
            for(let e of els) {
                if(e.innerText && e.innerText.includes('Elis Martins')) {
                    let parent = e.closest("[role='listitem']") || e.closest("[role='row']");
                    if(parent) {
                        parent.click();
                    }
                }
            }
            tentou++;
            if(tentou > 15) clearInterval(intervalo);
        }, 1000);
    """)
    
    for _ in range(20):
        abriu = driver.execute_script("return window.abriu;")
        if abriu:
            break
        time.sleep(1)
        
    print("4. Aguardando o chat carregar as mensagens...")
    time.sleep(4)
    
    print("5. Rolando para cima para buscar o histórico antigo...")
    driver.execute_script("""
        let main = document.querySelector('#main');
        if (main) {
            let scroller = main.querySelector('div[data-testid="conversation-panel-messages"], div[role="application"]') || main;
            for(let i=0; i<15; i++) {
                setTimeout(() => scroller.scrollBy(0, -2000), i*500);
            }
        }
    """)
    time.sleep(10) 
    
    print("6. Baixando e extraindo tudo...")
    js_extract = """
    async function extractMessages() {
        const chatContainer = document.querySelector('#main');
        if (!chatContainer) return [];
        
        const rows = Array.from(chatContainer.querySelectorAll('div[role="row"]')).slice(-100);
        const resultados = [];
        
        for (const row of rows) {
            const isSentByMe = row.innerHTML.includes('message-out');
            const remetente = isSentByMe ? 'Eu' : 'Elis';
            
            let texto = '';
            const tNode = row.querySelector('span.selectable-text');
            if (tNode) texto = tNode.innerText.trim();
            else texto = row.innerText.trim().split('\\n')[0];
            
            if (!texto && !row.innerHTML.includes('<img') && !row.innerHTML.includes('<audio')) continue;

            let audioB64 = null;
            const audioNode = row.querySelector('audio');
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
    
    driver.set_script_timeout(45)
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
    time.sleep(2)
    driver.quit()
