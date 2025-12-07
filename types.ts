

export enum ProductCategory {
  SNACK = 'Salgados',
  DRINK = 'Bebidas',
  MEAL = 'Refeições',
  DESSERT = 'Doces'
}

export interface Product {
  id: string;
  code?: string; // Código do Produto
  name: string;
  price: number;
  costPrice?: number; // Preço de Compra
  stock?: number; // Quantidade em Estoque
  category: ProductCategory;
  image?: string;
  isActive?: boolean; // Ativo/Inativo para venda
  isFavorite?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  notes?: string; // Observação do pedido
}

export type TransactionType = 'PURCHASE' | 'PAYMENT' | 'ADJUSTMENT' | 'REFUND' | 'EXCHANGE';

export interface StudentHistoryEntry {
  id: string;
  date: Date;
  type: TransactionType;
  description: string;
  value: number;
  items?: CartItem[]; // Lista de itens comprados
  balanceAfter?: number; // Saldo após a transação
}

export interface Student {
  id: string;
  code?: string; // Código do Aluno
  name: string;
  grade: string; // Turma e.g., "3º Ano B"
  isStaff?: boolean; // Se é funcionário
  isActive?: boolean; // Ativo/Inativo
  
  // Guardian / Contact Info
  guardianName?: string;
  guardianEmail?: string;
  guardianPhone?: string; // Format: 5511999999999
  guardianPassword?: string; // Senha de acesso ao portal

  balance: number; // Saldo devedor ou crédito
  points: number; // Sistema de Fidelidade
  notes?: string; // Observações / Alergias

  history: StudentHistoryEntry[];
}

export interface CashEntry {
  id: string;
  description: string;
  value: number; // Positive for IN, Negative for OUT usually, but we use type to distinguish
  amount: number; // Absolute value
  type: 'IN' | 'OUT';
  date: Date;
  userId?: string;
}

export interface Transaction {
  id: string;
  studentId?: string;
  studentName?: string;
  items: CartItem[];
  total: number;
  date: Date;
  aiMessage?: string;
  status?: 'VALID' | 'CANCELLED'; // Novo campo para cancelamento
  studentBalanceSnapshot?: number; // Saldo do aluno no momento da compra
  userId?: string; // ID do operador que fez a venda
  userName?: string;
}

export interface PrinterConfig {
  name: string;
  ip: string;
  port: string;
  enabled: boolean;
}

export interface SystemSettings {
  schoolName: string;
  taxRate: number; // Percentage
  kitchenPrinter: PrinterConfig;
  counterPrinter: PrinterConfig;
  printKitchenCopy: boolean;
  printCustomerCopy: boolean;
  
  // New Configuration Sections
  paymentMethods: {
    money: boolean;
    creditCard: boolean;
    debitCard: boolean;
    pix: boolean;
    studentAccount: boolean; // "Debitar na Conta"
  };
  features: {
    allowNegativeBalance: boolean; // Permitir fiado/dívida
    enforceStockLimit: boolean; // Bloquear venda se estoque <= 0
    showStockAlerts: boolean; // Mostrar alertas no dashboard
    enableLoyaltySystem: boolean; // Sistema de pontos
    blockOverdueStudents: boolean; // Bloquear alunos inadimplentes
    maxOverdueDays: number; // Dias tolerados de atraso
  };
  integrations?: {
    itau?: {
      enabled: boolean;
      clientId?: string;
      pixKey?: string;
    };
  };
}

// === SYSTEM ACCESS TYPES ===
export type UserRole = 'ADMIN' | 'CASHIER';

export interface SystemUser {
  id: string;
  name: string;
  login: string;
  password?: string; // Optional for security when listing, required for update
  role: UserRole;
}

// === MULTI-TENANCY & MODULARITY ===

export type AppModule = 'POS' | 'FINANCIAL' | 'INVENTORY' | 'REPORTS' | 'PARENTS_PORTAL' | 'API_INTEGRATION';

export interface Company {
  id: string;
  name: string;
  document?: string; // CNPJ
  contact?: string;
  active: boolean;
  modules: AppModule[]; // Lista de módulos que esta empresa contratou/ativou
  createdAt: string;
}