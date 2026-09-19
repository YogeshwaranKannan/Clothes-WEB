import { CartItem } from "./cart-item.model";
import { CartPricing } from "./cart-pricing.model";

export interface CartState {
  version: number;
  items: CartItem[];
  pricing: CartPricing;
  finalTotal?: number;
  redeemPoints?: number;
  deliveryFee: number;
  orderThreshold: number;
}
