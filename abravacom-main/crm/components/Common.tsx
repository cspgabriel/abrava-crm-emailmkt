import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Lock } from 'lucide-react';

export const Header = ({ title, subtitle, rightElement }: any) => (
  <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
    {rightElement && <div>{rightElement}</div>}
  </div>
);

export const StatCard = ({ label, value, icon: Icon, color, loading, subtext, onClick }: any) => (
  <div onClick={onClick} className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''}`}>
    <div><p className="text-sm font-medium text-gray-500 mb-1">{label}</p>{loading ? (<div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>) : (<><h3 className="text-2xl font-bold text-gray-900">{value}</h3>{subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}</>)}</div><div className={`p-3 rounded-lg ${color}`}><Icon className="h-6 w-6 text-white" /></div>
  </div>
);

export const FilterDropdown = ({ label, options, selectedValues = [], onChange }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  const currentSelected = Array.isArray(selectedValues) ? selectedValues : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt: string) => 
    String(opt).toLowerCase().includes(search.toLowerCase())
  );

  const handleSelectAll = () => {
    const newSelected = new Set([...currentSelected, ...filteredOptions]);
    onChange(Array.from(newSelected));
  };

  const handleClear = () => {
     const newSelected = currentSelected.filter((val: string) => !filteredOptions.includes(val));
     onChange(newSelected);
  };

  const toggleOption = (opt: string) => {
      if (currentSelected.includes(opt)) {
          onChange(currentSelected.filter((s: string) => s !== opt));
      } else {
          onChange([...currentSelected, opt]);
      }
  };

  return (
    <div className="relative w-full" ref={ref}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
          currentSelected.length > 0
            ? 'bg-blue-50 border-blue-200 text-blue-700' 
            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
        }`}
      >
        <span className="truncate max-w-[90%] text-left">
            {label}
            {currentSelected.length > 0 && <span className="ml-1 font-bold">({currentSelected.length})</span>}
        </span>
        <ChevronDown className="h-3 w-3 opacity-50 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col max-h-80">
          <div className="p-2 border-b border-gray-100">
              <input 
                type="text" 
                placeholder={`Buscar em ${label}...`}
                className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
              />
              <div className="flex justify-between mt-2 px-1">
                  <button onClick={handleSelectAll} className="text-xs text-blue-600 font-semibold hover:underline">Todos</button>
                  <button onClick={handleClear} className="text-xs text-gray-400 hover:text-gray-600">Limpar</button>
              </div>
          </div>
          
          <div className="overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
                <div className="p-2 text-xs text-gray-400 text-center">Nenhuma opção</div>
            ) : (
                filteredOptions.map((opt: string) => (
                <label key={opt} className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer">
                    <input 
                        type="checkbox" 
                        checked={currentSelected.includes(opt)}
                        onChange={() => toggleOption(opt)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                    />
                    <span className="text-xs text-gray-700 truncate">{opt || '(Vazio)'}</span>
                </label>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const LoginScreen = ({ onLogin }: any) => {
    const [pass, setPass] = useState('');
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0b1a3a] to-[#071226] flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center animate-in fade-in zoom-in-95 duration-300">
        <div className="mb-6 flex justify-center">
          <img
            src="/logo_abravacon_transparent.png"
            alt="ABRACON"
            className="h-14 w-auto object-contain"
          />
        </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Portal CRM</h2>
                <p className="text-sm text-gray-500 mb-8">Área restrita. Identifique-se para continuar.</p>
                <form onSubmit={(e) => { e.preventDefault(); onLogin(pass); }} className="space-y-4">
          <div className="relative"><Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" /><input autoFocus type="password" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-[#0b1a3a] placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#d4af37] focus:border-transparent transition-all" placeholder="Senha de acesso" value={pass} onChange={e => setPass(e.target.value)} /></div>
                    <button type="submit" className="w-full bg-[#d4af37] hover:bg-[#c9a532] text-[#0b1a3a] font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#d4af37]/30">Entrar no Sistema</button>
                </form>
                <p className="mt-8 text-xs text-gray-400">© 2024 ABRACON</p>
            </div>
        </div>
    )
}
