const express = require('express');
const net = require('net');
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'config', 'printers.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = express();
app.use(express.json({ limit: '1mb' }));

function buildEscPosForTransaction(transaction, type) {
  // Very basic ESC/POS builder. Adjust/extend as needed.
  const lines = [];
  const esc = '\x1B';
  const gs = '\x1D';

  // Init
  lines.push(Buffer.from([0x1B, 0x40]));

  // Header - store name
  lines.push(Buffer.from('\n' + (transaction.storeName || 'Cantina Escolar') + '\n', 'utf8'));
  lines.push(Buffer.from('--------------------------------\n'));

  // Transaction id / date
  lines.push(Buffer.from(`Pedido: ${transaction.id || ''}\n`));
  if (transaction.date) lines.push(Buffer.from(`Data: ${new Date(transaction.date).toLocaleString()}\n`));

  // If kitchen copy, print just items and quantities
  if (type === 'kitchen') {
    lines.push(Buffer.from('\n--- Itens (Cozinha) ---\n'));
    (transaction.items || []).forEach(i => {
      lines.push(Buffer.from(`${i.quantity} x ${i.name}\n`));
      if (i.notes) lines.push(Buffer.from(`  * ${i.notes}\n`));
    });
  } else {
    // customer copy
    lines.push(Buffer.from('\nCliente: ' + (transaction.studentName || 'Venda Balcão') + '\n'));
    lines.push(Buffer.from('\nItens:\n'));
    (transaction.items || []).forEach(i => {
      const line = `${i.name} - ${i.quantity} x R$ ${i.price?.toFixed?.(2) || (i.price)} = R$ ${(i.price * i.quantity).toFixed(2)}\n`;
      lines.push(Buffer.from(line));
    });

    lines.push(Buffer.from('\nTOTAL: R$ ' + (transaction.total?.toFixed?.(2) || '0.00') + '\n'));
  }

  // Footer message
  if (transaction.aiMessage) lines.push(Buffer.from('\n' + transaction.aiMessage + '\n'));
  lines.push(Buffer.from('\n\n'));

  // Feed and cut (common sequence)
  lines.push(Buffer.from([0x1B, 0x64, 0x05])); // feed 5 lines
  lines.push(Buffer.from([0x1D, 0x56, 0x41, 0x00])); // full cut

  return Buffer.concat(lines.map(b => Buffer.isBuffer(b) ? b : Buffer.from(b)));
}

function sendToPrinter(ip, port, buffer) {
  return new Promise((resolve, reject) => {
    const client = net.createConnection(port, ip, () => {
      client.write(buffer);
      client.end();
    });
    client.on('error', err => reject(err));
    client.on('close', () => resolve());
  });
}

app.post('/print', async (req, res) => {
  try {
    const { printer, transaction } = req.body;
    if (!printer || !['counter', 'kitchen'].includes(printer)) return res.status(400).json({ error: 'printer must be "counter" or "kitchen"' });
    if (!transaction) return res.status(400).json({ error: 'transaction required' });

    const target = printer === 'counter' ? config.counterPrinter : config.kitchenPrinter;
    if (!target || !target.ip) return res.status(500).json({ error: 'printer not configured' });

    const buffer = buildEscPosForTransaction(transaction, printer === 'kitchen' ? 'kitchen' : 'customer');
    await sendToPrinter(target.ip, Number(target.port || 9100), buffer);

    return res.json({ ok: true });
  } catch (err) {
    console.error('Print error', err);
    return res.status(500).json({ error: String(err) });
  }
});

const PORT = process.env.PRINT_SERVER_PORT || 3001;
app.listen(PORT, () => console.log(`Print server listening on ${PORT}`));
