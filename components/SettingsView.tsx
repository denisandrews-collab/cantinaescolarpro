
import React, { useState } from 'react';
import { SystemSettings, PrinterConfig } from '../types';

interface SettingsViewProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  onExportData?: () => void;
  onImportData?: (file: File) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings, onExportData, onImportData }) => {
  if (!settings) return <div className="p-6">Carregando configurações...</div>;

  const [localSettings, setLocalSettings] = useState<SystemSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [isPrintingTest, setIsPrintingTest] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  
  const [backupFile, setBackupFile] = useState<File | null>(null);

  const handleChange = (field: keyof SystemSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handlePrinterChange = (printerType: 'kitchenPrinter' | 'counterPrinter', field: keyof PrinterConfig, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [printerType]: {
        ...prev[printerType],
        [field]: value
      }
    }));
    setIsSaved(false);
  };

  // Helper for Payment/Features toggles
  const handleToggleChange = (section: 'paymentMethods' | 'features', field: string, value: boolean) => {
      setLocalSettings(prev => ({
          ...prev,
          [section]: {
              ...prev[section],
              [field]: value
          }
      }));
      setIsSaved(false);
  };

  // Helper for numeric features
  const handleFeatureNumberChange = (field: string, value: number) => {
      setLocalSettings(prev => ({
          ...prev,
          features: {
              ...prev.features,
              [field]: value
          }
      }));
      setIsSaved(false);
  };

  const handleSave = () => {
    onUpdateSettings(localSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSendTestPage = () => {
      setIsPrintingTest(true);
      setTimeout(() => {
          alert(`ATENÇÃO: Na janela de impressão que se abrirá, selecione a sua impressora na lista de "Destino".`);
          window.print();
          setIsPrintingTest(false);
      }, 800);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setBackupFile(e.target.files[0]);
      }
      e.target.value = '';
  };

  const confirmRestore = () => {
      if (backupFile && onImportData) {
          onImportData(backupFile);
          setBackupFile(null);
      }
  };

  const cancelRestore = () => {
      setBackupFile(null);
  };

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50 overflow-auto relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Configurações do Sistema</h2>
        <button 
          onClick={handleSave}
          className={`px-6 py-2 rounded-lg font-bold text-white transition-all flex items-center gap-2 ${isSaved ? 'bg-green-600' : 'bg-brand-600 hover:bg-brand-700'}`}
        >
          {isSaved ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Salvo!
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Salvar Alterações
            </>
          )}
        </button>
      </div>

      <div className="max-w-4xl space-y-8">
        
        {/* === PAYMENT METHODS === */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                Meios de Pagamento Aceitos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Toggle 
                    label="Dinheiro" 
                    checked={localSettings.paymentMethods?.money} 
                    onChange={(v) => handleToggleChange('paymentMethods', 'money', v)} 
                />
                <Toggle 
                    label="Conta Aluno (Fiado/Crédito)" 
                    checked={localSettings.paymentMethods?.studentAccount} 
                    onChange={(v) => handleToggleChange('paymentMethods', 'studentAccount', v)} 
                />
                <Toggle 
                    label="Cartão de Crédito" 
                    checked={localSettings.paymentMethods?.creditCard} 
                    onChange={(v) => handleToggleChange('paymentMethods', 'creditCard', v)} 
                />
                <Toggle 
                    label="Cartão de Débito" 
                    checked={localSettings.paymentMethods?.debitCard} 
                    onChange={(v) => handleToggleChange('paymentMethods', 'debitCard', v)} 
                />
                <Toggle 
                    label="PIX" 
                    checked={localSettings.paymentMethods?.pix} 
                    onChange={(v) => handleToggleChange('paymentMethods', 'pix', v)} 
                />
            </div>
        </section>

        {/* === SYSTEM FEATURES === */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                Funcionalidades do Sistema
            </h3>
            <div className="grid grid-cols-1 gap-4">
                <Toggle 
                    label="Permitir Saldo Negativo (Fiado)" 
                    description="Se desativado, alunos não poderão comprar se não tiverem saldo suficiente."
                    checked={localSettings.features?.allowNegativeBalance} 
                    onChange={(v) => handleToggleChange('features', 'allowNegativeBalance', v)} 
                />
                <Toggle 
                    label="Bloquear Venda Sem Estoque" 
                    description="Impede adicionar produtos ao carrinho se a quantidade for zero."
                    checked={localSettings.features?.enforceStockLimit} 
                    onChange={(v) => handleToggleChange('features', 'enforceStockLimit', v)} 
                />
                <Toggle 
                    label="Mostrar Alertas de Estoque no Início" 
                    description="Exibe lista de produtos acabando na tela inicial."
                    checked={localSettings.features?.showStockAlerts} 
                    onChange={(v) => handleToggleChange('features', 'showStockAlerts', v)} 
                />
                 <Toggle 
                    label="Sistema de Fidelidade (Pontos XP)" 
                    description="Gera pontos a cada compra realizada."
                    checked={localSettings.features?.enableLoyaltySystem} 
                    onChange={(v) => handleToggleChange('features', 'enableLoyaltySystem', v)} 
                />
                
                <div className="border-t pt-4 mt-2">
                    <Toggle 
                        label="Bloquear Alunos Inadimplentes" 
                        description="Bloqueia automaticamente vendas a prazo se houver atraso no pagamento."
                        checked={localSettings.features?.blockOverdueStudents} 
                        onChange={(v) => handleToggleChange('features', 'blockOverdueStudents', v)} 
                    />
                    
                    {localSettings.features?.blockOverdueStudents && (
                        <div className="mt-3 ml-12 bg-red-50 p-4 rounded-lg border border-red-100">
                            <label className="block text-sm font-bold text-red-700 mb-1">
                                Dias de Atraso Tolerados
                            </label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="number" 
                                    min="0"
                                    value={localSettings.features.maxOverdueDays}
                                    onChange={(e) => handleFeatureNumberChange('maxOverdueDays', parseInt(e.target.value))}
                                    className="w-24 p-2 border border-red-300 rounded text-center font-bold bg-white text-gray-800"
                                />
                                <span className="text-sm text-gray-600">dias após a data da compra.</span>
                            </div>
                            <p className="text-xs text-red-500 mt-2">
                                Ex: Se colocar 30 dias, um aluno que comprou fiado há 31 dias e não pagou será bloqueado.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>

        {/* Printers */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Configuração de Impressoras
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className={`p-4 rounded-lg border-2 transition-all ${localSettings.kitchenPrinter.enabled ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800">Cozinha</span>
                  <div className={`w-2 h-2 rounded-full ${localSettings.kitchenPrinter.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                </div>
                <Toggle checked={localSettings.kitchenPrinter.enabled} onChange={(v) => handlePrinterChange('kitchenPrinter', 'enabled', v)} label="" />
              </div>
              <div className="space-y-3">
                <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nome</label>
                    <input 
                    type="text" 
                    className="w-full border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded p-2 text-sm"
                    value={localSettings.kitchenPrinter.name}
                    onChange={(e) => handlePrinterChange('kitchenPrinter', 'name', e.target.value)}
                    disabled={!localSettings.kitchenPrinter.enabled}
                    />
                </div>
                <button onClick={handleSendTestPage} disabled={!localSettings.kitchenPrinter.enabled} className="w-full py-2 text-xs font-bold text-brand-600 border-2 border-brand-600 bg-white rounded hover:bg-brand-50 disabled:opacity-50">Imprimir Teste</button>
              </div>
            </div>

            <div className={`p-4 rounded-lg border-2 transition-all ${localSettings.counterPrinter.enabled ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800">Caixa</span>
                  <div className={`w-2 h-2 rounded-full ${localSettings.counterPrinter.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                </div>
                <Toggle checked={localSettings.counterPrinter.enabled} onChange={(v) => handlePrinterChange('counterPrinter', 'enabled', v)} label="" />
              </div>
              <div className="space-y-3">
                <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nome</label>
                    <input 
                        type="text" 
                        className="w-full border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded p-2 text-sm"
                        value={localSettings.counterPrinter.name}
                        onChange={(e) => handlePrinterChange('counterPrinter', 'name', e.target.value)}
                        disabled={!localSettings.counterPrinter.enabled}
                    />
                </div>
                <button onClick={handleSendTestPage} disabled={!localSettings.counterPrinter.enabled} className="w-full py-2 text-xs font-bold text-brand-600 border-2 border-brand-600 bg-white rounded hover:bg-brand-50 disabled:opacity-50">Imprimir Teste</button>
              </div>
            </div>
          </div>
        </section>

         {/* General Settings */}
         <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Outras Configurações</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nome do Estabelecimento</label>
              <input 
                type="text" 
                className="w-full border border-gray-700 bg-gray-800 text-white placeholder-gray-400 rounded-lg p-2 focus:ring-2 focus:ring-brand-500 outline-none"
                value={localSettings.schoolName}
                onChange={(e) => handleChange('schoolName', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Data Management (Backup) */}
        {onExportData && onImportData && (
            <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                    Gerenciamento de Dados (Backup)
                </h3>
                <div className="flex gap-4 items-start">
                    <button onClick={onExportData} className="px-6 py-2 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-900 transition-colors flex items-center gap-2">
                        Baixar Backup
                    </button>
                    
                    <div className="flex flex-col gap-2">
                        {!backupFile ? (
                            <label className="px-6 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer">
                                Selecionar Arquivo
                                <input type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
                            </label>
                        ) : (
                            <div className="flex flex-col gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm font-medium text-blue-900">Arquivo: {backupFile.name}</p>
                                <div className="flex gap-2">
                                    <button onClick={confirmRestore} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold">Restaurar</button>
                                    <button onClick={cancelRestore} className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-bold">Cancelar</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        )}

      </div>

      {helpModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl p-6">
                <h3 className="text-xl font-bold mb-4">Ajuda</h3>
                <button onClick={() => setHelpModalOpen(false)} className="mt-6 w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold">Fechar</button>
            </div>
        </div>
      )}

      {isPrintingTest && (
         <div className="printable bg-white text-black p-4 w-full h-full absolute top-0 left-0 z-50 flex flex-col items-center">
             <div className="text-center">TESTE DE IMPRESSÃO<br/>SUCESSO!</div>
         </div>
      )}

    </div>
  );
};

const Toggle = ({ label, checked, onChange, description }: { label: string, checked: boolean, onChange: (v: boolean) => void, description?: string }) => (
    <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${checked ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
        <div>
            <span className={`font-bold text-sm ${checked ? 'text-blue-800' : 'text-gray-600'}`}>{label}</span>
            {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
        </div>
        <div className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={checked} onChange={e => onChange(e.target.checked)} />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
        </div>
    </label>
);
