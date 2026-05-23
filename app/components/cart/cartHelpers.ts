import type { CartItem } from "./cartTypes";

export const calculateCartTotals = (items: CartItem[]) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const itemCount = items.reduce((sum, item) => sum + item.qty, 0);
  return { subtotal, itemCount };
};
