import { PRODUCTS } from "../products";
import ProductCard from "../components/ProductCard";

export default function CatalogPage(): JSX.Element {
  return (
    <main className="catalog-view">
      <div className="catalog-head">
        <span className="eyebrow">Demo interactiva</span>
        <h1>Tienda demo de WebMCP</h1>
        <p>
          Cada producto registra sus propias tools con <code>document.modelContext.registerTool()</code> al
          abrirse. La tienda entera también expone tools de navegación (buscar, abrir producto, ver carrito,
          pagar) — pruébalo escribiéndole al agente en cualquier vista.
        </p>
      </div>
      <div className="catalog-grid">
        {PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
