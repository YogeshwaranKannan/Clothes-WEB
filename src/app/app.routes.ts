import { Routes } from "@angular/router";
import { LandingComponent } from "./landing/landing.component";
import { OrderDetailComponent } from "./order-detail/order-detail.component";
import { authGuard } from "./core/guards/auth.guard";

export const routes: Routes = [
  {
    path: "checkout",
    loadComponent: () =>
      import("./checkout/checkout.component").then((m) => m.CheckoutComponent),
  },
  { path: "", component: LandingComponent },
  {
    path: "products",
    loadComponent: () =>
      import("./product-list/product-list.component").then(
        (m) => m.ProductListComponent,
      ),
  },
  {
    path: "products/:id",
    loadComponent: () =>
      import("./product/product.component").then((m) => m.ProductComponent),
  },

  {
    path: "category/:id",
    loadComponent: () =>
      import("./product-list/product-list.component").then(
        (m) => m.ProductListComponent,
      ),
  },
  {
    path: "product/:id",
    loadComponent: () =>
      import("./product/product.component").then((m) => m.ProductComponent),
  },

  {
    path: "cart",
    loadComponent: () =>
      import("./cart/cart.component").then((m) => m.CartComponent),
  },
  {
    path: "wishlist",
    loadComponent: () =>
      import("./wishlist/wishlist.component").then((m) => m.WishlistComponent),
  },
  {
    path: "order-history",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./order-history/order-history.component").then(
        (m) => m.OrderHistoryComponent,
      ),
  },
  {
    path: "orders",
    loadComponent: () =>
      import("./order-history/order-history.component").then(
        (m) => m.OrderHistoryComponent,
      ),
  },
  {
    path: "orders/:order_id",
    loadComponent: () =>
      import("./order-history/order-history.component").then(
        (m) => m.OrderHistoryComponent,
      ),
  },
  {
    path: "profile",
    loadComponent: () =>
      import("./profile/profile.component").then((m) => m.ProfileComponent),
  },
  // { path: 'all-products',
  //   loadComponent: () => import('./product-management/product-management.component').then(m=>m.ProductManagementComponent)
  // },
  {
    path: "admin-management",
    loadChildren: () =>
      import("./admin/admin.routes").then((m) => m.ADMIN_ROUTES),
  },
  {
    path: "track-order/:refNo",
    component: OrderDetailComponent,
    // Optional: give the page a meaningful title (requires Angular 14+)
    title: "Track Your Order",
  },
  {
    path: "profile",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./checkout/customer-information/customer-information.component").then(
        (m) => m.CustomerInformationComponent,
      ),
  },
  {
    path: "login",
    loadComponent: () =>
      import("./common/components/login/login.component").then(
        (m) => m.LoginComponent,
      ),
  },

  // --- Legal / policy pages ---
  {
    path: ":companyname/terms-of-service",
    loadComponent: () =>
      import("./legal/legal-page.component").then((m) => m.LegalPageComponent),
    data: { slug: "terms-of-service" },
    title: "Terms of Service",
  },
  {
    path: ":companyname/privacy-policy",
    loadComponent: () =>
      import("./legal/legal-page.component").then((m) => m.LegalPageComponent),
    data: { slug: "privacy-policy" },
    title: "Privacy Policy",
  },
  {
    path: ":companyname/data-protection",
    loadComponent: () =>
      import("./legal/legal-page.component").then((m) => m.LegalPageComponent),
    data: { slug: "data-protection" },
    title: "Data Protection Statement",
  },
  {
    path: ":companyname/contact-us",
    loadComponent: () =>
      import("./legal/legal-page.component").then((m) => m.LegalPageComponent),
    data: { slug: "contact-us" },
    title: "Contact Us",
  },
  {
    path: ":companyname/refund-policy",
    loadComponent: () =>
      import("./legal/legal-page.component").then((m) => m.LegalPageComponent),
    data: { slug: "refund-policy" },
    title: "Refund Policy",
  },
  {
    path: ":companyname/shipping-policy",
    loadComponent: () =>
      import("./legal/legal-page.component").then((m) => m.LegalPageComponent),
    data: { slug: "shipping-policy" },
    title: "Shipping Policy",
  },

  /* {
    path: 'product-management/:id',
    loadComponent: () => import('./product-management/product-management.component').then(m=>m.ProductManagementComponent)
  },
  {
    path: 'grid/:id',
    loadComponent: () => import('./grid/grid.component').then(m => m.GridComponent)
  },
  {
    path: 'product/:id',
    loadComponent: () => import('./grid/grid.component').then(m => m.GridComponent)
  },*/

  { path: "**", redirectTo: "" },
];
