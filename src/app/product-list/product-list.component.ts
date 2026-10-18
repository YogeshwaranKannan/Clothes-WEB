// import {
//   Component,
//   inject,
//   HostListener,
//   ElementRef,
//   OnInit,
//   Input,
//   ViewChild,
//   AfterViewInit,
//   OnDestroy,
//   NgZone,
//   ChangeDetectorRef,
// } from "@angular/core";
// import { CommonModule } from "@angular/common";
// import {
//   ActivatedRoute,
//   RouterModule,
//   Router,
//   NavigationEnd,
// } from "@angular/router";
// // import {
// //   BehaviorSubject,
// //   Observable,
// //   combineLatest,
// //   map,
// //   Subscription,
// //   switchMap,
// //   of,
// //   Subject,
// //   fromEvent,
// //   filter,
// //   distinctUntilChanged,
// // } from "rxjs";

// import {
//   BehaviorSubject,
//   Observable,
//   combineLatest,
//   map,
//   Subscription,
//   switchMap,
//   of,
//   from,
//   Subject,
//   fromEvent,
//   filter,
//   distinctUntilChanged,
// } from "rxjs";
// import { takeUntil } from "rxjs/operators";

// import { Product, Variant } from "../common/models/product.model";
// import { ProductSuggestComponent } from "../common/components/product-suggest/product-suggest.component";
// // import { ProductService } from "../common/services/product.service";
// import { ProductService } from "../common/services/product.service copy";
// import { UserFiltersComponent } from "../common/components/user-filters/user-filters.component";
// import { parseMoneyToNumber } from "../common/utils/price.util";
// // import { CategoryService } from "../common/services/category.service";
// import { CategoryService } from "../common/services/category.service copy";
// import { Store } from "@ngrx/store";
// import {
//   updateOrAddItem,
//   updateQuantity,
//   removeItem,
// } from "../common/models/cart/cart.actions";
// import { selectCartItems } from "../common/models/cart/cart.selectors";
// import { CartItem } from "../common/models/cart/cart-item.model";
// import { DrawerService } from "../common/components/drawer/drawer.service";
// import { DrawerState } from "../common/components/drawer/drawer-state";
// import { Category } from "../common/models/category.model";
// import { CategoryNavState } from "../common/models/category.model";
// import { SellerService } from "../common/services/SellerService";
// import { ImageUrlService } from "../common/utils/ImageUrlService";
// type SortOption = "price-asc" | "price-desc" | "name-asc" | "name-desc" | "";

// @Component({
//   selector: "app-product-list",
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     UserFiltersComponent,
//     ProductSuggestComponent,
//   ],
//   templateUrl: "./product-list.component.html",
//   styleUrls: ["./product-list.component.scss"],
// })
// export class ProductListComponent implements OnInit, AfterViewInit, OnDestroy {
//   // ── Navigation-state fields ──────────────────────────────────────────────
//   /** Latest CategoryNavState from the navbar. Updated on every navigation. */
//   selectedCategory: CategoryNavState | null = null;
//   /** Breadcrumb items derived from selectedCategory */
//   // breadcrumb: string[] = [];
//   breadcrumb: {
//     label: string;
//     id: string;
//     state?: CategoryNavState | null;
//   }[] = [];

//   subCategories: Category[] = [];
//   /**
//    * Declared with ! — assigned in ngOnInit() before any subscriber runs.
//    * Use _productList$$ to switch sources reactively on re-navigation.
//    */
//   productList$!: Observable<Product[]>;

//   /**
//    * Inner subject: holds the current category-scoped product Observable.
//    * Seeded with getProducts() so field-initialiser streams have a valid
//    * source before ngOnInit fires.  Replaced on every NavigationEnd.
//    */
//   private _productList$$ = new BehaviorSubject<Observable<Product[]>>(
//     // Will be overwritten immediately in ngOnInit; safe placeholder.
//     of<Product[]>([]),
//   );

//   private store = inject(Store);

//   @Input() set products(value: Product[] | null | undefined) {
//     console.log("Received products:", value);

//     if (value != null) {
//       this.externalProducts$ = of(value);

//       value.forEach((product, index) => {
//         console.log(`Product ${index}:`, product);
//       });
//     }
//   }
//   @Input() mode: "default" | "similar" = "default";
//   @Input() hideFilters = false;
//   @Input() showHeading = true;
//   @Input() layout: "grid" | "rail" = "grid";
//   @Input() railTitle: string = "Products";
//   @Input() railScrollByPx: number = 640;
//   @Input() externalProducts$?: Observable<Product[]>;

//   @ViewChild("rail", { read: ElementRef }) railRef?: ElementRef<HTMLElement>;
//   @ViewChild("productsContainer", { read: ElementRef })
//   productsContainerRef?: ElementRef<HTMLElement>;

//   filtersCollapsed = false;

//   private groupOpen: Record<string, boolean> = {
//     brand: true,
//     category: true,
//     size: true,
//     gender: true,
//     discount: true,
//     price: true,
//   };

//   private categoryService = inject(CategoryService);
//   private route = inject(ActivatedRoute);
//   private router = inject(Router);
//   private productService = inject(ProductService);
//   private sellerService = inject(SellerService);
//   private drawer = inject(DrawerService);
//   private imageServiceUrl = inject(ImageUrlService);
//   mobileFiltersOpen = false;
//   mobileDrawerOpen = false;
//   mobileActiveGroup:
//     | "price"
//     | "discount"
//     | "brand"
//     | "category"
//     | "size"
//     | "gender"
//     | null = null;

//   openPanel:
//     | "price"
//     | "sale"
//     | "brand"
//     | "category"
//     | "size"
//     | "gender"
//     | "discount"
//     | null = null;

//   private el = inject(ElementRef);

//   selectedBrands$ = new BehaviorSubject<string[]>([]);
//   selectedCategoryIds$ = new BehaviorSubject<string[]>([]);
//   selectedSizes$ = new BehaviorSubject<string[]>([]);
//   selectedGenders$ = new BehaviorSubject<string[]>([]);
//   selectedDiscountTiers$ = new BehaviorSubject<number[]>([]);
//   priceMin$ = new BehaviorSubject<number | null>(null);
//   priceMax$ = new BehaviorSubject<number | null>(null);
//   searchTerm$ = new BehaviorSubject<string>("");
//   sort$ = new BehaviorSubject<SortOption>("");

//   // state
//   private currentCategoryIds: string[] = [];
//   allProducts: Product[] = [];
//   invTaken = 0;
//   servTaken = 0;
//   seeInv = 1;
//   seeServ = 1;
//   loadingMore = false;

//   private loadFirstPage(categoryIds: string[]): void {
//     this.currentCategoryIds = categoryIds;
//     this.invTaken = 0;
//     this.servTaken = 0;
//     this.seeInv = 1;
//     this.seeServ = 1;
//     this.allProducts = [];
//     this.fetchNextPage();
//   }

//   fetchNextPage(): void {
//     if (this.loadingMore) return;
//     if (this.seeInv === 0 && this.seeServ === 0 && this.allProducts.length)
//       return;

//     this.loadingMore = true;

//     this.productService
//       .getProductsByCategoryIds(
//         this.currentCategoryIds,
//         this.invTaken,
//         this.servTaken,
//       )
//       .subscribe({
//         next: (res) => {
//           this.allProducts = [...this.allProducts, ...res.products];
//           this.invTaken = res.invTaken;
//           this.servTaken = res.servTaken;
//           this.seeInv = res.seeInv;
//           this.seeServ = res.seeServ;
//           this.loadingMore = false;
//           this._productList$$.next(of(this.allProducts));
//         },
//         error: (err) => {
//           console.error("fetchNextPage failed:", err);
//           this.loadingMore = false; // <-- critical: without this, every future scroll is silently ignored
//         },
//       });
//   }

//   private ngZone = inject(NgZone);

//   @ViewChild("scrollSentinel", { read: ElementRef })
//   scrollSentinelRef?: ElementRef<HTMLElement>;

//   private scrollObserver?: IntersectionObserver;

//   // ── Variant state ─────────────────────────────────────────────────────────
//   /**
//    * Tracks the currently-selected Variant (or null = base product)
//    * keyed by ProductId string.
//    */
//   selectedVariants = new Map<string, Variant | null>();

//   /**
//    * The product whose variant modal is currently open.
//    * null = no modal.  Only one modal at a time.
//    */
//   variantModalProduct: Product | null = null;

//   /**
//    * Live map: cartKey → quantity.  cartKey = variantCartKey() result.
//    * Template uses this to decide Add vs Qty-stepper.
//    */
//   cartQtyMap$!: Observable<Map<string, number>>;

//   // ── Price slider helpers (unchanged) ────────────────────────────────────
//   lastPriceBounds: { min: number; max: number } = { min: 0, max: Infinity };
//   tempMinPrice: number | null = null;
//   tempMaxPrice: number | null = null;
//   activeThumb: "min" | "max" | null = null;
//   private _priceBoundsSub?: Subscription;
//   private readonly imgBase = "http://localhost:8080";
//   private destroyed$ = new Subject<void>();

//   // ── Streams ────────────────────────────────────────────────────────────────

//   // Category rail
//   categories$?: Observable<
//     (import("../common/models/category.model").CategoryItem & {
//       coverImageUrl: string;
//     })[]
//   >;
//   selectedRailCategoryId: string | null = null;

//   get displayProducts$(): Observable<Product[]> {
//     return (
//       (this.externalProducts$ as Observable<Product[]>) ??
//       this.filteredProducts$
//     );
//   }

//   /**
//    * Emits the route :id param on every navigation — including re-navigation
//    * to the same base path with a different id.
//    */
//   activeCategoryIds$: Observable<string[]> = this.route.paramMap.pipe(
//     map((pm) => {
//       const id = pm.get("id");
//       return id ? [id] : [];
//     }),
//   );

//   private cdr = inject(ChangeDetectorRef);
//   private resolvedImages = new Map<string, string>();
//   private readonly FALLBACK_IMG = "/assets/placeholder-bike.png";
//   readonly fallbackImg = "/assets/placeholder-bike.png";

//   // use ONE constant (make sure this file exists in src/assets)

//   onImgError(ev: Event) {
//     const img = ev.target as HTMLImageElement;
//     if (!img) return;
//     // stop only if the placeholder itself failed (avoids an infinite loop)
//     if (img.src.includes(this.fallbackImg)) return;
//     img.removeAttribute("srcset");
//     img.src = this.fallbackImg;
//   }

//   buildImageUrl(
//     relative?: string,
//     inventoryId?: string,
//     isService = false,
//   ): string {
//     // no image path at all -> straight to placeholder, no service call
//     if (!relative) return this.FALLBACK_IMG;

//     const key = `${isService ? "s" : "p"}|${inventoryId}|${relative}`;
//     const hit = this.resolvedImages.get(key);
//     if (hit) return hit;

//     this.resolvedImages.set(key, this.FALLBACK_IMG);

//     this.imageServiceUrl
//       .buildImageUrl(relative, inventoryId, isService)
//       .then((url) => {
//         this.resolvedImages.set(key, url || this.FALLBACK_IMG);
//         this.cdr.markForCheck();
//       })
//       .catch(() => {
//         this.resolvedImages.set(key, this.FALLBACK_IMG);
//         this.cdr.markForCheck();
//       });

//     return this.FALLBACK_IMG;
//   }

//   // buildImageUrl(
//   //   relative?: string,
//   //   inventoryId?: string,
//   //   isService: boolean = false,
//   // ): Promise<string> {
//   //   return this.imageServiceUrl.buildImageUrl(relative, inventoryId, isService);
//   // }

//   /**
//    * The pool of products that filter chips operate on.
//    *
//    * _productList$$ is a BehaviorSubject<Observable<Product[]>>.
//    * switchMap ensures we always subscribe to the LATEST inner Observable
//    * (i.e. the one assigned in loadProductsForCategory() on each navigation).
//    * No combineLatest with activeCategoryIds$ needed here — the category
//    * scoping is done inside getProductsByCategoryIds() before we push.
//    */
//   baseForFilters$: Observable<Product[]> = this._productList$$.pipe(
//     switchMap((src$: Observable<Product[]>) => src$),
//   );

//   availableBrandsWithCount$: Observable<
//     Array<{ value: string; count: number }>
//   > = this.baseForFilters$.pipe(
//     map((products) => {
//       const map = new Map<string, number>();
//       for (const p of products) {
//         const v = ((p as any).Brand ?? "").trim();
//         if (v) map.set(v, (map.get(v) ?? 0) + 1);
//       }
//       return Array.from(map.entries())
//         .map(([value, count]) => ({ value, count }))
//         .sort((a, b) => a.value.localeCompare(b.value));
//     }),
//   );

