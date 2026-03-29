import os
from bs4 import BeautifulSoup

paths = [
    r"c:\Users\marke\OneDrive\Github\CONSORCIO-CRM-1\WA Download Chat Export_Elis Martins.html",
    r"C:\Users\marke\OneDrive\Github\WORDPRESS-MCP-PROJETO-INTERNO\instagram-agents-hub\WA Download Chat Export_Market Share - Confirmado.html"
]

output = []
for p in paths:
    if os.path.exists(p):
        with open(p, 'r', encoding='utf-8', errors='ignore') as f:
            soup = BeautifulSoup(f, 'html.parser')
            text = soup.get_text(separator='\n', strip=True)
            output.append(f"--- CONTEÚDO DE {os.path.basename(p)} ---\n" + text)
            
with open('parsed_chat.txt', 'w', encoding='utf-8') as f:
    f.write("\n\n".join(output))

print("Parsing concluído!")
