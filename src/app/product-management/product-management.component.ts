
import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, ParamMap } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProductService } from '../common/services/product.service';
import { GridComponent } from '../admin/grid/grid.component';
import { AddProductComponent } from '../admin/add-product/add-product.component';
import { DrawerComponent } from '../common/components/drawer/drawer.component';
import {  DrawerState } from '../common/components/drawer/drawer-state';


import {
  GridConfig, ChangeSet, GridFeaturesConfig, GridLabels,
} from '../admin/grid/grid.types';



@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [CommonModule, RouterModule, GridComponent,AddProductComponent,DrawerComponent],
  templateUrl: './product-management.component.html',
  styleUrls: ['./product-management.component.scss']
})


export class ProductManagementComponent implements OnInit, OnDestroy {
  DrawerState = DrawerState; // for template
  drawerState: DrawerState = DrawerState.Hidden;  
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  @ViewChild(GridComponent) grid!: GridComponent;
  @ViewChild(AddProductComponent) addProduct!: AddProductComponent;

  categoryId: string | null = null;
  private sub: Subscription | null = null;

  // Optional drawer
  //drawerOpen = false;

  // Backing store populated from ProductService
  private allRows: any[] = [];
  private productsSub: Subscription | null = null;

  // Grid configuration (in-grid action icons configurable here)
  gridConfig: GridConfig = {
    title: 'Product Grid',
    columns: [
      // Example: filter disabled by default (global search used)
      { field: 'productName', headerName: 'Product Name', editable: true, ui: { type: 'link', action: 'viewProduct' } },
      { field: 'category',    headerName: 'Category',     editable: true },
      { field: 'brand',       headerName: 'Brand',        editable: true },
      // Example: opt-in per-column filter for price (rare case)
      { field: 'price',       
        headerName: 'Price',
        filter: 'agNumberColumnFilter',
        floatingFilter: false,
        editable: true, 
        filterable: false , 
        // ✅ numeric value used for sorting & filtering
        valueGetter: (p: any) => this.parseINR(p.data?.price),
        // ✅ display formatted INR (optional)
        valueFormatter: (p: any) =>
        p.value == null ? '' : `₹${Number(p.value).toLocaleString('en-IN')}`,
      },
      { field: 'stock',       headerName: 'Available Qty', editable: true }
    ],
    rows: [], // set below

    pagination: true,
    pageSize: 100,

    // Capabilities -> control in-grid action icons + cell editing
    enableAdd: true,
    enableEdit: true,
    enableDelete: true,
    enableRevert: true,

    showColumnsDropdown: true,
    groupByDefault: 'none',
    labelField: 'productName'
    // rowIdKey: 'id',
  };

  
 parseINR(v: any): number {
  if (v == null) return 0;
  const s = String(v)
    .replace(/rs\.?/gi, '')  // remove Rs or Rs.
    .replace(/₹/g, '')       // remove ₹
    .replace(/,/g, '')       // remove commas
    .trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

  /** Toolbar + footer features */
  features: GridFeaturesConfig = {
    toolbar: {
      globalSearch: true,
      groupBy: true,
      addRow: true,
      columns: true,
      exportAllCsv: true,
      exportVisibleCsv: true,
      importCsv: true,
      save: true,   // show Save in grid toolbar
      reset: true,  // show Reset in grid toolbar
    },
    footer: {
      show: true,
      showRange: true,
      showCounts: true,
      showGroup: true,
    }
  };

  /** Optional labels */
  labels: GridLabels = {
    title: 'Products',
    globalSearchPlaceholder: 'Search products…',
    save: 'Save',
    reset: 'Reset',
  };

  // Menu selection (if you have left-side vertical filters/categories)
  onMenu(value: string) {
    this.categoryId = value ?? null;
    this.refreshRowsForCategory();
  }

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe((pm: ParamMap) => {
      this.categoryId = pm.get('id');
      this.refreshRowsForCategory();
    });
    // load products from service
    this.productsSub = this.productService.getProducts().subscribe((products) => {
      const mapped = (products ?? []).map((p: any) => {
        const rawPrice = p.OfferPrice || p.SellingPrice || p.price || '';
        const num = Number(String(rawPrice).replace(/[^0-9.]/g, '').replace(/,/g, ''));
        return {
          id: String(p.ProductId ?? p.id ?? ''),
          productName: p.ProductName ?? p.productName ?? '',
          category: (p.Category && (p.Category.CategoryName || p.Category)) || p.category || '',
          brand: p.Brand ?? p.brand ?? '',
          price: p.SellingPrice?? 0,
          stock: p.AvilableQty ??0,
          // keep original payload handy
          _raw: p
        };
      });
      this.allRows = mapped;
      this.refreshRowsForCategory();
    });
  }
  ngOnDestroy(): void { this.sub?.unsubscribe(); this.productsSub?.unsubscribe(); }

