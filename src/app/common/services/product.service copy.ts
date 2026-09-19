// import { Injectable } from "@angular/core";
// import { HttpClient } from "@angular/common/http";
// import {
//   Observable,
//   map,
//   catchError,
//   of,
//   tap,
//   BehaviorSubject,
//   switchMap,
// } from "rxjs";
// import { Product, ProductDetail } from "../models/product.model";
// import { BASE_URL, Img_BASE_URL } from "../utils/constant";
// import { SellerService } from "./SellerService";
// import { ActivatedRoute } from "@angular/router";
// import { companyname } from "./../utils/constant";
// import { ImageUrlService } from "../utils/ImageUrlService";

// @Injectable({ providedIn: "root" })
// export class ProductService {
//   //JSON call
//   // private readonly url = "assets/getProducts.json";
//   // API Call
//   private readonly url = `${BASE_URL}/searchProductsManageOrderSeller`;
//   private readonly searchvalueUrl = `${BASE_URL}/suggest`;
//   private readonly ProductSearchurl = `${BASE_URL}/searchProductById`;
//   private readonly prods_detail_url = "assets/getProductDetail.json";
//   private readonly hero_products = "assets/heroBanner.json";
//   displayHomeCategoryIds: string[] = [];

//   setDisplayHomeCategoryIds(ids: string[]) {
//     this.displayHomeCategoryIds = ids || [];

//     console.log(
//       "Updated displayHomeCategoryIds : ",
//       this.displayHomeCategoryIds,
//     );
//   }
//   constructor(
//     private http: HttpClient,
//     private sellerService: SellerService,
//     private route: ActivatedRoute,
//     private imageUrlService: ImageUrlService,
//   ) {}

//   private refreshProductsSource = new BehaviorSubject<void>(undefined);

//   refreshProducts$ = this.refreshProductsSource.asObservable();

//   triggerRefresh(): void {
//     this.refreshProductsSource.next();
//   }

//   Deals: boolean = false;
//   NewArrival: boolean = false;

//   // getProducts(): Observable<Product[]> {
//   //   if (!this.sellerService.getSellerId()) {
//   //     console.warn("Seller ID not loaded yet");
//   //     return of([]);
//   //   }
//   //   console.log(
//   //     "Request categories before API : ",
//   //     this.displayHomeCategoryIds,
//   //   );
//   //   const requestBody = {
//   //     companyId: this.sellerService.getSellerId(),
//   //     sort: {
//   //       field: "",
//   //       order: "",
//   //     },
//   //     filters: {
//   //       priceRange: {
//   //         min: null,
//   //         max: null,
//   //       },
//   //       offerPercentage: {},
//   //       brand: [],
//   //     },
//   //     deals: this.Deals,
//   //     newArrivals: this.NewArrival,
//   //     categories: this.displayHomeCategoryIds,
//   //     seeInv: "1",
//   //     seeServ: "1",
//   //     seeProd: "0",
//   //     invTaken: "0",
//   //     servTaken: "0",
//   //     prodTaken: "0",
//   //   };
//   //   console.log("Request: ", requestBody);

//   //   return this.http.post<{ products: Product[] }>(this.url, requestBody).pipe(
//   //     tap((res) => console.log("Products Inventory Response from DB:", res)),
//   //     map((res) =>
//   //       (res?.products || []).map((p) => ({
//   //         ...p,
//   //         imageUrl: buildImageUrl(
//   //           (p as any).ImageUrl || p.Image,
//   //           p.ProductName,
//   //           p.isService ?? false,
//   //           this.sellerService.getServiceImageFolder(),
//   //         ),
//   //       })),
//   //     ),
//   //   );
//   // }

//   getProducts(): Observable<Product[]> {
//     const loadSeller$ = this.sellerService.isSellerLoaded()
//       ? of(this.sellerService.getSellerDetails())
//       : this.sellerService.loadSellerDetails();

//     return loadSeller$.pipe(
//       switchMap(() => {
//         console.log(
//           "Request categories before API : ",
//           this.displayHomeCategoryIds,
//         );

