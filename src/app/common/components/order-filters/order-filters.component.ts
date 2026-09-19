import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Order } from '../../models/orders.model';

// ── Types ────────────────────────────────────────────────────────────────────

export type OrderSortValue =
  | ''
  | 'order_id-asc'       | 'order_id-desc'
  | 'customerSiteName-asc' | 'customerSiteName-desc'
  | 'amountReceived-asc' | 'amountReceived-desc'
  | 'siteExpenses-asc'   | 'siteExpenses-desc'
  | 'balanceAmount-asc'  | 'balanceAmount-desc'
  | 'deliveryDate-asc'   | 'deliveryDate-desc';

export type RangeKey = 'amtReceived' | 'siteExpenses' | 'balance';

interface RangeState { min: number; max: number; }
interface Bounds     { min: number; max: number; }

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-order-filters',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-filters.component.html',
  styleUrls: ['./order-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderFiltersComponent implements OnChanges {

  /** Pass the full (unfiltered) order list so bounds can be computed */
  @Input() allOrders: Order[] = [];

  /** How many orders survive the current filters (for mobile footer) */
  @Input() resultCount = 0;

  // ── Outputs ────────────────────────────────────────────────────────────────
  @Output() searchChanged      = new EventEmitter<string>();
  @Output() rangeChanged       = new EventEmitter<{ key: RangeKey; min: number | null; max: number | null }>();
  @Output() dateRangeChanged   = new EventEmitter<{ from: string; to: string }>();
  @Output() sortChanged        = new EventEmitter<OrderSortValue>();
  @Output() clearAllClicked    = new EventEmitter<void>();

  // ── UI state ───────────────────────────────────────────────────────────────
  openPanel: RangeKey | 'deliveryDate' | null = null;
  mobileDrawerOpen  = false;
  mobileActiveGroup: RangeKey | 'deliveryDate' | 'sort' | null = null;

  // ── Filter state ───────────────────────────────────────────────────────────
  searchTerm = '';
  sortValue: OrderSortValue = '';
  dateFrom = '';
  dateTo   = '';

  /** Live min/max values for each range chip (what the user has set) */
  ranges: Record<RangeKey, RangeState> = {
    amtReceived:  { min: 0, max: 0 },
    siteExpenses: { min: 0, max: 0 },
    balance:      { min: 0, max: 0 }
  };

  /** Absolute bounds computed from allOrders */
  bounds: Record<RangeKey, Bounds> = {
    amtReceived:  { min: 0, max: 0 },
    siteExpenses: { min: 0, max: 0 },
    balance:      { min: 0, max: 0 }
  };

  /** Whether a range has been moved from its default bounds */
  private rangeActive: Record<RangeKey, boolean> = {
    amtReceived:  false,
    siteExpenses: false,
    balance:      false
  };

  // ── Sort options (used in mobile sort list) ────────────────────────────────
  readonly sortOptions: { value: OrderSortValue; label: string }[] = [
    { value: '',                      label: 'Default' },
    { value: 'order_id-asc',          label: 'JC: A → Z' },
    { value: 'order_id-desc',         label: 'JC: Z → A' },
    { value: 'customerSiteName-asc',  label: 'Site Name: A → Z' },
    { value: 'customerSiteName-desc', label: 'Site Name: Z → A' },
    { value: 'amountReceived-asc',    label: 'Amt Received: Low → High' },
    { value: 'amountReceived-desc',   label: 'Amt Received: High → Low' },
    { value: 'siteExpenses-asc',      label: 'Expenses: Low → High' },
    { value: 'siteExpenses-desc',     label: 'Expenses: High → Low' },
    { value: 'balanceAmount-asc',     label: 'Balance: Low → High' },
    { value: 'balanceAmount-desc',    label: 'Balance: High → Low' },
    { value: 'deliveryDate-asc',      label: 'Delivery Date: Earliest' },
    { value: 'deliveryDate-desc',     label: 'Delivery Date: Latest' },
  ];

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges) {
    if (changes['allOrders']) {
      this.computeBounds();
    }
  }

  private computeBounds() {
    const orders = this.allOrders ?? [];
    const nums = (field: keyof Order) =>
      orders.map(o => Number(o[field]) || 0).filter(n => isFinite(n));

    const minOf = (arr: number[]) => arr.length ? Math.min(...arr) : 0;
    const maxOf = (arr: number[]) => arr.length ? Math.max(...arr) : 0;

    const fields: [RangeKey, keyof Order][] = [
      ['amtReceived',  'amountReceived'],
      ['siteExpenses', 'siteExpenses'],
      ['balance',      'balanceAmount'],
    ];

    for (const [key, field] of fields) {
      const vals = nums(field);
      const lo = minOf(vals);
      const hi = maxOf(vals);
      this.bounds[key] = { min: lo, max: hi };
      // Only reset range if user hasn't interacted yet
      if (!this.rangeActive[key]) {
        this.ranges[key] = { min: lo, max: hi };
      }
    }
  }

  // ── Search ─────────────────────────────────────────────────────────────────

  onSearchInput(val: string) {
    this.searchTerm = val;
    this.searchChanged.emit(val);
  }

  clearSearch() {
    this.searchTerm = '';
    this.searchChanged.emit('');
  }

  // ── Range helpers ──────────────────────────────────────────────────────────

  getBound(key: RangeKey): Bounds    { return this.bounds[key]; }
  getRangeMin(key: RangeKey): number { return this.ranges[key].min; }
  getRangeMax(key: RangeKey): number { return this.ranges[key].max; }
  isRangeActive(key: RangeKey): boolean { return this.rangeActive[key]; }

  onRangeMin(key: RangeKey, raw: string) {
    const b = this.bounds[key];
    let v = Math.round(Number(raw) || 0);
    v = Math.max(b.min, Math.min(v, this.ranges[key].max));
    this.ranges[key].min = v;
    this.rangeActive[key] = true;
    this.emitRange(key);
  }

  onRangeMax(key: RangeKey, raw: string) {
    const b = this.bounds[key];
    let v = Math.round(Number(raw) || 0);
    v = Math.min(b.max, Math.max(v, this.ranges[key].min));
    this.ranges[key].max = v;
    this.rangeActive[key] = true;
    this.emitRange(key);
  }

  clearRange(key: RangeKey) {
    this.ranges[key] = { ...this.bounds[key] };
    this.rangeActive[key] = false;
    this.rangeChanged.emit({ key, min: null, max: null });
  }

  private emitRange(key: RangeKey) {
    this.rangeChanged.emit({ key, min: this.ranges[key].min, max: this.ranges[key].max });
  }

  /** Slider dual-track background (blue between min and max thumbs) */
  sliderTrackBg(key: RangeKey): string {
    const { min: bMin, max: bMax } = this.bounds[key];
    if (bMax <= bMin) return '#e6e7e9';
    const lo = this.ranges[key].min;
    const hi = this.ranges[key].max;
    const minPct = Math.round(((lo - bMin) / (bMax - bMin)) * 100);
    const maxPct = Math.round(((hi - bMin) / (bMax - bMin)) * 100);
    return `linear-gradient(to right,
      #e6e7e9 0%, #e6e7e9 ${minPct}%,
      #0b5ed7 ${minPct}%, #0b5ed7 ${maxPct}%,
      #e6e7e9 ${maxPct}%, #e6e7e9 100%)`;
  }

  // ── Date range ─────────────────────────────────────────────────────────────

  isDateActive(): boolean { return !!(this.dateFrom || this.dateTo); }

  onDateFrom(v: string) {
    this.dateFrom = v;
    this.dateRangeChanged.emit({ from: this.dateFrom, to: this.dateTo });
  }

  onDateTo(v: string) {
    this.dateTo = v;
    this.dateRangeChanged.emit({ from: this.dateFrom, to: this.dateTo });
  }

  clearDate() {
    this.dateFrom = '';
    this.dateTo   = '';
    this.dateRangeChanged.emit({ from: '', to: '' });
  }

  // ── Sort ───────────────────────────────────────────────────────────────────

  onSortChange(val: string) {
    this.sortValue = val as OrderSortValue;
    this.sortChanged.emit(this.sortValue);
  }

  // ── Clear All ──────────────────────────────────────────────────────────────

  get activeFilterCount(): number {
    return (
      (this.searchTerm ? 1 : 0) +
      (this.rangeActive['amtReceived']  ? 1 : 0) +
      (this.rangeActive['siteExpenses'] ? 1 : 0) +
      (this.rangeActive['balance']      ? 1 : 0) +
      (this.isDateActive()              ? 1 : 0) +
      (this.sortValue                   ? 1 : 0)
    );
  }

  clearAll() {
    this.searchTerm = '';
    this.sortValue  = '';
    this.dateFrom   = '';
    this.dateTo     = '';
    (['amtReceived', 'siteExpenses', 'balance'] as RangeKey[]).forEach(k => {
      this.ranges[k] = { ...this.bounds[k] };
      this.rangeActive[k] = false;
    });
    this.clearAllClicked.emit();
  }

  // ── Panel helpers ──────────────────────────────────────────────────────────

  togglePanel(key: any) {
    this.openPanel = this.openPanel === key ? null : key;
  }

  closePanel() { this.openPanel = null; }

  // ── Mobile drawer ──────────────────────────────────────────────────────────

  openMobileDrawer()  { this.mobileDrawerOpen = true;  this.mobileActiveGroup = null; }
  closeMobileDrawer() { this.mobileDrawerOpen = false; this.mobileActiveGroup = null; }

  mobileGroupLabel(key: string): string {
    const map: Record<string, string> = {
      amtReceived:  'AMT RECEIVED',
      siteExpenses: 'SITE EXPENSES',
      balance:      'BALANCE',
      deliveryDate: 'DELIVERY DATE',
      sort:         'SORT',
    };
    return map[key] ?? key.toUpperCase();
  }
}
