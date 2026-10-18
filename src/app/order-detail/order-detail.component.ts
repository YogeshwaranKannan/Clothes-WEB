// import {
//   Component,
//   DestroyRef,
//   Input,
//   OnChanges,
//   OnInit,
//   SimpleChanges,
//   inject,
// } from "@angular/core";
// import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
// import { CommonModule } from "@angular/common";
// import { BehaviorSubject, Observable, of } from "rxjs";
// import {
//   switchMap,
//   map,
//   shareReplay,
//   tap,
//   catchError,
//   filter,
//   distinctUntilChanged,
//   startWith,
// } from "rxjs/operators";
// import { OrderService } from "../common/services/orders.service";
// import { OrderDetail, OrderItem } from "../common/models/orders.model";
// import { SellerService } from "../common/services/SellerService";
// import { ActivatedRoute } from "@angular/router";
// import { ImageUrlService } from "../common/utils/ImageUrlService";
// import { companyname } from "../common/utils/constant";

// type OrderVm = {
//   order: OrderDetail | null;
//   stages: string[];
//   currentIndex: number;
//   progress: number; // 0..1 (share of the timeline that is completed)
// };

// type SectionKey = "summary" | "customer" | "delivery" | "status";

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
//   private readonly route = inject(ActivatedRoute);
//   private readonly destroyRef = inject(DestroyRef);

//   private readonly orderKey$ = new BehaviorSubject<string | null>(null);

//   @Input() refno: string | null = null;
//   @Input() orderId: string | null = null;

//   // Accordion open/closed state for the Order Summary / Customer / Delivery / Status cards
//   openSections: Record<SectionKey, boolean> = {
//     summary: true,
//     customer: false,
//     delivery: false,
//     status: false,
//   };

//   toggleSection(key: SectionKey): void {
//     this.openSections[key] = !this.openSections[key];
//   }

//   private readonly canonicalStages = [
//     "Order Placed",
//     "Processing",
//     "Shipment Ready",
//     "Out for Delivery",
//     "Delivered",
//   ];

//   /**
//    * - Waits for a real key (no more "No order found." flash before the request).
//    * - `startWith(null)` makes the template show "Loading…" while a request is in flight.
//    * - `distinctUntilChanged` prevents duplicate API calls when route + inputs push the same key.
//    */
//   vm$: Observable<OrderVm | null> = this.orderKey$.pipe(
//     filter((key): key is string => !!key?.trim()),
//     map((key) => key.trim()),
//     distinctUntilChanged(),
//     switchMap((key) =>
//       this.orderService
//         .getOrderByRef(key, this.sellerService.getSellerId())
//         .pipe(
//           map((order) => this.toVm(order)),
//           catchError((error) => {
//             console.error("Error fetching order:", error);
//             return of(this.emptyVm());
//           }),
//           startWith(null as OrderVm | null),
//         ),
//     ),
//     // Restart the bike animation once data has rendered
//     tap((vm) => {
//       if (vm) this.restartCycle();
//     }),
//     shareReplay({ bufferSize: 1, refCount: true }),
//   );

//   ngOnInit(): void {
//     this.route.paramMap
//       .pipe(takeUntilDestroyed(this.destroyRef))
//       .subscribe((params) => {
//         const refNo = params.get("refNo");
//         const orderId = params.get("orderId");

//         const value = this.orderId || orderId || this.refno || refNo;

//         if (value?.trim()) {
//           this.orderKey$.next(value.trim());
//         }
//       });
//   }

//   ngOnChanges(ch: SimpleChanges): void {
//     if ("orderId" in ch || "refno" in ch) {
//       const value = this.orderId || this.refno;

//       if (value?.trim()) {
//         this.orderKey$.next(value.trim());
//       }
//     }
//   }

//   // ── View-model helpers ────────────────────────────────────────────────────

//   private emptyVm(): OrderVm {
//     return {
//       order: null,
//       stages: this.canonicalStages,
//       currentIndex: -1,
//       progress: 0,
//     };
//   }

