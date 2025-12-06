
import React, { useState } from 'react';
import { Student } from '../types';

interface AccessManagementViewProps {
  students: Student[];
  onUpdateStudent: (student: Student) => void;
}

export const AccessManagementView: React.FC<AccessManagementViewProps> = ({ students, onUpdateStudent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [manualPassword, setManualPassword] = useState('');

  // ROBUST URL GENERATION
  // Pega a URL completa atual, remove qualquer # existente e adiciona o hash do portal.
  // Isso preserva tokens de sessão ou caminhos estranhos de ambientes de preview (blob, etc).
  const getCurrentUrl = () => {
      const currentFullUrl = window.location.href;
      const baseUrl = currentFullUrl.split('#')[0]; // Remove hash anterior se houver
      return `${baseUrl}#/portal`;
  };

  const portalUrl = getCurrentUrl();

  const handleCopyLink = () => {
      navigator.clipboard.writeText(portalUrl);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
  };

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

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50 overflow-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h2 className="text-2xl font-bold text-gray-800">Gestão de Acessos</h2>
            <p className="text-sm text-gray-500">Gerencie senhas e envie credenciais para os responsáveis acessarem o portal.</p>
        </div>
      </div>

      {/* PORTAL LINK CARD - Painel Solicitado */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
              </div>
              <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-blue-800">Acesso ao Portal dos Pais</h3>
                  {/* Mascaramos a URL real visualmente, mas ela funciona nos botões */}
                  <p className="text-sm text-blue-600 font-medium">
                      PortalCantinaEscolaPro (Link Ativo)
                  </p>
              </div>
          </div>
          <div className="flex gap-2 shrink-0">
               <button 
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-white border border-blue-200 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-50 flex items-center gap-2"
              >
                  {copyFeedback ? (
                      <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          Copiado!
                      </>
                  ) : (
                      <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                          Copiar Link
                      </>
                  )}
              </button>
              <button 
                  onClick={() => window.open(portalUrl, '_blank')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>
                  Abrir
              </button>
          </div>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
           <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/></svg>
                </span>
                <input 
                    type="text" 
                    placeholder="Buscar aluno, responsável ou e-mail..." 
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
      </div>

      {/* TABLE */}
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
                <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-400">Nenhum registro encontrado.</td>
                </tr>
            ) : (
                filteredStudents.map(student => {
                    const hasAccess = student.guardianEmail && student.guardianPassword;
                    return (
                        <tr key={student.id} className="hover:bg-gray-50">
                            <td className="p-4">
                                <p className="font-bold text-gray-800">{student.name}</p>
                                <p className="text-xs text-gray-500">{student.grade}</p>
                            </td>
                            <td className="p-4 text-sm text-gray-700">
                                {student.guardianName || '-'}
                            </td>
                            <td className="p-4 text-sm text-gray-600 font-mono">
                                {student.guardianEmail || <span className="text-gray-400 italic">Não cadastrado</span>}
                            </td>
                            <td className="p-4 text-center">
                                {hasAccess ? (
                                    <span className="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full font-bold uppercase">Ativo</span>
                                ) : (
                                    <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded-full font-bold uppercase">Pendente</span>
                                )}
                            </td>
                            <td className="p-4 text-center">
                                <button 
                                    onClick={() => openManageModal(student)}
                                    className="px-3 py-1.5 bg-brand-100 text-brand-700 rounded-lg text-xs font-bold hover:bg-brand-200 flex items-center gap-1 mx-auto"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
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

      {/* MANAGE PASSWORD MODAL */}
      {isModalOpen && selectedStudent && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-gray-800">Configurar Acesso</h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
                      </button>
                  </div>

                  <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                      <p className="text-sm text-gray-500 mb-1">Aluno: <span className="font-bold text-gray-800">{selectedStudent.name}</span></p>
                      <p className="text-sm text-gray-500 mb-1">Responsável: <span className="font-bold text-gray-800">{selectedStudent.guardianName || 'Não informado'}</span></p>
                      <p className="text-sm text-gray-500">Login (E-mail): <span className="font-bold text-blue-600">{selectedStudent.guardianEmail || 'Não cadastrado'}</span></p>
                      {!selectedStudent.guardianEmail && (
                          <p className="text-xs text-red-500 mt-2 font-bold">⚠️ Cadastre um e-mail na aba Alunos para ativar o acesso.</p>
                      )}
                  </div>

                  <div className="mb-6">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Senha de Acesso</label>
                      <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input 
                                type={showPassword ? "text" : "password"} 
                                className="w-full border rounded-lg pl-3 pr-10 py-2 focus:ring-2 focus:ring-brand-500 outline-none font-mono"
                                value={manualPassword}
                                onChange={(e) => setManualPassword(e.target.value)}
                                placeholder="Defina uma senha"
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" x2="23" y1="1" y2="23"/></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                )}
                            </button>
                          </div>
                          <button 
                            onClick={handleGenerateRandom}
                            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-300"
                            title="Gerar Aleatória"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6"/><path d="M21.34 15.57a10 10 0 1 1-.57-8.38"/></svg>
                          </button>
                      </div>
                  </div>

                  <div className="flex gap-3 mb-6">
                      <a 
                        href={getWhatsAppLink(selectedStudent, manualPassword)}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex-1 py-2 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-2 ${selectedStudent.guardianPhone ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'}`}
                        onClick={(e) => !selectedStudent.guardianPhone && e.preventDefault()}
                      >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                          Enviar WhatsApp
                      </a>
                      <a 
                        href={getEmailLink(selectedStudent, manualPassword)}
                        className={`flex-1 py-2 rounded-lg text-white font-bold text-xs flex items-center justify-center gap-2 ${selectedStudent.guardianEmail ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300 cursor-not-allowed'}`}
                        onClick={(e) => !selectedStudent.guardianEmail && e.preventDefault()}
                      >
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                         Enviar E-mail
                      </a>
                  </div>

                  <div className="flex justify-end gap-2 border-t pt-4">
                      <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">
                          Cancelar
                      </button>
                      <button onClick={handleSavePassword} className="px-6 py-2 bg-brand-600 text-white font-bold rounded-lg hover:bg-brand-700 shadow">
                          Salvar Senha
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
