import { Injectable } from "@angular/core";
import { Product_URL, Service_URL } from "./constant";
import { SellerService } from "../services/SellerService";

@Injectable({
  providedIn: "root",
})
export class ImageUrlService {
  constructor(private sellerService: SellerService) {}

  buildImageUrl(
    relative?: string,
    inventoryId?: string,
    isService: boolean = false,
  ): string {
    const FALLBACK = "/assets/placeholder-bike.svg";

    const companyName = this.sellerService.getCompanyName();
    const serviceImageFolder = this.sellerService.getServiceImageFolder();

    // console.log("buildImageUrl INPUT:", {
    //   relative,
    //   inventoryId,
    //   isService,
    //   companyName,
    //   serviceImageFolder,
    // });

    if (!relative?.trim()) {
      return FALLBACK;
    }

    const image = relative.trim();

    if (/^https?:\/\//i.test(image)) {
      return image;
    }

    if (image.startsWith("assets/") || image.startsWith("/assets/")) {
      return `/${image.replace(/^\/+/, "")}`;
    }

    if (!inventoryId) {
      console.log("Missing inventoryId");
      return FALLBACK;
    }

    const formattedCompanyName = companyName
      .trim()
      .replace(/[\/()]/g, "")
      .replace(/\s+/g, "-");

    const cleanFolder = serviceImageFolder
      .trim()
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");

    let finalUrl: string;

    if (isService) {
      finalUrl = `${Service_URL}${cleanFolder}/${inventoryId}/${image}`;
    } else {
      finalUrl = `${Product_URL}/${formattedCompanyName}/${inventoryId}/${image}`;
    }

    // console.log("FINAL IMAGE URL:", finalUrl);

    return finalUrl;
  }
}
