
import React, { useState } from 'react';
import { Student } from '../types';

interface GuardianPortalViewProps {
  students: Student[];
  onExitPortal: () => void;
  onUpdateStudent: (student: Student) => void;
}

export const GuardianPortalView: React.FC<GuardianPortalViewProps> = ({ students, onExitPortal, onUpdateStudent }) => {
  const [loggedInStudent, setLoggedInStudent] = useState<Student | null>(null);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Change Password State
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changePassError, setChangePassError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Simple validation logic
    const found = students.find(s => 
        s.guardianEmail && 
        s.guardianEmail.trim().toLowerCase() === email.trim().toLowerCase() && 
        s.guardianPassword === password.trim()
    );

    if (found) {
        setLoggedInStudent(found);
    } else {
        setError('Usuário ou senha incorretos.');
    }
  };

  const handleLogout = () => {
    setLoggedInStudent(null);
    setEmail('');
    setPassword('');
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

      if (loggedInStudent) {
          const updatedStudent = {
              ...loggedInStudent,
              guardianPassword: newPassword
          };
          
          // Update in global app state (localStorage)
          onUpdateStudent(updatedStudent);
          
          // Update local state
          setLoggedInStudent(updatedStudent);
          
          // Reset forms
          setNewPassword('');
          setConfirmPassword('');
          setShowChangePasswordModal(false);
          alert('Senha alterada com sucesso!');
      }
  };

  // --- LOGIN SCREEN ---
  if (!loggedInStudent) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-cyan-400 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative">
                <div className="text-center mb-8">
                    <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Portal do Responsável</h1>
                    <p className="text-gray-500 text-sm mt-1">Acompanhe o saldo e consumo da cantina.</p>
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
                         <div className="text-right mt-2">
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
            <div className="max-w-4xl mx-auto flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold">Olá, {loggedInStudent.guardianName || 'Responsável'}</h1>
                    <p className="text-blue-100 text-sm">Aluno: {loggedInStudent.name}</p>
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
            
            {/* Balance Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <p className="text-gray-500 uppercase text-xs font-bold tracking-wider mb-2">Saldo Atual</p>
                <div className="flex items-end gap-2">
                    <span className={`text-4xl font-black ${loggedInStudent.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {loggedInStudent.balance < 0 ? '- R$ ' : 'R$ '} 
                        {Math.abs(loggedInStudent.balance).toFixed(2)}
                    </span>
                    <span className="text-gray-400 mb-2 text-sm font-medium">
                        {loggedInStudent.balance < 0 ? '(Devedor)' : '(Crédito)'}
                    </span>
                </div>
                {loggedInStudent.balance < 0 && (
                    <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100">
                        Por favor, entre em contato com a escola para regularizar pendências.
                    </div>
                )}
            </div>

            {/* History List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="font-bold text-gray-800">Extrato de Movimentações</h2>
                </div>
                <div className="divide-y divide-gray-100">
                    {(!loggedInStudent.history || loggedInStudent.history.length === 0) ? (
                        <p className="p-8 text-center text-gray-400">Nenhuma movimentação registrada.</p>
                    ) : (
                        loggedInStudent.history.map(entry => (
                            <div key={entry.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">{new Date(entry.date).toLocaleString('pt-BR')}</p>
                                        <p className="font-bold text-gray-800">{entry.description}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-bold ${entry.type === 'PURCHASE' ? 'text-red-500' : 'text-green-600'}`}>
                                            {entry.type === 'PURCHASE' ? '-' : '+'} R$ {entry.value.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                                {entry.items && entry.items.length > 0 && (
                                    <div className="mt-2 bg-gray-50 p-3 rounded border border-gray-100 text-sm text-gray-600">
                                        <ul className="list-disc list-inside">
                                            {entry.items.map((item, idx) => (
                                                <li key={idx}><span className="font-medium">{item.quantity}x</span> {item.name}</li>
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
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Alterar Senha</h3>
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
