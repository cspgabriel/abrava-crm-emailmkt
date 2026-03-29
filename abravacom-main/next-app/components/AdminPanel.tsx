import React, { useEffect, useState } from 'react';
import { Download, ArrowLeft, Users, RefreshCw, FileText } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

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

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'leads' | 'simulations'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const leadsQ = query(collection(db, 'leads'), orderBy('date', 'desc'));
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
      setLeads(fetchedLeads);

      const simsQ = query(collection(db, 'simulations'), orderBy('createdAt', 'desc'));
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
      setSimulations(fetchedSims);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Erro ao carregar dados. Verifique as regras do Firebase.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const handleDownloadCSV = () => {
    const BOM = '\uFEFF';
    let headers = '';
    let csvContent = '';
    let filename = '';

    if (activeTab === 'leads') {
      headers = 'Nome;Email;WhatsApp;Origem;Data\n';
      csvContent = leads.map(lead => {
        const name = lead.name ? `"${lead.name}"` : '-';
        const email = lead.email ? `"${lead.email}"` : '-';
        const phone = lead.phone ? `"${lead.phone}"` : '-';
        const source = `"${lead.source}"`;
        const date = `"${new Date(lead.date).toLocaleString('pt-BR')}"`;
        return `${name};${email};${phone};${source};${date}`;
      }).join('\n');
      filename = `leads_finance8_${new Date().toISOString().slice(0,10)}.csv`;
    } else {
      headers = 'Nome;Email;WhatsApp;Tipo;Credito;Status;Data\n';
      csvContent = simulations.map(sim => {
        const name = `"${sim.userName}"`;
        const email = `"${sim.userEmail}"`;
        const phone = `"${sim.userPhone}"`;
        const type = `"${sim.type}"`;
        const credit = `"${sim.creditAmount}"`;
        const status = `"${sim.status}"`;
        const date = `"${new Date((sim.createdAt as any)?.seconds * 1000).toLocaleString('pt-BR')}"`;
        return `${name};${email};${phone};${type};${credit};${status};${date}`;
      }).join('\n');
      filename = `simulacoes_finance8_${new Date().toISOString().slice(0,10)}.csv`;
    }

    const blob = new Blob([BOM + headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-slate-200 rounded-full transition-colors"><ArrowLeft /></button>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="text-amber-600" /> Painel Administrativo</h1>
          </div>

          <div className="flex bg-slate-200 p-1 rounded-xl">
            <button onClick={() => setActiveTab('leads')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest ${activeTab === 'leads' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Leads</button>
            <button onClick={() => setActiveTab('simulations')} className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest ${activeTab === 'simulations' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>Simulações</button>
          </div>

          <div className="flex gap-3">
            <button onClick={fetchData} className="flex items-center gap-2 px-3 py-2 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium" title="Recarregar"><RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /></button>
            <button onClick={handleDownloadCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg font-medium"><Download size={18} /> Baixar Excel</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl border shadow-sm"><p className="text-slate-500 text-sm font-medium">Total Geral</p><p className="text-3xl font-bold mt-1">{activeTab === 'leads' ? leads.length : simulations.length}</p></div>
          <div className="bg-white p-6 rounded-xl border shadow-sm"><p className="text-slate-500 text-sm font-medium">WhatsApp</p><p className="text-3xl font-bold mt-1 text-green-600">{activeTab === 'leads' ? leads.filter(l => l.phone).length : simulations.filter(s => s.userPhone).length}</p></div>
          <div className="bg-white p-6 rounded-xl border shadow-sm"><p className="text-slate-500 text-sm font-medium">E-mails</p><p className="text-3xl font-bold mt-1 text-blue-600">{activeTab === 'leads' ? leads.filter(l => l.email).length : simulations.filter(s => s.userEmail).length}</p></div>
          <div className="bg-white p-6 rounded-xl border shadow-sm"><p className="text-slate-500 text-sm font-medium">Crédito Total</p><p className="text-xl font-bold mt-1 text-emerald-600">{formatCurrency(simulations.reduce((acc, s) => acc + s.creditAmount, 0))}</p></div>
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden p-6">
          {activeTab === 'leads' ? (
            <table className="w-full text-left">
              <thead><tr className="bg-slate-50"><th className="p-4">Origem</th><th className="p-4">Nome</th><th className="p-4">Email</th><th className="p-4">WhatsApp</th><th className="p-4">Data</th></tr></thead>
              <tbody>{leads.map(lead => (<tr key={lead.id}><td className="p-4">{lead.source}</td><td className="p-4">{lead.name}</td><td className="p-4">{lead.email}</td><td className="p-4">{lead.phone}</td><td className="p-4">{lead.date}</td></tr>))}</tbody>
            </table>
          ) : (
            <table className="w-full text-left">
              <thead><tr className="bg-slate-50"><th className="p-4">Nome</th><th className="p-4">Email</th><th className="p-4">WhatsApp</th><th className="p-4">Tipo</th><th className="p-4">Crédito</th><th className="p-4">Status</th><th className="p-4">Data</th></tr></thead>
              <tbody>{simulations.map(sim => (<tr key={sim.id}><td className="p-4">{sim.userName}</td><td className="p-4">{sim.userEmail}</td><td className="p-4">{sim.userPhone}</td><td className="p-4">{sim.type}</td><td className="p-4">{sim.creditAmount}</td><td className="p-4">{sim.status}</td><td className="p-4">{new Date((sim.createdAt as any)?.seconds * 1000).toLocaleString('pt-BR')}</td></tr>))}</tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
