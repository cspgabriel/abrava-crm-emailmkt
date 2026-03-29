import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Star, Zap, DollarSign, Mail } from 'lucide-react';
import ElisBioSection from '../components/ElisBioSection';
import PartnerMarquee from '../components/PartnerMarquee';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../firebase';

const heroTitleWords = ['Multiplique', 'seu', 'patrimÃ´nio', 'com'];

const featureList = [
  {
    icon: Zap,
    title: 'Cartas contempladas',
    desc: 'Veja oportunidades com credito, parcela e prazo antes do cadastro e libere o acesso completo quando fizer sentido.',
    path: '/cartas'
  },
  {
    icon: ShieldCheck,
    title: 'Consorcios personalizados',
    desc: 'Fluxo separado para captar o lead e montar a simulacao de acordo com o objetivo do cliente.',
    path: '/consorcio'
  },
  {
    icon: DollarSign,
    title: 'Simulacao estrategica',
    desc: 'Uma rota dedicada para apresentar condicoes, captar o contato e conduzir o cliente para o proximo passo.',
    path: '/simulacao'
  },
];

const testimonials = [
  {
    name: 'Roberto Almeida',
    role: 'EmpresÃ¡rio',
    text: 'A Elis achou a carta para ampliar a frota em tempo recorde. Assessoria impecÃ¡vel, sem promessas vazias.',
    rating: 5,
    date: 'HÃ¡ 2 meses',
  },
  {
    name: 'Mariana Costa',
    role: 'MÃ©dica',
    text: 'Estava pagando juros absurdos. Com a carta da Abravacon economizei mais de 40% e ganhei seguranÃ§a.',
    rating: 5,
    date: 'HÃ¡ 1 semana',
  },
  {
    name: 'Carlos Eduardo',
    role: 'EmpresÃ¡rio',
    text: 'Hoje sÃ³ uso esse caminho para imÃ³veis. A inteligÃªncia matemÃ¡tica da equipe vale cada carta.',
    rating: 5,
    date: 'HÃ¡ 3 meses',
  },
];

const Home: React.FC = () => {
  const [recentSimulations, setRecentSimulations] = useState<any[]>([]);
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);

  useEffect(() => {
    const simQuery = query(collection(db, 'simulations'), orderBy('createdAt', 'desc'), limit(6));
    const campQuery = query(collection(db, 'campaigns'), orderBy('date', 'desc'), limit(6));

    const unsubSims = onSnapshot(simQuery, snap => {
      setRecentSimulations(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });
    const unsubCamps = onSnapshot(campQuery, snap => {
      setRecentCampaigns(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });

    return () => {
      unsubSims();
      unsubCamps();
    };
  }, []);

  const formatCurrency = (value: any) => {
    if (value === null || value === undefined || value === '') return '-';
    const num = typeof value === 'number' ? value : Number(String(value).replace(/[R$\\s.]/g, '').replace(',', '.'));
    if (!Number.isFinite(num)) return String(value);
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
  };

  return (
    <div className="space-y-0">
      <section className="relative flex min-h-[72vh] w-full items-center justify-center overflow-hidden brand-shell pt-28 pb-12">
        <div className="absolute inset-0 opacity-80" />
        <div className="absolute -top-16 -right-12 h-[28rem] w-[28rem] rounded-full bg-[rgba(214,174,94,0.25)] blur-[160px] opacity-60" />
        <div className="absolute -left-24 top-20 h-[28rem] w-[28rem] rounded-full bg-[rgba(5,9,19,0.65)] blur-[140px] opacity-90" />
        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
            }}
            className="flex flex-col items-center space-y-8 py-20"
          >
            <motion.h1
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.08 } },
              }}
              className="max-w-4xl text-4xl font-black uppercase italic tracking-[0.1em] leading-[1.1] text-white sm:text-6xl md:text-7xl"
            >
              {heroTitleWords.map((word, idx) => (
                <motion.span
                  key={`${word}-${idx}`}
                  variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
                  className="inline-block mr-3 sm:mr-4"
                >
                  {word}
                  {" "}
                </motion.span>
              ))}
              <motion.span
                variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
                className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand-gold-soft)] to-[var(--brand-gold)]"
              >
                inteligÃªncia
              </motion.span>
            </motion.h1>

            <motion.p
              variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
              className="max-w-2xl text-lg font-medium leading-relaxed text-[rgba(244,236,223,0.88)] sm:text-xl"
            >
              Cartas contempladas, consorcios e simulacoes com uma comunicacao mais clara, direta e orientada a conversao. Veja as oportunidades, entenda o potencial e avance no momento certo.
            </motion.p>

            <motion.div
              variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
              className="mt-10 flex flex-col gap-4 sm:flex-row sm:gap-6 justify-center"
            >
              <Link
                to="/cartas"
                className="btn-primary group relative flex items-center justify-center overflow-hidden rounded-xl px-5 py-3 text-xs sm:px-6 sm:py-3.5 sm:text-sm font-black uppercase tracking-[0.18em] sm:tracking-[0.22em] transition-all hover:scale-[1.02]"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Cartas Contempladas
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            </motion.div>

          </motion.div>
        </div>
      </section>

      <div className="w-full">
        <PartnerMarquee />
      </div>

      <div className="w-full">
        <ElisBioSection />
      </div>

      <div className="w-full py-12">
        <HomeFeaturesSection />
      </div>

      <HomeWhatsappCtaSection />
      <HomeTestimonialsSection />
    </div>
  );
};

