// import { Component } from "@angular/core";
// import { CommonModule } from "@angular/common";
// import { FormsModule } from "@angular/forms";

// import {
//   selectCartItems,
//   selectCartCount,
//   selectCartPricing,
//   selectCartTotal,
// } from "../../common/models/cart/cart.selectors";
// import { CartItem } from "../../common/models/cart/cart-item.model";
// import { Store } from "@ngrx/store";
// import { Observable, BehaviorSubject, combineLatest, map, Subject } from "rxjs";
// import { takeUntil, tap } from "rxjs/operators";
// import { CartPricing } from "../../common/models/cart/cart-pricing.model";
// import * as CartActions from "../../common/models/cart/cart.actions";
// import { ImageUrlPipe } from "../../common/pipes/image-url.pipe";
// import { buildImageUrl } from "../../common/utils/buildImg";
// import { AuthService } from "../../core/auth/auth.service";
// import { SellerService } from "../../common/services/SellerService";

// @Component({
//   selector: "app-order-summary",
//   standalone: true,
//   imports: [CommonModule, FormsModule, ImageUrlPipe],
//   templateUrl: "./order-summary.component.html",
//   styleUrls: ["./order-summary.component.scss"],
// })
// export class OrderSummaryComponent {
//   cartItems$!: Observable<CartItem[]>;

//   cartCount$!: Observable<number>;
//   cartPricing$!: Observable<CartPricing>;
//   cartTotal$!: Observable<number>;

//   // reactive promo handling
//   private promoCode$ = new BehaviorSubject<string>("");
//   promoCode = "";
//   promoError = "";
//   promoSuccess = "";

//   redeemPoints = 0;
//   redeemError = "";
//   redeemSuccess = "";

//   availableRewards = 0;

//   rewardConfig = {
//     RedeeemAmount: 0,
//     RedeemPoints: 0,
//   };

//   // derived observables
//   discount$!: Observable<number>;
//   finalTotal$!: Observable<number>;
//   private destroy$ = new Subject<void>();
//   constructor(
//     private store: Store,
//     private auth: AuthService,
//     private sellerService: SellerService,
//   ) {
//     // initialize store-backed observables
//     this.cartItems$ = this.store.select(selectCartItems);
//     this.cartItems$.subscribe((items) => {
//       console.log("Cart Items in order summary→", items);
//     });
//     this.cartCount$ = this.store.select(selectCartCount);
//     this.cartPricing$ = this.store.select(selectCartPricing);
//     this.cartTotal$ = this.store.select(selectCartTotal);

//     // discount$ emits promoDiscount only when entered promoCode matches pricing.promoCode
//     this.discount$ = combineLatest([this.cartPricing$, this.promoCode$]).pipe(
//       map(([pricing, code]) => {
//         if (!code) return 0;
//         return code === pricing?.promoCode
//           ? (pricing.promoDiscountAvailable ?? 0)
//           : 0;
//       }),
//     );

//     this.finalTotal$ = combineLatest([
//       this.cartTotal$,
//       this.cartPricing$,
//       this.discount$,
//     ]).pipe(
//       map(([cartTotal, pricing, discount]) => {
//         const shipping = pricing?.shippingPrice ?? 0;
//         const tax = pricing?.tax ?? 0;
//         const rewardDiscount =
//           (this.redeemPoints / this.rewardConfig.RedeemPoints) *
//           this.rewardConfig.RedeeemAmount;

//         return cartTotal + shipping + tax - (discount ?? 0) - rewardDiscount;
//       }),
//       tap((finalTotal) => {
//         this.store.dispatch(CartActions.updateFinalTotal({ finalTotal }));
//       }),
//     );

//     const authState = this.auth.getAuthState();

//     console.log("Auth State:", authState);

//     this.availableRewards = authState?.user?.availableRewards ?? 0;

//     console.log("Available Reward Points:", this.availableRewards);

//     this.rewardConfig = this.sellerService.getRewardConfig();

