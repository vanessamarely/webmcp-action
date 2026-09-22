import { useNavigate } from "react-router-dom";
import type { ProductDef } from "../products";
import { PRODUCT_ICONS } from "../icons";
import { tint } from "../color-utils";

export default function ProductCard({ product }: { product: ProductDef }): JSX.Element {
  const navigate = useNavigate();
  const Icon = PRODUCT_ICONS[product.kind];

  return (
    <button className="product-card" onClick={() => navigate(`/product/${product.id}`)}>
      <div className="swatch" style={{ background: tint(product.accent, 0.55) }}>
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
        <span className="cta">Ver detalle →</span>
      </div>
    </button>
  );
}
