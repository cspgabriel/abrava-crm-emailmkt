import { 
  MessageCircle, 
  Home, 
  Car, 
  Briefcase, 
  PiggyBank, 
  Building2, 
  Users, 
  Globe,
  Instagram,
  Star
} from 'lucide-react';
import { LinkItem, LinkCategory, ProfileData } from './types';

export const PROFILE: ProfileData = {
  name: "Elisangela Inacio",
  title: "Especialista em Crédito e Consórcio",
  description: "Transformando sonhos em realidade através de soluções financeiras inteligentes.",
  avatarUrl: "https://i.ibb.co/0jv4vmr1/Screenshot-149.png",
  logoUrl: "https://i.postimg.cc/qqQh9Tyk/3cc9175c-0ef1-455b-b9d5-7a9ccd84e8ed-removebg-preview.png",
  whatsapp: "5551986831896",
  email: "contato@finance8.com.br"
};

// URL do seu Google Apps Script integrada:
export const GOOGLE_SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxx9PbY9FHepaKEhWzX4ww4WB4dRzIPe6Zn1NvuhZRKMWP2hjooFmWXNcBECJI3noqe/exec'; 

export const LINKS: LinkItem[] = [
  // Primary Call to Action
  {
    id: 'whatsapp-main',
    label: 'WHATSAPP',
    subtext: 'Tenha a melhor experiência. Consultoria especializada para sua necessidade',
    url: 'https://wa.me/5551986831896',
    category: LinkCategory.CONTACT,
    icon: MessageCircle,
    highlight: true,
  },
  
  // Groups
  {
    id: 'grupo-vip',
    label: 'CARTAS CONTEMPLADAS',
    subtext: 'Grupo exclusivo com atualizações diárias',
    url: 'https://chat.whatsapp.com/EQLOlDYRoiCArffDLK4lvE',
    category: LinkCategory.GROUP,
    icon: Users,
    highlight: true,
  },

  // Products
  {
    id: 'simulacao-consorcio',
    label: 'SIMULAÇÃO CONSÓRCIO',
    subtext: 'Simule e contrate você mesmo',
    url: 'https://link.franq.com.br/pb/elisangela-inacio/produto/117?utm_source=befranq&utm_medium=NovaVenda',
    category: LinkCategory.PRODUCT,
    icon: PiggyBank,
  },
  {
    id: 'home-equity',
    label: 'CRÉDITO COM GARANTIA DE IMÓVEL',
    subtext: 'use seu imóvel e obtenha empréstimos com taxas reduzidas',
    url: 'https://link.franq.com.br/pb/elisangela-inacio/produto/55?utm_source=befranq&utm_medium=NovaVenda',
    category: LinkCategory.PRODUCT,
    icon: Building2,
  },
  {
    id: 'auto-equity',
    label: 'CRÉDITO COM GARANTIA DE VEÍCULOS',
    subtext: 'use seu veículo e obtenha empréstimos com taxas reduzidas',
    url: 'https://link.franq.com.br/pb/elisangela-inacio/produto/120?utm_source=befranq&utm_medium=NovaVenda',
    category: LinkCategory.PRODUCT,
    icon: Car,
  },
  {
    id: 'credito-imobiliario',
    label: 'CRÉDITO IMOBILIÁRIO',
    subtext: 'Quer financiar um imóvel? Simule agora!',
    url: 'https://shop.franq.com.br/elisangela-inacio/produtos/financiamento-imobiliario?utm_source=befranq&utm_medium=NovaVenda',
    category: LinkCategory.PRODUCT,
    icon: Home,
  },
  {
    id: 'financiamento-veiculos',
    label: 'FINANCIAMENTOS VEÍCULOS',
    subtext: 'Quer financiar um veículo? Simule agora!',
    url: 'https://link.franq.com.br/pb/elisangela-inacio/produto/96?utm_source=befranq&utm_medium=NovaVenda',
    category: LinkCategory.PRODUCT,
    icon: Car,
  },
  {
    id: 'capital-giro',
    label: 'CAPITAL DE GIRO',
    subtext: 'Exclusivo para empresas',
    url: 'https://shop.franq.com.br/elisangela-inacio/empresas?utm_source=befranq&utm_medium=NovaVenda',
    category: LinkCategory.PRODUCT,
    icon: Briefcase,
  },
  {
    id: 'site-oficial',
    label: 'SITE',
    url: 'https://www.finance8.com.br/',
    category: LinkCategory.PRODUCT, // Grouped with main links as per image
    icon: Globe,
  },
  {
    id: 'google-reviews',
    label: 'VEJA O QUE DIZEM MEUS CLIENTES',
    subtext: 'Confira a satisfação e os resultados reais de quem já foi atendido.',
    url: 'https://g.co/kgs/akTvp1M',
    category: LinkCategory.PRODUCT,
    icon: Star,
  },
];

export const SOCIAL_LINKS = [
  {
    id: 'instagram',
    url: 'https://www.instagram.com/abravacon?igsh=eW9pcjR5amw5Y2xv',
    icon: Instagram,
    label: 'Instagram'
  },
];