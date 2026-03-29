import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Download, Building2, Calendar, Tag, FileText,
  BadgeCheck, Phone, Mail, ShieldCheck, TrendingUp
} from 'lucide-react';
import { ContemplatedLetter } from '../types';

interface CartaFichaProps {
  letter: ContemplatedLetter | null;
  onClose: () => void;
}

const fmtBRL = (val: number) => {
  if (typeof val !== 'number' || isNaN(val)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const STATUS_LABEL: Record<ContemplatedLetter['status'], string> = {
  available: 'Disponível',
  reserved: 'Reservada',
  sold: 'Vendida',
};

const STATUS_COLOR: Record<ContemplatedLetter['status'], string> = {
  available: 'text-emerald-600 border-emerald-400 bg-emerald-50',
  reserved: 'text-amber-600 border-amber-400 bg-amber-50',
  sold: 'text-slate-500 border-slate-300 bg-slate-50',
};

const CartaFicha: React.FC<CartaFichaProps> = ({ letter, onClose }) => {
  if (!letter) return null;

  const protocol = `CAR-${(letter.id || '').slice(-6).toUpperCase().padStart(6, '0')}`;

  const handlePrint = () => window.print();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[900] flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="relative w-full max-w-lg max-h-[88vh] bg-white shadow-2xl md:rounded-[2rem] print:shadow-none flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex-none sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between print:hidden z-20">
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
            >
              <Download size={15} />
              Baixar Ficha
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">

            {/* Info compacta (2x2) */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 border-t border-slate-100 pt-3">
              {/* Categoria / Bem */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Categoria / Bem</p>
                <p className="text-sm font-black text-slate-900 uppercase leading-snug truncate" title={letter.name || letter.category}>{letter.name || letter.category}</p>
                {letter.code && (
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">Cód: {letter.code}</p>
                )}
              </div>

              {/* Administradora */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Administradora</p>
                <p className="text-sm font-black text-slate-900 truncate" title={letter.administrator}>{letter.administrator}</p>
              </div>

              {/* Status */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 col-span-2 sm:col-span-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full border-2 font-black text-xs ${STATUS_COLOR[letter.status]}`}>
                  {STATUS_LABEL[letter.status]}
                </span>
              </div>
            </div>

            {/* Financial details */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <div className="flex items-start gap-2.5">
                <FileText size={18} className="text-slate-400 flex-shrink-0" />
                <div className="space-y-0.5 w-full text-xs sm:text-sm">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Crédito</span>
                    <span className="font-black text-emerald-600 text-base">{fmtBRL(letter.credit)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Entrada</span>
                    <span className="font-black text-slate-900">{fmtBRL(letter.entry)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Parcelas</span>
                    <span className="font-black text-slate-900">
                      {letter.installmentsCount}x de {fmtBRL(letter.installmentValue)}
                    </span>
                  </div>
                  {letter.saldoDevedor != null && (
                    <div className="flex justify-between items-center py-1 border-t border-slate-100 mt-1">
                      <span className="text-slate-400 text-xs">Saldo Devedor</span>
                      <span className="font-bold text-slate-700 text-xs">{fmtBRL(letter.saldoDevedor)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Taxa Transferência</span>
                    <span className="font-bold text-slate-700">{fmtBRL(letter.transferFee)}</span>
                  </div>
                  {letter.fundoComum != null && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500">Fundo Comum</span>
                      <span className="font-bold text-slate-700">{fmtBRL(letter.fundoComum)}</span>
                    </div>
                  )}
                  {letter.refGarantia != null && (
                    <div className="flex justify-between items-center py-1 border-t border-slate-100 mt-1 pt-1">
                      <span className="text-slate-500">Ref. Garantia</span>
                      <span className="font-bold text-slate-700">{fmtBRL(letter.refGarantia)}</span>
                    </div>
                  )}
                  {letter.insurance && (
                    <div className="flex justify-between items-center py-1 border-t border-slate-100 mt-1 pt-1">
                      <span className="text-slate-500 flex items-center gap-1"><ShieldCheck size={12} /> Seguro</span>
                      <span className="font-bold text-slate-700">{letter.insurance}</span>
                    </div>
                  )}
                  {letter.observations && (
                    <div className="py-1 border-t border-slate-100 mt-1 pt-2">
                      <span className="text-slate-400">Observações</span>
                      <p className="font-medium text-slate-600 mt-0.5">{letter.observations}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contact */}
            {(letter.contactPhone || letter.contactEmail) && (
              <div className="pt-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">
                  CONTATO DIRETO
                </p>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                  {letter.contactPhone && (
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-emerald-600" />
                      <a
                        href={`tel:${letter.contactPhone.replace(/\D/g, '')}`}
                        className="font-black text-slate-900 hover:text-emerald-600 transition-colors"
                      >
                        {letter.contactPhone}
                      </a>
                    </div>
                  )}
                  {letter.contactEmail && (
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-emerald-600" />
                      <a
                        href={`mailto:${letter.contactEmail}`}
                        className="font-black text-slate-900 hover:text-emerald-600 transition-colors text-sm"
                      >
                        {letter.contactEmail}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CartaFicha;