//         const requestBody = {
//           companyId: this.sellerService.getSellerId(),
//           sort: {
//             field: "",
//             order: "",
//           },
//           filters: {
//             priceRange: {
//               min: null,
//               max: null,
//             },
//             offerPercentage: {},
//             brand: [],
//           },
//           deals: this.Deals,
//           newArrivals: this.NewArrival,
//           categories: this.displayHomeCategoryIds,
//           seeInv: "1",
//           seeServ: "1",
//           seeProd: "0",
//           invTaken: "0",
//           servTaken: "0",
//           prodTaken: "0",
//         };

//         console.log("Request:", requestBody);

//         return this.http
//           .post<{ products: Product[] }>(this.url, requestBody)
//           .pipe(
//             tap((res) =>
//               console.log("Products Inventory Response from DB:", res),
//             ),
//             map((res) =>
//               (res?.products || []).map((p) => ({
//                 ...p,
//                 imageUrl: this.imageUrlService.buildImageUrl(
//                   (p as any).ImageUrl || p.Image,
//                   p.inventoryId,
//                   p.isService ?? false,
//                 ),
//               })),
//             ),
//           );
//       }),
//     );
//   }

//   getProductSuggestion(searchvalue: string): Observable<any[]> {
//     console.log("Search value for suggestion :", searchvalue);

//     const sellerId = this.sellerService.getSellerId();

//     if (!sellerId) {
//       console.warn("Seller ID not loaded yet");
//       return of([]);
//     }

//     const requestBody = {
//       companynameid: sellerId,
//       searchvalue: searchvalue,
//     };

//     return this.http.post<any[]>(this.searchvalueUrl, requestBody).pipe(
//       tap((res) => console.log("Products suggestions Response from DB:", res)),

//       map((products) =>
//         (products || []).map((p: any) => ({
//           ...p,
//           imageUrl: this.imageUrlService.buildImageUrl(
//             p.ImageUrl || p.Image,
//             p.inventoryId,
//             p.isService ?? false,
//           ),
//         })),
//       ),

//       catchError((error) => {
//         console.error("Error fetching product suggestions:", error);
//         return of([]);
//       }),
//     );
//   }

//   getProductsBySearchname(
//     search: string,
//     categoryId: string,
//   ): Observable<Product[]> {
//     if (!this.sellerService.getSellerId()) {
//       console.warn("Seller ID not loaded yet");
//       return of([]);
//     }

//     const requestBody = {
//       companyId: this.sellerService.getSellerId(),
//       searchValue: search,
//       sort: {
//         field: "",
//         order: "",
//       },
//       filters: {
//         priceRange: {
//           min: null,
//           max: null,
//         },
//         offerPercentage: {},
//         brand: [],
//       },
//       categories: null,
//       seeInv: "1",
//       seeServ: "1",
//       seeProd: "0",
//       invTaken: "0",
//       servTaken: "0",
//       prodTaken: "0",
//     };

//     return this.http.post<{ products: Product[] }>(this.url, requestBody).pipe(
//       tap((response) => {
//         console.log("Full API Response:", response);
//         console.log("Products:", response?.products);
//       }),

//       map((r) => r?.products || []),

//       catchError((err) => {
//         console.error("Category API Error:", err);
//         return of([]);
//       }),
//     );
//   }

//   getHeroProducts(): Observable<Product[]> {
//     return this.http
//       .get<{ products: Product[] }>(this.hero_products)
//       .pipe(map((r) => r?.products || []));
//   }

//   // getProductById(id: number): Observable<ProductDetail | null> {
//   //   console.log("id:" + id);
//   //   return this.http
//   //     .get<{ products: ProductDetail[] }>(this.prods_detail_url)
//   //     .pipe(map((r) => r?.products || []))
//   //     .pipe(
//   //       map(
//   //         (arr) => arr.find((p) => String(p.ProductId) === String(id)) ?? null,
//   //       ),
//   //     );
//   // }
//   getProductById(productId: string): Observable<ProductDetail | null> {
//     const body = {
//       productId: productId,
//       companyId: this.sellerService.getSellerId(),
//     };

