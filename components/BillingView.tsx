
import React, { useState, useMemo } from 'react';
import { Student } from '../types';
import { formatDate, formatCurrency } from '../utils';
import { useSelection } from '../hooks';

interface BillingViewProps {
  students: Student[];
}

type UserTypeFilter = 'ALL' | 'STUDENT' | 'STAFF';
type BatchChannel = 'WHATSAPP' | 'EMAIL';

export const BillingView: React.FC<BillingViewProps> = ({ students }) => {
  // Input States
  const [inputDateStart, setInputDateStart] = useState('');
  const [inputDateEnd, setInputDateEnd] = useState('');
  const [inputTypeFilter, setInputTypeFilter] = useState<UserTypeFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Applied Filter
  const [appliedFilter, setAppliedFilter] = useState({
      start: '',
      end: '',
      type: 'ALL' as UserTypeFilter
  });

  // Batch Selection State
  const { selectedIds, toggleSelection, toggleSelectAll, clearSelection, setSelectedIds } = useSelection();
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchChannel, setBatchChannel] = useState<BatchChannel>('WHATSAPP');
  const [sentIds, setSentIds] = useState<Set<string>>(new Set()); // Track who was sent in the current batch session

  const handleApplyFilter = () => {
      setAppliedFilter({
          start: inputDateStart,
          end: inputDateEnd,
          type: inputTypeFilter
      });
      // Clear selection when filter changes to avoid confusion
      clearSelection();
  };

  // Helper to format date
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'Início';
    return formatDate(dateStr);
  };

  // Filter Logic
  const debtStudents = useMemo(() => {
    return students.filter(s => {
      // 1. Must have negative balance
      if (s.balance >= 0) return false;

      // 2. Filter by Name/Code
      if (searchTerm) {
          const q = searchTerm.toLowerCase();
          if (!s.name.toLowerCase().includes(q) && !s.code?.toLowerCase().includes(q)) {
              return false;
          }
      }

      // 3. Filter by Type
      if (appliedFilter.type === 'STUDENT' && s.isStaff) return false;
      if (appliedFilter.type === 'STAFF' && !s.isStaff) return false;

      // 4. Filter by Date
      if (appliedFilter.start || appliedFilter.end) {
          if (!s.history || s.history.length === 0) return false;

          const hasTransactionInRange = s.history.some(h => {
              const tDate = new Date(h.date);
              tDate.setHours(0,0,0,0);
              const tDateStr = tDate.toISOString().split('T')[0];

              let afterStart = true;
              let beforeEnd = true;

              if (appliedFilter.start) afterStart = tDateStr >= appliedFilter.start;
              if (appliedFilter.end) beforeEnd = tDateStr <= appliedFilter.end;

              return afterStart && beforeEnd;
          });

          if (!hasTransactionInRange) return false;
      }

      return true;
    }).sort((a, b) => a.balance - b.balance);
  }, [students, appliedFilter, searchTerm]);

  const totalDebt = debtStudents.reduce((acc, s) => acc + Math.abs(s.balance), 0);

  // --- SELECTION LOGIC ---
  // toggleSelection and toggleSelectAll are now provided by useSelection hook

  const handleToggleSelectAll = () => {
    toggleSelectAll(debtStudents.map(s => s.id));
  };

  const openBatchModal = (channel: BatchChannel) => {
      setBatchChannel(channel);
      setSentIds(new Set());
      setIsBatchModalOpen(true);
  };

  const markAsSent = (id: string) => {
      const newSent = new Set(sentIds);
      newSent.add(id);
      setSentIds(newSent);
  };

  // --- MESSAGING LOGIC ---
  const generateMessageBody = (student: Student) => {
      const amount = Math.abs(student.balance).toFixed(2);
      let details = "";

      let relevantHistory = (student.history || []).filter(h => h.type === 'PURCHASE' || h.type === 'REFUND');

      if (appliedFilter.start || appliedFilter.end) {
          relevantHistory = relevantHistory.filter(h => {
              const tDate = new Date(h.date);
              const tDateStr = tDate.toISOString().split('T')[0];
              let afterStart = true;
              let beforeEnd = true;
              if (appliedFilter.start) afterStart = tDateStr >= appliedFilter.start;
              if (appliedFilter.end) beforeEnd = tDateStr <= appliedFilter.end;
              return afterStart && beforeEnd;
          });
      } else {
          relevantHistory = relevantHistory.slice(0, 5);
      }

      if (relevantHistory.length > 0) {
          details = "\n\n*Extrato Recente:*\n";
          relevantHistory.forEach(h => {
              const date = new Date(h.date).toLocaleDateString('pt-BR');
              const itemNames = h.items ? h.items.map(i => i.name).join(', ') : h.description;
              const displayItems = itemNames.length > 30 ? itemNames.substring(0, 27) + '...' : itemNames;
              details += `- ${date}: ${displayItems} (R$ ${h.value.toFixed(2)})\n`;
          });
          if (!appliedFilter.start && !appliedFilter.end && student.history.length > 5) {
              details += "...ver mais no balcão.\n";
          }
      }

      return { amount, details };
  };
              const date = new Date(h.date).toLocaleDateString('pt-BR');
              const itemNames = h.items ? h.items.map(i => i.name).join(', ') : h.description;
              const displayItems = itemNames.length > 30 ? itemNames.substring(0, 27) + '...' : itemNames;
              details += `- ${date}: ${displayItems} (R$ ${h.value.toFixed(2)})\n`;
          });
          if (!appliedFilter.start && !appliedFilter.end && student.history.length > 5) {
              details += "...ver mais no balcão.\n";
          }
      }

      return { amount, details };
  };

  const getWhatsAppLink = (student: Student) => {
    if (!student.guardianPhone) return '';
    const phone = student.guardianPhone.replace(/\D/g, ''); 
    const { amount, details } = generateMessageBody(student);
    const message = `Olá ${student.guardianName || 'Responsável'}, referente ao aluno(a) *${student.name}*.\nConsta em nosso sistema um saldo devedor total de *R$ ${amount}* na cantina.${details}\nFavor regularizar. Obrigado!`;
    return `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
  };

  const getEmailLink = (student: Student) => {
      if (!student.guardianEmail) return '';
      const { amount, details } = generateMessageBody(student);
      const subject = `Aviso de Cobrança - Cantina Escolar - ${student.name}`;
      const body = `Olá ${student.guardianName || 'Responsável'},\n\nReferente ao aluno(a) ${student.name}.\nConsta em nosso sistema um saldo devedor total de R$ ${amount} na cantina.\n${details}\n\nPor favor, entre em contato para regularização.\n\nAtenciosamente,\nCantina Escolar`;
      return `mailto:${student.guardianEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50 overflow-hidden relative">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Central de Cobrança</h2>
      <p className="text-gray-500 mb-6 text-sm">Selecione os alunos para enviar avisos de cobrança em lote.</p>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Buscar</label>
                <input 
                    type="text"
                    placeholder="Nome do aluno..."
                    className="w-full border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="w-40">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo</label>
                <select 
                    value={inputTypeFilter}
                    onChange={e => setInputTypeFilter(e.target.value as UserTypeFilter)}
                    className="w-full border border-gray-700 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                    <option value="ALL">Todos</option>
                    <option value="STUDENT">Alunos</option>
                    <option value="STAFF">Colaboradores</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">De</label>
                <input 
                    type="date" 
                    className="border border-gray-700 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={inputDateStart}
                    onChange={e => setInputDateStart(e.target.value)}
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Até</label>
                <input 
                    type="date" 
                    className="border border-gray-700 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    value={inputDateEnd}
                    onChange={e => setInputDateEnd(e.target.value)}
                />
            </div>
            <button 
                onClick={handleApplyFilter}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 shadow-md flex items-center gap-2 transition-transform active:scale-95"
            >
                Filtrar
            </button>
          </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-gray-200 mb-16">
        <table className="w-full text-left">
            <thead className="bg-red-50 text-red-700 uppercase text-xs sticky top-0 z-10 border-b border-red-100">
                <tr>
                    <th className="p-4 w-10">
                        <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-gray-300 cursor-pointer"
                            checked={debtStudents.length > 0 && selectedIds.size === debtStudents.length}
                            onChange={handleToggleSelectAll}
                        />
                    </th>
                    <th className="p-4">Aluno / Funcionário</th>
                    <th className="p-4">Contato</th>
                    <th className="p-4 text-center">Última Compra</th>
                    <th className="p-4 text-right">Dívida (R$)</th>
                    <th className="p-4 text-center">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {debtStudents.length === 0 ? (
                    <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400">
                            Nenhuma pendência encontrada.
                        </td>
                    </tr>
                ) : (
                    debtStudents.map(student => {
                        const lastPurchase = student.history.find(h => h.type === 'PURCHASE')?.date;
                        const isSelected = selectedIds.has(student.id);
                        return (
                            <tr key={student.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-red-50' : ''}`}>
                                <td className="p-4">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-gray-300 cursor-pointer"
                                        checked={isSelected}
                                        onChange={() => toggleSelection(student.id)}
                                    />
                                </td>
                                <td className="p-4">
                                    <p className="font-bold text-gray-800">{student.name}</p>
                                    <p className="text-xs text-gray-500">{student.grade}</p>
                                </td>
                                <td className="p-4 text-sm">
                                    {student.guardianPhone ? (
                                        <span className="flex items-center gap-1 text-gray-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                                            {student.guardianPhone}
                                        </span>
                                    ) : (
                                        <span className="text-gray-400 italic text-xs">Sem telefone</span>
                                    )}
                                </td>
                                <td className="p-4 text-center text-sm text-gray-500">
                                    {lastPurchase ? new Date(lastPurchase).toLocaleDateString('pt-BR') : '-'}
                                </td>
                                <td className="p-4 text-right font-black text-red-600">
                                    {formatCurrency(Math.abs(student.balance))}
                                </td>
                                <td className="p-4 text-center">
                                     <a 
                                        href={getWhatsAppLink(student)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`inline-flex items-center justify-center w-8 h-8 rounded text-white ${student.guardianPhone ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-200 cursor-not-allowed'}`}
                                        title="WhatsApp"
                                        onClick={e => !student.guardianPhone && e.preventDefault()}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                                    </a>
                                </td>
                            </tr>
                        );
                    })
                )}
            </tbody>
        </table>
      </div>

      {/* FLOATING ACTION BAR */}
      {selectedIds.size > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 z-20 animate-in slide-in-from-bottom-4">
              <span className="font-bold text-sm bg-gray-700 px-3 py-1 rounded-full">{selectedIds.size} selecionados</span>
              
              <div className="flex gap-2">
                  <button 
                      onClick={() => openBatchModal('WHATSAPP')}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                      Enviar WhatsApp
                  </button>
                  <button 
                      onClick={() => openBatchModal('EMAIL')}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      Enviar E-mail
                  </button>
              </div>

              <button 
                onClick={() => setSelectedIds(new Set())}
                className="text-gray-400 hover:text-white"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
          </div>
      )}

      {/* BATCH SENDING MODAL - "A FILA" */}
      {isBatchModalOpen && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl">
                  
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                      <div>
                          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                              {batchChannel === 'WHATSAPP' ? (
                                  <span className="text-green-600 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg> Disparo WhatsApp</span>
                              ) : (
                                  <span className="text-blue-600 flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg> Disparo de E-mail</span>
                              )}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                              Clique em "Enviar" um por um. O sistema marcará os enviados.
                          </p>
                      </div>
                      <button onClick={() => setIsBatchModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                      </button>
                  </div>

                  <div className="flex-1 overflow-auto p-4 space-y-2 bg-gray-50">
                      {debtStudents.filter(s => selectedIds.has(s.id)).map((student, idx) => {
                          const isSent = sentIds.has(student.id);
                          const hasContact = batchChannel === 'WHATSAPP' ? !!student.guardianPhone : !!student.guardianEmail;
                          const link = batchChannel === 'WHATSAPP' ? getWhatsAppLink(student) : getEmailLink(student);

                          return (
                              <div key={student.id} className={`flex items-center justify-between p-4 rounded-lg border transition-all ${isSent ? 'bg-green-50 border-green-200 opacity-70' : 'bg-white border-gray-200 shadow-sm'}`}>
                                  <div className="flex items-center gap-4">
                                      <span className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full text-xs font-bold text-gray-600">
                                          {idx + 1}
                                      </span>
                                      <div>
                                          <p className="font-bold text-gray-800">{student.name}</p>
                                          <p className="text-xs text-gray-500">
                                              Resp: {student.guardianName || '?'} • Dívida: <span className="text-red-500 font-bold">{formatCurrency(Math.abs(student.balance))}</span>
                                          </p>
                                      </div>
                                  </div>
                                  
                                  <div>
                                      {isSent ? (
                                          <div className="flex items-center gap-2 text-green-600 font-bold px-4 py-2 bg-green-100 rounded-lg">
                                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                              Enviado
                                          </div>
                                      ) : (
                                          <a 
                                              href={link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-white shadow-sm transition-transform active:scale-95 ${
                                                  !hasContact ? 'bg-gray-300 cursor-not-allowed' : 
                                                  batchChannel === 'WHATSAPP' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                                              }`}
                                              onClick={(e) => {
                                                  if (!hasContact) {
                                                      e.preventDefault();
                                                  } else {
                                                      markAsSent(student.id);
                                                  }
                                              }}
                                          >
                                              {hasContact ? 'Enviar Agora' : 'Sem Contato'}
                                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                                          </a>
                                      )}
                                  </div>
                              </div>
                          );
                      })}
                  </div>

                  <div className="p-4 border-t border-gray-100 bg-white rounded-b-2xl flex justify-between items-center">
                      <p className="text-sm text-gray-500">
                          {sentIds.size} de {selectedIds.size} processados.
                      </p>
                      <button 
                          onClick={() => setIsBatchModalOpen(false)}
                          className="px-6 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300"
                      >
                          Fechar
                      </button>
                  </div>

              </div>
          </div>
      )}
    </div>
  );
};
