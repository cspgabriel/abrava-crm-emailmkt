import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, DollarSign } from 'lucide-react';
import ElisBioSection from '../components/ElisBioSection';
import PartnerMarquee from '../components/PartnerMarquee';

const featureList = [
  {
    icon: Zap,
    title: 'Agilidade premium',
    desc: 'Cartas certificadas imediatamente desbloqueiam seu próximo ativo.',
  },
  {
    icon: ShieldCheck,
    title: 'Operação segura',
    desc: 'Compliance das maiores administradoras e assessoramento jurídico dedicado.',
  },
  {
    icon: DollarSign,
    title: 'Visão patrimonial',
    desc: 'Crédito estruturado que multiplica patrimônio sem juros abusivos.',
  },
];

const steps = [
  { step: '1', title: 'Simulação', desc: 'Faça uma simulação informando o valor do imóvel que será usado como garantia e o valor que deseja de empréstimo' },
  { step: '2', title: 'Análise', desc: 'Nosso time de especialistas avalia a sua proposta para encontrar a opção que se encaixa melhor para você' },
  { step: '3', title: 'Envio de documentos', desc: 'Reúna junto ao seu Personal Banker os documentos necessários para dar continuidade a proposta' },
  { step: '4', title: 'Contratação', desc: 'Finalize a sua contratação de forma simples e rápida' }
];

const Sobre: React.FC = () => {
  useEffect(() => {
    // SEO setup
    document.title = "Quem Somos | Abravacon Assessoria";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute("content", "Conheça a Abravacon. Acesso exclusivo às melhores cartas contempladas do país e crédito com garantia de imóvel. Inteligência financeira para multiplicar seu patrimônio.");
    }

    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
        metaKeywords.setAttribute("content", "sobre nós, abravacon, cartas contempladas, home equity, empréstimo com garantia de imóvel, consórcio, inteligência financeira");
    }

    // Scroll to top
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full">
      <section className="relative flex min-h-[60vh] w-full items-center justify-center overflow-hidden brand-shell pt-28 pb-12">
        <div className="absolute inset-0 opacity-80" />
        <div className="absolute -top-16 -right-12 h-[28rem] w-[28rem] rounded-full bg-[rgba(214,174,94,0.25)] blur-[160px] opacity-60" />
        <div className="absolute -left-24 top-20 h-[28rem] w-[28rem] rounded-full bg-[rgba(5,9,19,0.65)] blur-[140px] opacity-90" />
        
        <div className="relative z-10 mx-auto w-full max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center space-y-8 py-10"
          >
            <div className="inline-flex items-center space-x-3 bg-white/5 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">
              <ShieldCheck size={16} className="text-[var(--brand-gold)]" />
              <span className="text-[var(--brand-gold-soft)]">Sobre a Empresa</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase italic tracking-[0.1em] leading-[1.1] text-white">
              Inteligência Financeira para o seu <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-gold-soft)] to-[var(--brand-gold)]">Patrimônio</span>
            </h1>

            <p className="max-w-3xl text-lg font-medium leading-relaxed text-[rgba(244,236,223,0.88)] sm:text-xl">
              Acesso exclusivo às melhores cartas contempladas do país e crédito estruturado (Home Equity) que multiplica patrimônio sem burocracia excessiva e longe de juros abusivos.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Diferenciais Section */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-6 py-20 -mt-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {featureList.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.15, duration: 0.5 }}
              className="glass-panel group relative overflow-hidden rounded-[2rem] p-8 sm:p-10 hover-scale"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--brand-gold)] opacity-[0.03] transition-transform duration-500 group-hover:scale-[2.5]" />
              <div className="relative z-10 space-y-5">
                <div className="inline-flex rounded-2xl bg-[rgba(217,173,87,0.1)] p-4 text-[var(--brand-gold-soft)] shadow-inner">
                  <feature.icon size={28} strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-wide text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-[0.95rem] leading-relaxed text-[rgba(244,236,223,0.7)] font-medium">
                    {feature.desc}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* O que é Home Equity */}
      <section className="w-full brand-shell py-16 px-4 text-center shadow-sm relative z-10">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-left md:text-center space-y-4 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight text-white">Como Funciona o Crédito com Garantia?</h2>
            <p className="text-[rgba(244,236,223,0.85)] text-[1.05rem] leading-relaxed">
              Também conhecido como Home Equity, é uma modalidade onde o proprietário utiliza o imóvel quitado como garantia. Isso proporciona acesso a taxas significativamente mais baixas e prazos de pagamento estendidos, ideal para quem busca realizar grandes projetos ou reestruturar finanças com segurança e planejamento sólido. Trabalhamos com consórcios para oferecer a aquisição inteligente de imóveis e automotores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left mt-8">
            {steps.map(s => (
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

      {/* Nossa Localização */}
      <section className="relative z-10 w-full brand-shell py-16 px-4">
        <div className="max-w-6xl mx-auto space-y-12 text-center text-white">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Onde estamos</h2>
            <p className="text-[rgba(244,236,223,0.85)] max-w-2xl mx-auto text-lg">
              Venha tomar um café conosco e planejar o seu próximo grande salto financeiro com a melhor assessoria.
            </p>
          </div>
          
          <div className="w-full h-[400px] md:h-[500px] rounded-[2rem] overflow-hidden shadow-2xl glass-panel border border-[#d8ad5b]/20 relative">
            <iframe 
              src="https://maps.google.com/maps?q=Abravacon+Consorcios&t=&z=13&ie=UTF8&iwloc=&output=embed" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              className="absolute inset-0 grayscale-[0.2] contrast-[1.1]"
            />
          </div>
        </div>
      </section>

      <div className="w-full mt-20">
        <PartnerMarquee />
      </div>

      <ElisBioSection />
    </div>
  );
};

export default Sobre;
