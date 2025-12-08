import React, { useState, useMemo } from 'react';
import { ProductCategory, Product, CartItem, Student, Transaction, SystemSettings, CashEntry, PaymentMethod } from '../types';
import { CategoryIcons } from '../constants';
import { Receipt } from './Receipt';
import { generateReceiptMessage } from '../services/geminiService';
import { createPixCharge, PixChargeResponse } from '../services/itauService';
import { filterStudents, formatCurrency } from '../utils';

interface PosViewProps {
  products: Product[];
  students: Student[];
  settings: SystemSettings;
  onTransactionComplete: (transaction: Transaction) => void;
  onRequestQuickRegister: () => void;
  onToggleFavorite?: (productId: string) => void;
  onAddCashEntry?: (entry: CashEntry) => void;
  cashEntries?: CashEntry[];
}

export const PosView: React.FC<PosViewProps> = ({ 
  products, 
  students, 
  settings,
  onTransactionComplete, 
  onRequestQuickRegister,
  onToggleFavorite,
  onAddCashEntry,
  cashEntries = []
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ALL' | 'FAVORITES'>('ALL');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Student Search State (Modal)
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  
  // Transaction State
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [latestTransactionData, setLatestTransactionData] = useState<Transaction | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  
  // Cash Payment Modal
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashReceived, setCashReceived] = useState('');

  // Cash Management Modal
  const [showCashDrawerModal, setShowCashDrawerModal] = useState(false);
  const [cashType, setCashType] = useState<'IN' | 'OUT'>('IN');
  const [cashAmount, setCashAmount] = useState('');
  const [cashDesc, setCashDesc] = useState('');

  // PIX MODAL STATE
  const [showPixModal, setShowPixModal] = useState(false);
  const [pixData, setPixData] = useState<PixChargeResponse | null>(null);
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);

  // Computed
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (p.isActive === false) return false;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.code?.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (selectedCategory === 'FAVORITES') return p.isFavorite;
      if (selectedCategory === 'ALL') return true;
      return p.category === selectedCategory;
    });
  }, [selectedCategory, searchQuery, products]);

  const filteredStudents = useMemo(() => {
      return filterStudents(students, studentSearchQuery);
  }, [students, studentSearchQuery]);

  // OVERDUE LOGIC
  const checkOverdueStatus = (student: Student) => {
      if (!settings.features.blockOverdueStudents) return { isOverdue: false, days: 0 };
      if (student.balance >= 0) return { isOverdue: false, days: 0 };
      const history = [...student.history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      let debtStartDate: Date | null = null;
      for (const entry of history) {
          if (entry.balanceAfter !== undefined && entry.balanceAfter < 0) { if (debtStartDate === null) debtStartDate = new Date(entry.date); } 
          else if (entry.balanceAfter !== undefined && entry.balanceAfter >= 0) { debtStartDate = null; }
      }
      if (debtStartDate) {
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - debtStartDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          if (diffDays > settings.features.maxOverdueDays) return { isOverdue: true, days: diffDays };
      }
      return { isOverdue: false, days: 0 };
  };
  const overdueStatus = useMemo(() => { if (!selectedStudent) return { isOverdue: false, days: 0 }; return checkOverdueStatus(selectedStudent); }, [selectedStudent, settings.features.blockOverdueStudents, settings.features.maxOverdueDays]);

  // Handlers
  const addToCart = (product: Product) => {
    const enforceStock = settings.features.enforceStockLimit;
    if (enforceStock && product.stock !== undefined && product.stock <= 0) {
        alert('Produto sem estoque!'); return; 
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (enforceStock && existing && product.stock !== undefined && existing.quantity >= product.stock) {
          alert('Estoque insuficiente!'); return prev; 
      }
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(item => item.id !== productId));
  const updateQuantity = (productId: string, delta: number) => { setCart(prev => prev.map(item => { if (item.id === productId) { const newQty = item.quantity + delta; return { ...item, quantity: Math.max(1, newQty) }; } return item; })); };
  const addItemNote = (productId: string) => { const note = prompt("Obs:"); if (note !== null) setCart(prev => prev.map(item => item.id === productId ? { ...item, notes: note } : item)); };
  
  // Student Modal Selection
  const handleSelectStudent = (student: Student) => { 
      setSelectedStudent(student); 
      setShowStudentModal(false);
      setStudentSearchQuery(''); 
  };
  
  const handleSaveCashEntry = () => { if(onAddCashEntry) onAddCashEntry({ id: Date.now().toString(), date: new Date(), type: cashType, amount: parseFloat(cashAmount), value: cashType === 'IN' ? parseFloat(cashAmount) : -parseFloat(cashAmount), description: cashDesc }); setShowCashDrawerModal(false); setCashAmount(''); setCashDesc(''); alert('Movimentação registrada!'); };

  // --- PAYMENT HANDLERS ---
  const initiatePixPayment = async () => {
      setIsGeneratingPix(true);
      setShowPixModal(true);
      try {
          const response = await createPixCharge(cartTotal, `Venda Cantina`, settings.integrations?.itau?.pixKey || 'CHAVE-PADRAO');
          setPixData(response);
      } catch (err) { alert('Erro ao gerar Pix.'); setShowPixModal(false); } finally { setIsGeneratingPix(false); }
  };

  const initiateStudentAccountPayment = () => {
      if (selectedStudent) {
        if (overdueStatus.isOverdue) { alert(`ALUNO BLOQUEADO: Inadimplente há ${overdueStatus.days} dias.`); return; }
        if (!settings.features.allowNegativeBalance && (selectedStudent.balance - cartTotal) < 0) { alert('Saldo negativo não permitido.'); return; }
        processTransaction('ACCOUNT');
      } else {
        setShowStudentModal(true);
      }
  };

  const initiateCheckout = () => {
    if (cart.length === 0) return;
    if (selectedStudent) { initiateStudentAccountPayment(); } 
    else { setShowCashModal(true); setCashReceived(''); }
  };

  const processTransaction = async (method: PaymentMethod = 'MONEY') => {
    setIsProcessing(true);
    setShowCashModal(false);
    setShowPixModal(false);

    const currentCart = [...cart];
    const currentStudent = selectedStudent; 
    const snapshotBalance = (currentStudent && method === 'ACCOUNT') ? currentStudent.balance - cartTotal : currentStudent?.balance;

    const transaction: Transaction = {
      id: Date.now().toString(),
      items: currentCart,
      total: cartTotal,
      studentId: currentStudent?.id,
      studentName: currentStudent?.name,
      date: new Date(),
      aiMessage: "Processando...", 
      studentBalanceSnapshot: snapshotBalance,
      status: 'VALID',
      paymentMethod: method
    };

    onTransactionComplete(transaction);
    setLastTransaction(transaction); 
    setLatestTransactionData(transaction); 
    
    setCart([]);
    setSelectedStudent(null);
    setIsProcessing(false);
    setPixData(null);

    generateReceiptMessage(currentStudent?.name || 'Aluno', currentCart).then(aiText => {
        const updater = (prev: Transaction | null) => prev && prev.id === transaction.id ? { ...prev, aiMessage: aiText } : prev;
        setLastTransaction(updater);
        setLatestTransactionData(updater);
    });
  };

  const calculateChange = () => {
      const received = parseFloat(cashReceived);
      if (isNaN(received)) return 0;
      return received - cartTotal;
  };
  
  const handleQuickMoney = (amount: number) => { setCashReceived(amount.toString()); };

  const getStockBadgeClass = (stock: number) => {
      if (stock === 0) return 'bg-red-200 text-red-800';
      if (stock <= 10) return 'bg-yellow-200 text-yellow-800';
      return 'bg-green-200 text-green-800';
  };

  return (
    <div className="flex h-full overflow-hidden bg-gray-100">
      
      {/* LEFT SIDE: PRODUCT MENU */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-brand-600"><h1 className="text-2xl font-bold tracking-tight text-gray-800">Nova <span className="text-brand-500">Venda</span></h1></div>
             {latestTransactionData && <button onClick={() => setLastTransaction(latestTransactionData)} className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded flex items-center gap-1 font-bold transition-colors">Reimprimir Último</button>}
             <button onClick={() => setShowCashDrawerModal(true)} className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded flex items-center gap-1 font-bold transition-colors">Gestão de Caixa</button>
          </div>
          <div className="relative w-64">
            <input type="text" placeholder="Buscar produto..." className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </header>
        
        {/* Categories */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex gap-2 overflow-x-auto shrink-0 scrollbar-hide">
          <button onClick={() => setSelectedCategory('FAVORITES')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border ${selectedCategory === 'FAVORITES' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 'bg-white text-gray-600 border-transparent hover:bg-gray-100'}`}><span className="text-yellow-500">★</span> Favoritos</button>
          <button onClick={() => setSelectedCategory('ALL')} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${selectedCategory === 'ALL' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-200'}`}>Todos</button>
          {Object.values(ProductCategory).map((cat) => ( <button key={cat} onClick={() => setSelectedCategory(cat)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border ${selectedCategory === cat ? 'bg-brand-100 text-brand-700 border-brand-200' : 'bg-white text-gray-600 border-transparent hover:bg-gray-100'}`}>{CategoryIcons[cat]} {cat}</button> ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map(product => {
                  const stockCount = product.stock !== undefined ? product.stock : 999;
                  const isStockBlocked = settings.features.enforceStockLimit && stockCount <= 0;
                  return (
                  <button key={product.id} onClick={() => addToCart(product)} disabled={isStockBlocked} className={`flex flex-col bg-white rounded-xl shadow-sm border transition-all text-left overflow-hidden group h-full relative ${!isStockBlocked ? 'hover:shadow-md hover:border-green-300 border-gray-200' : 'opacity-60 cursor-not-allowed border-gray-200'}`}>
                    {product.stock !== undefined && <span className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold rounded-full shadow-sm z-10 ${getStockBadgeClass(stockCount)}`}>{stockCount === 0 ? 'Esgotado' : `${stockCount}`}</span>}
                    {product.isFavorite && <span className="absolute top-2 left-2 text-yellow-400 text-lg drop-shadow-md z-10">★</span>}
                    <div className={`h-32 w-full flex items-center justify-center relative overflow-hidden ${!isStockBlocked ? 'bg-gray-50' : 'bg-gray-100'}`}>
                      {product.image ? <img src={product.image} className="w-full h-full object-cover" /> : <div className="text-gray-300 transform scale-150">{CategoryIcons[product.category]}</div>}
                    </div>
                    <div className="p-3 flex flex-col flex-1"><h3 className="font-bold text-gray-800 text-sm mb-1 leading-tight line-clamp-2">{product.name}</h3><div className="mt-auto flex justify-between items-end"><span className="font-black text-lg text-brand-600">{formatCurrency(product.price)}</span></div></div>
                  </button>
                )})}
             </div>
        </div>
      </div>

      {/* RIGHT SIDE: CART */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col shrink-0 shadow-2xl z-10">
        
        {/* User Info (RESTORED MODAL BUTTON) */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex justify-between items-center mb-2"><h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Conta do Cliente</h2>{selectedStudent && <button onClick={() => setSelectedStudent(null)} className="text-xs text-red-500 hover:underline">Remover</button>}</div>
          {selectedStudent ? (
            <div className={`bg-green-50 border border-green-200 rounded-lg p-3 ${selectedStudent.notes || overdueStatus.isOverdue ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}>
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold text-lg">{selectedStudent.name.charAt(0)}</div><div><p className="font-bold text-gray-800 leading-tight">{selectedStudent.name}</p><p className="text-xs text-gray-500">{selectedStudent.grade}</p></div></div>
              <div className="mt-2 pt-2 border-t border-green-200 flex justify-between text-sm"><span className="text-gray-600">Saldo:</span><span className={`font-bold ${selectedStudent.balance < 0 ? 'text-red-500' : 'text-green-600'}`}>{formatCurrency(selectedStudent.balance)}</span></div>
              {overdueStatus.isOverdue && <div className="mt-2 bg-red-600 text-white p-2 rounded text-xs font-bold animate-pulse text-center">⛔ BLOQUEADO</div>}
            </div>
          ) : (
             settings.paymentMethods.studentAccount ? <button onClick={() => setShowStudentModal(true)} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-brand-500 font-bold text-sm">Selecionar Aluno (Modal)</button> : <div className="p-3 bg-gray-100 rounded text-center text-xs text-gray-500">Conta Aluno OFF</div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                    <div>
                        <p className="font-bold text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.quantity}x {formatCurrency(item.price)}</p>
                        {item.notes && <p className="text-[10px] text-orange-600 italic">Obs: {item.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="font-bold">{formatCurrency(item.quantity * item.price)}</p>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-500">x</button>
                    </div>
                </div>
            ))}
        </div>

        <div className="bg-white border-t p-6 shadow-lg">
            <div className="flex justify-between text-2xl font-black text-gray-900 mb-4"><span>TOTAL</span><span>R$ {cartTotal.toFixed(2)}</span></div>
            
            {/* DYNAMIC PAYMENT BUTTONS GRID */}
            <div className="grid grid-cols-2 gap-2 mb-2">
                {settings.paymentMethods.money && (
                    <button 
                        disabled={cart.length === 0 || isProcessing}
                        onClick={() => { setShowCashModal(true); setCashReceived(''); }}
                        className="py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Dinheiro
                    </button>
                )}

                {settings.paymentMethods.pix && (
                    <button 
                        disabled={cart.length === 0 || isProcessing}
                        onClick={initiatePixPayment}
                        className="py-3 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        Pix
                    </button>
                )}

                {settings.paymentMethods.creditCard && (
                    <button 
                        disabled={cart.length === 0 || isProcessing}
                        onClick={() => processTransaction('CREDIT')}
                        className="py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Crédito
                    </button>
                )}

                {settings.paymentMethods.debitCard && (
                    <button 
                        disabled={cart.length === 0 || isProcessing}
                        onClick={() => processTransaction('DEBIT')}
                        className="py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Débito
                    </button>
                )}

                {settings.paymentMethods.studentAccount && (
                    <button 
                        disabled={cart.length === 0 || isProcessing}
                        onClick={initiateStudentAccountPayment}
                        className="col-span-2 py-3 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                        {selectedStudent ? (overdueStatus.isOverdue ? 'Bloqueado' : 'Conta Aluno') : 'Conta Aluno (Selecionar)'}
                    </button>
                )}
            </div>
            
            {cart.length > 0 && (
                <button 
                    onClick={() => setCart([])}
                    className="w-full mt-2 py-2 text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                >
                    Cancelar Venda (Limpar)
                </button>
            )}
        </div>
      </div>

      {/* STUDENT MODAL (RESTORED) */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">Selecionar Aluno</h3>
              <button onClick={() => setShowStudentModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>
            <div className="p-4 flex-1 overflow-hidden flex flex-col">
              <input 
                autoFocus
                type="text" 
                placeholder="Buscar por Nome, Turma ou Código..." 
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 mb-4 shrink-0"
              />
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {filteredStudents.length > 0 ? (
                    filteredStudents.map(student => (
                    <button 
                        key={student.id}
                        onClick={() => handleSelectStudent(student)}
                        className="w-full text-left p-3 rounded-lg hover:bg-brand-50 border border-transparent hover:border-brand-200 transition-colors flex justify-between items-center group"
                    >
                        <div>
                        <p className="font-bold text-gray-800 group-hover:text-brand-700 flex items-center gap-2">
                            {student.name}
                            {student.isStaff && (
                                <span className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0.5 rounded uppercase font-bold">Func</span>
                            )}
                            {student.notes && <span className="text-red-500 text-xs">⚠️</span>}
                        </p>
                        <p className="text-sm text-gray-500">
                            {student.grade} {student.code && <span className="text-gray-400">• Cód: {student.code}</span>}
                        </p>
                        </div>
                        <div className="text-right">
                        <p className={`text-sm font-bold ${student.balance < 0 ? 'text-red-500' : 'text-green-600'}`}>
                            {student.balance < 0 ? `Deve R$ ${Math.abs(student.balance).toFixed(2)}` : `Crédito R$ ${student.balance.toFixed(2)}`}
                        </p>
                        </div>
                    </button>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">Nenhum aluno encontrado.</p>
                        <button 
                            onClick={() => { setShowStudentModal(false); onRequestQuickRegister(); }}
                            className="bg-brand-600 text-white px-6 py-3 rounded-lg text-sm font-bold hover:bg-brand-700 shadow-md w-full"
                        >
                            + Cadastrar Novo Aluno
                        </button>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CASH PAYMENT MODAL */}
      {showCashModal && ( 
          <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
                 <h3 className="text-xl font-black text-gray-800 mb-6 text-center">Pagamento em Dinheiro</h3>
                 <div className="mb-4 text-center"><p className="text-4xl font-black">R$ {cartTotal.toFixed(2)}</p></div>
                 <input autoFocus type="number" step="0.01" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} className="w-full p-3 text-xl font-bold border-2 rounded mb-4" placeholder="Valor Recebido" />
                 
                 <div className="flex flex-wrap gap-2 mb-4 justify-center">
                     {[2, 5, 10, 20, 50, 100].map(val => (
                         <button key={val} onClick={() => handleQuickMoney(val)} className="bg-green-100 text-green-800 px-3 py-1 rounded font-bold text-sm hover:bg-green-200">R$ {val}</button>
                     ))}
                 </div>
                 {parseFloat(cashReceived) >= cartTotal && <div className="bg-green-100 p-4 rounded mb-4 text-center"><p className="font-bold text-green-800">Troco: R$ {calculateChange().toFixed(2)}</p></div>}
                 
                 <div className="flex gap-2"> 
                    <button onClick={() => setShowCashModal(false)} className="flex-1 py-3 bg-gray-200 font-bold rounded">Cancelar</button> 
                    <button onClick={() => processTransaction('MONEY')} disabled={parseFloat(cashReceived) < cartTotal} className="flex-1 py-3 bg-green-600 text-white font-bold rounded disabled:opacity-50">Confirmar</button> 
                 </div> 
             </div> 
          </div> 
      )}
      
      {/* Pix Modal & Cash Drawer Modal (Omitted for brevity but logic exists) */}
      {showPixModal && ( <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"> <div className="bg-white p-6 rounded shadow-lg text-center"> <h3 className="font-bold text-lg mb-4">Pagamento Pix</h3> {isGeneratingPix ? <p>Gerando QR Code...</p> : pixData ? ( <div> <img src={pixData.qrCodeImage} className="mx-auto w-48 h-48" /> <p className="text-xs bg-gray-100 p-2 mt-2 font-mono break-all">{pixData.pixCopiaCola}</p> <button onClick={() => processTransaction('PIX')} className="mt-4 w-full bg-green-600 text-white py-2 rounded font-bold">Confirmar Pagamento</button> </div> ) : <p>Erro.</p>} <button onClick={() => setShowPixModal(false)} className="mt-2 text-gray-500">Cancelar</button> </div> </div> )}
      {showCashDrawerModal && ( <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"> <div className="bg-white p-6 rounded max-w-sm w-full"> <h3 className="font-bold text-lg mb-4">Gestão de Caixa</h3> <div className="flex gap-2 mb-4"> <button onClick={() => setCashType('IN')} className={`flex-1 py-2 rounded ${cashType==='IN'?'bg-green-100 text-green-700':'bg-gray-100'}`}>Suprimento</button> <button onClick={() => setCashType('OUT')} className={`flex-1 py-2 rounded ${cashType==='OUT'?'bg-red-100 text-red-700':'bg-gray-100'}`}>Sangria</button> </div> <input type="number" placeholder="Valor" value={cashAmount} onChange={e=>setCashAmount(e.target.value)} className="w-full border p-2 mb-2 rounded" /> <input type="text" placeholder="Motivo" value={cashDesc} onChange={e=>setCashDesc(e.target.value)} className="w-full border p-2 mb-4 rounded" /> <div className="flex gap-2"> <button onClick={()=>setShowCashDrawerModal(false)} className="flex-1 py-2 bg-gray-200 rounded">Cancelar</button> <button onClick={handleSaveCashEntry} className="flex-1 py-2 bg-blue-600 text-white rounded">Salvar</button> </div> </div> </div> )}
      
      {lastTransaction && <Receipt transaction={lastTransaction} settings={settings} onClose={() => setLastTransaction(null)} />}
    </div>
  );
};