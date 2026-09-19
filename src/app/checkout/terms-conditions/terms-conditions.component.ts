import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-terms-conditions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terms-conditions.component.html',
  styleUrls: ['./terms-conditions.component.scss']
})
export class TermsConditionsComponent {
  @Output() accept = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onAccept() {
    this.accept.emit();
  }

  onCancel() {
    this.cancel.emit();
  }
}
