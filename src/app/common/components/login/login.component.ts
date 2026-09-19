// ============================================================
// login.component.ts
// src/app/pages/login/login.component.ts
// ============================================================

import { CommonModule } from "@angular/common";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { AuthService, AuthUser } from "../../../core/auth/auth.service";
import { AuthApiService } from "../../../core/auth/auth-api.service";
import { HttpErrorResponse } from "@angular/common/http";

import { SellerService } from "../../services/SellerService";
import { INPUT_LENGTH } from "../../utils/input-length.config";

// SampleUser carries role, matching the AuthUser interface
type SampleUser = AuthUser & { password: string };

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit, OnDestroy {
  activeTab: "login" | "signup" = "login";

  loginForm!: FormGroup;
  registerForm!: FormGroup;

  forgotPasswordMode = false;

  otpSent = false;
  otpVerified = false;

  forgotEmail = "";
  otp = "";

  newPassword = "";
  confirmPassword = "";

  forgotError: string | null = null;
  forgotSuccess: string | null = null;

  readonly INPUT_LENGTH = INPUT_LENGTH;

  showLoginPassword = false;

  showRegisterPassword = false;
  showRegisterConfirmPassword = false;

  showNewPassword = false;
  showConfirmPassword = false;

  signupOtp = "";
  signupOtpSent = false;
  signupOtpVerified = false;
  signupAttempt = 1;

  isSendingOtp = false;
  forgotMobile = "";
  attempt = 1;
  isVerifyingOtp = false;

  signupOtpSuccess: string | null = null;
  signupOtpError: string | null = null;

  // ── Extra state used by the HTML template ─────────────────────────────────
  loginSuccess: string | null = null;
  isLoggingIn = false;
  isRegistering = false;
  isResetting = false;

  showForgotPassword(): void {
    this.forgotPasswordMode = true;

    this.otpSent = false;
    this.otpVerified = false;

    this.forgotEmail = "";
    this.otp = "";

    this.newPassword = "";
    this.confirmPassword = "";

    this.forgotError = null;
  }

  private auth = inject(AuthService);
  private authApi = inject(AuthApiService);
  private router = inject(Router);
  private sellerService = inject(SellerService);
  private route = inject(ActivatedRoute);

  // MOCK ONLY - will be deleted when the backend is integrated.
  sampleUsers: SampleUser[] = [
    {
      firstName: "Yogesh",
      lastName: "",
      email: "Yogesh-buyer@gmail.com",
      phone: "9791011111",
      password: "buyer123",
      type: "buyer",
      role: "WEB-LOGGED",
    },
    {
      firstName: "Eazhil",
      lastName: "",
      email: "Eazhil-buyer@gmail.com",
      phone: "9791022222",
      password: "buyer123",
      type: "buyer",
      role: "WEB-LOGGED",
    },
    {
      firstName: "ramesh",
      lastName: "",
      email: "ramesh-buyer@gmail.com",
      phone: "9791033333",
      password: "buyer123",
      type: "buyer",
      role: "WEB-LOGGED",
    },
    {
      firstName: "Cake",
      lastName: "",
      email: "cake-seller@gmail.com",
      phone: "9791044444",
      password: "seller123",
      type: "seller",
      role: "WEB-GUEST",
    },
    {
      firstName: "Oil",
      email: "Oil-serl@gmail.com",
      phone: "9791055555",
      password: "seller123",
      type: "seller",
      role: "WEB-GUEST",
    },
  ];

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {
    this.loginForm = this.fb.group({
      identifier: ["", [Validators.required]],
      password: ["", [Validators.required, Validators.minLength(6)]],
      remember: [false],
    });

    this.registerForm = this.fb.group({
      firstName: ["", [Validators.required, Validators.minLength(4)]],
      email: ["", [Validators.required, Validators.email]],
      phone: ["", [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      password: ["", [Validators.required, Validators.minLength(6)]],
      confirmPassword: ["", [Validators.required]],
    });
  }

  // ── Password strength (signup) ────────────────────────────────────────────

  passwordStrong = false;

  passwordStrengthPercent = 0;

  passwordStrengthText = "Weak";

  passwordRules = {
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
  };

  checkPasswordStrength() {
    const password = this.registerForm.get("password")?.value || "";

    this.passwordRules = {
      length: password.length >= 8,

      upper: /[A-Z]/.test(password),

      lower: /[a-z]/.test(password),

      number: /[0-9]/.test(password),

      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const score = Object.values(this.passwordRules).filter(Boolean).length;

    this.passwordStrengthPercent = score * 20;

    if (score <= 2) {
      this.passwordStrengthText = "Weak";
    } else if (score <= 4) {
      this.passwordStrengthText = "Medium";
    } else {
      this.passwordStrengthText = "Strong";

      this.passwordStrong = true;
    }

    if (score < 5) {
      this.passwordStrong = false;
    }
  }

  // ── Password strength (forgot / new password) ─────────────────────────────

  newPasswordStrong = false;

  newPasswordStrengthPercent = 0;

  newPasswordStrengthText = "Weak";

  newPasswordRules = {
    length: false,
    number: false,
    upper: false,
    special: false,
  };

  checkNewPasswordStrength() {
    const password = this.newPassword || "";

    const hasLength = password.length >= 6;

    const hasNumber = /[0-9]/.test(password);

    const capitalCount = (password.match(/[A-Z]/g) || []).length;

    const specialCount = (password.match(/[!@#$%^&*(),.?":{}|<>]/g) || [])
      .length;

    this.newPasswordRules = {
      length: hasLength,
      number: hasNumber,
      upper: capitalCount >= 2,
      special: specialCount >= 2,
    };

    let score = 0;

    if (hasLength) score++;

    if (hasNumber) score++;

    if (capitalCount >= 2) score++;

    if (specialCount >= 2) score++;

    this.newPasswordStrengthPercent = score * 25;

    if (score <= 1) {
      this.newPasswordStrengthText = "Weak";
    } else if (score <= 3) {
      this.newPasswordStrengthText = "Medium";
    } else {
      this.newPasswordStrengthText = "Strong";
    }

    this.newPasswordStrong =
      hasLength && hasNumber && capitalCount >= 2 && specialCount >= 2;
  }

  // ── Form control getters ──────────────────────────────────────────────────

  get identifier() {
    return this.loginForm.get("identifier");
  }
  get password() {
    return this.loginForm.get("password");
  }

  get rFirstName() {
    return this.registerForm.get("firstName");
  }

  get rLastName() {
    return this.registerForm.get("lastName");
  }
  get rEmail() {
    return this.registerForm.get("email");
  }
  get rPhone() {
    return this.registerForm.get("phone");
  }
  get rPassword() {
    return this.registerForm.get("password");
  }
  get rConfirm() {
    return this.registerForm.get("confirmPassword");
  }
  get confirmPasswordMismatch(): boolean {
    return (
      this.registerForm.get("confirmPassword")?.hasError("mismatch") ?? false
    );
  }

  // ── Tab switching ─────────────────────────────────────────────────────────

  selectTab(tab: "login" | "signup"): void {
    this.activeTab = tab;
    this.forgotPasswordMode = false;

    // Reset all error/success messages
    this.loginError = null;

    this.forgotError = null;
    this.forgotSuccess = null;

    this.signupOtpError = null;
    this.signupOtpSuccess = null;

    // Reset OTP states
    this.signupOtpSent = false;
    this.signupOtpVerified = false;
    this.signupOtp = "";
    this.signupAttempt = 1;

    this.otpSent = false;
    this.otpVerified = false;
    this.otp = "";
    this.attempt = 1;

    this.stopResendTimer();

    // Reset loading states
    this.isSendingOtp = false;
    this.isVerifyingOtp = false;

    // Reset forgot-password fields
    this.forgotMobile = "";
    this.newPassword = "";
    this.confirmPassword = "";

    // Reset password strength
    this.newPasswordStrong = false;
    this.newPasswordStrengthPercent = 0;
    this.newPasswordStrengthText = "Weak";
    this.newPasswordRules = {
      length: false,
      number: false,
      upper: false,
      special: false,
    };

    // Reset signup password strength
    this.passwordStrong = false;
    this.passwordStrengthPercent = 0;
    this.passwordStrengthText = "Weak";

    this.passwordRules = {
      length: false,
      upper: false,
      lower: false,
      number: false,
      special: false,
    };

    // Trigger UI update because component uses OnPush
    this.cdr.detectChanges();
  }

  // ── Private helper: returnUrl ─────────────────────────────────────────────
  // Reads the returnUrl query param the auth guard appends, e.g.
  //   /login?returnUrl=%2Fprofile
  // Falls back to '/' when not present.

  private getReturnUrl(): string {
    return this.route.snapshot.queryParamMap.get("returnUrl") ?? "/";
  }

  ngOnInit(): void {
    this.loginForm.valueChanges.subscribe(() => {
      this.loginError = null;
    });

    this.registerForm.get("confirmPassword")?.valueChanges.subscribe(() => {
      const password = this.registerForm.get("password")?.value;

      const confirm = this.registerForm.get("confirmPassword")?.value;

      if (confirm && password !== confirm) {
        this.registerForm.get("confirmPassword")?.setErrors({
          ...this.registerForm.get("confirmPassword")?.errors,
          mismatch: true,
        });
      } else {
        const errors = this.registerForm.get("confirmPassword")?.errors;

        if (errors) {
          delete errors["mismatch"];

          this.registerForm
            .get("confirmPassword")
            ?.setErrors(Object.keys(errors).length ? errors : null);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.stopResendTimer();
  }

  // ── Login ─────────────────────────────────────────────────────────────────

  login(): void {
    this.auth.logout();
    this.loginError = null;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const payload = {
      identifier: String(this.loginForm.get("identifier")?.value ?? "").trim(),
      password: this.loginForm.get("password")?.value,
      // sellerid: this.sellerService.getSellerId(),
    };

    this.isLoggingIn = true;

    this.authApi.login(payload).subscribe({
      next: (res) => {
        console.log("Login Response:", res);
        this.isLoggingIn = false;

        if (!res?.success) {
          this.loginError = res?.message || "Login failed";
          sessionStorage.clear();
          this.cdr.detectChanges();
          return;
        }

        if (!res?.user) {
          this.loginError = "User not found";
          this.cdr.detectChanges();
          return;
        }

        const user: AuthUser = {
          id: res.user.id,
          firstName: res.user.firstName,
          lastName: res.user.lastName,
          email: res.user.email,
          phone: res.user.mobileNum,
          type: res.user.type,
          role: res.user.role,

          lastDeliveryAddesses: res.user.lastDeliveryAddesses,
          reward: res.user.reward,
          lastEarned: res.user.lastEarned,
          lastRedeemed: res.user.lastRedeemed,
          totalRedeemed: res.user.totalRedeemed,
          availableRewards: res.user.availableRewards,
        };

        this.auth.login(user, {
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          expiresAt: res.expiresAt,
        });

        this.router.navigateByUrl(this.getReturnUrl());
      },

      error: (err: HttpErrorResponse) => {
        console.error("Login Error:", err);
        this.isLoggingIn = false;
        this.loginError = this.getErrorMessage(err);
        this.cdr.detectChanges();
      },
    });
  }

  private getErrorMessage(err: any): string {
    return (
      err?.error?.message ||
      err?.message ||
      "Something went wrong. Please try again."
    );
  }

  // ── Register ──────────────────────────────────────────────────────────────

  register(): void {
    this.auth.logout();
    this.loginError = null;

    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    if (!this.signupOtpVerified) {
      this.loginError = "Please verify your mobile number OTP first.";
      return;
    }

    const form = this.registerForm.value;

    if (form.password !== form.confirmPassword) {
      this.rConfirm?.setErrors({ mismatch: true });
      return;
    }
    const payload = {
      firstName: form.firstName.trim(),
      lastName: "",
      email: String(form.email ?? "")
        .trim()
        .toLowerCase(),
      mobileNum: String(form.phone ?? "").trim(),
      password: String(form.password ?? "").trim(),
      // sellerid: this.sellerService.getSellerId() ?? null,
      // companyname: this.sellerService.getCompanyName(),
    };

    console.log("Signup Payload:", payload);

    this.isRegistering = true;

    this.authApi.signup(payload).subscribe({
      next: (res) => {
        console.log("Signup Response:", res);
        this.isRegistering = false;

        if (!res.success || !res.user) {
          this.loginError = res.message || "Signup failed";
          this.cdr.detectChanges();
          return;
        }

        const user: AuthUser = {
          id: res.user.id,
          firstName: res.user.firstName,
          lastName: res.user.lastName,
          email: res.user.email,
          phone: res.user.mobileNum,
          type: res.user.type,
          role: res.user.role,

          lastDeliveryAddesses: res.user.lastDeliveryAddesses,
          reward: res.user.reward,
          lastEarned: res.user.lastEarned,
          lastRedeemed: res.user.lastRedeemed,
          totalRedeemed: res.user.totalRedeemed,
        };

        // Store auth session
        this.auth.login(user, {
          accessToken: res.accessToken,
          refreshToken: res.refreshToken,
          expiresAt: res.expiresAt,
        });

        // Navigate
        this.router.navigateByUrl(this.getReturnUrl());
      },

      error: (err: HttpErrorResponse) => {
        console.error("Signup Error:", err);
        this.isRegistering = false;
        this.loginError = this.getErrorMessage(err);
        this.cdr.detectChanges();
      },
    });
  }

  // ── OTP: signup ───────────────────────────────────────────────────────────

  generateOtp(): void {
    this.signupOtpError = null;
    this.signupOtpSuccess = null;

    const email = String(this.registerForm.get("email")?.value ?? "")
      .trim()
      .toLowerCase();

    if (!email) {
      this.signupOtpError = "Enter email";
      return;
    }

    if (this.registerForm.get("email")?.invalid) {
      this.signupOtpError = "Enter a valid email";
      return;
    }

    this.isSendingOtp = true;

    this.authApi.generateOtp({ email }).subscribe({
      next: (res: any) => {
        console.log("OTP res -> ", res);

        if (res?.msg === "OTP SENT") {
          // Backend generated OTP
          const otp = res?.otp;

          console.log("Generated OTP:", otp);

          this.signupOtpSent = true;
          this.signupOtpVerified = false;
          this.signupOtp = "";
          this.signupAttempt = 1;

          this.signupOtpSuccess = "OTP sent successfully to your WhatsApp.";

          this.isSendingOtp = false;
          this.startResendTimer();
          this.cdr.detectChanges();

          // Send OTP through WhatsApp
          // this.authApi
          //   .sendWhatsAppOtp({
          //     to: mobileNum,
          //     customerNumber: mobileNum,
          //     otp: otp,
          //   })
          //   .subscribe({
          //     next: (whatsappRes) => {
          //       console.log("WhatsApp OTP response -> ", whatsappRes);
          //
          //       this.signupOtpSent = true;
          //       this.signupOtpVerified = false;
          //       this.signupOtp = "";
          //       this.signupAttempt = 1;
          //
          //       this.signupOtpSuccess =
          //         "OTP sent successfully to your WhatsApp.";
          //
          //       this.isSendingOtp = false;
          //       this.cdr.detectChanges();
          //     },
          //
          //     error: (whatsappErr) => {
          //       this.signupOtpSent = true;
          //       this.signupOtpVerified = false;
          //       this.signupOtp = "";
          //       this.signupAttempt = 1;
          //
          //       this.signupOtpSuccess =
          //         "OTP sent successfully to your WhatsApp.";
          //
          //       this.isSendingOtp = false;
          //       this.cdr.detectChanges();
          //     },
          //   });
        } else {
          this.isSendingOtp = false;

          this.signupOtpError = res?.msg || "Failed to generate OTP.";

          this.cdr.detectChanges();
        }
      },

      error: (err) => {
        console.error("Generate OTP Error:", err);

        this.isSendingOtp = false;

        this.signupOtpError =
          err?.error?.message || err?.error?.msg || "Failed to generate OTP.";

        this.cdr.detectChanges();
      },
    });
  }

  verifyOtp(): void {
    this.signupOtpError = null;
    this.signupOtpSuccess = null;

    const email = String(this.registerForm.get("email")?.value ?? "")
      .trim()
      .toLowerCase();

    if (!email) {
      this.signupOtpError = "Enter email";
      return;
    }

    if (!this.signupOtp) {
      this.signupOtpError = "Enter OTP";
      return;
    }

    if (!/^[0-9]{6}$/.test(this.signupOtp)) {
      this.signupOtpError = "Enter a valid 6-digit OTP";
      return;
    }

    this.isVerifyingOtp = true;

    this.authApi
      .validateOtp({
        email,
        otp: this.signupOtp,
        attempt: this.signupAttempt,
      })
      .subscribe({
        next: (valid) => {
          this.isVerifyingOtp = false;

          if (valid) {
            this.authApi
              .deleteOtp({
                email,
                otp: this.signupOtp,
              })
              .subscribe({
                next: (res) => {
                  console.log("Signup OTP deleted:", res);
                },
                error: (err) => {
                  console.error("Signup OTP delete error:", err);
                },
              });

            this.signupOtpVerified = true;
            this.signupOtpSent = false;
            this.stopResendTimer();

            this.signupOtpSuccess = "Email OTP verified successfully";
          } else {
            this.signupAttempt++;
            this.signupOtpError = "Invalid OTP";
          }

          this.cdr.detectChanges();
        },

        error: (err) => {
          console.error("Verify OTP Error:", err);

          this.isVerifyingOtp = false;

          this.signupOtpError =
            err?.error?.message || err?.error?.msg || "OTP validation failed";

          this.cdr.detectChanges();
        },
      });
  }

  // ── OTP: forgot password ──────────────────────────────────────────────────

  generateForgotOtp(): void {
    this.forgotError = null;
    this.forgotSuccess = null;

    const email = this.forgotEmail.trim().toLowerCase();

    if (!email) {
      this.forgotError = "Enter email";
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.forgotError = "Enter a valid email";
      return;
    }

    this.isSendingOtp = true;

    this.authApi.generateOtp({ email }).subscribe({
      next: (res) => {
        console.log("Forgot OTP res -> ", res);

        if (res?.msg === "OTP SENT") {
          const otp = res.otp;

          console.log("Generated Forgot OTP:", otp);

          this.otpSent = true;
          this.otpVerified = false;
          this.otp = "";
          this.attempt = 1;

          this.forgotSuccess = "OTP sent successfully to your email.";

          this.isSendingOtp = false;
          this.startResendTimer();
          this.cdr.detectChanges();

          // Send OTP through WhatsApp
          // this.authApi
          //   .sendWhatsAppOtp({
          //     to: mobileNum,
          //     customerNumber: mobileNum,
          //     otp: otp,
          //   })
          //   .subscribe({ ... });
        } else {
          this.isSendingOtp = false;

          this.forgotError = res?.msg || "Failed to generate OTP.";

          this.cdr.detectChanges();
        }
      },

      error: (err) => {
        console.error("Generate Forgot OTP Error:", err?.error || err);

        this.isSendingOtp = false;

        this.forgotError =
          err?.error?.message || err?.error?.msg || "Failed to send OTP";

        this.cdr.detectChanges();
      },
    });
  }

  verifyForgotOtp(): void {
    this.forgotError = null;
    this.forgotSuccess = null;

    const email = this.forgotEmail.trim().toLowerCase();

    if (!email) {
      this.forgotError = "Enter email";
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      this.forgotError = "Enter a valid email";
      return;
    }

    if (!this.otp) {
      this.forgotError = "Enter OTP";
      return;
    }

    if (!/^[0-9]{6}$/.test(this.otp)) {
      this.forgotError = "Enter a valid 6-digit OTP";
      return;
    }

    this.isVerifyingOtp = true;

    this.authApi
      .validateOtp({
        email,
        otp: this.otp,
        attempt: this.attempt,
      })
      .subscribe({
        next: (valid) => {
          this.isVerifyingOtp = false;

          if (valid) {
            this.authApi
              .deleteOtp({
                email,
                otp: this.otp,
              })
              .subscribe({
                next: (res) => {
                  console.log("Forgot OTP deleted:", res);
                },
                error: (err) => {
                  console.error("Forgot OTP delete error:", err);
                },
              });

            this.otpVerified = true;
            this.stopResendTimer();

            this.forgotSuccess = "Email OTP verified successfully";
          } else {
            this.attempt++;
            this.forgotError = "Invalid OTP";
          }

          this.cdr.detectChanges();
        },

        error: (err) => {
          console.error("Verify Forgot OTP Error:", err?.error || err);

          this.isVerifyingOtp = false;

          this.forgotError =
            err?.error?.message || err?.error?.msg || "OTP validation failed";

          this.cdr.detectChanges();
        },
      });
  }

  resetPassword(): void {
    this.forgotError = null;

    if (!this.newPassword) {
      this.forgotError = "Enter new password";
      return;
    }

    if (!this.newPasswordStrong) {
      this.forgotError =
        "Password must contain at least 6 characters, a number, 2 uppercase letters and 2 special characters.";
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.forgotError = "Passwords do not match";
      return;
    }

    this.isResetting = true;

    this.authApi
      .resetPassword({
        email: this.forgotEmail.trim().toLowerCase(),
        password: this.newPassword.trim(),
        // sellerid: this.sellerService.getSellerId(),
      })
      .subscribe({
        next: () => {
          this.isResetting = false;
          this.forgotSuccess = "Password updated successfully";

          this.forgotPasswordMode = false;
          this.activeTab = "login";

          this.cdr.detectChanges();
        },

        error: (err) => {
          console.error("Reset Password Error:", err);

          this.isResetting = false;
          this.forgotError = err?.error?.message || "Failed to update password";

          this.cdr.detectChanges();
        },
      });
  }

  // ── selectSampleUser() ────────────────────────────────────────────────────
  // Quick-login shortcut used in development and demos. Honours returnUrl.

  selectSampleUser(user: SampleUser): void {
    // Autofill the form fields (visual feedback for the user)
    this.loginForm.patchValue({
      identifier: user.email || user.phone,
      password: user.password,
    });

    // Build AuthUser - strip password, include role
    const u: AuthUser = {
      id: undefined,
      firstName: user.firstName,
      email: user.email,
      phone: user.phone,
      type: user.type,
      role: user.role,
    };

    this.auth.login(u);

    this.router.navigateByUrl(this.getReturnUrl());
  }

  // ── Computed lists ────────────────────────────────────────────────────────

  get buyers(): SampleUser[] {
    return this.sampleUsers.filter((u) => u.type === "buyer");
  }
  get sellers(): SampleUser[] {
    return this.sampleUsers.filter((u) => u.type === "seller");
  }

  loginError: string | null = null;

  // ══════════════════════════════════════════════════════════════════════════
  // Members used by the HTML template (6-box OTP input, resend timer, helpers)
  // ══════════════════════════════════════════════════════════════════════════

  // ── 6-box OTP input ───────────────────────────────────────────────────────

  readonly otpIndexes = [0, 1, 2, 3, 4, 5];
  trackByIndex = (i: number) => i;

  private signupDigitsArr: string[] = Array(6).fill("");
  private forgotDigitsArr: string[] = Array(6).fill("");

  // Always kept in sync with the existing signupOtp / otp strings
  get signupOtpDigits(): string[] {
    if (this.signupDigitsArr.join("") !== this.signupOtp) {
      this.signupDigitsArr = this.toDigits(this.signupOtp);
    }
    return this.signupDigitsArr;
  }

  get otpDigits(): string[] {
    if (this.forgotDigitsArr.join("") !== this.otp) {
      this.forgotDigitsArr = this.toDigits(this.otp);
    }
    return this.forgotDigitsArr;
  }

  private toDigits(value: string): string[] {
    const arr = Array(6).fill("");
    (value || "")
      .replace(/\D/g, "")
      .slice(0, 6)
      .split("")
      .forEach((d, i) => (arr[i] = d));
    return arr;
  }

  private setDigits(mode: "signup" | "forgot", arr: string[]): void {
    if (mode === "signup") {
      this.signupDigitsArr = arr;
      this.signupOtp = arr.join("");
      this.signupOtpError = null;
    } else {
      this.forgotDigitsArr = arr;
      this.otp = arr.join("");
      this.forgotError = null;
    }
  }

  private getBoxes(el: HTMLElement): HTMLInputElement[] {
    return Array.from(
      el.parentElement?.querySelectorAll<HTMLInputElement>("input.otp__box") ??
        [],
    );
  }

  private focusBox(el: HTMLElement, index: number): void {
    const box = this.getBoxes(el)[index];
    box?.focus();
  }

  onOtpInput(event: Event, index: number, mode: "signup" | "forgot"): void {
    const el = event.target as HTMLInputElement;
    const clean = el.value.replace(/\D/g, "");
    const digits = [
      ...(mode === "signup" ? this.signupOtpDigits : this.otpDigits),
    ];

    if (clean.length > 1) {
      // autofill (one-time-code) or multi-char input: spread across boxes
      clean
        .slice(0, 6 - index)
        .split("")
        .forEach((d, i) => (digits[index + i] = d));
      this.setDigits(mode, digits);
      this.getBoxes(el).forEach((b, i) => (b.value = digits[i]));
      this.focusBox(el, Math.min(index + clean.length, 5));
      return;
    }

    digits[index] = clean;
    el.value = clean;
    this.setDigits(mode, digits);

    if (clean && index < 5) {
      this.focusBox(el, index + 1);
    }
  }

  onOtpKeydown(
    event: KeyboardEvent,
    index: number,
    mode: "signup" | "forgot",
  ): void {
    const el = event.target as HTMLInputElement;

    if (event.key === "Backspace" && !el.value && index > 0) {
      event.preventDefault();
      const digits = [
        ...(mode === "signup" ? this.signupOtpDigits : this.otpDigits),
      ];
      digits[index - 1] = "";
      this.setDigits(mode, digits);
      const prev = this.getBoxes(el)[index - 1];
      if (prev) {
        prev.value = "";
        prev.focus();
      }
    } else if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      this.focusBox(el, index - 1);
    } else if (event.key === "ArrowRight" && index < 5) {
      event.preventDefault();
      this.focusBox(el, index + 1);
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (mode === "signup" && this.signupOtp.length === 6) this.verifyOtp();
      if (mode === "forgot" && this.otp.length === 6) this.verifyForgotOtp();
    }
  }

  onOtpPaste(event: ClipboardEvent, mode: "signup" | "forgot"): void {
    event.preventDefault();
    const el = event.target as HTMLElement;
    const text = (event.clipboardData?.getData("text") ?? "")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!text) return;

    const digits = this.toDigits(text);
    this.setDigits(mode, digits);
    this.getBoxes(el).forEach((b, i) => (b.value = digits[i]));
    this.focusBox(el, Math.min(text.length, 5));
  }

  // ── Resend timer ──────────────────────────────────────────────────────────

  resendSeconds = 0;
  private resendTimer: any = null;

  private startResendTimer(seconds = 30): void {
    this.stopResendTimer();
    this.resendSeconds = seconds;
    this.resendTimer = setInterval(() => {
      this.resendSeconds--;
      if (this.resendSeconds <= 0) this.stopResendTimer();
      this.cdr.detectChanges();
    }, 1000);
  }

  private stopResendTimer(): void {
    if (this.resendTimer) clearInterval(this.resendTimer);
    this.resendTimer = null;
    this.resendSeconds = 0;
  }

  // ── Signup email helpers ──────────────────────────────────────────────────

  onSignupEmailEdit(): void {
    if (this.signupOtpSent) {
      this.signupOtpSent = false;
      this.signupOtp = "";
      this.signupOtpError = null;
      this.signupOtpSuccess = null;
      this.stopResendTimer();
    }
  }

  changeSignupEmail(): void {
    this.signupOtpVerified = false;
    this.signupOtpSent = false;
    this.signupOtp = "";
    this.signupAttempt = 1;
    this.signupOtpError = null;
    this.signupOtpSuccess = null;
    this.stopResendTimer();
  }

  // ── Forgot-password helpers ───────────────────────────────────────────────

  get forgotEmailValid(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.forgotEmail.trim());
  }

  onForgotEmailEdit(): void {
    if (this.otpSent) {
      this.otpSent = false;
      this.otp = "";
      this.forgotError = null;
      this.forgotSuccess = null;
      this.stopResendTimer();
    }
  }

  changeForgotEmail(): void {
    this.otpVerified = false;
    this.otpSent = false;
    this.otp = "";
    this.attempt = 1;
    this.forgotError = null;
    this.forgotSuccess = null;
    this.stopResendTimer();
  }
}
