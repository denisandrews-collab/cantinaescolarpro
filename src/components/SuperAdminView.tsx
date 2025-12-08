import React, { useState, useMemo } from 'react';
import { Company, AppModule } from '../types';

interface SuperAdminViewProps {
  companies: Company[];
  onSaveCompany: (company: Company) => void;
  onSelectCompany: (companyId: string) => void;
  onDeleteCompany: (companyId: string) => void;
}

const AVAILABLE_MODULES: { key: AppModule; label: string; description: string }[] = [
    { key: 'POS', label: 'Ponto de Venda (PDV)', description: 'Tela de vendas, caixa e emissão de cupons.' },
    { key: 'FINANCIAL', label: 'Financeiro & Alunos', description: 'Gestão de contas de alunos, fiado, cobrança e extratos.' },
    { key: 'INVENTORY', label: 'Estoque & Produtos', description: 'Cadastro de produtos, controle de estoque e trocas.' },
    { key: 'REPORTS', label: 'Relatórios Avançados', description: 'Gráficos, exportação de dados e análise de vendas.' },
    { key: 'ACCESS_CONTROL', label: 'Gestão de Acesso (Enterprise)', description: 'Gerenciamento de usuários do sistema e senhas dos pais.' },
    { key: 'PARENTS_PORTAL', label: 'Portal dos Pais', description: 'Área externa para responsáveis consultarem saldo.' },
    { key: 'API_INTEGRATION', label: 'Integrações (API)', description: 'Conexão com sistemas externos de alunos/produtos.' },
];

