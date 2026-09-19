import { Component, EventEmitter, Output, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Store } from "@ngrx/store";
import { Observable } from "rxjs";
import { FormsModule } from "@angular/forms";
import { map, take } from "rxjs/operators";

import {
  selectCartItems,
  selectCartPricing,
  selectCartTotal,
} from "../../common/models/cart/cart.selectors";

import { CartPricing } from "../../common/models/cart/cart-pricing.model";
import * as CartActions from "../../common/models/cart/cart.actions";

import { OrderService } from "../../common/services/orders.service";
import { SellerService } from "../../common/services/SellerService";
import { AuthService } from "../../core/auth/auth.service";
import { LoadingScreenComponent } from "../../common/components/loading-screen/loading-screen.component";
import { Router } from "@angular/router";
import { DrawerService } from "../../common/components/drawer/drawer.service";
import { CartItem } from "../../common/models/cart/cart-item.model";

@Component({
  selector: "app-cart-summary",
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingScreenComponent],
  templateUrl: "./cart-summary.component.html",
  styleUrls: ["./cart-summary.component.scss"],
})
export class CartSummaryComponent implements OnInit {
  @Output() proceed = new EventEmitter<void>();
  @Output() continue = new EventEmitter<void>();

  isLoggedInUser = false;

  cartPricing$!: Observable<CartPricing>;
  cartTotal$!: Observable<number>;
  cartItems$!: Observable<CartItem[]>;
  saved$!: Observable<number>;
  showSaveSuccess = false;
  saveSuccessMessage = "";
  isSavingDraft = false;
  loadingMessage = "Saving your order...";

  showErrorAlert = false;
  errorMessages: string[] = [];

  selectedShipping: "standard" | "express" | "free" = "standard";
  deliveryFee = 0;
  orderThreshold = 0;
  constructor(
    private store: Store,
    private orderService: OrderService,
    private sellerService: SellerService,
    private auth: AuthService,
    private router: Router,
    private drawer: DrawerService,
  ) {
    this.cartPricing$ = this.store.select(selectCartPricing);

    this.cartTotal$ = this.store.select(selectCartTotal);
    this.cartItems$ = this.store.select(selectCartItems);

    this.deliveryFee = this.sellerService.getDeliveryFee();
    this.orderThreshold = this.sellerService.getOrderThreshold();

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
  }

  ngOnInit(): void {
    this.checkLogin();
    this.cartTotal$.pipe(take(1)).subscribe((total) => {
      if (total >= 300) this.onShippingChange("free");
      else this.onShippingChange("standard");
    });
  }

  getFinalTotal(subtotal: number | null): number {
    const total = subtotal || 0;
    return total < this.orderThreshold ? total + this.deliveryFee : total;
  }

  checkLogin() {
    const token = this.auth.isLoggedIn();

    console.log("isLoggedIn() =>", token);
    console.log("typeof =>", typeof token);

    this.isLoggedInUser = !!token;

    console.log("isLoggedInUser =>", this.isLoggedInUser);
  }
  onProceed() {
    this.proceed.emit();
  }
  continueShopping() {
    const source = sessionStorage.getItem("cart_source");
    console.log("Source: ", source);

    if (source === "order-history") {
      sessionStorage.removeItem("cart_source");

      this.drawer.close(); // close drawer first
      this.router.navigate(["/"]);

      return;
    } else {
      if (source === null) this.drawer.close();
    }

    this.continue.emit();
  }

  onShippingChange(kind: "standard" | "express" | "free") {
    this.selectedShipping = kind;

    const price = kind === "standard" ? 4.99 : kind === "express" ? 12.99 : 0;

    this.store.dispatch(
      CartActions.updatePricing({
        pricing: {
          shippingPrice: price,
        },
      }),
    );
  }

