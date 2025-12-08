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

  // Helper function to validate IP Address
  const isValidIP = (ip: string) => {
    const ipRegex = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipRegex.test(ip);
  };

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

  const handleToggleChange = (section: 'paymentMethods' | 'features', field: string, value: boolean) => {
      setLocalSettings(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
      setIsSaved(false);
  };

  const handleItauChange = (field: string, value: any) => {
      setLocalSettings(prev => ({
          ...prev,
          integrations: {
              ...prev.integrations,
              itau: {
                  ...prev.integrations?.itau,
                  [field]: value
              }
          }
      }));
      setIsSaved(false);
  };

  const handleFeatureNumberChange = (field: string, value: number) => {
      setLocalSettings(prev => ({ ...prev, features: { ...prev.features, [field]: value } }));
      setIsSaved(false);
  };

  const validateSettings = () => {
      // Validate Kitchen Printer
      if (localSettings.kitchenPrinter.enabled) {
          if (!localSettings.kitchenPrinter.name.trim()) {
              alert('Erro: O nome da Impressora da Cozinha é obrigatório.');
              return false;
          }
          if (!isValidIP(localSettings.kitchenPrinter.ip)) {
              alert('Erro: O endereço IP da Impressora da Cozinha é inválido. Formato esperado: 192.168.x.x');
              return false;
          }
          if (localSettings.kitchenPrinter.port !== '9100') {
              if(!window.confirm('Aviso: A porta da impressora da cozinha não é 9100. A maioria das impressoras térmicas usa a porta 9100 para comunicação RAW. Deseja manter assim?')) {
                  return false;
              }
          }
      }

      // Validate Counter Printer
      if (localSettings.counterPrinter.enabled) {
          if (!localSettings.counterPrinter.name.trim()) {
              alert('Erro: O nome da Impressora do Caixa é obrigatório.');
              return false;
          }
          if (!isValidIP(localSettings.counterPrinter.ip)) {
              alert('Erro: O endereço IP da Impressora do Caixa é inválido. Formato esperado: 192.168.x.x');
              return false;
          }
          if (localSettings.counterPrinter.port !== '9100') {
               if(!window.confirm('Aviso: A porta da impressora do caixa não é 9100. A maioria das impressoras térmicas usa a porta 9100 para comunicação RAW. Deseja manter assim?')) {
                  return false;
               }
          }
      }
      return true;
  };

  const handleSave = () => {
    if (!validateSettings()) return;
    onUpdateSettings(localSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSendTestPage = () => {
      if (!validateSettings()) return;

      setIsPrintingTest(true);
      setTimeout(() => {
          alert(`TESTE DE COMUNICAÇÃO:\n\n1. Uma página de teste foi gerada.\n2. A janela de impressão do sistema abrirá em seguida.\n3. Selecione a impressora configurada (Ex: ${localSettings.counterPrinter.name}) na lista.\n\nSe a impressora não responder, verifique se o IP e a Porta correspondem à configuração no Windows.`);
          window.print();
          setIsPrintingTest(false);
      }, 800);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) { setBackupFile(e.target.files[0]); }
      e.target.value = '';
  };

  const confirmRestore = () => { if (backupFile && onImportData) { onImportData(backupFile); setBackupFile(null); } };
  const cancelRestore = () => { setBackupFile(null); };

  return (
    <div className="p-6 h-full flex flex-col bg-gray-50 overflow-auto relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Configurações do Sistema</h2>
        <button onClick={handleSave} className={`px-6 py-2 rounded-lg font-bold text-white transition-all flex items-center gap-2 ${isSaved ? 'bg-green-600' : 'bg-brand-600 hover:bg-brand-700'}`}>
          {isSaved ? ( <> <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> Salvo! </> ) : ( <> <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Salvar Alterações </> )}
        </button>
      </div>

      <div className="max-w-4xl space-y-8">
        
        {/* PAYMENT METHODS */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Meios de Pagamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Toggle label="Dinheiro" checked={localSettings.paymentMethods?.money} onChange={(v) => handleToggleChange('paymentMethods', 'money', v)} />
                <Toggle label="Conta Aluno" checked={localSettings.paymentMethods?.studentAccount} onChange={(v) => handleToggleChange('paymentMethods', 'studentAccount', v)} />
                <Toggle label="Cartão de Crédito" checked={localSettings.paymentMethods?.creditCard} onChange={(v) => handleToggleChange('paymentMethods', 'creditCard', v)} />
                <Toggle label="Cartão de Débito" checked={localSettings.paymentMethods?.debitCard} onChange={(v) => handleToggleChange('paymentMethods', 'debitCard', v)} />
                <Toggle label="PIX" checked={localSettings.paymentMethods?.pix} onChange={(v) => handleToggleChange('paymentMethods', 'pix', v)} />
            </div>
        </section>

        {/* BANKING INTEGRATION (ITAU) */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-bl-full -mr-10 -mt-10 opacity-50"></div>
            <h3 className="text-lg font-bold text-orange-600 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                Integração Bancária (Itaú)
            </h3>
            
            <div className="mb-4">
                <Toggle 
                    label="Habilitar Integração Itaú (Pix)" 
                    checked={localSettings.integrations?.itau?.enabled || false}
                    onChange={(v) => handleItauChange('enabled', v)}
                />
            </div>

            {localSettings.integrations?.itau?.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-orange-50 p-4 rounded-lg border border-orange-100 animate-in fade-in slide-in-from-top-4">
                    <div>
                        <label className="block text-xs font-bold text-orange-800 uppercase mb-1">Client ID</label>
                        <input 
                            type="text" 
                            className="w-full border border-orange-200 bg-white text-gray-800 rounded p-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                            value={localSettings.integrations.itau.clientId || ''}
                            onChange={(e) => handleItauChange('clientId', e.target.value)}
                            placeholder="Insira o Client ID do Itaú"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-orange-800 uppercase mb-1">Chave Pix (Padrão)</label>
                        <input 
                            type="text" 
                            className="w-full border border-orange-200 bg-white text-gray-800 rounded p-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                            value={localSettings.integrations.itau.pixKey || ''}
                            onChange={(e) => handleItauChange('pixKey', e.target.value)}
                            placeholder="CPF/CNPJ/Email"
                        />
                    </div>
                </div>
            )}
        </section>

        {/* SYSTEM FEATURES */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Funcionalidades do Sistema</h3>
            <div className="grid grid-cols-1 gap-4">
                <Toggle label="Permitir Saldo Negativo (Fiado)" checked={localSettings.features?.allowNegativeBalance} onChange={(v) => handleToggleChange('features', 'allowNegativeBalance', v)} />
                <Toggle label="Bloquear Venda Sem Estoque" checked={localSettings.features?.enforceStockLimit} onChange={(v) => handleToggleChange('features', 'enforceStockLimit', v)} />
                <Toggle label="Mostrar Alertas de Estoque no Início" checked={localSettings.features?.showStockAlerts} onChange={(v) => handleToggleChange('features', 'showStockAlerts', v)} />
                <Toggle label="Sistema de Fidelidade (Pontos XP)" checked={localSettings.features?.enableLoyaltySystem} onChange={(v) => handleToggleChange('features', 'enableLoyaltySystem', v)} />
                <div className="border-t pt-4 mt-2">
                    <Toggle label="Bloquear Alunos Inadimplentes" checked={localSettings.features?.blockOverdueStudents} onChange={(v) => handleToggleChange('features', 'blockOverdueStudents', v)} />
                    {localSettings.features?.blockOverdueStudents && (
                        <div className="mt-3 ml-12 bg-red-50 p-4 rounded-lg border border-red-100">
                            <label className="block text-sm font-bold text-red-700 mb-1">Dias de Atraso Tolerados</label>
                            <input type="number" min="0" value={localSettings.features.maxOverdueDays} onChange={(e) => handleFeatureNumberChange('maxOverdueDays', parseInt(e.target.value))} className="w-24 p-2 border border-red-300 rounded text-center font-bold bg-white text-gray-800" />
                        </div>
                    )}
                </div>
            </div>
        </section>

        {/* PRINTERS CONFIG */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Configuração de Impressoras
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className={`p-4 rounded-lg border-2 ${localSettings.kitchenPrinter.enabled ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex justify-between mb-4"><span className="font-bold">Cozinha</span><Toggle checked={localSettings.kitchenPrinter.enabled} onChange={(v) => handlePrinterChange('kitchenPrinter', 'enabled', v)} label="" /></div>
              <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nome (No Windows)</label>
                    <input type="text" className={`w-full border p-2 text-sm rounded ${!localSettings.kitchenPrinter.name ? 'border-red-300 bg-red-50' : ''}`} value={localSettings.kitchenPrinter.name} onChange={(e) => handlePrinterChange('kitchenPrinter', 'name', e.target.value)} disabled={!localSettings.kitchenPrinter.enabled} placeholder="Ex: Cozinha Principal 2" />
                    {!localSettings.kitchenPrinter.name && <p className="text-xs text-red-500 mt-1">Obrigatório.</p>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">IP</label>
                          <input type="text" className={`w-full border p-2 text-sm rounded ${!isValidIP(localSettings.kitchenPrinter.ip) ? 'border-red-300 bg-red-50' : ''}`} value={localSettings.kitchenPrinter.ip} onChange={(e) => handlePrinterChange('kitchenPrinter', 'ip', e.target.value)} disabled={!localSettings.kitchenPrinter.enabled} placeholder="192.168.0.x" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Porta</label>
                          <input type="text" className="w-full border p-2 text-sm rounded" value={localSettings.kitchenPrinter.port} onChange={(e) => handlePrinterChange('kitchenPrinter', 'port', e.target.value)} disabled={!localSettings.kitchenPrinter.enabled} placeholder="9100" />
                      </div>
                  </div>
                  <button onClick={handleSendTestPage} disabled={!localSettings.kitchenPrinter.enabled} className="w-full py-2 text-xs font-bold text-brand-600 border-2 border-brand-600 bg-white rounded hover:bg-brand-50 disabled:opacity-50">Imprimir Teste</button>
              </div>
            </div>
            <div className={`p-4 rounded-lg border-2 ${localSettings.counterPrinter.enabled ? 'border-brand-500 bg-brand-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex justify-between mb-4"><span className="font-bold">Caixa</span><Toggle checked={localSettings.counterPrinter.enabled} onChange={(v) => handlePrinterChange('counterPrinter', 'enabled', v)} label="" /></div>
              <div className="space-y-3">
                   <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Nome (No Windows)</label>
                    <input type="text" className={`w-full border p-2 text-sm rounded ${!localSettings.counterPrinter.name ? 'border-red-300 bg-red-50' : ''}`} value={localSettings.counterPrinter.name} onChange={(e) => handlePrinterChange('counterPrinter', 'name', e.target.value)} disabled={!localSettings.counterPrinter.enabled} placeholder="Ex: Pre-Venda Cantina" />
                    {!localSettings.counterPrinter.name && <p className="text-xs text-red-500 mt-1">Obrigatório.</p>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">IP</label>
                          <input type="text" className={`w-full border p-2 text-sm rounded ${!isValidIP(localSettings.counterPrinter.ip) ? 'border-red-300 bg-red-50' : ''}`} value={localSettings.counterPrinter.ip} onChange={(e) => handlePrinterChange('counterPrinter', 'ip', e.target.value)} disabled={!localSettings.counterPrinter.enabled} placeholder="192.168.0.x" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Porta</label>
                          <input type="text" className="w-full border p-2 text-sm rounded" value={localSettings.counterPrinter.port} onChange={(e) => handlePrinterChange('counterPrinter', 'port', e.target.value)} disabled={!localSettings.counterPrinter.enabled} placeholder="9100" />
                      </div>
                  </div>
                  <button onClick={handleSendTestPage} disabled={!localSettings.counterPrinter.enabled} className="w-full py-2 text-xs font-bold text-brand-600 border-2 border-brand-600 bg-white rounded hover:bg-brand-50 disabled:opacity-50">Imprimir Teste</button>
              </div>
            </div>
          </div>
        </section>

        {/* GENERAL SETTINGS */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <label className="block text-sm font-medium mb-1">Nome do Estabelecimento</label>
          <input type="text" className="w-full border rounded p-2" value={localSettings.schoolName} onChange={(e) => handleChange('schoolName', e.target.value)} />
        </section>

        {/* BACKUP */}
        <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold mb-4">Backup e Dados</h3>
            <div className="flex gap-4">
                <button onClick={onExportData} className="px-6 py-2 bg-gray-800 text-white rounded font-bold">Baixar Backup</button>
                <div className="flex flex-col gap-2">
                    {!backupFile ? ( <label className="px-6 py-2 border-2 border-gray-300 rounded font-bold cursor-pointer hover:bg-gray-50"> Importar <input type="file" accept=".json" onChange={handleFileSelect} className="hidden" /> </label> ) : ( <div className="flex gap-2"> <button onClick={confirmRestore} className="px-4 py-2 bg-blue-600 text-white rounded font-bold">Restaurar</button> <button onClick={cancelRestore} className="px-4 py-2 bg-gray-200 rounded font-bold">Cancelar</button> </div> )}
                </div>
            </div>
        </section>

      </div>
      {isPrintingTest && <div className="printable absolute top-0 left-0 bg-white p-4">TESTE DE IMPRESSÃO: Conexão Estabelecida com Driver.</div>}
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
