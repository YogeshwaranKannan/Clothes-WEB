// import {
//   Component,
//   OnInit,
//   ElementRef,
//   QueryList,
//   ViewChildren,
//   ChangeDetectorRef,
//   HostListener,
// } from "@angular/core";
// import { CommonModule } from "@angular/common";
// import { ActivatedRoute, Router, RouterModule } from "@angular/router";
// import {
//   Observable,
//   catchError,
//   combineLatest,
//   map,
//   of,
//   switchMap,
//   take,
//   tap,
// } from "rxjs";
// // import { CategoryService } from "../../services/category.service";
// import { CategoryService } from "../../services/category.service copy";
// import {
//   GroupedCategory,
//   DescriptionBlock,
//   ParsedDescription,
//   PlainDescription,
//   CategoryNavState,
// } from "../../models/category.model";
// // import { ProductService } from "../../services/product.service";
// import { ProductService } from "../../services/product.service copy";
// import { Product, Variant } from "../../models/product.model";
// import { parseMoneyToNumber } from "../../utils/price.util"; // adjust path if needed
// // ADD alongside existing imports
// import { Store } from "@ngrx/store";
// import {
//   updateOrAddItem,
//   updateQuantity,
//   removeItem,
// } from "../../models/cart/cart.actions";
// import { DrawerService } from "../drawer/drawer.service";
// import { VariantDropdownComponent } from "./../variant-dropdown/variant-dropdown.component";
// import { DrawerState } from "../drawer/drawer-state";
// //import { Product_URL, Service_URL } from "../../utils/constant";
// import { selectCartItems } from "../../models/cart/cart.selectors";
// import { LoadingScreenComponent } from "../loading-screen/loading-screen.component";

// @Component({
//   selector: "app-categories",
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     VariantDropdownComponent,
//     LoadingScreenComponent,
//   ], // RouterModule for routerLink on View btn
//   templateUrl: "./categories.component.html",
//   styleUrls: ["./categories.component.scss"],
// })
// export class CategoriesComponent implements OnInit {
//   groupedWithProducts$!: Observable<
//     { group: GroupedCategory; products: Product[] }[]
//   >;

//   // VARIANT modal state
//   selectedVariants = new Map<string, Variant | null>();
//   variantModalProduct: Product | null = null;
//   cartQtyMap$!: Observable<Map<string, number>>;

//   // One rail ElementRef per category section, matched by index
//   @ViewChildren("rail") railRefs!: QueryList<ElementRef<HTMLElement>>;

//   private readonly imgBase = "https://dev.fr.api.intellesyde.com";
//   //private readonly imgBase = "http://localhost:8080";

//   isLoading = true;
//   constructor(
//     private categoryService: CategoryService,
//     private route: ActivatedRoute,
//     private router: Router,
//     private productService: ProductService,
//     private store: Store,
//     private drawer: DrawerService,
//     private el: ElementRef,
//     private cdr: ChangeDetectorRef,
//   ) {}

//   ngOnInit(): void {
//     // ── DO NOT call loadGroupedProducts() here directly. ────────────────────
//     // On first load the seller ID is not yet available (SellerService async),
//     // so getGroupedCategories() returns early with "Seller ID not loaded yet".
//     // The correct trigger is productService.refreshProducts$, which app.component
//     // emits AFTER the seller has loaded and category/product APIs are ready.
//     // On second+ loads the seller is restored from localStorage, so refreshProducts$
//     // fires immediately and data loads without needing this early call.

//     // build live cart-quantity map
//     // this.cartQtyMap$ = this.store.select(selectCartItems).pipe(
//     //   map((items: any[]) => {
//     //     const m = new Map<string, number>();
//     //     for (const item of items) {
//     //       m.set(item.productId, item.quantity);
//     //     }
//     //     return m;
//     //   }),
//     // );

//     this.cartQtyMap$ = this.store.select(selectCartItems).pipe(
//       map((items: any[]) => {
//         const m = new Map<string, number>();

//         items.forEach((item) => {
//           m.set(String(item.productId), Number(item.quantity));
//         });

//         console.log("Cart Variant Map:", m);

//         return m;
//       }),
//     );

//     // Single source of truth for product loading — fires after seller is ready
//     this.productService.refreshProducts$.subscribe(() => {
//       console.log("Refreshing category products...");
//       this.loadGroupedProducts();
//     });
//   }

//   @HostListener("document:keydown.escape")
//   onEscapeKey(): void {
//     if (this.variantModalProduct) this.closeVariantPopup();
//   }

