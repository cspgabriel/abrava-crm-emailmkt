import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, Building2, Calendar, Tag, FileText, BadgeCheck, Send, Mail, Clock } from 'lucide-react';
import { Simulation } from '../types';

interface SimulacaoFichaProps {
  simulation: Simulation | null;
  onClose: () => void;
}

const fmtBRL = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const STATUS_LABEL: Record<Simulation['status'], string> = {
  pending: 'Não Enviada',
  analyzed: 'Enviada ao Cliente',
  completed: 'Concluída',
};

const STATUS_COLOR: Record<Simulation['status'], string> = {
  pending: 'text-red-600 border-red-400 bg-red-50',
  analyzed: 'text-blue-600 border-blue-400 bg-blue-50',
  completed: 'text-emerald-600 border-emerald-400 bg-emerald-50',
};

const SimulacaoFicha: React.FC<SimulacaoFichaProps> = ({ simulation, onClose }) => {
  if (!simulation) return null;

  const protocol = `SIM-${(simulation.id || '').slice(-6).toUpperCase().padStart(6, '0')}`;
  const createdDate = simulation.createdAt
    ? new Date((simulation.createdAt as any).seconds * 1000).toLocaleDateString('pt-BR')
    : '—';
  const sentDate = simulation.sentAt
    ? new Date((simulation.sentAt as any).seconds * 1000).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : null;
  const nextContactDate = simulation.nextContactAt
    ? new Date((simulation.nextContactAt as any).seconds * 1000).toLocaleDateString('pt-BR')
    : null;
  const contactDue = simulation.nextContactAt
    ? (simulation.nextContactAt as any).seconds * 1000 <= Date.now()
    : false;

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[900] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative min-h-screen md:min-h-0 md:my-8 max-w-2xl mx-auto bg-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] md:rounded-3xl print:shadow-none overflow-hidden"
        >
          {/* Header */}
          <div className="sticky top-0 bg-slate-50 border-b border-slate-100 px-5 py-3 flex items-center justify-between print:hidden z-10">
            <button
              onClick={onClose}
              className="p-2 rounded-full border border-slate-200 bg-white hover:bg-slate-100 transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft size={16} className="text-slate-600" />
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors shadow-md shadow-emerald-600/20"
            >
              <Download size={14} /> Baixar Ficha
            </button>
          </div>

          {/* Content */}
          <div className="p-5 md:p-6 space-y-5">
            {/* Protocol Header */}
            <div className="border-b-2 border-emerald-900 pb-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="text-xl font-black text-emerald-900 uppercase tracking-widest leading-none italic">
                    FINANCE8
                  </p>
                  <p className="text-[10px] font-black text-slate-500 uppercase mt-1">SIMULAÇÕES DE CONSÓRCIO</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-emerald-600 leading-none italic">{protocol}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-1">PROTOCOLO</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
              {/* LEFT COLUMN */}
              <div className="space-y-5">
                {/* Client */}
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    CLIENTE / SOLICITANTE
                  </p>
                  <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                    <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Building2 size={16} className="text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 uppercase text-sm leading-tight">
                        {simulation.userName}
                      </p>
                      <p className="text-xs text-slate-500">{simulation.userEmail}</p>
                      {simulation.userPhone && (
                        <p className="text-[10px] text-slate-400">{simulation.userPhone}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <button onClick={() => {
                      const ev = new CustomEvent('openWhatsAppSender', { detail: { phone: simulation.userPhone || '', name: simulation.userName || '', message: '' } });
                      window.dispatchEvent(ev);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center gap-2"><Send size={14} />Enviar WhatsApp</button>
                </div>

                {/* Date */}
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    DATA DA SIMULAÇÃO
                  </p>
                  <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                    <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Calendar size={16} className="text-emerald-600" />
                    </div>
                    <p className="font-black text-slate-900 text-sm">{createdDate}</p>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    STATUS E RESPONSÁVEL
                  </p>
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center flex items-center justify-between px-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full border-2 font-black text-[10px] uppercase ${STATUS_COLOR[simulation.status]}`}
                    >
                      {STATUS_LABEL[simulation.status]}
                    </span>
                    <p className="text-[10px] text-slate-500 uppercase font-black">
                      Resp: <strong className="text-slate-900">Finance8</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="space-y-5">
                {/* Send tracking */}
                {sentDate && (
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                      ENVIO & PRÓXIMO CONTATO
                    </p>
                    <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${simulation.sentBy === 'whatsapp' ? 'bg-emerald-100' : 'bg-blue-100'}`}>
                          {simulation.sentBy === 'whatsapp'
                            ? <Send size={12} className="text-emerald-600" />
                            : <Mail size={12} className="text-blue-600" />}
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Enviada via</p>
                          <p className="font-black text-slate-900 text-xs">
                            {simulation.sentBy === 'whatsapp' ? 'WhatsApp' : 'E-mail'}
                            <span className="font-normal text-slate-500 ml-1">em {sentDate}</span>
                          </p>
                        </div>
                      </div>
                      {nextContactDate && (
                        <div className={`flex items-center gap-2 rounded-xl p-2 ${contactDue ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-100'}`}>
                          <Clock size={12} className={contactDue ? 'text-emerald-600' : 'text-amber-500'} />
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Próximo Contato</p>
                            <p className={`font-black text-xs ${contactDue ? 'text-emerald-700' : 'text-amber-700'}`}>
                              {nextContactDate}
                              {contactDue
                                ? <span className="ml-2 text-[8px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full uppercase">Vencido</span>
                                : null}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Details */}
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                    DETALHES DO CRÉDITO
                  </p>
                  <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 mb-3 w-max">
                      <Tag size={12} className="text-emerald-600 flex-shrink-0" />
                      <p className="font-black text-slate-900 text-[10px] uppercase tracking-widest">{simulation.type}</p>
                    </div>

                    <div className="space-y-2 w-full text-xs">
                      <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                        <span className="text-slate-500 font-bold">Crédito Solicitado</span>
                        <span className="font-black text-emerald-600 text-sm">
                          {fmtBRL(simulation.creditAmount)}
                        </span>
                      </div>
                      {simulation.results ? (
                        <>
                          <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                            <span className="text-slate-500 font-bold">Meses</span>
                            <span className="font-black text-slate-900">
                              {simulation.results.installments}x
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                            <span className="text-slate-500 font-bold">Valor Mensal</span>
                            <span className="font-black text-slate-900">
                              {fmtBRL(simulation.results.monthlyValue)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                            <span className="text-slate-500 font-bold">Taxa Administrativa</span>
                            <span className="font-black text-slate-900">
                              {simulation.results.adminFee}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-1.5">
                            <span className="text-slate-500 font-bold">Fundo de Reserva</span>
                            <span className="font-black text-slate-900">
                              {simulation.results.reserveFund}%
                            </span>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-slate-400 italic py-2">
                          Aguardando análise da proposta.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer stamp */}
            <div className="flex items-center gap-1.5 text-emerald-600 justify-center pt-2 print:mt-8 border-t border-slate-100">
              <BadgeCheck size={14} />
              <p className="text-[9px] font-black uppercase tracking-[0.2em]">
                Gerado por Finance8
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SimulacaoFicha;
