// import { Injectable } from "@angular/core";
// import { HttpClient } from "@angular/common/http";
// import { Observable, map } from "rxjs";
// import {
//   Category,
//   CategoryResponse,
//   GroupedCategory,
//   CategoryItem,
//   DescriptionBlock,
// } from "../models/category.model";

// @Injectable({ providedIn: "root" })
// export class CategoryService {
//   private readonly apiUrl = "http://192.168.1.8:8080/api/buyer/GetCategories";

//   // getGroupedCategories(): Observable<GroupedCategory[]> {
//   //   const requestBody = {
//   //     sellerId: "6954d2dfa8cca61b24a2ea12",
//   //     // "categories_ID": [ "67bfee576a5bacdf1bcb0ce7"]
//   //   };

//   constructor(private http: HttpClient) {}

//   getCategories(): Observable<Category[]> {
//     return this.http
//       .post<CategoryResponse>(this.apiUrl)
//       .pipe(map((res) => res.categories || []));
//   }

//   getGroupedCategories(): Observable<GroupedCategory[]> {
//     return this.http.post<CategoryResponse>(this.apiUrl).pipe(
//       map((res) => {
//         const cats = res.categories || [];

//         const fallbackDescriptions: Record<string, string> = {
//           "Cycling Apparel":
//             "Gear up with premium Cycling Apparel and Accessories.",
//           "Bicycle Components":
//             "Upgrade your ride with high-performance Bicycle Components.",
//           "Bicycle Accessories":
//             "Enhance your ride with useful Bicycle Accessories.",
//         };

//         // ── FIX: leaf = any node with no children, coverImage no longer required ──
//         function collectLeafItems(node: any, out: CategoryItem[]) {
//           if (!node) return;
//           if (!node.children || !node.children.length) {
//             // This node is a leaf — push it regardless of coverImage
//             out.push({
//               id: 1,
//               category: node.category,
//               coverImage: node.coverImage ?? "",
//             });
//             return;
//           }
//           node.children.forEach((c: any) => collectLeafItems(c, out));
//         }

//         function parseDescription(
//           raw: string | undefined,
//           fallback: string,
//         ): DescriptionBlock {
//           if (!raw) return { structured: false, text: fallback };

//           const parts = raw.split("|");
//           const kv: Record<string, string> = {};
//           for (const part of parts) {
//             const colon = part.indexOf(":");
//             if (colon === -1) continue;
//             kv[part.slice(0, colon).trim()] = part.slice(colon + 1).trim();
//           }

//           const h2 = kv["header2"] ?? kv["heaer2"]; // tolerate JSON typo
//           if (kv["header1"] && h2) {
//             const items = Object.keys(kv)
//               .filter((k) => /^p\d+$/.test(k))
//               .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))
//               .map((k) => kv[k]);
//             return {
//               structured: true,
//               header1: kv["header1"],
//               header2: h2,
//               items,
//             };
//           }

//           return { structured: false, text: raw };
//         }

//         const grouped: GroupedCategory[] = cats
//           .map((top: any) => {
//             const items: CategoryItem[] = [];
//             if (top.children && top.children.length) {
//               top.children.forEach((c: any) => collectLeafItems(c, items));
//             } else {
//               // ── FIX: top-level leaf (e.g. LUNCH) — push the top node itself ──
//               items.push({
//                 id: 1,
//                 category: top.category,
//                 coverImage: top.coverImage ?? "",
//               });
//             }

//             const fallback =
//               fallbackDescriptions[top.category] ||
//               "Explore our selections and curated categories.";

//             return {
//               id: 1,
//               category: top.category,
//               description: (top as any).Description ?? fallback,
//               descriptionBlock: parseDescription(
//                 (top as any).Description,
//                 fallback,
//               ),
//               items,
//             } as GroupedCategory;
//           })
//           // Keep groups that have at least one item (items always has ≥1 now)
//           .filter((g) => g.items && g.items.length > 0);

//         return grouped;
//       }),
//     );
//   }
// }

import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, map, of } from "rxjs";
import {
  Category,
  CategoryResponse,
  GroupedCategory,
  CategoryItem,
  DescriptionBlock,
  CategoryNavState,
} from "../models/category.model";
import { BASE_URL } from "../utils/constant";
import { SellerService } from "./SellerService";
import { ProductService } from "./product.service copy";

@Injectable({ providedIn: "root" })
export class CategoryService {
  //API Call
  private readonly apiUrl = `${BASE_URL}/GetCategories`;
  //JSON Call
  // private readonly apiUrl = "assets/getCategories.json";
  // private readonly apiUrl =
  // "https://dev.fr.api.intellesyde.com/api/buyer/GetCategories";

