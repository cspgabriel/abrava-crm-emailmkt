import React, { useState, useEffect } from 'react';
import { AlertCircle, FileText } from 'lucide-react';
import { ContemplatedLetter } from '../types';
import { db, auth } from '../firebase';
import { PROFILE } from '../constants';
import { collection, getDocs, doc, updateDoc, runTransaction } from 'firebase/firestore';

const ContemplatedLetters: React.FC = () => {
  const [letters, setLetters] = useState<ContemplatedLetter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLetters = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'contemplated_letters'));
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContemplatedLetter));
        if (data.length === 0) {
          setLetters([]);
        } else {
          setLetters(data);
        }
      } catch (error) {
        console.error('Error fetching letters:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLetters();
  }, []);

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="relative space-y-12 pt-12 pb-20 px-6 max-w-7xl mx-auto">
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">CARTAS CONTEMPLADAS</h2>
        <p className="text-slate-500 font-medium">Oportunidades exclusivas com crédito imediato</p>
      </div>

      {letters.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 p-6 rounded-2xl text-center">
          <FileText className="mx-auto text-slate-300" size={36} />
          <p className="text-slate-500 font-medium mt-2">Nenhuma carta disponível no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {letters.map(letter => (
            <div key={letter.id} className="bg-white border p-4 rounded-xl">
              <div className="font-black text-slate-900">{letter.administrator} • {letter.category}</div>
              <div className="text-emerald-600 font-black">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(letter.credit)}</div>
              <p className="text-slate-500 text-sm mt-2">Grupo: {letter.group}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContemplatedLetters;