//   // Closes the variant modal on any click outside its panel. This is what
//   // catches clicks inside the cart drawer: the drawer renders above the
//   // vm-backdrop in stacking order and physically intercepts the click
//   // before it can reach the backdrop element, so the backdrop's own
//   // (click) handler alone can't close the modal in that case. A listener
//   // bound at the document level catches it regardless of where the click
//   // target sits in the DOM/z-index stack.
//   @HostListener("document:click", ["$event"])
//   onDocumentClick(ev: Event): void {
//     if (!this.variantModalProduct) return;
//     try {
//       const panel = this.el.nativeElement.querySelector(".vm-panel");
//       if (!panel || !panel.contains(ev.target as Node)) {
//         this.closeVariantPopup();
//       }
//     } catch {
//       this.closeVariantPopup();
//     }
//   }

//   /** Opens the global variant modal for a product */
//   openVariantPopup(product: Product, event?: Event): void {
//     if (event) event.stopPropagation();
//     this.variantModalProduct = product;
//     // default selected variant
//     const pid = String(product.ProductId ?? "");
//     if (!this.selectedVariants.has(pid)) {
//       this.selectedVariants.set(pid, product.variants?.[0] ?? null);
//     }
//     // Body scroll is intentionally left unlocked so the user can keep
//     // scrolling the page while the variant modal is open.
//   }

//   closeVariantPopup(): void {
//     this.variantModalProduct = null;
//     // this.drawer.close();
//   }

//   getSelectedVariant(product: Product): Variant | null {
//     const pid = String(product.ProductId ?? "");
//     if (this.selectedVariants.has(pid)) {
//       return this.selectedVariants.get(pid) ?? null;
//     }
//     const first = product.variants?.[0] ?? null;
//     this.selectedVariants.set(pid, first);
//     return first;
//   }

//   selectVariant(product: Product, variant: Variant): void {
//     this.selectedVariants.set(String(product.ProductId ?? ""), variant);
//   }

//   variantRowCartKey(product: Product, variant: Variant): string {
//     return `${String(product.ProductId ?? "")}__v${variant.variantsid}`;
//   }

//   getRowVariantQty(
//     product: Product,
//     variant: Variant,
//     qtyMap: Map<string, number>,
//   ): number {
//     return qtyMap.get(this.variantRowCartKey(product, variant)) ?? 0;
//   }

//   rowVariantInCart(
//     product: Product,
//     variant: Variant,
//     qtyMap: Map<string, number>,
//   ): boolean {
//     return this.getRowVariantQty(product, variant, qtyMap) > 0;
//   }

//   addRowVariantToCart(product: Product, variant: Variant, event: Event): void {
//     event.stopPropagation();

//     const key = this.variantRowCartKey(product, variant);

//     const sellingPrice = variant?.SellingPrice ?? (product as any).SellingPrice;
//     const offerPrice = variant?.OfferPrice ?? (product as any).OfferPrice;

//     const mrp = parseMoneyToNumber(String(sellingPrice ?? "")) || 0;
//     const dealPrice = parseMoneyToNumber(String(offerPrice ?? "")) || 0;

//     const title = `${(product as any).Brand ?? ""} ${
//       product.ProductName ?? ""
//     } - ${variant.variantsName}`.trim();

//     const image = String(
//       (product as any).ImageUrl || (product as any).Image || "",
//     ).trim();

//     // 🔧 FIX: clone product per cart line instead of sharing the same
//     // object reference across every variant row's cart entry.
//     const productSnapshot = { ...product, selectedVariant: variant };

//     this.store.dispatch(
//       updateOrAddItem({
//         item: {
//           productId: key,
//           title,
//           mrp,
//           dealPrice: dealPrice,
//           quantity: 1,
//           imageUrl: image,
//           item: productSnapshot, // ✅ was: product
//           selectedVariant: variant,
//           totalVariants: product?.variants,
//           isService: product?.isService ?? false,
//         },
//       }),
//     );

//     this.drawer.openCart();
//   }

//   increaseRowVariant(
//     product: Product,
//     variant: Variant,
//     qtyMap: Map<string, number>,
//     event: Event,
//   ): void {
//     event.stopPropagation();
//     const key = this.variantRowCartKey(product, variant);
//     this.store.dispatch(
//       updateQuantity({ productId: key, quantity: (qtyMap.get(key) ?? 0) + 1 }),
//     );
//     this.drawer.openCart();
//   }

//   decreaseRowVariant(
//     product: Product,
//     variant: Variant,
//     qtyMap: Map<string, number>,
//     event: Event,
//   ): void {
//     event.stopPropagation();
//     const key = this.variantRowCartKey(product, variant);
//     const current = qtyMap.get(key) ?? 0;
//     if (current <= 1) {
//       this.store.dispatch(removeItem({ productId: key }));
//     } else {
//       this.store.dispatch(
//         updateQuantity({ productId: key, quantity: current - 1 }),
//       );
//     }
//   }

//   updateCartQtyFromInput(p: Product, event: Event): void {
//     event.stopPropagation();

//     const input = event.target as HTMLInputElement;
//     const qty = Number(input.value);

