// // import {
// //   Component,
// //   ElementRef,
// //   HostListener,
// //   OnInit,
// //   OnDestroy,
// //   AfterViewInit,
// //   inject,
// //   ChangeDetectorRef,
// //   EventEmitter,
// //   Output,
// //   ViewChild,
// // } from "@angular/core";
// // import { CommonModule } from "@angular/common";
// // import { RouterModule, Router } from "@angular/router";
// // import { Observable, map } from "rxjs";
// // import { Store } from "@ngrx/store";
// // import { WishlistService } from "../../../wishlist/wishlist.service";
// // import { ProductSuggestComponent } from "../product-suggest/product-suggest.component";
// // import { PickupDeliveryComponent } from "../pickup-delivery/pickup-delivery.component";
// // import { selectCartCount } from "../../models/cart/cart.selectors";
// // import { DrawerComponent } from "../drawer/drawer.component";
// // import { DrawerState } from "../drawer/drawer-state";
// // import { DrawerService } from "../drawer/drawer.service";
// // import { CartComponent } from "../../../cart/cart.component";
// // import {
// //   ThemeService,
// //   AppTheme,
// //   ThemeMeta,
// // } from "../../../core/services/theme.service";
// // import { FormsModule } from "@angular/forms";
// // import { AuthService } from "../../../core/auth/auth.service";
// // import { UserMenuComponent } from "./user-menu/user-menu.component";
// // import { SellerService } from "../../services/SellerService";
// // import { BASE_URL, host } from "../../utils/constant";
// // import { MobileMenuService } from "../../services/mobile-menu.service";

// // @Component({
// //   selector: "app-header",
// //   standalone: true,
// //   imports: [
// //     CommonModule,
// //     RouterModule,
// //     ProductSuggestComponent,
// //     PickupDeliveryComponent,
// //     FormsModule,
// //     DrawerComponent,
// //     CartComponent,
// //     UserMenuComponent,
// //   ],
// //   templateUrl: "./header.component.html",
// //   styleUrls: ["./header.component.scss"],
// // })
// // export class HeaderComponent implements OnInit, OnDestroy, AfterViewInit {
// //   // ── Theme ──────────────────────────────────────────────────────────────────

// //   private themeService: ThemeService = inject(ThemeService);

// //   @ViewChild("trackOrderContainer")
// //   trackOrderContainer?: ElementRef<HTMLElement>;
// //   @Output() orderPlaced = new EventEmitter<string>();

// //   /** Auto-focus the input when the track panel opens */
// //   @ViewChild("trackInputEl") trackInputEl?: ElementRef<HTMLInputElement>;

// //   get themes(): ThemeMeta[] {
// //     return this.themeService.themes;
// //   }

// //   get activeTheme(): AppTheme {
// //     return this.themeService.activeTheme;
// //   }

// //   // ── Drawer ─────────────────────────────────────────────────────────────────
// //   DrawerState = DrawerState;
// //   drawerState: DrawerState = DrawerState.Hidden;
// //   drawerTitle = "Cart";
// //   drawerContent: "cart" | "checkout" = "cart";
// //   trackedRefNo: string | null = null;

// //   showTrackInput = false;
// //   refNo = "";

// //   private store = inject(Store);
// //   cartCount$: Observable<number> = this.store.select(selectCartCount);

// //   //isUserMenuOpen = false;
// //   isCheckout = false;
// //   isCheckoutPage = false;
// //   checkoutComponent: any | null = null;

// //   wishlistCount$?: Observable<number>;
// //   userName: string | null = null;

// //   isOrderPlaced = false;

// //   private auth = inject(AuthService);
// //   readonly user = this.auth.user;
// //   readonly isLoggedIn = this.auth.isLoggedIn;

// //   // ── Mobile hamburger (opens the sidebar owned by <app-navbar>) ─────────────
// //   private mobileMenu = inject(MobileMenuService);

