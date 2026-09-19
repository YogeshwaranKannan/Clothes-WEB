import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProductService } from '../../common/services/product.service';

interface Hotspot {
  x: number;
  y: number;
  label: string;
}

interface Banner {
  id: string;
  title: string;
  desktopImage: string;
  mobileImage: string;
}

@Component({
  selector: 'app-hero-banner',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './hero-banner.component.html',
  styleUrls: ['./hero-banner.component.scss']
})
export class HeroBannerComponent implements OnInit, OnDestroy {
  banners: Banner[] = [];
  active = 0;
  prevActive = 0;
  direction: 'left' | 'right' = 'left';
  private timer: any = null;
  autoplayMs = 10000;
  paused = false;

  constructor(private http: HttpClient, private router: Router, private productService: ProductService) {}

  ngOnInit(): void {
    this.loadBannersFromPhones();
    this.startAutoplay();
  }

  ngOnDestroy(): void {
    this.stopAutoplay();
  }

  private loadBannersFromPhones() {
    this.productService.getHeroProducts().subscribe((products) => {

      // Desktop images: 1800×360px (panoramic, 5:1 ratio)
      // Mobile images:  500×350px  (landscape crop, optimised for narrow screens)
      // All images are pre-processed to consistent dimensions so the carousel
      // container never resizes between slides.
      this.banners = [
        {
          id: '1',
          title: '',
          desktopImage: 'assets/img/banner/banner-grocery-1.jpeg',
          mobileImage:  'assets/img/banner/banner-grocery-1-mobile.jpeg',
        },
        {
          id: '2',
          title: '',
          desktopImage: 'assets/img/banner/banner-grocery-2.jpeg',
          mobileImage:  'assets/img/banner/banner-grocery-2-mobile.jpeg',
        },
        {
          id: '3',
          title: '',
          desktopImage: 'assets/img/banner/banner-veg-1.jpeg',
          mobileImage:  'assets/img/banner/banner-veg-1-mobile.jpeg',
        },
        {
          id: '4',
          title: '',
          desktopImage: 'assets/img/banner/banner-veg-2.jpeg',
          mobileImage:  'assets/img/banner/banner-veg-2-mobile.jpeg',
        },
      ];

      console.log('hero banner', this.banners);
    });
  }

  private generateHotspotsFor(id?: number) {
    const seedStr = String(id ?? 'x');
    const seed = seedStr.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
    const rng = (n: number) => (Math.abs(Math.sin(seed + n) * 10000) % 1);
    const labels = ['Key feature', 'Camera', 'Battery'];

    return labels.map((label, i) => ({
      x: 50 + Math.round((rng(i + 1) - 0.5) * 20),
      y: 45 + Math.round((rng(i + 2) - 0.5) * 40),
      label
    })).map(h => ({
      x: Math.max(8, Math.min(92, h.x)),
      y: Math.max(8, Math.min(92, h.y)),
      label: h.label
    }));
  }

  startAutoplay() {
    this.stopAutoplay();
    this.timer = setInterval(() => {
      if (!this.paused) this.next();
    }, this.autoplayMs);
  }

  stopAutoplay() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  next() {
    if (!this.banners || this.banners.length <= 1) return;
    this.prevActive = this.active;
    this.direction = 'left';
    this.active = (this.active + 1) % this.banners.length;
  }

  prev() {
    if (!this.banners || this.banners.length <= 1) return;
    this.prevActive = this.active;
    this.direction = 'right';
    this.active = (this.active - 1 + this.banners.length) % this.banners.length;
  }

  go(i: number) {
    if (i === this.active) return;
    this.prevActive = this.active;
    this.direction = i > this.active ? 'left' : 'right';
    this.active = i;
  }

  onMouseEnter() { this.paused = true; }
  onMouseLeave() { this.paused = false; }

  goToPhone(id?: string) {
    if (!id) return;
    this.router.navigate(['/product', id]);
  }

  goToCategory(cat?: string) {
    if (!cat) return;
    this.router.navigate(['/search'], { queryParams: { brand: cat } });
  }
}