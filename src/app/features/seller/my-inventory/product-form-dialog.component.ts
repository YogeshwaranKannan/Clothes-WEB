// import {
//   Component,
//   EventEmitter,
//   HostListener,
//   Input,
//   OnDestroy,
//   OnInit,
//   Output,
//   inject,
// } from "@angular/core";
// import { CommonModule } from "@angular/common";
// import {
//   AbstractControl,
//   FormArray,
//   FormBuilder,
//   FormGroup,
//   ReactiveFormsModule,
//   Validators,
// } from "@angular/forms";
// import { Subject, firstValueFrom, of } from "rxjs";
// import {
//   catchError,
//   debounceTime,
//   distinctUntilChanged,
//   switchMap,
//   takeUntil,
// } from "rxjs/operators";
// import {
//   CategoryOption,
//   InsertProductsPayload,
//   InventoryService,
//   ProductImage,
// } from "./inventory.service";

// const MAX_IMAGES = 3;
// const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024;

// @Component({
//   selector: "app-product-form-dialog",
//   standalone: true,
//   imports: [CommonModule, ReactiveFormsModule],
//   templateUrl: "./product-form-dialog.component.html",
//   styleUrls: ["./product-form-dialog.component.scss"],
// })
// export class ProductFormDialogComponent implements OnInit, OnDestroy {
//   /** null → add mode, id → edit mode */
//   @Input() inventoryId: string | null = null;
//   /** emits true when something was saved so the list can refresh */
//   @Output() closed = new EventEmitter<boolean>();

//   private fb = inject(FormBuilder);
//   private api = inject(InventoryService);
//   private destroy$ = new Subject<void>();

//   loading = false;
//   saving = false;
//   formError = "";
//   categories: CategoryOption[] = [];
//   images: ProductImage[] = [];
//   imageError = "";
//   dragging = false;
//   suggestions: { id: string; productName: string; price: number }[] = [];
//   showSuggestions = false;

//   /** raw ViewProduct response when editing */
//   private product: any = null;

//   form: FormGroup = this.fb.group({
//     productName: ["", [Validators.required]],
//     productDescription: ["", [Validators.required]],
//     brand: ["", [Validators.required]],
//     categoryId: ["", [Validators.required]],
//     quickadd: [true],
//     deals: [false],
//     newArrivals: [false],
//     unit: [""],
//     expiry: [""],
//     minimumOrder: ["0"],
//     gst: [""],
//     variants: this.fb.array([this.newVariant()]),
//   });

//   get isEdit(): boolean {
//     return !!this.product;
//   }
//   get title(): string {
//     return this.inventoryId || this.isEdit ? "Edit product" : "Add product";
//   }
//   get variants(): FormArray {
//     return this.form.get("variants") as FormArray;
//   }
//   asGroup(c: AbstractControl): FormGroup {
//     return c as FormGroup;
//   }

//   /* ------------------------------ lifecycle ------------------------------ */

//   ngOnInit(): void {
//     document.body.style.overflow = "hidden"; // lock page scroll behind the overlay

//     // name suggestions (add mode only)
//     this.form
//       .get("productName")!
//       .valueChanges.pipe(
//         debounceTime(300),
//         distinctUntilChanged(),
//         switchMap((v: string) =>
//           !this.isEdit && (v ?? "").length > 2
//             ? this.api.suggest(v).pipe(catchError(() => of([])))
//             : of([]),
//         ),
//         takeUntil(this.destroy$),
//       )
//       .subscribe((s) => (this.suggestions = s));

//     this.bootstrap();
//   }

//   ngOnDestroy(): void {
//     document.body.style.overflow = "";
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   @HostListener("document:keydown.escape")
//   onEscape(): void {
//     this.requestClose();
//   }

//   private async bootstrap(): Promise<void> {
//     this.loading = true;
//     try {
//       this.categories = await firstValueFrom(this.api.categories());
//       if (this.inventoryId) await this.loadProduct(this.inventoryId);
//     } catch (e: any) {
//       this.formError =
//         e?.error?.msg ||
//         "Couldn’t load the form. Check your connection and try again.";
//     } finally {
//       this.loading = false;
//     }
//   }

//   /* ------------------------------ load (edit) ------------------------------ */

//   private async loadProduct(id: string): Promise<void> {
//     const data = await firstValueFrom(this.api.view(id));
//     this.product = data;

