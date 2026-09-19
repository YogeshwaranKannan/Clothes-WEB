// ============================================================
// auth.service.ts
// src/app/core/auth/auth.service.ts
//
// CURRENT STATE: Mock JWT simulation (no real backend).
// FUTURE STATE:  Replace MockTokenService calls with real API calls.
//                Everything else in this file stays the same.
// ============================================================

import { Injectable, signal, computed } from "@angular/core";
import { Observable, tap, throwError } from "rxjs";
import { BASE_URL } from "../../common/utils/constant";
import { HttpClient } from "@angular/common/http";
import { catchError, map } from "rxjs/operators";
// ── Interfaces ────────────────────────────────────────────────────────────────

export type WebRole = "WEB-GUEST" | "WEB-LOGGED";
export interface LastDeliveryAddress {
  Address: string;
  city: string;
  postalCode: string;
  state: string;
}
export interface AuthUser {
  id?: string;

  firstName?: string;

  lastName?: string;

  email: string;

  phone: string;

  type: "buyer" | "seller";

  role: WebRole;

  lastDeliveryAddesses?: LastDeliveryAddress[];

  reward?: number;

  lastEarned?: number;

  lastRedeemed?: number;

  totalRedeemed?: number;
  availableRewards?: number;
}

// export interface AuthUser {
//   id?: string;
//   name: string;
//   email: string;
//   phone: string;
//   type: "buyer" | "seller";
//   // [ADDED] role is now part of the user object, sourced from the mock token
//   // payload. In a real system this comes from the JWT claim.
//   role: "USER" | "ADMIN";
// }

// [ADDED] Represents the decoded payload of a mock (or real) JWT.
// When you switch to real JWTs, this interface stays the same —
// your decodeAccessToken() method populates it from the real JWT payload.
export interface TokenPayload {
  sub: string; // user ID (UUID in production)
  email: string;
  role: WebRole;
  type: "buyer" | "seller";
  iat: number; // issued at (Unix seconds)
  exp: number; // expires at (Unix seconds)
}

// [UPDATED] Full auth state now includes expiry and role at the top level
// for fast access without decoding the token on every check.
export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null; // short-lived (mock: 1 hour)
  refreshToken: string | null; // long-lived  (mock: 7 days)
  expiresAt: number | null; // Unix ms timestamp — when accessToken expires
  role: WebRole;
}

// ── Storage ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "app_auth_state_v1";

// ── MockTokenService ──────────────────────────────────────────────────────────
//
// WHY THIS EXISTS:
//   The real backend generates JWT tokens signed with a secret key.
//   We do not have a backend yet, so this service simulates that step.
//   It generates structurally valid base64url-encoded strings in the
//   JWT format (header.payload.signature) but the signature is fake.
//
// WHAT CHANGES WHEN THE BACKEND IS READY:
//   DELETE this entire class. The real tokens come from the API response.
//   Nothing else in AuthService changes.
//
// WHY NOT USE A REAL JWT LIBRARY NOW:
//   Real JWT signing requires a secret key. There is no secret key on the
//   UI. Importing a JWT library and generating "signed" tokens in the browser
//   would be misleading — the tokens look real but provide zero security.
//   This mock is honest about being a mock.

// class MockTokenService {
//   // base64url encoding helper (browser-safe, no Buffer)
//   private static b64url(obj: object): string {
//     return btoa(JSON.stringify(obj))
//       .replace(/\+/g, "-")
//       .replace(/\//g, "_")
//       .replace(/=+$/, "");
//   }

//   // Generates a mock access token in JWT format.
//   // Structure: base64(header).base64(payload).MOCK_SIGNATURE
//   // The signature is a constant string — it is NOT cryptographically valid.
//   // A real backend would use HMAC-SHA256 with a secret key.
//   static generateAccessToken(user: AuthUser): string {
//     const header = { alg: "HS256", typ: "JWT" };
//     const now = Math.floor(Date.now() / 1000);
//     const payload: TokenPayload = {
//       sub: user.id ?? `mock-${user.email}`,
//       email: user.email,
//       role: user.role,
//       type: user.type,
//       iat: now,
//       exp: now + 3600, // 1 hour in seconds (production: 15 minutes)
//     };
//     // MOCK ONLY — real signature would be HMAC-SHA256(header.payload, SECRET)
//     const mockSignature = "MOCK_SIGNATURE_NOT_CRYPTOGRAPHICALLY_VALID";
//     return `${this.b64url(header)}.${this.b64url(payload)}.${mockSignature}`;
//   }

