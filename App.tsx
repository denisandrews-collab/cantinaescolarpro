import React, { useState, useEffect, useCallback } from 'react';
import { Product, Student, Transaction, SystemSettings, StudentHistoryEntry, SystemUser, Company, AppModule, CashEntry } from './types';
import { PRODUCTS, STUDENTS, SYSTEM_USERS } from './constants';
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
import { ExchangeView } from './components/ExchangeView';
import { SystemLoginView } from './components/SystemLoginView';
import { SuperAdminView } from './components/SuperAdminView'; 

type Tab = 'DASHBOARD' | 'POS' | 'CLIENTS' | 'BILLING' | 'PRODUCTS' | 'REPORTS' | 'EXCHANGE' | 'ACCESS' | 'APIS' | 'SETTINGS';

// === CONFIGURAÇÕES PADRÃO ===
const DEFAULT_SETTINGS: SystemSettings = {
    schoolName: 'Cantina Escolar',
    taxRate: 0,
    kitchenPrinter: { name: 'Cozinha Principal 2', ip: '192.168.6.4', port: '9100', enabled: true },
    counterPrinter: { name: 'Pre-Venda Cantina', ip: '192.168.6.5', port: '9100', enabled: true },
    printCustomerCopy: true,
    printKitchenCopy: true,
    paymentMethods: { money: true, creditCard: false, debitCard: false, pix: false, studentAccount: true },
    features: { allowNegativeBalance: true, enforceStockLimit: false, showStockAlerts: true, enableLoyaltySystem: true, blockOverdueStudents: false, maxOverdueDays: 30 }
};

// ... (Sanitizers mantidos) ...
const ensureValidStudentData = (data: any[]): Student[] => { 
    if (!Array.isArray(data)) return []; 
    return data.map(student => ({ 
        ...student, 
        id: student.id || Date.now().toString(), 
        name: student.name || 'Sem Nome', 
        history: Array.isArray(student.history) ? student.history.map((historyEntry: any) => ({ 
            ...historyEntry, 
            date: new Date(historyEntry.date), 
            items: historyEntry.items || [] 
        })) : [], 
        balance: typeof student.balance === 'number' ? student.balance : 0, 
        points: typeof student.points === 'number' ? student.points : 0, 
        isActive: student.isActive ?? true 
    })); 
};

const ensureValidProductData = (data: any[]): Product[] => { 
    if (!Array.isArray(data)) return []; 
    return data.map(product => ({ 
        ...product, 
        stock: typeof product.stock === 'number' ? product.stock : 0, 
        costPrice: typeof product.costPrice === 'number' ? product.costPrice : 0, 
        isActive: product.isActive ?? true, 
        isFavorite: product.isFavorite ?? false 
    })); 
};

const ensureValidTransactionData = (data: any[]): Transaction[] => { 
    if (!Array.isArray(data)) return []; 
    return data.map(transaction => ({ 
        ...transaction, 
        date: new Date(transaction.date), 
        status: transaction.status || 'VALID', 
        items: transaction.items || [] 
    })); 
};

const ensureValidSystemUserData = (data: any[]): SystemUser[] => { 
    if (!Array.isArray(data)) return []; 
    return data.map(user => ({ 
        ...user, 
        role: user.role || 'CASHIER' 
    })); 
};

const ensureValidSettingsData = (data: any): SystemSettings => { 
    if (!data || typeof data !== 'object') return DEFAULT_SETTINGS; 
    return { 
        ...DEFAULT_SETTINGS, 
        ...data, 
        features: { ...DEFAULT_SETTINGS.features, ...(data.features || {}) }, 
        paymentMethods: { ...DEFAULT_SETTINGS.paymentMethods, ...(data.paymentMethods || {}) }, 
        kitchenPrinter: { ...DEFAULT_SETTINGS.kitchenPrinter, ...(data.kitchenPrinter || {}) }, 
        counterPrinter: { ...DEFAULT_SETTINGS.counterPrinter, ...(data.counterPrinter || {}) } 
    }; 
};

const ensureValidCashEntryData = (data: any[]): CashEntry[] => { 
    if (!Array.isArray(data)) return []; 
    return data.map(cashEntry => ({ 
        ...cashEntry, 
        date: new Date(cashEntry.date) 
    })); 
};

const ensureValidCompanyData = (data: any[]): Company[] => { 
    if (!Array.isArray(data)) return []; 
    return data.map(company => ({ 
        ...company, 
        modules: Array.isArray(company.modules) ? company.modules : ['POS', 'FINANCIAL', 'INVENTORY', 'REPORTS'] 
    })); 
};

