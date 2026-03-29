import React from 'react';
import { LinkItem } from '../types';
import { ChevronRight, ExternalLink } from 'lucide-react';

interface LinkCardProps {
  link: LinkItem;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
}

const LinkCard: React.FC<LinkCardProps> = ({ link, onClick }) => {
  const Icon = link.icon;
  
  const highlightedClasses = "bg-emerald-600 text-white shadow-xl shadow-emerald-600/20 border-emerald-500";
  const standardClasses = "bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 hover:border-slate-300 shadow-sm";

  const containerClasses = link.highlight ? highlightedClasses : standardClasses;

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className={`
        group relative flex items-center p-5 w-full rounded-2xl border transition-all duration-500
        transform hover:-translate-y-1 cursor-pointer
        ${containerClasses}
      `}
    >
      {/* Icon Container */}
      <div className={`
        flex-shrink-0 p-3 rounded-xl mr-4 transition-all duration-500
        ${link.highlight ? 'bg-white/20 scale-110' : 'bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white'}
      `}>
        {Icon && <Icon className="w-6 h-6" />}
      </div>

      {/* Text Content */}
      <div className="flex-grow min-w-0">
        <h3 className="font-black text-xs sm:text-sm truncate pr-2 uppercase tracking-[0.1em]">
          {link.label}
        </h3>
        {link.subtext && (
          <p className={`text-[10px] mt-1 leading-snug font-bold uppercase tracking-tight opacity-60`}>
            {link.subtext}
          </p>
        )}
      </div>

      {/* Action Arrow */}
      <div className={`
        opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500
        ${link.highlight ? 'text-white' : 'text-emerald-600'}
      `}>
        {link.highlight ? <ChevronRight size={20} /> : <ExternalLink size={18} />}
      </div>
    </a>
  );
};

export default LinkCard;
