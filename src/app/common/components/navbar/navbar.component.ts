// import { CommonModule } from "@angular/common";
// import {
//   Component,
//   HostListener,
//   inject,
//   Input,
//   OnChanges,
//   OnDestroy,
//   OnInit,
//   SimpleChanges,
// } from "@angular/core";
// import {
//   NavigationEnd,
//   Router,
//   RouterLink,
//   RouterLinkActive,
// } from "@angular/router";

// // ✅ Both Category and CategoryNavState come from the shared model file.
// //    navbar no longer owns the type — product-list imports from the same place.
// import { Category, CategoryNavState } from "../../models/category.model";
// import { ProductSuggestComponent } from "../product-suggest/product-suggest.component";
// import { ProductService } from "../../services/product.service copy";
// import { filter } from "rxjs/operators";
// import { Subject, takeUntil } from "rxjs";
// // ✅ Sidebar open/close state is now shared with <app-header>, which owns the
// //    mobile-only trigger button. Navbar still owns the offcanvas markup and
// //    the category logic; it just no longer owns the boolean by itself.
// import { MobileMenuService } from "../../services/mobile-menu.service";

// @Component({
//   selector: "app-navbar",
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterLink,
//     RouterLinkActive,
//     ProductSuggestComponent,
//   ],
//   templateUrl: "./navbar.component.html",
//   styleUrls: ["./navbar.component.scss"],
// })
// export class NavbarComponent implements OnChanges, OnInit, OnDestroy {
//   productService = inject(ProductService);
//   private mobileMenu = inject(MobileMenuService);
//   private readonly destroy$ = new Subject<void>();

//   @Input() categories: Category[] = [];

//   // Desktop mega-menu
//   isMegaMenuOpen = false;
//   activeCategoryId: string | null = null;

//   // Mobile sidebar
//   // isSidebarOpen mirrors MobileMenuService.isOpen$ so the existing template
//   // bindings ([class.show], [style.visibility], *ngIf) don't need to change —
//   // it's now driven by the header's hamburger button instead of a local toggle.
//   mobileOpenIds = new Set<string>();
//   isSidebarOpen = false;

//   searchMode: "product" | "order" = "product";

//   constructor(private router: Router) {
//     this.router.events
//       .pipe(filter((event) => event instanceof NavigationEnd))
//       .subscribe(() => {
//         this.updateSearchMode();
//       });

//     this.updateSearchMode();
//   }

