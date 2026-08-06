import type { CartItem, Product } from './types';
import { formatINR } from './products';
import { buildWhatsAppLink, getWhatsAppNumber } from './contactSettings';

export interface ProductOrderDetails {
  product: Product;
  size: string;
  quantity?: number;
  color?: string;
}

function buildProductOrderMessage({
  product,
  size,
  quantity = 1,
  color,
}: ProductOrderDetails): string {
  const lines = [
    "Hello, I'm interested in purchasing:",
    '',
    `Product Name: ${product.name}`,
    `Size: ${size || 'Not selected'}`,
  ];

  if (color) {
    lines.push(`Color: ${color}`);
  }

  lines.push(`Price: ${formatINR(product.price)}`);

  if (quantity > 1) {
    lines.push(`Quantity: ${quantity}`);
  }

  lines.push('', 'Please provide ordering details.');

  return lines.join('\n');
}

function buildCartOrderMessage(cart: CartItem[], cartTotal: number): string {
  const lines = ["Hello, I'd like to place an order:", ''];

  cart.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.product.name}`);
    lines.push(`   Size: ${item.size}`);
    lines.push(`   Quantity: ${item.quantity}`);
    lines.push(`   Price: ${formatINR(item.product.price)} each`);
    lines.push(`   Subtotal: ${formatINR(item.product.price * item.quantity)}`);
    lines.push('');
  });

  lines.push(`Total: ${formatINR(cartTotal)}`);
  lines.push('');
  lines.push('Please provide ordering details.');

  return lines.join('\n');
}

function openWhatsAppOrder(message: string): void {
  const number = getWhatsAppNumber();
  const url = buildWhatsAppLink(number, message);
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function orderProductOnWhatsApp(details: ProductOrderDetails): void {
  openWhatsAppOrder(buildProductOrderMessage(details));
}

export function orderCartOnWhatsApp(cart: CartItem[], cartTotal: number): void {
  openWhatsAppOrder(buildCartOrderMessage(cart, cartTotal));
}
