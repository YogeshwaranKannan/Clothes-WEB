import { Component, inject, ChangeDetectorRef, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { FormsModule } from "@angular/forms";
import { Store } from "@ngrx/store";
import * as CartActions from "../../common/models/cart/cart.actions";
import { Observable, map, switchMap } from "rxjs";
import { Order as CommonOrder } from "../../common/models/orders.model";
import { OrderService } from "../../common/services/orders.service";
import { Router, RouterModule } from "@angular/router";
import { CheckoutValidationService } from "../services/checkout-validation.service";
// import { selectCartTotal } from "../../common/models/cart/cart.selectors";
import { TermsConditionsComponent } from "../terms-conditions/terms-conditions.component";
import { PrivacyPolicyComponent } from "../privacy-policy/privacy-policy.component";
import { Output, EventEmitter } from "@angular/core";
import { SellerService } from "../../common/services/SellerService";
import { companyname } from "../../common/utils/constant";
import { AuthService } from "../../core/auth/auth.service";
import {
  selectCartFinalTotal,
  selectRedeemPoints,
} from "../../common/models/cart/cart.selectors";
import { CartState } from "../../common/models/cart/cart-state.model";
import { LoadingScreenComponent } from "../../common/components/loading-screen/loading-screen.component";
import { DrawerService } from "../../common/components/drawer/drawer.service";
import { CustomerInformationComponent } from "../customer-information/customer-information.component";

@Component({
  selector: "app-review-place-order",
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    TermsConditionsComponent,
    PrivacyPolicyComponent,
    LoadingScreenComponent,
  ],

  templateUrl: "./review-place-order.component.html",
  styleUrls: ["./review-place-order.component.scss"],
})
export class ReviewPlaceOrderComponent {
  // @Output() orderPlaced = new EventEmitter<string>();
  @Output() orderPlaced = new EventEmitter<any>();
  @Output() openCustomerInformation = new EventEmitter<void>();
  reviewForm: FormGroup;

  review = {
    agreeToTerms: false,
  };
  orderRefNo: string = "";
  save_id: string = "";
  isError: boolean = false;
  orderTotalAmount = 0;

  // bind pricing from store
  cartFinalTotal$!: Observable<number | undefined>;

  // expose final total for template async use
  finalTotal$!: Observable<number | undefined>;
  isLoggedInUser = false;

  finalAmount = 0;
  redeemedPoints = 0;

  rewardConfig = {
    RedeeemAmount: 0,

    RedeemPoints: 0,
    RewardAmount: 0,
    RewardPoints: 0,
  };

  private pendingBuyerOrder: {
    mobileNum: string;
    payload: any;
    selectedPaymentMode: string;
    newTab: Window | null;
  } | null = null;

  private buyerExistCheckDone = false;

  isBuyerMessageModalOpen = false;
  buyerMessage = "";
  paymentMode$!: Observable<string | null>;

  deliveryFee = 0;
  orderThreshold = 0;
  subtotalAmount = 0;
  constructor(
    private fb: FormBuilder,
    private checkoutValidationService: CheckoutValidationService,
    private orderService: OrderService,
    private drawer: DrawerService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private sellerService: SellerService,
    private auth: AuthService,
  ) {
    this.checkLogin();
    // initialize store-backed observables (show cart subtotal as final total placeholder)
    // this.cartFinalTotal$ = this.store.select(selectCartTotal);

    this.deliveryFee = this.sellerService.getDeliveryFee();
    this.orderThreshold = this.sellerService.getOrderThreshold();
    this.rewardConfig = this.sellerService.getRewardConfig();
    console.log("Reward Config in Place order:", this.rewardConfig);
    this.paymentMode$ = this.checkoutValidationService.paymentMode$;

    this.store.select(selectRedeemPoints).subscribe((points) => {
      this.redeemedPoints = points || 0;
    });

    this.reviewForm = this.fb.group({
      agreeToTerms: [false, [Validators.requiredTrue]],
    });
    this.cartFinalTotal$ = this.store.select(selectCartFinalTotal);

    this.cartFinalTotal$.subscribe((total) => {
      this.finalAmount = total ?? 0;
    });

    // console.log("Total Amount : ", this.finalAmount);
    // console.log("Total cartFinalTotal : ", this.cartFinalTotal$);
  }

  checkLogin() {
    const token = this.auth.isLoggedIn();

    this.isLoggedInUser = !!token;
  }

  // NgRx store using functional inject() as requested
  private store = inject(Store<{ cart: CartState }>);

  // UI error message shown when submission fails
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // modal state
  isModalOpen = false;
  modalTitle = "";
  // which component to render inside modal: 'privacy' | 'terms' | ''
  modalComponent: "privacy" | "terms" | "" = "";

  // submission UI state
  isSubmitting = false;
  submitSpinner = false;

  openModal(title: string, type: "privacy" | "terms") {
    this.modalTitle = title;
    this.modalComponent = type;
    this.isModalOpen = true;
  }

