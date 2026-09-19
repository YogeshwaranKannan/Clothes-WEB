import { Action, createReducer, on } from "@ngrx/store";
import * as CartActions from "./cart.actions";
import { CartState } from "./cart-state.model";
import { SelectedAddon } from "./cart-item.model";
export const CART_STORAGE_VERSION = 1; // ✅ bump this when cart shape changes

export const initialState: CartState = {
  version: CART_STORAGE_VERSION, // ✅ added
  items: [],
  pricing: {
    promoCode: "123",
    promoDiscountAvailable: 200,
    appliedPromoDiscount: 0,
    shippingPrice: 0,
    tax: 40,
  },
  deliveryFee: 0,
  orderThreshold: 0,
};

const _cartReducer = createReducer(
  initialState,

  // ADD inside _cartReducer, after the updateQuantity on():
  on(CartActions.toggleAddon, (state, { productId, addon }) => ({
    ...state,
    items: state.items.map((item) => {
      if (item.productId !== productId) return item;

      const existing = item.selectedAddons ?? [];
      const idx = existing.findIndex((a) => a.id === addon.id);

      const updated: SelectedAddon[] =
        idx >= 0
          ? existing.filter((a) => a.id !== addon.id) // deselect
          : [...existing, { ...addon, quantity: 1 }]; // select

      return { ...item, selectedAddons: updated };
    }),
  })),

  on(
    CartActions.updateAddonQuantity,
    (state, { productId, addonId, quantity }) => ({
      ...state,
      items: state.items.map((item) => {
        if (item.productId !== productId) return item;
        const updated = (item.selectedAddons ?? []).map((a) =>
          a.id === addonId ? { ...a, quantity: Math.max(1, quantity) } : a,
        );
        return { ...item, selectedAddons: updated };
      }),
    }),
  ),

  on(CartActions.updateOrAddItem, (state, { item }) => {
    const idx = state.items.findIndex((i) => i.productId === item.productId);

    // normalize
    const normalized = {
      ...item,
      dealPrice: Number.isFinite(item.dealPrice) ? item.dealPrice : 0,
      mrp: Number.isFinite(item.mrp) ? item.mrp : 0,
      quantity: Math.max(1, Math.floor(item.quantity || 1)),
    };

    if (idx >= 0) {
      const existing = state.items[idx];
      const updatedItem = {
        ...existing,
        ...normalized,
        quantity: (existing.quantity ?? 1) + normalized.quantity,
        item: normalized.item ?? existing.item,
      };
      const newItems = [...state.items];
      newItems[idx] = updatedItem;
      return { ...state, items: newItems };
    }

    return { ...state, items: [...state.items, normalized] };
  }),

  on(CartActions.removeItem, (state, { productId }) => ({
    ...state,
    items: state.items.filter((i) => i.productId !== productId),
  })),

  // ✅ clamp quantity
  on(CartActions.updateQuantity, (state, { productId, quantity }) => ({
    ...state,
    items: state.items.map((i) =>
      i.productId === productId
        ? { ...i, quantity: Math.max(1, Math.floor(quantity || 1)) }
        : i,
    ),
  })),

  on(CartActions.updatePricing, (state, { pricing }) => ({
    ...state,
    pricing: { ...state.pricing, ...(pricing as any) },
  })),

  on(CartActions.clearCart, () => initialState),

  on(CartActions.updateRedeemPoints, (state, { redeemPoints }) => ({
    ...state,
    redeemPoints,
  })),

  // cart.reducer.ts — add a case
  on(
    CartActions.setDeliveryConfig,
    (state, { deliveryFee, orderThreshold }) => ({
      ...state,
      deliveryFee,
      orderThreshold,
    }),
  ),

  on(CartActions.updateRedeemDiscount, (state, { redeemDiscount }) => ({
    ...state,

    pricing: {
      ...state.pricing,
      redeemDiscount,
    },
  })),
);

export function cartReducer(state: CartState | undefined, action: Action) {
  return _cartReducer(state, action);
}
