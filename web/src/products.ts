export type ProductKind = "headphones" | "smartwatch" | "backpack" | "lamp";

export interface ProductDef {
  id: string;
  kind: ProductKind;
  name: string;
  tagline: string;
  basePrice: number;
  defaultColor: string;
  /** Color de marca plano (chrome de UI, fondo de escena) — independiente del color 3D, que el usuario puede cambiar. */
  accent: string;
  engravable: boolean;
  stock: number;
}

export const PRODUCTS: ProductDef[] = [
  {
    id: "auriculares",
    kind: "headphones",
    name: "Auriculares Orbit",
    tagline: "Cancelación de ruido, diadema personalizable",
    basePrice: 129,
    defaultColor: "#6ea8fe",
    accent: "#8b7bf0",
    engravable: true,
    stock: 42,
  },
  {
    id: "smartwatch",
    kind: "smartwatch",
    name: "Reloj Pulse",
    tagline: "Smartwatch con correa intercambiable",
    basePrice: 199,
    defaultColor: "#f2c94c",
    accent: "#f5d938",
    engravable: false,
    stock: 17,
  },
  {
    id: "mochila",
    kind: "backpack",
    name: "Mochila Trail",
    tagline: "Mochila urbana resistente al agua",
    basePrice: 89,
    defaultColor: "#7ee787",
    accent: "#79e0a0",
    engravable: false,
    stock: 30,
  },
  {
    id: "lampara",
    kind: "lamp",
    name: "Lámpara Studio",
    tagline: "Lámpara de escritorio con brazo articulado",
    basePrice: 59,
    defaultColor: "#ff8484",
    accent: "#f2705a",
    engravable: false,
    stock: 55,
  },
];

export function getProduct(id: string): ProductDef | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
