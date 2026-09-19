import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";

import { provideStore, MetaReducer } from "@ngrx/store";
import { provideState } from "@ngrx/store";
import { provideEffects } from "@ngrx/effects";

import { localStorageSync } from "ngrx-store-localstorage";

import { routes } from "./app.routes";
import {
  cartReducer,
  initialState as cartInitialState,
  CART_STORAGE_VERSION,
} from "./common/models/cart/cart.reducer";
import { CartEffects } from "./common/models/cart/cart.effects";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { authInterceptor } from "./core/interceptors/auth.interceptor";

// ✅ Persist + rehydrate full cart state
export function localStorageSyncReducer(reducer: any) {
  return localStorageSync({
    keys: ["cart"],
    rehydrate: true,
  })(reducer);
}

// ✅ Validate + version check after rehydrate
export function cartVersionGuardReducer(reducer: any) {
  return (state: any, action: any) => {
    const nextState = reducer(state, action);

    const cart = nextState?.cart;
    if (!cart) return nextState;

    // If version mismatched or missing => reset cart safely
    if (cart.version !== CART_STORAGE_VERSION) {
      return { ...nextState, cart: cartInitialState };
    }

    // Optional safety: ensure items/pricing exist
    if (!Array.isArray(cart.items) || !cart.pricing) {
      return { ...nextState, cart: cartInitialState };
    }

    return nextState;
  };
}

const metaReducers: MetaReducer[] = [
  localStorageSyncReducer,
  cartVersionGuardReducer,
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),

    // ✅ metaReducers added here (same idea as your sample)
    provideStore({}, { metaReducers }),

    // ✅ feature slice
    provideState("cart", cartReducer),

    provideEffects([CartEffects]),
  ],
};
