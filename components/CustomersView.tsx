
import React, { useState, useEffect, useMemo } from 'react';
import { Student } from '../types';
import { formatCurrency, generateRandomPassword } from '../utils';
import { useSelection, useSearch } from '../hooks';

interface CustomersViewProps {
  students: Student[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onReceivePayment: (id: string, amount: number, description?: string) => void;
  onRefundStudent: (id: string, amount: number, reason: string) => void;
  onImportStudents?: (students: Student[]) => void;
  initiateNewStudent?: boolean;
  onNewStudentInitiated?: () => void;
}

type FilterType = 'ALL' | 'STUDENT' | 'STAFF';

export const CustomersView: React.FC<CustomersViewProps> = ({ 
    students, onAddStudent, onUpdateStudent, onDeleteStudent, onReceivePayment, onRefundStudent, onImportStudents, initiateNewStudent, onNewStudentInitiated 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  
  // Search & Filter State
  const { searchQuery, setSearchQuery } = useSearch();
  const [filterType, setFilterType] = useState<FilterType>('ALL');

  // Selection State
  const { selectedIds, toggleSelection, toggleSelectAll, clearSelection, setSelectedIds } = useSelection();

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentStudent, setPaymentStudent] = useState<Student | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  
  // Refund Modal State
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
  const [refundStudent, setRefundStudent] = useState<Student | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');

  // Batch Payment State
  const [isBatchPaymentModalOpen, setIsBatchPaymentModalOpen] = useState(false);
  const [batchPayFullDebt, setBatchPayFullDebt] = useState(true);
  const [batchAmount, setBatchAmount] = useState('');
  const [isPayrollDeduction, setIsPayrollDeduction] = useState(false);

  // Form State
  const [formData, setFormData] = useState({ 
      name: '', 
      code: '', 
      grade: '', 
      isStaff: false, 
      balance: '0',
      guardianName: '',
      guardianEmail: '',
      guardianPhone: '',
      notes: '',
      isActive: true
  });

  // Handle external trigger for new student
  useEffect(() => {
    if (initiateNewStudent) {
        handleOpenModal();
        if (onNewStudentInitiated) onNewStudentInitiated();
    }
  }, [initiateNewStudent, onNewStudentInitiated]);

  const filteredStudents = useMemo(() => {
      let filtered = students;

      // Filter by Type
      if (filterType === 'STUDENT') filtered = filtered.filter(s => !s.isStaff);
      if (filterType === 'STAFF') filtered = filtered.filter(s => s.isStaff);

      // Filter by Search
      if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(s => 
            s.name.toLowerCase().includes(q) || 
            s.code?.toLowerCase().includes(q) || 
            s.grade.toLowerCase().includes(q)
          );
      }
      
      return filtered;
  }, [students, searchQuery, filterType]);

