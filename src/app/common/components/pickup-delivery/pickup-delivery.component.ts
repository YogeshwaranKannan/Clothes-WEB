import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  inject,
  OnDestroy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ChottaService } from "../../services/chotta.service";
import { ChottaOrder } from "../../models/chotta.model";
import { ThemeService } from "../../../core/services/theme.service";

import { Subscription } from "rxjs";

@Component({
  selector: "app-pickup-delivery",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./pickup-delivery.component.html",
  styleUrls: ["./pickup-delivery.component.scss"],
})
export class PickupDeliveryComponent implements OnInit {
  private chotta = inject(ChottaService);
  private hostRef = inject(ElementRef<HTMLElement>);
  private theme = inject(ThemeService);

  private _subs: Subscription[] = [];

  deliveryList: ChottaOrder[] = [];
  pickupList: ChottaOrder[] = [];
  isOpen = false;
  activeTab: "DELIVERY" | "PICKUP" = "DELIVERY";
  selected?: ChottaOrder | null = null;
  // search terms
  searchDelivery = "";
  searchPickup = "";

  // ngOnInit(): void {
  //   this.chotta.getOrders().subscribe((list) => {
  //     this.deliveryList = list.filter((i) => i.addressType === 'DELIVERY');
  //     this.pickupList = list.filter((i) => i.addressType === 'PICKUP');

  //     const def = list.find((i) => i.default === true || i.default === 'true');
  //     if (def) this.selected = def;
  //     else if (this.deliveryList.length) this.selected = this.deliveryList[0];
  //   });
  //   // react to theme changes by ensuring any CSS custom properties are applied
  //   // ThemeService toggles body classes; listen for calls to setTheme via polling getter
  //   this._subs.push(
  //     // a tiny poll-like subscription to keep in sync if ThemeService changes
  //     new Subscription(() => {})
  //   );
  // }

  ngOnInit(): void {
    this.chotta.getOrders().subscribe({
      next: (list) => {
        console.log("Orders API Response:", list);

        this.deliveryList = list.filter((i) => i.addressType === "DELIVERY");

        this.pickupList = list.filter((i) => i.addressType === "PICKUP");

        const def = list.find(
          (i) => i.default === true || i.default === "true",
        );

        if (def) {
          this.selected = def;
        } else if (this.deliveryList.length) {
          this.selected = this.deliveryList[0];
        }
        this.updateLabel();
      },

      error: (err) => {
        console.error("Orders API Error:", err);
      },
    });
  }

  toggleOpen(e?: MouseEvent) {
    e?.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  openFor(tab: "DELIVERY" | "PICKUP", e?: MouseEvent) {
    e?.stopPropagation();
    this.activeTab = tab;
    this.isOpen = true;
  }

  select(item: ChottaOrder) {
    this.selected = item;
    this.updateLabel();
    this.isOpen = false;
  }

  // get filteredDelivery() {
  //   const term = (this.searchDelivery || "").trim().toLowerCase();
  //   if (!term) return this.deliveryList;
  //   return this.deliveryList.filter(
  //     (item) =>
  //       item.address.city.toLowerCase().includes(term) ||
  //       (item.address.pincode || "").includes(term),
  //   );
  // }

  get filteredDelivery() {
    const term = (this.searchDelivery || "").trim().toLowerCase();

    if (!term) return this.deliveryList;

    return this.deliveryList.filter(
      (item) =>
        (item.address.areaName || "").toLowerCase().includes(term) ||
        (item.address.city || "").toLowerCase().includes(term) ||
        (item.address.pincode || "").toString().includes(term),
    );
  }

  // get filteredPickup() {
  //   const term = (this.searchPickup || "").trim().toLowerCase();
  //   if (!term) return this.pickupList;
  //   return this.pickupList.filter(
  //     (item) =>
  //       item.address.areaName.toLowerCase().includes(term) ||
  //       (item.address.pincode || "").includes(term),
  //   );
  // }

  get filteredPickup() {
    const term = (this.searchPickup || "").trim().toLowerCase();

    if (!term) return this.pickupList;

    return this.pickupList.filter(
      (item) =>
        (item.address.areaName || "").toLowerCase().includes(term) ||
        (item.address.city || "").toLowerCase().includes(term) ||
        (item.address.pincode || "").toString().includes(term),
    );
  }

  // ── Cached label — updated only when selection changes ───────────────────
  // Avoids calling a method from the template (Angular invokes template
  // methods on every change-detection cycle, causing the repeated console logs).
  label = "📍 Delivery";

  /** Recompute and cache the display label. Called only on data change. */
  private updateLabel(): void {
    if (!this.selected) {
      this.label = "📍 Delivery";
      return;
    }
    this.label =
      this.selected.addressType === "DELIVERY"
        ? `📍 Delivery: ${this.selected.address.city}-${this.selected.address.pincode}`
        : `📍 Pickup: ${this.selected.address.areaName}`;
  }

  isSelected(item: ChottaOrder) {
    return (
      this.selected?.sellerId === item.sellerId &&
      this.selected?.address.areaName === item.address.areaName
    );
  }

  @HostListener("document:click", ["$event"])
  onDocClick(e: Event) {
    if (!this.hostRef.nativeElement.contains(e.target as Node)) {
      this.isOpen = false;
    }
  }

  ngOnDestroy(): void {
    this._subs.forEach((s) => s.unsubscribe?.());
  }
}
