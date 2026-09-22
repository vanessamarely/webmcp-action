import type { ProductDef } from "../products";
import type { Finish, FocusTarget, ProductConfig } from "../state";
import { FOCUS_LABELS } from "../scene";

const FINISH_LABEL: Record<Finish, string> = { matte: "Mate", glossy: "Brillante", metallic: "Metálico" };

interface Props {
  product: ProductDef;
  focusTargets: FocusTarget[];
  config: ProductConfig;
  onColor: (hex: string) => void;
  onFinish: (finish: Finish) => void;
  onFocus: (target: FocusTarget) => void;
  onAddToCart: () => void;
}

export default function ManualControls({
  product,
  focusTargets,
  config,
  onColor,
  onFinish,
  onFocus,
  onAddToCart,
}: Props): JSX.Element {
  return (
    <div className="manual-tools">
      <div className="control-row">
        <span className="row-label">Personalizar</span>
        <input type="color" value={config.colorHex} onChange={(e) => onColor(e.target.value)} title="Color" />
        {(Object.keys(FINISH_LABEL) as Finish[]).map((finish) => (
          <button
            key={finish}
            className={config.finish === finish ? "active" : undefined}
            onClick={() => onFinish(finish)}
          >
            {FINISH_LABEL[finish]}
          </button>
        ))}
      </div>
      <div className="control-row">
        <span className="row-label">Vista</span>
        {focusTargets.map((target) => (
          <button key={target} onClick={() => onFocus(target)}>
            {FOCUS_LABELS[target]}
          </button>
        ))}
      </div>
      <div className="manual-cart-row">
        <button onClick={onAddToCart}>Añadir {product.name} al carrito</button>
      </div>
    </div>
  );
}