// //   get isMobileMenuOpen(): boolean {
// //     return this.mobileMenu.isOpen;
// //   }

// //   toggleMobileMenu(): void {
// //     this.mobileMenu.toggle();
// //   }

// //   private _subs: any[] = [];

// //   constructor(
// //     private hostRef: ElementRef<HTMLElement>,
// //     public router: Router,
// //     private wishlist: WishlistService,
// //     private sellerService: SellerService,
// //     private cdr: ChangeDetectorRef,
// //     private drawer: DrawerService,
// //   ) {}

// //   goToWishlist(): void {
// //     this.router.navigate(["/wishlist"]);
// //   }

// //   openCheckoutInDrawer(): void {
// //     this.drawer.openCheckout();
// //   }

// //   onDrawerBack(): void {
// //     this.drawer.openCart();
// //   }
// //   buildImg(): string {
// //     const url = `${host}/${this.sellerService.getProfileImgPath()}`;
// //     // console.log("url : ", url);
// //     return `${host}/${this.sellerService.getProfileImgPath()}`;
// //   }

// //   ngOnInit(): void {
// //     this.wishlistCount$ = this.wishlist.ids$.pipe(
// //       map((ids) => (ids || []).length),
// //     );

// //     this.userName = "arivazhagan selvaraj";

// //     this.router.events.subscribe(() => {
// //       this.isCheckoutPage = this.router.url.startsWith("/checkout");
// //     });
// //   }

// //   ngAfterViewInit(): void {
// //     this._subs.push(
// //       this.drawer.stateChanges.subscribe((s) => (this.drawerState = s)),
// //     );

// //     this._subs.push(
// //       this.drawer.titleChanges.subscribe((t) => (this.drawerTitle = t)),
// //     );

// //     this._subs.push(
// //       this.drawer.contentChanges.subscribe((c) => (this.drawerContent = c)),
// //     );

// //     this._subs.push(
// //       this.drawer.checkoutComponentChanges.subscribe((c) => {
// //         this.checkoutComponent = c;
// //         try {
// //           this.cdr.detectChanges();
// //         } catch {}
// //       }),
// //     );

// //     this._subs.push(
// //       this.drawer.isCheckoutChanges.subscribe((b) => (this.isCheckout = b)),
// //     );

// //     // Add this here
// //     this._subs.push(
// //       this.drawer.orderPlacedChanges.subscribe(
// //         (value) => (this.isOrderPlaced = value),
// //       ),
// //     );
// //   }

// //   ngOnDestroy(): void {
// //     this._subs.forEach((s) => s.unsubscribe?.());
// //   }

// //   // toggleUserMenu(event: MouseEvent): void {
// //   //   event.stopPropagation();
// //   //   this.isUserMenuOpen = !this.isUserMenuOpen;
// //   // }

// //   // @HostListener("document:click", ["$event"])
// //   // onDocumentClick(event: MouseEvent): void {
// //   //   const target = event.target as Node | null;
// //   //   if (target && !this.hostRef.nativeElement.contains(target)) {
// //   //     this.isUserMenuOpen = false;
// //   //     this.isThemeOpen = false;
// //   //   }
// //   // }

// //   // @HostListener("document:focusin", ["$event"])
// //   // onDocumentFocusIn(): void {
// //   //   const active = document.activeElement as Node | null;
// //   //   if (active && !this.hostRef.nativeElement.contains(active)) {
// //   //     this.isUserMenuOpen = false;
// //   //     this.isThemeOpen = false;
// //   //   }
// //   // }

// //   // @HostListener("document:keydown.escape")
// //   // onEscape(): void {
// //   //   this.isUserMenuOpen = false;
// //   //   this.isThemeOpen = false;
// //   // }

// //   toggleUserMenu(event: MouseEvent): void {
// //     event.stopPropagation();
// //   }

