import type { WebMcpRegisteredTool } from "./types/webmcp";
import { callWebMcpTool } from "./webmcp-client";

const MAX_TOOL_STEPS = 5;
const PROMPT_API_ECHO_PREFIX = "On-device model is not available in Chromium";

interface AgentTurn {
  done: boolean;
  say: string;
  tool: string;
  args: Record<string, unknown>;
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    done: { type: "boolean", description: "true si ya no hace falta llamar otra tool" },
    say: { type: "string", description: "mensaje breve para el usuario" },
    tool: { type: "string", description: "nombre exacto de la tool a llamar, o cadena vacía si done=true" },
    args: { type: "object", description: "argumentos para la tool, según su inputSchema" },
  },
  required: ["done", "say", "tool", "args"],
} as const;

function toolsToPrompt(tools: WebMcpRegisteredTool[]): string {
  return tools
    .map((t) => {
      const schema = t.inputSchema as { properties?: Record<string, unknown>; required?: string[] } | undefined;
      const required = new Set(schema?.required ?? []);
      const props = schema?.properties
        ? Object.keys(schema.properties)
            .map((name) => `${name}${required.has(name) ? "!" : ""}`)
            .join(",")
        : "";
      const desc = t.description.length > 40 ? `${t.description.slice(0, 37)}...` : t.description;
      return `${t.name}(${props}): ${desc}`;
    })
    .join("\n");
}

function systemPrompt(tools: WebMcpRegisteredTool[]): string {
  return [
    "Controlas una tienda web vía tools WebMCP. Tools disponibles ('!' = campo obligatorio):",
    toolsToPrompt(tools),
    'Responde SOLO JSON {done,say,tool,args}. Para llamar una tool: done=false, tool=<nombre>, args=<objeto con TODOS los campos obligatorios>. Si terminaste: done=true, tool="", args={}. Una tool por respuesta.',
  ].join("\n");
}

