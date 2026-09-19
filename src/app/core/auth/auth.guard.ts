// ============================================================
// auth.guard.ts
// src/app/core/guards/auth.guard.ts
//
// Functional route guard — Angular 14+ style.
// Protects routes that require the user to be logged in.
//
// CURRENT BEHAVIOUR (mock):
//   Checks the isLoggedIn computed Signal in AuthService.
//   This is backed by the user object in memory / localStorage.
//   Does NOT require a real JWT to be present.
//
// FUTURE BEHAVIOUR (real JWT):
//   auth.isLoggedIn already checks token expiry (via _expiresAt Signal).
//   When you add a real backend, isLoggedIn will naturally become more
//   strict as real tokens with real expiry timestamps are stored.
//   No changes to this guard file are needed for the JWT migration.
//
// USAGE (in app.routes.ts):
//   {
//     path: 'profile',
//     canActivate: [authGuard],
//     loadComponent: () => import(...).then(m => m.ProfileComponent),
//   }
// ============================================================

import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "./auth.service";

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // isLoggedIn is a computed Signal — calling it as isLoggedIn() reads the
  // current value. It returns true if:
  //   1. _user signal is non-null (user is in memory or restored from storage)
  //   2. expiresAt is null (no expiry info) OR Date.now() < expiresAt
  if (auth.isLoggedIn()) {
    return true;
  }

  // Not logged in — redirect to /login and pass the attempted URL as returnUrl.
  // The login component reads this param and navigates back after successful login.
  //
  // Example: user visits /order-history while logged out →
  //   redirect to /login?returnUrl=%2Forder-history
  //   after login → navigateByUrl('/order-history')
  return router.createUrlTree(["/login"], {
    queryParams: { returnUrl: state.url },
  });
};

// ── roleGuard (BONUS — future-ready) ─────────────────────────────────────────
//
// [ADDED] A role-based guard for admin-only routes.
// Usage:
//   { path: 'seller-dashboard', canActivate: [roleGuard('ADMIN')], ... }
//
// This is NOT used anywhere yet — it is provided for when you need it.
// It works with the role Signal added to AuthService.

import { CanActivateFn as CanActivateFnAlias } from "@angular/router";

// export function roleGuard(requiredRole: 'USER' | 'ADMIN'): CanActivateFnAlias {
//   return (_route, state) => {
//     const auth   = inject(AuthService);
//     const router = inject(Router);

//     // Must be logged in first
//     if (!auth.isLoggedIn()) {
//       return router.createUrlTree(['/login'], {
//         queryParams: { returnUrl: state.url },
//       });
//     }

//     // Check role
//     if (auth.role() === requiredRole || auth.isAdmin()) {
//       return true;
//     }

//     // Logged in but wrong role — redirect to home (not to login)
//     return router.createUrlTree(['/']);
//   };
// }
