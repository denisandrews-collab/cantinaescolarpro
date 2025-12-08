import React, { useState, useRef } from 'react';
import { Transaction, SystemSettings } from '../types';

interface ReceiptProps {
  transaction: Transaction;
  settings: SystemSettings;
  onClose: () => void;
}

export const Receipt: React.FC<ReceiptProps> = ({ transaction, settings, onClose }) => {
  const { id, studentName, items, total, date, aiMessage, studentBalanceSnapshot } = transaction;
  const formattedDate = date.toLocaleString('pt-BR');

  const [printMode, setPrintMode] = useState<'ALL' | 'CUSTOMER' | 'KITCHEN'>('ALL');
  const printableRef = useRef<HTMLDivElement | null>(null);

  const Separator = () => <div className="border-b border-dashed border-gray-400 my-2"></div>;

  const showCustomerCopy = settings?.printCustomerCopy ?? true;
  const showKitchenCopy = (settings?.printKitchenCopy && settings?.kitchenPrinter?.enabled) ?? false;

  // Abre nova janela com o HTML da área imprimível e chama print()
  const openPrintWindow = (html: string) => {
    const w = window.open('', '_blank', 'width=400,height=800');
    if (!w) {
      alert('Permita pop-ups ou bloqueadores para abrir a janela de impressão.');
      return;
    }

    const style = `
      <style>
        @page { size: 80mm auto; margin: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial; margin:0; padding:5px; color:#000; background:#fff; }
        .receipt { width: 80mm; max-width: 80mm; box-sizing: border-box; }
        table { width:100%; border-collapse: collapse; font-size:12px; }
        .text-right { text-align:right; }
        .center { text-align:center; }
        .bold { font-weight:700; }
        .separator { border-bottom: 1px dashed #444; margin:8px 0; }
      </style>
    `;

    w.document.open();
    w.document.write('<html><head><title>Recibo</title>' + style + '</head><body>');
    w.document.write(`<div class="receipt">${html}</div>`);
    w.document.write('</body></html>');
    w.document.close();

    setTimeout(() => {
      try {
        w.focus();
        w.print();
      } catch (err) {
        console.error('Erro ao imprimir nova janela', err);
        alert('Erro ao imprimir. Veja o console para detalhes.');
      }
    }, 300);
  };

  const handlePrintCustomer = () => {
    setPrintMode('CUSTOMER');
    alert(`POR FAVOR SELECIONE A IMPRESSORA:\n\n${settings.counterPrinter.name}\n\nNa janela que abrirá a seguir.`);
    const html = printableRef.current ? printableRef.current.innerHTML : '';
    openPrintWindow(html);
    setPrintMode('ALL');
  };

  const handlePrintKitchen = () => {
    setPrintMode('KITCHEN');
    alert(`POR FAVOR SELECIONE A IMPRESSORA:\n\n${settings.kitchenPrinter.name}\n\nNa janela que abrirá a seguir.`);
    const html = printableRef.current ? printableRef.current.innerHTML : '';
    openPrintWindow(html);
    setPrintMode('ALL');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div ref={printableRef} className="printable bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full flex flex-col md:flex-row gap-8">
        {/* STUDENT COPY */}
        {showCustomerCopy && (printMode === 'ALL' || printMode === 'CUSTOMER') && (
          <div className="flex-1 border p-4 bg-gray-50">
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
                      {item.notes && <div className="text-xs italic text-gray-500">Obs: {item.notes}</div>}
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

            {typeof studentBalanceSnapshot !== 'undefined' && (
              <div className="flex justify-between items-center text-sm mb-4 pt-1 border-t border-dashed border-gray-400">
                <span>Saldo Restante:</span>
                <span className="text-black">{studentBalanceSnapshot < 0 ? `Deve R$ ${Math.abs(studentBalanceSnapshot).toFixed(2)}` : `Créd. R$ ${studentBalanceSnapshot.toFixed(2)}`}</span>
              </div>
            )}

            <div className="mt-2 p-3 bg-white border border-gray-200 rounded text-center italic text-sm">
              {aiMessage ? aiMessage : "Obrigado!"}
            </div>

            <div className="mt-6 text-center text-xs text-gray-400">
              *** VIA DO ALUNO ***
            </div>
          </div>
        )}

        {/* KITCHEN COPY */}
        {showKitchenCopy && (printMode === 'ALL' || printMode === 'KITCHEN') && (
          <div className="flex-1 border p-4 bg-yellow-50">
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
                <div key={idx} className="flex flex-col border-b border-gray-100 pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 bg-black text-white font-bold rounded-full text-lg">{item.quantity}</span>
                      <span className="text-lg font-bold leading-tight uppercase">{item.name}</span>
                    </div>
                  </div>
                  {item.notes && (
                    <div className="ml-11 mt-1 text-sm font-bold uppercase bg-black text-white px-2 py-1 inline-block rounded">⚠️ {item.notes}</div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-8 text-center text-xs text-gray-400">
              *** VIA DA COZINHA ***
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-8 flex gap-4">
        <button onClick={onClose} className="px-6 py-3 bg-gray-500 text-white rounded-lg">Fechar (Esc)</button>

        {showCustomerCopy && (
          <button onClick={handlePrintCustomer} className="px-6 py-3 bg-brand-600 text-white rounded-lg font-bold">Imprimir Balcão</button>
        )}

        {showKitchenCopy && (
          <button onClick={handlePrintKitchen} className="px-6 py-3 bg-yellow-600 text-white rounded-lg font-bold">Imprimir Cozinha</button>
        )}
      </div>
    </div>
  );
};
