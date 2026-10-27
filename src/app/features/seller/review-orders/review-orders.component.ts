import {
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Subject, firstValueFrom, merge, of } from "rxjs";
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  takeUntil,
} from "rxjs/operators";
import {
  OrderRow,
  OrderStage,
  SellerOrdersService,
  stockIssues,
} from "./seller-orders.service";

type TabKey = "review" | "transit" | "closed" | "rejected";

interface TabDef {
  key: TabKey;
  label: string;
  stage: OrderStage;
  empty: { title: string; text: string };
}

const PAGE = 20;
const AVATARS = [
  "#1b4ba4",
  "#0891b2",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#059669",
  "#4f46e5",
];

@Component({
  selector: "app-review-orders",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./review-orders.component.html",
  styleUrls: ["./review-orders.component.scss"],
})
export class ReviewOrdersComponent implements OnInit, OnDestroy {
  private api = inject(SellerOrdersService);
  private destroy$ = new Subject<void>();
  private query$ = new Subject<string>();
  private reload$ = new Subject<void>();

  readonly tabs: TabDef[] = [
    {
      key: "review",
      label: "Review",
      stage: "review",
      empty: {
        title: "Nothing waiting for review",
        text: "Orders that need your review will show up here.",
      },
    },
    {
      key: "transit",
      label: "In transit",
      stage: "transit",
      empty: {
        title: "Nothing in transit",
        text: "Orders you accept will wait here until you mark them as delivered.",
      },
    },
    {
      key: "closed",
      label: "Closed",
      stage: "closed",
      empty: {
        title: "No closed orders yet",
        text: "Delivered orders will be listed here.",
      },
    },
    {
      key: "rejected",
      label: "Rejected",
      stage: "rejected",
      empty: {
        title: "No rejected orders",
        text: "Orders that were rejected or cancelled will appear here.",
      },
    },
  ];

  tab: TabKey = "review";
  query = "";
  rows: OrderRow[] = [];
  loading = true;
  error = "";
  shown = PAGE;
  selected: OrderRow | null = null;

  // accept / reject
  panel: "accept" | "reject" | "deliver" | null = null;
  busy = false;
  actionError = "";
  issues: string[] = [];
  reasonPick = "";
  reasonText = "";
  refundAmount = "";
  refundMode = "";
  toast = "";
  private toastTimer?: ReturnType<typeof setTimeout>;

  readonly reasons = [
    "Item out of stock",
    "Can’t deliver to this location",
    "Customer asked to cancel",
    "Wrong price or product details",
    "Other",
  ];
  readonly refundModes = ["UPI", "Bank transfer", "Cash", "Card"];

  /* ------------------------------ lifecycle ------------------------------ */

