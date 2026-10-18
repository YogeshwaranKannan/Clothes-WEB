// // import { Component, inject, Input } from "@angular/core";
// // import { CommonModule } from "@angular/common";
// // import { OrderService } from "../common/services/orders.service";
// // import { Observable, map, tap } from "rxjs";
// // import { Order } from "../common/models/orders.model";
// // import { DrawerComponent } from "../common/components/drawer/drawer.component";
// // import { DrawerState } from "../common/components/drawer/drawer-state";
// // import { OrderDetailComponent } from "../order-detail/order-detail.component";
// // import { AuthService } from "../core/auth/auth.service";
// // import { Store } from "@ngrx/store";

// // @Component({
// //   selector: "app-order-history",
// //   standalone: true,
// //   imports: [CommonModule, DrawerComponent, OrderDetailComponent],
// //   templateUrl: "./order-history.component.html",
// //   styleUrls: ["./order-history.component.scss"],
// // })
// // export class OrderHistoryComponent {
// //   private orderService = inject(OrderService);
// //   private auth = inject(AuthService);

// //   @Input() orderId: string | null = null;

// //   drawerState: DrawerState = DrawerState.Hidden;
// //   selectedOrderId: string | null = null;

// //   orders$: Observable<(Order & { items_count: number })[]> = this.orderService
// //     .getAllOrders()
// //     .pipe(
// //       tap((orders) => {
// //         console.log("All Orders Response:", orders);
// //       }),
// //       map((orders) =>
// //         (orders || []).map((o) => ({
// //           ...o,
// //           items_count: o.items?.length ?? 0,
// //         })),
// //       ),
// //       tap((orders) => {
// //         console.log("Mapped Orders:", orders);
// //       }),
// //     );

// //   trackById(_: number, item: any) {
// //     return item?.order_id ?? item?.orderId ?? item?.id ?? _;
// //   }

// //   openOrderDetail(id: string) {
// //     this.selectedOrderId = id;
// //     this.drawerState = DrawerState.Half;
// //   }

// //   onCardKeydown(ev: KeyboardEvent, orderId: string) {
// //     if (ev.key === "Enter" || ev.key === " ") {
// //       ev.preventDefault();
// //       this.openOrderDetail(orderId);
// //     }
// //   }
// // }

// import { Component, inject, Input } from "@angular/core";
// import { CommonModule } from "@angular/common";
// import { OrderService } from "../common/services/orders.service";
// import { Observable, map, tap, take } from "rxjs";
// import { Order } from "../common/models/orders.model";

// import { DrawerComponent } from "../common/components/drawer/drawer.component";
// import { DrawerState } from "../common/components/drawer/drawer-state";
// import { DrawerService } from "../common/components/drawer/drawer.service";

// import * as CartActions from "../common/models/cart/cart.actions";
// import { updateOrAddItem } from "../common/models/cart/cart.actions";

// import { OrderDetailComponent } from "../order-detail/order-detail.component";
// import { AuthService } from "../core/auth/auth.service";

// import { Store } from "@ngrx/store";
// import { ProductSuggestComponent } from "../common/components/product-suggest/product-suggest.component";

// @Component({
//   selector: "app-order-history",
//   standalone: true,
//   imports: [
//     CommonModule,
//     DrawerComponent,
//     OrderDetailComponent,
//     ProductSuggestComponent,
//   ],
//   templateUrl: "./order-history.component.html",
//   styleUrls: ["./order-history.component.scss"],
// })
// export class OrderHistoryComponent {
//   private orderService = inject(OrderService);
//   private auth = inject(AuthService);

//   private store = inject(Store);
//   private drawer = inject(DrawerService);

//   @Input() orderId: string | null = null;

//   drawerState: DrawerState = DrawerState.Hidden;
//   selectedOrderId: string | null = null;

//   orders$: Observable<(Order & { items_count: number })[]> = this.orderService
//     .getAllOrders()
//     .pipe(
//       tap((orders) => {
//         console.log("All Orders Response:", orders);
//       }),

//       map((orders: any[]) =>
//         (orders || []).map((o) => ({
//           ...o,

//           items_count: o.items?.length ?? 0,
//         })),
//       ),

//       tap((orders) => {
//         console.log("Mapped Orders:", orders);
//       }),
//     );

//   trackById(_: number, item: any) {
//     return item?.order_id ?? _;
//   }

//   openOrderDetail(id: string) {
//     this.orders$.pipe(take(1)).subscribe((orders: any[]) => {
//       const order = orders.find((o) => o.order_id === id);

//       if (!order) return;

//       console.log("Selected Order:", order);

//       const status = order.order_Status?.toLowerCase();

//       // REVIEW
//       if (status === "review") {
//         this.selectedOrderId = id;

//         this.drawerState = DrawerState.Half;

//         return;
//       }

//       // DRAFT
//       if (status === "draft") {
//         console.log("Draft items:", order.items);

//         // clear previous cart
//         this.store.dispatch(CartActions.clearCart());

//         order.items?.forEach((item: any) => {
//           const product = item.product ?? item;

