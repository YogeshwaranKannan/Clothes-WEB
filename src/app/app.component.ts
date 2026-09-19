import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterOutlet, NavigationEnd } from "@angular/router";
import { Subject, takeUntil, filter } from "rxjs";
import { HeaderComponent } from "./common/components/header/header.component";
import { NavbarComponent } from "./common/components/navbar/navbar.component";
import { TickerComponent } from "./common/components/ticker/ticker.component";
import { Category } from "./common/models/category.model";
// import { CategoryService } from "./common/services/category.service";
import { CategoryService } from "./common/services/category.service copy";
import { ThemeService } from "./core/services/theme.service";
import { HeroBannerComponent } from "./landing/hero-banner/hero-banner.component";
import { SellerService } from "./common/services/SellerService";
// ✅ Import ProductService so we can fire triggerRefresh() after seller loads
import { ProductService } from "./common/services/product.service copy";

// ProductSuggest now loads products itself

@Component({
  selector: "app-root",
  imports: [
    // ✅ FIX: CommonModule provides *ngIf, *ngFor, etc. for THIS component's
    // own template. Without it, Angular throws NG0303 on *ngIf in
    // app.component.html — which is why the hero-banner/ticker block never
    // rendered at all (it errored out before NavigationEnd logic even ran).
    CommonModule,
    RouterOutlet,
    HeaderComponent,
    TickerComponent,
    HeroBannerComponent,
    NavbarComponent,
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent implements OnInit, OnDestroy {
  title = "AngularWebUI";
  categories: Category[] = [];

  /**
   * True only when the current route is the home page ('/').
   * Drives *ngIf on <app-hero-banner> and <app-ticker> in the template so
   * those components render only on Home and are hidden on every other route
   * (product list, category, product detail, etc.).
   *
   * Initialised synchronously from router.url (not just a hardcoded `true`)
   * so the very first render is correct even if NavigationEnd hasn't fired
   * yet for this tick.
   */
  isHomePage = true;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private categoryService: CategoryService,
    private theme: ThemeService,
    private sellerService: SellerService,
    private productService: ProductService,
    // ✅ Injected to listen for route changes
    private router: Router,
  ) {
    // ✅ Synchronous initial check — covers the very first render before
    // any NavigationEnd event has had a chance to fire.
    this.isHomePage = this.computeIsHomePage(this.router.url);
  }

  /**
   * Returns true if the given url (with or without query string / fragment)
   * resolves to the home route.
   */
  private computeIsHomePage(url: string): boolean {
    // Strip query string and fragment before comparing, e.g. "/?ref=ad" → "/"
    const path = url.split("?")[0].split("#")[0];
    return path === "/" || path === "";
  }

  ngOnInit(): void {
    // ✅ Initialize theme
    try {
      this.theme.initAppTheme();
    } catch (e) {
      console.warn("Theme initialization failed", e);
    }

    // ✅ Track route changes to decide whether Home-only sections should render.
    // NavigationEnd fires once per completed navigation (not on every router
    // event), so this is cheap and runs only when the URL actually changes.
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe((event) => {
        this.isHomePage = this.computeIsHomePage(event.urlAfterRedirects);
      });

    // ✅ Restore seller if available in localStorage
    this.sellerService.restoreSellerFromStorage();

    this.sellerService
      .loadSellerDetails()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          console.log("Seller loaded:", res);

          // ✅ AFTER seller loaded — load categories then signal all components
          this.loadInitialData();
        },

        error: (err) => {
          console.error("Failed to load seller", err);
        },
      });
  }

  // ✅ Load APIs dependent on sellerId
  loadInitialData(): void {
    this.categoryService
      .getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cats) => {
          this.categories = cats || [];

          // ✅ Fire refresh AFTER categories are loaded so categories.component
          //    (and any other subscriber) gets the signal when seller + category
          //    data is available — fixes first-load blank screen.
          this.productService.triggerRefresh();
        },

        error: (err) => {
          console.error("Failed to load categories", err);
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
