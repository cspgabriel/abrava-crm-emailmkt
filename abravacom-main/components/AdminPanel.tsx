import React, { useEffect, useState } from 'react';
import { Download, Trash2, ArrowLeft, Users, MessageCircle, Mail, Calendar, User, RefreshCw } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';

interface Lead {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  source: string;
  date: string;
}

interface Simulation {
  id: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  type: string;
  creditAmount: number;
  status: string;
  createdAt: any;
}

const DEMO_LEADS: Lead[] = [
  { id: 'demo-lead-1', name: 'Carlos Eduardo Silva', phone: '(11) 98765-4321', email: 'carlos.silva@email.com', source: 'WhatsApp', date: new Date(Date.now() - 86400000).toISOString() },
  { id: 'demo-lead-2', name: 'Ana Paula Ferreira', phone: '(21) 99876-5432', email: 'ana.ferreira@email.com', source: 'Newsletter', date: new Date(Date.now() - 172800000).toISOString() },
  { id: 'demo-lead-3', name: 'Roberto Mendes', phone: '(31) 97654-3210', email: 'roberto.mendes@email.com', source: 'Grupo WhatsApp', date: new Date(Date.now() - 259200000).toISOString() },
  { id: 'demo-lead-4', name: 'Juliana Costa', phone: '(41) 96543-2109', email: 'juliana.costa@email.com', source: 'Site', date: new Date(Date.now() - 345600000).toISOString() },
];

