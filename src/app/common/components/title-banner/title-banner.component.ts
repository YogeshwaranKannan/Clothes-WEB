import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-title-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './title-banner.component.html',
  styleUrls: ['./title-banner.component.scss'],
})
export class TitleBannerComponent {
  /** Full page title, e.g. "product/dell venue" */
  @Input() pageTitle = '';

  /** Show breadcrumb on right side */
  @Input() showBreadcrumb = true;

  /** Optional override for breadcrumb current label.
   * If empty, we auto-derive from pageTitle.
   */
  @Input() breadcrumbCurrent = '';

  /** If you want to hide the "Home /" part and only show current */
  @Input() showHomeInBreadcrumb = true;

  get leftTitle(): string {
    // Left side shows the first segment, like "product"
    const t = (this.pageTitle ?? '').trim();
    if (!t) return '';
    return t.split('/')[0] ?? t;
  }

  get currentCrumb(): string {
    // Right side shows last segment, like "dell venue"
    if (this.breadcrumbCurrent?.trim()) return this.breadcrumbCurrent.trim();
    const t = (this.pageTitle ?? '').trim();
    if (!t) return '';
    const parts = t.split('/').filter(Boolean);
    return parts[parts.length - 1] ?? t;
  }
}