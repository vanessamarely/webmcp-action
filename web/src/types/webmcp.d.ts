// Tipos mínimos para dos APIs todavía no incluidas en lib.dom.d.ts:
// WebMCP (https://github.com/webmachinelearning/webmcp) y la Prompt API
// on-device de Chrome (https://developer.chrome.com/docs/ai/prompt-api).

export interface WebMcpToolResultContent {
  type: "text";
  text: string;
}

export interface WebMcpToolResult {
  content: WebMcpToolResultContent[];
  isError?: boolean;
}

export interface WebMcpToolDefinition<Args = any> {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute(args: Args, options?: { signal?: AbortSignal }): Promise<WebMcpToolResult> | WebMcpToolResult;
}

export interface WebMcpRegisteredTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  origin: string;
  window: Window;
}

export interface ModelContext extends EventTarget {
  registerTool(
    tool: WebMcpToolDefinition,
    options?: { signal?: AbortSignal; exposedTo?: string[] }
  ): Promise<void>;
  getTools(options?: { fromOrigins?: string[] }): Promise<WebMcpRegisteredTool[]>;
  executeTool(
    tool: WebMcpRegisteredTool | string,
    args: Record<string, unknown>,
    options?: { signal?: AbortSignal }
  ): Promise<WebMcpToolResult>;
}

export interface LanguageModelSession {
  prompt(
    input: string,
    options?: { responseConstraint?: Record<string, unknown> }
  ): Promise<string>;
  destroy(): void;
}

export interface LanguageModelStatic {
  availability(): Promise<"unavailable" | "downloadable" | "downloading" | "available">;
  create(options?: {
    initialPrompts?: { role: "system" | "user" | "assistant"; content: string }[];
    temperature?: number;
    topK?: number;
  }): Promise<LanguageModelSession>;
}

declare global {
  interface Document {
    modelContext: ModelContext;
  }
  // eslint-disable-next-line no-var
  var LanguageModel: LanguageModelStatic | undefined;
}
