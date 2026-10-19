import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams } from "@angular/common/http";
import { Observable, map } from "rxjs";
// Adjust this path to wherever your environment file lives
import { BASE_URL } from "../../../common/utils/constant";
import { SellerService } from "../../../common/services/SellerService";

/* ----------------------------- Models ----------------------------- */

export interface CategoryOption {
  value: string;
  label: string;
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
  categoryId: string;
  quickadd: boolean;
  unit: string;
  product_type: string | null;
  brand: string;
  defaultImage: {
    fileName: string;
    isDefault: boolean;
    base64: string | null;
  }[];
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

/**
 * ⚠️ These two endpoints were not in the code you shared (the RN "AddInventory"
 * list screen calls them). Replace with your real paths / payloads.
 */
const LIST_ENDPOINT = "/GetInventory";
const DELETE_ENDPOINT = "/DeleteInventory";

@Injectable({ providedIn: "root" })
export class InventoryService {
  private http = inject(HttpClient);
  // private api = environment.apiUrl; // e.g. "https://api.farmerich.com"
  private api = BASE_URL;

  private sellerService = inject(SellerService);

  get companyId(): string {
    return String(this.sellerService.getSellerId() ?? "");
  }
  get companyName(): string {
    return String(this.sellerService.getCompanyName() ?? "");
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
    return this.http
      .post<any>(`${this.api}${LIST_ENDPOINT}`, { companyId: this.companyId })
      .pipe(
        map((res) =>
          Array.isArray(res) ? res : (res?.content ?? res?.data ?? []),
        ),
      );
  }

  remove(inventoryId: string): Observable<ApiResult> {
    return this.http.post<ApiResult>(`${this.api}${DELETE_ENDPOINT}`, {
      inventoryId,
      companyId: this.companyId,
    });
  }

  view(inventoryId: string): Observable<any> {
    return this.http.post<any>(`${this.api}/ViewProduct`, {
      inventoryId,
      companyId: this.companyId,
    });
  }

  categories(): Observable<CategoryOption[]> {
    return this.http
      .post<any>(`${this.api}/GetCategories`, { sellerId: this.companyId })
      .pipe(
        map((res) => {
          const out: CategoryOption[] = [];
          const walk = (nodes: any[]) =>
            (nodes ?? []).forEach((n) => {
              const value = n.id ?? n.category_Id;
              const label = n.category ?? n.category_name;
              if (value && label) out.push({ value: String(value), label });
              walk(n.children ?? n.childrensCategoryDTOList ?? []);
            });
          walk(res?.categories ?? res?.childrensCategoryDTOList ?? []);

          return [...new Map(out.map((c) => [c.value, c])).values()];
        }),
      );
  }

  images(inventoryId: string, productId: string): Observable<ProductImage[]> {
    const params = new HttpParams()
      .set("userfolder", "")
      .set("type", "uploadsProductImages")
      .set("inventoryId", inventoryId)
      .set("companyName", this.formatName(this.companyName))
      .set("productId", productId ?? "");
    return this.http.get<any[]>(`${this.api}/FullImages`, { params }).pipe(
      map((rows) =>
        (rows ?? []).map((img) => ({
          uri: img.base64?.startsWith("data:")
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
    const params = new HttpParams()
      .set("name", name)
      .set("companyId", this.companyId)
      .set("isService", false);
    return this.http.post<boolean>(`${this.api}/isValidName`, null, { params });
  }

  save(payload: InsertProductsPayload): Observable<ApiResult> {
    return this.http.post<ApiResult>(`${this.api}/InsertProducts`, payload);
  }
}
