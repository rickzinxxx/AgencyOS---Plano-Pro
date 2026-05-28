import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Mail, 
  Send, 
  Sparkles, 
  RefreshCw, 
  UserCheck, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Clock,
  ArrowRight
} from "lucide-react";
import { getAccessToken, getMockWorkspaceData, loginWithGoogle } from "../utils/workspaceAuth";

interface GmailViewProps {
  companyName: string;
  totalIncome: number;
  totalOutcome: number;
  soundEnabled: boolean;
  playPing: () => void;
  playBeep: () => void;
  userEmail: string;
}

export default function GmailView({
  companyName,
  totalIncome,
  totalOutcome,
  soundEnabled,
  playPing,
  playBeep,
  userEmail
}: GmailViewProps) {
  const [token, setToken] = useState<string | null>(getAccessToken());
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Composer states
  const [mailTo, setMailTo] = useState("");
  const [mailSubject, setMailSubject] = useState("");
  const [mailBody, setMailBody] = useState("");
  const [prompt, setPrompt] = useState("");
  const [drafting, setDrafting] = useState(false);
  
  // Real send approval states
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  useEffect(() => {
    setToken(getAccessToken());
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    const activeToken = getAccessToken();
    if (!activeToken) {
      // Use mock fallback
      setEmails(getMockWorkspaceData().emails);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5",
        {
          headers: { Authorization: `Bearer ${activeToken}` }
        }
      );

      if (!response.ok) {
        throw new Error("Erro na API do Gmail");
      }

      const data = await response.json();
      if (data.messages && data.messages.length > 0) {
        const emailDetails = await Promise.all(
          data.messages.map(async (msg: any) => {
            const detailRes = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
              {
                headers: { Authorization: `Bearer ${activeToken}` }
              }
            );
            const detail = await detailRes.json();
            
            const headers = detail.payload.headers;
            const subject = headers.find((h: any) => h.name.toLowerCase() === "subject")?.value || "(Sem Assunto)";
            const from = headers.find((h: any) => h.name.toLowerCase() === "from")?.value || "Remetente Desconhecido";
            const snippet = detail.snippet || "";
            const date = headers.find((h: any) => h.name.toLowerCase() === "date")?.value || "";
            
            return {
              id: msg.id,
              from,
              subject,
              body: snippet,
              date
            };
          })
        );
        setEmails(emailDetails);
      } else {
        setEmails([]);
      }
    } catch (err) {
      console.warn("Falha ao puxar canais reais do Gmail, usando rascunhos simulados de contingência.");
      setEmail0();
    } finally {
      setLoading(false);
    }
  };

  const setEmail0 = () => {
    setEmails(getMockWorkspaceData().emails);
  };

  const handleLogin = async () => {
    try {
      const resp = await loginWithGoogle();
      if (resp) {
        setToken(resp.token);
        fetchEmails();
        playPing();
      }
    } catch (e) {
      alert("Falha de autenticação Google - Certifique-se de preencher as credenciais ou utilize offline.");
    }
  };

  const handleDraftWithAI = async () => {
    if (!prompt.trim()) return;
    setDrafting(true);
    playPing();

    try {
      // Ask our backend API with contextual data
      const response = await fetch("/api/zelda-interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: {
            company: { name: companyName },
            cashFlow: [{ type: "in", value: totalIncome }, { type: "out", value: totalOutcome }]
          },
          message: `Crie um rascunho de e-mail corporativo. O prompt do usuário é: "${prompt}". Escreva no corpo do email com dados financeiros do sistema se apropriado (Faturamento de R$ ${totalIncome}, Despesas de R$ ${totalOutcome}). Retorne no assunto e texto de forma profissional, mantendo o sarcasmo característico de Zelda de forma muito leve e executiva. Retorne em formato JSON estruturado com os campos: { "assunto": "...", "corpo": "..." }`
        })
      });

      const data = await response.json();
      
      // Let's parse Zelda's response, extracting potential JSON
      let generatedSubject = `Informativo Financeiro - ${companyName}`;
      let generatedBody = "";
      
      try {
        const cleanJSON = data.response.substring(
          data.response.indexOf("{"),
          data.response.lastIndexOf("}") + 1
        );
        const parsed = JSON.parse(cleanJSON);
        generatedSubject = parsed.assunto || generatedSubject;
        generatedBody = parsed.corpo || data.response;
      } catch (e) {
        // Fallback to direct text if no JSON
        generatedBody = data.response;
      }

      setMailSubject(generatedSubject);
      setMailBody(generatedBody);
      
    } catch (err) {
      setMailSubject(`Revisão de Finanças - ${companyName}`);
      setMailBody(`Olá,\n\nApós auditar as despesas da ${companyName}, notamos um fluxo operacional com entrada de R$ ${totalIncome} e saída de R$ ${totalOutcome}.\n\nRecomendamos agendar uma chamada urgente de contingência.\n\nAtenciosamente,\nAssessoria Inteligente Zelda-OS`);
    } finally {
      setDrafting(false);
    }
  };

  // Safe mutational draft sending trigger
  const handleOpenConfirmPopup = () => {
    if (!mailTo || !mailSubject || !mailBody) {
      alert("Por favor, preencha o destinatário, assunto e corpo do e-mail.");
      return;
    }
    setShowConfirmPopup(true);
    playPing();
  };

  const handleSendEmailReal = async () => {
    setShowConfirmPopup(false);
    setLoading(true);
    playPing();

    const activeToken = getAccessToken();
    if (!activeToken) {
      // Offline mock send success
      setTimeout(() => {
        setLoading(false);
        setStatusMessage({
          type: "success",
          text: `E-mail enviado com sucesso (MODO SIMULADO) para ${mailTo}`
        });
        setMailTo("");
        setMailSubject("");
        setMailBody("");
        setPrompt("");
        playPing();
      }, 1000);
      return;
    }

    try {
      // Build RFC-822 formatted email message
      const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(mailSubject)))}?=`;
      const emailContent = [
        `To: ${mailTo}`,
        `Subject: ${utf8Subject}`,
        `Content-Type: text/plain; charset="UTF-8"`,
        `MIME-Version: 1.0`,
        ``,
        mailBody
      ].join("\n");

      const base64Safe = btoa(unescape(encodeURIComponent(emailContent)))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

      const response = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${activeToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            raw: base64Safe
          })
        }
      );

      if (!response.ok) {
        throw new Error("Erro de envio via API do Gmail");
      }

      setStatusMessage({
        type: "success",
        text: `E-mail enviado com sucesso de forma oficial via Gmail para ${mailTo}!`
      });
      setMailTo("");
      setMailSubject("");
      setMailBody("");
      setPrompt("");
      fetchEmails();
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: `Erro ao enviar e-mail: ${err.message || err}. Verifique as permissões de envio.`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8" id="workspace-gmail-ai">
      {/* Intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Mail className="w-6 h-6 text-emerald-400" />
            Gmail Workspace AI
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Redija, audite e envie e-mails reais ou simulados para parceiros e clientes usando a inteligência corporativa da Zelda.
          </p>
        </div>

        {/* Auth status indicator */}
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
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
              </svg>
              Conectar Google Email
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
            <span>{statusMessage.text}</span>
          </div>
          <button 
            onClick={() => setStatusMessage(null)}
            className="text-[10px] underline uppercase font-mono tracking-wider ml-auto"
          >
            Fechar
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left pane - Recent Emails */}
        <div className="bg-[#0D0E16] border border-[#1F293D] rounded-3xl p-6 shadow-xl shadow-black/40">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Últimos E-mails
            </h3>
            <button 
              onClick={fetchEmails} 
              disabled={loading}
              className="p-1.5 rounded-lg bg-[#11131F] border border-[#1F2930] text-slate-400 hover:text-white transition duration-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
            </button>
          </div>

          <div className="space-y-3.5">
            {loading ? (
              <div className="text-center py-12 text-xs text-slate-500 font-mono">
                <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                Carregando mensagens da caixa postal...
              </div>
            ) : emails.length === 0 ? (
              <p className="text-center py-12 text-xs text-slate-500 italic">Nenhum e-mail recente encontrado.</p>
            ) : (
              emails.map(mail => (
                <div key={mail.id} className="p-3.5 rounded-2xl bg-[#08090E]/80 border border-[#1F293C]/40 hover:border-emerald-500/20 transition cursor-pointer">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 block truncate">{mail.from}</span>
                  <span className="text-xs font-semibold text-slate-100 block mt-1 truncate">{mail.subject}</span>
                  <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-normal">{mail.body}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right pane - Compose & AI draft creator */}
        <div className="bg-[#0D0E16] border border-[#1F293D] rounded-3xl p-6 lg:col-span-2 shadow-xl shadow-black/40 space-y-6">
          <div className="flex items-center justify-between border-b border-[#1F293D] pb-4">
            <h3 className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Compor E-mail Inteligente com Zelda-OS
            </h3>
            <span className="text-[9px] font-mono text-slate-500">RESGUARDADO PELA CONFIRMAÇÃO DO USUÁRIO</span>
          </div>

          {/* Prompt input */}
          <div className="bg-[#08090E] border border-[#1F2943]/60 rounded-2xl p-4 space-y-3">
            <label className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">
              Instrução para a IA Zelda-OS redigir
            </label>
            <div className="flex gap-2">
              <input 
                type="text"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="Ex prime: 'Cobrar fatura do cliente Marcos de R$ 3500 de SaaS mensal' ou 'Parabenizar sócios pelo MRR'..."
                className="flex-1 bg-[#11131E] border border-[#1F2930] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <button 
                onClick={handleDraftWithAI}
                disabled={drafting || !prompt.trim()}
                className="px-4 py-2 bg-[#1A1E31]/80 border border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-400 transition rounded-xl font-mono text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                {drafting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Redigir
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Para (Destinatário):</label>
                <input 
                  type="email"
                  required
                  value={mailTo}
                  onChange={e => setMailTo(e.target.value)}
                  placeholder="cliente@exemplo.com"
                  className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-3.5 py-2 text-slate-200 text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Assunto:</label>
                <input 
                  type="text"
                  required
                  value={mailSubject}
                  onChange={e => setMailSubject(e.target.value)}
                  placeholder="Digitar assunto do email..."
                  className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-3.5 py-2 text-slate-200 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">Corpo da Mensagem:</label>
              <textarea 
                rows={9}
                value={mailBody}
                onChange={e => setMailBody(e.target.value)}
                placeholder="Olá,\n\nEscreva ou gere com a IA acima o conteúdo corporativo oficial..."
                className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg p-3 text-slate-200 text-xs focus:outline-none font-sans leading-relaxed"
              />
            </div>

            <div className="flex justify-end gap-3.5 pt-2">
              <button 
                onClick={() => {
                  setMailTo("");
                  setMailSubject("");
                  setMailBody("");
                }}
                className="px-4 py-2.5 rounded-xl border border-[#1F293D] hover:bg-[#11131E] hover:text-white text-xs font-mono font-bold uppercase transition"
              >
                Limpar Campos
              </button>
              <button 
                type="button"
                onClick={handleOpenConfirmPopup}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 text-black hover:bg-emerald-400 font-bold font-mono text-xs uppercase transition shadow-lg shadow-emerald-500/10 flex items-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Disparar E-mail
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* COMPLIANT MUTATION CONFIRMATION POPUP */}
      <AnimatePresence>
        {showConfirmPopup && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0D0E16] border border-[#1F293D] max-w-lg w-full rounded-3xl p-6 space-y-5 shadow-2xl"
            >
              <div className="flex items-center gap-3 text-orange-400">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <h3 className="font-bold text-base text-white">Confirmação de Disparo de E-mail</h3>
              </div>
              
              <div className="text-xs text-slate-300 space-y-2 leading-relaxed bg-[#08090E] border border-[#1F2930] p-4 rounded-xl">
                <p><strong>Destinatário:</strong> <span className="text-emerald-400 font-semibold">{mailTo}</span></p>
                <p><strong>Assunto:</strong> <span className="text-slate-100">{mailSubject}</span></p>
                <hr className="border-[#1F293D] my-2" />
                <p className="max-h-40 overflow-y-auto text-slate-400 whitespace-pre-wrap">{mailBody}</p>
              </div>

              <p className="text-[11px] text-slate-400 font-medium">
                Esta ação enviará um e-mail real utilizando a sua conta Google conectada. Deseja prosseguir?
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  onClick={() => setShowConfirmPopup(false)}
                  className="px-4 py-2 rounded-lg border border-[#1F293D] text-slate-400 hover:text-white text-xs font-mono font-semibold uppercase"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSendEmailReal}
                  className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 font-bold font-mono text-xs uppercase text-black"
                >
                  Confirmar e Enviar de Verdade
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
