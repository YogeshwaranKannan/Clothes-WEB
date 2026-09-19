import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { RuntimeConfigLoaderService } from '../../core/services/runtime-config-loader.service';

export interface Customer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface Shipping {
  streetAddress: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  saveForFuture?: boolean;
  billingSameAsShipping?: boolean;
}

export interface Payment {
  method: string;
  cardNumber?: string;
  expiry?: string;
  cvv?: string;
  nameOnCard?: string;
}

export interface Order {
  customer: Customer;
  shipping: Shipping;
  payment: Payment;
  items: any[];
  pricing: any;
  // optional metadata
  meta?: Record<string, any>;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private http: HttpClient, private runtimeConfig: RuntimeConfigLoaderService) {}

  placeOrder(order: Order): Observable<any> {
    // returns the backend response observable
    const apiBaseUrl = this.runtimeConfig.get('apiBaseUrl');
    const base = apiBaseUrl || 'https://dev.fr.api.intellesyde.com/';
    return this.http.post<any>(`${base}/api/orders`, order);
  }
}
