
import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef, GridApi, GridOptions, ColumnApi, ICellRendererParams,
  CellDoubleClickedEvent, CellValueChangedEvent
} from 'ag-grid-community';
import {
  ChangeSet, GridConfig, GridColumnDef, GroupByChoice,
  GridFeaturesConfig, GridLabels
} from './grid.types';

/** Internal base row type (demo fields) */
type BaseRow = {
  /** free-form payload: specific fields are provided by parent via GridConfig.columns */
  [key: string]: any;

  /** state flags */
  _edited?: boolean;
  _new?: boolean;

  /** original snapshot for revert */
  _original?: Partial<Record<string, any>>;
};

/** Display row type (adds group header/footer) */
type DisplayRow = Partial<BaseRow> & {
  __isGroupHeader?: boolean;
  __isGroupFooter?: boolean;
  __groupKey?: string;
  __groupLevel?: number;
  __path?: string;
  __childCount?: number;
  __totalStock?: number;
  __avgPrice?: number;
};

const DEFAULT_FEATURES: Required<GridFeaturesConfig> = {
  toolbar: {
    globalSearch: true,
    groupBy: true,
    addRow: true,
    columns: true,
    exportAllCsv: true,
    exportVisibleCsv: true,
    importCsv: true,
    save: false,
    reset: false,
  },
  footer: {
    show: true,
    showRange: true,
    showCounts: true,
    showGroup: true,
  },
};

const DEFAULT_LABELS: Required<GridLabels> = {
  title: 'Product Grid',
  globalSearchPlaceholder: 'Global search…',
  groupBy: 'Group by:',
  groupNone: 'None',
  addRow: '+ Add Row',
  columns: 'Columns',
  exportAllCsv: 'Export',
  exportVisibleCsv: 'Export Visible',
  importCsv: 'Import',
  showing: 'Showing',
  items: 'items',
  edited: 'Edited',
  deleted: 'Deleted',
  created: 'New',
  group: 'Group',
  save: 'Save',
  reset: 'Reset',
};

