import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute } from "@angular/router";

import { OrderService } from "../common/services/orders.service";
import { SellerService } from "../common/services/SellerService";

import { OrderDetailComponent } from "../order-detail/order-detail.component";

@Component({
  selector: "app-order-success",
  standalone: true,
  imports: [CommonModule, OrderDetailComponent],
  templateUrl: "./order-success.component.html",
  styleUrls: ["./order-success.component.scss"],
})
export class OrderSuccessComponent implements OnInit {
  refno: string | null = null;

  loading = false;

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private sellerService: SellerService,
  ) {}

  ngOnInit(): void {
    this.refno = this.route.snapshot.queryParamMap.get("refno");

    console.log("REFNO:", this.refno);

    if (this.refno) {
      this.loadOrder();
    }
  }

  loadOrder() {
    this.loading = true;

    this.orderService
      .getOrderByRef(this.refno!, this.sellerService.getSellerId())
      .subscribe({
        next: (res) => {
          console.log("Order Details:", res);

          this.loading = false;
        },

        error: (err) => {
          console.log("Error fetching order:", err);

          this.loading = false;
        },
      });
  }
}
