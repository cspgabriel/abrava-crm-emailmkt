import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import SimulatorForm from '../components/SimulatorForm';
import ElisBioSection from '../components/ElisBioSection';
import PartnerMarquee from '../components/PartnerMarquee';
import { useState, useEffect } from 'react';

const ConsorcioLanding: React.FC = () => {
  return (
    <div className="w-full">
      <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden brand-shell pt-32 pb-24">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.03))]" />
        <div className="absolute top-0 -right-12 h-[30rem] w-[30rem] rounded-full bg-[rgba(214,174,94,0.3)] blur-[120px] opacity-70 mix-blend-screen" />
        <div className="absolute -left-20 bottom-10 h-[28rem] w-[28rem] rounded-full bg-[rgba(255,255,255,0.15)] blur-[100px] opacity-60 mix-blend-screen" />

        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6 text-white">
            <div className="inline-flex items-center space-x-3 bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">
              <ShieldCheck size={16} className="text-[var(--brand-gold)]" />
              <span className="text-[var(--brand-gold-soft)]">Consórcios</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tighter italic">
              Planejamento Inteligente e <br />
              <span className="text-[var(--brand-gold)]">Transparente</span>
            </h1>

            <p className="text-[rgba(244,236,223,0.92)] max-w-md text-base sm:text-lg font-medium leading-relaxed">
              Dê o primeiro passo para a sua próxima grande conquista. Simule agora!<br/><br/>
              <span className="text-[var(--brand-gold-soft)] font-black tracking-widest text-[13px] uppercase block">Consórcios: imóveis — veículos — serviços</span>
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="flex justify-center lg:justify-end">
            <div className="w-full max-w-md transform sm:scale-100 scale-95">
              <SimulatorForm />
            </div>
          </motion.div>
        </div>
      </section>

      <div className="w-full">
        <PartnerMarquee />
      </div>

      <ElisBioSection />
    </div>
  );
};

export default ConsorcioLanding;
