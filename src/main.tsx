import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log('DIAG: src/main.tsx carregou');

const container = document.getElementById('root');
if (!container) {
  console.error('DIAG: elemento #root não encontrado');
} else {
  container.style.outline = '3px dashed lime';
  const root = createRoot(container);
  root.render(<App />);
  console.log('DIAG: React.render() chamado');
}
