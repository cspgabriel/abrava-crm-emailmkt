import React, { useState, useEffect } from 'react';
import { getDoc, doc, collection, query, where, limit, getDocs, setDoc, serverTimestamp, arrayUnion, addDoc } from "firebase/firestore";
import { RefreshCw, CheckCircle } from 'lucide-react';
import { CONTACT_FIELDS } from '../config/constants';

export const PublicFormView = ({ formId, db }: any) => {
    const [formDef, setFormDef] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        getDoc(doc(db, "forms", formId)).then(snap => {
            if (snap.exists()) { setFormDef(snap.data()); setLoading(false); } else { setError("Formulário não encontrado."); setLoading(false); }
        });
    }, [formId]);
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true);
        try {
            const historyEntry = { date: new Date().toISOString(), type: 'form_submission', description: `Atualizado via formulário: ${formDef.title}`, formId: String(formId) };
            const q = query(collection(db, "contacts"), where("email", "==", formData.email), limit(1));
            const snap = await getDocs(q);
            if (!snap.empty) { const docRef = snap.docs[0].ref; await setDoc(docRef, { ...formData, updatedAt: serverTimestamp(), sourceFormId: String(formId), history: arrayUnion(historyEntry) }, { merge: true }); } else { const newId = `ct_${Date.now()}_form`; const newContact = { ...formData, id: newId, companyId: formData.companyId || 'form_entry', company_name: formData.company_name || 'Cadastro via Formulário', createdAt: serverTimestamp(), sourceFormId: String(formId), history: [historyEntry] }; await setDoc(doc(db, "contacts", newId), newContact); }
            setSubmitted(true);
        } catch (err) { console.error(err); alert("Erro ao enviar. Tente novamente."); } setLoading(false);
    };
    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><RefreshCw className="h-8 w-8 animate-spin text-blue-600"/></div>;
    if (error) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-600">{error}</div>;
    if (submitted) return (<div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4"><div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md w-full"><CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" /><h1 className="text-2xl font-bold text-gray-900 mb-2">Obrigado!</h1><p className="text-gray-600">Seus dados foram atualizados com sucesso em nossa base.</p><button onClick={() => window.location.reload()} className="mt-6 text-blue-600 font-bold hover:underline">Voltar</button></div></div>);
    return (<div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"><div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl border border-gray-100"><div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white"><h2 className="text-2xl font-bold">{formDef.title}</h2><p className="mt-2 opacity-90">{formDef.description}</p></div><form onSubmit={handleSubmit} className="p-8 space-y-6">{formDef.fields.map((fieldKey: string) => { const fieldConfig = CONTACT_FIELDS.find(f => f.key === fieldKey); if (!fieldConfig) return null; return (<div key={fieldKey}><label className="block text-sm font-medium text-gray-700 mb-1">{fieldConfig.label} {['name', 'email'].includes(fieldKey) && '*'}</label><input required={['name', 'email'].includes(fieldKey)} type={fieldKey === 'email' ? 'email' : 'text'} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" value={formData[fieldKey] || ''} onChange={e => setFormData({...formData, [fieldKey]: e.target.value})} /></div>) })}<button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">Atualizar Meus Dados</button></form></div><p className="text-center text-xs text-gray-400 mt-8">Powered by CRM RIO</p></div>);
};