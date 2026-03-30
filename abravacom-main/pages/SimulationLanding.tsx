import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Loader2 } from 'lucide-react';
import SimulatorForm from '../components/SimulatorForm';
import ElisBioSection from '../components/ElisBioSection';
import PartnerMarquee from '../components/PartnerMarquee';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const SimulationLanding: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [celular, setCelular] = useState('');
  const [cpf, setCpf] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      const name = nome;

      const user = auth.currentUser;
      
      const simulationData = {
        userId: user?.uid || null,
        type: 'Crédito com Garantia de Imóvel',
        mode: 'credito',
        userName: name,
        userCpf: cpf,
        userPhone: celular,
        userEmail: email,
        origem: 'Landing Page: Crédito com Garantia',
        acceptWhatsApp: true,
        createdAt: serverTimestamp(),
        status: 'pending'
      };

      const docRef = await addDoc(collection(db, 'simulations'), simulationData);
      
      localStorage.setItem('last_simulation_email', email.toLowerCase());
      localStorage.setItem('last_simulation_name', name);
      
      const msg = `Olá! Tenho interesse em simular um *Crédito com Garantia*.%0A%0A*Nome:* ${name}%0A*E-mail:* ${email}%0A*Celular:* ${celular}%0A*CPF:* ${cpf}`;

      try {
        const portalUrl = 'https://abravacom.com.br/login';
        const htmlContent = `
          <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #c99c4a;">Olá, ${name}!</h2>
            <p>Sua simulação de <strong>Crédito com Garantia</strong> foi recebida com sucesso pela nossa equipe.</p>
            <p>No nosso portal você pode acompanhar essa e outras simulações.</p>
            <p><strong>Novo por aqui?</strong> É só acessar o portal e clicar em "Criar Conta" utilizando este mesmo e-mail (<strong>${email}</strong>) para criar sua senha. Se já tiver conta, basta fazer login.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${portalUrl}" style="background-color: #081728; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Acessar Meu Portal</a>
            </div>
            <p style="color: #666; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
              Equipe Abrava Consórcios
            </p>
          </div>
        `.replace(/\n/g, '').replace(/\s{2,}/g, ' ');

        fetch('https://email-api.abravacom.com.br/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            recipientName: name,
            subject: 'Simulação de Crédito com Garantia - Abrava Consórcios',
            body: htmlContent,
            provider: 'workspace'
          })
        }).catch(err => console.error('Erro ao enviar email automático:', err));
      } catch (err) {}

      window.open(`https://api.whatsapp.com/send?phone=5551986831896&text=${msg}`, '_blank');
      navigate(`/obrigado?id=${docRef.id}`);

    } catch (error) {
      console.error('Error saving simulation:', error);
      alert('Erro ao processar simulação. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="w-full">
      <section className="relative flex min-h-[85vh] w-full items-center justify-center overflow-hidden brand-shell pt-44 pb-20 mt-12 sm:mt-0">
        <div className="absolute inset-0 opacity-80" />
        <div className="absolute -top-16 -right-12 h-[28rem] w-[28rem] rounded-full bg-[rgba(214,174,94,0.25)] blur-[160px] opacity-60" />
        <div className="absolute -left-24 top-20 h-[28rem] w-[28rem] rounded-full bg-[rgba(5,9,19,0.65)] blur-[140px] opacity-90" />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6 text-white">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tighter italic">
              Crédito com Garantia de Imóvel, <br />
              <span className="text-[var(--brand-gold)]">Sem Burocracia</span>
            </h1>

            <div className="text-[rgba(244,236,223,0.92)] max-w-xl text-base sm:text-lg font-medium leading-relaxed space-y-4">
              <p>
                <strong>Pare de pagar juros altos sem necessidade.</strong>
              </p>
              <p>
                Trabalhamos com os principais bancos e instituições financeiras do país, como Bradesco, Santander, Cashme, Creditas, C6 Bank e Inter, para buscar as melhores condições de crédito com garantia de acordo com o seu perfil.
              </p>
              <p>
                Através da nossa plataforma, com apoio da Franq, analisamos seu cenário e apresentamos as opções mais vantajosas — com um processo rápido, seguro e sem burocracia.
              </p>
              <p>
                Você economiza tempo, reduz custos e toma uma decisão com muito mais segurança.
              </p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md transform sm:scale-100 scale-95">
              <div className="bg-white rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#c99c4a] opacity-[0.08] rounded-bl-[100px]" />
                <h3 className="text-2xl font-black uppercase tracking-tighter text-[#081728] mb-1">
                  Simule Agora
                </h3>
                <p className="text-[#64748b] text-[13px] font-medium mb-6 uppercase tracking-widest">
                  Preencha os dados e receba sua proposta
                </p>
                <form 
                  onSubmit={handleSubmit}
                  className="space-y-4 relative z-10"
                >
                  <div>
                    <input value={nome} onChange={e => setNome(e.target.value)} required disabled={loading} name="nome" type="text" placeholder="Seu nome completo" className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[var(--brand-gold)] focus:ring-1 focus:ring-[var(--brand-gold)] outline-none text-[#081728] font-medium transition" />
                  </div>
                  <div>
                    <input value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} name="email" type="email" placeholder="Seu melhor e-mail" className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[var(--brand-gold)] focus:ring-1 focus:ring-[var(--brand-gold)] outline-none text-[#081728] font-medium transition" />
                  </div>
                  <div>
                    <input 
                      value={celular} 
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '');
                        let formatted = val;
                        if (val.length <= 11) {
                          formatted = val.replace(/^(\d{2})(\d)/g,"($1) $2").replace(/(\d)(\d{4})$/,"$1-$2");
                        }
                        setCelular(formatted);
                      }} 
                      maxLength={15}
                      required disabled={loading} name="celular" type="tel" placeholder="Seu Celular (WhatsApp)" className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[var(--brand-gold)] focus:ring-1 focus:ring-[var(--brand-gold)] outline-none text-[#081728] font-medium transition" 
                    />
                  </div>
                  <div>
                    <input 
                      value={cpf} 
                      onChange={e => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 11) {
                          val = val.replace(/(\d{3})(\d)/, '$1.$2');
                          val = val.replace(/(\d{3})(\d)/, '$1.$2');
                          val = val.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                        }
                        setCpf(val);
                      }}
                      maxLength={14}
                      required disabled={loading} name="cpf" type="text" placeholder="CPF" className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[var(--brand-gold)] focus:ring-1 focus:ring-[var(--brand-gold)] outline-none text-[#081728] font-medium transition" 
                    />
                  </div>
                  <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 btn-primary py-5 rounded-2xl mt-4 font-black uppercase tracking-[0.2em] text-sm shadow-[0_14px_30px_rgba(185,133,50,0.35)] transition hover:brightness-105 active:scale-95 text-[#081728] disabled:opacity-70">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simular Agora →'}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      <section className="w-full brand-shell py-16 px-4 text-center shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-left md:text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-white">O que é Empréstimo com Garantia de Imóvel?</h2>
            <p className="text-[rgba(244,236,223,0.85)] text-[1.05rem] leading-relaxed">
              O Empréstimo com Garantia de Imóvel, também conhecido como Home Equity, é uma modalidade de crédito em que o proprietário utiliza um imóvel como garantia para obter recursos financeiros. Por contar com essa garantia real, as instituições financeiras oferecem taxas de juros significativamente mais baixas e prazos de pagamento mais longos em comparação a outras modalidades de crédito – o que proporciona condições mais vantajosas para quem busca crédito com planejamento e segurança.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left mt-8">
            {[
              { step: '1', title: 'Simulação', desc: 'Faça uma simulação informando o valor do imóvel que será usado como garantia e o valor que deseja de empréstimo' },
              { step: '2', title: 'Análise', desc: 'Nosso time de especialistas avalia a sua proposta para encontrar a opção que se encaixa melhor para você' },
              { step: '3', title: 'Envio de documentos', desc: 'Reúna junto ao seu Personal Banker os documentos necessários para dar continuidade a proposta' },
              { step: '4', title: 'Contratação', desc: 'Finalize a sua contratação de forma simples e rápida' }
            ].map(s => (
              <div key={s.step} className="glass-panel hover-scale rounded-2xl p-6 relative overflow-hidden group border border-[#d8ad5b]/20">
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#d8ad5b]/10 rounded-bl-[100px] -mr-8 -mt-8 transition-transform group-hover:scale-150" />
                <div className="flex flex-col mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-[#c99c4a] to-[#ddb161] text-[#081728] font-black text-xl mb-3 shadow-lg">{s.step}</div>
                  <h3 className="text-xl font-bold text-white">{s.title}</h3>
                </div>
                <p className="text-[rgba(244,236,223,0.8)] text-sm leading-relaxed relative z-10">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="w-full">
        <PartnerMarquee />
      </div>

      <ElisBioSection />
    </div>
  );
};

export default SimulationLanding;
