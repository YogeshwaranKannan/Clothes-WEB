// import {
//   ChangeDetectorRef,
//   Component,
//   ElementRef,
//   OnInit,
//   OnDestroy,
//   AfterViewInit,
//   inject,
// } from "@angular/core";
// import { CommonModule, Location } from "@angular/common";
// import {
//   ActivatedRoute,
//   ParamMap,
//   Router,
//   RouterModule,
// } from "@angular/router";
// import { Observable } from "rxjs";
// import { map, switchMap, tap, shareReplay, finalize } from "rxjs/operators";
// import { Store } from "@ngrx/store";
// import { FormsModule } from "@angular/forms";
// import { parseMoneyToNumber } from "../common/utils/price.util";
// import { ProductDetail, SubImage } from "../common/models/product.model";
// import { Variant } from "../common/models/product.model";
// // import { ProductService } from "../common/services/product.service";
// import { ProductService } from "../common/services/product.service copy";
// //import { SimilarProductsComponent } from "../similar-products/similar-products.component";

// import { CartItem } from "../common/models/cart/cart-item.model";

// import {
//   updateOrAddItem,
//   updateQuantity,
//   removeItem,
// } from "../common/models/cart/cart.actions";
// import { WishlistService } from "../wishlist/wishlist.service";

// import { selectCartItems } from "../common/models/cart/cart.selectors";

// import { SellerService } from "../common/services/SellerService";
// import {
//   BASE_URL,
//   host,
//   Imagehost,
//   Img_BASE_URL,
// } from "../common/utils/constant";
// import { DrawerService } from "../common/components/drawer/drawer.service";
// import { DrawerComponent } from "../common/components/drawer/drawer.component";
// import { DrawerState } from "../common/components/drawer/drawer-state";
// import { CartComponent } from "../cart/cart.component";
// import { LoadingScreenComponent } from "../common/components/loading-screen/loading-screen.component";
// // ✅ Coordinates collapsing the navbar's <app-product-suggest> behind a new
// //    icon on this page, mobile only.
// import { MobileSearchToggleService } from "../common/services/mobile-search-toggle.service";
// import { ImageUrlService } from "../common/utils/ImageUrlService";

// @Component({
//   selector: "app-product",
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     FormsModule,
//     //SimilarProductsComponent,
//     LoadingScreenComponent,
//     DrawerComponent,
//     CartComponent,
//   ],
//   templateUrl: "./product.component.html",
//   styleUrls: ["./product.component.scss"],
// })
// export class ProductComponent implements OnInit, AfterViewInit, OnDestroy {
//   private productService = inject(ProductService);
//   private route = inject(ActivatedRoute);
//   private location = inject(Location);
//   private store = inject(Store);
//   private router = inject(Router);
//   // public (not private) — the template calls mobileSearchToggle.isOpen$
//   // and mobileSearchToggle.show() directly
//   mobileSearchToggle = inject(MobileSearchToggleService);

//   isLoading = true;

//   // ── Cart/checkout drawer state — bound to by <app-drawer>/<app-cart> in
//   // the template. DrawerService is the single source of truth (shared with
//   // the header's cart icon, etc.); these fields just mirror its streams so
//   // the template has plain properties to bind to.
//   DrawerState = DrawerState;
//   drawerState: DrawerState = DrawerState.Hidden;
//   drawerTitle = "Cart";
//   drawerContent: "cart" | "checkout" = "cart";
//   isCheckout = false;
//   checkoutComponent: any | null = null;
//   private _subs: any[] = [];

//   product$!: Observable<ProductDetail | null>;
//   product: ProductDetail | null = null;
//   similarProductIds: number[] = [];

//   // Variant state (per requirements)
//   selectedVariant: Variant | null = null;
//   cartQtyMap$ = this.store.select(selectCartItems).pipe(
//     map((items: CartItem[]) => {
//       const m = new Map<string, number>();
//       for (const it of items) m.set(it.productId, it.quantity);
//       return m;
//     }),
//   );

//   quantity = 1;
//   selectedImage: string | null = null;
//   constructor(
//     private hostRef: ElementRef<HTMLElement>,
//     public router1: Router,
//     private wishlist: WishlistService,
//     private cdr: ChangeDetectorRef,
//     private SellerService: SellerService,
//     private drawer: DrawerService,
//     private imageUrlService: ImageUrlService,
//   ) {}

//   buildImageUrl(
//     relative?: string,
//     productname?: string,
//     isService?: boolean,
//     serviceFolder?: string,
//   ): string {
//     const result = this.imageUrlService.buildImageUrl(
//       relative,
//       productname,
//       isService,
//     );

//     // console.log("buildImageUrl OUTPUT →", result);

//     return result;
//   }

//   private mapSubImages(images: string[]): SubImage[] {
//     return images.map((url, index) => ({
//       url: url,
//       alt: `Product Image ${index + 1}`,
//       order: index + 1,
//     }));
//   }

//   // ngOnInit(): void {
//   //   this.product$ = this.route.paramMap.pipe(
//   //     map((pm: ParamMap) => {
//   //       const id = pm.get("id") ?? "";
//   //       console.log("Product ID from route:", id);
//   //       return id;
//   //     }),

//   //     switchMap((id: string) => {
//   //       console.log("Calling Product API:", id);

//   //       return this.productService.getProductById(id as any);
//   //     }),

