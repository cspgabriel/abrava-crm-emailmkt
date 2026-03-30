import re

file_path = r'C:\Users\cspga\Downloads\abravacom-main\abravacom-main\components\SimulatorForm.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target_logic_old = r"(const docRef = await addDoc\(collection\(db, 'simulations'\), simulationData\);\s*localStorage\.setItem\('last_simulation_email', normalizeEmail\(email\)\);\s*localStorage\.setItem\('last_simulation_name', name\);\s*const modeText = simulationMode === 'credito' \? 'Valor do Crédito' : 'Valor da Parcela';\s*const msg = .*?;)"

target_logic_new = """const docRef = await addDoc(collection(db, 'simulations'), simulationData);
      
      localStorage.setItem('last_simulation_email', normalizeEmail(email));
      localStorage.setItem('last_simulation_name', name);
      
      const modeText = simulationMode === 'credito' ? 'Valor do Crédito' : 'Valor da Parcela';
      const msg = Olá! Fiz uma simulação pelo site.%0A%0A*Objetivo:* %0A*:* %0A%0A*Nome:* %0A*CPF:* %0A*E-mail:* %0A*Telefone:* ;

      // --- DISPARO DE EMAIL AUTOMÁTICO ---
      try {
        const portalUrl = window.location.origin + '/portal';
        const htmlContent = 
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #c99c4a;">Olá, !</h2>
            <p>Sua simulação de <strong></strong> foi recebida com sucesso pela nossa equipe.</p>
            
            <div style="background: #f8f9fa; border-left: 4px solid #c99c4a; padding: 15px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Resumo da Simulação:</strong></p>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Objetivo: </li>
                <li>: </li>
              </ul>
            </div>

            <h3 style="color: #081728; margin-top: 30px;">Acesso ao Portal do Cliente</h3>
            <p>No nosso portal você pode acompanhar essa e outras simulações, além de visualizar cartas contempladas exclusivas para o seu perfil.</p>
            <p><strong>Novo por aqui?</strong> É só acessar o portal e clicar em "Criar Conta" utilizando este mesmo e-mail (<strong></strong>) para criar sua senha. Se já tiver conta, basta fazer login.</p>
            
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
            subject: 'Simulação Recebida - Abrava Consórcios',
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