  constructor(
    private http: HttpClient,
    private sellerService: SellerService,
    private ProductService: ProductService,
  ) {}

  private getRequestBody() {
    const sellerId = this.sellerService.getSellerId();

    if (!sellerId) {
      throw new Error("Seller ID not loaded");
    }

    return {
      sellerId,
    };
  }

  getCategories(): Observable<Category[]> {
    const sellerId = this.sellerService.getSellerId();

    // ✅ Prevent invalid API call
    if (!sellerId) {
      console.warn("Seller ID not loaded yet");
      return of([]);
    }

    return this.http.post<CategoryResponse>(this.apiUrl, { sellerId }).pipe(
      map((res) => {
        console.log("Category response : ", res.categories);
        return res.categories || [];
      }),
    );
  }

  getGroupedCategories(): Observable<GroupedCategory[]> {
    const sellerId = this.sellerService.getSellerId();

    // ✅ Prevent invalid API call
    if (!sellerId) {
      console.warn("Seller ID not loaded yet");
      return of([]);
    }
    return this.http.post<CategoryResponse>(this.apiUrl, { sellerId }).pipe(
      map((res) => {
        const cats = res.categories || [];

        console.log("Grouped categories in service: ", cats);

        const fallbackDescriptions: Record<string, string> = {
          "Cycling Apparel":
            "Gear up with premium Cycling Apparel and Accessories.",
          "Bicycle Components":
            "Upgrade your ride with high-performance Bicycle Components.",
          "Bicycle Accessories":
            "Enhance your ride with useful Bicycle Accessories.",
        };
        const displayOnHomeIds: string[] = [];

        function collectLeafItems(node: any, out: CategoryItem[]) {
          if (!node) return;

          if (!node.children || !node.children.length) {
            if (node.isDisplayOnHome === true && node.id) {
              displayOnHomeIds.push(String(node.id));
            }
            out.push({
              // id: String(node.id),
              id: String(1),
              category: node.category,
              coverImage: node.coverImage ?? "",
              isDisplayOnHome: node.isDisplayOnHome,
            });
            return;
          }

          node.children.forEach((c: any) => collectLeafItems(c, out));
        }

        function parseDescription(
          raw: string | undefined,
          fallback: string,
        ): DescriptionBlock {
          if (!raw) return { structured: false, text: fallback };

          const parts = raw.split("|");
          const kv: Record<string, string> = {};

          for (const part of parts) {
            const colon = part.indexOf(":");
            if (colon === -1) continue;
            kv[part.slice(0, colon).trim()] = part.slice(colon + 1).trim();
          }

          const h2 = kv["header2"] ?? kv["heaer2"];

          if (kv["header1"] && h2) {
            const items = Object.keys(kv)
              .filter((k) => /^p\d+$/.test(k))
              .sort((a, b) => parseInt(a.slice(1)) - parseInt(b.slice(1)))
              .map((k) => kv[k]);

            return {
              structured: true,
              header1: kv["header1"],
              header2: h2,
              items,
            };
          }

          return { structured: false, text: raw };
        }

        const grouped: GroupedCategory[] = cats
          .map((top: any) => {
            const items: CategoryItem[] = [];

            if (top.isDisplayOnHome === true && top.id) {
              displayOnHomeIds.push(String(top.id));
            }
            // console.log("ID-> ", top.id);
            if (top.children && top.children.length) {
              top.children.forEach((c: any) => collectLeafItems(c, items));
            } else {
              items.push({
                id: String(top.id),
                // id: String(1),
                category: top.category,
                coverImage: top.coverImage ?? "",
                isDisplayOnHome: top.isDisplayOnHome,
              });
            }

            // console.log("Items : ", items);

            const fallback =
              fallbackDescriptions[top.category] ||
              "Explore our selections and curated categories.";

            return {
              id: String(top.id),
              // id: String(1),
              category: top.category,
              description: (top as any).Description ?? fallback,
              descriptionBlock: parseDescription(
                (top as any).Description,
                fallback,
              ),
              items,
              isDisplayOnHome: top.isDisplayOnHome,
            } as GroupedCategory;
          })
          .filter(
            (g) => g.items && g.items.length > 0 && g.isDisplayOnHome === true,
          );
        const uniqueDisplayIds = [...new Set(displayOnHomeIds)];

        this.ProductService.setDisplayHomeCategoryIds(uniqueDisplayIds);

        console.log("Display On Home Category IDs : ", uniqueDisplayIds);

        console.log("final grouped : ", grouped);
        return grouped;
      }),
    );
  }
}
