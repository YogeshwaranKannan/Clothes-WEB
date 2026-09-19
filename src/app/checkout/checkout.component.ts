import { Component, Input, ViewChild } from "@angular/core";
import { CommonModule } from "@angular/common";
import { CustomerInformationComponent } from "./customer-information/customer-information.component";
import { ReviewPlaceOrderComponent } from "./review-place-order/review-place-order.component";
import { OrderSummaryComponent } from "./order-summary/order-summary.component";
import { OrderService } from "../common/services/orders.service";
import { OrderDetailComponent } from "../order-detail/order-detail.component";
import { ActivatedRoute, Router } from "@angular/router";
import { DrawerService } from "../common/components/drawer/drawer.service";
import { SellerService } from "../common/services/SellerService";
import { PaymentComponent } from "./paymentOptions/payment.component";
import { AuthService } from "../core/auth/auth.service";
import { companyname } from "../common/utils/constant";

@Component({
  selector: "app-checkout",
  standalone: true,
  imports: [
    CommonModule,
    CustomerInformationComponent,
    ReviewPlaceOrderComponent,
    OrderSummaryComponent,
    PaymentComponent,
    OrderDetailComponent,
  ],
  templateUrl: "./checkout.component.html",
  styleUrls: ["./checkout.component.scss"],
})
export class CheckoutComponent {
  isOrderPlaced = false;
  orderRefNo: string = "";
  companyid = "";
  selectedRefNo: string | null = null;
  @Input() refNo: string | null = null;
  rewardsEarned = 0;
  isLoggedIn = false;
  autoClickTimeout: any;

  @ViewChild(CustomerInformationComponent)
  customerInformationComponent?: CustomerInformationComponent;

  // ✅ Inject service properly
  constructor(
    private orderService: OrderService,
    private auth: AuthService,
    private drawerService: DrawerService,
    private sellerService: SellerService,
    private router: Router,
  ) {}
  ngOnInit() {
    // ✅ direct input (MOST RELIABLE)
    this.isLoggedIn = this.auth.isLoggedIn();
    this.drawerService.setOrderPlaced(false);
    if (this.refNo) {
      this.handleRef(this.refNo);
    }

    // ✅ fallback (service)
    this.drawerService.refNoChanges.subscribe((ref) => {
      if (ref) {
        this.handleRef(ref);
      }
    });
  }
  openCustomerInformation(): void {
    this.customerInformationComponent?.open();

    setTimeout(() => {
      this.scrollToCustomerError();
    }, 100);
  }
  private scrollToCustomerError(): void {
    const customerForm = this.customerInformationComponent?.customerForm;

    if (!customerForm) {
      return;
    }

    const invalidControl = Object.keys(customerForm.controls).find(
      (controlName) => customerForm.get(controlName)?.invalid,
    );

    if (!invalidControl) {
      return;
    }

    let element = document.querySelector(
      `[formcontrolname="${invalidControl}"]`,
    ) as HTMLElement | null;

    if (!element) {
      element = document.querySelector(
        `[name="${invalidControl}"]`,
      ) as HTMLElement | null;
    }

    if (!element) {
      element = document.getElementById(invalidControl) as HTMLElement | null;
    }

    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    setTimeout(() => {
      element?.focus();
    }, 300);
  }
  openInNewTab(route: string): void {
    const cleanCompany = companyname.replace(/^\/+|\/+$/g, "");
    const cleanRoute = route.replace(/^\/+/, "");

    const url = `${window.location.origin}/${cleanCompany}/${cleanRoute}`;

    console.log("Opening:", url);

    window.open(url, "_blank");
  }

  handleRef(ref: string) {
    console.log("Received RefNo:", ref);

    this.selectedRefNo = ref;
    this.orderRefNo = ref;

    this.isOrderPlaced = true;

    this.orderService
      .getOrderByRef(ref, this.sellerService.getSellerId())
      .subscribe({
        next: (res) => {
          console.log("Fetched Order:", res);
        },
        error: (err) => {
          console.log("Error fetching order:", err);
        },
      });
  }

  handleOrderPlaced(data: any) {
    console.log("Data - > ", data);
    this.isOrderPlaced = true;

    this.orderRefNo = data.refno;

    this.rewardsEarned = data.rewardsEarned || 0;

    // this.autoClickTimeout = setTimeout(() => {
    //   this.onRefClick();
    // }, 1000);

    this.onRefClick();
  }

  // handleOrderPlaced(refno: string) {
  //   this.isOrderPlaced = true;
  //   this.orderRefNo = refno;

  //   this.autoClickTimeout = setTimeout(() => {
  //     this.onRefClick();
  //   }, 1000);
  // }

  onRefClick() {
    if (this.autoClickTimeout) {
      clearTimeout(this.autoClickTimeout);
    }

    this.handleRef(this.orderRefNo);
  }

  // onRefClick() {
  //   this.selectedRefNo = this.orderRefNo;
  // }
}
