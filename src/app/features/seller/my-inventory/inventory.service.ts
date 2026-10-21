// import { Injectable, inject } from "@angular/core";
// import { HttpClient, HttpParams } from "@angular/common/http";
// import { Observable, map } from "rxjs";
// import { BASE_URL } from "../../../common/utils/constant";
// import { SellerService } from "../../../common/services/SellerService";

// /* ----------------------------- Models ----------------------------- */

// export interface CategoryOption {
//   value: string;
//   label: string;
// }

// export interface BatchDto {
//   _id: string;
//   variantName?: string;
//   productname?: string;
//   stock_availability?: number;
//   procurement_price?: number;
//   seller_price?: number;
//   margin_percentage?: number;
//   discount?: number;
//   offerPrice?: number;
//   active?: boolean;
// }

// export interface InventoryItem {
//   _id: string;
//   productid?: string;
//   productName: string;
//   productCategory?: { category_name?: string; category_Id?: string } | null;
//   sellerprice?: number;
//   batchid?: BatchDto | null;
//   variantBatches?: BatchDto[] | null;
//   deals?: boolean;
//   newArrivals?: boolean;
//   active?: boolean;
//   imageUrl?: string | null; // optional – show a thumbnail if your list API returns one
// }

// export interface ProductImage {
//   uri: string;
//   name: string;
//   type: string;
//   base64: string | null;
//   isDefault: boolean;
// }

// export interface VariantPayload {
//   _id: string | null;
//   variantName: string;
//   procumentPrice: number;
//   quantity: number;
//   sellingPrice: number;
//   margin: number;
//   discount: number;
//   offerPrice: number;
// }

// export interface InsertProductsPayload {
//   _id?: string | null; // inventory id (only when editing)
//   productId?: string | null; // product id (only when editing)
//   companyId: string;
//   companyName: string;
//   productName: string;
//   productDescription: string;
//   categoryId: string | null;
//   quickadd: boolean;
//   unit: string;
//   product_type: string | null;
//   brand: string;
//   /** null = leave the saved images untouched (edit mode, images failed to load) */
//   defaultImage:
//     | {
//         fileName: string;
//         isDefault: boolean;
//         base64: string | null;
//       }[]
//     | null;
//   productfeatureid: string | null;
//   minimumOrder: number;
//   expiry: string;
//   gst: string;
//   deals: boolean;
//   newArrivals: boolean;
//   variants: VariantPayload[];
// }

// export interface ApiResult {
//   success: boolean;
//   message: string;
//   productId?: string;
// }

// /* ----------------------------- Service ----------------------------- */

// const LIST_ENDPOINT = "/GetInventory";
// const DELETE_ENDPOINT = "/DeleteInventory";

// @Injectable({ providedIn: "root" })
// export class InventoryService {
//   private http = inject(HttpClient);
//   private api = BASE_URL;
//   private sellerService = inject(SellerService);

//   get companyId(): string {
//     return String(this.sellerService.getSellerId() ?? "");
//   }
//   get companyName(): string {
//     return String(this.sellerService.getCompanyName() ?? "");
//   }

//   /** Stops a request with a clear message instead of a backend ObjectId parse error. */
//   private requireCompany(): void {
//     if (!this.companyId) {
//       throw new Error(
//         "Store id is missing. Reload the page and sign in again.",
//       );
//     }
//   }

//   /** Mirrors RN `formattedfileName` and the backend folder naming. */
//   formatName(value: string | null | undefined): string {
//     return typeof value === "string"
//       ? value
//           .trim()
//           .replace(/[\/()]/g, "")
//           .replace(/\s+/g, "-")
//       : "";
//   }

//   list(): Observable<InventoryItem[]> {
//     this.requireCompany();
//     return this.http
//       .post<any>(`${this.api}${LIST_ENDPOINT}`, { companyId: this.companyId })
//       .pipe(
//         map((res) =>
//           Array.isArray(res) ? res : (res?.content ?? res?.data ?? []),
//         ),
//       );
//   }