//   //     switchMap((p: any) => {
//   //       console.log("Product API Response:", p);

//   //       const formattedProductName = (p.ProductName || "")
//   //         .trim()
//   //         .replace(/[\/()]/g, "")
//   //         .replace(/\s+/g, "-");

//   //       const cleanFolder = (this.SellerService.getServiceImageFolder() || "")
//   //         .replace(/^\/+/, "")
//   //         .replace(/\/+$/, "");

//   //       return this.productService
//   //         .getFullImages(
//   //           cleanFolder,
//   //           p.isService ? "uploadsServiceImages" : "uploadsProductImages",
//   //           formattedProductName,
//   //         )
//   //         .pipe(
//   //           tap((images: string[]) => {
//   //             console.log("FullImages API Response:", images);
//   //           }),

//   //           map((images: string[]) => {
//   //             p.SubImages = images.map((img: string, index: number) => ({
//   //               url: host + "/" + img,
//   //               alt: `Product Image ${index + 1}`,
//   //               order: index + 1,
//   //             }));

//   //             return p;
//   //           }),
//   //         );
//   //     }),

//   //     tap((p: any) => {
//   //       console.log("Final Product Object:", p);

//   //       this.product = p;

//   //       this.selectedVariant = p?.variants?.[0] ?? null;

//   //       console.log("Selected Variant:", this.selectedVariant);

//   //       this.similarProductIds = Array.isArray(p?.SimilarProducts)
//   //         ? p.SimilarProducts.slice()
//   //         : [];

//   //       console.log("Similar Products:", this.similarProductIds);

//   //       if (p?.SubImages?.length) {
//   //         const sorted = [...p.SubImages].sort(
//   //           (a, b) => (a.order ?? 0) - (b.order ?? 0),
//   //         );

//   //         this.selectedImage = sorted[0].url;

//   //         console.log("Default Product Image:", this.selectedImage);
//   //       } else {
//   //         this.selectedImage = this.buildImageUrl(
//   //           p.ImageUrl,
//   //           p.ProductName,
//   //           p.isService,
//   //         );
//   //       }

//   //       console.log("Selected Image:", this.selectedImage);
//   //     }),

//   //     shareReplay(1),
//   //   );
//   // }

//   ngOnInit(): void {
//     this.isLoading = true;

//     this.product$ = this.route.paramMap.pipe(
//       map((pm: ParamMap) => {
//         const id = pm.get("id") ?? "";
//         return id;
//       }),

//       switchMap((id: string) => this.productService.getProductById(id as any)),

//       switchMap((p: any) => {
//         console.log("P ==", p);

//         const cleanFolder = (this.SellerService.getServiceImageFolder() || "")
//           .replace(/^\/+/, "")
//           .replace(/\/+$/, "");

//         return this.productService
//           .getFullImages(
//             cleanFolder,
//             p.isService ? "uploadsServiceImages" : "uploadsProductImages",
//             p?.inventoryId,
//             this.SellerService.getCompanyName(),
//           )
//           .pipe(
//             map((images: string[]) => {
//               console.log("Full Images : ", images);
//               p.SubImages = images.map((img: string, index: number) => ({
//                 url: Imagehost + "/" + img,
//                 alt: `Product Image ${index + 1}`,
//                 order: index + 1,
//               }));

//               return p;
//             }),
//           );
//       }),

//       tap((p: any) => {
//         this.product = p;

//         this.selectedVariant = p?.variants?.[0] ?? null;

//         this.similarProductIds = Array.isArray(p?.SimilarProducts)
//           ? p.SimilarProducts.slice()
//           : [];

//         console.log("IMAGE DATA:", {
//           ProductName: p?.ProductName,
//           ImageUrl: p?.ImageUrl,
//           SubImages: p?.SubImages,
//         });

//         if (p?.SubImages?.length) {
//           const defaultImageName = String(p?.ImageUrl || "")
//             .split("/")
//             .pop()
//             ?.trim()
//             .toLowerCase();

//           console.log("DEFAULT IMAGE NAME:", defaultImageName);

//           const defaultImage = p.SubImages.find((img: any) => {
//             const imageUrl = String(img?.url || "");

//             const imageName = imageUrl
//               .split("/")
//               .pop()
//               ?.split("?")[0]
//               .trim()
//               .toLowerCase();

//             console.log("CHECK IMAGE:", {
//               imageName,
//               defaultImageName,
//               match: imageName === defaultImageName,
//             });

//             return imageName === defaultImageName;
//           });

//           if (defaultImage) {
//             this.selectedImage = defaultImage.url;

//             console.log("✅ DEFAULT IMAGE SELECTED:", this.selectedImage);
//           } else {
//             // fallback
//             this.selectedImage = p.SubImages[0].url;

//             console.log(
//               "⚠️ DEFAULT IMAGE NOT FOUND, USING FIRST:",
//               this.selectedImage,
//             );
//           }
//         } else {
//           this.selectedImage = this.buildImageUrl(
//             p.ImageUrl,
//             p.ProductName,
//             p.isService,
//           );

//           console.log("BUILT IMAGE URL:", this.selectedImage);
//         }

//         console.log("🔥 FINAL SELECTED IMAGE:", this.selectedImage);

//         this.isLoading = false;
//       }),
//       finalize(() => {
//         this.isLoading = false;
//       }),

//       shareReplay(1),
//     );
//   }

//   goBack(): void {
//     this.location.back();
//   }

