export interface AddonModel {
  productId?: string;
  id: number;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  discountLabel?: string; // e.g. "Buy 1 get 1 free" — optional badge override
  isService?: boolean;
}
