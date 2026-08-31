import type { Timestamp } from "firebase/firestore";

export type ProductStatus = "active" | "inactive";

export interface ProductRecord {
  id: string;
  brandId: string;
  brandName: string;
  shiprocketPickupId: number | null;
  name: string;
  description: string;
  category: string;
  animals?: string[];
  price: number;
  discountPrice: number | null;
  stockQty: number;
  weight: number;
  length: number | null;
  breadth: number | null;
  height: number | null;
  images: string[];
  status: ProductStatus;
  createdAt?: Timestamp;
}

export interface ProductFormValues {
  name: string;
  description: string;
  category: string;
  animals: string[];
  price: string;
  discountPrice: string;
  stockQty: string;
  weight: string;
  length: string;
  breadth: string;
  height: string;
}

export interface ProductImageItem {
  id: string;
  url: string;
  isNew: boolean;
  file?: File;
}
