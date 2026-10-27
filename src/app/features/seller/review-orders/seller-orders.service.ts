import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, map, throwError } from "rxjs";
import { BASE_URL } from "../../../common/utils/constant";
import { SellerService } from "../../../common/services/SellerService";

/* ----------------------------- Models ----------------------------- */

/** Backend order_status values (same mapping as the React Native tabs). */
export const ORDER_STATUSES = ["Review", "Completed", "Cancelled"];

export interface OrderLine {
  name: string;
  variant: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

export interface Rejection {
  reason: string;
  refundStatus: string;
  refundAmount: number;
  refundMode: string;
  customerNeedToPay: number;
  date: Date | null;
}

/** Where an order is in the flow. In transit = accepted (orderStatus stays "Review", deliveryStatus "In-transit"). */
export type OrderStage = "review" | "transit" | "closed" | "rejected";

export interface OrderRow {
  id: string;
  ref: string;
  status: string; // Review | Completed | Cancelled
  deliveryStatus: string;
  stage: OrderStage;
  customerName: string;
  customerMobile: string;
  deliveryMode: string;
  address: string;
  gross: number; // before discount
  discount: number;
  paid: number;
  due: number;
  paymentStatus: string;
  orderDate: Date | null;
  dueDate: Date | null;
  deliveredDate: Date | null;
  lines: OrderLine[];
  rejection: Rejection | null;
  /** untouched API object, needed to send the order back when accepting */
  raw: any;
}

/* ----------------------------- Helpers ----------------------------- */

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Handles Java Date.toString() ("Wed Sep 10 00:00:00 IST 2026"), ISO strings,
 *  "yyyy-MM-dd HH:mm:ss.SSS" and epoch millis. */
export function parseDate(v: any): Date | null {
  if (v === null || v === undefined || v === "" || v === "null") return null;
  if (v instanceof Date) return v;
  if (typeof v === "number") return new Date(v);
  const s = String(v).trim();
  const m = s.match(
    /^[A-Za-z]{3}\s([A-Za-z]{3})\s(\d{1,2})\s[\d:]+\s\S+\s(\d{4})$/,
  );
  if (m) {
    const mi = MONTHS.indexOf(m[1]);
    if (mi >= 0) return new Date(+m[3], mi, +m[2]);
  }
  const d = new Date(
    s.includes(" ") && !s.includes("T") ? s.replace(" ", "T") : s,
  );
  return isNaN(d.getTime()) ? null : d;
}

const num = (v: any): number => {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

/** Same field mapping as `mapProductToRow` in the React Native screen. */
export function mapOrder(p: any): OrderRow {
  const inventory: any[] = Array.isArray(p?.inventory) ? p.inventory : [];

  const lines: OrderLine[] = inventory.map((e) => {
    const isProduct = e?.flag === null || e?.flag === undefined;
    const unitPrice = isProduct
      ? num(e?.offerPrice) > 0
        ? num(e.offerPrice)
        : num(e?.sellerprice)
      : num(e?.servicecost);
    const qty = num(e?.Order_quantity ?? e?.order_quantity ?? e?.count);
    return {
      name: e?.productName ?? e?.productname ?? e?.servicename ?? "Item",
      variant:
        e?.variantName ?? e?.variant_name ?? e?.batchid?.variantName ?? "",
      qty,
      unitPrice,
      amount: qty * unitPrice,
    };
  });

  const computed = lines.reduce((s, l) => s + l.amount, 0);
  const apiTotal = num(p?.paymentsDTO?.total_amount);

  const status: string = p?.order_status ?? "";
  const deliveryStatus = String(
    p?.deliveryStatus ?? p?.delivery_status ?? "",
  ).trim();
  const inTransit =
    status === "Review" && /^in[-\s_]?transit$/i.test(deliveryStatus);
  const stage: OrderStage =
    status === "Cancelled"
      ? "rejected"
      : status === "Completed"
        ? "closed"
        : inTransit
          ? "transit"
          : "review";
  const info = (p?.acceptReviewDetails?.acceptReviewInfos ?? []).slice(-1)[0];
  const customer = p?.customerInformationDTO ?? {};

  const address =
    p?.delivery_mode === "PICKUP"
      ? (customer.deliveryAddress ?? "")
      : [
          customer.deliveryAddress,
          customer.city,
          customer.state,
          customer.postalCode,
        ]
          .filter((x) => x !== null && x !== undefined && x !== "")
          .join(", ");

  return {
    id: String(p?.save_orderid ?? ""),
    ref: p?.refno ?? "",
    status,
    deliveryStatus,
    stage,
    customerName: String(customer.customerName ?? "").trim(),
    customerMobile: String(customer.customerMobileNum ?? "").trim(),
    deliveryMode: String(p?.delivery_mode ?? "").trim(),
    address,
    gross: apiTotal > 0 ? apiTotal : computed,
    discount: num(p?.total_Discount),
    paid: num(p?.total_Paid),
    due: num(p?.total_AmountDue),
    paymentStatus: String(
      p?.payment_status ?? p?.paymentDetails?.payment_status ?? "",
    ),
    orderDate: parseDate(p?.order_date),
    dueDate: parseDate(p?.deliveryDueDate),
    deliveredDate: parseDate(p?.deliveredDate),
    lines,
    raw: p,
    rejection:
      status === "Cancelled"
        ? {
            reason: p?.reason_FullyRejectedOrders || info?.reason || "",
            refundStatus: info?.refund_status || "",
            refundAmount: num(info?.refund_amount ?? p?.total_Refund_amount),
            refundMode: info?.refund_payment_mode || "",
            customerNeedToPay: num(info?.customer_need_to_pay),
            date: parseDate(info?.action_date),
          }
        : null,
  };
}

/** Pulls stock/validation messages out of an AcceptReviewOrders response, whatever the field is called. */
export function stockIssues(res: any): string[] {
  const out: string[] = [];
  if (!res || typeof res !== "object") return out;
  for (const v of Object.values(res)) {
    if (!Array.isArray(v)) continue;
    for (const item of v as any[]) {
      const msg = typeof item?.message === "string" ? item.message.trim() : "";
      if (msg)
        out.push(
          `${item?.productName ?? item?.productname ?? item?.servicename ?? "Item"}: ${msg}`,
        );
    }
  }
  return out;
}

/* ----------------------------- Service ----------------------------- */

@Injectable({ providedIn: "root" })
export class SellerOrdersService {
  private http = inject(HttpClient);
  private api = BASE_URL;
  private sellerService = inject(SellerService);

  get companyId(): string {
    return String(this.sellerService.getSellerId() ?? "");
  }

  /** Orders for this store in the given statuses; `value` searches name, mobile and ref no. */
  search(
    value: string,
    statuses: string[] = ORDER_STATUSES,
  ): Observable<OrderRow[]> {
    if (!this.companyId) {
      return throwError(
        () =>
          new Error("Store id is missing. Reload the page and sign in again."),
      );
    }
    return this.http
      .post<any[]>(`${this.api}/SearchOrders`, {
        _id: this.companyId,
        value,
        order_status: statuses,
      })
      .pipe(map((rows) => (Array.isArray(rows) ? rows : []).map(mapOrder)));
  }

  /**
   * Accept a review order: stock is reduced and the order moves to "In transit"
   * (orderStatus stays "Review", deliveryStatus becomes "In-transit").
   * `inTransitOnAccept` tells the backend to do that (the mobile app leaves it false).
   * The order's own inventory is sent back unchanged.
   */
  accept(o: OrderRow): Observable<any> {
    if (!this.companyId) {
      return throwError(
        () =>
          new Error("Store id is missing. Reload the page and sign in again."),
      );
    }
    const raw = o.raw ?? {};
    const body = {
      companyid: this.companyId,
      companyName: this.sellerService.getCompanyName() ?? "",
      refno: o.ref,
      save_id: o.id,
      ordervalue: o.gross,
      address:
        typeof raw.delivery_details === "string"
          ? raw.delivery_details
          : o.address,
      delivery_mode: o.deliveryMode || null,
      deliveryDueDate:
        typeof raw.deliveryDueDate === "string" ? raw.deliveryDueDate : null,
      isDelivered: false,
      isMarkAsPaid: false,
      inTransitOnAccept: true,
      inventory: Array.isArray(raw.inventory) ? raw.inventory : [],
    };
    return this.http.post<any>(`${this.api}/AcceptReviewOrders`, body);
  }

  /** Reject a review order. `refund` is only sent when the customer has already paid. */
  reject(
    o: OrderRow,
    reason: string,
    refund?: { amount: number; mode: string },
  ): Observable<string> {
    return this.http.post(
      `${this.api}/RejectReviewOrders`,
      {
        _id: o.id,
        reason,
        refund_amount: refund?.amount ?? 0,
        refund_status: refund ? "To be processed" : null,
        refund_payment_mode: refund?.mode ?? null,
      },
      { responseType: "text" }, // the endpoint returns a plain string, not JSON
    );
  }

  /** In transit -> delivered: the order becomes Completed and the customer is emailed. */
  markDelivered(o: OrderRow): Observable<string> {
    if (!this.companyId) {
      return throwError(
        () =>
          new Error("Store id is missing. Reload the page and sign in again."),
      );
    }
    return this.http.post(
      `${this.api}/MarkOrderDelivered`,
      { _id: o.id, companyid: this.companyId },
      { responseType: "text" },
    );
  }
}
