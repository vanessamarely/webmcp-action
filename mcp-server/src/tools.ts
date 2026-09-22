import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { PRODUCTS, findProduct, placeOrder } from "./store.js";

function ok(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

function fail(text: string) {
  return { content: [{ type: "text" as const, text }], isError: true };
}

/**
 * Tools "clásicas" de MCP, expuestas por un servidor separado (proceso
 * distinto, protocolo por stdio) en vez de vivir en la página como las
 * tools de WebMCP en web/.
 */
export function registerStoreTools(server: McpServer): void {
  server.registerTool(
    "list_products",
    {
      title: "Listar productos",
      description: "Lista todos los productos de la tienda con su precio y stock actual.",
      inputSchema: {},
    },
    async () => {
      const lines = PRODUCTS.map(
        (p) => `${p.id}: ${p.name} — $${p.price} (${p.stock} en stock). ${p.description}`
      );
      return ok(lines.join("\n"));
    }
  );

  server.registerTool(
    "get_stock",
    {
      title: "Consultar stock",
      description: "Devuelve las unidades disponibles de un producto.",
      inputSchema: { product_id: z.string().describe("Id del producto, ej. 'auriculares'") },
    },
    async ({ product_id }) => {
      const product = findProduct(product_id);
      if (!product) return fail(`No existe el producto "${product_id}".`);
      return ok(`${product.name}: ${product.stock} unidades en stock.`);
    }
  );

  server.registerTool(
    "get_price",
    {
      title: "Consultar precio",
      description: "Devuelve el precio de un producto.",
      inputSchema: { product_id: z.string().describe("Id del producto, ej. 'auriculares'") },
    },
    async ({ product_id }) => {
      const product = findProduct(product_id);
      if (!product) return fail(`No existe el producto "${product_id}".`);
      return ok(`${product.name}: $${product.price}.`);
    }
  );

  server.registerTool(
    "place_order",
    {
      title: "Realizar pedido",
      description: "Crea un pedido de un producto y descuenta el stock del inventario real.",
      inputSchema: {
        product_id: z.string().describe("Id del producto, ej. 'auriculares'"),
        quantity: z.number().int().positive().default(1).describe("Cantidad a pedir"),
      },
    },
    async ({ product_id, quantity }) => {
      const result = placeOrder(product_id, quantity ?? 1);
      if ("error" in result) return fail(result.error);
      return ok(`Pedido ${result.id} confirmado: ${result.quantity}x ${product_id} — total $${result.total}.`);
    }
  );
}
