import { useEffect, useRef } from "react";
import { ProductScene } from "../scene";
import { getProduct } from "../products";
import { getConfig } from "../state";
import { tint } from "../color-utils";

export default function HeroViewport({ productId }: { productId: string }): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const product = getProduct(productId);
    if (!product) return;

    const scene = new ProductScene(containerRef.current);
    const config = getConfig(productId);
    scene.loadProduct(product.kind, config.colorHex);
    scene.setBackground(tint(product.accent, 0.9));
    scene.setFinish(config.finish);
    scene.setAutoRotate(true, 2.2);

    return () => scene.dispose();
  }, [productId]);

  return <div className="hero-viewport-canvas" ref={containerRef} />;
}