  onProceedDraft() {
    let items: any[] = [];

    try {
      const cartData = localStorage.getItem("cart");

      if (cartData) {
        const parsed = JSON.parse(cartData);
        items = parsed?.items || [];
      }
    } catch (e) {
      console.error("Cart read error", e);
      return;
    }

    const normalizePropertyAttributes = (
      props: any = {},
    ): Record<string, string> => {
      const normalized: Record<string, string> = {};

      Object.keys(props).forEach((key) => {
        const value = props[key];

        if (Array.isArray(value)) {
          normalized[key] = JSON.stringify(value);
        } else if (typeof value === "object" && value !== null) {
          normalized[key] = JSON.stringify(value);
        } else {
          normalized[key] = value ?? "";
        }
      });

      return normalized;
    };

    const inventory = items.map((it: any) => {
      const item = it.item || {};
      console.log("Each item : ", item);

      return {
        _id: item.inventoryId || item.inv_id || "",

        uniqueID: item.uniqueID || "",

        companyid: item.sellerid || this.sellerService.getSellerId(),

        flag: it?.isService ? "isService" : null,

        productid: item.ProductId || it.productId,

        defaultImage: item.Image || it.imageUrl || "",

        productname: item.ProductName || it.title || "",

        CGST: 0,
        SGST: 0,

        gst: item.DiscountPercent || "0%",

        discount_percentage: item.DiscountPercent || "0",

        batch_StringID: item.Batch_Id || item.batch_id || "",

        batch_id: it?.selectedVariant
          ? it.selectedVariant.variantsid
          : item.Batch_Id || item.batch_id || "",

        batchid: null,

        available_properties: it.available_properties || [],

        propertyAttributes: normalizePropertyAttributes(
          it.propertyAttributes || {},
        ),

        variantBatches: it?.selectedVariant
          ? [
              {
                _id: it.selectedVariant?.variantsid || "",

                variantName: it.selectedVariant?.variantsName || "",

                seller_price: Number(it.selectedVariant?.SellingPrice || 0),

                offerPrice: Number(it.selectedVariant?.OfferPrice || 0),

                active: true,

                version: 1,
              },
            ]
          : null,

        servicename: "",

        servicecost: 0,

        version: 1,

        sellerprice: item.SellingPrice || item.sellerPrice || it.dealPrice || 0,

        offerPrice: Number(
          item?.offerPrice || item?.OfferPrice || item?.price || 0,
        ),

        procurement_price: 0,

        Order_quantity: it.quantity || 1,

        sellerstock: item.AvilableQty || 0,

        remaining_quantity: (item.AvilableQty || 0) - (it.quantity || 0),

        message: item.StockStatus || "In Stock",
      };
    });

    const totalAmount = inventory.reduce(
      (sum: number, item: any) =>
        sum + Number(item.offerPrice) > 0
          ? Number(item.offerPrice) * item.Order_quantity
          : Number(item.sellerprice) * item.Order_quantity,
      0,
    );

    const currentUser = this.auth.user();
    const exist_Draft_saveID = sessionStorage.getItem("Draft_save_id") ?? null;
    console.log("Exist save Draft ID : ", exist_Draft_saveID);

    console.log("Current User =>", currentUser);
    console.log("Buyer ID =>", currentUser?.id);

    const payload = {
      companyid: this.sellerService.getSellerId(),

      userFolder: "ORDERS_2026",

      refno: null,

      orderStatus: this.isLoggedInUser ? "WEB LogUser" : "WEB Guest",

      buyerid: currentUser?.id || null,

      save_id: exist_Draft_saveID,

      inventory,

      isgst: "false",

      ispriceInclusive: "false",

      payment_mode: "UPI",

      deliveryDueDate: new Date().toISOString().split("T")[0],

      isDelivered: false,

      paymentsDTO: {
        total_amount: totalAmount,

        paid_amount: 0,

        payment_amount: 0,

        payment_mode: "Draft",

        current_amount: 0,

        discount: 0,

        current_installments: 1,

        isEMI: false,

        isAdvance: false,

        advanceAmt: 0,

        amountDue: totalAmount,

        outsanding_amount: totalAmount,

        payment_date: new Date().toISOString().split("T")[0],

        no_of_installments: 0,

        paymentMode: "UPI",
      },

      customerInformationDTO: {},

      address: "",

      delivery_mode: "",
    };

    console.log("Draft Payload =>", payload);

    this.isSavingDraft = true;
    this.loadingMessage = "Saving your order...";

    if (this.auth.isLoggedIn()) {
      this.orderService.draftOrder(payload).subscribe({
        next: (res: any) => {
          console.log("Draft Created =>", res);

          this.isSavingDraft = false;

          // Backend validation errors
          if (res?.errorMessages?.length) {
            this.errorMessages = res.errorMessages;
            this.showErrorAlert = true;

            setTimeout(() => {
              this.showErrorAlert = false;
            }, 5000);

            return;
          }

          if (res?.saveid) {
            sessionStorage.setItem("Draft_save_id", res.saveid);
          }

          this.saveSuccessMessage = "✅ Order saved successfully!";
          this.showSaveSuccess = true;

          setTimeout(() => {
            this.showSaveSuccess = false;
          }, 3000);
        },

        error: (err) => {
          this.isSavingDraft = false;

          console.error(err);

          this.errorMessages = ["Unable to save order. Please try again."];
          this.showErrorAlert = true;

          setTimeout(() => {
            this.showErrorAlert = false;
          }, 5000);
        },
      });
    }
  }
}