//   availableCategoriesWithCount$: Observable<
//     Array<{ id: string; name: string; count: number }>
//   > = this.baseForFilters$.pipe(
//     map((products) => {
//       const map = new Map<string, { name: string; count: number }>();
//       for (const p of products) {
//         const id = String((p as any).Category?.CategoryId ?? "").trim();
//         const name = ((p as any).Category?.CategoryName ?? "").trim();
//         if (id) {
//           const entry = map.get(id) ?? { name, count: 0 };
//           entry.count++;
//           map.set(id, entry);
//         }
//       }
//       return Array.from(map.entries())
//         .map(([id, { name, count }]) => ({ id, name, count }))
//         .sort((a, b) => a.name.localeCompare(b.name));
//     }),
//   );

//   availableSizesWithCount$: Observable<
//     Array<{ value: string; count: number }>
//   > = this.baseForFilters$.pipe(
//     map((products) => {
//       const map = new Map<string, number>();
//       for (const p of products) {
//         const v = ((p as any).Size ?? "").trim();
//         if (v) map.set(v, (map.get(v) ?? 0) + 1);
//       }
//       return Array.from(map.entries())
//         .map(([value, count]) => ({ value, count }))
//         .sort((a, b) => a.value.localeCompare(b.value));
//     }),
//   );

//   availableGendersWithCount$: Observable<
//     Array<{ value: string; count: number }>
//   > = this.baseForFilters$.pipe(
//     map((products) => {
//       const map = new Map<string, number>();
//       for (const p of products) {
//         const v = ((p as any).Gender ?? "").trim();
//         if (v) map.set(v, (map.get(v) ?? 0) + 1);
//       }
//       return Array.from(map.entries())
//         .map(([value, count]) => ({ value, count }))
//         .sort((a, b) => a.value.localeCompare(b.value));
//     }),
//   );

//   priceBounds$: Observable<{ min: number; max: number }> =
//     this.baseForFilters$.pipe(
//       map((products) => {
//         let min = Infinity,
//           max = -Infinity;
//         for (const p of products) {
//           const price = this.getEffectivePrice(p);
//           if (price != null) {
//             if (price < min) min = price;
//             if (price > max) max = price;
//           }
//         }
//         return min === Infinity
//           ? { min: 0, max: 0 }
//           : { min: Math.floor(min), max: Math.ceil(max) };
//       }),
//     );

//   priceTicks$: Observable<number[]> = this.priceBounds$.pipe(
//     map(({ min, max }) => {
//       if (max <= min) return [min, max];
//       const step = Math.round((max - min) / 4);
//       return [min, min + step, min + step * 2, min + step * 3, max];
//     }),
//   );

//   filteredProducts$: Observable<Product[]> = combineLatest([
//     this.baseForFilters$,
//     this.selectedBrands$,
//     this.selectedCategoryIds$,
//     this.selectedSizes$,
//     this.selectedGenders$,
//     this.selectedDiscountTiers$,
//     this.priceMin$,
//     this.priceMax$,
//     this.searchTerm$,
//     this.sort$,
//   ]).pipe(
//     map(
//       ([
//         products,
//         brands,
//         catIds,
//         sizes,
//         genders,
//         tiers,
//         priceMin,
//         priceMax,
//         term,
//         sort,
//       ]) => {
//         let list = products.slice();

//         if (brands.length) {
//           const set = new Set(brands);
//           list = list.filter((p) =>
//             set.has(String((p as any).Brand ?? "").trim()),
//           );
//         }

//         if (catIds.length) {
//           const set = new Set(catIds);
//           list = list.filter((p) =>
//             set.has(String((p as any).Category?.CategoryId ?? "")),
//           );
//         }

//         if (sizes.length) {
//           const set = new Set(sizes);
//           list = list.filter((p) =>
//             set.has(String((p as any).Size ?? "").trim()),
//           );
//         }

//         if (genders.length) {
//           const set = new Set(genders);
//           list = list.filter((p) =>
//             set.has(String((p as any).Gender ?? "").trim()),
//           );
//         }

//         if (tiers.length) {
//           const max = Math.max(...tiers);
//           list = list.filter((p) => this.getDiscountPercent(p) >= max);
//         }

//         if (priceMin != null || priceMax != null) {
//           list = list.filter((p) => {
//             const price = this.getEffectivePrice(p);
//             if (price == null) return false;
//             if (priceMin != null && price < priceMin) return false;
//             if (priceMax != null && price > priceMax) return false;
//             return true;
//           });
//         }

//         if (term.trim()) {
//           const q = term.toLowerCase();
//           list = list.filter(
//             (p) =>
//               p.ProductName?.toLowerCase().includes(q) ||
//               String((p as any).Brand ?? "")
//                 .toLowerCase()
//                 .includes(q) ||
//               String((p as any).Category?.CategoryName ?? "")
//                 .toLowerCase()
//                 .includes(q),
//           );
//         }

//         if (sort === "price-asc")
//           list.sort(
//             (a, b) =>
//               (this.getEffectivePrice(a) ?? 0) -
//               (this.getEffectivePrice(b) ?? 0),
//           );
//         if (sort === "price-desc")
//           list.sort(
//             (a, b) =>
//               (this.getEffectivePrice(b) ?? 0) -
//               (this.getEffectivePrice(a) ?? 0),
//           );
//         if (sort === "name-asc")
//           list.sort((a, b) =>
//             (a.ProductName ?? "").localeCompare(b.ProductName ?? ""),
//           );
//         if (sort === "name-desc")
//           list.sort((a, b) =>
//             (b.ProductName ?? "").localeCompare(a.ProductName ?? ""),
//           );

//         return list;
//       },
//     ),
//   );

//   placeholder$: Observable<string> = this.filteredProducts$.pipe(
//     map((list) => String(list.length)),
//   );

//   // ── ngOnInit ─────────────────────────────────────────────────────────────
//   ngOnInit(): void {
//     // ── Initial load ─────────────────────────────────────────────────────
//     // Angular reads history.state correctly on first component creation.
//     this.loadProductsForCategory();

//     // ── Re-navigation listener ────────────────────────────────────────────
//     // When the user clicks a different category in the navbar while already
//     // on /category/:id, Angular reuses this component instance (ngOnInit
//     // does NOT fire again).  We listen to NavigationEnd so every navbar
//     // click triggers a fresh product load regardless of route reuse.
//     this.router.events
//       .pipe(
//         filter((e): e is NavigationEnd => e instanceof NavigationEnd),
//         // React to any /category/ route — includes /category/ALL (all products)
//         // and /category/:specificId (filtered products).
//         filter((e) => e.urlAfterRedirects.includes("/category/")),
//         takeUntil(this.destroyed$),
//       )
//       .subscribe(() => {
//         this.loadProductsForCategory();
//       });

//     try {
//       this.onWindowResize();
//     } catch {}

//     this._priceBoundsSub = this.priceBounds$.subscribe((b) => {
//       this.lastPriceBounds = b;
//       if (
//         this.openPanel === "price" ||
//         this.tempMinPrice == null ||
//         this.tempMaxPrice == null
//       ) {
//         this.resetTempsToBounds();
//       }
//     });

//     // ── Build live cart-quantity map ────────────────────────────────────────
//     this.cartQtyMap$ = this.store.select(selectCartItems).pipe(
//       map((items: CartItem[]) => {
//         const m = new Map<string, number>();
//         for (const item of items) {
//           m.set(item.productId, item.quantity);
//         }
//         return m;
//       }),
//     );

//     // Load categories for the rail (reuse grouped categories).
//     // Cover image URLs are computed once here (not in the template) so
//     // Angular's change detection doesn't recompute them on every cycle.
//     // this.categories$ = this.categoryService.getGroupedCategories().pipe(
//     //   map((groups) => groups.flatMap((g) => g.items)),
//     //   map((cats) =>
//     //     cats.map((c) => ({
//     //       ...c,
//     //       coverImageUrl: this.imageServiceUrl.buildCategoryImageUrl(
//     //         c.coverImage,
//     //       ),
//     //     })),
//     //   ),
//     // );
//   }

//   selectRailCategory(category: any | null): void {
//     // ALL category
//     if (!category) {
//       this.selectedRailCategoryId = null;

//       this.router.navigate(["/category/ALL"], {
//         state: {
//           category: {
//             id: "ALL",
//             category: "All Categories",
//             parentCategory: null,
//             children: [],
//           },
//         },
//       });

//       return;
//     }

//     const categoryId = String(category.id);

//     this.selectedRailCategoryId = categoryId;

//     // Navigate to /category/{category.id}
//     this.router.navigate(["/category", categoryId], {
//       state: {
//         category: {
//           id: categoryId,
//           category: category.category,
//           parentCategory: category.parentCategory ?? null,
//           children: category.children ?? [],
//         },
//       },
//     });
//   }

//   // private loadProductsForCategory(): void {
//   //   const navState = history.state as {
//   //     category?: CategoryNavState;
//   //   };

//   //   const routeId = this.route.snapshot.paramMap.get("id");
//   //   const searchValue =
//   //     this.route.snapshot.queryParamMap.get("search")?.trim() ?? "";

//   //   // Prefer navigation state
//   //   this.selectedCategory = navState?.category ?? null;

//   //   // Fallback when page is refreshed or URL opened directly
//   //   if (!this.selectedCategory && routeId) {
//   //     this.selectedCategory = {
//   //       id: routeId,
//   //       category: routeId,
//   //       parentCategory: null,
//   //       children: [],
//   //     };
//   //   }

//   //   // Sync the header rail selection with the current navigation state.
//   //   // When there's no selected category or the route explicitly targets
//   //   // the 'ALL' pseudo-category, show the "All" chip (null). Otherwise
//   //   // mark the matching category id as selected so the active class
//   //   // reflects the current route on initial load / navigation.
//   //   if (!this.selectedCategory || this.selectedCategory.id === "ALL") {
//   //     this.selectedRailCategoryId = null;
//   //   } else {
//   //     this.selectedRailCategoryId = this.selectedCategory.id;
//   //   }

//   //   if (!this.selectedCategory) {
//   //     return;
//   //   }

//   //   // Build breadcrumb
//   //   this.buildBreadcrumb(this.selectedCategory);

//   //   // Use ONLY the clicked category ID
//   //   const categoryId =
//   //     routeId && routeId !== "ALL" ? routeId : this.selectedCategory.id;

//   //   const categoryIds =
//   //     categoryId && categoryId !== "ALL" ? [String(categoryId)] : [];

//   //   console.log("Selected Category:", this.selectedCategory);
//   //   console.log("Selected Category ID:", categoryId);
//   //   console.log("API Category IDs:", categoryIds);

//   //   // Load products
//   //   this.productList$ =
//   //     searchValue.length >= 3
//   //       ? this.productService.getProductsBySearchname(
//   //           searchValue,
//   //           String(categoryId ?? ""),
//   //         )
//   //       : this.productService.getProductsByCategoryIds(categoryIds);

//   //   this._productList$$.next(this.productList$);

//   //   // Reset filters
//   //   this.resetFilters();
//   // }

//   // private loadProductsForCategory(): void {
//   //   const navState = history.state as { category?: CategoryNavState };

//   //   const routeId = this.route.snapshot.paramMap.get("id");
//   //   const searchValue =
//   //     this.route.snapshot.queryParamMap.get("search")?.trim() ?? "";

//   //   this.selectedCategory = navState?.category ?? null;

//   //   if (!this.selectedCategory && routeId) {
//   //     this.selectedCategory = {
//   //       id: routeId,
//   //       category: routeId,
//   //       parentCategory: null,
//   //       children: [],
//   //     };
//   //   }

//   //   if (!this.selectedCategory || this.selectedCategory.id === "ALL") {
//   //     this.selectedRailCategoryId = null;
//   //   } else {
//   //     this.selectedRailCategoryId = this.selectedCategory.id;
//   //   }

//   //   if (!this.selectedCategory) {
//   //     return;
//   //   }

//   //   this.buildBreadcrumb(this.selectedCategory);

//   //   const categoryId =
//   //     routeId && routeId !== "ALL" ? routeId : this.selectedCategory.id;
//   //   const categoryIds =
//   //     categoryId && categoryId !== "ALL" ? [String(categoryId)] : [];

//   //   console.log("Selected Category:", this.selectedCategory);
//   //   console.log("Selected Category ID:", categoryId);
//   //   console.log("API Category IDs:", categoryIds);

//   //   this.resetFilters();

//   //   if (searchValue.length >= 3) {
//   //     // Search results aren't paginated through invTaken/servTaken today —
//   //     // keep the simple one-shot flow.
//   //     this.productList$ = this.productService.getProductsBySearchname(
//   //       searchValue,
//   //       String(categoryId ?? ""),
//   //     );
//   //     this._productList$$.next(this.productList$);
//   //   } else {
//   //     // Category browsing IS paginated — go through the new flow.
//   //     this.loadFirstPage(categoryIds);
//   //   }
//   // }

//   private loadProductsForCategory(): void {
//     const navState = history.state as { category?: CategoryNavState };

//     const routeId = this.route.snapshot.paramMap.get("id");
//     const searchValue =
//       this.route.snapshot.queryParamMap.get("search")?.trim() ?? "";

//     this.selectedCategory = navState?.category ?? null;

//     if (!this.selectedCategory && routeId) {
//       this.selectedCategory = {
//         id: routeId,
//         category: routeId,
//         parentCategory: null,
//         children: [],
//       };
//     }

