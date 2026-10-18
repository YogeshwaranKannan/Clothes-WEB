import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of, map } from "rxjs";
import {
  OrderDetail,
  Order,
  Payment,
  Expense,
  SitesAccountSummaryTrailer,
} from "../models/orders.model";
import { BASE_URL, host, notification_URL } from "../utils/constant";
import { AuthService } from "../../core/auth/auth.service";

@Injectable({ providedIn: "root" })
export class OrderService {
  private readonly url = `${BASE_URL}/getAllOrders`;
  // private readonly url = "assets/getOrder.json";
  private readonly order_details_url = "assets/getOrderDetails.json";
  private readonly payment_url = "assets/sitePaymentDetails.json";
  private readonly expense_url = "assets/siteExpenseDetails.json";

  constructor(
    private http: HttpClient,
    private auth: AuthService,
  ) {}

  // getAllOrders(): Observable<Order[]> {
  //   return this.http
  //     .get<{ orders: Order[] }>(this.url)
  //     .pipe(map((r) => r?.orders || []));
  // }
  getAllOrders(): Observable<Order[]> {
    const buyerId = this.auth.user()?.id;

    return this.http.post<Order[]>(this.url, {
      buyerid: buyerId,
    });
  }
  getAccountSummary(): Observable<SitesAccountSummaryTrailer | null> {
    return this.http
      .get<{ sitesAccountSummaryTrailer: SitesAccountSummaryTrailer }>(this.url)
      .pipe(map((r) => r?.sitesAccountSummaryTrailer ?? null));
  }

  /** Look up a single order by its order_id from the local JSON file. */
  getOrderById(id: string): Observable<OrderDetail | null> {
    return this.http.get<{ orders: OrderDetail[] }>(this.url).pipe(
      map((r) => r?.orders ?? []),
      map((arr) => arr.find((o) => o.order_id === id) ?? null),
    );
  }

  /**
   * Look up an order from the LOCAL JSON file by a reference number.
   *
   * Matching is intentionally flexible:
   *   • Exact match on `order_id`  (e.g. "ORD-2001")
   *   • Case-insensitive match on `order_id`
   *   • Match on a top-level `refno` field if the model carries one
   *
   * Used by the Track My Order flow that navigates to /track-order/:refNo.
   * For the live-API variant keep using `getOrderByRef()` below.
   */
  getOrderByRefFromJson(refNo: string): Observable<OrderDetail | null> {
    const needle = refNo.trim().toLowerCase();

    return this.http
      .get<{ orders: OrderDetail[] }>(this.order_details_url)
      .pipe(
        map((r) => r?.orders ?? []),
        map(
          (arr) =>
            arr.find(
              (o) =>
                // match order_id case-insensitively
                (o.order_id ?? "").toLowerCase() === needle ||
                // also match a dedicated refno field when present
                ((o as any).refno ?? "").toLowerCase() === needle,
            ) ?? null,
        ),
      );
  }

  // ── Payment / Expense helpers ─────────────────────────────────────────────

  getPaymentByJobId(orderId: string): Observable<Payment[]> {
    return this.http
      .get<{ sitePaymentDetails: Payment[] }>(this.payment_url)
      .pipe(
        map((response) => {
          const list = response?.sitePaymentDetails ?? [];
          return list.filter((payment) => {
            const jobCardStr = String(payment.jobCard ?? "");
            return jobCardStr === orderId || payment.order_id === orderId;
          });
        }),
      );
  }

  getExpenseByJobId(orderId: string): Observable<Expense[]> {
    return this.http
      .get<{ siteExpenseDetails: Expense[] }>(this.expense_url)
      .pipe(
        map((response) => {
          const list = response?.siteExpenseDetails ?? [];
          return list.filter((expense) => {
            const jobCardStr = String(expense.jobCard ?? "");
            return jobCardStr === orderId || expense.order_id === orderId;
          });
        }),
      );
  }

  // ── Remote API calls ──────────────────────────────────────────────────────

  /** Submit a new order to the backend. */
  placeOrder(order: any): Observable<any> {
    const apiUrl = `${BASE_URL}/placeOrderForBuyer`;
    return this.http.post<any>(apiUrl, order);
  }
  draftOrder(order: any): Observable<any> {
    const apiUrl = `${BASE_URL}/createDraft`;
    return this.http.post<any>(apiUrl, order);
  }
  DeletedraftOrder(orderId: string): Observable<string> {
    return this.http.delete(`${BASE_URL}/deleteBuyerDraft`, {
      params: {
        save_id: orderId,
      },
      responseType: "text" as const,
    });
  }
  verifyPayment(data: any): Observable<any> {
    const apiUrl = `${BASE_URL}/verifyPayment`;
    return this.http.post<any>(apiUrl, data);
  }
  getPaymentDetails(paymentId: string) {
    return this.http.get(`${BASE_URL}/v1/payments/${paymentId}`);
  }
  sendMail(mailId: string, save_id: any) {
    const apiUrl = `${BASE_URL}/sendMail`;
    return this.http.post<any>(apiUrl, { mailId: mailId, save_id: save_id });
  }
  sendOrderConfirmation(payload: any) {
    return this.http.post(`${notification_URL}/order-confirmation`, null, {
      params: {
        to: payload.to,
        customerName: payload.customerName,
        companyName: payload.companyName,
        orderValue: payload.orderValue,
        companyDisplayName: payload.companyDisplayName,
        save_id: payload.save_id,
        supportNumber: payload.supportNumber,
      },
      responseType: "text",
    });
  }

  updateOrderStatus(
    id: any,
    data: any,
    error_code: string,
    error_description: string,
    error_reason: string,
    order_id: string,
    payment_id: string,
    amount: number,
    isError: boolean,
  ): Observable<any> {
    const apiUrl = `${BASE_URL}/updateOrderStatus`;
    return this.http.post<any>(apiUrl, {
      id,
      data,
      error_code,
      error_description,
      error_reason,
      order_id,
      payment_id,
      amount,
      isError,
    });
  }

  /** Fetch order details from the live API using a ref number. */
  getOrderByRef(
    refno: string,
    companyid: string,
  ): Observable<OrderDetail | null> {
    const apiUrl = `${BASE_URL}/ViewOrderDetails`;
    return this.http.post<OrderDetail | null>(apiUrl, { companyid, refno });
  }
}
