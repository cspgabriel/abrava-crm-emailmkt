import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Background from './components/Background';
import Home from './pages/Home';
import ContemplatedLetters from './components/ContemplatedLetters';
import ClientPortal from './components/ClientPortal';
import AdminPortal from './pages/AdminPortal';
import ThankYou from './pages/ThankYou';
import SimulationLanding from './pages/SimulationLanding';
import ConsorcioLanding from './pages/ConsorcioLanding';
import WhatsAppModal from './components/WhatsAppModal';
import AuthModal from './components/AuthModal';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import Sobre from './pages/Sobre';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { App as CRMApp } from './crm/App';

function App() {
  const [user, setUser] = useState(auth.currentUser);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isWhatsModalOpen, setIsWhatsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isCrmRoute = location.pathname.startsWith('/crm');

  useEffect(() => {
    let previousUser: any = null;
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          const role = userDoc.exists() ? userDoc.data().role : 'client';
          setIsAdmin(role === 'admin');

          // Redirect only when user transitions from logged-out -> logged-in
          if (!previousUser) {
            if (role === 'admin') {
              navigate('/admin');
            } else {
              navigate('/portal');
            }
          }
        } catch (err) {
          console.error('Error fetching user role:', err);
          setIsAdmin(false);
          if (!previousUser) navigate('/portal');
        }
      } else {
        setIsAdmin(false);
      }
      previousUser = u;
    });

    const handleOpenAuth = () => setIsAuthModalOpen(true);
    window.addEventListener('open-auth-modal', handleOpenAuth);

    return () => {
      unsubscribe();
      window.removeEventListener('open-auth-modal', handleOpenAuth);
    };
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-transparent text-[var(--brand-ivory)] selection:bg-[rgba(201,156,74,0.3)]">
      {!isCrmRoute ? <Background /> : null}
      {!isCrmRoute ? <Navbar /> : null}

      <main className="relative z-10 w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cartas" element={<ContemplatedLetters />} />
          <Route path="/simulacao" element={<SimulationLanding />} />
          <Route path="/consorcio" element={<ConsorcioLanding />} />
          <Route path="/obrigado" element={<ThankYou />} />
          <Route path="/acesso" element={<Navigate to="/admin-public" replace />} />
          <Route path="/admin-public" element={<AdminPortal />} />
          <Route path="/portal" element={<ClientPortal />} />
          <Route path="/admin" element={isAdmin ? <AdminPortal /> : <Navigate to="/" />} />
          <Route path="/crm/*" element={<CRMApp />} />
          <Route path="/sobre" element={<Sobre />} />
        </Routes>
      </main>

      {!isCrmRoute ? <Footer /> : null}
      {!isCrmRoute ? <FloatingWhatsApp /> : null}

      <WhatsAppModal
        isOpen={isWhatsModalOpen}
        onClose={() => setIsWhatsModalOpen(false)}
        onConfirm={() => setIsWhatsModalOpen(false)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Global Styles */}
      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translate3d(0, 20px, 0); } to { opacity: 1; transform: translate3d(0, 0, 0); } }
        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out forwards; opacity: 0; }
        .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.02); }
        ::-webkit-scrollbar-thumb { background: rgba(201, 156, 74, 0.28); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(201, 156, 74, 0.5); }
        @media print {
          nav, footer, .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}

export default App;
