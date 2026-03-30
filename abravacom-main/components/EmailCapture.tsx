import React, { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

const EmailCapture: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cpf || !email || !email.includes('@') || !phone) return;

    setStatus('loading');
    try {
      await addDoc(collection(db, "simulations"), {
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
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #c99c4a;">Olá, ${name}!</h2>
            <p>Seu cadastro para visualizar as <strong>Cartas Contempladas</strong> foi recebido com sucesso.</p>

            <h3 style="color: #081728; margin-top: 30px;">Acesso ao Portal do Cliente</h3>
            <p>Todo o nosso estoque atualizado de cartas disponíveis e suas simulações ficam centralizados no nosso Portal do Cliente.</p>
            <p><strong>Novo por aqui?</strong> É só acessar o portal e clicar em "Criar Conta" utilizando este mesmo e-mail (<strong>${email}</strong>) para criar sua senha de acesso. Se já tiver conta, basta fazer login.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${portalUrl}" style="background-color: #081728; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Acessar Meu Portal</a>
            </div>
            
            <p style="color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
              Equipe Abrava Consórcios<br>
              <a href="https://abravacom.com.br" style="color: #c99c4a;">abravacom.com.br</a>
            </p>
          </div>
        `.replace(/\n/g, '').replace(/\s{2,}/g, ' ');

        fetch('https://email-api.abravacom.com.br/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            recipientName: name,
            subject: 'Acesso Liberado - Cartas Contempladas Abrava',
            body: htmlContent,
            provider: 'workspace'
          })
        }).catch(err => console.error('Erro ao enviar email automático:', err));
      } catch (err) {
        console.error('Falha no bloco de email:', err);
      }
      // -----------------------------------
      setStatus('success');
      if (onSuccess) {
        setTimeout(onSuccess, 500);
      } else {
        setName('');
        setCpf('');
        setEmail('');
        setPhone('');
      }
    } catch (e) {
      console.error("Error saving lead: ", e);
      setStatus('error');
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 pb-6 rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-500">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 sm:p-3 bg-[#d8ad5b]/20 rounded-xl text-[#b98532]">
          <Mail size={18} />
        </div>
        <div>
          <h3 className="font-black text-[#0b1a3a] text-sm sm:text-lg uppercase tracking-tight italic leading-tight">
            CADASTRE-SE E OBTENHA <br/><span className="text-[#b98532]">ACESSO COMPLETO</span>
          </h3>
        </div>
      </div>
      
      <p className="text-xs sm:text-sm text-slate-500 mb-4 sm:mb-6 leading-relaxed font-medium">
        Preencha para liberar o acesso aos detalhes das cartas selecionadas.
      </p>

      {status === 'success' ? (
        <div className="flex flex-col items-center justify-center p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100 animate-fade-in">
          <CheckCircle2 className="text-emerald-600 w-12 h-12 mb-4" />
          <p className="text-emerald-700 font-black text-center text-sm uppercase tracking-wider">
            Acesso Liberado!
          </p>
          {!onSuccess && (
            <button 
              onClick={() => setStatus('idle')}
              className="mt-6 text-[10px] text-slate-400 hover:text-emerald-600 font-black uppercase tracking-widest transition-colors"
            >
              Realizar outro cadastro
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome completo"
            required
            disabled={status === 'loading'}
            className="w-full px-4 py-3 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#d8ad5b] outline-none transition-all disabled:opacity-50 font-medium text-xs sm:text-sm"
          />
          <input
            type="text"
            value={cpf}
            onChange={(e) => {
              let val = e.target.value.replace(/\D/g, '');
              if (val.length <= 11) {
                val = val.replace(/(\d{3})(\d)/, '$1.$2');
                val = val.replace(/(\d{3})(\d)/, '$1.$2');
                val = val.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
              }
              setCpf(val);
            }}
            maxLength={14}
            placeholder="Seu CPF"
            required
            disabled={status === 'loading'}
            className="w-full px-4 py-3 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#d8ad5b] outline-none transition-all disabled:opacity-50 font-medium text-xs sm:text-sm"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Seu melhor e-mail"
            required
            disabled={status === 'loading'}
            className="w-full px-4 py-3 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#d8ad5b] outline-none transition-all disabled:opacity-50 font-medium text-xs sm:text-sm"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              let formatted = val;
              if (val.length <= 11) {
                formatted = val.replace(/^(\d{2})(\d)/g,"($1) $2").replace(/(\d)(\d{4})$/,"$1-$2");
              }
              setPhone(formatted);
            }}
            maxLength={15}
            placeholder="Seu WhatsApp"
            required
            disabled={status === 'loading'}
            className="w-full px-4 py-3 sm:px-5 sm:py-4 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#d8ad5b] outline-none transition-all disabled:opacity-50 font-medium text-xs sm:text-sm"
          />
          
          {status === 'error' && <p className="text-red-500 text-xs text-center font-bold">Erro de conexão, tente novamente.</p>}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full py-3.5 sm:py-5 px-6 sm:px-8 mt-2 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#0b1a3a] to-[#071226] hover:brightness-110 text-white font-black uppercase tracking-widest active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 sm:gap-4 disabled:opacity-70 shadow-lg text-[11px] sm:text-sm"
          >
            {status === 'loading' ? (
              <Loader2 className="animate-spin w-6 h-6 text-[#d8ad5b]" />
            ) : (
              <>
                <span className="text-sm">Liberar Acesso</span>
                <ArrowRight size={20} className="text-[#d8ad5b]" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default EmailCapture;