  // Handle grid cell actions (e.g., product name link)
  onGridCellAction(evt: { action: string; row: any; col: any }) {
    const row = evt?.row;
    if (!row) return;
    // If parent asked to view product, fetch detail when possible then open drawer
    if (evt.action === 'viewProduct' || evt.action === 'cell-link-click') {
      const id = Number(row.productId ?? row.id ?? row.ProductId ?? NaN);
      console.log('product id',id)
      if (!Number.isNaN(id)) {
        this.productService.getProductById(id).subscribe((detail) => {
          const payload = detail ?? {
            ProductName: row.productName ?? row.ProductName,
            Category: row.category ?? row.Category,
            Brand: row.brand ?? row.Brand,
          } as any;
          try { this.addProduct.onProductPicked(payload); } catch {}
          this.drawerState = DrawerState.Half;
        });
      } else {
        const payload = {
          ProductName: row.productName ?? row.ProductName,
          Category: row.category ?? row.Category,
          Brand: row.brand ?? row.Brand,
        } as any;
        try { this.addProduct.onProductPicked(payload); } catch {}
        this.drawerState = DrawerState.Half;
      }
    }
  }

  // Optional: listen to normalized change set for enabling Save, etc.
  onGridChangeSet(cs: ChangeSet<any>) {
    // e.g., enable/disable some external controls
  }
  onRowEdited(row: any)  { console.log('Edited:', row); }
  onRowDeleted(row: any) { console.log('Deleted:', row); }
  onRowAdded(row: any)   { console.log('Added:', row); }
  onRowReverted(row: any){ console.log('Reverted:', row); }

  /** Handlers wired to Grid toolbar buttons (Option A: parent pulls payload) */
  onSaveFromGrid() {
    const changes = this.grid.getPendingChanges();  // <-- pull payload from child
    console.log('>>> Final Save payload:', changes);

    // TODO: call API with `changes`
    // this.productsService.save(changes).subscribe(() => this.grid.clearChanges());

    this.grid.clearChanges(); // simulate success
    alert('Saved successfully (simulated).');
  }

  onResetFromGrid() {
    // Rehydrate from your source (API / cache)
    this.refreshRowsForCategory();
  }

  private refreshRowsForCategory() {
    // const rows = this.categoryId ? this.allRows.filter(r => r.category === this.categoryId) : this.allRows;
    const rows = this.allRows;
    this.gridConfig = { ...this.gridConfig, rows }; // reassign immutably to trigger @Input() change
  }

  // Drawer hooks (if you wire Add to open drawer)
  onAddRowRequested() {
    this.drawerState = DrawerState.Half;
  }
 
  onProductSaved(product: any) {
    console.log('[PM] saved', product);
    this.closeDrawer();
    //this.reloadGrid();
    //this.drawerOpen = false;
    // TODO: refresh rows if needed
  }

  //openAddProduct() {this.showAddDrawer = true;console.log(this.showAddDrawer);}

   closeDrawer() {
    this.drawerState = DrawerState.Hidden;
  }

  openDrawer() {
    this.drawerState = DrawerState.Half;
  }

  onDrawerChange(state: DrawerState) {
    this.drawerState = state;
  }

}
