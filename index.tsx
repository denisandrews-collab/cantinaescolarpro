import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const container = document.getElementById("root");

if (!container) {
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
    console.error("[APP] error rendering App:", err);
    const errEl = document.createElement("div");
    errEl.style.padding = "16px";
    errEl.style.background = "#fff4f4";
    errEl.style.color = "#7f1d1d";
    errEl.style.fontFamily = "sans-serif";
    errEl.textContent = "Erro ao inicializar a aplicação — verifique o console para detalhes.";
    container.appendChild(errEl);
  }
}