//     console.log("Get Product Request:", body);

//     return this.http.post<any>(this.ProductSearchurl, body).pipe(
//       map((res) => {
//         console.log("Get Product Response:", res);

//         // Your new API response
//         const p = res?.products?.[0];

//         if (!p) return null;

//         const product: ProductDetail = {
//           // ─────────────────────────────
//           // Product Base
//           // ─────────────────────────────
//           ProductId: p.ProductId || "",

//           ProductName: p.ProductName || "",

//           ProductDescription: p.description || "",

//           Brand: p.Brand || "",

//           Size: p.Size || "",

//           SellingPrice: p.SellingPrice || 0,

//           OfferPrice: p.OfferPrice || 0,

//           DiscountPercent: p.DiscountPercent || "0%",

//           StockStatus: p.StockStatus || "In Stock",

//           AvilableQty: p.AvilableQty || 0,

//           // ─────────────────────────────
//           // Category
//           // ─────────────────────────────
//           Category: p.Category
//             ? {
//                 CategoryId: p.Category.CategoryId || "",
//                 CategoryName: p.Category.CategoryName || "",
//               }
//             : undefined,

//           // ─────────────────────────────
//           // Images
//           // ─────────────────────────────
//           Image: p.Image || "",

//           imageUrl: p.Image || "",

//           ImageUrl: p.Image || "",

//           // ─────────────────────────────
//           // Inventory
//           // ─────────────────────────────
//           inventoryId: p.inventoryId || "",

//           sellerid: p.sellerid || "",

//           Batch_Id: p.Batch_Id || "",

//           batch_unit: p.batch_unit || "",

//           // ─────────────────────────────
//           // Flags
//           // ─────────────────────────────
//           isService: (p.propertyAttributes?.length ?? 0) > 0 || false,

//           isAttributePresent: p.isAttributePresent || false,

//           addons: p.addons || [],

//           propertyAttributes: p.propertyAttributes || [],

//           // ─────────────────────────────
//           // Variants
//           // ─────────────────────────────
//           variants:
//             p.variants?.map((v: any) => ({
//               variantsid: v.variantsid || "",

//               variantsName: v.variantsName || "",

//               SellingPrice: v.SellingPrice || 0,

//               OfferPrice: v.OfferPrice || 0,

//               DiscountPercent: v.DiscountPercent || "0%",

//               StockStatus: v.StockStatus || "In Stock",

//               AvilableQty: v.AvilableQty || 0,

//               offerText: v.offerText || "",
//             })) || [],

//           // ─────────────────────────────
//           // Default Selected Variant
//           // ─────────────────────────────
//           selectedVariant:
//             p.variants?.length > 0
//               ? {
//                   variantsid: p.variants[0].variantsid || "",

//                   variantsName: p.variants[0].variantsName || "",

//                   SellingPrice: p.variants[0].SellingPrice || 0,

//                   OfferPrice: p.variants[0].OfferPrice || 0,

//                   DiscountPercent: p.variants[0].DiscountPercent || "0%",

//                   StockStatus: p.variants[0].StockStatus || "In Stock",

//                   AvilableQty: p.variants[0].AvilableQty || 0,

//                   offerText: p.variants[0].offerText || "",
//                 }
//               : null,

//           // ─────────────────────────────
//           // Optional Detail Fields
//           // ─────────────────────────────
//           Features: p.Features || [],

//           Specifications: p.Specifications || {},

//           SimilarProducts: p.SimilarProducts || [],

//           CreatedAt: p.CreatedAt || "",
//         };

//         console.log("Mapped Product:", product);

//         return product;
//       }),
//     );
//   }

//   getFullImages(
//     userfolder: string,
//     type: string,
//     inventoryId: string,
//     companyName: string,
//   ) {
//     return this.http.get<string[]>(`${Img_BASE_URL}/FullImages`, {
//       params: {
//         userfolder,
//         type,
//         inventoryId,
//         companyName,
//       },
//     });
//   }
//   // getProductsByCategories(categoryId?: string): Observable<Product[]> {
//   //   return this.http.get<{ products: Product[] }>(this.url).pipe(
//   //     map((r) => r?.products || []),
//   //     catchError(() => of([])),
//   //   );
//   // }
//   getProductsByCategories(categoryId?: string): Observable<Product[]> {
//     const requestBody = {
//       companyId: this.sellerService.getSellerId(),

