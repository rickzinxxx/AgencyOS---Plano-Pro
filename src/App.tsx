/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutDashboard, 
  Building, 
  ArrowUpRight, 
  ArrowDownRight, 
  Package, 
  Calendar, 
  Megaphone, 
  CheckCircle2, 
  Circle, 
  MessageSquare, 
  Download, 
  AlertTriangle, 
  RefreshCw, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Volume2, 
  VolumeX, 
  Trash2, 
  ShieldAlert, 
  User, 
  Plus, 
  X, 
  Send, 
  Sparkles,
  Search,
  Check
} from 'lucide-react';
import { AppState, CashFlowItem, StockItem, Campaign, AgendaItem, Message } from './types';
import { generateFinancialPDF } from './utils/pdfGenerator';

const INITIAL_STATE: AppState = {
  company: {
    name: "Techify Soluções",
    cnpj: "42.109.283/0001-90",
    sector: "Tecnologia e Serviços B2B",
    targetMrr: 25000,
    description: "Startup focada em prover soluções saas de automação industrial."
  },
  cashFlow: [
    { id: "flow-1", description: "Mensalidade Cliente Premium Techify", type: "in", value: 3500, category: "SaaS Recorrente", date: "2026-05-18" },
    { id: "flow-2", description: "Infraestrutura Cloud Run AWS/Google", type: "out", value: 850, category: "Servidores", date: "2026-05-20" },
    { id: "flow-3", description: "Licenças de Software Co-Pilot", type: "out", value: 120, category: "Assinaturas", date: "2026-05-22" },
    { id: "flow-4", description: "Projeto de Consultoria SmartData", type: "in", value: 4800, category: "Consultoria", date: "2026-05-24" },
    { id: "flow-5", description: "Campanha Meta Ads Maio", type: "out", value: 1200, category: "Marketing", date: "2026-05-25" }
  ],
  stock: [
    { id: "stock-1", name: "Moletom Dev Bordado Premium", qty: 45, cost: 45, price: 119 },
    { id: "stock-2", name: "Tee Algodão Egípcio Minimalista", qty: 120, cost: 22, price: 79 },
    { id: "stock-3", name: "Caneca Cerâmica Matte Estampada", qty: 80, cost: 12, price: 39 },
    { id: "stock-4", name: "Mousepad Desktop Couro Ecológico", qty: 30, cost: 35, price: 95 }
  ],
  campaigns: [
    { id: "camp-1", name: "Lançamento Coleção Outono Dev", platform: "Meta Ads", budget: 3000, spend: 1200, revenue: 3800, conversions: 32 },
    { id: "camp-2", name: "Leads SaaS Outbound", platform: "Google Ads", budget: 5000, spend: 2500, revenue: 5600, conversions: 78 }
  ],
  agenda: [
    { id: "task-1", title: "Pagar Simples Nacional (Impostos)", date: "2026-05-30", priority: "alta", status: "pendente" },
    { id: "task-2", title: "Reunião de Alinhamento de Metas Q3", date: "2026-05-29", priority: "media", status: "pendente" },
    { id: "task-3", title: "Conciliação bancária de faturas SaaS", date: "2026-05-27", priority: "baixa", status: "concluido" }
  ],
  chatMessages: [
    { sender: "zelda", text: "Olá humano. Eu sou a Zelda-OS V3.5, sua CFO particular e auditora sem paciência. Já analisei os dados da sua 'empresa' chamada Techify Soluções. Devo admitir que seu saldo parcial em caixa até que dá para comprar alguns cafés premium, mas se você não focar em bater os R$ 25.000 de faturamento desejado, sua única saída será pedir emprego pro seu primo estagiário de design. Como posso te criticar ou ajudar hoje? Pode me pedir para cadastrar saídas, entradas, atualizar o estoque ou analisar o tráfego!", datetime: "12:00" }
  ],
  offlineMode: false,
  syncStatus: "synced"
};

