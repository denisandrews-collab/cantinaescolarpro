
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, Student } from '../types';

interface ReportsViewProps {
  transactions: Transaction[];
  students: Student[];
  onCancelTransaction?: (transactionId: string) => void;
}

type ReportType = 'SALES' | 'STUDENTS' | 'STAFF';

export const ReportsView: React.FC<ReportsViewProps> = ({ transactions, students, onCancelTransaction }) => {
  // Report Type State
  const [activeReport, setActiveReport] = useState<ReportType>('SALES');

  // Date State - Initialize with Today
  const getToday = () => new Date().toISOString().split('T')[0];
  const [dateStartInput, setDateStartInput] = useState(getToday());
  const [dateEndInput, setDateEndInput] = useState(getToday());
  
  // Applied Filter State
  const [appliedFilter, setAppliedFilter] = useState({ start: getToday(), end: getToday() });
  
  // Custom Layout States (Visible Columns)
  const [visibleColumns, setVisibleColumns] = useState({
      id: true,
      date: true,
      student: true,
      items: true,
      total: true,
      status: true
  });
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);

  // Apply Filter Handler
  const handleApplyFilter = () => {
      setAppliedFilter({ start: dateStartInput, end: dateEndInput });
  };

  // Helper to safely format YYYY-MM-DD to DD/MM/YYYY for display without timezone issues
  const formatDateDisplay = (dateStr: string) => {
      if (!dateStr) return '-';
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
  };

  // Safe date parser
  const safeDate = (dateInput: Date | string) => {
      const d = new Date(dateInput);
      return isNaN(d.getTime()) ? new Date() : d;
  };

  // Filter Transactions Logic
  const filteredTransactions = useMemo(() => {
      let filtered = transactions;
      
      if (appliedFilter.start) {
          // Construct date explicitly in local time [Year, Month Index (0-11), Day]
          const [y, m, d] = appliedFilter.start.split('-').map(Number);
          const start = new Date(y, m - 1, d, 0, 0, 0, 0);
          
          filtered = filtered.filter(t => safeDate(t.date) >= start);
      }

      if (appliedFilter.end) {
          // Construct date explicitly in local time [Year, Month Index (0-11), Day]
          const [y, m, d] = appliedFilter.end.split('-').map(Number);
          const end = new Date(y, m - 1, d, 23, 59, 59, 999);
          
          filtered = filtered.filter(t => safeDate(t.date) <= end);
      }

      return filtered;
  }, [transactions, appliedFilter]);

  // Aggregation Logic for Students/Staff (ONLY VALID TRANSACTIONS)
  const studentReports = useMemo(() => {
      const targetStudents = activeReport === 'STAFF' 
          ? students.filter(s => s.isStaff)
          : students.filter(s => !s.isStaff); // Or all students if desired
      
      const validTransactions = filteredTransactions.filter(t => t.status !== 'CANCELLED');

      return targetStudents.map(student => {
          // Find transactions for this student within the filtered period
          const studentTrans = validTransactions.filter(t => t.studentId === student.id);
          const periodTotal = studentTrans.reduce((acc, t) => acc + t.total, 0);
          const ordersCount = studentTrans.length;

          return {
              ...student,
              periodTotal,
              ordersCount
          };
      }).sort((a, b) => b.periodTotal - a.periodTotal); // Sort by highest consumption
  }, [students, filteredTransactions, activeReport]);


  // Calculation for Sales Report (ONLY VALID)
  const validFilteredTransactions = filteredTransactions.filter(t => t.status !== 'CANCELLED');
  const totalSales = validFilteredTransactions.reduce((acc, t) => acc + t.total, 0);
  const totalOrders = validFilteredTransactions.length;
  
  const handleExportReport = () => {
    let headers: string[] = [];
    let rows: string = "";

    if (activeReport === 'SALES') {
        // Export Sales
        if(visibleColumns.id) headers.push('ID');
        if(visibleColumns.date) headers.push('Data');
        if(visibleColumns.student) headers.push('Aluno');
        if(visibleColumns.total) headers.push('Total');
        if(visibleColumns.items) headers.push('Itens');
        if(visibleColumns.status) headers.push('Status');

        rows = filteredTransactions.map(t => {
            const row = [];
            if(visibleColumns.id) row.push(t.id);
            if(visibleColumns.date) row.push(`"${safeDate(t.date).toLocaleString('pt-BR')}"`);
            if(visibleColumns.student) row.push(`"${t.studentName || 'Balcão'}"`);
            if(visibleColumns.total) row.push(t.total.toFixed(2));
            if(visibleColumns.items) {
                const itemsSummary = t.items.map(i => `${i.quantity}x ${i.name}`).join(' | ');
                row.push(`"${itemsSummary}"`);
            }
            if(visibleColumns.status) row.push(t.status === 'CANCELLED' ? 'CANCELADO' : 'VÁLIDO');
            return row.join(',');
        }).join("\n");
    } else {
        // Export Student/Staff
        headers = ['Código', 'Nome', 'Turma/Cargo', 'Pedidos (Período)', 'Gasto (Período)', 'Saldo Atual'];
        rows = studentReports.map(s => {
            return `"${s.code || ''}","${s.name}","${s.grade}",${s.ordersCount},${s.periodTotal.toFixed(2)},${s.balance.toFixed(2)}`;
        }).join("\n");
    }
    
    const csvContent = "data:text/csv;charset=utf-8," + encodeURI(headers.join(',') + "\n" + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `relatorio_${activeReport.toLowerCase()}_${appliedFilter.start}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
      window.print();
  };

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50 overflow-hidden printable">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Relatórios</h2>
            <div className="flex gap-1 mt-2">
                <button 
                    onClick={() => setActiveReport('SALES')}
                    className={`px-3 py-1 text-sm rounded-full font-medium transition-colors ${activeReport === 'SALES' ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                    Vendas
                </button>
                <button 
                    onClick={() => setActiveReport('STUDENTS')}
                    className={`px-3 py-1 text-sm rounded-full font-medium transition-colors ${activeReport === 'STUDENTS' ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                    Alunos
                </button>
                <button 
                    onClick={() => setActiveReport('STAFF')}
                    className={`px-3 py-1 text-sm rounded-full font-medium transition-colors ${activeReport === 'STAFF' ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                    Funcionários
                </button>
            </div>
        </div>

        <div className="flex gap-2 relative">
            {/* Custom Layout Dropdown - Only for Sales */}
            {activeReport === 'SALES' && (
                <div className="relative">
                    <button 
                        onClick={() => setShowLayoutMenu(!showLayoutMenu)}
                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" x2="21" y1="9" y2="9"/><line x1="9" x2="9" y1="21" y2="9"/></svg>
                        Layout
                    </button>
                    {showLayoutMenu && (
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-20 p-2">
                            <p className="text-xs font-bold text-gray-500 px-2 py-1 mb-1 uppercase">Colunas Visíveis</p>
                            {Object.keys(visibleColumns).map(col => (
                                <label key={col} className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 cursor-pointer rounded">
                                    <input 
                                        type="checkbox" 
                                        checked={(visibleColumns as any)[col]}
                                        onChange={(e) => setVisibleColumns(prev => ({...prev, [col]: e.target.checked}))}
                                        className="rounded text-brand-600 focus:ring-brand-500"
                                    />
                                    <span className="capitalize text-sm">{col === 'student' ? 'Cliente' : col}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <button 
                onClick={handlePrintReport}
                className="bg-gray-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors flex items-center gap-2"
                title="Imprimir Tabela"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            </button>

            <button 
                onClick={handleExportReport}
                className="bg-brand-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-brand-700 transition-colors flex items-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                Exportar CSV
            </button>
        </div>
      </div>

      {/* FILTERS AREA */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-end print:hidden">
          <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Inicial</label>
              <input 
                type="date" 
                value={dateStartInput} 
                onChange={e => setDateStartInput(e.target.value)}
                className="border border-gray-700 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
          </div>
          <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Data Final</label>
              <input 
                type="date" 
                value={dateEndInput} 
                onChange={e => setDateEndInput(e.target.value)}
                className="border border-gray-700 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
          </div>
          
          <button 
            onClick={handleApplyFilter}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-700 shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            Filtrar
          </button>

          <div className="flex-1 text-right text-gray-400 text-xs self-center">
             Período aplicado: <span className="font-mono text-gray-600 font-bold">{formatDateDisplay(appliedFilter.start)}</span> até <span className="font-mono text-gray-600 font-bold">{formatDateDisplay(appliedFilter.end)}</span>
          </div>
      </div>

      {/* SUMMARY CARDS (DYNAMIC) - Print Safe styling could be added */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 print:grid-cols-2 print:gap-4 print:mb-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 print:border-black print:p-4">
          <p className="text-sm font-medium text-gray-500 uppercase print:text-black">
              {activeReport === 'SALES' ? 'Vendas Totais' : 'Gasto Total (Grupo)'}
          </p>
          <p className="text-3xl font-black text-brand-600 mt-2 print:text-black">
              R$ {activeReport === 'SALES' ? totalSales.toFixed(2) : studentReports.reduce((acc, s) => acc + s.periodTotal, 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 print:border-black print:p-4">
          <p className="text-sm font-medium text-gray-500 uppercase print:text-black">
              {activeReport === 'SALES' ? 'Pedidos Realizados' : 'Total de Pessoas'}
          </p>
          <p className="text-3xl font-black text-gray-800 mt-2 print:text-black">
              {activeReport === 'SALES' ? totalOrders : studentReports.length}
          </p>
        </div>
      </div>

      {/* TABLE CONTENT */}
      <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-gray-200 print:border-none print:shadow-none print:overflow-visible">
         <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs sticky top-0 z-10 print:static print:bg-white print:text-black print:border-b-2 print:border-black">
            {activeReport === 'SALES' ? (
                <tr>
                    {visibleColumns.date && <th className="p-4 print:p-2">Data/Hora</th>}
                    {visibleColumns.student && <th className="p-4 print:p-2">Cliente</th>}
                    {visibleColumns.items && <th className="p-4 print:p-2">Resumo do Pedido</th>}
                    {visibleColumns.total && <th className="p-4 text-right print:p-2">Total (R$)</th>}
                    {visibleColumns.status && <th className="p-4 text-center print:p-2">Status</th>}
                    <th className="p-4 text-center print:hidden">Ações</th>
                </tr>
            ) : (
                <tr>
                    <th className="p-4 print:p-2">Cód.</th>
                    <th className="p-4 print:p-2">Nome</th>
                    <th className="p-4 print:p-2">Turma / Cargo</th>
                    <th className="p-4 text-center print:p-2">Pedidos (Período)</th>
                    <th className="p-4 text-right print:p-2">Gasto (Período)</th>
                    <th className="p-4 text-right print:p-2">Saldo Atual</th>
                </tr>
            )}
          </thead>
          <tbody className="divide-y divide-gray-100 print:divide-black">
            {activeReport === 'SALES' ? (
                // SALES ROWS
                [...filteredTransactions].reverse().map(t => (
                <tr key={t.id} className={`hover:bg-gray-50 ${t.status === 'CANCELLED' ? 'bg-red-50 opacity-70 print:bg-white print:line-through' : ''}`}>
                    {visibleColumns.date && (
                        <td className="p-4 text-gray-500 text-sm print:p-2 print:text-black">
                        {safeDate(t.date).toLocaleString('pt-BR')}
                        </td>
                    )}
                    {visibleColumns.student && (
                        <td className="p-4 font-medium print:p-2">{t.studentName || 'Venda Balcão'}</td>
                    )}
                    {visibleColumns.items && (
                        <td className="p-4 text-gray-600 text-sm max-w-xs truncate print:p-2 print:text-black print:whitespace-normal">
                        {t.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                        </td>
                    )}
                    {visibleColumns.total && (
                        <td className={`p-4 text-right font-bold print:p-2 ${t.status === 'CANCELLED' ? 'line-through text-red-400 print:text-black' : 'text-gray-800'}`}>
                        {t.total.toFixed(2)}
                        </td>
                    )}
                    {visibleColumns.status && (
                        <td className="p-4 text-center print:p-2">
                            {t.status === 'CANCELLED' ? (
                                <span className="bg-red-200 text-red-800 text-[10px] px-2 py-1 rounded-full font-bold uppercase print:border print:border-black print:bg-white print:text-black">Cancelado</span>
                            ) : (
                                <span className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full font-bold uppercase print:hidden">OK</span>
                            )}
                        </td>
                    )}
                    <td className="p-4 text-center print:hidden">
                        {t.status !== 'CANCELLED' && onCancelTransaction && (
                             <button 
                                onClick={() => onCancelTransaction(t.id)}
                                className="text-red-500 hover:text-red-700 text-xs font-bold underline"
                             >
                                 Cancelar
                             </button>
                        )}
                    </td>
                </tr>
                ))
            ) : (
                // STUDENTS / STAFF ROWS
                studentReports.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50">
                        <td className="p-4 text-gray-500 font-mono text-xs print:p-2 print:text-black">{s.code || '-'}</td>
                        <td className="p-4 font-bold text-gray-800 print:p-2">{s.name}</td>
                        <td className="p-4 text-sm text-gray-600 print:p-2 print:text-black">{s.grade}</td>
                        <td className="p-4 text-center text-sm print:p-2">{s.ordersCount}</td>
                        <td className="p-4 text-right font-bold text-blue-600 print:p-2 print:text-black">
                            R$ {s.periodTotal.toFixed(2)}
                        </td>
                        <td className={`p-4 text-right font-bold print:p-2 ${s.balance < 0 ? 'text-red-500 print:text-black' : 'text-green-600 print:text-black'}`}>
                            {s.balance < 0 ? `Devendo R$ ${Math.abs(s.balance).toFixed(2)}` : `R$ ${s.balance.toFixed(2)}`}
                        </td>
                    </tr>
                ))
            )}
            
            {/* EMPTY STATE */}
            {((activeReport === 'SALES' && filteredTransactions.length === 0) || (activeReport !== 'SALES' && studentReports.length === 0)) && (
                <tr>
                    <td colSpan={7} className="p-8 text-center text-gray-400">
                        Nenhum registro encontrado para o período selecionado.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