//     console.log("Reward Config:", this.rewardConfig);
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   onRedeemPoints(): void {
//     this.redeemError = "";
//     this.redeemSuccess = "";

//     if (!this.redeemPoints || this.redeemPoints <= 0) {
//       this.redeemError = "Enter valid points";

//       return;
//     }

//     if (this.redeemPoints > this.availableRewards) {
//       this.redeemError = `You have only ${this.availableRewards} points`;

//       return;
//     }

//     const redeemValue =
//       (this.redeemPoints / this.rewardConfig.RedeemPoints) *
//       this.rewardConfig.RedeeemAmount;

//     this.redeemSuccess = `${this.redeemPoints} points = ₹${redeemValue} discount`;
//   }
//   onApplyPromo(): void {
//     this.promoError = "";
//     this.promoSuccess = "";
//     // push entered code into reactive stream
//     this.promoCode$.next(this.promoCode);

//     // validate once to show error message if invalid
//     const pricingSnapshot = (pricing: CartPricing | undefined) => {
//       if (!this.promoCode) {
//         this.promoError = "";
//         this.promoSuccess = "";
//         return;
//       }
//       if (!pricing) {
//         this.promoError = "Pricing not available";
//         return;
//       }
//       if (this.promoCode !== pricing.promoCode) {
//         this.promoError = "Promo code is invalid";
//         this.promoSuccess = "";
//       } else {
//         this.promoError = "";
//         this.promoSuccess = "Promo code applied successfully";
//       }
//     };

//     // one-time subscription to pricing to set promoError accordingly
//     const sub = this.cartPricing$.subscribe((pricing) => {
//       pricingSnapshot(pricing);
//       sub.unsubscribe();
//     });
//   }

//   buildImageUrl(
//     relative?: string,
//     productname?: string,
//     isService?: boolean,
//   ): string {
//     // console.log("buildImageUrl INPUT in OrderSummary →", {
//     //   relative,
//     //   productname,
//     //   isService,
//     // });

//     const result = buildImageUrl(relative, productname, isService);

//     // console.log("buildImageUrl OUTPUT →", result);

//     return result;
//   }
// }

import { Component, effect } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import {
  selectCartItems,
  selectCartCount,
  selectCartPricing,
  selectCartTotal,
} from "../../common/models/cart/cart.selectors";

import { CartItem } from "../../common/models/cart/cart-item.model";
import { Store } from "@ngrx/store";
import {
  Observable,
  BehaviorSubject,
  combineLatest,
  map,
  Subject,
  tap,
  of,
  shareReplay,
  takeUntil,
} from "rxjs";

import { CartPricing } from "../../common/models/cart/cart-pricing.model";
import * as CartActions from "../../common/models/cart/cart.actions";

import { ImageUrlPipe } from "../../common/pipes/image-url.pipe";

import { AuthService } from "../../core/auth/auth.service";
import { SellerService } from "../../common/services/SellerService";
import { ImageUrlService } from "../../common/utils/ImageUrlService";

@Component({
  selector: "app-order-summary",
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUrlPipe],
  templateUrl: "./order-summary.component.html",
  styleUrls: ["./order-summary.component.scss"],
})
export class OrderSummaryComponent {
  cartItems$!: Observable<CartItem[]>;

  cartCount$!: Observable<number>;

  cartPricing$!: Observable<CartPricing>;

  cartTotal$!: Observable<number>;

  private promoCode$ = new BehaviorSubject<string>("");

  promoCode = "";

  promoError = "";

  promoSuccess = "";

  redeemPoints = 0;

  redeemError = "";

  redeemSuccess = "";

  availableRewards = 0;

  cost = 0;

  isLoggedInUser = false;

  rewardConfig = {
    RedeeemAmount: 0,

    RedeemPoints: 0,
    RewardAmount: 0,
    RewardPoints: 0,
  };
  isRedeemed = false;

  redeemDiscount$!: number;

  private redeemPoints$ = new BehaviorSubject<number>(0);

  discount$!: Observable<number>;
  saved$!: Observable<number>;

  finalTotal$!: Observable<number>;

  private destroy$ = new Subject<void>();
  deliveryFee = 0;
  orderThreshold = 0;

  isOpen = false; // Order Summary starts collapsed

  toggleOpen(): void {
    this.isOpen = !this.isOpen;
  }

