//import { Component, ElementRef, HostListener, ViewChild, OnInit, OnDestroy, EventEmitter, Output } from '@angular/core';
import {
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  OnInit,
  OnDestroy,
  EventEmitter,
  Output,
  Input,
} from "@angular/core";

import { CommonModule } from "@angular/common";
import { RouterModule, Router, ActivatedRoute } from "@angular/router";
import { Subscription } from "rxjs";
// import { ProductService } from '../../services/product.service';
import { ProductService } from "../../services/product.service copy";
import { Product } from "../../models/product.model";
import { WishlistService } from "../../../wishlist/wishlist.service";
import { INPUT_LENGTH } from "../../utils/input-length.config";
import { OrderSearchService } from "../../services/OrderSearch.service";

@Component({
  selector: "app-product-suggest",
  standalone: true,
  imports: [CommonModule, RouterModule],

  templateUrl: "./product-suggest.component.html",
  styleUrls: ["./product-suggest.component.scss"],
})
export class ProductSuggestComponent implements OnInit, OnDestroy {
  @ViewChild("desktopSearch", { read: ElementRef })
  desktopSearch?: ElementRef<HTMLInputElement>;

  readonly INPUT_LENGTH = INPUT_LENGTH;

  @Output() productSelected = new EventEmitter<any>();
  @Input() navigateOnSelect = true;

  productItems: Array<any> = [];
  desktopSuggestions: Array<any> = [];
  mobileSuggestions: Array<any> = [];

  desktopQuery = "";
  mobileQuery = "";
  desktopActiveIndex = -1;
  categoryId: string = "";

  private desktopTimer: any = null;
  private mobileTimer: any = null;
  private subs: Subscription[] = [];
  @Input() mode: "product" | "order" = "product";
  @Output() orderSearch = new EventEmitter<string>();

  isSearchOpen = false; // controls mobile search panel
  //@Output() productSelected = new EventEmitter<any>();

  constructor(
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute,
    private wishlist: WishlistService,
    private hostRef: ElementRef<HTMLElement>,
    private OrderSearchService: OrderSearchService,
  ) {}

  ngOnInit(): void {
    // this.route.paramMap.subscribe((params) => {
    //   this.categoryId = params.get("id") || "";

    //   console.log("Category ID :", this.categoryId);
    // });

    const s = this.productService.getProducts().subscribe((p: Product[]) => {
      this.productItems = (p || []).map((prod) => ({
        name: prod.ProductName,
        ProductId: prod.ProductId,
        Image: prod.Image,
        raw: prod,
      }));
    });
    this.subs.push(s);

    // const searchValue = this.desktopSearch?.nativeElement?.value || "";

    // if (searchValue.length >= 3) {
    //   const s = this.productService
    //     .getProductSuggestion(searchValue)
    //     .subscribe({
    //       next: (p: Product[]) => {
    //         this.productItems = (p || []).map((prod) => ({
    //           name: prod.ProductName,
    //           ProductId: prod.ProductId,
    //           Image: prod.imageUrl,
    //           raw: prod,
    //         }));
    //       },

    //       error: (err) => {
    //         console.error("Products Error:", err);
    //       },

    //       complete: () => {
    //         console.log("Products Completed");
    //       },
    //     });

    //   this.subs.push(s);
    // }
  }

  searchOrders(value: string): void {
    const term = value.trim();

    console.log("Search order value :", value);

    if (!term) {
      this.OrderSearchService.clearOrderSearch();
      return;
    }
    this.OrderSearchService.searchOrders(term);
  }

  onDesktopInput(value: string): void {
    // Check search value length > 0
    if (!value || value.trim().length === 0) {
      this.desktopQuery = "";
      this.desktopSuggestions = [];
      this.desktopActiveIndex = -1;
      this.productItems = [];
      return;
    }

    // Order mode
    if (this.mode === "order") {
      this.searchOrders(value);
      return;
    }

    // Product mode
    clearTimeout(this.desktopTimer);

    this.desktopTimer = setTimeout(() => {
      this.desktopQuery = value || "";

      const term = this.desktopQuery.trim().toLowerCase();

      if (!term) {
        this.desktopSuggestions = [];
        this.desktopActiveIndex = -1;
        return;
      }

      this.desktopSuggestions = this.productItems
        .filter((p) => (p.name || "").toLowerCase().includes(term))
        .slice(0, 8);

      this.desktopActiveIndex = -1;
    }, 180);

    // Call API only when search value length >= 3
    if (value.trim().length < 3) {
      this.productItems = [];
      this.desktopSuggestions = [];
      return;
    }

    const s = this.productService.getProductSuggestion(value).subscribe({
      next: (p: Product[]) => {
        this.productItems = (p || []).map((prod) => ({
          name: prod.ProductName,
          ProductId: prod.ProductId,
          Image: prod.imageUrl,
          raw: prod,
        }));
      },
      error: (err) => {
        console.error("Products Error:", err);
      },
    });

    this.subs.push(s);
  }

