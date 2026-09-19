import { Injectable } from "@angular/core";

// ─────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Every body class that represents a colour theme.
 * 'theme-primary' is the default — no extra class is added for it.
 */
export type AppTheme =
  | "theme-primary"
  | "theme-red"
  | "theme-green"
  | "theme-dark"
  | "theme-purple"
  | "theme-orange"
  | "theme-teal"
  | "theme-rose"
  | "theme-slate"
  | "theme-midnight";

export interface ThemeMeta {
  id: AppTheme;
  label: string;
  /** Hex colour shown as the swatch in the header picker */
  color: string;
  /** Colour of the small dot indicator on the palette icon */
  dotColor: string;
  /** Optional marketing tagline (tooltips, settings pages) */
  tagline?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME CATALOGUE
// ─────────────────────────────────────────────────────────────────────────────

export const THEMES: ThemeMeta[] = [
  {
    id: "theme-green",
    label: "Green",
    color: "#16a34a",
    dotColor: "#16a34a",
    tagline: "Fresh & natural",
  },
  {
    id: "theme-primary",
    label: "Blue",
    color: "#0b5ed7",
    dotColor: "#0b5ed7",
    tagline: "Default",
  },

  //{ id: 'theme-midnight', label: 'Midnight', color: '#050505', dotColor: '#475569', tagline: 'Deep dark immersive'},
  // Uncomment to activate additional themes:
  // { id: 'theme-red',    label: 'Red',    color: '#dc2626', dotColor: '#dc2626', tagline: 'Bold & energetic'  },
  //{ id: 'theme-purple', label: 'Purple', color: '#c6adf0', dotColor: '#c6adf0', tagline: 'Modern SaaS'       },
  {
    id: "theme-orange",
    label: "Orange",
    color: "#ea580c",
    dotColor: "#ea580c",
    tagline: "Marketplace style",
  },
  // { id: 'theme-teal',   label: 'Teal',   color: '#0f766e', dotColor: '#0f766e', tagline: 'Fintech style'     },
  // { id: 'theme-rose',   label: 'Rose',   color: '#e11d48', dotColor: '#e11d48', tagline: 'Elegant editorial' },
  // { id: 'theme-slate',  label: 'Slate',  color: '#475569', dotColor: '#475569', tagline: 'Corporate minimal' },
];

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const ALL_THEME_CLASSES = THEMES.map((t) => t.id).filter(
  (id) => id !== "theme-primary",
);
const THEME_STORAGE_KEY = "app-theme";
const DARK_STORAGE_KEY = "app-dark-mode";
const DARK_CLASS = "dark-mode";
const DEFAULT_THEME: AppTheme = "theme-green";

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
//
// Responsibilities are split into two clearly labelled sections:
//
//   ── SECTION A: Colour theme  (which palette is active)
//   ── SECTION B: Dark mode     (light vs dark surface)
//
// They share one private helper (_syncBodyClasses) so that every write
// goes through a single code path and the two concerns can never
// accidentally clobber each other.
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: "root" })
export class ThemeService {
  // ── Private state ───────────────────────────────────────────────────────────

  private _activeTheme: AppTheme = DEFAULT_THEME;
  private _isDark = false;

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION A — Colour theme
  // ════════════════════════════════════════════════════════════════════════════

  /** All available themes (drive the palette picker UI). */
  get themes(): ThemeMeta[] {
    return THEMES;
  }

  /** Currently active colour-theme id. */
  get activeTheme(): AppTheme {
    return this._activeTheme;
  }

  /**
   * Restore the persisted colour theme.
   * Call once from AppComponent.ngOnInit(), before the first render.
   */

  // initAppTheme(): void {
  //   const saved = localStorage.getItem(THEME_STORAGE_KEY) as AppTheme | null;
  //   const valid = [...ALL_THEME_CLASSES, "theme-primary"];
  //   const theme =
  //     saved && valid.includes(saved) ? (saved as AppTheme) : DEFAULT_THEME;
  //   this._activeTheme = theme;
  //   this._syncBodyClasses();
  // }

  initAppTheme(): void {
    const theme: AppTheme = "theme-green";

    this._activeTheme = theme;

    // optional: keep storage updated
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    this._syncBodyClasses();
  }

  /**
   * Switch to a different colour theme immediately and persist the choice.
   * Dark-mode state is untouched.
   */
  setTheme(theme: AppTheme): void {
    if (theme === this._activeTheme) return;
    this._activeTheme = theme;
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    this._syncBodyClasses();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SECTION B — Dark mode
  // ════════════════════════════════════════════════════════════════════════════

  /** Whether dark mode is currently active. */
  get isDark(): boolean {
    return this._isDark;
  }

  /**
   * Restore the persisted dark-mode preference.
   * Call once from AppComponent.ngOnInit(), right after initAppTheme().
   * Falls back to the OS prefers-color-scheme when nothing is stored.
   */
  initDarkMode(): void {
    const saved = localStorage.getItem(DARK_STORAGE_KEY);
    const osPrefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
    this._isDark = saved !== null ? saved === "true" : osPrefers;
    this._syncBodyClasses();
  }

  /**
   * Flip dark mode on or off.
   * Colour theme is untouched.
   */
  toggleDarkMode(): void {
    this.setDarkMode(!this._isDark);
  }

  /**
   * Set dark mode to an explicit state (e.g. from a settings page slider).
   */
  setDarkMode(dark: boolean): void {
    if (dark === this._isDark) return;
    this._isDark = dark;
    localStorage.setItem(DARK_STORAGE_KEY, String(dark));
    this._syncBodyClasses();
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PRIVATE — single body-class writer
  //
  // Both colour theme and dark mode funnel through here, guaranteeing that
  // they are always applied together and can never overwrite each other.
  // ════════════════════════════════════════════════════════════════════════════

  private _syncBodyClasses(): void {
    // 1. Strip all colour-theme classes
    ALL_THEME_CLASSES.forEach((cls) => document.body.classList.remove(cls));

    // 2. Re-apply the active colour theme (nothing added for 'theme-primary')
    if (this._activeTheme !== "theme-primary") {
      document.body.classList.add(this._activeTheme);
    }

    // 3. Toggle the dark-mode class independently
    document.body.classList.toggle(DARK_CLASS, this._isDark);
  }
}
