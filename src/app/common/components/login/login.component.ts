// ============================================================
// login.component.ts
// src/app/pages/login/login.component.ts
//
// CHANGES FROM ORIGINAL:
//   1. SampleUser now includes role ('USER' | 'ADMIN')
//   2. AuthUser built from found user includes role
//   3. login() clears loginError before each attempt
//   4. login() reads returnUrl from query params and navigates there
//   5. selectSampleUser() also honours returnUrl
//   6. ActivatedRoute injected via inject() (consistent with existing style)
// ============================================================

import { CommonModule } from "@angular/common";
import { inject } from "@angular/core";
import { ChangeDetectionStrategy, Component, OnDestroy } from "@angular/core";
import {
  AbstractControl,
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

import { ChangeDetectorRef } from "@angular/core";
import { SellerService } from "../../services/SellerService";
import { INPUT_LENGTH } from "../../utils/input-length.config";

// [UPDATED] SampleUser now carries role, matching the updated AuthUser interface
type SampleUser = AuthUser & { password: string };

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnDestroy {
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

  // isSendingOtp = false;
  // isVerifyingOtp = false;

  signupOtpSuccess: string | null = null;
  signupOtpError: string | null = null;

  // ── Forgot-password OTP expiry countdown ─────────────────────────────────
  // GenerateOtp does not return an expiry, so the UI uses a fixed window.
  readonly OTP_EXPIRY_SECONDS = 10 * 60;
  otpSecondsLeft = 0;
  otpExpired = false;
  private otpExpiresAt = 0;
  private otpTimerId: ReturnType<typeof setInterval> | null = null;

  get otpTimerRunning(): boolean {
    return this.otpSent && !this.otpExpired && this.otpSecondsLeft > 0;
  }

  get otpCountdown(): string {
    const mm = Math.floor(this.otpSecondsLeft / 60);
    const ss = this.otpSecondsLeft % 60;
    return `${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
  }

  // Basic validation only: both filled, length >= 6, and matching.
  get canUpdatePassword(): boolean {
    return (
      !!this.newPassword &&
      !!this.confirmPassword &&
      this.newPassword.length >= 6 &&
      this.newPassword === this.confirmPassword
    );
  }

  private startOtpTimer(): void {
    this.stopOtpTimer();
    this.otpExpired = false;
    this.otpExpiresAt = Date.now() + this.OTP_EXPIRY_SECONDS * 1000;
    this.otpSecondsLeft = this.OTP_EXPIRY_SECONDS;

    this.otpTimerId = setInterval(() => {
      this.otpSecondsLeft = Math.max(
        0,
        Math.ceil((this.otpExpiresAt - Date.now()) / 1000),
      );

      if (this.otpSecondsLeft === 0) {
        this.onOtpExpired();
      }

      this.cdr.detectChanges();
    }, 1000);
  }

  private stopOtpTimer(): void {
    if (this.otpTimerId) {
      clearInterval(this.otpTimerId);
      this.otpTimerId = null;
    }
  }

  private onOtpExpired(): void {
    this.stopOtpTimer();
    this.otpExpired = true;
    this.otpVerified = false;
    this.otp = "";
    this.forgotSuccess = null;
    this.forgotError = "OTP expired. Please request a new OTP.";
  }

  private resetOtpTimer(): void {
    this.stopOtpTimer();
    this.otpSecondsLeft = 0;
    this.otpExpired = false;
  }

  ngOnDestroy(): void {
    this.stopOtpTimer();
  }

  showForgotPassword(): void {
    this.forgotPasswordMode = true;

    this.otpSent = false;
    this.otpVerified = false;

    // this.forgotEmail = "";
    this.forgotMobile = "";
    this.otp = "";

    this.newPassword = "";
    this.confirmPassword = "";

    this.forgotError = null;

    this.resetOtpTimer();
  }

  private auth = inject(AuthService);
  private authApi = inject(AuthApiService);
  private router = inject(Router);
  private sellerService = inject(SellerService);

  // [ADDED] Injected via inject() to match the existing style of this component.
  // Using snapshot.queryParamMap inside login() — no subscription needed.
  private route = inject(ActivatedRoute);

  // [UPDATED] role added to every sample user.
  // buyer → USER role (standard customer access)
  // seller → ADMIN role (seller dashboard access)
  //
  // In a real system, role comes from the API response, not from this array.
  // This array is MOCK ONLY and will be deleted when the backend is integrated.
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
      // lastName: ["", [Validators.required, Validators.minLength(4)]],
      // email: ["", [Validators.email]],
      phone: ["", [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      password: ["", [Validators.required, Validators.minLength(6)]],
      confirmPassword: ["", [Validators.required]],
    });
  }

  // ── Form control getters ──────────────────────────────────────────────────

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

  newPasswordStrong = false;

  newPasswordStrengthPercent = 0;

  newPasswordStrengthText = "Weak";

  checkNewPasswordStrength() {
    const password = this.newPassword || "";

    const hasLength = password.length >= 6;

    const hasNumber = /[0-9]/.test(password);

    const capitalCount = (password.match(/[A-Z]/g) || []).length;

    const specialCount = (password.match(/[!@#$%^&*(),.?":{}|<>]/g) || [])
      .length;

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

    // ── Reset all error/success messages ─────────────────────────────
    this.loginError = null;

    this.forgotError = null;
    this.forgotSuccess = null;

    this.signupOtpError = null;
    this.signupOtpSuccess = null;

    // ── Reset OTP states ─────────────────────────────────────────────
    this.signupOtpSent = false;
    this.signupOtpVerified = false;
    this.signupOtp = "";
    this.signupAttempt = 1;

    this.otpSent = false;
    this.otpVerified = false;
    this.otp = "";
    this.attempt = 1;
    this.resetOtpTimer();

    // ── Reset loading states ─────────────────────────────────────────
    this.isSendingOtp = false;
    this.isVerifyingOtp = false;

    // ── Reset forgot-password fields ─────────────────────────────────
    this.forgotMobile = "";
    this.newPassword = "";
    this.confirmPassword = "";

    // ── Reset password strength ──────────────────────────────────────
    this.newPasswordStrong = false;
    this.newPasswordStrengthPercent = 0;
    this.newPasswordStrengthText = "Weak";

    // ── Reset signup password strength ───────────────────────────────
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
  //
  // [ADDED] Reads the returnUrl query param that the auth guard appends when
  // redirecting an unauthenticated user to /login.
  //
  // Example URL the guard produces:
  //   /login?returnUrl=%2Fprofile
  //
  // Falls back to '/' if no returnUrl is present (direct navigation to /login).

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

    // this.registerForm.get("confirmPassword")?.valueChanges.subscribe(() => {
    //   const password = this.registerForm.get("password")?.value;
    //   const confirm = this.registerForm.get("confirmPassword")?.value;

    //   if (confirm && password !== confirm) {
    //     this.registerForm.get("confirmPassword")?.setErrors({ mismatch: true });
    //   } else {
    //     this.registerForm.get("confirmPassword")?.setErrors(null);
    //   }
    // });
  }

  login(): void {
    this.auth.logout();
    this.loginError = null;

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const payload = {
      identifier: this.normalizeMobile(this.loginForm.get("identifier")?.value),
      password: this.loginForm.get("password")?.value,
      sellerid: this.sellerService.getSellerId(),
    };

    this.authApi.login(payload).subscribe({
      next: (res) => {
        console.log("Login Response:", res);

        if (!res?.success) {
          this.loginError = res?.message || "Login failed";
          sessionStorage.clear();
          this.cdr.detectChanges();
          return;
        }

        if (!res?.user) {
          this.loginError = "User not found";
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
        this.cdr.detectChanges();
        this.loginError = this.getErrorMessage(err);
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
      email: "",
      mobileNum: this.normalizeMobile(form.phone),
      password: String(form.password ?? "").trim(),
      sellerid: this.sellerService.getSellerId(),
      companyname: this.sellerService.getCompanyName(),
    };

    console.log("Signup Payload:", payload);

    this.authApi.signup(payload).subscribe({
      next: (res) => {
        console.log("Signup Response:", res);

        if (!res.success || !res.user) {
          this.loginError = res.message || "Signup failed";
          this.cdr.detectChanges();
          return;
        }

        // Build AuthUser
        // const user: AuthUser = {
        //   id: res.user.id,
        //   firstName: res.user.firstName,
        //   lastName: res.user.lastName,
        //   email: res.user.email,
        //   phone: res.user.mobileNum,
        //   type: res.user.type,
        //   role: res.user.role,
        // };

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
        console.error("Login Error:", err);
        this.cdr.detectChanges();
        this.loginError = this.getErrorMessage(err);
      },
    });
  }

  // ── Mobile number helpers ────────────────────────────────────────────────

  /** Keep digits only, then drop leading zeros */
  private normalizeMobile(value: unknown): string {
    return String(value ?? "")
      .replace(/\D/g, "")
      .replace(/^0+/, "");
  }

  /** Reactive-form fields: block non-digits while typing or pasting */
  onMobileInput(event: Event, control: AbstractControl | null): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = input.value.replace(/\D/g, "");
    if (input.value !== digitsOnly) {
      input.value = digitsOnly;
    }
    control?.setValue(digitsOnly);
  }

  /** Reactive-form fields: strip leading 0 on blur */
  onMobileBlur(control: AbstractControl | null): void {
    control?.setValue(this.normalizeMobile(control.value));
  }

  /** Forgot-password field (ngModel) */
  onForgotMobileInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digitsOnly = input.value.replace(/\D/g, "");
    input.value = digitsOnly;
    this.forgotMobile = digitsOnly;
  }

  onForgotMobileBlur(): void {
    this.forgotMobile = this.normalizeMobile(this.forgotMobile);
  }

  // generateOtp(): void {
  //   this.forgotError = null;

  //   if (!this.forgotEmail) {
  //     this.forgotError = "Enter email";
  //     return;
  //   }
  //   this.isSendingOtp = true;
  //   this.authApi
  //     .generateOtp({
  //       email: this.forgotEmail,
  //     })
  //     .subscribe({
  //       next: (res) => {
  //         console.log("Generate OTP res--> ", res);

  //         if (res === "OTP SENT") {
  //           this.otpSent = true;
  //           this.forgotSuccess = "OTP sent successfully";
  //         } else {
  //           this.forgotError = res;
  //         }
  //         this.isSendingOtp = false;
  //         this.cdr.detectChanges();
  //       },

  //       error: () => {
  //         this.forgotError = "Failed to send OTP";
  //         this.isSendingOtp = false;
  //         this.cdr.detectChanges();
  //       },
  //     });
  // }
  // generateOtp(): void {
  //   this.signupOtpError = null;
  //   this.signupOtpSuccess = null;

  //   // const email = this.registerForm.get("email")?.value?.trim();

  //   // if (!email) {
  //   //   this.signupOtpError = "Enter email";
  //   //   return;
  //   // }

  //   // if (this.rEmail?.invalid) {
  //   //   this.signupOtpError = "Enter a valid email";
  //   //   return;
  //   // }

  //   this.isSendingOtp = true;

  //   this.authApi.generateOtp({ email: null }).subscribe({
  //     next: (res) => {
  //       console.log("OTP res-> ", res);
  //       this.isSendingOtp = false;

  //       if (res === "OTP SENT") {
  //         this.signupOtpSent = true;
  //         this.signupOtpVerified = false;
  //         this.signupOtp = "";

  //         this.signupOtpSuccess = "OTP sent successfully";
  //       } else {
  //         this.signupOtpError = res;
  //       }

  //       this.cdr.detectChanges();
  //     },

  //     error: () => {
  //       this.isSendingOtp = false;
  //       this.signupOtpError = "Failed to send OTP";
  //       this.cdr.detectChanges();
  //     },
  //   });
  // }

  // generateForgotOtp(): void {
  //   this.forgotError = null;
  //   this.forgotSuccess = null;

  //   if (!this.forgotEmail) {
  //     this.forgotError = "Enter email";
  //     return;
  //   }

  //   this.isSendingOtp = true;

  //   this.authApi
  //     .generateOtp({
  //       email: this.forgotEmail.trim(),
  //     })
  //     .subscribe({
  //       next: (res) => {
  //         this.isSendingOtp = false;

  //         if (res === "OTP SENT") {
  //           this.otpSent = true;
  //           this.otpVerified = false;
  //           this.otp = "";

  //           this.forgotSuccess = "OTP sent successfully";
  //         } else {
  //           this.forgotError = res;
  //         }

  //         this.cdr.detectChanges();
  //       },

  //       error: () => {
  //         this.isSendingOtp = false;
  //         this.forgotError = "Failed to send OTP";
  //         this.cdr.detectChanges();
  //       },
  //     });
  // }

  // attempt = 1;
  // isVerifyingOtp = false;
  // // verifyOtp(): void {
  // //   this.isVerifyingOtp = true;
  // //   this.authApi
  // //     .validateOtp({
  // //       email: this.forgotEmail,
  // //       otp: this.otp,
  // //       attempt: this.attempt,
  // //     })
  // //     .subscribe({
  // //       next: (valid) => {
  // //         if (valid) {
  // //           this.authApi
  // //             .deleteOtp({
  // //               email: this.forgotEmail,
  // //               otp: this.otp,
  // //             })
  // //             .subscribe();

  // //           this.otpVerified = true;

  // //           this.forgotSuccess = "OTP verified";
  // //         } else {
  // //           this.attempt++;

  // //           this.forgotError = "Invalid OTP";
  // //         }
  // //         this.isVerifyingOtp = false;
  // //         this.cdr.detectChanges();
  // //       },

  // //       error: () => {
  // //         this.forgotError = "OTP validation failed";
  // //         this.isVerifyingOtp = false;
  // //         this.cdr.detectChanges();
  // //       },
  // //     });
  // // }

  // verifyOtp(): void {
  //   this.signupOtpError = null;
  //   this.signupOtpSuccess = null;

  //   const email = this.registerForm.get("email")?.value?.trim();

  //   if (!this.signupOtp) {
  //     this.signupOtpError = "Enter OTP";
  //     return;
  //   }

  //   this.isVerifyingOtp = true;

  //   this.authApi
  //     .validateOtp({
  //       email,
  //       otp: this.signupOtp,
  //       attempt: this.signupAttempt,
  //     })
  //     .subscribe({
  //       next: (valid) => {
  //         this.isVerifyingOtp = false;

  //         if (valid) {
  //           this.authApi
  //             .deleteOtp({
  //               email,
  //               otp: this.signupOtp,
  //             })
  //             .subscribe();

  //           this.signupOtpVerified = true;
  //           this.signupOtpSent = false;

  //           this.signupOtpSuccess = "OTP verified successfully";
  //         } else {
  //           this.signupAttempt++;
  //           this.signupOtpError = "Invalid OTP";
  //         }

  //         this.cdr.detectChanges();
  //       },

  //       error: () => {
  //         this.isVerifyingOtp = false;
  //         this.signupOtpError = "OTP validation failed";
  //         this.cdr.detectChanges();
  //       },
  //     });
  // }

  // verifyForgotOtp(): void {
  //   this.forgotError = null;
  //   this.forgotSuccess = null;

  //   if (!this.otp) {
  //     this.forgotError = "Enter OTP";
  //     return;
  //   }

  //   this.isVerifyingOtp = true;

  //   this.authApi
  //     .validateOtp({
  //       email: this.forgotEmail.trim(),
  //       otp: this.otp,
  //       attempt: this.attempt,
  //     })
  //     .subscribe({
  //       next: (valid) => {
  //         this.isVerifyingOtp = false;

  //         if (valid) {
  //           this.authApi
  //             .deleteOtp({
  //               email: this.forgotEmail.trim(),
  //               otp: this.otp,
  //             })
  //             .subscribe();

  //           this.otpVerified = true;
  //           this.forgotSuccess = "OTP verified successfully";
  //         } else {
  //           this.attempt++;
  //           this.forgotError = "Invalid OTP";
  //         }

  //         this.cdr.detectChanges();
  //       },

  //       error: () => {
  //         this.isVerifyingOtp = false;
  //         this.forgotError = "OTP validation failed";
  //         this.cdr.detectChanges();
  //       },
  //     });
  // }

  // resetPassword(): void {
  //   this.forgotError = null;

  //   if (!this.newPassword) {
  //     this.forgotError = "Enter new password";
  //     return;
  //   }

  //   if (this.newPassword !== this.confirmPassword) {
  //     this.forgotError = "Passwords do not match";
  //     return;
  //   }

  //   this.authApi
  //     .resetPassword({
  //       email: this.forgotEmail,
  //       password: this.newPassword,
  //     })
  //     .subscribe({
  //       next: () => {
  //         this.forgotSuccess = "Password updated successfully";

  //         this.forgotPasswordMode = false;

  //         this.activeTab = "login";
  //         this.cdr.detectChanges();
  //       },

  //       error: () => {
  //         this.forgotError = "Failed to update password";
  //         this.cdr.detectChanges();
  //       },
  //     });
  // }

  // ── selectSampleUser() ────────────────────────────────────────────────────
  //
  // Quick-login shortcut used in development and demos.
  // [UPDATED] Now also honours returnUrl so clicking a sample user card while
  // on /login?returnUrl=%2Forder-history sends the user to /order-history.

  generateOtp(): void {
    this.signupOtpError = null;
    this.signupOtpSuccess = null;

    const mobileNum = String(
      this.registerForm.get("phone")?.value ?? "",
    ).trim();

    if (!mobileNum) {
      this.signupOtpError = "Enter mobile number";
      return;
    }

    if (!/^[0-9]{10}$/.test(mobileNum)) {
      this.signupOtpError = "Enter a valid 10-digit mobile number";
      return;
    }

    this.isSendingOtp = true;

    this.authApi.generateOtp({ mobileNum }).subscribe({
      next: (res: any) => {
        console.log("OTP res -> ", res);

        if (res?.msg === "OTP SENT") {
          // Backend generated OTP
          const otp = res?.otp;

          console.log("Generated OTP:", otp);

          // Send OTP through WhatsApp
          this.authApi
            .sendWhatsAppOtp({
              to: mobileNum,
              customerNumber: mobileNum,
              otp: otp,
            })
            .subscribe({
              next: (whatsappRes) => {
                console.log("WhatsApp OTP response -> ", whatsappRes);

                this.signupOtpSent = true;
                this.signupOtpVerified = false;
                this.signupOtp = "";
                this.signupAttempt = 1;

                this.signupOtpSuccess =
                  "OTP sent successfully to your WhatsApp.";

                this.isSendingOtp = false;
                this.cdr.detectChanges();
              },

              error: (whatsappErr) => {
                // console.error("WhatsApp OTP Error:", whatsappErr);

                // this.isSendingOtp = false;

                // this.signupOtpError =
                //   whatsappErr?.error?.message ||
                //   "OTP generated but failed to send on WhatsApp.";

                // this.cdr.detectChanges();

                this.signupOtpSent = true;
                this.signupOtpVerified = false;
                this.signupOtp = "";
                this.signupAttempt = 1;

                this.signupOtpSuccess =
                  "OTP sent successfully to your WhatsApp.";

                this.isSendingOtp = false;
                this.cdr.detectChanges();
              },
            });
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

  generateForgotOtp(): void {
    this.forgotError = null;
    this.forgotSuccess = null;

    const mobileNum = String(this.forgotMobile ?? "").trim();

    if (!mobileNum) {
      this.forgotError = "Enter mobile number";
      return;
    }

    if (!/^[0-9]{10}$/.test(mobileNum)) {
      this.forgotError = "Enter a valid 10-digit mobile number";
      return;
    }

    this.isSendingOtp = true;

    this.authApi.generateOtp({ mobileNum }).subscribe({
      next: (res) => {
        console.log("Forgot OTP res -> ", res);

        if (res?.msg === "OTP SENT") {
          const otp = res.otp;

          console.log("Generated Forgot OTP:", otp);

          // Send OTP through WhatsApp
          this.authApi
            .sendWhatsAppOtp({
              to: mobileNum,
              customerNumber: mobileNum,
              otp: otp,
            })
            .subscribe({
              next: (whatsappRes) => {
                console.log("Forgot WhatsApp OTP response -> ", whatsappRes);

                this.otpSent = true;
                this.otpVerified = false;
                this.otp = "";
                this.attempt = 1;

                this.forgotSuccess = "OTP sent successfully to your WhatsApp.";
                this.startOtpTimer();

                this.isSendingOtp = false;
                this.cdr.detectChanges();
              },

              error: (whatsappErr) => {
                // console.error(
                //   "Forgot WhatsApp OTP Error:",
                //   whatsappErr?.error || whatsappErr,
                // );

                // this.isSendingOtp = false;

                // this.forgotError =
                //   whatsappErr?.error?.message ||
                //   whatsappErr?.error?.msg ||
                //   "OTP generated but failed to send on WhatsApp.";

                // this.cdr.detectChanges();
                this.otpSent = true;
                this.otpVerified = false;
                this.otp = "";
                this.attempt = 1;

                this.forgotSuccess = "OTP sent successfully to your WhatsApp.";
                this.startOtpTimer();

                this.isSendingOtp = false;
                this.cdr.detectChanges();
              },
            });
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

  verifyOtp(): void {
    this.signupOtpError = null;
    this.signupOtpSuccess = null;

    const mobileNum = String(
      this.registerForm.get("phone")?.value ?? "",
    ).trim();

    if (!mobileNum) {
      this.signupOtpError = "Enter mobile number";
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
        mobileNum,
        otp: this.signupOtp,
        attempt: this.signupAttempt,
      })
      .subscribe({
        next: (valid) => {
          this.isVerifyingOtp = false;

          if (valid) {
            this.authApi
              .deleteOtp({
                mobileNum,
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

            this.signupOtpSuccess = "Mobile number OTP verified successfully";
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

  verifyForgotOtp(): void {
    this.forgotError = null;
    this.forgotSuccess = null;

    const mobileNum = String(this.forgotMobile ?? "").trim();

    if (!mobileNum) {
      this.forgotError = "Enter mobile number";
      return;
    }

    if (!/^[0-9]{10}$/.test(mobileNum)) {
      this.forgotError = "Enter a valid 10-digit mobile number";
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
        mobileNum,
        otp: this.otp,
        attempt: this.attempt,
      })
      .subscribe({
        next: (valid) => {
          this.isVerifyingOtp = false;

          if (valid) {
            this.authApi
              .deleteOtp({
                mobileNum,
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
            this.newPassword = "";
            this.confirmPassword = "";
            this.checkNewPasswordStrength();

            this.forgotSuccess = "Mobile number OTP verified successfully";
          } else {
            this.attempt++;
            this.forgotError = "Invalid OTP";
          }

          this.cdr.detectChanges();

          // Browser autofill may drop the saved password into the newly
          // rendered New Password field; clear it once it has rendered.
          if (this.otpVerified) {
            setTimeout(() => {
              this.newPassword = "";
              this.confirmPassword = "";
              this.checkNewPasswordStrength();
              this.cdr.detectChanges();
            });
          }
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

    if (this.newPassword.length < 6) {
      this.forgotError = "Password must be at least 6 characters.";
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.forgotError = "Passwords do not match";
      return;
    }

    this.authApi
      .resetPassword({
        mobileNum: String(this.forgotMobile ?? "").trim(),
        password: this.newPassword.trim(),
        sellerid: this.sellerService.getSellerId(),
      })
      .subscribe({
        next: () => {
          this.forgotSuccess = "Password updated successfully";
          this.resetOtpTimer();

          // Pre-fill the login mobile with the number just reset; never carry
          // over any old password (component state or browser autofill).
          const mobileNum = String(this.forgotMobile ?? "").trim();
          this.loginForm.reset({
            identifier: mobileNum,
            password: "",
            remember: this.loginForm.get("remember")?.value ?? false,
          });
          this.showLoginPassword = false;
          this.newPassword = "";
          this.confirmPassword = "";

          this.forgotPasswordMode = false;
          this.activeTab = "login";

          this.cdr.detectChanges();

          // Browser autofill can repopulate the password after the login
          // panel re-renders, so clear it once more on the next tick.
          setTimeout(() => {
            this.loginForm.get("password")?.setValue("");
            this.cdr.detectChanges();
          });
        },

        error: (err) => {
          console.error("Reset Password Error:", err);

          this.forgotError = err?.error?.message || "Failed to update password";

          this.cdr.detectChanges();
        },
      });
  }

  selectSampleUser(user: SampleUser): void {
    // Autofill the form fields (visual feedback for the user)
    this.loginForm.patchValue({
      identifier: user.email || user.phone,
      password: user.password,
    });

    // Build AuthUser — strip password, include role
    // [UPDATED] role included
    const u: AuthUser = {
      id: undefined,
      firstName: user.firstName,
      email: user.email,
      phone: user.phone,
      type: user.type,
      role: user.role, // ← NEW
    };

    this.auth.login(u);

    // [UPDATED] Respect returnUrl — same fix applied here as in login()
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
}