//       sort: {
//         field: "",
//         order: "",
//       },

//       filters: {
//         priceRange: {
//           min: null,
//           max: null,
//         },
//         offerPercentage: {},
//         brand: [],
//       },

//       // ✅ Pass category dynamically
//       categories: categoryId ? [categoryId] : null,

//       seeInv: "1",
//       seeServ: "1",
//       seeProd: "0",

//       invTaken: "0",
//       servTaken: "0",
//       prodTaken: "0",
//     };

//     return this.http
//       .post<{ products: Product[] }>(this.url, requestBody) // ✅ body added
//       .pipe(
//         map((r) => r?.products || []),
//         catchError((err) => {
//           console.error("API Error:", err);
//           return of([]);
//         }),
//       );
//   }

//   /**
//    * Return products matching any of the provided category ids.
//    * If `ids` is empty, return all products.
//    */
//   // getProductsByCategoryIds(ids: Array<string | number>): Observable<Product[]> {
//   //   const normalized = Array.isArray(ids) ? ids.map((x) => String(x)) : [];
//   //   return this.http.get<{ products: Product[] }>(this.url).pipe(
//   //     map((r) => r?.products || []),
//   //     map((products) => {
//   //       if (!normalized.length) return products.slice();
//   //       const set = new Set(normalized);
//   //       return products.filter((p) => set.has(String(p.Category?.CategoryId)));
//   //     }),
//   //     catchError(() => of([])),
//   //   );
//   // }

//   getProductsByCategoryIds(ids: Array<string | number>): Observable<Product[]> {
//     console.log("getProductsByCategoryIds is calling.....");
//     const normalized = Array.isArray(ids) ? ids.map((x) => String(x)) : [];
//     console.log("Request categories before API in normalized : ", normalized);

//     const requestBody = {
//       companyId: this.sellerService.getSellerId(),

//       sort: {
//         field: "",
//         order: "",
//       },

//       filters: {
//         priceRange: {
//           min: null,
//           max: null,
//         },
//         offerPercentage: {},
//         brand: [],
//       },

//       // ✅ Send categories to backend
//       categories: normalized.length ? normalized : null,

//       seeInv: "1",
//       seeServ: "1",
//       seeProd: "0",

//       invTaken: "0",
//       servTaken: "0",
//       prodTaken: "0",
//     };

//     return this.http.post<{ products: Product[] }>(this.url, requestBody).pipe(
//       tap((response) => {
//         console.log("Full API Response:", response);
//         console.log("Products:", response?.products);
//       }),

//       map((r) => r?.products || []),

//       catchError((err) => {
//         console.error("Category API Error:", err);
//         return of([]);
//       }),
//     );
//   }

//   // 🔥 Get products by multiple IDs (for Wishlist)
//   getProductsByIds(ids: string[]): Observable<Product[]> {
//     if (!ids || ids.length === 0) {
//       return of([]);
//     }
//     console.log("service - wish list ids", ids);
//     return this.http.get<{ products: Product[] }>(this.url).pipe(
//       map((res) => res?.products || []),
//       map((products) =>
//         products.filter((p) => ids.includes(p.ProductId?.toString())),
//       ),
//       catchError(() => of([])),
//     );
//   }

//   // getProductsByIds(ids: string[]): Observable<Product[]> {
//   //   if (!ids || ids.length === 0) {
//   //     return of([]);
//   //   }

//   //   const requestBody = {
//   //     companyId: "6954d2dfa8cca61b24a2ea12",

//   //     filters: {
//   //       productIds: ids, // ✅ backend must support this
//   //       priceRange: { min: null, max: null },
//   //       offerPercentage: {},
//   //       brand: [],
//   //     },

//   //     categories: null,

//   //     seeInv: "1",
//   //     seeServ: "1",
//   //     seeProd: "0",

