import {
  Component,
  Input,
  OnInit,
  HostListener,
  Output,
  EventEmitter,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { Store } from "@ngrx/store";
import { Observable, map } from "rxjs";

import { Product, Variant } from "../../models/product.model";
import { parseMoneyToNumber } from "../../utils/price.util";
import {
  updateOrAddItem,
  updateQuantity,
  removeItem,
} from "../../models/cart/cart.actions";
import { selectCartItems } from "../../models/cart/cart.selectors";
import { DrawerService } from "../drawer/drawer.service";

@Component({
  selector: "app-variant-dropdown",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./variant-dropdown.component.html",
  styleUrls: ["./variant-dropdown.component.scss"],
})
export class VariantDropdownComponent implements OnInit {
  @Input() product!: Product;
  @Output() open = new EventEmitter<void>();
  @Input() selectedVariant: Variant | null = null;
  // selectedVariant: Variant | null = null;

  constructor() {}

  ngOnInit(): void {
    this.selectedVariant = this.product?.variants?.[0] ?? null;
  }

  // Emit open event — parent should render global modal
  openVariant(event: Event): void {
    event.stopPropagation();
    this.open.emit();
  }

  getSelectedVariant(): Variant | null {
    if (!this.selectedVariant)
      this.selectedVariant = this.product?.variants?.[0] ?? null;
    return this.selectedVariant;
  }

  trackByVariantId(_: number, v: Variant): string {
    return v.variantsid;
  }
}