//     if (!this.selectedCategory || this.selectedCategory.id === "ALL") {
//       this.selectedRailCategoryId = null;
//     } else {
//       this.selectedRailCategoryId = this.selectedCategory.id;
//     }

//     if (!this.selectedCategory) {
//       return;
//     }

//     this.buildBreadcrumb(this.selectedCategory);

//     // ✅ was: single [categoryId] — now uses parent + all nested children
//     this.subCategories =
//       this.selectedCategory.parentCategory === null
//         ? (this.selectedCategory.children ?? [])
//         : [];

//     const categoryIds = this.buildCategoryIds(this.selectedCategory);

//     console.log("Selected Category:", this.selectedCategory);
//     console.log("API Category IDs:", categoryIds);

//     this.resetFilters();

//     if (searchValue.length >= 3) {
//       this.productList$ = this.productService.getProductsBySearchname(
//         searchValue,
//         String(this.selectedCategory.id ?? ""),
//       );
//       this._productList$$.next(this.productList$);
//     } else {
//       this.loadFirstPage(categoryIds);
//     }
//   }

//   navigateSubCategory(child: Category): void {
//     if (!this.selectedCategory) return;

//     const state: CategoryNavState = {
//       id: child.id,
//       category: child.category,
//       parentCategory: {
//         id: this.selectedCategory.id,
//         category: this.selectedCategory.category,
//         parentCategory: null,
//       },
//       children: [],
//     };

//     this.router.navigate(["/category", child.id], {
//       state: { category: state },
//     });
//   }

//   trackById(_: number, item: Category): string {
//     return item.id;
//   }

//   private resetFilters(): void {
//     this.selectedBrands$.next([]);
//     this.selectedCategoryIds$.next([]);
//     this.selectedSizes$.next([]);
//     this.selectedGenders$.next([]);
//     this.selectedDiscountTiers$.next([]);

//     this.priceMin$.next(null);
//     this.priceMax$.next(null);

//     this.searchTerm$.next("");
//     this.sort$.next("");
//   }

//   updateVariantQtyFromInput(p: Product, event: Event): void {
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
//     // this.drawer.openCart();
//   }

//   updateRowVariantQtyFromInput(
//     product: Product,
//     variant: Variant,
//     qtyMap: Map<string, number>,
//     event: Event,
//   ): void {
//     const input = event.target as HTMLInputElement;

//     let qty = Number(input.value);

//     if (isNaN(qty) || qty < 1) {
//       qty = 1;
//     }

//     const key = this.variantRowCartKey(product, variant);

//     this.store.dispatch(
//       updateQuantity({
//         productId: key,
//         quantity: qty,
//       }),
//     );
//     // this.drawer.openCart();
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

//   private buildBreadcrumb(state: CategoryNavState | null) {
//     this.breadcrumb = [];

//     // All Categories
//     this.breadcrumb.push({
//       label: "All Categories",
//       id: "ALL",
//       state: null,
//     });

//     if (!state || state.id === "ALL") {
//       return;
//     }

//     // Parent category
//     if (state.parentCategory === null) {
//       this.breadcrumb.push({
//         label: state.category,
//         id: state.id,
//         state,
//       });
//       return;
//     }

//     // Child category
//     this.breadcrumb.push({
//       label: state.parentCategory.category,
//       id: state.parentCategory.id,
//       state: state.parentCategory,
//     });

//     this.breadcrumb.push({
//       label: state.category,
//       id: state.id,
//       state,
//     });
//   }

//   private buildCategoryIds(state: CategoryNavState | null): string[] {
//     // All products
//     if (!state) return [];

//     // Explicit ALL
//     if (state.id === "ALL") return [];

//     // Parent clicked
//     if (state.parentCategory === null) {
//       const ids: string[] = [state.id];

//       if (state.children?.length) {
//         ids.push(...this.collectChildIds(state.children));
//       }

//       return [...new Set(ids)];
//     }

//     // Child clicked
//     if (state.parentCategory !== null) {
//       return [state.parentCategory.id, state.id];
//     }

//     // Leaf parent
//     return [state.id];
//   }

//   /**
//    * Recursively collect all child ids
//    */
//   private collectChildIds(categories: Category[]): string[] {
//     const ids: string[] = [];

//     const walk = (cats: Category[]) => {
//       cats.forEach((cat) => {
//         ids.push(cat.id);

//         if (cat.children?.length) {
//           walk(cat.children);
//         }
//       });
//     };

//     walk(categories);

//     return ids;
//   }

//   ngAfterViewInit(): void {
//     // Note: the variant modal used to close on window/container/rail scroll.
//     // That was needed for the old anchored-dropdown UI, which had to track
//     // the trigger's position. The modal is now a fixed, centered overlay,
//     // so it doesn't need repositioning — and closing it on scroll would
//     // block the user from scrolling the page while it's open. No scroll
//     // listeners are attached here anymore.

//     this.setupInfiniteScrollObserver();
//   }

//   private setupInfiniteScrollObserver(): void {
//     const sentinel = this.scrollSentinelRef?.nativeElement;
//     if (!sentinel || !("IntersectionObserver" in window)) {
//       return;
//     }

//     // root: null tracks intersection against the browser viewport, which
//     // still works correctly even when the list scrolls inside a nested
//     // container (a mobile app-shell wrapper, a fixed-header layout, etc.) —
//     // unlike a window:scroll listener, which only fires when `window`
//     // itself is the element that scrolls.
//     this.scrollObserver = new IntersectionObserver(
//       (entries) => {
//         const isVisible = entries.some((e) => e.isIntersecting);
//         if (isVisible) {
//           // IntersectionObserver callbacks run outside Angular's zone,
//           // so re-enter it to make sure change detection picks up the
//           // loadingMore flag and the eventual product list update.
//           this.ngZone.run(() => this.fetchNextPage());
//         }
//       },
//       {
//         root: null,
//         rootMargin: "300px", // start loading ~300px before the sentinel is reached
//         threshold: 0,
//       },
//     );

//     this.scrollObserver.observe(sentinel);
//   }

//   ngOnDestroy(): void {
//     this.destroyed$.next();
//     this.destroyed$.complete();
//     this.scrollObserver?.disconnect();
//   }

//   // ─────────────────────────────────────────────────────────────────────────
//   //  VARIANT HELPERS  (new)
//   // ─────────────────────────────────────────────────────────────────────────

//   /**
//    * Returns the cart key for a product + optional variant.
//    * Format:  "PROD-1"          (no variant / base product)
//    *          "PROD-1__v2"      (variant with variantsid "2")
//    */
//   variantCartKey(product: Product, variant?: Variant | null): string {
//     const base = String(product.ProductId ?? "");
//     if (!variant) return base;
//     return `${base}__v${variant.variantsid}`;
//   }

//   /** Returns the currently-selected Variant for a card (or null = base product) */
//   getSelectedVariant(product: Product): Variant | null {
//     const pid = String(product.ProductId ?? "");
//     if (this.selectedVariants.has(pid)) {
//       return this.selectedVariants.get(pid) ?? null;
//     }
//     // Default to first variant on first access
//     const first = product.variants?.[0] ?? null;
//     this.selectedVariants.set(pid, first);
//     return first;
//   }

//   /** Sets the active variant for a card */
//   selectVariant(product: Product, variant: Variant): void {
//     this.selectedVariants.set(String(product.ProductId ?? ""), variant);
//   }

//   /** Opens the centered variant modal for this product */
//   openVariantModal(product: Product, event: Event): void {
//     event.stopPropagation();
//     this.variantModalProduct = product;
//     // Body scroll is intentionally left unlocked so the user can keep
//     // scrolling the page while the variant modal is open.
//   }
//   // openVariantModal(product: Product, event: Event): void {
//   //   event.stopPropagation();

//   //   this.variantModalProduct = product;

//   //   document.body.classList.add("variant-modal-open");
//   // }

//   //  Closes the variant modal */
//   closeVariantModal(): void {
//     this.variantModalProduct = null;
//     // this.drawer.close();
//   }
//   // closeVariantModal(): void {
//   //   this.variantModalProduct = null;

//   //   document.body.classList.remove("variant-modal-open");
//   // }

//   /** True when the modal is open for this specific product */
//   isVariantModalOpen(product: Product): boolean {
//     return this.variantModalProduct?.ProductId === product.ProductId;
//   }

//   /** @deprecated — kept for any template refs; delegates to modal approach */
//   closeAllVariantDropdowns(): void {
//     this.closeVariantModal();
//     this.drawer.close();
//   }
//   /** Gets current cart quantity for the active selection */
//   getVariantQty(product: Product, qtyMap: Map<string, number>): number {
//     const variant = this.getSelectedVariant(product);
//     const key = this.variantCartKey(product, variant);
//     return qtyMap.get(key) ?? 0;
//   }

//   /** True when the active selection is already in the cart */
//   variantInCart(product: Product, qtyMap: Map<string, number>): boolean {
//     return this.getVariantQty(product, qtyMap) > 0;
//   }

//   // getDropdownCoords removed — modal approach uses no coordinates

//   /** Normalise any price value (number | "Rs. 239.00" | null) to a number for the currency pipe */
//   parsePrice(val: string | number | null | undefined): number {
//     if (val == null) return 0;
//     if (typeof val === "number") return val;
//     return parseMoneyToNumber(val) ?? 0;
//   }

//   getTotalVariantQty(product: Product, qtyMap: Map<string, number>): number {
//     if (!product?.variants?.length) {
//       return 0;
//     }

//     return product.variants.reduce((total, variant) => {
//       const key = this.variantRowCartKey(product, variant);
//       return total + (qtyMap.get(key) ?? 0);
//     }, 0);
//   }
//   addVariantToCart(product: Product, event: Event): void {
//     event.stopPropagation();
//     const variant = this.getSelectedVariant(product);
//     const key = this.variantCartKey(product, variant);

//     const sellingPrice = variant?.SellingPrice ?? (product as any).SellingPrice;
//     const offerPrice = variant?.OfferPrice ?? (product as any).OfferPrice;
//     const mrp = parseMoneyToNumber(String(sellingPrice ?? "")) || 0;
//     // ✅ Fall back to mrp (not 0) when the variant has no active offer — same
//     // pattern as buildCartItem() in product.component.ts. Falling back to 0
//     // here was storing dealPrice:0 for every non-discounted variant, which
//     // cart-list.component.html papered over with its own mrp fallback for
//     // the line total, but selectCartTotal/selectCartFinalTotal trusted
//     // dealPrice as-is — summing to ₹0 for a cart full of "correct-looking"
//     // items.
//     const dealPrice = parseMoneyToNumber(String(offerPrice ?? "")) || mrp;
//     const title = variant
//       ? `${product.ProductName ?? ""} - ${variant.variantsName}`.trim()
//       : `${product.ProductName ?? ""}`.trim();

//     const image = String(
//       (product as any).ImageUrl || (product as any).Image || "",
//     ).trim();

//     // 🔧 FIX: clone product per cart line + record the variant that was
//     // active at add-time, same fix applied in addRowVariantToCart / product.component.ts.
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
//           selectedVariant: variant, // ✅ was missing entirely here
//           totalVariants: product?.variants,
//           isService: product.isService ?? false,
//         },
//       }),
//     );
//     // this.drawer.openCart();
//   }

//   increaseVariant(
//     product: Product,
//     qtyMap: Map<string, number>,
//     event: Event,
//   ): void {
//     event.stopPropagation();
//     const variant = this.getSelectedVariant(product);
//     const key = this.variantCartKey(product, variant);
//     const current = qtyMap.get(key) ?? 0;
//     this.store.dispatch(
//       updateQuantity({ productId: key, quantity: current + 1 }),
//     );
//     // this.drawer.openCart();
//   }

//   decreaseVariant(
//     product: Product,
//     qtyMap: Map<string, number>,
//     event: Event,
//   ): void {
//     event.stopPropagation();
//     const variant = this.getSelectedVariant(product);
//     const key = this.variantCartKey(product, variant);
//     const current = qtyMap.get(key) ?? 0;

//     if (current <= 1) {
//       this.store.dispatch(removeItem({ productId: key }));
//     } else {
//       this.store.dispatch(
//         updateQuantity({ productId: key, quantity: current - 1 }),
//       );
//     }
//   }

//   variantOfferText(v: Variant): string {
//     // If offerText exists, only show it when it is NOT a 0 OFF value
//     if (v.offerText) {
//       const match = String(v.offerText).match(/₹?\s*([\d,]+(?:\.\d+)?)\s*OFF/i);

//       if (match) {
//         const discount = parseFloat(match[1].replace(/,/g, ""));

//         if (discount > 0) {
//           return `${discount.toLocaleString("en-IN")}% OFF`;
//         }

//         return "";
//       }

//       return String(v.offerText);
//     }

//     const mrp = parseMoneyToNumber(String(v.SellingPrice ?? ""));
//     const offer = parseMoneyToNumber(String(v.OfferPrice ?? ""));

//     const discount = mrp - offer;

//     if (mrp > 0 && offer > 0 && discount > 0) {
//       return `${discount.toLocaleString("en-IN")}% OFF`;
//     }

