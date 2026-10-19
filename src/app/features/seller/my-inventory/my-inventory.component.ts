import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { firstValueFrom } from "rxjs";
import { BatchDto, InventoryItem, InventoryService } from "./inventory.service";
import { ProductFormDialogComponent } from "./product-form-dialog.component";

type Filter = "all" | "deals" | "new" | "low";
const LOW_STOCK = 10;

interface Row {
  item: InventoryItem;
  category: string;
  variants: number;
  stock: number;
  priceLabel: string;
  active: boolean;
}

@Component({
  selector: "app-my-inventory",
  standalone: true,
  imports: [CommonModule, FormsModule, ProductFormDialogComponent],
  templateUrl: "./my-inventory.component.html",
  styleUrls: ["./my-inventory.component.scss"],
})
export class MyInventoryComponent implements OnInit, OnDestroy {
  private api = inject(InventoryService);

  loading = true;
  loadError = "";
  rows: Row[] = [];
  search = "";
  filter: Filter = "all";
  readonly lowStock = LOW_STOCK;

  // overlay state
  formOpen = false;
  editingId: string | null = null;

  // delete state
  deleteTarget: Row | null = null;
  deleting = false;

  toast: { text: string; kind: "ok" | "error" } | null = null;
  private toastTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    this.load();
  }
  ngOnDestroy(): void {
    clearTimeout(this.toastTimer);
  }

  async load(): Promise<void> {
    this.loading = true;
    this.loadError = "";
    try {
      const items = await firstValueFrom(this.api.list());
      this.rows = items.map((i) => this.toRow(i));
    } catch (e: any) {
      this.loadError = e?.error?.msg || "Couldn’t load your inventory. Check your connection and try again.";
    } finally {
      this.loading = false;
    }
  }

  private toRow(item: InventoryItem): Row {
    const batches: BatchDto[] = (item.variantBatches?.length ? item.variantBatches : item.batchid ? [item.batchid] : []).filter(
      (b) => b?.active !== false,
    );
    const prices = batches.map((b) => b.seller_price ?? 0).filter((p) => p > 0);
    const min = prices.length ? Math.min(...prices) : item.sellerprice ?? 0;
    const max = prices.length ? Math.max(...prices) : min;
    const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

    return {
      item,
      category: item.productCategory?.category_name ?? "Uncategorised",
      variants: batches.length,
      stock: batches.reduce((s, b) => s + (b.stock_availability ?? 0), 0),
      priceLabel: min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`,
      active: item.active !== false,
    };
  }

  get filtered(): Row[] {
    const q = this.search.trim().toLowerCase();
    return this.rows.filter((r) => {
      if (q && !r.item.productName?.toLowerCase().includes(q) && !r.category.toLowerCase().includes(q)) return false;
      if (this.filter === "deals") return !!r.item.deals;
      if (this.filter === "new") return !!r.item.newArrivals;
      if (this.filter === "low") return r.stock <= LOW_STOCK;
      return true;
    });
  }

  count(f: Filter): number {
    switch (f) {
      case "deals": return this.rows.filter((r) => r.item.deals).length;
      case "new": return this.rows.filter((r) => r.item.newArrivals).length;
      case "low": return this.rows.filter((r) => r.stock <= LOW_STOCK).length;
      default: return this.rows.length;
    }
  }

  initial(r: Row): string {
    return (r.item.productName || "?").charAt(0).toUpperCase();
  }

  trackById(_: number, r: Row): string {
    return r.item._id;
  }

  /* ---------- add / edit ---------- */
  openAdd(): void {
    this.editingId = null;
    this.formOpen = true;
  }
  openEdit(r: Row): void {
    this.editingId = r.item._id;
    this.formOpen = true;
  }
  onFormClosed(saved: boolean): void {
    this.formOpen = false;
    if (saved) {
      this.showToast(this.editingId ? "Product updated" : "Product added", "ok");
      this.load();
    }
    this.editingId = null;
  }

  /* ---------- delete ---------- */
  askDelete(r: Row): void {
    this.deleteTarget = r;
  }
  cancelDelete(): void {
    if (!this.deleting) this.deleteTarget = null;
  }
  async confirmDelete(): Promise<void> {
    const target = this.deleteTarget;
    if (!target) return;
    this.deleting = true;
    try {
      const res = await firstValueFrom(this.api.remove(target.item._id));
      if (res?.success === false) throw new Error(res.message);
      this.rows = this.rows.filter((r) => r !== target);
      this.deleteTarget = null;
      this.showToast("Product deleted", "ok");
    } catch (e: any) {
      this.showToast(e?.error?.message || e?.message || "Couldn’t delete the product. Try again.", "error");
    } finally {
      this.deleting = false;
    }
  }

  private showToast(text: string, kind: "ok" | "error"): void {
    clearTimeout(this.toastTimer);
    this.toast = { text, kind };
    this.toastTimer = setTimeout(() => (this.toast = null), 3000);
  }
}
