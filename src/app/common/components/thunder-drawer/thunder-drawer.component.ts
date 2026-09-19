import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-thunder-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './thunder-drawer.component.html',
  styleUrls: ['./thunder-drawer.component.scss']
})
export class ThunderDrawerComponent {
  /** Controls visibility of the drawer */
  @Input() open = false;

  /** Emitted when clicking the overlay/backdrop */
  @Output() overlayClick = new EventEmitter<void>();

  /** Emitted when closing the drawer (close button, esc, or overlay) */
  @Output() closed = new EventEmitter<void>();

  /**
   * Listen for Escape key to close the drawer
   */
  @HostListener('document:keydown.escape')
  onEscapeKey() {
    if (this.open) {
      this.close();
    }
  }

  /**
   * Handle overlay click to close drawer
   */
  onOverlayClick() {
    this.overlayClick.emit();
    this.close();
  }

  /**
   * Handle close button click
   */
  onCloseClick() {
    this.closed.emit();
    this.close();
  }

  /**
   * Internal close method
   */
  close() {
    this.closed.emit();
  }
}