export default function App() {
  // Navigation tabs state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'empresa' | 'caixa' | 'estoque' | 'campanhas' | 'agenda' | 'chat' | 'celular'>('dashboard');
  
  // App state with localstorage sync
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem("agency_os_state_v2");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return INITIAL_STATE; }
    }
    return INITIAL_STATE;
  });

  // Sound effects toggle
  const [soundEnabled, setSoundEnabled] = useState(true);

  // General tutorial state
  const [showTutorial, setShowTutorial] = useState(true);

  // New item forms states
  const [newFlow, setNewFlow] = useState({ description: '', value: '', type: 'in' as 'in' | 'out', category: 'Vendas', date: new Date().toISOString().split('T')[0] });
  const [newStock, setNewStock] = useState({ name: '', qty: '', cost: '', price: '' });
  const [newCamp, setNewCamp] = useState({ name: '', platform: 'Meta Ads', budget: '', spend: '', revenue: '', conversions: '' });
  const [newAgenda, setNewAgenda] = useState({ title: '', date: new Date().toISOString().split('T')[0], priority: 'media' as 'baixa' | 'media' | 'alta' });

  // WebChat States
  const [chatInput, setChatInput] = useState("");
  const [isZeldaLoading, setIsZeldaLoading] = useState(false);
  const [proactiveTips, setProactiveTips] = useState<string[]>([
    "Sua meta de faturamento mensal é de R$ 25.000, mas o tráfego pago atual está sob risco estratégico devido ao baixo retorno consolidado de alguns canais.",
    "Bons ventos no seu estoque: Seu ativo corporativo imobilizado em mercadoria vale R$ 17.150,00. Trate de vender antes que vire comida de traça.",
    "O burn rate médio da infraestrutura de tecnologia está aceitável, mas há pagamentos de impostos vencendo nos próximos dias. Não atrase ou a Receita Federal vai bater na sua porta."
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Persists state
  useEffect(() => {
    localStorage.setItem("agency_os_state_v2", JSON.stringify(state));
  }, [state]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chatMessages]);

  // Audio simulation feedback
  const playPing = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // High pitched ping
      gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.warn("Sound preview is blocked by browser interaction guidelines.");
    }
  };

  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // Normal beep
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn("Sound feedback warning");
    }
  };

  // Reset entire dashboard
  const handleReset = () => {
    if (confirm("Deseja realmente redefinir todos os dados para a simulação inicial padrão?")) {
      setState(INITIAL_STATE);
      playBeep();
    }
  };

  // Toggle offline mode simulate
  const handleOfflineToggle = () => {
    setState(prev => {
      const isNowOffline = !prev.offlineMode;
      return {
        ...prev,
        offlineMode: isNowOffline,
        syncStatus: isNowOffline ? 'offline' : 'syncing'
      };
    });
    playBeep();

    if (state.offlineMode) {
      // simulating sync reconnect
      setTimeout(() => {
        setState(prev => ({ ...prev, syncStatus: 'synced' }));
        playPing();
      }, 1500);
    }
  };

  // Manual Trigger for Proactive Audit
  const handleTriggerAudit = async () => {
    setIsZeldaLoading(true);
    playPing();
    
    try {
      const response = await fetch("/api/zelda-interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: state,
          isProactiveAuditOnly: true
        })
      });
      const data = await response.json();
      if (data.proactiveTips) {
        setProactiveTips(data.proactiveTips);
      }
      if (data.response) {
        setState(prev => ({
          ...prev,
          chatMessages: [
            ...prev.chatMessages,
            { sender: "zelda", text: `[Auditoria Solicitada]: ${data.response}`, datetime: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) }
          ]
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsZeldaLoading(false);
    }
  };

  // Handle interacting with Zelda
  const handleSendChatMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isZeldaLoading) return;

    const userMsgText = chatInput;
    setChatInput("");
    setIsZeldaLoading(true);
    playBeep();

    const timestamp = new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
    
    // Add user message to local state
    setState(prev => ({
      ...prev,
      chatMessages: [
        ...prev.chatMessages,
        { sender: "user", text: userMsgText, datetime: timestamp }
      ]
    }));

    try {
      // Trigger API calling to Express server proxying the real Gemini API
      const response = await fetch("/api/zelda-interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: state,
          message: userMsgText,
          isProactiveAuditOnly: false
        })
      });

      const data = await response.json();
      playPing();

      // Set tips
      if (data.proactiveTips) {
        setProactiveTips(data.proactiveTips);
      }

      // Handle mutations returned from Gemini AI to alter site's state!
      setState(prev => {
        let updatedCompany = { ...prev.company };
        let updatedCashFlow = [...prev.cashFlow];
        let updatedStock = [...prev.stock];
        let updatedCampaigns = [...prev.campaigns];
        let updatedAgenda = [...prev.agenda];

        if (data.mutations) {
          const m = data.mutations;
          
          // mutate company
          if (m.company) {
            updatedCompany = { ...updatedCompany, ...m.company };
          }
          
          // mutate cashflow add
          if (m.addCashFlow) {
            updatedCashFlow.push({
              id: `flow-${Date.now()}`,
              description: m.addCashFlow.description || "Transação recomendada por Zelda",
              type: m.addCashFlow.type || "out",
              value: Number(m.addCashFlow.value) || 0,
              category: m.addCashFlow.category || "Geral",
              date: m.addCashFlow.date || new Date().toISOString().split('T')[0]
            });
          }

          // mutate stock add
          if (m.addStock) {
            updatedStock.push({
              id: `stock-${Date.now()}`,
              name: m.addStock.name || "Novo Produto",
              qty: Number(m.addStock.qty) || 0,
              cost: Number(m.addStock.cost) || 0,
              price: Number(m.addStock.price) || 0
            });
          }

          // mutate campaigns add
          if (m.addCampaign) {
            updatedCampaigns.push({
              id: `camp-${Date.now()}`,
              name: m.addCampaign.name || "Nova Campanha",
              platform: m.addCampaign.platform || "Meta Ads",
              budget: Number(m.addCampaign.budget) || 0,
              spend: Number(m.addCampaign.spend) || 0,
              revenue: Number(m.addCampaign.revenue) || 0,
              conversions: Number(m.addCampaign.conversions) || 0
            });
          }

          // mutate agenda add
          if (m.addAgenda) {
            updatedAgenda.push({
              id: `task-${Date.now()}`,
              title: m.addAgenda.title || "Tarefa administrativa",
              date: m.addAgenda.date || new Date().toISOString().split('T')[0],
              priority: (m.addAgenda.priority as any) || "media",
              status: "pendente"
            });
          }

          // delete actions
          if (m.deleteCashFlowId) {
            updatedCashFlow = updatedCashFlow.filter(x => x.id !== m.deleteCashFlowId);
          }
          if (m.deleteStockId) {
            updatedStock = updatedStock.filter(x => x.id !== m.deleteStockId);
          }
          if (m.deleteCampaignId) {
            updatedCampaigns = updatedCampaigns.filter(x => x.id !== m.deleteCampaignId);
          }
          if (m.deleteAgendaId) {
            updatedAgenda = updatedAgenda.filter(x => x.id !== m.deleteAgendaId);
          }
        }

        return {
          ...prev,
          company: updatedCompany,
          cashFlow: updatedCashFlow,
          stock: updatedStock,
          campaigns: updatedCampaigns,
          agenda: updatedAgenda,
          chatMessages: [
            ...prev.chatMessages,
            { 
              sender: "zelda", 
              text: data.response || "Comando executado! Verifique a atualização no painel correspondente agora mesmo.", 
              datetime: new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}) 
            }
          ]
        };
      });

    } catch (err) {
      console.error(err);
      setState(prev => ({
        ...prev,
        chatMessages: [
          ...prev.chatMessages,
          { sender: "zelda", text: "Erro na conexão com meus servidores centrais. Como você quer preencher algo sem internet ou conectividade com a IA? Ligue os cabos primeiro ou configure seu GEMINI_API_KEY corretamente.", datetime: timestamp }
        ]
      }));
    } finally {
      setIsZeldaLoading(false);
    }
  };

  // Calculation helpers
  const totalInflows = state.cashFlow
    .filter(item => item.type === 'in')
    .reduce((acc, current) => acc + current.value, 0);

  const totalOutflows = state.cashFlow
    .filter(item => item.type === 'out')
    .reduce((acc, current) => acc + current.value, 0);

  const consolidatedBalance = totalInflows - totalOutflows;

  // Active platform metrics
  const mrrGoal = state.company.targetMrr;
  const activeClients = state.cashFlow.filter(item => item.type === 'in' && item.category === 'SaaS Recorrente').length;
  // Simulated churn calculation
  const calculatedChurn = activeClients > 0 ? (1 / activeClients * 10).toFixed(1) + "%" : "0%";
  
  // Marketing campaign spend vs revenue ROAS calculation
  const totalMarketingSpend = state.campaigns.reduce((acc, current) => acc + current.spend, 0);
  const totalMarketingRevenue = state.campaigns.reduce((acc, current) => acc + current.revenue, 0);
  const averageRoasStr = totalMarketingSpend > 0 ? (totalMarketingRevenue / totalMarketingSpend).toFixed(1) + "x" : "0.0x";

  // PDF Download Trigger
  const handleDownloadPDF = () => {
    playPing();
    generateFinancialPDF(state);
  };

  // State handlers
  const handleAddCashFlow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFlow.description || !newFlow.value) return;
    
    setState(prev => ({
      ...prev,
      cashFlow: [
        ...prev.cashFlow,
        {
          id: `flow-${Date.now()}`,
          description: newFlow.description,
          type: newFlow.type,
          value: Number(newFlow.value),
          category: newFlow.category,
          date: newFlow.date
        }
      ]
    }));
    setNewFlow({ description: '', value: '', type: 'in', category: 'Vendas', date: new Date().toISOString().split('T')[0] });
    playPing();
  };

  const handleDeleteCashFlow = (id: string) => {
    setState(prev => ({
      ...prev,
      cashFlow: prev.cashFlow.filter(item => item.id !== id)
    }));
    playBeep();
  };

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStock.name || !newStock.qty || !newStock.cost || !newStock.price) return;

    setState(prev => ({
      ...prev,
      stock: [
        ...prev.stock,
        {
          id: `stock-${Date.now()}`,
          name: newStock.name,
          qty: Number(newStock.qty),
          cost: Number(newStock.cost),
          price: Number(newStock.price)
        }
      ]
    }));
    setNewStock({ name: '', qty: '', cost: '', price: '' });
    playPing();
  };

  const handleDeleteStock = (id: string) => {
    setState(prev => ({
      ...prev,
      stock: prev.stock.filter(item => item.id !== id)
    }));
    playBeep();
  };

  const handleAddCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamp.name || !newCamp.budget || !newCamp.spend || !newCamp.revenue) return;

    setState(prev => ({
      ...prev,
      campaigns: [
        ...prev.campaigns,
        {
          id: `camp-${Date.now()}`,
          name: newCamp.name,
          platform: newCamp.platform,
          budget: Number(newCamp.budget),
          spend: Number(newCamp.spend),
          revenue: Number(newCamp.revenue),
          conversions: Number(newCamp.conversions) || 0
        }
      ]
    }));
    setNewCamp({ name: '', platform: 'Meta Ads', budget: '', spend: '', revenue: '', conversions: '' });
    playPing();
  };

  const handleDeleteCampaign = (id: string) => {
    setState(prev => ({
      ...prev,
      campaigns: prev.campaigns.filter(item => item.id !== id)
    }));
    playBeep();
  };

  const handleAddAgenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgenda.title || !newAgenda.date) return;

    setState(prev => ({
      ...prev,
      agenda: [
        ...prev.agenda,
        {
          id: `task-${Date.now()}`,
          title: newAgenda.title,
          date: newAgenda.date,
          priority: newAgenda.priority,
          status: 'pendente'
        }
      ]
    }));
    setNewAgenda({ title: '', date: new Date().toISOString().split('T')[0], priority: 'media' });
    playPing();
  };

  const handleToggleTaskStatus = (id: string) => {
    setState(prev => ({
      ...prev,
      agenda: prev.agenda.map(item => {
        if (item.id === id) {
          const nextStatus = item.status === 'pendente' ? 'concluido' : 'pendente';
          return { ...item, status: nextStatus };
        }
        return item;
      })
    }));
    playPing();
  };

  const handleDeleteAgenda = (id: string) => {
    setState(prev => ({
      ...prev,
      agenda: prev.agenda.filter(item => item.id !== id)
    }));
    playBeep();
  };

  const handleUpdateCompanyInfo = (e: React.FormEvent) => {
    e.preventDefault();
    playPing();
    alert("Dados da Empresa registrados e criptografados localmente com sincronização Zelda-OS.");
  };

  return (
    <div className="min-h-screen bg-[#090A0F] text-[#CBD5E1] font-sans flex overflow-hidden">
      
      {/* 1. SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-[#0D0E16] border-r border-[#1F293D] flex flex-col justify-between shrink-0">
        <div>
          {/* Logo & Platform Name */}
          <div className="p-6 border-b border-[#1F293D] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#10B981] to-[#047857] flex items-center justify-center shadow-lg shadow-emerald-950/40">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-base block tracking-tight text-white font-sans">AgencyOS</span>
                <span className="text-[10px] text-emerald-400 font-mono tracking-wider font-bold block uppercase">BY TECHIFY</span>
              </div>
            </div>
          </div>

          {/* Sync badge info */}
          <div className="px-6 py-3 bg-[#131622] flex items-center justify-between border-b border-[#1F293D]">
            <span className="text-[10px] font-mono text-[#94A3B8]">MODO OPERACIONAL</span>
            <div className="flex items-center gap-1.5">
              {state.offlineMode ? (
                <>
                  <WifiOff className="w-3 h-3 text-red-400 animate-pulse" />
                  <span className="text-[10px] text-red-400 font-bold font-mono">OFFLINE</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
                  <span className="text-[10px] text-emerald-400 font-bold font-mono">LOCAL SYNC</span>
                </>
              )}
            </div>
          </div>

          {/* Categories Links */}
          <div className="p-4 space-y-6">
            
            {/* Sec. Principal */}
            <div>
              <span className="px-3 text-[10px] font-mono tracking-wider text-[#475569] block uppercase mb-2">Principal</span>
              <nav className="space-y-1">
                <button 
                  id="tab-btn-dashboard"
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer ${activeTab === 'dashboard' ? 'bg-[#161A29] text-white border-l-4 border-emerald-500 font-medium' : 'text-[#64748B] hover:text-[#CBD5E1] hover:bg-[#11131F]'}`}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Dashboard</span>
                </button>
              </nav>
            </div>

            {/* Sec. Configuracoes */}
            <div>
              <span className="px-3 text-[10px] font-mono tracking-wider text-[#475569] block uppercase mb-2">Configurações</span>
              <nav className="space-y-1">
                <button 
                  id="tab-btn-empresa"
                  onClick={() => setActiveTab('empresa')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer ${activeTab === 'empresa' ? 'bg-[#161A29] text-white border-l-4 border-emerald-500 font-medium' : 'text-[#64748B] hover:text-[#CBD5E1] hover:bg-[#11131F]'}`}
                >
                  <Building className="w-4 h-4 shrink-0" />
                  <span>Dados da Empresa</span>
                </button>
              </nav>
            </div>

            {/* Sec. Financeiro */}
            <div>
              <span className="px-3 text-[10px] font-mono tracking-wider text-[#475569] block uppercase mb-2">Financeiro</span>
              <nav className="space-y-1">
                <button 
                  id="tab-btn-caixa"
                  onClick={() => setActiveTab('caixa')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer ${activeTab === 'caixa' ? 'bg-[#161A29] text-white border-l-4 border-emerald-500 font-medium' : 'text-[#64748B] hover:text-[#CBD5E1] hover:bg-[#11131F]'}`}
                >
                  <ArrowUpRight className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Fluxo de Caixa</span>
                </button>
              </nav>
            </div>

            {/* Sec. Estoque */}
            <div>
              <span className="px-3 text-[10px] font-mono tracking-wider text-[#475569] block uppercase mb-2">Estoque</span>
              <nav className="space-y-1">
                <button 
                  id="tab-btn-estoque"
                  onClick={() => setActiveTab('estoque')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer ${activeTab === 'estoque' ? 'bg-[#161A29] text-white border-l-4 border-emerald-500 font-medium' : 'text-[#64748B] hover:text-[#CBD5E1] hover:bg-[#11131F]'}`}
                >
                  <Package className="w-4 h-4 shrink-0" />
                  <span>Estoque</span>
                </button>
              </nav>
            </div>

            {/* Sec. Tráfego */}
            <div>
              <span className="px-3 text-[10px] font-mono tracking-wider text-[#475569] block uppercase mb-2">Tráfego</span>
              <nav className="space-y-1">
                <button 
                  id="tab-btn-campanhas"
                  onClick={() => setActiveTab('campanhas')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer ${activeTab === 'campanhas' ? 'bg-[#161A29] text-white border-l-4 border-emerald-500 font-medium' : 'text-[#64748B] hover:text-[#CBD5E1] hover:bg-[#11131F]'}`}
                >
                  <Megaphone className="w-4 h-4 shrink-0" />
                  <span>Campanhas Ads</span>
                </button>
              </nav>
            </div>

            {/* Sec. Gestão */}
            <div>
              <span className="px-3 text-[10px] font-mono tracking-wider text-[#475569] block uppercase mb-2">Gestão</span>
              <nav className="space-y-1">
                <button 
                  id="tab-btn-agenda"
                  onClick={() => setActiveTab('agenda')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer ${activeTab === 'agenda' ? 'bg-[#161A29] text-white border-l-4 border-emerald-500 font-medium' : 'text-[#64748B] hover:text-[#CBD5E1] hover:bg-[#11131F]'}`}
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span>Agenda</span>
                </button>
              </nav>
            </div>

            {/* Sec. Conectatividade */}
            <div>
              <span className="px-3 text-[10px] font-mono tracking-wider text-[#475569] block uppercase mb-2">Conectividade</span>
              <nav className="space-y-1">
                <button 
                  id="tab-btn-chat"
                  onClick={() => setActiveTab('chat')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer ${activeTab === 'chat' ? 'bg-[#161A29] text-white border-l-4 border-emerald-500 font-medium' : 'text-[#64748B] hover:text-[#CBD5E1] hover:bg-[#11131F]'}`}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>WhatsApp AI</span>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">ATIVO</span>
                </button>
              </nav>
            </div>

            {/* Sec. Desconectado */}
            <div>
              <span className="px-3 text-[10px] font-mono tracking-wider text-[#475569] block uppercase mb-2">Desconectado</span>
              <nav className="space-y-1">
                <button 
                  id="tab-btn-celular"
                  onClick={() => setActiveTab('celular')}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer ${activeTab === 'celular' ? 'bg-[#161A29] text-white border-l-4 border-emerald-500 font-medium' : 'text-[#64748B] hover:text-[#CBD5E1] hover:bg-[#11131F]'}`}
                >
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>Baixar no Celular</span>
                </button>
              </nav>
            </div>

          </div>
        </div>

        {/* User profile bottom item */}
        <div className="p-4 border-t border-[#1F293D] uppercase">
          <div className="bg-[#11131F] rounded-xl p-3 flex items-center gap-3 border border-[#1F2930]">
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
              <User className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-[#475569] font-mono block tracking-wider">PERFIL ATIVO</span>
              <span className="text-xs font-bold text-[#F8FAF` + `C] truncate block">{state.company.name || "Agency Corp"}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. MAIN WORKSPACE CONTENT CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto bg-[#090A0F]">
        
        {/* Header toolbar */}
        <header className="h-16 border-b border-[#1F293D] px-8 flex items-center justify-between bg-[#0D0E16]/40 sticky top-0 backdrop-blur shrink-0 z-30">
          <div className="flex items-center gap-3 font-mono text-[10px]">
            <span className="text-[#64748B] uppercase tracking-widest font-bold">CONTROLE CENTRAL</span>
            <span className="text-[#64748B] font-thin">/</span>
            <span className="text-emerald-400 uppercase tracking-widest font-bold font-mono">{activeTab}</span>
          </div>

          <div className="flex items-center gap-3">
            
            {/* Play/Mute sound cue */}
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2.5 rounded-lg hover:bg-[#1E293B] text-slate-400 hover:text-white transition duration-200"
              title={soundEnabled ? "Mutar Feedback de Áudio" : "Ativar Som"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-[#64748B]" />}
            </button>

            {/* Offline simulate Toggle */}
            <button 
              onClick={handleOfflineToggle}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-2 border cursor-pointer hover:bg-slate-800 transition ${state.offlineMode ? 'bg-red-950/20 text-red-400 border-red-500/40' : 'bg-emerald-950/20 text-emerald-400 border-emerald-500/40'}`}
            >
              <Wifi className="w-3" />
              <span>{state.offlineMode ? "Offline Test" : "Cache Sinc"}</span>
            </button>

            {/* EXPORT DETAILED PDF BUTTON */}
            <button 
              onClick={handleDownloadPDF}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition flex items-center gap-2 cursor-pointer shadow-md shadow-emerald-500/10"
              title="Exportar Relatório PDF Detalhado das Finanças em Tempo Real"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Baixar Relatório PDF</span>
            </button>

            {/* Redefinir Painel */}
            <button 
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg text-xs font-mono text-[#64748B] hover:text-white border border-[#1F293C] hover:bg-red-500/10 hover:border-red-500/30 transition cursor-pointer"
            >
              RESETA PAINEL
            </button>
          </div>
        </header>

        {/* Dynamic content panels based on activeTab */}
        <div className="p-8 max-w-[1700px] w-full mx-auto flex-1">
          
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                
                {/* Tutorial banner guide (Dismissible) */}
                {showTutorial && (
                  <div className="bg-[#121E24]/70 border border-[#164E63] rounded-2xl p-5 flex items-start justify-between relative shadow-lg shadow-cyan-950/20">
                    <div className="flex items-start gap-4 pr-10">
                      <div className="w-9 h-9 rounded-xl bg-[#0891B2]/20 flex items-center justify-center shrink-0 border border-[#0891B2]/30 mt-1">
                        <Sparkles className="w-4 h-4 text-[#22D3EE]" />
                      </div>
                      <div>
                        <span className="text-xs uppercase font-mono tracking-widest text-[#22D3EE] font-bold block mb-1">GUIA CORPORATIVO • ABA DASHBOARD</span>
                        <p className="text-xs text-[#90E0EF] leading-relaxed">
                          Bem-vindo ao Command Center da sua corretora/agência! Aqui você acompanha o faturamento mensal unificado (MRR), taxa de faturamento líquido, quantidade de clientes ativos de tráfego, e aciona diagnósticos fiscais e de desempenho sob demanda da inteligência de negócios. A Zelda-OS está assistindo tudo.
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setShowTutorial(false); playBeep(); }}
                      className="text-xs hover:text-white uppercase font-mono tracking-widest bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black transition-colors duration-200 px-3 py-1.5 rounded-lg border border-emerald-500/30"
                    >
                      Entendi, fechar tutorial
                    </button>
                  </div>
                )}

                {/* Main section greeting */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold">{state.company.sector} • AO VIVO</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mt-1">Bem-vindo ao {state.company.name}</h1>
                    <p className="text-sm text-[#475569] mt-1">Tudo o que você precisa para gerir a sua empresa em um só lugar. Integrado e persistido.</p>
                  </div>

                  {/* Proactive triggers */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTriggerAudit}
                      disabled={isZeldaLoading}
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#11131F] border border-emerald-500/20 hover:border-emerald-500/50 text-[#10B981] transition flex items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isZeldaLoading ? 'animate-spin' : ''}`} />
                      <span>Auditoria Sarcástica de IA</span>
                    </button>
                  </div>
                </div>

                {/* Dashboard Metrics Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  
                  {/* Metric 1: MRR */}
                  <div className="bg-[#0D0E16] border border-[#1F293D] rounded-2xl p-6 relative overflow-hidden group hover:border-[#38bdf8]/30 transition duration-300 shadow-xl shadow-black/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono tracking-wider font-bold text-[#64748B] uppercase">MRR Recorrente</span>
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400 font-mono font-extrabold text-sm font-sans">$</div>
                    </div>
                    <div className="mt-4">
                      <span className="text-2xl font-bold text-white tracking-widest">R$ {totalInflows.toLocaleString("pt-BR")}</span>
                    </div>
                    <p className="text-[11px] font-semibold text-slate-500 mt-2 font-mono">
                      Faturamento alvo mensal: <span className="text-[#F8FAF` + `C]">R$ {mrrGoal.toLocaleString("pt-BR")}</span>
                    </p>
                  </div>

                  {/* Metric 2: Clientes */}
                  <div className="bg-[#0D0E16] border border-[#1F293D] rounded-2xl p-6 relative overflow-hidden group hover:border-[#a855f7]/30 transition duration-300 shadow-xl shadow-black/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono tracking-wider font-bold text-[#64748B] uppercase">Clientes Ativos</span>
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
                        <Building className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-2xl font-bold text-white tracking-widest">{activeClients}</span>
                    </div>
                    <p className="text-[11px] text-[#22c55e] mt-2 font-mono font-semibold">
                      Com mensalidade SaaS registrada e persistida
                    </p>
                  </div>

                  {/* Metric 3: Churn Rate */}
                  <div className="bg-[#0D0E16] border border-[#1F293D] rounded-2xl p-6 relative overflow-hidden group hover:border-[#f43f5e]/30 transition duration-300 shadow-xl shadow-black/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono tracking-wider font-bold text-[#64748B] uppercase">Churn Rate</span>
                      <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400">
                        <ArrowDownRight className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-2xl font-bold text-white tracking-widest">{calculatedChurn}</span>
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-2 font-mono">
                      Índice calculado com base na recorrência atual
                    </p>
                  </div>

                  {/* Metric 4: ROAS Médio */}
                  <div className="bg-[#0D0E16] border border-[#1F293D] rounded-2xl p-6 relative overflow-hidden group hover:border-[#eab308]/30 transition duration-300 shadow-xl shadow-black/30">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono tracking-wider font-bold text-[#64748B] uppercase">ROAS Médio</span>
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 text-yellow-400">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-2xl font-bold text-white tracking-widest">{averageRoasStr}</span>
                    </div>
                    <p className="text-[11px] text-yellow-400/80 mt-2 font-mono font-semibold">
                      Retorno sobre investimento em tráfego de campanhas
                    </p>
                  </div>

                </div>

                {/* Middle Grid: Cash Flow chart + Zelda Proactive Audit */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Dynamic Cash Flow Chart Widget */}
                  <div className="bg-[#0D0E16] border border-[#1F293D] rounded-3xl p-6 lg:col-span-2 shadow-xl shadow-black/30">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3 className="font-bold text-lg text-white">Fluxo Financeiro de Caixa</h3>
                        <p className="text-xs text-[#64748B] mt-0.5">Histórico sequencial das últimas entradas e saídas</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-emerald-500" />
                          <span className="text-slate-400 font-semibold">Entradas: R$ {totalInflows.toLocaleString("pt-BR")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span className="text-slate-400 font-semibold">Saídas: R$ {totalOutflows.toLocaleString("pt-BR")}</span>
                        </div>
                      </div>
                    </div>

                    {/* Highly responsive custom HTML/CSS Bar graph representation */}
                    <div className="h-64 bg-[#08090E]/60 rounded-2xl border border-[#1F293D] flex items-end justify-around p-6 relative">
                      {state.cashFlow.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6">
                          <Package className="w-10 h-10 text-[#2B3547]" />
                          <span className="text-xs text-[#64748B] text-center">Sem transações cadastradas para desenhar o gráfico.</span>
                          <button onClick={() => setActiveTab('caixa')} className="text-emerald-400 text-xs font-semibold hover:underline mt-1">Registrar primeira Entrada/Saída →</button>
                        </div>
                      ) : (
                        state.cashFlow.map((flow, index) => {
                          const maxVal = Math.max(...state.cashFlow.map(f => f.value), 1000);
                          const isIncome = flow.type === 'in';
                          const pct = (flow.value / maxVal) * 100;
                          
                          return (
                            <div key={flow.id} className="flex flex-col items-center group cursor-pointer w-12 text-center relative">
                              {/* Hover Tooltip card details */}
                              <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 bg-[#161a29] border border-[#1F293D] text-[10px] text-white p-2.5 rounded-lg pointer-events-none transition-all duration-200 z-50 w-32 shadow-xl shadow-black/80">
                                <span className="block font-bold">{flow.description}</span>
                                <span className="block text-slate-400">{flow.category}</span>
                                <span className={`block font-bold mt-1 ${isIncome ? 'text-emerald-400' : 'text-red-400'}`}>
                                  R$ {flow.value.toLocaleString("pt-BR")}
                                </span>
                              </div>

                              {/* Interactive columns bars */}
                              <div className="w-5 bg-[#161A29] rounded-t-lg h-44 flex items-end overflow-hidden border border-[#232B40]/30 hover:border-emerald-500/40 relative">
                                <motion.div 
                                  initial={{ height: 0 }}
                                  animate={{ height: `${pct}%` }}
                                  transition={{ delay: index * 0.05, duration: 0.5 }}
                                  className={`w-full rounded-t-md ${isIncome ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-lg shadow-emerald-500/20' : 'bg-gradient-to-t from-red-600 to-red-400 shadow-lg shadow-red-500/20'}`} 
                                />
                              </div>
                              <span className="text-[9px] font-mono text-[#475569] mt-2 block truncate w-full" title={flow.description}>{flow.description}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center text-xs font-mono border-t border-[#1F293D]/40 pt-4 mt-4">
                      <span className="text-[#64748B]">Saldo Consolidado:</span>
                      <span className={`font-bold tracking-widest ${consolidatedBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>R$ {consolidatedBalance.toLocaleString("pt-BR")}</span>
                    </div>

                  </div>

                  {/* Zelda Audit proactive insights panel */}
                  <div className="bg-[#0D0E16] border border-[#1F293D] rounded-3xl p-6 shadow-xl shadow-black/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <h3 className="font-bold text-base text-white tracking-tight uppercase font-mono">Auditoria de IA Proativa</h3>
                        </div>
                        <span className="bg-[#1C1F2E] border border-emerald-500/20 text-[#10B981] text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase">ZELDA-OS V3.5</span>
                      </div>
                      <p className="text-xs text-[#64748B] leading-relaxed">
                        Análise de tendências de mercado, estoque e canais corporativos sem rodeios. Zelda analisa seu JSON local de dados em tempo real.
                      </p>

                      <div className="mt-5 space-y-4">
                        {proactiveTips.map((tip, idx) => (
                          <div key={idx} className="bg-[#121420] border-l-4 border-emerald-500 p-3.5 rounded-r-xl border border-y-[#1F294C]/40 border-r-[#1F294C]/40 flex items-start gap-3 shadow shadow-black/10">
                            <span className="text-emerald-400 shrink-0 font-extrabold font-mono text-xs">●</span>
                            <p className="text-xs text-slate-300 leading-relaxed font-sans">{tip}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-8 border-t border-[#1F293C]/40 pt-4">
                      <button 
                        onClick={handleTriggerAudit}
                        disabled={isZeldaLoading}
                        className="w-full py-2.5 rounded-xl text-xs font-semibold bg-[#11131F] border border-emerald-500/20 hover:border-emerald-500/50 text-[#10B981] transition flex items-center justify-center gap-2 cursor-pointer uppercase tracking-wider font-mono disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isZeldaLoading ? 'animate-spin' : ''}`} />
                        <span>Chacoalhar IA e pedir conselhos adicionais →</span>
                      </button>
                    </div>
                  </div>

                </div>

                {/* Bottom Active modules view list */}
                <div className="bg-[#0D0E16] border border-[#1F293D] rounded-3xl p-6 shadow-xl shadow-black/30">
                  <h3 className="font-bold text-base text-white mb-6">Módulos Ativos do Sistema</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    <button onClick={() => setActiveTab('caixa')} className="bg-[#08090E]/60 hover:bg-[#11131F] border border-[#1f293d]/50 hover:border-emerald-500/30 text-left p-4 rounded-2xl transition cursor-pointer">
                      <ArrowUpRight className="w-5 h-5 text-emerald-400 mb-2" />
                      <span className="text-xs font-bold text-white block">Livro Caixa</span>
                      <span className="text-[11px] text-slate-500 mt-1 block leading-relaxed">{state.cashFlow.length} lançamentos persistidos localmente.</span>
                    </button>

                    <button onClick={() => setActiveTab('estoque')} className="bg-[#08090E]/60 hover:bg-[#11131F] border border-[#1f293d]/50 hover:border-emerald-500/30 text-left p-4 rounded-2xl transition cursor-pointer">
                      <Package className="w-5 h-5 text-purple-400 mb-2" />
                      <span className="text-xs font-bold text-white block">Controle Estoque</span>
                      <span className="text-[11px] text-slate-500 mt-1 block leading-relaxed">{state.stock.length} produtos em estoque. Ativo de R$ {state.stock.reduce((acc, c) => acc + (c.qty * c.price), 0).toLocaleString("pt-BR")}.</span>
                    </button>

                    <button onClick={() => setActiveTab('campanhas')} className="bg-[#08090E]/60 hover:bg-[#11131F] border border-[#1f293d]/50 hover:border-emerald-500/30 text-left p-4 rounded-2xl transition cursor-pointer">
                      <Megaphone className="w-5 h-5 text-blue-400 mb-2" />
                      <span className="text-xs font-bold text-white block">Campanhas Ads</span>
                      <span className="text-[11px] text-slate-500 mt-1 block leading-relaxed">{state.campaigns.length} canais monitorados. Gasto total R$ {totalMarketingSpend.toLocaleString("pt-BR")}.</span>
                    </button>

                    <button onClick={() => setActiveTab('agenda')} className="bg-[#08090E]/60 hover:bg-[#11131F] border border-[#1f293d]/50 hover:border-emerald-500/30 text-left p-4 rounded-2xl transition cursor-pointer">
                      <Calendar className="w-5 h-5 text-yellow-400 mb-2" />
                      <span className="text-xs font-bold text-white block">Cronograma Agenda</span>
                      <span className="text-[11px] text-slate-500 mt-1 block leading-relaxed">{state.agenda.filter(x => x.status === 'pendente').length} tarefas pendentes hoje.</span>
                    </button>

                  </div>
                </div>

              </motion.div>
            )}

            {/* TAB: Dados da Empresa */}
            {activeTab === 'empresa' && (
              <motion.div 
                key="empresa"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-2xl mx-auto space-y-8"
              >
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Dados Cadastrais da Empresa</h1>
                  <p className="text-sm text-[#64748B] mt-1">Preencha as informações reais ou fictícias da corporação. Zelda usará estes metadados contextuais para personalizar as críticas e sugestões de plano de negócios no WhatsApp e no painel proativo.</p>
                </div>

                <form onSubmit={handleUpdateCompanyInfo} className="bg-[#0D0E16] border border-[#1F293D] rounded-3xl p-8 space-y-6 shadow-xl shadow-black/30">
                  
                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Nome da Empresa / Razão Social</label>
                    <input 
                      type="text"
                      required
                      value={state.company.name}
                      onChange={e => setState(p => ({ ...p, company: { ...p.company, name: e.target.value } }))}
                      className="w-full bg-[#08090E] border border-[#1F293C] rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition duration-200"
                      placeholder="Ex: Techify Soluções Ltda"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">CNPJ de Registro</label>
                      <input 
                        type="text"
                        value={state.company.cnpj}
                        onChange={e => setState(p => ({ ...p, company: { ...p.company, cnpj: e.target.value } }))}
                        className="w-full bg-[#08090E] border border-[#1F293C] rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition duration-200"
                        placeholder="00.000.000/0001-00"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Setor de Atuação</label>
                      <input 
                        type="text"
                        value={state.company.sector}
                        onChange={e => setState(p => ({ ...p, company: { ...p.company, sector: e.target.value } }))}
                        className="w-full bg-[#08090E] border border-[#1F293C] rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition duration-200"
                        placeholder="Ex: Ecommerce, Startup, Dropshipping"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Meta de Faturamento Mensal Desejado (MRR)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-slate-500 text-sm">R$</span>
                      </div>
                      <input 
                        type="number"
                        required
                        value={state.company.targetMrr}
                        onChange={e => setState(p => ({ ...p, company: { ...p.company, targetMrr: Number(e.target.value) } }))}
                        className="w-full bg-[#08090E] border border-[#1F293C] rounded-xl pl-10 pr-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition duration-200"
                        placeholder="15000"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Descrição da Atividade</label>
                    <textarea 
                      rows={3}
                      value={state.company.description}
                      onChange={e => setState(p => ({ ...p, company: { ...p.company, description: e.target.value } }))}
                      className="w-full bg-[#08090E] border border-[#1F293C] rounded-xl px-4 py-3 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 transition duration-200 resize-none"
                      placeholder="Breve sumário do que sua empresa vende..."
                    />
                  </div>

                  <div className="bg-[#12131C] border border-blue-500/20 p-4 rounded-2xl flex gap-3 text-xs leading-relaxed text-[#708090] align-middle">
                    <ShieldAlert className="w-5 h-5 text-[#3060B0] shrink-0 mt-0.5" />
                    <span>Zelda-OS está monitorando estas metas. Modificar estes limites afetará as métricas gerais do auditor autônomo.</span>
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 dark:text-black font-bold text-sm transition cursor-pointer"
                  >
                    Salvar Configurações Locais
                  </button>

                </form>
              </motion.div>
            )}

            {/* TAB: Fluxo de Caixa */}
            {activeTab === 'caixa' && (
              <motion.div 
                key="caixa"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Livro de Caixa & Fluxo de Recursos</h1>
                  <p className="text-sm text-[#64748B] mt-1">Registre novos aportes, vendas recorrentes saas ou despesas comerciais operacionais. Sincronização offline e IA unificados.</p>
                </div>

                {/* Caixa Summary metrics mini-row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-[#0D0E16]/90 border border-[#1F293D] p-5 rounded-2xl">
                    <span className="text-xs font-mono text-[#64748B] uppercase block">Acumulado Entradas</span>
                    <span className="text-xl font-bold text-emerald-400 block mt-2">R$ {totalInflows.toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="bg-[#0D0E16]/90 border border-[#1F293D] p-5 rounded-2xl">
                    <span className="text-xs font-mono text-[#64748B] uppercase block">Acumulado Saídas</span>
                    <span className="text-xl font-bold text-red-400 block mt-2">R$ {totalOutflows.toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="bg-[#0D0E16]/90 border border-[#1F293D] p-5 rounded-2xl">
                    <span className="text-xs font-mono text-[#64748B] uppercase block">Saldo Líquido</span>
                    <span className={`text-xl font-bold block mt-2 ${consolidatedBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      R$ {consolidatedBalance.toLocaleString("pt-BR")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Register Form */}
                  <div className="bg-[#0D0E16] border border-[#1F293D] rounded-3xl p-6 h-fit shrink-0 shadow-xl shadow-black/30">
                    <h3 className="font-bold text-base text-white mb-5">Novo Lançamento</h3>
                    
                    <form onSubmit={handleAddCashFlow} className="space-y-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Descrição</label>
                        <input 
                          type="text"
                          required
                          value={newFlow.description}
                          onChange={e => setNewFlow(p => ({ ...p, description: e.target.value }))}
                          className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
                          placeholder="Ex: Licença Microsoft Word"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Valor (R$)</label>
                        <input 
                          type="number"
                          required
                          value={newFlow.value}
                          onChange={e => setNewFlow(p => ({ ...p, value: e.target.value }))}
                          className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
                          placeholder="500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Tipo</label>
                          <select 
                            value={newFlow.type}
                            onChange={e => setNewFlow(p => ({ ...p, type: e.target.value as 'in' | 'out' }))}
                            className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
                          >
                            <option value="in">Entrada (+)</option>
                            <option value="out">Saída (-)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Categoria</label>
                          <input 
                            type="text"
                            required
                            value={newFlow.category}
                            onChange={e => setNewFlow(p => ({ ...p, category: e.target.value }))}
                            className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
                            placeholder="SaaS, Impostos, Marketing"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Data de Competência</label>
                        <input 
                          type="date"
                          required
                          value={newFlow.date}
                          onChange={e => setNewFlow(p => ({ ...p, date: e.target.value }))}
                          className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
                        />
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-2.5 rounded-lg bg-[#11131F] border border-emerald-500/20 text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-white font-mono font-bold text-xs uppercase transition tracking-wider cursor-pointer"
                      >
                        Registrar Lançamento local
                      </button>

                    </form>
                  </div>

                  {/* Right Column: Transactions details list */}
                  <div className="bg-[#0D0E16] border border-[#1F293D] rounded-3xl p-6 lg:col-span-2 shadow-xl shadow-black/30 overflow-hidden">
                    <h3 className="font-bold text-base text-white mb-5">Painel Geral de Filtros e Histórico</h3>

                    <div className="relative overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#1F293C] text-[10px] uppercase font-mono tracking-wider text-slate-500">
                            <th className="pb-3 font-semibold">Data</th>
                            <th className="pb-3 font-semibold">Descrição</th>
                            <th className="pb-3 font-semibold">Categoria</th>
                            <th className="pb-3 font-semibold text-center">Tipo</th>
                            <th className="pb-3 font-semibold text-right">Valor</th>
                            <th className="pb-3 font-semibold text-center">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {state.cashFlow.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-10 text-xs text-slate-500 italic">
                                Sem lançamentos em fluxo de caixa para listar. Use o formulário ou converse com Zelda no WhatsApp AI.
                              </td>
                            </tr>
                          ) : (
                            state.cashFlow.map(item => (
                              <tr key={item.id} className="border-b border-[#1F293C]/40 text-xs hover:bg-[#11131F]/30 transition group">
                                <td className="py-3.5 text-slate-400 font-mono">{item.date}</td>
                                <td className="py-3.5 font-medium text-slate-200">{item.description}</td>
                                <td className="py-3.5">
                                  <span className="bg-[#1C1F2D] border border-slate-700/50 px-2 py-0.5 rounded text-[10px] text-slate-400">{item.category}</span>
                                </td>
                                <td className="py-3.5 text-center">
                                  {item.type === 'in' ? (
                                    <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold">entrada</span>
                                  ) : (
                                    <span className="bg-red-500/10 text-red-500 text-[10px] px-2 py-0.5 rounded-full font-bold">saída</span>
                                  )}
                                </td>
                                <td className={`py-3.5 text-right font-mono font-bold ${item.type === 'in' ? 'text-emerald-400' : 'text-slate-200'}`}>
                                  R$ {item.value.toLocaleString("pt-BR")}
                                </td>
                                <td className="py-3.5 text-center">
                                  <button 
                                    onClick={() => handleDeleteCashFlow(item.id)}
                                    className="p-1 text-slate-500 hover:text-red-400 transition cursor-pointer"
                                    title="Remover transição"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

            {/* TAB: Estoque */}
            {activeTab === 'estoque' && (
              <motion.div 
                key="estoque"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Estoque de Ativos de Revenda</h1>
                  <p className="text-sm text-[#64748B] mt-1">Organize roupas, brindes, mousepads, licenças virtuais em massa, canecas ou qualquer ativo comercial estocado.</p>
                </div>

                {/* Capital total stored block */}
                <div className="bg-[#090D1A] border border-[#1F293D] p-5 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono text-slate-400">ATIVO CIRCULANTE EM PRODUTO ESTOCADO</span>
                    <span className="text-2xl font-bold text-[#A855F7] block mt-1">R$ {state.stock.reduce((acc, cur) => acc + (cur.qty * cur.price), 0).toLocaleString("pt-BR")}</span>
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-slate-500 block">Total de Unidades Disponíveis</span>
                    <span className="text-slate-300 font-bold block mt-1">{state.stock.reduce((acc, cur) => acc + cur.qty, 0)} unidades corporativas</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Register Form */}
                  <div className="bg-[#0D0E16] border border-[#1F293D] rounded-3xl p-6 h-fit shadow-xl shadow-black/30">
                    <h3 className="font-bold text-base text-white mb-5">Adicionar Novo Ativo</h3>
                    
                    <form onSubmit={handleAddStock} className="space-y-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Nome do Produto</label>
                        <input 
                          type="text"
                          required
                          value={newStock.name}
                          onChange={e => setNewStock(p => ({ ...p, name: e.target.value }))}
                          className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
                          placeholder="Ex: Caneca Cerâmica Negra Matte"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Quantia</label>
                          <input 
                            type="number"
                            required
                            value={newStock.qty}
                            onChange={e => setNewStock(p => ({ ...p, qty: e.target.value }))}
                            className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
                            placeholder="50"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Custo (R$)</label>
                          <input 
                            type="number"
                            required
                            value={newStock.cost}
                            onChange={e => setNewStock(p => ({ ...p, cost: e.target.value }))}
                            className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
                            placeholder="12"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Venda (R$)</label>
                          <input 
                            type="number"
                            required
                            value={newStock.price}
                            onChange={e => setNewStock(p => ({ ...p, price: e.target.value }))}
                            className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
                            placeholder="32"
                          />
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-2.5 rounded-lg bg-[#11131F] border border-emerald-500/20 text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-white font-mono font-bold text-xs uppercase transition tracking-wider cursor-pointer"
                      >
                        Salvar produto no estoque
                      </button>

                    </form>
                  </div>

                  {/* Stock table lists */}
                  <div className="bg-[#0D0E16] border border-[#1F293D] rounded-3xl p-6 lg:col-span-2 shadow-xl shadow-black/30">
                    <h3 className="font-bold text-base text-white mb-5">Inventário Ativo</h3>

                    <div className="relative overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#1F293C] text-[10px] uppercase font-mono tracking-wider text-slate-500">
                            <th className="pb-3 font-semibold">Produto</th>
                            <th className="pb-3 text-center font-semibold">Qtd Disp.</th>
                            <th className="pb-3 text-right font-semibold">Custo Un</th>
                            <th className="pb-3 text-right font-semibold">Preço Venda</th>
                            <th className="pb-3 text-right font-semibold">Total Estocado</th>
                            <th className="pb-3 text-center font-semibold">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {state.stock.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-10 text-xs text-slate-500 italic">
                                Sem produtos cadastrados no estoque até o momento.
                              </td>
                            </tr>
                          ) : (
                            state.stock.map(item => (
                              <tr key={item.id} className="border-b border-[#1F293C]/40 text-xs hover:bg-[#11131F]/30 transition">
                                <td className="py-3.5 text-slate-200 font-medium">{item.name}</td>
                                <td className="py-3.5 text-center font-bold text-emerald-400 font-mono">{item.qty} un</td>
                                <td className="py-3.5 text-right font-mono text-slate-400">R$ {item.cost.toLocaleString("pt-BR")}</td>
                                <td className="py-3.5 text-right font-mono text-slate-100">R$ {item.price.toLocaleString("pt-BR")}</td>
                                <td className="py-3.5 text-right font-mono text-purple-400 font-bold">R$ {(item.qty * item.price).toLocaleString("pt-BR")}</td>
                                <td className="py-3.5 text-center">
                                  <button 
                                    onClick={() => handleDeleteStock(item.id)}
                                    className="p-1 text-slate-500 hover:text-red-400 transition cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

            {/* TAB: Campanhas */}
            {activeTab === 'campanhas' && (
              <motion.div 
                key="campanhas"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Campanhas & Tráfego Pago</h1>
                  <p className="text-sm text-[#64748B] mt-1">Monitore canais ADS de Facebook, Meta, TikTok e Google. Zelda analisa o ROAS crítico e reporta métricas deficientes.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Camp Register Form */}
                  <div className="bg-[#0D0E16] border border-[#1F293D] rounded-3xl p-6 h-fit shadow-xl shadow-black/30">
                    <h3 className="font-bold text-base text-white mb-5">Nova Campanha Tráfego</h3>
                    
                    <form onSubmit={handleAddCampaign} className="space-y-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Nome da Campanha</label>
                        <input 
                          type="text"
                          required
                          value={newCamp.name}
                          onChange={e => setNewCamp(p => ({ ...p, name: e.target.value }))}
                          className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
                          placeholder="Ex: Coleção Inverno Leads"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Plataforma Canal</label>
                        <select 
                          value={newCamp.platform}
                          onChange={e => setNewCamp(p => ({ ...p, platform: e.target.value }))}
                          className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
                        >
                          <option value="Meta Ads">Meta Ads (Instagram/Facebook)</option>
                          <option value="Google Ads">Google Ads (YouTube/Search)</option>
                          <option value="TikTok Ads">TikTok Ads</option>
                          <option value="Outbound Leads">Outbound / LinkedIn</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Orçamento Total (R$)</label>
                          <input 
                            type="number"
                            required
                            value={newCamp.budget}
                            onChange={e => setNewCamp(p => ({ ...p, budget: e.target.value }))}
                            className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
                            placeholder="5000"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Gasto Realizado (R$)</label>
                          <input 
                            type="number"
                            required
                            value={newCamp.spend}
                            onChange={e => setNewCamp(p => ({ ...p, spend: e.target.value }))}
                            className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
                            placeholder="1200"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Faturamento Obtido (R$)</label>
                          <input 
                            type="number"
                            required
                            value={newCamp.revenue}
                            onChange={e => setNewCamp(p => ({ ...p, revenue: e.target.value }))}
                            className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
                            placeholder="3800"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Fichas/Conversões</label>
                          <input 
                            type="number"
                            required
                            value={newCamp.conversions}
                            onChange={e => setNewCamp(p => ({ ...p, conversions: e.target.value }))}
                            className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
                            placeholder="32"
                          />
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-2.5 rounded-lg bg-[#11131F] border border-emerald-500/20 text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-white font-mono font-bold text-xs uppercase transition tracking-wider cursor-pointer"
                      >
                        Registrar no Tráfego
                      </button>

                    </form>
                  </div>

                  {/* Campaigns tabular lists */}
                  <div className="bg-[#0D0E16] border border-[#1F293D] rounded-3xl p-6 lg:col-span-2 shadow-xl shadow-black/30">
                    <h3 className="font-bold text-base text-white mb-5">Eficiência de Conversão de Canais</h3>

                    <div className="relative overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-[#1F293C] text-[10px] uppercase font-mono tracking-wider text-slate-500">
                            <th className="pb-3 font-semibold">Campanha / Canal</th>
                            <th className="pb-3 text-right font-semibold">Orçamento</th>
                            <th className="pb-3 text-right font-semibold">Gasto</th>
                            <th className="pb-3 text-right font-semibold">Receita Gerada</th>
                            <th className="pb-3 text-center font-semibold">ROAS</th>
                            <th className="pb-3 text-center font-semibold">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {state.campaigns.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-10 text-xs text-slate-500 italic">
                                Sem campanhas ativas. Anuncie para expandir!
                              </td>
                            </tr>
                          ) : (
                            state.campaigns.map(item => {
                              const calculatedRoas = item.spend > 0 ? (item.revenue / item.spend) : 0;
                              return (
                                <tr key={item.id} className="border-b border-[#1F293C]/40 text-xs hover:bg-[#11131F]/30 transition">
                                  <td className="py-3.5">
                                    <span className="text-slate-200 font-medium block">{item.name}</span>
                                    <span className="text-[10px] text-[#22D3EE] font-mono uppercase block mt-0.5">{item.platform}</span>
                                  </td>
                                  <td className="py-3.5 text-right font-mono">R$ {item.budget.toLocaleString("pt-BR")}</td>
                                  <td className="py-3.5 text-right font-mono">R$ {item.spend.toLocaleString("pt-BR")}</td>
                                  <td className="py-3.5 text-right font-mono text-[#F8FAF` + `C]">R$ {item.revenue.toLocaleString("pt-BR")}</td>
                                  <td className="py-3.5 text-center">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${calculatedRoas >= 2.0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                      {calculatedRoas.toFixed(1)}x
                                    </span>
                                  </td>
                                  <td className="py-3.5 text-center">
                                    <button 
                                      onClick={() => handleDeleteCampaign(item.id)}
                                      className="p-1 text-slate-500 hover:text-red-400 transition cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

            {/* TAB: Agenda */}
            {activeTab === 'agenda' && (
              <motion.div 
                key="agenda"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-8"
              >
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Agenda Operacional da Corporação</h1>
                  <p className="text-sm text-[#64748B] mt-1">Evite multas e atrasos fiscais. Agenda o pagamento de obrigações e as tarefas importantes de tráfego pago.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Agenda Form */}
                  <div className="bg-[#0D0E16] border border-[#1F293D] rounded-3xl p-6 h-fit shadow-xl shadow-black/30">
                    <h3 className="font-bold text-base text-white mb-5">Adicionar Compromisso / Obrigação</h3>
                    
                    <form onSubmit={handleAddAgenda} className="space-y-4">
                      
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Título da Obrigação</label>
                        <input 
                          type="text"
                          required
                          value={newAgenda.title}
                          onChange={e => setNewAgenda(p => ({ ...p, title: e.target.value }))}
                          className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
                          placeholder="Ex: Assinar contratos fornecedores"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Prioridade</label>
                          <select 
                            value={newAgenda.priority}
                            onChange={e => setNewAgenda(p => ({ ...p, priority: e.target.value as 'baixa' | 'media' | 'alta' }))}
                            className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
                          >
                            <option value="baixa">Baixa</option>
                            <option value="media">Média</option>
                            <option value="alta">Alta (Urgente!)</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">Prazo Limite</label>
                          <input 
                            type="date"
                            required
                            value={newAgenda.date}
                            onChange={e => setNewAgenda(p => ({ ...p, date: e.target.value }))}
                            className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-emerald-500 transition"
                          />
                        </div>
                      </div>

                      <button 
                        type="submit"
                        className="w-full py-2.5 rounded-lg bg-[#11131F] border border-emerald-500/20 text-emerald-400 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-white font-mono font-bold text-xs uppercase transition tracking-wider cursor-pointer"
                      >
                        Agendar tarefa
                      </button>

                    </form>
                  </div>

                  {/* Agenda list rendering */}
                  <div className="bg-[#0D0E16] border border-[#1F293D] rounded-3xl p-6 lg:col-span-2 shadow-xl shadow-black/30">
                    <h3 className="font-bold text-base text-white mb-5">Lista de Compromissos</h3>

                    <div className="space-y-3">
                      {state.agenda.length === 0 ? (
                        <p className="text-center py-10 text-xs text-slate-500 italic">Nenhum compromisso corporativo agendado para o momento.</p>
                      ) : (
                        state.agenda.map(item => (
                          <div key={item.id} className="bg-[#08090E]/60 border border-[#1F293C]/40 p-4 rounded-2xl flex items-center justify-between gap-4 hover:border-emerald-500/20 transition">
                            <div className="flex items-center gap-3">
                              <button 
                                onClick={() => handleToggleTaskStatus(item.id)}
                                className="text-slate-500 hover:text-emerald-400 transition cursor-pointer shrink-0"
                              >
                                {item.status === 'concluido' ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                ) : (
                                  <Circle className="w-5 h-5 text-slate-600" />
                                )}
                              </button>
                              <div>
                                <span className={`text-xs font-medium text-slate-200 block ${item.status === 'concluido' ? 'line-through text-slate-500' : ''}`}>
                                  {item.title}
                                </span>
                                <span className="text-[10px] text-[#A855F7] font-mono uppercase block mt-0.5">Vence em: {item.date}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase ${item.priority === 'alta' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : item.priority === 'media' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-slate-800 text-slate-400'}`}>
                                {item.priority}
                              </span>

                              <button 
                                onClick={() => handleDeleteAgenda(item.id)}
                                className="text-slate-500 hover:text-red-400 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </motion.div>
            )}

            {/* TAB: WhatsApp AI (Chat Zelda) */}
            {activeTab === 'chat' && (
              <motion.div 
                key="chat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto h-[710px] bg-[#0E111A] border border-[#1F293D] rounded-3xl flex overflow-hidden shadow-2xl shadow-black/80"
              >
                {/* Simulated Left Panel Contacts list */}
                <div className="w-80 border-r border-[#1F2943]/60 bg-[#0A0D15] flex flex-col justify-between shrink-0 hidden md:flex">
                  <div>
                    {/* Header Left list search bar */}
                    <div className="p-4 border-b border-[#1F2943]/60 flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-200">Conversas conectadas</span>
                      <span className="bg-emerald-500/10 text-emerald-400 text-[9px] border border-emerald-500/20 font-mono px-2 py-0.5 rounded uppercase font-bold tracking-wider">WA-API</span>
                    </div>

                    <div className="p-3">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                        <input 
                          type="text"
                          disabled
                          placeholder="Pesquisar contatos..."
                          className="w-full bg-[#11131E] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-300 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Contacts rendering */}
                    <div className="mt-2 space-y-0.5">
                      
                      <div className="bg-[#131726]/40 p-3 flex items-start gap-3 border-l-4 border-emerald-500 cursor-pointer">
                        <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                          <Sparkles className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white block">Zelda CFO (IA Autônoma)</span>
                            <span className="text-[10px] text-emerald-400 font-mono font-bold uppercase shrink-0">online</span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate block mt-0.5">O que você quer cadastrar ou alterar hoje?</p>
                        </div>
                      </div>

                      <div className="p-3 flex items-start gap-3 hover:bg-[#11131E]/60 cursor-not-allowed opacity-60">
                        <div className="w-9 h-9 rounded-full bg-purple-500/15 flex items-center justify-center border border-purple-500/20">
                          <span className="text-xs font-bold text-purple-400 uppercase font-sans">GS</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-300 block">Grupo de Sócios (Techify)</span>
                            <span className="text-[10px] text-slate-600 font-mono">11:58</span>
                          </div>
                          <p className="text-[10px] text-slate-500 truncate block mt-0.5">Sócio: Viu o relatório de impostos?</p>
                        </div>
                      </div>

                    </div>
                  </div>
                  
                  {/* Sync banner info */}
                  <div className="p-4 border-t border-[#1F2943]/60 bg-[#10121F]/70 text-[10px] text-slate-500 leading-relaxed font-mono uppercase tracking-wider">
                    © Sincronizador WA-ZELDA v3.5
                  </div>
                </div>

                {/* Simulated Right Panel Conversation view text box */}
                <div className="flex-1 flex flex-col justify-between bg-[#08090F] relative">
                  
                  {/* Active Chat Top Header */}
                  <div className="h-14 border-b border-[#1F2943]/60 bg-[#090B12] px-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center border border-emerald-500/40 shrink-0">
                        <Sparkles className="w-4 h-4 text-emerald-400" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">★ Zelda-OS V3.5 (IA de Alto Nível)</span>
                        <span className="text-[9px] text-[#A855F7] font-mono block">Alteração e cadastro autônomo ativo</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-[#64748B] font-mono font-semibold hidden sm:block">
                      MUTAÇÕES EM TEMPO REAL COMPATÍVEIS
                    </div>
                  </div>

                  {/* Messages container list workspace */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[580px]">
                    
                    {/* Welcome guidelines instructions */}
                    <div className="bg-[#111422] border border-[#1d273d] p-4 rounded-2xl max-w-xl mx-auto space-y-2 text-center text-xs">
                      <span className="font-bold text-emerald-400 text-xs block uppercase tracking-wider">Instruções de Integração de Voz e Tela</span>
                      <p className="text-[#94A3B8] leading-relaxed">
                        Zelda conhece absolutamente <span className="text-white font-bold">tudo o que está renderizado na sua tela</span>. Ela pode criar caixas de fluxo financeiro, modificar nomes de empresa, agendar tarefas e preencher estoques de forma autônoma!
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                        <span className="bg-[#1A1E31]/80 px-2 py-0.5 rounded text-[10px] text-slate-400 font-mono">"Adiciona saída de 300 reais de marketing"</span>
                        <span className="bg-[#1A1E31]/80 px-2 py-0.5 rounded text-[10px] text-slate-400 font-mono">"Muda faturamento alvo para 30 mil"</span>
                      </div>
                    </div>

                    {state.chatMessages.map((msg, idx) => {
                      const isZelda = msg.sender === 'zelda';
                      return (
                        <div key={idx} className={`flex ${isZelda ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed shadow-lg relative ${isZelda ? 'bg-[#101424] text-slate-200 border border-[#1b253b] rounded-tl-none' : 'bg-emerald-500 text-black font-medium rounded-tr-none shadow-emerald-950/20'}`}>
                            
                            {/* Message label */}
                            <span className={`text-[9px] font-mono uppercase block mb-1 font-bold tracking-wider ${isZelda ? 'text-emerald-400' : 'text-emerald-950'}`}>
                              {isZelda ? "Zelda-OS CFO" : "Empresário"}
                            </span>

                            <p className="whitespace-pre-wrap">{msg.text}</p>
                            
                            <span className={`text-[8px] font-mono block text-right mt-2 ${isZelda ? 'text-slate-500' : 'text-emerald-950/60'}`}>
                              {msg.datetime}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {isZeldaLoading && (
                      <div className="flex justify-start">
                        <div className="bg-[#101424] text-[#64748B] border border-[#1F2943]/40 px-4 py-3 rounded-2xl rounded-tl-none text-xs flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                          <span className="font-mono">Zelda-OS está recalculando seus impostos e formulando xingamentos...</span>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Chat Input footer text Box */}
                  <form onSubmit={handleSendChatMessage} className="p-4 border-t border-[#1F2943]/60 bg-[#0A0C16] flex items-center gap-3">
                    <input 
                      type="text"
                      required
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Peça para Zelda cadastrar fluxos, alterar empresa ou criar inventário..."
                      className="flex-1 bg-[#11131E] border border-[#1F2930] rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500 transition duration-200"
                    />
                    <button 
                      type="submit"
                      disabled={isZeldaLoading || !chatInput.trim()}
                      className="px-4 py-3 bg-emerald-500 text-black hover:bg-emerald-400 transition rounded-xl flex items-center justify-center shrink-0 cursor-pointer shadow-lg shadow-emerald-500/10 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>

                </div>
              </motion.div>
            )}

            {/* TAB: Baixar no Celular (Mobile PWA & Offline Simulator) */}
            {activeTab === 'celular' && (
              <motion.div 
                key="celular"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto space-y-8"
              >
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">Aplicativo Móvel Independente (PWA) e Offline</h1>
                  <p className="text-sm text-[#64748B] mt-1">Sua plataforma realmente vira um aplicativo nativo instalado para Celular (iOS e Android) com sincronia silenciosa automática.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  
                  {/* Left Side: Mockup instructions */}
                  <div className="space-y-6">
                    <h3 className="font-bold text-lg text-white">Como instalar no seu celular em 3 cliques:</h3>
                    
                    <div className="space-y-4 font-sans text-xs">
                      
                      <div className="flex gap-4">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 font-mono shrink-0">1</div>
                        <div>
                          <span className="font-bold text-white block">Acesse do navegador do celular</span>
                          <span className="text-slate-400 block mt-1">Abra o Safari (iOS) ou Google Chrome (Android) e navegue para o link da sua plataforma de negócios.</span>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 font-mono shrink-0">2</div>
                        <div>
                          <span className="font-bold text-white block">Adicione à Tela de Início</span>
                          <span className="text-slate-400 block mt-1">Clique no botão "Compartilhar" (iOS) ou "Mais Opções" (Android) e selecione o comando <span className="text-emerald-400 font-bold">"Adicionar à Tela de Início"</span>.</span>
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center font-bold text-emerald-400 font-mono shrink-0">3</div>
                        <div>
                          <span className="font-bold text-white block">Aproveite total velocidade offline</span>
                          <span className="text-slate-400 block mt-1">O painel é instalado instantaneamente do cache nativo ServiceWorker, rodando liso e salvando novas alterações offline sem sinal.</span>
                        </div>
                      </div>

                    </div>

                    <div className="bg-[#11131E] border border-[#1F2943]/60 p-5 rounded-2xl space-y-3">
                      <span className="text-xs font-bold text-white block uppercase tracking-wider font-mono">Painel de Simulador Offline de Sincronia</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Pressione para alternar a rede local. Quando em modo offline, você continuará podendo cadastrar itens e o banco de dados simulado salvará tudo, subindo novos fluxos quando a sincronia retornar.
                      </p>

                      <button 
                        onClick={handleOfflineToggle}
                        className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border cursor-pointer ${state.offlineMode ? 'bg-red-500 text-black border-red-400' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'}`}
                      >
                        {state.offlineMode ? "Simulando Offline (Cortar Conexão)" : "Simular Modo Offline de Teste"}
                      </button>
                    </div>
                  </div>

                  {/* Right Side: Immersive visual smartphone application mockup */}
                  <div className="flex justify-center">
                    <div className="w-[320px] h-[610px] bg-[#0E1016] border-[8px] border-[#334155] rounded-[40px] shadow-2xl relative overflow-hidden flex flex-col justify-between">
                      {/* Top sound notch slot */}
                      <div className="w-32 h-5 bg-[#334155] rounded-b-2xl mx-auto absolute top-0 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-black/40 mr-2" />
                        <div className="w-10 h-1 bg-black/40 rounded-full" />
                      </div>

                      {/* Mockup screen info */}
                      <div className="p-4 pt-8 flex-1 flex flex-col justify-between relative bg-gradient-to-b from-[#0F111A] to-[#0A0B0E]">
                        
                        {/* Upper app info banner */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono text-slate-500">12:00</span>
                            <div className="flex items-center gap-1 text-[10px] font-mono">
                              <span className="text-emerald-400">98%</span>
                              <Wifi className="w-3" />
                            </div>
                          </div>

                          <div className="flex items-center gap-2 bg-[#171B2F]/60 p-2.5 rounded-xl border border-emerald-500/20">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block animate-pulse" />
                            <div className="min-w-0 flex-1">
                              <span className="text-[9px] text-[#A855F7] font-mono font-bold block">INSTALADO</span>
                              <span className="text-xs font-bold text-white truncate block">{state.company.name || "AgencyOS Mobile"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Middle mobile widget indicators */}
                        <div className="space-y-3 py-6">
                          
                          {/* Total liquid balance metric mini-card */}
                          <div className="bg-[#101424] border border-[#1b253b] p-3.5 rounded-xl text-center">
                            <span className="text-[9px] font-mono text-slate-400 block uppercase">Saldo Consolidado</span>
                            <span className="text-lg font-extrabold text-[#F8FAF` + `C] tracking-wide block mt-1">R$ {consolidatedBalance.toLocaleString("pt-BR")}</span>
                          </div>

                          {/* Stock value tracker mock in phone */}
                          <div className="bg-[#101424] border border-[#1b253b] p-3.5 rounded-xl">
                            <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 uppercase">
                              <span>Inventário Estoque</span>
                              <span className="text-purple-400 font-bold">{state.stock.length} itens</span>
                            </div>
                            <span className="text-sm font-bold text-slate-200 mt-1 block">R$ {state.stock.reduce((a,c)=>a+(c.qty*c.price),0).toLocaleString("pt-BR")}</span>
                          </div>

                          {/* Zelda Mobile Quote card */}
                          <div className="bg-[#0B3C2A]/20 border border-emerald-500/20 p-3 rounded-xl flex gap-2">
                            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <p className="text-[10.5px] leading-relaxed text-slate-300 italic font-sans">
                              "Simulando sincronia de cache offline..."
                            </p>
                          </div>

                        </div>

                        {/* Bottom action bar */}
                        <div className="text-center pt-2">
                          <button 
                            disabled
                            className="w-full py-2 rounded-xl bg-emerald-500 text-black text-[10.5px] font-mono font-bold uppercase tracking-wider block"
                          >
                            TELA DE PWA MÓVEL
                          </button>
                        </div>

                      </div>

                      {/* Phone home visual line bar */}
                      <div className="h-4 w-full flex items-center justify-center p-1.5 bg-[#090A0F]/90">
                        <div className="w-24 h-1 bg-[#64748B] rounded-full" />
                      </div>
                    </div>
                  </div>

                </div>

              </motion.div>
            )}

          </AnimatePresence>

        </div>

      </main>

    </div>
  );
}