//     const pid = String(p.ProductId ?? "");

//     if (isNaN(qty) || qty <= 0) {
//       this.store.dispatch(removeItem({ productId: pid }));
//       return;
//     }

//     this.store.dispatch(
//       updateQuantity({
//         productId: pid,
//         quantity: qty,
//       }),
//     );
//     this.drawer.openCart();
//   }

//   allowOnlyIntegers(event: KeyboardEvent): void {
//     const input = event.target as HTMLInputElement;

//     const allowedKeys = [
//       "Backspace",
//       "Delete",
//       "ArrowLeft",
//       "ArrowRight",
//       "Tab",
//       "Home",
//       "End",
//     ];

//     if (allowedKeys.includes(event.key)) {
//       return;
//     }

//     // only digits
//     if (!/^\d$/.test(event.key)) {
//       event.preventDefault();
//       return;
//     }

//     // allow only 4 digits
//     if (input.value.length >= 4) {
//       event.preventDefault();
//     }
//   }

//   updateRowVariantQtyFromInput(
//     product: Product,
//     variant: Variant,
//     qtyMap: Map<string, number>,
//     event: Event,
//   ): void {
//     event.stopPropagation();

//     const input = event.target as HTMLInputElement;

//     let qty = Number(input.value);

//     // Allow only whole numbers
//     if (isNaN(qty) || qty < 1) {
//       qty = 1;
//     }

//     qty = Math.floor(qty); // 2.9 => 2

//     input.value = String(qty);

//     const key = this.variantRowCartKey(product, variant);

//     this.store.dispatch(
//       updateQuantity({
//         productId: key,
//         quantity: qty,
//       }),
//     );

//     this.drawer.openCart();
//   }

//   parsePrice(val: string | number | null | undefined): number {
//     if (val == null) return 0;
//     if (typeof val === "number") return val;
//     return parseMoneyToNumber(val) ?? 0;
//   }

//   variantOfferText(v: Variant): string {
//     if (v.offerText) return v.offerText;
//     const mrp = parseMoneyToNumber(String(v.SellingPrice ?? ""));
//     const offer = parseMoneyToNumber(String(v.OfferPrice ?? ""));
//     if (mrp > 0 && offer > 0 && mrp > offer) {
//       return `₹${(mrp - offer).toLocaleString("en-IN")} OFF`;
//     }
//     return "";
//   }

//   trackByVariantId(_: number, v: Variant): string {
//     return v.variantsid;
//   }
//   // loadGroupedProducts(): void {
//   //   this.groupedWithProducts$ = this.categoryService
//   //     .getGroupedCategories()
//   //     .pipe(
//   //       map((groups) => {
//   //         return groups;
//   //       }),
//   //       switchMap((groups) => {
//   //         return this.productService.getProducts().pipe(
//   //           map((allProducts) => ({
//   //             groups,
//   //             allProducts,
//   //           })),
//   //         );
//   //       }),
//   //       map(({ groups, allProducts }) => {
//   //         const validProducts = allProducts.filter((p) =>
//   //           this.hasValidImage(p),
//   //         );

//   //         console.log("Valid Products : ", validProducts);

//   //         return groups
//   //           .map((group) => {
//   //             const groupCategoryIds = new Set<string>([
//   //               String(group.id),
//   //               ...group.items.map((it) => String(it.id)),
//   //             ]);

//   //             const products = validProducts.filter((p) => {
//   //               return (
//   //                 p.Category?.CategoryId != null &&
//   //                 groupCategoryIds.has(String(p.Category.CategoryId))
//   //               );
//   //             });

//   //             return { group, products };
//   //           })
//   //           .filter((entry) => entry.products.length > 0);
//   //       }),
//   //     );
//   // }
//   loadGroupedProducts(): void {
//     this.isLoading = true;

//     this.groupedWithProducts$ = this.categoryService
//       .getGroupedCategories()
//       .pipe(
//         switchMap((groups) => {
//           return this.productService.getProducts().pipe(
//             map((allProducts) => ({
//               groups,
//               allProducts,
//             })),
//           );
//         }),

//         map(({ groups, allProducts }) => {
//           const validProducts = allProducts.filter((p) =>
//             this.hasValidImage(p),
//           );
//           console.log("Valid Products : ", validProducts);
//           return groups
//             .map((group) => {
//               const groupCategoryIds = new Set<string>([
//                 String(group.id),
//                 ...group.items.map((it) => String(it.id)),
//               ]);

//               const products = validProducts.filter((p) => {
//                 return (
//                   p.Category?.CategoryId != null &&
//                   groupCategoryIds.has(String(p.Category.CategoryId))
//                 );
//               });

//               return { group, products };
//             })
//             .filter((entry) => entry.products.length > 0);
//         }),