//     return "";
//   }

//   emiText(price?: string | number): string {
//     const base = parseMoneyToNumber(String(price ?? ""));
//     if (!base) return "";
//     const perMonth = Math.round(base / 12);
//     return `or Rs. ${perMonth.toLocaleString("en-IN")}/Month 🟢 Buy on EMI ›`;
//   }

//   private getEffectivePrice(p: Product): number | null {
//     const offer = parseMoneyToNumber(String((p as any).OfferPrice ?? ""));
//     const mrp = parseMoneyToNumber(String((p as any).SellingPrice ?? ""));
//     const price = offer || mrp;
//     return price > 0 ? price : null;
//   }

//   private getDiscountPercent(p: Product): number {
//     const raw = (p as any).DiscountPercent as string | undefined;
//     if (raw?.trim()) {
//       const n = Number(raw.replace(/[^\d.]/g, ""));
//       if (Number.isFinite(n)) return n;
//     }
//     const mrp = parseMoneyToNumber(String((p as any).SellingPrice ?? ""));
//     const offer = parseMoneyToNumber(String((p as any).OfferPrice ?? ""));
//     if (mrp > 0 && offer > 0)
//       return Math.max(0, Math.round(((mrp - offer) / mrp) * 100));
//     return 0;
//   }

//   openProduct(id: string | number) {
//     if (id == null) return;
//     this.router.navigate(["/product", id]);
//   }

//   navigateBreadcrumb(item: any) {
//     if (item.id === "ALL") {
//       this.router.navigate(["/category/ALL"], {
//         state: {
//           category: {
//             id: "ALL",
//             category: "All Categories",
//             parentCategory: null,
//             children: [],
//           },
//         },
//       });
//       return;
//     }

//     this.router.navigate(["/category", item.id], {
//       state: {
//         category: item.state,
//       },
//     });
//   }

//   addToCart(p: Product, event: Event): void {
//     // Delegate to variant-aware method for all products
//     this.addVariantToCart(p, event);
//   }

//   toggleBrand(v: string) {
//     const c = [...this.selectedBrands$.value];
//     const i = c.indexOf(v);
//     i < 0 ? c.push(v) : c.splice(i, 1);
//     this.selectedBrands$.next(c);
//   }
//   toggleCategory(v: string) {
//     const c = [...this.selectedCategoryIds$.value];
//     const i = c.indexOf(v);
//     i < 0 ? c.push(v) : c.splice(i, 1);
//     this.selectedCategoryIds$.next(c);
//   }
//   toggleSize(v: string) {
//     const c = [...this.selectedSizes$.value];
//     const i = c.indexOf(v);
//     i < 0 ? c.push(v) : c.splice(i, 1);
//     this.selectedSizes$.next(c);
//   }
//   toggleGender(v: string) {
//     const c = [...this.selectedGenders$.value];
//     const i = c.indexOf(v);
//     i < 0 ? c.push(v) : c.splice(i, 1);
//     this.selectedGenders$.next(c);
//   }
//   toggleDiscountTier(v: number) {
//     const c = [...this.selectedDiscountTiers$.value];
//     const i = c.indexOf(v);
//     i < 0 ? c.push(v) : c.splice(i, 1);
//     this.selectedDiscountTiers$.next(c);
//   }
//   setMin(v: number | null) {
//     this.priceMin$.next(v);
//   }
//   setMax(v: number | null) {
//     this.priceMax$.next(v);
//   }
//   setSearchTerm(v: string) {
//     this.searchTerm$.next(v);
//   }
//   setSort(v: SortOption) {
//     this.sort$.next(v);
//   }
//   clearSearch() {
//     this.searchTerm$.next("");
//   }
//   isBrandSelected(v: string) {
//     return this.selectedBrands$.value.includes(v);
//   }
//   isCategorySelected(v: string) {
//     return this.selectedCategoryIds$.value.includes(v);
//   }
//   isSizeSelected(v: string) {
//     return this.selectedSizes$.value.includes(v);
//   }
//   isGenderSelected(v: string) {
//     return this.selectedGenders$.value.includes(v);
//   }
//   isDiscountSelected(v: number) {
//     return this.selectedDiscountTiers$.value.includes(v);
//   }

//   clearFilters() {
//     this.selectedBrands$.next([]);
//     this.selectedCategoryIds$.next([]);
//     this.selectedSizes$.next([]);
//     this.selectedGenders$.next([]);
//     this.selectedDiscountTiers$.next([]);
//     this.priceMin$.next(null);
//     this.priceMax$.next(null);
//     this.searchTerm$.next("");
//     this.sort$.next("");
//   }

//   clearOnly(key: string) {
//     switch (key) {
//       case "brand":
//         this.selectedBrands$.next([]);
//         break;
//       case "category":
//         this.selectedCategoryIds$.next([]);
//         break;
//       case "size":
//         this.selectedSizes$.next([]);
//         break;
//       case "gender":
//         this.selectedGenders$.next([]);
//         break;
//       case "discount":
//         this.selectedDiscountTiers$.next([]);
//         break;
//       case "price":
//         this.priceMin$.next(null);
//         this.priceMax$.next(null);
//         break;
//     }
//   }

//   toggleGroup(key: string) {
//     this.groupOpen[key] = !this.groupOpen[key];
//   }
//   isGroupOpen(key: string) {
//     return this.groupOpen[key] !== false;
//   }
//   toggleFiltersCollapse() {
//     this.filtersCollapsed = !this.filtersCollapsed;
//   }

//   closePanel() {
//     this.openPanel = null;
//   }
//   openMobileGroup(key: any) {
//     this.mobileActiveGroup = key;
//   }
//   closeMobileGroup() {
//     this.mobileActiveGroup = null;
//   }
//   openMobileDrawer() {
//     this.mobileDrawerOpen = true;
//     this.mobileActiveGroup = null;
//   }
//   closeMobileDrawer() {
//     this.mobileDrawerOpen = false;
//     this.mobileActiveGroup = null;
//   }

//   togglePanel(key: any) {
//     const willOpen = this.openPanel !== key;
//     this.openPanel = willOpen ? key : null;
//     if (willOpen && key === "price") {
//       const { min, max } = this.lastPriceBounds ?? { min: 0, max: 0 };
//       this.tempMinPrice = this.priceMin$.value ?? min;
//       this.tempMaxPrice = this.priceMax$.value ?? max;
//       if (this.tempMinPrice < min) this.tempMinPrice = min;
//       if (this.tempMaxPrice > max) this.tempMaxPrice = max;
//       if (this.tempMaxPrice - this.tempMinPrice < 1)
//         this.tempMaxPrice = Math.max(this.tempMinPrice + 1, max);
//     }
//   }

//   @HostListener("document:keydown.escape")
//   onEscapeKey(): void {
//     if (this.variantModalProduct) {
//       this.closeVariantModal();
//     }
//   }

//   @HostListener("document:click", ["$event"])
//   onDocumentClick(ev: Event): void {
//     try {
//       const container = this.el.nativeElement.querySelector(".filters-box");
//       if (!container || !container.contains(ev.target as Node)) {
//         this.openPanel = null;
//       }
//     } catch {
//       this.openPanel = null;
//     }

//     // Close the variant modal on any click outside its panel. The
//     // vm-backdrop's own (click) handler only fires for clicks that land
//     // directly on it — the cart drawer renders above it in stacking order,
//     // so clicks inside the drawer never reach the backdrop. This document
//     // listener catches those too, since it's bound at the document level
//     // regardless of where the click target sits in the DOM/z-index stack.
//     if (this.variantModalProduct) {
//       try {
//         const panel = this.el.nativeElement.querySelector(".vm-panel");
//         if (!panel || !panel.contains(ev.target as Node)) {
//           this.closeVariantModal();
//         }
//       } catch {
//         this.closeVariantModal();
//       }
//     }
//   }
//   // REPLACE WITH: merge into one resize handler + one dedicated scroll handler
//   @HostListener("window:resize", ["$event"])
//   onWindowResize(_ev?: Event): void {
//     // Close mobile drawer on wide screens
//     if (window.innerWidth >= 901) {
//       this.mobileDrawerOpen = false;
//       this.mobileActiveGroup = null;
//       document.body.classList.remove("no-scroll");
//     }
//     // Close modal on resize (avoids stale positioning edge cases)
//     if (this.variantModalProduct) {
//       this.closeVariantModal();
//     }
//   }

//   // Window/container scroll handling is attached via RxJS in ngAfterViewInit
//   private resetTempsToBounds() {
//     const { min, max } = this.lastPriceBounds ?? { min: 0, max: 0 };
//     this.tempMinPrice = min;
//     this.tempMaxPrice = max;
//   }

//   onMinSliderInput(v: string | number) {
//     const n = Number(v) || 0;
//     const { min, max } = this.lastPriceBounds;
//     let newMin = Math.round(n);
//     if (newMin < min) newMin = min;
//     if (newMin > max) newMin = max;
//     if (this.tempMaxPrice != null && newMin > this.tempMaxPrice)
//       newMin = this.tempMaxPrice;
//     this.tempMinPrice = newMin;
//     try {
//       this.priceMin$.next(this.tempMinPrice);
//     } catch {}
//   }

//   onMaxSliderInput(v: string | number) {
//     const n = Number(v) || 0;
//     const { min, max } = this.lastPriceBounds;
//     let newMax = Math.round(n);
//     if (newMax < min) newMax = min;
//     if (newMax > max) newMax = max;
//     if (this.tempMinPrice != null && newMax < this.tempMinPrice)
//       newMax = this.tempMinPrice;
//     this.tempMaxPrice = newMax;
//     try {
//       this.priceMax$.next(this.tempMaxPrice);
//     } catch {}
//   }

//   onThumbPointerDown(which: "min" | "max") {
//     this.activeThumb = which;
//   }
//   onThumbPointerUp() {
//     this.activeThumb = null;
//   }

//   applyPriceRange() {
//     this.closePanel();
//   }

//   clearPriceRange() {
//     this.priceMin$.next(null);
//     this.priceMax$.next(null);
//     this.resetTempsToBounds();
//   }

//   onMinInputChange(v: string) {
//     const n = Number(v.replace(/[^0-9.-]/g, "")) || 0;
//     const { min, max } = this.lastPriceBounds;
//     let newMin = Math.round(n);
//     if (newMin < min) newMin = min;
//     if (newMin > max) newMin = max;
//     if (this.tempMaxPrice != null && newMin > this.tempMaxPrice)
//       newMin = this.tempMaxPrice;
//     this.tempMinPrice = newMin;
//     try {
//       this.priceMin$.next(this.tempMinPrice);
//     } catch {}
//   }

//   onMaxInputChange(v: string) {
//     const n = Number(v.replace(/[^0-9.-]/g, "")) || 0;
//     const { min, max } = this.lastPriceBounds;
//     let newMax = Math.round(n);
//     if (newMax < min) newMax = min;
//     if (newMax > max) newMax = max;
//     if (this.tempMinPrice != null && newMax < this.tempMinPrice)
//       newMax = this.tempMinPrice;
//     this.tempMaxPrice = newMax;
//     try {
//       this.priceMax$.next(this.tempMaxPrice);
//     } catch {}
//   }

//   sliderTrackBackground(): string {
//     const { min, max } = this.lastPriceBounds;
//     if (max <= min) return "#e6e7e9";
//     const lo = this.tempMinPrice ?? min;
//     const hi = this.tempMaxPrice ?? max;
//     const minPct = Math.round(((lo - min) / (max - min)) * 100);
//     const maxPct = Math.round(((hi - min) / (max - min)) * 100);
//     return `linear-gradient(to right,#e6e7e9 0%,#e6e7e9 ${minPct}%,#0b5ed7 ${minPct}%,#0b5ed7 ${maxPct}%,#e6e7e9 ${maxPct}%,#e6e7e9 100%)`;
//   }

//   scrollRail(direction: 1 | -1) {
//     try {
//       const el = this.railRef?.nativeElement;
//       if (!el) return;
//       el.scrollBy({
//         left: direction * (this.railScrollByPx || 640),
//         behavior: "smooth",
//       });
//     } catch {}
//   }

//   onRailKeydown(ev: KeyboardEvent) {
//     if (ev.key === "ArrowLeft") {
//       ev.preventDefault();
//       this.scrollRail(-1);
//     }
//     if (ev.key === "ArrowRight") {
//       ev.preventDefault();
//       this.scrollRail(1);
//     }
//   }

//   /** Cart key for a specific variant object (used by dropdown rows) */
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
//     console.log("Add to cart in variant selections : ", product);
//     event.stopPropagation();
//     const key = this.variantRowCartKey(product, variant);

//     const sellingPrice = variant?.SellingPrice ?? (product as any).SellingPrice;
//     const offerPrice = variant?.OfferPrice ?? (product as any).OfferPrice;
//     const mrp = parseMoneyToNumber(String(sellingPrice ?? "")) || 0;
//     // ✅ Fall back to mrp (not 0) when the variant has no active offer — see
//     // the matching fix + comment in addVariantToCart() above.
//     const dealPrice = parseMoneyToNumber(String(offerPrice ?? "")) || mrp;
//     const title =
//       `${(product as any).Brand ?? ""} ${product.ProductName ?? ""} - ${variant.variantsName}`.trim();
//     const image = String(
//       (product as any).ImageUrl || (product as any).Image || "",
//     ).trim();

