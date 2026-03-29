import React from 'react';
import { ArrowRight, Award } from 'lucide-react';
import { PROFILE } from '../constants';

const ElisBioSection: React.FC = () => {
  return (
    <section className="w-full pt-4 pb-20 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="bg-white border border-slate-200 rounded-[3rem] p-12 shadow-2xl shadow-slate-200/50">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative self-center">
              <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500 to-emerald-900 rounded-[3.5rem] opacity-10 blur-2xl" />
              <img
                src={PROFILE.avatarUrl}
                alt={PROFILE.name}
                className="relative w-full max-w-xs sm:max-w-sm md:max-w-md aspect-square object-cover rounded-[1.5rem] shadow-2xl"
              />
              <div className="absolute -bottom-4 -right-4 sm:-bottom-6 sm:-right-6 bg-emerald-600 p-5 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] text-white shadow-2xl">
                <Award size={32} className="mb-1 sm:mb-2" />
                <p className="text-lg sm:text-2xl font-black italic">+10 ANOS</p>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest opacity-80">De Experiência</p>
              </div>
            </div>

            <div className="space-y-8">
              <div className="space-y-2">
                <p className="text-emerald-600 font-black text-xs uppercase tracking-[0.3em]">Especialista em Consórcios</p>
                <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter uppercase italic">{PROFILE.name}</h2>
              </div>
              
              <p className="text-slate-500 text-lg leading-relaxed font-medium">
                {PROFILE.description}
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-2xl font-black text-slate-900">5.000+</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Vidas Transformadas</p>
                </div>
                <div className="space-y-2">
                  <p className="text-2xl font-black text-slate-900">R$ 500M+</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Em Crédito Liberado</p>
                </div>
              </div>

              <button className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-10 py-5 rounded-2xl flex items-center space-x-3 transition-all shadow-xl shadow-emerald-600/20 group">
                <span className="text-sm uppercase tracking-widest">Falar com Especialista</span>
                <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ElisBioSection;
