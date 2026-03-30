import re

file_path = r'C:\Users\cspga\Downloads\abravacom-main\abravacom-main\components\EmailCapture.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target_logic_old = r"(await addDoc\(collection\(db, \"simulations\"\), \{\s*name,\s*cpf,\s*email,\s*phone,\s*source: 'Acesso Completo - Cartas',\s*date: new Date\(\)\.toLocaleString\('pt-BR'\)\s*\}\);)"

target_logic_new = """await addDoc(collection(db, "simulations"), {
        name,
        cpf,
        email,
        phone,
        source: 'Acesso Completo - Cartas',
        date: new Date().toLocaleString('pt-BR')
      });

      // --- DISPARO DE EMAIL AUTOMÁTICO ---
      try {
        const portalUrl = window.location.origin + '/portal';
        const htmlContent = 
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #c99c4a;">Olá, !</h2>
            <p>Seu cadastro para visualizar as <strong>Cartas Contempladas</strong> foi recebido com sucesso.</p>

            <h3 style="color: #081728; margin-top: 30px;">Acesso ao Portal do Cliente</h3>
            <p>Todo o nosso estoque atualizado de cartas disponíveis e suas simulações ficam centralizados no nosso Portal do Cliente.</p>
            <p><strong>Novo por aqui?</strong> É só acessar o portal e clicar em "Criar Conta" utilizando este mesmo e-mail (<strong></strong>) para criar sua senha de acesso. Se já tiver conta, basta fazer login.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="" style="background-color: #081728; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Acessar Meu Portal</a>
            </div>
            
            <p style="color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
              Equipe Abrava Consórcios<br>
              <a href="https://abravacom.com.br" style="color: #c99c4a;">abravacom.com.br</a>
            </p>
          </div>
        ;

        fetch('https://email-api.abravacom.com.br/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipients: [{ email, name }],
            subject: 'Acesso Liberado - Cartas Contempladas Abrava',
            htmlContent,
            provider: 'workspace'
          })
        }).catch(err => console.error('Erro ao enviar email automático:', err));
      } catch (err) {
        console.error('Falha no bloco de email:', err);
      }
      // -----------------------------------"""

content = re.sub(target_logic_old, target_logic_new, content, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('SUCCESS')
