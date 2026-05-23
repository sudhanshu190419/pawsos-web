"use client";

import FullProduct from "./full-product";
import { CartProvider } from "../../../components/cart";

export default function ProductDetailPage() {
  return (
    <CartProvider>
      <FullProduct />
    </CartProvider>
  );
}
