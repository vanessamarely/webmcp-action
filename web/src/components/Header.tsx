import { useNavigate } from "react-router-dom";
import { CartIcon } from "../icons";
import { useStoreVersion } from "../hooks/useStoreVersion";
import { getCart, cartTotal } from "../state";

export default function Header(): JSX.Element {
  const navigate = useNavigate();
  useStoreVersion();
  const count = getCart().length;
  const total = cartTotal();

  return (
    <header>
      <button className="brand" onClick={() => navigate("/")}>
        <div className="brand-mark">W</div>
        <div className="brand-word">
          webmcp<span>.store</span>
        </div>
      </button>
      <nav>
        <button className="nav-link" onClick={() => navigate("/")}>
          Catálogo
        </button>
        <div className="cart-indicator">
          <CartIcon />
          <span>
            {count} · ${total}
          </span>
        </div>
      </nav>
    </header>
  );
}
