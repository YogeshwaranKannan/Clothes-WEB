// import { HttpInterceptorFn } from "@angular/common/http";
// import { inject } from "@angular/core";
// import { AuthService } from "../auth/auth.service";

// export const authInterceptor: HttpInterceptorFn = (req, next) => {
//   const authService = inject(AuthService);

//   if (
//     req.url.includes("/login") ||
//     req.url.includes("/signup") ||
//     req.url.includes("/GetSellerDetails")
//   ) {
//     return next(req);
//   }

//   const isLoggedIn = authService.isLoggedIn(); // computed signal
//   const token = authService.getAccessToken();
//   const role = authService.getRole();

//   const headers: Record<string, string> = {
//     "x-user-role": isLoggedIn ? role : "USER",
//   };

//   if (isLoggedIn && token) {
//     headers["Authorization"] = `Bearer ${token}`;
//   }

//   console.log("IS LOGGED IN =>", isLoggedIn);
//   console.log("TOKEN =>", token);
//   console.log("ROLE =>", headers["x-user-role"]);

//   return next(
//     req.clone({
//       setHeaders: headers,
//     }),
//   );
// };

import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthService } from "../auth/auth.service";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  if (
    req.url.includes("/login") ||
    req.url.includes("/signup") ||
    req.url.includes("/GetSellerDetails")
  ) {
    console.log("REQUEST (SKIPPED AUTH) =>", {
      method: req.method,
      url: req.url,
      body: req.body,
      headers: req.headers.keys().reduce(
        (acc, key) => ({
          ...acc,
          [key]: req.headers.get(key),
        }),
        {},
      ),
    });

    return next(req);
  }

  const isLoggedIn = authService.isLoggedIn();
  const token = authService.getAccessToken();
  const role = authService.getRole();

  const headers: Record<string, string> = {
    "x-user-role": isLoggedIn ? (role ?? "WEB-GUEST") : "WEB-GUEST",
  };

  if (isLoggedIn || token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const authReq = req.clone({
    setHeaders: headers,
  });

  console.log("========== OUTGOING REQUEST ==========");
  console.log("METHOD =>", authReq.method);
  console.log("URL =>", authReq.url);
  console.log("BODY =>", authReq.body);
  console.log(
    "HEADERS =>",
    authReq.headers.keys().reduce(
      (acc, key) => ({
        ...acc,
        [key]: authReq.headers.get(key),
      }),
      {},
    ),
  );
  console.log("IS LOGGED IN =>", isLoggedIn);
  console.log("TOKEN =>", token);
  console.log("ROLE =>", headers["x-user-role"]);
  console.log("=====================================");

  return next(authReq);
};
