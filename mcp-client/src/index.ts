import "dotenv/config";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { McpStoreClient } from "./mcpClient.js";
import { createLLMProvider } from "./llm/adapter.js";

async function main(): Promise<void> {
  const provider = createLLMProvider();

  const mcp = new McpStoreClient();
  console.log("[mcp-client] conectando a mcp-server por stdio…");
  await mcp.connect();

  const tools = await mcp.listTools();
  console.log(`[mcp-client] servidor conectado. Tools disponibles: ${tools.map((t) => t.name).join(", ")}`);
  console.log(`[mcp-client] proveedor de LLM: ${provider.name}\n`);

  const rl = readline.createInterface({ input: stdin, output: stdout });
  console.log('Escribe en lenguaje natural (ej. "¿cuántos auriculares hay en stock?"). Ctrl+C para salir.\n');

  try {
    while (true) {
      const message = await rl.question("> ");
      if (!message.trim()) continue;

      const reply = await provider.run(message, tools, (name, args) => {
        console.log(`  → tool call: ${name}(${JSON.stringify(args)})`);
        return mcp.callTool(name, args);
      });
      console.log(`${provider.name}: ${reply}\n`);
    }
  } finally {
    rl.close();
    await mcp.close();
  }
}

main().catch((err) => {
  console.error("[mcp-client] error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
