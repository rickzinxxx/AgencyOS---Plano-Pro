import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Video, 
  Plus, 
  Sparkles, 
  Calendar, 
  RefreshCw, 
  UserCheck, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  MessageSquare
} from "lucide-react";
import { getAccessToken, getMockWorkspaceData, loginWithGoogle } from "../utils/workspaceAuth";

interface GoogleMeetViewProps {
  companyName: string;
  totalIncome: number;
  totalOutcome: number;
  soundEnabled: boolean;
  playPing: () => void;
  playBeep: () => void;
  userEmail: string;
}

export default function GoogleMeetView({
  companyName,
  totalIncome,
  totalOutcome,
  soundEnabled,
  playPing,
  playBeep,
  userEmail
}: GoogleMeetViewProps) {
  const [token, setToken] = useState<string | null>(getAccessToken());
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Meeting form
  const [meetTitle, setMeetTitle] = useState("");
  const [meetDate, setMeetDate] = useState(new Date().toISOString().split("T")[0]);
  const [meetTime, setMeetTime] = useState("14:00");
  const [meetDuration, setMeetDuration] = useState("30");
  const [meetAgenda, setMeetAgenda] = useState("");
  
  // AI states
  const [isDraftingPauta, setIsDraftingPauta] = useState(false);
  const [pautaPrompt, setPautaPrompt] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  useEffect(() => {
    setToken(getAccessToken());
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    // Falls back to mock or retrieves actual calendar events that have meet links
    const activeToken = getAccessToken();
    if (!activeToken) {
      setMeetings(getMockWorkspaceData().meetings);
      return;
    }

    setLoading(true);
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startOfDay.toISOString()}&maxResults=10&singleEvents=true`,
        {
          headers: { Authorization: `Bearer ${activeToken}` }
        }
      );

      if (!response.ok) throw new Error();

      const data = await response.json();
      if (data.items) {
        const mapped = data.items.map((srvMsg: any) => {
          const start = srvMsg.start?.dateTime || srvMsg.start?.date || "";
          const dateStr = start ? start.split("T")[0] : "";
          const timeStr = start && start.includes("T") ? start.split("T")[1].substring(0, 5) : "Dia todo";
          const meetLink = srvMsg.hangoutLink || srvMsg.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === "video")?.uri || "";

          return {
            id: srvMsg.id,
            title: srvMsg.summary || "Sem título",
            date: dateStr,
            time: timeStr,
            duration: "N/A",
            meetLink,
            agenda: srvMsg.description || "Nenhuma pauta cadastrada."
          };
        });
        
        // Filter out those with meet links or show everything
        setMeetings(mapped);
      } else {
        setMeetings([]);
      }
    } catch (err) {
      setMeetings(getMockWorkspaceData().meetings);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const resp = await loginWithGoogle();
      if (resp) {
        setToken(resp.token);
        fetchMeetings();
        playPing();
      }
    } catch (e) {
      alert("Falha de autenticação Google - tente novamente.");
    }
  };

  // AI draft assistant
  const handleDraftPauta = async () => {
    if (!meetTitle.trim()) {
      alert("Por favor, preencha primeiro o 'Título da Reunião' para obtermos contexto.");
      return;
    }
    
    setIsDraftingPauta(true);
    playPing();
    
    try {
      const response = await fetch("/api/zelda-interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: {
            company: { name: companyName },
            cashFlow: [{ type: "in", value: totalIncome }, { type: "out", value: totalOutcome }]
          },
          message: `Estou marcando uma reunião corporativa chamada "${meetTitle}". Crie pontos de discussão (Pauta corporativa estruturada) baseando-se nas finanças da empresa (Faturamento de R$ ${totalIncome}, Despesas de R$ ${totalOutcome}). Seja ácida, muito assertiva, com termos técnicos modernos. Retorne apenas a pauta direta estruturada e dividida por tópicos curtos.`
        })
      });

      const data = await response.json();
      setMeetAgenda(data.response);
    } catch (err) {
      setMeetAgenda(`1. Alinhamento de Metas Estratégicas para ${companyName}\n2. Ponto crítico: contenção de queima de caixa de R$ ${totalOutcome}\n3. Planejamento de marketing e tráfego pago para alavancar MRR.`);
    } finally {
      setIsDraftingPauta(false);
    }
  };

  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetTitle) return;

    setLoading(true);
    playPing();

    const activeToken = getAccessToken();
    if (!activeToken) {
      // Simulate scheduling offline
      const mockNew = {
        id: `meet-${Date.now()}`,
        title: meetTitle,
        date: meetDate,
        time: meetTime,
        duration: `${meetDuration} min`,
        meetLink: "https://meet.google.com/ais-zelda-v35",
        agenda: meetAgenda || "Pauta simulada pela Zelda-OS."
      };
      
      setTimeout(() => {
        setMeetings(prev => [mockNew, ...prev]);
        setLoading(false);
        setStatusMessage({
          type: "success",
          text: `Vídeo Reunião "${meetTitle}" agendada! Link gerado: https://meet.google.com/ais-zelda-v35 (MODO SIMULADO)`
        });
        
        // reset form
        setMeetTitle("");
        setMeetAgenda("");
      }, 1200);
      return;
    }

    try {
      // Build start and end dates ISO
      const startDateTimeStr = `${meetDate}T${meetTime}:00`;
      const startDate = new Date(startDateTimeStr);
      const endDate = new Date(startDate.getTime() + Number(meetDuration) * 60000);

      const requestBody = {
        summary: meetTitle,
        description: meetAgenda,
        start: { dateTime: startDate.toISOString(), timeZone: "America/Sao_Paulo" },
        end: { dateTime: endDate.toISOString(), timeZone: "America/Sao_Paulo" },
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: { type: "hangoutsMeet" }
          }
        }
      };

      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${activeToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) throw new Error("Erro ao criar evento na Google Agenda");

      const created = await response.json();
      const generatedLink = created.hangoutLink || "Sem link gerado";

      setStatusMessage({
        type: "success",
        text: `Sala de Vídeo do Google Meet criada com sucesso! ID: ${created.summary}, Link: ${generatedLink}`
      });

      // Reset form & reload
      setMeetTitle("");
      setMeetAgenda("");
      fetchMeetings();
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: `Erro ao criar Meet: ${err.message || err}. Verifique permissões do calendário.`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8" id="workspace-meet-ai">
      {/* Intro header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Video className="w-6 h-6 text-emerald-400" />
            Google Meet AI
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Agende salas de videoconferência reais no Google Meet e gere pautas estratégicas estruturadas com IA.
          </p>
        </div>

        {/* Authenticate details indicator */}
        <div className="flex items-center gap-3">
          {token ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-[10px] text-slate-400 font-mono uppercase block">Conectado com Google</span>
                <span className="text-xs font-bold text-slate-200 block">{userEmail || "Logado"}</span>
              </div>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              className="px-4 py-2.5 bg-white text-black hover:bg-slate-200 font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition duration-200 flex items-center gap-2 cursor-pointer shadow-lg shadow-white/5"
            >
              <Video className="w-4 h-4 text-red-500" />
              Conectar Google Meet & Agenda
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 rounded-2xl flex items-center justify-between border ${statusMessage.type === "success" ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400" : "bg-red-500/10 border-red-500/25 text-red-400"}`}
        >
          <div className="flex items-center gap-3 text-xs font-semibold">
            {statusMessage.type === "success" ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span className="break-all">{statusMessage.text}</span>
          </div>
          <button 
            onClick={() => setStatusMessage(null)}
            className="text-[10px] underline uppercase font-mono tracking-wider ml-auto cursor-pointer"
          >
            Fechar
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Meet scheduler Form panel */}
        <div className="bg-[#0D0E16] border border-[#1F293D] rounded-3xl p-6 shadow-xl shadow-black/40">
          <h3 className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-2 mb-5">
            <Plus className="w-4 h-4 text-emerald-400" />
            Marcar Sala de Vídeo
          </h3>

          <form onSubmit={handleScheduleMeeting} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Título da Reunião</label>
              <input 
                type="text"
                required
                value={meetTitle}
                onChange={e => setMeetTitle(e.target.value)}
                placeholder="Ex Product: 'Auditoria de Custos SaaS'"
                className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-3.5 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Data</label>
                <input 
                  type="date"
                  required
                  value={meetDate}
                  onChange={e => setMeetDate(e.target.value)}
                  className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Hora</label>
                <input 
                  type="time"
                  required
                  value={meetTime}
                  onChange={e => setMeetTime(e.target.value)}
                  className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Duração Estimada</label>
              <select 
                value={meetDuration}
                onChange={e => setMeetDuration(e.target.value)}
                className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-2.5 py-2 text-slate-200 text-xs focus:outline-none"
              >
                <option value="15">15 minutos (Quick Review)</option>
                <option value="30">30 minutos (Alinhamento)</option>
                <option value="45">45 minutos (Conselho)</option>
                <option value="60">1 hora (Brainstorming)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Pauta / Detalhes</label>
                <button 
                  type="button"
                  onClick={handleDraftPauta}
                  disabled={isDraftingPauta}
                  className="text-[9px] font-mono text-emerald-400 hover:underline uppercase flex items-center gap-1 cursor-pointer disabled:opacity-45"
                >
                  <Sparkles className="w-3 h-3" />
                  Rascunhar com IA
                </button>
              </div>
              <textarea 
                rows={5}
                value={meetAgenda}
                onChange={e => setMeetAgenda(e.target.value)}
                placeholder="Insira detalhes ou gere a pauta utilizando o botão acima..."
                className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg p-3 text-slate-200 text-xs focus:outline-none font-sans leading-relaxed"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 transition text-black font-bold font-mono text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              Criar Reunião no Meet
            </button>
          </form>
        </div>

        {/* Right list pane - Scheduled meetings */}
        <div className="bg-[#0D0E16] border border-[#1F293D] rounded-3xl p-6 lg:col-span-2 shadow-xl shadow-black/40">
          <div className="flex items-center justify-between mb-5 pb-1 border-b border-[#1F293D]">
            <h3 className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-2">
              <Video className="w-4 h-4 text-emerald-400" />
              Sua Grade de Reuniões Sincronizada
            </h3>
            <button 
              onClick={fetchMeetings}
              className="p-1 rounded-lg bg-[#11131F] border border-[#1F2930] hover:text-white text-slate-400"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-4">
            {meetings.length === 0 ? (
              <p className="text-center py-16 text-xs text-slate-500 italic">Nenhum compromisso por videoconferência agendado.</p>
            ) : (
              meetings.map(meet => (
                <div key={meet.id} className="p-4 bg-[#08090E]/60 border border-[#1F293C]/40 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-white block">{meet.title}</span>
                    <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] text-[#A855F7] tracking-wider uppercase">
                      <span>Prazo: {meet.date}</span>
                      <span>•</span>
                      <span>Hora: {meet.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 whitespace-pre-wrap pt-1 leading-relaxed border-t border-[#1F293D]/10 mt-1">{meet.agenda}</p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    {meet.meetLink ? (
                      <a 
                        href={meet.meetLink} 
                        target="_blank" 
                        rel="noreferrer" 
                        onClick={() => playPing()}
                        className="px-4 py-2 rounded-xl bg-orange-500 text-black hover:bg-orange-400 transition font-mono font-bold text-[10px] uppercase flex items-center gap-1.5 cursor-pointer shadow-lg shadow-orange-500/10"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Entrar no Meet
                      </a>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-600 uppercase border border-slate-800 rounded px-2 py-1">Sem link ativo</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