//   //     invTaken: "0",
//   //     servTaken: "0",
//   //     prodTaken: "0",
//   //   };

//   //   return this.http.post<{ products: Product[] }>(this.url, requestBody).pipe(
//   //     map((res) => res?.products || []),
//   //     catchError((err) => {
//   //       console.error("Wishlist API Error:", err);
//   //       return of([]);
//   //     }),
//   //   );
//   // }
// }
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import {
  Observable,
  map,
  catchError,
  of,
  tap,
  BehaviorSubject,
  switchMap,
} from "rxjs";
import { Product, ProductDetail } from "../models/product.model";
import { BASE_URL, Img_BASE_URL } from "../utils/constant";
import { SellerService } from "./SellerService";
import { ActivatedRoute } from "@angular/router";
import { companyname } from "./../utils/constant";
import { ImageUrlService } from "../utils/ImageUrlService";

export interface ProductPageResponse {
  products: Product[];
  invTaken: number;
  servTaken: number;
  seeInv: number;
  seeServ: number;
}

@Injectable({ providedIn: "root" })
export class ProductService {
  //JSON call
  // private readonly url = "assets/getProducts.json";
  // API Call
  private readonly url = `${BASE_URL}/searchProductsManageOrderSeller`;
  private readonly searchvalueUrl = `${BASE_URL}/suggest`;
  private readonly ProductSearchurl = `${BASE_URL}/searchProductById`;
  private readonly prods_detail_url = "assets/getProductDetail.json";
  private readonly hero_products = "assets/heroBanner.json";
  displayHomeCategoryIds: string[] = [];

  setDisplayHomeCategoryIds(ids: string[]) {
    this.displayHomeCategoryIds = ids || [];

    console.log(
      "Updated displayHomeCategoryIds : ",
      this.displayHomeCategoryIds,
    );
  }
  constructor(
    private http: HttpClient,
    private sellerService: SellerService,
    private route: ActivatedRoute,
    private imageUrlService: ImageUrlService,
  ) {}

  private refreshProductsSource = new BehaviorSubject<void>(undefined);

  refreshProducts$ = this.refreshProductsSource.asObservable();

  triggerRefresh(): void {
    this.refreshProductsSource.next();
  }

  Deals: boolean = false;
  NewArrival: boolean = false;

