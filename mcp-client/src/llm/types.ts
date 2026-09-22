export interface ToolSpec {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export type ToolExecutor = (name: string, args: Record<string, unknown>) => Promise<string>;

/**
 * Contrato común para cualquier proveedor de LLM. index.ts y McpStoreClient
 * no saben (ni les importa) si detrás hay Claude o Gemini — eso es
 * exactamente el punto: MCP es agnóstico del modelo.
 */
export interface LLMProvider {
  readonly name: string;
  run(userMessage: string, tools: ToolSpec[], executeTool: ToolExecutor): Promise<string>;
}
