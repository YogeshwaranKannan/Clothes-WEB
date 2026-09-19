import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, Subscription } from 'rxjs';
import { Product } from '../../models/product.model';
import { Category } from '../../models/category.model';   // add import

type SortOption = 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | '';

// Category shape used by templates: may include children and either `name` or `category` keys
type CategoryOption = {
  id: string;
  name?: string;
  category?: string;
  count?: number;
  children?: Array<{
    id: string;
    name?: string;
    category?: string;
    count?: number;
  }>;
};

@Component({
  selector: 'app-user-filters',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-filters.component.html',
  styleUrls: ['./user-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFiltersComponent implements OnInit {
  // ── REPLACE this line: ────────────────────────────────────────────────────
  // @Input() availableCategoriesWithCount$?: Observable<CategoryOption[]>;
  // ── WITH: ─────────────────────────────────────────────────────────────────
  @Input() categories: Category[] = [];

  // Options streams
  @Input() availableBrandsWithCount$?: Observable<Array<{ value: string; count: number }>>;
  @Input() availableCategoriesWithCount$?: Observable<CategoryOption[]>;
  @Input() availableSizesWithCount$?: Observable<Array<{ value: string; count: number }>>;
  @Input() availableGendersWithCount$?: Observable<Array<{ value: string; count: number }>>;

  @Input() priceBounds$?: Observable<{ min: number; max: number }>;
  @Input() priceTicks$?: Observable<number[]>;

  // Selected state streams (BehaviorSubjects from parent)
  @Input() selectedBrands$?: Observable<string[]>;
  @Input() selectedCategoryIds$?: Observable<string[]>;
  @Input() selectedSizes$?: Observable<string[]>;
  @Input() selectedGenders$?: Observable<string[]>;
  @Input() selectedDiscountTiers$?: Observable<number[]>;

  @Input() priceMin$?: Observable<number | null>;
  @Input() priceMax$?: Observable<number | null>;

  @Input() searchTerm$?: Observable<string>;
  @Input() sort$?: Observable<SortOption>;

  @Input() placeholder$?: Observable<string>;

  // For mobile drawer results count
  @Input() filteredProducts$?: Observable<Product[]>;

  // Outputs (intents)
  @Output() brandToggled = new EventEmitter<string>();
  @Output() categoryToggled = new EventEmitter<string>();
  @Output() sizeToggled = new EventEmitter<string>();
  @Output() genderToggled = new EventEmitter<string>();
  @Output() discountTierToggled = new EventEmitter<number>();
  @Output() minPriceChanged = new EventEmitter<number | null>();
  @Output() maxPriceChanged = new EventEmitter<number | null>();
  @Output() searchChanged = new EventEmitter<string>();
  @Output() sortChanged = new EventEmitter<SortOption>();
  @Output() clearFiltersClicked = new EventEmitter<void>();
  @Output() clearOnlyClicked = new EventEmitter<'brand'|'category'|'size'|'gender'|'discount'|'price'>();

  // Local UI state
  mobileDrawerOpen = false;
  mobileActiveGroup: 'price'|'discount'|'brand'|'category'|'size'|'gender'|null = null;
  /** Panels opened in desktop sidebar; supports multiple panels open */
  expandedPanels = new Set<string>();

  // Accordion: which parent category is expanded in the desktop sidebar
  activeCategoryId: string | null = null;

  tempMinPrice: number | null = null;
  tempMaxPrice: number | null = null;
  lastPriceBounds: { min: number; max: number } = { min: 0, max: 0 };
  activeThumb: 'min' | 'max' | null = null;

  // store latest applied values (from parent BehaviorSubjects via Inputs)
  private _appliedMin: number | null = null;
  private _appliedMax: number | null = null;
  private _priceBoundsSub?: Subscription;

  private subs: Subscription[] = [];
 expandedCategoryIds = new Set<string>();
 selectedCategoryIdsSnapshot: string[] = [];

  // Expand/collapse all panels helper
  
  /*expandAllFilters() {
    const keys = ['price','discount','brand','category','size','gender'];
    keys.forEach(k => this.expandedPanels.add(k));
    this.expandedPanels = new Set(this.expandedPanels);
  }*/
  collapseAllFilters() {
    this.expandedPanels.clear();
    this.expandedPanels = new Set(this.expandedPanels);
  }

  isPanelOpen(key: string): boolean { return this.expandedPanels.has(key); }

  ngOnInit(): void {

   // Auto-expand ALL top-level parent categories on load
  // (runs after @Input() categories is set because ngOnInit fires after first ngOnChanges)
  if (this.categories?.length) {this.categories.forEach(cat => this.expandedCategoryIds.add(cat.id));}

    if (this.priceBounds$) {
      this._priceBoundsSub = this.priceBounds$.subscribe(b => {
        this.lastPriceBounds = b;
        if (this.tempMinPrice == null) this.tempMinPrice = b.min;
        if (this.tempMaxPrice == null) this.tempMaxPrice = b.max;
      });
      this.subs.push(this._priceBoundsSub);
    }

    // subscribe to applied min/max so we can seed temps when opening the panel
    if (this.priceMin$) {
      const s2 = this.priceMin$.subscribe(v => this._appliedMin = v ?? null);
      this.subs.push(s2);
    }
    if (this.priceMax$) {
      const s3 = this.priceMax$.subscribe(v => this._appliedMax = v ?? null);
      this.subs.push(s3);
    }

    if (this.selectedCategoryIds$) {
    const s = this.selectedCategoryIds$.subscribe(ids => {
      this.selectedCategoryIdsSnapshot = ids ?? [];
    });
    this.subs.push(s);
  }
  }

  // UI helpers and local handlers
  togglePanel(key: any) {
    const willOpen = !this.expandedPanels.has(key);
    if (willOpen) this.expandedPanels.add(key); else this.expandedPanels.delete(key);
    this.expandedPanels = new Set(this.expandedPanels);

    // initialize temp slider values when opening price panel
    if (willOpen && key === 'price') {
      const appliedMin = this._appliedMin;
      const appliedMax = this._appliedMax;
      const { min, max } = this.lastPriceBounds ?? { min: 0, max: 0 };
      this.tempMinPrice = appliedMin != null ? appliedMin : min;
      this.tempMaxPrice = appliedMax != null ? appliedMax : max;
      if (this.tempMinPrice < min) this.tempMinPrice = min;
      if (this.tempMaxPrice > max) this.tempMaxPrice = max;
      if ((this.tempMaxPrice - this.tempMinPrice) < 1) this.tempMaxPrice = Math.max((this.tempMinPrice ?? min) + 1, max);
    }
  }

  closePanel(key?: string) { if (key) { this.expandedPanels.delete(key); this.expandedPanels = new Set(this.expandedPanels); } else { this.collapseAllFilters(); } }

  onMinInputChange(v: string) {
    const n = Number(v.replace(/[^0-9.-]/g, '')) || 0;
    const min = this.lastPriceBounds.min;
    const max = this.lastPriceBounds.max;
    let newMin = Math.round(n);
    if (newMin < min) newMin = min;
    if (newMin > max) newMin = max;
    if (this.tempMaxPrice != null && newMin > this.tempMaxPrice) newMin = this.tempMaxPrice;
    this.tempMinPrice = newMin;
    try { this.minPriceChanged.emit(this.tempMinPrice); } catch {}
  }
  onMaxInputChange(v: string) {
    const n = Number(v.replace(/[^0-9.-]/g, '')) || 0;
    const min = this.lastPriceBounds.min;
    const max = this.lastPriceBounds.max;
    let newMax = Math.round(n);
    if (newMax < min) newMax = min;
    if (newMax > max) newMax = max;
    if (this.tempMinPrice != null && newMax < this.tempMinPrice) newMax = this.tempMinPrice;
    this.tempMaxPrice = newMax;
    try { this.maxPriceChanged.emit(this.tempMaxPrice); } catch {}
  }

  onMinSliderInput(v: string) {
    const n = Number(v) || 0;
    const min = this.lastPriceBounds.min;
    const max = this.lastPriceBounds.max;
    let newMin = Math.round(n);
    if (newMin < min) newMin = min;
    if (newMin > max) newMin = max;
    if (this.tempMaxPrice != null && newMin > this.tempMaxPrice) {
      newMin = this.tempMaxPrice;
    }
    this.tempMinPrice = newMin;
    try { this.minPriceChanged.emit(this.tempMinPrice); } catch {}
  }

  onMaxSliderInput(v: string) {
    const n = Number(v) || 0;
    const min = this.lastPriceBounds.min;
    const max = this.lastPriceBounds.max;
    let newMax = Math.round(n);
    if (newMax < min) newMax = min;
    if (newMax > max) newMax = max;
    if (this.tempMinPrice != null && newMax < this.tempMinPrice) {
      newMax = this.tempMinPrice;
    }
    this.tempMaxPrice = newMax;
    try { this.maxPriceChanged.emit(this.tempMaxPrice); } catch {}
  }

  applyPriceRange() {
    // filtering is live; Apply only closes the panel
    this.closePanel();
  }

  clearPriceRange() {
    this.tempMinPrice = this.lastPriceBounds.min;
    this.tempMaxPrice = this.lastPriceBounds.max;
    this.minPriceChanged.emit(null);
    this.maxPriceChanged.emit(null);
    this.closePanel();
  }

  // compute track background for dual-range visual (blue active segment)
  sliderTrackBackground(): string {
    const min = this.lastPriceBounds.min;
    const max = this.lastPriceBounds.max;
    if (max <= min) return '#e6e7e9';
    const lo = this.tempMinPrice ?? min;
    const hi = this.tempMaxPrice ?? max;
    const minPct = Math.round(((lo - min) / (max - min)) * 100);
    const maxPct = Math.round(((hi - min) / (max - min)) * 100);
    return `linear-gradient(to right, #e6e7e9 0%, #e6e7e9 ${minPct}%, #0b5ed7 ${minPct}%, #0b5ed7 ${maxPct}%, #e6e7e9 ${maxPct}%, #e6e7e9 100%)`;
  }

  // Mobile drawer
  openMobileDrawer() { this.mobileDrawerOpen = true; this.mobileActiveGroup = null; }
  closeMobileDrawer() { this.mobileDrawerOpen = false; this.mobileActiveGroup = null; }
  openMobileGroup(key: 'price'|'discount'|'brand'|'category'|'size'|'gender') { this.mobileActiveGroup = key; }
  closeMobileGroup() { this.mobileActiveGroup = null; }

  // slider thumb pointer handlers to mirror original ProductList behavior
  onThumbPointerDown(which: 'min' | 'max') {
    this.activeThumb = which;
  }

  onThumbPointerUp() {
    this.activeThumb = null;
  }

  // cleanup
  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  // Toggle expansion for parent categories (accordion behaviour)
  toggleCategoryExpand(catId: string) {
    this.activeCategoryId = this.activeCategoryId === catId ? null : catId;

    if (this.expandedCategoryIds.has(catId)) {
    this.expandedCategoryIds.delete(catId);
  } else {
    this.expandedCategoryIds.add(catId);
  }
   this.expandedCategoryIds = new Set(this.expandedCategoryIds);
  }
}
