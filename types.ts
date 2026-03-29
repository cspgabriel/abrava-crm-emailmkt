import { LucideIcon } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

export enum LinkCategory {
  CONTACT = 'Contato',
  PRODUCT = 'Produtos Financeiros',
  GROUP = 'Grupos & Oportunidades',
  SOCIAL = 'Redes Sociais'
}

export interface LinkItem {
  id: string;
  label: string;
  url: string;
  icon?: LucideIcon;
  category: LinkCategory;
  highlight?: boolean; // For primary CTAs
  subtext?: string;
}

export interface ProfileData {
  name: string;
  title: string;
  description: string;
  avatarUrl: string; // URL for the profile picture
  logoUrl?: string; // Optional logo URL
  whatsapp: string;
  email: string;
}
export type ConsortiumType = 'Imóvel';

export interface Simulation {
  id?: string;
  userId?: string; // Optional if not logged in yet
  type: ConsortiumType;
  creditAmount: number;
  userName: string;
  userPhone: string;
  userEmail: string;
  createdAt: Timestamp | null;
  status: 'pending' | 'analyzed' | 'completed';
  results?: {
    installments: number;
    monthlyValue: number;
    adminFee: number;
    reserveFund: number;
  };
  // Send tracking
  sentAt?: Timestamp | null;        // Timestamp when admin sent the quotation
  sentBy?: 'whatsapp' | 'email';    // Channel used to send
  nextContactAt?: Timestamp | null; // sentAt + 15 days — auto-calculated
  lastActivity?: string;            // Human-readable description of last action
}

export interface ContemplatedLetter {
  id: string;
  userId?: string; // Optional: if assigned to a specific user
  category: 'Carro' | 'Imóvel' | 'Caminhão' | 'Giro';
  credit: number;
  entry: number; // Entrada
  installmentsCount: number;
  installmentValue: number;
  transferFee: number;
  group: string;
  administrator: string;
  status: 'available' | 'reserved' | 'sold';
  observations?: string;
  code?: string; // Código identificador da carta
  name?: string; // Nome do bem (veículo, imóvel, etc.)
  saldoDevedor?: number | null; // Saldo devedor, quando aplicável
  fundoComum?: number | null; // Valor do fundo comum
  refGarantia?: number | null; // Referência de garantia
  insurance?: string | null; // Informações sobre seguro de vida
  reajusteIndex?: string | null; // Índice de reajuste (ex: INPC)
  contactPhone?: string | null; // Telefone/WhatsApp para contato direto
  contactEmail?: string | null; // Email de contato
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'client' | 'admin';
  createdAt: Timestamp | null;
  lastActivityAt?: Timestamp | null;   // Timestamp of most recent admin action
  lastActivityDesc?: string;           // Description of last activity
}