//     this.form.patchValue({
//       productName: data?.productname ?? "",
//       productDescription: data?.productDescription ?? "",
//       brand: data?.brand ?? "",
//       categoryId:
//         this.categories.find(
//           (c) => String(c.value).trim() === String(data?.categoryId).trim(),
//         )?.value ?? "",
//       quickadd: data?.quickadd ?? true,
//       deals: !!data?.deals,
//       newArrivals: !!data?.newArrivals,
//       unit: data?.unit ?? "",
//       expiry: data?.expiry ?? "",
//       minimumOrder: String(data?.minimum_order ?? 0),
//       gst: String(data?.gst ?? ""),
//     });
//     this.form.get("brand")!.disable(); // RN locks brand after creation

//     const batches: any[] = data?.variantBatches?.length
//       ? data.variantBatches
//       : data?.batchid
//         ? [data.batchid]
//         : [];
//     if (batches.length) {
//       this.variants.clear();
//       batches.forEach((b) =>
//         this.variants.push(
//           this.newVariant({
//             _id: b?._id ?? null,
//             fromEdit: b?.active !== false,
//             variantName: b?.variantName || b?.productname || "",
//             quantity: String(b?.stock_availability ?? 0),
//             procumentPrice: String(b?.procurement_price ?? ""),
//             sellingPrice: String(b?.seller_price ?? ""),
//             margin: String(b?.margin_percentage ?? 0),
//             discount: String(b?.discount ?? 0),
//             offerPrice: String(b?.offerPrice ?? 0),
//           }),
//         ),
//       );
//       this.variants.controls.forEach(
//         (g, i) => i > 0 && g.patchValue({ expanded: false }),
//       );
//     }

//     this.images = await firstValueFrom(
//       this.api
//         .images(data?._id ?? id, data?.productid ?? "")
//         .pipe(catchError(() => of([]))),
//     );
//   }

//   pickSuggestion(s: { id: string; productName: string }): void {
//     this.showSuggestions = false;
//     this.suggestions = [];
//     this.inventoryId = s.id;
//     this.loading = true;
//     this.loadProduct(s.id)
//       .catch(() => (this.formError = "Couldn’t load that product."))
//       .finally(() => (this.loading = false));
//   }

//   /* ------------------------------ variants ------------------------------ */

//   private newVariant(v: Partial<Record<string, any>> = {}): FormGroup {
//     return this.fb.group({
//       _id: [v["_id"] ?? null],
//       fromEdit: [v["fromEdit"] ?? false],
//       expanded: [true],
//       variantName: [v["variantName"] ?? "", Validators.required],
//       quantity: [v["quantity"] ?? "", Validators.required],
//       procumentPrice: [v["procumentPrice"] ?? "", Validators.required],
//       sellingPrice: [v["sellingPrice"] ?? "", Validators.required],
//       margin: [v["margin"] ?? "0.00"],
//       discount: [v["discount"] ?? "0.00"],
//       offerPrice: [v["offerPrice"] ?? ""],
//     });
//   }

//   addVariant(): void {
//     if (this.hasIncompleteVariant()) {
//       this.variants.markAllAsTouched();
//       this.formError = "Fill in the current variant before adding another.";
//       return;
//     }
//     this.formError = "";
//     this.variants.controls.forEach((g) => g.patchValue({ expanded: false }));
//     this.variants.push(this.newVariant());
//   }

//   removeVariant(i: number): void {
//     if (this.variants.length > 1 && !this.variants.at(i).value.fromEdit)
//       this.variants.removeAt(i);
//   }

//   toggleVariant(g: AbstractControl): void {
//     g.patchValue({ expanded: !g.value.expanded });
//   }

//   /* ------ price logic (ported 1:1 from the RN screen) ------ */

//   private sanitizeDecimal(text: unknown): string {
//     const cleaned = String(text ?? "").replace(/[^0-9.]/g, "");
//     const [head, ...rest] = cleaned.split(".");
//     return rest.length ? `${head}.${rest.join("")}` : head;
//   }
//   private n(v: unknown): number {
//     const x = parseFloat(String(v ?? ""));
//     return isNaN(x) ? 0 : x;
//   }
//   private margin(proc: unknown, sell: unknown): string {
//     const p = this.n(proc);
//     const s = this.n(sell);
//     return p > 0 && s > 0 ? (((s - p) / p) * 100).toFixed(2) : "0.00";
//   }