// //   // @HostListener("document:click", ["$event"])
// //   // onDocumentClick(event: MouseEvent): void {
// //   //   const target = event.target as Node | null;
// //   //   if (target && !this.hostRef.nativeElement.contains(target)) {
// //   //     this.isThemeOpen = false;
// //   //   }
// //   // }
// //   @HostListener("document:click", ["$event"])
// //   onDocumentClick(event: MouseEvent): void {
// //     const target = event.target as Node | null;

// //     // Close theme picker
// //     if (target && !this.hostRef.nativeElement.contains(target)) {
// //       this.isThemeOpen = false;
// //     }

// //     // Close Track Order input
// //     if (
// //       this.showTrackInput &&
// //       target &&
// //       this.trackOrderContainer &&
// //       !this.trackOrderContainer.nativeElement.contains(target)
// //     ) {
// //       this.showTrackInput = false;
// //       this.refNo = "";
// //     }
// //   }

// //   @HostListener("document:focusin", ["$event"])
// //   onDocumentFocusIn(): void {
// //     const active = document.activeElement as Node | null;
// //     if (active && !this.hostRef.nativeElement.contains(active)) {
// //       this.isThemeOpen = false;
// //     }
// //   }

// //   @HostListener("document:keydown.escape")
// //   onEscape(): void {
// //     this.isThemeOpen = false;
// //   }

// //   closeDrawer(): void {
// //     this.drawer.close();
// //   }

// //   openDrawer(): void {
// //     this.drawer.openCart();
// //   }

// //   onDrawerChange(state: DrawerState): void {
// //     this.drawer.setState(state);
// //   }

// //   onMyOrders(): void {
// //     this.router.navigate(["/order-history"]).catch(() => {});
// //   }

// //   onProfile(): void {
// //     this.router.navigate(["/profile"]).catch(() => {});
// //   }

// //   onLogout(): void {
// //     // Clear auth state so UI updates immediately
// //     try {
// //       this.auth.logout();
// //     } catch {}
// //     // ensure navigation after logout
// //     this.router.navigate(["/login"]).catch(() => {});
// //   }

// //   openCartDrawer(): void {
// //     this.drawer.openCart();
// //   }

// //   // ── Track My Order ─────────────────────────────────────────────────────────

// //   toggleTrackInput(): void {
// //     this.showTrackInput = !this.showTrackInput;
// //     if (this.showTrackInput) {
// //       // Defer one tick so *ngIf renders the input before we focus it
// //       setTimeout(() => this.trackInputEl?.nativeElement.focus(), 0);
// //     } else {
// //       this.refNo = "";
// //     }
// //   }

// //   /**
// //    * Navigate to the order-detail page.
// //    *
// //    * Route: /track-order/:refNo
// //    *
// //    * The order-detail component reads the param and calls
// //    * OrderService.getOrderByRefFromJson(refNo) to look up the local JSON.
// //    */
// //   trackOrder(): void {
// //     const ref = this.refNo?.trim();
// //     if (!ref) return;

// //     this.showTrackInput = false;
// //     this.refNo = "";

// //     // ── Router navigation — main content area, NOT a drawer/modal ──
// //     this.router.navigate(["/track-order", ref]);
// //   }

// //   // ── Dark mode ──────────────────────────────────────────────────────────────

// //   get isDark(): boolean {
// //     return this.themeService.isDark;
// //   }

// //   toggleDarkMode(): void {
// //     this.themeService.toggleDarkMode();
// //   }

// //   // ── Theme picker ───────────────────────────────────────────────────────────

// //   isThemeOpen = false;

// //   get activeDotColor(): string {
// //     return (
// //       this.themes.find((t) => t.id === this.activeTheme)?.dotColor ?? "#888"
// //     );
// //   }

// //   toggleThemePicker(event: MouseEvent): void {
// //     event.stopPropagation();
// //     this.isThemeOpen = !this.isThemeOpen;
// //   }