//   ngOnInit(): void {
//     this.mobileMenu.isOpen$
//       .pipe(takeUntil(this.destroy$))
//       .subscribe((open) => {
//         this.isSidebarOpen = open;
//         this.toggleBodyScroll();
//         if (!open) {
//           this.mobileOpenIds.clear();
//         }
//       });
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   private updateSearchMode(): void {
//     const url = this.router.url;

//     if (url.startsWith("/order-history")) {
//       this.searchMode = "order";
//     } else {
//       this.searchMode = "product";
//     }
//   }

//   // ── Lifecycle ─────────────────────────────────────────────────────────────

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes["categories"] && this.categories?.length) {
//       this.activeCategoryId = this.categories[0].id;
//     }
//   }

//   // ── Desktop mega-menu helpers ─────────────────────────────────────────────

//   get activeCategory(): Category | undefined {
//     return this.categories?.find((c) => c.id === this.activeCategoryId);
//   }

//   setActiveCategory(cat: Category): void {
//     this.activeCategoryId = cat.id;
//   }

//   openMegaMenu(): void {
//     this.isMegaMenuOpen = true;
//     if (!this.activeCategoryId && this.categories?.length) {
//       this.activeCategoryId = this.categories[0].id;
//     }
//   }
//   onHomeClick(): void {
//     console.log("Click Home");
//     this.closeSidebar();

//     this.productService.Deals = false;
//     this.productService.NewArrival = false;
//     this.productService.triggerRefresh();
//   }
//   onDealsClick(): void {
//     console.log("Click deals");
//     this.closeSidebar();

//     this.productService.Deals = true;
//     this.productService.NewArrival = false;
//     this.productService.triggerRefresh();
//   }

//   onNewArrivalsClick(): void {
//     console.log("Click new arrivals");
//     this.closeSidebar();

//     this.productService.Deals = false;
//     this.productService.NewArrival = true;

//     this.productService.triggerRefresh();
//   }

//   closeMegaMenu(): void {
//     this.isMegaMenuOpen = false;
//   }

//   // ── Navigation ────────────────────────────────────────────────────────────

//   /**
//    * "All Categories" static button clicked.
//    * Navigates to /category/ALL with category: null in state so product-list
//    * knows to load every product with no category filter applied.
//    */
//   navigateAll(): void {
//     this.closeMegaMenu();
//     this.router.navigate(["/category", "ALL"], { state: { category: null } });
//     console.log("nav >> ALL categories");
//   }

//   /**
//    * Top-level parent category clicked.
//    * parentCategory is always null — the clicked item IS the root.
//    */
//   navigateCategory(cat: Category): void {
//     this.closeMegaMenu();

//     const state: CategoryNavState = {
//       id: cat.id,
//       category: cat.category,
//       parentCategory: null,

//       children: cat.children ?? [],
//     };

//     this.router.navigate(["/category", cat.id], { state: { category: state } });
//     console.log("nav >> parent:", state);
//   }

//   /**
//    * Child sub-category clicked.
//    * Finds the parent from the categories tree, then builds an immutable
//    * CategoryNavState that includes both child and parent details.
//    * Original Category objects are never mutated.
//    */
//   navigateChild(child: Category): void {
//     const parent = this.getParentCategory(child);

//     const state: CategoryNavState = {
//       id: child.id,
//       category: child.category,
//       parentCategory: parent
//         ? { id: parent.id, category: parent.category, parentCategory: null }
//         : null,
//     };

//     this.router.navigate(["/category", child.id], {
//       state: { category: state },
//     });
//     console.log("nav >> child:", state);
//   }

//   // ── Tree helper ───────────────────────────────────────────────────────────

//   /**
//    * Finds the direct parent of `child` by scanning the top-level
//    * categories tree (one level deep — matches the current data shape).
//    *
//    * Returns null if `child` is itself top-level or not found.
//    */
//   getParentCategory(child: Category): Category | null {
//     if (!this.categories?.length) return null;

//     for (const parent of this.categories) {
//       if (!parent.children?.length) continue;
//       if (parent.children.some((c) => c.id === child.id)) return parent;
//     }

//     return null;
//   }

//   // ── Mobile sidebar helpers ────────────────────────────────────────────────

//   isMobileOpen(categoryId: string): boolean {
//     return this.mobileOpenIds.has(categoryId);
//   }

//   /**
//    * Mobile category row tap handler.
//    * • Category has children  → toggle accordion (expand / collapse)
//    * • Category has no children → navigate directly and close the sidebar
//    */
//   onMobileCategoryRowClick(cat: Category, event: Event): void {
//     if (cat.children?.length) {
//       // Has sub-categories — toggle the accordion, do not navigate
//       this.toggleMobileCategory(cat, event);
//     } else {
//       // Leaf category — navigate and close the sidebar
//       this.navigateCategory(cat);
//       this.onMobileMenuItemClick();
//     }
//   }

//   toggleMobileCategory(cat: Category, event: Event): void {
//     event.preventDefault();
//     event.stopPropagation();

//     if (this.mobileOpenIds.has(cat.id)) {
//       this.mobileOpenIds.delete(cat.id);
//     } else {
//       this.mobileOpenIds.add(cat.id);
//     }
//     this.mobileOpenIds = new Set(this.mobileOpenIds);
//   }

//   /**
//    * Kept for any remaining internal callers — delegates to the shared
//    * service so header and navbar never disagree on open/close state.
//    */
//   toggleSidebar(): void {
//     this.mobileMenu.toggle();
//   }

//   closeSidebar(): void {
//     this.mobileMenu.close();
//   }

//   onMobileMenuItemClick(): void {
//     this.closeSidebar();
//   }

//   private toggleBodyScroll(): void {
//     document.body.style.overflow = this.isSidebarOpen ? "hidden" : "";
//   }

//   trackById(_: number, item: Category): string {
//     return item.id;
//   }

//   // ── Global key listeners ──────────────────────────────────────────────────

//   @HostListener("document:keydown.escape")
//   onEscapeKey(): void {
//     if (this.isSidebarOpen) this.closeSidebar();
//     if (this.isMegaMenuOpen) this.closeMegaMenu();
//   }
// }
import { CommonModule } from "@angular/common";
import {
  Component,
  ElementRef,
  HostListener,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from "@angular/router";

import { Category, CategoryNavState } from "../../models/category.model";
import { ProductSuggestComponent } from "../product-suggest/product-suggest.component";
import { ProductService } from "../../services/product.service copy";
import { filter, map } from "rxjs/operators";
import { combineLatest, Observable, Subject, takeUntil } from "rxjs";
import { MobileMenuService } from "../../services/mobile-menu.service";
import { FormsModule } from "@angular/forms";
// ✅ Coordinates collapsing <app-product-suggest> behind an icon on the
//    Product page (mobile only). See the service file for the full design
//    note on why this is inert on every other page.
import { MobileSearchToggleService } from "../../services/mobile-search-toggle.service";
import { AuthService } from "../../../core/auth/auth.service";

@Component({
  selector: "app-navbar",
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    ProductSuggestComponent,
    FormsModule,
  ],
  templateUrl: "./navbar.component.html",
  styleUrls: ["./navbar.component.scss"],
})
export class NavbarComponent implements OnChanges, OnInit, OnDestroy {
  productService = inject(ProductService);

  private mobileMenu = inject(MobileMenuService);
  mobileSearchToggle = inject(MobileSearchToggleService);
  private readonly destroy$ = new Subject<void>();

  @Input() categories: Category[] = [];

  // ── Desktop mega menu ────────────────────────────────────────────────────
  isMegaMenuOpen = false;
  activeCategoryId: string | null = null;

  // ── Mobile sidebar ───────────────────────────────────────────────────────
  mobileOpenIds = new Set<string>();
  isSidebarOpen = false;

  // ── Search ────────────────────────────────────────────────────────────────
  searchMode: "product" | "order" = "product";

  // ── Mobile search visibility (Product page only — see service) ──────────
  // true whenever the collapse feature isn't active (every page except
  // Product) OR it IS active but currently expanded — this is what the
  // template binds to, so <app-product-suggest> renders exactly as it
  // always has everywhere except the one page/breakpoint this is scoped to.
  showMobileSearch$: Observable<boolean> = combineLatest([
    this.mobileSearchToggle.isActive$,
    this.mobileSearchToggle.isOpen$,
  ]).pipe(map(([active, open]) => !active || open));

  @ViewChild("mobileSearchWrapper")
  mobileSearchWrapperRef?: ElementRef<HTMLElement>;

  // ── Mobile Track Order ────────────────────────────────────────────────────
  mobileTrackOpen = false;
  mobileTrackRefNo = "";

  constructor(private router: Router) {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        this.updateSearchMode();
      });

    this.updateSearchMode();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.mobileMenu.isOpen$.pipe(takeUntil(this.destroy$)).subscribe((open) => {
      this.isSidebarOpen = open;

      this.toggleBodyScroll();

      // When mobile menu closes, reset mobile state
      if (!open) {
        this.mobileOpenIds.clear();

        this.mobileTrackOpen = false;
        this.mobileTrackRefNo = "";
      }
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes["categories"] && this.categories?.length) {
      this.activeCategoryId = this.categories[0].id;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    document.body.style.overflow = "";
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Search mode
  // ─────────────────────────────────────────────────────────────────────────

  private updateSearchMode(): void {
    const url = this.router.url;

    if (url.startsWith("/order-history")) {
      this.searchMode = "order";
    } else {
      this.searchMode = "product";
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Desktop Mega Menu
  // ─────────────────────────────────────────────────────────────────────────

  get activeCategory(): Category | undefined {
    return this.categories?.find((c) => c.id === this.activeCategoryId);
  }

  setActiveCategory(cat: Category): void {
    this.activeCategoryId = cat.id;
  }

  openMegaMenu(): void {
    this.isMegaMenuOpen = true;

    if (!this.activeCategoryId && this.categories?.length) {
      this.activeCategoryId = this.categories[0].id;
    }
  }

  closeMegaMenu(): void {
    this.isMegaMenuOpen = false;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Home / Deals / New Arrivals
  // ─────────────────────────────────────────────────────────────────────────

  onHomeClick(): void {
    console.log("Click Home");

    this.closeSidebar();

    this.productService.Deals = false;
    this.productService.NewArrival = false;
    this.productService.triggerRefresh();
  }

  onDealsClick(): void {
    console.log("Click deals");

    this.closeSidebar();

    this.productService.Deals = true;
    this.productService.NewArrival = false;
    this.productService.triggerRefresh();
  }

  onNewArrivalsClick(): void {
    console.log("Click new arrivals");

    this.closeSidebar();

    this.productService.Deals = false;
    this.productService.NewArrival = true;
    this.productService.triggerRefresh();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Category Navigation
  // ─────────────────────────────────────────────────────────────────────────

  navigateAll(): void {
    this.closeMegaMenu();

    this.router.navigate(["/category", "ALL"], {
      state: {
        category: null,
      },
    });

    console.log("nav >> ALL categories");
  }

  navigateCategory(cat: Category): void {
    this.closeMegaMenu();

    const state: CategoryNavState = {
      id: cat.id,
      category: cat.category,
      parentCategory: null,
      children: cat.children ?? [],
    };

    this.router.navigate(["/category", cat.id], {
      state: {
        category: state,
      },
    });

    console.log("nav >> parent:", state);
  }

  navigateChild(child: Category): void {
    const parent = this.getParentCategory(child);

    const state: CategoryNavState = {
      id: child.id,
      category: child.category,
      parentCategory: parent
        ? {
            id: parent.id,
            category: parent.category,
            parentCategory: null,
          }
        : null,
    };

    this.router.navigate(["/category", child.id], {
      state: {
        category: state,
      },
    });

    console.log("nav >> child:", state);
  }

  getParentCategory(child: Category): Category | null {
    if (!this.categories?.length) {
      return null;
    }

    for (const parent of this.categories) {
      if (!parent.children?.length) {
        continue;
      }

      if (parent.children.some((c) => c.id === child.id)) {
        return parent;
      }
    }

    return null;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Mobile Categories
  // ─────────────────────────────────────────────────────────────────────────

  isMobileOpen(categoryId: string): boolean {
    return this.mobileOpenIds.has(categoryId);
  }

  onMobileCategoryRowClick(cat: Category, event: Event): void {
    if (cat.children?.length) {
      this.toggleMobileCategory(cat, event);
    } else {
      this.navigateCategory(cat);
      this.onMobileMenuItemClick();
    }
  }

  toggleMobileCategory(cat: Category, event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (this.mobileOpenIds.has(cat.id)) {
      this.mobileOpenIds.delete(cat.id);
    } else {
      this.mobileOpenIds.add(cat.id);
    }

    this.mobileOpenIds = new Set(this.mobileOpenIds);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Mobile Sidebar
  // ─────────────────────────────────────────────────────────────────────────

  toggleSidebar(): void {
    this.mobileMenu.toggle();
  }

  closeSidebar(): void {
    this.mobileMenu.close();
  }

  onMobileMenuItemClick(): void {
    this.closeSidebar();
  }
  onMobileSearchClick(): void {
    this.closeSidebar();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Auth actions (mobile menu footer)
  // ─────────────────────────────────────────────────────────────────────────

  onLoginClick(): void {
    this.closeSidebar();
    this.router.navigate(["/login"]);
  }

  onSignupClick(): void {
    this.closeSidebar();
    this.router.navigate(["/signup"]);
  }

  onLogout(): void {
    this.closeSidebar();
    // TODO: wire up to your actual auth service, e.g.:
    // this.authService.logout();
    this.router.navigate(["/login"]);
  }

  onMyOrders(): void {
    this.closeSidebar();
    this.router.navigate(["/order-history"]);
  }

  onProfile(): void {
    this.closeSidebar();
    this.router.navigate(["/profile"]);
  }

  onAccountCart(): void {
    this.closeSidebar();
    this.router.navigate(["/cart"]);
  }

  private authService = inject(AuthService); // add to the injects at the top

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn(); // or isAuthenticated(), or similar
  }

  private toggleBodyScroll(): void {
    document.body.style.overflow = this.isSidebarOpen ? "hidden" : "";
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MOBILE TRACK ORDER
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Clicking "Track Order" in the mobile menu ONLY opens/closes
   * the input. It does NOT navigate anywhere.
   */
  toggleMobileTrackOrder(): void {
    this.mobileTrackOpen = !this.mobileTrackOpen;

    if (!this.mobileTrackOpen) {
      this.mobileTrackRefNo = "";
    }
  }

  /**
   * Search button / Enter key.
   *
   * This is the ONLY place where mobile Track Order navigates.
   */
  trackOrderMobile(): void {
    const ref = this.mobileTrackRefNo?.trim();

    if (!ref) {
      return;
    }

    this.mobileTrackOpen = false;
    this.mobileTrackRefNo = "";

    this.router.navigate(["/track-order", ref]);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  trackById(_: number, item: Category): string {
    return item.id;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Escape
  // ─────────────────────────────────────────────────────────────────────────

  @HostListener("document:keydown.escape")
  onEscapeKey(): void {
    if (this.isSidebarOpen) {
      this.closeSidebar();
    }

    if (this.isMegaMenuOpen) {
      this.closeMegaMenu();
    }

    if (this.mobileTrackOpen) {
      this.mobileTrackOpen = false;
      this.mobileTrackRefNo = "";
    }

    if (this.mobileSearchToggle.isActive && this.mobileSearchToggle.isOpen) {
      this.mobileSearchToggle.hide();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Mobile search collapse (Product page only) — outside click
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Guarded by isActive, so this is a complete no-op on every page except
   * Product — mobileSearchToggle.isActive is only ever true while
   * ProductComponent is mounted (see the service for details). Also
   * guarded by isOpen so this never runs on the click that OPENS it —
   * ProductComponent's icon calls event.stopPropagation() on that click
   * anyway (so this wouldn't fire for it regardless), this isOpen check is
   * just a second, cheap safety net.
   */
  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent): void {
    if (!this.mobileSearchToggle.isActive || !this.mobileSearchToggle.isOpen) {
      return;
    }

    const target = event.target as Node | null;
    const wrapperEl = this.mobileSearchWrapperRef?.nativeElement;

    if (target && wrapperEl && !wrapperEl.contains(target)) {
      this.mobileSearchToggle.hide();
    }
  }
}
