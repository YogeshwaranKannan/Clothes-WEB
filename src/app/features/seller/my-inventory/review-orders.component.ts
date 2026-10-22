import { Component, HostListener, OnDestroy, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Subject, merge, of } from "rxjs";
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  switchMap,
  takeUntil,
} from "rxjs/operators";
import { OrderRow, SellerOrdersService } from "./seller-orders.service";

type TabKey = "review" | "closed" | "rejected";

interface TabDef {
  key: TabKey;
  label: string;
  status: string; // backend order_status
  empty: { title: string; text: string };
}

const PAGE = 20;
const AVATARS = ["#1b4ba4", "#0891b2", "#7c3aed", "#db2777", "#ea580c", "#059669", "#4f46e5"];

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
      status: "Review",
      empty: {
        title: "Nothing waiting for review",
        text: "Orders that need your review will show up here.",
      },
    },
    {
      key: "closed",
      label: "Closed",
      status: "Completed",
      empty: {
        title: "No closed orders yet",
        text: "Completed orders will be listed here.",
      },
    },
    {
      key: "rejected",
      label: "Rejected",
      status: "Cancelled",
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
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener("document:keydown.escape")
  onEscape(): void {
    if (this.selected) this.close();
  }

  /* ------------------------------ data ------------------------------ */

  get current(): TabDef {
    return this.tabs.find((t) => t.key === this.tab)!;
  }

  private inStatus(status: string): OrderRow[] {
    return this.rows.filter((r) => r.status === status);
  }

  get inTab(): OrderRow[] {
    return this.inStatus(this.current.status);
  }

  get visible(): OrderRow[] {
    return this.inTab.slice(0, this.shown);
  }

  count(t: TabDef): number {
    return this.inStatus(t.status).length;
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
    document.body.style.overflow = "hidden";
  }

  close(): void {
    this.selected = null;
    document.body.style.overflow = "";
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
      ? d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : "";
  }

  title(s: string): string {
    return (s ?? "").trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
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

  meta(status: string): { label: string; cls: string } {
    switch (status) {
      case "Review":
        return { label: "In review", cls: "st-review" };
      case "Completed":
        return { label: "Closed", cls: "st-closed" };
      case "Cancelled":
        return { label: "Rejected", cls: "st-rejected" };
      default:
        return { label: status || "N/A", cls: "st-other" };
    }
  }

  trackById(_: number, r: OrderRow): string {
    return r.id || r.ref;
  }
}
