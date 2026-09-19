import { Component, Input, Output, EventEmitter } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule, Router } from "@angular/router";
import { Store } from "@ngrx/store";
import {
  Observable,
  BehaviorSubject,
  combineLatest,
  firstValueFrom,
} from "rxjs";
import { map } from "rxjs/operators";

import { CartListComponent } from "./cart-list/cart-list.component";
import { CartSummaryComponent } from "./cart-summary/cart-summary.component";

import {
  selectCartCount,
  selectCartPricing,
  selectCartTotal,
} from "../common/models/cart/cart.selectors";
import { CartPricing } from "../common/models/cart/cart-pricing.model";
import * as CartActions from "../common/models/cart/cart.actions";
import { TitleBannerComponent } from "../common/components/title-banner/title-banner.component";
import { DrawerService } from "../common/components/drawer/drawer.service";
import { companyname } from "../common/utils/constant";

@Component({
  selector: "app-cart",
  standalone: true,
  imports: [CommonModule, CartListComponent, CartSummaryComponent, FormsModule],

  templateUrl: "./cart.component.html",
  styleUrls: ["./cart.component.scss"],
})
export class CartComponent {
  @Input() inDrawer = false;
  @Output() openCheckout = new EventEmitter<void>();
  @Output() continueShopping = new EventEmitter<void>();
  cartCount$!: Observable<number>;
  cartTotal$!: Observable<number>;
  cartPricing$!: Observable<CartPricing>;

  private promoCode$ = new BehaviorSubject<string>("");
  promoCode = "";
  promoError = "";
  promoSuccess = "";
  isCheckout = false;

  discount$!: Observable<number>;

  constructor(
    private router: Router,
    private store: Store,
    private drawer: DrawerService,
  ) {
    this.cartCount$ = this.store.select(selectCartCount);
    this.cartTotal$ = this.store.select(selectCartTotal);
    this.cartPricing$ = this.store.select(selectCartPricing);

    // do not subscribe here to avoid memory leaks; templates use async pipe

    this.discount$ = combineLatest([this.cartPricing$, this.promoCode$]).pipe(
      map(([pricing, code]) => {
        if (!code) return 0;
        return code === pricing.promoCode
          ? (pricing.promoDiscountAvailable ?? 0)
          : 0;
      }),
    );
  }

  openInNewTab(route: string): void {
    const cleanCompany = companyname.replace(/^\/+|\/+$/g, "");
    const cleanRoute = route.replace(/^\/+/, "");

    const url = `${window.location.origin}/${cleanCompany}/${cleanRoute}`;

    console.log("Opening:", url);

    window.open(url, "_blank");
  }

  async onApplyPromo(): Promise<void> {
    this.promoError = "";
    this.promoSuccess = "";
    this.promoCode$.next(this.promoCode);

    if (!this.promoCode) return;

    const pricing = await firstValueFrom(this.cartPricing$);

    if (this.promoCode !== pricing.promoCode) {
      this.promoError = "Promo code is invalid";
      this.promoSuccess = "";
      this.store.dispatch(
        CartActions.updatePricing({ pricing: { appliedPromoDiscount: 0 } }),
      );
    } else {
      this.promoError = "";
      this.promoSuccess = "Promo code applied successfully";
      this.store.dispatch(
        CartActions.updatePricing({
          pricing: {
            appliedPromoDiscount: pricing.promoDiscountAvailable ?? 0,
          },
        }),
      );
    }
  }

  onProceedToCheckout() {
    this.isCheckout = true;
    if (this.inDrawer) {
      this.openCheckout.emit();
    } else {
      this.router.navigate(["/checkout"]);
    }
  }

  // onContinueShopping() {
  //   if (this.inDrawer) {
  //     this.drawer.close(); // Close drawer
  //   }

  //   // this.router.navigate(['/']);
  // }
  onContinueShopping() {
    if (this.inDrawer) {
      this.drawer.close();
      this.continueShopping.emit();
    }
  }
  clearCart(): void {
    const confirmed = window.confirm(
      "Are you sure you want to remove all items from the cart?",
    );

    if (!confirmed) {
      return;
    }

    this.store.dispatch(CartActions.clearCart());

    sessionStorage.removeItem("Save_id");
    sessionStorage.removeItem("Draft_save_id");
    sessionStorage.removeItem("customer_form");
    this.promoCode = "";
    this.promoCode$.next("");

    this.promoError = "";
    this.promoSuccess = "";

    this.drawer.close();

    if (this.inDrawer) {
      this.continueShopping.emit();
    }
  }
}
