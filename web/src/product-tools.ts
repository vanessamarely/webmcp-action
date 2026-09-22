import type { ProductScene } from "./scene";
import { FOCUS_TARGETS_BY_KIND as FOCUS_TARGETS } from "./scene";
import type { ProductDef } from "./products";
import { priceFor, updateConfig, addToCart } from "./state";
import type { WebMcpToolResult } from "./types/webmcp";

function ok(text: string): WebMcpToolResult {
  return { content: [{ type: "text", text }] };
}

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

/**
 * Registra las tools específicas del producto que se está viendo (PDP).
 * Se llama al entrar a la vista de un producto y se desregistran (via
 * AbortController) al salir — así el conjunto de tools disponibles cambia
 * dinámicamente con la navegación, tal como lo prevé el spec de WebMCP.
 */
export async function registerProductTools(product: ProductDef, scene: ProductScene): Promise<AbortController> {
  const controller = new AbortController();
  const { signal } = controller;
  const focusTargets = FOCUS_TARGETS[product.kind];

  await document.modelContext.registerTool(
    {
      name: "change_color",
      description: `Cambia el color de "${product.name}".`,
      inputSchema: {
        type: "object",
        properties: { hex: { type: "string", description: "Color en hexadecimal, ej. #6ea8fe" } },
        required: ["hex"],
      },
      execute({ hex }: { hex: string }) {
        if (!HEX_RE.test(hex)) {
          return { content: [{ type: "text", text: `"${hex}" no es un color hex válido.` }], isError: true };
        }
        const normalized = hex.startsWith("#") ? hex : `#${hex}`;
        scene.setColor(normalized);
        updateConfig(product.id, { colorHex: normalized });
        return ok(`Color de ${product.name} cambiado a ${normalized}.`);
      },
    },
    { signal }
  );

  await document.modelContext.registerTool(
    {
      name: "change_finish",
      description: `Cambia el acabado de la superficie de "${product.name}".`,
      inputSchema: {
        type: "object",
        properties: { finish: { type: "string", enum: ["matte", "glossy", "metallic"] } },
        required: ["finish"],
      },
      execute({ finish }: { finish: "matte" | "glossy" | "metallic" }) {
        scene.setFinish(finish);
        updateConfig(product.id, { finish });
        return ok(`Acabado cambiado a ${finish}. Nuevo precio: $${priceFor(product.id)}.`);
      },
    },
    { signal }
  );

  await document.modelContext.registerTool(
    {
      name: "focus_view",
      description: `Mueve la cámara para enfocar una parte de "${product.name}". Opciones: ${focusTargets.join(", ")}.`,
      inputSchema: {
        type: "object",
        properties: { part: { type: "string", enum: focusTargets } },
        required: ["part"],
      },
      execute({ part }: { part: string }) {
        scene.focusOn(part as any);
        return ok(`Cámara enfocando: ${part}.`);
      },
    },
    { signal }
  );

  await document.modelContext.registerTool(
    {
      name: "get_price",
      description: `Devuelve el precio actual de "${product.name}" según la configuración elegida.`,
      inputSchema: { type: "object", properties: {} },
      execute() {
        return ok(`Precio actual: $${priceFor(product.id)}.`);
      },
    },
    { signal }
  );

  await document.modelContext.registerTool(
    {
      name: "add_to_cart",
      description: `Añade "${product.name}", con la configuración actual, al carrito.`,
      inputSchema: { type: "object", properties: {} },
      execute() {
        const item = addToCart(product.id);
        return ok(`Añadido al carrito: ${item.name} (${item.colorHex}, ${item.finish}) — $${item.price}.`);
      },
    },
    { signal }
  );

  if (product.engravable) {
    await document.modelContext.registerTool(
      {
        name: "engrave_text",
        description: `Graba un texto corto (hasta 14 caracteres) en "${product.name}".`,
        inputSchema: {
          type: "object",
          properties: { text: { type: "string" } },
          required: ["text"],
        },
        execute({ text }: { text: string }) {
          scene.setEngraving(text);
          updateConfig(product.id, { engraving: text });
          return ok(`Grabado "${text.slice(0, 14).toUpperCase()}" en ${product.name}.`);
        },
      },
      { signal }
    );
  }

  return controller;
}
