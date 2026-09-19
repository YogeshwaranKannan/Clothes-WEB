import { Component, OnInit, ViewChild, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";
import { GridComponent } from "../grid/grid.component";
import { GridConfig, GridFeaturesConfig, GridLabels } from "../grid/grid.types";
import { OrderService } from "../../common/services/orders.service";
import { Order } from "../../common/models/orders.model";
import { DrawerComponent } from "../../common/components/drawer/drawer.component";
import { DrawerState } from "../../common/components/drawer/drawer-state";
import { SellerOrderDetailsComponent } from "../seller-order-details/seller-order-details.component";

@Component({
  selector: "app-order-management",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    GridComponent,
    SellerOrderDetailsComponent,
    DrawerComponent,
  ],
  templateUrl: "./order-management.component.html",
  styleUrls: ["./order-management.component.scss"],
})
export class OrderManagementComponent implements OnInit {
  DrawerState = DrawerState; // for template
  drawerState: DrawerState = DrawerState.Hidden;
  selectedOrder: any = null;
  selectedOrderId: string | null = null;
  @ViewChild(GridComponent) grid!: GridComponent;
  private orderService = inject(OrderService);
  gridConfig: GridConfig<Order & { items_count?: number }> = {
    title: "Orders",
    columns: [
      {
        field: "order_id",
        headerName: "Order ID",
        ui: { type: "link", action: "view-detail" },
      },
      { field: "items_count", headerName: "Items" },
      { field: "tot_order_value", headerName: "Total Value" },
      { field: "order_status", headerName: "Status" },
      { field: "__viewDetail", headerName: "View Detail" },
    ],
    rows: [],
    pagination: true,
    pageSize: 100,
    enableAdd: false,
    enableEdit: false,
    enableDelete: false,
    enableRevert: false,
    showColumnsDropdown: true,
    groupByDefault: "none",
    labelField: "order_id",
  };

  features: GridFeaturesConfig = {
    toolbar: {
      globalSearch: true,
      groupBy: false,
      addRow: false,
      columns: true,
      exportAllCsv: true,
      exportVisibleCsv: true,
      importCsv: false,
      save: false,
      reset: true,
    },
    footer: {
      show: true,
      showRange: true,
      showCounts: false,
      showGroup: false,
    },
  };

  labels: GridLabels = {
    title: "Orders",
    globalSearchPlaceholder: "Search orders…",
    showing: "Showing",
    items: "orders",
    edited: "Edited",
    deleted: "Deleted",
    created: "New",
    group: "Group",
  };

  ngOnInit(): void {
    this.orderService.getAllOrders().subscribe((orders: Order[]) => {
      const rows = (orders || []).map((o) => ({
        ...o,
        items_count: o.items?.length ?? 0,
      }));
      this.gridConfig = { ...this.gridConfig, rows };
      console.log(rows);
    });
  }

  onSaveFromGrid() {
    const changes = this.grid.getPendingChanges();
    console.log(">>> Final Save payload:", changes);
    this.grid.clearChanges();
    alert("Saved successfully (simulated).");
  }

  onResetFromGrid() {
    this.orderService.getAllOrders().subscribe((orders: Order[]) => {
      const rows = (orders || []).map((o) => ({
        ...o,
        items_count: o.items?.length ?? 0,
      }));
      this.gridConfig = { ...this.gridConfig, rows };
    });
  }

  // Hooks (no-op for now)
  onGridChangeSet(_cs: any) {}
  onRowEdited(_row: any) {}
  onRowDeleted(_row: any) {}
  onRowAdded(_row: any) {}
  onRowReverted(_row: any) {}

  onProductSaved(product: any) {
    console.log("[PM] saved", product);
    this.closeDrawer();
    //this.reloadGrid();
    //this.drawerOpen = false;
    // TODO: refresh rows if needed
  }

  onGridCellAction(e: { action: string; row: any }) {
    if (e.action === "view-detail") {
      this.onViewDetail(e.row); // reuse your existing handler that opens the Drawer
    }
  }

  // order-management.component.ts
  onViewDetail(row: any) {
    const id = row?.order_id ?? row?.id ?? null; // <-- make sure this matches your data
    this.selectedOrderId = id; // set ID first
    this.drawerState = DrawerState.Half; // then open the drawer
  }

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
