
// src/app/grid/grid.types.ts
import { ColDef } from 'ag-grid-community';
/** Grouping choices (pipe-delimited when combining) */
export type GroupByChoice = string; // e.g. 'none' or 'country' or 'country|city'


export interface GridColumnUi {
  /** How this cell should render (default is plain text) */
  type?: 'text' | 'link' | 'button';

  /**
   * Label for the link/button.
   * If omitted and type === 'link', the cell's value is used.
   * Can be a string or a function of (row, value) => string.
   */
  text?: string | ((row: any, value: any) => string);

  /**
   * Logical action name emitted by the grid on click (e.g., 'view-detail').
   * The parent decides what to do with it.
   */
  action?: string;

  /** Optional CSS class to apply to the anchor/button element. */
  className?: string;
}

/** Declarative column model consumed by GridComponent */
export type GridColumnDef = ColDef &{
  field: string;
  headerName?: string;
  editable?: boolean; // per-column editing enable/disable
  /** Optional: enable per-column filter (default: false). Use sparingly - global filter is preferred. */
  filterable?: boolean;

 // NEW: rendering hints (optional)
  ui?: GridColumnUi;

}

/** Generic, reusable config for the grid */
export interface GridConfig<Row = any> {
  title?: string;
  columns?: GridColumnDef[];
  rows?: Row[];              // initial/updated rows

  // UX features
  pagination?: boolean;
  pageSize?: number;

  // Capabilities (also control visibility of in-grid action icons)
  enableAdd?: boolean;
  enableEdit?: boolean;      // gates in-cell editing + "Edit" icon
  enableDelete?: boolean;    // gates "Delete" icon
  enableRevert?: boolean;    // gates "Revert" icon (when row is _new/_edited)

  // Columns dropdown
  showColumnsDropdown?: boolean;

  // Grouping
  groupByDefault?: GroupByChoice;
  /** Optional list of groupBy choices to show in the toolbar (excludes 'none') */
  groupByOptions?: GroupByChoice[];

  // Row identity (helps performance and stable editing)
  rowIdKey?: string;
  getRowId?: (row: unknown) => string | number;

  // For delete confirm label / generic UI copy
  labelField?: string;

  /** If provided, called to create a new row when Add is clicked. If omitted, callers may use `createRowDefaults`. */
  createRow?: () => Row;
  /** Optional simple defaults object used when creating a new row if `createRow` isn't supplied. */
  createRowDefaults?: Partial<Row>;

  /** Optional CSV import mapping: target field -> list of possible header names */
  csvImportMap?: Record<string, string[]>;
}

/** A normalized "what changed" object for API calls */
export interface ChangeSet<Row = any> {
  added: Row[];
  updated: Row[];
  deleted: Row[];
  all: Row[]; // latest rows snapshot
}

/** Toolbar feature flags */
export interface GridToolbarConfig {
  globalSearch?: boolean;
  groupBy?: boolean;
  addRow?: boolean;
  columns?: boolean;
  exportAllCsv?: boolean;
  exportVisibleCsv?: boolean;
  importCsv?: boolean;

  /** In-toolbar Save / Reset (parent handles events) */
  save?: boolean;
  reset?: boolean;
}

/** Footer feature flags */
export interface GridFooterConfig {
  show?: boolean;        // show footer bar
  showRange?: boolean;   // "Showing x of y items"
  showCounts?: boolean;  // "Edited:x Deleted:x New:x"
  showGroup?: boolean;   // "Group: <name or None>"
}

/** Features container */
export interface GridFeaturesConfig {
  toolbar?: GridToolbarConfig;
  footer?: GridFooterConfig;
}

/** UI labels */
export interface GridLabels {
  title?: string;
  globalSearchPlaceholder?: string;
  groupBy?: string;
  groupNone?: string;
  addRow?: string;
  columns?: string;
  exportAllCsv?: string;
  exportVisibleCsv?: string;
  importCsv?: string;
  showing?: string;
  items?: string;
  edited?: string;
  deleted?: string;
  created?: string; // "New"
  group?: string;
  save?: string;
  reset?: string;
}
