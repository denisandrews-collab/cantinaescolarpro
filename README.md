# Cantina Escolar Pro (versão mínima)

Este PR substitui o conteúdo do repositório por uma versão mínima funcional baseada em Vite + React + TypeScript para facilitar o diagnóstico da tela branca.

## Como testar localmente

1. `npm install`
2. `npm run dev`
3. Abra http://localhost:5173

## Observações

- A dependência "@google/genai" foi removida do bundle de cliente para evitar erros no navegador. Se precisar deste SDK, mova-o para um backend (endpoint API) e chame via fetch.

## Tarefas adicionais (não implementadas automaticamente neste PR)

- Se você quiser que eu mova chamadas a APIs do Google para um backend, posso adicionar um exemplo de endpoint.

## Objetivo

Criar branch minimal-app, aplicar as alterações acima (substituir/atualizar arquivos), e abrir um PR contra main.