//         tap(() => {
//           this.isLoading = false;
//         }),
//         catchError((error) => {
//           console.error(error);
//           this.isLoading = false;
//           return of([]);
//         }),
//       );
//   }

//   scrollRail(index: number): void {
//     const rails = this.railRefs.toArray();
//     const el = rails[index]?.nativeElement;
//     if (!el) return;
//     el.scrollBy({ left: el.clientWidth, behavior: "smooth" });
//   }

//   // ── Navigate to the full category listing ──
//   // goToCategory(groupId: string): void {
//   //   this.router.navigate(["/category", groupId]);
//   // }
//   goToCategory(group: any): void {
//     this.router.navigate(["/category", group.id], {
//       state: {
//         category: {
//           id: group.id,
//           category: group.category,
//           parentCategory: group.parentCategory ?? null,
//           children: group.children ?? [],
//         } as CategoryNavState,
//       },
//     });
//   }

//   buildImageUrl(relative?: string): string {
//     if (!relative) return "assets/placeholder-bike.svg";
//     const t = relative.trim();
//     if (!t) return "assets/placeholder-bike.svg";
//     if (t.startsWith("assets/") || t.startsWith("/assets/")) return t;
//     if (t.startsWith("//")) return `https:${t}`;
//     if (/^https?:\/\//i.test(t)) return t;
//     return `${this.imgBase}/${t.replace(/^\/+/, "")}`;
//   }

//   onImgError(ev: Event): void {
//     const img = ev.target as HTMLImageElement;
//     if (img) img.src = "assets/placeholder-bike.png";
//   }

//   emiText(price?: string): string {
//     const base = parseMoneyToNumber(price);
//     if (!base) return "";
//     return `or Rs. ${Math.round(base / 12).toLocaleString("en-IN")}/Month 🟢 Buy on EMI ›`;
//   }

//   openProduct(id: string): void {
//     if (id == null) return;
//     this.router.navigate(["/products", id]);
//   }

//   private hasValidImage(p: Product): boolean {
//     const url = String((p as any).ImageUrl || (p as any).Image || "").trim();
//     //console.log("Url of each items : ", url);
//     return url.length > 0 && url !== "null" && url !== "undefined";
//   }

//   // Type-safe accessors for description block
//   asStructured(b: DescriptionBlock): ParsedDescription {
//     return b as ParsedDescription;
//   }
//   asPlain(b: DescriptionBlock): PlainDescription {
//     return b as PlainDescription;
//   }

//   addToCart(p: Product, event: Event): void {
//     event.stopPropagation(); // prevent card click navigating to product page
//     const mrp = parseMoneyToNumber((p as any).SellingPrice) || 0;
//     const deal = parseMoneyToNumber((p as any).OfferPrice) || 0;
//     const image = String(p?.imageUrl || (p as any).Image || "").trim();

//     const emptyAttributes = (p?.propertyAttributes || []).reduce(
//       (acc: any, attr: any) => {
//         acc[attr.name] = attr.type === "Checkbox" ? [] : "";
//         return acc;
//       },
//       {},
//     );

//     this.store.dispatch(
//       updateOrAddItem({
//         item: {
//           productId: String(p.ProductId ?? ""),
//           title: `${p.ProductName ?? ""}`.trim(),
//           mrp,
//           dealPrice: deal,
//           quantity: 1,
//           imageUrl: image,
//           item: { ...p }, // ✅ was: p — clone instead of shared reference
//           isService: p?.isService ?? false,
//           available_properties: p?.propertyAttributes ?? null,
//           propertyAttributes: emptyAttributes,
//         },
//       }),
//     );

//     this.store
//       .select(selectCartItems)
//       .pipe(take(1))
//       .subscribe((items) => {
//         if (items.length > 0) {
//           // console.log("Last Added Item:", items[items.length - 1]);
//         }
//       });

//     this.drawer.openCart();
//   }
//   onDrawerChange(state: DrawerState): void {
//     // no-op: this component no longer owns the global drawer
//   }

//   /**
//    * Expose String() to the template so we can call
//    * qtyMap.get(String(p.ProductId)) without a helper pipe.
//    */
//   readonly String = String;

//   /** Increase qty for a non-variant product already in the cart */
//   increaseCartQty(p: Product, currentQty: number, event: Event): void {
//     event.stopPropagation();
//     this.store.dispatch(
//       updateQuantity({
//         productId: String(p.ProductId ?? ""),
//         quantity: currentQty + 1,
//       }),
//     );
//     this.drawer.openCart();
//   }

