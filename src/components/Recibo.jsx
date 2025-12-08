import React from 'react';
import '../styles/recibo.css';

/**
 * Recibo component
 * Props:
 * - order: { id, storeName, items: [{ qty, name, price }], total, customer }
 * - printClientCopy: boolean (imprime cópia do cliente)
 * - printKitchenCopy: boolean (imprime cópia para cozinha)
 * - printerName: string opcional (apenas informativo; seleção real depende do ambiente/driver)
 *
 * Observação: Navegadores não permitem escolher impressora diretamente de forma confiável.
 * Para impressões em impressoras específicas (cozinha), prefira um serviço de impressão no servidor/agent.
 */

function printStyles() {
  return `
  @page { margin: 2mm; }
  body.receipt {
    width: 80mm;
    font-family: monospace, "Courier New", monospace;
    font-size: 12px;
    color: #000;
    margin: 0;
    padding: 0;
    -webkit-print-color-adjust: exact;
  }
  .header { text-align:center; margin-bottom: 4px; }
  .header h2 { margin: 2px 0; font-size: 14px; }
  .small { font-size: 10px; color: #000; }
  table.items { width:100%; border-collapse: collapse; margin-top:6px; }
  table.items td { padding: 2px 0; vertical-align: top; }
  .qty { width:12%; text-align:left; }
  .name { width:68%; text-align:left; word-break:break-word; }
  .price { width:20%; text-align:right; }
  .total { display:flex; justify-content:space-between; margin-top:8px; border-top:1px dashed #000; padding-top:6px; font-weight:700; }
  .footer { margin-top:10px; text-align:center; font-size:10px; }
  * { background: transparent !important; }
  `;
}

function generateHtml(order, copyType) {
  const itemsHtml = (order.items || [])
    .map(i => `<tr><td class="qty">${i.qty}</td><td class="name">${i.name}</td><td class="price">${i.price}</td></tr>`)
    .join('');

  return `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8"/>
      <title>Recibo - ${copyType}</title>
      <style>${printStyles()}</style>
    </head>
    <body class="receipt">
      <div class="header">
        <h2>${order.storeName || 'Cantina'}</h2>
        <div class="small">Recibo: ${order.id} — ${copyType}</div>
      </div>

      <table class="items">
        ${itemsHtml}
      </table>

      <div class="total">
        <span>Total:</span>
        <strong>${order.total}</strong>
      </div>

      <div class="footer small">
        ${order.customer ? `Cliente: ${order.customer.name} — ${order.customer.note || ''}` : ''}
        <div>Obrigado pela preferência</div>
      </div>
    </body>
  </html>
  `;
}

function openPrintWindow(html) {
  const w = window.open('', '_blank', 'width=400,height=600');
  if (!w) {
    alert('Bloqueador de pop-ups pode impedir a impressão. Permita pop-ups e tente novamente.');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();

  // Aguarda breve para garantir renderização antes de imprimir
  w.focus();
  setTimeout(() => {
    try {
      w.print();
    } catch (e) {
      console.error('Falha ao imprimir:', e);
    }
  }, 600);
}

export default function Recibo({
  order = {},
  printClientCopy = true,
  printKitchenCopy = false,
  printerName = ''
}) {
  const handlePrint = () => {
    if (printClientCopy) {
      const htmlClient = generateHtml(order, 'Cópia do Cliente');
      openPrintWindow(htmlClient);
    }
    if (printKitchenCopy) {
      const htmlKitchen = generateHtml(order, 'Cópia Cozinha');
      openPrintWindow(htmlKitchen);
    }
  };

  return (
    <div className="recibo-component">
      <button onClick={handlePrint}>Imprimir Recibo</button>
      <div className="preview">
        <div className="preview-receipt">
          <strong>{order.storeName || 'Cantina'}</strong>
          <div>ID: {order.id}</div>
        </div>
      </div>
    </div>
  );
}
