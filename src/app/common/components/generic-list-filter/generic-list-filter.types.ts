// ─────────────────────────────────────────────────────────────────────────────
// generic-list-filter.types.ts
// Drop this in:  src/app/common/components/generic-list-filter/
// ─────────────────────────────────────────────────────────────────────────────

export type FilterType = 'search' | 'multiselect' | 'range' | 'daterange';

export interface FilterFieldConfig {
  /**
   * The property name on each data object this filter reads.
   * For 'search', use the special key 'search' — the component
   * will search across all string fields automatically, OR you can
   * provide searchFields to restrict which fields are searched.
   */
  key: string;

  /** Label shown on the chip button and mobile drawer group row */
  label: string;

  /** What kind of filter UI to render */
  type: FilterType;

  // ── multiselect ──────────────────────────────────────────────────────────
  /**
   * Static list of checkbox options.
   * If omitted, options are derived automatically from the data.
   */
  options?: string[];

  // ── range ────────────────────────────────────────────────────────────────
  /** Symbol shown before number inputs. Default: '' */
  prefix?: string;

  // ── search ───────────────────────────────────────────────────────────────
  /**
   * Which fields to search when type === 'search'.
   * If omitted, all string fields on the object are searched.
   */
  searchFields?: string[];

  /** Placeholder text for the search input */
  placeholder?: string;

  // ── sort ─────────────────────────────────────────────────────────────────
  /** Include this field in the sort dropdown? Default: false */
  sortable?: boolean;

  /**
   * Human-readable label used in the sort dropdown.
   * Falls back to `label` if omitted.
   */
  sortLabel?: string;
}

// ── Sort value type ──────────────────────────────────────────────────────────
export interface SortConfig {
  field: string;
  dir: 'asc' | 'desc';
}