//   /** Decrease qty for a non-variant product; removes when qty reaches 0 */
//   decreaseCartQty(p: Product, currentQty: number, event: Event): void {
//     event.stopPropagation();
//     const pid = String(p.ProductId ?? "");
//     if (currentQty <= 1) {
//       this.store.dispatch(removeItem({ productId: pid }));
//     } else {
//       this.store.dispatch(
//         updateQuantity({ productId: pid, quantity: currentQty - 1 }),
//       );
//     }
//   }
// }
import {
  Component,
  OnInit,
  ElementRef,
  QueryList,
  ViewChildren,
  ChangeDetectorRef,
  HostListener,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import {
  Observable,
  catchError,
  combineLatest,
  forkJoin,
  map,
  of,
  switchMap,
  take,
  tap,
} from "rxjs";
// import { CategoryService } from "../../services/category.service";
import { CategoryService } from "../../services/category.service copy";
import {
  GroupedCategory,
  DescriptionBlock,
  ParsedDescription,
  PlainDescription,
  CategoryNavState,
} from "../../models/category.model";
// import { ProductService } from "../../services/product.service";
import { ProductService } from "../../services/product.service copy";
import { Product, Variant } from "../../models/product.model";
import { parseMoneyToNumber } from "../../utils/price.util"; // adjust path if needed
// ADD alongside existing imports
import { Store } from "@ngrx/store";
import {
  updateOrAddItem,
  updateQuantity,
  removeItem,
} from "../../models/cart/cart.actions";
import { DrawerService } from "../drawer/drawer.service";
import { VariantDropdownComponent } from "./../variant-dropdown/variant-dropdown.component";
import { DrawerState } from "../drawer/drawer-state";
//import { Product_URL, Service_URL } from "../../utils/constant";
import { selectCartItems } from "../../models/cart/cart.selectors";
import { LoadingScreenComponent } from "../loading-screen/loading-screen.component";

@Component({
  selector: "app-categories",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    VariantDropdownComponent,
    LoadingScreenComponent,
  ], // RouterModule for routerLink on View btn
  templateUrl: "./categories.component.html",
  styleUrls: ["./categories.component.scss"],
})
export class CategoriesComponent implements OnInit {
  // groupedWithProducts$!: Observable<
  //   { group: GroupedCategory; products: Product[] }[]
  // >;

  // VARIANT modal state
  selectedVariants = new Map<string, Variant | null>();
  variantModalProduct: Product | null = null;
  cartQtyMap$!: Observable<Map<string, number>>;

  // One rail ElementRef per category section, matched by index
  @ViewChildren("rail") railRefs!: QueryList<ElementRef<HTMLElement>>;

  private readonly imgBase = "https://dev.fr.api.intellesyde.com";
  //private readonly imgBase = "http://localhost:8080";

  isLoading = true;
  constructor(
    private categoryService: CategoryService,
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private store: Store,
    private drawer: DrawerService,
    private el: ElementRef,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // ── DO NOT call loadGroupedProducts() here directly. ────────────────────
    // On first load the seller ID is not yet available (SellerService async),
    // so getGroupedCategories() returns early with "Seller ID not loaded yet".
    // The correct trigger is productService.refreshProducts$, which app.component
    // emits AFTER the seller has loaded and category/product APIs are ready.
    // On second+ loads the seller is restored from localStorage, so refreshProducts$
    // fires immediately and data loads without needing this early call.

    // build live cart-quantity map
    // this.cartQtyMap$ = this.store.select(selectCartItems).pipe(
    //   map((items: any[]) => {
    //     const m = new Map<string, number>();
    //     for (const item of items) {
    //       m.set(item.productId, item.quantity);
    //     }
    //     return m;
    //   }),
    // );

    this.cartQtyMap$ = this.store.select(selectCartItems).pipe(
      map((items: any[]) => {
        const m = new Map<string, number>();

        items.forEach((item) => {
          m.set(String(item.productId), Number(item.quantity));
        });

        console.log("Cart Variant Map:", m);

        return m;
      }),
    );

    // Single source of truth for product loading — fires after seller is ready
    this.productService.refreshProducts$.subscribe(() => {
      console.log("Refreshing category products...");
      this.loadGroupedProducts();
    });
  }

  groupedWithProducts$!: Observable<
    { group: GroupedCategory; products: Product[]; hasMore?: boolean }[]
  >;

  private readonly MOBILE_LIMIT = 4;

  private get isMobile(): boolean {
    return typeof window !== "undefined" && window.innerWidth <= 768;
  }

  loadGroupedProducts(): void {
    this.isLoading = true;

    this.groupedWithProducts$ = (
      this.isMobile ? this.loadMobileRails() : this.loadAllRails()
    ).pipe(
      tap(() => (this.isLoading = false)),
      catchError((error) => {
        console.error(error);
        this.isLoading = false;
        return of([]);
      }),
    );
  }

