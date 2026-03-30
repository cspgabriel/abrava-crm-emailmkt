import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { auth, db, googleProvider } from '../firebase';
import { normalizeEmail } from '../utils/normalizers';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPopup,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [step, setStep] = useState<'email' | 'auth'>('email');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/portal');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
      const pre = localStorage.getItem('prefill_auth_email');
      if (pre) {
        setEmail(pre);
        setIsLogin(true);
        setStep('auth');
        localStorage.removeItem('prefill_auth_email');
      }
  }, []);

  const checkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const cleanEmail = normalizeEmail(email);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', cleanEmail));
      const querySnapshot = await getDocs(q);
      setIsLogin(!querySnapshot.empty);
      setStep('auth');
    } catch (err: any) {
      console.error('Check email error:', err);
      setIsLogin(true);
      setStep('auth');
    } finally {
      setLoading(false);
    }
  };

  const linkOrphanSimulations = async (userUid: string, userEmail: string) => {
    try {
      const simsRef = collection(db, 'simulations');
      const cleanUserEmail = normalizeEmail(userEmail).toLowerCase().trim();
      const q = query(simsRef, where('userEmail', '==', cleanUserEmail));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const batch = writeBatch(db);
        let updated = 0;
        querySnapshot.forEach((docSnap) => {
          if (!docSnap.data().userId) {
            batch.update(docSnap.ref, { userId: userUid });
            updated += 1;
          }
        });
        if (updated > 0) await batch.commit();
      }
    } catch (err) {
      console.error('Error linking simulations:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const cleanEmail = normalizeEmail(email);
    try {
      let user;
      if (isLogin) {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
          user = userCredential.user;
        } catch (loginErr: any) {
          if (loginErr.code === 'auth/user-not-found') {
            setIsLogin(false);
            setError('Conta não encontrada. Por favor, informe seu nome para criar uma conta.');
            setLoading(false);
            return;
          }
          throw loginErr;
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        user = userCredential.user;
        await updateProfile(user, { displayName: name });
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: cleanEmail,
          displayName: name,
          role: 'client',
          createdAt: serverTimestamp()
        });
      }
      if (user) await linkOrphanSimulations(user.uid, cleanEmail);
      navigate('/portal');
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/wrong-password') setError('Senha incorreta.');
      else if (err.code === 'auth/email-already-in-use') {
        setError('E-mail já em uso. Tente fazer login.');
        setIsLogin(true);
      } else setError(err.message || 'Erro ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: normalizeEmail(user.email || ''),
          displayName: user.displayName,
          role: 'client',
          createdAt: serverTimestamp()
        });
      }
      await linkOrphanSimulations(user.uid, user.email || '');
      navigate('/portal');
    } catch (err: any) {
      console.error('Google Auth error:', err);
      setError('Erro ao entrar com Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center relative overflow-hidden bg-white">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 opacity-60" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-slate-50 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 opacity-60" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-[1000px] flex flex-col md:flex-row bg-white rounded-[2.5rem] shadow-2xl shadow-emerald-900/10 border border-slate-100 overflow-hidden"
      >
        {/* Left Side: Info & Brand */}
        <div className="w-full md:w-[45%] bg-gradient-to-br from-slate-900 via-emerald-950 to-emerald-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-64 h-64 border border-emerald-400 rounded-full animate-pulse" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 border border-teal-400 rounded-full animate-pulse delay-700" />
            </div>

            <div className="relative z-10">
                <div className="w-12 h-1 bg-emerald-500 mb-6 rounded-full" />
                <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-tight">
                  Bem-vindo ao<br />
                  <span className="text-emerald-400">Portal Abrava</span>
                </h1>
                <p className="mt-6 text-emerald-100/70 font-medium leading-relaxed max-w-xs">
                  Sua plataforma completa para gestão de simulações e acesso a cartas contempladas exclusivas.
                </p>
            </div>

            <div className="relative z-10 space-y-4">
               {[
                 { text: 'Acompanhe suas solicitações', icon: CheckCircle2 },
                 { text: 'Simulações exclusivas de crédito', icon: CheckCircle2 },
                 { text: 'Suporte especializado em tempo real', icon: CheckCircle2 }
               ].map((item, idx) => (
                 <div key={idx} className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-emerald-100/90 italic">
                   <item.icon className="w-4 h-4 text-emerald-500" />
                   {item.text}
                 </div>
               ))}
            </div>

            <div className="relative z-10 pt-12 flex items-center gap-3">
               <ShieldCheck className="w-6 h-6 text-emerald-500" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/50">Ambiente 100% Seguro</span>
            </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="flex-1 p-10 sm:p-14 bg-white flex flex-col justify-center">
            <div className="max-w-sm mx-auto w-full space-y-8">
                <div className="text-center md:text-left space-y-2">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
                      {step === 'email' ? 'Identificação' : (isLogin ? 'Fazer Login' : 'Criar Conta')}
                    </h2>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                       {step === 'email' ? 'Insira seu e-mail para começar' : 'Quase lá! Insira seus dados de acesso'}
                    </p>
                </div>

                {error && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-500 text-[10px] font-black uppercase tracking-wider text-center">
                    {error}
                  </motion.div>
                )}

                <div className="space-y-6">
                    {step === 'email' ? (
                      <form onSubmit={checkEmail} className="space-y-4">
                        <div className="relative group">
                          <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors" size={20} />
                          <input
                            type="email"
                            required
                            placeholder="seu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-5 pl-16 pr-6 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600/20 focus:ring-4 focus:ring-emerald-600/5 transition-all font-bold text-base"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-900/10 flex items-center justify-center space-x-3 transition-all active:scale-[0.98] mt-8 group"
                        >
                          {loading ? <Loader2 className="animate-spin" /> : (
                            <>
                              <span className="text-[11px] uppercase tracking-[0.2em] italic">Seguir para o portal</span>
                              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>

                        <div className="relative flex items-center py-6">
                          <div className="flex-grow border-t border-slate-100"></div>
                          <span className="flex-shrink mx-4 text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Ou entre com</span>
                          <div className="flex-grow border-t border-slate-100"></div>
                        </div>

                        <button
                          type="button"
                          onClick={handleGoogleSignIn}
                          disabled={loading}
                          className="w-full bg-white border-2 border-slate-100 hover:border-emerald-600/10 hover:bg-slate-50 text-slate-900 font-black py-5 rounded-2xl flex items-center justify-center space-x-3 transition-all active:scale-[0.98] group"
                        >
                          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                          <span className="text-[10px] uppercase tracking-widest italic pt-0.5">Google Workspace</span>
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 flex items-center justify-between group">
                           <div className="flex items-center gap-3">
                              <Mail size={16} className="text-emerald-600" />
                              <span className="text-xs font-bold text-emerald-900">{email}</span>
                           </div>
                           <button onClick={() => setStep('email')} className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:underline">Trocar</button>
                        </div>

                        {!isLogin && (
                          <div className="relative group">
                            <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors" size={20} />
                            <input
                              type="text"
                              required
                              placeholder="Seu Nome Completo"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-5 pl-16 pr-6 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600/20 focus:ring-4 focus:ring-emerald-600/5 transition-all font-bold text-base"
                            />
                          </div>
                        )}

                        <div className="relative group">
                          <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-600 transition-colors" size={20} />
                          <input
                            type="password"
                            required
                            placeholder="Sua Senha Mestra"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-slate-50 border-2 border-transparent rounded-2xl py-5 pl-16 pr-6 text-slate-900 focus:outline-none focus:bg-white focus:border-emerald-600/20 focus:ring-4 focus:ring-emerald-600/5 transition-all font-bold text-base"
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-900/10 flex items-center justify-center space-x-3 transition-all active:scale-[0.98] mt-4 group"
                        >
                          {loading ? <Loader2 className="animate-spin" /> : (
                            <>
                              <span className="text-[11px] uppercase tracking-[0.2em] italic">{isLogin ? 'Acessar Agora' : 'Criar Conta Premium'}</span>
                              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>

                        <div className="flex flex-col gap-2 pt-4">
                           {isLogin && (
                              <button 
                                type="button"
                                onClick={async () => {
                                  if(!email) return setError('E-mail necessário');
                                  await sendPasswordResetEmail(auth, email);
                                  alert('Email enviado!');
                                }}
                                className="text-[9px] font-black text-slate-400 hover:text-emerald-600 uppercase tracking-widest transition-colors text-center"
                              >
                                Esqueceu sua senha? Recuperar acesso
                              </button>
                           )}
                        </div>
                      </form>
                    )}
                </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
