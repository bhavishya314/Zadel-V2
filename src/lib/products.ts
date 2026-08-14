import type { Product } from './types';

export const products: Product[] = [];

export const categories: Array<{ name: string; image: string; description: string }> = [];

export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