//   // Generates a mock refresh token.
//   // In production this would be a signed JWT or a random UUID stored in the DB.
//   static generateRefreshToken(user: AuthUser): string {
//     const header = { alg: "HS256", typ: "JWT" };
//     const now = Math.floor(Date.now() / 1000);
//     const payload = {
//       sub: user.id ?? `mock-${user.email}`,
//       email: user.email,
//       iat: now,
//       exp: now + 604800, // 7 days in seconds
//       tokenType: "refresh",
//     };
//     return `${this.b64url(header)}.${this.b64url(payload)}.MOCK_REFRESH_SIG`;
//   }

//   // Calculates expiresAt in milliseconds (for Date.now() comparisons in UI).
//   static getExpiresAt(): number {
//     return Date.now() + 3600 * 1000; // 1 hour from now in ms
//   }
// }

// ── AuthService ───────────────────────────────────────────────────────────────

@Injectable({ providedIn: "root" })
export class AuthService {
  // ── In-memory reactive state (Signals) ─────────────────────────────────────
  //
  // All UI components read from these Signals.
  // They are the single source of truth during the active session.
  // localStorage is only used for persistence across page refreshes.
  private readonly url = `${BASE_URL}/updateProfile`;

  private _user = signal<AuthUser | null>(null);
  private _tokens = signal<{ access: string | null; refresh: string | null }>({
    access: null,
    refresh: null,
  });
  private _expiresAt = signal<number | null>(null);
  private _role = signal<WebRole | null>(null);

  // ── Public read-only signals ───────────────────────────────────────────────

  readonly user = computed(() => this._user());
  readonly role = computed(() => this._role());

  // isLoggedIn: true if there is a user in memory AND the access token has
  // not expired. Components and guards call isLoggedIn() to check auth state.
  // [UPDATED from original] Now also checks token expiry.
  readonly isLoggedIn = computed(() => {
    if (!this._user()) return false;
    const exp = this._expiresAt();
    if (exp === null) return true; // no expiry info → treat as valid (backward compat)
    return Date.now() < exp;
  });

  // [ADDED] True only if the current user has the ADMIN role.
  // Use this in guards for admin-only routes.

  // ── Constructor ────────────────────────────────────────────────────────────

  constructor(private http: HttpClient) {
    this.restoreSession();
  }

  getAuthState(): AuthState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (!raw) return null;

