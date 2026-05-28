/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CompanyInfo {
  name: string;
  cnpj: string;
  sector: string;
  targetMrr: number;
  description: string;
}

export interface CashFlowItem {
  id: string;
  description: string;
  type: 'in' | 'out';
  value: number;
  category: string;
  date: string;
}

export interface StockItem {
  id: string;
  name: string;
  qty: number;
  cost: number;
  price: number;
}

export interface Campaign {
  id: string;
  name: string;
  platform: string;
  budget: number;
  spend: number;
  revenue: number;
  conversions: number;
}

export interface AgendaItem {
  id: string;
  title: string;
  date: string;
  priority: 'baixa' | 'media' | 'alta';
  status: 'pendente' | 'concluido';
}

export interface Message {
  sender: 'user' | 'zelda';
  text: string;
  datetime: string;
  isAudio?: boolean;
}

export interface AppState {
  company: CompanyInfo;
  cashFlow: CashFlowItem[];
  stock: StockItem[];
  campaigns: Campaign[];
  agenda: AgendaItem[];
  chatMessages: Message[];
  offlineMode: boolean;
  syncStatus: 'synced' | 'syncing' | 'offline';
}
