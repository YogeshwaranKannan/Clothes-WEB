import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class OrderSearchService {
  private readonly orderSearchSubject = new BehaviorSubject<string>("");

  readonly orderSearch$ = this.orderSearchSubject.asObservable();

  searchOrders(value: string): void {
    this.orderSearchSubject.next(value.trim());
  }

  clearOrderSearch(): void {
    this.orderSearchSubject.next("");
  }
}