//   // ── Drawer wiring — same pattern as header.component.ts, so the cart
//   // drawer opened from this page (via onAddToCart/onBuyNow/etc., all of
//   // which already call this.drawer.openCart()) reflects DrawerService's
//   // state instead of the template binding to properties that never update.
//   ngAfterViewInit(): void {
//     this._subs.push(
//       this.drawer.stateChanges.subscribe((s) => (this.drawerState = s)),
//     );
//     this._subs.push(
//       this.drawer.titleChanges.subscribe((t) => (this.drawerTitle = t)),
//     );
//     this._subs.push(
//       this.drawer.contentChanges.subscribe((c) => (this.drawerContent = c)),
//     );
//     this._subs.push(
//       this.drawer.checkoutComponentChanges.subscribe((c) => {
//         this.checkoutComponent = c;
//         try {
//           this.cdr.detectChanges();
//         } catch {}
//       }),
//     );
//     this._subs.push(
//       this.drawer.isCheckoutChanges.subscribe((b) => (this.isCheckout = b)),
//     );
//   }

//   ngOnDestroy(): void {
//     this._subs.forEach((s) => s.unsubscribe?.());
//   }

//   onDrawerChange(state: DrawerState): void {
//     this.drawer.setState(state);
//   }

//   onDrawerBack(): void {
//     this.drawer.openCart();
//   }

//   openCheckoutInDrawer(): void {
//     this.drawer.openCheckout();
//   }

//   closeDrawer(): void {
//     this.drawer.close();
//   }

//   /**
//    * New mobile search icon (page-header, Product page only) clicked.
//    * stopPropagation() is required: NavbarComponent has a document-level
//    * click listener that closes the search once it's open, on any click
//    * outside its wrapper. Since this icon lives in a different component's
//    * DOM entirely (not inside that wrapper), without stopPropagation() this
//    * same click would bubble to that listener right after show() below has
//    * already run, and get treated as an "outside click" — immediately
//    * re-closing the search on the very click meant to open it.
//    */
//   onMobileSearchIconClick(event: MouseEvent): void {
//     event.stopPropagation();
//     this.mobileSearchToggle.show();
//   }

//   updateRowVariantQtyFromInput(
//     product: any,
//     variant: Variant,
//     qtyMap: Map<string, number>,
//     event: Event,
//   ): void {
//     event.stopPropagation();

//     const input = event.target as HTMLInputElement;

//     let qty = Number(input.value);

//     if (isNaN(qty) || qty < 1) {
//       qty = 1;
//     }

//     const key = this.variantRowCartKey(product, variant);
//     const currentQty = qtyMap.get(key) ?? 0;

//     if (qty === currentQty) {
//       return;
//     }

//     this.store.dispatch(
//       updateQuantity({
//         productId: key,
//         quantity: qty,
//       }),
//     );
//     this.drawer.openCart();
//   }

//   updateBaseProductQtyFromInput(
//     product: any,
//     qtyMap: Map<string, number>,
//     event: Event,
//   ): void {
//     event.stopPropagation();

//     const qty = Math.max(
//       1,
//       Number((event.target as HTMLInputElement).value) || 1,
//     );

//     this.store.dispatch(
//       updateQuantity({
//         productId: this.baseProductCartKey(product),
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

//   private buildCartItem(product: any) {
//     const mrp = parseMoneyToNumber(String(product?.SellingPrice ?? ""));
//     const deal = parseMoneyToNumber(String(product?.OfferPrice ?? "")) || mrp;

//     const title =
//       `${(product as any).Brand ?? ""} ${product?.ProductName ?? ""}`.trim();

//     const image = String(
//       (product as any).ImageUrl || (product as any).Image || "",
//     ).trim();

//     return {
//       productId: String(product?.ProductId ?? ""), // A uses key, B uses ProductId
//       title,
//       mrp,
//       dealPrice: deal,
//       quantity: 1, // same as A
//       imageUrl: image,
//       item: product,
//       isService: product?.isService ?? false,
//     };
//   }

//   onAddToCart(): void {
//     if (!this.product) return;
//     const item = this.buildCartItem(this.product);
//     console.log("this.product", item);
//     console.log("ADD TO CART -> built:", this.product.DefaultImage?.url, item);
//     this.store.dispatch(updateOrAddItem({ item }));
//     //this.router.navigate(['/cart']);
//     this.drawer.openCart();
//   }

//   // === Variant helpers (inline panel) ===
//   trackByVariantId(_: number, v: Variant): string {
//     return v.variantsid;
//   }

//   parsePrice(val: string | number | null | undefined): number {
//     if (val == null) return 0;
//     if (typeof val === "number") return val;
//     return parseMoneyToNumber(val) ?? 0;
//   }

//   variantOfferText(v: Variant): string {
//     if ((v as any).offerText) return (v as any).offerText;
//     const mrp = parseMoneyToNumber(String(v.SellingPrice ?? ""));
//     const offer = parseMoneyToNumber(String(v.OfferPrice ?? ""));
//     if (mrp > 0 && offer > 0 && mrp > offer) {
//       return `₹${(mrp - offer).toLocaleString("en-IN")} OFF`;
//     }
//     return "";
//   }

//   variantRowCartKey(product: any, variant: Variant): string {
//     return `${String(product.ProductId ?? "")}__v${variant.variantsid}`;
//   }

