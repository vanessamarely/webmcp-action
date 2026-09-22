import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { ToolSpec } from "./llm/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MCP_SERVER_DIR = path.resolve(__dirname, "../../mcp-server");
const TSX_BIN = path.join(MCP_SERVER_DIR, "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx");

/**
 * Envoltura sobre el Client oficial del SDK de MCP: levanta mcp-server
 * como subproceso (stdio) y expone listTools/callTool con tipos simples,
 * para que los adaptadores de LLM no tengan que conocer el SDK de MCP.
 */
export class McpStoreClient {
  private client = new Client({ name: "webmcp-store-client", version: "0.1.0" });

  async connect(): Promise<void> {
    const transport = new StdioClientTransport({
      command: TSX_BIN,
      args: ["src/index.ts"],
      cwd: MCP_SERVER_DIR,
    });
    await this.client.connect(transport);
  }

  async listTools(): Promise<ToolSpec[]> {
    const { tools } = await this.client.listTools();
    return tools.map((t) => ({
      name: t.name,
      description: t.description ?? "",
      inputSchema: (t.inputSchema as Record<string, unknown>) ?? { type: "object", properties: {} },
    }));
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<string> {
    const result = await this.client.callTool({ name, arguments: args });
    const content = (result.content as Array<{ type: string; text?: string }>) ?? [];
    const text = content
      .filter((c) => c.type === "text")
      .map((c) => c.text)
      .join(" ");
    return result.isError ? `[error] ${text}` : text;
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}
