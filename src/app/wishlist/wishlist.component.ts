import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WishlistService } from './wishlist.service';
import { ProductService } from '../common/services/product.service';
import { Product } from '../common/models/product.model';
import { Subscription } from 'rxjs';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule,RouterModule],
  template: `
<div class="wishlist-page">
      <div class="site-container">

        <header class="page-header">
          <div class="page-header__glow"></div>
          <div class="page-header__content">
            <div class="page-header__left">
              <span class="page-header__eyebrow">Management</span>
              <h1 class="page-header__title">YOUR WISHLIST</h1>
            </div>
          </div>
        </header>

        <div *ngIf="items.length; else empty">

          <ul class="wishlist-list">

            <li *ngFor="let it of items" class="wishlist-item">

              <!-- Product Image -->
              <div class="thumb-wrapper">
                <img
                  [src]="it.Image"
                  [alt]="it.ProductName"
                  class="thumb"
                />
              </div>

              <!-- Product Info -->
              <div class="meta">

                <!-- Product Name (Only Clickable Element) -->
                <a
                  [routerLink]="['/product', it.ProductId]"
                  class="product-name"
                >
                  {{ it.ProductName }}
                </a>

                <!-- Price -->
                <div class="price">
                  {{ it.OfferPrice || it.SellingPrice }}
                </div>

              </div>

              <!-- Remove Button -->
              <button
                class="remove-btn"
                (click)="remove(it.ProductId)"
                aria-label="Remove item"
              >
                ✕
              </button>

            </li>

          </ul>

        </div>

        <ng-template #empty>
          <div class="empty-state">
            <p>No items in your wishlist yet.</p>
          </div>
        </ng-template>

      </div>
    </div>
  `,
  styles: [`
    .wishlist-page { padding: 1rem; }

    /* ── Page header — matches product-list & order-detail ── */
    .page-header {
      position: relative;
      overflow: hidden;
      border-radius: 16px;
      margin-bottom: 14px;
      background: linear-gradient(
        135deg,
        var(--oh-header-tint-a, #e8f4fd)  0%,
        var(--oh-header-tint-b, #ddeeff)  40%,
        var(--oh-header-tint-a, #e8f4fd)  70%,
        var(--oh-header-tint-c, #f0f7ff)  100%
      );
      border: 1px solid var(--oh-header-border, rgba(99, 163, 220, 0.18));
      box-shadow:
        0 2px 12px var(--oh-header-shadow, rgba(80, 140, 200, 0.08)),
        0 1px 3px  var(--oh-header-shadow, rgba(80, 140, 200, 0.08)),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
      transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
    }
    .page-header::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(
        circle,
        var(--oh-header-dot, rgba(99, 163, 220, 0.12)) 1px,
        transparent 1px
      );
      background-size: 22px 22px;
      pointer-events: none;
    }
    .page-header__glow {
      position: absolute;
      top: -30px;
      right: -20px;
      width: 180px;
      height: 180px;
      border-radius: 50%;
      background: radial-gradient(
        circle,
        var(--oh-header-glow, rgba(99, 179, 237, 0.28)) 0%,
        transparent 70%
      );
      pointer-events: none;
      filter: blur(2px);
      transition: background 0.3s ease;
    }
    .page-header__content {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 10px 16px;
    }
    .page-header__left {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .page-header__eyebrow {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--oh-eyebrow, #4a90c4);
      opacity: 0.8;
      transition: color 0.3s ease;
    }
    .page-header__title {
      margin: 0;
      font-size: clamp(1rem, 2.5vw, 1.2rem);
      font-weight: 700;
      line-height: 1.15;
      color: var(--oh-heading, #1a365d);
      letter-spacing: -0.02em;
      transition: color 0.3s ease;
    }
    @media (max-width: 600px) {
      .page-header__content { padding: 8px 14px; gap: 12px; }
      .page-header__title { font-size: 1rem; }
      .page-header__glow { width: 120px; height: 120px; }
    }

    /* List */
    .wishlist-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 0.75rem;
    }

    /* One row = one “card” */
    .wishlist-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: #fff;
      border: 1px solid rgba(2,6,23,0.06);
      border-radius: 10px;
      box-shadow: 0 6px 18px rgba(15,23,42,0.04);
      transition: transform 150ms ease, box-shadow 150ms ease;
      flex-wrap: wrap; /* responsive */
    }

    /* Product-list style hover */
    @media (hover: hover) and (pointer: fine) {
      .wishlist-item:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 22px rgba(15,23,42,0.08);
      }
    }

    /* Active (mousedown) */
    .wishlist-item:active {
      transform: translateY(-2px);
      box-shadow: 0 6px 18px rgba(15,23,42,0.06);
    }

    /* Keyboard focus within row */
    .wishlist-item:focus-within {
      outline: none;
      box-shadow:
        0 0 0 2px rgba(11,94,215,0.20),
        0 6px 18px rgba(15,23,42,0.04);
    }

    /* Thumbnail */
    .thumb-wrapper {
      width: 80px;
      height: 80px;
      flex: 0 0 auto;
    }
    .thumb {
      width: 100%;
      height: 100%;
      object-fit: contain;
      background: #f8f8f8;
      border-radius: 6px;
      display: block;
    }

    /* Meta section */
    .meta {
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-width: 0; /* prevents overflow */
    }

    /* Product name */
    .product-name {
      color: #0d6efd;          /* Blue */
      font-weight: 400;        /* Not bold */
      text-decoration: none;   /* No underline by default */
      word-break: break-word;
      cursor: pointer;
    }
    .product-name:hover { text-decoration: underline; }

    /* Price */
    .price { color: inherit; margin-top: 4px; }

    /* Remove button */
    .remove-btn {
      margin-left: auto;
      width: 32px; height: 32px;
      border: none;
      background: transparent;
      color: #dc3545;   /* red */
      font-size: 18px;
      font-weight: 600;
      cursor: pointer;
      border-radius: 50%;
      transition: background 0.2s ease, transform 0.1s ease;
      flex: 0 0 auto;
    }
    @media (hover: hover) and (pointer: fine) {
      .remove-btn:hover {
        background: rgba(220,53,69,0.10);
        transform: scale(1.1);
      }
    }
    .remove-btn:active { transform: scale(0.95); }

    /* Empty state */
    .empty-state {
      padding: 1rem;
      color: #475569;
      background: #f8fafc;
      border: 1px dashed #cbd5e1;
      border-radius: 8px;
    }

    /* Responsive tweaks */
    @media (max-width: 768px) {
      .product-name { text-decoration: underline; }  /* Your mobile rule */
    }
    @media (max-width: 576px) {
      .wishlist-item { padding: 0.75rem; gap: 0.5rem; }
    }

    /* Respect reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .wishlist-item, .remove-btn { transition: none !important; }
    }
  `]
})

export class WishlistComponent implements OnInit {

  items: Product[] = [];
  private ids: string[] = [];
  private sub?: Subscription;

  constructor(
    private wishlist: WishlistService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.sub = this.wishlist.ids$.subscribe((ids) => {
      this.ids = ids || [];
      this.loadItems();
    });

  }

  private loadItems(): void {
  console.log('component wish list',this.ids); 
    if (!this.ids.length) {
      this.items = [];
      return;
    }

    this.productService.getProductsByIds(this.ids)
      .subscribe(products => {
        this.items = products || [];
      });
      
  }

 remove(id: string | number): void {
  this.wishlist.remove(String(id));
}

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
