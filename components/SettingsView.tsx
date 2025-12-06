
import React, { useState } from 'react';
import { SystemSettings, PrinterConfig } from '../types';

interface SettingsViewProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  onExportData?: () => void;
  onImportData?: (file: File) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdateSettings, onExportData, onImportData }) => {
  // Guard against undefined settings to prevent crashes
  if (!settings) return <div className="p-6">Carregando configurações...</div>;

  const [localSettings, setLocalSettings] = useState<SystemSettings>(settings);
  const [isSaved, setIsSaved] = useState(false);
  const [isPrintingTest, setIsPrintingTest] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  
  // Backup File State
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

  const handleSave = () => {
    onUpdateSettings(localSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSendTestPage = () => {
      // Trigger the print view (shows the hidden ticket)
      setIsPrintingTest(true);

      // Wait 800ms for React to render the DOM elements completely before triggering print
      // This is crucial to avoid blank pages
      setTimeout(() => {
          alert(`ATENÇÃO: Na janela de impressão que se abrirá, selecione a sua impressora na lista de "Destino".`);
          window.print();
          // Hide after printing dialog closes (or user cancels)
          setIsPrintingTest(false);
      }, 800);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          setBackupFile(e.target.files[0]);
      }
      e.target.value = ''; // Reset input so same file can be selected again if needed
  };

  const confirmRestore = () => {
      if (backupFile && onImportData) {
          onImportData(backupFile);
          setBackupFile(null); // Clear selection after processing
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
        
        {/* Network Printers */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Configuração de Impressoras
          </h3>
          <p className="text-sm text-gray-500 mb-6 bg-yellow-50 p-3 rounded border border-yellow-200">
            <strong>Como funciona a impressão web:</strong> Ao contrário de programas instalados, navegadores não enviam dados diretamente para o IP da impressora. 
            O sistema gera o cupom e abre a janela de impressão do seu computador. Você deve selecionar a impressora correta (Driver do Windows) nessa janela.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Kitchen Printer */}
            <div className={`p-4 rounded-lg border-2 transition-all ${localSettings.kitchenPrinter.enabled ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800">Impressora Principal (Cozinha)</span>
                  <div className={`w-2 h-2 rounded-full ${localSettings.kitchenPrinter.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={localSettings.kitchenPrinter.enabled}
                    onChange={(e) => handlePrinterChange('kitchenPrinter', 'enabled', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-brand-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
              
              <div className="space-y-3">
                <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nome (Apenas Identificação)</label>
                    <input 
                    type="text" 
                    placeholder="Ex: Impressora Cozinha" 
                    className="w-full border border-gray-300 rounded p-2 text-sm text-gray-600"
                    value={localSettings.kitchenPrinter.name}
                    onChange={(e) => handlePrinterChange('kitchenPrinter', 'name', e.target.value)}
                    disabled={!localSettings.kitchenPrinter.enabled}
                    />
                </div>
                
                <div className="flex gap-2 pt-2">
                    <button 
                        onClick={() => setHelpModalOpen(true)}
                        className="flex-1 py-2 text-xs font-bold text-blue-600 border-2 border-blue-600 bg-white rounded hover:bg-blue-50"
                    >
                        Ajuda / Configuração
                    </button>
                    <button 
                    onClick={handleSendTestPage}
                    disabled={!localSettings.kitchenPrinter.enabled}
                    className="flex-1 py-2 text-xs font-bold text-brand-600 border-2 border-brand-600 bg-white rounded hover:bg-brand-50 disabled:opacity-50"
                    >
                     Imprimir Teste
                    </button>
                </div>
              </div>
            </div>

            {/* Counter Printer */}
            <div className={`p-4 rounded-lg border-2 transition-all ${localSettings.counterPrinter.enabled ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800">Impressora Secundária (Caixa)</span>
                  <div className={`w-2 h-2 rounded-full ${localSettings.counterPrinter.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer"
                    checked={localSettings.counterPrinter.enabled}
                    onChange={(e) => handlePrinterChange('counterPrinter', 'enabled', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:bg-brand-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                </label>
              </div>
              
              <div className="space-y-3">
                <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nome (Identificação)</label>
                    <input 
                        type="text" 
                        placeholder="Ex: Impressora Balcão" 
                        className="w-full border border-gray-300 rounded p-2 text-sm text-gray-600"
                        value={localSettings.counterPrinter.name}
                        onChange={(e) => handlePrinterChange('counterPrinter', 'name', e.target.value)}
                        disabled={!localSettings.counterPrinter.enabled}
                    />
                </div>
                
                <div className="flex gap-2 pt-2">
                    <button 
                    onClick={handleSendTestPage}
                    disabled={!localSettings.counterPrinter.enabled}
                    className="w-full py-2 text-xs font-bold text-brand-600 border-2 border-brand-600 bg-white rounded hover:bg-brand-50 disabled:opacity-50"
                    >
                    Imprimir Teste
                    </button>
                </div>
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
                className="w-full border border-gray-300 rounded-lg p-2 text-gray-600 focus:ring-2 focus:ring-brand-500 outline-none"
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
                <p className="text-sm text-gray-500 mb-4">
                    Exporte seus dados regularmente para evitar perdas. Você pode restaurar o arquivo em outro computador ou navegador.
                </p>
                <div className="flex gap-4 items-start">
                    <button 
                        onClick={onExportData}
                        className="px-6 py-2 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-900 transition-colors flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        Baixar Backup (JSON)
                    </button>
                    
                    <div className="flex flex-col gap-2">
                        {!backupFile ? (
                            <label className="px-6 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
                                Selecionar Arquivo
                                <input type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
                            </label>
                        ) : (
                            <div className="flex flex-col gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg animate-in fade-in zoom-in duration-300">
                                <p className="text-sm font-medium text-blue-900">
                                    Arquivo selecionado: <span className="font-bold">{backupFile.name}</span>
                                </p>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={confirmRestore}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold hover:bg-blue-700 shadow-md"
                                    >
                                        Restaurar Agora
                                    </button>
                                    <button 
                                        onClick={cancelRestore}
                                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm font-bold hover:bg-gray-300"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        )}

      </div>

      {/* HELP MODAL */}
      {helpModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl p-6">
                <h3 className="text-xl font-bold mb-4">Como Configurar a Impressora</h3>
                <div className="space-y-4 text-sm text-gray-600">
                    <p>1. Instale o driver da sua impressora térmica no Windows (USB ou Rede).</p>
                    <p>2. Faça um teste no Windows para garantir que ela imprime.</p>
                    <p>3. Neste sistema, ative a impressora (Cozinha ou Caixa).</p>
                    <p>4. Clique em "Imprimir Teste".</p>
                    <p>5. Quando a janela de impressão abrir, <strong>selecione a sua impressora instalada na lista de destinos</strong>.</p>
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-yellow-800 text-xs">
                        <strong>Dica:</strong> Nas configurações do Chrome/Edge, em "Mais Configurações", desmarque "Cabeçalhos e Rodapés" e ajuste as Margens para "Nenhuma" ou "Mínima" para economizar papel.
                    </div>
                </div>
                <div className="mt-6 text-right">
                    <button onClick={() => setHelpModalOpen(false)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold">Entendi</button>
                </div>
            </div>
        </div>
      )}

      {/* HIDDEN TEST TICKET FOR PRINTING - Force absolute position top-left for reliable print */}
      {isPrintingTest && (
         <div className="printable bg-white text-black p-4 w-full h-full absolute top-0 left-0 z-50 flex flex-col items-center">
             <div className="text-center border-b border-black pb-2 mb-2 w-64">
                 <h2 className="font-bold text-lg uppercase">{localSettings.schoolName || 'CANTINA'}</h2>
                 <p className="text-xs">TESTE DE IMPRESSÃO</p>
                 <p className="text-xs">{new Date().toLocaleString('pt-BR')}</p>
             </div>
             <div className="text-center text-sm font-bold border-2 border-black p-4 mb-2 w-64">
                 SUCESSO!<br/>A IMPRESSORA ESTÁ FUNCIONANDO.
             </div>
             <div className="text-center text-xs mt-4">
                 --------------------------------<br/>
                 Fim do Teste<br/>
                 --------------------------------
             </div>
         </div>
      )}

    </div>
  );
};
