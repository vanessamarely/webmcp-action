export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  description: string;
}

/**
 * Mismo catálogo temático que la tienda web/ (auriculares, smartwatch,
 * mochila, lámpara), pero como un backend real e independiente — este es
 * el inventario "de verdad" detrás de un servidor MCP, en contraste con
 * las tools client-side de WebMCP que viven en la página.
 */
export const PRODUCTS: Product[] = [
  { id: "auriculares", name: "Auriculares Orbit", price: 129, stock: 42, description: "Cancelación de ruido, diadema personalizable." },
  { id: "smartwatch", name: "Reloj Pulse", price: 199, stock: 17, description: "Smartwatch con correa intercambiable." },
  { id: "mochila", name: "Mochila Trail", price: 89, stock: 30, description: "Mochila urbana resistente al agua." },
  { id: "lampara", name: "Lámpara Studio", price: 59, stock: 55, description: "Lámpara de escritorio con brazo articulado." },
];

export function findProduct(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export interface Order {
  id: string;
  productId: string;
  quantity: number;
  total: number;
  createdAt: string;
}

const orders: Order[] = [];
let orderSeq = 1;

export function placeOrder(productId: string, quantity: number): Order | { error: string } {
  const product = findProduct(productId);
  if (!product) return { error: `No existe el producto "${productId}".` };
  if (quantity < 1) return { error: "La cantidad debe ser al menos 1." };
  if (product.stock < quantity) return { error: `Stock insuficiente: quedan ${product.stock} de "${product.name}".` };

  product.stock -= quantity;
  const order: Order = {
    id: `ORD-${orderSeq++}`,
    productId,
    quantity,
    total: product.price * quantity,
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  return order;
}

export function listOrders(): Order[] {
  return orders;
}
