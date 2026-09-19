import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { digitsOnly } from "../validators";
import { FormsModule } from "@angular/forms";
import { CheckoutValidationService } from "../services/checkout-validation.service";

@Component({
  selector: "app-shipping-address",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: "./shipping-address.component.html",
  styleUrls: ["./shipping-address.component.scss"],
})
export class ShippingAddressComponent {
  shippingForm: FormGroup;

  shipping = {
    streetAddress: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    // country: "",
    saveForFuture: false,
    billingSameAsShipping: true,
  };

  constructor(
    private fb: FormBuilder,
    private checkoutValidationService: CheckoutValidationService,
  ) {
    this.shippingForm = this.fb.group({
      streetAddress: ["", [Validators.required]],
      apartment: [""],
      city: ["", [Validators.required]],
      state: ["", [Validators.required]],
      zipCode: ["", [Validators.required, digitsOnly(6)]],
      // country: ["India", Validators.required],
      saveForFuture: [false],
      billingSameAsShipping: [true],
    });
    // register under a key so the review component can read values
    this.checkoutValidationService.registerForm("shipping", this.shippingForm);
  }
}
