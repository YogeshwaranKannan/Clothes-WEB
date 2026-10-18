// import { Component } from "@angular/core";
// import { CommonModule } from "@angular/common";
// import {
//   FormBuilder,
//   FormGroup,
//   ReactiveFormsModule,
//   Validators,
// } from "@angular/forms";
// import { digitsOnly, strictEmail } from "../validators";
// import { FormsModule } from "@angular/forms";
// import { CheckoutValidationService } from "../services/checkout-validation.service";
// import { ChottaOrder } from "../../common/models/chotta.model";
// import { ChottaService } from "../../common/services/chotta.service";
// import { AuthService } from "../../core/auth/auth.service";
// import { INPUT_LENGTH } from "../../common/utils/input-length.config";
// @Component({
//   selector: "app-customer-information",
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule, FormsModule],
//   templateUrl: "./customer-information.component.html",
//   styleUrls: ["./customer-information.component.scss"],
// })
// export class CustomerInformationComponent {
//   customerForm: FormGroup;

//   customer = {
//     firstName: "",
//     lastName: "",
//     email: "",
//     phone: "",
//     streetAddress: "",
//     apartment: "",
//     city: "",
//     state: "",
//     zipCode: "",
//     country: "",
//     saveForFuture: false,
//     billingSameAsShipping: true,
//   };
//   selectedMode: "DELIVERY" | "PICKUP" = "DELIVERY";

//   readonly INPUT_LENGTH = INPUT_LENGTH;

//   selectedOrder?: ChottaOrder;

//   selectedAddressLabel = "";
//   private filledFromUserAddress = false;

//   constructor(
//     private fb: FormBuilder,
//     private checkoutValidationService: CheckoutValidationService,
//     private chottaService: ChottaService,
//     private authService: AuthService,
//   ) {
//     this.customerForm = this.fb.group({
//       firstName: ["", [Validators.required]],
//       lastName: ["", [Validators.required]],
//       email: ["", [Validators.required, strictEmail]],
//       phone: ["", [Validators.required, digitsOnly(15)]],
//       streetAddress: ["", [Validators.required]],
//       apartment: [""],
//       city: ["", [Validators.required]],
//       state: ["", [Validators.required]],
//       zipCode: ["", [Validators.required, digitsOnly(6)]],
//       country: ["India", [Validators.required]],
//       saveForFuture: [false],
//       billingSameAsShipping: [true],
//       deliveryMode: ["DELIVERY"],
//       selectedAddressLabel: [""],
//     });
//     // register under a key so the review component can read values
//     this.checkoutValidationService.registerForm("customer", this.customerForm);
//     this.loadUserLastDeliveryAddress();
//     this.loadSelectedAddress();
//   }
//   loadUserLastDeliveryAddress(): void {
//     const user = this.authService.user();

//     console.log("Profile User =>", user);

//     if (!user) return;

//     // Always load user info
//     this.customerForm.patchValue({
//       email: user.email ?? "",
//       firstName: user.firstName ?? "",
//       lastName: user.lastName ?? "",
//       phone: user.phone ?? "",
//     });

//     // Load address only if present
//     const addr = user.lastDeliveryAddesses?.at(-1);

//     if (addr) {
//       this.customerForm.patchValue({
//         streetAddress: addr.Address ?? "",
//         city: addr.city ?? "",
//         state: addr.state ?? "",
//         zipCode: addr.postalCode ?? "",
//       });
//     }
//     this.filledFromUserAddress = true;
//   }

//   loadSelectedAddress(): void {
//     this.chottaService.getOrders().subscribe({
//       next: (list) => {
//         if (!list || !list.length) return;

//         // DELIVERY LIST
//         const deliveryList = list.filter((i) => i.addressType === "DELIVERY");

//         // PICKUP LIST
//         const pickupList = list.filter((i) => i.addressType === "PICKUP");

//         // DEFAULT = DELIVERY ALWAYS
//         this.selectedMode = "DELIVERY";

//         // first delivery OR default delivery
//         this.selectedOrder =
//           deliveryList.find(
//             (i) => i.default === true || i.default === "true",
//           ) || deliveryList[0];

//         this.updateSelectedAddressLabel();

//         // autofill delivery form
//         if (this.selectedOrder) {
//           this.patchAddress(this.selectedOrder);
//         }
//       },
//     });
//   }

