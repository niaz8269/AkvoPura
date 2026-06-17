/**
 * Initial raw material stock + a few historical production batches so the
 * Manager Production screen has something to show on first load.
 */

import type { ProductionBatch, RawMaterial } from './types';

export const initialRawMaterials: RawMaterial[] = [
  {
    id: 'bottle_600',
    name: '600 ml empty bottles',
    nameUr: '   ',
    currentStock: 1800,
    reorderThreshold: 500,
    unit: 'pieces',
  },
  {
    id: 'bottle_1500',
    name: '1.5 L empty bottles',
    nameUr: '.   ',
    currentStock: 240,           // intentionally low to demo low-stock alert
    reorderThreshold: 300,
    unit: 'pieces',
  },
  {
    id: 'cap_pet',
    name: 'PET bottle caps',
    nameUr: '  ',
    currentStock: 3000,           // combined stock from old 2400 + 600
    reorderThreshold: 800,
    unit: 'pieces',
  },
  {
    id: 'cap_gallon',
    name: 'Gallon caps',
    nameUr: ' ',
    currentStock: 90,            // intentionally low
    reorderThreshold: 100,
    unit: 'pieces',
  },
  {
    id: 'sticker_600',
    name: '600 ml stickers',
    nameUr: '  ',
    currentStock: 2200,
    reorderThreshold: 500,
    unit: 'pieces',
  },
  {
    id: 'sticker_1500',
    name: '1.5 L stickers',
    nameUr: '.  ',
    currentStock: 800,
    reorderThreshold: 300,
    unit: 'pieces',
  },
  {
    id: 'wrap_600',
    name: '600 ml plastic wraps',
    nameUr: '   ',
    currentStock: 18,
    reorderThreshold: 30,         // intentionally low
    unit: 'rolls',
  },
  {
    id: 'wrap_1500',
    name: '1.5 L plastic wraps',
    nameUr: '.   ',
    currentStock: 12,
    reorderThreshold: 20,
    unit: 'rolls',
  },
];

const hoursAgo = (h: number) => Date.now() - h * 60 * 60_000;

export const initialBatches: ProductionBatch[] = [
  {
    id: 'b-1',
    branch: 'timergara',
    product: 'pet600',
    unitsProduced: 30,        // 30 packs
    batchNumber: 'AKV-600-2026-0341',
    tdsPpm: 95,
    phLevel: 7.2,
    wastage: 1,
    loggedBy: 'Naseer (Production)',
    loggedAt: hoursAgo(5),
  },
  {
    id: 'b-2',
    branch: 'timergara',
    product: 'pet1500',
    unitsProduced: 18,
    batchNumber: 'AKV-1500-2026-0188',
    tdsPpm: 102,
    phLevel: 7.1,
    wastage: 0,
    loggedBy: 'Naseer (Production)',
    loggedAt: hoursAgo(4),
  },
  {
    id: 'b-3',
    branch: 'timergara',
    product: 'gallon',
    unitsProduced: 24,
    batchNumber: 'AKV-GAL-2026-0512',
    tdsPpm: 88,
    phLevel: 7.3,
    wastage: 0,
    loggedBy: 'Wajid (Production)',
    loggedAt: hoursAgo(2),
  },
  {
    id: 'b-4',
    branch: 'timergara',
    product: 'can',
    unitsProduced: 35,
    batchNumber: 'AKV-CAN-2026-0731',
    tdsPpm: 92,
    phLevel: 7.2,
    wastage: 0,
    loggedBy: 'Wajid (Production)',
    loggedAt: hoursAgo(1),
  },
];
