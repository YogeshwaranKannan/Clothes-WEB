import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

interface MenuItem {
  label: string;
  icon: string;
  expanded: boolean;
  children: { label: string; route: string }[];
}

@Component({
  selector: 'app-vertical-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vertical-menu.component.html',
  styleUrls: ['./vertical-menu.component.scss']
})
export class VerticalMenuComponent {

  collapsed = false;

  menu: MenuItem[] = [
    {
      label: 'Products Mgmt',
      icon: '🛍️',
      expanded: false,
      children: [
        { label: 'Products', route: 'all-products' },
         { label: 'Add Product', route: 'add-products' },
      ]
    },
    {
      label: 'Orders Mgmt',
      icon: '💳',
      expanded: false,
      children: [
        { label: 'Orders', route: 'orders' },
        { label: 'Order Details', route: 'order-details' }
      ]
    },
    // {
    //   label: 'Reports Mgmt',
    //   icon: '📊',
    //   expanded: false,
    //   children: [
    //     { label: 'Reports', route: 'reports' }
    //   ]
    // }
  ];

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  toggle(item: MenuItem) {
    if (this.collapsed) return;
    item.expanded = !item.expanded;
  }

  toggleSidebar() {
    this.collapsed = !this.collapsed;
  }

  select(route: string) {
    this.router.navigate([route], { relativeTo: this.route });
  }
}