//   onModeChange(): void {
//     this.chottaService.getOrders().subscribe({
//       next: (list) => {
//         if (!list || !list.length) return;

//         if (this.selectedMode === "DELIVERY") {
//           const deliveryList = list.filter((i) => i.addressType === "DELIVERY");

//           this.selectedOrder =
//             deliveryList.find(
//               (i) => i.default === true || i.default === "true",
//             ) || deliveryList[0];

//           this.updateSelectedAddressLabel();

//           if (this.selectedOrder) {
//             this.patchAddress(this.selectedOrder);
//           }
//         } else {
//           // PICKUP
//           const pickupList = list.filter((i) => i.addressType === "PICKUP");

//           // if not selected use first pickup
//           this.selectedOrder = pickupList[0];

//           this.updateSelectedAddressLabel();

//           this.clearAddressValidators();
//         }
//       },
//     });
//   }

//   updateSelectedAddressLabel(): void {
//     if (!this.selectedOrder) {
//       this.selectedAddressLabel = "";

//       this.customerForm.patchValue({
//         selectedAddressLabel: "",
//         deliveryMode: this.selectedMode,
//       });

//       return;
//     }

//     const addr = this.selectedOrder.address;

//     this.selectedAddressLabel = `${addr.city || addr.areaName || ""} - ${addr.pincode || ""}`;

//     this.customerForm.patchValue({
//       selectedAddressLabel: this.selectedAddressLabel,
//       deliveryMode: this.selectedMode,
//     });
//   }

//   patchAddress(order: ChottaOrder): void {
//     const addr = order.address;
//     if (this.filledFromUserAddress) {
//       return;
//     }
//     this.customerForm.patchValue({
//       streetAddress: addr.areaName || "",
//       city: addr.city || "",
//       state: addr.state || "",
//       zipCode: addr.pincode || "",
//     });

//     this.enableAddressValidators();
//   }

//   clearAddressValidators(): void {
//     const fields = ["streetAddress", "city", "state", "zipCode"];

//     fields.forEach((field) => {
//       const control = this.customerForm.get(field);

//       if (!control) return;

//       control.clearValidators();

//       control.setErrors(null);

//       control.markAsUntouched();

//       control.markAsPristine();

//       control.updateValueAndValidity();
//     });
//   }

//   enableAddressValidators(): void {
//     this.customerForm
//       .get("streetAddress")
//       ?.setValidators([Validators.required]);

//     this.customerForm.get("city")?.setValidators([Validators.required]);

//     this.customerForm.get("state")?.setValidators([Validators.required]);

//     this.customerForm
//       .get("zipCode")
//       ?.setValidators([Validators.required, digitsOnly(6)]);

//     ["streetAddress", "city", "state", "zipCode"].forEach((field) => {
//       this.customerForm.get(field)?.updateValueAndValidity();
//     });
//   }
// }

import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { FormsModule } from "@angular/forms";

import { digitsOnly, strictEmail } from "../validators";
import { CheckoutValidationService } from "../services/checkout-validation.service";
import { ChottaOrder } from "../../common/models/chotta.model";
import { ChottaService } from "../../common/services/chotta.service";
import { AuthService } from "../../core/auth/auth.service";
import { INPUT_LENGTH } from "../../common/utils/input-length.config";

@Component({
  selector: "app-customer-information",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: "./customer-information.component.html",
  styleUrls: ["./customer-information.component.scss"],
})
export class CustomerInformationComponent {
  customerForm: FormGroup;

  readonly INPUT_LENGTH = INPUT_LENGTH;

