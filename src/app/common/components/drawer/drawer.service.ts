import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { DrawerState } from "./drawer-state";

export type DrawerContent = "cart" | "checkout";

@Injectable({ providedIn: "root" })
export class DrawerService {
  private state$ = new BehaviorSubject<DrawerState>(DrawerState.Hidden);
  private title$ = new BehaviorSubject<string>("Cart");
  private content$ = new BehaviorSubject<DrawerContent>("cart");
  private checkoutComponent$ = new BehaviorSubject<any | null>(null);
  private isCheckout$ = new BehaviorSubject<boolean>(false);

  stateChanges = this.state$.asObservable();
  titleChanges = this.title$.asObservable();
  contentChanges = this.content$.asObservable();
  checkoutComponentChanges = this.checkoutComponent$.asObservable();
  isCheckoutChanges = this.isCheckout$.asObservable();

  setState(s: DrawerState) {
    this.state$.next(s);
  }

  getTitle(): string {
    return this.title$.getValue();
  }
  setTitle(t: string) {
    console.log("setTitle ->", t);
    this.title$.next(t);
  }
  setContent(c: DrawerContent) {
    this.content$.next(c);
  }

  private refNo$ = new BehaviorSubject<string | null>(null);
  refNoChanges = this.refNo$.asObservable();

  setRefNo(ref: string | null) {
    this.refNo$.next(ref);
  }
  getRefNo(): string | null {
    return this.refNo$.getValue();
  }

  openCart() {
    this.isCheckout$.next(false);
    this.title$.next("Cart");
    this.content$.next("cart");
    this.state$.next(DrawerState.Half);
    this.checkoutComponent$.next(null);
  }

  async openCheckout() {
    this.isCheckout$.next(true);
    this.title$.next("Checkout");
    this.state$.next(DrawerState.Half);
    try {
      const mod = await import("../../../checkout/checkout.component");
      this.checkoutComponent$.next(mod.CheckoutComponent);
    } catch {
      this.checkoutComponent$.next(null);
    }
    this.content$.next("checkout");
  }

  close() {
    this.state$.next(DrawerState.Hidden);
    this.content$.next("cart");
    this.isCheckout$.next(false);
    this.checkoutComponent$.next(null);
    this.title$.next("Cart");
  }

  private orderPlacedSubject = new BehaviorSubject<boolean>(false);

  orderPlacedChanges = this.orderPlacedSubject.asObservable();

  setOrderPlaced(value: boolean) {
    this.orderPlacedSubject.next(value);
  }
}
