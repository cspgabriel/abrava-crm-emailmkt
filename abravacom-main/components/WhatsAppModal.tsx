import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const WhatsAppModal: React.FC<WhatsAppModalProps> = ({ isOpen, onClose, onConfirm }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-2xl"
          >
            <button 
              onClick={onClose}
              className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 transition-colors"
            >
              <X size={24} />
            </button>

            <div className="p-10 sm:p-12 space-y-8">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-[2rem] flex items-center justify-center text-emerald-600 shadow-xl shadow-emerald-500/10">
                  <MessageCircle size={40} />
                </div>
              </div>

              <div className="text-center space-y-3">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
                  Atendimento <span className="text-emerald-600">Direto</span>
                </h2>
                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                  Você será redirecionado para o WhatsApp de um consultor especialista para finalizar sua simulação.
                </p>
              </div>

              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center space-x-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                  <ShieldCheck size={20} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Conexão Segura</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Criptografia de Ponta</span>
                </div>
              </div>

              <button
                onClick={onConfirm}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-600/20 flex items-center justify-center space-x-3 transition-all active:scale-95"
              >
                <span className="text-sm uppercase tracking-widest">Ir para o WhatsApp</span>
                <ArrowRight size={20} />
              </button>

              <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Tempo médio de resposta: <span className="text-emerald-600">5 minutos</span>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default WhatsAppModal;