const loadScopedState = <T,>(companyId: string, key: string, fallback: T, sanitizer?: (data: any) => T): T => {
    const scopedKey = `${companyId}_${key}`;
    const saved = localStorage.getItem(scopedKey);
    if (saved) { try { const parsed = JSON.parse(saved); return sanitizer ? sanitizer(parsed) : parsed; } catch (e) { return fallback; } }
    return fallback;
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={`w-full p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${active ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/30' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`} title={label}>
        {icon}
        <span className="text-[10px] font-bold text-center leading-tight">{label}</span>
    </button>
);

// === TENANT APP ===
const TenantApp: React.FC<{ company: Company, onExit: () => void }> = ({ company, onExit }) => {
    const [currentUser, setCurrentUser] = useState<SystemUser | null>(() => {
        const saved = localStorage.getItem(`${company.id}_active_session`);
        return saved ? JSON.parse(saved) : null;
    });
    const [viewMode, setViewMode] = useState<'ADMIN' | 'GUARDIAN' | 'LOGIN'>(currentUser ? 'ADMIN' : 'LOGIN');
    const [activeTab, setActiveTab] = useState<Tab>('DASHBOARD');
    const [triggerNewStudent, setTriggerNewStudent] = useState(false);

    const [products, setProducts] = useState<Product[]>(() => loadScopedState(company.id, 'products', PRODUCTS, ensureValidProductData));
    const [students, setStudents] = useState<Student[]>(() => loadScopedState(company.id, 'students', STUDENTS, ensureValidStudentData));
    const [transactions, setTransactions] = useState<Transaction[]>(() => loadScopedState(company.id, 'transactions', [], ensureValidTransactionData));
    const [systemUsers, setSystemUsers] = useState<SystemUser[]>(() => loadScopedState(company.id, 'systemUsers', SYSTEM_USERS, ensureValidSystemUserData));
    const [settings, setSettings] = useState<SystemSettings>(() => loadScopedState(company.id, 'settings', DEFAULT_SETTINGS, ensureValidSettingsData));
    const [cashEntries, setCashEntries] = useState<CashEntry[]>(() => loadScopedState(company.id, 'cashEntries', [], ensureValidCashEntryData));

    useEffect(() => {
        localStorage.setItem(`${company.id}_products`, JSON.stringify(products));
        localStorage.setItem(`${company.id}_students`, JSON.stringify(students));
        localStorage.setItem(`${company.id}_transactions`, JSON.stringify(transactions));
        localStorage.setItem(`${company.id}_settings`, JSON.stringify(settings));
        localStorage.setItem(`${company.id}_systemUsers`, JSON.stringify(systemUsers));
        localStorage.setItem(`${company.id}_cashEntries`, JSON.stringify(cashEntries));
    }, [products, students, transactions, settings, systemUsers, cashEntries, company.id]);
    
    useEffect(() => {
        if (currentUser) localStorage.setItem(`${company.id}_active_session`, JSON.stringify(currentUser));
        else localStorage.removeItem(`${company.id}_active_session`);
    }, [currentUser, company.id]);

    useEffect(() => {
        const checkHash = () => {
            if (window.location.href.includes('portal') || window.location.hash.includes('portal')) {
                if (company.modules.includes('PARENTS_PORTAL')) {
                    setViewMode('GUARDIAN');
                }
            }
        };
        checkHash();
        window.addEventListener('hashchange', checkHash);
        return () => window.removeEventListener('hashchange', checkHash);
    }, [company.modules]);

    const handleLoginSuccess = (user: SystemUser) => { setCurrentUser(user); setViewMode('ADMIN'); };

    const handleImportData = (file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (json.products) localStorage.setItem(`${company.id}_products`, JSON.stringify(ensureValidProductData(json.products)));
                if (json.students) localStorage.setItem(`${company.id}_students`, JSON.stringify(ensureValidStudentData(json.students)));
                if (json.transactions) localStorage.setItem(`${company.id}_transactions`, JSON.stringify(ensureValidTransactionData(json.transactions)));
                if (json.settings) localStorage.setItem(`${company.id}_settings`, JSON.stringify(ensureValidSettingsData(json.settings)));
                if (json.systemUsers) localStorage.setItem(`${company.id}_systemUsers`, JSON.stringify(ensureValidSystemUserData(json.systemUsers)));
                if (json.cashEntries) localStorage.setItem(`${company.id}_cashEntries`, JSON.stringify(ensureValidCashEntryData(json.cashEntries)));
                alert('Backup restaurado! O sistema será reiniciado.');
                window.location.reload();
            } catch (error) { alert('Erro ao ler arquivo de backup.'); }
        };
        reader.readAsText(file);
    };

    const handleExportData = () => {
        const data = { version: '2.1', companyId: company.id, date: new Date(), products, students, transactions, settings, systemUsers, cashEntries };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Backup_${company.name}_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.json`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    const handleTransactionComplete = (transaction: Transaction) => {
        const newTransaction = { ...transaction, userId: currentUser?.id, userName: currentUser?.name, status: 'VALID' as const };
        setTransactions(previousTransactions => [...previousTransactions, newTransaction]);
        setProducts(previousProducts => previousProducts.map(product => {
            const cartItem = transaction.items.find(item => item.id === product.id);
            return cartItem && product.stock !== undefined ? { ...product, stock: Math.max(0, product.stock - cartItem.quantity) } : product;
        }));
        if (transaction.studentId) {
            setStudents(previousStudents => previousStudents.map(student => 
                student.id === transaction.studentId ? { 
                    ...student, 
                    balance: student.balance - transaction.total, 
                    points: (student.points || 0) + Math.floor(transaction.total), 
                    history: [{ 
                        id: transaction.id, 
                        date: transaction.date, 
                        type: 'PURCHASE', 
                        description: `Compra (${transaction.items.length} itens)`, 
                        value: transaction.total, 
                        items: transaction.items, 
                        balanceAfter: student.balance - transaction.total 
                    }, ...(student.history || [])] 
                } : student
            ));
        }
    };

    const updateStudent = (student: Student) => setStudents(previousStudents => previousStudents.map(existingStudent => existingStudent.id === student.id ? student : existingStudent));
    const addStudent = (student: Student) => setStudents(previousStudents => [...previousStudents, student]);
    const deleteStudent = (studentId: string) => setStudents(previousStudents => previousStudents.filter(student => student.id !== studentId));
    
    if (viewMode === 'GUARDIAN') return <GuardianPortalView students={students} onExitPortal={() => { setViewMode('LOGIN'); window.location.hash = ''; }} onUpdateStudent={updateStudent} />;
    if (viewMode === 'LOGIN') return <SystemLoginView users={systemUsers} onLogin={handleLoginSuccess} schoolName={settings.schoolName} onGoToPortal={() => company.modules.includes('PARENTS_PORTAL')} />;

    const hasModule = (module: AppModule) => company.modules.includes(module);

    return (
        <div className="flex h-screen bg-gray-100 text-gray-900 font-sans">
            <aside className="w-20 bg-gray-900 flex flex-col items-center py-6 shrink-0 z-20 print:hidden">
                {hasModule('ACCESS_CONTROL') && (
                    <button onClick={onExit} className="mb-4 w-full p-3 rounded-xl flex flex-col items-center gap-1 transition-all text-gray-400 hover:text-white hover:bg-gray-800" title="Sair da Empresa">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
                        <span className="text-[10px] font-bold text-center leading-tight">VOLTAR</span>
                    </button>
                )}
                <nav className="flex flex-col gap-4 w-full px-2 flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
                    <NavButton active={activeTab === 'DASHBOARD'} onClick={() => setActiveTab('DASHBOARD')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>} label="Dashboard" />
                    {hasModule('POS') && <NavButton active={activeTab === 'POS'} onClick={() => setActiveTab('POS')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>} label="POS" />}
                    {hasModule('FINANCIAL') && <NavButton active={activeTab === 'CLIENTS'} onClick={() => setActiveTab('CLIENTS')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>} label="Clientes" />}
                    {hasModule('FINANCIAL') && <NavButton active={activeTab === 'BILLING'} onClick={() => setActiveTab('BILLING')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a4.5 4.5 0 0 0 0 9H14.5a4.5 4.5 0 0 1 0 9H6"/></svg>} label="Cobrança" />}
                    {hasModule('INVENTORY') && <NavButton active={activeTab === 'PRODUCTS'} onClick={() => setActiveTab('PRODUCTS')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>} label="Produtos" />}
                    {hasModule('INVENTORY') && <NavButton active={activeTab === 'EXCHANGE'} onClick={() => setActiveTab('EXCHANGE')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>} label="Trocas" />}
                    {hasModule('REPORTS') && <NavButton active={activeTab === 'REPORTS'} onClick={() => setActiveTab('REPORTS')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>} label="Relatórios" />}
                    <div className="h-px bg-gray-700 w-full my-2"></div>
                    {hasModule('ACCESS_CONTROL') && <NavButton active={activeTab === 'ACCESS'} onClick={() => setActiveTab('ACCESS')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>} label="Acesso" />}
                    {hasModule('API_INTEGRATION') && <NavButton active={activeTab === 'APIS'} onClick={() => setActiveTab('APIS')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>} label="APIs" />}
                    
                    <NavButton active={activeTab === 'SETTINGS'} onClick={() => setActiveTab('SETTINGS')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>} label="Configurações" />
                </nav>
            </aside>

            <main className="flex-1 h-full overflow-hidden relative print:w-full print:h-auto print:overflow-visible">
                {activeTab === 'DASHBOARD' && <DashboardView products={products} transactions={transactions} students={students} />}
                {activeTab === 'POS' && <PosView 
                    products={products} 
                    students={students} 
                    settings={settings} 
                    onTransactionComplete={handleTransactionComplete} 
                    onRequestQuickRegister={() => { setActiveTab('CLIENTS'); setTriggerNewStudent(true); }} 
                    cashEntries={cashEntries} 
                    onAddCashEntry={(entry) => setCashEntries(previousEntries => [...previousEntries, entry])} 
                />}
                {activeTab === 'CLIENTS' && <CustomersView 
                    students={students} 
                    onAddStudent={addStudent} 
                    onUpdateStudent={updateStudent} 
                    onDeleteStudent={deleteStudent} 
                    onReceivePayment={(studentId, amount, description) => {
                        setStudents(previousStudents => previousStudents.map(student => student.id === studentId ? { 
                            ...student, 
                            balance: student.balance + amount,
                            history: [{ 
                                id: Date.now().toString(),
                                date: new Date(),
                                type: 'PAYMENT',
                                description: description || 'Pagamento',
                                value: amount,
                                balanceAfter: student.balance + amount
                            }, ...(student.history || [])]
                        } : student));
                    }} 
                    onRefundStudent={(studentId, amount, reason) => {
                         setStudents(previousStudents => previousStudents.map(student => student.id === studentId ? { 
                            ...student, 
                            balance: student.balance - amount,
                            history: [{ 
                                id: Date.now().toString(),
                                date: new Date(),
                                type: 'REFUND',
                                description: reason || 'Estorno',
                                value: amount,
                                balanceAfter: student.balance - amount
                            }, ...(student.history || [])]
                        } : student));
                    }}
                    onImportStudents={(importedStudents) => setStudents(previousStudents => [...previousStudents, ...importedStudents])}
                    initiateNewStudent={triggerNewStudent}
                    onNewStudentInitiated={() => setTriggerNewStudent(false)}
                />}
                {activeTab === 'BILLING' && <BillingView students={students} />}
                {activeTab === 'PRODUCTS' && <ProductsView 
                    products={products} 
                    onAddProduct={(product) => setProducts(previousProducts => [...previousProducts, product])} 
                    onUpdateProduct={(product) => setProducts(previousProducts => previousProducts.map(existingProduct => existingProduct.id === product.id ? product : existingProduct))} 
                    onDeleteProduct={(productId) => setProducts(previousProducts => previousProducts.filter(product => product.id !== productId))} 
                    onImportProducts={(importedProducts) => setProducts(previousProducts => [...previousProducts, ...importedProducts])} 
                    onToggleFavorite={(productId) => setProducts(previousProducts => previousProducts.map(product => product.id === productId ? {...product, isFavorite: !product.isFavorite} : product))} 
                />}
                {activeTab === 'REPORTS' && <ReportsView 
                    transactions={transactions} 
                    students={students} 
                    onCancelTransaction={(transactionId) => { 
                        setTransactions(previousTransactions => previousTransactions.filter(transaction => transaction.id !== transactionId)); 
                    }} 
                />}
                {activeTab === 'EXCHANGE' && <ExchangeView products={products} students={students} onConfirmExchange={() => { /* implementar se necessário */ }} />}
                {activeTab === 'ACCESS' && <AccessManagementView 
                    students={students} 
                    onUpdateStudent={updateStudent} 
                    systemUsers={systemUsers} 
                    onAddSystemUser={(user) => setSystemUsers(previousUsers => [...previousUsers, user])} 
                />}
                {activeTab === 'APIS' && <ApiSettingsView 
                    onSyncProducts={(syncedProducts) => setProducts(previousProducts => [...previousProducts, ...syncedProducts])} 
                    onSyncStudents={(syncedStudents) => setStudents(previousStudents => [...previousStudents, ...syncedStudents])} 
                />}
                {activeTab === 'SETTINGS' && <SettingsView settings={settings} onUpdateSettings={setSettings} onExportData={handleExportData} onImportData={handleImportData} />}
            </main>
        </div>
    );
};

// === ROOT APP ===
const App = () => {
    // Estado Global das Empresas (Super Admin)
    const [companies, setCompanies] = useState<Company[]>(() => {
        const saved = localStorage.getItem('companies');
        return saved ? ensureValidCompanyData(JSON.parse(saved)) : [];
    });

    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(() => {
        return localStorage.getItem('last_selected_company');
    });

    const [isPortalMode, setIsPortalMode] = useState(false);
    const [isSuperAdminMode, setIsSuperAdminMode] = useState(false);

    useEffect(() => { if (companies.length > 0) localStorage.setItem('companies', JSON.stringify(companies)); }, [companies]);
    useEffect(() => { if (selectedCompanyId) localStorage.setItem('last_selected_company', selectedCompanyId); else localStorage.removeItem('last_selected_company'); }, [selectedCompanyId]);

    // Hash check with Admin support
    useEffect(() => {
        const checkHash = () => {
            const url = window.location.href.toLowerCase();
            const hash = window.location.hash.toLowerCase();
            
            if (url.includes('portal') || hash.includes('portal')) {
                setIsPortalMode(true);
            } else if (hash.includes('admin')) {
                setIsSuperAdminMode(true);
                setSelectedCompanyId(null);
            } else {
                setIsPortalMode(false);
            }
        };
        checkHash();
        window.addEventListener('hashchange', checkHash);
        return () => window.removeEventListener('hashchange', checkHash);
    }, []);

    const [globalStudents, setGlobalStudents] = useState<Student[]>([]);
    useEffect(() => {
        if (isPortalMode) {
            const allStudents: Student[] = [];
            companies.forEach(company => {
                const companyStudents = loadScopedState(company.id, 'students', [], ensureValidStudentData);
                if (company.modules.includes('PARENTS_PORTAL')) {
                    companyStudents.forEach(student => allStudents.push({ ...student, notes: company.id }));
                }
            });
            setGlobalStudents(allStudents);
        }
    }, [isPortalMode, companies]);

    const handleGlobalUpdateStudent = (updatedStudent: Student) => {
        let foundCompanyId: string | null = null;
        for (const company of companies) {
            const existingStudents = loadScopedState(company.id, 'students', [], ensureValidStudentData);
            if (existingStudents.some(student => student.id === updatedStudent.id)) { 
                foundCompanyId = company.id; 
                break; 
            }
        }
        if (foundCompanyId) {
            const existingStudents = loadScopedState(foundCompanyId, 'students', [], ensureValidStudentData);
            const newStudentsList = existingStudents.map(student => student.id === updatedStudent.id ? updatedStudent : student);
            localStorage.setItem(`${foundCompanyId}_students`, JSON.stringify(newStudentsList));
            setGlobalStudents(previousStudents => previousStudents.map(student => student.id === updatedStudent.id ? updatedStudent : student));
        }
    };

    if (isPortalMode) {
        return <GuardianPortalView students={globalStudents} onExitPortal={() => { setIsPortalMode(false); window.location.hash = ''; }} onUpdateStudent={handleGlobalUpdateStudent} />;
    }

    const currentCompany = selectedCompanyId ? companies.find(company => company.id === selectedCompanyId) : null;

    if (!selectedCompanyId || !currentCompany || isSuperAdminMode) {
        return <SuperAdminView
            companies={companies}
            onSaveCompany={(company) => setCompanies(previousCompanies => { 
                const companyIndex = previousCompanies.findIndex(existingCompany => existingCompany.id === company.id); 
                const updatedCompanies = companyIndex >= 0 ? [...previousCompanies] : [...previousCompanies, company]; 
                if (companyIndex >= 0) updatedCompanies[companyIndex] = company; 
                localStorage.setItem('companies', JSON.stringify(updatedCompanies)); 
                return updatedCompanies; 
            })}
            onSelectCompany={(companyId) => { 
                setSelectedCompanyId(companyId); 
                setIsSuperAdminMode(false); 
                window.location.hash = ''; 
            }}
            onDeleteCompany={(companyId) => setCompanies(previousCompanies => { 
                const updatedCompanies = previousCompanies.filter(company => company.id !== companyId); 
                localStorage.setItem('companies', JSON.stringify(updatedCompanies)); 
                return updatedCompanies; 
            })}
        />;
    }

    return <TenantApp key={currentCompany.id} company={currentCompany} onExit={() => setSelectedCompanyId(null)} />;
};

export default App;