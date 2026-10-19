import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  Renderer2,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { AuthUser } from "../../../../core/auth/auth.service";
import { Store } from "@ngrx/store";
import * as CartActions from "../../../../common/models/cart/cart.actions";

@Component({
  selector: "app-user-menu",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./user-menu.component.html",
  styleUrls: ["./user-menu.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenuComponent implements AfterViewInit, OnDestroy {
  @Input() showProfile = true;
  @Input() userName?: string | null = null;
  @Input() user?: AuthUser | null = null;

  @Output() orders = new EventEmitter<void>();
  @Output() profile = new EventEmitter<void>();
  @Output() openCartRequested = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  @ViewChild("avatarBtn", { read: ElementRef })
  avatarBtn?: ElementRef<HTMLButtonElement>;
  @ViewChild("menu", { read: ElementRef }) menu?: ElementRef<HTMLElement>;

  @Input() showInventory = false; // true only for seller accounts
  @Output() inventory = new EventEmitter<void>();

  onInventory() {
    this.inventory.emit();
    this.closeMenu();
  }

  open = false;
  menuId = `user-menu-${Math.random().toString(36).slice(2, 9)}`;

  // explicit numeric positioning (viewport coordinates)
  menuTop = 0;
  menuLeft = 0;
  menuWidth = 220;

  // guard to avoid immediate click-outside when opening
  private justOpened = false;

  private menuItems: HTMLElement[] = [];
  private focusedIndex = 0;

  // computed position
  menuStyles: { top?: string; left?: string; minWidth?: string } = {};

  constructor(
    private host: ElementRef,
    private renderer: Renderer2,
    private cdr: ChangeDetectorRef,
  ) {}

  private store = inject(Store);

  get isMobile(): boolean {
    return (window?.innerWidth || 0) <= 767;
  }

  ngAfterViewInit(): void {
    // nothing immediate — menu items populated when menu opens
  }

  ngOnDestroy(): void {
    // nothing to cleanup beyond listeners handled by host
  }

  // Public API methods as requested
  toggleMenu(event?: MouseEvent) {
    event?.stopPropagation();
    this.open ? this.closeMenu() : this.openMenu();
  }

  openMenu() {
    if (this.open) return;
    this.open = true;
    // set guard so a document mousedown from the same interaction doesn't close immediately
    this.justOpened = true;
    setTimeout(() => (this.justOpened = false), 50);

    this.computeMenuPosition();
    this.cdr.markForCheck();
    // focus first item after DOM paints
    queueMicrotask(() => this.focusFirstItem());
  }

  closeMenu() {
    if (!this.open) return;
    this.open = false;
    this.cdr.markForCheck();
    // return focus to avatar button
    try {
      this.avatarBtn?.nativeElement?.focus();
    } catch (e) {}
  }

  focusFirstItem() {
    this.refreshMenuItems();
    if (this.menuItems.length) {
      this.focusedIndex = 0;
      this.menuItems[0].focus();
    }
  }

  refreshMenuItems() {
    const el = this.menu?.nativeElement;
    if (!el) return;
    this.menuItems = Array.from(
      el.querySelectorAll<HTMLElement>('[role="menuitem"]'),
    );
  }

  activate(index: number) {
    const item = this.menuItems[index];
    if (!item) return;
    item.click();
  }

  // keyboard handling (Esc / navigation / Tab)
  @HostListener("document:keydown", ["$event"])
  onKeydown(event: KeyboardEvent) {
    if (!this.open) return;
    const key = event.key;
    this.refreshMenuItems();
    const len = this.menuItems.length;
    if (len === 0) return;

    if (key === "Escape") {
      event.preventDefault();
      this.closeMenu();
      return;
    }

    if (key === "ArrowDown") {
      event.preventDefault();
      this.focusedIndex = (this.focusedIndex + 1) % len;
      this.menuItems[this.focusedIndex].focus();
      return;
    }

    if (key === "ArrowUp") {
      event.preventDefault();
      this.focusedIndex = (this.focusedIndex - 1 + len) % len;
      this.menuItems[this.focusedIndex].focus();
      return;
    }

    if (key === "Home") {
      event.preventDefault();
      this.focusedIndex = 0;
      this.menuItems[0].focus();
      return;
    }

    if (key === "End") {
      event.preventDefault();
      this.focusedIndex = len - 1;
      this.menuItems[this.focusedIndex].focus();
      return;
    }

    if (key === "Tab") {
      // allow default tab; close if focus leaves menu after microtask
      queueMicrotask(() => {
        const active = document.activeElement as HTMLElement | null;
        const hostEl = this.host.nativeElement as HTMLElement;
        if (!active || !hostEl.contains(active)) this.closeMenu();
      });
    }
  }

  // close when clicking outside; ignore the immediate opening click via justOpened guard
  @HostListener("document:mousedown", ["$event"])
  onDocumentMouseDown(event: MouseEvent) {
    try {
      if (!this.open) return;
      if (this.justOpened) return;
      const target = event.target as Node | null;
      const hostEl = this.host.nativeElement as HTMLElement;
      if (target && !hostEl.contains(target)) {
        this.closeMenu();
      }
    } catch (e) {
      // defensive: do not let errors prevent interaction
    }
  }

  @HostListener("window:resize")
  @HostListener("window:scroll")
  onWindowChange() {
    if (!this.open) return;
    this.computeMenuPosition();
  }

  computeMenuPosition() {
    const btn = this.avatarBtn?.nativeElement;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const gap = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // compute left so menu is right-aligned to the button by default
    let left = rect.right - this.menuWidth;
    if (left < 8) left = 8;
    if (left + this.menuWidth > vw - 8)
      left = Math.max(8, vw - this.menuWidth - 8);

    // compute top (below button), otherwise above
    let top = rect.bottom + gap;
    const estimatedMenuHeight = 200;
    if (vh - rect.bottom < estimatedMenuHeight + gap) {
      top = rect.top - estimatedMenuHeight - gap;
      if (top < 8) top = 8;
    }

    // use fixed positioning to avoid parent overflow clipping
    this.menuTop = Math.round(top + (window.scrollY || window.pageYOffset));
    this.menuLeft = Math.round(left + (window.scrollX || window.pageXOffset));
    this.menuStyles = {
      top: `${this.menuTop}px`,
      left: `${this.menuLeft}px`,
      minWidth: `${this.menuWidth}px`,
    };
    this.cdr.markForCheck();
  }

  // actions
  onOrders() {
    this.orders.emit();
    this.closeMenu();
  }

  onProfile() {
    this.profile.emit();
    this.closeMenu();
  }

  onLogout() {
    this.store.dispatch(CartActions.clearCart());

    sessionStorage.removeItem("pending_save_id");

    this.logout.emit();

    this.closeMenu();
  }

  openCart() {
    // emit to host so host can reuse DrawerService/openCart logic
    this.openCartRequested.emit();
    this.closeMenu();
  }

  // handle focus leave (tab out)
  @HostListener("document:focusin", ["$event"])
  onFocusIn(event: FocusEvent) {
    if (!this.open) return;
    const target = event.target as Node | null;
    const hostEl = this.host.nativeElement as HTMLElement;
    if (target && !hostEl.contains(target)) {
      this.closeMenu();
    }
  }
}