  // Handle Selection - now using hook
  const handleToggleSelectAll = () => {
    toggleSelectAll(filteredStudents.map(s => s.id));
  };
  };

  // toggleSelectAll is now removed, using handleToggleSelectAll instead

  const handleOpenModal = (student?: Student) => {
    if (student) {
      setEditingStudent(student);
      setFormData({ 
          name: student.name, 
          code: student.code || '', 
          grade: student.grade, 
          isStaff: student.isStaff || false, 
          balance: student.balance.toString(),
          guardianName: student.guardianName || '',
          guardianEmail: student.guardianEmail || '',
          guardianPhone: student.guardianPhone || '',
          notes: student.notes || '',
          isActive: student.isActive ?? true
      });
    } else {
      setEditingStudent(null);
      setFormData({ 
          name: '', code: '', grade: '', isStaff: false, balance: '0',
          guardianName: '', guardianEmail: '', guardianPhone: '', notes: '', isActive: true
      });
    }
    setIsModalOpen(true);
  };

  const toggleStudentStatus = (e: React.MouseEvent, student: Student) => {
      e.stopPropagation();
      onUpdateStudent({ ...student, isActive: !student.isActive });
  };

  // generatePassword is now replaced by utility function

  const triggerWelcomeEmail = (studentName: string, guardianName: string, email: string, pass: string) => {
      // Robusta URL Generation
      const currentFullUrl = window.location.href;
      const baseUrl = currentFullUrl.split('#')[0];
      const portalUrl = `${baseUrl}#/portal`;

      const subject = `Bem-vindo à Cantina Escolar - Acesso do Responsável`;
      const body = `Olá ${guardianName || 'Responsável'},\n\nO aluno(a) ${studentName} foi cadastrado com sucesso em nosso sistema.\n\nVocê pode acompanhar o saldo e extrato através do nosso Portal dos Pais.\n\nLink do Portal:\n${portalUrl}\n\nUsuario (E-mail): ${email}\nSenha Provisória: ${pass}\n\nAtenciosamente,\nCantina Escolar`;
      
      const link = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = link;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const commonData = {
        name: formData.name,
        code: formData.code,
        grade: formData.grade,
        isStaff: formData.isStaff,
        balance: parseFloat(formData.balance),
        guardianName: formData.guardianName,
        guardianEmail: formData.guardianEmail,
        guardianPhone: formData.guardianPhone,
        notes: formData.notes,
        isActive: formData.isActive
    };

    if (editingStudent) {
      onUpdateStudent({
        ...editingStudent,
        ...commonData
      });
    } else {
      // Create new student
      const newPassword = generateRandomPassword();
      const newStudent: Student = {
        id: Date.now().toString(),
        history: [],
        points: 0,
        guardianPassword: newPassword, // Auto-assign password
        ...commonData
      };
      
      onAddStudent(newStudent);

      // Trigger Email if address is provided
      if (formData.guardianEmail) {
          if (window.confirm('Aluno cadastrado! Deseja enviar a senha de acesso para o e-mail do responsável agora?')) {
              triggerWelcomeEmail(formData.name, formData.guardianName, formData.guardianEmail, newPassword);
          }
      }
    }
    setIsModalOpen(false);
  };

  // Payment Handlers
  const handleOpenPaymentModal = (student: Student) => {
      setPaymentStudent(student);
      setPaymentAmount('');
      setIsPaymentModalOpen(true);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
      e.preventDefault();
      if(paymentStudent && paymentAmount) {
          onReceivePayment(paymentStudent.id, parseFloat(paymentAmount), 'Pagamento Recebido');
          setIsPaymentModalOpen(false);
          setPaymentStudent(null);
          setPaymentAmount('');
      }
  };

  // Batch Payment Logic
  const handleOpenBatchPaymentModal = () => {
      setBatchPayFullDebt(true);
      setBatchAmount('');
      setIsPayrollDeduction(false);
      setIsBatchPaymentModalOpen(true);
  };

  const handleSubmitBatchPayment = () => {
      const description = isPayrollDeduction ? 'Desconto em Folha' : 'Pagamento em Lote';
      const fixedAmt = parseFloat(batchAmount);

      selectedIds.forEach(id => {
          const student = students.find(s => s.id === id);
          if (student) {
              let amountToPay = 0;
              if (batchPayFullDebt) {
                  // Only pay if debt exists (balance < 0)
                  if (student.balance < 0) {
                      amountToPay = Math.abs(student.balance);
                  }
              } else {
                  if (!isNaN(fixedAmt) && fixedAmt > 0) {
                      amountToPay = fixedAmt;
                  }
              }

              if (amountToPay > 0) {
                  onReceivePayment(student.id, amountToPay, description);
              }
          }
      });

      alert('Pagamento em lote processado com sucesso!');
      setIsBatchPaymentModalOpen(false);
      setSelectedIds(new Set()); // Clear selection
  };

  // Refund Handlers
  const handleOpenRefundModal = (student: Student) => {
      setRefundStudent(student);
      setRefundAmount('');
      setRefundReason('');
      setIsRefundModalOpen(true);
  };

  const handleSubmitRefund = (e: React.FormEvent) => {
      e.preventDefault();
      if(refundStudent && refundAmount && refundReason) {
          onRefundStudent(refundStudent.id, parseFloat(refundAmount), refundReason);
          setIsRefundModalOpen(false);
          setRefundStudent(null);
          setRefundAmount('');
          setRefundReason('');
      }
  };


  const toggleHistory = (studentId: string) => {
      setExpandedStudentId(prev => prev === studentId ? null : studentId);
  };

  const toggleTxDetails = (txId: string) => {
      setExpandedTxId(prev => prev === txId ? null : txId);
  };

  // Import/Export Logic
  const handleExportCSV = () => {
    const headers = "ID,Código,Nome,Turma,Responsável,Email Resp,Telefone Resp,Saldo,Ativo\n";
    const rows = students.map(s => `${s.id},"${s.code || ''}","${s.name}","${s.grade}","${s.guardianName || ''}","${s.guardianEmail || ''}","${s.guardianPhone || ''}",${s.balance},${s.isActive ? 'SIM' : 'NÃO'}`).join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + encodeURI(headers + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", "alunos_cantina.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      
      const lines = text.split('\n');
      const newStudents: Student[] = [];
      
      // Skip header, start from index 1
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Simple Split - Note: This does not handle commas inside quotes perfectly
        const parts = line.split(','); 
        
        // Expecting: ID,Code,Name,Grade,GuardName,GuardEmail,GuardPhone,Balance
        if (parts.length >= 4) { 
           newStudents.push({
             id: parts[0] || Date.now().toString() + i, // Use CSV ID or generate new
             code: parts[1].replace(/"/g, ''),
             name: parts[2].replace(/"/g, ''),
             grade: parts[3].replace(/"/g, ''),
             guardianName: parts[4]?.replace(/"/g, '') || '',
             guardianEmail: parts[5]?.replace(/"/g, '') || '',
             guardianPhone: parts[6]?.replace(/"/g, '') || '',
             balance: parseFloat(parts[7]) || 0,
             points: 0,
             history: [],
             guardianPassword: generateRandomPassword(), // Generate password for imported students
             isStaff: false, // Default to student
             isActive: true
           });
        }
      }
      
      if (newStudents.length > 0 && onImportStudents) {
        onImportStudents(newStudents);
        alert(`${newStudents.length} alunos importados com sucesso!`);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50 overflow-hidden relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Cadastro de Clientes</h2>
            <div className="flex gap-1 mt-2">
                <button 
                    onClick={() => setFilterType('ALL')}
                    className={`px-3 py-1 text-sm rounded-full font-medium transition-colors ${filterType === 'ALL' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                    Todos
                </button>
                <button 
                    onClick={() => setFilterType('STUDENT')}
                    className={`px-3 py-1 text-sm rounded-full font-medium transition-colors ${filterType === 'STUDENT' ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                    Alunos
                </button>
                <button 
                    onClick={() => setFilterType('STAFF')}
                    className={`px-3 py-1 text-sm rounded-full font-medium transition-colors ${filterType === 'STAFF' ? 'bg-brand-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                >
                    Funcionários
                </button>
            </div>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
             <div className="relative flex-1 md:w-56">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
                </span>
                <input 
                    type="text" 
                    placeholder="Buscar cliente..." 
                    className="w-full pl-9 pr-4 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            
            {/* IMPORT/EXPORT BUTTONS */}
             <label className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors cursor-pointer flex items-center gap-1" title="Importar Excel/CSV">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
            </label>
            <button onClick={handleExportCSV} className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors" title="Exportar Excel/CSV">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            </button>

            <button 
            onClick={() => handleOpenModal()}
            className="bg-brand-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-brand-700 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
            Novo
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-gray-200 mb-16">
        <table className="w-full text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs sticky top-0">
            <tr>
              <th className="p-4 w-10">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                    checked={filteredStudents.length > 0 && selectedIds.size === filteredStudents.length}
                    onChange={handleToggleSelectAll}
                  />
              </th>
              <th className="p-4 w-16 text-center">Ativo</th>
              <th className="p-4">Cód.</th>
              <th className="p-4">Nome</th>
              <th className="p-4">Responsável</th>
              <th className="p-4">Turma / Cargo</th>
              <th className="p-4 text-center">Fidelidade</th>
              <th className="p-4 text-right">Saldo (R$)</th>
              <th className="p-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStudents.length === 0 ? (
                <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-400">Nenhum cliente encontrado.</td>
                </tr>
            ) : (
                filteredStudents.map(student => {
                    const isSelected = selectedIds.has(student.id);
                    const isActive = student.isActive !== false;
                    return (
                        <React.Fragment key={student.id}>
                            <tr 
                                className={`hover:bg-gray-50 cursor-pointer select-none transition-colors ${isSelected ? 'bg-blue-50' : ''} ${!isActive ? 'opacity-50' : ''}`}
                                onDoubleClick={() => toggleHistory(student.id)}
                                onClick={() => toggleSelection(student.id)}
                            >
                                <td className="p-4" onClick={e => e.stopPropagation()}>
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 cursor-pointer"
                                        checked={isSelected}
                                        onChange={() => toggleSelection(student.id)}
                                    />
                                </td>
                                <td className="p-4 text-center" onClick={(e) => toggleStudentStatus(e, student)}>
                                    <button className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isActive ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}>
                                        {isActive ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h10"/><path d="M9 4v16"/><path d="M3 7.7 5.3 10"/><path d="M3 16.3 5.3 14"/><path d="M16 12h6"/><path d="M19 16.3 21.3 14"/><path d="M19 7.7 21.3 10"/></svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" x2="19.07" y1="4.93" y2="19.07"/></svg>
                                        )}
                                    </button>
                                </td>
                                <td className="p-4 text-gray-500 font-mono text-sm">{student.code || '-'}</td>
                                <td className="p-4 font-medium">
                                    <div className="flex items-center gap-2">
                                        {student.name}
                                        {student.isStaff && (
                                            <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold">Func</span>
                                        )}
                                        {student.notes && (
                                            <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold flex items-center gap-1" title={student.notes}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                                                Alerta
                                            </span>
                                        )}
                                    </div>
                                    {expandedStudentId === student.id && (
                                        <span className="block text-[10px] bg-gray-200 text-gray-600 px-1 rounded w-fit mt-1">Histórico Aberto</span>
                                    )}
                                </td>
                                <td className="p-4 text-sm text-gray-600">
                                    {student.guardianName ? (
                                        <div>
                                            <p className="font-semibold">{student.guardianName}</p>
                                            <p className="text-xs text-gray-400">{student.guardianPhone}</p>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 italic">-</span>
                                    )}
                                </td>
                                <td className="p-4 text-gray-500">{student.grade}</td>
                                <td className="p-4 text-center text-sm font-bold text-yellow-600">
                                    {student.points || 0} pts
                                </td>
                                <td className={`p-4 text-right font-bold ${student.balance < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                {formatCurrency(student.balance)}
                                </td>
                                <td className="p-4 flex justify-center gap-2">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleOpenPaymentModal(student); }} 
                                        className="px-3 py-1.5 text-xs font-bold bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center gap-1"
                                        title="Receber Pagamento"
                                    >
                                        Receber
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleOpenRefundModal(student); }} 
                                        className="px-3 py-1.5 text-xs font-bold bg-orange-100 text-orange-700 rounded hover:bg-orange-200 flex items-center gap-1"
                                        title="Estornar Valor (Devolução)"
                                    >
                                    Estornar
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleOpenModal(student); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); onDeleteStudent(student.id); }} className="p-2 text-red-600 hover:bg-red-50 rounded">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                    </button>
                                </td>
                            </tr>
                            
                            {/* EXPANDED HISTORY ROW */}
                            {expandedStudentId === student.id && (
                                <tr className="bg-gray-50 shadow-inner">
                                    <td colSpan={9} className="p-4">
                                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                            <h4 className="px-4 py-2 bg-gray-100 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
                                                Histórico Financeiro - {student.name}
                                            </h4>
                                            {(!student.history || student.history.length === 0) ? (
                                                <p className="p-4 text-center text-sm text-gray-400">Nenhum registro encontrado.</p>
                                            ) : (
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="text-gray-500 border-b border-gray-100">
                                                            <th className="px-4 py-2 text-left font-medium">Data</th>
                                                            <th className="px-4 py-2 text-left font-medium">Tipo</th>
                                                            <th className="px-4 py-2 text-left font-medium">Descrição</th>
                                                            <th className="px-4 py-2 text-right font-medium">Saldo Após</th>
                                                            <th className="px-4 py-2 text-right font-medium">Valor</th>
                                                            <th className="px-4 py-2 text-center font-medium">Detalhes</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {student.history.map(entry => (
                                                            <React.Fragment key={entry.id}>
                                                            <tr className={`border-b border-gray-50 last:border-0 hover:bg-gray-50 ${expandedTxId === entry.id ? 'bg-blue-50' : ''}`}>
                                                                <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{new Date(entry.date).toLocaleString('pt-BR')}</td>
                                                                <td className="px-4 py-2">
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                                        entry.type === 'PAYMENT' ? 'bg-green-100 text-green-700' : 
                                                                        entry.type === 'REFUND' ? 'bg-orange-100 text-orange-700' :
                                                                        'bg-red-100 text-red-700'
                                                                    }`}>
                                                                        {entry.type === 'PAYMENT' ? 'Pagamento' : 
                                                                        entry.type === 'REFUND' ? 'Estorno' :
                                                                        'Compra'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-2 text-gray-800">{entry.description}</td>
                                                                <td className="px-4 py-2 text-right text-gray-500 font-mono text-xs">
                                                                    {entry.balanceAfter !== undefined ? 
                                                                        (entry.balanceAfter < 0 ? `Deve ${formatCurrency(Math.abs(entry.balanceAfter))}` : `Créd. ${formatCurrency(entry.balanceAfter)}`)
                                                                        : '-'
                                                                    }
                                                                </td>
                                                                <td className={`px-4 py-2 text-right font-bold ${
                                                                    entry.type === 'PAYMENT' || entry.type === 'REFUND' ? 'text-green-600' : 'text-red-500'
                                                                }`}>
                                                                    {entry.type === 'PAYMENT' || entry.type === 'REFUND' ? '+ ' : '- '}{formatCurrency(entry.value)}
                                                                </td>
                                                                <td className="px-4 py-2 text-center">
                                                                    {entry.items && entry.items.length > 0 && (
                                                                        <button 
                                                                            onClick={() => toggleTxDetails(entry.id)}
                                                                            className="text-blue-600 hover:text-blue-800 text-xs font-bold flex items-center justify-center gap-1 mx-auto"
                                                                        >
                                                                            {expandedTxId === entry.id ? 'Ocultar' : 'Ver Itens'}
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${expandedTxId === entry.id ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"/></svg>
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                            
                                                            {/* NESTED ITEMS ROW */}
                                                            {expandedTxId === entry.id && entry.items && (
                                                                <tr className="bg-blue-50/50">
                                                                    <td colSpan={6} className="p-0">
                                                                        <div className="mx-4 mb-2 p-3 bg-white border border-blue-100 rounded-lg shadow-sm">
                                                                            <p className="text-xs font-bold text-gray-500 uppercase mb-2">Itens Consumidos:</p>
                                                                            <table className="w-full text-xs">
                                                                                <thead>
                                                                                    <tr className="text-gray-400 border-b border-gray-100">
                                                                                        <th className="text-left py-1">Produto</th>
                                                                                        <th className="text-right py-1">Qtd</th>
                                                                                        <th className="text-right py-1">Unitário</th>
                                                                                        <th className="text-right py-1">Total</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody>
                                                                                    {entry.items.map((item, idx) => (
                                                                                        <tr key={idx} className="border-b border-gray-50 last:border-0">
                                                                                            <td className="py-1.5 font-medium text-gray-800">{item.name}</td>
                                                                                            <td className="py-1.5 text-right text-gray-600">{item.quantity}</td>
                                                                                            <td className="py-1.5 text-right text-gray-600">{formatCurrency(item.price)}</td>
                                                                                            <td className="py-1.5 text-right font-bold text-gray-800">{formatCurrency(item.price * item.quantity)}</td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                            </React.Fragment>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    );
                })
            )}
          </tbody>
        </table>
      </div>

      {/* FLOATING ACTION BAR FOR BATCH ACTIONS */}
      {selectedIds.size > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 z-30 animate-in slide-in-from-bottom-4">
              <span className="font-bold text-sm bg-gray-700 px-3 py-1 rounded-full">{selectedIds.size} selecionados</span>
              
              <button 
                  onClick={handleOpenBatchPaymentModal}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg font-bold text-sm transition-colors"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a4.5 4.5 0 0 0 0 9H14.5a4.5 4.5 0 0 1 0 9H6"/></svg>
                  Realizar Pagamento em Lote
              </button>

              <button 
                onClick={() => setSelectedIds(new Set())}
                className="text-gray-400 hover:text-white"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
          </div>
      )}

      {/* STUDENT FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 overflow-y-auto max-h-[90vh]">
            <h3 className="text-xl font-bold mb-4 border-b pb-2">{editingStudent ? 'Editar Cliente' : 'Novo Cliente'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* DADOS DO ALUNO */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-brand-600 uppercase">Dados do Aluno/Func.</h4>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                        <input 
                        type="text" 
                        required
                        className="w-full border rounded-lg p-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 outline-none"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cód. Aluno</label>
                            <input 
                            type="text" 
                            className="w-full border rounded-lg p-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 outline-none"
                            value={formData.code}
                            onChange={e => setFormData({...formData, code: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Turma</label>
                            <input 
                                type="text" 
                                required
                                placeholder="Ex: 5º Ano B"
                                className="w-full border rounded-lg p-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 outline-none"
                                value={formData.grade}
                                onChange={e => setFormData({...formData, grade: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Inicial (R$)</label>
                        <input 
                            type="number" 
                            step="0.01"
                            className="w-full border rounded-lg p-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-brand-500 outline-none"
                            value={formData.balance}
                            onChange={e => setFormData({...formData, balance: e.target.value})}
                        />
                    </div>
                     <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <input 
                                type="checkbox" 
                                id="isStaff"
                                className="w-4 h-4 text-brand-600 rounded focus:ring-brand-500"
                                checked={formData.isStaff}
                                onChange={e => setFormData({...formData, isStaff: e.target.checked})}
                            />
                            <label htmlFor="isStaff" className="text-sm text-gray-700 font-medium select-none cursor-pointer">
                                Este cliente é funcionário/professor
                            </label>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <input 
                                type="checkbox" 
                                id="isActive"
                                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                checked={formData.isActive}
                                onChange={e => setFormData({...formData, isActive: e.target.checked})}
                            />
                            <label htmlFor="isActive" className="text-sm text-gray-700 font-medium select-none cursor-pointer">
                                Cadastro Ativo
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-red-600 mb-1">Observações / Alergias</label>
                        <textarea 
                            className="w-full border border-red-200 bg-gray-800 text-white placeholder-gray-400 rounded-lg p-2 focus:ring-2 focus:ring-red-500 outline-none text-sm"
                            rows={3}
                            placeholder="Ex: Alergia a amendoim, Intolerância a lactose..."
                            value={formData.notes}
                            onChange={e => setFormData({...formData, notes: e.target.value})}
                        />
                    </div>
                </div>

                {/* DADOS DO RESPONSAVEL */}
                <div className="space-y-4">
                    <h4 className="text-sm font-bold text-blue-600 uppercase">Dados do Responsável</h4>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Responsável</label>
                        <input 
                        type="text" 
                        className="w-full border rounded-lg p-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Nome Pai/Mãe"
                        value={formData.guardianName}
                        onChange={e => setFormData({...formData, guardianName: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Celular / WhatsApp</label>
                        <input 
                        type="text" 
                        className="w-full border rounded-lg p-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="11999999999"
                        value={formData.guardianPhone}
                        onChange={e => setFormData({...formData, guardianPhone: e.target.value})}
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Apenas números com DDD</p>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                        <input 
                        type="email" 
                        className="w-full border rounded-lg p-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="email@exemplo.com"
                        value={formData.guardianEmail}
                        onChange={e => setFormData({...formData, guardianEmail: e.target.value})}
                        />
                        <p className="text-[10px] text-gray-400 mt-1">Será usado para login e envio de senha.</p>
                    </div>
                </div>

              </div>

              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-bold">
                    {editingStudent ? 'Salvar Cadastro' : 'Cadastrar e Gerar Acesso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BATCH PAYMENT MODAL */}
      {isBatchPaymentModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">Pagamento em Lote</h3>
                    <p className="text-sm text-gray-500 mt-1">
                        Processando pagamento para <span className="font-bold">{selectedIds.size}</span> clientes selecionados.
                    </p>
                </div>

                <div className="space-y-4 mb-6">
                    <div className="flex flex-col gap-2">
                        <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                            <input 
                                type="radio" 
                                name="batchType"
                                checked={batchPayFullDebt}
                                onChange={() => setBatchPayFullDebt(true)}
                                className="w-4 h-4 text-green-600 focus:ring-green-500"
                            />
                            <div className="flex-1">
                                <span className="block font-bold text-gray-800">Quitar Saldo Devedor Total</span>
                                <span className="text-xs text-gray-500">Zera o saldo de todos que estiverem negativos.</span>
                            </div>
                        </label>

                        <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                            <input 
                                type="radio" 
                                name="batchType"
                                checked={!batchPayFullDebt}
                                onChange={() => setBatchPayFullDebt(false)}
                                className="w-4 h-4 text-green-600 focus:ring-green-500"
                            />
                            <div className="flex-1">
                                <span className="block font-bold text-gray-800">Valor Fixo para Todos</span>
                                <input 
                                    type="number"
                                    step="0.01"
                                    placeholder="Ex: 50,00"
                                    disabled={batchPayFullDebt}
                                    value={batchAmount}
                                    onChange={e => setBatchAmount(e.target.value)}
                                    className="mt-1 w-full border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded p-1 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                                    onClick={e => e.stopPropagation()}
                                />
                            </div>
                        </label>
                    </div>

                    <label className="flex items-center gap-2 p-3 bg-purple-50 border border-purple-100 rounded-lg cursor-pointer">
                        <input 
                            type="checkbox"
                            checked={isPayrollDeduction}
                            onChange={e => setIsPayrollDeduction(e.target.checked)}
                            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                        />
                        <span className="font-bold text-purple-800 text-sm">Registrar como "Desconto em Folha"</span>
                    </label>
                </div>

                <div className="flex gap-3">
                    <button 
                        type="button" 
                        onClick={() => setIsBatchPaymentModalOpen(false)} 
                        className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-lg"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="button"
                        onClick={handleSubmitBatchPayment}
                        className="flex-1 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg"
                    >
                        Confirmar Pagamentos
                    </button>
                </div>
            </div>
          </div>
      )}

      {/* PAYMENT MODAL (SINGLE) */}
      {isPaymentModalOpen && paymentStudent && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a4.5 4.5 0 0 0 0 9H14.5a4.5 4.5 0 0 1 0 9H6"/></svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Receber Pagamento</h3>
                    <p className="text-sm text-gray-500">Cliente: <span className="font-bold">{paymentStudent.name}</span></p>
                    <p className={`text-sm font-bold mt-1 ${paymentStudent.balance < 0 ? 'text-red-500' : 'text-green-600'}`}>
                        Saldo Atual: {paymentStudent.balance < 0 ? `Devendo ${formatCurrency(Math.abs(paymentStudent.balance))}` : `Crédito ${formatCurrency(paymentStudent.balance)}`}
                    </p>
                </div>

                <form onSubmit={handleSubmitPayment}>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Valor do Recebimento (R$)</label>
                    <div className="relative mb-6">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                        <input 
                            type="number" 
                            step="0.01" 
                            autoFocus
                            required
                            min="0.01"
                            className="w-full pl-10 pr-4 py-3 text-xl font-bold bg-gray-800 border-2 border-green-500 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-100"
                            placeholder="0,00"
                            value={paymentAmount}
                            onChange={e => setPaymentAmount(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex gap-3">
                        <button 
                            type="button" 
                            onClick={() => setIsPaymentModalOpen(false)} 
                            className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-lg"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-lg"
                        >
                            Confirmar
                        </button>
                    </div>
                </form>
            </div>
          </div>
      )}

      {/* REFUND MODAL */}
      {isRefundModalOpen && refundStudent && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
                <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Estornar Valor</h3>
                    <p className="text-xs text-gray-500 mt-1">Isso devolverá crédito para a conta do aluno.</p>
                </div>

                <form onSubmit={handleSubmitRefund}>
                    <div className="mb-4">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Valor do Estorno (R$)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">R$</span>
                            <input 
                                type="number" 
                                step="0.01" 
                                autoFocus
                                required
                                min="0.01"
                                className="w-full pl-10 pr-4 py-3 text-xl font-bold bg-gray-800 border-2 border-orange-500 text-white placeholder-gray-400 rounded-lg focus:outline-none focus:ring-4 focus:ring-orange-100"
                                placeholder="0,00"
                                value={refundAmount}
                                onChange={e => setRefundAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Motivo do Estorno</label>
                        <input 
                            type="text"
                            required
                            placeholder="Ex: Erro de lançamento, Devolução..."
                            className="w-full border rounded-lg p-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 outline-none"
                            value={refundReason}
                            onChange={e => setRefundReason(e.target.value)}
                        />
                    </div>
                    
                    <div className="flex gap-3">
                        <button 
                            type="button" 
                            onClick={() => setIsRefundModalOpen(false)} 
                            className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-lg"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 shadow-lg"
                        >
                            Confirmar
                        </button>
                    </div>
                </form>
            </div>
          </div>
      )}
    </div>
  );
};
