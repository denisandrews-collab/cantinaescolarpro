# Impressão de Recibos

Este documento descreve o funcionamento do componente `Recibo` e como configurar cópias para cliente e cozinha.

## Componente Recibo (exemplo)
Props principais:
- order: objeto com id, storeName, items[], total, customer
- printClientCopy: boolean (padrão: true)
- printKitchenCopy: boolean (padrão: false)

Exemplo de uso:
```jsx
<Recibo
  order={order}
  printClientCopy={true}
  printKitchenCopy={true}
/>
```

## Observações sobre impressoras
- Navegadores não permitem seleção de impressora por nome de forma confiável.
- Para enviar impressões diretamente para uma impressora de cozinha, use:
  - Um agente local (Node.js) que receba requisições do app e imprima usando CUPS ou drivers específicos
  - Ou o backend que gere PDF/HTML e envie para um serviço de impressão
- O componente cria janelas de impressão separadas para cada cópia (cliente/cozinha).

## Layout e economia de tinta
- O CSS de impressão reduz margens, usa fonte monoespaçada e evita backgrounds/gradientes.
- Tamanho fixo: 80mm (ajustável via config/printers.yml)
