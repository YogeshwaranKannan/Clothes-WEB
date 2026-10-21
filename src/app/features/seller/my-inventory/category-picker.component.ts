import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  ViewChild,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { firstValueFrom } from "rxjs";
import { CategoryOption, InventoryService } from "./inventory.service";

const MAX_COVER_BYTES = 2.5 * 1024 * 1024;

@Component({
  selector: "app-category-picker",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./category-picker.component.html",
  styleUrls: ["./category-picker.component.scss"],
})
export class CategoryPickerComponent implements OnDestroy {
  @Input() options: CategoryOption[] = [];
  @Input() value: string | null = "";
  @Input() invalid = false;
  @Output() valueChange = new EventEmitter<string>();
  @Output() optionsChange = new EventEmitter<CategoryOption[]>();

  private api = inject(InventoryService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  @ViewChild("searchEl") searchEl?: ElementRef<HTMLInputElement>;

  open = false;
  creating = false;
  query = "";
  active = 0;

  // create form
  newName = "";
  newParent = "";
  newDesc = "";
  newHome = false;
  newCover: File | null = null;
  newCoverUrl: string | null = null;
  saving = false;
  error = "";

  /* ------------------------------ derived ------------------------------ */

  get selected(): CategoryOption | null {
    return this.options.find((o) => o.value === this.value) ?? null;
  }

  get filtered(): CategoryOption[] {
    const q = this.query.trim().toLowerCase();
    return q
      ? this.options.filter((o) => (o.path ?? o.label).toLowerCase().includes(q))
      : this.options;
  }

  get exactMatch(): boolean {
    const q = this.query.trim().toLowerCase();
    return !!q && this.options.some((o) => o.label.toLowerCase() === q);
  }

  get parents(): CategoryOption[] {
    return this.options.filter((o) => !o.depth);
  }

  /* ------------------------------ dropdown ------------------------------ */

  toggle(): void {
    this.open ? this.close() : this.openPanel();
  }

  openPanel(): void {
    this.open = true;
    this.query = "";
    this.active = Math.max(
      this.options.findIndex((o) => o.value === this.value),
      0,
    );
    setTimeout(() => this.searchEl?.nativeElement.focus(), 0);
  }

  close(): void {
    this.open = false;
    this.query = "";
  }

  select(id: string): void {
    this.valueChange.emit(id);
    this.close();
  }

  onQuery(v: string): void {
    this.query = v;
    this.active = 0;
  }

  onSearchKey(e: KeyboardEvent): void {
    const list = this.filtered;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.active = Math.min(this.active + 1, Math.max(list.length - 1, 0));
      this.scrollActive();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this.active = Math.max(this.active - 1, 0);
      this.scrollActive();
    } else if (e.key === "Enter") {
      // Enter must never reach the surrounding product form
      e.preventDefault();
      if (list[this.active]) this.select(list[this.active].value);
      else if (this.query.trim()) this.startCreate();
    }
  }

  private scrollActive(): void {
    setTimeout(() =>
      this.host.nativeElement
        .querySelector(".list li.active")
        ?.scrollIntoView({ block: "nearest" }),
    );
  }

  /** Escape closes the picker first; the drawer only closes when nothing is open. */
  onEscape(e: Event): void {
    if (this.open || this.creating) {
      e.stopPropagation();
      this.open = false;
      if (this.creating) this.cancelCreate();
    }
  }

  @HostListener("document:mousedown", ["$event"])
  onDocMouseDown(e: MouseEvent): void {
    if (this.open && !this.host.nativeElement.contains(e.target as Node)) {
      this.close();
    }
  }

  /* ------------------------------ create ------------------------------ */

  startCreate(): void {
    this.newName = this.query.trim();
    this.newParent = "";
    this.newDesc = "";
    this.newHome = false;
    this.error = "";
    this.clearCover();
    this.open = false;
    this.creating = true;
    setTimeout(
      () => this.host.nativeElement.querySelector<HTMLInputElement>("#newcat-name")?.focus(),
      0,
    );
  }

  cancelCreate(): void {
    if (this.saving) return;
    this.creating = false;
    this.error = "";
    this.clearCover();
  }

  onCover(files: FileList | null): void {
    const f = files?.[0];
    if (!f) return;
    if (!["image/jpeg", "image/jpg", "image/png"].includes(f.type)) {
      this.error = "Cover image must be a JPG or PNG.";
      return;
    }
    if (f.size > MAX_COVER_BYTES) {
      this.error = "Cover image must be under 2.5 MB.";
      return;
    }
    this.error = "";
    this.clearCover();
    this.newCover = f;
    this.newCoverUrl = URL.createObjectURL(f);
  }

  clearCover(): void {
    if (this.newCoverUrl) URL.revokeObjectURL(this.newCoverUrl);
    this.newCover = null;
    this.newCoverUrl = null;
  }

  async create(): Promise<void> {
    if (this.saving) return;
    const name = this.newName.trim().replace(/\s+/g, " ");
    if (name.length < 2) {
      this.error = "Enter a category name (at least 2 characters).";
      return;
    }

    // already exists under the same parent → just use it
    const dupe = this.options.find(
      (o) =>
        o.label.toLowerCase() === name.toLowerCase() &&
        (o.parent ?? "") === (this.newParent || ""),
    );
    if (dupe) {
      this.select(dupe.value);
      this.creating = false;
      this.clearCover();
      return;
    }

    this.saving = true;
    this.error = "";
    try {
      const res = await firstValueFrom(
        this.api.createCategory({
          name,
          parentId: this.newParent || null,
          description: this.newDesc.trim(),
          displayOnHomePage: this.newHome,
          cover: this.newCover,
        }),
      );

      // reload so the new category appears with its real id and place in the tree
      let list = this.options;
      try {
        list = await firstValueFrom(this.api.categories());
        this.optionsChange.emit(list);
      } catch {
        /* fall through to the local fallback below */
      }

      const newId = this.extractId(res?.category);
      const picked =
        (newId && list.find((o) => o.value === newId)) ||
        [...list].reverse().find((o) => o.label.toLowerCase() === name.toLowerCase());

      if (picked) {
        this.select(picked.value);
      } else if (newId) {
        const parent = this.options.find((o) => o.value === this.newParent);
        const opt: CategoryOption = {
          value: newId,
          label: name,
          parent: parent?.value ?? null,
          parentLabel: parent?.label ?? null,
          depth: parent ? (parent.depth ?? 0) + 1 : 0,
          path: parent ? `${parent.path ?? parent.label} › ${name}` : name,
        };
        this.optionsChange.emit([...list, opt]);
        this.select(newId);
      }

      this.creating = false;
      this.clearCover();
    } catch (e: any) {
      this.error =
        e?.error?.msg || e?.message || "Couldn’t create the category. Try again.";
    } finally {
      this.saving = false;
    }
  }

  private extractId(cat: any): string | null {
    const id = cat?._id ?? cat?.id;
    if (!id) return null;
    if (typeof id === "string") return id;
    return id.$oid ?? id.hexString ?? null;
  }

  ngOnDestroy(): void {
    this.clearCover();
  }
}
