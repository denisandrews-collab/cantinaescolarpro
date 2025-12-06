

import React, { useState, useMemo } from 'react';
import { ProductCategory, Product, CartItem, Student, Transaction, SystemSettings, CashEntry } from '../types';
import { CategoryIcons } from '../constants';
import { Receipt } from './Receipt';
import { generateReceiptMessage } from '../services/geminiService';

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
  cashEntries
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ALL' | 'FAVORITES'>('ALL');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Student Search State
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  
  // Transaction State
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  // Separate state to hold data for "Reprint Last" button even after modal closes
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

  // Computed
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Must be active to show in POS
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
      if (!studentSearchQuery) return students.filter(s => s.isActive !== false); // Only show active
      const q = studentSearchQuery.toLowerCase();
      return students.filter(s => 
          (s.isActive !== false) && // Filter out inactive students
          (s.name.toLowerCase().includes(q) || 
          s.grade.toLowerCase().includes(q) ||
          s.code?.toLowerCase().includes(q))
      );
  }, [students, studentSearchQuery]);

  // OVERDUE LOGIC
  const checkOverdueStatus = (student: Student) => {
      if (!settings.features.blockOverdueStudents) return { isOverdue: false, days: 0 };
      if (student.balance >= 0) return { isOverdue: false, days: 0 };

      const history = [...student.history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      let debtStartDate: Date | null = null;

      for (const entry of history) {
          if (entry.balanceAfter !== undefined && entry.balanceAfter < 0) {
              if (debtStartDate === null) {
                  debtStartDate = new Date(entry.date);
              }
          } else if (entry.balanceAfter !== undefined && entry.balanceAfter >= 0) {
              debtStartDate = null; // Debt cleared here
          }
      }

      if (debtStartDate) {
          const today = new Date();
          const diffTime = Math.abs(today.getTime() - debtStartDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
          
          if (diffDays > settings.features.maxOverdueDays) {
              return { isOverdue: true, days: diffDays };
          }
      }

      return { isOverdue: false, days: 0 };
  };

  const overdueStatus = useMemo(() => {
      if (!selectedStudent) return { isOverdue: false, days: 0 };
      return checkOverdueStatus(selectedStudent);
  }, [selectedStudent, settings.features.blockOverdueStudents, settings.features.maxOverdueDays]);


  // Handlers
  const addToCart = (product: Product) => {
    // Stock validation based on settings
    const enforceStock = settings.features.enforceStockLimit;
    if (enforceStock && product.stock !== undefined && product.stock <= 0) {
        alert('Produto sem estoque!');
        return; 
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      
      // Check stock limit for existing item if enforced
      if (enforceStock && existing && product.stock !== undefined && existing.quantity >= product.stock) {
          alert('Estoque insuficiente!');
          return prev; 
      }

      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === productId) {
        // Find product to check stock
        const product = products.find(p => p.id === productId);
        const newQty = item.quantity + delta;
        const enforceStock = settings.features.enforceStockLimit;
        
        if (enforceStock && product && product.stock !== undefined && newQty > product.stock) {
            return item; // Exceeds stock
        }

        return { ...item, quantity: Math.max(1, newQty) };
      }
      return item;
    }));
  };

  const addItemNote = (productId: string) => {
      const note = prompt("Adicionar observação para cozinha (ex: Sem cebola, Bem passado):");
      if (note !== null) {
          setCart(prev => prev.map(item => item.id === productId ? { ...item, notes: note } : item));
      }
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowStudentModal(false);
    setStudentSearchQuery('');
  };

  const handleSaveCashEntry = () => {
      if (!cashAmount || !cashDesc || !onAddCashEntry) return;
      onAddCashEntry({
          id: Date.now().toString(),
          date: new Date(),
          type: cashType,
          amount: parseFloat(cashAmount),
          value: cashType === 'IN' ? parseFloat(cashAmount) : -parseFloat(cashAmount),
          description: cashDesc
      });
      setShowCashDrawerModal(false);
      setCashAmount('');
      setCashDesc('');
      alert('Movimentação registrada com sucesso!');
  };

  const initiateCheckout = () => {
    if (cart.length === 0) return;
    
    if (selectedStudent) {
        // Block overdue
        if (overdueStatus.isOverdue) {
            alert(`ALUNO BLOQUEADO: Inadimplente há ${overdueStatus.days} dias. Máximo permitido: ${settings.features.maxOverdueDays} dias.`);
            return;
        }

        if (!settings.features.allowNegativeBalance) {
            const potentialBalance = selectedStudent.balance - cartTotal;
            if (potentialBalance < 0) {
                alert('Configuração não permite saldo negativo para alunos.');
                return;
            }
        }
        // Debit Account directly
        processTransaction();
    } else {
        // Cash Payment - Open calculator
        setShowCashModal(true);
        setCashReceived('');
    }
  };

  const processTransaction = async () => {
    setIsProcessing(true);
    setShowCashModal(false);

    // Snapshot cart before clearing
    const currentCart = [...cart];
    const currentStudent = selectedStudent; 

    // Calculate expected balance snapshot for receipt
    const snapshotBalance = currentStudent 
        ? currentStudent.balance - cartTotal 
        : undefined;

    // Create transaction immediately 
    const transaction: Transaction = {
      id: Date.now().toString(),
      items: currentCart,
      total: cartTotal,
      studentId: currentStudent?.id,
      studentName: currentStudent?.name,
      date: new Date(),
      aiMessage: "Processando mensagem...", 
      studentBalanceSnapshot: snapshotBalance,
      status: 'VALID'
    };

    onTransactionComplete(transaction);
    setLastTransaction(transaction); // Shows modal
    setLatestTransactionData(transaction); // Saves for reprint
    
    setCart([]);
    setSelectedStudent(null);
    setIsProcessing(false);

    // AI Message
    generateReceiptMessage(currentStudent?.name || 'Aluno', currentCart).then(aiText => {
        // Update both states to ensure consistency
        const updater = (prev: Transaction | null) => {
            if (prev && prev.id === transaction.id) {
                return { ...prev, aiMessage: aiText };
            }
            return prev;
        };
        setLastTransaction(updater);
        setLatestTransactionData(updater);
    });
  };

  const calculateChange = () => {
      const received = parseFloat(cashReceived);
      if (isNaN(received)) return 0;
      return received - cartTotal;
  };

  const getStockBadgeClass = (stock: number) => {
      if (stock === 0) return 'bg-red-200 text-red-800';
      if (stock <= 10) return 'bg-yellow-200 text-yellow-800';
      return 'bg-green-200 text-green-800';
  };

  return (
    <div className="flex h-full overflow-hidden bg-gray-100">
      
      {/* LEFT SIDE: PRODUCT MENU */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 text-brand-600">
                <h1 className="text-2xl font-bold tracking-tight text-gray-800">Nova <span className="text-brand-500">Venda</span></h1>
             </div>
             
             {/* REPRINT BUTTON */}
             {latestTransactionData && (
                 <button 
                    onClick={() => setLastTransaction(latestTransactionData)} // Re-open receipt modal
                    className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded flex items-center gap-1 font-bold transition-colors"
                    title="Reabrir comprovante da última venda"
                 >
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                     Reimprimir Último
                 </button>
             )}

             {/* CASH MANAGEMENT BUTTON */}
             <button 
                onClick={() => setShowCashDrawerModal(true)}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1.5 rounded flex items-center gap-1 font-bold transition-colors"
                title="Sangria ou Suprimento"
             >
                 <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01m12 0h.01"/></svg>
                 Gestão de Caixa
             </button>
          </div>
          <div className="relative w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </span>
            <input 
              type="text" 
              placeholder="Buscar produto..." 
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {/* Categories */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex gap-2 overflow-x-auto shrink-0 scrollbar-hide">
          <button 
            onClick={() => setSelectedCategory('FAVORITES')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border ${selectedCategory === 'FAVORITES' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 'bg-white text-gray-600 border-transparent hover:bg-gray-100'}`}
          >
              <span className="text-yellow-500">★</span> Favoritos
          </button>
          <button 
            onClick={() => setSelectedCategory('ALL')}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${selectedCategory === 'ALL' ? 'bg-gray-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-200'}`}
          >
            Todos
          </button>
          {Object.values(ProductCategory).map((cat) => (
            <button 
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors border ${selectedCategory === cat ? 'bg-brand-100 text-brand-700 border-brand-200' : 'bg-white text-gray-600 border-transparent hover:bg-gray-100'}`}
            >
              {CategoryIcons[cat]}
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(product => {
              const stockCount = product.stock !== undefined ? product.stock : 999;
              // Check settings to see if we should disable button
              const isStockBlocked = settings.features.enforceStockLimit && stockCount <= 0;
              
              return (
              <button 
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={isStockBlocked}
                className={`flex flex-col bg-white rounded-xl shadow-sm border transition-all text-left overflow-hidden group h-full relative ${!isStockBlocked ? 'hover:shadow-md hover:border-green-300 border-gray-200' : 'opacity-60 cursor-not-allowed border-gray-200'}`}
              >
                {product.stock !== undefined && (
                     <span className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold rounded-full shadow-sm z-10 ${getStockBadgeClass(stockCount)}`}>
                         {stockCount === 0 ? 'Esgotado' : `${stockCount}`}
                     </span>
                )}
                
                {product.isFavorite && (
                    <span className="absolute top-2 left-2 text-yellow-400 text-lg drop-shadow-md z-10">★</span>
                )}
                
                {/* IMAGE AREA */}
                <div className={`h-32 w-full flex items-center justify-center relative overflow-hidden ${!isStockBlocked ? 'bg-gray-50' : 'bg-gray-100'}`}>
                  {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
                      />
                  ) : (
                      <div className="text-gray-300 transform scale-150 group-hover:scale-125 transition-transform duration-300">
                        {CategoryIcons[product.category]}
                      </div>
                  )}
                  {/* Overlay for hover effect */}
                  {!isStockBlocked && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                  )}
                </div>

                <div className="p-3 flex flex-col flex-1">
                  <h3 className="font-bold text-gray-800 text-sm mb-1 leading-tight line-clamp-2">{product.name}</h3>
                  <div className="mt-auto flex justify-between items-end">
                    <span className="font-black text-lg text-brand-600">R$ {product.price.toFixed(2)}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm ${!isStockBlocked ? 'bg-gray-900 text-white group-hover:bg-brand-500' : 'bg-gray-200 text-gray-400'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
                    </div>
                  </div>
                </div>
              </button>
            )})}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: CART & CHECKOUT */}
      <div className="w-96 bg-white border-l border-gray-200 flex flex-col shrink-0 shadow-2xl z-10">
        
        {/* User Info / Selection */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide">Conta do Cliente</h2>
            {selectedStudent && (
               <button onClick={() => setSelectedStudent(null)} className="text-xs text-red-500 hover:underline">Remover</button>
            )}
          </div>
          
          {selectedStudent ? (
            <div className={`bg-green-50 border border-green-200 rounded-lg p-3 ${selectedStudent.notes || overdueStatus.isOverdue ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold text-lg">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-800 leading-tight">{selectedStudent.name}</p>
                  <p className="text-xs text-gray-500">
                      {selectedStudent.grade} {selectedStudent.code && `• ${selectedStudent.code}`}
                  </p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-green-200 flex justify-between text-sm">
                <span className="text-gray-600">Saldo Atual:</span>
                <span className={`font-bold ${selectedStudent.balance < 0 ? 'text-red-500' : 'text-green-600'}`}>
                  R$ {selectedStudent.balance.toFixed(2)}
                </span>
              </div>
               {settings.features.enableLoyaltySystem && (
                   <div className="mt-1 flex justify-between text-sm">
                    <span className="text-gray-600">Pontos XP:</span>
                    <span className="font-bold text-yellow-600">
                    {selectedStudent.points || 0}
                    </span>
                </div>
               )}
              
              {/* OVERDUE ALERT */}
              {overdueStatus.isOverdue && (
                  <div className="mt-2 bg-red-600 text-white p-2 rounded text-xs font-bold animate-pulse text-center">
                      ⛔ BLOQUEADO: ATRASO DE {overdueStatus.days} DIAS
                  </div>
              )}

              {/* ALERTS SECTION */}
              {selectedStudent.notes && (
                  <div className="mt-2 bg-red-100 border border-red-200 p-2 rounded text-red-800 text-xs font-bold">
                      ⚠️ ALERTA: {selectedStudent.notes}
                  </div>
              )}

            </div>
          ) : (
            settings.paymentMethods.studentAccount ? (
                <button 
                onClick={() => setShowStudentModal(true)}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-brand-500 hover:text-brand-500 hover:bg-brand-50 transition-all flex flex-col items-center gap-1"
                >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" x2="20" y1="8" y2="14"/><line x1="23" x2="17" y1="11" y2="11"/></svg>
                <span className="font-medium">Selecionar Aluno</span>
                </button>
            ) : (
                <div className="p-3 bg-gray-100 rounded text-center text-xs text-gray-500">
                    Venda em Conta Aluno desativada.
                </div>
            )
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
               <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
               <p className="mt-2 text-sm">Carrinho vazio</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex flex-col bg-white border border-gray-100 p-2 rounded-lg shadow-sm gap-2">
                <div className="flex gap-2 items-center">
                    <div className="w-10 h-10 rounded bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                    {CategoryIcons[item.category]}
                    </div>
                    <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">R$ {item.price.toFixed(2)} un</p>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                    <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm hover:text-red-500 text-gray-600 font-bold">-</button>
                    <span className="text-sm font-bold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm hover:text-green-500 text-gray-600 font-bold">+</button>
                    </div>
                    <div className="text-right min-w-[3rem]">
                    <p className="text-sm font-bold text-gray-900">{(item.price * item.quantity).toFixed(2)}</p>
                    <button onClick={() => removeFromCart(item.id)} className="text-xs text-red-400 hover:text-red-600">x</button>
                    </div>
                </div>
                {/* Item Actions */}
                <div className="flex justify-start gap-2 pl-12">
                    <button 
                        onClick={() => addItemNote(item.id)}
                        className={`text-[10px] flex items-center gap-1 px-2 py-0.5 rounded border ${item.notes ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                        {item.notes ? `Obs: ${item.notes}` : 'Adicionar Obs'}
                    </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals & Checkout */}
        <div className="bg-white border-t border-gray-200 p-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-2 text-gray-600">
            <span>Subtotal</span>
            <span>R$ {cartTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center mb-6 text-2xl font-black text-gray-900">
            <span>TOTAL</span>
            <span>R$ {cartTotal.toFixed(2)}</span>
          </div>

          <button 
            disabled={
                cart.length === 0 || 
                isProcessing || 
                (!selectedStudent && !settings.paymentMethods.money) ||
                (!!selectedStudent && overdueStatus.isOverdue)
            }
            onClick={initiateCheckout}
            className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${
                cart.length === 0 ? 'bg-gray-300 cursor-not-allowed' : 
                (selectedStudent && overdueStatus.isOverdue) ? 'bg-red-400 cursor-not-allowed' :
                selectedStudent ? 'bg-brand-600 hover:bg-brand-700 hover:shadow-brand-500/30' : 'bg-gray-800 hover:bg-gray-900'
            }`}
          >
            {isProcessing ? (
              <span className="animate-pulse">Processando...</span>
            ) : selectedStudent ? (
              overdueStatus.isOverdue ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" x2="19.07" y1="4.93" y2="19.07"/></svg>
                    Venda Bloqueada
                  </>
              ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                    Debitar da Conta
                  </>
              )
            ) : (
              settings.paymentMethods.money ? (
                <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a4.5 4.5 0 0 0 0 9H14.5a4.5 4.5 0 0 1 0 9H6"/></svg>
                    Finalizar (Dinheiro)
                </>
              ) : (
                  <span>Selecione um Aluno</span>
              )
            )}
          </button>
          
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

      {/* MODAL: Student Selection */}
      {showStudentModal && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4 backdrop-blur-sm">
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

      {/* MODAL: Cash Payment & Change */}
      {showCashModal && (
          <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4 backdrop-blur-sm">
             <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
                 <h3 className="text-xl font-black text-gray-800 mb-6 text-center">Pagamento em Dinheiro</h3>
                 
                 <div className="mb-4 text-center">
                     <p className="text-sm text-gray-500 uppercase font-bold">Total a Pagar</p>
                     <p className="text-4xl font-black text-gray-900">R$ {cartTotal.toFixed(2)}</p>
                 </div>

                 <div className="mb-6">
                     <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-bold text-gray-600">Valor Recebido</label>
                        <button 
                            onClick={() => setCashReceived(cartTotal.toString())}
                            className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-2 py-1 rounded font-bold transition-colors"
                        >
                            VALOR EXATO
                        </button>
                     </div>
                     <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">R$</span>
                        <input 
                            autoFocus
                            type="number" 
                            step="0.01"
                            value={cashReceived}
                            onChange={(e) => setCashReceived(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 text-xl font-bold border-2 border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:border-brand-500 focus:outline-none"
                            placeholder="0.00"
                        />
                     </div>
                 </div>

                 {parseFloat(cashReceived) >= cartTotal && (
                     <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-center animate-in zoom-in duration-200">
                         <p className="text-xs text-green-600 font-bold uppercase">Troco</p>
                         <p className="text-3xl font-black text-green-700">R$ {calculateChange().toFixed(2)}</p>
                     </div>
                 )}

                 <div className="flex gap-3">
                     <button 
                        onClick={() => setShowCashModal(false)}
                        className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300"
                     >
                         Cancelar
                     </button>
                     <button 
                        disabled={parseFloat(cashReceived) < cartTotal}
                        onClick={processTransaction}
                        className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                         Confirmar
                     </button>
                 </div>
             </div>
          </div>
      )}

      {/* CASH DRAWER MODAL */}
      {showCashDrawerModal && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01m12 0h.01"/></svg>
                      Gestão de Caixa
                  </h3>
                  
                  <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
                      <button 
                        onClick={() => setCashType('IN')}
                        className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${cashType === 'IN' ? 'bg-green-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
                      >
                          Suprimento (Entrada)
                      </button>
                      <button 
                        onClick={() => setCashType('OUT')}
                        className={`flex-1 py-2 rounded-md font-bold text-sm transition-all ${cashType === 'OUT' ? 'bg-red-600 text-white shadow' : 'text-gray-600 hover:bg-gray-200'}`}
                      >
                          Sangria (Saída)
                      </button>
                  </div>

                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Valor</label>
                          <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                              <input 
                                  type="number" 
                                  step="0.01" 
                                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg font-bold text-lg focus:outline-none focus:border-brand-500"
                                  placeholder="0.00"
                                  value={cashAmount}
                                  onChange={(e) => setCashAmount(e.target.value)}
                              />
                          </div>
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-1">Descrição / Motivo</label>
                          <input 
                              type="text" 
                              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                              placeholder="Ex: Troco inicial, Pagamento Fornecedor..."
                              value={cashDesc}
                              onChange={(e) => setCashDesc(e.target.value)}
                          />
                      </div>
                  </div>

                  <div className="flex gap-3 mt-8">
                      <button onClick={() => setShowCashDrawerModal(false)} className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300">Cancelar</button>
                      <button onClick={handleSaveCashEntry} className="flex-1 py-3 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700">Confirmar</button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL: Receipt / Print */}
      {lastTransaction && (
        <Receipt 
          transaction={lastTransaction} 
          settings={settings}
          onClose={() => setLastTransaction(null)} 
        />
      )}
      
    </div>
  );
};