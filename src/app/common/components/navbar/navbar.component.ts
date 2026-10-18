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

  get userFullName(): string {
    const u: any = this.authService.user();
    const full =
      u?.name ??
      u?.fullName ??
      [u?.firstName, u?.lastName].filter(Boolean).join(" ");
    return (full ?? "").toString().trim() || "Guest";
  }

  get availableRewards(): number {
    // same source the order summary uses: auth.user()?.availableRewards
    return this.authService.user()?.availableRewards ?? 0;
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

  /**
   * Parent category clicked — used by BOTH desktop (mega-menu row) and
   * mobile (accordion label). Always navigates and carries the parent's
   * children in state.category.children, so the receiving page can build
   * the full [parentId, ...childIds] list for the API call.
   */
  navigateCategory(cat: Category): void {
    this.closeMegaMenu();

    const state: CategoryNavState = {
      id: cat.id,
      category: cat.category,
      parentCategory: null,
      children: cat.children ?? [],
    };

    console.log("State :", state);
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

  // ❌ onMobileCategoryRowClick removed — it used to swallow navigation
  // whenever a category had children. The template now binds the label
  // and the chevron to separate handlers:
  //   • label   → (click)="navigateCategory(cat); onMobileMenuItemClick()"
  //   • chevron → (click)="toggleMobileCategory(cat, $event)"
  // so navigation and expand/collapse are independent, matching sub-category
  // behavior (navigateChild).

  /**
   * Chevron tap only — expands/collapses the sub-list. Never navigates.
   * stopPropagation prevents the click from also triggering the label's
   * navigateCategory handler above it.
   */
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

    this.authService.logout(); // ← actually clears the session

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

  trackOrderMobile(): void {
    const ref = this.mobileTrackRefNo?.trim();

    if (!ref) {
      return;
    }

    this.mobileTrackOpen = false;
    this.mobileTrackRefNo = "";

    this.closeSidebar(); // ← closes the mobile menu
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
