import Anthropic from "@anthropic-ai/sdk";
import type { LLMProvider, ToolExecutor, ToolSpec } from "./types.js";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const MAX_STEPS = 6;

export class ClaudeProvider implements LLMProvider {
  readonly name = "Claude";
  private client: Anthropic;
  private history: Anthropic.MessageParam[] = [];

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async run(userMessage: string, tools: ToolSpec[], executeTool: ToolExecutor): Promise<string> {
    this.history.push({ role: "user", content: userMessage });

    const anthropicTools: Anthropic.Tool[] = tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
    }));

    for (let step = 0; step < MAX_STEPS; step++) {
      const response = await this.client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        tools: anthropicTools,
        messages: this.history,
      });
      this.history.push({ role: "assistant", content: response.content });

      const toolUses = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      );

      if (toolUses.length === 0) {
        return response.content
          .filter((block): block is Anthropic.TextBlock => block.type === "text")
          .map((block) => block.text)
          .join("\n");
      }

      const resultBlocks: Anthropic.ToolResultBlockParam[] = [];
      for (const use of toolUses) {
        const text = await executeTool(use.name, (use.input as Record<string, unknown>) ?? {});
        resultBlocks.push({ type: "tool_result", tool_use_id: use.id, content: text });
      }
      this.history.push({ role: "user", content: resultBlocks });
    }

    return "Se alcanzó el límite de pasos del agente sin obtener una respuesta final.";
  }
}