      return JSON.parse(raw) as AuthState;
    } catch (e) {
      console.error("Failed to get auth state", e);
      return null;
    }
  }

  private normalizeWebRole(role: any): WebRole {
    switch (String(role ?? "").toUpperCase()) {
      case "WEB-LOGGED":
      case "LOGGED":
      case "USER":
        return "WEB-LOGGED";

      case "WEB-GUEST":
      case "GUEST":
        return "WEB-GUEST";

      default:
        return "WEB-GUEST";
    }
  }

  // ── login() ───────────────────────────────────────────────────────────────
  //
  // CURRENT (mock): called from LoginComponent with a user object.
  //   The mock tokens are generated here on the UI side.
  //
  // FUTURE (real API): called from LoginComponent with both user + tokens
  //   returned from POST /api/auth/login. Remove MockTokenService calls below.
  //   The tokens arrive from the API — this method only stores them.
  //
  // WHAT NEVER CHANGES: the method signature and the localStorage persistence.

  login(
    user: AuthUser,
    tokens?: {
      accessToken?: string;
      refreshToken?: string;
      expiresAt?: number;
    },
  ): void {
    // ── MOCK BRANCH ───────────────────────────────────────────────────────
    // When no real tokens are provided (current state), generate mock tokens.
    // DELETE this branch when you integrate a real backend.
    const accessToken = tokens?.accessToken ?? null;
    const refreshToken = tokens?.refreshToken ?? null;
    const expiresAt = tokens?.expiresAt ?? null;

    if (!accessToken || !refreshToken) {
      throw new Error("Tokens are required from backend");
    }
    // ── END MOCK BRANCH ───────────────────────────────────────────────────

    // Update in-memory Signals
    this._user.set(user);
    this._tokens.set({ access: accessToken, refresh: refreshToken });
    this._expiresAt.set(expiresAt);
    this._role.set(user.role);

    // Persist to localStorage so state survives page refresh
    const state: AuthState = {
      user,
      accessToken,
      refreshToken,
      expiresAt,
      role: user.role,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // Swallow storage errors (private browsing, quota exceeded, etc.)
    }
  }

  // ── logout() ──────────────────────────────────────────────────────────────
  //
  // Clears all state. Stays the same in real JWT flow.
  // In production, also call POST /api/auth/logout to revoke the refresh token.

  logout(): void {
    // Clear signals
    this._user.set(null);

    this._tokens.set({
      access: null,
      refresh: null,
    });

    this._expiresAt.set(null);

    this._role.set(null);

    try {
      // Clear persisted auth state
      localStorage.removeItem(STORAGE_KEY);

      // Clear standalone JWT token
      localStorage.removeItem("token");

      // Optional: clear any role cache if stored separately
      localStorage.removeItem("role");
    } catch (e) {
      console.error("Error clearing auth data", e);
    }
  }

  getProfile(buyerid: string) {
    return this.http.post<any>(`${BASE_URL}/GetBuyerProfile`, {
      buyerid,
    });
  }

  // auth.service.ts

  refreshProfile(): void {
    const currentUser = this.user();

    if (!currentUser?.id) {
      return;
    }

    this.getProfile(currentUser.id).subscribe({
      next: (res: any) => {
        console.log("Profile refreshed =>", res);

        const updatedUser = {
          id: res.id,
          firstName: res.firstName?.trim() ?? "",
          lastName: res.lastName?.trim() ?? "",
          email: res.email ?? "",
          phone: res.mobileNum ?? "",

          type: res.type ?? "buyer",
          role: this.normalizeWebRole(res.role),

          reward: res.reward ?? 0,
          lastEarned: res.lastEarned ?? 0,
          lastRedeemed: res.lastRedeemed ?? 0,
          totalRedeemed: res.totalRedeemed ?? 0,
          availableRewards: res.availableRewards ?? 0,
          totalRewards: res.totalRewards ?? 0,
          lastDeliveryAddesses: res.lastDeliveryAddesses ?? [],
        };

        this.updateUser(updatedUser);
      },

      error: (err) => {
        console.error("Profile refresh failed", err);
      },
    });
  }

  updateUser(user: AuthUser): void {
    this._user.set(user);

    try {
      const raw = localStorage.getItem(STORAGE_KEY);

      if (raw) {
        const state = JSON.parse(raw) as AuthState;
        state.user = user;

        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch (e) {
      console.error(e);
    }
  }
  updateProfile(payload: any) {
    return this.http.post(this.url, payload);
  }

  // ── getAccessToken() ──────────────────────────────────────────────────────
  //
  // [ADDED] Returns the current access token for use in HTTP interceptors.
  // Usage (in your AuthInterceptor):
  //   const token = this.auth.getAccessToken();
  //   if (token) req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  getAccessToken(): string | null {
    return localStorage.getItem("token") || this._tokens().access;
  }

  setAccessToken(token: string): void {
    this._tokens.update((t) => ({
      ...t,
      access: token,
    }));

    localStorage.setItem("token", token);
  }
  getRole(): WebRole | null {
    return this._role() ?? this._user()?.role ?? null;
  }

  // ── isLoggedInSnapshot() ──────────────────────────────────────────────────
  //
  // [ADDED] Synchronous boolean read of login state — safe to call outside
  // Angular's reactive context (e.g. in a non-reactive interceptor or a guard
  // that does not run inside a computed() chain).
  // Prefers the Signal but falls back to localStorage if Signal is null
  // (edge case: guard runs before service constructor completes, which should
  // not happen with Angular's DI but is guarded against defensively).

  isLoggedInSnapshot(): boolean {
    // Fast path: trust the in-memory Signal
    if (this._user() !== null) {
      const exp = this._expiresAt();
      return exp === null || Date.now() < exp;
    }
    // Slow path: check localStorage (page refresh before restoreSession runs)
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const state = JSON.parse(raw) as AuthState;
      if (!state?.user) return false;
      if (state.expiresAt && Date.now() >= state.expiresAt) return false;
      return true;
    } catch {
      return false;
    }
  }

  // ── decodeAccessToken() ───────────────────────────────────────────────────
  //
  // [ADDED] Safely decodes the JWT payload section (base64url → JSON).
  // Works on both mock tokens and real JWTs.
  // Does NOT verify the signature — verification is backend-only.
  // Returns null if the token is malformed or missing.

  decodeAccessToken(): TokenPayload | null {
    const token = this._tokens().access;
    if (!token) return null;
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;
      // base64url → base64 → string → JSON
      const padded = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const json = atob(padded);
      return JSON.parse(json) as TokenPayload;
    } catch {
      return null;
    }
  }

  // ── isTokenExpired() ──────────────────────────────────────────────────────
  //
  // [ADDED] Checks if the access token's exp claim is in the past.
  // Used by guards and the refresh flow.
  // Returns true (expired) if the token is missing or undecodable.

  isTokenExpired(): boolean {
    const exp = this._expiresAt();
    if (exp === null) {
      // Fall back to decoding the token directly
      const payload = this.decodeAccessToken();
      if (!payload?.exp) return false; // no expiry → treat as valid
      return Date.now() > payload.exp * 1000;
    }
    return Date.now() >= exp;
  }

  // ── refreshAccessToken() ─────────────────────────────────────────────────
  //
  // [ADDED] Placeholder for the real token refresh flow.
  //
  // CURRENT (mock): regenerates a new mock access token from the stored user.
  //   This simulates what the refresh endpoint would do.
  //
  // FUTURE (real API):
  //   return this.http.post<{ accessToken: string; expiresAt: number }>(
  //     '/api/auth/refresh',
  //     { refreshToken: this._tokens().refresh }
  //   ).pipe(
  //     tap(res => {
  //       this._tokens.update(t => ({ ...t, access: res.accessToken }));
  //       this._expiresAt.set(res.expiresAt);
  //       // Update localStorage
  //       ...
  //     }),
  //     catchError(err => {
  //       this.logout();             // refresh token expired → force re-login
  //       return throwError(() => err);
  //     })
  //   );

  // refreshAccessToken(): void {
  //   // MOCK ONLY — simulate a successful token refresh
  //   const user = this._user();
  //   if (!user) return;
  //   const newAccessToken = MockTokenService.generateAccessToken(user);
  //   const newExpiresAt = MockTokenService.getExpiresAt();
  //   this._tokens.update((t) => ({ ...t, access: newAccessToken }));
  //   this._expiresAt.set(newExpiresAt);

  //   // Update localStorage
  //   try {
  //     const raw = localStorage.getItem(STORAGE_KEY);
  //     if (raw) {
  //       const state = JSON.parse(raw) as AuthState;
  //       state.accessToken = newAccessToken;
  //       state.expiresAt = newExpiresAt;
  //       localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  //     }
  //   } catch {}
  // }

  refreshAccessToken(): Observable<string> {
    const refreshToken = this._tokens().refresh;

    if (!refreshToken) {
      this.logout();

      return throwError(() => new Error("No refresh token"));
    }

    return this.http
      .post<{
        accessToken: string;
        refreshToken?: string;
        expiresAt: number;
      }>(`${BASE_URL}/refresh`, {
        refreshToken,
      })
      .pipe(
        tap((res) => {
          console.log("REFRESH RESPONSE =>", res);

          // update memory
          this._tokens.update((t) => ({
            access: res.accessToken,
            refresh: res.refreshToken ?? t.refresh,
          }));

          this._expiresAt.set(res.expiresAt);

          // update localStorage
          try {
            const raw = localStorage.getItem(STORAGE_KEY);

            if (raw) {
              const state = JSON.parse(raw) as AuthState;

              state.accessToken = res.accessToken;
              state.refreshToken = res.refreshToken ?? state.refreshToken;

              state.expiresAt = res.expiresAt;

              localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
            }
          } catch {}
        }),

        // IMPORTANT: convert response object -> string
        map((res) => res.accessToken),

        catchError((err: unknown) => {
          console.error("REFRESH FAILED =>", err);

          this.logout();

          return throwError(() => err);
        }),
      );
  }

  getOrGenerateToken(mobileNum: string) {
    return this.http.post<any>(`${BASE_URL}/getOrGenerateToken`, { mobileNum });
  }
  searchBuyerExist(
    mobileNum: string,
    sellerId: string,
  ): Observable<string | null> {
    return this.http
      .post(`${BASE_URL}/SearchBuyerExist`, null, {
        params: {
          mobileNum,
          sellerid: sellerId,
        },
        responseType: "text",
      })
      .pipe(map((response) => response || null));
  }
  // ── restoreSession() ──────────────────────────────────────────────────────
  //
  // [UPDATED] Now also restores tokens, expiresAt, and role from storage.
  // Also checks token expiry on restore — if expired, clears the session
  // instead of restoring a stale state.

  // restoreSession(): void {
  //   try {
  //     const raw = localStorage.getItem(STORAGE_KEY);
  //     if (!raw) return;
  //     const state = JSON.parse(raw) as AuthState;
  //     if (!state?.user) return;

  //     // If the stored session has an expiry and it has passed, wipe it.
  //     if (state.expiresAt && Date.now() >= state.expiresAt) {
  //       // [ADDED] Auto-logout on restore if token is expired.
  //       // FUTURE: attempt refreshAccessToken() here before giving up.
  //       localStorage.removeItem(STORAGE_KEY);
  //       return;
  //     }

  //     // Restore all signals
  //     this._user.set(state.user);
  //     this._tokens.set({
  //       access: state.accessToken ?? null,
  //       refresh: state.refreshToken ?? null,
  //     });
  //     this._expiresAt.set(state.expiresAt ?? null);
  //     this._role.set(state.role ?? state.user.role ?? null);
  //   } catch {
  //     // Ignore parse errors — treat as logged out
  //   }
  // }

  // restoreSession(): void {
  //   try {
  //     const raw = localStorage.getItem(STORAGE_KEY);

  //     if (!raw) return;

  //     const state = JSON.parse(raw) as AuthState;

  //     if (!state?.user) return;

  //     this._user.set(state.user);

  //     this._tokens.set({
  //       access: state.accessToken ?? null,
  //       refresh: state.refreshToken ?? null,
  //     });

  //     this._expiresAt.set(state.expiresAt ?? null);

  //     this._role.set(state.role ?? state.user.role ?? null);

  //     if (
  //       state.expiresAt &&
  //       Date.now() >= state.expiresAt &&
  //       state.refreshToken
  //     ) {
  //       this.refreshAccessToken().subscribe({
  //         next: () => {
  //           console.log("Expired token refreshed");
  //         },
  //         error: () => {
  //           this.logout();
  //         },
  //       });
  //     }
  //   } catch {}
  // }

  restoreSession(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const token = localStorage.getItem("token");

      console.log("RESTORING SESSION");
      console.log("Stored Auth State =", raw);
      console.log("Stored Token =", token);

      // If auth state missing but token exists,
      // keep access token in memory.
      if (!raw && token) {
        this._tokens.set({
          access: token,
          refresh: null,
        });

        return;
      }

      if (!raw) return;

      const state = JSON.parse(raw) as AuthState;

      this._user.set(state.user);

      this._tokens.set({
        access: state.accessToken ?? token,
        refresh: state.refreshToken ?? null,
      });

      this._expiresAt.set(state.expiresAt ?? null);

      const role = this.normalizeWebRole(state.role ?? state.user?.role);

      this._role.set(role);
    } catch (e) {
      console.error(e);
    }
  }
}