//   remove(inventoryId: string): Observable<ApiResult> {
//     this.requireCompany();
//     return this.http.post<ApiResult>(`${this.api}${DELETE_ENDPOINT}`, {
//       inventoryId,
//       companyId: this.companyId,
//     });
//   }

//   view(inventoryId: string): Observable<any> {
//     this.requireCompany();
//     return this.http.post<any>(`${this.api}/ViewProduct`, {
//       inventoryId,
//       companyId: this.companyId,
//     });
//   }

//   /** Accepts both the buyer shape ({categories:[{id,category,children}]})
//    *  and the seller shape ({childrensCategoryDTOList:[{category_Id,category_name}]}). */
//   categories(): Observable<CategoryOption[]> {
//     this.requireCompany();
//     return this.http
//       .post<any>(`${this.api}/GetCategories`, { sellerId: this.companyId })
//       .pipe(
//         map((res) => {
//           const out: CategoryOption[] = [];
//           const walk = (nodes: any[]) =>
//             (nodes ?? []).forEach((n) => {
//               const value = n.id ?? n.category_Id;
//               const label = n.category ?? n.category_name;
//               if (value && label) out.push({ value: String(value), label });
//               walk(n.children ?? n.childrensCategoryDTOList ?? []);
//             });
//           walk(res?.categories ?? res?.childrensCategoryDTOList ?? []);

//           return [...new Map(out.map((c) => [c.value, c])).values()];
//         }),
//       );
//   }

//   /** Uses /SellerFullImages (objects with fileName/base64/type/isDefault).
//    *  The buyer /FullImages returns plain strings, so it can't be used here. */
//   images(inventoryId: string, productId: string): Observable<ProductImage[]> {
//     const params = new HttpParams()
//       .set("userfolder", "")
//       .set("type", "uploadsProductImages")
//       .set("inventoryId", inventoryId)
//       .set("companyName", this.formatName(this.companyName))
//       .set("productId", productId ?? "");
//     return this.http
//       .get<any[]>(`${this.api}/SellerFullImages`, { params })
//       .pipe(
//         map((rows) =>
//           (Array.isArray(rows) ? rows : [])
//             .filter(
//               (img) =>
//                 img && typeof img === "object" && img.fileName && img.base64,
//             )
//             .map((img) => ({
//               uri: String(img.base64).startsWith("data:")
//                 ? img.base64
//                 : `data:image/${img.type || "jpeg"};base64,${img.base64}`,
//               name: img.fileName,
//               type: `image/${img.type || "jpeg"}`,
//               base64: img.base64,
//               isDefault: !!img.isDefault,
//             })),
//         ),
//       );
//   }

//   suggest(
//     text: string,
//   ): Observable<{ id: string; productName: string; price: number }[]> {
//     return this.http
//       .post<
//         any[]
//       >(`${this.api}/suggest`, { searchvalue: text, companynameid: this.companyId })
//       .pipe(
//         map((rows) =>
//           (Array.isArray(rows) ? rows : []).map((r) => ({
//             id: r?.id,
//             productName: r?.productName ?? "",
//             price: Number(r?.price) || 0,
//           })),
//         ),
//       );
//   }

//   /** Backend returns `false` when the name already exists. */
//   isValidName(name: string): Observable<boolean> {
//     this.requireCompany();
//     const params = new HttpParams()
//       .set("name", name)
//       .set("companyId", this.companyId)
//       .set("isService", false);
//     return this.http.post<boolean>(`${this.api}/isValidName`, null, { params });
//   }

//   save(payload: InsertProductsPayload): Observable<ApiResult> {
//     this.requireCompany();
//     return this.http.post<ApiResult>(`${this.api}/InsertProducts`, payload);
//   }
// }
import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, map } from "rxjs";
import { BASE_URL } from "../../../common/utils/constant";
import { SellerService } from "../../../common/services/SellerService";

/* ----------------------------- Models ----------------------------- */

export interface CategoryOption {
  value: string;
  label: string;
  parent?: string | null; // parent category id
  parentLabel?: string | null;
  depth?: number; // 0 = top level
  path?: string; // "Oils › Groundnut"
}

