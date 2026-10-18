import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import * as QRCode from "qrcode";
import { SellerService } from "../../common/services/SellerService";
import { CheckoutValidationService } from "../services/checkout-validation.service";

type UpiApp = "gpay" | "phonepe" | "paytm";

@Component({
  selector: "app-payment",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./payment.component.html",
  styleUrls: ["./payment.component.scss"],
})
export class PaymentComponent implements OnInit, OnChanges {
  /** Payable order total. Pass it from the parent: <app-payment [amount]="total"> */
  @Input() amount = 0;

  paymentModes: string[] = [];
  selectedPaymentMode = "";
  isPaymentOpen = true;

  // UPI
  upiId = "";
  payeeName = "";
  upiQuery = "";
  upiLink = "";
  upiQrDataUrl = "";
  isMobile = false;
  isIos = false;
  isAndroid = false;

  constructor(
    private sellerService: SellerService,
    private checkoutValidationService: CheckoutValidationService,
  ) {}

  ngOnInit(): void {
    const seller: any = this.sellerService.getSellerDetails();
    this.paymentModes = seller?.paymentModes || [];
    this.upiId = (seller?.sellerPaymentDetails?.upi_Id || "").trim();
    this.payeeName = seller?.companyname || "";

    this.isMobile = this.detectMobile();
    this.isIos = this.detectIos();
    this.isAndroid = this.detectAndroid();

    this.checkoutValidationService.registerPaymentComponent(this);
    this.autoSelectIfOnlyOneMode();

    if (this.selectedPaymentMode === "UPI") {
      this.buildUpi(this.amount);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Rebuild the link/QR whenever the payable amount changes
    if (
      changes["amount"] &&
      !changes["amount"].firstChange &&
      this.selectedPaymentMode === "UPI"
    ) {
      this.buildUpi(this.amount);
    }
  }

  togglePaymentOpen(): void {
    this.isPaymentOpen = !this.isPaymentOpen;
  }

  onPaymentModeChange(mode: string): void {
    this.selectedPaymentMode = mode;
    this.checkoutValidationService.setSelectedPaymentMode(mode);
    if (mode === "UPI") {
      this.buildUpi(this.amount);
    }
  }

  // ---------- device detection ----------

  private detectMobile(): boolean {
    const nav: any = navigator;
    const ua = navigator.userAgent || "";

    if (nav.userAgentData?.mobile) return true;
    if (/Android|iPhone|iPad|iPod|Mobile/i.test(ua)) return true;

    // iPadOS and Android tablets / "Desktop site" mode report a desktop UA,
    // but they have a touch screen.
    return /Macintosh|Linux|X11/i.test(ua) && navigator.maxTouchPoints > 1;
  }

  private detectIos(): boolean {
    const ua = navigator.userAgent || "";
    return (
      /iPhone|iPad|iPod/i.test(ua) ||
      (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1)
    );
  }

  private detectAndroid(): boolean {
    return /Android/i.test(navigator.userAgent || "");
  }

  // ---------- UPI ----------

  /**
   * Builds the UPI deep link and QR.
   * The query is built manually: URLSearchParams turns spaces into "+" and
   * encodes "@" as %40, which some UPI apps (GPay / PhonePe) reject.
   */
  async buildUpi(amount?: number): Promise<void> {
    if (!this.upiId) return;

    const parts = [
      `pa=${this.upiId}`, // keep "@" raw
      `pn=${encodeURIComponent(this.payeeName || "Merchant")}`,
      `cu=INR`,
      `tn=${encodeURIComponent("Order payment")}`,
    ];
    if (amount && amount > 0) {
      parts.push(`am=${amount.toFixed(2)}`);
    }

    this.upiQuery = parts.join("&");
    this.upiLink = `upi://pay?${this.upiQuery}`;

    try {
      this.upiQrDataUrl = await QRCode.toDataURL(this.upiLink, {
        width: 220,
        margin: 1,
        errorCorrectionLevel: "M",
      });
    } catch (e) {
      console.error("QR generation failed", e);
      this.upiQrDataUrl = "";
    }
  }

  /**
   * Opens a UPI app.
   *  - no argument : generic upi:// link (Android shows the app chooser)
   *  - "gpay" etc. : Android -> intent:// targeting the app package
   *                  iOS     -> app specific scheme
   * window.location.href is used on purpose: an <a [href]> with a custom scheme
   * gets "unsafe:" prepended by Angular's sanitizer.
   */
  openUpiApp(app?: UpiApp): void {
    if (!this.upiQuery) return;

    // On a real desktop there is no UPI handler, so the QR is the only option.
    if (!this.isMobile) return;

    // No specific app: generic link (Android shows the app chooser)
    if (!app) {
      window.location.href = this.upiLink;
      return;
    }

    console.log(this.upiLink);

    if (this.isAndroid) {
      const packages: Record<UpiApp, string> = {
        gpay: "com.google.android.apps.nbu.paisa.user",
        phonepe: "com.phonepe.app",
        paytm: "net.one97.paytm",
      };
      window.location.href =
        `intent://pay?${this.upiQuery}` +
        `#Intent;scheme=upi;package=${packages[app]};end`;
      return;
    }

    // iOS and others: app specific schemes
    const schemes: Record<UpiApp, string> = {
      gpay: `gpay://upi/pay?${this.upiQuery}`,
      phonepe: `phonepe://pay?${this.upiQuery}`,
      paytm: `paytmmp://pay?${this.upiQuery}`,
    };
    window.location.href = schemes[app];
  }

  // ---------- payment mode helpers ----------

  private autoSelectIfOnlyOneMode(): void {
    const candidateModes = ["COD", "UPI", "RAZORPAY", "ONLINEPAYMENT"];
    const availableModes = candidateModes.filter((m) => this.isAvailable(m));
    if (availableModes.length === 1) {
      this.selectedPaymentMode = availableModes[0];
      // keep the checkout service in sync with the auto-selected mode
      this.checkoutValidationService.setSelectedPaymentMode(
        this.selectedPaymentMode,
      );
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
        // require a upi id, otherwise the QR can't be built
        return modes.includes("UPI") && !!this.upiId;
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
