import React, { useState, useEffect, useMemo, useRef } from 'react';
import { CoreUILayout } from './components/CoreUILayout';
import './index.css';
import { 
  Users, Building2, LayoutDashboard, Search, Phone, Mail, MapPin, 
  ArrowRight, Briefcase, TrendingUp, MoreHorizontal, ChevronRight, 
  Upload, Hash, Clipboard, X, Download, Filter, SlidersHorizontal, 
  ArrowLeftRight, Send, CheckCircle, Clock, Folder, CheckSquare, 
  Square, Plus, Save, Eye, Columns, ListFilter, 
  MessageCircle, Edit2, Trash2, ArrowLeft, Calendar, ChevronDown, 
  ChevronUp, UserPlus, UserMinus, XCircle, RefreshCw, Link as LinkIcon,
  Database, Globe, AlertTriangle, Play, Mail as MailIcon, Share, ExternalLink,
    Star, Hotel, Settings, FileSpreadsheet, List, Copy, FileInput, Check,
  History as HistoryIcon, PlusCircle, Loader2, Repeat, Lock, LogOut,
  ArrowUpDown, MoreVertical, Tag, Map as MapIcon, CalendarDays, AtSign,
  Zap, Sparkles, Bot, Camera, Share2, Image as ImageIcon,
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Code,
  TableProperties, LayoutTemplate, Merge, ArrowUpAZ, ArrowDownZA,
  ChevronLeft
} from 'lucide-react';
import { read, utils } from 'xlsx';
import { 
  collection, getDocs, doc, setDoc, addDoc, getDoc, updateDoc,
  writeBatch, onSnapshot, query, where, deleteDoc, orderBy, serverTimestamp, limit, arrayUnion 
} from "firebase/firestore";

import { db } from '../firebase';
import { COMPANY_FIELDS, CONTACT_FIELDS } from './config/constants';
import { cleanText, getLinkedCompanies, safeRender, getStatusColor, getUniqueValues, getFormIdFromUrl, getUrlParam, getFilterableColumns, handleExport, sortData, cleanArrayValue, formatCurrencyBR, normalizeEmail, normalizePhone, parseCurrencyNumber } from './utils/helpers';

import { Header, StatCard, FilterDropdown, LoginScreen } from './components/Common';
import { BulkTagModal, CampaignModal, BulkCopyModal, BatchSendModal, WhatsappBatchModal } from './components/Modals';
import { MergeModal } from './components/MergeModal';
import { SystemSettingsModal } from './components/SystemSettingsModal';
import { DataEntryModal } from './components/DataEntryModal';
import { MappingModal } from './components/MappingModal';
import { FormBuilderModal } from './components/FormBuilderModal';
import { PublicFormView } from './components/PublicFormView';
import { DataEnrichmentModal } from './components/DataEnrichmentModal';
import { SettingsView } from './components/SettingsView';

import { CompanyDetailsView } from './components/CompanyDetailsView';
import { ContactDetailsView } from './components/ContactDetailsView';
import { CampaignDetailsView } from './components/CampaignDetailsView';
import { NewCampaignPage } from './components/NewCampaignPage';
import { DirectoryView } from './components/DirectoryView';
import { WhatsAppSender } from './components/WhatsAppSender';
import { EmailMarketing } from './components/EmailMarketing';
import { EmailMarketingWorkspace } from './components/EmailMarketingWorkspace';