export interface BatchDto {
  _id: string;
  variantName?: string;
  productname?: string;
  stock_availability?: number;
  procurement_price?: number;
  seller_price?: number;
  margin_percentage?: number;
  discount?: number;
  offerPrice?: number;
  active?: boolean;
}

export interface InventoryItem {
  _id: string;
  productid?: string;
  productName: string;
  productCategory?: { category_name?: string; category_Id?: string } | null;
  sellerprice?: number;
  batchid?: BatchDto | null;
  variantBatches?: BatchDto[] | null;
  deals?: boolean;
  newArrivals?: boolean;
  active?: boolean;
  imageUrl?: string | null; // optional – show a thumbnail if your list API returns one
}

export interface ProductImage {
  uri: string;
  name: string;
  type: string;
  base64: string | null;
  isDefault: boolean;
}

export interface VariantPayload {
  _id: string | null;
  variantName: string;
  procumentPrice: number;
  quantity: number;
  sellingPrice: number;
  margin: number;
  discount: number;
  offerPrice: number;
}

export interface InsertProductsPayload {
  _id?: string | null; // inventory id (only when editing)
  productId?: string | null; // product id (only when editing)
  companyId: string;
  companyName: string;
  productName: string;
  productDescription: string;
  categoryId: string | null;
  quickadd: boolean;
  unit: string;
  product_type: string | null;
  brand: string;
  /** null = leave the saved images untouched (edit mode, images failed to load) */
  defaultImage:
    | {
        fileName: string;
        isDefault: boolean;
        base64: string | null;
      }[]
    | null;
  productfeatureid: string | null;
  minimumOrder: number;
  expiry: string;
  gst: string;
  deals: boolean;
  newArrivals: boolean;
  variants: VariantPayload[];
}

export interface ApiResult {
  success: boolean;
  message: string;
  productId?: string;
}

/* ----------------------------- Service ----------------------------- */

const LIST_ENDPOINT = "/GetInventory";
const DELETE_ENDPOINT = "/DeleteInventory";

@Injectable({ providedIn: "root" })
export class InventoryService {
  private http = inject(HttpClient);
  private api = BASE_URL;
  private sellerService = inject(SellerService);

  get companyId(): string {
    return String(this.sellerService.getSellerId() ?? "");
  }
  get companyName(): string {
    return String(this.sellerService.getCompanyName() ?? "");
  }

  /** Stops a request with a clear message instead of a backend ObjectId parse error. */
  private requireCompany(): void {
    if (!this.companyId) {
      throw new Error(
        "Store id is missing. Reload the page and sign in again.",
      );
    }
  }

  /** Mirrors RN `formattedfileName` and the backend folder naming. */
  formatName(value: string | null | undefined): string {
    return typeof value === "string"
      ? value
          .trim()
          .replace(/[\/()]/g, "")
          .replace(/\s+/g, "-")
      : "";
  }

  list(): Observable<InventoryItem[]> {
    this.requireCompany();
    return this.http
      .post<any>(`${this.api}${LIST_ENDPOINT}`, { companyId: this.companyId })
      .pipe(
        map((res) =>
          Array.isArray(res) ? res : (res?.content ?? res?.data ?? []),
        ),
      );
  }

  remove(inventoryId: string): Observable<ApiResult> {
    this.requireCompany();
    return this.http.post<ApiResult>(`${this.api}${DELETE_ENDPOINT}`, {
      inventoryId,
      companyId: this.companyId,
    });
  }

  view(inventoryId: string): Observable<any> {
    this.requireCompany();
    return this.http.post<any>(`${this.api}/ViewProduct`, {
      inventoryId,
      companyId: this.companyId,
    });
  }

