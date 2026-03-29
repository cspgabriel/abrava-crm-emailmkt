import time
import os
import json
import base64
from playwright.sync_api import sync_playwright

profile_path = os.path.join(os.getcwd(), '.whatsapp_profile')
os.makedirs(profile_path, exist_ok=True)
media_dir = os.path.join(os.getcwd(), 'cliente_media')
os.makedirs(media_dir, exist_ok=True)

with sync_playwright() as p:
    print("1. Iniciando Playwright com seu perfil do WhatsApp...")
    # Lança um contexto persistente (igual ao Chrome que estávamos usando)
    context = p.chromium.launch_persistent_context(
        user_data_dir=profile_path,
        headless=False,
        args=["--start-maximized"]
    )
    
    page = context.pages[0] if context.pages else context.new_page()
    page.goto('https://web.whatsapp.com/', wait_until="domcontentloaded")
    
    print("2. Aguardando a tela inicial...")
    page.wait_for_selector('id=pane-side', timeout=90000)
    print("WhatsApp Web carregado!")
    
    print("3. Clicando na conversa 'Elis Martins' (Playwright localiza via árvore do DOM)...")
    time.sleep(3)
    
    # O Playwright consegue buscar o elemento que contém o texto exatamente e clicar
    try:
        # Clica diretamente na aba do contato na lista esquerda usando a engine nativa
        chat_item = page.locator('div[id="pane-side"]').locator('text="Elis Martins"').first
        chat_item.wait_for(state="visible", timeout=10000)
        chat_item.click()
        print("Clique realizado com sucesso via Playwright!")
    except Exception as e:
        print("Não achei a conversa diretamente na lista. Usando a busca...")
        # Usa a busca
        search_box = page.locator('div[contenteditable="true"][data-tab="3"]')
        search_box.click()
        search_box.fill("Elis Martins")
        time.sleep(3)
        # Seleciona o primeiro resultado que aparecer
        page.keyboard.press("ArrowDown")
        time.sleep(1)
        page.keyboard.press("Enter")
        
    print("4. Aguardando a abertura do painel de mensagens e rolando histórico...")
    try:
        page.wait_for_selector('id=main', timeout=15000)
    except:
        pass
        
    time.sleep(4)
    # Rola a tela no main para forçar o carregamento dinâmico
    page.mouse.click(500, 500) # Clica no meio da tela para dar foco
    for _ in range(15):
        page.keyboard.press('PageUp')
        time.sleep(0.5)
        
    print("5. Carregando dados completos do DOM das mensagens...")
    time.sleep(5) 
    
    js_script = """
    async () => {
        const chatContainer = document.querySelector('#main');
        if (!chatContainer) return [];
        
        const rows = Array.from(chatContainer.querySelectorAll('div[role="row"]')).slice(-80);
        const resultados = [];
        
        for (const row of rows) {
            const isSentByMe = row.innerHTML.includes('message-out') || row.innerHTML.includes('data-id="true');
            let texto = '';
            const textNode = row.querySelector('span.selectable-text');
            if (textNode) {
                texto = textNode.innerText.trim();
            } else {
                texto = row.innerText.trim().split('\\n')[0]; // fallback
            }
            
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
    }
    """
    
    mensagens = page.evaluate(js_script)
    
    final_json = []
    audio_count = 0
    img_count = 0
    
    for m in mensagens:
        audio_path = None
        img_path = None
        
        if m.get('audioB64'):
            audio_count += 1
            audio_path = os.path.join(media_dir, f"audio_{audio_count}.ogg")
            b64_data = m['audioB64'].split(',')[1]
            with open(audio_path, 'wb') as f:
                f.write(base64.b64decode(b64_data))
                
        if m.get('imgB64'):
            img_count += 1
            ext = 'png' if 'image/png' in m['imgB64'] else 'jpg'
            img_path = os.path.join(media_dir, f"imagem_{img_count}.{ext}")
            b64_data = m['imgB64'].split(',')[1]
            with open(img_path, 'wb') as f:
                f.write(base64.b64decode(b64_data))
                
        final_json.append({
            "remetente": m["remetente"],
            "texto": m["texto"],
            "audioPath": audio_path,
            "imgPath": img_path
        })
        
    with open('elis_solicitacoes.json', 'w', encoding='utf-8') as f:
        json.dump(final_json, f, indent=2, ensure_ascii=False)
        
    print(f"\\n--- CONCLUSÃO ---")
    print(f"Extraídas {len(final_json)} mensagens com sucesso!")
    print("O navegador ficará aberto por 20 segundos para verificação.")
    
    time.sleep(20)
    context.close()
