
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
}

export interface CartItem extends Product {
  quantity: number;
}

export type TransactionType = 'PURCHASE' | 'PAYMENT' | 'ADJUSTMENT' | 'REFUND';

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
}