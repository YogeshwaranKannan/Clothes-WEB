// import {
//   Component,
//   Input,
//   OnChanges,
//   OnInit,
//   SimpleChanges,
//   inject,
// } from "@angular/core";
// import { CommonModule } from "@angular/common";
// import { BehaviorSubject, Observable, of } from "rxjs";
// import { switchMap, map, shareReplay, tap, catchError } from "rxjs/operators";
// import { OrderService } from "../common/services/orders.service";
// import { OrderDetail } from "../common/models/orders.model";
// import { SellerService } from "../common/services/SellerService";
// import { ActivatedRoute } from "@angular/router";
// import { ImageUrlService } from "../common/utils/ImageUrlService";

// type OrderVm = {
//   order: OrderDetail | null;
//   stages: string[];
//   currentIndex: number;
//   completedWidth: string; // "0%".. "100%"
// };

// @Component({
//   selector: "app-order-detail",
//   standalone: true,
//   imports: [CommonModule],
//   templateUrl: "./order-detail.component.html",
//   styleUrls: ["./order-detail.component.scss"],
// })
// export class OrderDetailComponent implements OnChanges, OnInit {
//   showCycle = true;
//   private readonly orderService = inject(OrderService);
//   private readonly sellerService = inject(SellerService);
//   private readonly imageUrlService = inject(ImageUrlService);
//   private readonly refno$ = new BehaviorSubject<string | null>(null);
//   private readonly route = inject(ActivatedRoute);

//   private readonly orderKey$ = new BehaviorSubject<string | null>(null);

//   @Input() refno: string | null = null;
//   @Input() orderId: string | null = null;

//   // ngOnInit(): void {
//   //   // Route param support
//   //   const routeRefNo = this.route.snapshot.paramMap.get("refNo");

//   //   if (routeRefNo) {
//   //     console.log("Route RefNo:", routeRefNo);

//   //     this.refno$.next(routeRefNo);

//   //     this.restartCycle();
//   //   }
//   // }

//   ngOnInit(): void {
//     this.route.paramMap.subscribe((params) => {
//       const refNo = params.get("refNo");
//       const orderId = params.get("orderId");

//       const value = this.orderId || orderId || this.refno || refNo;

//       console.log("Route value:", value);

//       if (value?.trim()) {
//         this.orderKey$.next(value.trim());
//         this.restartCycle();
//       }
//     });
//   }

//   private readonly canonicalStages = [
//     "Order Placed",
//     "Processing",
//     "Shipment Ready",
//     "Out for Delivery",
//     "Delivered",
//   ];

//   vm$: Observable<OrderVm> = this.orderKey$.pipe(
//     tap((orderKey) => console.log("Received Order Key:", orderKey)),

//     switchMap((orderKey) => {
//       if (!orderKey?.trim()) {
//         return of({
//           order: null,
//           stages: this.canonicalStages,
//           currentIndex: -1,
//           completedWidth: "0%",
//         } as OrderVm);
//       }

//       return this.orderService
//         .getOrderByRef(orderKey.trim(), this.sellerService.getSellerId())
//         .pipe(
//           tap((order) => console.log("Order API Response:", order)),

//           map((order) => {
//             // No order found
//             if (!order || !order.order_id) {
//               return {
//                 order: null,
//                 stages: this.canonicalStages,
//                 currentIndex: -1,
//                 completedWidth: "0%",
//               } as OrderVm;
//             }

//             const normalize = (s?: string | null) =>
//               (s ?? "").trim().replace(/\s+/g, " ").toLowerCase();

//             const rawStatus = normalize(order.order_status);

//             // Convert backend statuses to the canonical stage status
//             const status =
//               rawStatus === "review"
//                 ? "processing"
//                 : rawStatus === "completed"
//                   ? "delivered"
//                   : rawStatus;

//             console.log("Backend Order Status:", order.order_status);
//             console.log("Normalized Order Status:", rawStatus);
//             console.log("Mapped Order Status:", status);

//             const normalizedStages = this.canonicalStages.map(normalize);

//             const idx = normalizedStages.indexOf(status);

//             const currentIndex = idx < 0 ? -1 : idx;

//             const completedWidth =
//               idx < 0
//                 ? "0%"
//                 : `${Math.round(
//                     (idx / (this.canonicalStages.length - 1)) * 100,
//                   )}%`;