@Component({
  selector: 'app-grid',
  standalone: true,
  imports: [CommonModule, AgGridAngular],
  templateUrl: './grid.component.html',
  styleUrls: ['./grid.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridComponent implements OnDestroy {


// Emits a generic cell action event (domain-agnostic)
@Output() cellAction = new EventEmitter<{
  action: string;
  row: any;
  col: GridColumnDef;
  value: any;
  rowIndex: number;
}>();

  /** Features (partial allowed) */
  @Input() features: GridFeaturesConfig = DEFAULT_FEATURES;
  @Output() viewDetail = new EventEmitter<any>();


onClickViewDetail(row: any) {
    this.viewDetail.emit(row);
  }


  /** Labels (partial allowed) */
  @Input() labels: GridLabels = DEFAULT_LABELS;

  // Effective features/labels after merging with defaults
  get effectiveFeatures(): Required<GridFeaturesConfig> {
    return {
      toolbar: { ...DEFAULT_FEATURES.toolbar, ...(this.features?.toolbar ?? {}) },
      footer:  { ...DEFAULT_FEATURES.footer,  ...(this.features?.footer ?? {}) },
    };
  }
  get effectiveLabels(): Required<GridLabels> {
    return { ...DEFAULT_LABELS, ...(this.labels ?? {}) };
  }

  // Footer parts (bound individually in template)
  totalRows = 0;
  displayedRows = 0;
  groupText = 'None';
  editedCount = 0;
  deletedCount = 0;
  addedCount = 0;

  // Parent outputs
  @Output() importCsvRequested = new EventEmitter<File>();
  @Output() exportAllRequested = new EventEmitter<void>();
  @Output() exportVisibleRequested = new EventEmitter<void>();
  @Output() addRowRequested = new EventEmitter<void>();

  /** Toolbar Save/Reset (signal-only; parent pulls payload via ViewChild) */
  @Output() saveRequested  = new EventEmitter<void>();
  @Output() resetRequested = new EventEmitter<void>();

  private _config: GridConfig<any> | null = null;
  private lastConfig: GridConfig<any> | null = null;

  /** Primary config (rows, columns, capabilities) */
  @Input()
  set config(value: GridConfig<any> | null) {
    this._config = value;
    this.lastConfig = value;
    if (this.gridApi) {
      this.applyConfig(this._config);
      // Ensure column toggle list is refreshed when parent updates config after gridReady
      this.buildColumnToggleList();
      this.syncColumnToggleList();
      this.rebuildDisplayRows();
      this.updateFooterInfo();
      this.emitChanges();
      this.isColumnsPanelOpen = false;
    }
  }
  get config() { return this._config; }

  // Row-level events
  @Output() rowEdited = new EventEmitter<any>();
  @Output() rowDeleted = new EventEmitter<any>();
  @Output() rowAdded = new EventEmitter<any>();
  @Output() rowReverted = new EventEmitter<any>();
  @Output() changeSet = new EventEmitter<ChangeSet<any>>();
  @Output() pageChanged = new EventEmitter<{ page: number; pageSize: number }>();

  // Runtime
  private gridApi!: GridApi;
  private columnApi!: ColumnApi;

  title = 'Grid';
  quickFilterText = '';

  // Grouping state
  groupBy: GroupByChoice = 'none';
  expandedPaths = new Set<string>();

  // Columns dropdown
  showColumnsDropdownFeature = true;
  isColumnsPanelOpen = false;
  columnToggleList: { field: string; headerName: string; visible: boolean; lockVisible?: boolean }[] = [];

  get columnNames(): string {
    return (this.columnToggleList ?? []).map(c => c.headerName).join(', ');
  }

  // Footer full string (for screen readers)
  footerInfo = '';

  // Data
  baseRows: BaseRow[] = [];
  rowData: DisplayRow[] = [];
  private deletedRows: BaseRow[] = [];

  // Config-driven booleans
  private allowCellEdit = true;
  private allowActionEdit = true;
  private allowActionDelete = true;
  private allowActionRevert = true;

  gridOptions: GridOptions = {
    rowModelType: 'clientSide',
    suppressDragLeaveHidesColumns: true,
    animateRows: true,
    singleClickEdit: false,
    stopEditingWhenCellsLoseFocus: true,

    // No special selection needed (we removed toolbar Edit/Delete)
    rowSelection: undefined,
    suppressRowClickSelection: true,

    getRowClass: (params) => {
      const d = params.data as DisplayRow;
      const classes: string[] = [];
      if (d?.__isGroupHeader) classes.push('group-header-row');
      else if (d?.__isGroupFooter) classes.push('group-footer-row');
      else classes.push('fade-in-row');
      const pr = params.data as BaseRow;
      if (pr?._edited) classes.push('edited-row');
      if (pr?._new) classes.push('new-row');
      return classes.join(' ');
    },
    onColumnVisible: () => { this.syncColumnToggleList(); this.updateFooterInfo(); },
    onDisplayedColumnsChanged: () => { this.syncColumnToggleList(); this.updateFooterInfo(); },
    onColumnResized: () => this.syncColumnToggleList(),
    onFilterChanged: () => this.updateFooterInfo(),
    onSortChanged: () => this.updateFooterInfo(),
    onFirstDataRendered: () => this.updateFooterInfo(),
    onCellDoubleClicked: (e: CellDoubleClickedEvent) => {
      const d = e.data as DisplayRow;
      if (d?.__isGroupHeader || d?.__isGroupFooter) return;
      if (!this.allowCellEdit) return;
      e.api.startEditingCell({ rowIndex: e.rowIndex!, colKey: e.column.getColId() });
    },
    onCellValueChanged: (e: CellValueChangedEvent) => {
      const d = e.data as BaseRow;
      if (!d) return;
      d._edited = true;
      e.api.refreshCells({ force: true });
      this.editedCount = this.baseRows.filter(r => r._edited).length;
      this.rebuildDisplayRows();
      this.updateFooterInfo();
      this.rowEdited.emit(d);
      this.emitChanges();
    }
  };

  defaultColDef: ColDef = {
    sortable: true,
    // Disable per-column filters by default. Use columnDefs to opt-in via `filterable`.
    filter: false,
    floatingFilter: false,
    resizable: true,
    editable: (params: any) => {
      if (!this.allowCellEdit) return false;
      const d = params.data as DisplayRow;
      return !(d?.__isGroupHeader || d?.__isGroupFooter);
    }
  };

  // Start empty; `applyConfig` will populate from parent-provided `config.columns`.
  columnDefs: ColDef[] = [];

  // ---- Lifecycle
  onGridReady(params: any) {
    this.gridApi = params.api;
    this.columnApi = params.columnApi;

    // Apply config
    this.applyConfig(this.lastConfig ?? this._config);

    // Build columns panel list
    this.buildColumnToggleList();
    this.isColumnsPanelOpen = false;

    // Initial rows
    this.rebuildDisplayRows();
    this.updateFooterInfo();
    this.emitChanges();

    // Outside click closer
    this.installOutsideClickCloser();
  }

  ngOnDestroy(): void {
    if (this.boundOutsideHandler) {
      document.removeEventListener('click', this.boundOutsideHandler as any);
    }
  }

  // ---- Public helpers
  /** Parent (via @ViewChild) uses this inside its save handler */
  public getPendingChanges(): ChangeSet<any> {
    const added = this.baseRows.filter(r => r._new);
    const updated = this.baseRows.filter(r => r._edited && !r._new);
    const deleted = [...this.deletedRows];
    return { added, updated, deleted, all: [...this.baseRows] };
  }

  /** Optionally called by parent after successful API save */
  public clearChanges() {
    this.deletedRows = [];
    this.baseRows = this.baseRows.map(r => ({
      ...r,
      _new: false,
      _edited: false,
      _original: { ...r }
    }));
    this.editedCount = 0;
    this.addedCount = 0;
    this.deletedCount = 0;
    this.rebuildDisplayRows();
    this.updateFooterInfo();
    this.emitChanges();
  }

  /** Replace all rows (e.g., after reset or import) */
  public setRows(rows: any[]) {
    // Preserve incoming row object structure so arbitrary grids (orders, products, etc.)
    // can render their own fields. Keep an _original snapshot for revert purposes.
    const mapped: BaseRow[] = (rows ?? []).map((r: any) => ({
      ...r,
      _original: { ...r }
    }));
    this.baseRows = mapped as BaseRow[];
    this.rebuildDisplayRows();
    this.updateFooterInfo();
  }

  public setGroupBy(groupBy: GroupByChoice) { this.onChangeGroupBy(groupBy); }
  public clearAllFilters() { this.gridApi?.setFilterModel(null); }

  // Expose grid APIs for parents that need programmatic control (pagination, column API, raw api)
  public getGridApi() { return this.gridApi; }
  public getColumnApi() { return this.columnApi; }
  public paginationGoToPage(page: number) { try { this.gridApi?.paginationGoToPage(page); } catch {} }
  public paginationSetPageSize(size: number) { try { this.gridApi?.paginationSetPageSize(size); } catch {} }

  // ---- Apply config from parent
  private applyConfig(cfg: GridConfig<any> | null) {
  try {
    console.log('[Grid] columnDefs:', this.columnDefs);
    const price = this.columnDefs.find(c => c.field === 'price');
    console.log('[Grid] price colDef:', price);
  } catch {}

    const c = cfg ?? {};
    this.title = c.title ?? 'Grid';

    // Row identity
    if (c.getRowId) {
      this.gridOptions.getRowId = (p) => String(c.getRowId!(p.data));
    } else if (c.rowIdKey) {
      const key = c.rowIdKey;
      this.gridOptions.getRowId = (p) => String(p.data?.[key]);
    } else {
      this.gridOptions.getRowId = undefined;
    }

    // Action flags & cell edit
    this.allowCellEdit     = c.enableEdit   ?? true;
    this.allowActionEdit   = c.enableEdit   ?? true;
    this.allowActionDelete = c.enableDelete ?? true;
    this.allowActionRevert = c.enableRevert ?? true;

    // Columns
    if (c.columns?.length) {
      const mapped = this.mapColumns(c.columns);
      const wantActions = (this.allowActionEdit || this.allowActionDelete || this.allowActionRevert);
      // keep first column locked visible for usability (backwards-compatible)
      if (mapped.length) mapped[0].lockVisible = true;
      this.columnDefs = wantActions ? [...mapped, this.actionsColDef()] : mapped;
    }

    // Rows
    if (Array.isArray(c.rows)) {
      this.setRows(c.rows as any[]);
      this.deletedRows = [];
      this.addedCount = this.baseRows.filter(r => r._new).length;
      this.editedCount = this.baseRows.filter(r => r._edited).length;
      this.deletedCount = 0;
    }

    // Grouping & features
    this.groupBy = c.groupByDefault ?? 'none';
    this.showColumnsDropdownFeature = c.showColumnsDropdown ?? true;
    // If parent didn't supply explicit groupByOptions, compute sensible defaults
    // from column fields (single-field and two-field combos up to two columns).
    const cols = (c.columns ?? []) as GridColumnDef[];
    if (!c.groupByOptions && Array.isArray(cols) && cols.length) {
      const fields = cols.map(x => x.field).filter(Boolean).slice(0, 3);
      const opts: string[] = ['none'];
      for (const f of fields) opts.push(f);
      if (fields.length >= 2) opts.push(`${fields[0]}|${fields[1]}`);
      // attach to cfg for template consumption (non-destructive to original config object)
      (c as any).groupByOptions = opts.filter(o => o !== 'none');
    }

    // Ensure panel closed after re-config
    this.isColumnsPanelOpen = false;
  }

 private mapColumns(cols: GridColumnDef[]): ColDef[] {
  return cols.map((c) => {
    const col: ColDef = {
      // ✅ bring everything from parent first (includes field/headerName/filter/valueGetter/etc.)
      ...c,

      // ✅ ensure required basics exist (only if not provided)
      headerName: c.headerName ?? c.field,

      // ✅ if parent didn't provide filter explicitly, apply your filterable logic
      filter: c.filter ?? (c.filterable ? 'agTextColumnFilter' : false),
      floatingFilter: c.floatingFilter ?? !!c.filterable,

      // ✅ enforce your non-edit rule regardless of what parent passes
      editable: (params: any) => {
        if (!this.allowCellEdit) return false;
        const d = params.data as DisplayRow;
        return !(d?.__isGroupHeader || d?.__isGroupFooter);
      }
    };

    // If the parent marked this column as a link or button, attach the renderer
    if (c.ui?.type === 'link') {
      col.cellRenderer = (p: ICellRendererParams) => this.renderUiLink(c, p);
      col.editable = false;
    } else if (c.ui?.type === 'button') {
      col.cellRenderer = (p: ICellRendererParams) => this.renderUiButton(c, p);
      col.editable = false;
      col.sortable = false;
      col.filter = false;
    }

    // Special "View Detail" column
    if (c.field === '__viewDetail') {
      col.cellRenderer = (params: ICellRendererParams) => this.renderViewDetail(params);
      col.sortable = false;
      col.filter = false;
      col.editable = false;
      col.minWidth = 140;
    }

    return col;
  });
}


private renderViewDetail(params: ICellRendererParams) {
  const d = params.data as DisplayRow;
  if (d?.__isGroupHeader || d?.__isGroupFooter) {
    return document.createTextNode(''); // nothing for group header/footer rows
  }

  const row = params.data; // the raw row object
  const link = document.createElement('a');
  link.href = '#';
  link.textContent = 'View Detail';
  link.addEventListener('click', (ev) => {
    ev.preventDefault();
    this.onClickViewDetail(row); // emits (viewDetail) to parent
  });

  // Optional styling hook (matches your theme)
  link.className = 'view-detail-link';
  return link;
}

  private actionsColDef(): ColDef {
    return {
      headerName: 'Actions',
      field: 'actions',
      minWidth: 220,
      cellRenderer: (params: ICellRendererParams) => this.renderActions(params),
      suppressHeaderMenuButton: true,
      filter: false,
      sortable: false
    };
  }

  // ---- Actions cell renderer (icons configurable by GridConfig)
  private renderActions(params: ICellRendererParams) {
    const d = params.data as DisplayRow;
    if (d?.__isGroupHeader || d?.__isGroupFooter) {
      return document.createTextNode('');
    }
    const row = params.data as BaseRow;
    const container = document.createElement('div');
    container.className = 'actions-cell';

    // Label for confirm/UX
    // use api.getAllDisplayedColumns() (columnApi.getAllDisplayedColumns deprecated since v31)
    const firstCol = params.api.getAllDisplayedColumns().find((c: any) => c.getColId() !== 'actions');
    const labelKey = this._config?.labelField ?? firstCol?.getColId();
    const label = (labelKey && (row as any)[labelKey]) ? (row as any)[labelKey] : 'item';

    // EDIT icon (only if enabled)
    if (this.allowActionEdit) {
      const editBtn = document.createElement('button');
      editBtn.className = 'icon-btn edit-btn';
      editBtn.title = 'Edit';
      editBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path fill="currentColor"
            d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm18-11.5c0-.39-.15-.77-.44-1.06l-2.25-2.25a1.5 1.5 0 0 0-2.12 0l-1.83 1.83 3.75 3.75 1.83-1.83c.29-.29.44-.67.44-1.06z"/>
        </svg>`;
      editBtn.addEventListener('click', () => {
        if (!this.allowCellEdit) return;
        const first = params.api.getAllDisplayedColumns().find((c: any) => c.getColId() !== 'actions');
        if (first) {
          params.api.startEditingCell({ rowIndex: params.rowIndex!, colKey: first.getColId() });
        }
      });
      container.appendChild(editBtn);
    }

    // DELETE icon (only if enabled)
    if (this.allowActionDelete) {
      const delBtn = document.createElement('button');
      delBtn.className = 'icon-btn delete-btn';
      delBtn.title = 'Delete';
      delBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path fill="currentColor" d="M6 7h12v2H6V7zm2 4h8l-1 9H9l-1-9zm4-9c1.1 0 2 .9 2 2h-4a2 2 0 0 1 2-2z"/>
        </svg>`;
      delBtn.addEventListener('click', () => this.onDeleteRow(params, label));
      container.appendChild(delBtn);
    }

    // REVERT icon (only if enabled and row is new/edited)
    if (this.allowActionRevert && (row._edited || row._new)) {
      const revertBtn = document.createElement('button');
      revertBtn.className = 'icon-btn revert-btn';
      revertBtn.title = 'Revert';
      revertBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path fill="currentColor"
            d="M12 5V2L8 6l4 4V7c3.31 0 6 2.69 6 6 0 1.15-.33 2.23-.9 3.15l1.46 1.46C19.29 16.42 20 14.8 20 13c0-4.42-3.58-8-8-8zm-6.56.44L3.99 6.89C3.37 7.9 3 9.11 3 10.39c0 4.41 3.58 8 8 8v3l4-4-4-4v3c-3.31 0-6-2.69-6-6 0-1.03.26-2 .72-2.85z"/>
        </svg>`;
      revertBtn.addEventListener('click', () => this.onRevertRow(row));
      container.appendChild(revertBtn);
    }

    return container;
  }


private isLeafDisplayRow(data: any) {
  return !(data?.__isGroupHeader || data?.__isGroupFooter);
}

private renderUiLink(colDef: GridColumnDef, params: ICellRendererParams) {
  if (!this.isLeafDisplayRow(params.data)) return document.createTextNode('');
  const value = params.value ?? (params.data ? params.data[colDef.field] : null);

  const label = typeof colDef.ui?.text === 'function'
    ? colDef.ui.text(params.data, value)
    : (colDef.ui?.text ?? (value != null ? String(value) : ''));

  const a = document.createElement('a');
  a.href = '#';
  a.textContent = label;
  a.className = colDef.ui?.className ?? 'grid-link';
  a.addEventListener('click', (ev) => {
    ev.preventDefault();
    this.cellAction.emit({
      action: colDef.ui?.action ?? 'cell-link-click',
      row: params.data,
      col: colDef,
      value,
      rowIndex: params.rowIndex!,
    });
  });
  return a;
}

private renderUiButton(colDef: GridColumnDef, params: ICellRendererParams) {
  if (!this.isLeafDisplayRow(params.data)) return document.createTextNode('');
  const value = params.value ?? (params.data ? params.data[colDef.field] : null);

  const label = typeof colDef.ui?.text === 'function'
    ? colDef.ui.text(params.data, value)
    : (colDef.ui?.text ?? 'Action');

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = label;
  btn.className = colDef.ui?.className ?? 'btn btn-secondary';
  btn.addEventListener('click', () => {
    this.cellAction.emit({
      action: colDef.ui?.action ?? 'cell-button-click',
      row: params.data,
      col: colDef,
      value,
      rowIndex: params.rowIndex!,
    });
  });
  return btn;
}


  // ---- Toolbar handlers
  onGlobalSearch(value: string) {
    this.quickFilterText = value;
    this.gridApi?.setQuickFilter(value);
    setTimeout(() => this.updateFooterInfo(), 0);
  }

  /** Compute groupBy options: prefer config.groupByOptions, else infer from columns. */
  computeGroupByOptions(): string[] {
    const cfg = this._config as any;
    if (Array.isArray(cfg?.groupByOptions) && cfg.groupByOptions.length) return cfg.groupByOptions;
    const cols = (cfg?.columns ?? []) as GridColumnDef[];
    if (!Array.isArray(cols) || !cols.length) return [];
    const fields = cols.map(c => c.field).filter(Boolean);
    const opts: string[] = [];
    for (const f of fields) opts.push(f);
    if (fields.length >= 2) opts.push(`${fields[0]}|${fields[1]}`);
    return opts;
  }

  onChangeGroupBy(raw: string | GroupByChoice) {
    const value: GroupByChoice = String(raw) || 'none';
    this.groupBy = value;
    this.expandedPaths.clear();
    if (this.groupBy !== 'none') this.expandAll();
    this.rebuildDisplayRows();
    this.updateFooterInfo();
  }

  onToggleGroupPath(path: string) {
    if (this.groupBy === 'none') return;
    if (this.expandedPaths.has(path)) this.expandedPaths.delete(path);
    else this.expandedPaths.add(path);
    this.rebuildDisplayRows();
    this.updateFooterInfo();
  }

  expandAll() {
    if (this.groupBy === 'none') return;
    const paths = this.computeAllGroupPaths(this.baseRows, this.groupBy);
    this.expandedPaths = new Set(paths);
    this.rebuildDisplayRows();
    this.updateFooterInfo();
  }

  collapseAll() {
    this.expandedPaths.clear();
    this.rebuildDisplayRows();
    this.updateFooterInfo();
  }

  addRow() {
    // Always emit so parent can open drawer if desired
    this.addRowRequested.emit();

    // If parent supplied a createRow factory, use it; otherwise use simple defaults from config
    const cfg = this._config as any;
    let newItem: BaseRow = {};
    if (cfg?.createRow && typeof cfg.createRow === 'function') {
      newItem = cfg.createRow();
    } else if (cfg?.createRowDefaults) {
      newItem = { ...(cfg.createRowDefaults) };
    } else {
      newItem = {};
    }
    newItem = { ...newItem, _new: true, _original: { ...(newItem ?? {}) } };
    this.baseRows = [newItem, ...this.baseRows];
    this.addedCount++;
    this.rebuildDisplayRows();
    this.updateFooterInfo();
    this.rowAdded.emit(newItem);
    this.emitChanges();
  }

  // ---- CRUD
  private onDeleteRow(params: ICellRendererParams, label: string) {
    if (!this.allowActionDelete) return;
    const row = params.data as BaseRow;
    const ok = window.confirm(`Delete "${label}"?`);
    if (!ok) return;
    if (!row._new) {
      this.deletedRows.push(row);
      this.deletedCount++;
    } else {
      if (this.addedCount > 0) this.addedCount--;
    }
    this.baseRows = this.baseRows.filter(r => r !== row);
    this.rebuildDisplayRows();
    this.updateFooterInfo();
    this.rowDeleted.emit(row);
    this.emitChanges();
  }

  private onRevertRow(row: BaseRow) {
    if (!this.allowActionRevert) return;
    if (row._new) {
      this.baseRows = this.baseRows.filter(r => r !== row);
      if (this.addedCount > 0) this.addedCount--;
    } else if (row._edited && row._original) {
      const orig = row._original as Record<string, any>;
      for (const k of Object.keys(orig)) {
        (row as any)[k] = orig[k];
      }
      row._edited = false;
      this.editedCount = this.baseRows.filter(r => r._edited).length;
    }
    this.rebuildDisplayRows();
    this.updateFooterInfo();
    this.rowReverted.emit(row);
    this.emitChanges();
  }

  // ---- Grouping engine (custom, community-safe)
  private computeAllGroupPaths(rows: BaseRow[], groupBy: GroupByChoice): string[] {
    if (groupBy === 'none') return [];
    const fields = groupBy.split('|');
    const paths = new Set<string>();
    const by = (flds: string[], input: BaseRow[], prefix: string[] = []) => {
      const [field, ...rest] = flds;
      const map = new Map<string, BaseRow[]>();
      for (const r of input) {
        const k = (r as any)[field] as string;
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(r);
      }
      for (const [key, bucket] of map) {
        const pathParts = [...prefix, `${field}=${key}`];
        const path = pathParts.join('\n');
        paths.add(path);
        if (rest.length) by(rest, bucket, pathParts);
      }
    };
    by(fields, rows);
    return Array.from(paths);
  }

  private rebuildDisplayRows() {
    if (this.groupBy === 'none') {
      this.rowData = [...this.baseRows];
      return;
    }
    const fields = this.groupBy.split('|');
    const display: DisplayRow[] = [];
    const makeHeader = (groupKey: string, level: number, path: string, childCount: number): DisplayRow => ({
      __isGroupHeader: true,
      __groupKey: groupKey,
      __groupLevel: level,
      __path: path,
      __childCount: childCount
    });
    const makeFooter = (groupKey: string, level: number, path: string, bucket: BaseRow[]): DisplayRow => ({
      __isGroupFooter: true,
      __groupKey: groupKey,
      __groupLevel: level,
      __path: path,
      __childCount: bucket.length
    });
    const by = (flds: string[], input: BaseRow[], level = 0, prefix: string[] = []) => {
      const [field, ...rest] = flds;
      const map = new Map<string, BaseRow[]>();
      for (const r of input) {
        const k = (r as any)[field] as string;
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(r);
      }
      const keys = Array.from(map.keys()).sort((a, b) => a.localeCompare(b));
      for (const key of keys) {
        const bucket = map.get(key)!;
        const pathParts = [...prefix, `${field}=${key}`];
        const path = pathParts.join('\n');
        display.push(makeHeader(key, level, path, bucket.length));
        const expanded = this.expandedPaths.has(path);
        if (expanded) {
          if (rest.length) {
            by(rest, bucket, level + 1, pathParts);
          } else {
            display.push(...bucket);
          }
          display.push(makeFooter(key, level, path, bucket));
        }
      }
    };
    by(fields, this.baseRows);
    this.rowData = display;
  }

  private updateFooterInfo() {
    if (!this.gridApi) {
      this.totalRows = this.baseRows.length;
      this.displayedRows = this.baseRows.length;
      this.groupText = 'None';
      this.footerInfo =
        `${this.effectiveLabels.showing} ${this.displayedRows} ${this.effectiveLabels.items} · ` +
        `${this.effectiveLabels.edited}: ${this.editedCount} · ` +
        `${this.effectiveLabels.deleted}: ${this.deletedCount} · ` +
        `${this.effectiveLabels.created}: ${this.addedCount} · ` +
        `${this.effectiveLabels.group}: None`;
      return;
    }
    let displayedLeafCount = 0;
    this.gridApi.forEachNodeAfterFilterAndSort((node) => {
      const d = node.data as DisplayRow;
      if (!d?.__isGroupHeader && !d?.__isGroupFooter) displayedLeafCount++;
    });
    this.totalRows = this.baseRows.length;
    this.displayedRows = displayedLeafCount;
    this.groupText = this.groupBy === 'none'
      ? this.effectiveLabels.groupNone
      : this.groupBy.replace('|', ' → ');
    this.footerInfo =
      `${this.effectiveLabels.showing} ${this.displayedRows} of ${this.totalRows} ${this.effectiveLabels.items} · ` +
      `${this.effectiveLabels.edited}: ${this.editedCount} · ` +
      `${this.effectiveLabels.deleted}: ${this.deletedCount} · ` +
      `${this.effectiveLabels.created}: ${this.addedCount} · ` +
      `${this.effectiveLabels.group}: ${this.groupText}`;
  }

  // ---- Columns dropdown
  toggleColumnsDropdown() {
    if (!this.showColumnsDropdownFeature) return;
    this.isColumnsPanelOpen = !this.isColumnsPanelOpen;
  }

  buildColumnToggleList() {
    const defs = (this.gridApi?.getColumnDefs() as ColDef[]) ?? this.columnDefs;
    // DEBUG: log defs to help diagnose empty columns dropdown (remove in cleanup)
    //try { console.debug('[Grid] buildColumnToggleList defs:', defs, 'columnDefs:', this.columnDefs); } catch (e) {}
    const list: { field: string; headerName: string; visible: boolean; lockVisible?: boolean }[] = [];
    for (const def of defs) {
      if (!def.field || def.field === 'actions') continue;
      const col = this.columnApi?.getColumn(def.field);
      const visible = col ? col.isVisible() : true;
      list.push({
        field: def.field!,
        headerName: def.headerName ?? def.field!,
        visible,
        lockVisible: !!def.lockVisible
      });
    }
    this.columnToggleList = list.sort((a, b) => a.headerName.localeCompare(b.headerName));
  }

  syncColumnToggleList() {
    this.columnToggleList = this.columnToggleList.map((item) => {
      const col = this.columnApi.getColumn(item.field);
      const visible = col ? col.isVisible() : item.visible;
      return { ...item, visible };
    });
  }

  onToggleColumn(item: { field: string; headerName: string; visible: boolean; lockVisible?: boolean }) {
    if (item.lockVisible) {
      alert(`"${item.headerName}" is locked visible.`);
      return;
    }
    const newVisible = !item.visible;
    // use gridApi.setColumnVisible to align with newer AG Grid APIs
    this.gridApi?.setColumnVisible(item.field, newVisible);
    this.columnToggleList = this.columnToggleList.map((i) =>
      i.field === item.field ? { ...i, visible: newVisible } : i
    );
  }

  showAllColumns() {
    const fields = this.columnToggleList.map((i) => i.field);
    // setColumnsVisible moved to grid API
    this.gridApi?.setColumnsVisible(fields, true);
    this.syncColumnToggleList();
  }

  hideAllColumns() {
    const fields = this.columnToggleList.filter((i) => !i.lockVisible).map((i) => i.field);
    this.gridApi?.setColumnsVisible(fields, false);
    this.syncColumnToggleList();
  }

  private emitChanges() {
    const added = this.baseRows.filter(r => r._new);
    const updated = this.baseRows.filter(r => r._edited && !r._new);
    const deleted = [...this.deletedRows];
    this.changeSet.emit({ added, updated, deleted, all: [...this.baseRows] });
  }

  onPaginationChanged() {
    if (!this.gridApi) return;
    try {
      const page = this.gridApi.paginationGetCurrentPage();
      const size = this.gridApi.paginationGetPageSize();
      this.pageChanged.emit({ page, pageSize: size });
      this.updateFooterInfo();
    } catch {}
  }

  // Outside click closer for Columns panel
  private boundOutsideHandler?: (ev: MouseEvent) => void;
  private installOutsideClickCloser() {
    if (this.boundOutsideHandler) {
      document.removeEventListener('click', this.boundOutsideHandler as any);
    }
    this.boundOutsideHandler = (ev: MouseEvent) => {
      if (!this.isColumnsPanelOpen) return;
      const target = ev.target as HTMLElement;
      const wrappers = document.querySelectorAll('.columns-dropdown');
      let inside = false;
      wrappers.forEach(w => { if (w.contains(target)) inside = true; });
      if (!inside) {
        this.isColumnsPanelOpen = false;
      }
    };
    document.addEventListener('click', this.boundOutsideHandler, { capture: true });
  }

  // ---- EXPORTS
  exportVisibleToCsv() {
    this.exportVisibleRequested.emit();
    if (!this.gridApi) return;
    this.gridApi.exportDataAsCsv({
      fileName: `${(this.title ?? 'grid').replace(/\s+/g, '_')}_visible.csv`,
    });
  }

  exportAllToCsv() {
    this.exportAllRequested.emit();
    if (!this.gridApi) return;
    const rows = this.baseRows ?? [];
    if (!rows.length) {
      alert('No data to export.');
      return;
    }
    const colIds = (this.columnDefs ?? [])
      .filter(c => c.field && c.field !== 'actions')
      .map(c => String(c.field));
    const headers = colIds.join(',');
    const lines = rows.map((r: any) =>
      colIds.map(id => {
        const v = r[id];
        const s = v == null ? '' : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(',')
    );
    const csv = [headers, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(this.title ?? 'grid').replace(/\s+/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }


/** Strict-safe handler for the file input change event */
onImportInputChange(input: HTMLInputElement) {
  const file = input?.files?.[0] ?? null;
  if (file) {
    this.importCsv(file);
  }
  // Clear the input so the same file can be chosen again if needed
  if (input) {
    try { input.value = ''; } catch {}
  }
}

  // ---- IMPORT
  async importCsv(file: File) {
    if (!file) return;
    try {
      const text = await file.text();
      const { headers, rows } = this.parseCsv(text);
      const h = headers.map(hd => (hd ?? '').trim());

      const cfg = this._config as any;
      const csvMap: Record<string, string[]> | undefined = cfg?.csvImportMap;
      const get = (row: string[], keys: string[]) => {
        for (const k of keys) {
          const idx = h.findIndex(x => x.toLowerCase() === k.toLowerCase());
          if (idx >= 0) return row[idx] ?? '';
        }
        return '';
      };
      const getForField = (row: string[], field: string, headerFallbacks: string[]) => {
        const keys = csvMap && csvMap[field] ? csvMap[field] : headerFallbacks;
        return get(row, keys);
      };
      const toNum = (v: any): number | undefined => {
        const s = String(v ?? '').trim();
        if (!s) return undefined;
        const n = Number(s);
        return Number.isFinite(n) ? n : undefined;
      };
      let mapped: BaseRow[] = [];
      const cols = cfg?.columns as any[] | undefined;
      if (Array.isArray(cols) && cols.length) {
        mapped = rows.map((r: string[]) => {
          const base: any = {};
          for (const col of cols) {
            const fld = col.field;
            const headerFallbacks = [col.headerName ?? fld, fld];
            let val: any = getForField(r, fld, headerFallbacks) ?? '';
            // try numeric conversion when it looks numeric
            const num = Number(String(val).trim());
            if (String(val).trim() !== '' && !Number.isNaN(num)) val = num;
            base[fld] = val;
          }
          base._original = { ...base };
          return base as BaseRow;
        }).filter(row => Object.keys(row).length > 1);
      } else {
        // fallback to legacy product mapping
        mapped = rows.map((r: string[]) => {
          const base = {
            productName: get(r, ['productName', 'product name', 'product_name']),
            category: get(r, ['category']),
            brand: get(r, ['brand']),
            price: toNum(get(r, ['price'])),
            stock: toNum(get(r, ['stock', 'available qty'])),
          } as any;
          base._original = { ...base };
          return base as BaseRow;
        }).filter(row => row['productName'] && row['category'] && row['brand'] && row['price'] !== undefined && row['stock'] !== undefined);
      }

     
      //let mapped: BaseRow[] = []; 

      this.baseRows = mapped;
      this.deletedRows = [];
      this.addedCount = 0;
      this.editedCount = 0;
      this.deletedCount = 0;
      this.rebuildDisplayRows();
      this.updateFooterInfo();
      this.emitChanges();
      alert(`Imported ${mapped.length} rows from "${file.name}".`);
    } catch (err) {
      console.error('CSV import failed:', err);
      alert('Import failed. Make sure the CSV is valid.');
    }
  }

  /** Minimal CSV parser supporting quotes, commas, and newlines in quoted fields. */
  private parseCsv(text: string): { headers: string[]; rows: string[][] } {
    const rows: string[][] = [];
    let cur: string[] = [];
    let field = '';
    let i = 0, inQuotes = false;
    const pushField = () => { cur.push(field); field = ''; };
    const pushRow = () => { rows.push(cur); cur = []; };

    while (i < text.length) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          const next = text[i + 1];
          if (next === '"') { field += '"'; i += 2; continue; } // escaped quote
          inQuotes = false; i++; continue;
        }
        field += ch; i++; continue;
      } else {
        if (ch === '"') { inQuotes = true; i++; continue; }
        if (ch === ',') { pushField(); i++; continue; }
        if (ch === '\r') { i++; continue; } // ignore CR
        if (ch === '\n') { pushField(); pushRow(); i++; continue; }
        field += ch; i++; continue;
      }
    }
    // flush last
    pushField();
    if (cur.length > 1 || (cur.length === 1 && cur[0] !== '')) pushRow();
    if (!rows.length) return { headers: [], rows: [] };
    const [headers, ...data] = rows;
    return { headers, rows: data };
  }
}
