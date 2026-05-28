import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Users, 
  Search, 
  Sparkles, 
  RefreshCw, 
  UserPlus, 
  UserCheck, 
  CheckCircle, 
  AlertCircle,
  Building,
  Mail,
  Phone
} from "lucide-react";
import { getAccessToken, getMockWorkspaceData, loginWithGoogle } from "../utils/workspaceAuth";

interface ContactsViewProps {
  soundEnabled: boolean;
  playPing: () => void;
  playBeep: () => void;
  userEmail: string;
}

export default function ContactsView({
  soundEnabled,
  playPing,
  playBeep,
  userEmail
}: ContactsViewProps) {
  const [token, setToken] = useState<string | null>(getAccessToken());
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // AI extraction state
  const [rawText, setRawText] = useState("");
  const [parsing, setParsing] = useState(false);
  
  // Contact form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactCompany, setContactCompany] = useState("");
  
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  useEffect(() => {
    setToken(getAccessToken());
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    const activeToken = getAccessToken();
    if (!activeToken) {
      setContacts(getMockWorkspaceData().contacts);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        "https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,organizations",
        {
          headers: { Authorization: `Bearer ${activeToken}` }
        }
      );

      if (!response.ok) throw new Error();

      const data = await response.json();
      if (data.connections) {
        const mapped = data.connections.map((c: any) => {
          const name = c.names?.[0]?.displayName || "Sem Nome";
          const email = c.emailAddresses?.[0]?.value || "";
          const phone = c.phoneNumbers?.[0]?.value || "";
          const company = c.organizations?.[0]?.name || "";

          return {
            id: c.resourceName,
            name,
            email,
            phone,
            company
          };
        });
        setContacts(mapped);
      } else {
        setContacts([]);
      }
    } catch (err) {
      setContacts(getMockWorkspaceData().contacts);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const resp = await loginWithGoogle();
      if (resp) {
        setToken(resp.token);
        fetchContacts();
        playPing();
      }
    } catch (e) {
      alert("Falha de autenticação Google - tente novamente.");
    }
  };

  const handleAIContactExtract = async () => {
    if (!rawText.trim()) return;
    setParsing(true);
    playPing();

    try {
      const response = await fetch("/api/zelda-interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: {},
          message: `Você é um robô de dados. Extraia as informações de contato desse texto bruto: "${rawText}". Identifique o nome da pessoa física, email pessoal/comercial, celular/telefone no formato BR com DDD, e nome da empresa envolvida. Retorne estritamente um JSON com a estrutura do exemplo abaixo, não fale mais nada:\n{ "name": "...", "email": "...", "phone": "...", "company": "..." }`
        })
      });

      const data = await response.json();
      
      try {
        const cleanJSON = data.response.substring(
          data.response.indexOf("{"),
          data.response.lastIndexOf("}") + 1
        );
        const parsed = JSON.parse(cleanJSON);
        if (parsed.name) setContactName(parsed.name);
        if (parsed.email) setContactEmail(parsed.email);
        if (parsed.phone) setContactPhone(parsed.phone);
        if (parsed.company) setContactCompany(parsed.company);
        
        setStatusMessage({
          type: "success",
          text: "Inteligência Zelda-OS extraiu com sucesso as informações do deparamento!"
        });
      } catch (e) {
        throw new Error("Resposta indisponível");
      }
    } catch (err) {
      setStatusMessage({
        type: "error",
        text: "Não foi possível extrair dados estruturados desse texto. Tente preencher manualmente."
      });
    } finally {
      setParsing(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName) return;

    setLoading(true);
    playPing();

    const activeToken = getAccessToken();
    if (!activeToken) {
      // Offline simulation addition
      const mockNew = {
        id: `contact-${Date.now()}`,
        name: contactName,
        email: contactEmail || "sem@email.com",
        phone: contactPhone || "(11) 90000-0000",
        company: contactCompany || "Nenhum"
      };

      setTimeout(() => {
        setContacts(prev => [mockNew, ...prev]);
        setLoading(false);
        setStatusMessage({
          type: "success",
          text: `Contato "${contactName}" adicionado e sincronizado com sucesso! (MODO SIMULADO)`
        });
        
        // Reset form
        setContactName("");
        setContactEmail("");
        setContactPhone("");
        setContactCompany("");
        setRawText("");
      }, 1000);
      return;
    }

    try {
      const requestBody = {
        names: [{ givenName: contactName }],
        emailAddresses: contactEmail ? [{ value: contactEmail }] : [],
        phoneNumbers: contactPhone ? [{ value: contactPhone }] : [],
        organizations: contactCompany ? [{ name: contactCompany, title: "Lead" }] : []
      };

      const response = await fetch(
        "https://people.googleapis.com/v1/people:createContact",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${activeToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) throw new Error("Erro de requisição People API");

      setStatusMessage({
        type: "success",
        text: `Contato "${contactName}" cadastrado oficialmente na sua conta Google Contacts!`
      });

      setContactName("");
      setContactEmail("");
      setContactPhone("");
      setContactCompany("");
      setRawText("");
      fetchContacts();
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: `Falha ao sincronizar contato na nuvem: ${err.message || err}`
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8" id="workspace-contacts-ai">
      {/* View Intro */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-400" />
            Agenda Google Contacts AI
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            Sincronize contatos da empresa com canais do Google Contacts e utilize IA para extrair informações de blocos brutos de WhatsApp ou chats.
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
              <Users className="w-4 h-4 text-blue-500" />
              Sincronizar Contacts Google
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
            className="text-[10px] underline uppercase font-mono tracking-wider ml-auto cursor-pointer"
          >
            Fechar
          </button>
        </motion.div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Step 1: Extract block of dialog with AI */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0D0E16] border border-[#1F293D] rounded-3xl p-6 shadow-xl shadow-black/40 space-y-4">
            <h3 className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Extrator Inteligente (Zelda)
            </h3>
            <p className="text-[11px] text-slate-400 leading-normal">
              Cole conversa de chat, assinatura de e-mail ou dados soltos abaixo. A Zelda-OS irá extrair e carregar o formulário lateral instantaneamente.
            </p>

            <textarea 
              rows={4}
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder="Ex: 'Oi Marcos, meu nome é Júlia Costa da consultoria Costa Advogados, me liga no 11988887777 ou marcelo@costa.com...'"
              className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg p-3 text-slate-300 text-xs focus:outline-none"
            />

            <button 
              type="button"
              onClick={handleAIContactExtract}
              disabled={parsing || !rawText.trim()}
              className="w-full py-2 rounded-lg bg-[#11131E] border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 hover:text-white font-mono font-bold text-[10px] uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-2"
            >
              {parsing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Varrer texto com IA
            </button>
          </div>

          {/* Form and submission */}
          <div className="bg-[#0D0E16] border border-[#1F293D] rounded-3xl p-6 shadow-xl shadow-black/40">
            <h3 className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-2 mb-5">
              <UserPlus className="w-4 h-4 text-emerald-400" />
              Ficha do Contato
            </h3>

            <form onSubmit={handleAddContact} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Nome Completo</label>
                <input 
                  type="text"
                  required
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  placeholder="Carlos Souza"
                  className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block">E-mail</label>
                <input 
                  type="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder="carlos@empresa.com"
                  className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Celular / WhatsApp</label>
                <input 
                  type="text"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono uppercase text-slate-400 font-bold block">Corporação / Cliente</label>
                <input 
                  type="text"
                  value={contactCompany}
                  onChange={e => setContactCompany(e.target.value)}
                  placeholder="Costa Soft S/A"
                  className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-3 py-1.5 text-slate-100 text-xs focus:outline-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400 transition font-mono font-bold text-xs uppercase"
              >
                Cadastrar Contato
              </button>
            </form>
          </div>
        </div>

        {/* Contacts search and list grid */}
        <div className="bg-[#0D0E16] border border-[#1F293D] rounded-3xl p-6 lg:col-span-2 shadow-xl shadow-black/40 flex flex-col justify-between">
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-2 border-b border-[#1F293D]">
              <h3 className="font-bold text-white text-sm uppercase tracking-wide flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Clientes e Contatos Registrados ({filteredContacts.length})
              </h3>

              <div className="relative md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2" />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar contatos..."
                  className="w-full bg-[#08090E] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredContacts.length === 0 ? (
                <div className="md:col-span-2 text-center py-20 text-xs text-slate-500 italic">
                  Nenhum registro encontrado para termos correspondentes.
                </div>
              ) : (
                filteredContacts.map(c => (
                  <div key={c.id} className="p-4 bg-[#08090E]/60 border border-[#1F293C]/40 rounded-2xl space-y-2 hover:border-emerald-500/10 transition">
                    <span className="text-sm font-bold text-slate-200 block border-b border-[#1F293C]/10 pb-1.5">{c.name}</span>
                    
                    <div className="space-y-1 font-mono text-[10px] text-slate-400">
                      {c.company && (
                        <div className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{c.company}</span>
                        </div>
                      )}
                      
                      {c.email && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{c.email}</span>
                        </div>
                      )}

                      {c.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{c.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-[#1F293D] pt-4 flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase">
            <span>Sincronia: People API V1</span>
            <button onClick={fetchContacts} className="hover:text-emerald-400 transition cursor-pointer">
              Recarregar Listagem
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