const HomeFeaturesSection = () => {
  return (
    <section className="relative overflow-hidden py-20 home-features-section">
      <div className="pointer-events-none absolute inset-0 opacity-90 brand-shell" />
      <div className="relative z-10 mx-auto max-w-6xl px-6 text-white">
        <div className="text-center mb-16 space-y-4">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-black text-white"
          >
            Por que escolher a <span className="text-[var(--brand-gold-soft)]">Abravacon</span>?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="max-w-4xl mx-auto text-base leading-relaxed text-[rgba(244,236,223,0.88)]"
          >
            Voce nao precisa descobrir tudo sozinho. Organizamos a vitrine, os fluxos e o atendimento para que cada visitante encontre a oportunidade certa com mais clareza e menos friccao.
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="max-w-3xl mx-auto text-sm font-bold uppercase tracking-[0.2em] text-[var(--brand-gold-soft)]"
          >
            Oferecemos soluÃ§Ãµes:
          </motion.p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {featureList.map((feat, index) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
            >
              <Link
                to={feat.path}
                className="block h-full space-y-6 rounded-[32px] glass-panel hover-scale p-8 cursor-pointer"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[rgba(255,255,255,0.15)] bg-white/5 text-[var(--brand-gold-soft)]">
                  <feat.icon size={26} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-gradient-gold">
                    {feat.title}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[rgba(244,236,223,0.8)]">
                    {feat.desc}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};


const HomeTestimonialsSection = () => {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,#c99c4a_0%,#a8782a_100%)] py-24 home-testimonials-section">
      <div className="absolute inset-0 bg-black/10 home-testimonials-overlay" />
      <div className="relative z-10 mx-auto max-w-6xl px-6">
        <div className="text-center mb-16 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-1 mb-4 text-white"
          >
            {[...Array(5)].map((_, index) => (
              <Star key={index} size={24} fill="currentColor" />
            ))}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-black uppercase tracking-[0.2em] text-white"
          >
            O que dizem nossos clientes
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="mx-auto max-w-2xl text-sm font-bold uppercase tracking-[0.3em] text-[var(--brand-ivory)]"
          >
            HistÃ³rias reais de quem escolheu alavancar patrimÃ´nio com inteligÃªncia e seguranÃ§a.
          </motion.p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative overflow-hidden rounded-[32px] border border-[rgba(255,255,255,0.1)] bg-white/90 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.12)]"
            >
              <div className="absolute inset-0 -translate-y-8 bg-[linear-gradient(160deg,rgba(214,174,94,0.25)_0%,rgba(255,255,255,0)_60%)] blur-[80px]" />
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-2 text-amber-400">
                  {[...Array(testimonial.rating)].map((_, key) => (
                    <Star key={key} size={18} fill="currentColor" />
                  ))}
                  <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-[rgba(17,24,39,0.7)]">
                    {testimonial.date}
                  </span>
                </div>
                <p className="relative z-10 text-sm font-medium leading-relaxed text-[rgba(17,24,39,0.85)] italic">
                  "{testimonial.text}"
                </p>
                <div className="relative z-10">
                  <h4 className="text-lg font-black uppercase tracking-[0.2em] text-[rgba(17,24,39,0.9)]">{testimonial.name}</h4>
                  <p className="text-xs font-bold uppercase tracking-[0.35em] text-[var(--brand-gold-soft)]">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const HomeWhatsappCtaSection = () => {
  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#071726,#09192a)]" />
      <div className="absolute top-0 right-0 h-[28rem] w-[28rem] rounded-full bg-[rgba(214,174,94,0.25)] blur-[120px]" />
      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center text-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-full border border-[#25D366]/20 bg-[#25D366]/10"
        >
          <svg className="h-10 w-10 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
          </svg>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-black uppercase tracking-[0.2em]"
        >
          Acesso VIP no WhatsApp
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
          className="mx-auto mt-6 max-w-2xl text-sm font-medium uppercase tracking-[0.25em] text-[rgba(255,255,255,0.8)]"
        >
          Receba cartas contempladas e oportunidades exclusivas antes de todo mundo.
        </motion.p>
        <motion.a
          href="https://chat.whatsapp.com/EQLOlDYRoiCArffDLK4lvE"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
          className="mt-10 inline-flex items-center justify-center gap-3 rounded-2xl bg-[#25D366] px-10 py-4 font-black uppercase tracking-[0.3em] text-white shadow-[0_20px_60px_rgba(37,211,102,0.25)] transition hover:scale-105 hover:bg-[#1fad53]"
        >
          Entrar no grupo VIP
          <ArrowRight size={20} />
        </motion.a>
      </div>
    </section>
  );
};

export default Home;