//             console.log("Stage Index:", idx);
//             console.log("Completed Width:", completedWidth);
//             return {
//               order,
//               stages: this.canonicalStages,
//               currentIndex,
//               completedWidth,
//             } as OrderVm;
//           }),

//           catchError((error) => {
//             console.error("Error fetching order:", error);

//             return of({
//               order: null,
//               stages: this.canonicalStages,
//               currentIndex: -1,
//               completedWidth: "0%",
//             } as OrderVm);
//           }),

//           tap(() => this.restartCycle()),
//         );
//     }),

//     shareReplay(1),
//   );
//   // ngOnChanges(ch: SimpleChanges): void {
//   //   if ("refno" in ch) {
//   //     this.refno$.next(this.refno ?? null);
//   //     this.restartCycle();
//   //   }
//   // }

//   displayOrderStatus(status?: string | null): string {
//     if (!status) return "—";

//     return status === "Review" ? "Processing" : status;
//   }

//   ngOnChanges(ch: SimpleChanges): void {
//     if ("orderId" in ch || "refno" in ch) {
//       const value = this.orderId || this.refno;

//       console.log("Received OrderId:", this.orderId);
//       console.log("Received RefNo:", this.refno);

//       if (value?.trim()) {
//         this.orderKey$.next(value.trim());
//         this.restartCycle();
//       }
//     }
//   }

//   trackByStage = (_: number, s: string) => s;
//   trackByItem = (_: number, it: any) => it?.item_name ?? _;

//   private restartCycle() {
//     // Hide this frame, show next microtask → element is remounted → animation restarts
//     this.showCycle = false;
//     // Use setTimeout 0 (or requestAnimationFrame) to re-enable on next tick
//     setTimeout(() => (this.showCycle = true), 0);
//   }

//   buildImageUrl(
//     relative?: string,
//     inventoryId?: string,
//     isService?: boolean,
//   ): string {
//     return this.imageUrlService.buildImageUrl(relative, inventoryId, isService);
//   }
// }
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { BehaviorSubject, Observable, of } from "rxjs";
import { switchMap, map, shareReplay, tap, catchError } from "rxjs/operators";
import { OrderService } from "../common/services/orders.service";
import { OrderDetail } from "../common/models/orders.model";
import { SellerService } from "../common/services/SellerService";
import { ActivatedRoute } from "@angular/router";
import { ImageUrlService } from "../common/utils/ImageUrlService";
import { companyname } from "../common/utils/constant";

type OrderVm = {
  order: OrderDetail | null;
  stages: string[];
  currentIndex: number;
  completedWidth: string; // "0%".. "100%"
};

@Component({
  selector: "app-order-detail",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./order-detail.component.html",
  styleUrls: ["./order-detail.component.scss"],
})
export class OrderDetailComponent implements OnChanges, OnInit {
  showCycle = true;
  private readonly orderService = inject(OrderService);
  private readonly sellerService = inject(SellerService);
  private readonly imageUrlService = inject(ImageUrlService);
  private readonly refno$ = new BehaviorSubject<string | null>(null);
  private readonly route = inject(ActivatedRoute);

  private readonly orderKey$ = new BehaviorSubject<string | null>(null);

  @Input() refno: string | null = null;
  @Input() orderId: string | null = null;

  // TODO: confirm where this should come from in your app (route param, SellerService, etc.)
  companyname: string = "";

  // Accordion open/closed state for the Order Summary / Customer / Delivery / Status cards
  openSections: { [key: string]: boolean } = {
    summary: true,
    customer: false,
    delivery: false,
    status: false,
  };

  toggleSection(key: string): void {
    this.openSections[key] = !this.openSections[key];
  }

  // ngOnInit(): void {
  //   // Route param support
  //   const routeRefNo = this.route.snapshot.paramMap.get("refNo");

  //   if (routeRefNo) {
  //     console.log("Route RefNo:", routeRefNo);

  //     this.refno$.next(routeRefNo);

  //     this.restartCycle();
  //   }
  // }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const refNo = params.get("refNo");
      const orderId = params.get("orderId");

      const value = this.orderId || orderId || this.refno || refNo;

      console.log("Route value:", value);