//     // 🔧 FIX: don't share the raw `product` reference across cart lines —
//     // clone it per line so a future mutation of product.selectedVariant
//     // elsewhere can't retroactively change what an already-added cart line
//     // shows.
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
//           isService: product.isService ?? false,
//         },
//       }),
//     );
//     // this.drawer.openCart();
//   }

//   increaseRowVariant(
//     product: Product,
//     variant: Variant,
//     qtyMap: Map<string, number>,
//     event?: Event,
//   ): void {
//     event?.stopPropagation();

//     const key = this.variantRowCartKey(product, variant);

//     this.store.dispatch(
//       updateQuantity({
//         productId: key,
//         quantity: (qtyMap.get(key) ?? 0) + 1,
//       }),
//     );

//     // this.drawer.openCart();
//   }

//   decreaseRowVariant(
//     product: Product,
//     variant: Variant,
//     qtyMap: Map<string, number>,
//     event?: Event,
//   ): void {
//     event?.stopPropagation();

//     const key = this.variantRowCartKey(product, variant);
//     const current = qtyMap.get(key) ?? 0;

//     if (current <= 1) {
//       this.store.dispatch(removeItem({ productId: key }));
//     } else {
//       this.store.dispatch(
//         updateQuantity({
//           productId: key,
//           quantity: current - 1,
//         }),
//       );
//     }
//   }

//   trackByVariantId(_: number, v: Variant): string {
//     return v.variantsid;
//   }

//   trackByProductId(_: number, p: Product): string {
//     return String(p.ProductId ?? "");
//   }

//   onDrawerChange(state: DrawerState): void {
//     /* no-op */
//   }

//   /** True only when there's an actual discount (not just OfferPrice == SellingPrice) */
//   hasDiscount(p: Product): boolean {
//     const offer = this.parsePrice((p as any).OfferPrice);
//     const selling = this.parsePrice((p as any).SellingPrice);
//     return offer > 0 && offer !== selling;
//   }

//   /** Min/max effective price across a product's variants, for the "Price range" line */
//   getVariantPriceRange(p: Product): { min: number; max: number } | null {
//     if (!p.variants?.length) return null;

//     const prices = p.variants.map((v) => {
//       const offer = this.parsePrice(v.OfferPrice);
//       const selling = this.parsePrice(v.SellingPrice);
//       return offer > 0 ? offer : selling;
//     });

//     return {
//       min: Math.min(...prices),
//       max: Math.max(...prices),
//     };
//   }
// }
import {
  Component,
  inject,
  HostListener,
  ElementRef,
  OnInit,
  Input,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone,
  ChangeDetectorRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  ActivatedRoute,
  RouterModule,
  Router,
  NavigationEnd,
} from "@angular/router";
// import {
//   BehaviorSubject,
//   Observable,
//   combineLatest,
//   map,
//   Subscription,
//   switchMap,
//   of,
//   Subject,
//   fromEvent,
//   filter,
//   distinctUntilChanged,
// } from "rxjs";

import {
  BehaviorSubject,
  Observable,
  combineLatest,
  map,
  Subscription,
  switchMap,
  of,
  from,
  Subject,
  fromEvent,
  filter,
  distinctUntilChanged,
} from "rxjs";
import { takeUntil } from "rxjs/operators";

import { Product, Variant } from "../common/models/product.model";
import { ProductSuggestComponent } from "../common/components/product-suggest/product-suggest.component";
// import { ProductService } from "../common/services/product.service";
import { ProductService } from "../common/services/product.service copy";
import { UserFiltersComponent } from "../common/components/user-filters/user-filters.component";
import { parseMoneyToNumber } from "../common/utils/price.util";
// import { CategoryService } from "../common/services/category.service";
import { CategoryService } from "../common/services/category.service copy";
import { Store } from "@ngrx/store";
import {
  updateOrAddItem,
  updateQuantity,
  removeItem,
} from "../common/models/cart/cart.actions";
import { selectCartItems } from "../common/models/cart/cart.selectors";
import { CartItem } from "../common/models/cart/cart-item.model";
import { DrawerService } from "../common/components/drawer/drawer.service";
import { DrawerState } from "../common/components/drawer/drawer-state";
import { Category } from "../common/models/category.model";
import { CategoryNavState } from "../common/models/category.model";
import { SellerService } from "../common/services/SellerService";
import { ImageUrlService } from "../common/utils/ImageUrlService";
type SortOption = "price-asc" | "price-desc" | "name-asc" | "name-desc" | "";

@Component({
  selector: "app-product-list",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    UserFiltersComponent,
    ProductSuggestComponent,
  ],
  templateUrl: "./product-list.component.html",
  styleUrls: ["./product-list.component.scss"],
})
export class ProductListComponent implements OnInit, AfterViewInit, OnDestroy {
  // ── Navigation-state fields ──────────────────────────────────────────────
  /** Latest CategoryNavState from the navbar. Updated on every navigation. */
  selectedCategory: CategoryNavState | null = null;
  /** Breadcrumb items derived from selectedCategory */
  // breadcrumb: string[] = [];
  breadcrumb: {
    label: string;
    id: string;
    state?: CategoryNavState | null;
  }[] = [];

  subCategories: Category[] = [];
  /**
   * Declared with ! — assigned in ngOnInit() before any subscriber runs.
   * Use _productList$$ to switch sources reactively on re-navigation.
   */
  productList$!: Observable<Product[]>;

  /**
   * Inner subject: holds the current category-scoped product Observable.
   * Seeded with getProducts() so field-initialiser streams have a valid
   * source before ngOnInit fires.  Replaced on every NavigationEnd.
   */
  private _productList$$ = new BehaviorSubject<Observable<Product[]>>(
    // Will be overwritten immediately in ngOnInit; safe placeholder.
    of<Product[]>([]),
  );

  private store = inject(Store);

  @Input() set products(value: Product[] | null | undefined) {
    console.log("Received products:", value);

    if (value != null) {
      this.externalProducts$ = of(value);

      value.forEach((product, index) => {
        console.log(`Product ${index}:`, product);
      });
    }
  }
  @Input() mode: "default" | "similar" = "default";
  @Input() hideFilters = false;
  @Input() showHeading = true;
  @Input() layout: "grid" | "rail" = "grid";
  @Input() railTitle: string = "Products";
  @Input() railScrollByPx: number = 640;
  @Input() externalProducts$?: Observable<Product[]>;

  @ViewChild("rail", { read: ElementRef }) railRef?: ElementRef<HTMLElement>;
  @ViewChild("productsContainer", { read: ElementRef })
  productsContainerRef?: ElementRef<HTMLElement>;

  filtersCollapsed = false;

  private groupOpen: Record<string, boolean> = {
    brand: true,
    category: true,
    size: true,
    gender: true,
    discount: true,
    price: true,
  };

  private categoryService = inject(CategoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private sellerService = inject(SellerService);
  private drawer = inject(DrawerService);
  private imageServiceUrl = inject(ImageUrlService);
  mobileFiltersOpen = false;
  mobileDrawerOpen = false;
  mobileActiveGroup:
    | "price"
    | "discount"
    | "brand"
    | "category"
    | "size"
    | "gender"
    | null = null;

  openPanel:
    | "price"
    | "sale"
    | "brand"
    | "category"
    | "size"
    | "gender"
    | "discount"
    | null = null;

  private el = inject(ElementRef);

  selectedBrands$ = new BehaviorSubject<string[]>([]);
  selectedCategoryIds$ = new BehaviorSubject<string[]>([]);
  selectedSizes$ = new BehaviorSubject<string[]>([]);
  selectedGenders$ = new BehaviorSubject<string[]>([]);
  selectedDiscountTiers$ = new BehaviorSubject<number[]>([]);
  priceMin$ = new BehaviorSubject<number | null>(null);
  priceMax$ = new BehaviorSubject<number | null>(null);
  searchTerm$ = new BehaviorSubject<string>("");
  sort$ = new BehaviorSubject<SortOption>("");

  // state
  private currentCategoryIds: string[] = [];
  allProducts: Product[] = [];
  invTaken = 0;
  servTaken = 0;
  seeInv = 1;
  seeServ = 1;
  loadingMore = false;

  /** true while showing /category/:id?search=... results (not paginated) */
  private isSearchMode = false;
  /** in-flight page request, cancelled whenever a new load starts */
  private pageSub?: Subscription;

  private loadFirstPage(categoryIds: string[]): void {
    this.isSearchMode = false;
    this.pageSub?.unsubscribe();
    this.loadingMore = false;
    this.currentCategoryIds = categoryIds;
    this.invTaken = 0;
    this.servTaken = 0;
    this.seeInv = 1;
    this.seeServ = 1;
    this.allProducts = [];
    this.fetchNextPage();
  }

  fetchNextPage(): void {
    // Search results are a single, non-paginated list. Without this guard the
    // scroll sentinel (visible because there is only 1 result) loads the full
    // category list and replaces the search results.
    if (this.isSearchMode) return;
    if (this.loadingMore) return;
    if (this.seeInv === 0 && this.seeServ === 0 && this.allProducts.length)
      return;

    this.loadingMore = true;

    this.pageSub = this.productService
      .getProductsByCategoryIds(
        this.currentCategoryIds,
        this.invTaken,
        this.servTaken,
      )
      .subscribe({
        next: (res) => {
          this.allProducts = [...this.allProducts, ...res.products];
          this.invTaken = res.invTaken;
          this.servTaken = res.servTaken;
          this.seeInv = res.seeInv;
          this.seeServ = res.seeServ;
          this.loadingMore = false;
          this._productList$$.next(of(this.allProducts));
        },
        error: (err) => {
          console.error("fetchNextPage failed:", err);
          this.loadingMore = false; // <-- critical: without this, every future scroll is silently ignored
        },
      });
  }

  private ngZone = inject(NgZone);

  @ViewChild("scrollSentinel", { read: ElementRef })
  scrollSentinelRef?: ElementRef<HTMLElement>;

  private scrollObserver?: IntersectionObserver;

  // ── Variant state ─────────────────────────────────────────────────────────
  /**
   * Tracks the currently-selected Variant (or null = base product)
   * keyed by ProductId string.
   */
  selectedVariants = new Map<string, Variant | null>();

  /**
   * The product whose variant modal is currently open.
   * null = no modal.  Only one modal at a time.
   */
  variantModalProduct: Product | null = null;

  /**
   * Live map: cartKey → quantity.  cartKey = variantCartKey() result.
   * Template uses this to decide Add vs Qty-stepper.
   */
  cartQtyMap$!: Observable<Map<string, number>>;

  // ── Price slider helpers (unchanged) ────────────────────────────────────
  lastPriceBounds: { min: number; max: number } = { min: 0, max: Infinity };
  tempMinPrice: number | null = null;
  tempMaxPrice: number | null = null;
  activeThumb: "min" | "max" | null = null;
  private _priceBoundsSub?: Subscription;
  private readonly imgBase = "http://localhost:8080";
  private destroyed$ = new Subject<void>();

  // ── Streams ────────────────────────────────────────────────────────────────

  // Category rail
  categories$?: Observable<
    (import("../common/models/category.model").CategoryItem & {
      coverImageUrl: string;
    })[]
  >;
  selectedRailCategoryId: string | null = null;

  get displayProducts$(): Observable<Product[]> {
    return (
      (this.externalProducts$ as Observable<Product[]>) ??
      this.filteredProducts$
    );
  }

  /**
   * Emits the route :id param on every navigation — including re-navigation
   * to the same base path with a different id.
   */
  activeCategoryIds$: Observable<string[]> = this.route.paramMap.pipe(
    map((pm) => {
      const id = pm.get("id");
      return id ? [id] : [];
    }),
  );

  private cdr = inject(ChangeDetectorRef);
  private resolvedImages = new Map<string, string>();
  private readonly FALLBACK_IMG = "/assets/placeholder-bike.png";
  readonly fallbackImg = "/assets/placeholder-bike.png";

  // use ONE constant (make sure this file exists in src/assets)

  onImgError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    if (!img) return;
    // stop only if the placeholder itself failed (avoids an infinite loop)
    if (img.src.includes(this.fallbackImg)) return;
    img.removeAttribute("srcset");
    img.src = this.fallbackImg;
  }

  buildImageUrl(
    relative?: string,
    inventoryId?: string,
    isService = false,
  ): string {
    // no image path at all -> straight to placeholder, no service call
    if (!relative) return this.FALLBACK_IMG;

    const key = `${isService ? "s" : "p"}|${inventoryId}|${relative}`;
    const hit = this.resolvedImages.get(key);
    if (hit) return hit;

    this.resolvedImages.set(key, this.FALLBACK_IMG);

    this.imageServiceUrl
      .buildImageUrl(relative, inventoryId, isService)
      .then((url) => {
        this.resolvedImages.set(key, url || this.FALLBACK_IMG);
        this.cdr.markForCheck();
      })
      .catch(() => {
        this.resolvedImages.set(key, this.FALLBACK_IMG);
        this.cdr.markForCheck();
      });

    return this.FALLBACK_IMG;
  }

