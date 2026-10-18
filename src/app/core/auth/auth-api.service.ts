// src/app/core/auth/auth-api.service.ts

import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { BASE_URL } from "../../common/utils/constant";

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  mobileNum: string;
  password: string;
  sellerid: string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
  sellerid: string;
}

export interface LastDeliveryAddress {
  Address: string;
  city: string;
  postalCode: string;
  state: string;
}
export interface GenerateOtpResponse {
  msg: string;
  otp: number;
}

export interface SignupOrLoginResponse {
  success: boolean;
  message: string;

  user?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    mobileNum: string;
    type: "buyer" | "seller";
    role: "WEB-GUEST" | "WEB-LOGGED";

    lastDeliveryAddesses?: LastDeliveryAddress[];

    reward?: number;

    lastEarned?: number;

    lastRedeemed?: number;

    totalRedeemed?: number;
    availableRewards?: number;
  };

  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
}

@Injectable({
  providedIn: "root",
})
export class AuthApiService {
  constructor(private http: HttpClient) {}

  signup(payload: SignupRequest): Observable<SignupOrLoginResponse> {
    return this.http.post<SignupOrLoginResponse>(`${BASE_URL}/signup`, payload);
  }

  login(payload: LoginRequest): Observable<SignupOrLoginResponse> {
    return this.http.post<SignupOrLoginResponse>(`${BASE_URL}/login`, payload);
  }
  refreshToken(refreshToken: string) {
    return this.http.post<SignupOrLoginResponse>(`${BASE_URL}/refresh`, {
      refreshToken,
    });
  }

  // generateOtp(payload: any): Observable<string> {
  //   return this.http.post(`${BASE_URL}/GenerateOtp`, payload, {
  //     responseType: "text",
  //   });
  // }
  generateOtp(payload: { mobileNum: string }): Observable<GenerateOtpResponse> {
    return this.http.post<GenerateOtpResponse>(
      `${BASE_URL}/GenerateOtp`,
      payload,
    );
  }

  validateOtp(payload: any) {
    return this.http.post<boolean>(`${BASE_URL}/ValidateOtp`, payload);
  }

  deleteOtp(payload: any) {
    return this.http.post(`${BASE_URL}/DeleteOtp`, payload);
  }

  resetPassword(payload: any) {
    return this.http.post(`${BASE_URL}/ResetPassword`, payload);
  }
  sendWhatsAppOtp(payload: {
    to: string;
    customerNumber: string;
    otp: string | number;
  }): Observable<string> {
    return this.http.post(`${BASE_URL}/notifications/otp`, null, {
      params: {
        to: payload.to,
        customerNumber: payload.customerNumber,
        otp: String(payload.otp),
      },
      responseType: "text",
    });
  }
}
