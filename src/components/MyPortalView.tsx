import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Globe, 
  Copy, 
  ExternalLink, 
  Check, 
  Eye, 
  Settings, 
  RefreshCw, 
  Mail, 
  Calendar, 
  Building, 
  Package, 
  ChevronRight, 
  Sparkles, 
  Laptop, 
  Smartphone 
} from "lucide-react";
import { StockItem } from "../types";

interface MyPortalViewProps {
  companyName: string;
  companySector: string;
  companyCnpj: string;
  companyDescription: string;
  userEmail: string;
  stockItems: StockItem[];
  onUpdateCompany: (updatedCompany: any) => void;
  playPing: () => void;
  playBeep: () => void;
}

export default function MyPortalView({
  companyName,
  companySector,
  companyCnpj,
  companyDescription,
  userEmail,
  stockItems,
  onUpdateCompany,
  playPing,
  playBeep
}: MyPortalViewProps) {
  const emailPrefix = userEmail ? userEmail.split("@")[0] : "usuario";
  const customSubdomain = `${emailPrefix}.agencyos.app`;

  // Customization State
  const [subdomainPrefix, setSubdomainPrefix] = useState(emailPrefix);
  const [siteTitle, setSiteTitle] = useState(companyName);
  const [siteDescription, setSiteDescription] = useState(companyDescription);
  const [siteTheme, setSiteTheme] = useState<"emerald" | "blue" | "purple" | "orange" | "rose">("emerald");
  const [showStock, setShowStock] = useState(true);
  const [showMeetLink, setShowMeetLink] = useState(true);
  const [showContactForm, setShowContactForm] = useState(true);

  // Status/Interactive States
  const [copied, setCopied] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"laptop" | "mobile">("laptop");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Public site simulator submissions
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientMessage, setClientMessage] = useState("");
  const [submittingContact, setSubmittingContact] = useState(false);

  // Sync title changes
  useEffect(() => {
    setSiteTitle(companyName);
    setSiteDescription(companyDescription);
  }, [companyName, companyDescription]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${subdomainPrefix}.agencyos.app`);
    setCopied(true);
    playPing();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = () => {
    onUpdateCompany({
      name: siteTitle,
      description: siteDescription,
      sector: companySector,
      cnpj: companyCnpj
    });
    setSuccessMsg("Configurações do seu site individual salvas com sucesso!");
    playBeep();
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  const handleSimulateContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientEmail || !clientMessage) return;

    setSubmittingContact(true);
    playPing();

    setTimeout(() => {
      setSubmittingContact(false);
      setSuccessMsg(`✓ Mensagem enviada por ${clientName}! Um alerta foi enviado para a Zelda-OS e o lead foi catalogado de forma isolada.`);
      playBeep();
      setClientName("");
      setClientEmail("");
      setClientMessage("");
      setTimeout(() => setSuccessMsg(""), 5000);
    }, 1500);
  };

  // Theme styling definitions
  const themeColors = {
    emerald: {
      primary: "bg-emerald-500",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      bgLight: "bg-emerald-500/10",
      hover: "hover:bg-emerald-400"
    },
    blue: {
      primary: "bg-blue-500",
      text: "text-blue-400",
      border: "border-blue-500/30",
      bgLight: "bg-blue-500/10",
      hover: "hover:bg-blue-400"
    },
    purple: {
      primary: "bg-purple-500",
      text: "text-purple-400",
      border: "border-purple-500/30",
      bgLight: "bg-purple-500/10",
      hover: "hover:bg-purple-400"
    },
    orange: {
      primary: "bg-orange-500",
      text: "text-orange-400",
      border: "border-orange-500/30",
      bgLight: "bg-orange-500/10",
      hover: "hover:bg-orange-400"
    },
    rose: {
      primary: "bg-rose-500",
      text: "text-rose-400",
      border: "border-rose-500/30",
      bgLight: "bg-rose-500/10",
      hover: "hover:bg-rose-400"
    }
  };

  const activeTheme = themeColors[siteTheme];

  return (
    <div className="space-y-8" id="my-portal-workspace-site">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-mono font-bold uppercase py-0.5 px-2 rounded-md">
              Hospedagem Exclusiva Ativa
            </span>
            <span className="text-slate-500 font-mono text-xs">•</span>
            <span className="text-slate-400 font-mono text-[11px] uppercase">
              Sandbox isolado
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5 mt-1">
            <Globe className="w-6 h-6 text-emerald-400" />
            Seu Site e Subdomínio Individual
          </h1>
          <p className="text-sm text-[#64748B] mt-1 leading-relaxed">
            Cada e-mail conectado possui uma instância de site inteiramente isolada, customizável e vinculada com seus canais do Google.
          </p>
        </div>

        {/* Live Website Info Banner */}
        <div className="bg-[#0D0E16] border border-[#1F293D] rounded-2xl p-3 px-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-center">
            <Globe className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">Domínio Ativo</span>
            <span className="text-xs font-mono font-medium text-slate-100 block">
              {subdomainPrefix}.agencyos.app
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Success Alert */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium flex items-center justify-between shadow-lg"
          >
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg("")} className="text-[10px] uppercase font-bold underline ml-4 hover:text-white cursor-pointer select-none">
              OK
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid: Customizer Left & Real site preview browser simulator Right */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: CUSTOMIZER SETTINGS (5 cols) */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-[#0D0E16] border border-[#1F293D] rounded-3xl p-6 shadow-xl shadow-black/40 space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-[#1F293D]">
              <Settings className="w-4 h-4 text-slate-400" />
              <h3 className="font-bold text-white text-sm uppercase tracking-wide">
                Personalização do Site
              </h3>
            </div>

            {/* Custom subdomain input */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Prefixo do Subdomínio
              </label>
              <div className="flex items-center">
                <input 
                  type="text"
                  value={subdomainPrefix}
                  onChange={(e) => setSubdomainPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  className="bg-[#08090E] border border-[#1F293C] rounded-l-lg px-3 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 flex-1 font-mono"
                  placeholder="seu-subdominio"
                />
                <span className="bg-[#141622] border-y border-r border-[#1F293C] rounded-r-lg px-3 py-2 text-slate-400 text-xs font-mono select-none">
                  .agencyos.app
                </span>
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                Modifique o prefixo para simular ou vincular o site do seu negócio exclusivo.
              </p>
            </div>

            {/* Title override */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Nome da Marca do Portal
              </label>
              <input 
                type="text"
                value={siteTitle}
                onChange={(e) => setSiteTitle(e.target.value)}
                className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg px-3.5 py-2 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-sans"
                placeholder="Ex: Minha Empresa B2B"
              />
            </div>

            {/* Description override */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Descrição de Boas-Vindas
              </label>
              <textarea 
                rows={3}
                value={siteDescription}
                onChange={(e) => setSiteDescription(e.target.value)}
                className="w-full bg-[#08090E] border border-[#1F293C] rounded-lg p-3 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
                placeholder="Contamos com os melhores produtos para a sua jornada corporativa..."
              />
            </div>

            {/* Visual themes picker */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Paleta de Cores do Site
              </label>
              <div className="grid grid-cols-5 gap-2">
                {(["emerald", "blue", "purple", "orange", "rose"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setSiteTheme(t); playPing(); }}
                    className={`py-2 rounded-xl text-[10px] font-bold font-mono uppercase border transition cursor-pointer flex flex-col items-center gap-1.5 ${siteTheme === t ? 'bg-[#151926] text-white border-emerald-500/50' : 'bg-[#08090E] border-[#1F293D] text-slate-400 hover:border-slate-700'}`}
                  >
                    <div className={`w-3.5 h-3.5 rounded-full ${themeColors[t].primary}`} />
                    <span>{t}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content Toggles */}
            <div className="space-y-3.5 pt-2 border-t border-[#1F293D]/60">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                Módulos Visíveis no Portal do Cliente
              </span>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#08090E] border border-[#1F293D]/40">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Estoque Público</span>
                  <span className="text-[10px] text-slate-500 leading-normal block">Expõe itens cadastrados para venda direta</span>
                </div>
                <input 
                  type="checkbox"
                  checked={showStock}
                  onChange={(e) => { setShowStock(e.target.checked); playPing(); }}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#08090E] border border-[#1F293D]/40">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Canal Google Meet</span>
                  <span className="text-[10px] text-slate-500 leading-normal block">Permite aos visitantes agendar reuniões com você</span>
                </div>
                <input 
                  type="checkbox"
                  checked={showMeetLink}
                  onChange={(e) => { setShowMeetLink(e.target.checked); playPing(); }}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#08090E] border border-[#1F293D]/40">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Formulário de Contato</span>
                  <span className="text-[10px] text-slate-500 leading-normal block">Gera leads instantâneos no seu e-mail</span>
                </div>
                <input 
                  type="checkbox"
                  checked={showContactForm}
                  onChange={(e) => { setShowContactForm(e.target.checked); playPing(); }}
                  className="w-4 h-4 accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 py-2.5 rounded-xl border border-[#1F293D] hover:bg-[#11131E] hover:text-white transition font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? "Copiado!" : "Copiar URL"}</span>
              </button>

              <button
                onClick={handleSaveSettings}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-black hover:bg-emerald-400 transition font-mono font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/15"
              >
                <span>Salvar Configuração</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: INTERACTIVE APP PREVIEW SIMULATOR (7 cols) */}
        <div className="xl:col-span-7 space-y-4">
          
          {/* Browser simulator header controls */}
          <div className="flex items-center justify-between bg-[#08090E] border border-[#1F293D] rounded-2xl p-3 px-4 shadow-md">
            
            {/* Mock browser dots */}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-blue-500/80" />
              <span className="text-[11px] font-mono text-slate-500 uppercase tracking-widest pl-2">SIMULADOR DO PORTAL DE CLIENTES</span>
            </div>

            {/* Device switches */}
            <div className="flex items-center gap-1 bg-[#10121C] p-1 rounded-lg border border-[#1F293D]/60">
              <button
                onClick={() => { setPreviewDevice("laptop"); playPing(); }}
                className={`p-1.5 rounded-md transition cursor-pointer ${previewDevice === "laptop" ? "bg-slate-800 text-emerald-400" : "text-slate-500 hover:text-white"}`}
                title="Visualização Desktop/Laptop"
              >
                <Laptop className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setPreviewDevice("mobile"); playPing(); }}
                className={`p-1.5 rounded-md transition cursor-pointer ${previewDevice === "mobile" ? "bg-slate-800 text-emerald-400" : "text-slate-500 hover:text-white"}`}
                title="Visualização Dispositivo Móvel"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SIMULATED WEB BROWSER CANVAS VIEW */}
          <div className="transition-all duration-300 mx-auto flex justify-center w-full">
            <div 
              className={`bg-[#0A0B10] border border-[#21283B] rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 w-full flex flex-col ${previewDevice === "mobile" ? "max-w-[390px] h-[670px] border-8 border-slate-800" : "max-w-full min-h-[620px]"}`}
            >
              {/* Virtual Browser Address Bar */}
              <div className="bg-[#11131E] border-b border-[#1F293D] p-3 px-4 flex items-center gap-3">
                <div className="flex gap-1.5 shrink-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                </div>
                
                {/* Simulated URL input */}
                <div className="flex-1 bg-[#08090D] border border-[#1F293D] rounded-lg px-3 py-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="text-emerald-500">https://</span>
                    <span className="text-slate-200 font-bold">{subdomainPrefix}.agencyos.app</span>
                  </span>
                  
                  <span className="text-[9px] text-[#A855F7] bg-purple-500/10 px-1.5 rounded font-black select-none uppercase tracking-wider">
                    Sincronizado
                  </span>
                </div>

                <div className="p-1 rounded bg-[#08090D]">
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500 hover:text-emerald-400 cursor-pointer" />
                </div>
              </div>

              {/* VIRTUAL HOME PAGE CONTENT (Responsive scroll area) */}
              <div className="flex-1 overflow-y-auto p-6 font-sans space-y-8 bg-[#040509]">
                
                {/* Public Header/Navbar */}
                <header className="flex justify-between items-center border-b border-white/5 pb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-lg ${activeTheme.primary} flex items-center justify-center text-black font-extrabold text-xs`}>
                      ★
                    </div>
                    <span className="font-bold text-sm text-white">{siteTitle}</span>
                  </div>
                  
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest leading-none">
                    {companySector || "Tecnologia"}
                  </span>
                </header>

                {/* Hero section */}
                <section className="text-center py-6 space-y-3.5">
                  <h2 className="text-xl md:text-2xl font-black text-white tracking-tight leading-tight">
                    Catálogo Corporativo Oficial
                  </h2>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    {siteDescription || "Estamos felizes em receber a sua visita. Através dessa URL exclusiva, você pode explorar de forma instantânea nossos inventários de entrega, interações de reuniões e contatar nossa gerência."}
                  </p>
                  
                  <div className="flex justify-center pt-2">
                    <div className={`h-1 w-16 rounded-full ${activeTheme.primary}`} />
                  </div>
                </section>

                {/* MODULE: Real Stock visualizer inside customized subsite */}
                {showStock && (
                  <section className="space-y-3.5">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                      <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
                        <Package className={`w-3.5 h-3.5 ${activeTheme.text}`} />
                        <span>Produtos Disponíveis a Pronta Entrega</span>
                      </h4>
                      <span className="text-[9px] font-mono text-slate-500 uppercase">{stockItems.length} Itens</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {stockItems.map((item) => (
                        <div key={item.id} className="bg-[#0D0E16]/90 border border-[#1F293C]/40 hover:border-emerald-500/10 p-3 rounded-2xl flex flex-col justify-between hover:scale-[1.01] transition-transform duration-200">
                          <div>
                            <span className="text-xs font-bold text-slate-100 block">{item.name}</span>
                            <span className="text-[9px] font-mono text-emerald-400 block mt-1">Estoque: {item.qty} un • Preço Bruto</span>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3 border-t border-slate-800/60 pt-2">
                            <span className="text-sm font-black text-slate-100">R$ {item.price.toLocaleString("pt-BR")}</span>
                            <button
                              onClick={() => {
                                playPing();
                                setClientMessage(`Gostaria de solicitar um orçamento para o produto: "${item.name}" (quantidade sugerida: 5 unidades).`);
                                document.getElementById("client-contact-form-section")?.scrollIntoView({ behavior: 'smooth' });
                              }}
                              className={`px-3 py-1 rounded-lg text-[9px] font-mono font-bold uppercase transition bg-slate-900 border text-white ${activeTheme.hover}`}
                            >
                              Orçar Item
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* MODULE: Meet/Calendar alignment booking */}
                {showMeetLink && (
                  <section className={`p-4 rounded-3xl ${activeTheme.bgLight} border ${activeTheme.border} space-y-2 text-center`}>
                    <Calendar className={`w-5 h-5 mx-auto ${activeTheme.text}`} />
                    <span className="text-xs font-bold text-slate-100 block">Agende uma Videoconferência com a Diretoria</span>
                    <p className="text-[10px] text-slate-400 leading-normal max-w-sm mx-auto">
                      Precisa fechar contrato ou falar de contas SaaS? Sincronize com a nossa agenda integrada do Google Workspace.
                    </p>
                    
                    <button 
                      onClick={() => {
                        playPing();
                        alert("Ao clicar no site real, o cliente seria redirecionado para a grade de agendamento ligada ao Google Meet.");
                      }}
                      className={`mx-auto mt-2.5 px-4 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase text-black ${activeTheme.primary} ${activeTheme.hover} transition block shadow-md flex items-center justify-center gap-1 cursor-pointer`}
                    >
                      <span>Acessar Videoconferência</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </section>
                )}

                {/* MODULE: Simple custom Client Contact lead generator */}
                {showContactForm && (
                  <section id="client-contact-form-section" className="space-y-3 bg-[#08090D] border border-[#1F293D]/40 p-4 rounded-3xl">
                    <div className="border-b border-slate-900 pb-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                        Fale Conosco / Solicite uma Cotação
                      </span>
                    </div>

                    <form onSubmit={handleSimulateContactSubmit} className="space-y-3.5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input 
                          type="text"
                          required
                          value={clientName}
                          onChange={(e) => setClientName(e.target.value)}
                          placeholder="Seu Nome Completo"
                          className="w-full bg-[#11131E] border border-[#1F293C] rounded-lg px-2.5 py-1.5 text-slate-100 text-[10px] focus:outline-none"
                        />
                        <input 
                          type="email"
                          required
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          placeholder="seu@faturamento.com"
                          className="w-full bg-[#11131E] border border-[#1F293C] rounded-lg px-2.5 py-1.5 text-slate-100 text-[10px] focus:outline-none"
                        />
                      </div>

                      <textarea 
                        rows={3}
                        required
                        value={clientMessage}
                        onChange={(e) => setClientMessage(e.target.value)}
                        placeholder="Como podemos te ajudar? Digite sua mensagem de orçamento de serviços SaaS ou estoque físico aqui..."
                        className="w-full bg-[#11131E] border border-[#1F293C] rounded-lg p-2 text-slate-100 text-[10px] focus:outline-none leading-relaxed"
                      />

                      <button
                        type="submit"
                        disabled={submittingContact}
                        className={`w-full py-2 rounded-lg text-[10px] font-mono font-bold uppercase transition text-black ${activeTheme.primary} ${activeTheme.hover}`}
                      >
                        {submittingContact ? "Transmitindo Mensagem..." : "Enviar Mensagem para Gerente"}
                      </button>
                    </form>
                  </section>
                )}

                {/* Footer credit */}
                <footer className="text-center pt-8 border-t border-slate-900 text-[9px] text-slate-600 font-mono tracking-widest uppercase">
                  <span>SANDBOX AGENCYOS • TODOS OS DIREITOS ISOLADOS</span>
                </footer>

              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