// //   setTheme(theme: AppTheme): void {
// //     this.themeService.setTheme(theme);
// //     this.isThemeOpen = false;
// //   }
// // }
// import {
//   Component,
//   ElementRef,
//   HostListener,
//   OnInit,
//   OnDestroy,
//   AfterViewInit,
//   inject,
//   ChangeDetectorRef,
//   EventEmitter,
//   Output,
//   ViewChild,
// } from "@angular/core";
// import { CommonModule } from "@angular/common";
// import { RouterModule, Router } from "@angular/router";
// import { Observable, map } from "rxjs";
// import { Store } from "@ngrx/store";
// import { WishlistService } from "../../../wishlist/wishlist.service";
// import { ProductSuggestComponent } from "../product-suggest/product-suggest.component";
// import { PickupDeliveryComponent } from "../pickup-delivery/pickup-delivery.component";
// import { selectCartCount } from "../../models/cart/cart.selectors";
// import { DrawerComponent } from "../drawer/drawer.component";
// import { DrawerState } from "../drawer/drawer-state";
// import { DrawerService } from "../drawer/drawer.service";
// import { CartComponent } from "../../../cart/cart.component";
// import {
//   ThemeService,
//   AppTheme,
//   ThemeMeta,
// } from "../../../core/services/theme.service";
// import { FormsModule } from "@angular/forms";
// import { AuthService } from "../../../core/auth/auth.service";
// import { SellerService } from "../../services/SellerService";
// import { BASE_URL, host } from "../../utils/constant";
// import { MobileMenuService } from "../../services/mobile-menu.service";
// import { ProductService } from "../../services/product.service copy";
// import { UserMenuComponent } from "./user-menu/user-menu.component";

// @Component({
//   selector: "app-header",
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     ProductSuggestComponent,
//     PickupDeliveryComponent,
//     FormsModule,
//     DrawerComponent,
//     CartComponent,
//     UserMenuComponent,
//   ],
//   templateUrl: "./header.component.html",
//   styleUrls: ["./header.component.scss"],
// })
// export class HeaderComponent implements OnInit, OnDestroy, AfterViewInit {
//   // ── Theme ──────────────────────────────────────────────────────────────────

//   private themeService: ThemeService = inject(ThemeService);
//   private productService = inject(ProductService);

//   @ViewChild("trackOrderContainer")
//   trackOrderContainer?: ElementRef<HTMLElement>;
//   @Output() orderPlaced = new EventEmitter<string>();

//   /** Auto-focus the input when the track panel opens */
//   @ViewChild("trackInputEl") trackInputEl?: ElementRef<HTMLInputElement>;

//   get themes(): ThemeMeta[] {
//     return this.themeService.themes;
//   }

//   get activeTheme(): AppTheme {
//     return this.themeService.activeTheme;
//   }

//   // ── Drawer ─────────────────────────────────────────────────────────────────
//   DrawerState = DrawerState;
//   drawerState: DrawerState = DrawerState.Hidden;
//   drawerTitle = "Cart";
//   drawerContent: "cart" | "checkout" = "cart";
//   trackedRefNo: string | null = null;

//   showTrackInput = false;
//   refNo = "";

//   // Search UI state
//   searchOpen = false;

//   private store = inject(Store);
//   cartCount$: Observable<number> = this.store.select(selectCartCount);

//   //isUserMenuOpen = false;
//   isCheckout = false;
//   isCheckoutPage = false;
//   checkoutComponent: any | null = null;

//   wishlistCount$?: Observable<number>;
//   userName: string | null = null;

//   isOrderPlaced = false;

//   private auth = inject(AuthService);

//   readonly user = this.auth.user;
//   readonly isLoggedIn = this.auth.isLoggedIn;

//   // ── Mobile hamburger (opens the sidebar owned by <app-navbar>) ─────────────
//   private mobileMenu = inject(MobileMenuService);

//   get isMobileMenuOpen(): boolean {
//     return this.mobileMenu.isOpen;
//   }

//   toggleMobileMenu(): void {
//     this.mobileMenu.toggle();
//   }

//   private _subs: any[] = [];