export const App = () => {
        const WHATSAPP_API_URL = (
            (import.meta as any)?.env?.VITE_API_WPP?.trim?.() ||
            (import.meta as any)?.env?.VITE_WHATSAPP_API_URL?.trim?.() ||
            'https://wpp-api.abravacom.com.br'
        ).replace(/\/$/, '');
        const WPP_API_KEY = (
            (import.meta as any)?.env?.VITE_WPP_API_KEY?.trim?.() ||
            (import.meta as any)?.env?.VITE_X_API_KEY?.trim?.() ||
            (import.meta as any)?.env?.X_API_KEY?.trim?.() ||
            localStorage.getItem('crm_api_key')?.trim?.() ||
            localStorage.getItem('wpp_api_key')?.trim?.() ||
            ''
        );
  const initialView = getUrlParam('view');
  const [currentPath, setCurrentPath] = useState(() => initialView === 'campaign-new' ? 'campaign-new' : 'dashboard');
  const [publicFormId, setPublicFormId] = useState<string|null>(getFormIdFromUrl());
  const directoryMode = getUrlParam('view') === 'directory';
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
      return localStorage.getItem('crm_auth_token') === 'sind2026_valid';
  });
  const [companies, setCompanies] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  
  const [companyColumns, setCompanyColumns] = useState<string[]>([
      'userName',
      'userEmail',
      'userPhone',
      'type',
      'creditAmount',
      'status',
      'updatedAt'
  ]);
  // Updated default order to prioritize Name and Company
  const [contactColumns, setContactColumns] = useState<string[]>(['name', 'company_name', 'email', 'phone', 'total_simulations', 'mailing', 'role', 'updatedAt']);
  const [companyFilterColumns, setCompanyFilterColumns] = useState<string[]>([]);
  const [contactFilterColumns, setContactFilterColumns] = useState<string[]>(['role', 'department', 'mailing', 'company_industry', 'company_location', 'company_municipio']);
  const [companyDetailColumns, setCompanyDetailColumns] = useState<string[]>(COMPANY_FIELDS.map(f => f.key));
  const [contactDetailColumns, setContactDetailColumns] = useState<string[]>(CONTACT_FIELDS.map(f => f.key));
  const [companyEditColumns, setCompanyEditColumns] = useState<string[]>(COMPANY_FIELDS.map(f => f.key));
  const [contactEditColumns, setContactEditColumns] = useState<string[]>(CONTACT_FIELDS.map(f => f.key));
  
  const [showSystemSettings, setShowSystemSettings] = useState<'companies'|'contacts'|null>(null);

  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set()); 
  const [isAllCompaniesSelectedAcrossPages, setIsAllCompaniesSelectedAcrossPages] = useState(false);
  const [isAllContactsSelectedAcrossPages, setIsAllContactsSelectedAcrossPages] = useState(false);

  const [companiesPage, setCompaniesPage] = useState(1);
  const [contactsPage, setContactsPage] = useState(1);
  const PAGE_SIZE = 100;

  const [campaignModalOpen, setCampaignModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null);
  const [viewingCampaign, setViewingCampaign] = useState<any>(null);
  const [formBuilderOpen, setFormBuilderOpen] = useState(false);
  const [dataEntryModalOpen, setDataEntryModalOpen] = useState<'company'|'contact'|null>(null);
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [editingData, setEditingData] = useState<any>(null);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [linkedContactSelection, setLinkedContactSelection] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [globalStatus, setGlobalStatus] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importType, setImportType] = useState<'companies'|'contacts'>('companies');
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);
  const [rawImportData, setRawImportData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState<{[key:string]: string[]}>({});
  const [showFilters, setShowFilters] = useState(true);
  const [filterFormId, setFilterFormId] = useState<string | null>(null);
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [dashboardStartDate, setDashboardStartDate] = useState('');
  const [dashboardEndDate, setDashboardEndDate] = useState('');
  const [isCompanyEditMode, setIsCompanyEditMode] = useState(false);
  const [pendingCompanyChanges, setPendingCompanyChanges] = useState<{[id: string]: any}>({});
  
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [bulkTagModalOpen, setBulkTagModalOpen] = useState(false);
  const [bulkCopyModalOpen, setBulkCopyModalOpen] = useState(false);
  const [enrichmentModalOpen, setEnrichmentModalOpen] = useState(false);
  const [enrichmentCompanies, setEnrichmentCompanies] = useState<any[]>([]);
  
  const [itemsToMerge, setItemsToMerge] = useState<any[]>([]);
  const [mergeType, setMergeType] = useState<'companies'|'contacts'>('companies');
  // Default Sort Config set to updatedAt desc
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'updatedAt', direction: 'desc' });

  const [batchSendModalOpen, setBatchSendModalOpen] = useState(false);
  const [campaignBatches, setCampaignBatches] = useState<any[]>([]);
  const [whatsappBatchModalOpen, setWhatsappBatchModalOpen] = useState(false);
  const [whatsappBatches, setWhatsappBatches] = useState<any[]>([]);

  // Saved Views
  const [savedViews, setSavedViews] = useState<any[]>([]);
  const [activeSavedViewId, setActiveSavedViewId] = useState<string | null>(null);
  const [saveViewModal, setSaveViewModal] = useState<{ open: boolean; entityType: 'contacts' | 'companies' }>({ open: false, entityType: 'contacts' });
  const [saveViewName, setSaveViewName] = useState('');
  const [saveViewDefault, setSaveViewDefault] = useState(false);

  useEffect(() => {
    if (publicFormId) return; 
    if (!isAuthenticated && !directoryMode) return;
    const unsubCompanies = onSnapshot(collection(db, "simulations"), (snapshot) => {
      setCompanies(snapshot.docs.map(d => ({ ...(d.data() as any), id: d.id })));
    });
    const unsubContacts = onSnapshot(collection(db, "contacts"), (snapshot) => {
      setContacts(snapshot.docs.map(d => ({ ...(d.data() as any), id: d.id })));
    });
    const unsubCampaigns = onSnapshot(query(collection(db, "campaigns"), orderBy('date', 'desc')), (snapshot) => {
        setCampaigns(snapshot.docs.map(d => ({ ...(d.data() as any), id: d.id })));
    });
    const unsubForms = onSnapshot(collection(db, "forms"), (snapshot) => {
        setForms(snapshot.docs.map(d => ({ ...(d.data() as any), id: d.id })));
    });

    const unsubSettings = onSnapshot(doc(db, "settings", "global_preferences"), (doc) => {
        if (doc.exists()) {
            const data = doc.data();
            if (data.companyVisibleColumns) setCompanyColumns(data.companyVisibleColumns);
            if (data.companyFilterColumns) setCompanyFilterColumns(data.companyFilterColumns);
            if (data.companyDetailColumns) setCompanyDetailColumns(data.companyDetailColumns);
            if (data.companyEditColumns) setCompanyEditColumns(data.companyEditColumns);
            
            if (data.contactVisibleColumns) setContactColumns(data.contactVisibleColumns);
            if (data.contactFilterColumns) setContactFilterColumns(data.contactFilterColumns);
            if (data.contactDetailColumns) setContactDetailColumns(data.contactDetailColumns);
            if (data.contactEditColumns) setContactEditColumns(data.contactEditColumns);
        }
    });
    const ownerUid = localStorage.getItem('crm_auth_token') || 'anonymous';
    const savedQuery = query(collection(db, 'savedViews'), where('ownerUid', '==', ownerUid));
    const unsubSavedViews = onSnapshot(savedQuery, (snap) => {
      setSavedViews(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    });
    setLoading(false);
    return () => {
      unsubCompanies(); unsubContacts(); unsubCampaigns(); unsubForms(); unsubSettings(); unsubSavedViews();
    };
  }, [publicFormId, isAuthenticated, directoryMode]);

  const saveSystemSettings = async (newSettings: any) => {
      const type = showSystemSettings; 
      const visibleKey = type === 'companies' ? 'companyVisibleColumns' : 'contactVisibleColumns';
      const filterKey = type === 'companies' ? 'companyFilterColumns' : 'contactFilterColumns';
      const detailKey = type === 'companies' ? 'companyDetailColumns' : 'contactDetailColumns';
      const editKey = type === 'companies' ? 'companyEditColumns' : 'contactEditColumns';
      
      if (type === 'companies') { 
          setCompanyColumns(newSettings.visible); 
          setCompanyFilterColumns(newSettings.filters);
          setCompanyDetailColumns(newSettings.details);
          setCompanyEditColumns(newSettings.edit);
      } else { 
          setContactColumns(newSettings.visible); 
          setContactFilterColumns(newSettings.filters);
          setContactDetailColumns(newSettings.details);
          setContactEditColumns(newSettings.edit);
      }
      setShowSystemSettings(null);
      await setDoc(doc(db, 'settings', 'global_preferences'), { 
          [visibleKey]: newSettings.visible, 
          [filterKey]: newSettings.filters,
          [detailKey]: newSettings.details,
          [editKey]: newSettings.edit
      }, { merge: true });
  };

  const handleSort = (key: string) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      } else if (sortConfig && sortConfig.key === key && sortConfig.direction === 'desc') {
          setSortConfig(null);
          return;
      }
      setSortConfig({ key, direction });
  };

  const getAllFieldsForConfig = (type: 'companies' | 'contacts') => {
      const staticFields = type === 'companies' ? COMPANY_FIELDS : CONTACT_FIELDS;
      const data = type === 'companies' ? companies : enrichedContacts;
      const dynamicKeys = getFilterableColumns(data).filter(key => !staticFields.find(f => f.key === key) && !key.startsWith('_'));
      
      const dynamicFields = dynamicKeys.map(key => {
          let label = key.replace(/_/g, ' ');
          if (type === 'contacts' && key.startsWith('company_')) {
              label = `Simulação: ${key.replace('company_', '').charAt(0).toUpperCase() + key.replace('company_', '').slice(1)}`;
          }
          return { key, label };
      });
      
      return [...staticFields, ...dynamicFields];
  };

  const deleteCampaign = async (id: string, e: any) => { e.stopPropagation(); if(!confirm("Tem certeza que deseja excluir o histórico desta campanha?")) return; try { await deleteDoc(doc(db, "campaigns", id)); if (selectedCampaign && selectedCampaign.id === id) { setCurrentPath('campaigns'); setSelectedCampaign(null); } } catch (err) { console.error("Erro ao deletar campanha", err); alert("Erro ao excluir campanha."); } }
  const handleDeleteCompany = async (id: string) => { if (!confirm("ATENÇÃO: Deseja realmente excluir esta simulação? Esta ação não pode ser desfeita.")) return; try { await deleteDoc(doc(db, "simulations", id)); setCurrentPath('companies'); setSelectedCompany(null); setGlobalStatus('Simulação excluída com sucesso.'); setTimeout(() => setGlobalStatus(''), 2000); } catch (error) { console.error(error); alert("Erro ao excluir simulação."); } }
  const handleDeleteContact = async (id: string) => { if (!confirm("ATENÇÃO: Deseja realmente excluir este contato? Esta ação não pode ser desfeita.")) return; try { await deleteDoc(doc(db, "contacts", id)); setCurrentPath('contacts'); setSelectedContact(null); setGlobalStatus('Contato excluído com sucesso.'); setTimeout(() => setGlobalStatus(''), 2000); } catch (error) { console.error(error); alert("Erro ao excluir contato."); } }
  const createForm = async (formData: any) => { setFormBuilderOpen(false); try { await addDoc(collection(db, "forms"), { ...(typeof formData === 'object' ? formData : {}), createdAt: serverTimestamp(), isActive: true }); setGlobalStatus("Formulário criado!"); setTimeout(() => setGlobalStatus(''), 2000); } catch (e) { console.error(e); alert("Erro ao criar formulário."); } }
  const copyFormLink = (id: string) => { const url = `${window.location.origin}${window.location.pathname}?form=${id}`; navigator.clipboard.writeText(url); alert("Link copiado: " + url); }
  
  const handleSaveData = async (data: any) => { 
      const type = dataEntryModalOpen; 
      setDataEntryModalOpen(null); 
      if(!type) return; 
      
      const cleanData = { ...data }; 
      delete cleanData.type; delete cleanData.primary; delete cleanData.secondary; 
      Object.keys(cleanData).forEach(key => { if (cleanData[key] === undefined) delete cleanData[key]; }); 
      
      try { 
          const collectionName = type === 'company' ? 'simulations' : 'contacts'; 
          let docId = cleanData.id;
          if (type === 'company' && !cleanData.status) {
              cleanData.status = 'Recebida, não enviada';
          } 
          
          const historyEntry = { 
              date: new Date().toISOString(), 
              type: 'edit', 
              source: 'user', 
              description: editingData ? 'Edição manual de dados' : 'Criação manual de registro' 
          };

          if (editingData && editingData.id) { 
              docId = editingData.id; 
              await setDoc(doc(db, collectionName, docId), { 
                  ...cleanData, 
                  updatedAt: serverTimestamp(),
                  history: arrayUnion(historyEntry)
              }, { merge: true }); 
              
              if (type === 'company' && selectedCompany && selectedCompany.id === docId) { setSelectedCompany({ ...selectedCompany, ...cleanData }); } 
              if (type === 'contact' && selectedContact && selectedContact.id === docId) { setSelectedContact({ ...selectedContact, ...cleanData }); } 
              setGlobalStatus(`${type === 'company' ? 'Simulação' : 'Contato'} atualizado!`); 
          } else { 
              if (!docId) { 
                  const prefix = type === 'company' ? 'cp' : 'ct'; 
                  docId = `${prefix}_${Date.now()}_manual`; 
              } 
              if (type === 'contact' && !cleanData.companyId) { cleanData.companyId = 'manual_entry'; } 
              
              await setDoc(doc(db, collectionName, docId), { 
                  ...cleanData, 
                  id: docId, 
                  createdAt: serverTimestamp(), 
                  source: 'manual_button',
                  history: [historyEntry]
              }); 
              setGlobalStatus(`${type === 'company' ? 'Simulação' : 'Contato'} criado!`); 
          } 
          setEditingData(null); 
          setTimeout(() => setGlobalStatus(''), 2000); 
      } catch (e) { console.error(e); alert("Erro ao salvar."); } 
  }

  const handleFileRead = async (file: File, type: 'companies' | 'contacts') => { try { setGlobalStatus('Lendo arquivo...'); const data = await file.arrayBuffer(); const workbook = read(data); const worksheet = workbook.Sheets[workbook.SheetNames[0]]; const jsonData = utils.sheet_to_json(worksheet); if (jsonData.length === 0) { alert("Arquivo vazio"); setGlobalStatus(''); return; } const headers = Object.keys(jsonData[0] as object); setFileHeaders(headers); setRawImportData(jsonData); setImportType(type); setImportModalOpen(true); setGlobalStatus(''); } catch (e) { console.error(e); alert("Erro ao ler arquivo"); setGlobalStatus(''); } };
  const executeImport = async (mapping: any) => { 
      setImportModalOpen(false); 
      setGlobalStatus(`Importando ${rawImportData.length} registros...`); 
      try { 
          const batchLimit = 400; 
          let batch = writeBatch(db); 
          let count = 0; 
          let total = 0; 
          
          const targetCollection = importType === 'companies' ? 'simulations' : 'contacts';
          for (const row of rawImportData) { 
              const newItem: any = { ...(typeof row === 'object' ? row : {}) }; 
              
              Object.keys(mapping).forEach(crmKey => { 
                  const excelHeader = mapping[crmKey]; 
                  if (excelHeader && row[excelHeader] !== undefined) { 
                      newItem[crmKey] = String(row[excelHeader]).trim(); 
                  } 
              }); 
              
              let docId = newItem.id; 
              if (importType === 'companies') { 
                  if (!docId) docId = `cp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; 
                  newItem.id = docId; 
              } else { 
                  docId = `ct_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; 
                  if (!newItem.companyId) newItem.companyId = 'orphan'; 
              } 
              
              // Tag source as import for history logging
              newItem.source = 'import_file';
              if (!newItem.createdAt) newItem.createdAt = serverTimestamp();

              const docRef = doc(db, targetCollection, docId); 
              batch.set(docRef, newItem, { merge: true }); 
              
              count++; 
              if (count >= batchLimit) { 
                  await batch.commit(); 
                  total += count; 
                  batch = writeBatch(db); 
                  count = 0; 
                  setGlobalStatus(`Salvos ${total} de ${rawImportData.length}...`); 
              } 
          } 
          if (count > 0) { await batch.commit(); } 
          setGlobalStatus('Importação concluída com sucesso!'); 
          setTimeout(() => setGlobalStatus(''), 3000); 
      } catch (error) { 
          console.error(error); 
          setGlobalStatus('Erro na importação.'); 
          alert("Ocorreu um erro ao salvar os dados."); 
      } 
  };
  const wipeDatabase = async () => { if (!confirm("ATENÇÃO: Isso apagará TODAS as simulações e contatos do sistema permanentemente. Deseja continuar?")) return; setGlobalStatus('Limpando banco de dados...'); try { const cols = ['simulations', 'contacts', 'campaigns', 'forms']; for (const colName of cols) { const q = query(collection(db, colName)); const snapshot = await getDocs(q); const batchLimit = 400; let batch = writeBatch(db); let count = 0; for (const doc of snapshot.docs) { batch.delete(doc.ref); count++; if (count >= batchLimit) { await batch.commit(); batch = writeBatch(db); count = 0; } } if (count > 0) await batch.commit(); } setGlobalStatus('Banco de dados limpo.'); setTimeout(() => setGlobalStatus(''), 2000); } catch (e) { console.error(e); setGlobalStatus('Erro ao limpar.'); } };
  const toggleSelection = (id: string) => { 
    setIsAllContactsSelectedAcrossPages(false);
    const newSet = new Set(selectedContactIds); 
    if (newSet.has(id)) newSet.delete(id); 
    else newSet.add(id); 
    setSelectedContactIds(newSet); 
  }
  const toggleAllSelection = (allFilteredItems: any[]) => { 
    const allSelected = allFilteredItems.length > 0 && allFilteredItems.every(item => selectedContactIds.has(item.id));
    if (allSelected) {
        setSelectedContactIds(new Set());
        setIsAllContactsSelectedAcrossPages(false);
    } else {
        const newSet = new Set<string>();
        allFilteredItems.forEach(item => newSet.add(item.id));
        setSelectedContactIds(newSet);
        setIsAllContactsSelectedAcrossPages(true);
    }
  }
  
  const toggleCompanySelection = (id: string) => { 
    setIsAllCompaniesSelectedAcrossPages(false);
    const newSet = new Set(selectedCompanyIds); 
    if(newSet.has(id)) newSet.delete(id); 
    else newSet.add(id); 
    setSelectedCompanyIds(newSet); 
  }
  const toggleAllCompanySelection = (allFilteredItems: any[]) => { 
    const allSelected = allFilteredItems.length > 0 && allFilteredItems.every(item => selectedCompanyIds.has(item.id));
    if (allSelected) {
        setSelectedCompanyIds(new Set());
        setIsAllCompaniesSelectedAcrossPages(false);
    } else {
        const newSet = new Set<string>();
        allFilteredItems.forEach(item => newSet.add(item.id));
        setSelectedCompanyIds(newSet);
        setIsAllCompaniesSelectedAcrossPages(true);
    }
  }

  const selectAllCompaniesAcrossPages = (filtered: any[]) => {
    const newSet = new Set<string>();
    filtered.forEach(c => newSet.add(c.id));
    setSelectedCompanyIds(newSet);
    setIsAllCompaniesSelectedAcrossPages(true);
  };

  const selectAllContactsAcrossPages = (filtered: any[]) => {
    const newSet = new Set<string>();
    filtered.forEach(c => newSet.add(c.id));
    setSelectedContactIds(newSet);
    setIsAllContactsSelectedAcrossPages(true);
  };

  const buildMailtoBatches = (emails: string[], subject: string, body?: string) => {
      const BATCH_SIZE = 500;
      const batches = [];
      for (let i = 0; i < emails.length; i += BATCH_SIZE) {
          const chunk = emails.slice(i, i + BATCH_SIZE);
          const bccString = chunk.join(',');
          const mailtoLink = `mailto:?bcc=${bccString}&subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}`;
          batches.push({ count: chunk.length, link: mailtoLink });
      }
      return batches;
  };

  const handleCreateCampaign = async (subject: string, responsible: string) => { 
      if (creatingCampaign) return; 
      setCreatingCampaign(true); 
      let idsToUse = selectedContactIds; 
      if (currentPath === 'company-details' && linkedContactSelection.size > 0) { idsToUse = linkedContactSelection; } 
      if (directoryMode && idsToUse.size === 0 && selectedIdsRef.current.size > 0) { idsToUse = selectedIdsRef.current; } 
      let targetContacts = []; 
      if (idsToUse.size > 0) { targetContacts = groupedContacts.filter(c => idsToUse.has(c.id)); } 
      else if (selectedContact) { targetContacts = [selectedContact]; } 
      const emails = targetContacts.map(c => c.email).filter(e => e && e.includes('@')); 
      if (emails.length === 0) { alert("Nenhum email válido encontrado nos contatos selecionados."); setCreatingCampaign(false); return; } 
      
      const campaignData = { subject, responsible, recipientCount: emails.length, date: serverTimestamp(), status: 'Enviado', recipientEmails: emails, recipientsSample: emails.slice(0, 5) }; 
      
      try {
          // Attempt to save to history, but don't let rules block the actual send action
          await addDoc(collection(db, "campaigns"), campaignData);
      } catch (err) {
          console.warn("Could not save to campaigns history (Firebase Rules may be blocking or missing permissions):", err);
      }

      try {
          if (emails.length > 500) {
              const batches = buildMailtoBatches(emails, subject);
              setCampaignBatches(batches);
              setBatchSendModalOpen(true);
          } else {
              const bccString = emails.join(','); 
              const mailtoLink = `mailto:?bcc=${bccString}&subject=${encodeURIComponent(subject)}`; 
              window.location.href = mailtoLink; 
          }

          setCampaignModalOpen(false); 
          setSelectedContactIds(new Set()); 
          setLinkedContactSelection(new Set()); 
          
          if (!selectedContact && currentPath !== 'company-details' && !directoryMode) { setCurrentPath('campaigns'); } 
      } catch(err) { console.error(err); alert("Erro ao agendar envio da campanha."); } finally { setCreatingCampaign(false); } 
  }
  const selectedIdsRef = useRef(new Set<string>());
  const handleDirectoryCampaign = (ids: Set<string>) => { selectedIdsRef.current = ids; setSelectedContactIds(ids); setCampaignModalOpen(true); }
  const handleReuseMailing = (campaign: any) => { const emails = new Set(campaign.recipientEmails || []); const matchingContacts = contacts.filter(c => c.email && emails.has(c.email)); const newSelection = new Set(matchingContacts.map(c => c.id)); if (newSelection.size === 0) { alert("Não foi possível encontrar os contatos originais desta campanha na base atual."); return; } setSelectedContactIds(newSelection); setCurrentPath('contacts'); setCampaignModalOpen(true); }

  const handleCreateCampaignPage = async (payload: { subject: string; responsible: string; body: string; recipients: any[]; method?: 'email' | 'whatsapp' }) => {
      if (creatingCampaign) return;
      const { subject, responsible, body, recipients, method = 'email' } = payload;
      if (!subject || !responsible) { alert("Preencha assunto e responsável."); return; }
      
      const targets = method === 'whatsapp' ? recipients.filter(c => c.phone) : recipients.filter(c => c.email && c.email.includes('@'));
      if (targets.length === 0) { alert(`Nenhum contato válido encontrado para o método selecionado (${method}).`); return; }
      
      setCreatingCampaign(true);
      const targetList = method === 'whatsapp' ? targets.map(c => c.phone) : targets.map(c => c.email);
      const campaignData = { subject, responsible, message: body || '', recipientCount: targets.length, date: serverTimestamp(), status: 'Enviado', recipientEmails: targetList, recipientsSample: targetList.slice(0, 5), method };
      
      try {
          // Attempt to save to history, but don't let rules block the actual send action
          await addDoc(collection(db, "campaigns"), campaignData);
      } catch (err) {
          console.warn("Could not save to campaigns history (Firebase Rules may be blocking or missing permissions):", err);
      }
      
      try {
          if (method === 'whatsapp') {
              const contactsPayload = targets.map(c => ({
                  name: c.name || '',
                  phone: String(c.phone || '').replace(/\D/g, '')
              }));

              const apiBase = WHATSAPP_API_URL ? WHATSAPP_API_URL.replace(/\/$/, '') : '';
              const sendUrl = `${apiBase}/send${WPP_API_KEY ? `?api_key=${encodeURIComponent(WPP_API_KEY)}` : ''}`;

              try {
                  setGlobalStatus('Enviando campanha WhatsApp via API...');
                  let success = 0;
                  let failed = 0;
                  const total = contactsPayload.length;
                  for (let i = 0; i < contactsPayload.length; i++) {
                      const contact = contactsPayload[i];
                      setGlobalStatus(`Enviando WhatsApp ${i + 1}/${total}...`);
                      try {
                          const response = await fetch(sendUrl, {
                              method: 'POST',
                              headers: {
                                  'Content-Type': 'application/json',
                                  ...(WPP_API_KEY ? { 'x-api-key': WPP_API_KEY } : {})
                              },
                              body: JSON.stringify({
                                  phone: contact.phone,
                                  message: body || subject,
                                  name: contact.name
                              })
                          });
                          const result = await response.json().catch(() => ({}));
                          if (!response.ok || !result?.ok) {
                              console.warn(`Falha ao enviar para ${contact.phone}:`, result?.error);
                              failed++;
                          } else {
                              success++;
                          }
                      } catch (e) {
                          console.warn(`Erro ao enviar para ${contact.phone}:`, e);
                          failed++;
                      }
                      // Delay entre envios para evitar bloqueio (15-45s)
                      if (i < contactsPayload.length - 1) {
                          const delay = 15000 + Math.random() * 30000;
                          await new Promise(r => setTimeout(r, delay));
                      }
                  }

                  setGlobalStatus(`WhatsApp concluido: ${success}/${total} enviados (${failed} falhas).`);
                  setTimeout(() => setGlobalStatus(''), 6000);
                  alert(`Campanha WhatsApp concluida.\nEnviados: ${success}\nFalhas: ${failed}`);
              } catch (apiError) {
                  console.warn('API WhatsApp indisponivel, usando fallback por links wa.me:', apiError);
                  setGlobalStatus('API WhatsApp indisponivel. Abrindo fallback com links wa.me...');
                  setTimeout(() => setGlobalStatus(''), 6000);

                  const batches = targets.map(c => {
                      const cleaned = c.phone.replace(/\D/g, '');
                      const link = `https://wa.me/55${cleaned}?text=${encodeURIComponent(body || subject)}`;
                      return { name: c.name, phone: c.phone, link };
                  });
                  setWhatsappBatches(batches);
                  setWhatsappBatchModalOpen(true);
              }
          } else {
              if (targets.length > 500) {
                  const batches = buildMailtoBatches(targetList, subject, body);
                  setCampaignBatches(batches);
                  setBatchSendModalOpen(true);
              } else {
                  const bccString = targetList.join(',');
                  const mailtoLink = `mailto:?bcc=${bccString}&subject=${encodeURIComponent(subject)}${body ? `&body=${encodeURIComponent(body)}` : ''}`;
                  window.location.href = mailtoLink;
              }
              setCurrentPath('campaigns');
          }
      } catch (err) {
          console.error(err);
          alert("Erro ao processar envio/links da campanha.");
      } finally {
          setCreatingCampaign(false);
      }
  };

  // ── Saved Views handlers ──────────────────────────────────────────────────
  const handleSaveView = async () => {
    if (!saveViewName.trim()) return;
    const entityType = saveViewModal.entityType === 'contacts' ? 'contact' : 'company';
    try {
      const ownerUid = localStorage.getItem('crm_auth_token') || 'anonymous';
      const ref = await addDoc(collection(db, 'savedViews'), {
        name: saveViewName.trim(),
        entityType,
        filters: activeFilters,
        ownerUid,
        isDefault: false,
        createdAt: serverTimestamp(),
      });
      if (saveViewDefault) {
        const q = query(collection(db, 'savedViews'), where('entityType', '==', entityType), where('isDefault', '==', true));
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        snap.forEach(d => { if (d.id !== ref.id) batch.update(doc(db, 'savedViews', d.id), { isDefault: false }); });
        batch.update(doc(db, 'savedViews', ref.id), { isDefault: true });
        await batch.commit();
      }
      setActiveSavedViewId(ref.id);
      setSaveViewModal(p => ({ ...p, open: false }));
      setSaveViewName('');
      setSaveViewDefault(false);
      setGlobalStatus('Visualização salva!');
      setTimeout(() => setGlobalStatus(''), 2000);
    } catch (e) { console.error(e); alert('Erro ao salvar visualização.'); }
  };

  const handleDeleteSavedView = async (id: string) => {
    if (!confirm('Deseja excluir esta visualização salva?')) return;
    await deleteDoc(doc(db, 'savedViews', id));
    if (activeSavedViewId === id) { setActiveSavedViewId(null); setActiveFilters({}); }
  };

  const handleSetDefaultView = async (id: string, entityType: string) => {
    const view = savedViews.find((v: any) => v.id === id);
    if (!view) return;
    if (view.isDefault) {
      await updateDoc(doc(db, 'savedViews', id), { isDefault: false });
    } else {
      const ownerUid = localStorage.getItem('crm_auth_token') || 'anonymous';
      const q = query(collection(db, 'savedViews'), where('ownerUid','==', ownerUid), where('entityType', '==', entityType), where('isDefault', '==', true));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.forEach(d => { if (d.id !== id) batch.update(doc(db, 'savedViews', d.id), { isDefault: false }); });
      batch.update(doc(db, 'savedViews', id), { isDefault: true });
      await batch.commit();
    }
  };

  const handleRenameView = async (id: string, name: string) => {
    if (!name.trim()) return;
    await updateDoc(doc(db, 'savedViews', id), { name: name.trim() });
  };

  const applyView = (view: any) => {
    setActiveFilters(view.filters || {});
    setActiveSavedViewId(view.id);
  };
  // ─────────────────────────────────────────────────────────────────────────

  const handleCompanyCellEdit = (id: string, field: string, value: string) => {
      setPendingCompanyChanges(prev => {
          const item = prev[id] || {};
          return {
            ...prev,
            [id]: {
                ...(typeof item === 'object' ? item : {}),
                [field]: value
            }
          };
      });
  };

  const saveCompanyBatchChanges = async () => {
      const count = Object.keys(pendingCompanyChanges).length;
      if (count === 0) { setIsCompanyEditMode(false); return; }
      setGlobalStatus(`Salvando alterações em ${count} simulações...`);
      try {
          const batchLimit = 400; let batch = writeBatch(db); let opCount = 0;
          for (const [id, changes] of Object.entries(pendingCompanyChanges)) {
              const ref = doc(db, "simulations", id);
              // Note: Ideally batch should also push history, but Firestore batch arrayUnion is limited.
              // For simple bulk edit, we just update fields.
              batch.update(ref, { ...(typeof changes === 'object' ? changes : {}), updatedAt: serverTimestamp() });
              opCount++;
              if (opCount >= batchLimit) { await batch.commit(); batch = writeBatch(db); opCount = 0; }
          }
          if (opCount > 0) await batch.commit();
          setPendingCompanyChanges({}); setIsCompanyEditMode(false); setGlobalStatus('Alterações salvas com sucesso!'); setTimeout(() => setGlobalStatus(''), 2000);
      } catch (e) { console.error(e); alert("Erro ao salvar alterações em massa."); setGlobalStatus(''); }
  };

  const handleBulkTags = async (tagsString: string) => {
      setBulkTagModalOpen(false);
      const tagList = tagsString.split(';').map(t => t.trim()).filter(Boolean);
      if(tagList.length === 0) return;

      const type = currentPath === 'companies' ? 'companies' : 'contacts';
      const collectionName = type === 'companies' ? 'simulations' : 'contacts';
      const ids = type === 'companies' ? selectedCompanyIds : selectedContactIds;
      if(ids.size === 0) return;

      setGlobalStatus(`Adicionando tags a ${ids.size} registros...`);
      try {
          const batchLimit = 400; let batch = writeBatch(db); let opCount = 0;
          for(const id of ids) {
              const ref = doc(db, collectionName, id);
              // Use arrayUnion for robust adding
              batch.set(ref, { tags: arrayUnion(...tagList) }, { merge: true });
              opCount++;
              if (opCount >= batchLimit) { await batch.commit(); batch = writeBatch(db); opCount = 0; }
          }
          if (opCount > 0) await batch.commit();
          setGlobalStatus('Tags adicionadas com sucesso!');
          setTimeout(() => setGlobalStatus(''), 2000);
      } catch (e) {
          console.error(e);
          alert("Erro ao adicionar tags.");
          setGlobalStatus('');
      }
  };

  const handleBulkCopy = async (sourceField: string, targetField: string, overwrite: boolean) => {
      setBulkCopyModalOpen(false);
      const type = currentPath === 'companies' ? 'companies' : 'contacts';
      const collectionName = type === 'companies' ? 'simulations' : 'contacts';
      const ids = type === 'companies' ? selectedCompanyIds : selectedContactIds;
      const dataList = type === 'companies' ? companies : contacts;
      
      if(ids.size === 0) return;

      setGlobalStatus(`Copiando dados de ${sourceField} para ${targetField}...`);
      
      try {
          const batchLimit = 400;
          let batch = writeBatch(db);
          let opCount = 0;
          let updatedCount = 0;

          for(const id of ids) {
              const item = dataList.find(i => i.id === id);
              if (!item) continue;

              const sourceValue = item[sourceField];
              
              // Skip if source is empty
              if (sourceValue === undefined || sourceValue === null || sourceValue === '') continue;

              // Check overwrite condition
              if (!overwrite && item[targetField]) continue;

              // Transform value: If source is array, join it. Ideally target is string.
              let finalValue = sourceValue;
              if (Array.isArray(sourceValue)) {
                  finalValue = sourceValue.map(v => String(v).trim()).join('; ');
              } else if (typeof sourceValue === 'object') {
                  finalValue = JSON.stringify(sourceValue);
              }

              const ref = doc(db, collectionName, id);
              batch.update(ref, { [targetField]: finalValue, updatedAt: serverTimestamp() });
              
              opCount++;
              updatedCount++;
              
              if (opCount >= batchLimit) {
                  await batch.commit();
                  batch = writeBatch(db);
                  opCount = 0;
              }
          }

          if (opCount > 0) await batch.commit();
          
          setGlobalStatus(`${updatedCount} registros atualizados!`);
          
          if (type === 'companies') setSelectedCompanyIds(new Set());
          else setSelectedContactIds(new Set());

          setTimeout(() => setGlobalStatus(''), 2000);

      } catch (e) {
          console.error(e);
          alert("Erro ao copiar dados.");
          setGlobalStatus('');
      }
  };

  const handleEnrichmentSave = async (updates: any) => {
      setGlobalStatus(`Salvando ${Object.keys(updates).length} atualizações...`);
      try {
          const batchLimit = 400;
          let batch = writeBatch(db);
          let opCount = 0;

          for (const [id, data] of Object.entries(updates)) {
              const ref = doc(db, "simulations", id);
              
              // Create detailed description of changes for history
              const changesList = Object.entries(data as object).map(([key, value]) => {
                  // Attempt to find label, otherwise use key
                  const label = COMPANY_FIELDS.find(f => f.key === key)?.label || key;
                  return `${label} → ${safeRender(value)}`;
              }).join('; ');

              const historyEntry = { 
                  date: new Date().toISOString(), 
                  type: 'enrichment', 
                  source: 'AI', 
                  description: `Atualizado por IA: ${changesList}` 
              };

              batch.update(ref, { 
                  ...data as object, 
                  updatedAt: serverTimestamp(),
                  history: arrayUnion(historyEntry)
              });
              opCount++;
              
              if (opCount >= batchLimit) {
                  await batch.commit();
                  batch = writeBatch(db);
                  opCount = 0;
              }
          }

          if (opCount > 0) await batch.commit();
          setGlobalStatus('Dados enriquecidos salvos com sucesso!');
          
          // Clear selections if in bulk mode
          if (currentPath === 'companies') {
             setSelectedCompanyIds(new Set());
          }
          // Also update selectedCompany if viewing one
          if (selectedCompany && updates[selectedCompany.id]) {
             setSelectedCompany(prev => ({ ...prev, ...updates[selectedCompany.id] }));
          }

          setTimeout(() => setGlobalStatus(''), 2000);
      } catch (e) {
          console.error(e);
          alert("Erro ao salvar dados de enriquecimento.");
          setGlobalStatus('');
      }
  };

  const startEnrichment = (targetCompanies: any[]) => {
      setEnrichmentCompanies(targetCompanies);
      setEnrichmentModalOpen(true);
  };

  const startMerge = (type: 'companies'|'contacts') => {
      const ids = type === 'companies' ? selectedCompanyIds : selectedContactIds;
      if(ids.size < 2) return;
      
      const sourceData = type === 'companies' ? companies : contacts;
      const items = sourceData.filter(i => ids.has(i.id));
      
      setItemsToMerge(items);
      setMergeType(type);
      setMergeModalOpen(true);
  };

  const executeMerge = async (masterId: string, deleteIds: string[], mergedData: any) => {
      setMergeModalOpen(false);
      setGlobalStatus(`Mesclando registros...`);
      
      try {
          const collectionName = mergeType === 'companies' ? 'simulations' : 'contacts';
          const batchLimit = 400; 
          let batch = writeBatch(db); 
          let opCount = 0;
          
          // SPECIAL LOGIC FOR COMPANIES: PRESERVE CONTACTS
          if (collectionName === 'simulations') {
              // Find contacts linked to deleted companies
              const secondaryContacts = contacts.filter(c => {
                  const linkedIds = String(c.companyId || '').split(';').map(s => s.trim());
                  return deleteIds.some(delId => linkedIds.includes(delId));
              });

              // Get all contacts already in Master (to check for duplicates)
              const masterContacts = contacts.filter(c => {
                  const linkedIds = String(c.companyId || '').split(';').map(s => s.trim());
                  return linkedIds.includes(masterId);
              });
              const masterEmails = new Set(masterContacts.map(c => c.email).filter(e => e));

              for (const contact of secondaryContacts) {
                  // DUPLICATE CHECK: If master already has this email, delete the secondary contact to prevent duplication
                  if (contact.email && masterEmails.has(contact.email)) {
                       const contactRef = doc(db, 'contacts', contact.id);
                       batch.delete(contactRef);
                  } else {
                      // Move to Master
                      let linkedIds = String(contact.companyId || '').split(';').map(s => s.trim());
                      // Remove deleted IDs
                      linkedIds = linkedIds.filter(id => !deleteIds.includes(id));
                      // Add Master ID if not present
                      if (!linkedIds.includes(masterId)) linkedIds.push(masterId);
                      
                      const newCompanyId = linkedIds.join('; ');
                      const newCompanyName = mergedData.name; // Use master company name

                      const contactRef = doc(db, 'contacts', contact.id);
                      batch.update(contactRef, { 
                          companyId: newCompanyId,
                          company_name: newCompanyName,
                          updatedAt: serverTimestamp() 
                      });
                  }
                  
                  opCount++;
                  if (opCount >= batchLimit) { await batch.commit(); batch = writeBatch(db); opCount = 0; }
              }
          } else {
              // FOR CONTACT MERGE: No special secondary logic needed, just delete duplicates
          }

          // 1. Update Master
          await setDoc(doc(db, collectionName, masterId), {
              ...(typeof mergedData === 'object' ? mergedData : {}),
              updatedAt: serverTimestamp()
          }, { merge: true });

          // 2. Delete others
          for(const id of deleteIds) {
              const delRef = doc(db, collectionName, id);
              batch.delete(delRef);
              opCount++;
              if (opCount >= batchLimit) { await batch.commit(); batch = writeBatch(db); opCount = 0; }
          }
          
          if (opCount > 0) await batch.commit();

          if (mergeType === 'companies') setSelectedCompanyIds(new Set());
          else setSelectedContactIds(new Set());

          setGlobalStatus('Mesclagem concluída!');
          setTimeout(() => setGlobalStatus(''), 2000);

      } catch (e) {
          console.error(e);
          alert("Erro ao mesclar registros.");
          setGlobalStatus('');
      }
  };

  const enrichedContacts = useMemo(() => {
      const normalizedContacts = contacts.map(c => {
          const base = (c && typeof c === 'object') ? c : {};
          const emailKey = normalizeEmail(base.email);
          const phoneKey = normalizePhone(base.phone);
          const nameKey = cleanText(base.name || '').toLowerCase();
          return { base, emailKey, phoneKey, nameKey };
      });

      const linkedSimulationIds = new Set<string>();
      const augmentedContacts = normalizedContacts.map(({ base, emailKey, phoneKey, nameKey }) => {
          const enriched: any = { ...(typeof base === 'object' ? base : {}) };
          const currentIds = String(enriched.companyId || '')
              .split(';')
              .map(s => s.trim())
              .filter(Boolean);

          const matchedSimIds = companies
              .filter(sim => {
                  const simEmail = normalizeEmail(sim.userEmail);
                  const simPhone = normalizePhone(sim.userPhone);
                  const simName = cleanText(sim.userName || '').toLowerCase();
                  return (emailKey && simEmail && emailKey === simEmail) ||
                         (phoneKey && simPhone && phoneKey === simPhone) ||
                         (nameKey && simName && nameKey === simName);
              })
              .map(sim => String(sim.id));

          const mergedIds = Array.from(new Set([...currentIds, ...matchedSimIds])).filter(Boolean);
          if (mergedIds.length > 0) {
              enriched.companyId = mergedIds.join('; ');
          }
          mergedIds.forEach(id => linkedSimulationIds.add(id));

          return enriched;
      });

      const syntheticContacts = companies
          .filter(sim => !linkedSimulationIds.has(String(sim.id)))
          .map(sim => {
              const name = sim.userName || sim.userEmail || 'Contato da Simulação';
              return {
                  id: `sim_contact_${sim.id}`,
                  name,
                  email: sim.userEmail || '',
                  phone: sim.userPhone || '',
                  companyId: String(sim.id),
                  company_name: sim.userName || sim.userEmail || String(sim.id),
                  source: 'simulation',
                  createdAt: sim.createdAt || sim.updatedAt,
                  _isSynthetic: true
              };
          });

      return [...augmentedContacts, ...syntheticContacts].map(c => {
          const linked = getLinkedCompanies(c, companies);
          const baseContact = (c && typeof c === 'object') ? c : {};
          const enriched: any = { ...(typeof baseContact === 'object' ? baseContact : {}) };
          
          const allCompanyKeys = new Set<string>();
          linked.forEach(comp => Object.keys(comp).forEach(k => allCompanyKeys.add(k)));

          allCompanyKeys.forEach(key => {
              if (key === 'id') return; 
              const values = Array.from(new Set(linked.map(comp => {
                  return comp[key]; 
              }).filter(v => v !== null && v !== undefined && v !== '')));

              if (values.length > 0) {
                  enriched[`company_${key}`] = values.map(v => safeRender(v)).join('; ');
              }
          });

          if (!enriched.company_name && baseContact.company_name) {
              enriched.company_name = baseContact.company_name;
          }

          return enriched;
      });
  }, [contacts, companies]);
  const groupedContacts = useMemo(() => {
      const grouped: any[] = [];
      const byEmail = new Map<string, any>();

      const allContacts = enrichedContacts;
      allContacts.forEach(c => {
          const email = normalizeEmail(c.email);
          if (!email) {
              grouped.push(c);
              return;
          }
          const current = byEmail.get(email);
          if (!current) {
              byEmail.set(email, { ...c, _emailKey: email });
              return;
          }
          const merged = { ...current };
          merged.name = merged.name || c.name;
          merged.phone = merged.phone || c.phone;
          merged.company_name = merged.company_name || c.company_name;
          const idsA = String(merged.companyId || '').split(';').map(s => s.trim()).filter(Boolean);
          const idsB = String(c.companyId || '').split(';').map(s => s.trim()).filter(Boolean);
          const mergedIds = Array.from(new Set([...idsA, ...idsB]));
          if (mergedIds.length > 0) merged.companyId = mergedIds.join('; ');
          byEmail.set(email, merged);
      });

      byEmail.forEach(v => grouped.push(v));
      return grouped.map(c => ({ ...c, total_simulations: String(c.companyId || '').split(';').map(s => s.trim()).filter(Boolean).length }));
  }, [enrichedContacts]);

  const filteredContacts = useMemo(() => {
    const data = enrichedContacts.filter(c => {
      if (filterFormId && String(c.sourceFormId) !== String(filterFormId)) return false;
      const searchStr = searchTerm.toLowerCase();
      const matchesSearch = !searchStr || Object.values(c).some(val => String(val).toLowerCase().includes(searchStr));
      const hasActiveFilters = Object.keys(activeFilters).length > 0;
      if (!hasActiveFilters) return matchesSearch;
      
      const matchesFilters = Object.keys(activeFilters).every(key => {
        const selectedOptions = activeFilters[key];
        if (!selectedOptions || selectedOptions.length === 0) return true;
        
        const val = c[key];
        const itemValues = cleanArrayValue(val).map(v => cleanText(v)); 
        
        // Handle "Vazio" (Empty) check
        const hasEmptyOption = selectedOptions.includes('(Vazio)');
        const isEmpty = !val || val === '' || (Array.isArray(val) && val.length === 0);
        
        if (hasEmptyOption && isEmpty) return true;
        return itemValues.some(v => selectedOptions.includes(v));
      });
      return matchesSearch && matchesFilters;
    });
    return sortData(data, sortConfig);
  }, [groupedContacts, searchTerm, activeFilters, filterFormId, sortConfig]);

  const filteredCompanies = useMemo(() => {
    const data = companies.filter(c => {
      const searchStr = searchTerm.toLowerCase();
      const matchesSearch = !searchStr || Object.values(c).some(val => String(val).toLowerCase().includes(searchStr));
      const hasActiveFilters = Object.keys(activeFilters).length > 0;
      if (!hasActiveFilters) return matchesSearch;
      
      const matchesFilters = Object.keys(activeFilters).every(key => { 
         const selectedOptions = activeFilters[key];
         if (!selectedOptions || selectedOptions.length === 0) return true;
         
         const val = c[key];
         const itemValues = cleanArrayValue(val).map(v => cleanText(v));
         
         // Handle "Vazio" (Empty) check
         const hasEmptyOption = selectedOptions.includes('(Vazio)');
         const isEmpty = !val || val === '' || (Array.isArray(val) && val.length === 0);
         
         if (hasEmptyOption && isEmpty) return true;
         return itemValues.some(v => selectedOptions.includes(v));
      });
      return matchesSearch && matchesFilters;
    });
    return sortData(data, sortConfig);
  }, [companies, searchTerm, activeFilters, sortConfig]);

  useEffect(() => {
    setCompaniesPage(1);
    setSelectedCompanyIds(new Set());
    setIsAllCompaniesSelectedAcrossPages(false);
  }, [searchTerm, activeFilters, sortConfig]);

  useEffect(() => {
    setContactsPage(1);
    setSelectedContactIds(new Set());
    setIsAllContactsSelectedAcrossPages(false);
  }, [searchTerm, activeFilters, sortConfig, filterFormId]);

  // Apply default saved view when navigating to contacts/companies (only if no filters are active)
  useEffect(() => {
    if (currentPath !== 'contacts' && currentPath !== 'companies') return;
    const entityType = currentPath === 'contacts' ? 'contact' : 'company';
    if (Object.keys(activeFilters).length === 0 && !activeSavedViewId) {
      const defaultView = savedViews.find((v: any) => v.entityType === entityType && v.isDefault);
      if (defaultView) { setActiveFilters(defaultView.filters || {}); setActiveSavedViewId(defaultView.id); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPath]);

  const paginatedCompanies = useMemo(() => {
    const start = (companiesPage - 1) * PAGE_SIZE;
    return filteredCompanies.slice(start, start + PAGE_SIZE);
  }, [filteredCompanies, companiesPage]);

  const paginatedContacts = useMemo(() => {
    const start = (contactsPage - 1) * PAGE_SIZE;
    return filteredContacts.slice(start, start + PAGE_SIZE);
  }, [filteredContacts, contactsPage]);

  const renderPagination = (currentPage: number, totalItems: number, onPageChange: (p: number) => void) => {
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 mt-4 rounded-xl shadow-sm">
        <div className="flex justify-between flex-1 sm:hidden">
          <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">Anterior</button>
          <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">Próximo</button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{(currentPage - 1) * PAGE_SIZE + 1}</span> a <span className="font-medium">{Math.min(currentPage * PAGE_SIZE, totalItems)}</span> de <span className="font-medium">{totalItems}</span> resultados
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                <span className="sr-only">Anterior</span>
                <ChevronLeft className="h-5 w-5" />
              </button>
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum = currentPage;
                if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = currentPage - 2 + i;
                
                if (pageNum > 0 && pageNum <= totalPages) {
                    return (
                        <button key={pageNum} onClick={() => onPageChange(pageNum)} className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === pageNum ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'}`}>
                          {pageNum}
                        </button>
                    );
                }
                return null;
              })}
              <button onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50">
                <span className="sr-only">Próximo</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  const allTags = useMemo(() => {
      const companyTags = getUniqueValues(companies, 'tags');
      const contactTags = getUniqueValues(contacts, 'tags');
      return Array.from(new Set([...companyTags, ...contactTags]));
  }, [companies, contacts]);

  const isWithinDashboardRange = (ts: any) => {
      if (!dashboardStartDate && !dashboardEndDate) return true;
      if (!ts) return false;
      const date = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
      if (Number.isNaN(date.getTime())) return false;
      const start = dashboardStartDate ? new Date(`${dashboardStartDate}T00:00:00`) : null;
      const end = dashboardEndDate ? new Date(`${dashboardEndDate}T23:59:59`) : null;
      if (start && date < start) return false;
      if (end && date > end) return false;
      return true;
  };

  const dashboardCompanies = useMemo(() => {
      return companies.filter(c => isWithinDashboardRange(c.createdAt || c.updatedAt));
  }, [companies, dashboardStartDate, dashboardEndDate]);

  const dashboardContacts = useMemo(() => {
      return contacts.filter(c => isWithinDashboardRange(c.createdAt || c.updatedAt));
  }, [contacts, dashboardStartDate, dashboardEndDate]);

  const dashboardCampaigns = useMemo(() => {
      return campaigns.filter(c => isWithinDashboardRange(c.date || c.createdAt));
  }, [campaigns, dashboardStartDate, dashboardEndDate]);

  const uniqueEmailCount = useMemo(() => {
      const emails = new Set<string>();
      dashboardContacts.forEach(c => {
          const e = normalizeEmail(c.email);
          if (e) emails.add(e);
      });
      dashboardCompanies.forEach(s => {
          const e = normalizeEmail(s.userEmail);
          if (e) emails.add(e);
      });
      return emails.size;
  }, [dashboardContacts, dashboardCompanies]);

  const totalSimulatedValue = useMemo(() => {
      return dashboardCompanies.reduce((sum: number, s: any) => {
          const val = parseCurrencyNumber(s.creditAmount);
          return sum + (Number.isFinite(val) ? val : 0);
      }, 0);
  }, [dashboardCompanies]);

  const dashboardResults = useMemo(() => {
      const term = dashboardSearch.toLowerCase();
      const combined = [
          ...dashboardContacts.map(c => ({ ...(typeof c === 'object' ? c : {}), type: 'contact', primary: c.name, secondary: c.company_name || c.email })),
          ...dashboardCompanies.map(c => ({ ...(typeof c === 'object' ? c : {}), type: 'company', primary: c.userName || c.name || c.userEmail || c.id, secondary: c.type || c.creditAmount }))
      ];
      if (!term) { return combined.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 6); }
      return combined.filter(item => (item.primary && item.primary.toLowerCase().includes(term)) || (item.secondary && String(item.secondary).toLowerCase().includes(term))).slice(0, 10);
  }, [dashboardSearch, dashboardContacts, dashboardCompanies]);

  const applyDateFilter = (preset: string) => {
      const today = new Date();
      let start = new Date(today);
      let end = new Date(today);

      switch (preset) {
          case 'hoje':
              break;
          case 'ontem':
              start.setDate(start.getDate() - 1);
              end = new Date(start);
              break;
          case 'ultimos7':
              start.setDate(start.getDate() - 7);
              break;
          case 'mesAtual':
              start.setDate(1);
              break;
          case 'ultimoMes':
              start.setMonth(start.getMonth() - 1);
              start.setDate(1);
              end = new Date(start);
              end.setMonth(end.getMonth() + 1);
              end.setDate(0);
              break;
          case 'ultimos3Meses':
              start.setMonth(start.getMonth() - 3);
              break;
          default:
              break;
      }
      const format = (d: Date) => {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
      };
      setDashboardStartDate(format(start));
      setDashboardEndDate(format(end));
  };

  const renderDashboard = () => (
      <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200">
          <Header title="Dashboard Geral" subtitle="Visão panorâmica da base de dados." />
          <div className="flex flex-col gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-end gap-x-6 gap-y-4">
                  <div className="flex gap-4">
                      <div className="flex flex-col">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Período (início)</label>
                          <input type="date" className="mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={dashboardStartDate} onChange={(e) => setDashboardStartDate(e.target.value)} />
                      </div>
                      <div className="flex flex-col">
                          <label className="text-xs font-semibold text-gray-500 uppercase">Período (fim)</label>
                          <input type="date" className="mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" value={dashboardEndDate} onChange={(e) => setDashboardEndDate(e.target.value)} />
                      </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 flex-1 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 md:pl-6 md:border-l">
                      <button onClick={() => applyDateFilter('hoje')} className="px-3 py-1.5 text-xs font-medium bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 rounded-full text-gray-700 transition-colors">Hoje</button>
                      <button onClick={() => applyDateFilter('ontem')} className="px-3 py-1.5 text-xs font-medium bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 rounded-full text-gray-700 transition-colors">Ontem</button>
                      <button onClick={() => applyDateFilter('ultimos7')} className="px-3 py-1.5 text-xs font-medium bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 rounded-full text-gray-700 transition-colors">Últimos 7 dias</button>
                      <button onClick={() => applyDateFilter('mesAtual')} className="px-3 py-1.5 text-xs font-medium bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 rounded-full text-gray-700 transition-colors">Mês Atual</button>
                      <button onClick={() => applyDateFilter('ultimoMes')} className="px-3 py-1.5 text-xs font-medium bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 rounded-full text-gray-700 transition-colors">Último Mês</button>
                      <button onClick={() => applyDateFilter('ultimos3Meses')} className="px-3 py-1.5 text-xs font-medium bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 rounded-full text-gray-700 transition-colors">Últimos 3 Meses</button>
                  </div>
                  
                  <button onClick={() => { setDashboardStartDate(''); setDashboardEndDate(''); }} className="md:ml-auto text-xs font-bold text-red-500 hover:text-red-700 hover:underline px-2 py-1">Limpar filtro</button>
              </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="Total de Simulações" value={dashboardCompanies.length} icon={Building2} color="bg-blue-600" onClick={() => setCurrentPath('companies')} />
              <StatCard label="Total de Contatos (Emails únicos)" value={uniqueEmailCount} icon={Users} color="bg-indigo-600" onClick={() => setCurrentPath('contacts')} />
              <StatCard label="Campanhas Enviadas" value={dashboardCampaigns.length} icon={Send} color="bg-purple-600" onClick={() => setCurrentPath('campaigns')} />
              <StatCard label="Total Simulado" value={formatCurrencyBR(totalSimulatedValue)} icon={TrendingUp} color="bg-amber-600" />
          </div>
          <div className="flex gap-4">
              <button onClick={() => { setEditingData(null); setDataEntryModalOpen('company'); }} className="flex-1 py-4 bg-white border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-blue-500 hover:bg-blue-50 transition-all group"><div className="p-3 bg-blue-100 text-blue-600 rounded-full group-hover:scale-110 transition-transform"><Plus className="h-6 w-6" /></div><span className="font-bold text-gray-700">Nova Simulação</span></button>
              <button onClick={() => { setEditingData(null); setDataEntryModalOpen('contact'); }} className="flex-1 py-4 bg-white border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-indigo-500 hover:bg-indigo-50 transition-all group"><div className="p-3 bg-indigo-100 text-indigo-600 rounded-full group-hover:scale-110 transition-transform"><UserPlus className="h-6 w-6" /></div><span className="font-bold text-gray-700">Novo Contato</span></button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-3 space-y-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-500"/> Busca Rápida</h3>
                          <div className="relative w-full sm:w-64"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="text" placeholder="Buscar simulação ou contato..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={dashboardSearch} onChange={(e) => setDashboardSearch(e.target.value)} /></div>
                      </div>
                      <div className="overflow-x-auto">
                          <table className="w-full text-left"><thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase"><tr><th className="px-6 py-3">Tipo</th><th className="px-6 py-3">Nome</th><th className="px-6 py-3">Detalhe</th><th className="px-6 py-3 text-right">Ação</th></tr></thead><tbody className="divide-y divide-gray-100">{dashboardResults.map((item: any) => (<tr key={item.id} className="hover:bg-gray-50 transition-colors"><td className="px-6 py-4">{item.type === 'company' ? (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Building2 className="h-3 w-3 mr-1"/> Simulação</span>) : (<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"><Users className="h-3 w-3 mr-1"/> Contato</span>)}</td><td className="px-6 py-4 font-medium text-gray-900">{cleanText(item.primary)}</td><td className="px-6 py-4 text-sm text-gray-500">{cleanText(item.secondary) || '-'}</td><td className="px-6 py-4 text-right"><button onClick={() => { if (item.type === 'company') { setSelectedCompany(item); setCurrentPath('company-details'); } else { setSelectedContact(item); setCurrentPath('contact-details'); } }} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Ver</button></td></tr>))}{dashboardResults.length === 0 && (<tr><td colSpan={4} className="p-8 text-center text-gray-400">Nenhum resultado recente.</td></tr>)}</tbody></table>
                      </div>
                  </div>
              </div>
          </div>
      </div>
  );

  const renderImport = () => (
      <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <MappingModal isOpen={importModalOpen} onClose={() => setImportModalOpen(false)} fileHeaders={fileHeaders} fields={importType === 'companies' ? COMPANY_FIELDS : CONTACT_FIELDS} onConfirm={executeImport} type={importType} />
        <Header title="Importação de Dados" subtitle="Carregue planilhas Excel (.xlsx) ou CSV para alimentar o sistema." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 hover:border-blue-400 transition-all group text-center"><div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform"><Building2 className="h-8 w-8 text-blue-600" /></div><h3 className="text-lg font-bold text-gray-900 mb-2">Importar Simulações</h3><p className="text-sm text-gray-500 mb-6">Planilha contendo dados cadastrais de hotéis e simulações.</p><label className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors w-full"><Upload className="h-4 w-4 mr-2" /> Selecionar Arquivo<input type="file" className="hidden" accept=".xlsx,.csv" onChange={(e) => e.target.files && handleFileRead(e.target.files[0], 'companies')} /></label></div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 hover:border-indigo-400 transition-all group text-center"><div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform"><Users className="h-8 w-8 text-indigo-600" /></div><h3 className="text-lg font-bold text-gray-900 mb-2">Importar Contatos</h3><p className="text-sm text-gray-500 mb-6">Planilha de contatos. Use o ID da Simulação para vincular.</p><label className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 transition-colors w-full"><Upload className="h-4 w-4 mr-2" /> Selecionar Arquivo<input type="file" className="hidden" accept=".xlsx,.csv" onChange={(e) => e.target.files && handleFileRead(e.target.files[0], 'contacts')} /></label></div>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 flex items-center justify-between"><div><h3 className="text-red-800 font-bold flex items-center gap-2"><AlertTriangle className="h-5 w-5"/> Zona de Perigo</h3><p className="text-red-600 text-sm mt-1">Ações destrutivas que não podem ser desfeitas.</p></div><button onClick={wipeDatabase} className="px-4 py-2 bg-white border border-red-200 text-red-600 hover:bg-red-100 rounded-lg text-sm font-bold shadow-sm">Limpar Banco de Dados</button></div>
      </div>
  );

  const renderFormsList = () => (
      <div className="space-y-6">
          <FormBuilderModal isOpen={formBuilderOpen} onClose={() => setFormBuilderOpen(false)} onSave={createForm} />
          <Header title="Formulários de Atualização" subtitle="Crie links públicos para os contatos atualizarem seus dados." rightElement={<button onClick={() => setFormBuilderOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2"><PlusCircle className="h-4 w-4"/> Nova Formulário</button>}/>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forms.map(form => (<div key={form.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"><div className="flex justify-between items-start mb-4"><div className="p-3 bg-blue-50 rounded-lg text-blue-600"><Clipboard className="h-6 w-6"/></div><div className="flex gap-2"><button onClick={() => copyFormLink(form.id)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Copiar Link"><LinkIcon className="h-4 w-4"/></button><button onClick={() => setFilterFormId(form.id)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors" title="Ver Respostas"><Eye className="h-4 w-4"/></button><button onClick={async () => { if(confirm("Excluir formulário?")) await deleteDoc(doc(db, "forms", form.id)) }} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="h-4 w-4"/></button></div></div><h3 className="font-bold text-gray-900 mb-1">{form.title}</h3><p className="text-sm text-gray-500 mb-4 line-clamp-2">{form.description}</p><div className="flex items-center gap-2 text-xs text-gray-400"><Clock className="h-3 w-3"/> Criado em {new Date(form.createdAt?.seconds * 1000).toLocaleDateString()}</div><button onClick={() => { setFilterFormId(form.id); setCurrentPath('contacts'); }} className="mt-4 w-full py-2 text-sm text-blue-600 font-bold border border-blue-100 rounded-lg hover:bg-blue-50">Ver Contatos Capturados</button></div>))}
          </div>
      </div>
  );

  if (publicFormId) { return <PublicFormView formId={publicFormId} db={db} />; }
  if (directoryMode) {
      if (selectedContact) { return <div className="min-h-screen bg-gray-100 flex justify-center"><div className="w-full max-w-[400px] bg-white shadow-2xl min-h-screen flex flex-col relative border-x border-gray-200 overflow-y-auto"><div className="p-4 bg-white sticky top-0 z-10 border-b border-gray-100"><button onClick={() => setSelectedContact(null)} className="flex items-center text-blue-600 font-bold"><ArrowLeft className="h-4 w-4 mr-2"/> Voltar</button></div><div className="p-6"><div className="text-center mb-8"><div className="h-24 w-24 bg-blue-600 rounded-full mx-auto flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-lg shadow-blue-200">{selectedContact.name?.charAt(0)}</div><h2 className="text-2xl font-bold text-gray-900">{selectedContact.name}</h2><p className="text-gray-500 font-medium">{selectedContact.role}</p><p className="text-blue-600 text-sm mt-1">{selectedContact.company_name}</p></div><div className="space-y-4"><div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-4"><div className="p-2 bg-white rounded-lg shadow-sm text-blue-500"><MailIcon className="h-5 w-5"/></div><div className="flex-1 min-w-0"><p className="text-xs text-gray-400 uppercase font-bold">Email</p><p className="text-sm font-medium text-gray-900 truncate">{selectedContact.email || 'Não informado'}</p></div></div><div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-4"><div className="p-2 bg-white rounded-lg shadow-sm text-blue-500"><Phone className="h-5 w-5"/></div><div className="flex-1 min-w-0"><p className="text-xs text-gray-400 uppercase font-bold">Telefone</p><p className="text-sm font-medium text-gray-900 truncate">{selectedContact.phone || 'Não informado'}</p></div></div>{selectedContact.department && (<div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-4"><div className="p-2 bg-white rounded-lg shadow-sm text-blue-500"><Building2 className="h-5 w-5"/></div><div className="flex-1 min-w-0"><p className="text-xs text-gray-400 uppercase font-bold">Departamento</p><p className="text-sm font-medium text-gray-900 truncate">{selectedContact.department}</p></div></div>)}{selectedContact.phone && (<a href={`https://wa.me/55${selectedContact.phone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-4 bg-green-500 text-white font-bold rounded-xl shadow-lg shadow-green-200 hover:bg-green-600 transition-all mt-6"><MessageCircle className="h-5 w-5" /> Conversar no WhatsApp</a>)}</div></div></div></div> }
      return <><CampaignModal isOpen={campaignModalOpen} onClose={() => setCampaignModalOpen(false)} selectedCount={selectedContactIds.size} onConfirm={handleCreateCampaign} isSubmitting={creatingCampaign} /><DirectoryView contacts={enrichedContacts} onSendCampaign={handleDirectoryCampaign} onViewContact={setSelectedContact} /></>
  }
  if (!isAuthenticated) { return <LoginScreen onLogin={(p: string) => { if (p === 'elis123') { localStorage.setItem('crm_auth_token', 'elis123_valid'); setIsAuthenticated(true); } else { alert("Senha de acesso incorreta."); } }} />; }

  return (
    <CoreUILayout 
      currentPath={currentPath}
      onNavigate={setCurrentPath}
      onLogout={() => { localStorage.removeItem('crm_auth_token'); setIsAuthenticated(false); }}
    >
        {globalStatus && (<div className="bg-[#0b1a3a] text-[#f3e6bf] text-xs font-bold px-4 py-2 text-center animate-in slide-in-from-top border-b border-[#d4af37]/30">{globalStatus}</div>)}
        <div className="flex-1 overflow-auto p-4 md:p-8">
            <div className="max-w-7xl mx-auto h-full flex flex-col">
                <DataEntryModal 
                    isOpen={dataEntryModalOpen === 'company'} 
                    onClose={() => { setDataEntryModalOpen(null); setEditingData(null); }} 
                    onSave={handleSaveData} 
                    fields={getAllFieldsForConfig('companies').filter(f => companyEditColumns.includes(f.key))} 
                    title={editingData?.id ? "Editar Simulação" : "Nova Simulação"} 
                    initialData={editingData} 
                    allTags={allTags}
                />
                <DataEntryModal 
                    isOpen={dataEntryModalOpen === 'contact'} 
                    onClose={() => { setDataEntryModalOpen(null); setEditingData(null); }} 
                    onSave={handleSaveData} 
                    fields={getAllFieldsForConfig('contacts').filter(f => contactEditColumns.includes(f.key))} 
                    title={editingData?.id ? "Editar Contato" : "Novo Contato"} 
                    initialData={editingData} 
                    companiesList={companies} 
                    allTags={allTags}
                />
                <BatchSendModal isOpen={batchSendModalOpen} onClose={() => setBatchSendModalOpen(false)} batches={campaignBatches} />
                <WhatsappBatchModal isOpen={whatsappBatchModalOpen} onClose={() => setWhatsappBatchModalOpen(false)} batches={whatsappBatches} />
                <MergeModal isOpen={mergeModalOpen} onClose={() => setMergeModalOpen(false)} items={itemsToMerge} onConfirm={executeMerge} />
                <BulkTagModal isOpen={bulkTagModalOpen} onClose={() => setBulkTagModalOpen(false)} selectedCount={currentPath === 'companies' ? selectedCompanyIds.size : selectedContactIds.size} onConfirm={handleBulkTags} />
                <BulkCopyModal isOpen={bulkCopyModalOpen} onClose={() => setBulkCopyModalOpen(false)} selectedCount={currentPath === 'companies' ? selectedCompanyIds.size : selectedContactIds.size} onConfirm={handleBulkCopy} fields={getAllFieldsForConfig(currentPath === 'companies' ? 'companies' : 'contacts')} />
                <DataEnrichmentModal isOpen={enrichmentModalOpen} onClose={() => setEnrichmentModalOpen(false)} companies={enrichmentCompanies} onConfirm={handleEnrichmentSave} fields={getAllFieldsForConfig('companies')} />

                {/* ── Save View Modal ─────────────────────────────────────────────────── */}
                {saveViewModal.open && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setSaveViewModal(p => ({ ...p, open: false })); setSaveViewName(''); setSaveViewDefault(false); }}>
                    <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-md mx-4 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">Salvar Visualização</h3>
                      <p className="text-sm text-gray-500 mb-4">Salve os filtros ativos como uma visualização nomeada e reutilizável.</p>
                      <input
                        type="text"
                        placeholder={`Ex: Zona Sul — ${saveViewModal.entityType === 'companies' ? 'Simulações Ativas' : 'Gerentes de Vendas'}`}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                        value={saveViewName}
                        onChange={e => setSaveViewName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && saveViewName.trim()) handleSaveView(); }}
                        autoFocus
                      />
                      <label className="flex items-center gap-2 mb-5 cursor-pointer select-none">
                        <input type="checkbox" checked={saveViewDefault} onChange={e => setSaveViewDefault(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm text-gray-700">Definir como <strong>padrão</strong> ao abrir {saveViewModal.entityType === 'companies' ? 'Simulações' : 'Contatos'}</span>
                      </label>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => { setSaveViewModal(p => ({ ...p, open: false })); setSaveViewName(''); setSaveViewDefault(false); }} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancelar</button>
                        <button onClick={handleSaveView} disabled={!saveViewName.trim()} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"><Save className="h-4 w-4" /> Salvar</button>
                      </div>
                    </div>
                  </div>
                )}
                {/* ────────────────────────────────────────────────────────────────────── */}
                {currentPath === 'dashboard' && renderDashboard()}
                {currentPath === 'whatsapp' && <WhatsAppSender apiBase={WHATSAPP_API_URL || ''} />}
                {currentPath === 'email' && <EmailMarketing apiBase={((import.meta as any)?.env?.VITE_EMAIL_API_URL?.trim?.() || 'https://email-api.abravacom.com.br').replace(/\/$/, '')} apiKey={WPP_API_KEY || ''} />}
                {currentPath === 'email-pro' && <EmailMarketingWorkspace contacts={enrichedContacts} campaigns={campaigns} />}
                {currentPath === 'companies' && (
                    <div className="space-y-4">
                      <SystemSettingsModal isOpen={showSystemSettings === 'companies'} onClose={() => setShowSystemSettings(null)} allFields={getAllFieldsForConfig('companies')} currentSettings={{ visible: companyColumns, filters: companyFilterColumns, details: companyDetailColumns, edit: companyEditColumns }} onSave={saveSystemSettings} mode="companies" />
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">Simulações <span className="text-sm font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{filteredCompanies.length} registros</span></h1>
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={() => { setEditingData(null); setDataEntryModalOpen('company'); }} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2"><PlusCircle className="h-4 w-4"/> Nova Simulação</button>
                           {isCompanyEditMode ? (
                               <><button onClick={saveCompanyBatchChanges} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2 animate-in fade-in"><Save className="h-4 w-4"/> Salvar Alterações</button><button onClick={() => { setIsCompanyEditMode(false); setPendingCompanyChanges({}); }} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 flex items-center gap-2">Cancelar</button></>
                           ) : (
                               <button onClick={() => setIsCompanyEditMode(true)} className="px-4 py-2 bg-orange-50 text-orange-700 border border-orange-200 rounded-lg text-sm font-medium hover:bg-orange-100 flex items-center gap-2"><Edit2 className="h-4 w-4"/> Modo Edição em Massa</button>
                           )}
                            <button onClick={() => setShowSystemSettings('companies')} className="px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2" title="Configurar Colunas e Filtros"><Settings className="h-4 w-4"/></button>
                           <button onClick={() => handleExport(filteredCompanies, 'Simulações')} className="px-4 py-2 bg-white border border-gray-200 text-green-700 rounded-lg text-sm font-medium hover:bg-green-50 flex items-center gap-2"><FileSpreadsheet className="h-4 w-4"/> Exportar</button>
                           <button onClick={() => setCurrentPath('import')} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"><Upload className="h-4 w-4"/> Importar</button>
                        </div>
                      </div>
                      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="text" placeholder="Buscar em todas as colunas..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                      {(savedViews.filter((v: any) => v.entityType === 'company').length > 0 || Object.values(activeFilters).some((v: any) => v && v.length > 0)) && (
                        <div className="flex items-center gap-2 flex-wrap py-1">
                          <Eye className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          {savedViews.filter((v: any) => v.entityType === 'company').map((v: any) => (
                            <button key={v.id} onClick={() => applyView(v)} className={`px-2.5 py-1 text-xs rounded-full border flex items-center gap-1 transition-colors ${activeSavedViewId === v.id ? 'bg-blue-100 border-blue-400 text-blue-800 font-semibold' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'}`}>
                              {v.isDefault && <span title="Padrão" className="text-yellow-500">★</span>}
                              {v.name}
                            </button>
                          ))}
                          {Object.values(activeFilters).some((v: any) => v && v.length > 0) && (
                            <button onClick={() => setSaveViewModal({ open: true, entityType: 'companies' })} className="px-2.5 py-1 text-xs rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
                              <Save className="h-3 w-3" /> Salvar como visualização
                            </button>
                          )}
                        </div>
                      )}
                      <div className="space-y-3">
                          <div className="flex items-center justify-between"><span className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1"><Filter className="h-3 w-3"/> Filtros Disponíveis</span><button onClick={() => setShowFilters(!showFilters)} className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1">{showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'} {showFilters ? <ChevronUp className="h-3 w-3"/> : <ChevronDown className="h-3 w-3"/>}</button></div>
                          {showFilters && (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 animate-in fade-in slide-in-from-top-2">
                                {getFilterableColumns(companies).filter(colKey => companyFilterColumns.includes(colKey) || companyFilterColumns.length === 0).map(colKey => {
                                    const label = COMPANY_FIELDS.find(f => f.key === colKey)?.label || colKey.replace(/_/g, ' ');
                                    return (<FilterDropdown key={colKey} label={label} options={[...getUniqueValues(companies, colKey), "(Vazio)"]} selectedValues={activeFilters[colKey]} onChange={(val: string[]) => setActiveFilters({...activeFilters, [colKey]: val})} />)
                                })}
                                {Object.values(activeFilters).some((v: any) => v && v.length > 0) && (<button onClick={() => setActiveFilters({})} className="col-span-full text-center text-xs text-red-500 hover:underline mt-2">Limpar todos os filtros</button>)}
                            </div>
                          )}
                      </div>
                      {/* Company Selection Action Bar */}
                      {selectedCompanyIds.size > 0 && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 shadow-sm mb-4">
                             <span className="text-sm font-semibold text-blue-800 pl-2">{selectedCompanyIds.size} selecionados</span>
                             <div className="h-6 w-px bg-blue-200"></div>
                             <div className="flex gap-2">
                                 <button onClick={() => startEnrichment(companies.filter(c => selectedCompanyIds.has(c.id)))} className="px-3 py-1.5 bg-white text-emerald-700 hover:bg-emerald-50 rounded-lg text-sm font-medium border border-emerald-200 shadow-sm flex items-center gap-1">
                                     <Sparkles className="h-4 w-4" /> Enriquecer Dados
                                 </button>
                                 {selectedCompanyIds.size >= 2 && (
                                     <button onClick={() => startMerge('companies')} className="px-3 py-1.5 bg-white text-purple-700 hover:bg-purple-50 rounded-lg text-sm font-medium border border-purple-200 shadow-sm flex items-center gap-1">
                                         <Merge className="h-4 w-4" /> Mesclar ({selectedCompanyIds.size})
                                     </button>
                                 )}
                                 <button onClick={() => setBulkCopyModalOpen(true)} className="px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-50 rounded-lg text-sm font-medium border border-blue-200 shadow-sm flex items-center gap-1">
                                     <Copy className="h-4 w-4" /> Copiar Dados
                                 </button>
                                 <button onClick={() => setBulkTagModalOpen(true)} className="px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-50 rounded-lg text-sm font-medium border border-blue-200 shadow-sm flex items-center gap-1">
                                     <Tag className="h-4 w-4" /> Gerenciar Tags
                                 </button>
                                 <button onClick={() => {
                                     if(confirm(`Deseja apagar ${selectedCompanyIds.size} simulações?`)) {
                                         selectedCompanyIds.forEach(async (id) => await deleteDoc(doc(db, "simulations", id)));
                                         setSelectedCompanyIds(new Set());
                                     }
                                 }} className="px-3 py-1.5 bg-white text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium border border-red-200 shadow-sm flex items-center gap-1">
                                     <Trash2 className="h-4 w-4" /> Apagar
                                 </button>
                                 <button onClick={() => setSelectedCompanyIds(new Set())} className="p-1.5 text-blue-400 hover:text-blue-600 rounded"><X className="h-5 w-5"/></button>
                             </div>
                          </div>
                      )}
                      
                      <div className={`bg-white shadow-sm border rounded-xl overflow-hidden ${isCompanyEditMode ? 'border-orange-300 ring-4 ring-orange-50' : 'border-gray-200'}`}>
                        {isCompanyEditMode && <div className="bg-orange-100 px-4 py-2 text-xs font-bold text-orange-800 text-center border-b border-orange-200">MODO DE EDIÇÃO ATIVO - Cuidado ao alterar dados.</div>}
                                                <div className="overflow-x-auto">
                                                      <table className="w-full min-w-[1280px] text-left border-collapse table-auto text-sm">
                                                        <thead className="bg-white border-b border-gray-200">
                                                            <tr>
                                                                <th className="px-3 py-2 w-10"><input type="checkbox" onChange={() => toggleAllCompanySelection(filteredCompanies)} checked={filteredCompanies.length > 0 && filteredCompanies.every(item => selectedCompanyIds.has(item.id))} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /></th>
                                                                {companyColumns.map(col => {
                                                                    const label = COMPANY_FIELDS.find(f => f.key === col)?.label || col.replace(/_/g, ' ');
                                                                    return (
                                                                    <th key={col} className={`px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 align-middle ${(col === 'userName' || col === 'name') ? 'min-w-[260px]' : col === 'status' ? 'min-w-[140px]' : col === 'id' ? 'min-w-[130px]' : col === 'city' ? 'min-w-[140px]' : 'min-w-[120px]'}`} onClick={() => handleSort(col)}>
                                                                        <div className="flex items-center gap-1 leading-tight">
                                                                                        {label}
                                                                                        {sortConfig?.key === col && (sortConfig.direction === 'asc' ? <ArrowUpAZ className="h-3 w-3 text-blue-600"/> : <ArrowDownZA className="h-3 w-3 text-blue-600"/>)}
                                                                                </div>
                                                                    </th>
                                                                )})}
                                                                <th className="px-4 py-2 text-right"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                              {isAllCompaniesSelectedAcrossPages && filteredCompanies.length > PAGE_SIZE && (
                                  <tr>
                                      <td colSpan={companyColumns.length + 2} className="bg-blue-100 px-6 py-2 text-center text-sm text-blue-900 font-bold">
                                          Todos os {filteredCompanies.length} registros selecionados.
                                          <button onClick={() => { setSelectedCompanyIds(new Set()); setIsAllCompaniesSelectedAcrossPages(false); }} className="ml-2 underline font-normal">Limpar seleção</button>
                                      </td>
                                  </tr>
                              )}
                              {paginatedCompanies.length === 0 ? (<tr><td colSpan={companyColumns.length + 2} className="p-12 text-center text-gray-500">Nenhum resultado encontrado.</td></tr>) : paginatedCompanies.map((company) => (
                                  <tr key={company.id} className={`hover:bg-gray-50 transition-colors group ${selectedCompanyIds.has(company.id) ? 'bg-blue-50' : ''} ${!isCompanyEditMode ? 'cursor-pointer' : ''}`} onClick={() => { if (!isCompanyEditMode) { setSelectedCompany(company); setCurrentPath('company-details'); } }}>
                                    <td className="px-3 py-1"><input type="checkbox" checked={selectedCompanyIds.has(company.id)} onClick={(e) => e.stopPropagation()} onChange={() => toggleCompanySelection(company.id)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /></td>
                                    {companyColumns.map(col => {
                                        const displayValue = pendingCompanyChanges[company.id]?.[col] ?? company[col];
                                        const primaryName = cleanText(company.userName ?? company.name ?? company.userEmail ?? company.id);
                                        return (
                                            <td key={col} className={`px-4 py-2 align-middle ${(col === 'userName' || col === 'name') ? 'min-w-[260px]' : col === 'status' ? 'min-w-[140px]' : col === 'id' ? 'min-w-[130px]' : col === 'city' ? 'min-w-[140px]' : 'min-w-[120px]'}`}>
                                                {isCompanyEditMode && col !== 'id' ? (
                                                    <input type="text" className={`w-full text-sm border-b border-gray-300 focus:border-blue-500 outline-none bg-transparent ${pendingCompanyChanges[company.id]?.[col] !== undefined ? 'bg-orange-50 text-orange-900 font-medium' : ''}`} value={safeRender(displayValue)} onChange={(e) => handleCompanyCellEdit(company.id, col, e.target.value)} />
                                                ) : (
                                                    (col === 'userName' || col === 'name') ? (
                                                        <div className="cursor-pointer max-w-[280px]">
                                                            <div className="font-semibold text-gray-900 truncate">{primaryName || '-'}</div>
                                                            <div className="text-xs text-gray-400 truncate">ID: {company.id}</div>
                                                        </div>
                                                    ) : col === 'status' ? (
                                                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(cleanText(company.status))}`}>{cleanText(company.status)}</span>
                                                    ) : col === 'creditAmount' ? (
                                                        <span className="text-sm text-gray-700 font-medium">{formatCurrencyBR(displayValue)}</span>
                                                    ) : (col === 'total_simulations') ? (<span className="text-sm text-gray-700 font-medium">{company.total_simulations || 0}</span>) : (col === 'tags' || col === 'mailing') ? (
                                                        <div className="flex flex-wrap gap-1">
                                                            {cleanArrayValue(company[col]).map((t: string, i: number) => <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200 truncate">{t}</span>)}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-gray-600 block max-w-[220px] truncate" title={safeRender(company[col])}>{safeRender(company[col]) || '-'}</span>
                                                    )
                                                )}
                                            </td>
                                        )
                                    })}
                                    <td className="px-4 py-1 text-right">{!isCompanyEditMode && (<button onClick={(e) => { e.stopPropagation(); setSelectedCompany(company); setCurrentPath('company-details'); }} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500"/></button>)}</td>
                                  </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      {renderPagination(companiesPage, filteredCompanies.length, setCompaniesPage)}
                    </div>
                )}
                {currentPath === 'contacts' && (
                    <div className="space-y-4">
                      <CampaignModal isOpen={campaignModalOpen} onClose={() => setCampaignModalOpen(false)} selectedCount={selectedContactIds.size} onConfirm={handleCreateCampaign} isSubmitting={creatingCampaign} />
                      <SystemSettingsModal isOpen={showSystemSettings === 'contacts'} onClose={() => setShowSystemSettings(null)} allFields={getAllFieldsForConfig('contacts')} currentSettings={{ visible: contactColumns, filters: contactFilterColumns, details: contactDetailColumns, edit: contactEditColumns }} onSave={saveSystemSettings} mode="contacts" />
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div><h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">Contatos <span className="text-sm font-normal text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{filteredContacts.length} registros</span></h1>{filterFormId && (<div className="mt-2 flex items-center gap-2"><span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-200">Filtrando por formulário: {forms.find(f => f.id === filterFormId)?.title || filterFormId}</span><button onClick={() => setFilterFormId(null)} className="text-xs text-red-500 hover:underline">Limpar</button></div>)}</div>
                        <div className="flex gap-2">
                           <button onClick={() => { setEditingData(null); setDataEntryModalOpen('company'); }} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2"><PlusCircle className="h-4 w-4"/> Nova Simulação</button>
                           <button onClick={() => { setEditingData(null); setDataEntryModalOpen('contact'); }} className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2"><PlusCircle className="h-4 w-4"/> Novo Contato</button>
                           <button onClick={() => setShowSystemSettings('contacts')} className="px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2" title="Configurar Colunas e Filtros"><Settings className="h-4 w-4"/></button>
                           <button onClick={() => handleExport(filteredContacts, 'Contatos')} className="px-4 py-2 bg-white border border-gray-200 text-green-700 rounded-lg text-sm font-medium hover:bg-green-50 flex items-center gap-2"><FileSpreadsheet className="h-4 w-4"/> Exportar</button>
                           <button onClick={() => setCurrentPath('import')} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"><Upload className="h-4 w-4"/> Importar</button>
                        </div>
                      </div>
                      <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><input type="text" placeholder="Buscar por nome, email ou simulação..." className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
                      {(savedViews.filter((v: any) => v.entityType === 'contact').length > 0 || Object.values(activeFilters).some((v: any) => v && v.length > 0)) && (
                        <div className="flex items-center gap-2 flex-wrap py-1">
                          <Eye className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          {savedViews.filter((v: any) => v.entityType === 'contact').map((v: any) => (
                            <button key={v.id} onClick={() => applyView(v)} className={`px-2.5 py-1 text-xs rounded-full border flex items-center gap-1 transition-colors ${activeSavedViewId === v.id ? 'bg-blue-100 border-blue-400 text-blue-800 font-semibold' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'}`}>
                              {v.isDefault && <span title="Padrão" className="text-yellow-500">★</span>}
                              {v.name}
                            </button>
                          ))}
                          {Object.values(activeFilters).some((v: any) => v && v.length > 0) && (
                            <button onClick={() => setSaveViewModal({ open: true, entityType: 'contacts' })} className="px-2.5 py-1 text-xs rounded-full border border-dashed border-gray-300 text-gray-500 hover:border-blue-400 hover:text-blue-600 flex items-center gap-1 transition-colors">
                              <Save className="h-3 w-3" /> Salvar como visualização
                            </button>
                          )}
                        </div>
                      )}
                      <div className="space-y-3">
                          <div className="flex items-center justify-between"><span className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1"><Filter className="h-3 w-3"/> Filtros Disponíveis</span><button onClick={() => setShowFilters(!showFilters)} className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1">{showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros'} {showFilters ? <ChevronUp className="h-3 w-3"/> : <ChevronDown className="h-3 w-3"/>}</button></div>
                          {showFilters && (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100 animate-in fade-in slide-in-from-top-2">
                                {getFilterableColumns(groupedContacts).filter(colKey => contactFilterColumns.includes(colKey) || contactFilterColumns.length === 0).map(colKey => {
                                    if (colKey === '_company_names' || colKey === '_company_industries' || colKey === '_company_ids') return null;
                                    let label = colKey.replace(/_/g, ' '); 
                                    if (colKey.startsWith('company_')) {
                                        label = `Simulação: ${colKey.replace('company_', '').charAt(0).toUpperCase() + colKey.replace('company_', '').slice(1)}`;
                                    }
                                    return (<FilterDropdown key={colKey} label={label} options={[...getUniqueValues(groupedContacts, colKey), "(Vazio)"]} selectedValues={activeFilters[colKey]} onChange={(val: string[]) => setActiveFilters({...activeFilters, [colKey]: val})} />)
                                })}
                                {Object.values(activeFilters).some((v: any) => v && v.length > 0) && (<button onClick={() => setActiveFilters({})} className="col-span-full text-center text-xs text-red-500 hover:underline mt-2">Limpar todos os filtros</button>)}
                            </div>
                          )}
                      </div>
                      {selectedContactIds.size > 0 && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-3 flex items-center gap-4 animate-in fade-in slide-in-from-top-2 shadow-sm">
                             <span className="text-sm font-semibold text-blue-800 pl-2">{selectedContactIds.size} selecionados</span>
                             <div className="h-6 w-px bg-blue-200"></div>
                             <div className="flex gap-2">
                                 <button onClick={() => setCampaignModalOpen(true)} className="px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-50 rounded-lg text-sm font-medium border border-blue-200 shadow-sm flex items-center gap-1">
                                     <MailIcon className="h-4 w-4" /> Enviar Campanha
                                 </button>
                                 {selectedContactIds.size >= 2 && (
                                     <button onClick={() => startMerge('contacts')} className="px-3 py-1.5 bg-white text-purple-700 hover:bg-purple-50 rounded-lg text-sm font-medium border border-purple-200 shadow-sm flex items-center gap-1">
                                         <Merge className="h-4 w-4" /> Mesclar ({selectedContactIds.size})
                                     </button>
                                 )}
                                 <button onClick={() => setBulkCopyModalOpen(true)} className="px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-50 rounded-lg text-sm font-medium border border-blue-200 shadow-sm flex items-center gap-1">
                                     <Copy className="h-4 w-4" /> Copiar Dados
                                 </button>
                                 <button onClick={() => setBulkTagModalOpen(true)} className="px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-50 rounded-lg text-sm font-medium border border-blue-200 shadow-sm flex items-center gap-1">
                                     <Tag className="h-4 w-4" /> Gerenciar Tags
                                 </button>
                                 <button onClick={() => { if(confirm(`Deseja apagar ${selectedContactIds.size} contatos?`)) { selectedContactIds.forEach(async (id) => { await deleteDoc(doc(db, "contacts", id)); }); setSelectedContactIds(new Set()); } }} className="px-3 py-1.5 bg-white text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium border border-red-200 shadow-sm flex items-center gap-1"><Trash2 className="h-4 w-4" /> Apagar</button><button onClick={() => setSelectedContactIds(new Set())} className="p-1.5 text-blue-400 hover:text-blue-600 rounded"><X className="h-5 w-5"/></button></div></div>
                      )}
                                            <div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
                                                <div className="overflow-x-auto">
                                                      <table className="w-full min-w-[1320px] text-left border-collapse table-auto text-sm">
                                                        <thead className="bg-white border-b border-gray-200">
                                                            <tr>
                                                                <th className="px-3 py-2 w-10"><input type="checkbox" onChange={() => toggleAllSelection(filteredContacts)} checked={filteredContacts.length > 0 && filteredContacts.every(item => selectedContactIds.has(item.id))} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /></th>
                                                                {contactColumns.map(col => { 
                                                                        if (col === '_company_names' || col === '_company_industries' || col === '_company_ids') return null; 
                                                                        return (
                                                                    <th key={col} className={`px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-gray-50 align-middle ${col === 'name' ? 'min-w-[240px]' : col === 'company_name' ? 'min-w-[220px]' : col === 'email' ? 'min-w-[220px]' : col === 'phone' ? 'min-w-[140px]' : col === 'id' ? 'min-w-[130px]' : 'min-w-[120px]'}`} onClick={() => handleSort(col)}>
                                                                        <div className="flex items-center gap-1 leading-tight">
                                                                                        {col.replace(/_/g, ' ')}
                                                                                        {sortConfig?.key === col && (sortConfig.direction === 'asc' ? <ArrowUpAZ className="h-3 w-3 text-blue-600"/> : <ArrowDownZA className="h-3 w-3 text-blue-600"/>)}
                                                                                </div>
                                                                        </th>
                                                                ) })}
                                                                <th className="px-4 py-2 text-right"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                              {isAllContactsSelectedAcrossPages && filteredContacts.length > PAGE_SIZE && (
                                  <tr>
                                      <td colSpan={contactColumns.length + 2} className="bg-blue-100 px-6 py-2 text-center text-sm text-blue-900 font-bold">
                                          Todos os {filteredContacts.length} registros selecionados.
                                          <button onClick={() => { setSelectedContactIds(new Set()); setIsAllContactsSelectedAcrossPages(false); }} className="ml-2 underline font-normal">Limpar seleção</button>
                                      </td>
                                  </tr>
                              )}
                              {paginatedContacts.length === 0 ? (<tr><td colSpan={contactColumns.length + 2} className="p-12 text-center text-gray-500">Nenhum resultado encontrado.</td></tr>) : paginatedContacts.map((contact) => (
                                  <tr key={contact.id} className={`hover:bg-gray-50 transition-colors group ${selectedContactIds.has(contact.id) ? 'bg-blue-50' : ''}`}>
                                    <td className="px-3 py-1"><input type="checkbox" checked={selectedContactIds.has(contact.id)} onChange={() => toggleSelection(contact.id)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" /></td>
                                    {contactColumns.map(col => {
                                         if (col === '_company_names' || col === '_company_industries' || col === '_company_ids') return null;
                                         return (<td key={col} className={`px-4 py-2 align-middle ${col === 'name' ? 'min-w-[240px]' : col === 'company_name' ? 'min-w-[220px]' : col === 'email' ? 'min-w-[220px]' : col === 'phone' ? 'min-w-[140px]' : col === 'id' ? 'min-w-[130px]' : 'min-w-[120px]'}`} onClick={() => { setSelectedContact(contact); setCurrentPath('contact-details'); }}>{col === 'name' ? (<div className="cursor-pointer max-w-[260px]"><div className="font-semibold text-gray-900 truncate">{cleanText(contact.name)}</div>{contact.role && <div className="text-xs text-gray-400 truncate">{cleanText(contact.role)}</div>}</div>) : col === 'company_name' ? (
                                             <div className="flex flex-col gap-1 max-w-[220px]">
                                                 {getLinkedCompanies(contact, companies).length > 0 ? (
                                                     getLinkedCompanies(contact, companies).map(comp => (
                                                         <button 
                                                            key={comp.id}
                                                            onClick={(e) => { e.stopPropagation(); setSelectedCompany(comp); setCurrentPath('company-details'); }}
                                                            className="text-sm text-blue-600 font-medium hover:underline text-left flex items-center gap-1 truncate"
                                                         >
                                                             <Building2 className="h-3 w-3" /> <span className="truncate">{cleanText(comp.userName ?? comp.name ?? comp.userEmail ?? comp.id)}</span>
                                                         </button>
                                                     ))
                                                 ) : (
                                                     <span className="text-sm text-gray-500 truncate">{safeRender(contact.company_name) || '-'}</span>
                                                 )}
                                             </div>
                                         ) : (col === 'total_simulations') ? (<span className="text-sm text-gray-700 font-medium">{contact.total_simulations || 0}</span>) : (col === 'tags' || col === 'mailing') ? (<div className="flex flex-wrap gap-1">{cleanArrayValue(contact[col]).map((t: string, i: number) => <span key={i} className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100 truncate">{t}</span>)}</div>) : (col === 'creditAmount' || col === 'company_creditAmount') ? (<span className="text-sm text-gray-600 block max-w-[200px] truncate" title={formatCurrencyBR(contact[col])}>{formatCurrencyBR(contact[col]) || '-'}</span>) : (<span className="text-sm text-gray-600 block max-w-[200px] truncate" title={safeRender(contact[col])}>{safeRender(contact[col]) || '-'}</span>)}</td>)
                                    })}
                                    <td className="px-4 py-1 text-right"><ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 inline-block"/></td>
                                  </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      {renderPagination(contactsPage, filteredContacts.length, setContactsPage)}
                    </div>
                )}
                {currentPath === 'company-details' && ( <CompanyDetailsView company={selectedCompany} allCompanies={companies} campaigns={campaigns} onBack={() => setCurrentPath('companies')} onViewCompany={(c: any) => setSelectedCompany(c)} onEdit={() => { setEditingData(selectedCompany); setDataEntryModalOpen('company'); }} onDelete={handleDeleteCompany} detailFields={companyDetailColumns} onEnrich={() => startEnrichment([selectedCompany])} /> )}
                {currentPath === 'contact-details' && ( <ContactDetailsView contact={selectedContact} companies={companies} onViewCompany={(comp: any) => { setSelectedCompany(comp); setCurrentPath('company-details'); }} onBack={() => setCurrentPath('contacts')} onEdit={() => { setEditingData(selectedContact); setDataEntryModalOpen('contact'); }} campaigns={campaigns} onDelete={handleDeleteContact} detailFields={contactDetailColumns} /> )}
                {currentPath === 'campaigns' && ( <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200"><Header title="Histórico de Campanhas" subtitle="Emails enviados via Outlook." rightElement={<button onClick={() => setCurrentPath('campaign-new')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700">Nova Campanha</button>} /><div className="bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden"><table className="w-full text-left"><thead className="bg-gray-50 border-b border-gray-200"><tr><th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Assunto</th><th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Responsável</th><th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Destinatários</th><th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Data</th><th className="px-6 py-3 text-right"></th></tr></thead><tbody className="divide-y divide-gray-100">{campaigns.map(c => (<tr key={c.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedCampaign(c); setCurrentPath('campaign-details'); }}><td className="px-6 py-4 font-medium text-gray-900">{c.subject}</td><td className="px-6 py-4 text-sm text-gray-600">{c.responsible}</td><td className="px-6 py-4 text-sm text-gray-600">{c.recipientCount}</td><td className="px-6 py-4 text-sm text-gray-600">{c.date?.seconds ? new Date(c.date.seconds * 1000).toLocaleDateString('pt-BR') : '-'}</td><td className="px-6 py-4 text-right"><ChevronRight className="h-4 w-4 text-gray-300"/></td></tr>))}</tbody></table></div></div> )}
                {currentPath === 'campaign-new' && ( <NewCampaignPage contacts={enrichedContacts} onBack={() => setCurrentPath('campaigns')} onSend={handleCreateCampaignPage} /> )}
                {currentPath === 'campaign-details' && ( <CampaignDetailsView campaign={selectedCampaign} onBack={() => { setSelectedCampaign(null); setCurrentPath('campaigns'); }} onDelete={deleteCampaign} onReuse={handleReuseMailing} allContacts={contacts} /> )}
                {currentPath === 'import' && renderImport()}
                {currentPath === 'forms' && renderFormsList()}
                
                {currentPath === 'settings' && <SettingsView companies={companies} contacts={contacts} savedViews={savedViews} onDeleteView={handleDeleteSavedView} onSetDefaultView={handleSetDefaultView} onRenameView={handleRenameView} />}
            </div>
        </div>
    </CoreUILayout>
  );
};

export default App;

