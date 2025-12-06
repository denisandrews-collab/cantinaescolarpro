
import React, { useState, useMemo } from 'react';
import { ProductCategory, Product, CartItem, Student, Transaction, SystemSettings } from '../types';
import { CategoryIcons } from '../constants';
import { Receipt } from './Receipt';
import { generateReceiptMessage } from '../services/geminiService';

interface PosViewProps {
  products: Product[];
  students: Student[];
  settings: SystemSettings;
  onTransactionComplete: (transaction: Transaction) => void;
  onRequestQuickRegister: () => void;
}

export const PosView: React.FC<PosViewProps> = ({ 
  products, 
  students, 
  settings,
  onTransactionComplete, 
  onRequestQuickRegister
}) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ALL'>('ALL');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Student Search State
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  
  // Transaction State
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  
  // Cash Payment Modal
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashReceived, setCashReceived] = useState('');

  // Computed
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.code?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, products]);

  const filteredStudents = useMemo(() => {
      if (!studentSearchQuery) return students;
      const q = studentSearchQuery.toLowerCase();
      return students.filter(s => 
          s.name.toLowerCase().includes(q) || 
          s.grade.toLowerCase().includes(q) ||
          s.code?.toLowerCase().includes(q)
      );
  }, [students, studentSearchQuery]);

  // Handlers
  const addToCart = (product: Product) => {
    // Basic stock validation
    if (product.stock !== undefined && product.stock <= 0) {
        return; // Do not add if no stock
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      
      // Check stock limit for existing item
      if (existing && product.stock !== undefined && existing.quantity >= product.stock) {
          return prev; // Hit stock limit
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
        
        if (product && product.stock !== undefined && newQty > product.stock) {
            return item; // Exceeds stock
        }

        return { ...item, quantity: Math.max(1, newQty) };
      }
      return item;
    }));
  };

  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowStudentModal(false);
    setStudentSearchQuery('');
  };

  const initiateCheckout = () => {
    if (cart.length === 0) return;
    
    if (selectedStudent) {
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
    const currentStudent = selectedStudent; // Capture current student

    // Calculate expected balance snapshot for receipt
    const snapshotBalance = currentStudent 
        ? currentStudent.balance - cartTotal 
        : undefined;

    // Create transaction immediately with default message
    const transaction: Transaction = {
      id: Date.now().toString(),
      items: currentCart,
      total: cartTotal,
      studentId: currentStudent?.id,
      studentName: currentStudent?.name,
      date: new Date(),
      aiMessage: "Processando mensagem...", // Mensagem temporária
      studentBalanceSnapshot: snapshotBalance,
      status: 'VALID'
    };

    // 1. Update Global State (FAST)
    onTransactionComplete(transaction);
    
    // 2. Show Receipt immediately (FAST)
    setLastTransaction(transaction);
    
    // 3. Clear Form
    setCart([]);
    setSelectedStudent(null);
    setIsProcessing(false);

    // 4. Fetch AI Message in Background (Does not block UI)
    generateReceiptMessage(currentStudent?.name || 'Aluno', currentCart).then(aiText => {
        // Update only the local receipt view when AI is ready
        setLastTransaction(prev => {
            if (prev && prev.id === transaction.id) {
                return { ...prev, aiMessage: aiText };
            }
            return prev;
        });
    });
  };

  const calculateChange = () => {
      const received = parseFloat(cashReceived);
      if (isNaN(received)) return 0;
      return received - cartTotal;
  };

  return (
    <div className="flex h-full overflow-hidden bg-gray-100">
      
      {/* LEFT SIDE: PRODUCT MENU */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2 text-brand-600">
            <h1 className="text-2xl font-bold tracking-tight text-gray-800">Nova <span className="text-brand-500">Venda</span></h1>
          </div>
          <div className="relative w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </span>
            <input 
              type="text" 
              placeholder="Buscar produto (Nome ou Cód)..." 
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-shadow"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {/* Categories */}
        <div className="p-4 bg-gray-50 border-b border-gray-200 flex gap-2 overflow-x-auto shrink-0 scrollbar-hide">
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
              const hasStock = product.stock === undefined || product.stock > 0;
              return (
              <button 
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={!hasStock}
                className={`flex flex-col bg-white rounded-xl shadow-sm border transition-all text-left overflow-hidden group h-full relative ${hasStock ? 'hover:shadow-md hover:border-green-300 border-gray-200' : 'opacity-60 cursor-not-allowed border-gray-200'}`}
              >
                {product.stock !== undefined && product.stock <= 10 && (
                     <span className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold rounded-full ${product.stock === 0 ? 'bg-gray-200 text-gray-600' : 'bg-red-100 text-red-600'}`}>
                         {product.stock === 0 ? 'Esgotado' : `Restam ${product.stock}`}
                     </span>
                )}
                <div className={`h-24 w-full flex items-center justify-center text-gray-300 transition-colors ${hasStock ? 'bg-gray-100 group-hover:bg-green-50' : 'bg-gray-100'}`}>
                  {CategoryIcons[product.category]}
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="font-semibold text-gray-800 text-sm mb-1">{product.name}</h3>
                  <div className="mt-auto flex justify-between items-center">
                    <span className="font-bold text-brand-600">R$ {product.price.toFixed(2)}</span>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${hasStock ? 'bg-gray-100 text-gray-500 group-hover:bg-brand-500 group-hover:text-white' : 'bg-gray-200 text-gray-400'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
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
            <div className={`bg-green-50 border border-green-200 rounded-lg p-3 ${selectedStudent.notes ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}>
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
               <div className="mt-1 flex justify-between text-sm">
                <span className="text-gray-600">Pontos XP:</span>
                <span className="font-bold text-yellow-600">
                  {selectedStudent.points || 0}
                </span>
              </div>
              
              {/* ALERTS SECTION */}
              {selectedStudent.notes && (
                  <div className="mt-2 bg-red-100 border border-red-200 p-2 rounded text-red-800 text-xs font-bold animate-pulse">
                      ⚠️ ALERTA: {selectedStudent.notes}
                  </div>
              )}

            </div>
          ) : (
            <button 
              onClick={() => setShowStudentModal(true)}
              className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-brand-500 hover:text-brand-500 hover:bg-brand-50 transition-all flex flex-col items-center gap-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" x2="20" y1="8" y2="14"/><line x1="23" x2="17" y1="11" y2="11"/></svg>
              <span className="font-medium">Selecionar Aluno</span>
            </button>
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
              <div key={item.id} className="flex gap-2 items-center bg-white border border-gray-100 p-2 rounded-lg shadow-sm">
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
            disabled={cart.length === 0 || isProcessing}
            onClick={initiateCheckout}
            className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${cart.length === 0 ? 'bg-gray-300 cursor-not-allowed' : selectedStudent ? 'bg-brand-600 hover:bg-brand-700 hover:shadow-brand-500/30' : 'bg-gray-800 hover:bg-gray-900'}`}
          >
            {isProcessing ? (
              <span className="animate-pulse">Processando...</span>
            ) : selectedStudent ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                Debitar da Conta
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a4.5 4.5 0 0 0 0 9H14.5a4.5 4.5 0 0 1 0 9H6"/></svg>
                Finalizar (Dinheiro)
              </>
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
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">Selecionar Aluno</h3>
              <button onClick={() => setShowStudentModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>
            <div className="p-4">
              <input 
                autoFocus
                type="text" 
                placeholder="Buscar por Nome, Turma ou Código..." 
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 mb-4"
              />
              <div className="max-h-80 overflow-y-auto space-y-2">
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
                    <div className="text-center py-4">
                        <p className="text-gray-500 mb-3">Nenhum aluno encontrado.</p>
                        <button 
                            onClick={() => { setShowStudentModal(false); onRequestQuickRegister(); }}
                            className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-brand-700"
                        >
                            + Cadastro Rápido
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
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                        <input 
                            autoFocus
                            type="number" 
                            step="0.01"
                            value={cashReceived}
                            onChange={(e) => setCashReceived(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 text-xl font-bold border-2 border-gray-300 rounded-lg focus:border-brand-500 focus:outline-none"
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
