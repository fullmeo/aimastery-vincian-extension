/**
 * Simple function with good movement score
 * - Low complexity (CC=1)
 * - No nesting
 * - Clear flow
 */

export function calculateTotalPrice(items: CartItem[]): number {
  if (items.length === 0) {
    return 0;
  }

  return items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
}

interface CartItem {
  price: number;
  quantity: number;
}
