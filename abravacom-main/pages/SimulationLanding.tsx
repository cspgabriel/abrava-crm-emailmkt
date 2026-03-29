import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import SimulatorForm from '../components/SimulatorForm';
import ElisBioSection from '../components/ElisBioSection';
import PartnerMarquee from '../components/PartnerMarquee';
import { useState, useEffect } from 'react';

const SimulationLanding: React.FC = () => {
  return (
    <div className="w-full">
      <section className="relative flex min-h-[72vh] w-full items-center justify-center overflow-hidden brand-shell pt-28 pb-12">
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
              <div className="bg-white rounded-3xl p-8 shadow-[0_30px_80px_rgba(0,0,0,0.3)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#c99c4a] opacity-[0.08] rounded-bl-[100px]" />
                <h3 className="text-2xl font-black uppercase tracking-tighter text-[#081728] mb-1">
                  Simule Agora
                </h3>
                <p className="text-[#64748b] text-[13px] font-medium mb-6 uppercase tracking-widest">
                  Preencha os dados e receba sua proposta
                </p>
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fb = new FormData(e.currentTarget);
                    const msg = `Olá! Tenho interesse em simular um *Crédito com Garantia*.%0A%0A*Nome:* ${fb.get('nome')}%0A*E-mail:* ${fb.get('email')}%0A*Celular:* ${fb.get('celular')}%0A*CPF:* ${fb.get('cpf')}`;
                    window.open(`https://api.whatsapp.com/send?phone=5521993165605&text=${msg}`, '_blank');
                  }}
                  className="space-y-4 relative z-10"
                >
                  <div>
                    <input required name="nome" type="text" placeholder="Seu nome completo" className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[var(--brand-gold)] focus:ring-1 focus:ring-[var(--brand-gold)] outline-none text-[#081728] font-medium transition" />
                  </div>
                  <div>
                    <input required name="email" type="email" placeholder="Seu melhor e-mail" className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[var(--brand-gold)] focus:ring-1 focus:ring-[var(--brand-gold)] outline-none text-[#081728] font-medium transition" />
                  </div>
                  <div>
                    <input required name="celular" type="tel" placeholder="Seu Celular (WhatsApp)" className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[var(--brand-gold)] focus:ring-1 focus:ring-[var(--brand-gold)] outline-none text-[#081728] font-medium transition" />
                  </div>
                  <div>
                    <input required name="cpf" type="text" placeholder="CPF" className="w-full px-4 py-4 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-[var(--brand-gold)] focus:ring-1 focus:ring-[var(--brand-gold)] outline-none text-[#081728] font-medium transition" />
                  </div>
                  <button type="submit" className="w-full btn-primary py-5 rounded-2xl mt-4 font-black uppercase tracking-[0.2em] text-sm shadow-[0_14px_30px_rgba(185,133,50,0.35)] transition hover:brightness-105 active:scale-95 text-[#081728]">
                    Simular Agora →
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