  ngOnInit(): void {
    merge(
      of(""), // first load
      this.query$.pipe(debounceTime(300), distinctUntilChanged()),
      this.reload$.pipe(map(() => this.query)),
    )
      .pipe(
        switchMap((q) => {
          this.loading = true;
          this.error = "";
          return this.api.search(q.trim()).pipe(
            catchError((e) => {
              this.error =
                e?.error?.msg ||
                e?.message ||
                "Couldn’t load orders. Check your connection and try again.";
              return of(null);
            }),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((rows) => {
        this.loading = false;
        if (rows) {
          this.rows = rows;
          this.shown = PAGE;
        }
      });
  }

  ngOnDestroy(): void {
    document.body.style.overflow = "";
    clearTimeout(this.toastTimer);
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener("document:keydown.escape")
  onEscape(): void {
    if (this.busy) return;
    if (this.panel) {
      this.panel = null;
      return;
    }
    if (this.selected) this.close();
  }

  /* ------------------------------ data ------------------------------ */

  get current(): TabDef {
    return this.tabs.find((t) => t.key === this.tab)!;
  }

  private inStage(stage: OrderStage): OrderRow[] {
    return this.rows.filter((r) => r.stage === stage);
  }

  get inTab(): OrderRow[] {
    return this.inStage(this.current.stage);
  }

  get visible(): OrderRow[] {
    return this.inTab.slice(0, this.shown);
  }

  count(t: TabDef): number {
    return this.inStage(t.stage).length;
  }

  get tabTotal(): number {
    return this.inTab.reduce((s, r) => s + this.net(r), 0);
  }

  /* ------------------------------ actions ------------------------------ */

  setTab(key: TabKey): void {
    this.tab = key;
    this.shown = PAGE;
  }

  onQuery(v: string): void {
    this.query = v;
    this.query$.next(v);
  }

  clearSearch(): void {
    this.query = "";
    this.query$.next("");
  }

  reload(): void {
    this.reload$.next();
  }

  more(): void {
    this.shown += PAGE;
  }

  open(r: OrderRow): void {
    this.selected = r;
    this.panel = null;
    this.actionError = "";
    this.issues = [];
    document.body.style.overflow = "hidden";
  }

  close(): void {
    if (this.busy) return;
    this.selected = null;
    this.panel = null;
    document.body.style.overflow = "";
  }

  /* ------------------------------ accept / reject ------------------------------ */

  startAccept(): void {
    this.actionError = "";
    this.issues = [];
    this.panel = "accept";
  }

  startReject(o: OrderRow): void {
    this.actionError = "";
    this.issues = [];
    this.reasonPick = "";
    this.reasonText = "";
    this.refundAmount = o.paid > 0 ? String(o.paid) : "";
    this.refundMode = "";
    this.panel = "reject";
  }

  cancelPanel(): void {
    if (!this.busy) this.panel = null;
  }

  pickReason(r: string): void {
    this.reasonPick = r;
    this.reasonText = r === "Other" ? "" : r;
  }

  onRefundInput(v: string): void {
    this.refundAmount = v.replace(/[^0-9.]/g, "");
  }

  async confirmAccept(): Promise<void> {
    const o = this.selected;
    if (!o || this.busy) return;
    this.busy = true;
    this.actionError = "";
    this.issues = [];
    try {
      const res = await firstValueFrom(this.api.accept(o));
      const done = await this.reloadAndCheck(o, "transit");
      if (done === true) {
        this.finish(
          "transit",
          `Order ${o.ref} accepted and moved to In transit.`,
        );
      } else if (done === null) {
        this.actionError =
          "We couldn’t confirm the result. Tap Refresh and check the order before trying again.";
      } else {
        this.issues = stockIssues(res);
        this.actionError = this.issues.length
          ? "Some items can’t be fulfilled:"
          : "The order is still showing as In review. Tap Refresh to check; if it stays there, the accept didn’t go through.";
      }
    } catch (e: any) {
      this.actionError =
        e?.error?.message ||
        e?.error?.msg ||
        e?.message ||
        "Couldn’t accept the order. Please try again.";
    } finally {
      this.busy = false;
    }
  }

  async confirmReject(): Promise<void> {
    const o = this.selected;
    if (!o || this.busy) return;

    const reason = this.reasonText.trim();
    if (reason.length < 3) {
      this.actionError = "Add a reason for rejecting this order.";
      return;
    }
    let refund: { amount: number; mode: string } | undefined;
    if (o.paid > 0) {
      const amount = Number(this.refundAmount);
      if (!(amount > 0) || amount > o.paid) {
        this.actionError = `Enter a refund amount up to ${this.inr(o.paid)}.`;
        return;
      }
      if (!this.refundMode) {
        this.actionError = "Choose how the refund will be paid.";
        return;
      }
      refund = { amount, mode: this.refundMode };
    }

    this.busy = true;
    this.actionError = "";
    try {
      await firstValueFrom(this.api.reject(o, reason, refund));
      const done = await this.reloadAndCheck(o, "rejected");
      if (done === true) {
        this.finish("rejected", `Order ${o.ref} rejected.`);
      } else if (done === null) {
        this.actionError =
          "We couldn’t confirm the result. Tap Refresh and check the order before trying again.";
      } else {
        this.actionError = "The order couldn’t be rejected. Please try again.";
      }
    } catch (e: any) {
      this.actionError =
        e?.error?.message ||
        e?.error?.msg ||
        e?.message ||
        "Couldn’t reject the order. Please try again.";
    } finally {
      this.busy = false;
    }
  }

  startDeliver(): void {
    this.actionError = "";
    this.issues = [];
    this.panel = "deliver";
  }

  async confirmDeliver(): Promise<void> {
    const o = this.selected;
    if (!o || this.busy) return;
    this.busy = true;
    this.actionError = "";
    try {
      const text = await firstValueFrom(this.api.markDelivered(o));
      const done = await this.reloadAndCheck(o, "closed");
      if (done === true) {
        const mailFailed = /could not be sent/i.test(text ?? "");
        this.finish(
          "closed",
          mailFailed
            ? `Order ${o.ref} delivered, but the email couldn’t be sent to the customer.`
            : `Order ${o.ref} delivered. The customer has been emailed.`,
        );
      } else if (done === null) {
        this.actionError =
          "We couldn’t confirm the result. Tap Refresh and check the order before trying again.";
      } else {
        this.actionError =
          text?.trim() ||
          "The order couldn’t be marked as delivered. Please try again.";
      }
    } catch (e: any) {
      this.actionError =
        e?.error?.message ||
        e?.error?.msg ||
        e?.message ||
        "Couldn’t mark the order as delivered. Please try again.";
    } finally {
      this.busy = false;
    }
  }

  /** true = order now has the expected status, false = it doesn't, null = couldn't check. */
  private async reloadAndCheck(
    o: OrderRow,
    expected: OrderStage,
  ): Promise<boolean | null> {
    try {
      const rows = await firstValueFrom(this.api.search(this.query.trim()));
      this.rows = rows;
      return rows.some((r) => r.id === o.id && r.stage === expected);
    } catch {
      return null;
    }
  }

  private finish(tab: TabKey, message: string): void {
    this.selected = null;
    this.panel = null;
    document.body.style.overflow = "";
    this.setTab(tab);
    this.showToast(message);
  }

  private showToast(text: string): void {
    clearTimeout(this.toastTimer);
    this.toast = text;
    this.toastTimer = setTimeout(() => (this.toast = ""), 3500);
  }

  /* ------------------------------ display helpers ------------------------------ */

  net(r: OrderRow): number {
    return Math.max(r.gross - r.discount, 0);
  }

  inr(n: number): string {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(n || 0);
  }

  date(d: Date | null): string {
    return d
      ? d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "";
  }

  title(s: string): string {
    return (s ?? "")
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  initial(r: OrderRow): string {
    return r.customerName ? r.customerName.charAt(0).toUpperCase() : "?";
  }

  avatar(r: OrderRow): string {
    const code = r.customerName ? r.customerName.charCodeAt(0) : 0;
    return AVATARS[code % AVATARS.length];
  }

  isPaid(r: OrderRow): boolean {
    return r.paymentStatus.toLowerCase() === "paid";
  }

  meta(stage: OrderStage): { label: string; cls: string } {
    switch (stage) {
      case "review":
        return { label: "In review", cls: "st-review" };
      case "transit":
        return { label: "In transit", cls: "st-transit" };
      case "closed":
        return { label: "Closed", cls: "st-closed" };
      case "rejected":
        return { label: "Rejected", cls: "st-rejected" };
      default:
        return { label: "N/A", cls: "st-other" };
    }
  }

  trackById(_: number, r: OrderRow): string {
    return r.id || r.ref;
  }
}
