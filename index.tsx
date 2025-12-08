import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const container = document.getElementById("root");

function ErrorOverlay({ error }: { error: any }) {
  const text = error && (error.stack || error.message || String(error));
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', color: '#fff',
      padding: 20, zIndex: 99999, overflow: 'auto', fontFamily: 'monospace'
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h2 style={{ marginTop: 0 }}>Erro ao carregar a aplicação</h2>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{text}</pre>
        <div style={{ marginTop: 16 }}>
          <button onClick={() => location.reload()} style={{ padding: '8px 12px', marginRight: 8 }}>Recarregar</button>
          <button onClick={() => { navigator.clipboard?.writeText(text || '') }} style={{ padding: '8px 12px' }}>Copiar erro</button>
        </div>
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { error };
  }
  componentDidCatch(error: any, info: any) {
    console.error("ErrorBoundary caught:", error, info);
  }
  render() {
    if (this.state.error) return <ErrorOverlay error={this.state.error} />;
    return this.props.children;
  }
}

if (!container) {
  const body = document.body || document.getElementsByTagName("body")[0];
  const errEl = document.createElement("div");
  errEl.style.cssText = "position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#fff;color:#000;z-index:99999;padding:20px;font-family:monospace;";
  errEl.innerText = "ERROR: elemento #root não encontrado no DOM";
  body.appendChild(errEl);
  console.error("Container #root not found");
} else {
  const root = createRoot(container);

  let lastError: any = null;
  let isHandlingError = false;
  
  function setGlobalError(e: any) {
    // Prevent infinite error loops
    if (isHandlingError) {
      console.error("Error while handling error (prevented infinite loop):", e);
      return;
    }
    isHandlingError = true;
    lastError = e;
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
        <div id="__error_capture_marker" />
      </React.StrictMode>
    );
    console.error("Global error captured:", e);
    // Reset flag after a short delay to allow recovery
    setTimeout(() => { isHandlingError = false; }, 100);
  }

  window.addEventListener('error', (ev) => {
    try {
      setGlobalError(ev.error || ev.message || ev);
    } catch (err) {
      console.error('error handler failed', err);
    }
  });

  window.addEventListener('unhandledrejection', (ev) => {
    try {
      setGlobalError(ev.reason || ev);
    } catch (err) {
      console.error('unhandledrejection handler failed', err);
    }
  });

  try {
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </React.StrictMode>
    );
  } catch (err) {
    const body = document.body || document.getElementsByTagName("body")[0];
    const pre = document.createElement("pre");
    pre.style.cssText = "position:fixed;inset:0;overflow:auto;background:#111;color:#fff;padding:20px;z-index:99999;font-family:monospace;";
    pre.textContent = "Render error:\n" + (err && (err.stack || err.message) || String(err));
    body.appendChild(pre);
    console.error("Synchronous render error:", err);
  }
}
