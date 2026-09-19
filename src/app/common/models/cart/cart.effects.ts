import { Injectable } from '@angular/core';
import { Actions } from '@ngrx/effects';

@Injectable()
export class CartEffects {
  // scaffold only: add effects (e.g., persist cart, sync with server) here
  constructor(private actions$: Actions) {}
}