//   onQuantity(g: AbstractControl, raw: string): void {
//     const digits = raw.replace(/[^0-9]/g, "");
//     g.patchValue({
//       quantity: digits.length > 1 ? digits.replace(/^0+/, "") : digits,
//     });
//   }

//   onProcurement(g: AbstractControl, raw: string): void {
//     const cleaned = this.sanitizeDecimal(raw);
//     let sell = g.value.sellingPrice;
//     if (cleaned && this.n(sell) === 0) sell = cleaned; // auto-fill selling price
//     g.patchValue({
//       procumentPrice: cleaned,
//       sellingPrice: sell,
//       margin: this.margin(cleaned, sell),
//     });
//   }

//   onSelling(g: AbstractControl, raw: string): void {
//     const cleaned = this.sanitizeDecimal(raw);
//     let proc = g.value.procumentPrice;
//     if (cleaned && this.n(proc) === 0) proc = cleaned; // auto-fill procurement price
//     g.patchValue({
//       sellingPrice: cleaned,
//       procumentPrice: proc,
//       margin: this.margin(proc, cleaned),
//     });
//   }

//   onPriceBlur(g: AbstractControl): void {
//     const proc = this.n(g.value.procumentPrice);
//     let sell = this.n(g.value.sellingPrice);
//     if (sell < proc) sell = proc; // selling price can't go below procurement
//     g.patchValue({
//       procumentPrice: proc.toFixed(2),
//       sellingPrice: sell.toFixed(2),
//       margin: this.margin(proc, sell),
//     });
//     this.recalcDiscount(g, g.value.offerPrice);
//   }

//   onOffer(g: AbstractControl, raw: string): void {
//     const cleaned = this.sanitizeDecimal(raw);
//     g.patchValue({ offerPrice: cleaned });
//     this.recalcDiscount(g, cleaned);
//   }

//   onOfferBlur(g: AbstractControl): void {
//     g.patchValue({ offerPrice: this.n(g.value.offerPrice).toFixed(2) });
//   }

//   private recalcDiscount(g: AbstractControl, offer: unknown): void {
//     const sell = this.n(g.value.sellingPrice);
//     const o = this.n(offer);
//     const d = sell > 0 && o > 0 ? ((sell - o) / sell) * 100 : 0;
//     g.patchValue({ discount: d > 0 ? d.toFixed(2) : "0.00" });
//   }

//   private hasIncompleteVariant(): boolean {
//     return this.variants.controls.some((g) => {
//       const v = g.value;
//       return (
//         !String(v.variantName ?? "").trim() ||
//         !String(v.quantity ?? "").trim() ||
//         this.n(v.quantity) === 0 ||
//         !String(v.procumentPrice ?? "").trim() ||
//         !String(v.sellingPrice ?? "").trim()
//       );
//     });
//   }

//   private hasDuplicateVariantName(): boolean {
//     const names = this.variants.controls.map((g) =>
//       String(g.value.variantName ?? "")
//         .trim()
//         .toLowerCase(),
//     );
//     return names.some((n, i) => names.indexOf(n) !== i);
//   }

//   /* ------------------------------ images ------------------------------ */

//   get imagesFull(): boolean {
//     return this.images.length >= MAX_IMAGES;
//   }

//   onFiles(files: FileList | null): void {
//     if (!files) return;
//     this.imageError = "";
//     const room = MAX_IMAGES - this.images.length;
//     if (room <= 0) {
//       this.imageError = `You can upload up to ${MAX_IMAGES} images.`;
//       return;
//     }
//     Array.from(files)
//       .slice(0, room)
//       .forEach((file) => {
//         if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
//           this.imageError = `${file.name}: only JPG and PNG images are allowed.`;
//           return;
//         }
//         if (file.size > MAX_IMAGE_BYTES) {
//           this.imageError = `${file.name} is larger than 2.5 MB.`;
//           return;
//         }
//         const reader = new FileReader();
//         reader.onload = () => {
//           const dataUrl = reader.result as string;
//           this.images = [
//             ...this.images,
//             {
//               uri: dataUrl,
//               name: this.uniqueName(this.api.formatName(file.name)),
//               type: file.type,
//               base64: dataUrl, // backend strips the "data:...;base64," header
//               isDefault:
//                 this.images.length === 0 ||
//                 !this.images.some((i) => i.isDefault),
//             },
//           ];
//         };
//         reader.readAsDataURL(file);
//       });
//   }

