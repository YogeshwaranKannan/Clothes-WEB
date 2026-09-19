export interface CartPricing {
  // promoCode configured in store (the code users must enter)
  promoCode: string;
  // promoDiscountAvailable is the discount amount configured in store
  promoDiscountAvailable: number;
  // appliedPromoDiscount is the discount actually applied by the user (0 until applied)
  appliedPromoDiscount: number;
  shippingPrice: number;
  tax: number;
  redeemDiscount?: number;
  discount?: number;
}