//           console.log("Adding:", product);

//           this.store.dispatch(
//             updateOrAddItem({
//               item: {
//                 productId: String(
//                   product.ProductId ?? product.productId ?? product._id ?? "",
//                 ),

//                 title:
//                   product.ProductName ??
//                   product.productName ??
//                   product?.item_name ??
//                   "",

//                 mrp: Number(product.SellingPrice ?? product.price ?? 0),

//                 dealPrice: Number(product.OfferPrice ?? product.price ?? 0),

//                 quantity: item.quantity ?? 1,

//                 imageUrl: product.imageUrl ?? product.Image ?? "",

//                 item: product,

//                 isService: product.isService ?? false,

//                 available_properties: product.propertyAttributes ?? null,

//                 propertyAttributes: {},
//               },
//             }),
//           );
//         });

//         setTimeout(() => {
//           this.drawer.openCart();
//         }, 200);
//       }
//     });
//   }

//   onCardKeydown(ev: KeyboardEvent, orderId: string) {
//     if (ev.key === "Enter" || ev.key === " ") {
//       ev.preventDefault();

//       this.openOrderDetail(orderId);
//     }
//   }
// }
import { Component, Input, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
  shareReplay,
  switchMap,
  take,
} from "rxjs";

import { Store } from "@ngrx/store";

import { OrderService } from "../common/services/orders.service";
import { Order } from "../common/models/orders.model";

import { DrawerComponent } from "../common/components/drawer/drawer.component";
import { DrawerState } from "../common/components/drawer/drawer-state";
import { DrawerService } from "../common/components/drawer/drawer.service";

import * as CartActions from "../common/models/cart/cart.actions";
import { updateOrAddItem } from "../common/models/cart/cart.actions";

import { OrderDetailComponent } from "../order-detail/order-detail.component";
import { ProductSuggestComponent } from "../common/components/product-suggest/product-suggest.component";
import { AuthService } from "../core/auth/auth.service";
import { OrderSearchService } from "../common/services/OrderSearch.service";

@Component({
  selector: "app-order-history",
  standalone: true,
  imports: [
    CommonModule,
    DrawerComponent,
    OrderDetailComponent,
    ProductSuggestComponent,
  ],
  templateUrl: "./order-history.component.html",
  styleUrls: ["./order-history.component.scss"],
})
export class OrderHistoryComponent {
  private readonly orderService = inject(OrderService);
  private readonly auth = inject(AuthService);
  private readonly store = inject(Store);
  private readonly drawer = inject(DrawerService);
  private readonly searchService = inject(OrderSearchService);
  showAlert = false;
  isSuccess = false;
  alertMessage = "";
  drawerTitle = "Order Details";
  @Input() orderId: string | null = null;

  drawerState: DrawerState = DrawerState.Hidden;
  selectedOrderId: string | null = null;

  readonly search$ = this.searchService.orderSearch$;

  /** Load orders only once */
  // private readonly allOrders$ = this.orderService.getAllOrders().pipe(
  //   map((orders: any[]) =>
  //     (orders ?? []).map((order) => ({
  //       ...order,
  //       items_count: order.items?.length ?? 0,
  //     })),
  //   ),
  //   shareReplay({ bufferSize: 1, refCount: true }),
  // );
  private readonly refresh$ = new BehaviorSubject<void>(undefined);

