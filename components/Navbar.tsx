import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import BrandLogo from './BrandLogo';

const primaryLinks = [
  { name: 'Início', path: '/' },
  { name: 'Cartas Contempladas Disponíveis', path: '/cartas' },
  { name: 'Consórcios', path: '/consorcio' },
  { name: 'Crédito com Garantia', path: '/simulacao' },
  { name: 'Sobre', path: '/sobre' },
];

const utilityLinks = [
  { name: 'Portal', path: '/portal', icon: LayoutDashboard },
  { name: 'Admin', path: '/admin-public', icon: ShieldCheck },
  { name: 'Acesso', path: '/acesso', icon: LogIn },
];

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(auth.currentUser);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (!u) {
        setIsAdmin(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        setIsAdmin(userDoc.exists() && userDoc.data().role === 'admin');
      } catch (error) {
        console.error('Error fetching user role:', error);
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }

    return () => document.body.classList.remove('overflow-hidden');
  }, [isOpen]);

  const openAuth = () => {
    setIsOpen(false);
    window.dispatchEvent(new CustomEvent('open-auth-modal'));
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-[150]">
        <div className="flex w-full items-center justify-between border-b border-[rgba(217,173,87,0.06)] bg-[#081728] px-4 py-4 shadow-[0_6px_20px_rgba(3,10,20,0.25)]">
          <Link to="/" className="shrink-0">
            <BrandLogo />
          </Link>

          <div className="hidden items-center gap-2 xl:flex">
            {primaryLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`rounded-full whitespace-nowrap px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] transition-all ${
                  isActive(link.path)
                    ? 'bg-[rgba(217,173,87,0.14)] text-[var(--brand-gold-soft)]'
                    : 'text-white/90 hover:bg-white/5 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 xl:flex">
            <div className="rounded-full border border-[rgba(217,173,87,0.14)] bg-[rgba(255,255,255,0.03)] p-1">
              {utilityLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] transition-all ${
                      isActive(link.path)
                        ? 'bg-[rgba(217,173,87,0.14)] text-[var(--brand-gold-soft)]'
                        : 'text-white/85 hover:text-white'
                    }`}
                  >
                    <Icon size={14} />
                    {link.name}
                  </Link>
                );
              })}
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to={isAdmin ? '/admin' : '/portal'}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[rgba(217,173,87,0.18)] bg-[rgba(255,255,255,0.05)] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-[var(--brand-ivory)] transition hover:border-[rgba(217,173,87,0.35)] hover:bg-[rgba(255,255,255,0.08)]"
                >
                  <User size={14} />
                  Minha Conta
                </Link>
                <button
                  onClick={() => auth.signOut()}
                  className="inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-[linear-gradient(135deg,#d8ad5b_0%,#b98532_100%)] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#081728] shadow-[0_14px_30px_rgba(185,133,50,0.35)] transition hover:brightness-105"
                >
                  <LogOut size={14} />
                  Sair
                </button>
              </div>
            ) : (
              <button
                onClick={openAuth}
                className="rounded-full whitespace-nowrap bg-[linear-gradient(135deg,#d8ad5b_0%,#b98532_100%)] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#081728] shadow-[0_14px_30px_rgba(185,133,50,0.35)] transition hover:brightness-105"
              >
                Área do Parceiro
              </button>
            )}
          </div>

          <button
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(217,173,87,0.12)] bg-[rgba(255,255,255,0.02)] text-[var(--brand-ivory)] transition hover:bg-[rgba(255,255,255,0.04)] xl:hidden"
            onClick={() => setIsOpen((value) => !value)}
            aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {isOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[140] bg-[rgba(2,8,14,0.7)] backdrop-blur-sm xl:hidden"
            />
            <motion.div
              initial={{ y: -24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -24, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-x-4 top-24 z-[145] rounded-[30px] border border-[rgba(217,173,87,0.18)] bg-[linear-gradient(180deg,rgba(13,34,56,0.98)_0%,rgba(7,23,38,0.98)_100%)] p-5 shadow-[0_25px_80px_rgba(3,10,20,0.55)] xl:hidden"
            >
              <BrandLogo compact wordmarkClassName="text-[2.4rem]" />

              <div className="mt-5 grid gap-2">
                {primaryLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`rounded-2xl border px-4 py-4 text-sm font-semibold uppercase tracking-[0.24em] transition ${
                      isActive(link.path)
                        ? 'border-[rgba(217,173,87,0.25)] bg-[rgba(217,173,87,0.12)] text-[var(--brand-gold-soft)]'
                        : 'border-transparent bg-white/5 text-[rgba(244,236,223,0.78)] hover:bg-white/10'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              <div className="mt-4 grid gap-2">
                {utilityLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-[rgba(244,236,223,0.78)] transition hover:bg-white/10"
                    >
                      <Icon size={16} />
                      {link.name}
                    </Link>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-3">
                {user ? (
                  <>
                    <Link
                      to={isAdmin ? '/admin' : '/portal'}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-2xl border border-[rgba(217,173,87,0.18)] bg-[rgba(255,255,255,0.06)] px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-[var(--brand-ivory)]"
                    >
                      <User size={16} />
                      Minha Conta
                    </Link>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        auth.signOut();
                      }}
                      className="flex items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#d8ad5b_0%,#b98532_100%)] px-5 py-4 text-[11px] font-bold uppercase tracking-[0.28em] text-[#081728]"
                    >
                      <LogOut size={16} />
                      Sair
                    </button>
                  </>
                ) : (
                  <button
                    onClick={openAuth}
                    className="rounded-2xl bg-[linear-gradient(135deg,#d8ad5b_0%,#b98532_100%)] px-5 py-4 text-[11px] font-bold uppercase tracking-[0.28em] text-[#081728]"
                  >
                    Área do Parceiro
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
