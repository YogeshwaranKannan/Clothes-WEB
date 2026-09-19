import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, map } from "rxjs";
import { ChottaOrder } from "../models/chotta.model";
import { BASE_URL, companyname } from "../utils/constant";

@Injectable({ providedIn: "root" })
export class ChottaService {
  private http = inject(HttpClient);
  private readonly url = `${BASE_URL}/GetSellerDetails`;

  // getOrders(): Observable<ChottaOrder[]> {
  //   return this.http
  //     .get<{ orders: ChottaOrder[] }>('/assets/delivery-picup.json')
  //     .pipe(map((r) => r?.orders ?? []));
  // }

  getOrders(): Observable<ChottaOrder[]> {
    return this.http
      .post<any>(this.url, {
        companyname: companyname,
      })
      .pipe(
        map((res) => {
          console.log("Seller Details Response:", res);

          const result: ChottaOrder[] = [];

          // ─────────────────────────────
          // Delivery Areas
          // ─────────────────────────────
          if (res?.deliveryAreas?.length) {
            res.deliveryAreas.forEach((d: any) => {
              result.push({
                sellerId: res.sellerid || "",

                addressType: "DELIVERY",

                default: false,

                address: {
                  city: d.city || "",
                  pincode: d.pincode || "",
                },
              });
            });
          }

          // ─────────────────────────────
          // Pickup Points
          // ─────────────────────────────
          if (res?.pickupPoints?.length) {
            res.pickupPoints.forEach((p: any, index: number) => {
              if (p?.active === false) return;

              result.push({
                sellerId: res.sellerid || "",

                addressType: "PICKUP",

                default: index === 0,

                address: {
                  PickupPointName: p?.address?.PickupPointname || "",
                  Address1: p?.address?.address_line1 || "",
                  Address2: p?.address?.address_line2 || "",
                  areaName: p?.address?.city || "",
                  pincode: p?.address?.pincode || "",
                },
              });
            });
          }

          console.log("Mapped Orders:", result);

          return result;
        }),
      );
  }
}
