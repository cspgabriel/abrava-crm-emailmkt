import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageCircle, Mail, Info, CheckCircle2, X, FileText, Filter, SlidersHorizontal } from 'lucide-react';
import { ContemplatedLetter } from '../types';
import { db, auth } from '../firebase';
import { PROFILE } from '../constants';
import { collection, getDocs, doc, runTransaction } from 'firebase/firestore';
import EmailCapture from './EmailCapture';
import CartaFicha from './CartaFicha';
import defaultLettersData from '../data/defaultLetters.json';
import WhatsappVipModal from './WhatsappVipModal';

const LOCAL_LETTERS = defaultLettersData as ContemplatedLetter[];

const ContemplatedLetters: React.FC = () => {
  const [letters, setLetters] = useState<ContemplatedLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<ContemplatedLetter | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [pendingReserveId, setPendingReserveId] = useState<string | null>(null);
  const [adminSearch, setAdminSearch] = useState('');
  const [situationFilter, setSituationFilter] = useState<'all' | 'available' | 'reserved' | 'sold'>('all');
  const [minCredit, setMinCredit] = useState<string>('');
  const [maxCredit, setMaxCredit] = useState<string>('');
  const [minParcel, setMinParcel] = useState<string>('');
  const [maxParcel, setMaxParcel] = useState<string>('');
  const [fundoRange, setFundoRange] = useState<string>('all');
  const [refRange, setRefRange] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [fichaLetter, setFichaLetter] = useState<ContemplatedLetter | null>(null);
  
  // Ficha Email Gate
  const [showFichaEmailGate, setShowFichaEmailGate] = useState(false);
  const [fichaLeadEmail, setFichaLeadEmail] = useState('');
  const [pendingFichaLetter, setPendingFichaLetter] = useState<ContemplatedLetter | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // WhatsApp VIP Modal - show after user engages
  const [showWhatsappVipCta, setShowWhatsappVipCta] = useState(false);

  // Derive unique administrators
  const uniqueAdmins = Array.from(new Set(letters.map(l => l.administrator).filter(Boolean))).sort();

  useEffect(() => {
    const fetchLetters = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'contemplated_letters'));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContemplatedLetter));
        setLetters(data.length > 0 ? data : (LOCAL_LETTERS as ContemplatedLetter[]));
      } catch (error) {
        console.error('Error fetching letters:', error);
        setLetters(LOCAL_LETTERS as ContemplatedLetter[]);
      } finally {
        setLoading(false);
      }
    };

    fetchLetters();
  }, []);

  const user = auth.currentUser;
  const isLogged = !!user;

  // Email wall gate
  const [isUnlocked, setIsUnlocked] = useState(
    !!auth.currentUser || localStorage.getItem('letters_unlocked') === 'true'
  );
  const [unlockEmail, setUnlockEmail] = useState('');

  // Show VIP modal after user unlocks
  useEffect(() => {
    if (isUnlocked) {
      const timer = setTimeout(() => setShowWhatsappVipCta(true), 8000);
      return () => clearTimeout(timer);
    }
  }, [isUnlocked]);

  const filteredLetters = letters.filter(letter => {
    const matchesCategory = filter === 'all' || letter.category === filter;
    const matchesSearch = (letter.group || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (letter.administrator || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (letter.name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAdminSearch = adminSearch.trim() === '' || (letter.administrator || '').toLowerCase().includes(adminSearch.toLowerCase());
    const matchesSituation = situationFilter === 'all' || letter.status === situationFilter;
    const checkRange = (val: number, minStr: string, maxStr: string) => {
      const min = minStr ? Number(minStr) : 0;
      const max = maxStr ? Number(maxStr) : Infinity;
      return val >= min && val <= max;
    };
    const checkFundoRef = (val: number, rangeLabel: string) => {
      if (rangeLabel === 'all') return true;
      if (rangeLabel === 'com-fundo') return val > 0;
      if (rangeLabel === 'sem-fundo') return val === 0;
      return true;
    };

    const matchesCredit = checkRange(letter.credit, minCredit, maxCredit);
    const matchesParcel = checkRange(letter.installmentsCount, minParcel, maxParcel);
    const matchesFundo = checkFundoRef(letter.fundoComum || 0, fundoRange);
    const matchesRef = checkFundoRef(letter.refGarantia || 0, refRange);

    return matchesCategory && matchesSearch && matchesAdminSearch && matchesSituation && matchesCredit && matchesParcel && matchesFundo && matchesRef;
  });

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchTerm, adminSearch, situationFilter, minCredit, maxCredit, minParcel, maxParcel, fundoRange, refRange]);

  const totalPages = Math.ceil(filteredLetters.length / itemsPerPage);
  const paginatedLetters = filteredLetters.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectedLetters = letters.filter(l => selectedIds.includes(l.id));
  const totalCredit = selectedLetters.reduce((acc, l) => acc + l.credit, 0);
  const totalEntry = selectedLetters.reduce((acc, l) => acc + l.entry, 0);
  const totalInstallment = selectedLetters.reduce((acc, l) => acc + l.installmentValue, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const reserveLetter = async (letterId: string) => {
    const letter = letters.find(l => l.id === letterId);
    if (!letter) return;

    if (!isLogged) {
      setPendingReserveId(letterId);
      setShowEmailCapture(true);
      return;
    }

    try {
      const letterRef = doc(db, 'contemplated_letters', letterId);
      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(letterRef as any);
        if (!snap.exists()) throw new Error('Carta não encontrada');
        const data: any = snap.data();
        if (data.status !== 'available') throw new Error('Carta já reservada');
        transaction.update(letterRef, { status: 'reserved', userId: auth.currentUser?.uid || null });
      });
      setLetters(prev => prev.map(l => l.id === letterId ? { ...l, status: 'reserved', userId: auth.currentUser?.uid } : l));
    } catch (e) {
      console.error('Error reserving letter:', e);
      alert('Não foi possível reservar esta carta. Talvez já tenha sido reservada.');
    }
  };

  const reserveSelection = async () => {
    if (selectedIds.length === 0) return;
    if (!isLogged) {
      setShowEmailCapture(true);
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        for (const id of selectedIds) {
          const ref = doc(db, 'contemplated_letters', id);
          const snap = await transaction.get(ref as any);
          if (!snap.exists()) continue;
          const data: any = snap.data();
          if (data.status === 'available') {
            transaction.update(ref, { status: 'reserved', userId: auth.currentUser?.uid || null });
          }
        }
      });
      setLetters(prev => prev.map(l => selectedIds.includes(l.id) ? { ...l, status: 'reserved', userId: auth.currentUser?.uid } : l));
      setSelectedIds([]);
    } catch (e) {
      console.error('Error reserving selection:', e);
      alert('Erro ao reservar seleção. Tente novamente.');
    }
  };

  const handleOpenFicha = (letter: ContemplatedLetter) => {
    setFichaLetter(letter);
    if (!isUnlocked) {
      setShowEmailCapture(true);
    }
  };

  const handleFichaEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fichaLeadEmail.trim()) {
      localStorage.setItem('ficha_lead_email', fichaLeadEmail.trim());
      setShowFichaEmailGate(false);
      setFichaLetter(pendingFichaLetter);
    }
  };

  const openWhatsAppSummary = () => {
    if (selectedIds.length === 0) return;
    if (!isLogged) {
      setShowEmailCapture(true);
      return;
    }

    const msg = `Olá, tenho interesse nas cartas: ${selectedIds.join(', ')}. Crédito total: ${formatCurrency(totalCredit)}, Entrada total: ${formatCurrency(totalEntry)}.`;
    const phone = PROFILE?.whatsapp?.replace(/\D/g, '') || '';
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="relative space-y-6 pt-32 sm:pt-36 pb-28 px-3 sm:px-6 max-w-7xl mx-auto">

      <div className="transition-all duration-300">
      {/* Page header */}
      <div className="flex flex-col gap-4">
        <div className="space-y-2 mb-4">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tighter uppercase italic drop-shadow-lg">
            CARTAS DISPONÍVEIS
          </h2>
          <p className="text-[var(--brand-ivory)]/70 font-medium text-sm sm:text-base">Oportunidades exclusivas com crédito imediato</p>
          <div className="pt-2">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[var(--brand-gold)]/20 border border-[var(--brand-gold)]/40 text-[var(--brand-gold-soft)] rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest shadow-lg">
              <span className="w-2 h-2 rounded-full bg-[var(--brand-gold)] animate-pulse" />
              {filteredLetters.length} {filteredLetters.length === 1 ? 'Carta Disponível' : 'Cartas Disponíveis'}
            </span>
          </div>
        </div>

        {/* Search + filter toggle row */}
        <div className="flex gap-3">
          <div className="relative flex-1 group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--brand-gold-soft)]/60 transition-colors group-focus-within:text-[var(--brand-gold)]" />
            <input
              type="text"
              placeholder="Buscar administradora ou grupo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#0a1526]/80 text-white placeholder-white/40 border border-[#1b3152] rounded-2xl py-3.5 sm:py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)] focus:border-transparent shadow-inner transition-all sm:text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(p => !p)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-3.5 sm:py-4 rounded-2xl border text-sm font-black tracking-wider uppercase transition-all shadow-lg ${showFilters ? 'bg-gradient-to-r from-[#d8ad5b] to-[#b98532] text-[#081728] border-transparent shadow-[0_4px_20px_rgba(185,133,50,0.3)]' : 'bg-[#0a1526]/80 border-[#1b3152] text-[var(--brand-gold-soft)] hover:bg-[#122442]'}`}
          >
            <SlidersHorizontal size={18} />
            <span className="hidden sm:inline">Filtros</span>
          </button>
          <select
            aria-label="Filtro de situação"
            value={situationFilter}
            onChange={(e) => setSituationFilter(e.target.value as any)}
            className="hidden sm:block flex-shrink-0 px-4 py-3.5 sm:py-4 rounded-2xl bg-[#0a1526]/80 border border-[#1b3152] text-[var(--brand-ivory)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)] cursor-pointer hover:bg-[#122442] transition-colors appearance-none"
          >
            <option value="all">Ver Todas</option>
            <option value="available">Somente Disponíveis</option>
            <option value="reserved">Somente Reservadas</option>
            <option value="sold">Vendidas</option>
          </select>
        </div>

        {/* Expanded filters */}
        {showFilters && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-[#0a1526]/60 backdrop-blur-xl border border-[#1b3152] rounded-[1.5rem] p-5 shadow-2xl mt-2 overflow-hidden">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <select
                aria-label="Situação"
                value={situationFilter}
                onChange={(e) => setSituationFilter(e.target.value as any)}
                className="sm:hidden px-4 py-3 rounded-xl bg-[#08101a] border border-[#1f385c] text-[var(--brand-ivory)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)] col-span-2 appearance-none"
              >
                <option value="all">Todas as situações</option>
                <option value="available">Disponível</option>
                <option value="reserved">Reservada</option>
                <option value="sold">Vendida</option>
              </select>
              <div className="relative">
                 <select
                   value={adminSearch}
                   onChange={(e) => setAdminSearch(e.target.value)}
                   className="w-full px-4 py-3 rounded-xl bg-[#08101a] border border-[#1f385c] text-[var(--brand-ivory)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)] appearance-none"
                 >
                   <option value="">Consórcio/Banco (Todos)</option>
                   {uniqueAdmins.map(admin => (
                     <option key={admin} value={admin}>{admin}</option>
                   ))}
                 </select>
              </div>
              <div className="flex gap-3">
                <input type="number" placeholder="Mín. Crédito" value={minCredit} onChange={(e) => setMinCredit(e.target.value)} className="w-1/2 px-4 py-3 rounded-xl bg-[#08101a] border border-[#1f385c] text-[var(--brand-ivory)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)] placeholder-white/30" />
                <input type="number" placeholder="Máx. Crédito" value={maxCredit} onChange={(e) => setMaxCredit(e.target.value)} className="w-1/2 px-4 py-3 rounded-xl bg-[#08101a] border border-[#1f385c] text-[var(--brand-ivory)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)] placeholder-white/30" />
              </div>
              <div className="flex gap-3">
                <input type="number" placeholder="Mín. Parc" value={minParcel} onChange={(e) => setMinParcel(e.target.value)} className="w-1/2 px-4 py-3 rounded-xl bg-[#08101a] border border-[#1f385c] text-[var(--brand-ivory)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)] placeholder-white/30" />
                <input type="number" placeholder="Máx. Parc" value={maxParcel} onChange={(e) => setMaxParcel(e.target.value)} className="w-1/2 px-4 py-3 rounded-xl bg-[#08101a] border border-[#1f385c] text-[var(--brand-ivory)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)] placeholder-white/30" />
              </div>
              <select value={fundoRange} onChange={(e) => setFundoRange(e.target.value)} className="px-4 py-3 rounded-xl bg-[#08101a] border border-[#1f385c] text-[var(--brand-ivory)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)] appearance-none">
                <option value="all">Fundo Comum (Todos)</option>
                <option value="sem-fundo">Somente Sem Fundo Comum</option>
                <option value="com-fundo">Com Fundo Comum</option>
              </select>
              <select value={refRange} onChange={(e) => setRefRange(e.target.value)} className="px-4 py-3 rounded-xl bg-[#08101a] border border-[#1f385c] text-[var(--brand-ivory)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)] appearance-none">
                <option value="all">Ref. Garantia (Todas)</option>
                <option value="sem-fundo">Somente Sem Ref. Garantia</option>
                <option value="com-fundo">Com Ref. Garantia</option>
              </select>
              <div className="flex items-center gap-3 col-span-2 sm:col-span-1">
                <button onClick={() => { setSearchTerm(''); setAdminSearch(''); setMinCredit(''); setMaxCredit(''); setMinParcel(''); setMaxParcel(''); setFundoRange('all'); setRefRange('all'); setSituationFilter('all'); }} className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-[var(--brand-ivory)] text-sm font-bold hover:bg-white/5 transition-all">Limpar</button>
                <button onClick={() => setShowFilters(false)} className="flex-1 px-4 py-3 rounded-xl bg-[linear-gradient(135deg,#d8ad5b_0%,#b98532_100%)] text-[#081728] text-sm font-black shadow-[0_4px_20px_rgba(185,133,50,0.3)] transition-transform hover:brightness-110 active:scale-95">Aplicar</button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Selection Summary Bar */}
      <AnimatePresence>
        {selectedIds.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] w-[95%] max-w-3xl bg-emerald-600 text-white p-4 sm:p-6 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-emerald-400/30 backdrop-blur-xl"
          >
            <div className="flex items-center space-x-8">
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Crédito Total</p>
                <p className="text-xl font-black">{formatCurrency(totalCredit)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Entrada Total</p>
                <p className="text-xl font-black">{formatCurrency(totalEntry)}</p>
              </div>
              <div className="text-center hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Parcelas</p>
                <p className="text-xl font-black">{formatCurrency(totalInstallment)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                {selectedIds.length} {selectedIds.length === 1 ? 'Carta' : 'Cartas'}
              </span>
              <button 
                onClick={() => setSelectedIds([])}
                aria-label="Limpar seleção"
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <button onClick={reserveSelection} className="bg-white text-emerald-600 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-50 transition-all shadow-lg">
                Reservar Seleção
              </button>
              <button onClick={() => alert('Soma: ' + formatCurrency(totalCredit))} className="bg-white text-slate-700 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
                Somar
              </button>
              <button onClick={openWhatsAppSummary} className="bg-emerald-500 text-white px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-sm">
                WhatsApp
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Email capture modal for non-logged users */}
      <AnimatePresence>
        {showEmailCapture ? (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowEmailCapture(false); setPendingReserveId(null); }} className="absolute inset-0 bg-slate-900/60" />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative w-full max-w-2xl p-8">
              <div className="bg-white rounded-[2rem] p-8 shadow-2xl border border-slate-100">
                <div className="flex justify-end">
                  <button onClick={() => { setShowEmailCapture(false); setPendingReserveId(null); }} className="text-slate-400">Fechar</button>
                </div>
                <EmailCapture onSuccess={() => {
                  localStorage.setItem('letters_unlocked', 'true');
                  setIsUnlocked(true);
                  setShowEmailCapture(false);
                  if (pendingFichaLetter) {
                    setFichaLetter(pendingFichaLetter);
                    setPendingFichaLetter(null);
                  }
                }} />
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* Desktop table - Glassmorphism Premium Edition */}
      <div className="hidden md:block overflow-hidden rounded-[2rem] border border-[#1b3152] bg-[rgba(13,34,56,0.65)] backdrop-blur-2xl shadow-[0_25px_80px_rgba(2,6,12,0.4)] relative mt-8">
        <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none" />
        <div className="overflow-x-auto relative z-10 w-full">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-[rgba(5,15,26,0.6)] border-b border-white/10 text-white/50 text-[10px] uppercase tracking-[0.25em] font-black">
                <th className="px-6 py-5 w-14"><div className="w-5 h-5 border-2 border-white/20 rounded" /></th>
                <th className="px-6 py-5">Tipo / Adm</th>
                <th className="px-6 py-5">Valor Crédito</th>
                <th className="px-6 py-5">Sinal/Entrada</th>
                <th className="px-6 py-5">Saldo Devedor</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right w-36">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {paginatedLetters.map((letter, i) => (
                <motion.tr
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.04 }}
                  key={letter.id}
                  onClick={() => handleOpenFicha(letter)}
                  className={`cursor-pointer transition-all duration-300 group ${selectedIds.includes(letter.id) ? 'bg-[rgba(217,173,87,0.1)] hover:bg-[rgba(217,173,87,0.15)]' : 'hover:bg-white/[0.04]'}`}
                >
                  <td className="px-6 py-5">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${selectedIds.includes(letter.id) ? 'bg-[var(--brand-gold)] border-[var(--brand-gold)]' : 'border-white/20 group-hover:border-[var(--brand-gold-soft)]'}`}>
                      {selectedIds.includes(letter.id) ? <CheckCircle2 size={14} className="text-[#081728]" /> : null}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[var(--brand-gold-soft)] font-black uppercase tracking-widest text-xs">{letter.category}</span>
                    <div className="text-[11px] text-white/70 font-semibold mt-1 tracking-wide truncate max-w-[180px]">{letter.administrator || letter.group}</div>
                  </td>
                  <td className="px-6 py-5 text-white font-black text-lg tracking-tight">{formatCurrency(letter.credit)}</td>
                  <td className="px-6 py-5 text-[var(--brand-ivory)] font-bold text-sm">
                    {isUnlocked ? formatCurrency(letter.entry) : (
                      <button onClick={(e) => { e.stopPropagation(); handleOpenFicha(letter); }} className="text-[10px] font-black border border-[var(--brand-gold)]/40 hover:border-[var(--brand-gold)] text-[var(--brand-gold-soft)] px-3 py-1.5 rounded-full hover:bg-[var(--brand-gold)]/10 transition-colors">VER VALOR</button>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-[var(--brand-ivory)] font-black text-sm">{letter.installmentsCount}x <span className="font-semibold opacity-60 ml-1 text-xs">{formatCurrency(letter.installmentValue)}</span></div>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${letter.status === 'available' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : letter.status === 'reserved' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' : 'border-white/20 text-white/40 bg-white/5'}`}>
                      {letter.status === 'available' ? 'Livre' : letter.status === 'reserved' ? 'Reservada' : 'Vendida'}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); reserveLetter(letter.id); }} aria-label={letter.status === 'available' ? 'Reservar carta' : 'Carta reservada'} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg min-w-[90px] ${letter.status === 'available' ? 'bg-[linear-gradient(135deg,#d8ad5b_0%,#b98532_100%)] text-[#081728] border-none hover:scale-105' : 'bg-white/5 text-white/40 border border-white/10'}`}>
                        {letter.status === 'available' ? 'Reservar' : 'Indisponível'}
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile card grid - Dark Theme Premium */}
      <div className="md:hidden grid grid-cols-1 gap-3 mt-6">
        {paginatedLetters.map((letter, i) => (
          <motion.div
            layout
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            key={letter.id}
            onClick={() => handleOpenFicha(letter)}
            className={`relative overflow-hidden border rounded-[1.5rem] p-4 shadow-xl cursor-pointer transition-all ${selectedIds.includes(letter.id) ? 'border-[var(--brand-gold)] bg-[#0d2238]/90' : 'border-[#1b3152] bg-[rgba(13,34,56,0.65)] hover:bg-[rgba(13,34,56,0.8)]'} backdrop-blur-xl`}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/[0.02] to-transparent pointer-events-none" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <span className="px-3 py-1 text-[var(--brand-gold-soft)] bg-[var(--brand-gold)]/10 border border-[var(--brand-gold)]/20 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
                    {letter.category}
                  </span>
                  <p className="font-black text-[var(--brand-ivory)] text-xs uppercase mt-2 tracking-wide">{letter.administrator || letter.group}</p>
                  {letter.name ? <p className="text-[10px] text-white/50 tracking-wider truncate max-w-[150px]">{letter.name}</p> : null}
                </div>
                <div onClick={(e) => { e.stopPropagation(); toggleSelection(letter.id); }} className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${selectedIds.includes(letter.id) ? 'bg-[var(--brand-gold)] border-[var(--brand-gold)]' : 'border-white/20'}`}>
                    {selectedIds.includes(letter.id) ? <CheckCircle2 size={16} className="text-[#081728]" /> : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-y-2 gap-x-2 mb-4">
                <div className="bg-black/20 p-2 rounded-xl border border-white/5">
                  <p className="text-[9px] text-white/50 uppercase font-black tracking-widest mb-0.5">Crédito</p>
                  <p className="font-black text-white text-sm tracking-tight">{formatCurrency(letter.credit)}</p>
                </div>
                <div className="bg-black/20 p-2 rounded-xl border border-white/5">
                  <p className="text-[9px] text-white/50 uppercase font-black tracking-widest mb-0.5">Entrada</p>
                  <div className="font-black text-[var(--brand-gold-soft)] text-xs">
                    {isUnlocked ? formatCurrency(letter.entry) : (
                      <button onClick={(e) => { e.stopPropagation(); handleOpenFicha(letter); }} className="text-[8px] font-black border border-[var(--brand-gold)]/40 hover:border-[var(--brand-gold)] text-[var(--brand-gold-soft)] px-2 py-0.5 rounded-full transition-colors mt-0.5">VER VALOR</button>
                    )}
                  </div>
                </div>
                <div className="bg-black/20 p-2 rounded-xl border border-white/5">
                  <p className="text-[9px] text-white/50 uppercase font-black tracking-widest mb-0.5">Parcelas</p>
                  <p className="font-bold text-[var(--brand-ivory)] text-xs">{letter.installmentsCount}x</p>
                </div>
                <div className="bg-black/20 p-2 rounded-xl border border-white/5">
                  <p className="text-[9px] text-white/50 uppercase font-black tracking-widest mb-0.5">Vlr. Parcela</p>
                  <p className="font-bold text-[var(--brand-ivory)] text-xs">{formatCurrency(letter.installmentValue)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); reserveLetter(letter.id); }}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-black tracking-widest uppercase transition-all shadow-lg ${letter.status === 'available' ? 'bg-[linear-gradient(135deg,#d8ad5b_0%,#b98532_100%)] text-[#081728] border border-[#d8ad5b]/20 hover:scale-[1.02]' : 'bg-white/5 text-white/30 border border-white/10'}`}
                >
                  {letter.status === 'available' ? 'Reservar Oferta' : 'Indisponível'}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pagination Controls - Dark Premium Edition */}
      {totalPages > 1 ? (
        <div className="flex justify-center flex-wrap items-center mt-12 mb-6 gap-2 sm:gap-4 relative z-20">
          <button 
            onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo(0, 0); }}
            disabled={currentPage === 1}
            className="px-5 py-3 rounded-xl border border-white/10 text-white/70 font-bold text-xs uppercase tracking-widest hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          >
            Anterior
          </button>
          <div className="flex flex-wrap gap-2 justify-center max-w-[50vw]">
            {Array.from({ length: totalPages }).map((_, i) => {
              if (i === 0 || i === totalPages - 1 || (i >= currentPage - 2 && i <= currentPage)) {
                return (
                  <button
                    key={i}
                    onClick={() => { setCurrentPage(i + 1); window.scrollTo(0, 0); }}
                    className={`min-w-[40px] h-[40px] px-2 rounded-xl font-black text-sm transition-all ${currentPage === i + 1 ? 'bg-[var(--brand-gold)] text-[#081728] shadow-[0_4px_15px_rgba(217,173,87,0.3)] border-transparent' : 'bg-transparent border border-white/10 text-white/70 hover:bg-white/5'}`}
                  >
                    {i + 1}
                  </button>
                );
              }
              if (i === 1 && currentPage > 3) return <span key={i} className="px-2 text-white/30 self-center">...</span>;
              if (i === totalPages - 2 && currentPage < totalPages - 2) return <span key={i} className="px-2 text-white/30 self-center">...</span>;
              return null;
            })}
          </div>
          <button 
            onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo(0, 0); }}
            disabled={currentPage === totalPages}
            className="px-5 py-3 rounded-xl border border-white/10 text-white/70 font-bold text-xs uppercase tracking-widest hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          >
            Próxima
          </button>
        </div>
      ) : null}

      {/* Email capture modal */}
      <AnimatePresence>
        {showEmailCapture ? (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowEmailCapture(false); setPendingReserveId(null); if (!isUnlocked) setFichaLetter(null); }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="relative w-full max-w-md p-3 sm:p-4">
              <div className="bg-white rounded-[1.5rem] p-3 sm:p-6 shadow-2xl border border-slate-100">
                <div className="flex justify-end mb-1 sm:mb-2">
                  <button onClick={() => { setShowEmailCapture(false); setPendingReserveId(null); if (!isUnlocked) setFichaLetter(null); }} className="text-slate-400 hover:text-slate-900"><X size={20} /></button>
                </div>
                <EmailCapture onSuccess={() => {
                  localStorage.setItem('letters_unlocked', 'true');
                  setIsUnlocked(true);
                  setShowEmailCapture(false);
                  if (pendingReserveId) {
                    reserveLetter(pendingReserveId);
                    setPendingReserveId(null);
                  }
                }} />
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      {/* Carta Ficha modal */}
      {fichaLetter ? <CartaFicha letter={fichaLetter} onClose={() => {
        if (!isUnlocked && showEmailCapture) return;
        setFichaLetter(null);
      }} /> : null}

      {/* WhatsApp VIP Modal - only when unlocked */}
      {showWhatsappVipCta && isUnlocked ? (
        <WhatsappVipModal 
          isOpen={showWhatsappVipCta}
          onClose={() => setShowWhatsappVipCta(false)}
        />
      ) : null}
      </div> {/* end blur wrapper */}
    </div>
  );
};

export default ContemplatedLetters;
