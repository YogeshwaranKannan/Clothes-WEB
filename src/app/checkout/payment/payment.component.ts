import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { digitsOnly, cardNumberValidator, expiryValidator, nameLettersOnly } from '../validators';
import { FormsModule } from '@angular/forms';
import { CheckoutValidationService } from '../services/checkout-validation.service';

export type PaymentMethod = 'card' | 'paypal' | 'applePay';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
})
export class PaymentComponent {
  paymentForm: FormGroup;

  selectedMethod: PaymentMethod = 'card';

  payment = {
    method: 'card' as PaymentMethod,
    cardNumber: '',
    expiry: '',
    cvv: '',
    nameOnCard: '',
  };

  constructor(private fb: FormBuilder, private checkoutValidationService: CheckoutValidationService) {
    this.paymentForm = this.fb.group({
      method: ['card', [Validators.required]],
      cardNumber: ['', [Validators.required, digitsOnly(16), cardNumberValidator]],
      expiry: ['', [Validators.required, expiryValidator]],
      cvv: ['', [Validators.required, digitsOnly(5)]],
      nameOnCard: ['', [Validators.required, nameLettersOnly, Validators.maxLength(50)]],
    });
  // register under a key so the review component can read values
  this.checkoutValidationService.registerForm('payment', this.paymentForm);
  }

  // Auto-format expiry as YY/MM while typing
  onExpiryInput(e: Event) {
    const input = e.target as HTMLInputElement;
    let v = input.value.replace(/[^0-9]/g, ''); // digits only
    if (v.length > 4) v = v.slice(0, 4);
    if (v.length >= 3) {
      v = v.slice(0, 2) + '/' + v.slice(2);
    }
    // update the form control without emitting an extra event
    this.paymentForm.get('expiry')?.setValue(v, { emitEvent: false });
  }

  setMethod(method: PaymentMethod): void {
    this.selectedMethod = method;
    this.payment.method = method;
    this.paymentForm.patchValue({ method });
  }

  isCardSelected(): boolean {
    return this.selectedMethod === 'card';
  }
}
