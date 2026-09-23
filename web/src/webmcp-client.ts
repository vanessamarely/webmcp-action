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

  try {
    return await document.modelContext.executeTool(tool, args);
  } catch (err) {
    // Compatibilidad: algunas builds tempranas de Chrome (la API sigue en
    // borrador) esperan los args como JSON string en vez del objeto que
    // pide el spec — "Failed to parse input arguments" es justo el error
    // que tira esa build cuando le pasamos el objeto directo. Reintentamos
    // una vez con el string antes de rendirnos.
    const msg = err instanceof Error ? err.message : String(err);
    if (!/parse input arguments/i.test(msg)) throw err;
    console.warn(`[webmcp] "${name}" rechazó args como objeto, reintentando como JSON string:`, err);
    return await document.modelContext.executeTool(tool, JSON.stringify(args) as unknown as Record<string, unknown>);
  }
}
