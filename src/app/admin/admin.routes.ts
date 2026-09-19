import { Routes } from '@angular/router';
import { AdminManagementComponent } from './admin-management/admin-management.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';
//import { ProductManagementComponent } from './product-management/product-management.component';
import { OrderManagementComponent } from './order-management/order-management.component';
import { ReportsManagementComponent } from './reports-management/reports-management.component';
import { AddProductComponent } from './add-product/add-product.component';
import { SellerOrderDetailsComponent } from './seller-order-details/seller-order-details.component';

export const ADMIN_ROUTES: Routes = [
  {
    
    path: '',
    component: AdminManagementComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      //{ path: 'all-products', component: ProductManagementComponent },
      { path: 'add-products', component: AddProductComponent },
      { path: 'orders', component: OrderManagementComponent },
      //{ path: 'order-history', loadComponent: () => import('./order-history/order-history.component').then(m => m.OrderHistoryComponent) },
      {path: 'order-details', component : SellerOrderDetailsComponent},
      { path: 'reports', component: ReportsManagementComponent }
    ]
  }
];
