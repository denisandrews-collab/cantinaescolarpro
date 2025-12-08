import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const container = document.getElementById("root");

if (!container) {
  // Mensagem clara para debugar em produção
  // (Se isso aparecer, significa que o HTML não está servindo o elemento root)
  // Verifique se index.html contém <div id="root"></div> e se o servidor está servindo o HTML correto.
  // Também pode indicar que um script foi injetado antes do HTML carregado — nesse caso garantir que o bundle execute após DOM pronto.
  // Não interrompe o resto do código; apenas evita um crash silencioso.
  // Mostre erro no console para inspeção.
  // eslint-disable-next-line no-console
  console.error("[APP] root container not found: cannot mount React application");
} else {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } catch (err) {
    // Captura erros de runtime na montagem inicial e imprime no console
    // (Isso evita tela branca sem mensagens e facilita o diagnóstico)
    // eslint-disable-next-line no-console
    console.error("[APP] error rendering App:", err);
    // opcional: exibir mensagem básica na página para usuários/testes
    const errEl = document.createElement("div");
    errEl.style.padding = "16px";
    errEl.style.background = "#fff4f4";
    errEl.style.color = "#7f1d1d";
    errEl.style.fontFamily = "sans-serif";
    errEl.textContent = "Erro ao inicializar a aplicação — verifique o console para detalhes.";
    container.appendChild(errEl);
  }
}
