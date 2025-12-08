import React from 'react';

console.log('DIAG: App.tsx módulo avaliado');

export default function App() {
  console.log('DIAG: App render');
  // background temporário para garantir visibilidade
  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif', background: '#e6ffe6' }}>
      <h1>Diagnóstico: App carregou com sucesso</h1>
      <p>Se você vir esta mensagem, o React está sendo renderizado — o problema está nos componentes internos.</p>
      <p>Para continuar o diagnóstico, abra o DevTools (F12) e cole aqui qualquer erro que aparecer no console.</p>
    </div>
  );
}
