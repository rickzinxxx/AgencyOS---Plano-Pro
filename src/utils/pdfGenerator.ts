import { jsPDF } from "jspdf";
import { AppState } from "../types";

export function generateFinancialPDF(state: AppState): void {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Theme colors
  const brandDark = "#090A0F";
  const brandPrimary = "#10B981"; // Emerald
  const textDark = "#1E293B";
  const textMuted = "#64748B";

  // Helper metrics calculations
  const totalIn = state.cashFlow
    .filter(item => item.type === 'in')
    .reduce((acc, current) => acc + current.value, 0);

  const totalOut = state.cashFlow
    .filter(item => item.type === 'out')
    .reduce((acc, current) => acc + current.value, 0);

  const liquidBalance = totalIn - totalOut;

  const totalStockVal = state.stock.reduce(
    (acc, cur) => acc + (cur.qty * cur.price), 
    0
  );

  const totalCampSpend = state.campaigns.reduce((acc, cur) => acc + cur.spend, 0);
  const totalCampRev = state.campaigns.reduce((acc, cur) => acc + cur.revenue, 0);
  const averageRoas = totalCampSpend > 0 ? (totalCampRev / totalCampSpend).toFixed(1) + "x" : "0.0x";

  // Page 1: Design Header
  doc.setFillColor(9, 10, 15); // brandDark
  doc.rect(0, 0, 210, 40, "F");

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(22);
  doc.text("AgencyOS // COMMAND CENTER", 14, 18);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(16, 185, 129); // emerald
  doc.text("AUDITORIA FINANCEIRA CORPORATIVA INTELIGENTE - ZELDA-OS", 14, 25);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")} // Emissão de Alta Prioridade`, 14, 32);

  // Content area starts
  let y = 52;

  // Company Bio Widget
  doc.setFillColor(248, 250, 252);
  doc.rect(14, y, 182, 32, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, y, 182, 32, "S");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text("DADOS GERAIS DA EMPRESA", 18, y + 6);

  doc.setFont("Helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Razão Social: ${state.company.name || "Não configurado"}`, 18, y + 13);
  doc.text(`CNPJ: ${state.company.cnpj || "Não informado"}`, 18, y + 18);
  doc.text(`Segmento: ${state.company.sector || "Não informado"}`, 18, y + 23);
  
  // Right side of company block (target vs current)
  doc.setFont("Helvetica", "bold");
  doc.text("METAS FINANCEIRAS", 120, y + 6);
  doc.setFont("Helvetica", "normal");
  doc.text(`Faturamento Alvo (MRR): R$ ${state.company.targetMrr.toLocaleString("pt-BR")}`, 120, y + 13);
  doc.text(`Faturamento Atual Local: R$ ${totalIn.toLocaleString("pt-BR")}`, 120, y + 18);
  const gap = state.company.targetMrr - totalIn;
  doc.setTextColor(gap > 0 ? 239 : 16, gap > 0 ? 68 : 185, gap > 0 ? 68 : 129); // red or emerald
  doc.text(gap > 0 ? `Gap pendente: R$ ${gap.toLocaleString("pt-BR")}` : "Meta corporativa batida!", 120, y + 23);

  y += 42;

  // Summary Metrics Widgets
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(9, 10, 15);
  doc.text("INDICADORES DE DESEMPENHO EM TEMPO REAL (KPIs)", 14, y);

  y += 5;

  // Box 1 Inflows
  doc.setFillColor(240, 253, 250);
  doc.rect(14, y, 56, 20, "F");
  doc.setDrawColor(16, 185, 129);
  doc.rect(14, y, 56, 20, "S");
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(4, 120, 87);
  doc.text("ENTRADAS ACUMULADAS", 18, y + 6);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`R$ ${totalIn.toLocaleString("pt-BR")}`, 18, y + 14);

  // Box 2 Outflows
  doc.setFillColor(254, 242, 242);
  doc.rect(77, y, 56, 20, "F");
  doc.setDrawColor(239, 68, 68);
  doc.rect(77, y, 56, 20, "S");
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(185, 28, 28);
  doc.text("SAÍDAS ACUMULADAS", 81, y + 6);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`R$ ${totalOut.toLocaleString("pt-BR")}`, 81, y + 14);

  // Box 3 Cash balance
  const isPositive = liquidBalance >= 0;
  if (isPositive) {
    doc.setFillColor(240, 253, 250);
    doc.setDrawColor(16, 185, 129);
    doc.setTextColor(4, 120, 87);
  } else {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(239, 68, 68);
    doc.setTextColor(185, 28, 28);
  }
  doc.rect(140, y, 56, 20, "F");
  doc.rect(140, y, 56, 20, "S");
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(8);
  doc.text("SALDO CONSOLIDADO", 144, y + 6);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`R$ ${liquidBalance.toLocaleString("pt-BR")}`, 144, y + 14);

  y += 30;

  // cash flow detail section
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text("HISTÓRICO RECENTE DO FLUXO DE CAIXA (LANCAMENTOS)", 14, y);

  y += 4;
  
  // Table Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 6, "F");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Data", 16, y + 4.5);
  doc.text("Descrição", 40, y + 4.5);
  doc.text("Categoria", 105, y + 4.5);
  doc.text("Tipo", 145, y + 4.5);
  doc.text("Valor", 175, y + 4.5);

  y += 6;

  const printedFlow = state.cashFlow.slice(0, 10);
  if (printedFlow.length === 0) {
    doc.setFont("Helvetica", "italic");
    doc.text("Nenhuma transação cadastrada até o momento no caixa.", 18, y + 5);
    y += 10;
  } else {
    doc.setFont("Helvetica", "normal");
    printedFlow.forEach(item => {
      doc.text(item.date, 16, y + 4.5);
      doc.text(item.description.length > 32 ? item.description.substring(0, 32) + "..." : item.description, 40, y + 4.5);
      doc.text(item.category, 105, y + 4.5);
      
      doc.setFont("Helvetica", "bold");
      if (item.type === "in") {
        doc.setTextColor(16, 185, 129);
        doc.text("ENTRADA", 145, y + 4.5);
      } else {
        doc.setTextColor(239, 68, 68);
        doc.text("SAÍDA", 145, y + 4.5);
      }
      doc.setTextColor(71, 85, 105);
      doc.text(`R$ ${item.value.toLocaleString("pt-BR")}`, 175, y + 4.5);
      doc.setFont("Helvetica", "normal");
      
      y += 6;
    });
  }

  y += 6;

  // Stock inventory Summary Table Header
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`INVENTÁRIO DO ESTOQUE (ATIVO CORRENTE DE MERCADORIA - Total R$ ${totalStockVal.toLocaleString("pt-BR")})`, 14, y);

  y += 4;

  doc.setFillColor(241, 245, 249);
  doc.rect(14, y, 182, 6, "F");
  doc.setFontSize(8);
  doc.text("Nome do Item", 16, y + 4.5);
  doc.text("Qtde Disponível", 80, y + 4.5);
  doc.text("Preço de Custo", 115, y + 4.5);
  doc.text("Preço de Venda", 150, y + 4.5);
  doc.text("Vlr Inventariado", 175, y + 4.5);

  y += 6;
  const printedStock = state.stock.slice(0, 8);
  if (printedStock.length === 0) {
    doc.setFont("Helvetica", "italic");
    doc.text("Inventário de estoque completamente vazio.", 18, y + 5);
    y += 10;
  } else {
    doc.setFont("Helvetica", "normal");
    printedStock.forEach(item => {
      doc.text(item.name, 16, y + 4.5);
      doc.text(`${item.qty} un`, 80, y + 4.5);
      doc.text(`R$ ${item.cost.toLocaleString("pt-BR")}`, 115, y + 4.5);
      doc.text(`R$ ${item.price.toLocaleString("pt-BR")}`, 150, y + 4.5);
      doc.text(`R$ ${(item.qty * item.price).toLocaleString("pt-BR")}`, 175, y + 4.5);
      y += 6;
    });
  }

  // Draw Page Number
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("Página 1 de 2 // AgencyOS", 14, 287);

  // Add Page 2 for Marketing, Agenda and Zelda's AUDIT
  doc.addPage();
  
  // Clean Dark Header
  doc.setFillColor(9, 10, 15);
  doc.rect(0, 0, 210, 20, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("Helvetica", "bold");
  doc.setFontSize(12);
  doc.text("AgencyOS // CAMPO DE MARKETING, AGENDA E AUDITORIA ZELDA-OS", 14, 13);

  let y2 = 32;

  // Campaigns Table
  doc.setTextColor(30, 41, 59);
  doc.text("ANÁLISE DE CAMPANHAS DE TRÁFEGO PAGO (ADS METRICS)", 14, y2);
  y2 += 4;

  doc.setFillColor(241, 245, 249);
  doc.rect(14, y2, 182, 6, "F");
  doc.setFontSize(8);
  doc.text("Campanha / Plataforma", 16, y2 + 4.5);
  doc.text("Orçamento", 75, y2 + 4.5);
  doc.text("Gasto", 105, y2 + 4.5);
  doc.text("Retorno (Receita)", 135, y2 + 4.5);
  doc.text("ROAS Médio", 175, y2 + 4.5);

  y2 += 6;
  const printedCamp = state.campaigns.slice(0, 6);
  if (printedCamp.length === 0) {
    doc.setFont("Helvetica", "italic");
    doc.text("Nenhuma campanha de tráfego ativa no sistema.", 18, y2 + 5);
    y2 += 10;
  } else {
    doc.setFont("Helvetica", "normal");
    printedCamp.forEach(item => {
      doc.text(`${item.name} (${item.platform})`, 16, y2 + 4.5);
      doc.text(`R$ ${item.budget.toLocaleString("pt-BR")}`, 75, y2 + 4.5);
      doc.text(`R$ ${item.spend.toLocaleString("pt-BR")}`, 105, y2 + 4.5);
      doc.text(`R$ ${item.revenue.toLocaleString("pt-BR")}`, 135, y2 + 4.5);
      
      const roas = item.spend > 0 ? (item.revenue / item.spend) : 0;
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(roas >= 2 ? 16 : 239, roas >= 2 ? 185 : 68, roas >= 2 ? 129 : 68);
      doc.text(`${roas.toFixed(1)}x`, 175, y2 + 4.5);
      doc.setFont("Helvetica", "normal");
      doc.setTextColor(30, 41, 59);
      y2 += 6;
    });
  }

  y2 += 10;

  // Agenda List
  doc.setFont("Helvetica", "bold");
  doc.text("CRONOGRAMA DE OPERAÇÕES AGENDADAS (AGENDA)", 14, y2);
  y2 += 4;

  doc.setFillColor(241, 245, 249);
  doc.rect(14, y2, 182, 6, "F");
  doc.setFontSize(8);
  doc.text("Tarefa Operacional", 16, y2 + 4.5);
  doc.text("Prazo", 100, y2 + 4.5);
  doc.text("Prioridade", 135, y2 + 4.5);
  doc.text("Status", 170, y2 + 4.5);

  y2 += 6;
  const printedAgenda = state.agenda.slice(0, 6);
  if (printedAgenda.length === 0) {
    doc.setFont("Helvetica", "italic");
    doc.text("Nenhuma tarefa operacional ou obrigação agendada.", 18, y2 + 5);
    y2 += 10;
  } else {
    doc.setFont("Helvetica", "normal");
    printedAgenda.forEach(item => {
      doc.text(item.title, 16, y2 + 4.5);
      doc.text(item.date, 100, y2 + 4.5);
      doc.text(item.priority.toUpperCase(), 135, y2 + 4.5);
      doc.text(item.status.toUpperCase(), 170, y2 + 4.5);
      y2 += 6;
    });
  }

  y2 += 12;

  // AUDITORIA SILENCIOSA DE INTELIGÊNCIA ARTIFICIAL - ZELDA-OS EXECUTIVE INSIGHTS
  doc.setFillColor(15, 23, 42); // slate-900 (ultra dark slate)
  doc.rect(14, y2, 182, 42, "F");
  doc.setDrawColor(16, 185, 129); // neon board border
  doc.rect(14, y2, 182, 42, "S");

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(16, 185, 129); // emerald
  doc.text("★ AUDITORIA PROATIVA ZELDA-OS // EXECUTIVE INSIGHTS V3.5", 18, y2 + 6);

  doc.setFont("Helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(226, 232, 240); // slate-200
  
  // Display dynamic witty content if available, or static witty insights
  const note1 = "• Status de Caixa: O burn rate está regulado mas o saldo acumulado de R$ " + liquidBalance.toLocaleString("pt-BR") + " exige proatividade comercial.";
  const note2 = "• Gestão Comercial: " + (state.campaigns.length === 0 ? "Nenhuma campanha rodando. Achar que vai vender por osmose ou oração não é tática corporativa elegível." : `O ROAS médio ponderado de marketing está em ${averageRoas}. Ajustar canais urgently.`);
  const note3 = "• Auditoria Autônoma: Sincronia de nuvem local simulada offline com status de 'Sincronizado'. Siga vendendo!";

  doc.text(note1, 18, y2 + 15);
  doc.text(note2, 18, y2 + 23);
  doc.text(note3, 18, y2 + 31);

  doc.setFont("Helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text("* ESTE É UM DOCUMENTO CONFIDENCIAL INTELIGENTE DE USO INTERNO E NÃO DEVE SER COMPARTILHADO COM CONCORRENTES.", 18, y2 + 38);

  // Footer page 2
  doc.setFontSize(8);
  doc.text("Página 2 de 2 // AgencyOS", 14, 287);

  // Export
  doc.save(`AgencyOS_Relatorio_Financeiro_${state.company.name.replace(/\s+/g, '_') || 'Empresa'}.pdf`);
}
