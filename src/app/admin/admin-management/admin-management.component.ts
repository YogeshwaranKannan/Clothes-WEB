import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VerticalMenuComponent } from '../vertical-menu/vertical-menu.component';

@Component({
  selector: 'app-admin-management',
  standalone: true,
  imports: [
    VerticalMenuComponent,
    RouterOutlet
  ],
  templateUrl: './admin-management.component.html',
  styleUrl: './admin-management.component.scss'
})
export class AdminManagementComponent {}
