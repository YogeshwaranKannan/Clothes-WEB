import { Component, OnDestroy, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
//import { HeroBannerComponent } from './hero-banner/hero-banner.component';
import { Subscription } from "rxjs";
import { FooterComponent } from "../common/components/footer/footer.component";
import { Product } from "../common/models/product.model";
import { ProductService } from "../common/services/product.service copy";
import { CategoriesComponent } from "../common/components/categories/categories.component";

@Component({
  selector: "app-landing",
  standalone: true,
  imports: [CommonModule, CategoriesComponent, FooterComponent],
  templateUrl: "./landing.component.html",
  styleUrls: ["./landing.component.scss"],
})
export class LandingComponent implements OnInit, OnDestroy {
  products: Product[] = [];

  private refreshSub?: Subscription;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    this.loadProducts();

    // ✅ Every navigation to Home ('/') creates a new LandingComponent
    // instance (it's rendered inside <router-outlet>). refreshProducts$
    // lives on the root-provided ProductService, so without unsubscribing
    // here each revisit left the previous instance's subscription dangling
    // — repeat Home visits fired progressively more loadProducts() calls
    // per Deals/New Arrivals/logo click. Cleaned up in ngOnDestroy below.
    this.refreshSub = this.productService.refreshProducts$.subscribe(() => {
      this.loadProducts();
    });
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe((res) => {
      this.products = res;

      console.log("Loaded products:", res);
    });
  }
}