//   private uniqueName(name: string): string {
//     if (!this.images.some((i) => i.name === name)) return name;
//     const dot = name.lastIndexOf(".");
//     const stamp = Date.now().toString(36);
//     return dot > 0
//       ? `${name.slice(0, dot)}-${stamp}${name.slice(dot)}`
//       : `${name}-${stamp}`;
//   }

//   onDrop(e: DragEvent): void {
//     e.preventDefault();
//     this.dragging = false;
//     this.onFiles(e.dataTransfer?.files ?? null);
//   }

//   setDefaultImage(i: number): void {
//     this.images = this.images.map((img, idx) => ({
//       ...img,
//       isDefault: idx === i,
//     }));
//   }

//   removeImage(i: number): void {
//     const wasDefault = this.images[i].isDefault;
//     let next = this.images.filter((_, idx) => idx !== i);
//     if (wasDefault && next.length)
//       next = next.map((img, idx) => ({ ...img, isDefault: idx === 0 }));
//     this.images = next;
//   }

//   /* ------------------------------ save ------------------------------ */

//   private validate(): string | null {
//     const f = this.form;
//     f.markAllAsTouched();
//     if (!f.get("productName")!.value?.trim()) return "Enter a product name.";
//     if (!f.get("productDescription")!.value?.trim())
//       return "Add a short description.";
//     if (!f.getRawValue().brand?.trim()) return "Enter the brand name.";
//     if (this.categories.length && !f.get("categoryId")!.value)
//       return "Choose a category.";
//     if (this.images.length && !this.images.some((i) => i.isDefault))
//       return "Pick one default image.";

//     const zero = this.variants.controls.find((g) => !this.n(g.value.quantity));
//     if (zero)
//       return `Quantity can’t be 0 for “${String(zero.value.variantName || "this variant").trim()}”.`;
//     if (this.hasIncompleteVariant())
//       return "Fill in name, quantity, procurement and selling price for every variant.";
//     if (this.hasDuplicateVariantName())
//       return "Two variants share the same name.";
//     return null;
//   }

//   async save(): Promise<void> {
//     if (this.saving) return;
//     const err = this.validate();
//     this.formError = err ?? "";
//     if (err) return;

//     const raw = this.form.getRawValue();
//     const name = String(raw.productName).trim();
//     this.saving = true;

//     try {
//       // only check uniqueness if the name changed (RN behaviour)
//       if (name !== String(this.product?.productname ?? "").trim()) {
//         const ok = await firstValueFrom(this.api.isValidName(name));
//         if (ok === false) {
//           this.formError = "A product with this name already exists.";
//           return;
//         }
//       }

//       const payload: InsertProductsPayload = {
//         _id: this.product?._id,
//         productId: this.product?.productid,
//         companyId: this.api.companyId,
//         companyName: this.api.companyName,
//         productName: name,
//         productDescription: String(raw.productDescription).trim(),
//         categoryId: raw.categoryId || null,
//         quickadd: !!raw.quickadd,
//         unit: String(raw.unit ?? "").trim(),
//         product_type: null,
//         brand: String(raw.brand).trim(),
//         // always an array – the backend iterates it without a null check
//         defaultImage: this.images.map((i) => ({
//           fileName: i.name.trim(),
//           isDefault: i.isDefault,
//           base64: i.base64 || null,
//         })),
//         productfeatureid: null,
//         minimumOrder: parseInt(raw.minimumOrder, 10) || 0,
//         expiry: raw.expiry ?? "",
//         gst: raw.gst ?? "",
//         deals: !!raw.deals,
//         newArrivals: !!raw.newArrivals,
//         variants: raw.variants.map((v: any) => ({
//           _id: typeof v._id === "string" && v._id.length === 24 ? v._id : null,
//           variantName: String(v.variantName ?? "").trim(),
//           procumentPrice: this.n(v.procumentPrice),
//           quantity: parseInt(v.quantity, 10),
//           sellingPrice: this.n(v.sellingPrice),
//           margin: this.n(v.margin),
//           discount: this.n(v.discount),
//           offerPrice: this.n(v.offerPrice),
//         })),
//       };

//       const res = await firstValueFrom(this.api.save(payload));
//       if (res?.success) {
//         this.closed.emit(true);
//       } else {
//         this.formError =
//           res?.message || "Couldn’t save the product. Try again.";
//       }
//     } catch (e: any) {
//       this.formError =
//         e?.error?.message ||
//         e?.message ||
//         "Couldn’t save the product. Try again.";
//     } finally {
//       this.saving = false;
//     }
//   }

