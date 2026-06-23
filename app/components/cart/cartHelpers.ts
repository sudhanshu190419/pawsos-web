import type { CartItem } from "./cartTypes";

export const calculateCartTotals = (items: CartItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
  return { subtotal, itemCount };
};

/**
 * Single source of truth for all checkout pricing.
 * Both the Bill Details section and the Place Order action
 * MUST derive values from this function.
 */
export type CheckoutTotals = {
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
};

const DELIVERY_FEE_THRESHOLD = 500;
const DELIVERY_FEE_AMOUNT = 40;
const DISCOUNT_RATE = 0.1; // 10% – for "save10" promo

/**
 * Returns checkout pricing derived from cart items.
 * - deliveryFee: ₹40 waived if subtotal > 500
 * - discount: 10% of subtotal when promoApplied
 * - total: subtotal + deliveryFee - discount
 */
export function calculateCheckoutTotals(
  items: CartItem[],
  promoApplied: boolean = false
): CheckoutTotals {
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (item.qty || 1),
    0
  );

  const deliveryFee = subtotal > DELIVERY_FEE_THRESHOLD ? 0 : DELIVERY_FEE_AMOUNT;
  const discount = promoApplied ? Math.round(subtotal * DISCOUNT_RATE) : 0;
  const total = subtotal + deliveryFee - discount;

  const totals: CheckoutTotals = { subtotal, deliveryFee, discount, total };

  console.log("CHECKOUT TOTALS", totals);

  return totals;
}
