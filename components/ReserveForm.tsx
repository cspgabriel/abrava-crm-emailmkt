import React, { useState } from 'react';
import { BookmarkCheck, ArrowRight, CheckCircle2, Loader2, MessageCircle } from 'lucide-react';
import { db } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ContemplatedLetter } from '../types';
import { PROFILE } from '../constants';

interface ReserveFormProps {
  letters: ContemplatedLetter[];
  onSuccess?: () => void;
}

const formatCpf = (val: string) => {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3}\.\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3}\.\d{3}\.\d{3})(\d)/, '$1-$2');
};

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const ReserveForm: React.FC<ReserveFormProps> = ({ letters, onSuccess }) => {
  const hasLeadData = !!localStorage.getItem('letters_lead_id');
  const savedName = localStorage.getItem('letters_lead_name') || '';
  const savedEmail = localStorage.getItem('letters_lead_email') || '';
  const savedPhone = localStorage.getItem('letters_lead_phone') || '';
  const savedCpf = localStorage.getItem('letters_lead_cpf') || '';

  const [name, setName] = useState(savedName);
  const [email, setEmail] = useState(savedEmail);
  const [phone, setPhone] = useState(savedPhone);
  const [cpf, setCpf] = useState(savedCpf);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [docId, setDocId] = useState<string | null>(null);

  const inputBase =
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-[#d8ad5b] sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm';
  const inputReadOnly = `${inputBase} cursor-not-allowed opacity-60`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !email.includes('@') || !phone) return;

    setStatus('loading');
    try {
      let leadId = localStorage.getItem('letters_lead_id') || undefined;

      // If no step-1 lead yet, create one now
      if (!leadId) {
        const simDoc = await addDoc(collection(db, 'simulations'), {
          userName: name,
          userEmail: email,
          userPhone: phone,
          userCpf: cpf,
          source: 'Reserva Carta Contemplada',
          type: 'Lead Cartas Contempladas',
          status: 'pending',
          createdAt: serverTimestamp(),
        });
        leadId = simDoc.id;
        localStorage.setItem('letters_lead_id', leadId);
        localStorage.setItem('letters_lead_name', name);
        localStorage.setItem('letters_lead_email', email);
        localStorage.setItem('letters_lead_phone', phone);
        localStorage.setItem('letters_lead_cpf', cpf);
        localStorage.setItem('letters_unlocked', 'true');
      }

      const letterData = letters.map((l) => ({
        letterId: l.id,
        letterCode: l.code || '',
        letterCategory: l.category,
        letterAdministrator: l.administrator || l.group || '',
        letterCredit: l.credit,
        letterInstallmentValue: l.installmentValue,
        letterInstallmentsCount: l.installmentsCount,
      }));

      const reservaRef = await addDoc(collection(db, 'reserva_intencoes'), {
        leadId,
        userName: name,
        userEmail: email,
        userPhone: phone,
        userCpf: cpf,
        letters: letterData,
        status: 'interesse',
        createdAt: serverTimestamp(),
      });

      setDocId(reservaRef.id);
      setStatus('success');
      if (onSuccess) {
        setTimeout(onSuccess, 3500);
      }
    } catch (err) {
      console.error('Erro ao registrar intenção de reserva:', err);
      setStatus('error');
    }
  };

  const buildWhatsAppMsg = () => {
    const lines = letters.map(
      (l) =>
        `• ${l.code ? l.code + ' - ' : ''}${l.administrator || l.group} — ${l.category} — ${formatCurrency(l.credit)}`
    );
    const text = `Olá! Tenho interesse em reservar ${letters.length === 1 ? 'a seguinte carta contemplada' : 'as seguintes cartas contempladas'}:\n\n${lines.join('\n')}\n\nMeu nome: ${name}`;
    const phone = (PROFILE?.whatsapp || '').replace(/\D/g, '');
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center rounded-[2rem] border border-emerald-100 bg-emerald-50 p-8 text-center gap-5">
        <CheckCircle2 className="h-14 w-14 text-emerald-500" />
        <div>
          <p className="text-base font-black uppercase tracking-wider text-emerald-700">
            Intenção Registrada!
          </p>
          <p className="mt-2 text-xs text-emerald-600 font-medium">
            Nossa equipe entrará em contato em breve para confirmar a sua reserva.
          </p>
        </div>
        <a
          href={buildWhatsAppMsg()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-md hover:bg-emerald-700 transition-all"
        >
          <MessageCircle size={16} />
          Falar com a Consultora agora
        </a>
        {docId && (
          <p className="text-[10px] text-emerald-400">ID: {docId}</p>
        )}
      </div>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 pb-6 shadow-2xl sm:p-6">
      {/* Header */}
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-xl bg-[#d8ad5b]/20 p-2 text-[#b98532] sm:p-3">
          <BookmarkCheck size={18} />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase italic leading-tight tracking-tight text-[#0b1a3a] sm:text-base">
            RESERVAR {letters.length === 1 ? 'CARTA' : `${letters.length} CARTAS`}
          </h3>
          <p className="text-[10px] text-slate-400 font-medium mt-0.5">
            Confirme seus dados para registrar o interesse
          </p>
        </div>
      </div>

      {/* Selected letters read-only chips */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
          {letters.length === 1 ? 'Carta Escolhida' : 'Cartas Escolhidas'}
        </p>
        <div className="flex flex-col gap-2">
          {letters.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-[#0b1a3a]/5 border border-[#0b1a3a]/10 px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="shrink-0 rounded-md bg-[#d8ad5b]/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#b98532]">
                  {l.category}
                </span>
                <span className="truncate text-[11px] font-bold text-slate-700">
                  {l.code ? `${l.code} · ` : ''}{l.administrator || l.group}
                </span>
              </div>
              <span className="shrink-0 text-[11px] font-black text-[#0b1a3a]">
                {formatCurrency(l.credit)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome completo"
          required
          disabled={status === 'loading' || (hasLeadData && !!savedName)}
          readOnly={hasLeadData && !!savedName}
          className={hasLeadData && savedName ? inputReadOnly : inputBase}
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Seu melhor e-mail"
          required
          disabled={status === 'loading' || (hasLeadData && !!savedEmail)}
          readOnly={hasLeadData && !!savedEmail}
          className={hasLeadData && savedEmail ? inputReadOnly : inputBase}
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => {
            if (hasLeadData && savedPhone) return;
            const val = e.target.value.replace(/\D/g, '');
            let formatted = val;
            if (val.length <= 11) {
              formatted = val.replace(/^(\d{2})(\d)/g, '($1) $2').replace(/(\d)(\d{4})$/, '$1-$2');
            }
            setPhone(formatted);
          }}
          maxLength={15}
          placeholder="Seu celular"
          required
          disabled={status === 'loading' || (hasLeadData && !!savedPhone)}
          readOnly={hasLeadData && !!savedPhone}
          className={hasLeadData && savedPhone ? inputReadOnly : inputBase}
        />
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9.\-]*"
          value={cpf}
          onChange={(e) => {
            if (hasLeadData && savedCpf) return;
            setCpf(formatCpf(e.target.value));
          }}
          maxLength={14}
          placeholder="CPF (opcional)"
          disabled={status === 'loading' || (hasLeadData && !!savedCpf)}
          readOnly={hasLeadData && !!savedCpf}
          className={hasLeadData && savedCpf ? inputReadOnly : inputBase}
        />

        {hasLeadData && (
          <p className="text-[10px] text-slate-400 font-medium text-center">
            Dados preenchidos automaticamente do seu cadastro anterior.
          </p>
        )}

        {status === 'error' && (
          <p className="text-center text-xs font-bold text-red-500">Erro de conexão, tente novamente.</p>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="mt-2 flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#d8ad5b] to-[#b98532] px-6 py-3.5 text-[11px] font-black uppercase tracking-widest text-[#081728] shadow-lg transition-all duration-300 active:scale-[0.98] disabled:opacity-70 sm:rounded-2xl sm:px-8 sm:py-5 sm:text-sm"
        >
          {status === 'loading' ? (
            <Loader2 className="h-6 w-6 animate-spin text-[#081728]" />
          ) : (
            <>
              <BookmarkCheck size={18} />
              <span>Confirmar Intenção de Reserva</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ReserveForm;
