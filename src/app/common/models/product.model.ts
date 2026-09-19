// src/app/common/models/product.model.ts

// ─────────────────────────────────────────────
//  Variant
// ─────────────────────────────────────────────
export interface Variant {
  /** Unique within the parent product — used as the cart key  */
  variantsid: string;
  /** Display label e.g. "1 kg", "10 kg - Pouch" */
  variantsName: string;

  // Prices (mirrors top-level product shape)
  SellingPrice: number | string;
  OfferPrice?: string | number;
  DiscountPercent?: string;

  StockStatus?: string;
  AvilableQty?: number;
  Brand?: string;

  /** Human-readable savings label shown on the variant pill, e.g. "₹80 OFF" */
  offerText?: string;
}

// ─────────────────────────────────────────────
//  Sub-images
// ─────────────────────────────────────────────
export interface SubImage {
  url: string;
  alt?: string;
  order?: number;
}

export interface DefaultImage {
  url: string;
  alt?: string;
}

// ─────────────────────────────────────────────
//  Category (embedded)
// ─────────────────────────────────────────────
export interface ProductCategory {
  CategoryId: string;
  CategoryName: string;
}

// ─────────────────────────────────────────────
//  Base Product (list view)
// ─────────────────────────────────────────────
export interface Product {
  ProductId: string | number;
  ProductName: string;
  ProductDescription: string;
  propertyAttributes?: any;

  SellingPrice: number | string;
  OfferPrice?: string | number;
  DiscountPercent?: string;

  Brand?: string;
  Size?: string;
  Gender?: string | null;
  Speed?: string | null;
  StockStatus?: string;
  AvilableQty?: number;

  Category?: ProductCategory;

  Image?: string;
  ImageUrl?: string;
  ImageWebp?: string;
  /** Convenience alias set at runtime */
  imageUrl?: string;

  SubImages?: SubImage[];
  DefaultImage?: DefaultImage;

  isService?: boolean;
  addons?: string[] | null;
  isAttributePresent?: boolean;

  /** Variant list — present only on products with size/weight options */
  variants?: Variant[];

  /**
   * Runtime-only: whichever variant is currently active on this card.
   * Set by the component; never comes from the API.
   */
  selectedVariant?: Variant | null;

  CreatedAt?: string;
  inventoryId?: string;
  sellerid?: string;
  Batch_Id?: string;
  batch_unit?: string;
}

// ─────────────────────────────────────────────
//  ProductDetail (detail view — superset of Product)
// ─────────────────────────────────────────────
export interface ProductDetail extends Product {
  SimilarProducts?: number[];
  Features?: string[];
  Specifications?: Record<string, string>;
}