//   getRowVariantQty(
//     product: any,
//     variant: Variant,
//     qtyMap: Map<string, number>,
//   ): number {
//     return qtyMap.get(this.variantRowCartKey(product, variant)) ?? 0;
//   }

//   rowVariantInCart(
//     product: any,
//     variant: Variant,
//     qtyMap: Map<string, number>,
//   ): boolean {
//     return this.getRowVariantQty(product, variant, qtyMap) > 0;
//   }

//   selectVariantInline(product: any, variant: Variant): void {
//     this.selectedVariant = variant;
//   }

//   addRowVariantToCart(product: any, variant: Variant, event: Event): void {
//     event.stopPropagation();
//     const key = this.variantRowCartKey(product, variant);
//     const mrp = parseMoneyToNumber(String(variant.SellingPrice ?? "")) || 0;
//     const deal = parseMoneyToNumber(String(variant.OfferPrice ?? "")) || 0;
//     const title =
//       `${(product as any).Brand ?? ""} ${product.ProductName ?? ""} - ${variant.variantsName}`.trim();
//     const image = String(
//       (product as any).ImageUrl || (product as any).Image || "",
//     ).trim();

//     this.store.dispatch(
//       updateOrAddItem({
//         item: {
//           productId: key,
//           title,
//           mrp,
//           dealPrice: deal,
//           quantity: 1,
//           imageUrl: image,
//           item: product,
//           isService: product.isService ?? false,
//         },
//       }),
//     );
//     this.drawer.openCart();
//   }

//   increaseRowVariant(
//     product: any,
//     variant: Variant,
//     qtyMap: Map<string, number>,
//     event: Event,
//   ): void {
//     event.stopPropagation();
//     const key = this.variantRowCartKey(product, variant);
//     const current = qtyMap.get(key) ?? 0;
//     this.store.dispatch(
//       updateQuantity({ productId: key, quantity: current + 1 }),
//     );
//     this.drawer.openCart();
//   }

//   decreaseRowVariant(
//     product: any,
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

//   // === Base-product (no-variant) cart helpers ===

//   /** Cart key for products without variants — mirrors buildCartItem's productId. */
//   baseProductCartKey(product: any): string {
//     return String(product?.ProductId ?? "");
//   }

//   getBaseProductQty(product: any, qtyMap: Map<string, number>): number {
//     return qtyMap.get(this.baseProductCartKey(product)) ?? 0;
//   }

//   increaseBaseProduct(
//     product: any,
//     qtyMap: Map<string, number>,
//     event: Event,
//   ): void {
//     event.stopPropagation();
//     const key = this.baseProductCartKey(product);
//     const current = qtyMap.get(key) ?? 0;
//     if (current === 0) {
//       // Not in cart yet — add it fresh
//       const item = this.buildCartItem(product);
//       this.store.dispatch(updateOrAddItem({ item }));
//     } else {
//       this.store.dispatch(
//         updateQuantity({ productId: key, quantity: current + 1 }),
//       );
//       this.drawer.openCart();
//     }
//   }

//   decreaseBaseProduct(
//     product: any,
//     qtyMap: Map<string, number>,
//     event: Event,
//   ): void {
//     event.stopPropagation();
//     const key = this.baseProductCartKey(product);
//     const current = qtyMap.get(key) ?? 0;
//     if (current <= 1) {
//       this.store.dispatch(removeItem({ productId: key }));
//     } else {
//       this.store.dispatch(
//         updateQuantity({ productId: key, quantity: current - 1 }),
//       );
//     }
//   }

//   onBuyNow(): void {
//     if (!this.product) return;

//     this.quantity = Math.max(1, Math.floor(Number(this.quantity || 1)));
//     const cartItem = this.buildCartItem(this.product);

//     this.store.dispatch(updateOrAddItem({ item: cartItem }));
//     this.router.navigate(["/checkout"]); // only if checkout exists
//   }

//   selectImage(url: string) {
//     this.selectedImage = url;
//   }

//   // === Image viewer state (copied/minified from expected) ===
//   rotateAngle = 0;
//   autoRotate = false;
//   isFlipping = false;
//   private flipDurationMs = 3200; // matches SCSS animation time

//   // Manual rotate transform used on wrapper (disable when auto rotating or flipping)
//   get manualRotateTransform(): string | null {
//     if (this.autoRotate || this.isFlipping) return null;
//     return `rotate(${this.rotateAngle}deg)`;
//   }

//   // === Controls ===
//   rotate90() {
//     this.autoRotate = false;
//     this.isFlipping = false;
//     this.rotateAngle = (this.rotateAngle + 90) % 360;
//   }

//   toggleAutoRotate() {
//     this.isFlipping = false;
//     this.autoRotate = !this.autoRotate;
//   }

//   resetRotation() {
//     this.autoRotate = false;
//     this.isFlipping = false;
//     this.rotateAngle = 0;
//   }

//   flipOnce() {
//     // cancel auto-rotate so transforms don't conflict
//     this.autoRotate = false;

