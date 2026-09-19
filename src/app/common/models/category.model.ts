// =============================================================================
// CATEGORY MODELS
// =============================================================================

// ── Raw API / JSON shape ──────────────────────────────────────────────────────

export interface Category {
  id: string;
  category: string;
  Description?: string; // matches JSON key exactly (capital D)
  children?: Category[];
  isDisplayOnHome: boolean;
}

export interface CategoryResponse {
  responseHeader: {
    action: string;
    seller_id: number;
    status: string;
  };
  categories: Category[];
}

// ── Service / component internals ─────────────────────────────────────────────

export interface CategoryItem {
  id: string;
  category: string;
  coverImage: string;
  isDisplayOnHome: boolean;
}

export interface GroupedCategory {
  id: string;
  category: string;
  description: string;
  descriptionBlock: DescriptionBlock;
  items: CategoryItem[];
  isDisplayOnHome: boolean;
}

// ── Description block (structured vs plain) ───────────────────────────────────

export interface ParsedDescription {
  structured: true;
  header1: string;
  header2: string;
  items: string[];
}

export interface PlainDescription {
  structured: false;
  text: string;
}

export type DescriptionBlock = ParsedDescription | PlainDescription;

// ── Navigation state ──────────────────────────────────────────────────────────
//
// Passed via router.navigate({ state: { category: CategoryNavState } })
// when the user clicks a category or sub-category in the navbar.
//
// Rules:
//   • Parent click  → parentCategory: null, children: cat.children
//   • Child click   → parentCategory: { id, category, parentCategory: null },
//                     children: undefined
//
// Kept SEPARATE from Category intentionally — CategoryNavState is a trimmed,
// immutable snapshot for routing only.  It carries children[] ONLY for parent
// clicks so product-list can expand to child ids without a second HTTP call.
//
// Import in both navbar.component.ts and product-list.component.ts:
//   import { CategoryNavState } from '../../models/category.model';

export interface CategoryNavState {
  /** CategoryId of the clicked item (child or parent). */
  id: string;
  /** Display name of the clicked item. */
  category: string;
  /**
   * Set when a child sub-category was clicked.
   * Null when a top-level parent category was clicked.
   */
  parentCategory: {
    id: string;
    category: string;
    parentCategory: null; // always null — we only go one level up
  } | null;
  /**
   * Direct children of the clicked PARENT category.
   * Populated by navigateCategory() so product-list can derive child ids
   * immediately from history.state — no extra HTTP call needed.
   * Undefined when a child category was clicked.
   */
  children?: Category[];
}
