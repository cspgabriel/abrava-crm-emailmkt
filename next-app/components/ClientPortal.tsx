import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, 
  AlertCircle,
  TrendingUp,
  User,
  LogOut,
  DollarSign,
  MessageCircle,
  ShieldAlert
} from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, orderBy, doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { Simulation, ContemplatedLetter } from '../types';
import { PROFILE } from '../constants';

const ClientPortal: React.FC = () => {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [letters, setLetters] = useState<ContemplatedLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        // Fetch User Simulations (avoid composite index requirement by ordering client-side)
        const simQuery = query(
          collection(db, 'simulations'),
          where('userId', '==', user.uid)
        );
        const simSnapshot = await getDocs(simQuery);
        const simData = simSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Simulation));
        // Sort by createdAt (timestamp) descending in client in case Firestore index is not present
        simData.sort((a, b) => {
          const ta = (a.createdAt && (a.createdAt as any).seconds) ? (a.createdAt as any).seconds : 0;
          const tb = (b.createdAt && (b.createdAt as any).seconds) ? (b.createdAt as any).seconds : 0;
          return tb - ta;
        });
        setSimulations(simData);

        // Fetch User Assigned Letters
        const letterQuery = query(
          collection(db, 'contemplated_letters'),
          where('userId', '==', user.uid)
        );
        const letterSnapshot = await getDocs(letterQuery);
        const letterData = letterSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContemplatedLetter));
        setLetters(letterData);

      } catch (error) {
        console.error('Error fetching portal data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleLogout = () => {
    auth.signOut();
    window.location.href = '/';
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const hasConsorcioSimulation = simulations.some(s => (s.type || '').toString().toLowerCase().includes('consorci'));
  const hasAnyLetter = letters.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-12 pt-24 pb-20 px-6 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
        <div className="space-y-4">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-emerald-600/20">
              <User size={40} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
                Olá, <span className="text-emerald-600">{user?.displayName?.split(' ')[0] || 'Cliente'}</span>
              </h2>
              <p className="text-slate-500 text-sm font-medium">Bem-vindo ao seu portal de consórcios</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={handleLogout}
              className="bg-slate-100 hover:bg-slate-200 text-slate-900 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center space-x-2 transition-all border border-slate-200"
            >
              <LogOut size={16} />
              <span>Sair da Conta</span>
            </button>
            <button 
              onClick={async () => {
                const newName = window.prompt('Editar nome exibido', user?.displayName || '');
                if (!newName) return;
                try {
                  await updateProfile(user!, { displayName: newName });
                  await updateDoc(doc(db, 'users', user!.uid), { displayName: newName });
                  window.location.reload();
                } catch (err) {
                  console.error('Erro ao atualizar perfil:', err);
                  alert('Erro ao atualizar perfil. Veja o console para mais detalhes.');
                }
              }}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center space-x-2 transition-all border border-emerald-100"
            >
              <ShieldAlert size={16} />
              <span>Editar Perfil</span>
            </button>
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white border border-slate-200 p-6 rounded-[2.5rem] flex items-center space-x-6 shadow-xl shadow-slate-200/50 w-full lg:w-auto"
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-full blur opacity-20" />
            <img 
              src={PROFILE.avatarUrl} 
              alt={PROFILE.name} 
              className="relative w-12 h-12 rounded-full object-cover border-2 border-white"
            />
          </div>
          <div>
            <div className="bg-emerald-600 text-white px-4 py-1 rounded-lg text-sm font-black uppercase tracking-tighter mb-1">
              {PROFILE.name}
            </div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] ml-1">Seu Assessor de Vendas</p>
            <a 
              href={`https://wa.me/${PROFILE.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center space-x-2 text-emerald-500 hover:text-emerald-400 transition-colors text-[10px] font-black uppercase tracking-widest"
            >
              <MessageCircle size={14} />
              <span>Chamar no Whats</span>
            </a>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-4 shadow-lg shadow-slate-200/30">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
              <TrendingUp size={24} />
            </div>
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">Ativo</span>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] mb-1">Cotações</p>
            <p className="text-3xl font-black text-slate-900">{simulations.length}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-4 shadow-lg shadow-slate-200/30">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
              <DollarSign size={24} />
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] mb-1">Crédito Total</p>
            <p className="text-3xl font-black text-slate-900">{formatCurrency(simulations.reduce((acc, curr) => acc + curr.creditAmount, 0))}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-4 shadow-lg shadow-slate-200/30">
          <div className="flex items-center justify-between">
            <div className="p-3 bg-amber-50 rounded-2xl text-amber-600">
              <FileText size={24} />
            </div>
          </div>
          <div>
            <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] mb-1">Cartas Vinculadas</p>
            <p className="text-3xl font-black text-slate-900">{letters.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
            <h4 className="text-sm font-black uppercase text-slate-500 tracking-widest">Resumo Rápido</h4>
                <div className="mt-2 grid grid-cols-3 gap-2">
              <div className="text-center">
                <div className="text-[10px] text-slate-400 uppercase">Cotações</div>
                <div className="text-base font-black text-emerald-600">{simulations.length}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-slate-400 uppercase">Crédito Total</div>
                <div className="text-base font-black text-slate-900">{formatCurrency(simulations.reduce((acc, curr) => acc + curr.creditAmount, 0))}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] text-slate-400 uppercase">Cartas</div>
                <div className="text-base font-black text-emerald-600">{letters.length}</div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-lg">
            {hasConsorcioSimulation && !hasAnyLetter ? (
              <div>
                <div className="font-black uppercase text-sm">Já simulou um consórcio?</div>
                <p className="text-xs mt-1">Confira CARTAS CONTEMPLADAS que podem ser do seu interesse.</p>
                <div className="mt-3 flex justify-end">
                  <a href="/cartas" className="bg-white text-emerald-600 px-3 py-2 rounded-lg font-black text-xs">Ver Cartas</a>
                </div>
              </div>
            ) : hasAnyLetter && !hasConsorcioSimulation ? (
              <div>
                <div className="font-black uppercase text-sm">Possui carta vinculada?</div>
                <p className="text-xs mt-1">Simule consórcios para comparar prazos e parcelas.</p>
                <div className="mt-3 flex justify-end">
                  <a href="/consorcio" className="bg-white text-emerald-600 px-3 py-2 rounded-lg font-black text-xs">Simular</a>
                </div>
              </div>
            ) : (
              <div>
                <div className="font-black uppercase text-sm">Explore</div>
                <p className="text-xs mt-1">Acesse simulações e cartas vinculadas rapidamente.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Minhas Cotações</h3>
            <a href="/portal" className="text-xs font-black text-emerald-600">Ver todas</a>
          </div>

          {simulations.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 p-6 rounded-2xl text-center">
              <AlertCircle className="mx-auto text-slate-300" size={36} />
              <p className="text-slate-500 font-medium mt-2">Nenhuma cotação ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {simulations.slice(0, 5).map((sim) => (
                <div key={sim.id} className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between text-sm">
                  <div>
                    <div className="font-black text-slate-900">{sim.type} • {new Date((sim.createdAt as any)?.seconds * 1000).toLocaleDateString('pt-BR')}</div>
                    <div className="text-[12px] text-emerald-600 font-black">{formatCurrency(sim.creditAmount)}</div>
                  </div>
                  <div className="text-right text-[11px] text-slate-400">{sim.status === 'pending' ? 'Em análise' : sim.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Minhas Cartas</h3>
            <a href="/cartas" className="text-xs font-black text-emerald-600">Ver todas</a>
          </div>

          {letters.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-200 p-6 rounded-2xl text-center">
              <FileText className="mx-auto text-slate-300" size={36} />
              <p className="text-slate-500 font-medium mt-2">Nenhuma carta vinculada.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {letters.slice(0, 5).map((letter) => (
                <div key={letter.id} className="bg-white border border-slate-200 p-3 rounded-xl flex items-center justify-between text-sm">
                  <div>
                    <div className="font-black text-slate-900">{letter.administrator} • {letter.category}</div>
                    <div className="text-[12px] text-emerald-600 font-black">{formatCurrency(letter.credit)}</div>
                  </div>
                  <div className="text-right text-[11px] text-emerald-600">{letter.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;
