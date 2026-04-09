import React, { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { db } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

interface EmailCaptureProps {
  onSuccess?: (leadId: string) => void;
  title?: string;
  description?: string;
  source?: string;
}

const formatCpf = (val: string) => {
  const digits = val.replace(/\D/g, '').slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3}\.\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3}\.\d{3}\.\d{3})(\d)/, '$1-$2');
};

const EmailCapture: React.FC<EmailCaptureProps> = ({
  onSuccess,
  title = 'CADASTRE-SE PARA TER O ACESSO COMPLETO',
  description = 'Preencha seus dados para liberar o acesso completo e continuar vendo os detalhes das cartas contempladas.',
  source = 'Acesso Completo - Cartas',
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [cpf, setCpf] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !email.includes('@') || !phone) return;

    setStatus('loading');
    try {
      const docRef = await addDoc(collection(db, 'simulations'), {
        userName: name,
        userEmail: email,
        userPhone: phone,
        userCpf: cpf,
        source,
        type: 'Lead Cartas Contempladas',
        status: 'pending',
        createdAt: serverTimestamp(),
      });

      // Persist lead data locally for ReserveForm pre-fill
      localStorage.setItem('letters_lead_id', docRef.id);
      localStorage.setItem('letters_lead_name', name);
      localStorage.setItem('letters_lead_email', email);
      localStorage.setItem('letters_lead_phone', phone);
      localStorage.setItem('letters_lead_cpf', cpf);

      setStatus('success');
      if (onSuccess) {
        setTimeout(() => onSuccess(docRef.id), 500);
      } else {
        setName('');
        setEmail('');
        setPhone('');
        setCpf('');
      }
    } catch (e) {
      console.error('Error saving lead: ', e);
      setStatus('error');
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:ring-2 focus:ring-[#d8ad5b] disabled:opacity-50 sm:rounded-2xl sm:px-5 sm:py-4 sm:text-sm';

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-4 pb-6 shadow-2xl transition-all duration-500 sm:p-6">
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-xl bg-[#d8ad5b]/20 p-2 text-[#b98532] sm:p-3">
          <Mail size={18} />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase italic leading-tight tracking-tight text-[#0b1a3a] sm:text-lg">
            {title}
          </h3>
        </div>
      </div>

      <p className="mb-4 text-xs font-medium leading-relaxed text-slate-500 sm:mb-6 sm:text-sm">
        {description}
      </p>

      {status === 'success' ? (
        <div className="animate-fade-in flex flex-col items-center justify-center rounded-[2rem] border border-emerald-100 bg-emerald-50 p-8">
          <CheckCircle2 className="mb-4 h-12 w-12 text-emerald-600" />
          <p className="text-center text-sm font-black uppercase tracking-wider text-emerald-700">
            Acesso Liberado!
          </p>
          {!onSuccess && (
            <button
              onClick={() => setStatus('idle')}
              className="mt-6 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-emerald-600"
            >
              Realizar outro cadastro
            </button>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome completo"
            required
            disabled={status === 'loading'}
            className={inputClass}
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Seu melhor e-mail"
            required
            disabled={status === 'loading'}
            className={inputClass}
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
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
            disabled={status === 'loading'}
            className={inputClass}
          />
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9.\-]*"
            value={cpf}
            onChange={(e) => setCpf(formatCpf(e.target.value))}
            maxLength={14}
            placeholder="CPF (opcional)"
            disabled={status === 'loading'}
            className={inputClass}
          />

          {status === 'error' ? (
            <p className="text-center text-xs font-bold text-red-500">Erro de conexão, tente novamente.</p>
          ) : null}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="mt-2 flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#0b1a3a] to-[#071226] px-6 py-3.5 text-[11px] font-black uppercase tracking-widest text-white shadow-lg transition-all duration-300 active:scale-[0.98] disabled:opacity-70 sm:rounded-2xl sm:px-8 sm:py-5 sm:text-sm"
          >
            {status === 'loading' ? (
              <Loader2 className="h-6 w-6 animate-spin text-[#d8ad5b]" />
            ) : (
              <>
                <span className="text-sm">Liberar Acesso</span>
                <ArrowRight size={20} className="text-[#d8ad5b]" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default EmailCapture;
