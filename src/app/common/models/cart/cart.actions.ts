import { createAction, props } from "@ngrx/store";
import { CartItem } from "./cart-item.model";
import { SelectedAddon } from "./cart-item.model"; // ADD
// New action that updates an existing item (merge) or appends if not present.
export const updateOrAddItem = createAction(
  "[Cart] Update Or Add Item",
  props<{ item: CartItem }>(),
);
export const removeItem = createAction(
  "[Cart] Remove Item",
  props<{ productId: string }>(),
);
export const updateQuantity = createAction(
  "[Cart] Update Quantity",
  props<{ productId: string; quantity: number }>(),
);
export const clearCart = createAction("[Cart] Clear Cart");
export const updateFinalTotal = createAction(
  "[Cart] Update Final Total",
  props<{ finalTotal: number }>(),
);
export const updatePricing = createAction(
  "[Cart] Update Pricing",
  props<{ pricing: Partial<any> }>(),
);
// ADD — toggle a single addon on a cart item
export const toggleAddon = createAction(
  "[Cart] Toggle Addon",
  props<{ productId: string; addon: SelectedAddon }>(),
);
// ADD after existing toggleAddon action
export const updateAddonQuantity = createAction(
  "[Cart] Update Addon Quantity",
  props<{ productId: string; addonId: string; quantity: number }>(),
);

export const updateRedeemDiscount = createAction(
  "[Cart] Update Redeem Discount",
  props<{ redeemDiscount: number }>(),
);
export const updateRedeemPoints = createAction(
  "[Cart] Update Redeem Points",
  props<{ redeemPoints: number }>(),
);
// cart.actions.ts
export const setDeliveryConfig = createAction(
  "[Cart] Set Delivery Config",
  props<{ deliveryFee: number; orderThreshold: number }>(),
);
