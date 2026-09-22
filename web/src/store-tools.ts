import { PRODUCTS, getProduct } from "./products";
import { getCart, cartTotal, checkoutCart } from "./state";
import type { WebMcpToolResult } from "./types/webmcp";

function ok(text: string): WebMcpToolResult {
  return { content: [{ type: "text", text }] };
}

/**
 * Tools a nivel tienda: se registran una sola vez al arrancar la app y
 * quedan disponibles en cualquier vista (catálogo o producto). Permiten
 * que el agente navegue el sitio, no solo que configure un producto.
 */
export async function registerStoreTools(navigate: (path: string) => void): Promise<void> {
  await document.modelContext.registerTool({
    name: "search_products",
    description: "Busca productos de la tienda por nombre o descripción.",
    inputSchema: {
      type: "object",
      properties: { query: { type: "string", description: "Texto a buscar, ej. 'auriculares' o 'mochila'" } },
      required: ["query"],
    },
    execute({ query }: { query: string }) {
      const q = query.trim().toLowerCase();
      const matches = PRODUCTS.filter(
        (p) => p.name.toLowerCase().includes(q) || p.tagline.toLowerCase().includes(q)
      );
      const list = (q ? matches : PRODUCTS)
        .map((p) => `${p.id}: ${p.name} — $${p.basePrice} (${p.stock} en stock)`)
        .join("\n");
      return ok(list || "Sin resultados.");
    },
  });

  await document.modelContext.registerTool({
    name: "open_product",
    description: "Abre la página de detalle de un producto por su id.",
    inputSchema: {
      type: "object",
      properties: { product_id: { type: "string", description: "Id del producto, ej. 'auriculares'" } },
      required: ["product_id"],
    },
    execute({ product_id }: { product_id: string }) {
      const product = getProduct(product_id);
      if (!product) {
        return { content: [{ type: "text", text: `No existe el producto "${product_id}".` }], isError: true };
      }
      navigate(`/product/${product_id}`);
      return ok(`Abriendo ${product.name}.`);
    },
  });

  await document.modelContext.registerTool({
    name: "list_cart",
    description: "Lista los productos actualmente en el carrito y el total.",
    inputSchema: { type: "object", properties: {} },
    execute() {
      const cart = getCart();
      if (cart.length === 0) return ok("El carrito está vacío.");
      const lines = cart.map((i) => `- ${i.name} (${i.colorHex}, ${i.finish}) — $${i.price}`);
      return ok(`${lines.join("\n")}\nTotal: $${cartTotal()}`);
    },
  });

  await document.modelContext.registerTool({
    name: "checkout",
    description: "Confirma la compra de todo lo que hay en el carrito.",
    inputSchema: { type: "object", properties: {} },
    execute() {
      const summary = checkoutCart();
      if (summary.itemCount === 0) return ok("No hay nada en el carrito para pagar.");
      return ok(`Compra confirmada: ${summary.itemCount} producto(s) por $${summary.total}.`);
    },
  });
}