  customer = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    streetAddress: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    saveForFuture: false,
    billingSameAsShipping: true,
  };

  selectedMode: "DELIVERY" | "PICKUP" = "DELIVERY";

  deliveryList: ChottaOrder[] = [];
  pickupList: ChottaOrder[] = [];

  selectedOrder?: ChottaOrder;

  selectedAddressLabel = "";

  private filledFromUserAddress = false;

  isOpen = true; // Customer Information starts expanded

  toggleOpen() {
    this.isOpen = !this.isOpen;
  }
  open(): void {
    this.isOpen = true;
  }

  constructor(
    private fb: FormBuilder,
    private checkoutValidationService: CheckoutValidationService,
    private chottaService: ChottaService,
    private authService: AuthService,
  ) {
    this.customerForm = this.fb.group({
      customerName: ["", Validators.required],
      email: ["", [strictEmail]],
      phone: ["", [Validators.required, digitsOnly(15)]],

      streetAddress: ["", Validators.required],
      apartment: [""],
      city: ["", Validators.required],
      state: ["", Validators.required],
      zipCode: ["", [Validators.required, digitsOnly(6)]],

      country: ["India", Validators.required],

      saveForFuture: [false],
      billingSameAsShipping: [true],

      deliveryMode: ["DELIVERY"],
      selectedAddressLabel: [""],
    });
    this.customerForm.valueChanges.subscribe((value) => {
      sessionStorage.setItem("customer_form", JSON.stringify(value));
    });

    this.checkoutValidationService.registerForm("customer", this.customerForm);
    const saved = sessionStorage.getItem("customer_form");

    if (saved) {
      this.customerForm.patchValue(JSON.parse(saved));
      const p = this.customerForm.get("phone");
      p?.setValue(this.normalizePhone(p.value), { emitEvent: false });

      // restore delivery/pickup choice
      this.selectedMode =
        this.customerForm.get("deliveryMode")?.value === "PICKUP"
          ? "PICKUP"
          : "DELIVERY";

      // pickup doesn't need the address fields
      if (this.selectedMode === "PICKUP") {
        this.clearAddressValidators();
      }
    } else {
      this.loadUserLastDeliveryAddress();
    }

    // tell the order summary / total which mode is active
    this.checkoutValidationService.setDeliveryMode(this.selectedMode);

    this.loadAddresses();
  }

  // ── Phone helpers ────────────────────────────────────────────────

  /** Keep digits only, then drop leading zeros */
  /** Digits only, drop +91 / leading zeros, max 10 digits */
  private normalizePhone(value: unknown): string {
    let digits = String(value ?? "").replace(/\D/g, "");

    if (digits.length === 12 && digits.startsWith("91")) {
      digits = digits.slice(2); // +91XXXXXXXXXX -> XXXXXXXXXX
    }

    return digits.replace(/^0+/, "").slice(0, 10);
  }

  /** Block non-digits while typing or pasting */
  onPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleaned = this.normalizePhone(input.value);

    if (input.value !== cleaned) {
      input.value = cleaned;
    }
    this.customerForm.get("phone")?.setValue(cleaned);
  }
  /** Strip leading 0 on blur */
  onPhoneBlur(): void {
    const control = this.customerForm.get("phone");
    control?.setValue(this.normalizePhone(control.value));
    control?.markAsTouched();
  }

  // private loadUserLastDeliveryAddress(): void {
  //   const user = this.authService.user();

  //   if (!user) return;

  //   this.customerForm.patchValue({
  //     email: user.email ?? "",
  //     firstName: user.firstName ?? "",
  //     lastName: user.lastName ?? "",
  //     phone: user.phone ?? "",
  //   });

  //   const addr = user.lastDeliveryAddesses?.at(-1);

  //   if (addr) {
  //     this.customerForm.patchValue({
  //       streetAddress: addr.Address ?? "",
  //       city: addr.city ?? "",
  //       state: addr.state ?? "",
  //       zipCode: addr.postalCode ?? "",
  //     });

  //     this.filledFromUserAddress = true;
  //   }
  // }
  private loadUserLastDeliveryAddress(): void {
    const user = this.authService.user();

    if (!user) return;

    const customerName = `${user.firstName ?? ""}`.trim();

    this.customerForm.patchValue({
      customerName:
        this.customerForm.get("customerName")?.value || customerName,

      email: this.customerForm.get("email")?.value || user.email || "",

      phone:
        this.customerForm.get("phone")?.value ||
        this.normalizePhone(user.phone),
    });

    const hasAddress =
      !!this.customerForm.get("streetAddress")?.value ||
      !!this.customerForm.get("city")?.value ||
      !!this.customerForm.get("state")?.value ||
      !!this.customerForm.get("zipCode")?.value;

    if (hasAddress) {
      return;
    }

    const addr = user.lastDeliveryAddesses?.at(-1);

    if (addr) {
      this.customerForm.patchValue({
        streetAddress: addr.Address ?? "",
        city: addr.city ?? "",
        state: addr.state ?? "",
        zipCode: addr.postalCode ?? "",
      });

      this.filledFromUserAddress = true;
    }
  }

  private loadAddresses(): void {
    this.chottaService.getOrders().subscribe({
      next: (list) => {
        this.deliveryList = list.filter((x) => x.addressType === "DELIVERY");
        this.pickupList = list.filter((x) => x.addressType === "PICKUP");

        // restored PICKUP: use the pickup point, don't touch the delivery address
        if (this.selectedMode === "PICKUP") {
          this.selectedOrder = this.pickupList[0];
          this.updateSelectedAddressLabel();
          return;
        }

        // DELIVERY (default)
        this.selectedOrder =
          this.deliveryList.find(
            (x) => x.default === true || x.default === "true",
          ) ?? this.deliveryList[0];

        this.updateSelectedAddressLabel();

        if (this.selectedOrder && !this.filledFromUserAddress) {
          this.patchAddress(this.selectedOrder);
        }
      },
    });
  }

  onModeChange(): void {
    this.checkoutValidationService.setDeliveryMode(this.selectedMode);
    if (this.selectedMode === "DELIVERY") {
      this.selectedOrder =
        this.deliveryList.find(
          (x) => x.default === true || x.default === "true",
        ) ?? this.deliveryList[0];

      this.updateSelectedAddressLabel();

      if (this.selectedOrder) {
        this.patchAddress(this.selectedOrder);
      }

      this.enableAddressValidators();
    } else {
      this.selectedOrder = this.pickupList[0];

      this.updateSelectedAddressLabel();

      this.clearAddressValidators();
    }
  }

  onDeliverySelected(order: ChottaOrder): void {
    this.selectedOrder = order;

    this.filledFromUserAddress = false;

    this.patchAddress(order);

    this.updateSelectedAddressLabel();
  }

  onPickupSelected(order: ChottaOrder): void {
    this.selectedOrder = order;

    this.updateSelectedAddressLabel();
  }

  private updateSelectedAddressLabel(): void {
    if (!this.selectedOrder) {
      this.selectedAddressLabel = "";

      this.customerForm.patchValue({
        selectedAddressLabel: "",
        deliveryMode: this.selectedMode,
      });

      return;
    }

    const addr = this.selectedOrder.address;

    console.log("updateSelectedAddressLabel    addr :", addr);

    this.selectedAddressLabel =
      this.selectedMode === "DELIVERY"
        ? `${addr?.city ?? addr?.areaName} - ${addr.pincode}`
        : `${addr?.PickupPointName},${addr?.Address1},${addr?.Address2},${addr?.areaName} - ${addr.pincode}`;

    this.customerForm.patchValue({
      selectedAddressLabel: this.selectedAddressLabel,
      deliveryMode: this.selectedMode,
    });
  }

  private patchAddress(order: ChottaOrder): void {
    const addr = order.address;
    // console.log("Req order : ", order);
    // console.log("Patch Address addr : ", addr);

    this.customerForm.patchValue({
      city: addr.city ?? "",

      zipCode: addr.pincode ?? "",
    });

    this.enableAddressValidators();
  }

  private clearAddressValidators(): void {
    ["streetAddress", "city", "state", "zipCode"].forEach((field) => {
      const control = this.customerForm.get(field);

      if (!control) return;

      control.clearValidators();
      control.setErrors(null);
      control.markAsPristine();
      control.markAsUntouched();
      control.updateValueAndValidity();
    });
  }
  clearCustomerForm(): void {
    sessionStorage.removeItem("customer_form");
    this.customerForm.reset({
      /* ...existing... */
    });
    this.selectedMode = "DELIVERY";
    this.checkoutValidationService.setDeliveryMode("DELIVERY");
    this.enableAddressValidators();
    this.filledFromUserAddress = false;
  }

  private enableAddressValidators(): void {
    this.customerForm
      .get("streetAddress")
      ?.setValidators([Validators.required]);

    this.customerForm.get("city")?.setValidators([Validators.required]);

    this.customerForm.get("state")?.setValidators([Validators.required]);

    this.customerForm
      .get("zipCode")
      ?.setValidators([Validators.required, digitsOnly(6)]);

    ["streetAddress", "city", "state", "zipCode"].forEach((field) => {
      this.customerForm.get(field)?.updateValueAndValidity();
    });
  }
}
