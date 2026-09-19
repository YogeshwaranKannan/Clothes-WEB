import {
  Component,
  Input,
  Output,
  EventEmitter,
  HostListener,
  Renderer2,
  Inject,
} from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { CommonModule } from "@angular/common";
import { DrawerState } from "./drawer-state";
import { TitleBannerComponent } from "../title-banner/title-banner.component";

import { LoadingScreenComponent } from "../loading-screen/loading-screen.component";

@Component({
  selector: "app-drawer",
  standalone: true,
  imports: [CommonModule, TitleBannerComponent, LoadingScreenComponent],
  templateUrl: "./drawer.component.html",
  styleUrls: ["./drawer.component.scss"],
})
export class DrawerComponent {
  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  @Input() title = "Products";

  @Input() isPublic = false;
  @Input() showBack = false;
  @Output() back = new EventEmitter<void>();
  //@Input() homeLink: any[] | string = '/';
  @Input() showTitleBanner = true;

  @Input() state: DrawerState = DrawerState.Hidden;
  @Output() stateChange = new EventEmitter<DrawerState>();

  DrawerState = DrawerState;

  @HostListener("document:keydown.escape")
  onEsc() {
    if (this.state !== DrawerState.Hidden) this.hide();
  }

  // ngOnChanges() {
  //   if (this.state !== DrawerState.Hidden) {
  //     this.renderer.setStyle(this.document.body, "overflow", "hidden");
  //   } else {
  //     this.renderer.removeStyle(this.document.body, "overflow");
  //   }
  // }
  ngOnChanges() {
    // Only lock body scroll for admin drawer
    if (!this.isPublic && this.state !== DrawerState.Hidden) {
      this.renderer.setStyle(this.document.body, "overflow", "hidden");
    } else {
      this.renderer.removeStyle(this.document.body, "overflow");
    }
  }

  toggleSize() {
    if (this.state === DrawerState.Half)
      this.stateChange.emit(DrawerState.Full);
    else if (this.state === DrawerState.Full)
      this.stateChange.emit(DrawerState.Half);
  }

  hide() {
    const source = sessionStorage.getItem("cart_source");

    if (source === "order-history") {
      sessionStorage.removeItem("cart_source");
      return;
    }
    this.stateChange.emit(DrawerState.Hidden);
  }
  currentView: "cart" | "checkout" = "cart";

  goToCheckout() {
    this.currentView = "checkout";
  }

  goToCart() {
    this.currentView = "cart";
  }
  onBackClick() {
    this.back.emit();
  }
  ngOnDestroy() {
    this.renderer.removeStyle(this.document.body, "overflow");
  }
}
