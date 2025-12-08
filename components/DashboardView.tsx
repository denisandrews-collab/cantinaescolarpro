
import React, { useMemo } from 'react';
import { Product, Transaction, Student } from '../types';

interface DashboardViewProps {
  products: Product[];
  transactions: Transaction[];
  students: Student[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ products, transactions, students }) => {
  
  // 1. Calculate Today's Metrics
  const today = new Date();
  const todaysTransactions = transactions.filter(t => {
    if (t.status === 'CANCELLED') return false;
    const tDate = new Date(t.date);
    return tDate.getDate() === today.getDate() && 
           tDate.getMonth() === today.getMonth() && 
           tDate.getFullYear() === today.getFullYear();
  });

  const salesToday = todaysTransactions.reduce((acc, t) => acc + t.total, 0);
  const ordersToday = todaysTransactions.length;
  const avgTicket = ordersToday > 0 ? salesToday / ordersToday : 0;

  // 2. Low Stock Alerts (Stock <= 10)
  const lowStockProducts = products.filter(p => p.stock !== undefined && p.stock <= 10 && p.stock > 0);
  const outOfStockProducts = products.filter(p => p.stock !== undefined && p.stock === 0);

  // 3. User Demographics
  const studentCount = students.filter(s => !s.isStaff).length;
  const staffCount = students.filter(s => s.isStaff).length;
  const totalPeople = studentCount + staffCount;

  // Donut Chart Math
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const staffPercentage = totalPeople > 0 ? staffCount / totalPeople : 0;
  const staffOffset = circumference - (staffPercentage * circumference);

  // 4. Bar Chart Data (Last 7 Days Sales) - Optimized with single iteration
  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    // Create date buckets for the last 7 days
    const dateBuckets: { [key: string]: { label: string; value: number } } = {};
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        const dayLabel = d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });
        dateBuckets[dateKey] = { label: dayLabel, value: 0 };
    }
    
    // Single iteration through all transactions
    transactions.forEach(t => {
        if (t.status === 'CANCELLED') return;
        
        const tDate = new Date(t.date);
        const dateKey = `${tDate.getFullYear()}-${tDate.getMonth()}-${tDate.getDate()}`;
        
        if (dateBuckets[dateKey]) {
            dateBuckets[dateKey].value += t.total;
        }
    });
    
    // Convert to array maintaining chronological order
    for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        data.push(dateBuckets[dateKey]);
    }
    
    return data;
  }, [transactions]);

  const maxChartValue = Math.max(...chartData.map(d => d.value), 10); 

  // 5. Top Selling Products Logic
  const topProducts = useMemo(() => {
      const counts: Record<string, number> = {};
      
      transactions.forEach(t => {
          if (t.status === 'CANCELLED') return;
          t.items.forEach(item => {
              counts[item.id] = (counts[item.id] || 0) + item.quantity;
          });
      });

      return Object.entries(counts)
          .map(([id, quantity]) => {
              const product = products.find(p => p.id === id);
              return product ? { ...product, totalSold: quantity } : null;
          })
          .filter(Boolean)
          .sort((a, b) => (b?.totalSold || 0) - (a?.totalSold || 0))
          .slice(0, 5); // Top 5
  }, [transactions, products]);

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50 overflow-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Administrativo</h2>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Sales Today */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-4 bg-green-100 text-green-600 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a4.5 4.5 0 0 0 0 9H14.5a4.5 4.5 0 0 1 0 9H6"/></svg>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 uppercase">Vendas Hoje</p>
                <h3 className="text-3xl font-black text-gray-900">R$ {salesToday.toFixed(2)}</h3>
            </div>
        </div>

        {/* Orders Today */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-4 bg-blue-100 text-blue-600 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 uppercase">Pedidos Hoje</p>
                <h3 className="text-3xl font-black text-gray-900">{ordersToday}</h3>
            </div>
        </div>

        {/* Avg Ticket */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="p-4 bg-purple-100 text-purple-600 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 uppercase">Ticket Médio</p>
                <h3 className="text-3xl font-black text-gray-900">R$ {avgTicket.toFixed(2)}</h3>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* CHART SECTION (Left 2/3) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-6">Faturamento dos Últimos 7 Dias</h3>
            <div className="h-64 flex items-end gap-2 md:gap-4">
                {chartData.map((d, index) => {
                    const heightPercentage = (d.value / maxChartValue) * 100;
                    return (
                        <div key={index} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                            {/* Tooltip */}
                            <div className="absolute -top-10 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                R$ {d.value.toFixed(2)}
                            </div>
                            
                            {/* Bar */}
                            <div 
                                className="w-full bg-green-400 rounded-t-lg transition-all duration-500 group-hover:bg-green-500 relative overflow-hidden"
                                style={{ height: `${heightPercentage}%`, minHeight: '4px' }}
                            >
                                <div className="absolute bottom-0 left-0 w-full h-full bg-gradient-to-t from-black/10 to-transparent"></div>
                            </div>
                            
                            {/* Label */}
                            <p className="text-[10px] md:text-xs text-gray-500 mt-2 font-medium truncate w-full text-center uppercase">{d.label}</p>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* TOP PRODUCTS (Right 1/3) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full max-h-[400px]">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                Mais Vendidos (Top 5)
            </h3>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {topProducts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <p className="text-sm mt-2">Sem vendas ainda</p>
                    </div>
                ) : (
                    topProducts.map((p, idx) => (
                        <div key={p?.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-lg">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'}`}>
                                #{idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-800 text-sm truncate">{p?.name}</p>
                                <p className="text-xs text-gray-500">{p?.category}</p>
                            </div>
                            <div className="text-right">
                                <span className="block font-bold text-brand-600 text-sm">{p?.totalSold} un</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* POPULATION STATS */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Demografia
              </h3>
              
              <div className="flex flex-col md:flex-row items-center justify-around gap-8">
                  <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r={radius} stroke="#e5e7eb" strokeWidth="12" fill="none" />
                          {totalPeople > 0 && staffCount > 0 && (
                              <circle cx="50" cy="50" r={radius} stroke="#9333ea" strokeWidth="12" fill="none" strokeDasharray={`${circumference - staffOffset} ${circumference}`} />
                          )}
                          {totalPeople > 0 && studentCount > 0 && (
                              <circle cx="50" cy="50" r={radius} stroke="#3b82f6" strokeWidth="12" fill="none" strokeDasharray={`${(circumference * (studentCount / totalPeople))} ${circumference}`} strokeDashoffset={-1 * (circumference - staffOffset)} />
                          )}
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-black text-gray-800">{totalPeople}</span>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 w-full">
                      <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-bold text-gray-600">Alunos ({studentCount})</span>
                      </div>
                      <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          <span className="text-sm font-bold text-gray-600">Funcionários ({staffCount})</span>
                      </div>
                  </div>
              </div>
          </div>

          {/* ALERTS SECTION */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col h-full max-h-[300px]">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-500"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                    Alertas de Estoque
                </h3>
                
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {outOfStockProducts.length === 0 && lowStockProducts.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <p className="text-sm mt-2">Estoque saudável</p>
                        </div>
                    ) : (
                        <>
                            {outOfStockProducts.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                                    <div>
                                        <p className="font-bold text-red-700 text-sm">{p.name}</p>
                                    </div>
                                    <span className="bg-red-200 text-red-800 text-[10px] px-2 py-1 rounded font-bold uppercase">Esgotado</span>
                                </div>
                            ))}
                            {lowStockProducts.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                                    <div>
                                        <p className="font-bold text-yellow-800 text-sm">{p.name}</p>
                                    </div>
                                    <span className="text-xs font-bold text-yellow-700">{p.stock} un</span>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

      </div>

    </div>
  );
};
