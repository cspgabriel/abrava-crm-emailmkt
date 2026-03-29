import React, { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight, LayoutDashboard, MessageCircle, Lock, Mail, Loader2, X } from 'lucide-react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile, fetchSignInMethodsForEmail } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, updateDoc, writeBatch, getDoc } from 'firebase/firestore';

const ThankYou: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const simulationId = searchParams.get('id');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerPortal = async () => {
    if (auth.currentUser) {
      navigate('/portal');
      return;
    }

    const email = localStorage.getItem('last_simulation_email');
    if (email) {
      try {
        // More reliable than Firestore query because it doesn't depend on Rules
        const methods = await fetchSignInMethodsForEmail(auth, email.toLowerCase());
        
        if (methods && methods.length > 0) {
          // user exists -> open auth modal for login
          localStorage.setItem('prefill_auth_email', email);
          window.dispatchEvent(new Event('open-auth-modal'));
          return;
        }
      } catch (err) {
        console.error('Error checking user existence:', err);
      }

      // If we are here, it means the user does not exist or the check failed.
      setShowPasswordModal(true);
    } else {
      // open auth modal to let them insert their email manually
      window.dispatchEvent(new Event('open-auth-modal'));
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const rawEmail = localStorage.getItem('last_simulation_email');
    const email = rawEmail?.toLowerCase();
    const name = localStorage.getItem('last_simulation_name');

    if (!email || !name) {
      setError('Dados da simulação não encontrados. Tente fazer login manualmente.');
      setLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: name });
      
      // Create user profile in Firestore
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: email,
          displayName: name,
          role: 'client',
          createdAt: serverTimestamp()
        });
      } catch (fsErr) {
        console.error('Error creating user profile:', fsErr);
        // Continue anyway, Auth is successful
      }

      // Link all past simulations for this email
      try {
        const simsRef = collection(db, 'simulations');
        const q = query(simsRef, where('userEmail', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const batch = writeBatch(db);
          let linkedCount = 0;
          querySnapshot.forEach((docSnap) => {
             const data = docSnap.data();
             if (!data.userId) { // Apenas vincula se estiver órfã
                batch.update(docSnap.ref, { userId: user.uid });
                linkedCount++;
             }
          });
          if (linkedCount > 0) {
            await batch.commit();
          }
        }
      } catch (simErr) {
        console.error('Error linking current simulation:', simErr);
      }

      localStorage.removeItem('last_simulation_email');
      localStorage.removeItem('last_simulation_name');
      
      navigate('/portal');
    } catch (err: any) {
      console.error('Quick register error:', err);
      // If email already exists, close this modal and open the global Auth modal to let the user login
      if (err && err.code === 'auth/email-already-in-use') {
        setShowPasswordModal(false);
        localStorage.setItem('prefill_auth_email', email);
        window.dispatchEvent(new Event('open-auth-modal'));
        setError('');
        return;
      }
      setError(err.message || 'Erro ao criar conta. Tente fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center justify-center text-center space-y-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-xl shadow-emerald-500/10"
      >
        <CheckCircle2 size={48} />
      </motion.div>

      <div className="space-y-4 max-w-2xl">
        <h1 className="text-4xl sm:text-5xl font-black text-slate-100 tracking-tighter uppercase italic">
          Simulação <span className="text-emerald-600">Enviada!</span>
        </h1>
        <p className="text-slate-500 text-lg leading-relaxed">
          Recebemos seus dados com sucesso. Nossa equipe já está analisando as melhores opções para o seu perfil.
        </p>
      </div>

      <div className="bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200/50 w-full max-w-lg space-y-6">
        <div className="space-y-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">ID da Simulação</p>
          <p className="text-2xl font-black text-slate-900 font-mono tracking-widest">{simulationId || '---'}</p>
        </div>

        <div className="h-px bg-slate-100 w-full" />

        <div className="space-y-4 text-left">
          <h3 className="font-black text-slate-900 uppercase tracking-tight">Próximos Passos:</h3>
          <ul className="space-y-3">
            {[
              'Defina sua senha para acessar o Portal do Cliente.',
              'Um consultor entrará em contato via WhatsApp em até 24h.',
              'Acompanhe o status da sua análise em tempo real.'
            ].map((step, i) => (
              <li key={i} className="flex items-start space-x-3 text-sm text-slate-600">
                <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 flex-shrink-0 mt-0.5">
                  <span className="text-[10px] font-bold">{i + 1}</span>
                </div>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <button 
            onClick={handleVerPortal}
            title="Ver Portal"
            aria-label="Ver Portal"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-emerald-600/20"
          >
            <LayoutDashboard size={18} />
            <span className="text-xs uppercase tracking-widest">Ver Portal</span>
          </button>
          <a 
            href="https://wa.me/5551989272794"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-900 hover:bg-slate-800 text-white font-black py-4 rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-lg shadow-slate-900/20"
          >
            <MessageCircle size={18} />
            <span className="text-xs uppercase tracking-widest">WhatsApp</span>
          </a>
        </div>
      </div>

      <Link to="/" className="text-slate-400 hover:text-emerald-600 font-bold text-sm uppercase tracking-widest transition-colors flex items-center space-x-2">
        <span>Voltar para o Início</span>
        <ArrowRight size={16} />
      </Link>

      {/* Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPasswordModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-2xl p-10 sm:p-12 space-y-8"
            >
              <button 
                onClick={() => setShowPasswordModal(false)}
                title="Fechar"
                aria-label="Fechar"
                className="absolute top-8 right-8 p-2 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <X size={24} />
              </button>

              <div className="text-center space-y-3">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
                  Defina sua <span className="text-emerald-600">Senha</span>
                </h2>
                <p className="text-slate-500 text-sm font-medium">
                  Crie uma senha para acessar seu portal e ver sua simulação.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-600 text-xs font-bold uppercase tracking-wider">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateAccount} className="space-y-6">
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input
                    type="email"
                    disabled
                    value={localStorage.getItem('last_simulation_email') || ''}
                    aria-label="Email da simulação"
                    title="Email da simulação"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-5 pl-14 pr-4 text-slate-400 font-medium cursor-not-allowed"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="password"
                    required
                    autoFocus
                    placeholder="Crie uma Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-5 pl-14 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-600/20 flex items-center justify-center space-x-3 transition-all active:scale-95"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <>
                      <span className="text-sm uppercase tracking-widest">CRIAR CONTA E ACESSAR</span>
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThankYou;
