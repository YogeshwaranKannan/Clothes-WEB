import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class OrderStateService {
  orderRefNo = "";
  save_id = "";

  clear() {
    this.orderRefNo = "";
    this.save_id = "";
    sessionStorage.removeItem("pending_save_id");
  }
}
