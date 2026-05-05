/**
 * PricingProvider — owner-editable default prices for every product.
 *
 * Each product has a "default" price set here. Per-customer overrides still
 * exist (CG customer.pricePerCan / pricePerGallon, Pets customer.pricePet600
 * / pricePet1500) and take precedence at bill time.
 *
 * Stored in memory for now — swapped for a real settings table when the
 * backend ships.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

export type ProductPriceKey = 'pet600' | 'pet1500' | 'can' | 'gallon';

export type ProductPrices = Record<ProductPriceKey, number>;

/** Per-unit charge applied when a customer reports a can/gallon lost or
 *  damaged. Editable by the Owner. */
export type ContainerFees = {
  lostCanFee: number;
  lostGallonFee: number;
};

const DEFAULT_PRICES: ProductPrices = {
  pet600: 280,
  pet1500: 320,
  can: 280,
  gallon: 200,
};

const DEFAULT_FEES: ContainerFees = {
  lostCanFee: 600,    // replacement cost of a 14L can
  lostGallonFee: 900, // replacement cost of a 19L gallon
};

export const PRODUCT_LABELS: Record<ProductPriceKey, { en: string; ur: string; description: string }> = {
  pet600: { en: '600 ml pack', ur: '۶۰۰ ملی پیک', description: 'Disposable pack of 12 × 600ml bottles' },
  pet1500: { en: '1.5 L pack', ur: '۱.۵ لیٹر پیک', description: 'Disposable pack of 6 × 1.5L bottles' },
  can: { en: '14 L can', ur: '۱۴ لیٹر کین', description: 'Reusable 14-litre can' },
  gallon: { en: '19 L gallon', ur: '۱۹ لیٹر گیلن', description: 'Reusable 19-litre gallon' },
};

export const FEE_LABELS = {
  lostCanFee: {
    en: 'Lost / damaged 14L can',
    ur: 'گم/خراب کین',
    description: 'Charged when a customer cannot return a can',
  },
  lostGallonFee: {
    en: 'Lost / damaged 19L gallon',
    ur: 'گم/خراب گیلن',
    description: 'Charged when a customer cannot return a gallon',
  },
};

type State = {
  prices: ProductPrices;
  fees: ContainerFees;
  setPrice: (key: ProductPriceKey, value: number) => void;
  setFee: (key: keyof ContainerFees, value: number) => void;
  resetPrices: () => void;
};

const Ctx = createContext<State | undefined>(undefined);

export function PricingProvider({ children }: PropsWithChildren) {
  const [prices, setPrices] = useState<ProductPrices>(DEFAULT_PRICES);
  const [fees, setFees] = useState<ContainerFees>(DEFAULT_FEES);

  const setPrice = useCallback<State['setPrice']>((key, value) => {
    setPrices((prev) => ({ ...prev, [key]: Math.max(0, value) }));
  }, []);

  const setFee = useCallback<State['setFee']>((key, value) => {
    setFees((prev) => ({ ...prev, [key]: Math.max(0, value) }));
  }, []);

  const resetPrices = useCallback(() => {
    setPrices(DEFAULT_PRICES);
    setFees(DEFAULT_FEES);
  }, []);

  const value = useMemo<State>(
    () => ({ prices, fees, setPrice, setFee, resetPrices }),
    [prices, fees, setPrice, setFee, resetPrices]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePricing(): State {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePricing must be used inside <PricingProvider>');
  return ctx;
}