  getProducts(): Observable<Product[]> {
    const loadSeller$ = this.sellerService.isSellerLoaded()
      ? of(this.sellerService.getSellerDetails())
      : this.sellerService.loadSellerDetails();

    return loadSeller$.pipe(
      switchMap(() => {
        console.log(
          "Request categories before API : ",
          this.displayHomeCategoryIds,
        );

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
          deals: this.Deals,
          newArrivals: this.NewArrival,
          categories: this.displayHomeCategoryIds,
          seeInv: "1",
          seeServ: "1",
          seeProd: "0",
          invTaken: "0",
          servTaken: "0",
          prodTaken: "0",
        };

        console.log("Request:", requestBody);

        return this.http
          .post<{ products: Product[] }>(this.url, requestBody)
          .pipe(
            tap((res) =>
              console.log("Products Inventory Response from DB:", res),
            ),
            map((res) =>
              (res?.products || []).map((p) => ({
                ...p,
                imageUrl: this.imageUrlService.buildImageUrl(
                  (p as any).ImageUrl || p.Image,
                  p.inventoryId,
                  p.isService ?? false,
                ),
              })),
            ),
          );
      }),
    );
  }

  getProductSuggestion(searchvalue: string): Observable<any[]> {
    console.log("Search value for suggestion :", searchvalue);

    const sellerId = this.sellerService.getSellerId();

    if (!sellerId) {
      console.warn("Seller ID not loaded yet");
      return of([]);
    }

    const requestBody = {
      companynameid: sellerId,
      searchvalue: searchvalue,
    };

    return this.http.post<any[]>(this.searchvalueUrl, requestBody).pipe(
      tap((res) => console.log("Products suggestions Response from DB:", res)),

      map((products) =>
        (products || []).map((p: any) => ({
          ...p,
          imageUrl: this.imageUrlService.buildImageUrl(
            p.ImageUrl || p.Image,
            p.inventoryId,
            p.isService ?? false,
          ),
        })),
      ),

      catchError((error) => {
        console.error("Error fetching product suggestions:", error);
        return of([]);
      }),
    );
  }

  getProductsBySearchname(
    search: string,
    categoryId: string,
  ): Observable<Product[]> {
    if (!this.sellerService.getSellerId()) {
      console.warn("Seller ID not loaded yet");
      return of([]);
    }

    const requestBody = {
      companyId: this.sellerService.getSellerId(),
      searchValue: search,
      sort: { field: "", order: "" },
      filters: {
        priceRange: { min: null, max: null },
        offerPercentage: {},
        brand: [],
      },
      categories: categoryId && categoryId !== "ALL" ? [categoryId] : null,
      seeInv: "1",
      seeServ: "1",
      seeProd: "0",
      invTaken: "0",
      servTaken: "0",
      prodTaken: "0",
    };

    return this.http.post<{ products: Product[] }>(this.url, requestBody).pipe(
      tap((response) => {
        console.log("Full API Response:", response);
        console.log("Products:", response?.products);
      }),

      map((r) => r?.products || []),

      catchError((err) => {
        console.error("Category API Error:", err);
        return of([]);
      }),
    );
  }

  getHeroProducts(): Observable<Product[]> {
    return this.http
      .get<{ products: Product[] }>(this.hero_products)
      .pipe(map((r) => r?.products || []));
  }

  getProductById(productId: string): Observable<ProductDetail | null> {
    const body = {
      productId: productId,
      companyId: this.sellerService.getSellerId(),
    };

    console.log("Get Product Request:", body);

    return this.http.post<any>(this.ProductSearchurl, body).pipe(
      map((res) => {
        console.log("Get Product Response:", res);

        // Your new API response
        const p = res?.products?.[0];

        if (!p) return null;

        const product: ProductDetail = {
          // ─────────────────────────────
          // Product Base
          // ─────────────────────────────
          ProductId: p.ProductId || "",

          ProductName: p.ProductName || "",

          ProductDescription: p.description || "",

          Brand: p.Brand || "",

          Size: p.Size || "",

          SellingPrice: p.SellingPrice || 0,

          OfferPrice: p.OfferPrice || 0,

          DiscountPercent: p.DiscountPercent || "0%",

          StockStatus: p.StockStatus || "In Stock",

          AvilableQty: p.AvilableQty || 0,

          // ─────────────────────────────
          // Category
          // ─────────────────────────────
          Category: p.Category
            ? {
                CategoryId: p.Category.CategoryId || "",
                CategoryName: p.Category.CategoryName || "",
              }
            : undefined,

          // ─────────────────────────────
          // Images
          // ─────────────────────────────
          Image: p.Image || "",

          imageUrl: p.Image || "",

          ImageUrl: p.Image || "",

          // ─────────────────────────────
          // Inventory
          // ─────────────────────────────
          inventoryId: p.inventoryId || "",

          sellerid: p.sellerid || "",

          Batch_Id: p.Batch_Id || "",

          batch_unit: p.batch_unit || "",

          // ─────────────────────────────
          // Flags
          // ─────────────────────────────
          isService: (p.propertyAttributes?.length ?? 0) > 0 || false,

          isAttributePresent: p.isAttributePresent || false,

          addons: p.addons || [],

          propertyAttributes: p.propertyAttributes || [],

          // ─────────────────────────────
          // Variants
          // ─────────────────────────────
          variants:
            p.variants?.map((v: any) => ({
              variantsid: v.variantsid || "",

              variantsName: v.variantsName || "",

              SellingPrice: v.SellingPrice || 0,

              OfferPrice: v.OfferPrice || 0,

              DiscountPercent: v.DiscountPercent || "0%",

              StockStatus: v.StockStatus || "In Stock",

              AvilableQty: v.AvilableQty || 0,

              offerText: v.offerText || "",
            })) || [],

          // ─────────────────────────────
          // Default Selected Variant
          // ─────────────────────────────
          selectedVariant:
            p.variants?.length > 0
              ? {
                  variantsid: p.variants[0].variantsid || "",

                  variantsName: p.variants[0].variantsName || "",

                  SellingPrice: p.variants[0].SellingPrice || 0,

                  OfferPrice: p.variants[0].OfferPrice || 0,

                  DiscountPercent: p.variants[0].DiscountPercent || "0%",

                  StockStatus: p.variants[0].StockStatus || "In Stock",

                  AvilableQty: p.variants[0].AvilableQty || 0,

                  offerText: p.variants[0].offerText || "",
                }
              : null,

          // ─────────────────────────────
          // Optional Detail Fields
          // ─────────────────────────────
          Features: p.Features || [],

          Specifications: p.Specifications || {},

          SimilarProducts: p.SimilarProducts || [],

          CreatedAt: p.CreatedAt || "",
        };

        console.log("Mapped Product:", product);

        return product;
      }),
    );
  }

  getFullImages(
    userfolder: string,
    type: string,
    inventoryId: string,
    companyName: string,
  ) {
    return this.http.get<string[]>(`${Img_BASE_URL}/FullImages`, {
      params: {
        userfolder,
        type,
        inventoryId,
        companyName,
      },
    });
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

  // getProductsByCategoryIds(ids: Array<string | number>): Observable<Product[]> {
  //   console.log("getProductsByCategoryIds is calling.....");
  //   const normalized = Array.isArray(ids) ? ids.map((x) => String(x)) : [];
  //   console.log("Request categories before API in normalized : ", normalized);

  //   const requestBody = {
  //     companyId: this.sellerService.getSellerId(),

  //     sort: {
  //       field: "",
  //       order: "",
  //     },

  //     filters: {
  //       priceRange: {
  //         min: null,
  //         max: null,
  //       },
  //       offerPercentage: {},
  //       brand: [],
  //     },

  //     // ✅ Send categories to backend
  //     categories: normalized.length ? normalized : null,

  //     seeInv: "1",
  //     seeServ: "1",
  //     seeProd: "0",

  //     invTaken: "0",
  //     servTaken: "0",
  //     prodTaken: "0",
  //   };

  //   return this.http.post<{ products: Product[] }>(this.url, requestBody).pipe(
  //     tap((response) => {
  //       console.log("Full API Response:", response);
  //       console.log("Products:", response?.products);
  //     }),

  //     map((r) => r?.products || []),

  //     catchError((err) => {
  //       console.error("Category API Error:", err);
  //       return of([]);
  //     }),
  //   );
  // }

  getProductsByCategoryIds(
    ids: Array<string | number>,
    invTaken = 0,
    servTaken = 0,
    pageSize = 20,
  ): Observable<ProductPageResponse> {
    console.log("Pagination called ...");
    const normalized = Array.isArray(ids) ? ids.map((x) => String(x)) : [];

    const requestBody = {
      companyId: this.sellerService.getSellerId(),
      sort: { field: "", order: "" },
      filters: {
        priceRange: { min: null, max: null },
        offerPercentage: {},
        brand: [],
      },
      categories: normalized.length ? normalized : null,
      seeInv: "1",
      seeServ: "1",
      seeProd: "0",
      invTaken: String(invTaken),
      servTaken: String(servTaken),
      prodTaken: "0",
      pageSize,
    };

    return this.http.post<any>(this.url, requestBody).pipe(
      map((res) => ({
        products: (res?.products || []).map((p: any) => ({
          ...p,
          imageUrl: this.imageUrlService.buildImageUrl(
            p.ImageUrl || p.Image,
            p.inventoryId,
            p.isService ?? false,
          ),
        })),
        invTaken: res?.invTaken ?? invTaken,
        servTaken: res?.servTaken ?? servTaken,
        seeInv: res?.seeInv ?? 0,
        seeServ: res?.seeServ ?? 0,
      })),
      catchError((err) => {
        console.error("Category API Error:", err);
        return of({ products: [], invTaken, servTaken, seeInv: 0, seeServ: 0 });
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
