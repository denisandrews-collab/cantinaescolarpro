
import React, { useState } from 'react';
import { Product, Student, ProductCategory } from '../types';

interface ApiSettingsViewProps {
  onSyncProducts: (products: Product[]) => void;
  onSyncStudents: (students: Student[]) => void;
}

export const ApiSettingsView: React.FC<ApiSettingsViewProps> = ({ onSyncProducts, onSyncStudents }) => {
  const [productsUrl, setProductsUrl] = useState('');
  const [studentsUrl, setStudentsUrl] = useState('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  const handleSyncProducts = async () => {
    if (!productsUrl) {
      alert('Por favor, insira a URL da API de Produtos.');
      return;
    }
    setIsLoadingProducts(true);
    try {
        // Simulation of a fetch call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const mockProducts: Product[] = [
            { id: `api-prod-${Date.now()}-1`, name: 'Bolo de Cenoura (API)', price: 5.50, stock: 20, costPrice: 2.00, category: ProductCategory.DESSERT, isActive: true },
            { id: `api-prod-${Date.now()}-2`, name: 'Suco de Uva (API)', price: 7.00, stock: 50, costPrice: 3.50, category: ProductCategory.DRINK, isActive: true },
            { id: `api-prod-${Date.now()}-3`, name: 'Empada de Palmito (API)', price: 6.00, stock: 15, costPrice: 2.50, category: ProductCategory.SNACK, isActive: true },
        ];
        
        onSyncProducts(mockProducts);
        alert(`${mockProducts.length} produtos sincronizados com sucesso!`);
    } catch (error) {
        console.error(error);
        alert('Erro ao sincronizar produtos.');
    } finally {
        setIsLoadingProducts(false);
    }
  };

  const handleSyncStudents = async () => {
    if (!studentsUrl) {
      alert('Por favor, insira a URL da API de Alunos.');
      return;
    }
    setIsLoadingStudents(true);
    try {
        // Simulation of a fetch call
        await new Promise(resolve => setTimeout(resolve, 1500));

        const mockStudents: Student[] = [
            { id: `api-student-${Date.now()}-1`, name: 'João API Silva', grade: '1º Ano A', balance: 0, points: 0, history: [], isActive: true, isStaff: false, code: 'API01' },
            { id: `api-student-${Date.now()}-2`, name: 'Maria API Souza', grade: '2º Ano B', balance: 10, points: 0, history: [], isActive: true, isStaff: false, code: 'API02' },
            { id: `api-student-${Date.now()}-3`, name: 'Pedro API Santos', grade: '3º Médio', balance: -5, points: 0, history: [], isActive: true, isStaff: false, code: 'API03' },
        ];

        onSyncStudents(mockStudents);
        alert(`${mockStudents.length} alunos sincronizados com sucesso!`);
    } catch (error) {
        console.error(error);
        alert('Erro ao sincronizar alunos.');
    } finally {
        setIsLoadingStudents(false);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50 overflow-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Integrações e APIs Externas</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Products API Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">API de Produtos</h3>
                    <p className="text-sm text-gray-500">Sincronizar inventário externo</p>
                </div>
            </div>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL</label>
                    <input 
                        type="url" 
                        placeholder="https://api.escola.com/v1/produtos"
                        className="w-full border rounded-lg p-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={productsUrl}
                        onChange={(e) => setProductsUrl(e.target.value)}
                    />
                </div>
                <button 
                    onClick={handleSyncProducts}
                    disabled={isLoadingProducts}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                    {isLoadingProducts ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Sincronizando...
                        </>
                    ) : 'Sincronizar Produtos'}
                </button>
            </div>
        </div>

        {/* Students API Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <div>
                    <h3 className="font-bold text-gray-800">API de Alunos</h3>
                    <p className="text-sm text-gray-500">Importar cadastro de alunos</p>
                </div>
            </div>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL</label>
                    <input 
                        type="url" 
                        placeholder="https://api.escola.com/v1/alunos"
                        className="w-full border rounded-lg p-2 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
                        value={studentsUrl}
                        onChange={(e) => setStudentsUrl(e.target.value)}
                    />
                </div>
                <button 
                    onClick={handleSyncStudents}
                    disabled={isLoadingStudents}
                    className="w-full py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
                >
                    {isLoadingStudents ? (
                        <>
                             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Sincronizando...
                        </>
                    ) : 'Sincronizar Alunos'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
