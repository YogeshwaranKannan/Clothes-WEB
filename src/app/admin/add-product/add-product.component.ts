import { Component, EventEmitter, Output, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductSuggestComponent } from '../../common/components/product-suggest/product-suggest.component';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductSuggestComponent],
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.scss'],
})
export class AddProductComponent {
  @Output() cancel = new EventEmitter<void>();
  @Output() saved = new EventEmitter<any>();

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  editMode = false;

  imagePreview: string | null = null;
  selectedImage: string | null = null;
  thumbnailList: string[] = [];

  // Fallback thumbs to always show a strip
  fallbackThumbs: string[] = [
    'assets/img/prod/Trek-FX4-Sport-4-Lithium-Grey.jpg',
    'assets/img/prod/giant-revolt-2-sapphire.jpg',
    'assets/img/prod/marin-gestalt-1-white.jpg',
  ];

  // Rotation / auto rotate / flip
  rotateAngle = 0;
  autoRotate = false;

  isFlipping = false;
  private flipDurationMs = 3200; // match SCSS flip duration

  model: any = {
    ProductName: '',
    Brand: '',
    SellingPrice: '',
    OfferPrice: '',
    DiscountPercent: '',
    Category: { CategoryName: '' },
    Size: '',
    StockStatus: '',
    Features: '',
    Specifications: '',
    Components: '',
    AdditionalInfo: '',
    ReturnsPolicy: '',
    Image: '',
  };

  constructor() {
    this.rebuildThumbnails();
  }

  // Helpers (View mode: empty box only)
  isBlank(v: any): boolean {
    return v == null || String(v).trim().length === 0;
  }

  // Manual rotate transform used on wrapper
  get manualRotateTransform(): string | null {
    if (this.autoRotate || this.isFlipping) return null;
    return `rotate(${this.rotateAngle}deg)`;
  }

  onSave() {
    this.saved.emit(this.model);
  }

  onCancel() {
    this.cancel.emit();
  }

  toggleEdit() {
    this.editMode = !this.editMode;
  }

  triggerUpload() {
    try {
      this.fileInput.nativeElement.click();
    } catch {}
  }

  onFileSelected(ev: Event) {
    const input = ev.target as HTMLInputElement | null;
    const file = input?.files?.[0] ?? null;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagePreview = String(reader.result ?? '');
      this.model.Image = this.imagePreview;

      this.rebuildThumbnails();
      this.selectedImage = this.imagePreview; // show uploaded immediately
    };
    reader.readAsDataURL(file);
  }

  onProductPicked(product: any) {
    this.model.ProductName = product.ProductName ?? product.productName ?? this.model.ProductName;
    this.model.Brand = product.Brand ?? product.brand ?? this.model.Brand;
    this.model.SellingPrice = product.SellingPrice ?? this.model.SellingPrice;
    this.model.OfferPrice = product.OfferPrice ?? this.model.OfferPrice;
    this.model.DiscountPercent = product.DiscountPercent ?? this.model.DiscountPercent;

    if (product.Category) {
      this.model.Category = { CategoryName: product.Category.CategoryName ?? product.Category };
    }

    this.model.Size = product.Size ?? this.model.Size;
    this.model.StockStatus = product.StockStatus ?? this.model.StockStatus;

    if (product.Image) {
      this.model.Image = product.Image;
      this.imagePreview = product.Image;
    }

    if (product.Images) (this.model as any).Images = product.Images;
    if (product.images) (this.model as any).images = product.images;

    this.rebuildThumbnails();
    this.selectedImage = this.thumbnailList[0] ?? this.model.Image ?? null;
  }

  selectThumbnail(img: string) {
    this.selectedImage = img;
  }

  rebuildThumbnails() {
    const thumbs: string[] = [];

    if (this.imagePreview) thumbs.push(this.imagePreview);
    if (this.model?.Image) thumbs.push(this.model.Image);

    const images = (this.model as any)?.Images || (this.model as any)?.images;
    if (Array.isArray(images)) thumbs.push(...images);

    // Always include fallbacks so strip shows multiple items
    thumbs.push(...this.fallbackThumbs);

    this.thumbnailList = Array.from(new Set(thumbs)).filter(Boolean);

    if (!this.selectedImage) {
      this.selectedImage = this.thumbnailList[0] ?? null;
    }
  }

  rotate90() {
    this.autoRotate = false;
    this.isFlipping = false;
    this.rotateAngle = (this.rotateAngle + 90) % 360;
  }

  toggleAutoRotate() {
    this.isFlipping = false;
    this.autoRotate = !this.autoRotate;
  }

  resetRotation() {
    this.autoRotate = false;
    this.isFlipping = false;
    this.rotateAngle = 0;
  }

  flipOnce() {
    // stop auto rotate so transforms don't fight
    this.autoRotate = false;

    // restart reliably
    this.isFlipping = false;
    requestAnimationFrame(() => {
      this.isFlipping = true;
      window.setTimeout(() => (this.isFlipping = false), this.flipDurationMs);
    });
  }
}