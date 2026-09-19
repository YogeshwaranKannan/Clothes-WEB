import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const digitsOnly = (maxLen?: number): ValidatorFn => {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value == null || control.value === '') return null;
    const v = String(control.value).replace(/\s+/g, '');
    if (!/^[0-9]*$/.test(v)) return { digitsOnly: true };
    if (maxLen && v.length > maxLen) return { maxLength: { requiredLength: maxLen, actualLength: v.length } };
    return null;
  };
};

export const nameLettersOnly: ValidatorFn = (control: AbstractControl) => {
  if (!control.value) return null;
  const v = String(control.value);
  return /^[A-Za-z ]+$/.test(v) ? null : { lettersOnly: true };
};

// Strict email regex (RFC-like, reasonably strict)
export const strictEmail: ValidatorFn = (control: AbstractControl) => {
  if (!control.value) return null;
  const v = String(control.value).trim();
  // This is a strict but practical regex; full RFC is complex.
  const re = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/;
  return re.test(v) ? null : { emailStrict: true };
};

export const cardNumberValidator: ValidatorFn = (control: AbstractControl) => {
  if (!control.value) return null;
  const v = String(control.value).replace(/\s+/g, '');
  if (!/^[0-9]{13,16}$/.test(v)) return { cardNumber: true };
  return null;
};

export const expiryValidator: ValidatorFn = (control: AbstractControl) => {
  if (!control.value) return null;
  const v = String(control.value).trim();
  // Expect YY/MM or YY/MM (two digits slash two digits)
  if (!/^\d{2}\/\d{2}$/.test(v)) return { expiryFormat: true };
  const parts = v.split('/');
  const mm = parseInt(parts[1], 10);
  if (isNaN(mm) || mm < 1 || mm > 12) return { expiryMonth: true };
  return null;
};
