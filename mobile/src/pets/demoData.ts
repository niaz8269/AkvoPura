/**
 * Demo data for Slice 3 — Pets product catalog + 10 sample customers.
 */

import type { PetCustomer, PetProduct, PetVanLoad } from './types';

export const petProducts: PetProduct[] = [
  {
    id: 'pet600',
    nameEn: '600 ml pack',
    nameUr: '۶۰۰ ملی پیک',
    bottlesPerPack: 12,
    defaultPrice: 280,
  },
  {
    id: 'pet1500',
    nameEn: '1.5 L pack',
    nameUr: '۱.۵ لیٹر پیک',
    bottlesPerPack: 6,
    defaultPrice: 320,
  },
];

export const initialPetVanLoad: PetVanLoad = {
  pet600Packs: 50,
  pet1500Packs: 40,
};

export const demoPetCustomers: PetCustomer[] = [
  {
    id: 'p-1',
    name: 'Al-Madina General Store',
    phone: '0300-1112233',
    address: 'Bazaar Chowk, Timergara',
    area: 'Bazaar',
    outstandingDebt: 0,
  },
  {
    id: 'p-2',
    name: 'Khan Karyana',
    phone: '0301-7788990',
    address: 'Mohalla Khan, Street 4',
    area: 'Mohalla Khan',
    outstandingDebt: 4200,
    notes: 'Pays weekly on Friday.',
  },
  {
    id: 'p-3',
    name: 'New Sahib Departmental',
    phone: '0312-4455667',
    address: 'Main Bazaar, opposite mosque',
    area: 'Bazaar',
    outstandingDebt: 0,
  },
  {
    id: 'p-4',
    name: 'Saima Tuck Shop (School)',
    phone: '0344-5566778',
    address: 'Govt Boys School, canteen',
    area: 'School Road',
    outstandingDebt: 0,
    notes: 'Only morning hours (8 AM – 1 PM).',
  },
  {
    id: 'p-5',
    name: 'Bypass Cold Drink Corner',
    phone: '0345-9988776',
    address: 'Bypass Road, near tyre shop',
    area: 'Bypass',
    outstandingDebt: 0,
    pricePet600: 290,
    pricePet1500: 330,
  },
  {
    id: 'p-6',
    name: 'Family — Akbar House',
    phone: '0322-1010101',
    address: 'House #14, Street 5',
    area: 'Domestic',
    outstandingDebt: 0,
  },
  {
    id: 'p-7',
    name: 'Hira Beauty Parlour',
    phone: '0331-2233445',
    address: 'Bazaar second floor',
    area: 'Bazaar',
    outstandingDebt: 0,
  },
  {
    id: 'p-8',
    name: 'Al-Falah Stationery',
    phone: '0300-7654321',
    address: 'School Road, near press',
    area: 'School Road',
    outstandingDebt: 1100,
  },
  {
    id: 'p-9',
    name: 'Truck Adda Tea Stall',
    phone: '0335-8899001',
    address: 'Truck adda, end of bypass',
    area: 'Bypass',
    outstandingDebt: 0,
    notes: 'Buys 1.5L packs only. No 600ml.',
  },
  {
    id: 'p-10',
    name: 'Eidgah Mart',
    phone: '0310-7777888',
    address: 'Eidgah Road, main entrance',
    area: 'Eidgah',
    outstandingDebt: 0,
  },
];