//     // re-trigger animation
//     this.isFlipping = false;
//     requestAnimationFrame(() => {
//       this.isFlipping = true;
//       window.setTimeout(() => (this.isFlipping = false), this.flipDurationMs);
//     });
//   }
// }
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
} from "@angular/core";
import { CommonModule, Location } from "@angular/common";
import {
  ActivatedRoute,
  ParamMap,
  Router,
  RouterModule,
} from "@angular/router";
import { from, Observable, of } from "rxjs";
import {
  map,
  switchMap,
  tap,
  shareReplay,
  finalize,
  catchError,
} from "rxjs/operators";
import { Store } from "@ngrx/store";
import { FormsModule } from "@angular/forms";
import { parseMoneyToNumber } from "../common/utils/price.util";
import { ProductDetail, SubImage } from "../common/models/product.model";
import { Variant } from "../common/models/product.model";
// import { ProductService } from "../common/services/product.service";
import { ProductService } from "../common/services/product.service copy";
//import { SimilarProductsComponent } from "../similar-products/similar-products.component";

import { CartItem } from "../common/models/cart/cart-item.model";

import {
  updateOrAddItem,
  updateQuantity,
  removeItem,
} from "../common/models/cart/cart.actions";
import { WishlistService } from "../wishlist/wishlist.service";

import { selectCartItems } from "../common/models/cart/cart.selectors";

import { SellerService } from "../common/services/SellerService";
import {
  BASE_URL,
  host,
  Imagehost,
  Img_BASE_URL,
} from "../common/utils/constant";
import { DrawerService } from "../common/components/drawer/drawer.service";
import { DrawerComponent } from "../common/components/drawer/drawer.component";
import { DrawerState } from "../common/components/drawer/drawer-state";
import { CartComponent } from "../cart/cart.component";
import { LoadingScreenComponent } from "../common/components/loading-screen/loading-screen.component";
// ✅ Coordinates collapsing the navbar's <app-product-suggest> behind a new
//    icon on this page, mobile only.
import { MobileSearchToggleService } from "../common/services/mobile-search-toggle.service";
import { ImageUrlService } from "../common/utils/ImageUrlService";
import { SeoService, SITE_URL } from "../core/services/seo.service";

@Component({
  selector: "app-product",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    //SimilarProductsComponent,
    LoadingScreenComponent,
    DrawerComponent,
    CartComponent,
  ],
  templateUrl: "./product.component.html",
  styleUrls: ["./product.component.scss"],
})
export class ProductComponent implements OnInit, AfterViewInit, OnDestroy {
  private productService = inject(ProductService);
  private seo = inject(SeoService);
  private route = inject(ActivatedRoute);
  private location = inject(Location);
  private store = inject(Store);
  private router = inject(Router);
  // public (not private) — the template calls mobileSearchToggle.isOpen$
  // and mobileSearchToggle.show() directly
  mobileSearchToggle = inject(MobileSearchToggleService);

  isLoading = true;

  // ── Cart/checkout drawer state — bound to by <app-drawer>/<app-cart> in
  // the template. DrawerService is the single source of truth (shared with
  // the header's cart icon, etc.); these fields just mirror its streams so
  // the template has plain properties to bind to.
  DrawerState = DrawerState;
  drawerState: DrawerState = DrawerState.Hidden;
  drawerTitle = "Cart";
  drawerContent: "cart" | "checkout" = "cart";
  isCheckout = false;
  checkoutComponent: any | null = null;
  private _subs: any[] = [];

  product$!: Observable<ProductDetail | null>;
  product: ProductDetail | null = null;
  similarProductIds: number[] = [];

  // Variant state (per requirements)
  selectedVariant: Variant | null = null;
  cartQtyMap$ = this.store.select(selectCartItems).pipe(
    map((items: CartItem[]) => {
      const m = new Map<string, number>();
      for (const it of items) m.set(it.productId, it.quantity);
      return m;
    }),
  );

  quantity = 1;
  selectedImage: string | null = null;
  constructor(
    private hostRef: ElementRef<HTMLElement>,
    public router1: Router,
    private wishlist: WishlistService,
    private cdr: ChangeDetectorRef,
    private SellerService: SellerService,
    private drawer: DrawerService,
    private imageUrlService: ImageUrlService,
  ) {}

  // buildImageUrl(
  //   relative?: string,
  //   productname?: string,
  //   isService?: boolean,
  //   serviceFolder?: string,
  // ): string {
  //   const result = this.imageUrlService.buildImageUrl(
  //     relative,
  //     productname,
  //     isService,
  //   );

  //   // console.log("buildImageUrl OUTPUT →", result);

  //   return result;
  // }

  buildImageUrl(
    relative?: string,
    inventoryId?: string,
    isService: boolean = false,
  ): Promise<string> {
    return this.imageUrlService.buildImageUrl(relative, inventoryId, isService);
  }

  private mapSubImages(images: string[]): SubImage[] {
    return images.map((url, index) => ({
      url: url,
      alt: `Product Image ${index + 1}`,
      order: index + 1,
    }));
  }

  // ngOnInit(): void {
  //   this.product$ = this.route.paramMap.pipe(
  //     map((pm: ParamMap) => {
  //       const id = pm.get("id") ?? "";
  //       console.log("Product ID from route:", id);
  //       return id;
  //     }),

  //     switchMap((id: string) => {
  //       console.log("Calling Product API:", id);

  //       return this.productService.getProductById(id as any);
  //     }),

  //     switchMap((p: any) => {
  //       console.log("Product API Response:", p);

  //       const formattedProductName = (p.ProductName || "")
  //         .trim()
  //         .replace(/[\/()]/g, "")
  //         .replace(/\s+/g, "-");

  //       const cleanFolder = (this.SellerService.getServiceImageFolder() || "")
  //         .replace(/^\/+/, "")
  //         .replace(/\/+$/, "");

