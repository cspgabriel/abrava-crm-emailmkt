import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { db, auth } from '../../firebase';

type AdminContextType = {
  companies: any[];
  contacts: any[];
  campaigns: any[];
  forms: any[];
  loading: boolean;
  globalStatus: string;
  setGlobalStatus: (status: string) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [forms, setForms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalStatus, setGlobalStatus] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('crm_auth_token') === 'sind2026_valid';
  });

  useEffect(() => {
    if (!isAuthenticated) return;
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

    setLoading(false);
    return () => {
      unsubCompanies(); 
      unsubContacts(); 
      unsubCampaigns(); 
      unsubForms();
    };
  }, [isAuthenticated]);

  return (
    <AdminContext.Provider value={{
      companies, contacts, campaigns, forms, loading, globalStatus, setGlobalStatus, isAuthenticated, setIsAuthenticated
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdminContext = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdminContext must be used within AdminProvider");
  return context;
};
