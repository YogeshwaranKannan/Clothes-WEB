// Put this file in src/app/core/guards/seller.guard.ts (next to auth.guard.ts)
import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../../../core/auth/auth.service";

/** Logged-in sellers only. This hides the page; the backend must enforce the same rule. */
export const sellerGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isLoggedInSnapshot()) {
    return router.createUrlTree(["/login"], {
      queryParams: { returnUrl: state.url },
    });
  }
  return auth.user()?.isSeller ? true : router.createUrlTree(["/"]);
};
