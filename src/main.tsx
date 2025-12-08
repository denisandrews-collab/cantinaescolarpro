import React from 'react';
import { createRoot } from 'react-dom/client';
import App from '../App';

console.log('DIAG: main.tsx carregou'); // certifique-se de ver isto no console

try {
  const container = document.getElementById('root');
  if (!container) {
    console.error('DIAG: elemento #root não encontrado');
    const el = document.createElement('div');
    el.textContent = 'DIAG: root não encontrado';
    el.style.background = 'red';
    el.style.color = 'white';
    el.style.padding = '10px';
    document.body.appendChild(el);
  } else {
    // mostra um outline temporário para ver se o root existe visualmente
    container.style.outline = '3px dashed lime';
    const root = createRoot(container);
    root.render(<App />);
    console.log('DIAG: React.render() chamado');
  }
} catch (err) {
  console.error('DIAG: erro ao renderizar main.tsx', err);
  const pre = document.createElement('pre');
  pre.style.color = 'red';
  pre.textContent = String(err);
  document.body.appendChild(pre);
}