//   requestClose(): void {
//     if (this.saving) return;
//     if (this.form.dirty && !confirm("Discard your changes?")) return;
//     this.closed.emit(false);
//   }
// }
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { Subject, firstValueFrom, of } from "rxjs";
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  switchMap,
  takeUntil,
} from "rxjs/operators";
import {
  CategoryOption,
  InsertProductsPayload,
  InventoryService,
  ProductImage,
} from "./inventory.service";
import { CategoryPickerComponent } from "./category-picker.component";

const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024;

@Component({
  selector: "app-product-form-dialog",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CategoryPickerComponent],
  templateUrl: "./product-form-dialog.component.html",
  styleUrls: ["./product-form-dialog.component.scss"],
})
export class ProductFormDialogComponent implements OnInit, OnDestroy {
  /** null → add mode, id → edit mode */
  @Input() inventoryId: string | null = null;
  /** emits true when something was saved so the list can refresh */
  @Output() closed = new EventEmitter<boolean>();

  private fb = inject(FormBuilder);
  private api = inject(InventoryService);
  private destroy$ = new Subject<void>();

  loading = false;
  saving = false;
  formError = "";
  categories: CategoryOption[] = [];
  images: ProductImage[] = [];
  imageError = "";
  dragging = false;
  suggestions: { id: string; productName: string; price: number }[] = [];
  showSuggestions = false;

  /** raw ViewProduct response when editing */
  private product: any = null;

  /**
   * False when the product has a saved image on record but the images could not
   * be loaded. In that case image changes are blocked and `defaultImage: null`
   * is sent, so the backend leaves the saved images alone instead of archiving them.
   */
  private imagesLoaded = true;

  form: FormGroup = this.fb.group({
    productName: ["", [Validators.required]],
    productDescription: ["", [Validators.required]],
    brand: ["", [Validators.required]],
    categoryId: ["", [Validators.required]],
    quickadd: [true],
    deals: [false],
    newArrivals: [false],
    unit: [""],
    expiry: [""],
    minimumOrder: ["0"],
    gst: [""],
    variants: this.fb.array([this.newVariant()]),
  });

  get isEdit(): boolean {
    return !!this.product;
  }
  get title(): string {
    return this.inventoryId || this.isEdit ? "Edit product" : "Add product";
  }
  get variants(): FormArray {
    return this.form.get("variants") as FormArray;
  }
  asGroup(c: AbstractControl): FormGroup {
    return c as FormGroup;
  }

  /* ------------------------------ lifecycle ------------------------------ */