  searchProducts(searchText: string): void {
    const term = (searchText || "").trim();

    // Do nothing if search value is empty
    if (term.length === 0) {
      return;
    }

    console.log("Search Text :", term);
    console.log("Category Id :", this.categoryId);

    this.router.navigate(["/category", this.categoryId], {
      queryParams: {
        search: term,
      },
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  // onDesktopInput(value: string) {
  //   clearTimeout(this.desktopTimer);
  //   this.desktopTimer = setTimeout(() => {
  //     this.desktopQuery = value || "";
  //     const term = this.desktopQuery.trim().toLowerCase();
  //     if (!term) {
  //       this.desktopSuggestions = [];
  //       this.desktopActiveIndex = -1;
  //       return;
  //     }
  //     this.desktopSuggestions = this.productItems
  //       .filter((p) => (p.name || "").toLowerCase().includes(term))
  //       .slice(0, 8);
  //     this.desktopActiveIndex = -1;
  //   }, 180);
  // }

  onMobileInput(value: string) {
    clearTimeout(this.mobileTimer);
    this.mobileTimer = setTimeout(() => {
      this.mobileQuery = value || "";
      const term = this.mobileQuery.trim().toLowerCase();
      if (!term) {
        this.mobileSuggestions = [];
        return;
      }
      this.mobileSuggestions = this.productItems
        .filter((p) => (p.name || "").toLowerCase().includes(term))
        .slice(0, 6);
    }, 180);
  }

  onDesktopKeydown(e: KeyboardEvent) {
    if (!this.desktopSuggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.desktopActiveIndex = Math.min(
        this.desktopActiveIndex + 1,
        this.desktopSuggestions.length - 1,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this.desktopActiveIndex = Math.max(this.desktopActiveIndex - 1, 0);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (
        this.desktopActiveIndex >= 0 &&
        this.desktopActiveIndex < this.desktopSuggestions.length
      ) {
        const sel = this.desktopSuggestions[this.desktopActiveIndex];
        if (sel) this.selectSuggestion(sel, "desktop");
      } else {
        const q = this.desktopSearch?.nativeElement?.value || this.desktopQuery;
        this.navigateSearch(q);
        this.desktopSuggestions = [];
        this.desktopActiveIndex = -1;
      }
    }
  }

  selectSuggestion(item: any, target: "desktop" | "mobile") {
    if (!item) return;
    this.productSelected.emit(item.raw);

    if (this.navigateOnSelect) {
      this.router.navigate(["/product", item.ProductId]);
    }

    this.desktopSuggestions = [];
    this.mobileSuggestions = [];
    this.isSearchOpen = false;
  }

  toggleWishlistFor(item: any, event?: MouseEvent) {
    if (!item || !item.raw) return;
    if (event) event.stopPropagation();
    this.wishlist.toggle(item.raw.ProductId?.toString());
  }

  isInWishlist(id: any) {
    return this.wishlist.has(id?.toString());
  }

  navigateSearch(q: string | undefined) {
    const term = (q || "").trim();
    if (!term) return;
    this.router.navigate(["/search"], { queryParams: { q: term } });
    this.isSearchOpen = false;
  }

  toggleMobileSearch() {
    this.isSearchOpen = !this.isSearchOpen;
  }

  @HostListener("document:click", ["$event"])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as Node | null;
    if (
      this.isSearchOpen &&
      target &&
      !this.hostRef.nativeElement.contains(target)
    ) {
      this.isSearchOpen = false;
    }
    if (target && !this.hostRef.nativeElement.contains(target)) {
      this.desktopSuggestions = [];
      this.desktopActiveIndex = -1;
      this.mobileSuggestions = [];
    }
  }
}
