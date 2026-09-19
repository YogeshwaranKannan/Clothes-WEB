import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { AddonModel } from "../common/models/cart/addon.model";
//import { Product_URL, Service_URL } from "../common/utils/constant";

@Component({
  selector: "app-addons-suggest",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./addons-suggest.component.html",
  styleUrls: ["./addons-suggest.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddonsSuggestComponent {
  /** List of add-on / offer items to display */
  @Input() addonsList: AddonModel[] = [];

  /** Section heading — override if needed */
  @Input() sectionTitle = "Offers for you";

  /** Emits the addon that was tapped */
  @Output() addAddon = new EventEmitter<AddonModel>();

  onAdd(addon: AddonModel, event: MouseEvent): void {
    event.stopPropagation();
    this.addAddon.emit(addon);
  }

  trackById(_: number, addon: AddonModel): number {
    return addon.id;
  }

  /** Returns the computed discount percent if not supplied explicitly */
  discount(addon: AddonModel): number | null {
    if (addon.discountPercent != null) return addon.discountPercent;
    if (addon.originalPrice && addon.originalPrice > addon.price) {
      return Math.round((1 - addon.price / addon.originalPrice) * 100);
    }
    return null;
  }

  // private readonly imgBase = "https://dev.fr.api.intellesyde.com";
  private readonly imgBase = "http://localhost:8080";
  buildImageUrl(relative?: string): string {
    if (!relative) return "assets/placeholder-bike.svg";
    const t = relative.trim();
    if (!t) return "assets/placeholder-bike.svg";
    if (t.startsWith("assets/") || t.startsWith("/assets/")) return t;
    if (t.startsWith("//")) return `https:${t}`;
    if (/^https?:\/\//i.test(t)) return t;
    return `${this.imgBase}/${t.replace(/^\/+/, "")}`;
  }

  onImgError(ev: Event): void {
    const img = ev.target as HTMLImageElement;
    //if (img) img.src = "assets/placeholder-bike.png";
  }

  /*buildImageUrl(
    relative?: string,
    productname?: string,
    isService?: boolean,
  ): string {
    return buildImageUrl(relative, productname, isService);
  }*/
}