      if (value?.trim()) {
        this.orderKey$.next(value.trim());
        this.restartCycle();
      }
    });
  }

  private readonly canonicalStages = [
    "Order Placed",
    "Processing",
    "Shipment Ready",
    "Out for Delivery",
    "Delivered",
  ];

  vm$: Observable<OrderVm> = this.orderKey$.pipe(
    tap((orderKey) => console.log("Received Order Key:", orderKey)),

    switchMap((orderKey) => {
      if (!orderKey?.trim()) {
        return of({
          order: null,
          stages: this.canonicalStages,
          currentIndex: -1,
          completedWidth: "0%",
        } as OrderVm);
      }

      return this.orderService
        .getOrderByRef(orderKey.trim(), this.sellerService.getSellerId())
        .pipe(
          tap((order) => console.log("Order API Response:", order)),

          map((order) => {
            // No order found
            if (!order || !order.order_id) {
              return {
                order: null,
                stages: this.canonicalStages,
                currentIndex: -1,
                completedWidth: "0%",
              } as OrderVm;
            }

            const normalize = (s?: string | null) =>
              (s ?? "").trim().replace(/\s+/g, " ").toLowerCase();

            const rawStatus = normalize(order.order_status);

            // Convert backend statuses to the canonical stage status
            const status =
              rawStatus === "review"
                ? "processing"
                : rawStatus === "completed"
                  ? "delivered"
                  : rawStatus;

            console.log("Backend Order Status:", order.order_status);
            console.log("Normalized Order Status:", rawStatus);
            console.log("Mapped Order Status:", status);

            const normalizedStages = this.canonicalStages.map(normalize);

            const idx = normalizedStages.indexOf(status);

            const currentIndex = idx < 0 ? -1 : idx;

            const completedWidth =
              idx < 0
                ? "0%"
                : `${Math.round(
                    (idx / (this.canonicalStages.length - 1)) * 100,
                  )}%`;

            console.log("Stage Index:", idx);
            console.log("Completed Width:", completedWidth);
            return {
              order,
              stages: this.canonicalStages,
              currentIndex,
              completedWidth,
            } as OrderVm;
          }),

          catchError((error) => {
            console.error("Error fetching order:", error);

            return of({
              order: null,
              stages: this.canonicalStages,
              currentIndex: -1,
              completedWidth: "0%",
            } as OrderVm);
          }),

          tap(() => this.restartCycle()),
        );
    }),

    shareReplay(1),
  );
  // ngOnChanges(ch: SimpleChanges): void {
  //   if ("refno" in ch) {
  //     this.refno$.next(this.refno ?? null);
  //     this.restartCycle();
  //   }
  // }

  displayOrderStatus(status?: string | null): string {
    if (!status) return "—";

    return status === "Review" ? "Processing" : status;
  }

  displayPaymentStatus(status?: string | null): string {
    if (!status) return "—";

    return status.trim().toLowerCase() === "unpaid"
      ? "Pay on Delivery"
      : status;
  }

  ngOnChanges(ch: SimpleChanges): void {
    if ("orderId" in ch || "refno" in ch) {
      const value = this.orderId || this.refno;

      console.log("Received OrderId:", this.orderId);
      console.log("Received RefNo:", this.refno);

      if (value?.trim()) {
        this.orderKey$.next(value.trim());
        this.restartCycle();
      }
    }
  }

  trackByStage = (_: number, s: string) => s;
  trackByItem = (_: number, it: any) => it?.item_name ?? _;

  openInNewTab(route: string): void {
    const cleanCompany = companyname.replace(/^\/+|\/+$/g, "");
    const cleanRoute = route.replace(/^\/+/, "");

    const url = `${window.location.origin}/${cleanCompany}/${cleanRoute}`;

    console.log("Opening:", url);

    window.open(url, "_blank");
  }

  private restartCycle() {
    // Hide this frame, show next microtask → element is remounted → animation restarts
    this.showCycle = false;
    // Use setTimeout 0 (or requestAnimationFrame) to re-enable on next tick
    setTimeout(() => (this.showCycle = true), 0);
  }

  buildImageUrl(
    relative?: string,
    inventoryId?: string,
    isService?: boolean,
  ): string {
    return this.imageUrlService.buildImageUrl(relative, inventoryId, isService);
  }
}