//   constructor(
//     private hostRef: ElementRef<HTMLElement>,
//     public router: Router,
//     private wishlist: WishlistService,
//     private sellerService: SellerService,
//     private cdr: ChangeDetectorRef,
//     private drawer: DrawerService,
//   ) {}

//   goToWishlist(): void {
//     this.router.navigate(["/wishlist"]);
//   }

//   openCheckoutInDrawer(): void {
//     this.drawer.openCheckout();
//   }

//   onDrawerBack(): void {
//     this.drawer.openCart();
//   }
//   buildImg(): string {
//     const url = `${host}/${this.sellerService.getProfileImgPath()}`;
//     // console.log("url : ", url);
//     return `${host}/${this.sellerService.getProfileImgPath()}`;
//   }

//   ngOnInit(): void {
//     this.wishlistCount$ = this.wishlist.ids$.pipe(
//       map((ids) => (ids || []).length),
//     );

//     this.userName = "arivazhagan selvaraj";

//     this.router.events.subscribe(() => {
//       this.isCheckoutPage = this.router.url.startsWith("/checkout");
//     });
//   }

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

//     // Add this here
//     this._subs.push(
//       this.drawer.orderPlacedChanges.subscribe(
//         (value) => (this.isOrderPlaced = value),
//       ),
//     );
//   }

//   ngOnDestroy(): void {
//     this._subs.forEach((s) => s.unsubscribe?.());
//   }

//   @HostListener("document:click", ["$event"])
//   onDocumentClick(event: MouseEvent): void {
//     const target = event.target as Node | null;

//     // Close theme picker
//     if (target && !this.hostRef.nativeElement.contains(target)) {
//       this.isThemeOpen = false;
//     }

//     // Close Track Order input
//     if (
//       this.showTrackInput &&
//       target &&
//       this.trackOrderContainer &&
//       !this.trackOrderContainer.nativeElement.contains(target)
//     ) {
//       this.showTrackInput = false;
//       this.refNo = "";
//     }
//   }

//   @HostListener("document:focusin", ["$event"])
//   onDocumentFocusIn(): void {
//     const active = document.activeElement as Node | null;
//     if (active && !this.hostRef.nativeElement.contains(active)) {
//       this.isThemeOpen = false;
//     }
//   }

//   @HostListener("document:keydown.escape")
//   onEscape(): void {
//     this.isThemeOpen = false;
//   }

//   closeDrawer(): void {
//     this.drawer.close();
//   }

//   openDrawer(): void {
//     this.drawer.openCart();
//   }

//   onDrawerChange(state: DrawerState): void {
//     this.drawer.setState(state);
//   }

//   // My Orders / Profile / Logout have moved to <app-navbar>'s mobile side
//   // menu — the avatar dropdown (<app-user-menu>) that used to trigger them
//   // from here has been retired (see header.component.html).

//   openCartDrawer(): void {
//     this.drawer.openCart();
//   }

//   // ── Track My Order ─────────────────────────────────────────────────────────

//   toggleTrackInput(): void {
//     this.showTrackInput = !this.showTrackInput;
//     if (this.showTrackInput) {
//       // Defer one tick so *ngIf renders the input before we focus it
//       setTimeout(() => this.trackInputEl?.nativeElement.focus(), 0);
//     } else {
//       this.refNo = "";
//     }
//   }

//   toggleSearch(): void {
//     this.searchOpen = !this.searchOpen;
//   }

//   /**
//    * Navigate to the order-detail page.
//    *
//    * Route: /track-order/:refNo
//    *
//    * The order-detail component reads the param and calls
//    * OrderService.getOrderByRefFromJson(refNo) to look up the local JSON.
//    */
//   trackOrder(): void {
//     const ref = this.refNo?.trim();
//     if (!ref) return;

//     this.showTrackInput = false;
//     this.refNo = "";

//     // ── Router navigation — main content area, NOT a drawer/modal ──
//     this.router.navigate(["/track-order", ref]);
//   }

