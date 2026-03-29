import React from 'react';
import { PROFILE } from '../constants';
import { Building, ShieldCheck } from 'lucide-react';

const ProfileHeader: React.FC = () => {
  return (
    <div className="flex flex-col items-center text-center mb-16 relative z-10">
      <div className="relative group">
        {/* Refined Border Effect */}
        <div className="absolute -inset-1 bg-slate-100 rounded-full blur-sm opacity-50"></div>
        
        {/* Avatar Container */}
        <div className="relative">
          <img
            src={PROFILE.avatarUrl}
            alt={PROFILE.name}
            className="w-20 h-20 rounded-full object-cover border-[4px] border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-700 group-hover:scale-105"
          />
          
          {/* Verified Badge - More subtle and refined */}
          <div className="absolute bottom-1 right-1 bg-white p-1.5 rounded-full shadow-md border border-slate-50">
             <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
        </div>
      </div>
      
      <div className="mt-10 space-y-3">
        <h1 className="text-3xl font-light text-slate-900 tracking-tight italic">
          {PROFILE.name}
        </h1>
        <div className="flex items-center justify-center space-x-3">
          <div className="h-[1px] w-8 bg-slate-200"></div>
          <div className="flex items-center space-x-2 text-slate-400">
            <Building size={12} className="opacity-50" />
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] italic">{PROFILE.title}</span>
          </div>
          <div className="h-[1px] w-8 bg-slate-200"></div>
        </div>
      </div>
      
      <p className="mt-8 text-slate-400 max-w-sm text-[11px] leading-relaxed font-medium italic tracking-wide">
        {PROFILE.description}
      </p>

      {/* Refined Divider */}
      <div className="mt-12 w-12 h-[1px] bg-slate-100 mx-auto"></div>
    </div>
  );
};

export default ProfileHeader;