  /** Accepts both the buyer shape ({categories:[{id,category,children}]})
   *  and the seller shape ({childrensCategoryDTOList:[{category_Id,category_name}]}).
   *  Returned flat, parents before their children, with a readable path. */
  categories(): Observable<CategoryOption[]> {
    this.requireCompany();
    return this.http
      .post<any>(`${this.api}/GetCategories`, { sellerId: this.companyId })
      .pipe(
        map((res) => {
          const out: CategoryOption[] = [];
          const walk = (nodes: any[], parent: CategoryOption | null) =>
            (nodes ?? []).forEach((n) => {
              const value = n.id ?? n.category_Id;
              const label = n.category ?? n.category_name;
              let me = parent;
              if (value && label) {
                const opt: CategoryOption = {
                  value: String(value),
                  label,
                  parent: parent?.value ?? null,
                  parentLabel: parent?.label ?? null,
                  depth: parent ? (parent.depth ?? 0) + 1 : 0,
                  path: parent
                    ? `${parent.path ?? parent.label} › ${label}`
                    : label,
                };
                out.push(opt);
                me = opt;
              }
              walk(n.children ?? n.childrensCategoryDTOList ?? [], me);
            });
          walk(res?.categories ?? res?.childrensCategoryDTOList ?? [], null);

          return [...new Map(out.map((c) => [c.value, c])).values()];
        }),
      );
  }

  /** Creates a category owned by this store (multipart, same as the admin screen). */
  createCategory(p: {
    name: string;
    parentId?: string | null;
    description?: string;
    displayOnHomePage: boolean;
    cover?: File | null;
  }): Observable<any> {
    this.requireCompany();
    const fd = new FormData();
    fd.append("category_name", p.name);
    fd.append("companyName", this.companyName);
    if (p.parentId) fd.append("parent_id", p.parentId);
    if (p.description) fd.append("description", p.description);
    fd.append("displayOnHomePage", String(p.displayOnHomePage));
    fd.append("sellerids", this.companyId); // links the category to this store
    if (p.cover)
      fd.append("coverImage", p.cover, this.formatName(p.cover.name));
    // no Content-Type header: the browser sets the multipart boundary itself
    return this.http.post<any>(`${this.api}/SaveCategory`, fd);
  }

  /** Uses /SellerFullImages (objects with fileName/base64/type/isDefault).
   *  The buyer /FullImages returns plain strings, so it can't be used here. */
  images(inventoryId: string, productId: string): Observable<ProductImage[]> {
    const params = new HttpParams()
      .set("userfolder", "")
      .set("type", "uploadsProductImages")
      .set("inventoryId", inventoryId)
      .set("companyName", this.formatName(this.companyName))
      .set("productId", productId ?? "");
    return this.http
      .get<any[]>(`${this.api}/SellerFullImages`, { params })
      .pipe(
        map((rows) =>
          (Array.isArray(rows) ? rows : [])
            .filter(
              (img) =>
                img && typeof img === "object" && img.fileName && img.base64,
            )
            .map((img) => ({
              uri: String(img.base64).startsWith("data:")
                ? img.base64
                : `data:image/${img.type || "jpeg"};base64,${img.base64}`,
              name: img.fileName,
              type: `image/${img.type || "jpeg"}`,
              base64: img.base64,
              isDefault: !!img.isDefault,
            })),
        ),
      );
  }

  suggest(
    text: string,
  ): Observable<{ id: string; productName: string; price: number }[]> {
    return this.http
      .post<
        any[]
      >(`${this.api}/suggest`, { searchvalue: text, companynameid: this.companyId })
      .pipe(
        map((rows) =>
          (Array.isArray(rows) ? rows : []).map((r) => ({
            id: r?.id,
            productName: r?.productName ?? "",
            price: Number(r?.price) || 0,
          })),
        ),
      );
  }

  /** Backend returns `false` when the name already exists. */
  isValidName(name: string): Observable<boolean> {
    this.requireCompany();
    const params = new HttpParams()
      .set("name", name)
      .set("companyId", this.companyId)
      .set("isService", false);
    return this.http.post<boolean>(`${this.api}/isValidName`, null, { params });
  }

  save(payload: InsertProductsPayload): Observable<ApiResult> {
    this.requireCompany();
    return this.http.post<ApiResult>(`${this.api}/InsertProducts`, payload);
  }
}
