import type { SVGProps } from "react";
import type { ProductKind } from "./products";

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps): JSX.Element {
  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function CartIcon(props: IconProps): JSX.Element {
  return (
    <Base {...props}>
      <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <path d="M2.5 3h2.2l2.1 11.4a2 2 0 0 0 2 1.6h8.4a2 2 0 0 0 2-1.6L21 7.5H6" />
    </Base>
  );
}

export function HeadphonesIcon(props: IconProps): JSX.Element {
  return (
    <Base {...props}>
      <path d="M4 13.5V12a8 8 0 0 1 16 0v1.5" />
      <rect x="2.5" y="13" width="4" height="6" rx="1.6" />
      <rect x="17.5" y="13" width="4" height="6" rx="1.6" />
    </Base>
  );
}

export function SmartwatchIcon(props: IconProps): JSX.Element {
  return (
    <Base {...props}>
      <rect x="7" y="7.5" width="10" height="9" rx="2.2" />
      <path d="M9.5 7.5V3.8h5V7.5M9.5 16.5v3.7h5v-3.7" />
    </Base>
  );
}

export function BackpackIcon(props: IconProps): JSX.Element {
  return (
    <Base {...props}>
      <rect x="5" y="8" width="14" height="13" rx="2.4" />
      <path d="M8.5 8V6a3.5 3.5 0 0 1 7 0v2" />
      <rect x="8.5" y="12" width="7" height="4.5" rx="1" />
    </Base>
  );
}

export function LampIcon(props: IconProps): JSX.Element {
  return (
    <Base {...props}>
      <path d="M9 3h6l-1.6 5.5H10.6z" />
      <path d="M12 8.5v6" />
      <path d="M6.5 20.5h11" />
      <path d="M8 20.5c0-2.2 1.8-4 4-4s4 1.8 4 4" />
    </Base>
  );
}

export function CheckIcon(props: IconProps): JSX.Element {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.3 2.3L15.8 9.7" />
    </Base>
  );
}

export function AlertIcon(props: IconProps): JSX.Element {
  return (
    <Base {...props}>
      <path d="M12 3.5 21.5 20h-19Z" />
      <path d="M12 9.5v4.2" />
      <circle cx="12" cy="17" r="0.15" fill="currentColor" />
    </Base>
  );
}

export function SendIcon(props: IconProps): JSX.Element {
  return (
    <Base {...props}>
      <path d="m3 11 18-7-7 18-2.5-7.5L3 11Z" />
    </Base>
  );
}

export const PRODUCT_ICONS: Record<ProductKind, (props: IconProps) => JSX.Element> = {
  headphones: HeadphonesIcon,
  smartwatch: SmartwatchIcon,
  backpack: BackpackIcon,
  lamp: LampIcon,
};
