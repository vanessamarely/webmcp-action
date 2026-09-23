import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { ensureWebMcpPolyfill } from "./webmcp-polyfill";
import "./styles.css";

// Debe instalarse ANTES de que React monte nada: si vive dentro de un
// useEffect (como estaba antes, en App.tsx), React puede correr el efecto
// de una página hija (p. ej. ProductPage, que registra sus propias tools
// apenas monta) antes que el efecto del padre que instala el polyfill —
// y entonces document.modelContext todavía es undefined en ese momento.
ensureWebMcpPolyfill();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);
