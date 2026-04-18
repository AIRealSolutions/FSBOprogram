import type { PricingSelection } from '@/lib/pricing';

const KEY = 'fsbo_pricing_selection_v1';

export function savePricingSelection(selection: PricingSelection) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(selection));
  } catch {
    // ignore storage failures
  }
}

export function loadPricingSelection(): PricingSelection | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PricingSelection;
  } catch {
    return null;
  }
}

export function clearPricingSelection() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

