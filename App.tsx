
import React, { useState, useEffect } from 'react';
import { Product, Student, Transaction, SystemSettings, StudentHistoryEntry } from './types';
import { PRODUCTS, STUDENTS } from './constants';
import { PosView } from './components/PosView';
import { CustomersView } from './components/CustomersView';
import { ProductsView } from './components/ProductsView';
import { ReportsView } from './components/ReportsView';
import { ApiSettingsView } from './components/ApiSettingsView';
import { SettingsView } from './components/SettingsView';
import { BillingView } from './components/BillingView';
import { AccessManagementView } from './components/AccessManagementView';
import { GuardianPortalView } from './components/GuardianPortalView';
import { DashboardView } from './components/DashboardView';

type Tab = 'DASHBOARD' | 'POS' | 'CLIENTS' | 'BILLING' | 'PRODUCTS' | 'REPORTS' | 'ACCESS' | 'APIS' | 'SETTINGS';

// === CONSTANTS ===
const DEFAULT_SETTINGS: SystemSettings = {
    schoolName: 'Cantina Escolar',
    taxRate: 0,
    kitchenPrinter: { name: '', ip: '', port: '9100', enabled: false },
    counterPrinter: { name: '', ip: '', port: '9100', enabled: false },
    printCustomerCopy: true,
    printKitchenCopy: true
};

// === SANITIZERS (MIGRATION HELPERS) ===
const sanitizeStudents = (data: any[]): Student[] => {
    if (!Array.isArray(data)) return STUDENTS;
    return data.map(s => ({
        ...s,
        id: s.id || Date.now().toString(),
        name: s.name || 'Sem Nome',
        history: Array.isArray(s.history) ? s.history.map((h: any) => ({
            ...h,
            date: new Date(h.date),
            items: h.items || []
        })) : [],
        guardianName: s.guardianName || '',
        guardianEmail: s.guardianEmail || '',
        guardianPhone: s.guardianPhone || '',
        guardianPassword: s.guardianPassword || '',
        code: s.code || '',
        isStaff: !!s.isStaff,
        grade: s.grade || '',
        balance: typeof s.balance === 'number' ? s.balance : 0,
        points: typeof s.points === 'number' ? s.points : 0,
        notes: s.notes || ''
    }));
};

const sanitizeProducts = (data: any[]): Product[] => {
    if (!Array.isArray(data)) return PRODUCTS;
    return data.map(p => ({
        ...p,
        stock: typeof p.stock === 'number' ? p.stock : 0,
        costPrice: typeof p.costPrice === 'number' ? p.costPrice : 0,
        code: p.code || ''
    }));
};

const sanitizeTransactions = (data: any[]): Transaction[] => {
    if (!Array.isArray(data)) return [];
    return data.map(t => ({
        ...t,
        date: new Date(t.date),
        status: t.status || 'VALID',
        items: t.items || []
    }));
};

const sanitizeSettings = (data: any): SystemSettings => {
    // If data is null/undefined or not an object, return default immediately
    if (!data || typeof data !== 'object') return DEFAULT_SETTINGS;
    
    // Helper to ensure printer config has all fields
    const sanitizePrinter = (p: any) => ({
        name: p?.name || '',
        ip: p?.ip || '',
        port: p?.port || '9100',
        enabled: !!p?.enabled
    });

    return {
        schoolName: data.schoolName || DEFAULT_SETTINGS.schoolName,
        taxRate: typeof data.taxRate === 'number' ? data.taxRate : DEFAULT_SETTINGS.taxRate,
        printCustomerCopy: data.printCustomerCopy ?? DEFAULT_SETTINGS.printCustomerCopy,
        printKitchenCopy: data.printKitchenCopy ?? DEFAULT_SETTINGS.printKitchenCopy,
        kitchenPrinter: sanitizePrinter(data.kitchenPrinter),
        counterPrinter: sanitizePrinter(data.counterPrinter)
    };
};

const loadState = <T,>(key: string, fallback: T, sanitizer?: (data: any) => T): T => {
  const saved = localStorage.getItem(key);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return sanitizer ? sanitizer(parsed) : parsed;
    } catch (e) {
      console.error(`Error parsing ${key}`, e);
      return fallback;
    }
  }
  return fallback;
};

