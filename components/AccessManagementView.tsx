
import React, { useState } from 'react';
import { Student, SystemUser, UserRole } from '../types';

interface AccessManagementViewProps {
  students: Student[];
  onUpdateStudent: (student: Student) => void;
  // System User Props (Optional to maintain backward compatibility if not passed immediately)
  systemUsers?: SystemUser[];
  onAddSystemUser?: (user: SystemUser) => void;
  onUpdateSystemUser?: (user: SystemUser) => void;
  onDeleteSystemUser?: (id: string) => void;
}

type AccessTab = 'PARENTS' | 'SYSTEM';

export const AccessManagementView: React.FC<AccessManagementViewProps> = ({ 
    students, 
    onUpdateStudent,
    systemUsers = [],
    onAddSystemUser,
    onUpdateSystemUser,
    onDeleteSystemUser
}) => {
  const [activeTab, setActiveTab] = useState<AccessTab>('PARENTS');
  
  // === PARENTS TAB STATE ===
  const [searchTerm, setSearchTerm] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [manualPassword, setManualPassword] = useState('');

  // === SYSTEM TAB STATE ===
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [userFormData, setUserFormData] = useState({ name: '', login: '', password: '', role: 'CASHIER' as UserRole });
  const [userSearch, setUserSearch] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);

  // === HELPER FUNCTIONS ===
  const getCurrentUrl = () => {
      const currentFullUrl = window.location.href;
      const baseUrl = currentFullUrl.split('#')[0];
      return `${baseUrl}#/portal`;
  };

  const portalUrl = getCurrentUrl();

  const handleCopyLink = () => {
      navigator.clipboard.writeText(portalUrl);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
  };

  // --- Parent Logic ---
  const openManageModal = (student: Student) => {
      setSelectedStudent(student);
      setManualPassword(student.guardianPassword || '');
      setShowPassword(false);
      setIsModalOpen(true);
  };

  const handleGenerateRandom = () => {
      const randomPass = Math.random().toString(36).slice(-6).toUpperCase();
      setManualPassword(randomPass);
  };

  const handleSavePassword = () => {
      if (selectedStudent) {
          onUpdateStudent({
              ...selectedStudent,
              guardianPassword: manualPassword
          });
          setIsModalOpen(false);
      }
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.guardianName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.guardianEmail?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMessageDetails = (student: Student, pass: string) => {
      const subject = `Acesso Portal Cantina - ${student.name}`;
      const body = `Olá ${student.guardianName || 'Responsável'},\n\nSegue seus dados de acesso para acompanhar o saldo e extrato da cantina escolar.\n\nLink do Portal:\n${portalUrl}\n\nUsuario (E-mail): ${student.guardianEmail || 'Seu E-mail'}\nSenha: ${pass}\n\nAtenciosamente,\nCantina Escolar`;
      return { subject, body };
  };

  const getEmailLink = (student: Student, pass: string) => {
      if (!student.guardianEmail) return '#';
      const { subject, body } = getMessageDetails(student, pass);
      return `mailto:${student.guardianEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const getWhatsAppLink = (student: Student, pass: string) => {
      if (!student.guardianPhone) return '#';
      const { body } = getMessageDetails(student, pass);
      const phone = student.guardianPhone.replace(/\D/g, '');
      return `https://wa.me/55${phone}?text=${encodeURIComponent(body)}`;
  };

  // --- System User Logic ---
  const openUserModal = (user?: SystemUser) => {
      if (user) {
          setEditingUser(user);
          setUserFormData({ name: user.name, login: user.login, password: user.password || '', role: user.role });
      } else {
          setEditingUser(null);
          setUserFormData({ name: '', login: '', password: '', role: 'CASHIER' });
      }
      setShowUserPassword(false);
      setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
      e.preventDefault();
      if (!onAddSystemUser || !onUpdateSystemUser) return;

      if (editingUser) {
          onUpdateSystemUser({ ...editingUser, ...userFormData });
      } else {
          onAddSystemUser({ id: Date.now().toString(), ...userFormData });
      }
      setIsUserModalOpen(false);
  };

  const filteredSystemUsers = systemUsers.filter(u => 
      u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
      u.login.toLowerCase().includes(userSearch.toLowerCase())
  );


  return (
    <div className="p-6 h-full flex flex-col bg-gray-50 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Gestão Administrativa</h2>
        </div>
      </div>

      {/* TABS HEADER */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button 
              onClick={() => setActiveTab('PARENTS')}
              className={`pb-2 px-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'PARENTS' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              Portal dos Pais
          </button>
          <button 
              onClick={() => setActiveTab('SYSTEM')}
              className={`pb-2 px-4 font-bold text-sm transition-colors border-b-2 ${activeTab === 'SYSTEM' ? 'border-brand-600 text-brand-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
              Usuários do Sistema
          </button>
      </div>

      {activeTab === 'PARENTS' && (
          <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in">
                {/* PORTAL LINK CARD */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-blue-800">Acesso ao Portal dos Pais</h3>
                            <p className="text-sm text-blue-600 font-medium">PortalCantinaEscolaPro (Link Ativo)</p>
                        </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button onClick={handleCopyLink} className="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-50 flex items-center gap-2">
                            {copyFeedback ? 'Copiado!' : 'Copiar Link'}
                        </button>
                        <button onClick={() => window.open(portalUrl, '_blank')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2">
                            Abrir
                        </button>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Buscar aluno, responsável ou e-mail..." 
                            className="w-full pl-4 pr-4 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-gray-200">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs sticky top-0 z-10">
                            <tr>
                            <th className="p-4">Aluno</th>
                            <th className="p-4">Responsável</th>
                            <th className="p-4">Credenciais (E-mail)</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredStudents.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum registro encontrado.</td></tr>
                            ) : (
                                filteredStudents.map(student => {
                                    const hasAccess = student.guardianEmail && student.guardianPassword;
                                    return (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="p-4"><p className="font-bold text-gray-800">{student.name}</p><p className="text-xs text-gray-500">{student.grade}</p></td>
                                            <td className="p-4 text-sm text-gray-700">{student.guardianName || '-'}</td>
                                            <td className="p-4 text-sm text-gray-600 font-mono">{student.guardianEmail || <span className="text-gray-400 italic">Não cadastrado</span>}</td>
                                            <td className="p-4 text-center">
                                                {hasAccess ? <span className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full font-bold uppercase">Ativo</span> : <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded-full font-bold uppercase">Pendente</span>}
                                            </td>
                                            <td className="p-4 text-center">
                                                <button onClick={() => openManageModal(student)} className="px-3 py-1.5 bg-brand-100 text-brand-700 rounded-lg text-xs font-bold hover:bg-brand-200 flex items-center gap-1 mx-auto">
                                                    Gerenciar Acesso
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
          </div>
      )}

      {activeTab === 'SYSTEM' && (
          <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex justify-between items-center gap-4">
                    <div className="flex-1 relative">
                        <input 
                            type="text" 
                            placeholder="Buscar usuário..." 
                            className="w-full pl-4 pr-4 py-2 border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={() => openUserModal()}
                        className="px-4 py-2 bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700 flex items-center gap-2"
                    >
                        + Novo Usuário
                    </button>
              </div>

              <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-gray-200">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs sticky top-0 z-10">
                            <tr>
                            <th className="p-4">Nome</th>
                            <th className="p-4">Login</th>
                            <th className="p-4">Cargo / Permissão</th>
                            <th className="p-4 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredSystemUsers.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-gray-400">Nenhum usuário encontrado.</td></tr>
                            ) : (
                                filteredSystemUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="p-4 font-bold text-gray-800">{user.name}</td>
                                        <td className="p-4 text-gray-600 font-mono text-sm">{user.login}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {user.role === 'ADMIN' ? 'Administrador' : 'Operador Caixa'}
                                            </span>
                                        </td>
                                        <td className="p-4 flex justify-center gap-2">
                                            <button onClick={() => openUserModal(user)} className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                                            </button>
                                            <button onClick={() => onDeleteSystemUser && onDeleteSystemUser(user.id)} className="p-2 text-red-600 hover:bg-red-50 rounded">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
              </div>
          </div>
      )}

      {/* MANAGE PARENT PASSWORD MODAL */}
      {isModalOpen && selectedStudent && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-800">Configurar Acesso Pai</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                      </button>
                  </div>
                  {/* ... Existing Parent Modal Content ... */}
                  <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <p className="text-sm text-gray-500 mb-1">Aluno: <span className="font-bold text-gray-800">{selectedStudent.name}</span></p>
                      <p className="text-sm text-gray-500">Login: <span className="font-bold text-blue-600">{selectedStudent.guardianEmail || 'Não cadastrado'}</span></p>
                  </div>
                  <div className="mb-6">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Senha de Acesso</label>
                      <div className="flex gap-2">
                          <input 
                                type={showPassword ? "text" : "password"} 
                                className="w-full border rounded-lg pl-3 pr-10 py-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400 font-mono"
                                value={manualPassword}
                                onChange={(e) => setManualPassword(e.target.value)}
                                placeholder="Defina uma senha"
                            />
                          <button onClick={handleGenerateRandom} className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-300">Aleatória</button>
                      </div>
                  </div>
                  <div className="flex gap-3 mb-6">
                      <a href={getWhatsAppLink(selectedStudent, manualPassword)} target="_blank" rel="noreferrer" className={`flex-1 py-2 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-2 ${selectedStudent.guardianPhone ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'}`} onClick={(e) => !selectedStudent.guardianPhone && e.preventDefault()}>WhatsApp</a>
                      <a href={getEmailLink(selectedStudent, manualPassword)} className={`flex-1 py-2 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-2 ${selectedStudent.guardianEmail ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300 cursor-not-allowed'}`} onClick={(e) => !selectedStudent.guardianEmail && e.preventDefault()}>E-mail</a>
                  </div>
                  <div className="flex justify-end gap-2 border-t pt-4">
                      <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">Cancelar</button>
                      <button onClick={handleSavePassword} className="px-6 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow">Salvar Senha</button>
                  </div>
              </div>
          </div>
      )}

      {/* SYSTEM USER MODAL */}
      {isUserModalOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                 <h3 className="text-xl font-bold mb-4">{editingUser ? 'Editar Usuário' : 'Novo Usuário do Sistema'}</h3>
                 <form onSubmit={handleSaveUser}>
                     <div className="space-y-4">
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                             <input 
                                required
                                type="text"
                                value={userFormData.name}
                                onChange={e => setUserFormData({...userFormData, name: e.target.value})}
                                className="w-full border rounded-lg p-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                             />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Login (Acesso)</label>
                             <input 
                                required
                                type="text"
                                value={userFormData.login}
                                onChange={e => setUserFormData({...userFormData, login: e.target.value})}
                                className="w-full border rounded-lg p-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                             />
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                             <div className="relative">
                                 <input 
                                    required={!editingUser}
                                    type={showUserPassword ? "text" : "password"}
                                    value={userFormData.password}
                                    onChange={e => setUserFormData({...userFormData, password: e.target.value})}
                                    className="w-full border rounded-lg p-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
                                    placeholder={editingUser ? "Deixe em branco para manter" : ""}
                                 />
                                 <button type="button" onClick={() => setShowUserPassword(!showUserPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                     {showUserPassword ? "Ocultar" : "Ver"}
                                 </button>
                             </div>
                         </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-700 mb-1">Cargo</label>
                             <select 
                                value={userFormData.role}
                                onChange={e => setUserFormData({...userFormData, role: e.target.value as UserRole})}
                                className="w-full border rounded-lg p-2 bg-gray-800 border-gray-700 text-white"
                             >
                                 <option value="CASHIER">Operador de Caixa</option>
                                 <option value="ADMIN">Administrador</option>
                             </select>
                         </div>
                     </div>
                     <div className="flex justify-end gap-2 mt-6">
                        <button type="button" onClick={() => setIsUserModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-bold">Salvar</button>
                     </div>
                 </form>
            </div>
          </div>
      )}

    </div>
  );
};