  // buildImageUrl(
  //   relative?: string,
  //   inventoryId?: string,
  //   isService: boolean = false,
  // ): Promise<string> {
  //   return this.imageServiceUrl.buildImageUrl(relative, inventoryId, isService);
  // }

  /**
   * The pool of products that filter chips operate on.
   *
   * _productList$$ is a BehaviorSubject<Observable<Product[]>>.
   * switchMap ensures we always subscribe to the LATEST inner Observable
   * (i.e. the one assigned in loadProductsForCategory() on each navigation).
   * No combineLatest with activeCategoryIds$ needed here — the category
   * scoping is done inside getProductsByCategoryIds() before we push.
   */
  baseForFilters$: Observable<Product[]> = this._productList$$.pipe(
    switchMap((src$: Observable<Product[]>) => src$),
  );

  availableBrandsWithCount$: Observable<
    Array<{ value: string; count: number }>
  > = this.baseForFilters$.pipe(
    map((products) => {
      const map = new Map<string, number>();
      for (const p of products) {
        const v = ((p as any).Brand ?? "").trim();
        if (v) map.set(v, (map.get(v) ?? 0) + 1);
      }
      return Array.from(map.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => a.value.localeCompare(b.value));
    }),
  );

  availableCategoriesWithCount$: Observable<
    Array<{ id: string; name: string; count: number }>
  > = this.baseForFilters$.pipe(
    map((products) => {
      const map = new Map<string, { name: string; count: number }>();
      for (const p of products) {
        const id = String((p as any).Category?.CategoryId ?? "").trim();
        const name = ((p as any).Category?.CategoryName ?? "").trim();
        if (id) {
          const entry = map.get(id) ?? { name, count: 0 };
          entry.count++;
          map.set(id, entry);
        }
      }
      return Array.from(map.entries())
        .map(([id, { name, count }]) => ({ id, name, count }))
        .sort((a, b) => a.name.localeCompare(b.name));
    }),
  );

  availableSizesWithCount$: Observable<
    Array<{ value: string; count: number }>
  > = this.baseForFilters$.pipe(
    map((products) => {
      const map = new Map<string, number>();
      for (const p of products) {
        const v = ((p as any).Size ?? "").trim();
        if (v) map.set(v, (map.get(v) ?? 0) + 1);
      }
      return Array.from(map.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => a.value.localeCompare(b.value));
    }),
  );

  availableGendersWithCount$: Observable<
    Array<{ value: string; count: number }>
  > = this.baseForFilters$.pipe(
    map((products) => {
      const map = new Map<string, number>();
      for (const p of products) {
        const v = ((p as any).Gender ?? "").trim();
        if (v) map.set(v, (map.get(v) ?? 0) + 1);
      }
      return Array.from(map.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => a.value.localeCompare(b.value));
    }),
  );

  priceBounds$: Observable<{ min: number; max: number }> =
    this.baseForFilters$.pipe(
      map((products) => {
        let min = Infinity,
          max = -Infinity;
        for (const p of products) {
          const price = this.getEffectivePrice(p);
          if (price != null) {
            if (price < min) min = price;
            if (price > max) max = price;
          }
        }
        return min === Infinity
          ? { min: 0, max: 0 }
          : { min: Math.floor(min), max: Math.ceil(max) };
      }),
    );

  priceTicks$: Observable<number[]> = this.priceBounds$.pipe(
    map(({ min, max }) => {
      if (max <= min) return [min, max];
      const step = Math.round((max - min) / 4);
      return [min, min + step, min + step * 2, min + step * 3, max];
    }),
  );

  filteredProducts$: Observable<Product[]> = combineLatest([
    this.baseForFilters$,
    this.selectedBrands$,
    this.selectedCategoryIds$,
    this.selectedSizes$,
    this.selectedGenders$,
    this.selectedDiscountTiers$,
    this.priceMin$,
    this.priceMax$,
    this.searchTerm$,
    this.sort$,
  ]).pipe(
    map(
      ([
        products,
        brands,
        catIds,
        sizes,
        genders,
        tiers,
        priceMin,
        priceMax,
        term,
        sort,
      ]) => {
        let list = products.slice();

        if (brands.length) {
          const set = new Set(brands);
          list = list.filter((p) =>
            set.has(String((p as any).Brand ?? "").trim()),
          );
        }

        if (catIds.length) {
          const set = new Set(catIds);
          list = list.filter((p) =>
            set.has(String((p as any).Category?.CategoryId ?? "")),
          );
        }

        if (sizes.length) {
          const set = new Set(sizes);
          list = list.filter((p) =>
            set.has(String((p as any).Size ?? "").trim()),
          );
        }

        if (genders.length) {
          const set = new Set(genders);
          list = list.filter((p) =>
            set.has(String((p as any).Gender ?? "").trim()),
          );
        }

        if (tiers.length) {
          const max = Math.max(...tiers);
          list = list.filter((p) => this.getDiscountPercent(p) >= max);
        }

        if (priceMin != null || priceMax != null) {
          list = list.filter((p) => {
            const price = this.getEffectivePrice(p);
            if (price == null) return false;
            if (priceMin != null && price < priceMin) return false;
            if (priceMax != null && price > priceMax) return false;
            return true;
          });
        }

        if (term.trim()) {
          const q = term.toLowerCase();
          list = list.filter(
            (p) =>
              p.ProductName?.toLowerCase().includes(q) ||
              String((p as any).Brand ?? "")
                .toLowerCase()
                .includes(q) ||
              String((p as any).Category?.CategoryName ?? "")
                .toLowerCase()
                .includes(q),
          );
        }

        if (sort === "price-asc")
          list.sort(
            (a, b) =>
              (this.getEffectivePrice(a) ?? 0) -
              (this.getEffectivePrice(b) ?? 0),
          );
        if (sort === "price-desc")
          list.sort(
            (a, b) =>
              (this.getEffectivePrice(b) ?? 0) -
              (this.getEffectivePrice(a) ?? 0),
          );
        if (sort === "name-asc")
          list.sort((a, b) =>
            (a.ProductName ?? "").localeCompare(b.ProductName ?? ""),
          );
        if (sort === "name-desc")
          list.sort((a, b) =>
            (b.ProductName ?? "").localeCompare(a.ProductName ?? ""),
          );

        return list;
      },
    ),
  );

  placeholder$: Observable<string> = this.filteredProducts$.pipe(
    map((list) => String(list.length)),
  );

  // ── ngOnInit ─────────────────────────────────────────────────────────────
  ngOnInit(): void {
    // ── Initial load ─────────────────────────────────────────────────────
    // Angular reads history.state correctly on first component creation.
    this.loadProductsForCategory();

    // ── Re-navigation listener ────────────────────────────────────────────
    // When the user clicks a different category in the navbar while already
    // on /category/:id, Angular reuses this component instance (ngOnInit
    // does NOT fire again).  We listen to NavigationEnd so every navbar
    // click triggers a fresh product load regardless of route reuse.
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        // React to any /category/ route — includes /category/ALL (all products)
        // and /category/:specificId (filtered products).
        filter((e) => e.urlAfterRedirects.includes("/category/")),
        takeUntil(this.destroyed$),
      )
      .subscribe(() => {
        this.loadProductsForCategory();
      });

    try {
      this.onWindowResize();
    } catch {}

    this._priceBoundsSub = this.priceBounds$.subscribe((b) => {
      this.lastPriceBounds = b;
      if (
        this.openPanel === "price" ||
        this.tempMinPrice == null ||
        this.tempMaxPrice == null
      ) {
        this.resetTempsToBounds();
      }
    });

    // ── Build live cart-quantity map ────────────────────────────────────────
    this.cartQtyMap$ = this.store.select(selectCartItems).pipe(
      map((items: CartItem[]) => {
        const m = new Map<string, number>();
        for (const item of items) {
          m.set(item.productId, item.quantity);
        }
        return m;
      }),
    );

