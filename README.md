# WebMCP Action

Demo para charla técnica sobre [WebMCP](https://github.com/webmachinelearning/webmcp) — el estándar web propuesto que deja que una página exponga su funcionalidad como *tools* invocables por un agente de IA, y su relación con el [Model Context Protocol (MCP)](https://modelcontextprotocol.io) "clásico" (servidor↔cliente backend).

Recursos oficiales usados como base:
- https://developer.chrome.com/docs/ai/webmcp
- https://github.com/webmachinelearning/webmcp

## Las tres piezas

```
web/          → Demo WebMCP: configurador 3D de auriculares (three.js), 100% client-side
mcp-server/   → MCP server "clásico": inventario/tienda de auriculares (stdio)
mcp-client/   → MCP client con LLM (Claude o Gemini) que habla con mcp-server
```

El hilo narrativo de la charla:

1. **`web/`** — una página muestra un configurador 3D de auriculares. La propia página registra sus capacidades como tools con `document.modelContext.registerTool()` (la API central de WebMCP). Un agente corriendo **dentro del navegador**, usando la Prompt API on-device de Chrome, lee esas tools y las invoca en lenguaje natural: "ponlos azul mate y grábales DEMO". Sin backend, sin API key.
2. **`mcp-server/` + `mcp-client/`** — el mismo tipo de "tienda", pero ahora el inventario y el checkout viven en un **servidor MCP** real (proceso Node separado, protocolo por stdio). Un **cliente MCP** conecta a ese servidor y usa un LLM (Claude o Gemini, intercambiable) para decidir qué tool del servidor invocar. Esto es MCP "de toda la vida": cliente y servidor son procesos distintos, no la misma página.

La comparación en vivo es el punto de la charla: **WebMCP mueve la superficie de tools al navegador y al mismo origen de la página** (con los permisos y el sandboxing que eso implica), mientras que **MCP server/client es la integración backend tradicional**. Son complementarios, no compiten.

## Cómo correr cada parte

### `web/` — demo WebMCP

```bash
cd web
npm install
npm run dev
```

Abre la URL que imprime Vite **en Chrome 138+** (idealmente con la Prompt API on-device disponible: `chrome://flags` → *Prompt API for Gemini Nano*, y modelo descargado en `chrome://components`). Si la Prompt API no está disponible, la UI cae automáticamente a botones manuales que llaman las mismas tools — la demo funciona igual, solo sin lenguaje natural.

### `mcp-server/` — servidor MCP standalone

```bash
cd mcp-server
npm install
npm start
```

Queda escuchando por stdio. No se usa solo — lo levanta `mcp-client` (o cualquier cliente MCP, p. ej. el MCP Inspector).

### `mcp-client/` — cliente MCP con Claude o Gemini

```bash
cd mcp-client
npm install
cp .env.example .env   # completa ANTHROPIC_API_KEY y/o GEMINI_API_KEY
npm start               # usa LLM_PROVIDER de .env (claude por defecto)
```

```bash
LLM_PROVIDER=gemini npm start
```

El cliente levanta `mcp-server` como subproceso automáticamente (stdio) y abre un REPL: escribe en lenguaje natural ("¿cuántos auriculares azules quedan en stock?") y el LLM decide qué tool del servidor invocar.

## Requisitos

- Node.js 18+
- Chrome 138+ para la demo `web/` con lenguaje natural (opcional — hay fallback de botones)
- API key de Anthropic y/o de Google AI Studio para `mcp-client/`
