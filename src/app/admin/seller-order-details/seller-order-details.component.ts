import {
  Component, EventEmitter, Input, Output, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, Observable, of, merge } from 'rxjs';
import { switchMap, startWith, catchError, map, shareReplay } from 'rxjs/operators';
import { OrderService } from '../../common/services/orders.service';
import { OrderDetail } from '../../common/models/orders.model';

type OrderVm = { loading: boolean; error: string | null; order: OrderDetail | null;currentIndex : number };

@Component({
  selector: 'app-seller-order-details',
  standalone: true,
  imports: [CommonModule],                 // standalone; no FormsModule needed
  templateUrl: './seller-order-details.component.html',
  styleUrls: ['./seller-order-details.component.scss'],
})
export class SellerOrderDetailsComponent {

  // 🔽 NEW: flag that tells the template whether to show the search UI
  hasInputId = signal<boolean>(false);

  /** Drawer-passed id */
  @Input() set orderId(value: string | null) {
    this.hasInputId.set(!!value);                     // <-- controls search UI 
    // 🔑 Push incoming id immediately into the stream
    this.orderId$.next(value ?? null);
    // Do NOT flip `searched` here—initial load is not a manual search
  }

  @Output() close = new EventEmitter<void>();

  // ---- Existing design fields ----
  searched = false;                        // remains false until user clicks Search
  searchId = signal<string>('');           // signal-based search text, no ngModel
  isCOpen=false;
  isDOpen=true;
  isPOpen=true;


  // ---- Reactive inputs ----
  private orderId$  = new BehaviorSubject<string | null>(null);  // from parent (Drawer)
  private searchId$ = new BehaviorSubject<string | null>(null);  // from Search button

  // ✅ Functional DI
  private orderService = inject(OrderService);

  // Merge both sources of selected id
  private selectedId$: Observable<string | null> = merge(this.orderId$, this.searchId$);

  // Single view-model observable for the HTML (| async)
  orderVm$: Observable<OrderVm> = this.selectedId$.pipe(
    switchMap((id) => {
      if (!id) return of<OrderVm>({ loading: false, error: null, order: null, currentIndex: -1 });

     return this.orderService.getOrderById(id).pipe(
  map(order => {
    const currentIndex = order?.stages
      ? order.stages
          .map(s => s.name.toLowerCase())
          .indexOf(order.order_status?.toLowerCase())
      : -1;

        return {
          loading: false,
          error: order ? null : 'No order found',
          order: order ?? null,
          currentIndex
        };
      }),
      startWith({ loading: true, error: null, order: null, currentIndex: -1 }),
      catchError(err => {
        console.error(err);
        return of<OrderVm>({
          loading: false,
          error: 'Failed to load order details. Please try again.',
          order: null,
          currentIndex: -1
        });
      })
    );
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  // ---- Handlers ----
  onSearch(): void {
    this.searched = true;                         // your template uses this gate
    const id = this.searchId().trim() || null;
    this.searchId$.next(id);                      // manual search path
  }
}
