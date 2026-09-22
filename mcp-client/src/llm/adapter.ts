import type { LLMProvider } from "./types.js";
import { ClaudeProvider } from "./claude.js";
import { GeminiProvider } from "./gemini.js";

export function createLLMProvider(): LLMProvider {
  const provider = (process.env.LLM_PROVIDER ?? "claude").toLowerCase();

  if (provider === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("Falta GEMINI_API_KEY en .env (LLM_PROVIDER=gemini).");
    return new GeminiProvider(apiKey);
  }

  if (provider === "claude") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("Falta ANTHROPIC_API_KEY en .env (LLM_PROVIDER=claude).");
    return new ClaudeProvider(apiKey);
  }

  throw new Error(`LLM_PROVIDER desconocido: "${provider}". Usa "claude" o "gemini".`);
}