  private readonly allOrders$ = this.refresh$.pipe(
    switchMap(() => this.orderService.getAllOrders()),
    map((orders: any[]) =>
      (orders ?? []).map((order) => ({
        ...order,
        items_count: order.items?.length ?? 0,
      })),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  /** Filtered orders */
  readonly orders$: Observable<(Order & { items_count: number })[]> =
    combineLatest([this.allOrders$, this.search$]).pipe(
      map(([orders, search]) => {
        const term = search.trim().toLowerCase();

        if (!term) {
          return orders;
        }

        return orders.filter((order: any) => {
          const orderMatch = this.matches(
            [
              order.order_id,
              order.refno,
              order.contactName,
              order.customerSiteName,
              order.siteLocation,
              order.work,
              order.flooring,
              order.order_Status,
              order.payment_status,
              order.order_date,
              order.deliveryDate,
              order.jobValue,
              order.amountReceived,
              order.balanceAmount,
              order.tot_order_value,
              order.duration,
              order.type,
            ],
            term,
          );

          const productMatch =
            order.items?.some((item: any) => {
              const product = item.product ?? item;

              return this.matches(
                [
                  product.ProductId,
                  product.productId,
                  product.ProductName,
                  product.productName,
                  product.item_name,
                ],
                term,
              );
            }) ?? false;

          return orderMatch || productMatch;
        });
      }),
    );

  /** Search callback from ProductSuggestComponent */
  // searchOrders(search: string): void {
  //   console.log("Received Search :", search);
  //   this.search$.next(search);
  // }

  /** Helper for searching */
  private matches(values: any[], term: string): boolean {
    return values
      .filter((v) => v != null && v !== "")
      .some((v) => String(v).toLowerCase().includes(term));
  }

  trackById(_: number, item: any) {
    return item?.order_id ?? _;
  }

  // private openDrawer(id: string): void {
  //   this.drawerState = DrawerState.Hidden;
  //   this.selectedOrderId = null;

  //   setTimeout(() => {
  //     this.selectedOrderId = id;
  //     this.drawerState = DrawerState.Half;
  //   }, 150);
  // }
  private openDrawer(id: string, ref?: string): void {
    this.drawerState = DrawerState.Hidden;
    this.selectedOrderId = null;

    setTimeout(() => {
      this.selectedOrderId = id;
      this.drawerTitle = ref?.trim() || "Order Details"; // e.g. "20260918-BA0004"
      this.drawerState = DrawerState.Half;
    }, 150);
  }

  openOrderDetail(id: string): void {
    this.orders$.pipe(take(1)).subscribe((orders: any[]) => {
      const order = orders.find((o) => o.order_id === id);

      if (!order) {
        return;
      }
      console.log("Clicked Order details :", order);

      const status = order.order_Status?.toLowerCase();
      sessionStorage.setItem("Draft_save_id", order?.order_id);

      if (status === "review" || status === "completed") {
        this.openDrawer(id, order.refno);
        return;
      }

      if (status === "draft") {
        this.store.dispatch(CartActions.clearCart());
        sessionStorage.setItem("cart_source", "order-history");

        // order.items?.forEach((item: any) => {
        //   const product = item.product ?? item;
        //   console.log("Product: ", product);

        //   this.store.dispatch(
        //     updateOrAddItem({
        //       item: {
        //         productId: String(
        //           product.ProductId ?? product.productId ?? product._id ?? "",
        //         ),
        //         title:
        //           product.ProductName ??
        //           product.productName ??
        //           product.item_name ??
        //           "",
        //         mrp: Number(
        //           product.SellingPrice ??
        //             product.sellerPrice ??
        //             product.price ??
        //             0,
        //         ),
        //         dealPrice: Number(
        //           product.OfferPrice ??
        //             product.offerPrice ??
        //             product.price ??
        //             0,
        //         ),
        //         quantity: item.quantity ?? item.qty ?? 1,
        //         imageUrl:
        //           product.imageUrl ?? product?.image_url ?? product.Image ?? "",
        //         item: product,
        //         isService: product.isService ?? false,
        //         available_properties: product.propertyAttributes ?? null,
        //         propertyAttributes: {},
        //       },
        //     }),
        //   );
        // });

        order.items?.forEach((item: any) => {
          const product = item.product ?? item;

          let mrp = Number(
            product.SellingPrice ?? product.sellerPrice ?? product.price ?? 0,
          );

          let dealPrice = Number(
            product.OfferPrice ?? product.offerPrice ?? product.price ?? 0,
          );

          // If either value is 0, use the other value for both
          if (mrp === 0 && dealPrice > 0) {
            mrp = dealPrice;
          }

          if (dealPrice === 0 && mrp > 0) {
            dealPrice = mrp;
          }

          this.store.dispatch(
            updateOrAddItem({
              item: {
                productId: String(
                  product.ProductId ?? product.productId ?? product._id ?? "",
                ),
                title:
                  product.ProductName ??
                  product.productName ??
                  product.item_name ??
                  "",
                mrp,
                dealPrice,
                quantity: item.quantity ?? item.qty ?? 1,
                imageUrl:
                  product.imageUrl ?? product?.image_url ?? product.Image ?? "",
                item: product,
                isService: product.isService ?? false,
                available_properties: product.propertyAttributes ?? null,
                propertyAttributes: {},
              },
            }),
          );
        });
        this.drawer.openCart();
      }
    });
  }

  onCardKeydown(event: KeyboardEvent, orderId: string): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      this.openOrderDetail(orderId);
    }
  }

  // deleteOrder(orderId: string): void {
  //   if (!confirm("Are you sure you want to delete this order?")) {
  //     return;
  //   }

  //   this.orderService.DeletedraftOrder(orderId).subscribe({
  //     next: () => {
  //       this.refresh$.next();
  //     },
  //     error: (err) => {
  //       console.error(err);
  //     },
  //   });
  // }
  deleteOrder(orderId: string): void {
    if (!confirm("Are you sure you want to delete this draft order?")) {
      return;
    }

    this.orderService.DeletedraftOrder(orderId).subscribe({
      next: (message: string) => {
        console.log("Delete Draft message :", message);
        this.refresh$.next();

        this.isSuccess = true;
        this.alertMessage = message;
        this.showAlert = true;

        setTimeout(() => {
          this.showAlert = false;
        }, 3000);
      },
      error: () => {
        this.isSuccess = false;
        this.alertMessage = "Something went wrong.";
        this.showAlert = true;

        setTimeout(() => {
          this.showAlert = false;
        }, 3000);
      },
    });
  }

  onDrawerStateChange(state: DrawerState): void {
    this.drawerState = state;
    if (state === DrawerState.Hidden) {
      this.drawerTitle = "Order Details";
    }
  }
}