  acceptModal() {
    this.isModalOpen = false;
    this.modalComponent = "";
    this.reviewForm.get("agreeToTerms")?.setValue(true);
    this.cleanupBootstrapBackdrop();
  }

  cancelModal() {
    this.isModalOpen = false;
    this.modalComponent = "";
    this.reviewForm.get("agreeToTerms")?.setValue(false);
    this.cleanupBootstrapBackdrop();
  }

  private cleanupBootstrapBackdrop() {
    try {
      // remove modal-open class from body (in case Bootstrap JS added it)
      document.body.classList.remove("modal-open");
      // remove any lingering backdrop elements
      const backdrops = Array.from(
        document.querySelectorAll(".modal-backdrop"),
      );
      backdrops.forEach((b) => b.parentElement?.removeChild(b));
    } catch (e) {
      // ignore in server-side or restricted environments
    }
  }
  get rewardsEarned(): number {
    return this.rewardConfig.RewardAmount > 0
      ? Math.floor(
          (this.finalAmount / this.rewardConfig.RewardAmount) *
            this.rewardConfig.RewardPoints,
        )
      : 0;
  }

  getButtonText() {
    const paymentComponent =
      this.checkoutValidationService.getPaymentComponent();

    const paymentMode = paymentComponent?.getSelectedPaymentMode();

    if (paymentMode === "UPI" || paymentMode === "COD") {
      return "Submit";
    }

    return "Place Order";
  }

  checkoutButtonAction() {
    const paymentComponent =
      this.checkoutValidationService.getPaymentComponent();

    const paymentMode = paymentComponent?.getSelectedPaymentMode();

    // UPI
    if (paymentMode === "UPI") {
      this.openUPIModal();
      return;
    }

    // COD
    if (paymentMode === "COD") {
      this.onPlaceOrder();
      return;
    }

    // Razorpay
    this.onPlaceOrder();
  }

  showUPIModal = false;
  upiQrImage = "";

  openUPIModal() {
    const sellerDetails = this.sellerService.getSellerPaymentDetails();

    const upiId = sellerDetails?.upi_Id;

    const upiString = `upi://pay?pa=${upiId}&pn=${companyname}&am=${this.finalAmount}&cu=INR`;

    this.upiQrImage =
      "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" +
      encodeURIComponent(upiString);

    this.showUPIModal = true;
  }

  closeUPIModal() {
    if (
      !window.confirm("Are you sure you want to close the QR payment window?")
    ) {
      return;
    }

    this.showUPIModal = false;
  }

  submitUPIPayment() {
    this.showUPIModal = false;
    this.onPlaceOrder();
  }

  /**
   * Opens the pre-created blank tab (opened synchronously on click, before any
   * async work) to the online-payment link, or falls back to a same-tab
   * redirect if the popup was blocked anyway.
   */
  /**
   * Navigates an already-open blank tab to the seller's online payment URL.
   * Returns true if the redirect succeeded, false if the URL wasn't configured
   * (in which case the tab is closed and errorMessage is set).
   */
  private redirectToOnlinePayment(newTab: Window | null): boolean {
    const paymentDetails = this.sellerService.getSellerPaymentDetails();

    const url = paymentDetails?.pay_Online_Link?.trim();
    console.log("review-place-order.component>redirectToOnlinePayment", url);
    // No payment URL configured
    if (!url) {
      console.error("Online payment link is not configured.");

      if (newTab && !newTab.closed) {
        newTab.close();
      }

      this.errorMessage =
        "Online payment link is not configured. Please contact the seller.";

      return false;
    }

    console.log("Online Payment URL:", url);

    if (newTab && !newTab.closed) {
      newTab.location.href = url;
    } else {
      // Fallback if no tab exists (e.g. popup was blocked earlier)
      window.location.href = url;
    }

    return true;
  }

