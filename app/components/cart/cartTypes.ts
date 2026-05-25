export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  imageUrl: string;
  brandName: string;
  brandId: string;
  weight: number;
  length: number | null;
  breadth: number | null;
  height: number | null;
  shiprocketPickupId: number | null;
  stockQty: number;
};

export type CartTotals = {
  subtotal: number;
  itemCount: number;
};