  ngOnInit(): void {
    document.body.style.overflow = "hidden"; // lock page scroll behind the overlay

    // name suggestions (add mode only)
    this.form
      .get("productName")!
      .valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((v: string) =>
          !this.isEdit && (v ?? "").length > 2
            ? this.api.suggest(v).pipe(catchError(() => of([])))
            : of([]),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((s) => (this.suggestions = s));

    this.bootstrap();
  }

  ngOnDestroy(): void {
    document.body.style.overflow = "";
    this.destroy$.next();
    this.destroy$.complete();
  }

  @HostListener("document:keydown.escape")
  onEscape(): void {
    this.requestClose();
  }

  private async bootstrap(): Promise<void> {
    this.loading = true;
    try {
      this.categories = await firstValueFrom(this.api.categories());
      if (this.inventoryId) await this.loadProduct(this.inventoryId);
    } catch (e: any) {
      this.formError =
        e?.error?.msg ||
        e?.message ||
        "Couldn’t load the form. Check your connection and try again.";
    } finally {
      this.loading = false;
    }
  }

  /* ------------------------------ load (edit) ------------------------------ */

  private async loadProduct(id: string): Promise<void> {
    const data = await firstValueFrom(this.api.view(id));
    this.product = data;

    this.form.patchValue({
      productName: data?.productname ?? "",
      productDescription: data?.productDescription ?? "",
      brand: data?.brand ?? "",
      categoryId:
        this.categories.find(
          (c) => String(c.value).trim() === String(data?.categoryId).trim(),
        )?.value ?? "",
      quickadd: data?.quickadd ?? true,
      deals: !!data?.deals,
      newArrivals: !!data?.newArrivals,
      unit: data?.unit ?? "",
      expiry: data?.expiry ?? "",
      minimumOrder: String(data?.minimum_order ?? 0),
      gst: String(data?.gst ?? ""),
    });
    this.form.get("brand")!.disable(); // RN locks brand after creation

    const batches: any[] = data?.variantBatches?.length
      ? data.variantBatches
      : data?.batchid
        ? [data.batchid]
        : [];
    if (batches.length) {
      this.variants.clear();
      batches.forEach((b) =>
        this.variants.push(
          this.newVariant({
            _id: b?._id ?? null,
            fromEdit: b?.active !== false,
            variantName: b?.variantName || b?.productname || "",
            quantity: String(b?.stock_availability ?? 0),
            procumentPrice: String(b?.procurement_price ?? ""),
            sellingPrice: String(b?.seller_price ?? ""),
            margin: String(b?.margin_percentage ?? 0),
            discount: String(b?.discount ?? 0),
            offerPrice: String(b?.offerPrice ?? 0),
          }),
        ),
      );
      this.variants.controls.forEach(
        (g, i) => i > 0 && g.patchValue({ expanded: false }),
      );
    }

    this.imageError = "";
    this.images = await firstValueFrom(
      this.api
        .images(data?._id ?? id, data?.productid ?? "")
        .pipe(catchError(() => of([]))),
    );

    // The product has a default image on record but nothing came back → loading failed.
    this.imagesLoaded = !data?.defaultImage || this.images.length > 0;
    if (!this.imagesLoaded) {
      this.imageError =
        "Couldn’t load the saved images. They’ll be left as they are when you save.";
    }
  }

  pickSuggestion(s: { id: string; productName: string }): void {
    this.showSuggestions = false;
    this.suggestions = [];
    this.inventoryId = s.id;
    this.loading = true;
    this.loadProduct(s.id)
      .catch(() => (this.formError = "Couldn’t load that product."))
      .finally(() => (this.loading = false));
  }

  /* ------------------------------ category picker ------------------------------ */

  onCategoryChange(id: string): void {
    const c = this.form.get("categoryId")!;
    c.setValue(id);
    c.markAsDirty();
  }

  onCategoriesChange(list: CategoryOption[]): void {
    this.categories = list;
  }

  /** Highlight only when the store has categories and none is chosen. */
  get categoryInvalid(): boolean {
    const c = this.form.get("categoryId")!;
    return this.categories.length > 0 && c.touched && c.invalid;
  }

  /* ------------------------------ variants ------------------------------ */

  private newVariant(v: Partial<Record<string, any>> = {}): FormGroup {
    return this.fb.group({
      _id: [v["_id"] ?? null],
      fromEdit: [v["fromEdit"] ?? false],
      expanded: [true],
      variantName: [v["variantName"] ?? "", Validators.required],
      quantity: [v["quantity"] ?? "", Validators.required],
      procumentPrice: [v["procumentPrice"] ?? "", Validators.required],
      sellingPrice: [v["sellingPrice"] ?? "", Validators.required],
      margin: [v["margin"] ?? "0.00"],
      discount: [v["discount"] ?? "0.00"],
      offerPrice: [v["offerPrice"] ?? ""],
    });
  }

  addVariant(): void {
    if (this.hasIncompleteVariant()) {
      this.variants.markAllAsTouched();
      this.formError = "Fill in the current variant before adding another.";
      return;
    }
    this.formError = "";
    this.variants.controls.forEach((g) => g.patchValue({ expanded: false }));
    this.variants.push(this.newVariant());
  }

  removeVariant(i: number): void {
    if (this.variants.length > 1 && !this.variants.at(i).value.fromEdit)
      this.variants.removeAt(i);
  }

  toggleVariant(g: AbstractControl): void {
    g.patchValue({ expanded: !g.value.expanded });
  }

  /* ------ price logic (ported 1:1 from the RN screen) ------ */

  private sanitizeDecimal(text: unknown): string {
    const cleaned = String(text ?? "").replace(/[^0-9.]/g, "");
    const [head, ...rest] = cleaned.split(".");
    return rest.length ? `${head}.${rest.join("")}` : head;
  }
  private n(v: unknown): number {
    const x = parseFloat(String(v ?? ""));
    return isNaN(x) ? 0 : x;
  }
  private margin(proc: unknown, sell: unknown): string {
    const p = this.n(proc);
    const s = this.n(sell);
    return p > 0 && s > 0 ? (((s - p) / p) * 100).toFixed(2) : "0.00";
  }

  onQuantity(g: AbstractControl, raw: string): void {
    const digits = raw.replace(/[^0-9]/g, "");
    g.patchValue({
      quantity: digits.length > 1 ? digits.replace(/^0+/, "") : digits,
    });
  }

  onProcurement(g: AbstractControl, raw: string): void {
    const cleaned = this.sanitizeDecimal(raw);
    let sell = g.value.sellingPrice;
    if (cleaned && this.n(sell) === 0) sell = cleaned; // auto-fill selling price
    g.patchValue({
      procumentPrice: cleaned,
      sellingPrice: sell,
      margin: this.margin(cleaned, sell),
    });
  }

  onSelling(g: AbstractControl, raw: string): void {
    const cleaned = this.sanitizeDecimal(raw);
    let proc = g.value.procumentPrice;
    if (cleaned && this.n(proc) === 0) proc = cleaned; // auto-fill procurement price
    g.patchValue({
      sellingPrice: cleaned,
      procumentPrice: proc,
      margin: this.margin(proc, cleaned),
    });
  }

  onPriceBlur(g: AbstractControl): void {
    const proc = this.n(g.value.procumentPrice);
    let sell = this.n(g.value.sellingPrice);
    if (sell < proc) sell = proc; // selling price can't go below procurement
    g.patchValue({
      procumentPrice: proc.toFixed(2),
      sellingPrice: sell.toFixed(2),
      margin: this.margin(proc, sell),
    });
    this.recalcDiscount(g, g.value.offerPrice);
  }

  onOffer(g: AbstractControl, raw: string): void {
    const cleaned = this.sanitizeDecimal(raw);
    g.patchValue({ offerPrice: cleaned });
    this.recalcDiscount(g, cleaned);
  }

  onOfferBlur(g: AbstractControl): void {
    g.patchValue({ offerPrice: this.n(g.value.offerPrice).toFixed(2) });
  }

  private recalcDiscount(g: AbstractControl, offer: unknown): void {
    const sell = this.n(g.value.sellingPrice);
    const o = this.n(offer);
    const d = sell > 0 && o > 0 ? ((sell - o) / sell) * 100 : 0;
    g.patchValue({ discount: d > 0 ? d.toFixed(2) : "0.00" });
  }

  private hasIncompleteVariant(): boolean {
    return this.variants.controls.some((g) => {
      const v = g.value;
      return (
        !String(v.variantName ?? "").trim() ||
        !String(v.quantity ?? "").trim() ||
        this.n(v.quantity) === 0 ||
        !String(v.procumentPrice ?? "").trim() ||
        !String(v.sellingPrice ?? "").trim()
      );
    });
  }

  private hasDuplicateVariantName(): boolean {
    const names = this.variants.controls.map((g) =>
      String(g.value.variantName ?? "")
        .trim()
        .toLowerCase(),
    );
    return names.some((n, i) => names.indexOf(n) !== i);
  }

  /* ------------------------------ images ------------------------------ */

  get imagesFull(): boolean {
    return this.images.length >= MAX_IMAGES;
  }

  onFiles(files: FileList | null): void {
    if (!files) return;

    // Saved images failed to load: adding new ones would make the backend
    // archive the existing ones, so block image changes until the form is reopened.
    if (!this.imagesLoaded) {
      this.imageError =
        "Saved images couldn’t be loaded, so images can’t be changed right now. Close and reopen this product to try again.";
      return;
    }

    this.imageError = "";
    const room = MAX_IMAGES - this.images.length;
    if (room <= 0) {
      this.imageError = `You can upload up to ${MAX_IMAGES} images.`;
      return;
    }
    Array.from(files)
      .slice(0, room)
      .forEach((file) => {
        if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
          this.imageError = `${file.name}: only JPG and PNG images are allowed.`;
          return;
        }
        if (file.size > MAX_IMAGE_BYTES) {
          this.imageError = `${file.name} is larger than 2.5 MB.`;
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          this.images = [
            ...this.images,
            {
              uri: dataUrl,
              name: this.uniqueName(this.api.formatName(file.name)),
              type: file.type,
              base64: dataUrl, // backend strips the "data:...;base64," header
              isDefault:
                this.images.length === 0 ||
                !this.images.some((i) => i.isDefault),
            },
          ];
        };
        reader.readAsDataURL(file);
      });
  }

