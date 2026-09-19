import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable, tap } from "rxjs";

import { BASE_URL, companyname } from "../utils/constant";
import { SellerDetailsResponse } from "../models/SellerDetails.model";

@Injectable({
  providedIn: "root",
})
export class SellerService {
  private readonly apiUrl = `${BASE_URL}/GetSellerDetails`;

  // ✅ Reactive seller store
  private sellerSubject = new BehaviorSubject<SellerDetailsResponse | null>(
    null,
  );

  seller$ = this.sellerSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getRequestBody() {
    return {
      companyname: companyname,
    };
  }

  loadSellerDetails(): Observable<SellerDetailsResponse> {
    console.log("Before API call : ", companyname);
    return this.http
      .post<SellerDetailsResponse>(this.apiUrl, this.getRequestBody())
      .pipe(
        tap((res) => {
          console.log("Seller Loaded:", res);

          this.sellerSubject.next(res);

          localStorage.setItem("sellerDetails", JSON.stringify(res));
        }),
      );
  }

  // ✅ Restore seller after refresh
  restoreSellerFromStorage(): void {
    const data = localStorage.getItem("sellerDetails");

    if (data) {
      const parsed: SellerDetailsResponse = JSON.parse(data);
      this.sellerSubject.next(parsed);
    }
  }

  // ✅ Current seller object
  getSellerDetails(): SellerDetailsResponse | null {
    return this.sellerSubject.value;
  }

  // ✅ Helper getters
  getSellerId(): string {
    return this.sellerSubject.value?.sellerid || "";
  }

  getProfileImgPath(): string {
    return this.sellerSubject.value?.profileImgPath || "";
  }

  getCompanyName(): string {
    return this.sellerSubject.value?.companyname || "";
  }
  getDeliveryFee(): number {
    return this.sellerSubject.value?.deliveryFee || 0;
  }
  getOrderThreshold(): number {
    return this.sellerSubject.value?.orderThreshold || 0;
  }
  getCompanyMobile(): string {
    return this.sellerSubject.value?.companyMobile || "";
  }

  getServiceImageFolder(): string {
    return this.sellerSubject.value?.serviceImageFolder || "";
  }

  // ✅ Check loaded
  isSellerLoaded(): boolean {
    return !!this.sellerSubject.value?.sellerid;
  }

  // ✅ Clear seller
  clearSeller(): void {
    this.sellerSubject.next(null);
    localStorage.removeItem("sellerDetails");
  }
  getRewardConfig() {
    return (
      this.sellerSubject.value?.rewardsDTO ?? {
        RedeeemAmount: 0,
        RedeemPoints: 0,
        RewardAmount: 0,
        RewardPoints: 0,
      }
    );
  }
  getSellerPaymentDetails() {
    return (
      this.sellerSubject.value?.sellerPaymentDetails ?? {
        key: "",
        pay_Online_Link: "",
        secret_Key: "",
        upi_Id: "",
      }
    );
  }
}