  private generateTokenAndPlaceOrder(
    mobileNum: string,
    payload: any,
    selectedPaymentMode: string,
    newTab: Window | null = null,
  ): void {
    console.log("Generating token for:", mobileNum);

    this.auth
      .getOrGenerateToken(mobileNum)
      .pipe(
        switchMap((tokenRes: any) => {
          console.log("Generated Token:", tokenRes);

          this.auth.setAccessToken(tokenRes.token);

          console.log("Stored Token:", localStorage.getItem("token"));

          return this.orderService.placeOrder(payload);
        }),
      )
      .subscribe({
        next: (res: any) => {
          console.log("Place Order Response:", res);

          this.orderRefNo = res.refno;

          sessionStorage.setItem("Save_id", res?.saveid);

          if (res?.errorMessages?.length) {
            if (newTab && !newTab.closed) newTab.close();

            alert(`Action Required\n\n${res.errorMessages.join("\n")}`);

            this.isSubmitting = false;
            this.submitSpinner = false;

            return;
          }

          if (res?.message !== "success") {
            if (newTab && !newTab.closed) newTab.close();

            this.errorMessage =
              res?.message ||
              "Unable to create payment order. Please try again.";

            this.isSubmitting = false;
            this.submitSpinner = false;

            return;
          }

          // if (
          //   res?.message === "success" &&
          //   res?.razorStatus === "created" &&
          //   selectedPaymentMode === "RAZORPAY"
          // ) {
          //   if (newTab && !newTab.closed) newTab.close();
          //   this.openRazorpay(res);
          //   return;
          // }

          // ==========================================================
          // ONLINE PAYMENT — order placed with NO error → redirect the
          // pre-opened tab to the real payment URL now.
          // ==========================================================
          if (
            res?.message === "success" &&
            selectedPaymentMode === "ONLINEPAYMENT"
          ) {
            this.isSubmitting = false;
            this.submitSpinner = false;

            const redirected = this.redirectToOnlinePayment(newTab);

            if (!redirected) {
              return;
            }

            // Payment tab is now navigating. DO NOT close it.
            // return;
          }

          if (res?.message === "success") {
            this.drawer.setOrderPlaced(true);

            const customerForm =
              this.checkoutValidationService.getForm("customer");

            const saveId =
              sessionStorage.getItem("Save_id") ?? res?.saveid ?? "";

            this.orderService
              .sendOrderConfirmation({
                to: customerForm?.value.phone,

                customerName:
                  `${customerForm?.value.customerName || ""}`.trim(),

                companyName: companyname,

                orderValue: this.orderTotalAmount,

                companyDisplayName: companyname,

                save_id: saveId,

                supportNumber: this.sellerService.getCompanyMobile(),
              })
              .subscribe({
                next: (response) => {
                  console.log("Order confirmation sent:", response);
                },

                error: (error) => {
                  console.log("Failed to send order confirmation", error);
                },
              });

            console.log("this.orderRefNo : ", this.orderRefNo);

            this.store.dispatch(CartActions.clearCart());

            const earnedPoints =
              this.rewardConfig.RewardAmount > 0
                ? Math.floor(
                    (this.orderTotalAmount / this.rewardConfig.RewardAmount) *
                      this.rewardConfig.RewardPoints,
                  )
                : 0;

            console.log("Reward Calculation:", {
              total: this.orderTotalAmount,
              rewardAmount: this.rewardConfig.RewardAmount,
              rewardPoints: this.rewardConfig.RewardPoints,
              earnedPoints,
            });

            this.isSubmitting = false;
            this.submitSpinner = false;

            sessionStorage.removeItem("customer_form");

            this.orderPlaced.emit({
              refno: this.orderRefNo,

              rewardsEarned: this.auth.isLoggedIn() ? earnedPoints : null,
            });

            sessionStorage.removeItem("Save_id");
            sessionStorage.removeItem("Draft_save_id");

            this.auth.refreshProfile();
          }

          this.isSubmitting = false;
          this.submitSpinner = false;
        },

        error: (err) => {
          console.error("Token generation / order placement failed:", err);

          if (newTab && !newTab.closed) newTab.close();

          this.errorMessage = "Unable to generate token or place order";

          this.isSubmitting = false;
          this.submitSpinner = false;
        },
      });
  }

  openInNewTab(route: string): void {
    const cleanCompany = companyname.replace(/^\/+|\/+$/g, "");
    const cleanRoute = route.replace(/^\/+/, "");

    const url = `${window.location.origin}/${cleanCompany}/${cleanRoute}`;

    console.log("Opening:", url);

    window.open(url, "_blank");
  }

