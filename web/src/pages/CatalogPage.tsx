import { useNavigate } from "react-router-dom";
import { PRODUCTS, getProduct } from "../products";
import ProductCard from "../components/ProductCard";
import HeroViewport from "../components/HeroViewport";

const FEATURED_ID = "auriculares";

export default function CatalogPage(): JSX.Element {
  const navigate = useNavigate();
  const featured = getProduct(FEATURED_ID)!;

  return (
    <main className="catalog-view">
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Demo interactiva</span>
          <h1 className="hero-title">
            Tu catálogo,
            <br />
            en 3D y controlado por IA.
          </h1>
          <p className="hero-sub">
            Cada producto registra sus propias tools con <code>document.modelContext.registerTool()</code>.
            Un agente puede girarlo, cambiarle el color o añadirlo al carrito — pruébalo escribiéndole
            en cualquier vista.
          </p>
          <button className="hero-cta" onClick={() => navigate(`/product/${FEATURED_ID}`)}>
            Explorar {featured.name}
          </button>
        </div>

        <div className="hero-viewport">
          <HeroViewport productId={FEATURED_ID} />
          <span className="hero-hint">Arrastra para girar</span>
        </div>
      </section>

      <div className="catalog-grid">
        {PRODUCTS.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  );
}
