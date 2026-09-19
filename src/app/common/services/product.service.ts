import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, map, catchError, of, tap } from "rxjs";
import { Product, ProductDetail } from "../models/product.model";
import { SellerService } from "./SellerService";
//import { BASE_URL } from "../utils/constant";

@Injectable({ providedIn: "root" })
export class ProductService {
  //JSON call
  private readonly url = "assets/getProducts.json";
  // API Call
  // private readonly url = `${BASE_URL}/searchProductsManageOrderSeller`;
  private readonly prods_detail_url = "assets/getProductDetail.json";
  private readonly hero_products = "assets/heroBanner.json";

  constructor(
    private http: HttpClient,
    private sellerService: SellerService,
  ) {}

  getProducts(): Observable<Product[]> {
    const requestBody = {
      companyId: this.sellerService.getSellerId(),
      sort: {
        field: "",
        order: "",
      },
      filters: {
        priceRange: {
          min: null,
          max: null,
        },
        offerPercentage: {},
        brand: [],
      },
      categories: null,
      seeInv: "1",
      seeServ: "1",
      seeProd: "0",
      invTaken: "0",
      servTaken: "0",
      prodTaken: "0",
    };

    return this.http
      .get<{ products: Product[] }>(this.url) // ✅ body added
      .pipe(
        //tap((res) => console.log("Products Inventory Response from DB:", res)),
        map((r) => r?.products || []),
      );
  }

  getHeroProducts(): Observable<Product[]> {
    return this.http
      .get<{ products: Product[] }>(this.hero_products)
      .pipe(map((r) => r?.products || []));
  }

  getProductById(id: number): Observable<ProductDetail | null> {
    console.log("id:" + id);
    return this.http
      .get<{ products: ProductDetail[] }>(this.prods_detail_url)
      .pipe(map((r) => r?.products || []))
      .pipe(
        map(
          (arr) => arr.find((p) => String(p.ProductId) === String(id)) ?? null,
        ),
      );
  }

  // getProductsByCategories(categoryId?: string): Observable<Product[]> {
  //   return this.http.get<{ products: Product[] }>(this.url).pipe(
  //     map((r) => r?.products || []),
  //     catchError(() => of([])),
  //   );
  // }
  getProductsByCategories(categoryId?: string): Observable<Product[]> {
    const requestBody = {
      companyId: this.sellerService.getSellerId(),

      sort: {
        field: "",
        order: "",
      },

      filters: {
        priceRange: {
          min: null,
          max: null,
        },
        offerPercentage: {},
        brand: [],
      },

      // ✅ Pass category dynamically
      categories: categoryId ? [categoryId] : null,

      seeInv: "1",
      seeServ: "1",
      seeProd: "0",

      invTaken: "0",
      servTaken: "0",
      prodTaken: "0",
    };

    return this.http
      .post<{ products: Product[] }>(this.url, requestBody) // ✅ body added
      .pipe(
        map((r) => r?.products || []),
        catchError((err) => {
          console.error("API Error:", err);
          return of([]);
        }),
      );
  }

  /**
   * Return products matching any of the provided category ids.
   * If `ids` is empty, return all products.
   */
  // getProductsByCategoryIds(ids: Array<string | number>): Observable<Product[]> {
  //   const normalized = Array.isArray(ids) ? ids.map((x) => String(x)) : [];
  //   return this.http.get<{ products: Product[] }>(this.url).pipe(
  //     map((r) => r?.products || []),
  //     map((products) => {
  //       if (!normalized.length) return products.slice();
  //       const set = new Set(normalized);
  //       return products.filter((p) => set.has(String(p.Category?.CategoryId)));
  //     }),
  //     catchError(() => of([])),
  //   );
  // }

  getProductsByCategoryIds(ids: string[]): Observable<Product[]> {
    if (!ids.length) return this.getProducts(); // empty → all products
    const idSet = new Set(ids.map((id) => String(id).trim().toLowerCase()));
    return this.getProducts().pipe(
      map((products) =>
        products.filter((p) => {
          const catId = String(p.Category?.CategoryId ?? "")
            .trim()
            .toLowerCase();
          return catId.length > 0 && idSet.has(catId);
        }),
      ),
    );
  }
  getProductsByCategoryIdsV1(
    ids: Array<string | number>,
  ): Observable<Product[]> {
    const normalized = Array.isArray(ids) ? ids.map((x) => String(x)) : [];

    const requestBody = {
      companyId: "6954d2dfa8cca61b24a2ea12",

      sort: {
        field: "",
        order: "",
      },

      filters: {
        priceRange: {
          min: null,
          max: null,
        },
        offerPercentage: {},
        brand: [],
      },

      // ✅ Send categories to backend
      categories: normalized.length ? normalized : null,

      seeInv: "1",
      seeServ: "1",
      seeProd: "0",

      invTaken: "0",
      servTaken: "0",
      prodTaken: "0",
    };

    return this.http.get<{ products: Product[] }>(this.url).pipe(
      map((r) => r?.products || []),
      catchError((err) => {
        console.error("Category API Error:", err);
        return of([]);
      }),
    );
  }

  // 🔥 Get products by multiple IDs (for Wishlist)
  getProductsByIds(ids: string[]): Observable<Product[]> {
    if (!ids || ids.length === 0) {
      return of([]);
    }
    console.log("service - wish list ids", ids);
    return this.http.get<{ products: Product[] }>(this.url).pipe(
      map((res) => res?.products || []),
      map((products) =>
        products.filter((p) => ids.includes(p.ProductId?.toString())),
      ),
      catchError(() => of([])),
    );
  }

  // getProductsByIds(ids: string[]): Observable<Product[]> {
  //   if (!ids || ids.length === 0) {
  //     return of([]);
  //   }

  //   const requestBody = {
  //     companyId: "6954d2dfa8cca61b24a2ea12",

  //     filters: {
  //       productIds: ids, // ✅ backend must support this
  //       priceRange: { min: null, max: null },
  //       offerPercentage: {},
  //       brand: [],
  //     },

  //     categories: null,

  //     seeInv: "1",
  //     seeServ: "1",
  //     seeProd: "0",

  //     invTaken: "0",
  //     servTaken: "0",
  //     prodTaken: "0",
  //   };

  //   return this.http.post<{ products: Product[] }>(this.url, requestBody).pipe(
  //     map((res) => res?.products || []),
  //     catchError((err) => {
  //       console.error("Wishlist API Error:", err);
  //       return of([]);
  //     }),
  //   );
  // }
}
