import { Component, Input, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, NgZone, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ticker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ticker.component.html',
  styleUrls: ['./ticker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TickerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() items: string[] = [];
  @Input() interval = 4000; // ms
  @Input() animationDuration = 600; // ms

  currentIndex = 0;
  nextIndex = 0;
  isAnimating = false;
  offset = 0; // track translate offset (can go 0..items.length for duplicated slide)
  noTransition = false;

  private timerId: any = null;
  private animationTimeout: any = null;
  private reducedMotion = false;
  private resetTimeout: any = null;

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  ngOnInit(): void {
    this.reducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.startIfNeeded();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.offset = 0;
      this.currentIndex = 0;
      this.nextIndex = 0;
      this.restartTimer();
    }
  }

  private startIfNeeded() {
    this.clearTimer();
    if (this.reducedMotion) return;
    if (!this.items || this.items.length < 2) return;
    // run timer outside angular to reduce change detection churn
    this.ngZone.runOutsideAngular(() => {
      this.timerId = setInterval(() => this.ngZone.run(() => this.slideNext()), this.interval);
    });
  }

  private restartTimer() {
    this.clearTimer();
    this.startIfNeeded();
    this.cdr.markForCheck();
  }

  private clearTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  slideNext() {
    if (!this.items || this.items.length < 1) return;
    if (this.reducedMotion || this.items.length < 2) return;
    if (this.isAnimating) return;
    this.isAnimating = true;
    // increment offset (track includes duplicated first item at end)
    this.offset = (this.offset || 0) + 1;
    this.cdr.markForCheck();

    // after animation, if we've moved to the duplicated slide, reset to real 0 without transition
    this.animationTimeout = setTimeout(() => {
      if (this.offset >= this.items.length) {
        // temporarily disable transition and snap back to 0
        this.noTransition = true;
        // snap to 0
        this.offset = 0;
        this.cdr.markForCheck();
        // re-enable transition after a short tick
        this.resetTimeout = setTimeout(() => {
          this.noTransition = false;
          this.cdr.markForCheck();
        }, 50);
      }
      this.isAnimating = false;
      this.cdr.markForCheck();
    }, this.animationDuration);
  }

  pause() {
    this.clearTimer();
  }

  resume() {
    this.startIfNeeded();
  }

  ngOnDestroy(): void {
    this.clearTimer();
    if (this.animationTimeout) {
      clearTimeout(this.animationTimeout);
      this.animationTimeout = null;
    }
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
      this.resetTimeout = null;
    }
  }
}
