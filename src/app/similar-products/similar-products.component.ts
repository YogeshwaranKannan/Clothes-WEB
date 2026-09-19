import { Component, Input, inject, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Observable, of, switchMap } from 'rxjs';
import { ProductListComponent } from '../product-list/product-list.component';
import { ProductService } from '../common/services/product.service';
import { Product } from '../common/models/product.model';

@Component({
  selector: 'app-similar-products',
  standalone: true,
  imports: [CommonModule, ProductListComponent],
  templateUrl: './similar-products.component.html',
  styleUrls: ['./similar-products.component.scss']
})
export class SimilarProductsComponent implements OnChanges {
  private productService = inject(ProductService);

  private ids$ = new BehaviorSubject<number[]>([]);

  @Input({ required: true }) similarProductIds!: number[];
  @Input() railTitle: string = 'Similar Products';

  products$: Observable<Product[]> = this.ids$.pipe(
    switchMap((ids) => {
      if (!ids || !ids.length) return of([] as Product[]);
      // productService expects string[] ids -> convert
      return this.productService.getProductsByIds(ids.map((i) => String(i)));
    })
  );

  ngOnChanges(ch: SimpleChanges) {
    if ('similarProductIds' in ch) {
      this.ids$.next(this.similarProductIds ?? []);
    }
  }
}
