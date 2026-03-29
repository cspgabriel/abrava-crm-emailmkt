import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { auth, db, googleProvider } from '../firebase';
import { normalizeEmail } from '../utils/normalizers';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'email' | 'auth'>('email');
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const cleanEmail = normalizeEmail(email);
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', cleanEmail));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        setIsLogin(true);
      } else {
        setIsLogin(false);
      }
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
      const q = query(simsRef, where('userEmail', '==', userEmail.toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const batch = writeBatch(db);
        let updated = 0;
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data() as any;
          if (!data.userId) {
            batch.update(docSnap.ref, { userId: userUid });
            updated += 1;
          }
        });
        if (updated > 0) {
          await batch.commit();
          console.log(`Linked ${updated} simulation(s) to user ${userUid}`);
        }
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
        
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: cleanEmail,
            displayName: name,
            role: 'client',
            createdAt: serverTimestamp()
          });
        } catch (fsErr) {
          console.error('Error creating user doc:', fsErr);
        }
      }
      
      if (user) {
        await linkOrphanSimulations(user.uid, cleanEmail);
      }
      
      onClose();
    } catch (err: any) {
      console.error('Auth error:', err);
      if (err.code === 'auth/wrong-password') {
        setError('Senha incorreta. Tente novamente ou redefina sua senha.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso. Tente fazer login.');
        setIsLogin(true);
      } else {
        setError(err.message || 'Ocorreu um erro. Verifique seus dados.');
      }
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
      
      if (user) {
        await linkOrphanSimulations(user.uid, user.email || '');
      }
      
      onClose();
    } catch (err: any) {
      console.error('Google Auth error:', err);
      setError('Erro ao entrar com Google. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep('email');
    setEmail('');
    setPassword('');
    setName('');
    setError('');
  };

  React.useEffect(() => {
    if (isOpen) {
      const pre = localStorage.getItem('prefill_auth_email');
      if (pre) {
        setEmail(pre);
        setIsLogin(true);
        setStep('auth');
        localStorage.removeItem('prefill_auth_email');
      }
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] grid place-items-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-white/80 backdrop-blur-xl"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] my-auto modal-panel"
          >
            <button 
              aria-label="Fechar autenticação"
              onClick={onClose}
              className="absolute top-8 right-8 p-2 text-slate-300 hover:text-slate-900 transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="p-8 sm:p-10 space-y-8 modal-panel-inner">
              <div className="text-center space-y-3">
                <h2 className="text-3xl font-light text-slate-900 tracking-tight italic">
                  {step === 'email' ? 'Portal do Cliente' : (isLogin ? 'Bem-vindo de volta' : 'Crie sua conta')}
                </h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                  {step === 'email' 
                    ? 'Acesse suas simulações exclusivas' 
                    : (isLogin ? 'Insira sua senha para continuar' : 'Defina seus dados de acesso')}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 p-4 rounded-2xl text-red-500 text-[10px] font-bold uppercase tracking-wider text-center">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {step === 'email' ? (
                  <>
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                      className="w-full bg-white border border-slate-100 hover:bg-slate-50 text-slate-900 font-bold py-4 rounded-2xl flex items-center justify-center space-x-3 transition-all shadow-sm active:scale-95"
                    >
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                      <span className="text-[10px] uppercase tracking-widest italic">Entrar com Google</span>
                    </button>

                    <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-slate-100"></div>
                      <span className="flex-shrink mx-4 text-[9px] font-bold text-slate-300 uppercase tracking-widest">Ou e-mail</span>
                      <div className="flex-grow border-t border-slate-100"></div>
                    </div>

                    <form onSubmit={checkEmail} className="space-y-4">
                      <div className="relative">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                          type="email"
                          required
                          placeholder="seu@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-5 pl-14 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium text-sm"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-5 rounded-2xl shadow-xl shadow-slate-900/10 flex items-center justify-center space-x-3 transition-all active:scale-95 mt-6"
                      >
                        {loading ? (
                          <Loader2 className="animate-spin" size={20} />
                        ) : (
                          <>
                            <span className="text-[10px] uppercase tracking-widest italic">Continuar</span>
                            <ArrowRight size={18} />
                          </>
                        )}
                      </button>
                    </form>
                  </>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input
                          type="email"
                          disabled
                          value={email}
                          aria-label="Email para autenticação"
                          title="Email para autenticação"
                          className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-5 pl-14 pr-4 text-slate-900 focus:outline-none transition-all font-medium text-sm text-slate-500 cursor-not-allowed"
                      />
                    </div>
                    {!isLogin && (
                      <div className="relative">
                        <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                          type="text"
                          required
                          placeholder="Nome Completo"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-5 pl-14 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium text-sm"
                        />
                      </div>
                    )}

                    <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                      <input
                        type="password"
                        required
                        placeholder="Sua Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50/50 border border-slate-100 rounded-2xl py-5 pl-14 pr-4 text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all font-medium text-sm"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold py-5 rounded-2xl shadow-xl shadow-slate-900/10 flex items-center justify-center space-x-3 transition-all active:scale-95 mt-6"
                    >
                      {loading ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : (
                        <>
                          <span className="text-[10px] uppercase tracking-widest italic">{isLogin ? 'ENTRAR' : 'CADASTRAR'}</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>

                    <button 
                      type="button"
                      onClick={() => setStep('email')}
                      className="w-full text-[9px] font-bold text-slate-400 hover:text-slate-900 uppercase tracking-widest transition-colors pt-4"
                    >
                      Voltar e alterar e-mail
                    </button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