//   private toVm(order: OrderDetail | null | undefined): OrderVm {
//     // No order found
//     if (!order || !order.order_id) return this.emptyVm();

//     const currentIndex = this.canonicalStages.indexOf(
//       this.toStage(order.order_status),
//     );

//     return {
//       order,
//       stages: this.canonicalStages,
//       currentIndex,
//       progress:
//         currentIndex < 0 ? 0 : currentIndex / (this.canonicalStages.length - 1),
//     };
//   }

//   /** Maps any backend status to a canonical stage name ("" when unknown). */
//   private toStage(status?: string | null): string {
//     const s = (status ?? "").trim().replace(/\s+/g, " ").toLowerCase();

//     // Convert backend statuses to the canonical stage status
//     if (s === "review") return "Processing";
//     if (s === "completed") return "Delivered";

//     return this.canonicalStages.find((c) => c.toLowerCase() === s) ?? "";
//   }

//   // ── Template helpers ──────────────────────────────────────────────────────

//   displayOrderStatus(status?: string | null): string {
//     if (!status) return "—";

//     // Same mapping as the timeline, so the pill and the timeline never disagree
//     return this.toStage(status) || status;
//   }

//   displayPaymentStatus(status?: string | null): string {
//     if (!status) return "—";

//     return status.trim().toLowerCase() === "unpaid"
//       ? "Pay on Delivery"
//       : status;
//   }

//   trackByStage = (_: number, s: string) => s;

//   // Same product can appear in several batches, so item_name alone is not unique
//   trackByItem = (i: number, it: OrderItem) =>
//     `${it?.inv_id ?? ""}|${it?.batch_id ?? ""}|${it?.item_name ?? i}`;

//   openInNewTab(route: string): void {
//     const cleanCompany = companyname.replace(/^\/+|\/+$/g, "");
//     const cleanRoute = route.replace(/^\/+/, "");

//     const url = `${window.location.origin}/${cleanCompany}/${cleanRoute}`;

//     window.open(url, "_blank", "noopener");
//   }

//   private restartCycle() {
//     // Hide this frame, show next macrotask → element is remounted → animation restarts
//     this.showCycle = false;
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
  DestroyRef,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CommonModule } from "@angular/common";
import { BehaviorSubject, from, Observable, of } from "rxjs";
import {
  switchMap,
  map,
  shareReplay,
  tap,
  catchError,
  filter,
  distinctUntilChanged,
  startWith,
} from "rxjs/operators";
import { OrderService } from "../common/services/orders.service";
import { OrderDetail, OrderItem } from "../common/models/orders.model";
import { SellerService } from "../common/services/SellerService";
import { ActivatedRoute } from "@angular/router";
import { ImageUrlService } from "../common/utils/ImageUrlService";
import { companyname } from "../common/utils/constant";
import { DrawerService } from "../common/components/drawer/drawer.service";

type OrderVm = {
  order: OrderDetail | null;
  stages: string[];
  currentIndex: number;
  progress: number; // 0..1 (share of the timeline that is completed)
  totalMrp: number; // sum of original (seller) prices
  totalOffer: number; // sum of offer prices (falls back to MRP per item)
  hasOffer: boolean; // totalMrp !== totalOffer
  totalValue: number; // hasOffer ? totalOffer : totalMrp
  deliveryFee: number; // tot_order_value - totalValue
};

