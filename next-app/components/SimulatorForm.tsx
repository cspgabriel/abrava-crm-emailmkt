import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Home, DollarSign, Building2, Palmtree, Hammer, Key, Map as MapIcon, ArrowRight } from 'lucide-react';
import { ConsortiumType } from '../types';
import { db, auth } from '../firebase';
import { normalizeEmail, normalizePhone } from '../utils/normalizers';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface SimulatorFormProps {
  onSuccess?: (id: string) => void;
}

const SimulatorForm: React.FC<SimulatorFormProps> = ({ onSuccess }) => {
  const [type, setType] = useState<ConsortiumType>('Apartamentos');
  const [creditValue, setCreditValue] = useState<number>(250000);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [acceptWhatsApp, setAcceptWhatsApp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showFullForm, setShowFullForm] = useState(false);
  const router = useRouter();

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showFullForm) {
      setShowFullForm(true);
      return;
    }
    setLoading(true);
    
    try {
      const user = auth.currentUser;
      const simulationData = {
        userId: user?.uid || null,
        type,
        creditAmount: creditValue,
        userName: name,
        userPhone: normalizePhone(phone),
        userEmail: normalizeEmail(email),
        acceptWhatsApp,
        createdAt: serverTimestamp(),
        status: 'pending'
      };

      const docRef = await addDoc(collection(db, 'simulations'), simulationData);
      
      localStorage.setItem('last_simulation_email', normalizeEmail(email));
      localStorage.setItem('last_simulation_name', name);
      
      if (onSuccess) {
        onSuccess(docRef.id);
      } else {
        router.push(`/obrigado?id=${docRef.id}`);
      }
    } catch (error) {
      console.error('Error saving simulation:', error);
      alert('Erro ao salvar simulação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const consortiumTypes: { id: ConsortiumType; icon: any; label: string }[] = [
    { id: 'Apartamentos', icon: Building2, label: 'Aptos' },
    { id: 'Casas', icon: Home, label: 'Casas' },
    { id: 'Casas de veraneio', icon: Palmtree, label: 'Veraneio' },
    { id: 'Construção', icon: Hammer, label: 'Construção' },
    { id: 'Primeiro imóvel', icon: Key, label: '1º Imóvel' },
    { id: 'Terreno', icon: MapIcon, label: 'Terreno' },
  ];

  return (
    <div className="w-full max-w-lg mx-auto">
      <form 
        onSubmit={handleSubmit}
        className="space-y-0"
      >
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-100 space-y-6"
        >
          <div className="space-y-2">
            <h3 className="text-slate-900 font-black uppercase text-xl tracking-tighter italic">Simular Crédito</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Escolha o valor e o tipo de consórcio</p>
          </div>

          <div className="space-y-6">
            {!showFullForm ? (
              <>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Valor do Crédito</p>
                    <p className="text-xl sm:text-2xl font-black text-emerald-600">{formatCurrency(creditValue)}</p>
                  </div>
                  
                  <div className="relative pt-2 pb-2">
                    <input 
                      type="range" 
                      min="20000" 
                      max="1000000" 
                      step="10000"
                      value={creditValue}
                      onChange={(e) => setCreditValue(parseInt(e.target.value))}
                      aria-label="Valor do crédito"
                      title="Valor do crédito"
                      className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                    <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>R$ 20.000</span>
                      <span>R$ 1.000.000</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">O que deseja comprar?</p>
                  <div className="grid grid-cols-3 gap-3">
                    {consortiumTypes.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setType(item.id)}
                        className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl border transition-all duration-300 ${
                          type === item.id 
                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20' 
                            : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                        }`}
                      >
                        <item.icon size={20} className="mb-2" />
                        <span className="text-[9px] font-black uppercase tracking-tighter text-center leading-tight">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest ml-1">Seus Dados para Contato</p>
                <div className="space-y-3">
                  <input
                    type="text"
                    required
                    placeholder="Seu Nome Completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="tel"
                      required
                      placeholder="Telefone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                    <input
                      type="email"
                      required
                      placeholder="E-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    />
                  </div>

                  <div className="flex items-center space-x-3 px-1">
                    <input
                      type="checkbox"
                      id="whatsapp"
                      checked={acceptWhatsApp}
                      onChange={(e) => setAcceptWhatsApp(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <label htmlFor="whatsapp" className="text-xs text-slate-500 font-medium cursor-pointer">
                      Aceito receber simulação no WhatsApp
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-600/20 flex items-center justify-center space-x-3 transition-all uppercase tracking-widest text-sm group"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                  <span>{showFullForm ? 'SIMULAR AGORA' : 'CONTINUAR'}</span>
                <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
              </>
            )}
          </button>
        </motion.div>
      </form>
    </div>
  );
};

export default SimulatorForm;