  //       return this.productService
  //         .getFullImages(
  //           cleanFolder,
  //           p.isService ? "uploadsServiceImages" : "uploadsProductImages",
  //           formattedProductName,
  //         )
  //         .pipe(
  //           tap((images: string[]) => {
  //             console.log("FullImages API Response:", images);
  //           }),

  //           map((images: string[]) => {
  //             p.SubImages = images.map((img: string, index: number) => ({
  //               url: host + "/" + img,
  //               alt: `Product Image ${index + 1}`,
  //               order: index + 1,
  //             }));

  //             return p;
  //           }),
  //         );
  //     }),

  //     tap((p: any) => {
  //       console.log("Final Product Object:", p);

  //       this.product = p;

  //       this.selectedVariant = p?.variants?.[0] ?? null;

  //       console.log("Selected Variant:", this.selectedVariant);

  //       this.similarProductIds = Array.isArray(p?.SimilarProducts)
  //         ? p.SimilarProducts.slice()
  //         : [];

  //       console.log("Similar Products:", this.similarProductIds);

  //       if (p?.SubImages?.length) {
  //         const sorted = [...p.SubImages].sort(
  //           (a, b) => (a.order ?? 0) - (b.order ?? 0),
  //         );

  //         this.selectedImage = sorted[0].url;

  //         console.log("Default Product Image:", this.selectedImage);
  //       } else {
  //         this.selectedImage = this.buildImageUrl(
  //           p.ImageUrl,
  //           p.ProductName,
  //           p.isService,
  //         );
  //       }

  //       console.log("Selected Image:", this.selectedImage);
  //     }),

  //     shareReplay(1),
  //   );
  // }

  /** Per-product title/description/OG tags plus schema.org Product JSON-LD. */
  private applyProductSeo(p: any): void {
    if (!p?.ProductId) return;

    const path = `/product/${encodeURIComponent(p.ProductId)}`;
    const image = this.selectedImage || undefined;
    const variant = p.variants?.[0];
    const price = parseMoneyToNumber(variant?.SellingPrice ?? p.SellingPrice);
    const inStock =
      String(variant?.StockStatus ?? p.StockStatus ?? "").toLowerCase() ===
      "in stock";
    // Seller-entered descriptions are often a few words ("Good product") – too thin for search snippets
    const ownDescription = String(p.ProductDescription ?? "").trim();
    const description = (
      (ownDescription.length >= 50 && ownDescription) ||
      `Buy ${p.ProductName}${p.Size ? ` (${p.Size})` : ""} online from Dolphin Naturals. Natural, quality groceries delivered to your door.`
    )
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 160);

    this.seo.update({
      title: p.ProductName,
      description,
      path,
      image,
      type: "product",
    });

