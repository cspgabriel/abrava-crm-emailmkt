import React, { useEffect, useState } from 'react';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase';

const PartnerMarquee: React.FC = () => {
  const [partners, setPartners] = useState<string[]>([]);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'contemplated_letters')));
        const adminSet = new Set<string>();
        snap.forEach(doc => {
          const admin = doc.data().administrator;
          if (admin && typeof admin === 'string' && admin.trim() !== '') {
            adminSet.add(admin.trim().toUpperCase());
          }
        });
        
        let arr = Array.from(adminSet);
        if (arr.length === 0) {
           arr = ["ITAÚ", "BRADESCO", "SANTANDER", "CAIXA", "BB CONSÓRCIOS", "PORTO SEGURO", "YAMAHA"];
        }
        setPartners(arr);
      } catch (err) {
        console.error("Partner fetch err", err);
        setPartners(["ITAÚ", "BRADESCO", "SANTANDER", "CAIXA", "BB CONSÓRCIOS", "PORTO SEGURO", "YAMAHA"]);
      }
    };
    fetchPartners();
  }, []);

  if (partners.length === 0) return null;

  // Duplicate the array to create a seamless loop
  const displayPartners = [...partners, ...partners, ...partners];

  return (
    <section className="py-16 bg-white border-y border-slate-100 overflow-hidden relative">
      <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
      
      <div className="text-center mb-8">
         <p className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-800">Trabalhamos com as maiores do mercado</p>
      </div>

      <div className="flex w-max animate-marquee space-x-8 sm:space-x-12 px-4 hover:[animation-play-state:paused] cursor-default">
        {displayPartners.map((partner, i) => (
          <div 
            key={i}
            className="flex items-center justify-center px-8 py-4 bg-white border border-slate-200 shadow-sm rounded-2xl min-w-[200px]"
          >
            <span className="font-black text-slate-700 tracking-widest text-lg uppercase transition-all">
              {partner}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default PartnerMarquee;