export const SuperAdminView: React.FC<SuperAdminViewProps> = ({ companies, onSaveCompany, onSelectCompany, onDeleteCompany }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<{name: string, modules: Set<AppModule>}>({
      name: '',
      modules: new Set(['POS', 'FINANCIAL', 'INVENTORY', 'REPORTS', 'ACCESS_CONTROL']) // Default modules
  });

  // FILTER LOGIC: Search by Name OR ID
  const filteredCompanies = useMemo(() => {
    if (!searchTerm) return companies;
    const lowerTerm = searchTerm.toLowerCase();
    return companies.filter(c => 
        c.name.toLowerCase().includes(lowerTerm) || 
        c.id.toLowerCase().includes(lowerTerm)
    );
  }, [companies, searchTerm]);

  const handleOpenModal = (company?: Company) => {
      if (company) {
          setEditingCompany(company);
          setFormData({
              name: company.name,
              modules: new Set(company.modules)
          });
      } else {
          setEditingCompany(null);
          setFormData({
              name: '',
              modules: new Set(['POS', 'FINANCIAL', 'INVENTORY', 'REPORTS', 'ACCESS_CONTROL'])
          });
      }
      setIsModalOpen(true);
  };

  const toggleModule = (moduleKey: AppModule) => {
      const newModules = new Set(formData.modules);
      if (newModules.has(moduleKey)) {
          newModules.delete(moduleKey);
      } else {
          newModules.add(moduleKey);
      }
      setFormData({ ...formData, modules: newModules });
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const companyPayload: Company = {
          id: editingCompany ? editingCompany.id : Date.now().toString(),
          name: formData.name,
          active: true,
          createdAt: editingCompany ? editingCompany.createdAt : new Date().toISOString(),
          modules: Array.from(formData.modules)
      };

      onSaveCompany(companyPayload);
      setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans p-8">
      <div className="max-w-6xl mx-auto">
          <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
              <div>
                  <h1 className="text-3xl font-bold text-white tracking-tight">CantinaEscolar <span className="text-brand-500">Enterprise</span></h1>
                  <p className="text-gray-400 mt-1">Gerenciamento Multi-Empresas</p>
              </div>
              <div className="flex gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none">
                    <input 
                        type="text" 
                        placeholder="Filtrar por Nome ou ID..." 
                        className="w-full md:w-72 pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="bg-brand-600 hover:bg-brand-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2 whitespace-nowrap"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="16" y1="12" y2="12"/></svg>
                    Nova Empresa
                </button>
              </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCompanies.map(company => (
                  <div key={company.id} className="bg-gray-800 border border-gray-700 rounded-2xl p-6 hover:border-brand-500 transition-colors group relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <button onClick={() => handleOpenModal(company)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-blue-400" title="Editar Configurações">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                          </button>
                          <button onClick={() => { if(window.confirm('Tem certeza? Isso apagará o acesso a esta empresa, mas manterá os dados salvos.')) onDeleteCompany(company.id); }} className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-red-400" title="Remover da Lista">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>
                      </div>

                      <div className="mb-4">
                          <div className="w-12 h-12 bg-brand-900 text-brand-400 rounded-xl flex items-center justify-center mb-4 text-xl font-bold">
                              {company.name.charAt(0).toUpperCase()}
                          </div>
                          <h3 className="text-xl font-bold text-white mb-1">{company.name}</h3>
                          <p className="text-sm text-gray-500 font-mono">ID: {company.id}</p>
                      </div>

                      <div className="space-y-2 mb-6">
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Módulos Ativos</p>
                          <div className="flex flex-wrap gap-2">
                              {company.modules.slice(0, 4).map(mod => (
                                  <span key={mod} className="bg-gray-700 text-gray-300 text-[10px] px-2 py-1 rounded border border-gray-600">
                                      {AVAILABLE_MODULES.find(m => m.key === mod)?.label.split(' ')[0]}
                                  </span>
                              ))}
                              {company.modules.length > 4 && (
                                  <span className="bg-gray-700 text-gray-300 text-[10px] px-2 py-1 rounded border border-gray-600">
                                      +{company.modules.length - 4}
                                  </span>
                              )}
                          </div>
                      </div>

                      <button 
                        onClick={() => onSelectCompany(company.id)}
                        className="w-full py-3 bg-gray-700 hover:bg-brand-600 text-white rounded-lg font-bold transition-colors flex justify-center items-center gap-2"
                      >
                          Acessar Sistema
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" x2="19" y1="12" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                      </button>
                  </div>
              ))}

              {/* Add New Card (Empty State) */}
              {filteredCompanies.length === 0 && (
                  <div className="col-span-full text-center py-20 bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-700">
                      <h3 className="text-xl font-bold text-gray-300 mb-2">Nenhuma empresa encontrada</h3>
                      <p className="text-gray-500 mb-6">{searchTerm ? 'Tente outro termo de busca.' : 'Cadastre sua primeira escola ou cantina para começar.'}</p>
                      {!searchTerm && (
                          <button onClick={() => handleOpenModal()} className="bg-brand-600 hover:bg-brand-500 text-white px-8 py-3 rounded-lg font-bold">
                              Criar Primeira Empresa
                          </button>
                      )}
                  </div>
              )}
          </div>
      </div>

      {/* CREATE/EDIT MODAL */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-gray-800 rounded-2xl w-full max-w-2xl border border-gray-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-6 border-b border-gray-700">
                      <h3 className="text-xl font-bold text-white">{editingCompany ? 'Configurar Empresa' : 'Nova Empresa'}</h3>
                  </div>
                  
                  <div className="p-6 overflow-y-auto custom-scrollbar">
                      <form id="companyForm" onSubmit={handleSubmit} className="space-y-6">
                          <div>
                              <label className="block text-sm font-medium text-gray-400 mb-1">Nome da Empresa / Escola</label>
                              <input 
                                  type="text" 
                                  required
                                  value={formData.name}
                                  onChange={e => setFormData({...formData, name: e.target.value})}
                                  className="w-full bg-gray-900 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-brand-500 outline-none"
                                  placeholder="Ex: Cantina Colégio São Paulo"
                              />
                          </div>

                          <div>
                              <label className="block text-sm font-medium text-gray-400 mb-3">Módulos Contratados (Funcionalidades)</label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {AVAILABLE_MODULES.map(module => {
                                      const isSelected = formData.modules.has(module.key);
                                      return (
                                          <div 
                                            key={module.key}
                                            onClick={() => toggleModule(module.key)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-brand-900/30 border-brand-500' : 'bg-gray-900 border-gray-700 hover:border-gray-500'}`}
                                          >
                                              <div className="flex items-center gap-3">
                                                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-brand-500 border-brand-500 text-white' : 'border-gray-500'}`}>
                                                      {isSelected && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                                                  </div>
                                                  <div>
                                                      <p className={`font-bold text-sm ${isSelected ? 'text-brand-400' : 'text-gray-300'}`}>{module.label}</p>
                                                      <p className="text-[10px] text-gray-500 leading-tight mt-0.5">{module.description}</p>
                                                  </div>
                                              </div>
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>
                      </form>
                  </div>

                  <div className="p-6 border-t border-gray-700 bg-gray-900 flex justify-end gap-3">
                      <button 
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-6 py-2 text-gray-400 font-bold hover:text-white transition-colors"
                      >
                          Cancelar
                      </button>
                      <button 
                        type="submit"
                        form="companyForm"
                        className="px-6 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-bold shadow-lg transition-colors"
                      >
                          Salvar Configurações
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};