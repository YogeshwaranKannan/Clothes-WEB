// ─────────────────────────────────────────────────────────────────────────────
// generic-list-filter.component.ts
// Drop this in:  src/app/common/components/generic-list-filter/
// ─────────────────────────────────────────────────────────────────────────────

import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterFieldConfig, FilterType, SortConfig } from './generic-list-filter.types';

// ── Internal state for each filter field ─────────────────────────────────────

interface RangeBounds  { min: number; max: number; }
interface RangeState   { min: number; max: number; active: boolean; }
interface DateState    { from: string; to: string; }
interface MultiState   { selected: Set<string>; options: string[]; }

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-generic-list-filter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './generic-list-filter.component.html',
  styleUrls: ['./generic-list-filter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenericListFilterComponent implements OnChanges {

  private cdr = inject(ChangeDetectorRef);

  // ── Inputs ────────────────────────────────────────────────────────────────

  /** Describes which filters to show and how */
  @Input() config: FilterFieldConfig[] = [];

  /** Full unfiltered data array */
  @Input() items: any[] = [];

  // ── Outputs ───────────────────────────────────────────────────────────────

  /** Emits every time filters or sort change */
  @Output() filteredItems = new EventEmitter<any[]>();

  /** Emits the current sort for parent to use if needed */
  @Output() sortChanged = new EventEmitter<SortConfig | null>();

  // ── Internal state ────────────────────────────────────────────────────────

  openPanel: string | null = null;
  mobileDrawerOpen   = false;
  mobileActiveGroup: string | null = null;

  searchTerm = '';
  sort: SortConfig | null = null;

  // Keyed by FilterFieldConfig.key
  rangeStates: Record<string, RangeState>  = {};
  rangeBounds: Record<string, RangeBounds> = {};
  dateStates:  Record<string, DateState>   = {};
  multiStates: Record<string, MultiState>  = {};

  // ── Derived helpers ───────────────────────────────────────────────────────

  get searchConfig():     FilterFieldConfig | undefined { return this.config.find(c => c.type === 'search'); }
  get rangeConfigs():     FilterFieldConfig[]  { return this.config.filter(c => c.type === 'range'); }
  get dateConfigs():      FilterFieldConfig[]  { return this.config.filter(c => c.type === 'daterange'); }
  get multiConfigs():     FilterFieldConfig[]  { return this.config.filter(c => c.type === 'multiselect'); }
  get chipConfigs():      FilterFieldConfig[]  { return this.config.filter(c => c.type !== 'search'); }
  get sortableConfigs():  FilterFieldConfig[]  { return this.config.filter(c => c.sortable); }

  get activeFilterCount(): number {
    let n = this.searchTerm ? 1 : 0;
    n += this.rangeConfigs.filter(c => this.rangeStates[c.key]?.active).length;
    n += this.dateConfigs.filter(c => { const s = this.dateStates[c.key]; return s?.from || s?.to; }).length;
    n += this.multiConfigs.filter(c => (this.multiStates[c.key]?.selected.size ?? 0) > 0).length;
    n += this.sort ? 1 : 0;
    return n;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges) {
    const configChanged = !!changes['config'];
    const itemsChanged  = !!changes['items'];

    if (configChanged) this.initStateFromConfig();
    if (itemsChanged || configChanged) {
      this.computeBounds();
      this.deriveMultiOptions();
    }
    if (itemsChanged || configChanged) this.applyAndEmit();
  }

  private initStateFromConfig() {
    for (const cfg of this.config) {
      if (cfg.type === 'range' && !this.rangeStates[cfg.key]) {
        this.rangeStates[cfg.key] = { min: 0, max: 0, active: false };
        this.rangeBounds[cfg.key] = { min: 0, max: 0 };
      }
      if (cfg.type === 'daterange' && !this.dateStates[cfg.key]) {
        this.dateStates[cfg.key] = { from: '', to: '' };
      }
      if (cfg.type === 'multiselect' && !this.multiStates[cfg.key]) {
        this.multiStates[cfg.key] = { selected: new Set(), options: cfg.options ?? [] };
      }
    }
  }

  private computeBounds() {
    for (const cfg of this.rangeConfigs) {
      const vals = (this.items || []).map(o => Number(o[cfg.key])).filter(n => isFinite(n));
      const lo = vals.length ? Math.min(...vals) : 0;
      const hi = vals.length ? Math.max(...vals) : 0;
      this.rangeBounds[cfg.key] = { min: lo, max: hi };
      if (!this.rangeStates[cfg.key]?.active) {
        this.rangeStates[cfg.key] = { min: lo, max: hi, active: false };
      }
    }
  }

  private deriveMultiOptions() {
    for (const cfg of this.multiConfigs) {
      if (cfg.options?.length) continue; // static options win
      const unique = [...new Set((this.items || []).map(o => String(o[cfg.key] ?? '')).filter(Boolean))].sort();
      if (!this.multiStates[cfg.key]) {
        this.multiStates[cfg.key] = { selected: new Set(), options: unique };
      } else {
        this.multiStates[cfg.key].options = unique;
      }
    }
  }

  // ── Apply filters and emit ────────────────────────────────────────────────

  applyAndEmit() {
    let result = [...(this.items || [])];

    // Search
    const sc = this.searchConfig;
    if (sc && this.searchTerm.trim()) {
      const q = this.searchTerm.trim().toLowerCase();
      const fields = sc.searchFields ?? null;
      result = result.filter(o => {
        const searchIn = fields
          ? fields.map(f => String(o[f] ?? ''))
          : Object.values(o).filter(v => typeof v === 'string').map(v => String(v));
        return searchIn.some(v => v.toLowerCase().includes(q));
      });
    }

    // Range filters
    for (const cfg of this.rangeConfigs) {
      const s = this.rangeStates[cfg.key];
      if (!s?.active) continue;
      result = result.filter(o => {
        const v = Number(o[cfg.key]);
        return v >= s.min && v <= s.max;
      });
    }

    // Date range filters
    for (const cfg of this.dateConfigs) {
      const s = this.dateStates[cfg.key];
      if (!s) continue;
      if (s.from) result = result.filter(o => String(o[cfg.key] ?? '') >= s.from);
      if (s.to)   result = result.filter(o => String(o[cfg.key] ?? '') <= s.to);
    }

    // Multiselect filters
    for (const cfg of this.multiConfigs) {
      const s = this.multiStates[cfg.key];
      if (!s || s.selected.size === 0) continue;
      result = result.filter(o => s.selected.has(String(o[cfg.key] ?? '')));
    }

    // Sort
    if (this.sort) {
      const { field, dir } = this.sort;
      result = [...result].sort((a, b) => {
        const av = a[field] ?? '';
        const bv = b[field] ?? '';
        const an = Number(av), bn = Number(bv);
        const cmp = (!isNaN(an) && !isNaN(bn)) ? an - bn : String(av).localeCompare(String(bv));
        return dir === 'asc' ? cmp : -cmp;
      });
    }

    this.filteredItems.emit(result);
    this.cdr.markForCheck();
  }

  // ── Search ────────────────────────────────────────────────────────────────

  onSearchInput(val: string) { this.searchTerm = val; this.applyAndEmit(); }
  clearSearch()              { this.searchTerm = '';  this.applyAndEmit(); }

  // ── Range ─────────────────────────────────────────────────────────────────

  onRangeMin(key: string, raw: string) {
    const b = this.rangeBounds[key];
    let v = Math.round(Number(raw) || 0);
    v = Math.max(b.min, Math.min(v, this.rangeStates[key].max));
    this.rangeStates[key] = { ...this.rangeStates[key], min: v, active: true };
    this.applyAndEmit();
  }

  onRangeMax(key: string, raw: string) {
    const b = this.rangeBounds[key];
    let v = Math.round(Number(raw) || 0);
    v = Math.min(b.max, Math.max(v, this.rangeStates[key].min));
    this.rangeStates[key] = { ...this.rangeStates[key], max: v, active: true };
    this.applyAndEmit();
  }

  clearRange(key: string) {
    const b = this.rangeBounds[key];
    this.rangeStates[key] = { min: b.min, max: b.max, active: false };
    this.applyAndEmit();
  }

  isRangeActive(key: string): boolean { return this.rangeStates[key]?.active ?? false; }

  getRangeMin(key: string)   { return this.rangeStates[key]?.min ?? 0; }
  getRangeMax(key: string)   { return this.rangeStates[key]?.max ?? 0; }
  getBound(key: string)      { return this.rangeBounds[key] ?? { min: 0, max: 0 }; }

  sliderTrackBg(key: string): string {
    const { min: bMin, max: bMax } = this.getBound(key);
    if (bMax <= bMin) return '#e6e7e9';
    const lo = this.getRangeMin(key);
    const hi = this.getRangeMax(key);
    const minPct = Math.round(((lo - bMin) / (bMax - bMin)) * 100);
    const maxPct = Math.round(((hi - bMin) / (bMax - bMin)) * 100);
    return `linear-gradient(to right,#e6e7e9 0%,#e6e7e9 ${minPct}%,#0b5ed7 ${minPct}%,#0b5ed7 ${maxPct}%,#e6e7e9 ${maxPct}%,#e6e7e9 100%)`;
  }

  // ── Date range ────────────────────────────────────────────────────────────

  onDateFrom(key: string, val: string) {
    this.dateStates[key] = { ...this.dateStates[key], from: val };
    this.applyAndEmit();
  }
  onDateTo(key: string, val: string) {
    this.dateStates[key] = { ...this.dateStates[key], to: val };
    this.applyAndEmit();
  }
  clearDate(key: string) {
    this.dateStates[key] = { from: '', to: '' };
    this.applyAndEmit();
  }
  isDateActive(key: string): boolean {
    const s = this.dateStates[key];
    return !!(s?.from || s?.to);
  }

  // ── Multiselect ───────────────────────────────────────────────────────────

  getMultiOptions(key: string): string[]     { return this.multiStates[key]?.options ?? []; }
  isMultiSelected(key: string, val: string): boolean { return this.multiStates[key]?.selected.has(val) ?? false; }
  isMultiActive(key: string): boolean        { return (this.multiStates[key]?.selected.size ?? 0) > 0; }

  toggleMulti(key: string, val: string) {
    const s = this.multiStates[key];
    if (!s) return;
    const next = new Set(s.selected);
    next.has(val) ? next.delete(val) : next.add(val);
    this.multiStates[key] = { ...s, selected: next };
    this.applyAndEmit();
  }

  clearMulti(key: string) {
    const s = this.multiStates[key];
    if (!s) return;
    this.multiStates[key] = { ...s, selected: new Set() };
    this.applyAndEmit();
  }

  // ── Sort ──────────────────────────────────────────────────────────────────

  onSortChange(val: string) {
    if (!val) {
      this.sort = null;
    } else {
      const [field, dir] = val.split('-') as [string, 'asc' | 'desc'];
      this.sort = { field, dir };
    }
    this.sortChanged.emit(this.sort);
    this.applyAndEmit();
  }

  getSortValue(): string {
    return this.sort ? `${this.sort.field}-${this.sort.dir}` : '';
  }

  getSortOptions(): { value: string; label: string }[] {
    const opts: { value: string; label: string }[] = [{ value: '', label: 'Default' }];
    for (const cfg of this.sortableConfigs) {
      const lbl = cfg.sortLabel ?? cfg.label;
      opts.push({ value: `${cfg.key}-asc`,  label: `${lbl}: A → Z` });
      opts.push({ value: `${cfg.key}-desc`, label: `${lbl}: Z → A` });
    }
    return opts;
  }

  // ── Clear All ─────────────────────────────────────────────────────────────

  clearAll() {
    this.searchTerm = '';
    this.sort = null;
    for (const k of Object.keys(this.rangeStates)) {
      const b = this.rangeBounds[k];
      this.rangeStates[k] = { min: b.min, max: b.max, active: false };
    }
    for (const k of Object.keys(this.dateStates))  this.dateStates[k]  = { from: '', to: '' };
    for (const k of Object.keys(this.multiStates)) this.multiStates[k] = { ...this.multiStates[k], selected: new Set() };
    this.sortChanged.emit(null);
    this.applyAndEmit();
  }

  // ── Panel / drawer helpers ────────────────────────────────────────────────

  togglePanel(key: string)  { this.openPanel = this.openPanel === key ? null : key; }
  closePanel()              { this.openPanel = null; }
  openMobileDrawer()        { this.mobileDrawerOpen = true;  this.mobileActiveGroup = null; }
  closeMobileDrawer()       { this.mobileDrawerOpen = false; this.mobileActiveGroup = null; }

  isChipActive(cfg: FilterFieldConfig): boolean {
    if (cfg.type === 'range')       return this.isRangeActive(cfg.key);
    if (cfg.type === 'daterange')   return this.isDateActive(cfg.key);
    if (cfg.type === 'multiselect') return this.isMultiActive(cfg.key);
    return false;
  }

  /** Clear whichever filter type this chip represents */
  clearChip(cfg: FilterFieldConfig) {
    if (cfg.type === 'range')       this.clearRange(cfg.key);
    if (cfg.type === 'daterange')   this.clearDate(cfg.key);
    if (cfg.type === 'multiselect') this.clearMulti(cfg.key);
  }

  /** Human-readable label for the mobile drawer title */
  getLabelForKey(key: string): string {
    const cfg = this.config.find(c => c.key === key);
    return cfg ? cfg.label : key.toUpperCase();
  }
}