//   // ── Dark mode ──────────────────────────────────────────────────────────────

//   get isDark(): boolean {
//     return this.themeService.isDark;
//   }

//   toggleDarkMode(): void {
//     this.themeService.toggleDarkMode();
//   }

//   // ── Theme picker ───────────────────────────────────────────────────────────

//   isThemeOpen = false;

//   get activeDotColor(): string {
//     return (
//       this.themes.find((t) => t.id === this.activeTheme)?.dotColor ?? "#888"
//     );
//   }

//   toggleThemePicker(event: MouseEvent): void {
//     event.stopPropagation();
//     this.isThemeOpen = !this.isThemeOpen;
//   }

//   setTheme(theme: AppTheme): void {
//     this.themeService.setTheme(theme);
//     this.isThemeOpen = false;
//   }

//   get userInitial(): string {
//     const u: any = this.user();
//     const name: string = (u?.name ?? u?.firstName ?? u?.username ?? "")
//       .toString()
//       .trim();
//     return name ? name.charAt(0).toUpperCase() : "U";
//   }
//   /**
//    * Navigation itself is handled by `routerLink="/"` on the anchor — the same
//    * mechanism <app-navbar> uses for HOME/DEALS/NEW ARRIVALS — so only the
//    * <router-outlet> content changes. This handler only does the side effects.
//    */
//   onLogoClick(): void {
//     if (this.mobileMenu.isOpen) {
//       this.mobileMenu.close();
//     }

//     const isDefaultHomeView =
//       !this.productService.Deals && !this.productService.NewArrival;

//     if (isDefaultHomeView) {
//       return; // plain home — routerLink alone is enough
//     }

//     this.productService.Deals = false;
//     this.productService.NewArrival = false;
//     this.productService.triggerRefresh();
//   }
//   logout(): void {
//     this.auth.logout();
//     this.router.navigate(["/login"]);
//   }

//   onMyOrders(): void {
//     this.router.navigate(["/order-history"]).catch(() => {});
//   }

//   onProfile(): void {
//     this.router.navigate(["/profile"]).catch(() => {});
//   }

//   onLogout(): void {
//     try {
//       this.auth.logout();
//     } catch {}

//     this.router.navigate(["/login"]).catch(() => {});
//   }
// }
import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  OnDestroy,
  AfterViewInit,
  inject,
  ChangeDetectorRef,
  EventEmitter,
  Output,
  ViewChild,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Router, NavigationEnd } from "@angular/router";
import { Observable, Subscription, filter, map } from "rxjs";
import { Store } from "@ngrx/store";
import { WishlistService } from "../../../wishlist/wishlist.service";
import { ProductSuggestComponent } from "../product-suggest/product-suggest.component";
import { PickupDeliveryComponent } from "../pickup-delivery/pickup-delivery.component";
import { selectCartCount } from "../../models/cart/cart.selectors";
import { DrawerComponent } from "../drawer/drawer.component";
import { DrawerState } from "../drawer/drawer-state";
import { DrawerService } from "../drawer/drawer.service";
import { CartComponent } from "../../../cart/cart.component";
import {
  ThemeService,
  AppTheme,
  ThemeMeta,
} from "../../../core/services/theme.service";
import { FormsModule } from "@angular/forms";
import { AuthService } from "../../../core/auth/auth.service";
import { SellerService } from "../../services/SellerService";
import { host } from "../../utils/constant";
import { MobileMenuService } from "../../services/mobile-menu.service";
// NOTE: must be the SAME file product-suggest imports, otherwise the two
// components get different service instances. Consider renaming "copy".
import { ProductService } from "../../services/product.service copy";
import { UserMenuComponent } from "./user-menu/user-menu.component";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ProductSuggestComponent,
    PickupDeliveryComponent,
    FormsModule,
    DrawerComponent,
    CartComponent,
    UserMenuComponent,
  ],
  templateUrl: "./header.component.html",
  styleUrls: ["./header.component.scss"],
})
export class HeaderComponent implements OnInit, OnDestroy, AfterViewInit {
  // ── Theme ──────────────────────────────────────────────────────────────────

