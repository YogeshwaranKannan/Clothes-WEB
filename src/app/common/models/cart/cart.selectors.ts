import { createFeatureSelector, createSelector } from "@ngrx/store";
import { CartState } from "./cart-state.model";

export const selectCartFeature = createFeatureSelector<CartState>("cart");

export const selectCartItems = createSelector(
  selectCartFeature,
  (state) => state.items,
);

export const selectCartPricing = createSelector(
  selectCartFeature,
  (state) => state.pricing,
);

export const selectCartTotal = createSelector(selectCartItems, (items) =>
  items.reduce((sum, i) => {
    const addonSum = (i.selectedAddons ?? []).reduce(
      (s, a) => s + a.price * a.quantity,
      0,
    );
    // ✅ Same (dealPrice > 0 ? dealPrice : mrp) fallback cart-list.component
    // already applies per-line — defense-in-depth for carts persisted (in
    // localStorage) before the dealPrice:0 bug was fixed at the add-to-cart
    // call sites. Without this, a line with dealPrice:0 renders a correct
    // non-zero total in the list (via that same fallback) while silently
    // contributing ₹0 here, dragging Subtotal/Total down to ₹0.
    const unitPrice = i.dealPrice > 0 ? Number(i.dealPrice) : Number(i.mrp);
    return sum + unitPrice * i.quantity + addonSum;
  }, 0),
);

// export const selectCartCount = createSelector(selectCartItems, (items) =>
//   items.reduce((sum, i) => sum + i.quantity, 0),
// );
export const selectCartCount = createSelector(
  selectCartItems,
  (items) => items.length,
);

// export const selectCartFinalTotal = createSelector(
//   selectCartFeature,
//   (state: CartState) => {
//     const subtotal = state.items.reduce((sum, i) => {
//       const addonSum = (i.selectedAddons ?? []).reduce(
//         (s, a) => s + a.price * a.quantity,
//         0,
//       );

//       // ✅ Same mrp fallback as selectCartTotal above — see its comment.
//       const unitPrice =
//         i.dealPrice > 0 ? Number(i.dealPrice) : Number(i.mrp || 0);
//       return sum + unitPrice * i.quantity + addonSum;
//     }, 0);

//     // const shipping = state.pricing?.shippingPrice ?? 0;
//     // const tax = state.pricing?.tax ?? 0;
//     const redeem = state.pricing?.redeemDiscount ?? 0;
//     const discount = state.pricing?.discount ?? 0;

//     // return subtotal + shipping + tax - redeem - discount;
//     return subtotal - redeem - discount;
//   },
// );

export const selectCartFinalTotal = createSelector(
  selectCartFeature,
  (state: CartState) => {
    const subtotal = state.items.reduce((sum, i) => {
      const addonSum = (i.selectedAddons ?? []).reduce(
        (s, a) => s + a.price * a.quantity,
        0,
      );
      const unitPrice =
        i.dealPrice > 0 ? Number(i.dealPrice) : Number(i.mrp || 0);
      return sum + unitPrice * i.quantity + addonSum;
    }, 0);

    const redeem = state.pricing?.redeemDiscount ?? 0;
    const discount = state.pricing?.discount ?? 0;

    // ── NEW: delivery fee, sourced from state (not a service) ──
    const deliveryFee = state.deliveryFee ?? 0;
    const orderThreshold = state.orderThreshold ?? 0;
    const deliveryCharge = subtotal < orderThreshold ? deliveryFee : 0;

    return subtotal - redeem - discount + deliveryCharge;
  },
);
export const selectRedeemPoints = createSelector(
  selectCartFeature,
  (state) => state.redeemPoints,
);
