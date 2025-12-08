export enum ProductCategory {
  SNACK = 'Salgados',
  DRINK = 'Bebidas',
  MEAL = 'Refeições',
  DESSERT = 'Doces'
}

export interface Product {
  id: string;
  code?: string;
  name: string;
  price: number;
  costPrice?: number;
  stock?: number;
  category: ProductCategory;
  image?: string;
  isActive?: boolean;
  isFavorite?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
  notes?: string;
}

export type TransactionType = 'PURCHASE' | 'PAYMENT' | 'ADJUSTMENT' | 'REFUND' | 'EXCHANGE';
export type PaymentMethod = 'MONEY' | 'ACCOUNT' | 'CREDIT' | 'DEBIT' | 'PIX' | 'MIXED';

export interface StudentHistoryEntry {
  id: string;
  date: Date;
  type: TransactionType;
  description: string;
  value: number;
  items?: CartItem[];
  balanceAfter?: number;
}

export interface Student {
  id: string;
  code?: string;
  name: string;
  grade: string;
  isStaff?: boolean;
  isActive?: boolean;
  guardianName?: string;
  guardianEmail?: string;
  guardianPhone?: string;
  guardianPassword?: string;
  balance: number;
  points: number;
  notes?: string;
  history: StudentHistoryEntry[];
}

export interface CashEntry {
  id: string;
  description: string;
  value: number;
  amount: number;
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
  status?: 'VALID' | 'CANCELLED';
  studentBalanceSnapshot?: number;
  userId?: string;
  userName?: string;
  paymentMethod?: PaymentMethod;
}

export interface PrinterConfig {
  name: string;
  ip: string;
  port: string;
  enabled: boolean;
}

export interface ItauSettings {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
    pixKey: string;
}

export interface SystemSettings {
  schoolName: string;
  taxRate: number;
  kitchenPrinter: PrinterConfig;
  counterPrinter: PrinterConfig;
  printKitchenCopy: boolean;
  printCustomerCopy: boolean;
  
  integrations?: {
      itau?: ItauSettings;
  };

  paymentMethods: {
    money: boolean;
    creditCard: boolean;
    debitCard: boolean;
    pix: boolean;
    studentAccount: boolean;
  };
  features: {
    allowNegativeBalance: boolean;
    enforceStockLimit: boolean;
    showStockAlerts: boolean;
    enableLoyaltySystem: boolean;
    blockOverdueStudents: boolean;
    maxOverdueDays: number;
  };
}

export type UserRole = 'ADMIN' | 'CASHIER';

export interface SystemUser {
  id: string;
  name: string;
  login: string;
  password?: string;
  role: UserRole;
}

export type AppModule = 'POS' | 'FINANCIAL' | 'INVENTORY' | 'REPORTS' | 'PARENTS_PORTAL' | 'API_INTEGRATION' | 'ACCESS_CONTROL';

export interface Company {
  id: string;
  name: string;
  document?: string;
  contact?: string;
  active: boolean;
  modules: AppModule[];
  createdAt: string;
}