  /** MOBILE: one small request per category (limit + 1 to know if "View All" is needed) */
  private loadMobileRails() {
    return this.categoryService.getGroupedCategories().pipe(
      switchMap((groups) =>
        groups.length
          ? forkJoin(
              groups.map((group) => {
                const ids = [
                  String(group.id),
                  ...group.items.map((it) => String(it.id)),
                ];
                return this.productService
                  .getProductsByCategoryIds(ids, 0, 0, this.MOBILE_LIMIT + 1)
                  .pipe(
                    map((res) => {
                      const valid = res.products.filter((p) =>
                        this.hasValidImage(p),
                      );
                      return {
                        group,
                        products: valid.slice(0, this.MOBILE_LIMIT),
                        hasMore: valid.length > this.MOBILE_LIMIT,
                      };
                    }),
                  );
              }),
            )
          : of([]),
      ),
      map((entries) => entries.filter((e) => e.products.length > 0)),
    );
  }

  private loadAllRails() {
    return this.categoryService.getGroupedCategories().pipe(
      switchMap((groups) =>
        this.productService
          .getProducts()
          .pipe(map((allProducts) => ({ groups, allProducts }))),
      ),
      map(({ groups, allProducts }) => {
        const validProducts = allProducts.filter((p) => this.hasValidImage(p));
        return groups
          .map((group) => {
            const groupCategoryIds = new Set<string>([
              String(group.id),
              ...group.items.map((it) => String(it.id)),
            ]);
            const products = validProducts.filter(
              (p) =>
                p.Category?.CategoryId != null &&
                groupCategoryIds.has(String(p.Category.CategoryId)),
            );
            return { group, products, hasMore: products.length > 4 };
          })
          .filter((entry) => entry.products.length > 0);
      }),
    );
  }

  @HostListener("document:keydown.escape")
  onEscapeKey(): void {
    if (this.variantModalProduct) this.closeVariantPopup();
  }

  // Closes the variant modal on any click outside its panel. This is what
  // catches clicks inside the cart drawer: the drawer renders above the
  // vm-backdrop in stacking order and physically intercepts the click
  // before it can reach the backdrop element, so the backdrop's own
  // (click) handler alone can't close the modal in that case. A listener
  // bound at the document level catches it regardless of where the click
  // target sits in the DOM/z-index stack.
  @HostListener("document:click", ["$event"])
  onDocumentClick(ev: Event): void {
    if (!this.variantModalProduct) return;
    try {
      const panel = this.el.nativeElement.querySelector(".vm-panel");
      if (!panel || !panel.contains(ev.target as Node)) {
        this.closeVariantPopup();
      }
    } catch {
      this.closeVariantPopup();
    }
  }

  /** Opens the global variant modal for a product */
  openVariantPopup(product: Product, event?: Event): void {
    if (event) event.stopPropagation();
    this.variantModalProduct = product;
    // default selected variant
    const pid = String(product.ProductId ?? "");
    if (!this.selectedVariants.has(pid)) {
      this.selectedVariants.set(pid, product.variants?.[0] ?? null);
    }
    // Body scroll is intentionally left unlocked so the user can keep
    // scrolling the page while the variant modal is open.
  }

  closeVariantPopup(): void {
    this.variantModalProduct = null;
    // this.drawer.close();
  }

  getSelectedVariant(product: Product): Variant | null {
    const pid = String(product.ProductId ?? "");
    if (this.selectedVariants.has(pid)) {
      return this.selectedVariants.get(pid) ?? null;
    }
    const first = product.variants?.[0] ?? null;
    this.selectedVariants.set(pid, first);
    return first;
  }

  selectVariant(product: Product, variant: Variant): void {
    this.selectedVariants.set(String(product.ProductId ?? ""), variant);
  }

  variantRowCartKey(product: Product, variant: Variant): string {
    return `${String(product.ProductId ?? "")}__v${variant.variantsid}`;
  }

  getRowVariantQty(
    product: Product,
    variant: Variant,
    qtyMap: Map<string, number>,
  ): number {
    return qtyMap.get(this.variantRowCartKey(product, variant)) ?? 0;
  }

  getTotalVariantQty(product: Product, qtyMap: Map<string, number>): number {
    if (!product?.variants?.length) {
      return 0;
    }

    return product.variants.reduce((total, variant) => {
      const key = this.variantRowCartKey(product, variant);
      return total + (qtyMap.get(key) ?? 0);
    }, 0);
  }

  rowVariantInCart(
    product: Product,
    variant: Variant,
    qtyMap: Map<string, number>,
  ): boolean {
    return this.getRowVariantQty(product, variant, qtyMap) > 0;
  }

