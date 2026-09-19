// app.component.ts  — ADD these changes to your existing AppComponent
// ─────────────────────────────────────────────────────────────────────────────
// 1. Import ThemeService
// 2. Inject it in the constructor
// 3. Call themeService.init() inside ngOnInit()
//
// Everything else in your AppComponent stays exactly as it is.
// ─────────────────────────────────────────────────────────────────────────────

import { Component, OnInit, inject } from '@angular/core';
import { ThemeService } from './core/services/theme.service';
// ... keep all your existing imports

@Component({
  selector: 'app-root',
  // ... your existing component metadata unchanged
})
export class AppComponent implements OnInit {
  // ... your existing properties unchanged

  private themeService = inject(ThemeService);   // ← ADD

  ngOnInit(): void {
    this.themeService.init();   // ← ADD — restores saved theme from localStorage
    // ... rest of your existing ngOnInit logic unchanged
  }
}