const App = () => {
  const [viewMode, setViewMode] = useState<'ADMIN' | 'GUARDIAN'>('ADMIN');
  const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
  const [triggerNewStudent, setTriggerNewStudent] = useState(false);
  
  const [products, setProducts] = useState<Product[]>(() => loadState('products', PRODUCTS, sanitizeProducts));
  const [students, setStudents] = useState<Student[]>(() => loadState('students', STUDENTS, sanitizeStudents));
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadState('transactions', [], sanitizeTransactions));
  
  // Safe initialization of settings
  const [settings, setSettings] = useState<SystemSettings>(() => {
    const loaded = loadState('settings', DEFAULT_SETTINGS, sanitizeSettings);
    // Double check to ensure we never have undefined settings
    if (!loaded || !loaded.kitchenPrinter) return DEFAULT_SETTINGS;
    return loaded;
  });

  useEffect(() => {
    const handleHashChange = () => {
        if (window.location.hash === '#/portal') {
            setViewMode('GUARDIAN');
        } else {
            setViewMode('ADMIN');
        }
    };
    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => { localStorage.setItem('products', JSON.stringify(products)); }, [products]);
  useEffect(() => { localStorage.setItem('students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('transactions', JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem('settings', JSON.stringify(settings)); }, [settings]);

  const handleExportData = () => {
    const backupData = {
        version: '1.4',
        timestamp: new Date().toISOString(),
        products,
        students,
        transactions,
        settings
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_Cantina_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportData = (file: File) => {
    if (!file) return;

    if(!window.confirm('ATENÇÃO: Isso substituirá os dados atuais pelos do backup. Deseja continuar?')) {
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = JSON.parse(event.target?.result as string);
            
            if (json.products) setProducts(sanitizeProducts(json.products));
            if (json.students) setStudents(sanitizeStudents(json.students));
            if (json.transactions) setTransactions(sanitizeTransactions(json.transactions));
            if (json.settings) setSettings(sanitizeSettings(json.settings));
            
            alert('Backup restaurado com sucesso!');
        } catch (err) {
            console.error(err);
            alert('Erro ao restaurar backup: Arquivo inválido ou corrompido.');
        }
    };
    reader.readAsText(file);
  };

  const handleTransactionComplete = (transaction: Transaction) => {
    setTransactions(prev => [...prev, { ...transaction, status: 'VALID' }]);
    
    setProducts(prev => prev.map(p => {
        const itemInCart = transaction.items.find(i => i.id === p.id);
        if (itemInCart && p.stock !== undefined) {
            return { ...p, stock: Math.max(0, p.stock - itemInCart.quantity) };
        }
        return p;
    }));

    if (transaction.studentId) {
        // Calculate Points (1 point per R$ 1)
        const pointsEarned = Math.floor(transaction.total);

        setStudents(prev => prev.map(s => {
            if (s.id === transaction.studentId) {
                const newBalance = s.balance - transaction.total;
                const newHistory: StudentHistoryEntry = {
                    id: transaction.id,
                    date: transaction.date,
                    type: 'PURCHASE',
                    description: `Compra - ${transaction.items.length} itens`,
                    value: transaction.total,
                    items: transaction.items,
                    balanceAfter: newBalance
                };
                return { 
                    ...s, 
                    balance: newBalance,
                    points: (s.points || 0) + pointsEarned,
                    history: [newHistory, ...(s.history || [])]
                };
            }
            return s;
        }));
    }
  };

  const handleCancelTransaction = (transactionId: string) => {
    const tx = transactions.find(t => t.id === transactionId);
    if (!tx || tx.status === 'CANCELLED') return;

    if (!window.confirm(`Deseja realmente cancelar a venda #${transactionId}? Isso estornará o saldo e o estoque.`)) {
        return;
    }

    setTransactions(prev => prev.map(t => t.id === transactionId ? { ...t, status: 'CANCELLED' } : t));

    setProducts(prev => prev.map(p => {
        const itemInTx = tx.items.find(i => i.id === p.id);
        if (itemInTx && p.stock !== undefined) {
            return { ...p, stock: p.stock + itemInTx.quantity };
        }
        return p;
    }));

    if (tx.studentId) {
        const pointsReversed = Math.floor(tx.total);

        setStudents(prev => prev.map(s => {
            if (s.id === tx.studentId) {
                const newBalance = s.balance + tx.total;
                const newHistory: StudentHistoryEntry = {
                    id: `cancel-${Date.now()}`,
                    date: new Date(),
                    type: 'REFUND',
                    description: `Estorno Venda #${transactionId}`,
                    value: tx.total,
                    balanceAfter: newBalance
                };
                return {
                    ...s,
                    balance: newBalance,
                    points: Math.max(0, (s.points || 0) - pointsReversed),
                    history: [newHistory, ...(s.history || [])]
                };
            }
            return s;
        }));
    }
    
    alert('Venda cancelada com sucesso.');
  };

  const handleStudentPayment = (studentId: string, amount: number, description: string = 'Pagamento Recebido') => {
      setStudents(prev => prev.map(s => {
          if (s.id === studentId) {
              const newBalance = s.balance + amount;
              const newHistory: StudentHistoryEntry = {
                  id: `pay-${Date.now()}`,
                  date: new Date(),
                  type: 'PAYMENT',
                  description: description,
                  value: amount,
                  balanceAfter: newBalance
              };
              return {
                  ...s,
                  balance: newBalance,
                  history: [newHistory, ...(s.history || [])]
              };
          }
          return s;
      }));
  };

  const handleStudentRefund = (studentId: string, amount: number, reason: string) => {
      setStudents(prev => prev.map(s => {
          if (s.id === studentId) {
              const newBalance = s.balance + amount;
              const newHistory: StudentHistoryEntry = {
                  id: `ref-${Date.now()}`,
                  date: new Date(),
                  type: 'REFUND',
                  description: `Estorno: ${reason}`,
                  value: amount,
                  balanceAfter: newBalance
              };
              return {
                  ...s,
                  balance: newBalance, 
                  history: [newHistory, ...(s.history || [])]
              };
          }
          return s;
      }));
  };

  const handleAddStudent = (student: Student) => setStudents(prev => [...prev, student]);
  const handleUpdateStudent = (student: Student) => setStudents(prev => prev.map(s => s.id === student.id ? student : s));
  const handleDeleteStudent = (id: string) => setStudents(prev => prev.filter(s => s.id !== id));
  
  const handleSyncStudents = (newStudents: Student[]) => {
    setStudents(prev => {
        const merged = [...prev];
        newStudents.forEach(newS => {
            const index = merged.findIndex(s => s.id === newS.id || (s.code && newS.code && s.code === newS.code));
            if (index >= 0) {
                merged[index] = { 
                    ...merged[index],
                    ...newS,
                    history: merged[index].history || [] 
                };
            } else {
                merged.push({ ...newS, history: [] });
            }
        });
        return merged;
    });
  };

  const handleRequestQuickRegister = () => {
      setActiveTab('CLIENTS');
      setTriggerNewStudent(true);
  };

  const handleAddProduct = (product: Product) => setProducts(prev => [...prev, product]);
  const handleUpdateProduct = (product: Product) => setProducts(prev => prev.map(p => p.id === product.id ? product : p));
  const handleDeleteProduct = (id: string) => setProducts(prev => prev.filter(p => p.id !== id));
  const handleImportProducts = (newProducts: Product[]) => setProducts(prev => [...prev, ...newProducts]);
  
  const handleSyncProducts = (newProducts: Product[]) => {
      setProducts(prev => {
        const merged = [...prev];
        newProducts.forEach(newP => {
            const index = merged.findIndex(p => p.id === newP.id);
            if (index >= 0) {
                merged[index] = newP;
            } else {
                merged.push(newP);
            }
        });
        return merged;
      });
  };

  if (viewMode === 'GUARDIAN') {
      return (
          <GuardianPortalView 
            students={students} 
            onExitPortal={() => window.location.hash = ''}
            onUpdateStudent={handleUpdateStudent}
          />
      );
  }

  return (
    <div className="flex h-screen bg-gray-100 text-gray-900 font-sans">
      <aside className="w-20 bg-gray-900 flex flex-col items-center py-6 shrink-0 z-20">
        <button 
          onClick={() => setActiveTab('POS')}
          className="mb-8 p-2 bg-brand-500 rounded-lg text-white hover:bg-brand-400 transition-colors shadow-lg shadow-brand-500/30"
          title="Voltar para Vendas"
        >
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v1c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
        </button>

        <nav className="flex flex-col gap-4 w-full px-2 flex-1">
          <NavButton 
            active={activeTab === 'DASHBOARD'} 
            onClick={() => setActiveTab('DASHBOARD')} 
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>}
            label="Início"
          />
          <NavButton 
            active={activeTab === 'POS'} 
            onClick={() => setActiveTab('POS')} 
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>}
            label="Vendas"
          />
          <NavButton 
            active={activeTab === 'CLIENTS'} 
            onClick={() => setActiveTab('CLIENTS')} 
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
            label="Alunos"
          />
          <NavButton 
            active={activeTab === 'BILLING'} 
            onClick={() => setActiveTab('BILLING')} 
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a4.5 4.5 0 0 0 0 9H14.5a4.5 4.5 0 0 1 0 9H6"/></svg>}
            label="Cobrança"
          />
          <NavButton 
            active={activeTab === 'PRODUCTS'} 
            onClick={() => setActiveTab('PRODUCTS')} 
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>}
            label="Produtos"
          />
          <NavButton 
            active={activeTab === 'REPORTS'} 
            onClick={() => setActiveTab('REPORTS')} 
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>}
            label="Relatórios"
          />
           <NavButton 
            active={activeTab === 'ACCESS'} 
            onClick={() => setActiveTab('ACCESS')} 
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
            label="Gestão"
          />
          <NavButton 
            active={activeTab === 'APIS'} 
            onClick={() => setActiveTab('APIS')} 
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>}
            label="APIs"
          />
          <NavButton 
            active={activeTab === 'SETTINGS'} 
            onClick={() => setActiveTab('SETTINGS')} 
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>}
            label="Config"
          />
        </nav>
        
        <div className="px-2 w-full mt-4">
            <button 
                onClick={() => window.location.hash = '#/portal'}
                className="w-full p-2 rounded-lg text-blue-300 hover:text-white hover:bg-gray-800 flex flex-col items-center gap-1 border-t border-gray-700 pt-4"
                title="Área do Responsável"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span className="text-[9px] font-bold">ÁREA DOS PAIS</span>
            </button>
        </div>

      </aside>

      <main className="flex-1 h-full overflow-hidden relative">
        {activeTab === 'DASHBOARD' && (
          <DashboardView products={products} transactions={transactions} />
        )}
        {activeTab === 'POS' && (
          <PosView 
            products={products}
            students={students}
            settings={settings}
            onTransactionComplete={handleTransactionComplete}
            onRequestQuickRegister={handleRequestQuickRegister}
          />
        )}
        {activeTab === 'CLIENTS' && (
          <CustomersView 
            students={students}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
            onReceivePayment={(id, amount, desc) => handleStudentPayment(id, amount, desc)}
            onRefundStudent={handleStudentRefund}
            onImportStudents={handleSyncStudents}
            initiateNewStudent={triggerNewStudent}
            onNewStudentInitiated={() => setTriggerNewStudent(false)}
          />
        )}
        {activeTab === 'BILLING' && (
            <BillingView students={students} />
        )}
        {activeTab === 'PRODUCTS' && (
          <ProductsView 
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onImportProducts={handleImportProducts}
          />
        )}
        {activeTab === 'REPORTS' && (
          <ReportsView 
            transactions={transactions} 
            students={students}
            onCancelTransaction={handleCancelTransaction}
          />
        )}
        {activeTab === 'ACCESS' && (
            <AccessManagementView 
                students={students}
                onUpdateStudent={handleUpdateStudent}
            />
        )}
        {activeTab === 'APIS' && (
          <ApiSettingsView 
            onSyncProducts={handleSyncProducts}
            onSyncStudents={handleSyncStudents}
          />
        )}
        {activeTab === 'SETTINGS' && (
          <SettingsView 
            settings={settings}
            onUpdateSettings={setSettings}
            onExportData={handleExportData}
            onImportData={handleImportData}
          />
        )}
      </main>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`w-full p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${active ? 'bg-brand-500 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
    title={label}
  >
    {icon}
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default App;