    this.seo.setJsonLd("ld-product", {
      "@context": "https://schema.org",
      "@type": "Product",
      name: p.ProductName,
      ...(image && { image: [image] }),
      description,
      sku: String(p.ProductId),
      ...(p.Brand && { brand: { "@type": "Brand", name: p.Brand } }),
      ...(price > 0 && {
        offers: {
          "@type": "Offer",
          url: SITE_URL + path,
          priceCurrency: "INR",
          price: price.toFixed(2),
          availability: inStock
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        },
      }),
    });
  }

  ngOnInit(): void {
    this.isLoading = true;

    this.product$ = this.route.paramMap.pipe(
      map((pm: ParamMap) => pm.get("id") ?? ""),

      switchMap((id: string) => this.productService.getProductById(id as any)),

      switchMap((p: any) => {
        if (!p) return of(null); // product not found

        const cleanFolder = (this.SellerService.getServiceImageFolder() || "")
          .replace(/^\/+/, "")
          .replace(/\/+$/, "");

        return this.productService
          .getFullImages(
            cleanFolder,
            p.isService ? "uploadsServiceImages" : "uploadsProductImages",
            p.inventoryId,
            this.SellerService.getCompanyName(),
          )
          .pipe(
            catchError(() => of([] as string[])), // a failed gallery must not kill the page
            switchMap((images: string[]) => {
              p.SubImages = (images || []).map(
                (img: string, index: number) => ({
                  // S3 returns full URLs, local returns relative paths
                  url: /^https?:\/\//i.test(img) ? img : Imagehost + "/" + img,
                  alt: `Product Image ${index + 1}`,
                  order: index + 1,
                }),
              );

              if (p.SubImages.length) return of(p);

              // No gallery: resolve the main image (correct args: inventoryId, not name)
              return from(
                this.imageUrlService.buildImageUrl(
                  p.ImageUrl,
                  p.inventoryId,
                  p.isService,
                ),
              ).pipe(
                map((url: string) => {
                  p.resolvedImage = url;
                  return p;
                }),
              );
            }),
          );
      }),

      tap((p: any) => {
        if (!p) {
          this.isLoading = false;
          return;
        }

        this.product = p;
        this.selectedVariant = p.variants?.[0] ?? null;
        this.similarProductIds = Array.isArray(p.SimilarProducts)
          ? p.SimilarProducts.slice()
          : [];

        if (p.SubImages?.length) {
          const nameOf = (u: string) =>
            String(u || "")
              .split("?")[0]
              .split("/")
              .pop()
              ?.trim()
              .toLowerCase();

          const defaultName = nameOf(p.ImageUrl);
          const defaultImage = p.SubImages.find(
            (img: any) => nameOf(img.url) === defaultName,
          );

          this.selectedImage = (defaultImage ?? p.SubImages[0]).url;
        } else {
          this.selectedImage = p.resolvedImage || this.fallbackImg;
        }

        this.applyProductSeo(p);
        this.isLoading = false;
      }),

      finalize(() => {
        this.isLoading = false;
      }),

      shareReplay(1),
    );
  }

  goBack(): void {
    this.location.back();
  }

  // ── Drawer wiring — same pattern as header.component.ts, so the cart
  // drawer opened from this page (via onAddToCart/onBuyNow/etc., all of
  // which already call this.drawer.openCart()) reflects DrawerService's
  // state instead of the template binding to properties that never update.
  ngAfterViewInit(): void {
    this._subs.push(
      this.drawer.stateChanges.subscribe((s) => (this.drawerState = s)),
    );
    this._subs.push(
      this.drawer.titleChanges.subscribe((t) => (this.drawerTitle = t)),
    );
    this._subs.push(
      this.drawer.contentChanges.subscribe((c) => (this.drawerContent = c)),
    );
    this._subs.push(
      this.drawer.checkoutComponentChanges.subscribe((c) => {
        this.checkoutComponent = c;
        try {
          this.cdr.detectChanges();
        } catch {}
      }),
    );
    this._subs.push(
      this.drawer.isCheckoutChanges.subscribe((b) => (this.isCheckout = b)),
    );
  }

  ngOnDestroy(): void {
    this._subs.forEach((s) => s.unsubscribe?.());
  }

  onDrawerChange(state: DrawerState): void {
    this.drawer.setState(state);
  }

  onDrawerBack(): void {
    // this.drawer.openCart();
  }

  openCheckoutInDrawer(): void {
    this.drawer.openCheckout();
  }

  closeDrawer(): void {
    this.drawer.close();
  }

  /**
   * New mobile search icon (page-header, Product page only) clicked.
   * stopPropagation() is required: NavbarComponent has a document-level
   * click listener that closes the search once it's open, on any click
   * outside its wrapper. Since this icon lives in a different component's
   * DOM entirely (not inside that wrapper), without stopPropagation() this
   * same click would bubble to that listener right after show() below has
   * already run, and get treated as an "outside click" — immediately
   * re-closing the search on the very click meant to open it.
   */
  onMobileSearchIconClick(event: MouseEvent): void {
    event.stopPropagation();
    this.mobileSearchToggle.show();
  }

  updateRowVariantQtyFromInput(
    product: any,
    variant: Variant,
    qtyMap: Map<string, number>,
    event: Event,
  ): void {
    event.stopPropagation();

    const input = event.target as HTMLInputElement;

    let qty = Number(input.value);

    if (isNaN(qty) || qty < 1) {
      qty = 1;
    }

    const key = this.variantRowCartKey(product, variant);
    const currentQty = qtyMap.get(key) ?? 0;

    if (qty === currentQty) {
      return;
    }

    this.store.dispatch(
      updateQuantity({
        productId: key,
        quantity: qty,
      }),
    );
    // this.drawer.openCart();
  }

  updateBaseProductQtyFromInput(
    product: any,
    qtyMap: Map<string, number>,
    event: Event,
  ): void {
    event.stopPropagation();

    const qty = Math.max(
      1,
      Number((event.target as HTMLInputElement).value) || 1,
    );

    this.store.dispatch(
      updateQuantity({
        productId: this.baseProductCartKey(product),
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

  private buildCartItem(product: any) {
    const mrp = parseMoneyToNumber(String(product?.SellingPrice ?? ""));
    const deal = parseMoneyToNumber(String(product?.OfferPrice ?? "")) || mrp;

    const title =
      `${(product as any).Brand ?? ""} ${product?.ProductName ?? ""}`.trim();

    const image = String(
      (product as any).ImageUrl || (product as any).Image || "",
    ).trim();

    return {
      productId: String(product?.ProductId ?? ""), // A uses key, B uses ProductId
      title,
      mrp,
      dealPrice: deal,
      quantity: 1, // same as A
      imageUrl: image,
      item: product,
      isService: product?.isService ?? false,
    };
  }

  onAddToCart(): void {
    if (!this.product) return;
    const item = this.buildCartItem(this.product);
    console.log("this.product", item);
    console.log("ADD TO CART -> built:", this.product.DefaultImage?.url, item);
    this.store.dispatch(updateOrAddItem({ item }));
    //this.router.navigate(['/cart']);
    // this.drawer.openCart();
  }

  // === Variant helpers (inline panel) ===
  trackByVariantId(_: number, v: Variant): string {
    return v.variantsid;
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

  variantRowCartKey(product: any, variant: Variant): string {
    return `${String(product.ProductId ?? "")}__v${variant.variantsid}`;
  }

  getRowVariantQty(
    product: any,
    variant: Variant,
    qtyMap: Map<string, number>,
  ): number {
    return qtyMap.get(this.variantRowCartKey(product, variant)) ?? 0;
  }

  rowVariantInCart(
    product: any,
    variant: Variant,
    qtyMap: Map<string, number>,
  ): boolean {
    return this.getRowVariantQty(product, variant, qtyMap) > 0;
  }

  selectVariantInline(product: any, variant: Variant): void {
    this.selectedVariant = variant;
  }

  addRowVariantToCart(product: any, variant: Variant, event: Event): void {
    event.stopPropagation();
    const key = this.variantRowCartKey(product, variant);
    const mrp = parseMoneyToNumber(String(variant.SellingPrice ?? "")) || 0;
    // ✅ Fall back to mrp (not 0) when the variant has no active offer — same
    // pattern as buildCartItem() just above, and the matching fix in
    // product-list.component.ts's addVariantToCart/addRowVariantToCart.
    const deal = parseMoneyToNumber(String(variant.OfferPrice ?? "")) || mrp;
    const title =
      `${(product as any).Brand ?? ""} ${product.ProductName ?? ""} - ${variant.variantsName}`.trim();
    const image = String(
      (product as any).ImageUrl || (product as any).Image || "",
    ).trim();

    // 🔧 FIX: clone product per cart line + record the variant that was
    // active at add-time, and include selectedVariant on the cart item
    // itself — same fix already applied in product-list.component.ts's
    // addVariantToCart/addRowVariantToCart and categories.component.ts's
    // addRowVariantToCart. Without this, checkout's variantBatches (which
    // reads item.selectedVariant directly) sees a missing variant for any
    // item added from this page, and the raw `product` reference stayed
    // shared/mutable across cart lines.
    const productSnapshot = { ...product, selectedVariant: variant };

    this.store.dispatch(
      updateOrAddItem({
        item: {
          productId: key,
          title,
          mrp,
          dealPrice: deal,
          quantity: 1,
          imageUrl: image,
          item: productSnapshot,
          selectedVariant: variant,
          isService: product.isService ?? false,
        },
      }),
    );
    // this.drawer.openCart();
  }

  increaseRowVariant(
    product: any,
    variant: Variant,
    qtyMap: Map<string, number>,
    event: Event,
  ): void {
    event.stopPropagation();
    const key = this.variantRowCartKey(product, variant);
    const current = qtyMap.get(key) ?? 0;
    this.store.dispatch(
      updateQuantity({ productId: key, quantity: current + 1 }),
    );
    // this.drawer.openCart();
  }

  decreaseRowVariant(
    product: any,
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

  // === Base-product (no-variant) cart helpers ===

  /** Cart key for products without variants — mirrors buildCartItem's productId. */
  baseProductCartKey(product: any): string {
    return String(product?.ProductId ?? "");
  }

  getBaseProductQty(product: any, qtyMap: Map<string, number>): number {
    return qtyMap.get(this.baseProductCartKey(product)) ?? 0;
  }

  increaseBaseProduct(
    product: any,
    qtyMap: Map<string, number>,
    event: Event,
  ): void {
    event.stopPropagation();
    const key = this.baseProductCartKey(product);
    const current = qtyMap.get(key) ?? 0;
    if (current === 0) {
      // Not in cart yet — add it fresh
      const item = this.buildCartItem(product);
      this.store.dispatch(updateOrAddItem({ item }));
    } else {
      this.store.dispatch(
        updateQuantity({ productId: key, quantity: current + 1 }),
      );
      // this.drawer.openCart();
    }
  }

  decreaseBaseProduct(
    product: any,
    qtyMap: Map<string, number>,
    event: Event,
  ): void {
    event.stopPropagation();
    const key = this.baseProductCartKey(product);
    const current = qtyMap.get(key) ?? 0;
    if (current <= 1) {
      this.store.dispatch(removeItem({ productId: key }));
    } else {
      this.store.dispatch(
        updateQuantity({ productId: key, quantity: current - 1 }),
      );
    }
  }

  onBuyNow(): void {
    if (!this.product) return;

    this.quantity = Math.max(1, Math.floor(Number(this.quantity || 1)));
    const cartItem = this.buildCartItem(this.product);

    this.store.dispatch(updateOrAddItem({ item: cartItem }));
    this.router.navigate(["/checkout"]); // only if checkout exists
  }

  selectImage(url: string) {
    this.selectedImage = url;
  }
  readonly fallbackImg = "/assets/placeholder-bike.png";

  onImgError(ev: Event) {
    const img = ev.target as HTMLImageElement;
    if (!img || img.src.includes("placeholder-bike.png")) return;
    img.src = this.fallbackImg;
  }

  // === Image viewer state (copied/minified from expected) ===
  rotateAngle = 0;
  autoRotate = false;
  isFlipping = false;
  private flipDurationMs = 3200; // matches SCSS animation time

  // Manual rotate transform used on wrapper (disable when auto rotating or flipping)
  get manualRotateTransform(): string | null {
    if (this.autoRotate || this.isFlipping) return null;
    return `rotate(${this.rotateAngle}deg)`;
  }

  // === Controls ===
  rotate90() {
    this.autoRotate = false;
    this.isFlipping = false;
    this.rotateAngle = (this.rotateAngle + 90) % 360;
  }

  toggleAutoRotate() {
    this.isFlipping = false;
    this.autoRotate = !this.autoRotate;
  }

  resetRotation() {
    this.autoRotate = false;
    this.isFlipping = false;
    this.rotateAngle = 0;
  }

  flipOnce() {
    // cancel auto-rotate so transforms don't conflict
    this.autoRotate = false;

    // re-trigger animation
    this.isFlipping = false;
    requestAnimationFrame(() => {
      this.isFlipping = true;
      window.setTimeout(() => (this.isFlipping = false), this.flipDurationMs);
    });
  }
}
