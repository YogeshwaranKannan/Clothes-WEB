import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RuntimeConfigLoaderService } from '../core/services/runtime-config-loader.service';
import { nameLettersOnly } from '../checkout/validators';
import { CartItem } from '../store/cart/cart-item.model';

@Component({
  selector: 'app-orders-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './orders-history.component.html',
  styleUrls: ['./orders-history.component.scss']
})
export class OrdersHistoryComponent implements OnInit {
  orders: any[] = [];
  loading = true;
  error: string | null = null;

  constructor(private http: HttpClient, private runtimeConfig: RuntimeConfigLoaderService) {}

  ngOnInit(): void {
   
  }

  loadOrders() {
   
  }

  getName(order: any): string {
    return (
      order?.items?.[0]?.name || ''
    );
  }

  getImage(order: any): string {
    return "https://dev.fr.api.intellesyde.com/" + order.item.images?.[0];
  }

  getDealPrice(order: any): number {
    return order?.dealPrice ?? order?.items?.[0]?.dealPrice ?? order?.items?.[0]?.price ?? 0;
  }

  getPlacedAt(order: any): string | Date | null {
    return order?.placedAt || order?.createdAt || order?.date || null;
  }
}
