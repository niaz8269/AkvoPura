/**
 * Pricing API.
 */

import { apiRequest } from './client';

export type ApiPricing = {
  id: string;
  scope: string;
  pet600Price: number;
  pet1500Price: number;
  canPrice: number;
  gallonPrice: number;
  lostCanFee: number;
  lostGallonFee: number;
  updatedAt: string;
  updatedBy: string | null;
};

export function getPricing() {
  return apiRequest<ApiPricing>('/pricing');
}

export type UpdatePricingInput = Partial<{
  pet600Price: number;
  pet1500Price: number;
  canPrice: number;
  gallonPrice: number;
  lostCanFee: number;
  lostGallonFee: number;
}>;

export function updatePricing(input: UpdatePricingInput) {
  return apiRequest<ApiPricing>('/pricing', { method: 'PATCH', body: input });
}