function parseAgentTurn(raw: string): AgentTurn | null {
  const candidate = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(candidate);
  } catch {
    const match = candidate.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

export type LogFn = (role: "you" | "agent" | "tool" | "err", text: string) => void;
export type WebMcpAgentMode = "prompt-api" | "local";

export class WebMcpAgent {
  private session: import("./types/webmcp").LanguageModelSession | null = null;
  readonly mode: WebMcpAgentMode;

  private constructor(session: import("./types/webmcp").LanguageModelSession | null, mode: WebMcpAgentMode) {
    this.session = session;
    this.mode = mode;
  }

  static async create(): Promise<WebMcpAgent> {
    if (typeof LanguageModel === "undefined") return new WebMcpAgent(null, "local");
    try {
      const availability = await LanguageModel.availability();
      if (availability === "unavailable") return new WebMcpAgent(null, "local");

      const tools = await document.modelContext.getTools();
      const session = await LanguageModel.create({
        initialPrompts: [{ role: "system", content: systemPrompt(tools) }],
        temperature: 0.3,
      });
      const smoke = await session.prompt('Responde solo {"done":true,"say":"ok","tool":"","args":{}}.', {
        responseConstraint: RESPONSE_SCHEMA,
      });
      if (!parseAgentTurn(smoke) || smoke.includes(PROMPT_API_ECHO_PREFIX)) {
        session.destroy();
        return new WebMcpAgent(null, "local");
      }
      return new WebMcpAgent(session, "prompt-api");
    } catch (err) {
      console.warn("No se pudo inicializar la Prompt API de Chrome:", err);
      return new WebMcpAgent(null, "local");
    }
  }

  async handleUserMessage(message: string, log: LogFn): Promise<void> {
    if (!this.session) {
      await this.handleLocalMessage(message, log);
      return;
    }
    let nextInput = `Mensaje del usuario: "${message}"`;

    for (let step = 0; step < MAX_TOOL_STEPS; step++) {
      const raw = await this.session.prompt(nextInput, { responseConstraint: RESPONSE_SCHEMA });
      const turn = parseAgentTurn(raw);
      if (!turn) {
        if (raw.includes(PROMPT_API_ECHO_PREFIX)) {
          console.warn("[webmcp-agent] Prompt API en modo eco; usando agente local WebMCP.");
          this.session.destroy();
          this.session = null;
          await this.handleLocalMessage(message, log);
          return;
        }
        console.warn(`[webmcp-agent] respuesta no parseable (paso ${step + 1}/${MAX_TOOL_STEPS}):`, raw);
        // No abortamos de una: le pedimos al modelo que reintente en el
        // formato correcto — muchas veces el modelo chico se distrae una
        // vez y se corrige solo si se le insiste.
        log("err", "Respuesta no parseable — reintentando");
        nextInput =
          'Tu última respuesta no era JSON válido. Responde ÚNICAMENTE el objeto JSON {done,say,tool,args}, sin texto adicional ni bloques de código.';
        continue;
      }

      if (turn.say) log("agent", turn.say);

      if (turn.done || !turn.tool) return;

      try {
        const result = await callWebMcpTool(turn.tool, turn.args ?? {});
        const resultText = result.content.map((c) => c.text).join(" ");
        log("tool", `${turn.tool}(${JSON.stringify(turn.args)}) → ${resultText}`);
        nextInput = `Resultado de la tool "${turn.tool}": ${resultText}\n¿Necesitas otra tool o ya terminaste? Responde en el mismo formato JSON.`;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        log("err", `Error ejecutando ${turn.tool}: ${msg} — reintentando`);
        // Le devolvemos el error al modelo (en vez de abortar el turno) para
        // que pueda corregir los argumentos y reintentar en el siguiente paso.
        nextInput = `La tool "${turn.tool}" falló con args ${JSON.stringify(turn.args)}: ${msg}\nRevisa el schema y vuelve a intentar con args corregidos, o responde done=true si no puedes continuar.`;
      }
    }

    log("err", "Se alcanzó el límite de pasos del agente.");
  }

  private async handleLocalMessage(message: string, log: LogFn): Promise<void> {
    const tools = await document.modelContext.getTools();
    const available = new Set(tools.map((tool) => tool.name));
    const normalized = normalize(message);
    const calls: { tool: string; args: Record<string, unknown> }[] = [];

    const productId = productIdFromText(normalized);
    if (productId && available.has("open_product")) calls.push({ tool: "open_product", args: { product_id: productId } });

    const searchQuery = searchQueryFromText(normalized);
    if (searchQuery && available.has("search_products")) calls.push({ tool: "search_products", args: { query: searchQuery } });

    const color = colorFromText(normalized);
    if (color && available.has("change_color")) calls.push({ tool: "change_color", args: { hex: color } });

    const finish = finishFromText(normalized);
    if (finish && available.has("change_finish")) calls.push({ tool: "change_finish", args: { finish } });

    const focusPart = focusPartFromText(normalized, tools);
    if (focusPart && available.has("focus_view")) calls.push({ tool: "focus_view", args: { part: focusPart } });

    const engraving = engravingFromText(normalized);
    if (engraving && available.has("engrave_text")) calls.push({ tool: "engrave_text", args: { text: engraving } });

    if (/\b(precio|cuanto|cuánto|cost|price)\b/.test(normalized) && available.has("get_price")) {
      calls.push({ tool: "get_price", args: {} });
    }

    if (/\b(lista|muestra|ver)\b.*\bcarrito\b|\bcarrito\b.*\b(total|contenido)\b/.test(normalized) && available.has("list_cart")) {
      calls.push({ tool: "list_cart", args: {} });
    }

    if (/\b(pagar|checkout|confirmar compra|finalizar compra)\b/.test(normalized) && available.has("checkout")) {
      calls.push({ tool: "checkout", args: {} });
    } else if (/\b(anade|añade|agrega|agregar|carrito|comprar)\b/.test(normalized) && available.has("add_to_cart")) {
      calls.push({ tool: "add_to_cart", args: {} });
    }

    if (calls.length === 0) {
      log("agent", "Puedo buscar productos, abrir detalles, cambiar color/acabado, enfocar partes, grabar texto, consultar precio y manejar el carrito.");
      return;
    }

    for (const call of dedupeCalls(calls)) {
      const result = await callWebMcpTool(call.tool, call.args);
      const resultText = result.content.map((content) => content.text).join(" ");
      log(result.isError ? "err" : "tool", `${call.tool}(${JSON.stringify(call.args)}) → ${resultText}`);
    }
    log("agent", "Listo.");
  }

  destroy(): void {
    this.session?.destroy();
    this.session = null;
  }
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function colorFromText(text: string): string | null {
  const explicit = text.match(/#?[0-9a-f]{6}\b/i)?.[0];
  if (explicit) return explicit.startsWith("#") ? explicit : `#${explicit}`;

  const colors: Record<string, string> = {
    azul: "#3366ff",
    rojo: "#dc2626",
    verde: "#16a34a",
    negro: "#111827",
    blanco: "#f8fafc",
    amarillo: "#facc15",
    rosa: "#ec4899",
    morado: "#7c3aed",
    violeta: "#7c3aed",
    naranja: "#f97316",
    gris: "#64748b",
    plata: "#94a3b8",
  };
  return Object.entries(colors).find(([name]) => new RegExp(`\\b${name}\\b`).test(text))?.[1] ?? null;
}

function finishFromText(text: string): "matte" | "glossy" | "metallic" | null {
  if (/\b(mate|matte)\b/.test(text)) return "matte";
  if (/\b(brillante|glossy|brillo)\b/.test(text)) return "glossy";
  if (/\b(metalico|metallic|metal)\b/.test(text)) return "metallic";
  return null;
}

function engravingFromText(text: string): string | null {
  const match = text.match(/\b(?:graba\w*|engrava\w*|personaliza\w*)\s+["“”']?(.+?)["“”']?$/);
  if (!match) return null;
  const engraving = match[1]
    .replace(/^con\s+/, "")
    .split(/\s+y\s+(?:agrega\w*|anade\w*|compra\w*|pon\w*|cambia\w*|enfoca\w*|muestra\w*|paga\w*)\b/)[0]
    .trim();
  return engraving.slice(0, 14).toUpperCase() || null;
}

function productIdFromText(text: string): string | null {
  if (/\bauriculares?\b|\borbit\b/.test(text)) return "auriculares";
  if (/\breloj\b|\bpulse\b|\bsmartwatch\b/.test(text)) return "reloj";
  if (/\bmochila\b|\btrail\b/.test(text)) return "mochila";
  if (/\blampara\b|\bstudio\b/.test(text)) return "lampara";
  return null;
}

function searchQueryFromText(text: string): string | null {
  const match = text.match(/\b(?:busca|buscar|encuentra|muestra)\s+(.+)$/);
  if (!match || /\bcarrito\b/.test(text)) return null;
  return match[1].trim();
}

function focusPartFromText(text: string, tools: WebMcpRegisteredTool[]): string | null {
  const focusTool = tools.find((tool) => tool.name === "focus_view");
  const parts = ((focusTool?.inputSchema as { properties?: { part?: { enum?: string[] } } }).properties?.part?.enum ?? []) as string[];
  return parts.find((part) => text.includes(normalize(part))) ?? null;
}

function dedupeCalls(calls: { tool: string; args: Record<string, unknown> }[]): { tool: string; args: Record<string, unknown> }[] {
  const seen = new Set<string>();
  return calls.filter((call) => {
    const key = `${call.tool}:${JSON.stringify(call.args)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
