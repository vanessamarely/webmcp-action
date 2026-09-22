import type { WebMcpToolResult } from "./types/webmcp";

/**
 * Pequeño helper que resuelve el nombre de una tool a su objeto registrado
 * (vía getTools()) antes de invocar executeTool(), tal como lo hace el
 * ejemplo oficial del spec de WebMCP.
 */
export async function callWebMcpTool(
  name: string,
  args: Record<string, unknown>
): Promise<WebMcpToolResult> {
  const tools = await document.modelContext.getTools();
  const tool = tools.find((t) => t.name === name);
  if (!tool) {
    return { content: [{ type: "text", text: `Tool no encontrada: ${name}` }], isError: true };
  }
  return document.modelContext.executeTool(tool, args);
}