  addRowVariantToCart(product: Product, variant: Variant, event: Event): void {
    event.stopPropagation();

    const key = this.variantRowCartKey(product, variant);

    const sellingPrice = variant?.SellingPrice ?? (product as any).SellingPrice;
    const offerPrice = variant?.OfferPrice ?? (product as any).OfferPrice;

    const mrp = parseMoneyToNumber(String(sellingPrice ?? "")) || 0;

    const dealPrice = parseMoneyToNumber(String(offerPrice ?? "")) || mrp;

    const title = `${
      product.ProductName ?? ""
    } - ${variant.variantsName}`.trim();

    const image = String(
      (product as any).ImageUrl || (product as any).Image || "",
    ).trim();

    const productSnapshot = { ...product, selectedVariant: variant };

    this.store.dispatch(
      updateOrAddItem({
        item: {
          productId: key,
          title,
          mrp,
          dealPrice: dealPrice,
          quantity: 1,
          imageUrl: image,
          item: productSnapshot, // ✅ was: product
          selectedVariant: variant,
          totalVariants: product?.variants,
          isService: product?.isService ?? false,
        },
      }),
    );

    // this.drawer.openCart();
  }

  increaseRowVariant(
    product: Product,
    variant: Variant,
    qtyMap: Map<string, number>,
    event: Event,
  ): void {
    event.stopPropagation();
    const key = this.variantRowCartKey(product, variant);
    this.store.dispatch(
      updateQuantity({ productId: key, quantity: (qtyMap.get(key) ?? 0) + 1 }),
    );
    // this.drawer.openCart();
  }

  decreaseRowVariant(
    product: Product,
    variant: Variant,
    qtyMap: Map<string, number>,
    event: Event,
  ): void {
    event.stopPropagation();
    const key = this.variantRowCartKey(product, variant);
    const current = qtyMap.get(key) ?? 0;
    if (current <= 1) {
      this.store.dispatch(removeItem({ productId: key }));
    } else {
      this.store.dispatch(
        updateQuantity({ productId: key, quantity: current - 1 }),
      );
    }
  }

  updateCartQtyFromInput(p: Product, event: Event): void {
    event.stopPropagation();

    const input = event.target as HTMLInputElement;
    const qty = Number(input.value);

    const pid = String(p.ProductId ?? "");

    if (isNaN(qty) || qty <= 0) {
      this.store.dispatch(removeItem({ productId: pid }));
      return;
    }

    this.store.dispatch(
      updateQuantity({
        productId: pid,
        quantity: qty,
      }),
    );
    // this.drawer.openCart();
  }

  allowOnlyIntegers(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;

    const allowedKeys = [
      "Backspace",
      "Delete",
      "ArrowLeft",
      "ArrowRight",
      "Tab",
      "Home",
      "End",
    ];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    // only digits
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
      return;
    }

