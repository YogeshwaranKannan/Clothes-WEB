// import { Injectable } from "@angular/core";
// import { BehaviorSubject } from "rxjs";

// /**
//  * Shared open/close state for the mobile offcanvas sidebar.
//  *
//  * The trigger button now lives in <app-header> (mobile-only, top-left of the
//  * header bar), while the offcanvas markup + category logic stays in
//  * <app-navbar>. Since header and navbar are siblings under <app-root>, this
//  * root-provided service is what lets the header's button open the navbar's
//  * sidebar without either component needing a reference to the other.
//  */
// @Injectable({ providedIn: "root" })
// export class MobileMenuService {
//   private readonly _isOpen$ = new BehaviorSubject<boolean>(false);
//   readonly isOpen$ = this._isOpen$.asObservable();

//   get isOpen(): boolean {
//     return this._isOpen$.value;
//   }

//   toggle(): void {
//     this._isOpen$.next(!this._isOpen$.value);
//   }

//   open(): void {
//     this._isOpen$.next(true);
//   }

//   close(): void {
//     this._isOpen$.next(false);
//   }
// }

import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class MobileMenuService {
  private readonly isOpenSubject = new BehaviorSubject<boolean>(false);

  readonly isOpen$ = this.isOpenSubject.asObservable();

  // Mobile Track Order state
  mobileTrackOpen = false;
  mobileTrackRefNo = "";

  get isOpen(): boolean {
    return this.isOpenSubject.value;
  }

  toggle(): void {
    this.isOpenSubject.next(!this.isOpenSubject.value);
  }

  open(): void {
    this.isOpenSubject.next(true);
  }

  close(): void {
    this.isOpenSubject.next(false);

    this.mobileTrackOpen = false;
    this.mobileTrackRefNo = "";
  }

  toggleMobileTrackOrder(): void {
    this.mobileTrackOpen = !this.mobileTrackOpen;

    if (!this.mobileTrackOpen) {
      this.mobileTrackRefNo = "";
    }
  }

  closeMobileTrackOrder(): void {
    this.mobileTrackOpen = false;
    this.mobileTrackRefNo = "";
  }
}
