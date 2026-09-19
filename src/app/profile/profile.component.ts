// import { Component } from "@angular/core";

// import { CommonModule } from "@angular/common";
// import { CustomerInformationComponent } from "../checkout/customer-information/customer-information.component";

// import { PaymentComponent } from "../checkout/payment/payment.component";
// import { ShippingAddressComponent } from "../checkout/shipping-address/shipping-address.component";
// import { FormsModule } from "@angular/forms";
// import {
//   FormBuilder,
//   FormGroup,
//   ReactiveFormsModule,
//   Validators,
// } from "@angular/forms";
// import { digitsOnly, strictEmail } from "../checkout/validators";
// import { CheckoutValidationService } from "../checkout/services/checkout-validation.service";
// import { Router } from "@angular/router";

// @Component({
//   selector: "app-profile",
//   standalone: true,
//   imports: [
//     CommonModule,
//     CustomerInformationComponent,
//     ShippingAddressComponent,
//     PaymentComponent,
//     ReactiveFormsModule,
//     FormsModule,
//   ],
//   templateUrl: "./profile.component.html",
//   styleUrl: "./profile.component.scss",
// })
// export class ProfileComponent {
//   constructor(
//     private fb: FormBuilder,
//     private checkoutValidationService: CheckoutValidationService,
//     private router: Router,
//   ) {}

//   onUpdateProfile() {
//     // get form data from registered checkout forms
//     const customerForm = this.checkoutValidationService.getForm("customer");

//     if (!customerForm || customerForm.invalid) {
//       customerForm?.markAllAsTouched();
//       return;
//     }

//     const payload = {
//       ...customerForm.value,
//     };

//     console.log("UPDATE PAYLOAD =>", payload);

//     // TODO: replace with real API
//     // this.userService.updateProfile(payload).subscribe()

//     alert("Profile updated successfully");
//   }

//   onCancel() {
//     // navigate back or reset
//     this.router.navigate(["/"]);
//   }
// }

import { Component, OnInit } from "@angular/core";

import { CommonModule } from "@angular/common";
import { CustomerInformationComponent } from "../checkout/customer-information/customer-information.component";

import { PaymentComponent } from "../checkout/payment/payment.component";
import { ShippingAddressComponent } from "../checkout/shipping-address/shipping-address.component";
import { FormsModule } from "@angular/forms";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { digitsOnly, strictEmail } from "../checkout/validators";
import { CheckoutValidationService } from "../checkout/services/checkout-validation.service";
import { Router } from "@angular/router";
import { AuthService } from "../core/auth/auth.service";

@Component({
  selector: "app-profile",
  standalone: true,
  imports: [
    CommonModule,
    CustomerInformationComponent,
    ShippingAddressComponent,
    PaymentComponent,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: "./profile.component.html",
  styleUrl: "./profile.component.scss",
})
export class ProfileComponent implements OnInit {
  customerForm: FormGroup;
  constructor(
    private fb: FormBuilder,
    private checkoutValidationService: CheckoutValidationService,
    private router: Router,
    private auth: AuthService,
  ) {
    this.customerForm = this.fb.group({
      firstName: ["", Validators.required],

      email: ["", [strictEmail]],
      phone: ["", [Validators.required, digitsOnly(15)]],

      streetAddress: [""],
      city: [""],
      state: [""],
      zipCode: [""],
    });
  }
  ngOnInit(): void {
    this.fetchProfile();
  }

  fetchProfile(): void {
    const currentUser = this.auth.user();

    if (!currentUser?.id) {
      return;
    }

    this.auth.getProfile(currentUser.id).subscribe({
      next: (res: any) => {
        console.log("Latest Profile =>", res);

        const addr = res.lastDeliveryAddesses?.at(-1);

        // Populate form
        this.customerForm.patchValue({
          firstName: res.firstName?.trim() ?? "",
          lastName: res.lastName?.trim() ?? "",
          email: res.email ?? "",
          phone: res.mobileNum ?? "",

          streetAddress: addr?.Address ?? "",
          city: addr?.city ?? "",
          state: addr?.state ?? "",
          zipCode: addr?.postalCode ?? "",
        });

        // Map API -> AuthUser
        const updatedUser = {
          id: res.id,
          firstName: res.firstName?.trim() ?? "",
          lastName: res.lastName?.trim() ?? "",
          email: res.email ?? "",
          phone: res.mobileNum ?? "",

          type: res.type ?? "buyer",
          role: res.role ?? "USER",

          reward: res.reward ?? 0,
          lastEarned: res.lastEarned ?? 0,
          lastRedeemed: res.lastRedeemed ?? 0,
          totalRedeemed: res.totalRedeemed ?? 0,

          lastDeliveryAddesses: res.lastDeliveryAddesses ?? [],
        };

        this.auth.updateUser(updatedUser);
      },

      error: (err) => {
        console.error("Profile fetch failed =>", err);
      },
    });
  }

  loadUserLastDeliveryAddress(): void {
    const user = this.auth.user();

    console.log("Profile User =>", user);

    if (!user) return;

    // Always load user info
    this.customerForm.patchValue({
      email: user.email ?? "",
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      phone: user.phone ?? "",
    });

    // Load address only if present
    const addr =
      user.lastDeliveryAddesses?.[(user.lastDeliveryAddesses?.length ?? 1) - 1];

    if (addr) {
      this.customerForm.patchValue({
        streetAddress: addr.Address ?? "",
        city: addr.city ?? "",
        state: addr.state ?? "",
        zipCode: addr.postalCode ?? "",
      });
    }
  }
  isUpdating = false;
  onUpdateProfile(): void {
    console.log("Update button clicked");

    console.log("Form Valid =>", this.customerForm.valid);
    console.log("Form Value =>", this.customerForm.getRawValue());

    Object.keys(this.customerForm.controls).forEach((key) => {
      const control = this.customerForm.get(key);

      console.log({
        field: key,
        value: control?.value,
        valid: control?.valid,
        errors: control?.errors,
      });
    });
    this.isUpdating = true;
    if (this.customerForm.invalid) {
      this.isUpdating = false;
      console.log("FORM INVALID");
      this.customerForm.markAllAsTouched();
      return;
    }

    const form = this.customerForm.getRawValue();
    const currentUser = this.auth.user();

    console.log("Current User =>", currentUser);

    if (!currentUser) {
      this.isUpdating = false;
      alert("User not found");
      return;
    }

    const payload = {
      buyerid: currentUser.id,

      firstName: form.firstName,
      lastName: "",
      phone: form.phone,
      email: form.email,
      city: form.city,
      state: form.state,
      streetAddress: form.streetAddress,

      existStreetAddress:
        currentUser.lastDeliveryAddesses?.[
          (currentUser.lastDeliveryAddesses?.length ?? 1) - 1
        ]?.Address,

      zipCode: form.zipCode,
    };

    console.log("UPDATE PAYLOAD =>", payload);

    this.auth.updateProfile(payload).subscribe({
      next: (res: any) => {
        console.log("Profile Updated =>", res);
        this.isUpdating = false;
        this.fetchProfile();

        alert("Profile updated successfully");
      },

      error: (err) => {
        this.isUpdating = false;
        console.error("Update Error =>", err);
        console.error("Error Response =>", err?.error);

        alert(err?.error?.message || "Something went wrong");
      },
    });
  }

  onCancel() {
    // navigate back or reset
    this.router.navigate(["/"]);
  }
}
