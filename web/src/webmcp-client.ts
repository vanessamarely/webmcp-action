import type { WebMcpToolResult } from "./types/webmcp";

function normalizeToolResult(result: unknown): WebMcpToolResult {
  if (typeof result === "string") {
    try {
      const parsed = JSON.parse(result) as Partial<WebMcpToolResult>;
      if (Array.isArray(parsed.content)) return parsed as WebMcpToolResult;
    } catch {
      // Native WebMCP may return a plain serialized text result.
    }
    return { content: [{ type: "text", text: result }] };
  }

  if (result && typeof result === "object" && Array.isArray((result as WebMcpToolResult).content)) {
    return result as WebMcpToolResult;
  }

  return { content: [{ type: "text", text: JSON.stringify(result) }] };
}

const COLOR_HEX_BY_NAME: Record<string, string> = {
  red: "#dc2626",
  rojo: "#dc2626",
  blue: "#3366ff",
  azul: "#3366ff",
  green: "#16a34a",
  verde: "#16a34a",
  black: "#111827",
  negro: "#111827",
  white: "#f8fafc",
  blanco: "#f8fafc",
  yellow: "#facc15",
  amarillo: "#facc15",
  pink: "#ec4899",
  rosa: "#ec4899",
  purple: "#7c3aed",
  morado: "#7c3aed",
};

function normalizeToolArgs(name: string, args: Record<string, unknown>): Record<string, unknown> {
  if (name !== "change_color" || typeof args.hex === "string") return args;
  const color = typeof args.color === "string" ? args.color.toLowerCase().trim() : "";
  const hex = COLOR_HEX_BY_NAME[color] ?? (color.match(/^#?[0-9a-f]{6}$/i) ? color : undefined);
  return hex ? { ...args, hex } : args;
}

/**
 * Pequeño helper que resuelve el nombre de una tool a su objeto registrado
 * (vía getTools()) antes de invocar executeTool(), tal como lo hace el
 * ejemplo oficial del spec de WebMCP.
 */
export async function callWebMcpTool(
  name: string,
  args: Record<string, unknown>
): Promise<WebMcpToolResult> {
  const normalizedArgs = normalizeToolArgs(name, args);
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
    args: normalizedArgs,
    argsJSON: JSON.stringify(normalizedArgs),
  });

  try {
    const result = await document.modelContext.executeTool(tool, normalizedArgs);
    return normalizeToolResult(result);
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
      const result = await document.modelContext.executeTool(tool, JSON.stringify(normalizedArgs) as unknown as Record<string, unknown>);
      return normalizeToolResult(result);
    } catch (errStr) {
      console.error(`[webmcp] executeTool("${name}") también falló con args como string. Error completo:`, errStr);
      throw errStr;
    }
  }
}
