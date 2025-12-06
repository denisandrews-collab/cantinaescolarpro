
import React from 'react';
import { Transaction, SystemSettings } from '../types';

interface ReceiptProps {
  transaction: Transaction;
  settings: SystemSettings;
  onClose: () => void;
}

export const Receipt: React.FC<ReceiptProps> = ({ transaction, settings, onClose }) => {
  const { id, studentName, items, total, date, aiMessage, studentBalanceSnapshot } = transaction;
  const formattedDate = date.toLocaleString('pt-BR');

  // Helper to print just this component
  const handlePrint = () => {
    window.print();
    // onClose(); // Optional: Close automatically after print dialog calls
  };

  const Separator = () => <div className="border-b border-dashed border-gray-400 my-2"></div>;

  // Logic to determine if we show sections (Safe Optional Chaining)
  const showCustomerCopy = settings?.printCustomerCopy ?? true;
  const showKitchenCopy = (settings?.printKitchenCopy && settings?.kitchenPrinter?.enabled) ?? false;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:static print:block">
      
      {/* Container holding tickets - A classe 'printable' é crítica aqui */}
      <div className="printable bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full flex flex-col md:flex-row gap-8 print:fixed print:top-0 print:left-0 print:w-full print:h-full print:shadow-none print:max-w-none print:gap-0 print:block print:absolute print:top-0">
        
        {/* === STUDENT COPY === */}
        {showCustomerCopy && (
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
                    <td className="py-1">{item.name}</td>
                    <td className="py-1 text-right">{item.quantity}</td>
                    <td className="py-1 text-right">{(item.price * item.quantity).toFixed(2)}</td>
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

        {/* Print Break if both are visible */}
        {showCustomerCopy && showKitchenCopy && (
          <div className="hidden print:block w-full border-b-2 border-dashed border-black my-8 relative page-break">
             <span className="print:hidden absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2">CORTE AQUI</span>
          </div>
        )}

        {/* === KITCHEN COPY === */}
        {showKitchenCopy && (
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
                <div key={idx} className="flex items-start justify-between border-b border-gray-100 pb-2 print:border-black">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 bg-black text-white font-bold rounded-full text-lg print:border-2 print:border-black print:bg-white print:text-black">
                      {item.quantity}
                    </span>
                    <span className="text-lg font-bold leading-tight uppercase">
                      {item.name}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center text-xs text-gray-400 print:text-black">
              *** VIA DA COZINHA ***
            </div>
          </div>
        )}

        {!showCustomerCopy && !showKitchenCopy && (
            <div className="bg-red-50 p-4 rounded text-red-600 border border-red-200 text-center print:hidden">
                Nenhuma via configurada para impressão. Verifique as configurações.
            </div>
        )}

      </div>

      {/* Action Buttons (Hidden when printing) */}
      <div className="absolute bottom-8 flex gap-4 print:hidden">
        <button 
          onClick={onClose}
          className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium transition-colors"
        >
          Fechar (Esc)
        </button>
        <button 
          onClick={handlePrint}
          className="px-8 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 font-bold shadow-lg flex items-center gap-2 transition-transform transform active:scale-95"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
          Imprimir
        </button>
      </div>
    </div>
  );
};