  private uniqueName(name: string): string {
    if (!this.images.some((i) => i.name === name)) return name;
    const dot = name.lastIndexOf(".");
    const stamp = Date.now().toString(36);
    return dot > 0
      ? `${name.slice(0, dot)}-${stamp}${name.slice(dot)}`
      : `${name}-${stamp}`;
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragging = false;
    this.onFiles(e.dataTransfer?.files ?? null);
  }

  setDefaultImage(i: number): void {
    this.images = this.images.map((img, idx) => ({
      ...img,
      isDefault: idx === i,
    }));
  }

  removeImage(i: number): void {
    const wasDefault = this.images[i].isDefault;
    let next = this.images.filter((_, idx) => idx !== i);
    if (wasDefault && next.length)
      next = next.map((img, idx) => ({ ...img, isDefault: idx === 0 }));
    this.images = next;
  }

  /* ------------------------------ save ------------------------------ */

  private validate(): string | null {
    const f = this.form;
    f.markAllAsTouched();
    if (!f.get("productName")!.value?.trim()) return "Enter a product name.";
    if (!f.get("productDescription")!.value?.trim())
      return "Add a short description.";
    if (!f.getRawValue().brand?.trim()) return "Enter the brand name.";
    if (this.categories.length && !f.get("categoryId")!.value)
      return "Choose a category.";
    if (this.images.length && !this.images.some((i) => i.isDefault))
      return "Pick one default image.";

    const zero = this.variants.controls.find((g) => !this.n(g.value.quantity));
    if (zero)
      return `Quantity can’t be 0 for “${String(zero.value.variantName || "this variant").trim()}”.`;
    if (this.hasIncompleteVariant())
      return "Fill in name, quantity, procurement and selling price for every variant.";
    if (this.hasDuplicateVariantName())
      return "Two variants share the same name.";
    return null;
  }

