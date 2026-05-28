import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User,
  signOut
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Provider Config with combined scopes
const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/calendar.events");
provider.addScope("https://www.googleapis.com/auth/gmail.readonly");
provider.addScope("https://www.googleapis.com/auth/gmail.send");
provider.addScope("https://www.googleapis.com/auth/gmail.compose");
provider.addScope("https://www.googleapis.com/auth/meetings.space.created");
provider.addScope("https://www.googleapis.com/auth/contacts");
provider.addScope("https://www.googleapis.com/auth/presentations");
provider.addScope("https://www.googleapis.com/auth/drive.file");

let isSigningIn = false;
let cachedAccessToken: string | null = null;
let savedUser: User | null = null;

// Listeners list
const listeners: Array<(user: User | null, token: string | null) => void> = [];

export const addAuthListener = (callback: (user: User | null, token: string | null) => void) => {
  listeners.push(callback);
  // Initial fire
  callback(savedUser, cachedAccessToken);
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx !== -1) listeners.splice(idx, 1);
  };
};

const notifyListeners = () => {
  listeners.forEach(cb => cb(savedUser, cachedAccessToken));
};

// Initialize the Auth Listener
onAuthStateChanged(auth, async (user: User | null) => {
  savedUser = user;
  if (!user) {
    cachedAccessToken = null;
  }
  notifyListeners();
});

// Main login helper
export const loginWithGoogle = async (): Promise<{ user: User; token: string } | null> => {
  if (isSigningIn) return null;
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken || null;
    
    if (!token) {
      throw new Error("Não foi possível obter o token de acesso do Google.");
    }
    
    cachedAccessToken = token;
    savedUser = result.user;
    notifyListeners();
    return { user: result.user, token };
  } catch (err) {
    console.error("Erro no Login Google OAuth:", err);
    throw err;
  } finally {
    isSigningIn = false;
  }
};

// Logout helper
export const logoutGoogle = async () => {
  try {
    await signOut(auth);
    cachedAccessToken = null;
    savedUser = null;
    notifyListeners();
  } catch (err) {
    console.error("Erro no Logout:", err);
  }
};

// Get current token helper
export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

// Get fake mock database values just in case user is offline or not logged in yet
export const getMockWorkspaceData = () => {
  return {
    emails: [
      { id: "e1", from: "investidor@capitalrisk.com", subject: "Proposta de Aporte Financeiro Q2/Q3", body: "Olá, ficamos muito impressionados com o crescimento de MRR da sua empresa e gostaríamos de marcar uma chamada para formalizar o termo de investimento de R$ 500k. Aguardamos retorno.", date: "2026-05-27T10:15:00Z" },
      { id: "e2", from: "suporte@receita.gov.br", subject: "Notificação Simplificada de Auditoria MEI/Simei", body: "Sua folha de apuração mensal do Simples Nacional encontra-se processada. Favor evitar atrasar guias fiscais.", date: "2026-05-26T14:30:00Z" },
      { id: "e3", from: "cliente-ouro@techify.com", subject: "Ajuste na fatura mensal do serviço SaaS", body: "Olá, precisamos alterar os assentos do plano corporativo de 25 para 45 usuários. Por favor atualizar o faturamento.", date: "2026-05-25T09:00:00Z" }
    ],
    contacts: [
      { id: "c1", name: "Marcos Pinheiro", email: "marcos@techify.com", phone: "(11) 98765-4321", company: "Techify Premium Client" },
      { id: "c2", name: "Ana Beatriz Ramos", email: "anabeatriz@capitalrisk.com", phone: "(11) 91102-3928", company: "Capital Risk Partner" },
      { id: "c3", name: "Guilherme de Souza", email: "guilherme.souza@faturas.com", phone: "(21) 95532-1111", company: "Finanças Tech S/A" }
    ],
    meetings: [
      { id: "m1", title: "Zelda-OS Corporate Alinhamento", date: "2026-05-29", time: "14:00", duration: "45 min", meetLink: "https://meet.google.com/abc-defg-hij", agenda: "Falar sobre corte de custos na AWS e faturamento SaaS" },
      { id: "m2", title: "Review de Métricas com Mentores", date: "2026-05-30", time: "10:30", duration: "30 min", meetLink: "https://meet.google.com/xyz-lmno-pqr", agenda: "Revisão do faturamento mensal versus meta de R$ 25.000" }
    ],
    slides: [
      { id: "s1", title: "Pitch Deck Corporativo AgencyOS 2026", slidesCount: 5, driveLink: "#", updated: "Hoje às 10:20" },
      { id: "s2", title: "Apresentação Financeira Conselho", slidesCount: 8, driveLink: "#", updated: "Há 2 dias" }
    ]
  };
};
