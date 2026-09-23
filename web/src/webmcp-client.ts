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
    console.error(`[webmcp] "${name}" no está en getTools(). Tools disponibles:`, tools.map((t) => t.name));
    return { content: [{ type: "text", text: `Tool no encontrada: ${name}` }], isError: true };
  }

  // Diagnóstico: qué schema ve realmente el navegador para esta tool, y con
  // qué args exactos la estamos llamando — para comparar contra lo que
  // registerTool() recibió si executeTool() vuelve a fallar.
  console.debug(`[webmcp] executeTool("${name}")`, {
    toolFromGetTools: tool,
    inputSchema: tool.inputSchema,
    args,
    argsJSON: JSON.stringify(args),
  });

  try {
    return await document.modelContext.executeTool(tool, args);
  } catch (errObj) {
    const msg = errObj instanceof Error ? errObj.message : String(errObj);
    console.error(`[webmcp] executeTool("${name}") falló con args como objeto. Error completo:`, errObj);

    if (!/parse input arguments/i.test(msg)) throw errObj;

    // Compatibilidad: algunas builds tempranas de Chrome (la API sigue en
    // borrador) esperan los args como JSON string en vez del objeto que
    // pide el spec — "Failed to parse input arguments" es justo el error
    // que tira esa build cuando le pasamos el objeto directo. Reintentamos
    // una vez con el string antes de rendirnos.
    console.warn(`[webmcp] "${name}" — reintentando con args como JSON string.`);
    try {
      return await document.modelContext.executeTool(tool, JSON.stringify(args) as unknown as Record<string, unknown>);
    } catch (errStr) {
      console.error(`[webmcp] executeTool("${name}") también falló con args como string. Error completo:`, errStr);
      throw errStr;
    }
  }
}
