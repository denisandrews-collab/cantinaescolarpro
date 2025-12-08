import React, { useState } from 'react';
import { Transaction, SystemSettings } from '../types';

interface ReceiptProps {
  transaction: Transaction;
  settings: SystemSettings;
  onClose: () => void;
}

export const Receipt = React.memo<ReceiptProps>(({ transaction, settings, onClose }) => {
  const { id, studentName, items, total, date, aiMessage, studentBalanceSnapshot } = transaction;
  const formattedDate = date.toLocaleString('pt-BR');

  const [printMode, setPrintMode] = useState<'ALL' | 'CUSTOMER' | 'KITCHEN'>('ALL');

  const handlePrintCustomer = () => {
    setPrintMode('CUSTOMER');
    alert(`POR FAVOR SELECIONE A IMPRESSORA:\n\n${settings.counterPrinter.name}\n\nNa janela que abrirá a seguir.`);
    setTimeout(() => {
        window.print();
        setPrintMode('ALL');
    }, 500);
  };

  const handlePrintKitchen = () => {
    setPrintMode('KITCHEN');
    alert(`POR FAVOR SELECIONE A IMPRESSORA:\n\n${settings.kitchenPrinter.name}\n\nNa janela que abrirá a seguir.`);
    setTimeout(() => {
        window.print();
        setPrintMode('ALL');
    }, 500);
  };

  const Separator = () => <div className="border-b border-dashed border-gray-400 my-2"></div>;

  const showCustomerCopy = settings?.printCustomerCopy ?? true;
  const showKitchenCopy = (settings?.printKitchenCopy && settings?.kitchenPrinter?.enabled) ?? false;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:block print:inset-auto">
      
      <div className="printable bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full flex flex-col md:flex-row gap-8 print:fixed print:top-0 print:left-0 print:w-full print:h-full print:shadow-none print:max-w-none print:gap-0 print:block print:m-0">
        
        {/* === STUDENT COPY === */}
        {showCustomerCopy && (printMode === 'ALL' || printMode === 'CUSTOMER') && (
          <div className="flex-1 border p-4 bg-gray-50 print:bg-white print:border-none print:text-black print:mb-8 print:w-full">
            <div className="text-center mb-4">
              <h2 className="font-bold text-xl uppercase">{settings?.schoolName || 'Cantina'}</h2>
              <p className="text-xs">Comprovante do Aluno</p>
              <p className="text-xs text-gray-500 mt-1">{id}</p>
              <p className="text-sm mt-1">{formattedDate}</p>
            </div>

            <Separator />

            <div className="mb-4">
              <p className="text-sm font-bold">Cliente:</p>
              <p className="text-lg">{studentName || "Venda Balcão"}</p>
            </div>

            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="text-left border-b border-black">
                  <th className="pb-1">Item</th>
                  <th className="pb-1 text-right">Qtd</th>
                  <th className="pb-1 text-right">R$</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1">
                        {item.name}
                        {item.notes && <div className="text-xs italic text-gray-500 print:text-black">Obs: {item.notes}</div>}
                    </td>
                    <td className="py-1 text-right valign-top">{item.quantity}</td>
                    <td className="py-1 text-right valign-top">{(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <Separator />

            <div className="flex justify-between items-center font-bold text-xl mb-2">
              <span>TOTAL</span>
              <span>R$ {total.toFixed(2)}</span>
            </div>

            {studentBalanceSnapshot !== undefined && (
                <div className="flex justify-between items-center text-sm mb-4 pt-1 border-t border-dashed border-gray-400">
                    <span>Saldo Restante:</span>
                    <span className={studentBalanceSnapshot < 0 ? 'text-black font-bold' : 'text-black'}>
                        {studentBalanceSnapshot < 0 ? `Deve R$ ${Math.abs(studentBalanceSnapshot).toFixed(2)}` : `Créd. R$ ${studentBalanceSnapshot.toFixed(2)}`}
                    </span>
                </div>
            )}

            <div className="mt-2 p-3 bg-white border border-gray-200 rounded text-center italic text-sm print:border-black">
              {aiMessage ? aiMessage : "Obrigado!"}
            </div>
            
            <div className="mt-6 text-center text-xs text-gray-400 print:text-black">
              *** VIA DO ALUNO ***
            </div>
          </div>
        )}

        {/* === KITCHEN COPY === */}
        {showKitchenCopy && (printMode === 'ALL' || printMode === 'KITCHEN') && (
          <div className="flex-1 border p-4 bg-yellow-50 print:bg-white print:border-none print:text-black print:w-full">
            <div className="text-center mb-4">
              <h2 className="font-bold text-xl uppercase">COZINHA / ENTREGA</h2>
              <p className="text-sm font-bold mt-2">PEDIDO #{id.slice(-4)}</p>
              <p className="text-sm">{formattedDate}</p>
            </div>

            <Separator />

            <div className="mb-6">
              <p className="text-sm font-bold text-gray-500">Para:</p>
              <p className="text-2xl font-black uppercase truncate">{studentName || "Balcão"}</p>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="flex flex-col border-b border-gray-100 pb-2 print:border-black">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 bg-black text-white font-bold rounded-full text-lg print:border-2 print:border-black print:bg-white print:text-black">
                        {item.quantity}
                        </span>
                        <span className="text-lg font-bold leading-tight uppercase">
                        {item.name}
                        </span>
                    </div>
                  </div>
                  {item.notes && (
                      <div className="ml-11 mt-1 text-sm font-bold uppercase bg-black text-white px-2 py-1 inline-block rounded print:bg-white print:text-black print:border print:border-black">
                          ⚠️ {item.notes}
                      </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 text-center text-xs text-gray-400 print:text-black">
              *** VIA DA COZINHA ***
            </div>
          </div>
        )}

      </div>

      <div className="absolute bottom-8 flex gap-4 print:hidden">
        <button 
          onClick={onClose}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium transition-colors"
        >
          Fechar (Esc)
        </button>
        
        {showCustomerCopy && (
            <button 
            onClick={handlePrintCustomer}
            className="px-6 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-bold shadow-lg flex items-center gap-2 transition-transform transform active:scale-95"
            >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
            Imprimir Balcão
            </button>
        )}

        {showKitchenCopy && (
            <button 
            onClick={handlePrintKitchen}
            className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 font-bold shadow-lg flex items-center gap-2 transition-transform transform active:scale-95"
            >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 14h12"/><path d="M6 18h12"/><path d="M2 20h20"/><path d="M5 20v-9a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v9"/><path d="M12 4v5"/></svg>
            Imprimir Cozinha
            </button>
        )}
      </div>
    </div>
  );
});

// Display name for debugging
Receipt.displayName = 'Receipt';
};