  private themeService: ThemeService = inject(ThemeService);
  private productService = inject(ProductService);

  @ViewChild("trackOrderContainer")
  trackOrderContainer?: ElementRef<HTMLElement>;
  @Output() orderPlaced = new EventEmitter<string>();

  /** Auto-focus the input when the track panel opens */
  @ViewChild("trackInputEl") trackInputEl?: ElementRef<HTMLInputElement>;

  /** The search component rendered inside the header while searchOpen = true */
  @ViewChild(ProductSuggestComponent) suggest?: ProductSuggestComponent;

  get themes(): ThemeMeta[] {
    return this.themeService.themes;
  }

  get activeTheme(): AppTheme {
    return this.themeService.activeTheme;
  }

  // ── Drawer ─────────────────────────────────────────────────────────────────
  DrawerState = DrawerState;
  drawerState: DrawerState = DrawerState.Hidden;
  drawerTitle = "Cart";
  drawerContent: "cart" | "checkout" = "cart";
  trackedRefNo: string | null = null;

  showTrackInput = false;
  refNo = "";

  // Search UI state
  searchOpen = false;

  private store = inject(Store);
  cartCount$: Observable<number> = this.store.select(selectCartCount);

  isCheckout = false;
  isCheckoutPage = false;
  checkoutComponent: any | null = null;

  wishlistCount$?: Observable<number>;
  userName: string | null = null;

  isOrderPlaced = false;

  private auth = inject(AuthService);

  readonly user = this.auth.user;
  readonly isLoggedIn = this.auth.isLoggedIn;

  // ── Mobile hamburger (opens the sidebar owned by <app-navbar>) ─────────────
  private mobileMenu = inject(MobileMenuService);

  get isMobileMenuOpen(): boolean {
    return this.mobileMenu.isOpen;
  }

  toggleMobileMenu(): void {
    this.mobileMenu.toggle();
  }

  private _subs: Subscription[] = [];

  constructor(
    private hostRef: ElementRef<HTMLElement>,
    public router: Router,
    private wishlist: WishlistService,
    private sellerService: SellerService,
    private cdr: ChangeDetectorRef,
    private drawer: DrawerService,
  ) {}

  goToWishlist(): void {
    this.router.navigate(["/wishlist"]);
  }

  openCheckoutInDrawer(): void {
    this.drawer.openCheckout();
  }

  onDrawerBack(): void {
    this.drawer.openCart();
  }

  buildImg(): string {
    return `${host}/${this.sellerService.getProfileImgPath()}`;
  }

  ngOnInit(): void {
    this.wishlistCount$ = this.wishlist.ids$.pipe(
      map((ids) => (ids || []).length),
    );

    this.userName = "arivazhagan selvaraj";

    // FIX: only react to completed navigations, and unsubscribe on destroy
    // (the old code leaked this subscription).
    this._subs.push(
      this.router.events
        .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
        .subscribe(() => {
          this.isCheckoutPage = this.router.url.startsWith("/checkout");
          // Collapse the search bar once a search / suggestion navigated away.
          this.searchOpen = false;
        }),
    );
  }

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

