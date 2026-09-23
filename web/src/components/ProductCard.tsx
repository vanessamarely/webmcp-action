import { useNavigate } from "react-router-dom";
import type { ProductDef } from "../products";
import { PRODUCT_ICONS } from "../icons";

export default function ProductCard({ product }: { product: ProductDef }): JSX.Element {
  const navigate = useNavigate();
  const Icon = PRODUCT_ICONS[product.kind];

  return (
    <button className="product-card" onClick={() => navigate(`/product/${product.id}`)}>
      <div className={`product-thumb product-thumb-${product.kind}`} style={{ "--thumb-accent": product.accent, "--thumb-color": product.defaultColor } as React.CSSProperties}>
        <div className="thumb-stage">
          {product.kind === "headphones" && (
            <div className="mini-product mini-headphones" aria-hidden="true">
              <span className="headband" />
              <span className="cup left" />
              <span className="cup right" />
              <span className="pad left" />
              <span className="pad right" />
            </div>
          )}
          {product.kind === "smartwatch" && (
            <div className="mini-product mini-watch" aria-hidden="true">
              <span className="strap top" />
              <span className="case" />
              <span className="screen" />
              <span className="strap bottom" />
            </div>
          )}
          {product.kind === "backpack" && (
            <div className="mini-product mini-backpack" aria-hidden="true">
              <span className="handle" />
              <span className="body" />
              <span className="pocket" />
              <span className="zip" />
            </div>
          )}
          {product.kind === "lamp" && (
            <div className="mini-product mini-lamp" aria-hidden="true">
              <span className="shade" />
              <span className="neck" />
              <span className="base" />
              <span className="glow" />
            </div>
          )}
        </div>
        <div className="icon-badge">
          <Icon />
        </div>
      </div>
      <div className="card-top-row">
        <h3>{product.name}</h3>
        <span className="stock">{product.stock} en stock</span>
      </div>
      <p className="tagline">{product.tagline}</p>
      <div className="card-bottom-row">
        <span className="price">${product.basePrice}</span>
        <span className="cta">Ver detalle</span>
      </div>
    </button>
  );
}
