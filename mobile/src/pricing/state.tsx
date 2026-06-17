/**
 * PricingProvider — owner-editable default prices for every product,
 * plus container fees. Backed by the real /pricing endpoint as of B-7.
 *
 * Boots from baked-in defaults so the app is usable immediately and
 * works offline; fetches the latest values from the server on mount and
 * after the user logs in. Owner edits are persisted via PATCH /pricing.
 *
 * The exposed shape (`prices`, `fees`, `setPrice`, `setFee`,
 * `resetPrices`) is unchanged so existing screens (Owner Settings,
 * Manager Container Fees, Pets bills) keep working without edits.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import { ApiError } from '../api/client';
import { getPricing, updatePricing } from '../api/pricing';
import { useAuth } from '../auth/AuthContext';

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
  lostCanFee: 600,
  lostGallonFee: 900,
};

export const PRODUCT_LABELS: Record<ProductPriceKey, { en: string; description: string }> = {
  pet600: { en: '600 ml pack', description: 'Disposable pack of 12 × 600ml bottles' },
  pet1500: { en: '1.5 L pack', description: 'Disposable pack of 6 × 1.5L bottles' },
  can: { en: '14 L can', description: 'Reusable 14-litre can' },
  gallon: { en: '19 L gallon', description: 'Reusable 19-litre gallon' },
};

export const FEE_LABELS = {
  lostCanFee: {
    en: 'Lost / damaged 14L can',
    description: 'Charged when a customer cannot return a can',
  },
  lostGallonFee: {
    en: 'Lost / damaged 19L gallon',
    description: 'Charged when a customer cannot return a gallon',
  },
};

type State = {
  prices: ProductPrices;
  fees: ContainerFees;
  /** True while the initial fetch from /pricing is in flight. */
  loading: boolean;
  /** Last error from a server interaction (fetch or update). */
  error: string | null;
  setPrice: (key: ProductPriceKey, value: number) => void;
  setFee: (key: keyof ContainerFees, value: number) => void;
  resetPrices: () => void;
  /** Force a fresh fetch from the server. */
  refresh: () => Promise<void>;
};

const Ctx = createContext<State | undefined>(undefined);

const PRICE_KEY_TO_API: Record<ProductPriceKey, keyof ApiShape> = {
  pet600: 'pet600Price',
  pet1500: 'pet1500Price',
  can: 'canPrice',
  gallon: 'gallonPrice',
};

const FEE_KEY_TO_API: Record<keyof ContainerFees, keyof ApiShape> = {
  lostCanFee: 'lostCanFee',
  lostGallonFee: 'lostGallonFee',
};

type ApiShape = {
  pet600Price: number;
  pet1500Price: number;
  canPrice: number;
  gallonPrice: number;
  lostCanFee: number;
  lostGallonFee: number;
};

export function PricingProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [prices, setPrices] = useState<ProductPrices>(DEFAULT_PRICES);
  const [fees, setFees] = useState<ContainerFees>(DEFAULT_FEES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fresh = await getPricing();
      setPrices({
        pet600: fresh.pet600Price,
        pet1500: fresh.pet1500Price,
        can: fresh.canPrice,
        gallon: fresh.gallonPrice,
      });
      setFees({
        lostCanFee: fresh.lostCanFee,
        lostGallonFee: fresh.lostGallonFee,
      });
    } catch (e: unknown) {
      const msg =
        e instanceof ApiError && e.code === 'network_error'
          ? 'Offline — using last-known prices'
          : e instanceof ApiError
            ? e.message
            : 'Unknown error';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch whenever the logged-in user changes (login / logout / restore).
  useEffect(() => {
    if (user) {
      refresh();
    }
  }, [user, refresh]);

  const setPrice = useCallback<State['setPrice']>(
    (key, value) => {
      const safe = Math.max(0, Math.floor(value));
      setPrices((prev) => ({ ...prev, [key]: safe }));
      // Fire-and-forget server update; surface failure via `error`.
      updatePricing({ [PRICE_KEY_TO_API[key]]: safe }).catch((e: unknown) => {
        const msg = e instanceof ApiError ? e.message || e.code : 'Save failed';
        setError(msg);
      });
    },
    [],
  );

  const setFee = useCallback<State['setFee']>(
    (key, value) => {
      const safe = Math.max(0, Math.floor(value));
      setFees((prev) => ({ ...prev, [key]: safe }));
      updatePricing({ [FEE_KEY_TO_API[key]]: safe }).catch((e: unknown) => {
        const msg = e instanceof ApiError ? e.message || e.code : 'Save failed';
        setError(msg);
      });
    },
    [],
  );

  const resetPrices = useCallback(() => {
    setPrices(DEFAULT_PRICES);
    setFees(DEFAULT_FEES);
    updatePricing({
      pet600Price: DEFAULT_PRICES.pet600,
      pet1500Price: DEFAULT_PRICES.pet1500,
      canPrice: DEFAULT_PRICES.can,
      gallonPrice: DEFAULT_PRICES.gallon,
      lostCanFee: DEFAULT_FEES.lostCanFee,
      lostGallonFee: DEFAULT_FEES.lostGallonFee,
    }).catch((e: unknown) => {
      const msg = e instanceof ApiError ? e.message || e.code : 'Reset failed';
      setError(msg);
    });
  }, []);

  const value = useMemo<State>(
    () => ({ prices, fees, loading, error, setPrice, setFee, resetPrices, refresh }),
    [prices, fees, loading, error, setPrice, setFee, resetPrices, refresh],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePricing(): State {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePricing must be used inside <PricingProvider>');
  return ctx;
}