  async save(): Promise<void> {
    if (this.saving) return;
    const err = this.validate();
    this.formError = err ?? "";
    if (err) return;

    const raw = this.form.getRawValue();
    const name = String(raw.productName).trim();
    this.saving = true;

    try {
      // only check uniqueness if the name changed (RN behaviour)
      if (name !== String(this.product?.productname ?? "").trim()) {
        const ok = await firstValueFrom(this.api.isValidName(name));
        if (ok === false) {
          this.formError = "A product with this name already exists.";
          return;
        }
      }

      const payload: InsertProductsPayload = {
        _id: this.product?._id,
        productId: this.product?.productid,
        companyId: this.api.companyId,
        companyName: this.api.companyName,
        productName: name,
        productDescription: String(raw.productDescription).trim(),
        categoryId: raw.categoryId || null,
        quickadd: !!raw.quickadd,
        unit: String(raw.unit ?? "").trim(),
        product_type: null,
        brand: String(raw.brand).trim(),
        // null = leave saved images untouched (edit mode, images failed to load)
        defaultImage:
          this.isEdit && !this.imagesLoaded
            ? null
            : this.images.map((i) => ({
                fileName: i.name.trim(),
                isDefault: i.isDefault,
                base64: i.base64 || null,
              })),
        productfeatureid: null,
        minimumOrder: parseInt(raw.minimumOrder, 10) || 0,
        expiry: raw.expiry ?? "",
        gst: raw.gst ?? "",
        deals: !!raw.deals,
        newArrivals: !!raw.newArrivals,
        variants: raw.variants.map((v: any) => ({
          _id: typeof v._id === "string" && v._id.length === 24 ? v._id : null,
          variantName: String(v.variantName ?? "").trim(),
          procumentPrice: this.n(v.procumentPrice),
          quantity: parseInt(v.quantity, 10),
          sellingPrice: this.n(v.sellingPrice),
          margin: this.n(v.margin),
          discount: this.n(v.discount),
          offerPrice: this.n(v.offerPrice),
        })),
      };

      const res = await firstValueFrom(this.api.save(payload));
      if (res?.success) {
        this.closed.emit(true);
      } else {
        this.formError =
          res?.message || "Couldn’t save the product. Try again.";
      }
    } catch (e: any) {
      this.formError =
        e?.error?.message ||
        e?.message ||
        "Couldn’t save the product. Try again.";
    } finally {
      this.saving = false;
    }
  }

  requestClose(): void {
    if (this.saving) return;
    if (this.form.dirty && !confirm("Discard your changes?")) return;
    this.closed.emit(false);
  }
}