  constructor(
    private store: Store,

    private auth: AuthService,

    private sellerService: SellerService,
    private imageUrlService: ImageUrlService,
  ) {
    this.cartItems$ = this.store.select(selectCartItems);

    this.cartCount$ = this.store.select(selectCartCount);

    this.cartPricing$ = this.store.select(selectCartPricing);

    this.cartTotal$ = this.store.select(selectCartTotal);

    this.isLoggedInUser = !!this.auth.isLoggedIn();

    // SELLER REWARD CONFIG

    this.rewardConfig = this.sellerService.getRewardConfig();

    console.log("Reward Config in OrderSummary:", this.rewardConfig);

    this.deliveryFee = this.sellerService.getDeliveryFee();
    this.orderThreshold = this.sellerService.getOrderThreshold();

    this.store.dispatch(
      CartActions.setDeliveryConfig({
        deliveryFee: this.deliveryFee,
        orderThreshold: this.orderThreshold,
      }),
    );

    effect(() => {
      const user = this.auth.user();

      this.availableRewards = user?.availableRewards ?? 0;

      if (this.rewardConfig?.RedeemPoints > 0) {
        this.cost = Number(
          (
            (this.availableRewards / this.rewardConfig.RedeemPoints) *
            this.rewardConfig.RedeeemAmount
          ).toFixed(2),
        );
      } else {
        this.cost = 0;
      }

      console.log("Updated Available Rewards:", this.availableRewards);
      console.log("Reward Cost:", this.cost);
    });

    this.discount$ = of(0);
    this.saved$ = this.cartItems$.pipe(
      map((items) => {
        return items.reduce((totalDiscount, item: any) => {
          const sellerPrice = Number(item?.mrp ?? 0);
          const offerPrice = Number(item?.dealPrice ?? 0);
          const quantity = Number(item?.quantity ?? 1);

          console.log("Cart Item:", item);
          console.log("Seller Price:", sellerPrice);
          console.log("Offer Price:", offerPrice);
          console.log("Quantity:", quantity);

          // Calculate discount only when offer price is lower
          if (offerPrice > 0 && sellerPrice > offerPrice) {
            const itemDiscount = (sellerPrice - offerPrice) * quantity;

            console.log("Item Discount:", itemDiscount);

            return totalDiscount + itemDiscount;
          }

          return totalDiscount;
        }, 0);
      }),
    );

    this.finalTotal$ = combineLatest([
      this.cartTotal$,
      this.cartPricing$,
      this.discount$,
      this.redeemPoints$,
    ]).pipe(
      map(([cartTotal, pricing, discount, points]) => {
        let rewardDiscount = 0;
        if (this.rewardConfig.RedeemPoints > 0) {
          rewardDiscount =
            (points / this.rewardConfig.RedeemPoints) *
            this.rewardConfig.RedeeemAmount;
        }
        const deliveryCharge =
          cartTotal < this.orderThreshold ? this.deliveryFee : 0;
        return cartTotal - discount - rewardDiscount + deliveryCharge;
      }),
      tap((finalTotal) => {
        this.store.dispatch(CartActions.updateFinalTotal({ finalTotal }));
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    // ── NEW: force the pipeline to run regardless of template subscribers ──
    this.finalTotal$.pipe(takeUntil(this.destroy$)).subscribe();

    // this.finalTotal$ = combineLatest([
    //   this.cartTotal$,
    //   this.cartPricing$,
    //   this.discount$,
    //   this.redeemPoints$,
    // ]).pipe(
    //   map(([cartTotal, pricing, discount, points]) => {
    //     console.log("Cart Total :", cartTotal);
    //     const shipping = pricing?.shippingPrice ?? 0;

    //     const tax = pricing?.tax ?? 0;

    //     let rewardDiscount = 0;

    //     if (this.rewardConfig.RedeemPoints > 0) {
    //       rewardDiscount =
    //         (points / this.rewardConfig.RedeemPoints) *
    //         this.rewardConfig.RedeeemAmount;
    //     }

    //     // return cartTotal + shipping + tax - discount - rewardDiscount;
    //     return cartTotal - discount - rewardDiscount;
    //   }),

    //   // tap((finalTotal) => {
    //   //   this.store.dispatch(
    //   //     CartActions.updateFinalTotal({
    //   //       finalTotal,
    //   //     }),
    //   //   );
    //   // }),
    // );
  }

  onRedeemPoints() {
    this.redeemError = "";
    this.redeemSuccess = "";

    if (!this.redeemPoints || this.redeemPoints <= 0) {
      this.redeemError = "Enter valid points";
      return;
    }

    if (this.redeemPoints > this.availableRewards) {
      this.redeemError = `You have only ${this.availableRewards} points`;
      return;
    }

    if (this.rewardConfig.RedeemPoints <= 0) {
      this.redeemError = "Reward configuration unavailable";
      return;
    }

    const value = parseFloat(
      (
        (this.redeemPoints / this.rewardConfig.RedeemPoints) *
        this.rewardConfig.RedeeemAmount
      ).toFixed(2),
    );

    this.redeemDiscount$ = value;

    console.log("Value : ", value);

    this.store.dispatch(
      CartActions.updateRedeemDiscount({
        redeemDiscount: value,
      }),
    );

    this.store.dispatch(
      CartActions.updateRedeemPoints({
        redeemPoints: this.redeemPoints,
      }),
    );

    this.redeemPoints$.next(this.redeemPoints);

    this.redeemSuccess = `${this.redeemPoints} points = ₹${value} discount`;

    // lock input and change button to undo
    this.isRedeemed = true;
  }

  undoRedeemPoints() {
    this.isRedeemed = false;

    // clear input
    this.redeemPoints = 0;

    // clear messages
    this.redeemSuccess = "";
    this.redeemError = "";

    // remove discount
    this.redeemDiscount$ = 0;

    this.store.dispatch(
      CartActions.updateRedeemDiscount({
        redeemDiscount: 0,
      }),
    );

    this.store.dispatch(
      CartActions.updateRedeemPoints({
        redeemPoints: 0,
      }),
    );

    this.redeemPoints$.next(0);
  }

  onApplyPromo() {
    this.promoError = "";

    this.promoSuccess = "";

    this.promoCode$.next(this.promoCode);

    this.cartPricing$.subscribe((pricing) => {
      if (this.promoCode === pricing?.promoCode) {
        this.promoSuccess = "Promo code applied successfully";
      } else if (this.promoCode) {
        this.promoError = "Promo code is invalid";
      }
    });
  }

  buildImageUrl(
    relative?: string,
    inventoryId?: string,
    isService?: boolean,
  ): string {
    return this.imageUrlService.buildImageUrl(relative, inventoryId, isService);
  }

  ngOnDestroy() {
    this.destroy$.next();

    this.destroy$.complete();
  }
}
