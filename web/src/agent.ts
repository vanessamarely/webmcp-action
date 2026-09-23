import type { WebMcpRegisteredTool } from "./types/webmcp";
import { callWebMcpTool } from "./webmcp-client";

const MAX_TOOL_STEPS = 5;

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

export class WebMcpAgent {
  private session: import("./types/webmcp").LanguageModelSession | null = null;

  private constructor(session: import("./types/webmcp").LanguageModelSession | null) {
    this.session = session;
  }

  static async create(): Promise<WebMcpAgent | null> {
    if (typeof LanguageModel === "undefined") return null;
    try {
      const availability = await LanguageModel.availability();
      if (availability === "unavailable") return null;

      const tools = await document.modelContext.getTools();
      const session = await LanguageModel.create({
        initialPrompts: [{ role: "system", content: systemPrompt(tools) }],
        temperature: 0.3,
      });
      return new WebMcpAgent(session);
    } catch (err) {
      console.warn("No se pudo inicializar la Prompt API de Chrome:", err);
      return null;
    }
  }

  async handleUserMessage(message: string, log: LogFn): Promise<void> {
    if (!this.session) return;
    let nextInput = `Mensaje del usuario: "${message}"`;

    for (let step = 0; step < MAX_TOOL_STEPS; step++) {
      const raw = await this.session.prompt(nextInput, { responseConstraint: RESPONSE_SCHEMA });
      const turn = parseAgentTurn(raw);
      if (!turn) {
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

  destroy(): void {
    this.session?.destroy();
    this.session = null;
  }
}