  onPlaceOrder(): void {
    // ============================================================
    // 1. VALIDATE
    // ============================================================
    const allValid = this.checkoutValidationService.validateAll();

    if (!allValid || this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();

      const customerForm = this.checkoutValidationService.getForm("customer");

      if (customerForm?.invalid) {
        customerForm.markAllAsTouched();

        // Tell the parent to open Customer Information
        this.openCustomerInformation.emit();

        return;
      }

      // Other errors such as payment / terms
      this.scrollToFirstError();

      return;
    }

    // ============================================================
    // 2. CUSTOMER FORM
    // ============================================================
    const customerForm = this.checkoutValidationService.getForm("customer");

    if (!customerForm) {
      this.errorMessage = "Checkout forms are not available";
      return;
    }

    // ============================================================
    // 3. PAYMENT MODE
    // ============================================================
    const paymentComponent =
      this.checkoutValidationService.getPaymentComponent();

    const selectedPaymentMode = paymentComponent?.getSelectedPaymentMode();

    console.log("Selected Payment Mode:", selectedPaymentMode);

    if (!selectedPaymentMode) {
      alert("Please select a payment mode.");
      return;
    }

    // ============================================================
    // 4. PRE-OPEN BLANK TAB FOR ONLINE PAYMENT (must happen
    // synchronously, inside this click handler, or the browser's
    // popup blocker will intercept it later).
    // ============================================================
    let newTab: Window | null = null;

    if (selectedPaymentMode === "ONLINEPAYMENT") {
      newTab = window.open("", "_blank");

      if (!newTab) {
        alert(
          "Payment window was blocked by your browser. Please allow pop-ups and try again.",
        );
        return;
      }

      newTab.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Processing Payment</title>
          <style>
            body {
              margin: 0;
              height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              font-family: Arial, sans-serif;
              background: #f8fafc;
              color: #1e293b;
            }
            .container { text-align: center; }
            .loader {
              width: 42px;
              height: 42px;
              border: 4px solid #e2e8f0;
              border-top: 4px solid #2563eb;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 0 auto 20px;
            }
            @keyframes spin { 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="loader"></div>
            <h3>Processing your payment...</h3>
            <p>Please wait while we redirect you.</p>
          </div>
        </body>
        </html>
      `);

      newTab.document.close();
    }

    const closePaymentTab = () => {
      if (newTab && !newTab.closed) {
        newTab.close();
      }

      newTab = null;
    };

    // ============================================================
    // 6. READ CART
    // ============================================================
    let items: any[] = [];

    try {
      const cartData = localStorage.getItem("cart");

      if (cartData) {
        const parsed = JSON.parse(cartData);
        items = parsed?.items || [];
      }
    } catch (e) {
      console.error("Could not read cart items:", e);

      this.errorMessage = "Could not read cart items";

      closePaymentTab();
      return;
    }

    console.log("Cart items for payload: ", items);

    // ============================================================
    // 7. NORMALIZE PROPERTY ATTRIBUTES
    // ============================================================
    type PropertyDefinition = {
      name: string;
      type?: string;
      value?: any;
    };

    type PropertyAttributes = Record<string, any>;

    const normalizePropertyAttributes = (
      props: PropertyAttributes = {},
      propertyDefinitions: PropertyDefinition[] = [],
    ): Record<string, string> => {
      const normalized: Record<string, string> = {};

      Object.keys(props).forEach((key: string) => {
        const value = props[key];

        const attrDef = propertyDefinitions.find(
          (attr: PropertyDefinition) => attr.name === key,
        );

        if (attrDef?.type?.toLowerCase() === "image") {
          normalized[key] =
            typeof value === "object" && value?.base64
              ? value.base64
              : typeof value === "string"
                ? value
                : "";
        } else if (Array.isArray(value)) {
          normalized[key] = JSON.stringify(value);
        } else if (typeof value === "object" && value !== null) {
          normalized[key] = JSON.stringify(value);
        } else {
          normalized[key] = value ?? "";
        }
      });

      return normalized;
    };

    // ============================================================
    // 8. BUILD INVENTORY
    // ============================================================
    const inventory = items.map((it: any) => {
      const item = it.item || {};

      return {
        _id: item.inventoryId || item.inv_id || "",
        uniqueID: item.uniqueID || "",
        companyid: item.sellerid || this.sellerService.getSellerId(),
        flag: it?.isService ? "isService" : null,
        productid: item.ProductId || it.productId || "",
        defaultImage: item.Image || it.imageUrl || "",
        productname: item.ProductName || it.title || "",
        CGST: 0,
        SGST: 0,
        gst: item.DiscountPercent || "0%",
        discount_percentage: item.DiscountPercent || "0",
        batch_StringID: item.batch_id || item.Batch_Id || "",
        batch_id: it?.selectedVariant
          ? it.selectedVariant.variantsid
          : item.batch_id || item.Batch_Id || "",
        batchid: null,
        propertyAttributes: normalizePropertyAttributes(
          it?.propertyAttributes,
          it?.available_properties,
        ),
        available_properties: it?.available_properties || [],
        variantBatches: it?.selectedVariant
          ? [
              {
                _id: it.selectedVariant?.variantsid || "",
                variantName: it.selectedVariant?.variantsName || "",
                seller_price: Number(it.selectedVariant?.SellingPrice || 0),
                offerPrice: Number(it.selectedVariant?.OfferPrice || 0),
                discount: Number(it.selectedVariant?.DiscountPercent || 0),
                productid: item.ProductId || it.productId || "",
                companyid: item.sellerid || this.sellerService.getSellerId(),
                productname: item.ProductName || it.title || "",
                active: true,
                version: 1,
                unit: it.selectedVariant?.unit || item.unit || "",
                batch_unit:
                  it.selectedVariant?.batch_unit || item.batch_unit || "",
                batch_expiryDate:
                  it.selectedVariant?.batch_expiryDate ||
                  item.batch_expiryDate ||
                  "",
              },
            ]
          : null,
        servicename: "",
        servicecost: 0,
        version: 1,
        sellerprice: it.mrp || item.SellingPrice || 0,
        offerPrice: parseFloat(
          it.dealPrice ?? item?.OfferPrice ?? item.dealPrice ?? 0,
        ),
        procurement_price: 0,
        Order_quantity: it.quantity || 1,
        sellerstock: item.AvilableQty || 0,
        remaining_quantity: (item.AvilableQty || 0) - (it.quantity || 0),
        message: item.StockStatus || "In stock",
      };
    });

    console.log("Formatted inventory for payload: ", inventory);

    // ============================================================
    // 9. TOTAL
    // ============================================================
    const totalAmount = this.finalAmount;

    this.orderTotalAmount = totalAmount;

    // ============================================================
    // 10. USER
    // ============================================================
    const currentUser = this.auth.user();

    const existingSaveId =
      sessionStorage.getItem("Save_id") ||
      sessionStorage.getItem("Draft_save_id");

    // ============================================================
    // 11. ADDRESS
    // ============================================================
    const isPickup = customerForm.value.deliveryMode === "PICKUP";

    const parsePickupAddressLabel = (
      label: string,
    ): {
      street: string;
      city: string;
      postalCode: string;
      state: string;
    } => {
      const fallback = {
        street: label || "",
        city: "",
        postalCode: "",
        state: "",
      };

      if (!label) {
        return fallback;
      }

      const dashMatch = label.match(/^(.*?)\s*-\s*(\d{4,6})\s*$/);

      const beforeDash = dashMatch ? dashMatch[1].trim() : label.trim();

      const postalCode = dashMatch ? dashMatch[2].trim() : "";

      const segments = beforeDash
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (segments.length === 0) {
        return {
          ...fallback,
          postalCode,
        };
      }

      const city = segments[segments.length - 1];

      const street = segments.slice(0, -1).join(", ");

      return {
        street,
        city,
        postalCode,
        state: "",
      };
    };

    const pickupAddress = isPickup
      ? parsePickupAddressLabel(customerForm.value.selectedAddressLabel)
      : null;

    // ============================================================
    // 12. PAYLOAD
    // ============================================================
    const payload = {
      companyid: this.sellerService.getSellerId(),
      userFolder: "ORDERS_2026",
      refno: null,
      orderStatus: this.isLoggedInUser ? "WEB LogUser" : "WEB Guest",
      buyerid: currentUser?.id ?? null,
      save_id: existingSaveId ?? null,
      inventory,
      isgst: "false",
      ispriceInclusive: "false",
      payment_mode: selectedPaymentMode,
      deliveryDueDate: new Date().toISOString().split("T")[0],
      isDelivered: false,
      rewards: {
        RewardsEarned:
          this.rewardConfig.RewardAmount > 0
            ? Math.floor(
                (totalAmount / this.rewardConfig.RewardAmount) *
                  this.rewardConfig.RewardPoints,
              )
            : 0,
        rewardsRedeemed: this.redeemedPoints,
      },
      sellerConfigRewards: this.sellerService.getRewardConfig(),
      deliveryFee: Number(this.sellerService.getDeliveryFee() || 0),
      orderThreshold: Number(this.sellerService.getOrderThreshold() || 0),
      paymentsDTO: {
        total_amount: totalAmount,
        paid_amount: selectedPaymentMode === "RAZORPAY" ? totalAmount : 0,
        payment_amount: selectedPaymentMode === "RAZORPAY" ? totalAmount : 0,
        payment_mode: selectedPaymentMode,
        current_amount: selectedPaymentMode === "RAZORPAY" ? totalAmount : 0,
        discount: 0,
        current_installments: 1,
        isEMI: false,
        isAdvance: false,
        advanceAmt: 0,
        amountDue: selectedPaymentMode === "RAZORPAY" ? 0 : totalAmount,
        outsanding_amount: 0,
        payment_date: new Date().toISOString().split("T")[0],
        no_of_installments: 0,
        next_payment_due: new Date().toISOString().split("T")[0],
      },
      customerInformationDTO: {
        customerName: `${customerForm?.value.customerName || ""}`.trim(),
        customerMobileNum: customerForm.value.phone,
        deliveryAddress: isPickup
          ? customerForm.value.selectedAddressLabel
          : customerForm.value.streetAddress,
        city: isPickup ? pickupAddress?.city || "" : customerForm.value.city,
        postalCode: isPickup
          ? pickupAddress?.postalCode || ""
          : customerForm.value.zipCode,
        state: isPickup ? pickupAddress?.state || "" : customerForm.value.state,
        email: customerForm.value.email,
      },
      address: isPickup
        ? customerForm.value.selectedAddressLabel
        : customerForm.value.streetAddress,
      delivery_mode: isPickup ? "Store Pickup" : "Home Delivery",
    };

    // ============================================================
    // 13. LOADING
    // ============================================================
    this.errorMessage = null;
    this.isSubmitting = true;
    this.submitSpinner = true;

    const mobileNum =
      currentUser?.phone ||
      customerForm.value.mobileNum ||
      payload.customerInformationDTO.customerMobileNum;

    const existingToken = this.auth.isLoggedIn();

    // ============================================================
    // 14. PLACE ORDER RESPONSE HANDLER
    // ============================================================
    const handlePlaceOrderResponse = (res: any) => {
      console.log("Place Order Response:", res);

      // ----------------------------------------------------------
      // ERROR FROM BACKEND
      // ----------------------------------------------------------
      if (res?.errorMessages?.length) {
        closePaymentTab();

        alert(`Action Required\n\n${res.errorMessages.join("\n")}`);

        this.isSubmitting = false;
        this.submitSpinner = false;

        return;
      }

      // ----------------------------------------------------------
      // FAILED RESPONSE
      // ----------------------------------------------------------
      if (res?.message !== "success") {
        closePaymentTab();

        this.errorMessage =
          res?.message || "Unable to create order. Please try again.";

        this.isSubmitting = false;
        this.submitSpinner = false;

        return;
      }

      // ==========================================================
      // ORDER SUCCESS
      // ==========================================================
      this.orderRefNo = res?.refno;

      if (res?.saveid) {
        sessionStorage.setItem("Save_id", res.saveid);
      }

      // ==========================================================
      // ONLINE PAYMENT — order placed, NO errors → redirect the
      // pre-opened tab to the real payment URL now.
      // ==========================================================
      if (selectedPaymentMode === "ONLINEPAYMENT") {
        this.isSubmitting = false;
        this.submitSpinner = false;

        const redirected = this.redirectToOnlinePayment(newTab);

        if (!redirected) {
          return;
        }

        // Payment tab is now navigating to the real URL. Do not close it.
        // return;
      }

      // ==========================================================
      // RAZORPAY
      // ==========================================================
      // if (
      //   selectedPaymentMode === "RAZORPAY" &&
      //   res?.razorStatus === "created"
      // ) {
      //   closePaymentTab();

      //   this.isSubmitting = false;
      //   this.submitSpinner = false;

      //   this.openRazorpay(res);

      //   return;
      // }

      // ==========================================================
      // OTHER PAYMENT MODES
      // ==========================================================
      if (
        selectedPaymentMode !== "ONLINEPAYMENT" &&
        selectedPaymentMode !== "RAZORPAY"
      ) {
        closePaymentTab();
      }

      // ==========================================================
      // ORDER SUCCESS FLOW
      // ==========================================================
      this.drawer.setOrderPlaced(true);

      const saveId = sessionStorage.getItem("Save_id") ?? res?.saveid ?? "";

      this.orderService
        .sendOrderConfirmation({
          to: customerForm?.value.phone,
          customerName: `${customerForm?.value.customerName || ""}`.trim(),
          companyName: companyname,
          orderValue: this.orderTotalAmount,
          companyDisplayName: companyname,
          save_id: saveId,
          supportNumber: this.sellerService.getCompanyMobile(),
        })
        .subscribe({
          next: (response) => {
            console.log("Order confirmation sent:", response);
          },
          error: (error) => {
            console.log("Failed to send order confirmation", error);
          },
        });

      this.store.dispatch(CartActions.clearCart());

      const earnedPoints =
        this.rewardConfig.RewardAmount > 0
          ? Math.floor(
              (this.orderTotalAmount / this.rewardConfig.RewardAmount) *
                this.rewardConfig.RewardPoints,
            )
          : 0;

      this.isSubmitting = false;
      this.submitSpinner = false;

      sessionStorage.removeItem("customer_form");

      this.orderPlaced.emit({
        refno: this.orderRefNo,
        rewardsEarned: this.auth.isLoggedIn() ? earnedPoints : null,
      });

      sessionStorage.removeItem("Save_id");
      sessionStorage.removeItem("Draft_save_id");

      this.auth.refreshProfile();
    };

    // ============================================================
    // 15. ACTUAL placeOrder() CALL
    // ============================================================
    const callPlaceOrder = () => {
      console.log("Calling placeOrder API...");

      this.orderService.placeOrder(payload).subscribe({
        next: (res: any) => {
          handlePlaceOrderResponse(res);
        },

        error: (err) => {
          console.error("Place Order Error:", err);

          // API ERROR → CLOSE BLANK TAB
          closePaymentTab();

          this.errorMessage = "Some issue while booking. Please try again!";

          this.isSubmitting = false;
          this.submitSpinner = false;
        },
      });
    };

    // ============================================================
    // 16. LOGGED-IN USER
    // ============================================================
    if (existingToken) {
      console.log("Logged in → Calling placeOrder");

      callPlaceOrder();

      return;
    }

    // ============================================================
    // 17. GUEST USER
    // ============================================================
    // console.log("Guest user → checking buyer");

    // if (!this.buyerExistCheckDone) {
    //   this.auth
    //     .searchBuyerExist(mobileNum, this.sellerService.getSellerId())
    //     .subscribe({
    //       next: (message: string | null) => {
    //         this.buyerExistCheckDone = true;

    //         if (message) {
    //           this.pendingBuyerOrder = {
    //             mobileNum,
    //             payload,
    //             selectedPaymentMode,
    //             newTab,
    //           };

    //           this.buyerMessage = message;
    //           this.isBuyerMessageModalOpen = true;

    //           this.isSubmitting = false;
    //           this.submitSpinner = false;

    //           return;
    //         }

    //         this.generateTokenAndPlaceOrder(
    //           mobileNum,
    //           payload,
    //           selectedPaymentMode,
    //           newTab,
    //         );
    //       },

    //       error: (err) => {
    //         console.error("SearchBuyerExist failed:", err);

    //         closePaymentTab();

    //         this.errorMessage =
    //           "Unable to check customer details. Please try again.";

    //         this.isSubmitting = false;
    //         this.submitSpinner = false;
    //       },
    //     });

    //   return;
    // }

    // ============================================================
    // 18. BUYER CHECK ALREADY DONE
    // ============================================================
    this.generateTokenAndPlaceOrder(
      mobileNum,
      payload,
      selectedPaymentMode,
      newTab,
    );
  }
  continueBuyerOrder(): void {
    if (!this.pendingBuyerOrder) {
      console.warn("No pending buyer order found.");
      return;
    }

    const { mobileNum, payload, selectedPaymentMode, newTab } =
      this.pendingBuyerOrder;

    // Close modal.
    this.isBuyerMessageModalOpen = false;
    this.buyerMessage = "";

    // Clear pending data.
    this.pendingBuyerOrder = null;

    // Start processing again.
    this.isSubmitting = true;
    this.submitSpinner = true;

    console.log("User selected Continue. Generating token...");

    this.generateTokenAndPlaceOrder(
      mobileNum,
      payload,
      selectedPaymentMode,
      newTab, // ← was missing, so it defaulted to null and fell into the same-tab fallback in redirectToOnlinePayment
    );
  }
  closeBuyerMessageModal(): void {
    this.isBuyerMessageModalOpen = false;
    this.buyerMessage = "";

    // Close the pending payment tab if user closes the modal.
    this.pendingBuyerOrder?.newTab?.close();

    this.pendingBuyerOrder = null;
  }

  loginFromBuyerMessage(): void {
    // Close modal first.
    this.isBuyerMessageModalOpen = false;

    // Close the blank payment tab because the order hasn't been placed.
    this.pendingBuyerOrder?.newTab?.close();

    this.pendingBuyerOrder = null;
    this.buyerMessage = "";

    this.drawer.close();

    // Navigate to login.
    this.router.navigate(["/login"]);
  }

  // private failedPaymentEvents = new Set<string>();

  // openRazorpay(res: any) {
  //   console.log(
  //     "Frontend Key:",
  //     this.sellerService.getSellerPaymentDetails().key,
  //   );
  //   console.log("Razorpay Order Id:", res.razorPayid);
  //   console.log("Razorpay Amount (paise):", res.amount);
  //   console.log("Razorpay Amount (INR):", res.amount / 100);
  //   console.log("Currency:", res.currency);

  //   const options: any = {
  //     key: this.sellerService.getSellerPaymentDetails().key,

  //     amount: res.amount,
  //     currency: res.currency || "INR",

  //     name: companyname,
  //     description: "Order Payment",

  //     order_id: res.razorPayid,

  //     handler: (response: any) => {
  //       console.log("Payment Success:", response);

  //       // if (this.isError === true) return;
  //       // this.isError = true;
  //       console.log("Save_id:", sessionStorage.getItem("Save_id"));
  //       this.verifyPayment({
  //         razorpay_order_id: response.razorpay_order_id,
  //         razorpay_payment_id: response.razorpay_payment_id,
  //         razorpay_signature: response.razorpay_signature,
  //         save_id: sessionStorage.getItem("Save_id"),
  //       });
  //     },

  //     prefill: {
  //       name: res.customerName || "",
  //       email: res.email || "",
  //       contact: res.customerMobile || "",
  //     },

  //     theme: {
  //       color: "#3399cc",
  //     },
  //     method: {
  //       upi: true,
  //       card: true,
  //     },
  //     modal: {
  //       ondismiss: () => {
  //         console.log("Razorpay closed manually");

  //         this.isSubmitting = false;
  //         this.submitSpinner = false;
  //       },
  //     },
  //   };

  //   const rzp = new (window as any).Razorpay(options);

  //   rzp.on("payment.failed", (response: any) => {
  //     console.log("Payment Failed:", response);

  //     const orderId = response.error.metadata.order_id;
  //     const paymentId = response.error.metadata.payment_id;

  //     // unique key for this failure attempt
  //     const failureKey = `${orderId}_${paymentId}_${response.error.code}`;

  //     // prevent same callback twice
  //     if (this.failedPaymentEvents.has(failureKey)) {
  //       console.log("Duplicate failure ignored:", failureKey);
  //       return;
  //     }

  //     // store this failure event
  //     this.failedPaymentEvents.add(failureKey);

  //     console.log("Saving payment failure");

  //     console.log("Error Code:", response.error.code);
  //     console.log("Description:", response.error.description);
  //     console.log("Reason:", response.error.reason);

  //     this.isSubmitting = false;
  //     this.submitSpinner = false;

  //     this.updatePaymentStatus(
  //       sessionStorage.getItem("Save_id"),
  //       null,
  //       response.error.code,
  //       response.error.description,
  //       response.error.reason,
  //       orderId,
  //       paymentId,
  //       res.amount,
  //       true,
  //     );
  //   });
  //   rzp.open();
  // }

  // verifyPayment(paymentData: any) {
  //   console.log("Verify payment is called");
  //   this.orderService.verifyPayment(paymentData).subscribe({
  //     next: (res: any) => {
  //       console.log("Payment Verified", res);

  //       if (res.success) {
  //         this.drawer.setOrderPlaced(true);
  //         // alert("Payment Successful ✅");

  //         //make otp send here

  //         const customerForm =
  //           this.checkoutValidationService.getForm("customer");

  //         const saveId = sessionStorage.getItem("Save_id") ?? res?.saveid ?? "";

  //         this.orderService
  //           .sendOrderConfirmation({
  //             to: customerForm?.value.phone,
  //             customerName:
  //               `${customerForm?.value.fullName || ""} ${customerForm?.value.lastName || ""}`.trim(),
  //             companyName: companyname,
  //             orderValue: this.orderTotalAmount,
  //             companyDisplayName: companyname,
  //             save_id: saveId,
  //             supportNumber: this.sellerService.getCompanyMobile(),
  //           })
  //           .subscribe({
  //             next: (response) => {
  //               console.log("Order confirmation sent:", response);
  //             },
  //             error: (error) => {
  //               console.log("Failed to send order confirmation", error);
  //             },
  //           });
  //         const paymentId = paymentData.razorpay_payment_id;

  //         console.log("this.orderRefNo : ", this.orderRefNo);
  //         // this.orderPlaced.emit(this.orderRefNo);

  //         this.store.dispatch(CartActions.clearCart());

  //         const earnedPoints =
  //           this.rewardConfig.RewardAmount > 0
  //             ? Math.floor(
  //                 (this.orderTotalAmount / this.rewardConfig.RewardAmount) *
  //                   this.rewardConfig.RewardPoints,
  //               )
  //             : 0;

  //         console.log("Reward Calculation:", {
  //           total: this.orderTotalAmount,
  //           rewardAmount: this.rewardConfig.RewardAmount,
  //           rewardPoints: this.rewardConfig.RewardPoints,
  //           earnedPoints,
  //         });
  //         this.isSubmitting = false;
  //         this.submitSpinner = false;
  //         sessionStorage.removeItem("customer_form");

  //         this.orderPlaced.emit({
  //           refno: this.orderRefNo,
  //           rewardsEarned: earnedPoints,
  //         });

  //         sessionStorage.removeItem("Save_id");
  //         sessionStorage.removeItem("Draft_save_id");

  //         // getBuyerDetails for RewardsPoint

  //         this.auth.refreshProfile();
  //       } else {
  //         alert("Payment Verification Failed ❌");
  //         this.isSubmitting = false;
  //         this.submitSpinner = false;
  //       }
  //     },

  //     error: (err) => {
  //       console.log("Verification Failed", err);
  //       alert("Something went wrong during verification ❌");
  //     },
  //   });
  // }

  // updatePaymentStatus(
  //   id: any,
  //   data: any,
  //   error_code: string,
  //   error_description: string,
  //   error_reason: string,
  //   order_id: string,
  //   payment_id: string,
  //   amount: number,
  //   isError: boolean,
  // ) {
  //   this.orderService
  //     .updateOrderStatus(
  //       id,
  //       data,
  //       error_code,
  //       error_description,
  //       error_reason,
  //       order_id,
  //       payment_id,
  //       amount,
  //       isError,
  //     )
  //     .subscribe({
  //       next: (res: any) => {
  //         console.log("Payment Verified", res);
  //       },

  //       error: (err: any) => {
  //         console.log("Verification Failed", err);

  //         alert("Something went wrong during verification ❌");
  //       },
  //     });
  // }

  /**
   * Find the first invalid control across the registered checkout forms (customer, shipping, payment)
   * and the local review form, scroll it into view smoothly and focus it.
   */
  scrollToFirstError(): void {
    // helper to focus and scroll an element
    const focusAndScroll = (el: Element | null) => {
      if (!el) return;
      try {
        (el as HTMLElement).scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        // focus after a short delay so browsers complete the scroll first
        setTimeout(() => {
          try {
            (el as HTMLElement).focus();
          } catch (e) {}
        }, 300);
      } catch (e) {
        // ignore
      }
    };

    // 1) Check the local review form (agreeToTerms) first
    if (this.reviewForm && this.reviewForm.invalid) {
      const el =
        document.getElementById("agreeToTerms") ||
        document.querySelector('[formcontrolname="agreeToTerms"]');
      focusAndScroll(el);
      return;
    }

    // 2) Check registered checkout forms in logical order
    const order = ["customer", "shipping", "payment"];
    for (const formName of order) {
      const fg = this.checkoutValidationService.getForm(formName);
      if (!fg) continue;
      const invalidControl = Object.keys(fg.controls).find(
        (c) => fg.get(c)?.invalid,
      );
      if (!invalidControl) continue;

      // Attempt to find the control element in the DOM by common selectors
      // Prefer formControlName attribute which Angular adds to inputs
      const selector = `[formcontrolname="${invalidControl}"]`;
      let el = document.querySelector(selector) as Element | null;
      if (!el) {
        el = document.querySelector(
          `[name="${invalidControl}"]`,
        ) as Element | null;
      }
      if (!el) {
        el = document.getElementById(invalidControl) as Element | null;
      }

      focusAndScroll(el);
      return;
    }
  }

  closeDrawer() {
    this.drawer.close();
  }
}
