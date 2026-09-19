ThemeService usage

- ThemeService is providedIn: 'root'.
- Call `themeService.init()` once on app startup (done in AppComponent.ngOnInit).

API
- `themeService.setTheme('light' | 'dark' | 'system')` — set manual preference (persists in localStorage)
- `themeService.resetToSystem()` — remove manual preference and follow system
- `themeService.getActiveTheme()` — returns 'light' or 'dark'
- `themeService.theme$` — observable of active theme

Example (toggle):

// somewhere in a component
constructor(private theme: ThemeService){}

setDark(){ this.theme.setTheme('dark'); }
setLight(){ this.theme.setTheme('light'); }
setSystem(){ this.theme.setTheme('system'); }
