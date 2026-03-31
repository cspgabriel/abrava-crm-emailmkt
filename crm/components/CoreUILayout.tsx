import React, { useState, useEffect } from 'react';
import { CSidebar, CSidebarNav, CNavItem, CContainer, CHeader, CHeaderToggler } from '@coreui/react';
import '@coreui/coreui/dist/css/coreui.min.css';

interface CoreUILayoutProps {
  children: React.ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export const CoreUILayout: React.FC<CoreUILayoutProps> = ({ children, currentPath, onNavigate, onLogout }) => {
  const [sidebarShow, setSidebarShow] = useState(window.innerWidth >= 768);

  // Auto-close sidebar on mobile when navigating
  useEffect(() => {
    if (window.innerWidth < 768) {
      setSidebarShow(false);
    }
  }, [currentPath]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans crm-container">
      <style>{`
        /* Overrides para CoreUI e Tailwind text colors */
        :root {
          --cui-sidebar-bg: transparent;
          --cui-body-color: #0f172a; /* Slate 900 */
        }
        
        /* Ocultar barra de rolagem mas manter funcionalidade */
        .crm-sidebar-scroll::-webkit-scrollbar { display: none; }
        .crm-sidebar-scroll { -ms-overflow-style: none; scrollbar-width: none; }

        /* Ajuste global de contraste a pedido do cliente (textos antes mto claros) */
        .crm-container .text-gray-500 { color: #334155 !important; font-weight: 500; }
        .crm-container .text-gray-400 { color: #475569 !important; font-weight: 500; }
        .crm-container .text-slate-500 { color: #334155 !important; font-weight: 500; }
        
        /* Ajuste do Sidebar Nav CoreUI */
        .cui-custom-nav .nav-link {
          color: #e6d9b3 !important;
          padding: 0.85rem 1.25rem;
          transition: all 0.2s;
          border-radius: 0.5rem;
          margin: 0.2rem 0.5rem;
        }
        .cui-custom-nav .nav-link:hover {
          background-color: rgba(19, 42, 87, 0.6) !important;
          color: #f3e6bf !important;
        }
        .cui-custom-nav .nav-link.active {
          background-color: #132a57 !important;
          color: #f3e6bf !important;
          font-weight: 700;
          border-left: 4px solid #d4af37;
        }
      `}</style>
      
      <aside 
        className={`fixed inset-y-0 left-0 w-64 bg-gradient-to-b from-[#0b1a3a] to-[#071226] border-r border-[#10224a] shadow-2xl z-[100] flex flex-col transition-transform duration-300 ease-in-out ${sidebarShow ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        <div className="p-6 flex flex-col items-center border-b border-[#10224a] text-center shrink-0">
             <img src="/logo_abravacom_transparent.png" alt="ABRAVACOM" className="h-[90px] w-auto object-contain mb-1" />
             <div className="text-center">
               <h1 className="font-bold text-sm tracking-[0.3em] text-[#d4af37]">CRM</h1>
             </div>
        </div>
        <div className="flex-1 overflow-y-auto crm-sidebar-scroll mt-4">
          <CSidebarNav className="cui-custom-nav text-[#e6d9b3] font-medium text-sm">
            <CNavItem href="#" active={currentPath === 'dashboard'} onClick={(e: any) => { e.preventDefault(); onNavigate('dashboard'); }}>
              Dashboard
            </CNavItem>
            <CNavItem href="#" active={currentPath === 'companies' || currentPath === 'company-details'} onClick={(e: any) => { e.preventDefault(); onNavigate('companies'); }}>
              Simulações (Empresas)
            </CNavItem>
            <CNavItem href="#" active={currentPath === 'contacts' || currentPath === 'contact-details'} onClick={(e: any) => { e.preventDefault(); onNavigate('contacts'); }}>
              Contatos
            </CNavItem>
            <CNavItem href="#" active={currentPath === 'campaigns' || currentPath === 'campaign-new' || currentPath === 'campaign-details'} onClick={(e: any) => { e.preventDefault(); onNavigate('campaigns'); }}>
              Campanhas
            </CNavItem>
            <CNavItem href="#" active={currentPath === 'whatsapp'} onClick={(e: any) => { e.preventDefault(); onNavigate('whatsapp'); }}>
              Envio WhatsApp
            </CNavItem>
            <CNavItem href="#" active={currentPath === 'email'} onClick={(e: any) => { e.preventDefault(); onNavigate('email'); }}>
              E-mail Marketing
            </CNavItem>
            <CNavItem href="#" active={currentPath === 'import'} onClick={(e: any) => { e.preventDefault(); onNavigate('import'); }}>
              Importação
            </CNavItem>
            <CNavItem href="#" active={currentPath === 'settings'} onClick={(e: any) => { e.preventDefault(); onNavigate('settings'); }}>
              Configurações
            </CNavItem>
            {/* New menu items */}
            <hr className="border-white/10 my-2" />
            <CNavItem href="#" onClick={(e: any) => { e.preventDefault(); onNavigate('new-company'); }} className="text-[#d8ad5b] font-bold">
              + Nova Simulação
            </CNavItem>
            <CNavItem href="#" onClick={(e: any) => { e.preventDefault(); onNavigate('new-contact'); }} className="text-[#d8ad5b] font-bold">
              + Novo Contato
            </CNavItem>
          </CSidebarNav>
        </div>
        <div className="mt-auto p-4 border-t border-white/10 shrink-0">
            <button onClick={(e) => { e.preventDefault(); onLogout(); }} className="w-full py-2.5 px-4 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2">
               Sair do Sistema
            </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col w-full h-full overflow-hidden bg-slate-50 relative lg:ml-64">
        {/* Overlay do CoreUI Mobile pode precisar de ajuda se z-index falhar */}
        {/* Overlay Black Backdrop for Mobile */}
        {sidebarShow && <div className="fixed inset-0 bg-black/60 z-[90] lg:hidden transition-opacity" onClick={() => setSidebarShow(false)}></div>}
        
        <CHeader position="sticky" className="bg-white shadow-sm border-b border-slate-200 py-3 shrink-0 z-20">
          <CContainer fluid className="px-4">
            <CHeaderToggler onClick={() => setSidebarShow(!sidebarShow)} />
            <div className="font-black text-slate-800 ml-4 tracking-wide text-xs sm:text-base">PORTAL DE GESTÃO INTERNA</div>
          </CContainer>
        </CHeader>
        <div className="flex-1 overflow-y-auto w-full text-slate-900">
          {children}
        </div>
      </div>
    </div>
  );
};