    this._subs.push(
      this.drawer.orderPlacedChanges.subscribe(
        (value) => (this.isOrderPlaced = value),
      ),
    );
  }

  ngOnDestroy(): void {
    this._subs.forEach((s) => s.unsubscribe?.());
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node | null;

    // Close theme picker
    if (target && !this.hostRef.nativeElement.contains(target)) {
      this.isThemeOpen = false;
    }

    // Close Track Order input
    if (
      this.showTrackInput &&
      target &&
      this.trackOrderContainer &&
      !this.trackOrderContainer.nativeElement.contains(target)
    ) {
      this.showTrackInput = false;
      this.refNo = "";
    }
  }

  @HostListener("document:focusin", ["$event"])
  onDocumentFocusIn(): void {
    const active = document.activeElement as Node | null;
    if (active && !this.hostRef.nativeElement.contains(active)) {
      this.isThemeOpen = false;
    }
  }

  @HostListener("document:keydown.escape")
  onEscape(): void {
    this.isThemeOpen = false;
    this.closeSearch();
  }

  closeDrawer(): void {
    this.drawer.close();
  }

  openDrawer(): void {
    this.drawer.openCart();
  }

  onDrawerChange(state: DrawerState): void {
    this.drawer.setState(state);
  }

  openCartDrawer(): void {
    this.drawer.openCart();
  }

  // ── Track My Order ─────────────────────────────────────────────────────────

  toggleTrackInput(): void {
    this.showTrackInput = !this.showTrackInput;
    if (this.showTrackInput) {
      // Defer one tick so *ngIf renders the input before we focus it
      setTimeout(() => this.trackInputEl?.nativeElement.focus(), 0);
    } else {
      this.refNo = "";
    }
  }

  trackOrder(): void {
    const ref = this.refNo?.trim();
    if (!ref) return;

    this.showTrackInput = false;
    this.refNo = "";

    // Router navigation — main content area, NOT a drawer/modal
    this.router.navigate(["/track-order", ref]);
  }

  // ── Search ─────────────────────────────────────────────────────────────────

  toggleSearch(): void {
    this.searchOpen ? this.closeSearch() : this.openSearch();
  }

  openSearch(): void {
    this.searchOpen = true;
    // The <app-product-suggest> only exists after *ngIf renders, so focus
    // its input on the next tick.
    setTimeout(() => this.suggest?.desktopSearch?.nativeElement.focus(), 0);
  }

  closeSearch(): void {
    if (!this.searchOpen) return;
    this.searchOpen = false;
  }

  // ── Dark mode ──────────────────────────────────────────────────────────────

  get isDark(): boolean {
    return this.themeService.isDark;
  }

  toggleDarkMode(): void {
    this.themeService.toggleDarkMode();
  }

  // ── Theme picker ───────────────────────────────────────────────────────────

  isThemeOpen = false;

  get activeDotColor(): string {
    return (
      this.themes.find((t) => t.id === this.activeTheme)?.dotColor ?? "#888"
    );
  }

  toggleThemePicker(event: MouseEvent): void {
    event.stopPropagation();
    this.isThemeOpen = !this.isThemeOpen;
  }

  setTheme(theme: AppTheme): void {
    this.themeService.setTheme(theme);
    this.isThemeOpen = false;
  }

  get userInitial(): string {
    const u: any = this.user();
    const name: string = (u?.name ?? u?.firstName ?? u?.username ?? "")
      .toString()
      .trim();
    return name ? name.charAt(0).toUpperCase() : "U";
  }

  /**
   * Navigation itself is handled by `routerLink="/"` on the anchor — the same
   * mechanism <app-navbar> uses for HOME/DEALS/NEW ARRIVALS — so only the
   * <router-outlet> content changes. This handler only does the side effects.
   */
  onLogoClick(): void {
    if (this.mobileMenu.isOpen) {
      this.mobileMenu.close();
    }

    const isDefaultHomeView =
      !this.productService.Deals && !this.productService.NewArrival;

    if (isDefaultHomeView) {
      return; // plain home — routerLink alone is enough
    }

    this.productService.Deals = false;
    this.productService.NewArrival = false;
    this.productService.triggerRefresh();
  }

  onMyOrders(): void {
    this.router.navigate(["/order-history"]).catch(() => {});
  }

  onProfile(): void {
    this.router.navigate(["/profile"]).catch(() => {});
  }

  onLogout(): void {
    try {
      this.auth.logout();
    } catch {}

    this.router.navigate(["/login"]).catch(() => {});
  }
}
