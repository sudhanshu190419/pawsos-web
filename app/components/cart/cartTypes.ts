export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  imageUrl: string;
  vetClinicName: string;
  vetId: string;
  shiprocketPickupId: number | null;
  stockQty: number;
};

export type CartTotals = {
  subtotal: number;
  itemCount: number;
};
