import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerStoreTools } from "./tools.js";

const server = new McpServer({ name: "webmcp-store-server", version: "0.1.0" });
registerStoreTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);

console.error("[mcp-server] webmcp-store-server listo, escuchando por stdio.");
