// import { Injectable } from '@angular/core';
// import { FormGroup } from '@angular/forms';

// @Injectable({
//   providedIn: 'root',
// })
// export class CheckoutValidationService {
//   // keyed forms map so callers can retrieve by name
//   private keyed: Record<string, FormGroup> = {};

//   /**
//    * Register a FormGroup under a key. This is the only supported form registration API.
//    * Example: registerForm('customer', customerForm)
//    */
//   registerForm(name: string, form: FormGroup): void {
//     if (!name || !form) return;
//     this.keyed[name] = form;
//   }

//   /** Retrieve a keyed form */
//   getForm(name: string): FormGroup | undefined {
//     return this.keyed[name];
//   }

//   validateAll(): boolean {
//     let allValid = true;
//     const invalidForms: string[] = [];
//     Object.entries(this.keyed).forEach(([name, f]) => {
//       // ensure latest validation state
//       try {
//         f.markAllAsTouched();
//         f.updateValueAndValidity({ onlySelf: false });
//       } catch (e) {
//         // ignore if updateValueAndValidity not supported
//       }
//       if (!f.valid) {
//         allValid = false;
//         invalidForms.push(name);
//       }
//     });

//     if (!allValid) {
//       // helpful debug output to pinpoint which form(s) failed and why
//       console.warn('[CheckoutValidation] validateAll failed for forms:', invalidForms);
//       invalidForms.forEach((n) => {
//         const form = this.keyed[n];
//         if (!form) return;
//         Object.keys(form.controls).forEach((cName) => {
//           const ctrl = form.controls[cName];
//           if (ctrl && ctrl.invalid) {
//             console.warn(`[CheckoutValidation] form='${n}' control='${cName}' errors:`, ctrl.errors);
//           }
//         });
//       });
//     }

//     return allValid;
//   }
// }

import { Injectable } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { PaymentComponent } from "../paymentOptions/payment.component";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class CheckoutValidationService {
  private keyed: Record<string, FormGroup> = {};

  private paymentComponent?: PaymentComponent;
  private selectedPaymentMode$ = new BehaviorSubject<string | null>(null);
  paymentMode$ = this.selectedPaymentMode$.asObservable();

  registerPaymentComponent(component: PaymentComponent): void {
    this.paymentComponent = component;
  }

  getPaymentComponent(): PaymentComponent | undefined {
    return this.paymentComponent;
  }

  registerForm(name: string, form: FormGroup): void {
    if (!name || !form) return;
    this.keyed[name] = form;
  }

  getForm(name: string): FormGroup | undefined {
    return this.keyed[name];
  }

  setSelectedPaymentMode(mode: string) {
    this.selectedPaymentMode$.next(mode);
  }

  validateAll(): boolean {
    let allValid = true;
    const invalidForms: string[] = [];

    Object.entries(this.keyed).forEach(([name, f]) => {
      try {
        f.markAllAsTouched();
        f.updateValueAndValidity({ onlySelf: false });
      } catch (e) {}

      if (!f.valid) {
        allValid = false;
        invalidForms.push(name);
      }
    });

    if (!allValid) {
      console.warn(
        "[CheckoutValidation] validateAll failed for forms:",
        invalidForms,
      );

      invalidForms.forEach((n) => {
        const form = this.keyed[n];
        if (!form) return;

        Object.keys(form.controls).forEach((cName) => {
          const ctrl = form.controls[cName];

          if (ctrl.invalid) {
            console.warn(
              `[CheckoutValidation] form='${n}' control='${cName}' errors:`,
              ctrl.errors,
            );
          }
        });
      });
    }

    return allValid;
  }
}