const DEMO_SIMULATIONS_PANEL: Simulation[] = [
  { id: 'demo-sim-1', userName: 'Carlos Eduardo Silva', userEmail: 'carlos.silva@email.com', userPhone: '(11) 98765-4321', type: 'Apartamentos', creditAmount: 350000, status: 'pending', createdAt: null },
  { id: 'demo-sim-2', userName: 'Ana Paula Ferreira', userEmail: 'ana.ferreira@email.com', userPhone: '(21) 99876-5432', type: 'Casas', creditAmount: 250000, status: 'analyzed', createdAt: null },
  { id: 'demo-sim-3', userName: 'Roberto Mendes', userEmail: 'roberto.mendes@email.com', userPhone: '(31) 97654-3210', type: 'Construção', creditAmount: 180000, status: 'completed', createdAt: null },
  { id: 'demo-sim-4', userName: 'Juliana Costa', userEmail: 'juliana.costa@email.com', userPhone: '(41) 96543-2109', type: 'Terreno', creditAmount: 120000, status: 'pending', createdAt: null },
];

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leads' | 'simulations'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch Leads
      const leadsQ = query(collection(db, "leads"), orderBy("date", "desc"));
      const leadsSnapshot = await getDocs(leadsQ);
      const fetchedLeads: Lead[] = [];
      leadsSnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedLeads.push({
          id: doc.id,
          name: data.name,
          phone: data.phone,
          email: data.email,
          source: data.source,
          date: data.date
        });
      });
      setLeads(fetchedLeads.length > 0 ? fetchedLeads : DEMO_LEADS);

      // Fetch Simulations
      const simsQ = query(collection(db, "simulations"), orderBy("createdAt", "desc"));
      const simsSnapshot = await getDocs(simsQ);
      const fetchedSims: Simulation[] = [];
      simsSnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedSims.push({
          id: doc.id,
          userName: data.userName,
          userEmail: data.userEmail,
          userPhone: data.userPhone,
          type: data.type,
          creditAmount: data.creditAmount,
          status: data.status,
          createdAt: data.createdAt
        });
      });
      setSimulations(fetchedSims.length > 0 ? fetchedSims : DEMO_SIMULATIONS_PANEL);
    } catch (error) {
      console.error("Error fetching data:", error);
      setLeads(DEMO_LEADS);
      setSimulations(DEMO_SIMULATIONS_PANEL);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  };

  const handleDownloadCSV = () => {
    const BOM = "\uFEFF"; 
    let headers = "";
    let csvContent = "";
    let filename = "";

    if (activeTab === 'leads') {
      headers = "Nome;Email;WhatsApp;Origem;Data\n";
      csvContent = leads.map(lead => {
        const name = lead.name ? `"${lead.name}"` : "-";
        const email = lead.email ? `"${lead.email}"` : "-";
        const phone = lead.phone ? `"${lead.phone}"` : "-";
        const source = `"${lead.source}"`;
        const date = `"${new Date(lead.date).toLocaleString('pt-BR')}"`;
        return `${name};${email};${phone};${source};${date}`;
      }).join("\n");
      filename = `leads_finance8_${new Date().toISOString().slice(0,10)}.csv`;
    } else {
      headers = "Nome;Email;WhatsApp;Tipo;Credito;Status;Data\n";
      csvContent = simulations.map(sim => {
        const name = `"${sim.userName}"`;
        const email = `"${sim.userEmail}"`;
        const phone = `"${sim.userPhone}"`;
        const type = `"${sim.type}"`;
        const credit = `"${sim.creditAmount}"`;
        const status = `"${sim.status}"`;
        const date = `"${new Date(sim.createdAt?.seconds * 1000).toLocaleString('pt-BR')}"`;
        return `${name};${email};${phone};${type};${credit};${status};${date}`;
      }).join("\n");
      filename = `simulacoes_finance8_${new Date().toISOString().slice(0,10)}.csv`;
    }
    
    const blob = new Blob([BOM + headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Warning: This does not delete from Firebase in this implementation for safety
  // We just clear the local view or LocalStorage legacy data
  const handleClearLegacyData = () => {
    if (confirm('Isso limpará apenas os dados antigos salvos no navegador (se houver). Os dados do Firebase permanecerão.')) {
      localStorage.removeItem('finance8_leads');
      alert('Dados locais limpos.');
    }
  };

  const goBack = () => {
    window.location.href = window.location.pathname;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors">
              <ArrowLeft />
            </button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="text-amber-600" />
              Painel Administrativo
            </h1>
          </div>

          <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
            <button 
              onClick={() => setActiveTab('leads')}
              className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'leads' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Leads
            </button>
            <button 
              onClick={() => setActiveTab('simulations')}
              className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === 'simulations' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
              }`}
            >
              Simulações
            </button>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={fetchData}
              className="flex items-center gap-2 px-3 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium"
              title="Recarregar"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            </button>
            <button 
              onClick={handleDownloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20 font-medium"
            >
              <Download size={18} />
              Baixar Excel
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-slate-500 text-sm font-medium">Total Geral</p>
            <p className="text-3xl font-bold mt-1">{activeTab === 'leads' ? leads.length : simulations.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-slate-500 text-sm font-medium">WhatsApp</p>
            <p className="text-3xl font-bold mt-1 text-green-600">
              {activeTab === 'leads' ? leads.filter(l => l.phone).length : simulations.filter(s => s.userPhone).length}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <p className="text-slate-500 text-sm font-medium">E-mails</p>
            <p className="text-3xl font-bold mt-1 text-blue-600">
              {activeTab === 'leads' ? leads.filter(l => l.email).length : simulations.filter(s => s.userEmail).length}
            </p>
          </div>
          {activeTab === 'leads' ? (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-slate-500 text-sm font-medium">Newsletter</p>
              <p className="text-3xl font-bold mt-1 text-amber-600">
                {leads.filter(l => l.source === 'Newsletter').length}
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <p className="text-slate-500 text-sm font-medium">Crédito Total</p>
              <p className="text-xl font-bold mt-1 text-emerald-600">
                {formatCurrency(simulations.reduce((acc, s) => acc + s.creditAmount, 0))}
              </p>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === 'leads' ? (
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-4 font-semibold text-sm text-slate-500 dark:text-slate-400">Origem</th>
                    <th className="p-4 font-semibold text-sm text-slate-500 dark:text-slate-400">Nome</th>
                    <th className="p-4 font-semibold text-sm text-slate-500 dark:text-slate-400">Email</th>
                    <th className="p-4 font-semibold text-sm text-slate-500 dark:text-slate-400">WhatsApp</th>
                    <th className="p-4 font-semibold text-sm text-slate-500 dark:text-slate-400">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-500">
                        <div className="flex justify-center items-center gap-2">
                          <RefreshCw className="animate-spin" /> Carregando leads...
                        </div>
                      </td>
                    </tr>
                  ) : leads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        Nenhum lead encontrado no banco de dados.
                      </td>
                    </tr>
                  ) : (
                    leads.map((lead) => (
                      <tr key={lead.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            lead.source.includes('WhatsApp') || lead.source.includes('Grupo')
                              ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800'
                              : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                          }`}>
                            {lead.source}
                          </span>
                        </td>
                         <td className="p-4 text-slate-900 dark:text-slate-200 font-medium">
                          <div className="flex items-center gap-2">
                             {lead.name ? (
                               <>
                                 <User size={14} className="text-slate-400" />
                                 {lead.name}
                               </>
                             ) : <span className="text-slate-400 text-sm">-</span>}
                          </div>
                        </td>
                        <td className="p-4 text-slate-900 dark:text-slate-200">
                           <div className="flex items-center gap-2">
                             {lead.email ? (
                               <>
                                 <Mail size={14} className="text-slate-400" />
                                 {lead.email}
                               </>
                             ) : <span className="text-slate-400 text-sm">-</span>}
                          </div>
                        </td>
                        <td className="p-4 text-slate-900 dark:text-slate-200">
                           <div className="flex items-center gap-2">
                             {lead.phone ? (
                               <>
                                 <MessageCircle size={14} className="text-slate-400" />
                                 {lead.phone}
                               </>
                             ) : <span className="text-slate-400 text-sm">-</span>}
                          </div>
                        </td>
                        <td className="p-4 text-slate-500 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            {new Date(lead.date).toLocaleString('pt-BR')}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-4 font-semibold text-sm text-slate-500 dark:text-slate-400">Tipo</th>
                    <th className="p-4 font-semibold text-sm text-slate-500 dark:text-slate-400">Nome</th>
                    <th className="p-4 font-semibold text-sm text-slate-500 dark:text-slate-400">Email</th>
                    <th className="p-4 font-semibold text-sm text-slate-500 dark:text-slate-400">WhatsApp</th>
                    <th className="p-4 font-semibold text-sm text-slate-500 dark:text-slate-400">Crédito</th>
                    <th className="p-4 font-semibold text-sm text-slate-500 dark:text-slate-400">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-slate-500">
                        <div className="flex justify-center items-center gap-2">
                          <RefreshCw className="animate-spin" /> Carregando simulações...
                        </div>
                      </td>
                    </tr>
                  ) : simulations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        Nenhuma simulação encontrada no banco de dados.
                      </td>
                    </tr>
                  ) : (
                    simulations.map((sim) => (
                      <tr key={sim.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="p-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
                            {sim.type}
                          </span>
                        </td>
                         <td className="p-4 text-slate-900 dark:text-slate-200 font-medium">
                          <div className="flex items-center gap-2">
                             <User size={14} className="text-slate-400" />
                             {sim.userName}
                          </div>
                        </td>
                        <td className="p-4 text-slate-900 dark:text-slate-200">
                           <div className="flex items-center gap-2">
                             <Mail size={14} className="text-slate-400" />
                             {sim.userEmail}
                          </div>
                        </td>
                        <td className="p-4 text-slate-900 dark:text-slate-200">
                           <div className="flex items-center gap-2">
                             <MessageCircle size={14} className="text-slate-400" />
                             {sim.userPhone}
                          </div>
                        </td>
                        <td className="p-4 text-emerald-600 font-bold">
                          {formatCurrency(sim.creditAmount)}
                        </td>
                        <td className="p-4 text-slate-500 text-sm">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            {sim.createdAt?.seconds ? new Date(sim.createdAt.seconds * 1000).toLocaleString('pt-BR') : '-'}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;