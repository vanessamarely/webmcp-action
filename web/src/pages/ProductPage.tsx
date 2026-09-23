import { useEffect, useRef, useState, useCallback, type CSSProperties } from "react";
import { Navigate, useParams } from "react-router-dom";
import { getProduct } from "../products";
import { ProductScene, FOCUS_TARGETS_BY_KIND } from "../scene";
import { registerProductTools } from "../product-tools";
import { WebMcpAgent } from "../agent";
import { callWebMcpTool } from "../webmcp-client";
import { getConfig, priceFor, type Finish, type FocusTarget } from "../state";
import { useStoreVersion } from "../hooks/useStoreVersion";
import { tint } from "../color-utils";
import { PRODUCT_ICONS, CheckIcon, AlertIcon } from "../icons";
import ManualControls from "../components/ManualControls";
import ChatPanel, { type LogEntry } from "../components/ChatPanel";

type AgentStatus = { kind: "loading" | "ready" | "fallback"; text: string };

export default function ProductPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const product = id ? getProduct(id) : undefined;

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<ProductScene | null>(null);
  const agentRef = useRef<WebMcpAgent | null>(null);
  const toolsControllerRef = useRef<AbortController | null>(null);

  const [status, setStatus] = useState<AgentStatus>({ kind: "loading", text: "iniciando agente…" });
  const [log, setLog] = useState<LogEntry[]>([]);
  const [sending, setSending] = useState(false);

  useStoreVersion();

  const appendLog = useCallback((role: LogEntry["role"], text: string) => {
    setLog((prev) => [...prev, { role, text }]);
  }, []);

  // Crea el renderer three.js una sola vez, por el tiempo de vida de la página.
  useEffect(() => {
    if (!containerRef.current) return;
    sceneRef.current = new ProductScene(containerRef.current);
    return () => {
      sceneRef.current?.dispose();
      sceneRef.current = null;
    };
  }, []);

  // Al cambiar de producto: carga el modelo, (re)registra sus tools WebMCP
  // y reinicia el agente (el set de tools disponibles cambió).
  useEffect(() => {
    if (!product) return;
    let cancelled = false;

    (async () => {
      while (!sceneRef.current) await new Promise((r) => setTimeout(r, 10));
      if (cancelled) return;

      const scene = sceneRef.current;
      const config = getConfig(product.id);
      scene.loadProduct(product.kind, config.colorHex);
      scene.setBackground(tint(product.accent, 0.88));
      scene.setFinish(config.finish);
      if (product.engravable) scene.setEngraving(config.engraving);

      setLog([]);
      toolsControllerRef.current?.abort();
      toolsControllerRef.current = await registerProductTools(product, scene);
      if (cancelled) return;

      agentRef.current?.destroy();
      setStatus({ kind: "loading", text: "iniciando agente…" });
      const agent = await WebMcpAgent.create();
      if (cancelled) return;
      agentRef.current = agent;
      setStatus(
        agent
          ? { kind: "ready", text: "agente listo (Prompt API on-device)" }
          : { kind: "fallback", text: "Prompt API no disponible — modo manual" }
      );
    })();

    return () => {
      cancelled = true;
      toolsControllerRef.current?.abort();
      agentRef.current?.destroy();
      agentRef.current = null;
    };
  }, [product]);

  const handleSend = useCallback(
    async (message: string) => {
      if (!agentRef.current) return;
      appendLog("you", message);
      setSending(true);
      try {
        await agentRef.current.handleUserMessage(message, appendLog);
      } finally {
        setSending(false);
      }
    },
    [appendLog]
  );

  if (!product) return <Navigate to="/" replace />;

  const config = getConfig(product.id);
  const price = priceFor(product.id);

  const Icon = PRODUCT_ICONS[product.kind];
  const fallback = status.kind === "fallback";

  return (
    <div className="pdp-view" style={{ "--product-accent": product.accent } as CSSProperties}>
      <div className="scene-container" ref={containerRef} />
      <span className="pdp-hint">Arrastra para girar</span>

      <div className="pdp-topbar">
        <div className="hud">
          <h1 className="hud-title">
            <span className="hud-icon">
              <Icon />
            </span>
            {product.name}
          </h1>
          <p className="hud-desc">
            {product.tagline}. Tools registradas con <code>document.modelContext.registerTool()</code>.
          </p>
        </div>
        <div className={`agent-status ${status.kind === "ready" ? "ready" : status.kind === "fallback" ? "fallback" : ""}`}>
          {status.kind === "ready" && <CheckIcon />}
          {status.kind === "fallback" && <AlertIcon />}
          {status.text}
        </div>
      </div>

      <div className="pdp-dock">
        <div className="price-tag">
          <span className="label">Precio</span>
          <span className="amount">${price}</span>
        </div>

        <div className="panel">
          <ManualControls
            product={product}
            focusTargets={FOCUS_TARGETS_BY_KIND[product.kind]}
            config={config}
            onColor={(hex) => callWebMcpTool("change_color", { hex })}
            onFinish={(finish: Finish) => callWebMcpTool("change_finish", { finish })}
            onFocus={(target: FocusTarget) => callWebMcpTool("focus_view", { part: target })}
            onAddToCart={async () => {
              const result = await callWebMcpTool("add_to_cart", {});
              appendLog("tool", result.content.map((c) => c.text).join(" "));
            }}
          />
          <ChatPanel
            log={log}
            disabled={fallback}
            sending={sending}
            placeholder={fallback ? "Lenguaje natural no disponible — usa los controles ↑" : "Ej: ponlos azul mate y grábales DEMO"}
            onSend={handleSend}
          />
        </div>
      </div>
    </div>
  );
}
