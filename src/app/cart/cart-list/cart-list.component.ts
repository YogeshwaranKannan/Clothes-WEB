import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { Store } from "@ngrx/store";
import { Observable, combineLatest, map, startWith } from "rxjs";

import { CartItem } from "../../common/models/cart/cart-item.model";
import { selectCartItems } from "../../common/models/cart/cart.selectors";
import * as CartActions from "../../common/models/cart/cart.actions";
// import { ProductService } from "../../common/services/product.service";
import { ProductService } from "../../common/services/product.service copy";
import { parseMoneyToNumber } from "../../common/utils/price.util";

//import { AddonsSuggestComponent } from "../../addons-suggest/addons-suggest.component";
import { AddonModel } from "../../common/models/cart/addon.model";
import {
  isS3Enabled,
  Product_URL,
  Service_URL,
} from "../../common/utils/constant";
import { ImageUrlService } from "../../common/utils/ImageUrlService";
// What the template receives per cart item
interface CartItemVm {
  item: CartItem;
  addonTotal: number;
}

@Component({
  selector: "app-cart-list",
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./cart-list.component.html",
  styleUrls: ["./cart-list.component.scss"],
})
export class CartListComponent implements OnInit {
  // private readonly imgBase = "https://dev.fr.api.intellesyde.com";
  //private readonly imgBase = "http://localhost:8080";
  vm$!: Observable<CartItemVm[]>;

  suggestedAddons$!: Observable<AddonModel[]>;

  isS3Enabled = false;
  constructor(
    private store: Store,
    private productService: ProductService,
    private imageUrlService: ImageUrlService,
  ) {}

  ngOnInit(): void {
    this.isS3Enabled = isS3Enabled;
    const cartItems$ = this.store.select(selectCartItems);
    const allProducts$ = this.productService.getProducts();

    // ── Product view-models ──────────────────────────────────────────────
    // ✅ FIXED — vm$ only needs cartItems$; no need to wait for HTTP
    this.vm$ = this.store.select(selectCartItems).pipe(
      map((cartItems) =>
        cartItems.map((item) => {
          const addonTotal = (item.selectedAddons ?? []).reduce(
            (s, a) => s + a.price * a.quantity,
            0,
          );
          return { item, addonTotal } satisfies CartItemVm;
        }),
      ),
    );

    this.vm$.subscribe((data) => {
      console.log("vm$ data:", data);
    });

    // ── Collect available addon candidates from product catalogue ──────
    this.suggestedAddons$ = combineLatest([
      cartItems$,
      allProducts$.pipe(startWith([])), // <-- add this
    ]).pipe(
      map(([cartItems, allProducts]) => {
        const productMap = new Map<string, any>(
          (allProducts ?? []).map((p: any) => [String(p.ProductId), p]),
        );

        const addonMap = new Map<string, AddonModel>();

        for (const cartItem of cartItems) {
          const prodKey = String(cartItem.productId);
          const product = productMap.get(prodKey);
          if (!product) continue;

          const candidateIds: any[] = product.addons ?? [];
          for (const aid of candidateIds) {
            const key = String(aid);
            if (addonMap.has(key)) continue;

            const addonProduct = productMap.get(key);
            if (!addonProduct) continue;

            console.log("AddOn match products :", addonProduct);

            const price =
              parseMoneyToNumber((addonProduct as any).OfferPrice) ||
              parseMoneyToNumber((addonProduct as any).SellingPrice) ||
              0;

            const image =
              addonProduct?.imageUrl ||
              (addonProduct as any).ImageUrl ||
              (addonProduct as any).Image ||
              "";

            const isService = (addonProduct as any).isService ?? false;
            const addonModel: AddonModel = {
              id: Number(addonProduct.ProductId) || 0,
              productId: String(addonProduct.ProductId),
              name: addonProduct.ProductName ?? String(addonProduct.ProductId),
              price,
              image,
              isService: isService,
            };

            addonMap.set(key, addonModel);
          }
        }

        // Return array sorted by name for stable display
        return Array.from(addonMap.values()).sort((a, b) =>
          a.name.localeCompare(b.name),
        );
      }),
    );
  }

  // ── AddonsSuggestComponent output handler ────────────────────────────

  onSuggestedAddonAdd(addon: AddonModel): void {
    this.store.dispatch(
      CartActions.updateOrAddItem({
        item: {
          productId: addon.productId ?? String(addon.id),
          title: addon.name,
          dealPrice: addon.price,
          mrp: addon.price,
          imageUrl: addon.image ?? "",
          quantity: 1,
          selectedAddons: [],
          isService: addon.isService ?? false,
          item: null,
        } as unknown as CartItem,
      }),
    );
  }

  // ── Quantity / remove ────────────────────────────────────────────────

  increase(item: CartItem): void {
    this.store.dispatch(
      CartActions.updateQuantity({
        productId: item.productId,
        quantity: item.quantity + 1,
      }),
    );
  }

  decrease(item: CartItem): void {
    if (item.quantity > 1) {
      this.store.dispatch(
        CartActions.updateQuantity({
          productId: item.productId,
          quantity: item.quantity - 1,
        }),
      );
    }
  }

  remove(item: CartItem): void {
    this.store.dispatch(CartActions.removeItem({ productId: item.productId }));
  }

  // ── Helpers ──────────────────────────────────────────────────────────

  addonTotalFor(item: CartItem): number {
    return (item.selectedAddons ?? []).reduce(
      (s, a) => s + a.price * a.quantity,
      0,
    );
  }

  trackByProductId(_: number, vm: CartItemVm): string {
    return vm.item.productId;
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
  updateQtyFromInput(item: CartItem, event: Event): void {
    const input = event.target as HTMLInputElement;

    let qty = parseInt(input.value, 10);

    if (isNaN(qty) || qty < 1) {
      qty = 1;
    }

    input.value = String(qty);

    this.store.dispatch(
      CartActions.updateQuantity({
        productId: item.productId,
        quantity: qty,
      }),
    );
  }

  private imgCache = new Map<string, Promise<string>>();

  buildImageUrl(
    relative?: string,
    inventoryId?: string,
    isService: boolean = false,
  ): Promise<string> {
    const key = `${relative ?? ""}|${inventoryId ?? ""}|${isService}`;
    let p = this.imgCache.get(key);
    if (!p) {
      p = this.imageUrlService.buildImageUrl(relative, inventoryId, isService);
      this.imgCache.set(key, p);
    }
    return p;
  }
}
