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
const sanitizeStudents = (data: any[]): Student[] => { if (!Array.isArray(data)) return []; return data.map(s => ({ ...s, id: s.id || Date.now().toString(), name: s.name || 'Sem Nome', history: Array.isArray(s.history) ? s.history.map((h: any) => ({ ...h, date: new Date(h.date), items: h.items || [] })) : [], balance: typeof s.balance === 'number' ? s.balance : 0, points: typeof s.points === 'number' ? s.points : 0, isActive: s.isActive ?? true })); };
const sanitizeProducts = (data: any[]): Product[] => { if (!Array.isArray(data)) return []; return data.map(p => ({ ...p, stock: typeof p.stock === 'number' ? p.stock : 0, costPrice: typeof p.costPrice === 'number' ? p.costPrice : 0, isActive: p.isActive ?? true, isFavorite: p.isFavorite ?? false })); };
const sanitizeTransactions = (data: any[]): Transaction[] => { if (!Array.isArray(data)) return []; return data.map(t => ({ ...t, date: new Date(t.date), status: t.status || 'VALID', items: t.items || [] })); };
const sanitizeSystemUsers = (data: any[]): SystemUser[] => { if (!Array.isArray(data)) return []; return data.map(u => ({ ...u, role: u.role || 'CASHIER' })); };
/**
 * Helper para verificar se um valor é um objeto válido (não array, não null)
 */
const isValidObject = (value: any): boolean => {
    return value && typeof value === 'object' && !Array.isArray(value);
};

/**
 * Sanitiza configurações do sistema de forma segura
 * - Trata valores falsy (undefined, null, '') retornando configurações padrão
 * - Faz parse seguro de strings JSON, retornando configurações padrão em caso de erro
 * - Retorna deep clone para objetos (não muta entrada)
 * - Converte tipos primitivos (number, boolean) para configurações padrão
 */
