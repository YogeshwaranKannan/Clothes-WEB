import { inject, Injectable } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { BehaviorSubject } from "rxjs";
import { filter } from "rxjs/operators";

/**
 * Coordinates the mobile "collapse app-product-suggest behind an icon"
 * behavior between two components that don't share a parent/child
 * relationship:
 *   - NavbarComponent (src/app/common/components/navbar) — owns the
 *     actual <app-product-suggest>, reads isOpen$/isActive$ to decide
 *     whether to render it, and closes it on an outside click.
 *   - ProductComponent (src/app/product) — owns the new search icon,
 *     calls show() when it's tapped.
 *
 * ── Why this version is route-driven, not component-driven ─────────────
 * The previous version relied on ProductComponent calling activate() in
 * ngOnInit() / deactivate() in ngOnDestroy(). That's inherently racy:
 * NavbarComponent is a singleton at the app root and renders independently
 * of — and typically BEFORE — a routed component like ProductComponent,
 * especially if that route is lazy-loaded (there's a real async delay
 * fetching the chunk before ngOnInit() ever runs). During that window,
 * isActive was still false, so the search bar rendered visible before
 * snapping shut a moment later — which is exactly the bug reported.
 *
 * This version removes that race entirely: `isActive` is derived directly
 * from Router.url the instant the service is constructed (synchronously
 * available at app bootstrap, no component lifecycle involved), and kept
 * in sync via router.events. ProductComponent no longer needs to call
 * activate()/deactivate() at all — only show() when its icon is tapped.
 * ─────────────────────────────────────────────────────────────────────
 */
@Injectable({ providedIn: "root" })
export class MobileSearchToggleService {
  private router = inject(Router);

  // ⚠️ Update this to match your actual product-page route path exactly
  // (e.g. "/products" if that's your real route). Matched as a prefix, so
  // "/product/123" and "/product/123/reviews" both count.
  private readonly PRODUCT_ROUTE_PREFIX = "/product";

  private readonly _isOpen$ = new BehaviorSubject<boolean>(false);
  readonly isOpen$ = this._isOpen$.asObservable();

  // Computed synchronously from the CURRENT url right now — this is what
  // guarantees correctness on the very first render, including a hard
  // refresh landing directly on the product page.
  private readonly _isActive$ = new BehaviorSubject<boolean>(
    this.computeIsActive(this.router.url),
  );
  readonly isActive$ = this._isActive$.asObservable();

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this._isActive$.next(this.computeIsActive(e.urlAfterRedirects));
        // Always land collapsed (icon visible, search hidden) the moment
        // we arrive on — or leave — the product page.
        this._isOpen$.next(false);
      });
  }

  private computeIsActive(url: string): boolean {
    const path = url.split("?")[0].split("#")[0];
    return path.startsWith(this.PRODUCT_ROUTE_PREFIX);
  }

  get isOpen(): boolean {
    return this._isOpen$.value;
  }

  get isActive(): boolean {
    return this._isActive$.value;
  }

  show(): void {
    this._isOpen$.next(true);
  }

  hide(): void {
    this._isOpen$.next(false);
  }
}
