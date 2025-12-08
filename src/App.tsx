import React from 'react';

export default function App() {
  console.log('DIAG: App.tsx módulo avaliado');
  console.log('DIAG: App render');
  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif', background: '#e6ffe6' }}>
      <h1>Projeto mínimo: App carregou com sucesso</h1>
      <p>Se você ver esta mensagem, o React está sendo renderizado corretamente.</p>
      <p>Abra o DevTools (F12) e cole aqui qualquer erro que aparecer no console se ainda houver problema.</p>
    </div>
  );
}
