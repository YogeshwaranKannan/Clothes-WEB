import { Routes } from "@angular/router";
import { LandingComponent } from "./landing/landing.component";
import { OrderDetailComponent } from "./order-detail/order-detail.component";
import { authGuard } from "./core/guards/auth.guard";
import { companyname } from "./common/utils/constant";

// Canonical prefix for legal pages, e.g. "/Dolphin"
const legalBase = `/${companyname.replace(/^\/+|\/+$/g, "")}`;

export const routes: Routes = [
  {
    path: "checkout",
    loadComponent: () =>
      import("./checkout/checkout.component").then((m) => m.CheckoutComponent),
    data: { seo: { title: "Checkout", noindex: true } },
  },
  { path: "", component: LandingComponent, data: { seo: {} } },
  {
    path: "products",
    loadComponent: () =>
      import("./product-list/product-list.component").then(
        (m) => m.ProductListComponent,
      ),
    data: {
      seo: {
        title: "Shop All Products",
        description:
          "Browse Dolphin Naturals' full range of natural groceries – rice, millets, pulses, oils, ghee and more.",
      },
    },
  },
  // One canonical URL per product: /product/:id
  { path: "products/:id", redirectTo: "product/:id" },

  {
    path: "category/:id",
    loadComponent: () =>
      import("./product-list/product-list.component").then(
        (m) => m.ProductListComponent,
      ),
    data: { seo: { title: "Shop by Category" } },
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
    data: { seo: { title: "Cart", noindex: true } },
  },
  {
    path: "wishlist",
    loadComponent: () =>
      import("./wishlist/wishlist.component").then((m) => m.WishlistComponent),
    data: { seo: { title: "Wishlist", noindex: true } },
  },
  {
    path: "order-history",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./order-history/order-history.component").then(
        (m) => m.OrderHistoryComponent,
      ),
    data: { seo: { title: "My Orders", noindex: true } },
  },
  {
    path: "orders",
    loadComponent: () =>
      import("./order-history/order-history.component").then(
        (m) => m.OrderHistoryComponent,
      ),
    data: { seo: { title: "My Orders", noindex: true } },
  },
  {
    path: "orders/:order_id",
    loadComponent: () =>
      import("./order-history/order-history.component").then(
        (m) => m.OrderHistoryComponent,
      ),
    data: { seo: { title: "My Orders", noindex: true } },
  },
  {
    path: "profile",
    loadComponent: () =>
      import("./profile/profile.component").then((m) => m.ProfileComponent),
    data: { seo: { title: "My Profile", noindex: true } },
  },
  // { path: 'all-products',
  //   loadComponent: () => import('./product-management/product-management.component').then(m=>m.ProductManagementComponent)
  // },
  {
    path: "admin-management",
    loadChildren: () =>
      import("./admin/admin.routes").then((m) => m.ADMIN_ROUTES),
    data: { seo: { title: "Admin", noindex: true } },
  },
  {
    path: "track-order/:refNo",
    component: OrderDetailComponent,
    data: { seo: { title: "Track Your Order", noindex: true } },
  },
  {
    path: "profile",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./checkout/customer-information/customer-information.component").then(
        (m) => m.CustomerInformationComponent,
      ),
    data: { seo: { title: "My Profile", noindex: true } },
  },
  {
    path: "login",
    loadComponent: () =>
      import("./common/components/login/login.component").then(
        (m) => m.LoginComponent,
      ),
    data: { seo: { title: "Login", noindex: true } },
  },

  // --- Legal / policy pages ---
  {
    path: ":companyname/terms-of-service",
    loadComponent: () =>
      import("./legal/legal-page.component").then((m) => m.LegalPageComponent),
    data: {
      slug: "terms-of-service",
      seo: { title: "Terms of Service", path: `${legalBase}/terms-of-service` },
    },
  },
  {
    path: ":companyname/privacy-policy",
    loadComponent: () =>
      import("./legal/legal-page.component").then((m) => m.LegalPageComponent),
    data: {
      slug: "privacy-policy",
      seo: { title: "Privacy Policy", path: `${legalBase}/privacy-policy` },
    },
  },
  {
    path: ":companyname/data-protection",
    loadComponent: () =>
      import("./legal/legal-page.component").then((m) => m.LegalPageComponent),
    data: {
      slug: "data-protection",
      seo: {
        title: "Data Protection Statement",
        path: `${legalBase}/data-protection`,
      },
    },
  },
  {
    path: ":companyname/contact-us",
    loadComponent: () =>
      import("./legal/legal-page.component").then((m) => m.LegalPageComponent),
    data: {
      slug: "contact-us",
      seo: { title: "Contact Us", path: `${legalBase}/contact-us` },
    },
  },
  {
    path: ":companyname/refund-policy",
    loadComponent: () =>
      import("./legal/legal-page.component").then((m) => m.LegalPageComponent),
    data: {
      slug: "refund-policy",
      seo: { title: "Refund Policy", path: `${legalBase}/refund-policy` },
    },
  },
  {
    path: ":companyname/shipping-policy",
    loadComponent: () =>
      import("./legal/legal-page.component").then((m) => m.LegalPageComponent),
    data: {
      slug: "shipping-policy",
      seo: { title: "Shipping Policy", path: `${legalBase}/shipping-policy` },
    },
  },
  {
    path: "my-inventory",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./features/seller/my-inventory/my-inventory.component").then(
        (m) => m.MyInventoryComponent,
      ),
    data: { seo: { title: "My Inventory", noindex: true } },
  },
  {
    path: ":companyname/about-us",
    loadComponent: () =>
      import("./legal/about-us.component").then((m) => m.AboutUsComponent),
    data: {
      slug: "about-us",
      seo: { title: "About Us", path: `${legalBase}/about-us` },
    },
  },

  // Short URLs (e.g. /about-us, /refund-policy) for payment-gateway forms
  // and printed material – redirect to the canonical /<company>/... pages
  ...[
    "about-us",
    "terms-of-service",
    "privacy-policy",
    "data-protection",
    "contact-us",
    "refund-policy",
    "shipping-policy",
  ].map((slug) => ({ path: slug, redirectTo: `${legalBase}/${slug}` })),

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

  // Not real pages yet – keep sending them home rather than to the 404 page
  { path: "search", redirectTo: "" },
  { path: "signup", redirectTo: "" },

  {
    path: "**",
    loadComponent: () =>
      import("./not-found/not-found.component").then(
        (m) => m.NotFoundComponent,
      ),
    data: { seo: { title: "Page not found", noindex: true } },
  },
];