type SectionKey = "summary" | "customer" | "delivery" | "status";

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
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  private readonly orderKey$ = new BehaviorSubject<string | null>(null);

  private readonly host = inject(ElementRef<HTMLElement>);

  @Input() refno: string | null = null;
  @Input() orderId: string | null = null;

  // Accordion open/closed state for the Order Summary / Customer / Delivery / Status cards
  openSections: Record<SectionKey, boolean> = {
    summary: true,
    customer: false,
    delivery: false,
    status: false,
  };

  toggleSection(key: SectionKey): void {
    this.openSections[key] = !this.openSections[key];
  }

  private readonly canonicalStages = [
    "Order Placed",
    "Processing",
    "Shipment Ready",
    "Out for Delivery",
    "Delivered",
  ];

  /**
   * - Waits for a real key (no more "No order found." flash before the request).
   * - `startWith(null)` makes the template show "Loading…" while a request is in flight.
   * - `distinctUntilChanged` prevents duplicate API calls when route + inputs push the same key.
   */
  vm$: Observable<OrderVm | null> = this.orderKey$.pipe(
    filter((key): key is string => !!key?.trim()),
    map((key) => key.trim()),
    distinctUntilChanged(),
    switchMap((key) =>
      this.orderService
        .getOrderByRef(key, this.sellerService.getSellerId())
        .pipe(
          map((order) => this.toVm(order)),
          catchError((error) => {
            console.error("Error fetching order:", error);
            return of(this.emptyVm());
          }),
          startWith(null as OrderVm | null),
        ),
    ),
    // Restart the bike animation once data has rendered
    tap((vm) => {
      if (vm) this.restartCycle();
      if (vm?.order) this.scrollToActiveStep();
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /** Mobile: swipe the timeline so the current stage is centred (animated). */
  private scrollToActiveStep(): void {
    // wait for the async pipe to render the timeline
    setTimeout(() => {
      const el: HTMLElement = this.host.nativeElement;
      const container = el.querySelector<HTMLElement>(".timeline-container");
      const active = el.querySelector<HTMLElement>(".timeline-step.active");

      if (!container || !active) return;

      // only when the timeline actually overflows (mobile)
      if (container.scrollWidth <= container.clientWidth) return;

      const c = container.getBoundingClientRect();
      const s = active.getBoundingClientRect();
      const delta = s.left + s.width / 2 - (c.left + c.width / 2);

      container.scrollTo({
        left: container.scrollLeft + delta,
        behavior: "smooth",
      });
    }, 400);
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const refNo = params.get("refNo");
        const orderId = params.get("orderId");

        const value = this.orderId || orderId || this.refno || refNo;

        if (value?.trim()) {
          this.orderKey$.next(value.trim());
        }
      });
  }

  ngOnChanges(ch: SimpleChanges): void {
    if ("orderId" in ch || "refno" in ch) {
      const value = this.orderId || this.refno;

      if (value?.trim()) {
        this.orderKey$.next(value.trim());
      }
    }
  }

  // ── View-model helpers ────────────────────────────────────────────────────

  private emptyVm(): OrderVm {
    return {
      order: null,
      stages: this.canonicalStages,
      currentIndex: -1,
      progress: 0,
      totalMrp: 0,
      totalOffer: 0,
      hasOffer: false,
      totalValue: 0,
      deliveryFee: 0,
    };
  }

  private toVm(order: OrderDetail | null | undefined): OrderVm {
    // No order found
    if (!order || !order.order_id) return this.emptyVm();

    const currentIndex = this.canonicalStages.indexOf(
      this.toStage(order.order_status),
    );

    const totals = this.calcTotals(order);

    return {
      order,
      stages: this.canonicalStages,
      currentIndex,
      progress:
        currentIndex < 0 ? 0 : currentIndex / (this.canonicalStages.length - 1),
      ...totals,
    };
  }

  private num(v: unknown): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  /** Rounds to 2 decimals so float noise (e.g. 0.1 + 0.2) never causes false "differs". */
  private round2(v: number): number {
    return Math.round((v + Number.EPSILON) * 100) / 100;
  }

  /**
   * total_actualMrp_Price = sum(sellerPrice * qty)
   * total_offer_price     = sum((offerPrice > 0 ? offerPrice : sellerPrice) * qty)
   * value                 = total_actualMrp_Price != total_offer_price ? total_offer_price : total_actualMrp_Price
   * delivery_fee          = tot_order_value - value
   */
  private calcTotals(order: OrderDetail) {
    const items = (order.items ?? []) as any[];

    let mrp = 0;
    let offer = 0;

    for (const it of items) {
      const qty = this.num(it?.qty) || 1;
      const price = this.num(it?.sellerPrice ?? it?.price);
      const offerPrice = this.num(it?.offerPrice);

      mrp += price * qty;
      offer += (offerPrice > 0 ? offerPrice : price) * qty;
    }

    const totalMrp = this.round2(mrp);
    const totalOffer = this.round2(offer);
    const hasOffer = totalMrp !== totalOffer;
    const totalValue = hasOffer ? totalOffer : totalMrp;
    const deliveryFee = Math.max(
      0,
      this.round2(this.num(order.tot_order_value) - totalValue),
    );

    return { totalMrp, totalOffer, hasOffer, totalValue, deliveryFee };
  }

  /** Maps any backend status to a canonical stage name ("" when unknown). */
  private toStage(status?: string | null): string {
    const s = (status ?? "").trim().replace(/\s+/g, " ").toLowerCase();

    // Convert backend statuses to the canonical stage status
    if (s === "review") return "Processing";
    if (s === "completed") return "Delivered";

    return this.canonicalStages.find((c) => c.toLowerCase() === s) ?? "";
  }

  // ── Template helpers ──────────────────────────────────────────────────────

  displayOrderStatus(status?: string | null): string {
    if (!status) return "—";

    // Same mapping as the timeline, so the pill and the timeline never disagree
    return this.toStage(status) || status;
  }

  displayPaymentStatus(status?: string | null): string {
    if (!status) return "—";

    return status.trim().toLowerCase() === "unpaid"
      ? "Pay on Delivery"
      : status;
  }

  trackByStage = (_: number, s: string) => s;

  // Same product can appear in several batches, so item_name alone is not unique
  trackByItem = (i: number, it: OrderItem) =>
    `${it?.inv_id ?? ""}|${it?.batch_id ?? ""}|${it?.item_name ?? i}`;

  openInNewTab(route: string): void {
    const cleanCompany = companyname.replace(/^\/+|\/+$/g, "");
    const cleanRoute = route.replace(/^\/+/, "");

    const url = `${window.location.origin}/${cleanCompany}/${cleanRoute}`;

    window.open(url, "_blank", "noopener");
  }

  private restartCycle() {
    // Hide this frame, show next macrotask → element is remounted → animation restarts
    this.showCycle = false;
    setTimeout(() => (this.showCycle = true), 0);
  }

  // buildImageUrl(
  //   relative?: string,
  //   inventoryId?: string,
  //   isService?: boolean,
  // ): string {
  //   return this.imageUrlService.buildImageUrl(relative, inventoryId, isService);
  // }

  buildImageUrl(
    relative?: string,
    inventoryId?: string,
    isService: boolean = false,
  ): Promise<string> {
    return this.imageUrlService.buildImageUrl(relative, inventoryId, isService);
  }

  private readonly imgCache = new Map<string, Observable<string>>();

  // itemImg$(item: OrderItem): Observable<string> {
  //   const key = `${item.image_url}|${item.inv_id}|${item.isService}`;
  //   let img$ = this.imgCache.get(key);
  //   if (!img$) {
  //     img$ = from(
  //       this.imageUrlService.buildImageUrl(
  //         item.image_url,
  //         item.inv_id,
  //         item.isService,
  //       ),
  //     ).pipe(shareReplay({ bufferSize: 1, refCount: false }));
  //     this.imgCache.set(key, img$);
  //   }
  //   return img$;
  // }

  itemImg$(item: OrderItem): Observable<string> {
    const key = `${item.image_url}|${item.inv_id}|${item.isService}`;
    let img$ = this.imgCache.get(key);
    if (!img$) {
      img$ = from(
        item.image_url
          ? this.imageUrlService
              .buildImageUrl(item.image_url, item.inv_id, item.isService)
              .catch(() => this.fallbackImg)
          : Promise.resolve(this.fallbackImg),
      ).pipe(shareReplay({ bufferSize: 1, refCount: false }));
      this.imgCache.set(key, img$);
    }
    return img$;
  }

  readonly fallbackImg = "/assets/placeholder-bike.png";

  onImgError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    if (!img || img.src.includes("placeholder-bike.png")) return;
    img.src = this.fallbackImg;
  }
}