const sanitizeSettings = (data: any): SystemSettings => {
    // Trata valores falsy - retorna configurações padrão
    if (!data) return { ...DEFAULT_SETTINGS };
    
    // Se for string, tenta fazer parse JSON de forma segura
    if (typeof data === 'string') {
        try {
            const parsed = JSON.parse(data);
            // Recursivamente sanitiza o resultado do parse
            return sanitizeSettings(parsed);
        } catch (e) {
            // Em caso de erro de parse, retorna configurações padrão
            return { ...DEFAULT_SETTINGS };
        }
    }
    
    // Se não for objeto (number, boolean, etc), retorna configurações padrão
    if (typeof data !== 'object') return { ...DEFAULT_SETTINGS };
    
    // Se for array, retorna configurações padrão (não é um objeto válido de configurações)
    if (Array.isArray(data)) return { ...DEFAULT_SETTINGS };
    
    // Deep clone do objeto sanitizado - não muta o original
    return {
        ...DEFAULT_SETTINGS,
        ...data,
        features: {
            ...DEFAULT_SETTINGS.features,
            ...(isValidObject(data.features) ? data.features : {})
        },
        paymentMethods: {
            ...DEFAULT_SETTINGS.paymentMethods,
            ...(isValidObject(data.paymentMethods) ? data.paymentMethods : {})
        },
        kitchenPrinter: {
            ...DEFAULT_SETTINGS.kitchenPrinter,
            ...(isValidObject(data.kitchenPrinter) ? data.kitchenPrinter : {})
        },
        counterPrinter: {
            ...DEFAULT_SETTINGS.counterPrinter,
            ...(isValidObject(data.counterPrinter) ? data.counterPrinter : {})
        }
    };
};
const sanitizeCashEntries = (data: any[]): CashEntry[] => { if (!Array.isArray(data)) return []; return data.map(c => ({ ...c, date: new Date(c.date) })); };
const sanitizeCompanies = (data: any[]): Company[] => { if (!Array.isArray(data)) return []; return data.map(c => ({ ...c, modules: Array.isArray(c.modules) ? c.modules : ['POS', 'FINANCIAL', 'INVENTORY', 'REPORTS'] })); };

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

    const [products, setProducts] = useState<Product[]>(() => loadScopedState(company.id, 'products', PRODUCTS, sanitizeProducts));
    const [students, setStudents] = useState<Student[]>(() => loadScopedState(company.id, 'students', STUDENTS, sanitizeStudents));
    const [transactions, setTransactions] = useState<Transaction[]>(() => loadScopedState(company.id, 'transactions', [], sanitizeTransactions));
    const [systemUsers, setSystemUsers] = useState<SystemUser[]>(() => loadScopedState(company.id, 'systemUsers', SYSTEM_USERS, sanitizeSystemUsers));
    const [settings, setSettings] = useState<SystemSettings>(() => loadScopedState(company.id, 'settings', DEFAULT_SETTINGS, sanitizeSettings));
    const [cashEntries, setCashEntries] = useState<CashEntry[]>(() => loadScopedState(company.id, 'cashEntries', [], sanitizeCashEntries));

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
        reader.onload = (e) => {
            try {
                const json = JSON.parse(e.target?.result as string);
                if (json.products) localStorage.setItem(`${company.id}_products`, JSON.stringify(sanitizeProducts(json.products)));
                if (json.students) localStorage.setItem(`${company.id}_students`, JSON.stringify(sanitizeStudents(json.students)));
                if (json.transactions) localStorage.setItem(`${company.id}_transactions`, JSON.stringify(sanitizeTransactions(json.transactions)));
                if (json.settings) localStorage.setItem(`${company.id}_settings`, JSON.stringify(sanitizeSettings(json.settings)));
                if (json.systemUsers) localStorage.setItem(`${company.id}_systemUsers`, JSON.stringify(sanitizeSystemUsers(json.systemUsers)));
                if (json.cashEntries) localStorage.setItem(`${company.id}_cashEntries`, JSON.stringify(sanitizeCashEntries(json.cashEntries)));
                alert('Backup restaurado! O sistema será reiniciado.');
                window.location.reload();
            } catch (err) { alert('Erro ao ler arquivo de backup.'); }
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

    const handleTransactionComplete = (t: Transaction) => {
        const newTx = { ...t, userId: currentUser?.id, userName: currentUser?.name, status: 'VALID' as const };
        setTransactions(prev => [...prev, newTx]);
        setProducts(prev => prev.map(p => {
            const item = t.items.find(i => i.id === p.id);
            return item && p.stock !== undefined ? { ...p, stock: Math.max(0, p.stock - item.quantity) } : p;
        }));
        if (t.studentId) {
            setStudents(prev => prev.map(s => s.id === t.studentId ? { ...s, balance: s.balance - t.total, points: (s.points || 0) + Math.floor(t.total), history: [{ id: t.id, date: t.date, type: 'PURCHASE', description: `Compra (${t.items.length} itens)`, value: t.total, items: t.items, balanceAfter: s.balance - t.total }, ...(s.history || [])] } : s));
        }
    };

    const updateStudent = (s: Student) => setStudents(prev => prev.map(old => old.id === s.id ? s : old));
    const addStudent = (s: Student) => setStudents(prev => [...prev, s]);
    const deleteStudent = (id: string) => setStudents(prev => prev.filter(s => s.id !== id));
    
    if (viewMode === 'GUARDIAN') return <GuardianPortalView students={students} onExitPortal={() => { setViewMode('LOGIN'); window.location.hash = ''; }} onUpdateStudent={updateStudent} />;
    if (viewMode === 'LOGIN') return <SystemLoginView users={systemUsers} onLogin={handleLoginSuccess} schoolName={settings.schoolName} onGoToPortal={() => company.modules.includes('PARENTS_PORTAL')} />;

    const hasModule = (mod: AppModule) => company.modules.includes(mod);

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
                {activeTab === 'POS' && <PosView products={products} students={students} settings={settings} onTransactionComplete={handleTransactionComplete} onRequestQuickRegister={() => { setActiveTab('CLIENTS'); setTriggerNewStudent(true); }} cashEntries={cashEntries} onAddCashEntry={(e) => setCashEntries(prev => [...prev, e])} />}
                {activeTab === 'CLIENTS' && <CustomersView 
                    students={students} 
                    onAddStudent={addStudent} 
                    onUpdateStudent={updateStudent} 
                    onDeleteStudent={deleteStudent} 
                    onReceivePayment={(id, amt, desc) => {
                        setStudents(prev => prev.map(s => s.id === id ? { 
                            ...s, 
                            balance: s.balance + amt,
                            history: [{ 
                                id: Date.now().toString(),
                                date: new Date(),
                                type: 'PAYMENT',
                                description: desc || 'Pagamento',
                                value: amt,
                                balanceAfter: s.balance + amt
                            }, ...(s.history || [])]
                        } : s));
                    }} 
                    onRefundStudent={(id, amt, reason) => {
                         setStudents(prev => prev.map(s => s.id === id ? { 
                            ...s, 
                            balance: s.balance - amt,
                            history: [{ 
                                id: Date.now().toString(),
                                date: new Date(),
                                type: 'REFUND',
                                description: reason || 'Estorno',
                                value: amt,
                                balanceAfter: s.balance - amt
                            }, ...(s.history || [])]
                        } : s));
                    }}
                    onImportStudents={(s) => setStudents(prev => [...prev, ...s])}
                    initiateNewStudent={triggerNewStudent}
                    onNewStudentInitiated={() => setTriggerNewStudent(false)}
                />}
                {activeTab === 'BILLING' && <BillingView students={students} />}
                {activeTab === 'PRODUCTS' && <ProductsView products={products} onAddProduct={(p) => setProducts(prev => [...prev, p])} onUpdateProduct={(p) => setProducts(prev => prev.map(old => old.id === p.id ? p : old))} onDeleteProduct={(id) => setProducts(prev => prev.filter(p => p.id !== id))} onImportProducts={(p) => setProducts(prev => [...prev, ...p])} onToggleFavorite={(id) => setProducts(p => p.map(prod => prod.id === id ? {...prod, isFavorite: !prod.isFavorite} : prod))} />}
                {activeTab === 'REPORTS' && <ReportsView transactions={transactions} students={students} onCancelTransaction={(id) => { setTransactions(prev => prev.filter(t => t.id !== id)); }} />}
                {activeTab === 'EXCHANGE' && <ExchangeView products={products} students={students} onConfirmExchange={() => { /* implementar se necessário */ }} />}
                {activeTab === 'ACCESS' && <AccessManagementView students={students} onUpdateStudent={updateStudent} systemUsers={systemUsers} onAddSystemUser={(u) => setSystemUsers(prev => [...prev, u])} />}
                {activeTab === 'APIS' && <ApiSettingsView onSyncProducts={(p) => setProducts(prev => [...prev, ...p])} onSyncStudents={(s) => setStudents(prev => [...prev, ...s])} />}
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
        return saved ? sanitizeCompanies(JSON.parse(saved)) : [];
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
            const all: Student[] = [];
            companies.forEach(c => {
                const s = loadScopedState(c.id, 'students', [], sanitizeStudents);
                if (c.modules.includes('PARENTS_PORTAL')) s.forEach(stu => all.push({ ...stu, notes: c.id }));
            });
            setGlobalStudents(all);
        }
    }, [isPortalMode, companies]);

    const handleGlobalUpdateStudent = (updatedStudent: Student) => {
        let foundCompanyId: string | null = null;
        for (const company of companies) {
            const existingStudents = loadScopedState(company.id, 'students', [], sanitizeStudents);
            if (existingStudents.some(s => s.id === updatedStudent.id)) { foundCompanyId = company.id; break; }
        }
        if (foundCompanyId) {
            const existingStudents = loadScopedState(foundCompanyId, 'students', [], sanitizeStudents);
            const newStudentsList = existingStudents.map(s => s.id === updatedStudent.id ? updatedStudent : s);
            localStorage.setItem(`${foundCompanyId}_students`, JSON.stringify(newStudentsList));
            setGlobalStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
        }
    };

    if (isPortalMode) {
        return <GuardianPortalView students={globalStudents} onExitPortal={() => { setIsPortalMode(false); window.location.hash = ''; }} onUpdateStudent={handleGlobalUpdateStudent} />;
    }

    const currentCompany = selectedCompanyId ? companies.find(c => c.id === selectedCompanyId) : null;

    if (!selectedCompanyId || !currentCompany || isSuperAdminMode) {
        return <SuperAdminView
            companies={companies}
            onSaveCompany={(c) => setCompanies(prev => { const idx = prev.findIndex(x => x.id === c.id); const updated = idx >= 0 ? [...prev] : [...prev, c]; if(idx >= 0) updated[idx] = c; localStorage.setItem('companies', JSON.stringify(updated)); return updated; })}
            onSelectCompany={(id) => { setSelectedCompanyId(id); setIsSuperAdminMode(false); window.location.hash = ''; }}
            onDeleteCompany={(id) => setCompanies(prev => { const upd = prev.filter(c => c.id !== id); localStorage.setItem('companies', JSON.stringify(upd)); return upd; })}
        />;
    }

    return <TenantApp key={currentCompany.id} company={currentCompany} onExit={() => setSelectedCompanyId(null)} />;
};

export default App;