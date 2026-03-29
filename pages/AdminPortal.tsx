import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, FileText, LayoutDashboard, Search, Plus, Edit, CheckCircle2, Trash2,
  X, BarChart2, Upload, Download, RefreshCw, Send, Tag, LayoutGrid,
  SlidersHorizontal, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Filter, Mail,
  Clock, Calendar, CalendarCheck, Lock
} from 'lucide-react';
import { db, auth } from '../firebase';
import { getDoc } from 'firebase/firestore';
import {
  collection, getDocs, query, orderBy, doc, updateDoc,
  deleteDoc, addDoc, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { Simulation, ContemplatedLetter, UserProfile, AdminNote } from '../types';
import demoLettersData from '../data/defaultLetters.json';
import SimulacaoFicha from '../components/SimulacaoFicha';
import CartaFicha from '../components/CartaFicha';
import ExcelJS from 'exceljs';

type TabType = 'dashboard' | 'simulations' | 'letters' | 'users' | 'contacts';

const fmtBRL = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

const simProtocol = (id?: string) =>
  `SIM-${(id || '').slice(-6).toUpperCase().padStart(6, '0')}`;

// Map xlsx columns (Portuguese) â†’ ContemplatedLetter fields
const XLS_MAP: Record<string, keyof ContemplatedLetter> = {
  'cÃ³digo':              'code',
  'codigo':              'code',
  'nome/bem':            'name',
  'nome':                'name',
  'categoria':           'category',
  'crÃ©dito (r$)':        'credit',
  'credito (r$)':        'credit',
  'crÃ©dito':             'credit',
  'credito':             'credit',
  'entrada (r$)':        'entry',
  'entrada':             'entry',
  'qtd parcelas':        'installmentsCount',
  'parcelas':            'installmentsCount',
  'valor parcela (r$)':  'installmentValue',
  'valor da parcela (r$)': 'installmentValue',
  'valor parcela':       'installmentValue',
  'taxa transferÃªncia (r$)': 'transferFee',
  'taxa de transferÃªncia (r$)': 'transferFee',
  'taxa transferencia (r$)': 'transferFee',
  'taxa transferencia':  'transferFee',
  'saldo devedor (r$)':  'saldoDevedor',
  'saldo devedor':       'saldoDevedor',
  'grupo':               'group',
  'administradora':      'administrator',
  'status':              'status',
  'fundo comum':         'fundoComum',
  'ref. garantia':       'refGarantia',
  'seguro':              'insurance',
  'Ã­ndice reajuste':     'reajusteIndex',
  'indice reajuste':     'reajusteIndex',
  'telefone contato':    'contactPhone',
  'email contato':       'contactEmail',
  'observaÃ§Ãµes':         'observations',
  'observacoes':         'observations',
};

const normalizeStatus = (v: string): ContemplatedLetter['status'] => {
  const s = String(v).toLowerCase().trim();
  if (s === 'disponivel' || s === 'disponÃ­vel' || s === 'available') return 'available';
  if (s === 'reservada' || s === 'reserved') return 'reserved';
  return 'sold';
};

const normalizeCategory = (v: string): ContemplatedLetter['category'] => {
  const s = String(v).trim();
  if (s === 'ImÃ³vel' || s === 'imovel' || s.toLowerCase() === 'imÃ³vel') return 'ImÃ³vel';
  if (s.toLowerCase() === 'caminhÃ£o' || s.toLowerCase() === 'caminhao') return 'CaminhÃ£o';
  if (s.toLowerCase() === 'giro') return 'Giro';
  return 'Carro';
};

// â”€â”€â”€ Demo data shown when Firebase is unavailable or collections are empty â”€â”€â”€â”€
// Helper: create a mock Timestamp-like object N days from now
const _ts = (daysOffset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return { seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 };
};

const DEMO_SIMULATIONS: Simulation[] = [
  { id: 'demo-1', type: 'ImÃ³vel', creditAmount: 350000, userName: 'Carlos Eduardo Silva', userPhone: '(11) 98765-4321', userEmail: 'carlos.silva@email.com', createdAt: null, status: 'analyzed', sentAt: _ts(-20) as any, sentBy: 'whatsapp', nextContactAt: _ts(-5) as any, lastActivity: 'CotaÃ§Ã£o enviada via WhatsApp' },
  { id: 'demo-2', type: 'ImÃ³vel', creditAmount: 250000, userName: 'Ana Paula Ferreira', userPhone: '(21) 99876-5432', userEmail: 'ana.ferreira@email.com', createdAt: null, status: 'analyzed', sentAt: _ts(-10) as any, sentBy: 'email', nextContactAt: _ts(5) as any, lastActivity: 'CotaÃ§Ã£o enviada via E-mail' },
  { id: 'demo-3', type: 'ImÃ³vel', creditAmount: 180000, userName: 'Roberto Mendes', userPhone: '(31) 97654-3210', userEmail: 'roberto.mendes@email.com', createdAt: null, status: 'completed', sentAt: _ts(-30) as any, sentBy: 'whatsapp', nextContactAt: _ts(-15) as any, lastActivity: 'CotaÃ§Ã£o enviada via WhatsApp' },
  { id: 'demo-4', type: 'ImÃ³vel', creditAmount: 120000, userName: 'Juliana Costa', userPhone: '(41) 96543-2109', userEmail: 'juliana.costa@email.com', createdAt: null, status: 'pending' },
  { id: 'demo-5', type: 'ImÃ³vel', creditAmount: 200000, userName: 'Marcos AntÃ´nio Souza', userPhone: '(51) 95432-1098', userEmail: 'marcos.souza@email.com', createdAt: null, status: 'pending' },
  { id: 'demo-6', type: 'ImÃ³vel', creditAmount: 480000, userName: 'Fernanda Lima', userPhone: '(85) 98888-7777', userEmail: 'fernanda.lima@email.com', createdAt: null, status: 'analyzed', sentAt: _ts(-3) as any, sentBy: 'email', nextContactAt: _ts(12) as any, lastActivity: 'CotaÃ§Ã£o enviada via E-mail' },
];

const DEMO_LETTERS: ContemplatedLetter[] = demoLettersData as ContemplatedLetter[];

const DEMO_USERS: UserProfile[] = [
  { uid: 'demo-admin', email: 'admin@finance8.com.br', displayName: 'Administrador Finance8', role: 'admin', createdAt: null },
  { uid: 'demo-u1', email: 'carlos.silva@email.com', displayName: 'Carlos Eduardo Silva', role: 'client', createdAt: null },
  { uid: 'demo-u2', email: 'ana.ferreira@email.com', displayName: 'Ana Paula Ferreira', role: 'client', createdAt: null },
  { uid: 'demo-u3', email: 'roberto.mendes@email.com', displayName: 'Roberto Mendes', role: 'client', createdAt: null },
  { uid: 'demo-u4', email: 'juliana.costa@email.com', displayName: 'Juliana Costa', role: 'client', createdAt: null },
];

const AdminPortal: React.FC = () => {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [letters, setLetters] = useState<ContemplatedLetter[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLetterModalOpen, setIsLetterModalOpen] = useState(false);
  const [editingLetter, setEditingLetter] = useState<ContemplatedLetter | null>(null);
  const [letterForm, setLetterForm] = useState<Partial<ContemplatedLetter>>({});
  const [selectedSimulation, setSelectedSimulation] = useState<Simulation | null>(null);
  const [selectedCartaFicha, setSelectedCartaFicha] = useState<ContemplatedLetter | null>(null);
  const [crmNotes, setCrmNotes] = useState<AdminNote[]>([]);
  const [crmModalOpen, setCrmModalOpen] = useState(false);
  const [crmTarget, setCrmTarget] = useState<{
    type: 'simulation' | 'user';
    id: string;
    name: string;
    email?: string;
    phone?: string;
  } | null>(null);
  const [crmNoteText, setCrmNoteText] = useState('');
  const [crmDueDate, setCrmDueDate] = useState('');
  const [importStatus, setImportStatus] = useState('');
  const [letterViewMode, setLetterViewMode] = useState<'list' | 'grid'>('list');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [lettersPage, setLettersPage] = useState(1);
  const lettersPerPage = 12;

  useEffect(() => {
    setLettersPage(1);
  }, [searchTerm]);

  const filteredLettersAdmin = letters.filter(l =>
    l.administrator?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.group?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const lettersTotalPages = Math.ceil(filteredLettersAdmin.length / lettersPerPage);
  const paginatedLettersAdmin = filteredLettersAdmin.slice((lettersPage - 1) * lettersPerPage, lettersPage * lettersPerPage);

  // â”€â”€â”€ Dashboard filter state â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [showDashFilters, setShowDashFilters] = useState(false);
  const [dashFilterUser, setDashFilterUser] = useState('');
  const [dashFilterDateFrom, setDashFilterDateFrom] = useState('');
  const [dashFilterDateTo, setDashFilterDateTo] = useState('');
  const [dashFilterSimTypes, setDashFilterSimTypes] = useState<string[]>([]);
  const [dashFilterSimStatus, setDashFilterSimStatus] = useState<string[]>([]);
  const [dashFilterLetterCats, setDashFilterLetterCats] = useState<string[]>([]);
  const [dashFilterLetterStatus, setDashFilterLetterStatus] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log('[AdminPortal] Fetching simulations...');
      const simSnap = await getDocs(collection(db, 'simulations'));
      console.log('[AdminPortal] Simulations received:', simSnap.size);
      const fetchedSims = simSnap.docs.map(d => ({ id: d.id, ...d.data() } as Simulation));
      fetchedSims.sort((a, b) => {
        const ta = (a.createdAt && (a.createdAt as any).seconds) ? (a.createdAt as any).seconds : 0;
        const tb = (b.createdAt && (b.createdAt as any).seconds) ? (b.createdAt as any).seconds : 0;
        return tb - ta;
      });
      setSimulations(fetchedSims);

      console.log('[AdminPortal] Fetching letters...');
      const letSnap = await getDocs(collection(db, 'contemplated_letters'));
      console.log('[AdminPortal] Letters received:', letSnap.size);
      const fetchedLetters = letSnap.docs.map(d => ({ id: d.id, ...d.data() } as ContemplatedLetter));
      setLetters(fetchedLetters.length > 0 ? fetchedLetters : DEMO_LETTERS);

      console.log('[AdminPortal] Fetching users...');
      const usrSnap = await getDocs(collection(db, 'users'));
      console.log('[AdminPortal] Users received:', usrSnap.size);
      const fetchedUsers = usrSnap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
      setUsers(fetchedUsers);

      console.log('[AdminPortal] Fetching CRM notes...');
      const notesSnap = await getDocs(collection(db, 'crm_notes'));
      const fetchedNotes = notesSnap.docs.map(d => ({ id: d.id, ...d.data() } as AdminNote));
      setCrmNotes(fetchedNotes);

    } catch (err: any) {
      console.error('[AdminPortal] Fetch error:', err.code, err.message);
      setFetchError(`Erro Firebase (${err.code || 'unknown'}): ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isUnlocked) return;
    fetchData();
  }, [isUnlocked]);

  const markSimSent = async (sim: Simulation, channel: 'whatsapp' | 'email') => {
    const nowDate = new Date();
    const nextContactDate = new Date(nowDate.getTime() + 15 * 24 * 60 * 60 * 1000);
    const nowTs = { seconds: Math.floor(nowDate.getTime() / 1000), nanoseconds: 0 };
    const nextTs = { seconds: Math.floor(nextContactDate.getTime() / 1000), nanoseconds: 0 };
    const activityDesc = `CotaÃ§Ã£o enviada via ${channel === 'whatsapp' ? 'WhatsApp' : 'E-mail'}`;

    // Optimistic local state update (works for demo data too)
    setSimulations(prev => prev.map(s => s.id === sim.id ? {
      ...s, 
      status: 'analyzed',
      sentAt: nowTs as any, 
      sentBy: channel,
      nextContactAt: nextTs as any, 
      lastActivity: activityDesc,
    } : s));

    if (!sim.id || sim.id.startsWith('demo-')) return;

    try {
      await updateDoc(doc(db, 'simulations', sim.id), {
        status: 'analyzed',
        sentAt: serverTimestamp(),
        sentBy: channel,
        nextContactAt: nextContactDate,
        lastActivity: activityDesc,
      });
      // Update user last activity (best-effort)
      if (sim.userId) {
        const protocol = simProtocol(sim.id);
        updateDoc(doc(db, 'users', sim.userId), {
          lastActivityAt: serverTimestamp(),
          lastActivityDesc: `${activityDesc} â€” ${protocol}, ${sim.type}, ${fmtBRL(sim.creditAmount)}`,
        }).catch(() => {});
      }
    } catch (err) { console.error('Erro ao registrar envio:', err); }
  };

  const sendWhatsApp = async (sim: Simulation) => {
    const phone = sim.userPhone?.replace(/\D/g, '') || '';
    const msg = `OlÃ¡ ${sim.userName}, segue sua cotaÃ§Ã£o: Tipo: ${sim.type} - Valor: ${fmtBRL(sim.creditAmount)}. ID: ${sim.id}`;
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
      await markSimSent(sim, 'whatsapp');
    } else if (sim.userEmail) {
      window.open(`mailto:${sim.userEmail}?subject=Sua cotaÃ§Ã£o&body=${encodeURIComponent(msg)}`);
      await markSimSent(sim, 'whatsapp');
    } else { 
      alert('Nenhum contato disponÃ­vel.');
    }
  };

  const sendEmailSim = async (sim: Simulation) => {
    if (!sim.userEmail) { alert('E-mail do cliente nÃ£o cadastrado.'); return; }
    const subject = encodeURIComponent(`Sua cotaÃ§Ã£o de consÃ³rcio â€” ${sim.type}`);
    const body = encodeURIComponent(
      `OlÃ¡ ${sim.userName},\n\nSegue sua cotaÃ§Ã£o conforme solicitado:\n\nTipo: ${sim.type}\nCrÃ©dito: ${fmtBRL(sim.creditAmount)}\nID: ${sim.id}\n\nAtenciosamente,\nFinance8 CrÃ©dito & ConsÃ³rcio`
    );
    window.open(`mailto:${sim.userEmail}?subject=${subject}&body=${body}`, '_blank');
    await markSimSent(sim, 'email');
  };

  const isContactDue = (sim: Simulation) => {
    if (!sim.nextContactAt) return false;
    const ts = (sim.nextContactAt as any).seconds;
    if (!ts) {
        // Fallback para caso seja date puro (Timestamp toDate ou Date object injetado pelo react state)
        if (typeof (sim.nextContactAt as any).getTime === 'function') {
           return (sim.nextContactAt as any).getTime() <= Date.now();
        }
        return false;
    }
    return ts * 1000 <= Date.now();
  };

  const daysUntilContact = (sim: Simulation) => {
    if (!sim.nextContactAt) return 0;
    let ts = (sim.nextContactAt as any).seconds;
    if (ts) {
        ts = ts * 1000;
    } else {
        if (typeof (sim.nextContactAt as any).getTime === 'function') {
            ts = (sim.nextContactAt as any).getTime();
        } else {
            return 0;
        }
    }
    return Math.max(0, Math.ceil((ts - Date.now()) / (1000 * 60 * 60 * 24)));
  };

  const sendFollowUpWhatsApp = (sim: Simulation) => {
    const phone = sim.userPhone?.replace(/\D/g, '') || '';
    const protocol = simProtocol(sim.id);
    const msg = `OlÃ¡ ${sim.userName}, tudo bem? Passando para retornar sobre a cotaÃ§Ã£o ${protocol} (${sim.type} â€” ${fmtBRL(sim.creditAmount)}). Podemos conversar?`;
    if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    else if (sim.userEmail) {
      const subject = encodeURIComponent(`Retorno â€” CotaÃ§Ã£o ${protocol}`);
      const body = encodeURIComponent(`OlÃ¡ ${sim.userName},\n\nPassando para retornar sobre a cotaÃ§Ã£o ${protocol} (${sim.type} â€” ${fmtBRL(sim.creditAmount)}).\n\nAguardo seu contato.\n\nAtenciosamente,\nFinance8 CrÃ©dito & ConsÃ³rcio`);
      window.open(`mailto:${sim.userEmail}?subject=${subject}&body=${body}`, '_blank');
    }
  };

  const simStatusLabel = (status: string) => {
    if (status === 'pending') return 'NÃ£o Enviada';
    if (status === 'analyzed') return 'Enviada';
    return 'ConcluÃ­da';
  };

  const deleteSimulation = async (sim: Simulation) => {
    if (!window.confirm(`Excluir cotaÃ§Ã£o de ${sim.userName}? Esta aÃ§Ã£o nÃ£o pode ser desfeita.`)) return;
    setSimulations(prev => prev.filter(s => s.id !== sim.id));
    if (!sim.id || sim.id.startsWith('demo-')) return;
    try {
      await deleteDoc(doc(db, 'simulations', sim.id));
    } catch (err) { console.error('Erro ao excluir simulaÃ§Ã£o:', err); }
  };

  const deleteUser = async (user: UserProfile) => {
    if (!window.confirm(`Excluir usuÃ¡rio ${user.displayName || user.email}? Esta aÃ§Ã£o nÃ£o pode ser desfeita.`)) return;
    setUsers(prev => prev.filter(u => u.uid !== user.uid));
    if (!user.uid || user.uid.startsWith('demo-')) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid));
    } catch (err) { console.error('Erro ao excluir usuÃ¡rio:', err); }
  };

  const contactUserWhatsApp = (user: UserProfile) => {
    const phone = (user as any).phone?.replace(/\D/g, '') || '';
    const msg = `OlÃ¡ ${user.displayName || ''}! Aqui Ã© da Finance8 CrÃ©dito & ConsÃ³rcio. Tudo bem?`;
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    } else {
      alert('NÃºmero de WhatsApp nÃ£o cadastrado para este usuÃ¡rio.');
    }
  };

  const contactUserEmail = (user: UserProfile) => {
    if (!user.email) { alert('E-mail nÃ£o cadastrado.'); return; }
    const subject = encodeURIComponent('Finance8 CrÃ©dito & ConsÃ³rcio - Contato');
    const body = encodeURIComponent(`OlÃ¡ ${user.displayName || ''},\n\nEntramos em contato para...\n\nAtenciosamente,\nFinance8 CrÃ©dito & ConsÃ³rcio`);
    window.open(`mailto:${user.email}?subject=${subject}&body=${body}`, '_blank');
  };

  const openCrmModal = (target: {
    type: 'simulation' | 'user';
    id: string;
    name: string;
    email?: string;
    phone?: string;
  }) => {
    setCrmTarget(target);
    setCrmNoteText('');
    setCrmDueDate('');
    setCrmModalOpen(true);
  };

  const notesForTarget = crmTarget
    ? crmNotes.filter((note) => note.targetType === crmTarget.type && note.targetId === crmTarget.id)
    : [];

  const saveCrmNote = async () => {
    if (!crmTarget || !crmNoteText.trim()) return;

    const localNote: AdminNote = {
      id: `local-${Date.now()}`,
      targetType: crmTarget.type,
      targetId: crmTarget.id,
      targetName: crmTarget.name,
      targetEmail: crmTarget.email,
      targetPhone: crmTarget.phone,
      note: crmNoteText.trim(),
      dueDate: crmDueDate || '',
      status: 'open',
      createdAt: null,
    };

    setCrmNotes((prev) => [localNote, ...prev]);
    setCrmNoteText('');
    setCrmDueDate('');

    try {
      const ref = await addDoc(collection(db, 'crm_notes'), {
        ...localNote,
        createdAt: serverTimestamp(),
      });
      setCrmNotes((prev) => prev.map((note) => note.id === localNote.id ? { ...note, id: ref.id } : note));
    } catch (err) {
      console.error('Erro ao salvar anotacao CRM:', err);
    }
  };

  const toggleCrmNoteStatus = async (note: AdminNote) => {
    const nextStatus: AdminNote['status'] = note.status === 'open' ? 'done' : 'open';
    setCrmNotes((prev) => prev.map((item) => item.id === note.id ? { ...item, status: nextStatus } : item));

    if (!note.id || note.id.startsWith('local-')) return;

    try {
      await updateDoc(doc(db, 'crm_notes', note.id), { status: nextStatus });
    } catch (err) {
      console.error('Erro ao atualizar status da anotacao:', err);
    }
  };

  const simStatusBadge = (status: string) => {
    if (status === 'pending') return 'bg-red-100 text-red-600';
    if (status === 'analyzed') return 'bg-blue-100 text-blue-600';
    return 'bg-emerald-100 text-emerald-600';
  };

  const openNewLetterModal = () => {
    setEditingLetter(null);
    setLetterForm({ category: 'Carro', status: 'available' });
    setIsLetterModalOpen(true);
  };
  const openEditLetterModal = (l: ContemplatedLetter) => {
    setEditingLetter(l);
    setLetterForm({ ...l });
    setIsLetterModalOpen(true);
  };
  const handleLetterFormChange = (key: keyof ContemplatedLetter, value: any) => {
    setLetterForm(prev => ({ ...prev, [key]: value }));
  };
  const saveLetter = async () => {
    try {
      if (editingLetter) {
        await updateDoc(doc(db, 'contemplated_letters', editingLetter.id), { ...letterForm });
        setLetters(prev => prev.map(l => l.id === editingLetter.id ? ({ ...l, ...(letterForm as any) }) : l));
      } else {
        const newDoc = await addDoc(collection(db, 'contemplated_letters'), {
          ...letterForm, createdAt: serverTimestamp()
        });
        setLetters(prev => [{ id: newDoc.id, ...(letterForm as any) } as ContemplatedLetter, ...prev]);
      }
      setIsLetterModalOpen(false);
      setEditingLetter(null);
      setLetterForm({});
    } catch (err) { console.error(err); }
  };
  const removeLetter = async (id: string) => {
    if (!confirm('Excluir esta carta? Esta aÃ§Ã£o Ã© irreversÃ­vel.')) return;
    try {
      await deleteDoc(doc(db, 'contemplated_letters', id));
      setLetters(prev => prev.filter(l => l.id !== id));
    } catch (err) { console.error(err); }
  };

  const toggleDashFilter = (
    arr: string[],
    setArr: React.Dispatch<React.SetStateAction<string[]>>,
    val: string
  ) => setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);

  const clearDashFilters = () => {
    setDashFilterUser('');
    setDashFilterDateFrom('');
    setDashFilterDateTo('');
    setDashFilterSimTypes([]);
    setDashFilterSimStatus([]);
    setDashFilterLetterCats([]);
    setDashFilterLetterStatus([]);
  };

  // â”€â”€â”€ XLSX Export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const exportLettersXlsx = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Cartas DisponÃ­veis');
    ws.columns = [
      { header: 'CÃ³digo', key: 'code', width: 12 },
      { header: 'Nome/Bem', key: 'name', width: 25 },
      { header: 'Categoria', key: 'category', width: 12 },
      { header: 'CrÃ©dito (R$)', key: 'credit', width: 14 },
      { header: 'Entrada (R$)', key: 'entry', width: 14 },
      { header: 'Qtd Parcelas', key: 'installmentsCount', width: 13 },
      { header: 'Valor Parcela (R$)', key: 'installmentValue', width: 17 },
      { header: 'Taxa TransferÃªncia (R$)', key: 'transferFee', width: 20 },
      { header: 'Saldo Devedor (R$)', key: 'saldoDevedor', width: 17 },
      { header: 'Fundo comum (R$)', key: 'fundoComum', width: 17 },
      { header: 'Ref. garantia (R$)', key: 'refGarantia', width: 17 },
      { header: 'Grupo', key: 'group', width: 20 },
      { header: 'Administradora', key: 'administrator', width: 18 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Seguro', key: 'insurance', width: 14 },
      { header: 'Ãndice Reajuste', key: 'reajusteIndex', width: 15 },
      { header: 'Telefone Contato', key: 'contactPhone', width: 18 },
      { header: 'Email Contato', key: 'contactEmail', width: 25 },
      { header: 'ObservaÃ§Ãµes', key: 'observations', width: 25 },
    ];

    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF065F46' } };
    headerRow.height = 22;

    const filteredLetters = letters.filter(l =>
      l.administrator?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.group?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filteredLetters.forEach((l, i) => {
      const row = ws.addRow({
        code: l.code || '', name: l.name || '', category: l.category,
        credit: l.credit, entry: l.entry,
        installmentsCount: l.installmentsCount, installmentValue: l.installmentValue,
        transferFee: l.transferFee, saldoDevedor: l.saldoDevedor || '',
        fundoComum: l.fundoComum ?? '', refGarantia: l.refGarantia ?? '',
        group: l.group, administrator: l.administrator,
        status: l.status === 'available' ? 'disponivel' : l.status === 'reserved' ? 'reservada' : 'vendida',
        insurance: l.insurance || '', reajusteIndex: l.reajusteIndex || '',
        contactPhone: l.contactPhone || '', contactEmail: l.contactEmail || '',
        observations: l.observations || '',
      });
      if (i % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
      }
    });

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'cartas_disponiveis.xlsx'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportSimulationsXlsx = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('SimulaÃ§Ãµes');
    ws.columns = [
      { header: 'ID', key: 'id', width: 20 },
      { header: 'Nome', key: 'userName', width: 30 },
      { header: 'Email', key: 'userEmail', width: 30 },
      { header: 'Telefone', key: 'userPhone', width: 18 },
      { header: 'Tipo', key: 'type', width: 12 },
      { header: 'CrÃ©dito (R$)', key: 'creditAmount', width: 14 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Criado Em', key: 'createdAt', width: 20 },
      { header: 'Enviado Em', key: 'sentAt', width: 20 },
    ];

    simulations.forEach(s => {
      ws.addRow({
        id: s.id, userName: s.userName || '', userEmail: s.userEmail || '', userPhone: s.userPhone || '',
        type: s.type || '', creditAmount: s.creditAmount || 0, status: s.status || '',
        createdAt: s.createdAt ? new Date((s.createdAt as any).seconds * 1000).toLocaleString() : '',
        sentAt: s.sentAt ? new Date((s.sentAt as any).seconds * 1000).toLocaleString() : ''
      });
    });

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'simulacoes.xlsx'; a.click(); URL.revokeObjectURL(url);
  };

  const exportUsersXlsx = async () => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Usuarios');
    ws.columns = [
      { header: 'UID', key: 'uid', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Nome', key: 'displayName', width: 25 },
      { header: 'Role', key: 'role', width: 12 },
      { header: 'Criado Em', key: 'createdAt', width: 20 },
    ];

    users.forEach(u => {
      ws.addRow({ uid: u.uid, email: u.email || '', displayName: u.displayName || '', role: u.role || '', createdAt: u.createdAt ? new Date((u.createdAt as any).seconds * 1000).toLocaleString() : '' });
    });

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'usuarios.xlsx'; a.click(); URL.revokeObjectURL(url);
  };

  // â”€â”€â”€ XLSX Import â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleXlsxImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus('Lendo arquivo...');
    try {
      const ab = await file.arrayBuffer();
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(ab);
      const ws = wb.worksheets[0];
      if (!ws) throw new Error('Planilha vazia');

      // Read headers from row 1
      const headers: string[] = [];
      ws.getRow(1).eachCell((cell) => {
        headers.push(String(cell.value || '').toLowerCase().trim());
      });

      const imported: Omit<ContemplatedLetter, 'id'>[] = [];
      ws.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        const obj: any = {};
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const header = headers[colNumber - 1];
          const field = XLS_MAP[header];
          if (field) {
            let val: any = cell.value;
            if (val && typeof val === 'object' && 'result' in val) val = val.result;
            obj[field] = val ?? '';
          }
        });
        if (!obj.category && !obj.credit) return;
        const row_data: Omit<ContemplatedLetter, 'id'> = {
          code: obj.code || '',
          name: obj.name || '',
          category: normalizeCategory(obj.category || 'Carro'),
          credit: Number(obj.credit) || 0,
          entry: Number(obj.entry) || 0,
          installmentsCount: Number(obj.installmentsCount) || 0,
          installmentValue: Number(obj.installmentValue) || 0,
          transferFee: Number(obj.transferFee) || 0,
          saldoDevedor: obj.saldoDevedor != null && obj.saldoDevedor !== '' ? Number(obj.saldoDevedor) : null,
          fundoComum: obj.fundoComum != null && obj.fundoComum !== '' ? Number(obj.fundoComum) : null,
          refGarantia: obj.refGarantia != null && obj.refGarantia !== '' ? Number(obj.refGarantia) : null,
          group: obj.group || '',
          administrator: obj.administrator || '',
          status: normalizeStatus(obj.status || 'disponivel'),
          insurance: obj.insurance ?? null,
          reajusteIndex: obj.reajusteIndex ?? null,
          contactPhone: obj.contactPhone ?? null,
          contactEmail: obj.contactEmail ?? null,
          observations: obj.observations ?? null,
        };
        imported.push(row_data);
      });

      if (imported.length === 0) throw new Error('Nenhuma linha vÃ¡lida encontrada.');

      setImportStatus(`Importando ${imported.length} cartas...`);
      const batch = writeBatch(db);
      const newLetters: ContemplatedLetter[] = [];
      for (const item of imported) {
        const ref = doc(collection(db, 'contemplated_letters'));
        batch.set(ref, { ...item, createdAt: serverTimestamp() });
        newLetters.push({ id: ref.id, ...item });
      }
      await batch.commit();
      setLetters(prev => [...newLetters, ...prev]);
      setImportStatus(`âœ“ ${imported.length} cartas importadas com sucesso!`);
      setTimeout(() => setImportStatus(''), 5000);
    } catch (err: any) {
      setImportStatus(`Erro: ${err.message}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // â”€â”€â”€ Dashboard stats (filtered) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const dashSims = simulations.filter(s => {
    if (dashFilterUser && !s.userName?.toLowerCase().includes(dashFilterUser.toLowerCase()) && !s.userEmail?.toLowerCase().includes(dashFilterUser.toLowerCase())) return false;
    if (dashFilterSimTypes.length > 0 && !dashFilterSimTypes.includes(s.type)) return false;
    if (dashFilterSimStatus.length > 0 && !dashFilterSimStatus.includes(s.status)) return false;
    if (dashFilterDateFrom) {
      const ts = s.createdAt ? (s.createdAt as any).seconds * 1000 : null;
      if (!ts || ts < new Date(dashFilterDateFrom).getTime()) return false;
    }
    if (dashFilterDateTo) {
      const ts = s.createdAt ? (s.createdAt as any).seconds * 1000 : null;
      if (!ts || ts > new Date(dashFilterDateTo + 'T23:59:59').getTime()) return false;
    }
    return true;
  });
  const dashLetters = letters.filter(l => {
    if (dashFilterLetterCats.length > 0 && !dashFilterLetterCats.includes(l.category)) return false;
    if (dashFilterLetterStatus.length > 0 && !dashFilterLetterStatus.includes(l.status)) return false;
    return true;
  });
  const dashSimByStatus = {
    pending: dashSims.filter(s => s.status === 'pending').length,
    analyzed: dashSims.filter(s => s.status === 'analyzed').length,
    completed: dashSims.filter(s => s.status === 'completed').length,
  };
  const dashSimByType = dashSims.reduce<Record<string, number>>((acc, s) => {
    acc[s.type] = (acc[s.type] || 0) + 1;
    return acc;
  }, {});
  const dashSimByTypeSorted = (Object.entries(dashSimByType) as [string, number][]).sort((a, b) => b[1] - a[1]);
  const dashMaxSimByType = dashSimByTypeSorted[0]?.[1] || 1;
  const dashLetByStatus = {
    available: dashLetters.filter(l => l.status === 'available').length,
    reserved: dashLetters.filter(l => l.status === 'reserved').length,
    sold: dashLetters.filter(l => l.status === 'sold').length,
  };
  const activeFilterCount =
    (dashFilterUser ? 1 : 0) +
    (dashFilterDateFrom ? 1 : 0) +
    (dashFilterDateTo ? 1 : 0) +
    dashFilterSimTypes.length +
    dashFilterSimStatus.length +
    dashFilterLetterCats.length +
    dashFilterLetterStatus.length;

  // â”€â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-emerald-600/20 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center bg-slate-50">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-2xl border border-slate-100 max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <Lock size={32} />
          </div>

          <div>
            <h2 className="text-2xl font-black text-emerald-900 uppercase italic tracking-tighter">Acesso Restrito</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Insira a senha do administrador</p>
          </div>

          <form onSubmit={(e) => {
            e.preventDefault();
            if (adminPassword === 'elis123') setIsUnlocked(true);
            else setPwdError('Senha incorreta. Tente novamente.');
          }} className="space-y-4">
            <input
              type="password"
              placeholder="Senha"
              value={adminPassword}
              onChange={(e) => { setAdminPassword(e.target.value); setPwdError(''); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 px-4 text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-black tracking-widest"
            />
            {pwdError && <p className="text-xs font-bold text-red-500">{pwdError}</p>}
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all text-sm uppercase tracking-widest"
            >
              Autenticar
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const TABS: { key: TabType; label: string }[] = [
    { key: 'dashboard', label: 'Painel' },
    { key: 'simulations', label: 'SimulaÃ§Ãµes' },
    { key: 'letters', label: 'Cartas' },
    { key: 'users', label: 'UsuÃ¡rios' },
    { key: 'contacts', label: 'PrÃ³ximos Contatos' },
  ];

  return (
    <div className="relative min-h-screen w-full bg-slate-50 text-slate-900 z-10">
      <div className="pt-40 pb-20 px-3 sm:px-6 max-w-7xl mx-auto space-y-6">
        {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tighter uppercase italic">
            Painel Administrativo
          </h2>
          <p className="text-slate-500 text-sm font-medium">Gerencie simulaÃ§Ãµes, cartas e usuÃ¡rios</p>
        </div>
        <button
          onClick={() => { setFetchError(''); fetchData(); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm font-black hover:bg-slate-50 transition-colors self-start sm:self-auto"
        >
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>

      {/* Firebase status banner */}
      {fetchError ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3 text-sm text-red-700 font-medium flex items-start gap-2">
          <span className="font-black">Erro Firebase:</span> {fetchError}
          <span className="text-xs ml-2 opacity-60">(Verifique as Regras do Firestore)</span>
        </div>
      ) : !loading && isUnlocked && simulations.length === 0 && users.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3 text-sm text-amber-700 font-medium">
          âš ï¸ Firebase retornou 0 simulaÃ§Ãµes e 0 usuÃ¡rios. Verifique se as <strong>Regras do Firestore</strong> permitem leitura sem autenticaÃ§Ã£o, e se realmente existem dados nas coleÃ§Ãµes <code>simulations</code> e <code>users</code> no painel do Firebase.
        </div>
      ) : !loading && isUnlocked ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3 text-sm text-emerald-700 font-medium">
          âœ… Firebase carregado: <strong>{simulations.length}</strong> simulaÃ§Ãµes Â· <strong>{users.length}</strong> usuÃ¡rios
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 bg-white border border-slate-200 p-1.5 rounded-2xl shadow-sm no-scrollbar">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-shrink-0 px-4 sm:px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === t.key
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-400 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* â”€â”€ DASHBOARD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">

          {/* â”€â”€ Filter Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <button
              onClick={() => setShowDashFilters(p => !p)}
              className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-emerald-600" />
                <span className="font-black text-sm uppercase tracking-widest text-slate-700">Filtros do Painel</span>
                {activeFilterCount > 0 && (
                  <span className="bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {activeFilterCount} ativo{activeFilterCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              {showDashFilters
                ? <ChevronUp size={16} className="text-slate-400" />
                : <ChevronDown size={16} className="text-slate-400" />}
            </button>

            {showDashFilters && (
              <div className="px-6 pb-6 border-t border-slate-100 pt-5 space-y-5">

                {/* PerÃ­odo */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">PerÃ­odo</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">De</label>
                      <input
                        type="date"
                        value={dashFilterDateFrom}
                        onChange={e => setDashFilterDateFrom(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">AtÃ©</label>
                      <input
                        type="date"
                        value={dashFilterDateTo}
                        onChange={e => setDashFilterDateTo(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* UsuÃ¡rio */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">UsuÃ¡rio / Cliente</p>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={dashFilterUser}
                      onChange={e => setDashFilterUser(e.target.value)}
                      placeholder="Buscar por nome ou e-mail..."
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Tipo de SimulaÃ§Ã£o */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tipo de SimulaÃ§Ã£o</p>
                  <div className="flex flex-wrap gap-2">
                    {(['Carro', 'ImÃ³vel', 'CaminhÃ£o', 'Giro'] as const).map(type => (
                      <button
                        key={type}
                        onClick={() => toggleDashFilter(dashFilterSimTypes, setDashFilterSimTypes, type)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                          dashFilterSimTypes.includes(type)
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status da SimulaÃ§Ã£o */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status da SimulaÃ§Ã£o</p>
                  <div className="flex flex-wrap gap-2">
                    {([{ key: 'pending', label: 'NÃ£o Enviada' }, { key: 'analyzed', label: 'Enviada' }, { key: 'completed', label: 'ConcluÃ­da' }]).map(s => (
                      <button
                        key={s.key}
                        onClick={() => toggleDashFilter(dashFilterSimStatus, setDashFilterSimStatus, s.key)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                          dashFilterSimStatus.includes(s.key)
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Categoria de Carta */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Categoria de Carta</p>
                  <div className="flex flex-wrap gap-2">
                    {(['Carro', 'ImÃ³vel', 'CaminhÃ£o', 'Giro'] as const).map(cat => (
                      <button
                        key={cat}
                        onClick={() => toggleDashFilter(dashFilterLetterCats, setDashFilterLetterCats, cat)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                          dashFilterLetterCats.includes(cat)
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status da Carta */}
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Status da Carta</p>
                  <div className="flex flex-wrap gap-2">
                    {([{ key: 'available', label: 'DisponÃ­vel' }, { key: 'reserved', label: 'Reservada' }, { key: 'sold', label: 'Vendida' }]).map(s => (
                      <button
                        key={s.key}
                        onClick={() => toggleDashFilter(dashFilterLetterStatus, setDashFilterLetterStatus, s.key)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                          dashFilterLetterStatus.includes(s.key)
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Limpar filtros */}
                {activeFilterCount > 0 && (
                  <button
                    onClick={clearDashFilters}
                    className="flex items-center gap-1.5 text-xs font-black text-red-500 hover:text-red-600 transition-colors"
                  >
                    <X size={12} /> Limpar todos os filtros ({activeFilterCount})
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Active filters info bar */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 text-xs text-amber-700 font-bold">
              <Filter size={13} className="flex-shrink-0" />
              <span>
                Filtros ativos â€” exibindo <strong>{dashSims.length}</strong> de {simulations.length} simulaÃ§Ãµes
                {' '}e <strong>{dashLetters.length}</strong> de {letters.length} cartas
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* AtivaÃ§Ãµes */}
            <div className="bg-white border text-center p-6 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4 relative z-10">
                <CheckCircle2 size={28} className="text-emerald-600" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 relative z-10">
                SimulaÃ§Ãµes Realizadas
              </h3>
              <p className="text-4xl font-black text-slate-900 relative z-10">{dashSims.length}</p>
              <div className="absolute -bottom-10 -right-10 text-emerald-500/5">
                <CheckCircle2 size={100} />
              </div>
            </div>

            {/* Volume */}
            <div className="bg-white border text-center p-6 rounded-3xl relative overflow-hidden flex flex-col items-center justify-center col-span-2 lg:col-span-1">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-4 relative z-10">
                <BarChart2 size={28} className="text-blue-600" />
              </div>
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 relative z-10">
                Volume Simulado
              </h3>
              <p className="text-3xl font-black text-slate-900 relative z-10">
                {fmtBRL(dashSims.reduce((acc, curr) => acc + curr.creditAmount, 0))}
              </p>
              <div className="absolute -bottom-10 -right-10 text-blue-500/5">
                <BarChart2 size={100} />
              </div>
            </div>

            <div className="col-span-2 grid grid-cols-2 gap-4">
              {[
                { label: 'NÃ£o Enviadas', value: dashSimByStatus.pending, color: 'bg-red-50 text-red-600' },
                { label: 'Cartas DisponÃ­veis', value: dashLetByStatus.available, color: 'bg-emerald-50 text-emerald-700' },
              ].map(s => (
                <div key={s.label} className={`rounded-3xl p-6 ${s.color} border border-white/50 flex flex-col justify-center`}>
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-70">{s.label}</p>
                  <p className="text-3xl font-black mt-1">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Tipos de SimulaÃ§Ã£o */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Tag size={18} className="text-emerald-600" />
                <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                  Top Tipos (Volume de SimulaÃ§Ãµes)
                </h3>
              </div>
              {dashSimByTypeSorted.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">Nenhuma simulaÃ§Ã£o encontrada.</p>
              ) : (
                <div className="space-y-3">
                  {dashSimByTypeSorted.map(([type, count], i) => (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-400">#{i + 1}</span>
                          <span className="text-sm font-black text-slate-700 bg-slate-100 px-3 py-0.5 rounded-full">
                            {type}
                          </span>
                        </div>
                        <span className="font-black text-slate-900 text-sm">{count}</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${((count as number) / dashMaxSimByType) * 100}%` }}
                          transition={{ duration: 0.6, delay: i * 0.1 }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status das cartas */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <BarChart2 size={18} className="text-emerald-600" />
                <h3 className="font-black text-slate-900 uppercase tracking-tight text-sm">
                  Status das Cartas
                </h3>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'DisponÃ­veis', value: dashLetByStatus.available, color: 'bg-emerald-500', total: dashLetters.length },
                  { label: 'Reservadas', value: dashLetByStatus.reserved, color: 'bg-amber-400', total: dashLetters.length },
                  { label: 'Vendidas', value: dashLetByStatus.sold, color: 'bg-slate-400', total: dashLetters.length },
                ].map((item, i) => (
                  <div key={item.label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-bold text-slate-600">{item.label}</span>
                      <span className="font-black text-slate-900 text-sm">{item.value}</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: item.total ? `${(item.value / item.total) * 100}%` : '0%' }}
                        transition={{ duration: 0.6, delay: i * 0.1 }}
                        className={`h-full ${item.color} rounded-full`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total de usuÃ¡rios</span>
                  <span className="font-black text-slate-900">{users.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">SimulaÃ§Ãµes concluÃ­das</span>
                  <span className="font-black text-slate-900">{dashSimByStatus.completed}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Enviadas ao cliente</span>
                  <span className="font-black text-emerald-600">{dashSimByStatus.analyzed}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions preserved in simulations tab; no public WhatsApp integrations here. */}
        </div>
      )}

      {/* â”€â”€ SIMULATIONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === 'simulations' && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome do cliente..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                    <th className="px-6 py-5">Cliente</th>
                    <th className="px-6 py-5">Tipo</th>
                    <th className="px-6 py-5">CrÃ©dito</th>
                    <th className="px-6 py-5">Data</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-6 py-5">CRM</th>
                    <th className="px-6 py-5 text-right">AÃ§Ãµes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {simulations
                    .filter(s => s.userName?.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(sim => (
                      <tr key={sim.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-5">
                          <p className="font-black text-slate-900 text-sm uppercase">{sim.userName}</p>
                          <p className="text-[10px] text-slate-400">{sim.userEmail}</p>
                        </td>
                        <td className="px-6 py-5">
                          <span className="px-3 py-1 bg-slate-100 rounded-full text-[10px] font-black text-slate-600 uppercase">
                            {sim.type}
                          </span>
                        </td>
                        <td className="px-6 py-5 font-black text-emerald-600">{fmtBRL(sim.creditAmount)}</td>
                        <td className="px-6 py-5 text-slate-400 text-xs">
                          {sim.createdAt ? new Date((sim.createdAt as any).seconds * 1000).toLocaleDateString('pt-BR') : 'â€”'}
                        </td>
                        <td className="px-6 py-5">
                          <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full ${simStatusBadge(sim.status)}`}>
                            {simStatusLabel(sim.status)}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <button
                            onClick={() => openCrmModal({
                              type: 'simulation',
                              id: sim.id || '',
                              name: sim.userName || 'Cliente',
                              email: sim.userEmail,
                              phone: sim.userPhone,
                            })}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-colors hover:bg-slate-50"
                          >
                            Notas
                          </button>
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setSelectedSimulation(sim)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-black hover:bg-slate-50 transition-colors">
                              Ficha
                            </button>
                            <button onClick={() => sendEmailSim(sim)} aria-label="Enviar por e-mail" className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all">
                              <Mail size={14} />
                            </button>
                            <button onClick={() => sendWhatsApp(sim)} className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-black">
                              <Send size={11} /> WhatsApp
                            </button>
                            <button onClick={() => deleteSimulation(sim)} aria-label="Excluir" className="p-1.5 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {simulations
              .filter(s => s.userName?.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(sim => (
                <div key={sim.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-black text-slate-900 text-sm uppercase">{sim.userName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{sim.userEmail}</p>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${simStatusBadge(sim.status)}`}>
                      {simStatusLabel(sim.status)}
                    </span>
                  </div>
                  <div className="flex gap-3 text-sm mb-3">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-black">Tipo</p>
                      <p className="font-bold text-slate-700">{sim.type}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-[10px] text-slate-400 uppercase font-black">CrÃ©dito</p>
                      <p className="font-black text-emerald-600">{fmtBRL(sim.creditAmount)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openCrmModal({
                        type: 'simulation',
                        id: sim.id || '',
                        name: sim.userName || 'Cliente',
                        email: sim.userEmail,
                        phone: sim.userPhone,
                      })}
                      className="py-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all text-xs font-black"
                    >
                      CRM
                    </button>
                    <button onClick={() => setSelectedSimulation(sim)} className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-black text-slate-600 hover:bg-slate-50">
                      Ver Ficha
                    </button>
                    <button onClick={() => sendEmailSim(sim)} aria-label="Enviar por e-mail" className="py-2 px-3 rounded-xl border border-slate-200 text-blue-500 hover:bg-blue-50 transition-all">
                      <Mail size={14} />
                    </button>
                    <button onClick={() => sendWhatsApp(sim)} className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black">
                      WhatsApp
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* â”€â”€ LETTERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === 'letters' && (
        <div className="space-y-4">
          {/* Import / export toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-md shadow-emerald-600/20"
            >
              <Upload size={15} /> Importar Planilha
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleXlsxImport}
            />
            <button
              onClick={exportLettersXlsx}
              className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50"
            >
              <Download size={15} /> Exportar Cartas
            </button>
            <button
              onClick={exportSimulationsXlsx}
              className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50"
            >
              <Download size={15} /> Exportar SimulaÃ§Ãµes
            </button>
            <button
              onClick={exportUsersXlsx}
              className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50"
            >
              <Download size={15} /> Exportar UsuÃ¡rios
            </button>
            <button
              onClick={openNewLetterModal}
              className="flex items-center gap-2 border border-slate-200 bg-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50"
            >
              <Plus size={15} /> Nova Carta
            </button>
            {importStatus && (
              <span className={`text-xs font-bold px-3 py-2 rounded-xl ${importStatus.startsWith('âœ“') ? 'bg-emerald-50 text-emerald-700' : importStatus.startsWith('Erro') ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                {importStatus}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por administradora ou grupo..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
              />
            </div>
            <div className="flex gap-1 bg-white border border-slate-200 p-1.5 rounded-xl shadow-sm hidden sm:flex">
              <button
                onClick={() => setLetterViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${letterViewMode === 'list' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:bg-slate-50'}`}
                aria-label="Lista"
              >
                <SlidersHorizontal size={18} />
              </button>
              <button
                onClick={() => setLetterViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${letterViewMode === 'grid' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 hover:bg-slate-50'}`}
                aria-label="Grade"
              >
                <LayoutGrid size={18} />
              </button>
            </div>
          </div>

          {letterViewMode === 'list' ? (
            <div className="hidden md:block bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                      <th className="px-6 py-5">Adm / Grupo</th>
                      <th className="px-6 py-5">CrÃ©dito</th>
                      <th className="px-6 py-5">Entrada</th>
                      <th className="px-6 py-5">Parcelas</th>
                      <th className="px-6 py-5">Status</th>
                      <th className="px-6 py-5 text-right">AÃ§Ãµes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedLettersAdmin.map(letter => (
                        <tr key={letter.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase">
                                {letter.category}
                              </span>
                            </div>
                            <p className="font-black text-slate-900 text-sm uppercase mt-1">{letter.administrator}</p>
                            {letter.name && <p className="text-[10px] text-slate-400 truncate">{letter.name}</p>}
                          </td>
                          <td className="px-6 py-5 font-black text-emerald-600">{fmtBRL(letter.credit)}</td>
                          <td className="px-6 py-5 font-black text-slate-900 text-sm">{fmtBRL(letter.entry)}</td>
                          <td className="px-6 py-5 text-sm font-black text-slate-700">{letter.installmentsCount}x</td>
                          <td className="px-6 py-5">
                            <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                              letter.status === 'available' ? 'bg-emerald-100 text-emerald-700' :
                              letter.status === 'reserved' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {letter.status === 'available' ? 'DisponÃ­vel' : letter.status === 'reserved' ? 'Reservada' : 'Vendida'}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex gap-1 justify-end">
                              <button aria-label="Ver ficha" onClick={() => setSelectedCartaFicha(letter)} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg border border-emerald-100 transition-all">
                                <FileText size={14} />
                              </button>
                              <button aria-label="Editar carta" onClick={() => openEditLetterModal(letter)} className="p-2 bg-white text-slate-400 hover:text-emerald-600 rounded-lg border border-slate-200 transition-all">
                                <Edit size={14} />
                              </button>
                              <button aria-label="Excluir carta" onClick={() => removeLetter(letter.id)} className="p-2 bg-white text-slate-400 hover:text-red-600 rounded-lg border border-slate-200 transition-all">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className={letterViewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3 md:hidden"}>
            {paginatedLettersAdmin.map(letter => (
                <div key={letter.id} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 flex-1 pr-2">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase">
                        {letter.category}
                      </span>
                      <h4 className="text-base font-black text-slate-900 uppercase mt-1.5 truncate">
                        {letter.administrator}
                      </h4>
                      {letter.name && (
                        <p className="text-xs text-slate-500 truncate">{letter.name}</p>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button aria-label="Ver ficha" onClick={() => setSelectedCartaFicha(letter)} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg border border-emerald-100 transition-all">
                        <FileText size={14} />
                      </button>
                      <button aria-label="Editar carta" onClick={() => openEditLetterModal(letter)} className="p-2 bg-white text-slate-400 hover:text-emerald-600 rounded-lg border border-slate-200 transition-all">
                        <Edit size={14} />
                      </button>
                      <button aria-label="Excluir carta" onClick={() => removeLetter(letter.id)} className="p-2 bg-white text-slate-400 hover:text-red-600 rounded-lg border border-slate-200 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">CrÃ©dito</p>
                      <p className="text-base font-black text-emerald-600">{fmtBRL(letter.credit)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Entrada</p>
                      <p className="text-base font-black text-slate-900">{fmtBRL(letter.entry)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Parcelas</p>
                      <p className="text-sm font-black text-slate-700">{letter.installmentsCount}x</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Status</p>
                      <span className={`text-[10px] font-black uppercase ${
                        letter.status === 'available' ? 'text-emerald-600' :
                        letter.status === 'reserved' ? 'text-amber-600' : 'text-slate-500'
                      }`}>
                        {letter.status === 'available' ? 'DisponÃ­vel' : letter.status === 'reserved' ? 'Reservada' : 'Vendida'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>

          {/* Pagination */}
          {lettersTotalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6 print:hidden">
              <button
                onClick={() => setLettersPage(p => Math.max(1, p - 1))}
                disabled={lettersPage === 1}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-emerald-600 hover:border-emerald-200 disabled:opacity-50 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-colors shadow-sm"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm font-black text-slate-700">
                PÃ¡gina {lettersPage} de {lettersTotalPages}
              </span>
              <button
                onClick={() => setLettersPage(p => Math.min(lettersTotalPages, p + 1))}
                disabled={lettersPage === lettersTotalPages}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-emerald-600 hover:border-emerald-200 disabled:opacity-50 disabled:hover:text-slate-400 disabled:hover:border-slate-200 transition-colors shadow-sm"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* â”€â”€ USERS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
            />
          </div>

          {/* Desktop */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                    <th className="px-6 py-5">UsuÃ¡rio</th>
                    <th className="px-6 py-5">E-mail</th>
                    <th className="px-6 py-5">FunÃ§Ã£o</th>
                    <th className="px-6 py-5">Ãšltima interaÃ§Ã£o</th>
                    <th className="px-6 py-5">Criado em</th>
                    <th className="px-6 py-5 text-right">AÃ§Ãµes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.filter(u => u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
                    <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-5 font-black text-slate-900 text-sm uppercase">{u.displayName || 'â€”'}</td>
                      <td className="px-6 py-5">
                        <p className="text-slate-500 text-sm">{u.email}</p>
                        {(u as any).phone && (
                          <p className="text-xs text-slate-400 mt-0.5">{(u as any).phone}</p>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'
                        }`}>{u.role}</span>
                      </td>
                      <td className="px-6 py-5 text-xs text-slate-500">
                        {(u as any).lastActivityDesc ? (
                          <div className="max-w-[280px]">
                            <p className="font-bold text-slate-700">{(u as any).lastActivityDesc}</p>
                          </div>
                        ) : (
                          <span>Sem registro</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-slate-400 text-xs">
                        {u.createdAt ? new Date((u.createdAt as any).seconds * 1000).toLocaleDateString('pt-BR') : 'â€”'}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openCrmModal({
                              type: 'user',
                              id: u.uid,
                              name: u.displayName || u.email,
                              email: u.email,
                              phone: (u as any).phone,
                            })}
                            title="AnotaÃ§Ãµes e agendamentos"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all"
                          >
                            <FileText size={14} />
                          </button>
                          <button
                            onClick={() => contactUserEmail(u)}
                            title="Enviar e-mail"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all"
                          >
                            <Mail size={14} />
                          </button>
                          <button
                            onClick={() => contactUserWhatsApp(u)}
                            title="Contato via WhatsApp"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-black"
                          >
                            <Send size={11} /> WhatsApp
                          </button>
                          <button
                            onClick={() => deleteUser(u)}
                            title="Excluir usuÃ¡rio"
                            className="p-1.5 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile */}
          <div className="md:hidden space-y-3">
            {users.filter(u => u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase())).map(u => (
              <div key={u.uid} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-black text-slate-900 text-sm uppercase">{u.displayName || 'â€”'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{u.email}</p>
                    {(u as any).phone && (
                      <p className="text-[10px] text-slate-400 mt-0.5">{(u as any).phone}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase ${
                    u.role === 'admin' ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-600'
                  }`}>{u.role}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openCrmModal({
                      type: 'user',
                      id: u.uid,
                      name: u.displayName || u.email,
                      email: u.email,
                      phone: (u as any).phone,
                    })}
                    title="CRM"
                    className="py-2 px-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all text-xs font-black"
                  >
                    CRM
                  </button>
                  <button onClick={() => contactUserEmail(u)} title="Enviar e-mail" className="py-2 px-3 rounded-xl border border-slate-200 text-blue-500 hover:bg-blue-50 transition-all">
                    <Mail size={14} />
                  </button>
                  <button onClick={() => contactUserWhatsApp(u)} className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black">
                    WhatsApp
                  </button>
                  <button onClick={() => deleteUser(u)} title="Excluir" className="py-2 px-3 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* â”€â”€ PRÃ“XIMOS CONTATOS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === 'contacts' && (() => {
        const getTs = (val: any) => {
           if (!val) return 0;
           if (val.seconds) return val.seconds * 1000;
           if (typeof val.getTime === 'function') return val.getTime();
           return 0;
        };

        const sentSims = simulations
          .filter(s => !!s.sentAt)
          .sort((a, b) => getTs(a.nextContactAt) - getTs(b.nextContactAt));

        return (
          <div className="space-y-4">
            {/* Info banner */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-2xl px-5 py-3 text-sm text-blue-700">
              <Calendar size={16} className="flex-shrink-0 mt-0.5" />
              <span>
                CotaÃ§Ãµes enviadas aguardando retorno. O botÃ£o de contato Ã© <strong>liberado automaticamente</strong> na
                data agendada (15 dias apÃ³s o envio). Itens em <span className="text-emerald-700 font-bold">verde</span> estÃ£o vencidos e prontos para contato.
              </span>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                      <th className="px-6 py-5">Cliente</th>
                      <th className="px-6 py-5">CotaÃ§Ã£o</th>
                      <th className="px-6 py-5">Enviada em</th>
                      <th className="px-6 py-5">PrÃ³ximo Contato</th>
                      <th className="px-6 py-5 text-right">AÃ§Ã£o</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sentSims.map(sim => {
                      const due = isContactDue(sim);
                      const days = daysUntilContact(sim);
                      const protocol = simProtocol(sim.id);
                      
                      const nTs = getTs(sim.nextContactAt);
                      const nextDate = nTs ? new Date(nTs).toLocaleDateString('pt-BR') : 'â€”';
                      
                      const sTs = getTs(sim.sentAt);
                      const sentDate = sTs 
                        ? new Date(sTs).toLocaleString('pt-BR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit',
                          })
                        : 'â€”';
                      return (
                        <tr key={sim.id} className={`transition-colors ${due ? 'bg-emerald-50/40 hover:bg-emerald-50' : 'hover:bg-slate-50'}`}>
                          <td className="px-6 py-5">
                            <p className="font-black text-slate-900 text-sm uppercase">{sim.userName}</p>
                            <p className="text-[10px] text-slate-400">{sim.userEmail}</p>
                            {sim.userPhone && <p className="text-[10px] text-slate-400">{sim.userPhone}</p>}
                          </td>
                          <td className="px-6 py-5">
                            <p className="font-black text-sm text-slate-900">{protocol}</p>
                            <p className="text-[10px] text-slate-500">{sim.type} Â· {fmtBRL(sim.creditAmount)}</p>
                          </td>
                          <td className="px-6 py-5">
                            <p className="text-xs text-slate-700">{sentDate}</p>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              sim.sentBy === 'whatsapp' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {sim.sentBy === 'whatsapp' ? 'WhatsApp' : 'E-mail'}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <p className={`text-sm font-black ${due ? 'text-emerald-600' : 'text-amber-600'}`}>{nextDate}</p>
                            {due
                              ? <p className="text-[10px] text-emerald-600 font-black uppercase">Vencido â€” contate agora</p>
                              : <p className="text-[10px] text-slate-400">em {days} dia{days !== 1 ? 's' : ''}</p>
                            }
                          </td>
                          <td className="px-6 py-5 text-right">
                            <button
                              onClick={() => { if (due) sendFollowUpWhatsApp(sim); }}
                              disabled={!due}
                              title={due ? 'Clique para entrar em contato via WhatsApp' : `DisponÃ­vel em ${days} dia${days !== 1 ? 's' : ''}`}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                due
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm cursor-pointer'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              {due ? <Send size={12} /> : <Clock size={12} />}
                              {due ? 'Entrar em Contato' : `Retorno em ${days}d`}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {sentSims.length === 0 && (
                  <div className="py-16 text-center">
                    <CalendarCheck size={36} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-slate-400 text-sm font-medium">Nenhuma cotaÃ§Ã£o enviada ainda.</p>
                    <p className="text-slate-300 text-xs mt-1">Quando vocÃª enviar uma cotaÃ§Ã£o via WhatsApp ou E-mail, ela aparecerÃ¡ aqui.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {sentSims.map(sim => {
                const due = isContactDue(sim);
                const days = daysUntilContact(sim);
                const protocol = simProtocol(sim.id);
                
                const nTs = getTs(sim.nextContactAt);
                const nextDate = nTs ? new Date(nTs).toLocaleDateString('pt-BR') : 'â€”';
                
                const sTs = getTs(sim.sentAt);
                const sentDate = sTs 
                  ? new Date(sTs).toLocaleString('pt-BR', {
                      day: '2-digit', month: '2-digit', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })
                  : 'â€”';
                return (
                  <div key={sim.id} className={`border rounded-2xl p-4 shadow-sm space-y-3 ${due ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-black text-slate-900 text-sm uppercase">{sim.userName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{sim.userEmail}</p>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full ${
                        sim.sentBy === 'whatsapp' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {sim.sentBy === 'whatsapp' ? 'WhatsApp' : 'E-mail'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CotaÃ§Ã£o</p>
                        <p className="font-black text-slate-800">{protocol}</p>
                        <p className="text-slate-500">{sim.type} Â· {fmtBRL(sim.creditAmount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enviada em</p>
                        <p className="text-slate-700">{sentDate}</p>
                      </div>
                    </div>

                    <div className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl ${due ? 'bg-emerald-100' : 'bg-amber-50 border border-amber-100'}`}>
                      <span className="font-black text-slate-600">PrÃ³ximo Contato</span>
                      <div className="text-right">
                        <span className={`font-black ${due ? 'text-emerald-700' : 'text-amber-600'}`}>{nextDate}</span>
                        {!due && <span className="text-[9px] text-slate-400 block">em {days}d</span>}
                        {due && <span className="text-[9px] text-emerald-600 font-black block uppercase">Vencido</span>}
                      </div>
                    </div>

                    <button
                      onClick={() => { if (due) sendFollowUpWhatsApp(sim); }}
                      disabled={!due}
                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
                        due
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      {due ? <Send size={12} /> : <Clock size={12} />}
                      {due ? `Entrar em Contato â€” Retorno de ${nextDate}` : `Entrar em Contato â€” Retorno em ${days}d`}
                    </button>
                  </div>
                );
              })}
              {sentSims.length === 0 && (
                <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-10 text-center">
                  <CalendarCheck size={36} className="mx-auto text-slate-200 mb-3" />
                  <p className="text-slate-400 text-sm">Nenhuma cotaÃ§Ã£o enviada ainda.</p>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* â”€â”€ Letter Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <AnimatePresence>
        {isLetterModalOpen && (
          <div className="fixed inset-0 z-[900] grid place-items-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsLetterModalOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-6 sm:p-8 overflow-y-auto max-h-[90vh] text-slate-900">
              <div className="relative flex justify-center items-center mb-8">
                <h4 className="font-black text-2xl text-center text-slate-900 tracking-tight uppercase">{editingLetter ? 'Editar Carta' : 'Nova Carta'}</h4>
                <button onClick={() => setIsLetterModalOpen(false)} aria-label="Fechar" className="absolute right-0 text-slate-400 hover:text-slate-600 transition-colors p-2"><X size={24} /></button>
              </div>
              <datalist id="administradoras">
                <option value="Santander" />
                <option value="ItaÃº" />
                <option value="Bradesco" />
                <option value="Porto Seguro" />
                <option value="Caixa ConsÃ³rcios" />
                <option value="BB ConsÃ³rcios" />
                <option value="Embracon" />
                <option value="Rodobens" />
                <option value="Ademicon" />
              </datalist>
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-4">
                {[
                  { key: 'administrator', label: 'Administradora', type: 'datalist', list: 'administradoras' },
                  { key: 'group', label: 'Grupo', type: 'text' },
                  { key: 'code', label: 'CÃ³digo', type: 'text' },
                  { key: 'name', label: 'Nome / Bem', type: 'text' },
                  { key: 'category', label: 'Categoria', type: 'select', options: ['Carro', 'ImÃ³vel', 'CaminhÃ£o', 'Giro'] },
                  { key: 'credit', label: 'CrÃ©dito (R$)', type: 'number' },
                  { key: 'entry', label: 'Entrada (R$)', type: 'number' },
                  { key: 'installmentsCount', label: 'Parcelas', type: 'number' },
                  { key: 'installmentValue', label: 'Valor Parcela (R$)', type: 'number' },
                  { key: 'saldoDevedor', label: 'Saldo Devedor (R$)', type: 'number' },
                  { key: 'transferFee', label: 'Taxa TransferÃªncia (R$)', type: 'number' },
                  { key: 'fundoComum', label: 'Fundo Comum (R$)', type: 'number' },
                  { key: 'refGarantia', label: 'Ref. Garantia (R$)', type: 'number' },
                  { key: 'insurance', label: 'Seguro', type: 'select', options: ['N/A', 'Incluso', 'NÃ£o Incluso'] },
                  { key: 'reajusteIndex', label: 'Ãndice de Reajuste', type: 'select', options: ['N/A', 'INCC', 'IGPM', 'IPCA'] },
                  { key: 'status', label: 'Status', type: 'select', options: [{val: 'available', lbl: 'DisponÃ­vel'}, {val: 'reserved', lbl: 'Reservada'}, {val: 'sold', lbl: 'Vendida'}] },
                  { key: 'contactPhone', label: 'Telefone Contato', type: 'text' },
                  { key: 'contactEmail', label: 'Email Contato', type: 'email' },
                  { key: 'observations', label: 'ObservaÃ§Ãµes', type: 'text', colSpan: 'full' },
                ].map((field: any) => (
                  <div key={field.key} className={field.colSpan === 'full' ? 'sm:col-span-3 md:col-span-4' : ''}>
                    <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{field.label}</label>
                    {field.type === 'select' ? (
                      <select
                        value={(letterForm as any)[field.key] || ''}
                        onChange={e => handleLetterFormChange(field.key as any, e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                      >
                        <option value="">Selecione...</option>
                        {field.options?.map((opt: any) => typeof opt === 'string' 
                          ? <option key={opt} value={opt}>{opt}</option> 
                          : <option key={opt.val} value={opt.val}>{opt.lbl}</option>
                        )}
                      </select>
                    ) : field.type === 'datalist' ? (
                      <input
                        list={field.list}
                        type="text"
                        value={(letterForm as any)[field.key] || ''}
                        onChange={e => handleLetterFormChange(field.key as any, e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Digite ou selecione..."
                      />
                    ) : (
                      <input
                        type={field.type}
                        value={(letterForm as any)[field.key] || ''}
                        onChange={e => handleLetterFormChange(field.key as any, field.type === 'number' ? Number(e.target.value) : e.target.value)}
                        className="w-full p-2 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-8 flex justify-center gap-4">
                <button onClick={() => setIsLetterModalOpen(false)} className="px-6 py-3 rounded-2xl border-2 border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-colors">Cancelar</button>
                <button onClick={saveLetter} className="px-10 py-3 rounded-2xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition-all">Salvar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {crmModalOpen && crmTarget && (
          <div className="fixed inset-0 z-[920] grid place-items-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCrmModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              className="relative w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">CRM Privado</p>
                  <h4 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">{crmTarget.name}</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    {crmTarget.email || 'Sem e-mail'} {crmTarget.phone ? `· ${crmTarget.phone}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => setCrmModalOpen(false)}
                  className="rounded-xl border border-slate-200 p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.25em] text-slate-500">
                      Anotacao privada
                    </label>
                    <textarea
                      value={crmNoteText}
                      onChange={(e) => setCrmNoteText(e.target.value)}
                      rows={6}
                      placeholder="Ex.: Cliente pediu retorno, comentou objeções, perfil buscado, observações da conversa..."
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.25em] text-slate-500">
                      Agendar follow-up
                    </label>
                    <input
                      type="date"
                      value={crmDueDate}
                      onChange={(e) => setCrmDueDate(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>

                  <button
                    onClick={saveCrmNote}
                    className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-black uppercase tracking-[0.24em] text-white transition-colors hover:bg-emerald-700"
                  >
                    Salvar no CRM
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500">Historico de interacoes</p>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                      {notesForTarget.length} registro(s)
                    </span>
                  </div>

                  <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
                    {notesForTarget.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                        Nenhuma anotacao ainda para este contato.
                      </div>
                    ) : (
                      notesForTarget.map((note) => (
                        <div key={note.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
                                note.status === 'done' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {note.status === 'done' ? 'Concluido' : 'Pendente'}
                              </span>
                              {note.dueDate ? (
                                <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
                                  Follow-up: {new Date(`${note.dueDate}T12:00:00`).toLocaleDateString('pt-BR')}
                                </p>
                              ) : null}
                            </div>
                            <button
                              onClick={() => toggleCrmNoteStatus(note)}
                              className="rounded-xl border border-slate-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-600 transition-colors hover:bg-white"
                            >
                              {note.status === 'done' ? 'Reabrir' : 'Concluir'}
                            </button>
                          </div>
                          <p className="text-sm leading-relaxed text-slate-700">{note.note}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* â”€â”€ Fichas â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {selectedSimulation && (
        <SimulacaoFicha simulation={selectedSimulation} onClose={() => setSelectedSimulation(null)} />
      )}
      {selectedCartaFicha && (
        <CartaFicha letter={selectedCartaFicha} onClose={() => setSelectedCartaFicha(null)} />
      )}
      </div>
    </div>
  );
};

export default AdminPortal;

