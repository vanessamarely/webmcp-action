import { GoogleGenAI, type Content, type FunctionDeclaration } from "@google/genai";
import type { LLMProvider, ToolExecutor, ToolSpec } from "./types.js";

const MODEL = process.env.GEMINI_MODEL || "gemini-flash-latest";
const MAX_STEPS = 6;

export class GeminiProvider implements LLMProvider {
  readonly name = "Gemini";
  private ai: GoogleGenAI;
  private history: Content[] = [];

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async run(userMessage: string, tools: ToolSpec[], executeTool: ToolExecutor): Promise<string> {
    this.history.push({ role: "user", parts: [{ text: userMessage }] });

    const functionDeclarations: FunctionDeclaration[] = tools.map((t) => ({
      name: t.name,
      description: t.description,
      parametersJsonSchema: t.inputSchema,
    }));

    for (let step = 0; step < MAX_STEPS; step++) {
      const response = await this.ai.models.generateContent({
        model: MODEL,
        contents: this.history,
        config: { tools: [{ functionDeclarations }] },
      });

      const calls = response.functionCalls ?? [];
      if (calls.length === 0) {
        const text = response.text ?? "";
        this.history.push({ role: "model", parts: [{ text }] });
        return text;
      }

      this.history.push({
        role: "model",
        parts: calls.map((c) => ({ functionCall: { name: c.name!, args: c.args ?? {} } })),
      });

      const responseParts = [];
      for (const call of calls) {
        const text = await executeTool(call.name!, (call.args as Record<string, unknown>) ?? {});
        responseParts.push({ functionResponse: { name: call.name!, response: { result: text } } });
      }
      this.history.push({ role: "user", parts: responseParts });
    }

    return "Se alcanzó el límite de pasos del agente sin obtener una respuesta final.";
  }
}
