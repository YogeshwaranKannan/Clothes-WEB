import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SellerService } from "../../common/services/SellerService";
import { FormsModule } from "@angular/forms";
import { CheckoutValidationService } from "../services/checkout-validation.service";

@Component({
  selector: "app-payment",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./payment.component.html",
  styleUrls: ["./payment.component.scss"],
})
export class PaymentComponent implements OnInit {
  paymentModes: string[] = [];
  selectedPaymentMode = "";

  // Payment section starts collapsed
  isPaymentOpen = false;

  constructor(
    private sellerService: SellerService,
    private checkoutValidationService: CheckoutValidationService,
  ) {}

  ngOnInit(): void {
    this.paymentModes =
      this.sellerService.getSellerDetails()?.paymentModes || [];

    this.checkoutValidationService.registerPaymentComponent(this);

    this.autoSelectIfOnlyOneMode();
  }

  togglePaymentOpen(): void {
    this.isPaymentOpen = !this.isPaymentOpen;
  }

  onPaymentModeChange(mode: string): void {
    this.selectedPaymentMode = mode;
    this.checkoutValidationService.setSelectedPaymentMode(mode);
  }

  private autoSelectIfOnlyOneMode(): void {
    const candidateModes = ["COD", "UPI", "RAZORPAY", "ONLINEPAYMENT"];

    const availableModes = candidateModes.filter((mode) =>
      this.isAvailable(mode),
    );

    if (availableModes.length === 1) {
      this.selectedPaymentMode = availableModes[0];
    }
  }

  getSelectedPaymentMode(): string {
    return this.selectedPaymentMode;
  }

  isAvailable(mode: string): boolean {
    const modes = this.paymentModes.map((item) => item.toUpperCase());

    switch (mode.toUpperCase()) {
      case "COD":
        return modes.includes("COD");

      case "UPI":
        return modes.includes("UPI");

      case "ONLINEPAYMENT":
        return modes.includes("ONLINE") || modes.includes("ONLINEPAYMENT");

      case "RAZORPAY":
      case "NETBANKING":
        return modes.includes("RAZORPAY") || modes.includes("NETBANKING");

      default:
        return false;
    }
  }
}
