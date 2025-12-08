
import React, { useState, useMemo } from 'react';
import { Product, Student } from '../types';
import { filterStudents } from '../utils';

interface ExchangeViewProps {
  products: Product[];
  students: Student[];
  onConfirmExchange: (studentId: string | null, productsIn: Product[], productsOut: Product[], priceDiff: number, payDifferenceInCash: boolean) => void;
}

export const ExchangeView: React.FC<ExchangeViewProps> = ({ products, students, onConfirmExchange }) => {
  const [searchIn, setSearchIn] = useState('');
  const [searchOut, setSearchOut] = useState('');
  const [searchStudent, setSearchStudent] = useState('');
  
  const [productsIn, setProductsIn] = useState<Product[]>([]);
  const [productsOut, setProductsOut] = useState<Product[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  const [payDifferenceInCash, setPayDifferenceInCash] = useState(false);

  // Filter Logic
  const filteredProductsIn = useMemo(() => {
    if(!searchIn) return [];
    const q = searchIn.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q));
  }, [products, searchIn]);

  const filteredProductsOut = useMemo(() => {
    if(!searchOut) return [];
    const q = searchOut.toLowerCase();
    // Only show active products for outgoing
    return products.filter(p => 
        (p.isActive !== false) && 
        (p.name.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q))
    );
  }, [products, searchOut]);

  const filteredStudents = useMemo(() => {
      if (!searchStudent) return [];
      return filterStudents(students, searchStudent);
  }, [students, searchStudent]);

  // Calculations
  const totalIn = productsIn.reduce((sum, p) => sum + p.price, 0);
  const totalOut = productsOut.reduce((sum, p) => sum + p.price, 0);
  const priceDiff = totalOut - totalIn;

  // Handlers Incoming
  const addProductIn = (p: Product) => {
      setProductsIn(prev => [...prev, p]);
      setSearchIn('');
  };

  const removeProductIn = (index: number) => {
      setProductsIn(prev => prev.filter((_, i) => i !== index));
  };

  // Handlers Outgoing
  const addProductOut = (p: Product) => {
      setProductsOut(prev => [...prev, p]);
      setSearchOut('');
  };

  const removeProductOut = (index: number) => {
      setProductsOut(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
      if(productsIn.length > 0 && productsOut.length > 0) {
          if (priceDiff !== 0 && !selectedStudent && !payDifferenceInCash) {
              if(!window.confirm('Não há aluno selecionado. A diferença de valor deve ser acertada no Caixa (Dinheiro). Confirmar troca?')) {
                  return;
              }
          }
          onConfirmExchange(selectedStudent?.id || null, productsIn, productsOut, priceDiff, payDifferenceInCash);
          
          // Reset
          setProductsIn([]);
          setProductsOut([]);
          setSelectedStudent(null);
          setSearchIn('');
          setSearchOut('');
          setSearchStudent('');
          setPayDifferenceInCash(false);
      }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50 overflow-hidden">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>
            Troca de Produtos
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 overflow-hidden">
            
            {/* LEFT: INCOMING (RETURN) */}
            <div className="bg-white rounded-xl shadow-sm border border-red-200 flex flex-col overflow-hidden">
                <div className="p-4 bg-red-50 border-b border-red-100 flex items-center gap-2 text-red-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    <h3 className="font-bold">Itens Devolvidos (Entram no Estoque)</h3>
                </div>
                <div className="p-4 border-b border-gray-100">
                     <input 
                        type="text" 
                        placeholder="Buscar produto devolvido..."
                        className="w-full border rounded-lg p-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 outline-none"
                        value={searchIn}
                        onChange={e => setSearchIn(e.target.value)}
                    />
                </div>
                
                {/* List of Selected Incoming Products */}
                <div className="flex-1 overflow-y-auto p-2 flex flex-col">
                    <div className="flex-1 space-y-2 mb-4">
                        {productsIn.length === 0 && !searchIn && (
                            <p className="text-center text-gray-400 text-sm mt-4">Nenhum item para devolver</p>
                        )}
                        
                        {productsIn.map((p, idx) => (
                            <div key={`${p.id}-${idx}-in`} className="p-3 bg-red-50 rounded-lg border border-red-200 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">{p.name}</p>
                                    <p className="font-bold text-red-600 text-xs">R$ {p.price.toFixed(2)}</p>
                                </div>
                                <button onClick={() => removeProductIn(idx)} className="text-red-400 hover:text-red-600 p-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Search Results Overlay */}
                    {searchIn && (
                        <div className="border-t border-gray-100 pt-2">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2 px-2">Resultados</p>
                            <div className="space-y-1">
                                {filteredProductsIn.map(p => (
                                    <button key={p.id} onClick={() => addProductIn(p)} className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm flex justify-between group">
                                        <span className="group-hover:text-red-700 font-medium">+ {p.name}</span>
                                        <span className="font-bold text-gray-500">R$ {p.price.toFixed(2)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Total Incoming */}
                <div className="p-3 bg-red-100 text-red-800 flex justify-between font-bold text-sm">
                    <span>Total Devolução:</span>
                    <span>R$ {totalIn.toFixed(2)}</span>
                </div>
            </div>

            {/* RIGHT: OUTGOING (NEW ITEMS) */}
            <div className="bg-white rounded-xl shadow-sm border border-green-200 flex flex-col overflow-hidden">
                <div className="p-4 bg-green-50 border-b border-green-100 flex items-center gap-2 text-green-700">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                    <h3 className="font-bold">Novos Itens (Saem do Estoque)</h3>
                </div>
                <div className="p-4 border-b border-gray-100">
                     <input 
                        type="text" 
                        placeholder="Buscar novo produto (Nome/Cód)..."
                        className="w-full border rounded-lg p-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
                        value={searchOut}
                        onChange={e => setSearchOut(e.target.value)}
                    />
                </div>
                
                {/* List of Selected Outgoing Products */}
                <div className="flex-1 overflow-y-auto p-2 flex flex-col">
                    <div className="flex-1 space-y-2 mb-4">
                        {productsOut.length === 0 && !searchOut && (
                            <p className="text-center text-gray-400 text-sm mt-4">Nenhum item selecionado</p>
                        )}
                        
                        {productsOut.map((p, idx) => (
                            <div key={`${p.id}-${idx}-out`} className="p-3 bg-green-50 rounded-lg border border-green-200 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-gray-800 text-sm">{p.name}</p>
                                    <p className="font-bold text-green-600 text-xs">R$ {p.price.toFixed(2)}</p>
                                </div>
                                <button onClick={() => removeProductOut(idx)} className="text-green-400 hover:text-red-500 p-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Search Results Overlay */}
                    {searchOut && (
                        <div className="border-t border-gray-100 pt-2">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2 px-2">Resultados</p>
                            <div className="space-y-1">
                                {filteredProductsOut.map(p => (
                                    <button key={p.id} onClick={() => addProductOut(p)} className="w-full text-left p-2 hover:bg-gray-50 rounded text-sm flex justify-between group">
                                        <span className="group-hover:text-green-700 font-medium">+ {p.name}</span>
                                        <span className="font-bold text-gray-500">R$ {p.price.toFixed(2)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Total Outgoing */}
                <div className="p-3 bg-green-100 text-green-800 flex justify-between font-bold text-sm">
                    <span>Total Saída:</span>
                    <span>R$ {totalOut.toFixed(2)}</span>
                </div>
            </div>

        </div>

        {/* BOTTOM: SUMMARY */}
        <div className="mt-6 bg-white p-6 rounded-xl shadow-lg border border-gray-200 z-20">
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                
                {/* Student Selector */}
                <div className="flex-1 w-full relative">
                    <label className="block text-sm font-bold text-gray-500 uppercase mb-1">Vincular Aluno (Opcional)</label>
                    {selectedStudent ? (
                        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <span className="font-bold text-blue-800">{selectedStudent.name}</span>
                            <button onClick={() => setSelectedStudent(null)} className="text-xs text-red-500 font-bold hover:underline">Remover</button>
                        </div>
                    ) : (
                        <div className="relative">
                            <input 
                                type="text" 
                                placeholder="Buscar aluno..." 
                                className="w-full border rounded-lg p-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={searchStudent}
                                onChange={e => setSearchStudent(e.target.value)}
                            />
                            {searchStudent && !selectedStudent && (
                                <div className="absolute bottom-full left-0 w-full mb-1 bg-white border border-gray-200 shadow-xl rounded-lg max-h-60 overflow-y-auto z-50">
                                    {filteredStudents.length > 0 ? filteredStudents.map(s => (
                                        <button key={s.id} onClick={() => { setSelectedStudent(s); setSearchStudent(''); }} className="w-full text-left p-3 hover:bg-blue-50 text-sm border-b border-gray-50 last:border-0">
                                            <span className="font-bold text-gray-800">{s.name}</span>
                                            <span className="block text-xs text-gray-500">{s.grade}</span>
                                        </button>
                                    )) : (
                                        <div className="p-3 text-sm text-gray-400 text-center">Nenhum aluno encontrado</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Diff Calc */}
                <div className="flex-1 w-full text-center">
                    <p className="text-sm text-gray-500 uppercase font-bold">Diferença de Valor</p>
                    <p className={`text-3xl font-black ${priceDiff > 0 ? 'text-red-500' : priceDiff < 0 ? 'text-green-500' : 'text-gray-400'}`}>
                        R$ {Math.abs(priceDiff).toFixed(2)}
                    </p>
                    <div className="mt-2 flex justify-center">
                        {priceDiff > 0 ? (
                            <label className="flex items-center gap-2 cursor-pointer bg-gray-100 px-3 py-1 rounded-lg hover:bg-gray-200 transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={payDifferenceInCash}
                                    onChange={e => setPayDifferenceInCash(e.target.checked)}
                                    className="rounded text-brand-600 focus:ring-brand-500 w-4 h-4"
                                />
                                <span className="text-sm font-bold text-gray-700">Pagar diferença em dinheiro</span>
                            </label>
                        ) : (
                            <p className="text-xs font-bold text-gray-500">
                                {priceDiff < 0 ? 'Cliente tem CRÉDITO' : 'Troca equivalente'}
                            </p>
                        )}
                    </div>
                </div>

                {/* Confirm Btn */}
                <div className="flex-1 w-full">
                    <button 
                        onClick={handleConfirm}
                        disabled={productsIn.length === 0 || productsOut.length === 0}
                        className="w-full py-4 bg-brand-600 text-white rounded-xl font-bold shadow-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
                    >
                        Confirmar Troca
                    </button>
                </div>

            </div>
        </div>
    </div>
  );
};
