// import { Injectable } from "@angular/core";
// import { Product_URL, Service_URL } from "./constant";
// import { SellerService } from "../services/SellerService";

// @Injectable({
//   providedIn: "root",
// })
// export class ImageUrlService {
//   constructor(private sellerService: SellerService) {}

//   buildImageUrl(
//     relative?: string,
//     inventoryId?: string,
//     isService: boolean = false,
//   ): string {
//     const FALLBACK = "/assets/placeholder-bike.svg";

//     const companyName = this.sellerService.getCompanyName();
//     const serviceImageFolder = this.sellerService.getServiceImageFolder();

//     // console.log("buildImageUrl INPUT:", {
//     //   relative,
//     //   inventoryId,
//     //   isService,
//     //   companyName,
//     //   serviceImageFolder,
//     // });

//     if (!relative?.trim()) {
//       return FALLBACK;
//     }

//     const image = relative.trim();

//     if (/^https?:\/\//i.test(image)) {
//       return image;
//     }

//     if (image.startsWith("assets/") || image.startsWith("/assets/")) {
//       return `/${image.replace(/^\/+/, "")}`;
//     }

//     if (!inventoryId) {
//       console.log("Missing inventoryId");
//       return FALLBACK;
//     }

//     const formattedCompanyName = companyName
//       .trim()
//       .replace(/[\/()]/g, "")
//       .replace(/\s+/g, "-");

//     const cleanFolder = serviceImageFolder
//       .trim()
//       .replace(/^\/+/, "")
//       .replace(/\/+$/, "");

//     let finalUrl: string;

//     if (isService) {
//       finalUrl = `${Service_URL}${cleanFolder}/${inventoryId}/${image}`;
//     } else {
//       finalUrl = `${Product_URL}/${formattedCompanyName}/${inventoryId}/${image}`;
//     }

//     // console.log("FINAL IMAGE URL:", finalUrl);

//     return finalUrl;
//   }
// }
import { Injectable } from "@angular/core";
import { Product_URL, Service_URL, isS3Enabled, BASE_URL } from "./constant";
import { SellerService } from "../services/SellerService";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { firstValueFrom } from "rxjs";

interface CachedImageUrl {
  url: string;
  expiresAt: number;
}

@Injectable({
  providedIn: "root",
})
export class ImageUrlService {
  private readonly FALLBACK = "/assets/placeholder-bike.png";

  // Presigned URLs are valid for 30 min on the backend, so cache for 25.
  private readonly URL_TTL_MS = 25 * 60 * 1000;

  // Missing images: don't hit the backend again for a few minutes.
  private readonly NOT_FOUND_TTL_MS = 5 * 60 * 1000;

  private urlCache = new Map<string, CachedImageUrl>();

  private inFlight = new Map<string, Promise<string>>();

  constructor(
    private sellerService: SellerService,
    private http: HttpClient,
  ) {}

  async buildImageUrl(
    relative?: string,
    inventoryId?: string,
    isService: boolean = false,
  ): Promise<string> {
    const FALLBACK = this.FALLBACK;

    if (!relative?.trim()) {
      return FALLBACK;
    }

    const image = relative.trim();

    // Already a complete URL
    if (/^https?:\/\//i.test(image)) {
      return image;
    }

    // Angular assets
    if (image.startsWith("assets/") || image.startsWith("/assets/")) {
      return `/${image.replace(/^\/+/, "")}`;
    }

    if (!inventoryId?.trim()) {
      console.warn("ImageUrlService: Missing inventoryId");
      return FALLBACK;
    }

    const companyName = this.sellerService.getCompanyName();

    if (!companyName?.trim()) {
      console.warn("ImageUrlService: Missing companyName");
      return FALLBACK;
    }

    const formattedCompanyName = companyName
      .trim()
      .replace(/[\/()]/g, "")
      .replace(/\s+/g, "-");

    const cleanInventoryId = inventoryId.trim();

    /*
     * =====================================================
     * LOCAL STORAGE
     * =====================================================
     */
    if (!isS3Enabled) {
      const serviceImageFolder = this.sellerService.getServiceImageFolder();

      const cleanFolder =
        serviceImageFolder?.trim().replace(/^\/+/, "").replace(/\/+$/, "") ||
        "";

      let finalUrl: string;

      if (isService) {
        finalUrl =
          `${Service_URL}` +
          `${cleanFolder}/` +
          `${cleanInventoryId}/` +
          `${image}`;
      } else {
        finalUrl =
          `${Product_URL}/` +
          `${formattedCompanyName}/` +
          `${cleanInventoryId}/` +
          `${image}`;
      }

      return finalUrl;
    }

    /*
     * =====================================================
     * S3 STORAGE
     * =====================================================
     */
    const imageType = isService ? "service" : "product";

    const cacheKey =
      `${imageType}:` +
      `${formattedCompanyName}:` +
      `${cleanInventoryId}:` +
      `${image}`;

    // Cache (covers both found URLs and recently-missing images)
    const cached = this.urlCache.get(cacheKey);

    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }

    if (cached) {
      this.urlCache.delete(cacheKey);
    }

    // Reuse an existing in-flight request
    const existingRequest = this.inFlight.get(cacheKey);

    if (existingRequest) {
      return existingRequest;
    }

    const endpoint = isService ? "ServiceImageUrl" : "ProductImageUrl";

    const request = firstValueFrom(
      this.http.get<{ url: string | null }>(`${BASE_URL}/${endpoint}`, {
        params: {
          companyName: formattedCompanyName,
          inventoryId: cleanInventoryId,
          fileName: image,
        },
      }),
    )
      .then((response) => {
        const url = response?.url;

        if (!url) {
          // Backend answered but gave no url -> treat as "no image"
          this.cacheUrl(cacheKey, FALLBACK, this.NOT_FOUND_TTL_MS);
          return FALLBACK;
        }

        this.cacheUrl(cacheKey, url, this.URL_TTL_MS);
        return url;
      })
      .catch((error: HttpErrorResponse) => {
        if (error?.status === 404) {
          // Image not in S3: expected case, fall back quietly and remember it
          console.warn(`S3 ${imageType} image not found: ${image}`);
          this.cacheUrl(cacheKey, FALLBACK, this.NOT_FOUND_TTL_MS);
        } else {
          // Real failure (500 / network): don't cache, so it retries next time
          console.error(`Error getting S3 ${imageType} image URL:`, error);
        }

        return FALLBACK;
      })
      .finally(() => {
        this.inFlight.delete(cacheKey);
      });

    this.inFlight.set(cacheKey, request);

    return request;
  }

  private cacheUrl(key: string, url: string, ttlMs: number): void {
    this.urlCache.set(key, { url, expiresAt: Date.now() + ttlMs });
  }

  clearImageCache(
    relative?: string,
    inventoryId?: string,
    isService: boolean = false,
  ): void {
    const companyName = this.sellerService.getCompanyName();

    if (!relative || !inventoryId || !companyName) {
      return;
    }

    const formattedCompanyName = companyName
      .trim()
      .replace(/[\/()]/g, "")
      .replace(/\s+/g, "-");

    const cacheKey =
      `${isService ? "service" : "product"}:` +
      `${formattedCompanyName}:` +
      `${inventoryId.trim()}:` +
      `${relative.trim()}`;

    this.urlCache.delete(cacheKey);
    this.inFlight.delete(cacheKey);
  }

  clearAllImageCache(): void {
    this.urlCache.clear();
    this.inFlight.clear();
  }
}