    // allow only 4 digits
    if (input.value.length >= 4) {
      event.preventDefault();
    }
  }

  updateRowVariantQtyFromInput(
    product: Product,
    variant: Variant,
    qtyMap: Map<string, number>,
    event: Event,
  ): void {
    event.stopPropagation();

    const input = event.target as HTMLInputElement;

    let qty = Number(input.value);

    // Allow only whole numbers
    if (isNaN(qty) || qty < 1) {
      qty = 1;
    }

    qty = Math.floor(qty); // 2.9 => 2

    input.value = String(qty);

    const key = this.variantRowCartKey(product, variant);

    this.store.dispatch(
      updateQuantity({
        productId: key,
        quantity: qty,
      }),
    );

    // this.drawer.openCart();
  }

  parsePrice(val: string | number | null | undefined): number {
    if (val == null) return 0;
    if (typeof val === "number") return val;
    return parseMoneyToNumber(val) ?? 0;
  }

  variantOfferText(v: Variant): string {
    // If offerText exists, only show it when it is NOT a 0 OFF value
    if (v.offerText) {
      const match = String(v.offerText).match(/₹?\s*([\d,]+(?:\.\d+)?)\s*OFF/i);

      if (match) {
        const discount = parseFloat(match[1].replace(/,/g, ""));

        if (discount > 0) {
          return `${discount.toLocaleString("en-IN")}% OFF`;
        }

        return "";
      }

      return String(v.offerText);
    }

    const mrp = parseMoneyToNumber(String(v.SellingPrice ?? ""));
    const offer = parseMoneyToNumber(String(v.OfferPrice ?? ""));

    const discount = mrp - offer;

    if (mrp > 0 && offer > 0 && discount > 0) {
      return `${discount.toLocaleString("en-IN")}% OFF`;
    }

    return "";
  }

  trackByVariantId(_: number, v: Variant): string {
    return v.variantsid;
  }

  scrollRail(index: number): void {
    const rails = this.railRefs.toArray();
    const el = rails[index]?.nativeElement;
    if (!el) return;
    el.scrollBy({ left: el.clientWidth, behavior: "smooth" });
  }

  // ── Navigate to the full category listing ──
  // goToCategory(groupId: string): void {
  //   this.router.navigate(["/category", groupId]);
  // }
  goToCategory(group: any): void {
    this.router.navigate(["/category", group.id], {
      state: {
        category: {
          id: group.id,
          category: group.category,
          parentCategory: group.parentCategory ?? null,
          children: group.children ?? [],
        } as CategoryNavState,
      },
    });
  }

  buildImageUrl(relative?: string): string {
    if (!relative) return "assets/placeholder-bike.svg";
    const t = relative.trim();
    if (!t) return "assets/placeholder-bike.svg";
    if (t.startsWith("assets/") || t.startsWith("/assets/")) return t;
    if (t.startsWith("//")) return `https:${t}`;
    if (/^https?:\/\//i.test(t)) return t;
    return `${this.imgBase}/${t.replace(/^\/+/, "")}`;
  }

  onImgError(ev: Event): void {
    const img = ev.target as HTMLImageElement;
    if (img) img.src = "assets/placeholder-bike.png";
  }

  emiText(price?: string): string {
    const base = parseMoneyToNumber(price);
    if (!base) return "";
    return `or Rs. ${Math.round(base / 12).toLocaleString("en-IN")}/Month 🟢 Buy on EMI ›`;
  }

  openProduct(id: string): void {
    if (id == null) return;
    this.router.navigate(["/product", id]);
  }

  private hasValidImage(p: Product): boolean {
    const url = String((p as any).ImageUrl || (p as any).Image || "").trim();
    //console.log("Url of each items : ", url);
    return url.length > 0 && url !== "null" && url !== "undefined";
  }

  // Type-safe accessors for description block
  asStructured(b: DescriptionBlock): ParsedDescription {
    return b as ParsedDescription;
  }
  asPlain(b: DescriptionBlock): PlainDescription {
    return b as PlainDescription;
  }

  addToCart(p: Product, event: Event): void {
    event.stopPropagation(); // prevent card click navigating to product page
    const mrp = parseMoneyToNumber((p as any).SellingPrice) || 0;
    // ✅ Fall back to mrp (not 0) when the product has no active offer —
    // matches buildCartItem() in product.component.ts.
    const deal = parseMoneyToNumber((p as any).OfferPrice) || mrp;
    const image = String(p?.imageUrl || (p as any).Image || "").trim();

    const emptyAttributes = (p?.propertyAttributes || []).reduce(
      (acc: any, attr: any) => {
        acc[attr.name] = attr.type === "Checkbox" ? [] : "";
        return acc;
      },
      {},
    );

    this.store.dispatch(
      updateOrAddItem({
        item: {
          productId: String(p.ProductId ?? ""),
          title: `${p.ProductName ?? ""}`.trim(),
          mrp,
          dealPrice: deal,
          quantity: 1,
          imageUrl: image,
          item: { ...p }, // ✅ was: p — clone instead of shared reference
          isService: p?.isService ?? false,
          available_properties: p?.propertyAttributes ?? null,
          propertyAttributes: emptyAttributes,
        },
      }),
    );

    this.store
      .select(selectCartItems)
      .pipe(take(1))
      .subscribe((items) => {
        if (items.length > 0) {
          // console.log("Last Added Item:", items[items.length - 1]);
        }
      });

    // this.drawer.openCart();
  }
  onDrawerChange(state: DrawerState): void {
    // no-op: this component no longer owns the global drawer
  }

  /**
   * Expose String() to the template so we can call
   * qtyMap.get(String(p.ProductId)) without a helper pipe.
   */
  readonly String = String;

  /** Increase qty for a non-variant product already in the cart */
  increaseCartQty(p: Product, currentQty: number, event: Event): void {
    event.stopPropagation();
    this.store.dispatch(
      updateQuantity({
        productId: String(p.ProductId ?? ""),
        quantity: currentQty + 1,
      }),
    );
    // this.drawer.openCart();
  }

  /** Decrease qty for a non-variant product; removes when qty reaches 0 */
  decreaseCartQty(p: Product, currentQty: number, event: Event): void {
    event.stopPropagation();
    const pid = String(p.ProductId ?? "");
    if (currentQty <= 1) {
      this.store.dispatch(removeItem({ productId: pid }));
    } else {
      this.store.dispatch(
        updateQuantity({ productId: pid, quantity: currentQty - 1 }),
      );
    }
  }

  /** True only when there's an actual discount (not just OfferPrice == SellingPrice) */
  hasDiscount(p: Product): boolean {
    const offer = this.parsePrice((p as any).OfferPrice);
    const selling = this.parsePrice((p as any).SellingPrice);
    return offer > 0 && offer !== selling;
  }

  /** Min/max effective price across a product's variants, for the "from ₹x - ₹y" line */
  getVariantPriceRange(p: Product): { min: number; max: number } | null {
    if (!p.variants?.length) return null;

    const prices = p.variants.map((v) => {
      const offer = this.parsePrice(v.OfferPrice);
      const selling = this.parsePrice(v.SellingPrice);
      return offer > 0 ? offer : selling;
    });

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
  }
}
