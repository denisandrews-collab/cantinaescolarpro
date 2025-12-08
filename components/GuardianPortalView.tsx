
import React, { useState, useEffect, useMemo } from 'react';
import { Student, StudentHistoryEntry } from '../types';

interface GuardianPortalViewProps {
  students: Student[];
  onExitPortal: () => void;
  onUpdateStudent: (student: Student) => void;
}

// Helper type for merging history from multiple students
interface FamilyHistoryEntry extends StudentHistoryEntry {
    studentName: string;
}

export const GuardianPortalView: React.FC<GuardianPortalViewProps> = ({ students, onExitPortal, onUpdateStudent }) => {
  // Store all students belonging to this guardian
  const [familyGroup, setFamilyGroup] = useState<Student[]>([]);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Change Password State
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePassError, setChangePassError] = useState('');

  // Load saved credentials on mount
  useEffect(() => {
      const saved = localStorage.getItem('cantina_remember_guardian');
      if (saved) {
          try {
              const { e, p } = JSON.parse(saved);
              setEmail(e);
              setPassword(p);
              setRememberMe(true);
          } catch (err) {
              // Ignore invalid json
          }
      }
  }, []);

  // Sync local family group with global students state (for updates/balance changes)
  useEffect(() => {
      if (familyGroup.length > 0) {
          // Re-fetch the family group from the updated 'students' prop based on the current email
          // We use the email of the first logged in student as the key
          const currentEmail = familyGroup[0].guardianEmail?.toLowerCase();
          if (currentEmail) {
              const updatedGroup = students.filter(s => 
                  s.guardianEmail?.toLowerCase() === currentEmail &&
                  // Ensure password match to avoid leaking if email is reused without same password (unlikely but safe)
                  s.guardianPassword === familyGroup[0].guardianPassword 
              );
              if (updatedGroup.length > 0) {
                  setFamilyGroup(updatedGroup);
              }
          }
      }
  }, [students]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPass = password.trim();

    // Find ALL students matching credentials
    const foundStudents = students.filter(s => 
        s.guardianEmail && 
        s.guardianEmail.trim().toLowerCase() === trimmedEmail && 
        s.guardianPassword === trimmedPass
    );

    if (foundStudents.length > 0) {
        if (rememberMe) {
            localStorage.setItem('cantina_remember_guardian', JSON.stringify({ e: trimmedEmail, p: trimmedPass }));
        } else {
            localStorage.removeItem('cantina_remember_guardian');
        }
        setFamilyGroup(foundStudents);
    } else {
        setError('Usuário ou senha incorretos.');
    }
  };

  const handleLogout = () => {
    setFamilyGroup([]);
    // Don't clear email/pass if remember me is on, just logout
    if (!rememberMe) {
        setEmail('');
        setPassword('');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
      e.preventDefault();
      setChangePassError('');

      if (newPassword.length < 3) {
          setChangePassError('A senha deve ter pelo menos 3 caracteres.');
          return;
      }

      if (newPassword !== confirmPassword) {
          setChangePassError('As senhas não coincidem.');
          return;
      }

      if (familyGroup.length > 0) {
          // Update password for ALL students in the group
          familyGroup.forEach(student => {
              const updatedStudent = {
                  ...student,
                  guardianPassword: newPassword
              };
              onUpdateStudent(updatedStudent);
          });
          
          // Update saved credential if remember me is on
          if (rememberMe) {
              localStorage.setItem('cantina_remember_guardian', JSON.stringify({ e: email, p: newPassword }));
          }

          setNewPassword('');
          setConfirmPassword('');
          setShowChangePasswordModal(false);
          alert('Senha alterada com sucesso para todos os dependentes!');
      }
  };

  // --- COMPUTED VALUES ---
  const totalBalance = useMemo(() => {
      return familyGroup.reduce((accumulator, student) => accumulator + student.balance, 0);
  }, [familyGroup]);

  const guardianName = familyGroup.length > 0 ? (familyGroup[0].guardianName || 'Responsável') : '';

  const mergedHistory = useMemo(() => {
      let allHistory: FamilyHistoryEntry[] = [];
      familyGroup.forEach(student => {
          const studentHistory = (student.history || []).map(historyEntry => ({
              ...historyEntry,
              studentName: student.name // Tag transaction with student name
          }));
          allHistory = [...allHistory, ...studentHistory];
      });
      // Sort by date descending
      return allHistory.sort((entryA, entryB) => new Date(entryB.date).getTime() - new Date(entryA.date).getTime());
  }, [familyGroup]);


  // --- LOGIN SCREEN ---
  if (familyGroup.length === 0) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-cyan-400 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
                <div className="text-center mb-8">
                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Portal do Responsável</h1>
                    <p className="text-gray-500 text-sm mt-1">Acompanhe o saldo e consumo da família.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Cadastrado</label>
                        <input 
                            type="email" 
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="seu@email.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Senha de Acesso</label>
                        <input 
                            type="password" 
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="••••••"
                        />
                         <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center">
                                <input 
                                    id="remember-me-guardian" 
                                    type="checkbox" 
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                />
                                <label htmlFor="remember-me-guardian" className="ml-2 block text-sm text-gray-600 cursor-pointer select-none">
                                    Salvar senha
                                </label>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setShowForgotModal(true)}
                                className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                            >
                                Esqueci minha senha
                            </button>
                        </div>
                    </div>
                    
                    {error && (
                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg text-center font-medium">
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-lg"
                    >
                        Entrar
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                    <button onClick={onExitPortal} className="text-xs text-gray-400 hover:text-gray-600 underline">
                        Acesso Administrativo (Voltar)
                    </button>
                </div>
            </div>

            {/* FORGOT PASSWORD MODAL */}
            {showForgotModal && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center animate-in zoom-in duration-200">
                        <div className="w-12 h-12 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Recuperação de Senha</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            Por questões de segurança, a redefinição de senha deve ser solicitada diretamente à administração da escola ou cantina.
                        </p>
                        <button 
                            onClick={() => setShowForgotModal(false)}
                            className="w-full py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300"
                        >
                            Entendi, vou contatar a escola
                        </button>
                    </div>
                </div>
            )}
        </div>
      );
  }

  // --- DASHBOARD SCREEN ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-blue-600 text-white p-6 shadow-lg">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-xl font-bold">Olá, {guardianName}</h1>
                    <p className="text-blue-100 text-sm">Visualizando dados de {familyGroup.length} dependente(s)</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowChangePasswordModal(true)}
                        className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-blue-500"
                    >
                        Alterar Senha
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="bg-blue-800 hover:bg-blue-900 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        Sair
                    </button>
                </div>
            </div>
        </header>

        <main className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6 space-y-6">
            
            {/* Total Balance Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <p className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-2">Saldo Total da Família</p>
                <div className="flex items-end gap-2">
                    <span className={`text-4xl font-black ${totalBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {totalBalance < 0 ? '- R$ ' : 'R$ '} 
                        {Math.abs(totalBalance).toFixed(2)}
                    </span>
                    <span className="text-gray-400 mb-2 text-sm font-medium">
                        {totalBalance < 0 ? '(Devedor)' : '(Crédito)'}
                    </span>
                </div>
                {totalBalance < 0 && (
                    <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100">
                        Atenção: Existem pendências financeiras no grupo familiar.
                    </div>
                )}
            </div>

            {/* Individual Student Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {familyGroup.map(student => (
                    <div key={student.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex justify-between items-center hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                                {student.name.charAt(0)}
                            </div>
                            <div>
                                <p className="font-bold text-gray-800 leading-tight">{student.name}</p>
                                <p className="text-xs text-gray-500">{student.grade}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400 uppercase font-bold mb-0.5">Saldo</p>
                            <p className={`font-bold ${student.balance < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                {student.balance < 0 ? '-' : ''}R$ {Math.abs(student.balance).toFixed(2)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Unified History List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h2 className="font-bold text-gray-800">Extrato Unificado</h2>
                    <span className="text-xs text-gray-500">Últimas movimentações de todos os dependentes</span>
                </div>
                <div className="divide-y divide-gray-100">
                    {mergedHistory.length === 0 ? (
                        <p className="p-8 text-center text-gray-400">Nenhuma movimentação registrada.</p>
                    ) : (
                        mergedHistory.map((entry, idx) => (
                            <div key={`${entry.id}-${idx}`} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase whitespace-nowrap">
                                            {entry.studentName}
                                        </span>
                                        <p className="text-xs text-gray-500">{new Date(entry.date).toLocaleString('pt-BR')}</p>
                                    </div>
                                    <div className="flex-1 md:text-right">
                                        <p className={`font-bold ${entry.type === 'PURCHASE' ? 'text-red-500' : 'text-green-600'}`}>
                                            {entry.type === 'PURCHASE' ? '-' : '+'} R$ {entry.value.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                                
                                <p className="font-medium text-gray-800 mb-2">{entry.description}</p>

                                {entry.items && entry.items.length > 0 && (
                                    <div className="bg-gray-50 p-3 rounded border border-gray-100 text-sm text-gray-600">
                                        <ul className="list-disc list-inside">
                                            {entry.items.map((item, i) => (
                                                <li key={i}><span className="font-medium">{item.quantity}x</span> {item.name}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </main>

        {/* CHANGE PASSWORD MODAL */}
        {showChangePasswordModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Alterar Senha da Família</h3>
                    <div className="bg-yellow-50 border border-yellow-100 text-yellow-800 p-3 rounded-lg text-xs mb-4">
                        Atenção: A nova senha será aplicada para o acesso de <b>todos</b> os dependentes vinculados a este e-mail.
                    </div>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                            <input 
                                type="password" 
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
                            <input 
                                type="password" 
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        
                        {changePassError && (
                            <p className="text-sm text-red-600">{changePassError}</p>
                        )}

                        <div className="flex gap-3 pt-2">
                            <button 
                                type="button" 
                                onClick={() => setShowChangePasswordModal(false)}
                                className="flex-1 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                className="flex-1 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700"
                            >
                                Salvar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};
