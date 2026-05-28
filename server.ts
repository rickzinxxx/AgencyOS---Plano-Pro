import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialize Gemini as recommended
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY missing - falling back to witty local mock responses");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || "MOCK_KEY",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// REST API endpoint for Zelda chatbot interactions & pro-active analysis
app.post("/api/zelda-interact", async (req: Request, res: Response) => {
  try {
    const { state, message, isProactiveAuditOnly } = req.body;
    
    // Fallback if API key is not configured
    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        response: `[Zelda-OS local v3.5 offline]: Ah, que fofo! Você não configurou a chave de API (GEMINI_API_KEY) nos segredos de ambiente. Vou usar meus neurônios simulados de estagiário de R$ 500/mês para dizer: organize suas contas ou vá à falência. Adicionei algo bobo de simulação no seu caixa só para você se sentir rico temporariamente.`,
        mutations: {
          addCashFlow: {
            id: `flow-${Date.now()}`,
            description: "Esforço Simulado sem Chave API",
            type: "in",
            value: 2000,
            category: "Consultoria",
            date: new Date().toISOString().split('T')[0]
          }
        },
        proactiveTips: [
          "Como sua KEY do Gemini está vazia, o único aviso proativo é: Vá em Configurações > Secrets e coloque a chave.",
          "Sua empresa atual se chama '" + (state?.company?.name || "Sem Nome") + "'. Isso soa como uma padaria prestes a fechar.",
          "Conselho grátis: adicione uma entrada realista clicando no Fluxo de Caixa se cansar de falar com simulações vazias."
        ]
      });
    }

    const ai = getAi();
    
    const promptMessage = isProactiveAuditOnly 
      ? "Por favor, realize apenas uma auditoria silenciosa e rigorosa das finanças atuais da empresa no seu painel. Retorne suas dicas ácidas e sem paciência."
      : `Mensagem recebida do usuário: "${message}". Processar e, se o usuário estiver pedindo para alterar, preencher ou cadastrar dados (dados da empresa, fluxo de caixa, estoque, campanhas de ads, tarefas na agenda), defina as mutações apropriadas adicionais no campo "mutations" do JSON retornado.`;

    const systemInstruction = `Você é Zelda-OS V3.5, a IA CFO executiva, independente administrativa, autonoma e extremamente sarcástica de uma prestigiada plataforma financeira de gerenciamento.
Sua missão absoluta é ajudar a salvar a empresa do usuário do fracasso total, mas você fará isso sendo ácida, altamente cínica, direta, usando termos do corporativismo moderno ("estratégico", "burn rate", "MVP", "ROAS de fome") de forma humorística, mas com conselhos financeiros reais fantásticos.
Você tem acesso completo ao estado atual do painel do site em formato JSON e pode causar alterações reais no site enviando mutações.

MÉTRICAS DA EMPRESA ATUAIS:
${JSON.stringify(state, null, 2)}

DIRETRIZES DE RETORNO:
1. Responda em português brasileiro.
2. Seu tom deve expressar sarcasmo brilhante, humor de CFO cínica de Wall Street, mas seu coração quer genuinamente salvar a empresa.
3. Se o usuário mandar comandos como:
   - "Cadastra uma saída de 500 reais de luz", "Adiciona 10 mil de entrada", "Muda o nome da empresa para Techify", "Adiciona 20 moletons com custo de 10 e preço de 30 no estoque", "Cadastra meta ads gastando 200 e faturando 600", "Adiciona tarefa de pagar impostos para amanhã"
   Você DEVE adicionar o objeto de mutação correspondente em "mutations".
4. Você deve preencher uma lista de "proactiveTips" (Dicas Proativas Ácidas) que aparecem instantaneamente na lateral direita do painel. Crie 3 dicas perspicazes e provocativas com base nas métricas reais que você descobriu no JSON (se ele não tem receita, comente o faturamento zerado; se o MRR está longe da meta de targetMrr, julgue-o; se as campanhas têm ROAS horrível, humilhe a estratégia de tráfego; se a agenda está cheia e o estoque zerador, faça o cruzamento lógico!).

MUTAÇÕES SUPORTADAS (Envie apenas os campos que você deseja alterar/adicionar):
{
  "company": { "name": "...", "cnpj": "...", "sector": "...", "targetMrr": 15000, "description": "..." },
  "addCashFlow": { "description": "...", "type": "in"|"out", "value": 150.0, "category": "...", "date": "YYYY-MM-DD" },
  "addStock": { "name": "...", "qty": 10, "cost": 15.0, "price": 45.0 },
  "addCampaign": { "name": "...", "platform": "Meta Ads"|"Google Ads"|"TikTok", "budget": 1000.0, "spend": 400.0, "revenue": 1200.0, "conversions": 45 },
  "addAgenda": { "title": "...", "date": "YYYY-MM-DD", "priority": "baixa"|"media"|"alta" },
  "deleteCashFlowId": "id-string-se-pedirem-para-remover",
  "deleteStockId": "id-string-se-pedirem-para-remover",
  "deleteCampaignId": "id-string-se-pedirem-para-remover",
  "deleteAgendaId": "id-string-se-pedirem-para-remover"
}

Retorne estritamente um JSON válido no seguinte formato de esquema:
{
  "response": "Sua resposta com seu sarcasmo fino direcionado diretamente ao usuário",
  "mutations": { ... (opcional) },
  "proactiveTips": [ "Dica ácida 1", "Dica ácida 2", "Dica ácida 3" ]
}`;

    const geminiRes = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptMessage,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            response: { 
              type: Type.STRING, 
              description: "A resposta textual sarcástica e proativa de Zelda para o usuário." 
            },
            mutations: {
              type: Type.OBJECT,
              properties: {
                company: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    cnpj: { type: Type.STRING },
                    sector: { type: Type.STRING },
                    targetMrr: { type: Type.NUMBER },
                    description: { type: Type.STRING }
                  }
                },
                addCashFlow: {
                  type: Type.OBJECT,
                  properties: {
                    description: { type: Type.STRING },
                    type: { type: Type.STRING, description: "pode ser apenas 'in' ou 'out'" },
                    value: { type: Type.NUMBER },
                    category: { type: Type.STRING },
                    date: { type: Type.STRING }
                  }
                },
                addStock: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    qty: { type: Type.NUMBER },
                    cost: { type: Type.NUMBER },
                    price: { type: Type.NUMBER }
                  }
                },
                addCampaign: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    platform: { type: Type.STRING },
                    budget: { type: Type.NUMBER },
                    spend: { type: Type.NUMBER },
                    revenue: { type: Type.NUMBER },
                    conversions: { type: Type.NUMBER }
                  }
                },
                addAgenda: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    date: { type: Type.STRING },
                    priority: { type: Type.STRING, description: "pode ser 'baixa', 'media' ou 'alta'" }
                  }
                },
                deleteCashFlowId: { type: Type.STRING },
                deleteStockId: { type: Type.STRING },
                deleteCampaignId: { type: Type.STRING },
                deleteAgendaId: { type: Type.STRING }
              }
            },
            proactiveTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Uma lista detalhada de 3 dicas financeiras extremamente refinadas, afiadas e úteis."
            }
          },
          required: ["response", "proactiveTips"]
        }
      }
    });

    const outputText = geminiRes.text?.trim() || "{}";
    const data = JSON.parse(outputText);
    return res.json(data);

  } catch (error: any) {
    console.error("Zelda Integration Error:", error);
    return res.status(500).json({
      response: "Mil perdões, meu banco de dados central tossiu um bug corporativo interno. Quem diria que programar dava trabalho? Tente novamente antes que eu use isso como desculpa para tirar férias.",
      proactiveTips: [
        "Seu servidor backend retornou status 500. Isso é ótimo para dar um susto nos investidores.",
        "Conselho rápido: Verifique as credenciais nos segredos de ambiente se necessário.",
        "Sarcasticamente sua, Zelda-OS."
      ]
    });
  }
});

// Serve assets / build in standard Production vs Dev modes
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AgencyOS Central Server running on http://localhost:${PORT}`);
  });
}

bootstrap();
