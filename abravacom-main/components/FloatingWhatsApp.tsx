import React from 'react';
import { MessageCircle } from 'lucide-react';
import { PROFILE } from '../constants';

const FloatingWhatsApp: React.FC = () => {
  const phone = PROFILE.whatsapp?.replace(/\D/g, '') || '';
  const url = `https://wa.me/${phone}`;

  return (
    <a
      aria-label="Contato via WhatsApp"
      title="Fale com Elis pelo WhatsApp"
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-6 bottom-6 z-[999] bg-emerald-600 text-white p-4 rounded-full shadow-2xl hover:scale-105 transform transition-all"
    >
      <MessageCircle size={24} />
    </a>
  );
};

export default FloatingWhatsApp;
