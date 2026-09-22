import { getProduct, type ProductDef } from "./products";

export type Finish = "matte" | "glossy" | "metallic";
export type FocusTarget = "overview" | "left_cup" | "right_cup" | "headband" | "close_up";

export interface ProductConfig {
  colorHex: string;
  finish: Finish;
  engraving: string;
}

export interface CartItem {
  productId: string;
  name: string;
  colorHex: string;
  finish: Finish;
  engraving: string;
  price: number;
}

const FINISH_SURCHARGE: Record<Finish, number> = {
  matte: 0,
  glossy: 10,
  metallic: 25,
};

const configs = new Map<string, ProductConfig>();
const cart: CartItem[] = [];

function defaultConfig(product: ProductDef): ProductConfig {
  return { colorHex: product.defaultColor, finish: "matte", engraving: "" };
}

export function getConfig(productId: string): ProductConfig {
  let config = configs.get(productId);
  if (!config) {
    const product = getProduct(productId);
    config = defaultConfig(product!);
    configs.set(productId, config);
  }
  return config;
}

export function updateConfig(productId: string, patch: Partial<ProductConfig>): ProductConfig {
  const config = getConfig(productId);
  Object.assign(config, patch);
  notify();
  return config;
}

export function priceFor(productId: string): number {
  const product = getProduct(productId)!;
  const config = getConfig(productId);
  return product.basePrice + FINISH_SURCHARGE[config.finish] + (config.engraving ? 5 : 0);
}

export function addToCart(productId: string): CartItem {
  const product = getProduct(productId)!;
  const config = getConfig(productId);
  const item: CartItem = {
    productId,
    name: product.name,
    colorHex: config.colorHex,
    finish: config.finish,
    engraving: config.engraving,
    price: priceFor(productId),
  };
  cart.push(item);
  notify();
  return item;
}

export function getCart(): CartItem[] {
  return cart;
}

export function cartTotal(): number {
  return cart.reduce((sum, item) => sum + item.price, 0);
}

export function checkoutCart(): { itemCount: number; total: number } {
  const summary = { itemCount: cart.length, total: cartTotal() };
  cart.length = 0;
  notify();
  return summary;
}

type Listener = () => void;
const listeners = new Set<Listener>();
export function onStateChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let version = 0;
export function getVersion(): number {
  return version;
}
function notify(): void {
  version++;
  for (const listener of listeners) listener();
}
