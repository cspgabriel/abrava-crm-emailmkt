import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { db, auth } from '../firebase';
import { normalizeEmail, normalizePhone } from '../utils/normalizers';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface SimulatorFormProps {
  onSuccess?: (id: string) => void;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const SimulatorForm: React.FC<SimulatorFormProps> = ({ onSuccess }) => {
  const [step, setStep] = useState(1);
  const [category, setCategory] = useState<string>('Imóvel');
  const [simulationMode, setSimulationMode] = useState<'credito' | 'parcela'>('parcela');
  
  // Values for the slider based on mode
  const [creditValue, setCreditValue] = useState<number>(250000);
  const [installmentValue, setInstallmentValue] = useState<number>(1500);

  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleNext = () => setStep(2);
  const handleBack = () => setStep(1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const user = auth.currentUser;
      const targetValue = simulationMode === 'credito' ? creditValue : installmentValue;
      
      const simulationData = {
        userId: user?.uid || null,
        type: category,
        mode: simulationMode,
        targetValue: targetValue,
        userName: name,
        userCpf: cpf,
        userPhone: normalizePhone(phone),
        userEmail: normalizeEmail(email),
        acceptWhatsApp: true,
        createdAt: serverTimestamp(),
        status: 'pending'
      };

      const docRef = await addDoc(collection(db, 'simulations'), simulationData);
      
      localStorage.setItem('last_simulation_email', normalizeEmail(email));
      localStorage.setItem('last_simulation_name', name);
      
      const modeText = simulationMode === 'credito' ? 'Valor do Crédito' : 'Valor da Parcela';
      const msg = `Olá! Fiz uma simulação pelo site.%0A%0A*Objetivo:* ${category}%0A*${modeText}:* ${formatCurrency(targetValue)}%0A%0A*Nome:* ${name}%0A*CPF:* ${cpf}%0A*E-mail:* ${email}%0A*Telefone:* ${phone}`;
      window.open(`https://api.whatsapp.com/send?phone=5521993165605&text=${msg}`, '_blank');

      if (onSuccess) {
        onSuccess(docRef.id);
      } else {
        navigate(`/obrigado?id=${docRef.id}`);
      }
    } catch (error) {
      console.error('Error saving simulation:', error);
      alert('Erro ao processar simulação. Verifique sua conexão.');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Imóvel', 'Veículo', 'Serviços', 'Cartas Contempladas Disponíveis'];

  return (
    <div className="w-full max-w-md mx-auto relative z-20 my-8 lg:my-0">
      <div className="bg-white p-6 sm:p-10 md:p-12 rounded-[2rem] shadow-[0_30px_80px_rgba(0,0,0,0.3)] border border-slate-100 overflow-hidden relative min-h-[460px] flex flex-col justify-between">
        
        {/* Progress bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-100 z-10">
          <div 
            className="h-full bg-[#c99c4a] transition-all duration-500 ease-out" 
            style={{ width: `${(step / 2) * 100}%` }} 
          />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              className="flex-1 flex flex-col pt-2"
            >
              <h3 className="text-2xl font-black uppercase tracking-tighter text-[#081728] mb-1 text-center">
                Simulador Rápido
              </h3>
              <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest text-center mb-6">
                Personalize o seu consórcio
              </p>
              
              <div className="space-y-6 flex-1">
                
                {/* Category Dropdown */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Objetivo do Consórcio</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 sm:py-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#c99c4a] outline-none text-[#081728] font-bold transition appearance-none cursor-pointer"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Mode Toggle */}
                <div className="bg-slate-100 p-1.5 rounded-xl flex gap-1 relative">
                  <button 
                    onClick={() => setSimulationMode('parcela')}
                    className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all z-10 ${simulationMode === 'parcela' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Por Parcela
                  </button>
                  <button 
                    onClick={() => setSimulationMode('credito')}
                    className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all z-10 ${simulationMode === 'credito' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    Por Crédito
                  </button>
                  <div 
                    className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-[#081728] rounded-lg transition-transform duration-300 ease-out shadow-md`}
                    style={{ transform: simulationMode === 'credito' ? 'translateX(calc(100% + 4px))' : 'translateX(0)' }}
                  />
                </div>

                {/* Dynamic Slider */}
                <div className="pt-4 pb-2 space-y-6">
                  <div className="text-center">
                    <span className="text-3xl sm:text-4xl font-black text-[#c99c4a] tracking-tighter drop-shadow-sm">
                      {formatCurrency(simulationMode === 'credito' ? creditValue : installmentValue)}
                    </span>
                  </div>
                  
                  <div className="relative px-2">
                    <input 
                      type="range" 
                      min={simulationMode === 'credito' ? 50000 : 300} 
                      max={simulationMode === 'credito' ? 1000000 : 15000} 
                      step={simulationMode === 'credito' ? 10000 : 100}
                      value={simulationMode === 'credito' ? creditValue : installmentValue}
                      onChange={(e) => simulationMode === 'credito' ? setCreditValue(parseInt(e.target.value)) : setInstallmentValue(parseInt(e.target.value))}
                      className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#c99c4a]"
                    />
                    <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      <span>Mín: {formatCurrency(simulationMode === 'credito' ? 50000 : 300)}</span>
                      <span>Máx: {formatCurrency(simulationMode === 'credito' ? 1000000 : 15000)}</span>
                    </div>
                  </div>
                </div>

              </div>

              <div className="mt-4 pt-2">
                <button
                  onClick={handleNext}
                  className="w-full bg-[linear-gradient(135deg,#ddb161_0%,#c99c4a_45%,#b98734_100%)] py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-[0_14px_30px_rgba(185,133,50,0.35)] transition text-[#081728] flex justify-center items-center gap-2 group hover:brightness-105"
                >
                  SIMULAR CONSÓRCIO <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.form 
              key="step2"
              initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
              onSubmit={handleSubmit}
              className="flex-1 flex flex-col pt-2"
            >
              <h3 className="text-2xl font-black uppercase tracking-tighter text-[#081728] mb-1 text-center">
                Para onde enviamos?
              </h3>
              <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest text-center mb-6">
                Informe seus dados para contato
              </p>
              
              <div className="space-y-4 flex-1">
                <input
                  required
                  type="text"
                  placeholder="Nome completo"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 sm:py-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#c99c4a] outline-none text-[#081728] font-bold transition"
                />
                <input
                  required
                  type="text"
                  placeholder="CPF"
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
                  className="w-full px-4 py-3 sm:py-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#c99c4a] outline-none text-[#081728] font-bold transition"
                />
                <input
                  required
                  type="email"
                  placeholder="Seu melhor e-mail"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 sm:py-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#c99c4a] outline-none text-[#081728] font-bold transition"
                />
                <input
                  required
                  type="tel"
                  placeholder="Celular (WhatsApp)"
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
                  className="w-full px-4 py-3 sm:py-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-[#c99c4a] outline-none text-[#081728] font-bold transition"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-6 py-5 rounded-2xl bg-slate-100 text-[#081728] hover:bg-slate-200 transition font-black uppercase text-sm tracking-widest hidden sm:block"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleBack}
                  className="p-5 rounded-2xl bg-slate-100 text-[#081728] hover:bg-slate-200 transition sm:hidden"
                >
                  <ArrowLeft size={18} />
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm flex items-center justify-center transition text-[#081728] shadow-[0_14px_30px_rgba(185,133,50,0.35)] hover:brightness-105"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-[#081728]/30 border-t-[#081728] rounded-full animate-spin" /> : 'ENVIAR ✅'}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

export default SimulatorForm;
