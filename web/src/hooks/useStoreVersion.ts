import { useSyncExternalStore } from "react";
import { getVersion, onStateChange } from "../state";

/**
 * Puente entre el store externo (state.ts, un simple pub/sub) y React.
 * El snapshot es un número (la versión), así que Object.is siempre
 * funciona correctamente: cuando cambia, los componentes que lo usan
 * se re-renderizan y pueden leer los getters de state.ts directamente.
 */
export function useStoreVersion(): number {
  return useSyncExternalStore(onStateChange, getVersion);
}