    // Load categories for the rail (reuse grouped categories).
    // Cover image URLs are computed once here (not in the template) so
    // Angular's change detection doesn't recompute them on every cycle.
    // this.categories$ = this.categoryService.getGroupedCategories().pipe(
    //   map((groups) => groups.flatMap((g) => g.items)),
    //   map((cats) =>
    //     cats.map((c) => ({
    //       ...c,
    //       coverImageUrl: this.imageServiceUrl.buildCategoryImageUrl(
    //         c.coverImage,
    //       ),
    //     })),
    //   ),
    // );
  }

  selectRailCategory(category: any | null): void {
    // ALL category
    if (!category) {
      this.selectedRailCategoryId = null;

      this.router.navigate(["/category/ALL"], {
        state: {
          category: {
            id: "ALL",
            category: "All Categories",
            parentCategory: null,
            children: [],
          },
        },
      });

      return;
    }

    const categoryId = String(category.id);

    this.selectedRailCategoryId = categoryId;

    // Navigate to /category/{category.id}
    this.router.navigate(["/category", categoryId], {
      state: {
        category: {
          id: categoryId,
          category: category.category,
          parentCategory: category.parentCategory ?? null,
          children: category.children ?? [],
        },
      },
    });
  }

  // private loadProductsForCategory(): void {
  //   const navState = history.state as {
  //     category?: CategoryNavState;
  //   };

  //   const routeId = this.route.snapshot.paramMap.get("id");
  //   const searchValue =
  //     this.route.snapshot.queryParamMap.get("search")?.trim() ?? "";

  //   // Prefer navigation state
  //   this.selectedCategory = navState?.category ?? null;

  //   // Fallback when page is refreshed or URL opened directly
  //   if (!this.selectedCategory && routeId) {
  //     this.selectedCategory = {
  //       id: routeId,
  //       category: routeId,
  //       parentCategory: null,
  //       children: [],
  //     };
  //   }

  //   // Sync the header rail selection with the current navigation state.
  //   // When there's no selected category or the route explicitly targets
  //   // the 'ALL' pseudo-category, show the "All" chip (null). Otherwise
  //   // mark the matching category id as selected so the active class
  //   // reflects the current route on initial load / navigation.
  //   if (!this.selectedCategory || this.selectedCategory.id === "ALL") {
  //     this.selectedRailCategoryId = null;
  //   } else {
  //     this.selectedRailCategoryId = this.selectedCategory.id;
  //   }

  //   if (!this.selectedCategory) {
  //     return;
  //   }

  //   // Build breadcrumb
  //   this.buildBreadcrumb(this.selectedCategory);

  //   // Use ONLY the clicked category ID
  //   const categoryId =
  //     routeId && routeId !== "ALL" ? routeId : this.selectedCategory.id;

  //   const categoryIds =
  //     categoryId && categoryId !== "ALL" ? [String(categoryId)] : [];

  //   console.log("Selected Category:", this.selectedCategory);
  //   console.log("Selected Category ID:", categoryId);
  //   console.log("API Category IDs:", categoryIds);

  //   // Load products
  //   this.productList$ =
  //     searchValue.length >= 3
  //       ? this.productService.getProductsBySearchname(
  //           searchValue,
  //           String(categoryId ?? ""),
  //         )
  //       : this.productService.getProductsByCategoryIds(categoryIds);

  //   this._productList$$.next(this.productList$);

  //   // Reset filters
  //   this.resetFilters();
  // }

  // private loadProductsForCategory(): void {
  //   const navState = history.state as { category?: CategoryNavState };

  //   const routeId = this.route.snapshot.paramMap.get("id");
  //   const searchValue =
  //     this.route.snapshot.queryParamMap.get("search")?.trim() ?? "";

  //   this.selectedCategory = navState?.category ?? null;

  //   if (!this.selectedCategory && routeId) {
  //     this.selectedCategory = {
  //       id: routeId,
  //       category: routeId,
  //       parentCategory: null,
  //       children: [],
  //     };
  //   }

  //   if (!this.selectedCategory || this.selectedCategory.id === "ALL") {
  //     this.selectedRailCategoryId = null;
  //   } else {
  //     this.selectedRailCategoryId = this.selectedCategory.id;
  //   }

  //   if (!this.selectedCategory) {
  //     return;
  //   }

  //   this.buildBreadcrumb(this.selectedCategory);

  //   const categoryId =
  //     routeId && routeId !== "ALL" ? routeId : this.selectedCategory.id;
  //   const categoryIds =
  //     categoryId && categoryId !== "ALL" ? [String(categoryId)] : [];

  //   console.log("Selected Category:", this.selectedCategory);
  //   console.log("Selected Category ID:", categoryId);
  //   console.log("API Category IDs:", categoryIds);

  //   this.resetFilters();

  //   if (searchValue.length >= 3) {
  //     // Search results aren't paginated through invTaken/servTaken today —
  //     // keep the simple one-shot flow.
  //     this.productList$ = this.productService.getProductsBySearchname(
  //       searchValue,
  //       String(categoryId ?? ""),
  //     );
  //     this._productList$$.next(this.productList$);
  //   } else {
  //     // Category browsing IS paginated — go through the new flow.
  //     this.loadFirstPage(categoryIds);
  //   }
  // }

  private loadProductsForCategory(): void {
    const navState = history.state as { category?: CategoryNavState };

    const routeId = this.route.snapshot.paramMap.get("id");
    const searchValue =
      this.route.snapshot.queryParamMap.get("search")?.trim() ?? "";

    this.selectedCategory = navState?.category ?? null;

    if (!this.selectedCategory && routeId) {
      this.selectedCategory = {
        id: routeId,
        category: routeId,
        parentCategory: null,
        children: [],
      };
    }

    if (!this.selectedCategory || this.selectedCategory.id === "ALL") {
      this.selectedRailCategoryId = null;
    } else {
      this.selectedRailCategoryId = this.selectedCategory.id;
    }

    if (!this.selectedCategory) {
      return;
    }

    this.buildBreadcrumb(this.selectedCategory);

    // ✅ was: single [categoryId] — now uses parent + all nested children
    this.subCategories =
      this.selectedCategory.parentCategory === null
        ? (this.selectedCategory.children ?? [])
        : [];

    const categoryIds = this.buildCategoryIds(this.selectedCategory);

    console.log("Selected Category:", this.selectedCategory);
    console.log("API Category IDs:", categoryIds);

    this.resetFilters();

    if (searchValue.length >= 3) {
      this.isSearchMode = true;
      this.pageSub?.unsubscribe(); // drop any in-flight page load
      this.loadingMore = false;
      this.allProducts = [];
      this.productList$ = this.productService.getProductsBySearchname(
        searchValue,
        String(this.selectedCategory.id ?? ""),
      );
      this._productList$$.next(this.productList$);
    } else {
      this.loadFirstPage(categoryIds);
    }
  }

  navigateSubCategory(child: Category): void {
    if (!this.selectedCategory) return;

    const state: CategoryNavState = {
      id: child.id,
      category: child.category,
      parentCategory: {
        id: this.selectedCategory.id,
        category: this.selectedCategory.category,
        parentCategory: null,
      },
      children: [],
    };

    this.router.navigate(["/category", child.id], {
      state: { category: state },
    });
  }

  trackById(_: number, item: Category): string {
    return item.id;
  }

  private resetFilters(): void {
    this.selectedBrands$.next([]);
    this.selectedCategoryIds$.next([]);
    this.selectedSizes$.next([]);
    this.selectedGenders$.next([]);
    this.selectedDiscountTiers$.next([]);

    this.priceMin$.next(null);
    this.priceMax$.next(null);

    this.searchTerm$.next("");
    this.sort$.next("");
  }

  updateVariantQtyFromInput(p: Product, event: Event): void {
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

  updateRowVariantQtyFromInput(
    product: Product,
    variant: Variant,
    qtyMap: Map<string, number>,
    event: Event,
  ): void {
    const input = event.target as HTMLInputElement;

    let qty = Number(input.value);

    if (isNaN(qty) || qty < 1) {
      qty = 1;
    }

    const key = this.variantRowCartKey(product, variant);

    this.store.dispatch(
      updateQuantity({
        productId: key,
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

  private buildBreadcrumb(state: CategoryNavState | null) {
    this.breadcrumb = [];

    // All Categories
    this.breadcrumb.push({
      label: "All Categories",
      id: "ALL",
      state: null,
    });

    if (!state || state.id === "ALL") {
      return;
    }

    // Parent category
    if (state.parentCategory === null) {
      this.breadcrumb.push({
        label: state.category,
        id: state.id,
        state,
      });
      return;
    }

    // Child category
    this.breadcrumb.push({
      label: state.parentCategory.category,
      id: state.parentCategory.id,
      state: state.parentCategory,
    });

    this.breadcrumb.push({
      label: state.category,
      id: state.id,
      state,
    });
  }

  private buildCategoryIds(state: CategoryNavState | null): string[] {
    // All products
    if (!state) return [];

    // Explicit ALL
    if (state.id === "ALL") return [];

    // Parent clicked
    if (state.parentCategory === null) {
      const ids: string[] = [state.id];

      if (state.children?.length) {
        ids.push(...this.collectChildIds(state.children));
      }

      return [...new Set(ids)];
    }

    // Child clicked
    if (state.parentCategory !== null) {
      return [state.parentCategory.id, state.id];
    }

    // Leaf parent
    return [state.id];
  }

  /**
   * Recursively collect all child ids
   */
  private collectChildIds(categories: Category[]): string[] {
    const ids: string[] = [];

    const walk = (cats: Category[]) => {
      cats.forEach((cat) => {
        ids.push(cat.id);

        if (cat.children?.length) {
          walk(cat.children);
        }
      });
    };

    walk(categories);

    return ids;
  }

  ngAfterViewInit(): void {
    // Note: the variant modal used to close on window/container/rail scroll.
    // That was needed for the old anchored-dropdown UI, which had to track
    // the trigger's position. The modal is now a fixed, centered overlay,
    // so it doesn't need repositioning — and closing it on scroll would
    // block the user from scrolling the page while it's open. No scroll
    // listeners are attached here anymore.

    this.setupInfiniteScrollObserver();
  }

  private setupInfiniteScrollObserver(): void {
    const sentinel = this.scrollSentinelRef?.nativeElement;
    if (!sentinel || !("IntersectionObserver" in window)) {
      return;
    }

    // root: null tracks intersection against the browser viewport, which
    // still works correctly even when the list scrolls inside a nested
    // container (a mobile app-shell wrapper, a fixed-header layout, etc.) —
    // unlike a window:scroll listener, which only fires when `window`
    // itself is the element that scrolls.
    this.scrollObserver = new IntersectionObserver(
      (entries) => {
        const isVisible = entries.some((e) => e.isIntersecting);
        if (isVisible) {
          // IntersectionObserver callbacks run outside Angular's zone,
          // so re-enter it to make sure change detection picks up the
          // loadingMore flag and the eventual product list update.
          this.ngZone.run(() => this.fetchNextPage());
        }
      },
      {
        root: null,
        rootMargin: "300px", // start loading ~300px before the sentinel is reached
        threshold: 0,
      },
    );

    this.scrollObserver.observe(sentinel);
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.scrollObserver?.disconnect();
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  VARIANT HELPERS  (new)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Returns the cart key for a product + optional variant.
   * Format:  "PROD-1"          (no variant / base product)
   *          "PROD-1__v2"      (variant with variantsid "2")
   */
  variantCartKey(product: Product, variant?: Variant | null): string {
    const base = String(product.ProductId ?? "");
    if (!variant) return base;
    return `${base}__v${variant.variantsid}`;
  }

  /** Returns the currently-selected Variant for a card (or null = base product) */
  getSelectedVariant(product: Product): Variant | null {
    const pid = String(product.ProductId ?? "");
    if (this.selectedVariants.has(pid)) {
      return this.selectedVariants.get(pid) ?? null;
    }
    // Default to first variant on first access
    const first = product.variants?.[0] ?? null;
    this.selectedVariants.set(pid, first);
    return first;
  }

  /** Sets the active variant for a card */
  selectVariant(product: Product, variant: Variant): void {
    this.selectedVariants.set(String(product.ProductId ?? ""), variant);
  }

  /** Opens the centered variant modal for this product */
  openVariantModal(product: Product, event: Event): void {
    event.stopPropagation();
    this.variantModalProduct = product;
    // Body scroll is intentionally left unlocked so the user can keep
    // scrolling the page while the variant modal is open.
  }
  // openVariantModal(product: Product, event: Event): void {
  //   event.stopPropagation();

  //   this.variantModalProduct = product;

  //   document.body.classList.add("variant-modal-open");
  // }

  //  Closes the variant modal */
  closeVariantModal(): void {
    this.variantModalProduct = null;
    // this.drawer.close();
  }
  // closeVariantModal(): void {
  //   this.variantModalProduct = null;

  //   document.body.classList.remove("variant-modal-open");
  // }

  /** True when the modal is open for this specific product */
  isVariantModalOpen(product: Product): boolean {
    return this.variantModalProduct?.ProductId === product.ProductId;
  }

  /** @deprecated — kept for any template refs; delegates to modal approach */
  closeAllVariantDropdowns(): void {
    this.closeVariantModal();
    this.drawer.close();
  }
  /** Gets current cart quantity for the active selection */
  getVariantQty(product: Product, qtyMap: Map<string, number>): number {
    const variant = this.getSelectedVariant(product);
    const key = this.variantCartKey(product, variant);
    return qtyMap.get(key) ?? 0;
  }

  /** True when the active selection is already in the cart */
  variantInCart(product: Product, qtyMap: Map<string, number>): boolean {
    return this.getVariantQty(product, qtyMap) > 0;
  }

  // getDropdownCoords removed — modal approach uses no coordinates

  /** Normalise any price value (number | "Rs. 239.00" | null) to a number for the currency pipe */
  parsePrice(val: string | number | null | undefined): number {
    if (val == null) return 0;
    if (typeof val === "number") return val;
    return parseMoneyToNumber(val) ?? 0;
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
  addVariantToCart(product: Product, event: Event): void {
    event.stopPropagation();
    const variant = this.getSelectedVariant(product);
    const key = this.variantCartKey(product, variant);

    const sellingPrice = variant?.SellingPrice ?? (product as any).SellingPrice;
    const offerPrice = variant?.OfferPrice ?? (product as any).OfferPrice;
    const mrp = parseMoneyToNumber(String(sellingPrice ?? "")) || 0;
    // ✅ Fall back to mrp (not 0) when the variant has no active offer — same
    // pattern as buildCartItem() in product.component.ts. Falling back to 0
    // here was storing dealPrice:0 for every non-discounted variant, which
    // cart-list.component.html papered over with its own mrp fallback for
    // the line total, but selectCartTotal/selectCartFinalTotal trusted
    // dealPrice as-is — summing to ₹0 for a cart full of "correct-looking"
    // items.
    const dealPrice = parseMoneyToNumber(String(offerPrice ?? "")) || mrp;
    const title = variant
      ? `${product.ProductName ?? ""} - ${variant.variantsName}`.trim()
      : `${product.ProductName ?? ""}`.trim();

    const image = String(
      (product as any).ImageUrl || (product as any).Image || "",
    ).trim();

    // 🔧 FIX: clone product per cart line + record the variant that was
    // active at add-time, same fix applied in addRowVariantToCart / product.component.ts.
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
          selectedVariant: variant, // ✅ was missing entirely here
          totalVariants: product?.variants,
          isService: product.isService ?? false,
        },
      }),
    );
    // this.drawer.openCart();
  }

  increaseVariant(
    product: Product,
    qtyMap: Map<string, number>,
    event: Event,
  ): void {
    event.stopPropagation();
    const variant = this.getSelectedVariant(product);
    const key = this.variantCartKey(product, variant);
    const current = qtyMap.get(key) ?? 0;
    this.store.dispatch(
      updateQuantity({ productId: key, quantity: current + 1 }),
    );
    // this.drawer.openCart();
  }

  decreaseVariant(
    product: Product,
    qtyMap: Map<string, number>,
    event: Event,
  ): void {
    event.stopPropagation();
    const variant = this.getSelectedVariant(product);
    const key = this.variantCartKey(product, variant);
    const current = qtyMap.get(key) ?? 0;

    if (current <= 1) {
      this.store.dispatch(removeItem({ productId: key }));
    } else {
      this.store.dispatch(
        updateQuantity({ productId: key, quantity: current - 1 }),
      );
    }
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

  emiText(price?: string | number): string {
    const base = parseMoneyToNumber(String(price ?? ""));
    if (!base) return "";
    const perMonth = Math.round(base / 12);
    return `or Rs. ${perMonth.toLocaleString("en-IN")}/Month 🟢 Buy on EMI ›`;
  }

  private getEffectivePrice(p: Product): number | null {
    const offer = parseMoneyToNumber(String((p as any).OfferPrice ?? ""));
    const mrp = parseMoneyToNumber(String((p as any).SellingPrice ?? ""));
    const price = offer || mrp;
    return price > 0 ? price : null;
  }

  private getDiscountPercent(p: Product): number {
    const raw = (p as any).DiscountPercent as string | undefined;
    if (raw?.trim()) {
      const n = Number(raw.replace(/[^\d.]/g, ""));
      if (Number.isFinite(n)) return n;
    }
    const mrp = parseMoneyToNumber(String((p as any).SellingPrice ?? ""));
    const offer = parseMoneyToNumber(String((p as any).OfferPrice ?? ""));
    if (mrp > 0 && offer > 0)
      return Math.max(0, Math.round(((mrp - offer) / mrp) * 100));
    return 0;
  }

  openProduct(id: string | number) {
    if (id == null) return;
    this.router.navigate(["/product", id]);
  }

  navigateBreadcrumb(item: any) {
    if (item.id === "ALL") {
      this.router.navigate(["/category/ALL"], {
        state: {
          category: {
            id: "ALL",
            category: "All Categories",
            parentCategory: null,
            children: [],
          },
        },
      });
      return;
    }

    this.router.navigate(["/category", item.id], {
      state: {
        category: item.state,
      },
    });
  }

  addToCart(p: Product, event: Event): void {
    // Delegate to variant-aware method for all products
    this.addVariantToCart(p, event);
  }

  toggleBrand(v: string) {
    const c = [...this.selectedBrands$.value];
    const i = c.indexOf(v);
    i < 0 ? c.push(v) : c.splice(i, 1);
    this.selectedBrands$.next(c);
  }
  toggleCategory(v: string) {
    const c = [...this.selectedCategoryIds$.value];
    const i = c.indexOf(v);
    i < 0 ? c.push(v) : c.splice(i, 1);
    this.selectedCategoryIds$.next(c);
  }
  toggleSize(v: string) {
    const c = [...this.selectedSizes$.value];
    const i = c.indexOf(v);
    i < 0 ? c.push(v) : c.splice(i, 1);
    this.selectedSizes$.next(c);
  }
  toggleGender(v: string) {
    const c = [...this.selectedGenders$.value];
    const i = c.indexOf(v);
    i < 0 ? c.push(v) : c.splice(i, 1);
    this.selectedGenders$.next(c);
  }
  toggleDiscountTier(v: number) {
    const c = [...this.selectedDiscountTiers$.value];
    const i = c.indexOf(v);
    i < 0 ? c.push(v) : c.splice(i, 1);
    this.selectedDiscountTiers$.next(c);
  }
  setMin(v: number | null) {
    this.priceMin$.next(v);
  }
  setMax(v: number | null) {
    this.priceMax$.next(v);
  }
  setSearchTerm(v: string) {
    this.searchTerm$.next(v);
  }
  setSort(v: SortOption) {
    this.sort$.next(v);
  }
  clearSearch() {
    this.searchTerm$.next("");
  }
  isBrandSelected(v: string) {
    return this.selectedBrands$.value.includes(v);
  }
  isCategorySelected(v: string) {
    return this.selectedCategoryIds$.value.includes(v);
  }
  isSizeSelected(v: string) {
    return this.selectedSizes$.value.includes(v);
  }
  isGenderSelected(v: string) {
    return this.selectedGenders$.value.includes(v);
  }
  isDiscountSelected(v: number) {
    return this.selectedDiscountTiers$.value.includes(v);
  }

  clearFilters() {
    this.selectedBrands$.next([]);
    this.selectedCategoryIds$.next([]);
    this.selectedSizes$.next([]);
    this.selectedGenders$.next([]);
    this.selectedDiscountTiers$.next([]);
    this.priceMin$.next(null);
    this.priceMax$.next(null);
    this.searchTerm$.next("");
    this.sort$.next("");
  }

  clearOnly(key: string) {
    switch (key) {
      case "brand":
        this.selectedBrands$.next([]);
        break;
      case "category":
        this.selectedCategoryIds$.next([]);
        break;
      case "size":
        this.selectedSizes$.next([]);
        break;
      case "gender":
        this.selectedGenders$.next([]);
        break;
      case "discount":
        this.selectedDiscountTiers$.next([]);
        break;
      case "price":
        this.priceMin$.next(null);
        this.priceMax$.next(null);
        break;
    }
  }

  toggleGroup(key: string) {
    this.groupOpen[key] = !this.groupOpen[key];
  }
  isGroupOpen(key: string) {
    return this.groupOpen[key] !== false;
  }
  toggleFiltersCollapse() {
    this.filtersCollapsed = !this.filtersCollapsed;
  }

  closePanel() {
    this.openPanel = null;
  }
  openMobileGroup(key: any) {
    this.mobileActiveGroup = key;
  }
  closeMobileGroup() {
    this.mobileActiveGroup = null;
  }
  openMobileDrawer() {
    this.mobileDrawerOpen = true;
    this.mobileActiveGroup = null;
  }
  closeMobileDrawer() {
    this.mobileDrawerOpen = false;
    this.mobileActiveGroup = null;
  }

  togglePanel(key: any) {
    const willOpen = this.openPanel !== key;
    this.openPanel = willOpen ? key : null;
    if (willOpen && key === "price") {
      const { min, max } = this.lastPriceBounds ?? { min: 0, max: 0 };
      this.tempMinPrice = this.priceMin$.value ?? min;
      this.tempMaxPrice = this.priceMax$.value ?? max;
      if (this.tempMinPrice < min) this.tempMinPrice = min;
      if (this.tempMaxPrice > max) this.tempMaxPrice = max;
      if (this.tempMaxPrice - this.tempMinPrice < 1)
        this.tempMaxPrice = Math.max(this.tempMinPrice + 1, max);
    }
  }

  @HostListener("document:keydown.escape")
  onEscapeKey(): void {
    if (this.variantModalProduct) {
      this.closeVariantModal();
    }
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(ev: Event): void {
    try {
      const container = this.el.nativeElement.querySelector(".filters-box");
      if (!container || !container.contains(ev.target as Node)) {
        this.openPanel = null;
      }
    } catch {
      this.openPanel = null;
    }

    // Close the variant modal on any click outside its panel. The
    // vm-backdrop's own (click) handler only fires for clicks that land
    // directly on it — the cart drawer renders above it in stacking order,
    // so clicks inside the drawer never reach the backdrop. This document
    // listener catches those too, since it's bound at the document level
    // regardless of where the click target sits in the DOM/z-index stack.
    if (this.variantModalProduct) {
      try {
        const panel = this.el.nativeElement.querySelector(".vm-panel");
        if (!panel || !panel.contains(ev.target as Node)) {
          this.closeVariantModal();
        }
      } catch {
        this.closeVariantModal();
      }
    }
  }
  // REPLACE WITH: merge into one resize handler + one dedicated scroll handler
  @HostListener("window:resize", ["$event"])
  onWindowResize(_ev?: Event): void {
    // Close mobile drawer on wide screens
    if (window.innerWidth >= 901) {
      this.mobileDrawerOpen = false;
      this.mobileActiveGroup = null;
      document.body.classList.remove("no-scroll");
    }
    // Close modal on resize (avoids stale positioning edge cases)
    if (this.variantModalProduct) {
      this.closeVariantModal();
    }
  }

  // Window/container scroll handling is attached via RxJS in ngAfterViewInit
  private resetTempsToBounds() {
    const { min, max } = this.lastPriceBounds ?? { min: 0, max: 0 };
    this.tempMinPrice = min;
    this.tempMaxPrice = max;
  }

  onMinSliderInput(v: string | number) {
    const n = Number(v) || 0;
    const { min, max } = this.lastPriceBounds;
    let newMin = Math.round(n);
    if (newMin < min) newMin = min;
    if (newMin > max) newMin = max;
    if (this.tempMaxPrice != null && newMin > this.tempMaxPrice)
      newMin = this.tempMaxPrice;
    this.tempMinPrice = newMin;
    try {
      this.priceMin$.next(this.tempMinPrice);
    } catch {}
  }

  onMaxSliderInput(v: string | number) {
    const n = Number(v) || 0;
    const { min, max } = this.lastPriceBounds;
    let newMax = Math.round(n);
    if (newMax < min) newMax = min;
    if (newMax > max) newMax = max;
    if (this.tempMinPrice != null && newMax < this.tempMinPrice)
      newMax = this.tempMinPrice;
    this.tempMaxPrice = newMax;
    try {
      this.priceMax$.next(this.tempMaxPrice);
    } catch {}
  }

  onThumbPointerDown(which: "min" | "max") {
    this.activeThumb = which;
  }
  onThumbPointerUp() {
    this.activeThumb = null;
  }

  applyPriceRange() {
    this.closePanel();
  }

  clearPriceRange() {
    this.priceMin$.next(null);
    this.priceMax$.next(null);
    this.resetTempsToBounds();
  }

  onMinInputChange(v: string) {
    const n = Number(v.replace(/[^0-9.-]/g, "")) || 0;
    const { min, max } = this.lastPriceBounds;
    let newMin = Math.round(n);
    if (newMin < min) newMin = min;
    if (newMin > max) newMin = max;
    if (this.tempMaxPrice != null && newMin > this.tempMaxPrice)
      newMin = this.tempMaxPrice;
    this.tempMinPrice = newMin;
    try {
      this.priceMin$.next(this.tempMinPrice);
    } catch {}
  }

  onMaxInputChange(v: string) {
    const n = Number(v.replace(/[^0-9.-]/g, "")) || 0;
    const { min, max } = this.lastPriceBounds;
    let newMax = Math.round(n);
    if (newMax < min) newMax = min;
    if (newMax > max) newMax = max;
    if (this.tempMinPrice != null && newMax < this.tempMinPrice)
      newMax = this.tempMinPrice;
    this.tempMaxPrice = newMax;
    try {
      this.priceMax$.next(this.tempMaxPrice);
    } catch {}
  }

  sliderTrackBackground(): string {
    const { min, max } = this.lastPriceBounds;
    if (max <= min) return "#e6e7e9";
    const lo = this.tempMinPrice ?? min;
    const hi = this.tempMaxPrice ?? max;
    const minPct = Math.round(((lo - min) / (max - min)) * 100);
    const maxPct = Math.round(((hi - min) / (max - min)) * 100);
    return `linear-gradient(to right,#e6e7e9 0%,#e6e7e9 ${minPct}%,#0b5ed7 ${minPct}%,#0b5ed7 ${maxPct}%,#e6e7e9 ${maxPct}%,#e6e7e9 100%)`;
  }

  scrollRail(direction: 1 | -1) {
    try {
      const el = this.railRef?.nativeElement;
      if (!el) return;
      el.scrollBy({
        left: direction * (this.railScrollByPx || 640),
        behavior: "smooth",
      });
    } catch {}
  }

  onRailKeydown(ev: KeyboardEvent) {
    if (ev.key === "ArrowLeft") {
      ev.preventDefault();
      this.scrollRail(-1);
    }
    if (ev.key === "ArrowRight") {
      ev.preventDefault();
      this.scrollRail(1);
    }
  }

  /** Cart key for a specific variant object (used by dropdown rows) */
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

  rowVariantInCart(
    product: Product,
    variant: Variant,
    qtyMap: Map<string, number>,
  ): boolean {
    return this.getRowVariantQty(product, variant, qtyMap) > 0;
  }

  addRowVariantToCart(product: Product, variant: Variant, event: Event): void {
    console.log("Add to cart in variant selections : ", product);
    event.stopPropagation();
    const key = this.variantRowCartKey(product, variant);

    const sellingPrice = variant?.SellingPrice ?? (product as any).SellingPrice;
    const offerPrice = variant?.OfferPrice ?? (product as any).OfferPrice;
    const mrp = parseMoneyToNumber(String(sellingPrice ?? "")) || 0;
    // ✅ Fall back to mrp (not 0) when the variant has no active offer — see
    // the matching fix + comment in addVariantToCart() above.
    const dealPrice = parseMoneyToNumber(String(offerPrice ?? "")) || mrp;
    const title =
      `${(product as any).Brand ?? ""} ${product.ProductName ?? ""} - ${variant.variantsName}`.trim();
    const image = String(
      (product as any).ImageUrl || (product as any).Image || "",
    ).trim();

    // 🔧 FIX: don't share the raw `product` reference across cart lines —
    // clone it per line so a future mutation of product.selectedVariant
    // elsewhere can't retroactively change what an already-added cart line
    // shows.
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
          isService: product.isService ?? false,
        },
      }),
    );
    // this.drawer.openCart();
  }

  increaseRowVariant(
    product: Product,
    variant: Variant,
    qtyMap: Map<string, number>,
    event?: Event,
  ): void {
    event?.stopPropagation();

    const key = this.variantRowCartKey(product, variant);

    this.store.dispatch(
      updateQuantity({
        productId: key,
        quantity: (qtyMap.get(key) ?? 0) + 1,
      }),
    );

    // this.drawer.openCart();
  }

  decreaseRowVariant(
    product: Product,
    variant: Variant,
    qtyMap: Map<string, number>,
    event?: Event,
  ): void {
    event?.stopPropagation();

    const key = this.variantRowCartKey(product, variant);
    const current = qtyMap.get(key) ?? 0;

    if (current <= 1) {
      this.store.dispatch(removeItem({ productId: key }));
    } else {
      this.store.dispatch(
        updateQuantity({
          productId: key,
          quantity: current - 1,
        }),
      );
    }
  }

  trackByVariantId(_: number, v: Variant): string {
    return v.variantsid;
  }

  trackByProductId(_: number, p: Product): string {
    return String(p.ProductId ?? "");
  }

  onDrawerChange(state: DrawerState): void {
    /* no-op */
  }

  /** True only when there's an actual discount (not just OfferPrice == SellingPrice) */
  hasDiscount(p: Product): boolean {
    const offer = this.parsePrice((p as any).OfferPrice);
    const selling = this.parsePrice((p as any).SellingPrice);
    return offer > 0 && offer !== selling;
  }

  /** Min/max effective price across a product's variants, for the "Price range" line */
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
