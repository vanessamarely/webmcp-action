import type {
  ModelContext,
  WebMcpRegisteredTool,
  WebMcpToolDefinition,
  WebMcpToolResult,
} from "./types/webmcp";

/**
 * Polyfill mínimo de document.modelContext, fiel a la forma descrita en
 * https://github.com/webmachinelearning/webmcp (registerTool/getTools/executeTool,
 * evento "toolchange"). Se instala solo si el navegador no trae la API nativa —
 * hoy (2026) ningún Chrome estable la expone todavía sin flags, así que esto
 * es lo que hace correr la demo en cualquier máquina.
 */
class ModelContextPolyfill extends EventTarget implements ModelContext {
  private tools = new Map<string, WebMcpToolDefinition>();

  async registerTool(tool: WebMcpToolDefinition, options?: { signal?: AbortSignal; exposedTo?: string[] }): Promise<void> {
    this.tools.set(tool.name, tool);
    this.dispatchEvent(new Event("toolchange"));

    options?.signal?.addEventListener("abort", () => {
      this.tools.delete(tool.name);
      this.dispatchEvent(new Event("toolchange"));
    });
  }

  async getTools(): Promise<WebMcpRegisteredTool[]> {
    return [...this.tools.values()].map(({ name, description, inputSchema }) => ({
      name,
      description,
      inputSchema,
      origin: location.origin,
      window,
    }));
  }

  async executeTool(
    tool: WebMcpRegisteredTool | string,
    args: Record<string, unknown>,
    options?: { signal?: AbortSignal }
  ): Promise<WebMcpToolResult> {
    const name = typeof tool === "string" ? tool : tool.name;
    const definition = this.tools.get(name);
    if (!definition) {
      return { content: [{ type: "text", text: `Tool no encontrada: ${name}` }], isError: true };
    }
    return definition.execute(args, options);
  }
}

export function ensureWebMcpPolyfill(): void {
  if (typeof document.modelContext !== "undefined") return;
  document.modelContext = new ModelContextPolyfill();
  console.info("[webmcp] document.modelContext no estaba disponible — usando polyfill local.");
}
