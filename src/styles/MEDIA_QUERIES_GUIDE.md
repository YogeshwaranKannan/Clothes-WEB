# SCSS Media Query System - Usage Guide

## Overview
This project uses a centralized, reusable SCSS media query mixin system aligned with Bootstrap 5.x breakpoints. The system follows modern SCSS best practices using `@use` instead of deprecated `@import`.

## Files Structure
```
src/
├── styles/
│   ├── _breakpoints.scss  # Single source of truth for breakpoints
│   └── _media.scss        # Media query mixins
└── styles.scss            # Global styles (imports breakpoints & media)
```

## Breakpoints (Bootstrap 5.x aligned)
| Name | Value  | Description |
|------|--------|-------------|
| xs   | 0      | Extra small devices (portrait phones) |
| sm   | 576px  | Small devices (landscape phones) |
| md   | 768px  | Medium devices (tablets) |
| lg   | 992px  | Large devices (desktops) |
| xl   | 1200px | Extra large devices (large desktops) |
| xxl  | 1400px | Extra extra large devices (larger desktops) |

## Usage in Component SCSS Files

### Import the media mixins
```scss
@use 'media' as media;

// Or use a custom namespace
@use 'media' as bp;
```

### Core Responsive Mixins

#### 1. `up($breakpoint)` - Min-width (mobile-first)
Applies styles for viewports at or above the specified breakpoint.

```scss
@use 'media' as media;

.element {
  // Applies from md (768px) and above
  @include media.up(md) {
    padding: 2rem;
  }
}
```

#### 2. `down($breakpoint)` - Max-width
Applies styles for viewports below the specified breakpoint.

```scss
@use 'media' as media;

.element {
  // Applies below md (< 768px)
  @include media.down(md) {
    padding: 1rem;
  }
}
```

#### 3. `between($min, $max)` - Range
Applies styles for viewports between two breakpoints.

```scss
@use 'media' as media;

.element {
  // Applies between sm (576px) and lg (992px)
  @include media.between(sm, lg) {
    font-size: 1.1rem;
  }
}
```

#### 4. `only($breakpoint)` - Single breakpoint
Applies styles only within a specific breakpoint range.

```scss
@use 'media' as media;

.element {
  // Applies only at md (768px - 991px)
  @include media.only(md) {
    display: flex;
  }
}
```

## Semantic Aliases

These provide more readable alternatives for common use cases:

```scss
@use 'media' as media;

// Mobile devices only (< 576px)
@include media.mobile-only {
  font-size: 0.875rem;
}

// Tablet devices only (576px - 767px)
@include media.tablet-only {
  font-size: 1rem;
}

// Desktop and above (>= 768px)
@include media.desktop {
  font-size: 1.125rem;
}

// Large desktop (>= 992px)
@include media.desktop-large {
  font-size: 1.25rem;
}

// Mobile and tablet combined (< 768px)
@include media.mobile-tablet {
  flex-direction: column;
}
```

## Orientation Mixins

### Basic Orientation
```scss
@use 'media' as media;

// Portrait orientation
@include media.portrait {
  .sidebar {
    width: 100%;
  }
}

// Landscape orientation
@include media.landscape {
  .sidebar {
    width: 300px;
  }
}
```

### Combined with Breakpoints
```scss
@use 'media' as media;

// Portrait on mobile devices and up
@include media.portrait-up(sm) {
  .container {
    max-width: 100%;
  }
}

// Landscape on tablets and up
@include media.landscape-up(md) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

## High-DPI / Retina Support

```scss
@use 'media' as media;

.logo {
  background-image: url('/assets/logo.png');
  
  // 2x density displays (most modern devices)
  @include media.retina {
    background-image: url('/assets/logo@2x.png');
  }
  
  // 3x density (latest mobile devices)
  @include media.retina-3x {
    background-image: url('/assets/logo@3x.png');
  }
}

// High DPI devices (1.5x and above)
@include media.high-dpi {
  .icon {
    background-size: 50%;
  }
}
```

## iOS Safe Area Support (Capacitor)

For apps running in Capacitor (iOS/Android WebView), handle notches and safe areas:

```scss
@use 'media' as media;

// Apply all safe area insets
.app-header {
  @include media.safe-area-padding;
}

// Individual safe area helpers
.fixed-header {
  @include media.safe-area-top;
}

.fixed-footer {
  @include media.safe-area-bottom;
}

.sidebar-left {
  @include media.safe-area-left;
}

.sidebar-right {
  @include media.safe-area-right;
}
```

## Utility Mixins

```scss
@use 'media' as media;

// Hide element at md and above
.mobile-menu {
  @include media.hide-up(md);
}

// Hide element below md
.desktop-menu {
  @include media.hide-down(md);
}

// Show element only at md breakpoint
.tablet-specific {
  @include media.show-only(md);
}
```

## Real-World Examples

### Example 1: Responsive Navigation
```scss
@use 'media' as media;

.navbar {
  // Mobile: vertical layout
  @include media.mobile-only {
    flex-direction: column;
    padding: 0.5rem;
  }
  
  // Tablet: horizontal, compact
  @include media.tablet-only {
    flex-direction: row;
    padding: 1rem;
    font-size: 0.9rem;
  }
  
  // Desktop: full layout
  @include media.desktop {
    flex-direction: row;
    padding: 1.5rem 2rem;
    font-size: 1rem;
  }
}
```

### Example 2: Responsive Grid
```scss
@use 'media' as media;

.product-grid {
  display: grid;
  gap: 1rem;
  
  // Mobile: 1 column
  grid-template-columns: 1fr;
  
  // Tablet: 2 columns
  @include media.up(sm) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  // Desktop: 3 columns
  @include media.up(md) {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }
  
  // Large desktop: 4 columns
  @include media.up(xl) {
    grid-template-columns: repeat(4, 1fr);
    gap: 2rem;
  }
}
```

### Example 3: Typography Scaling
```scss
@use 'media' as media;

h1 {
  font-size: 1.5rem;
  line-height: 1.3;
  
  @include media.up(sm) {
    font-size: 2rem;
  }
  
  @include media.up(md) {
    font-size: 2.5rem;
    line-height: 1.2;
  }
  
  @include media.up(lg) {
    font-size: 3rem;
  }
}
```

### Example 4: Capacitor Mobile App
```scss
@use 'media' as media;

.app-container {
  // Handle iOS notch
  @include media.safe-area-top;
  @include media.safe-area-bottom;
  
  // Different layout in portrait vs landscape
  @include media.portrait {
    .content {
      flex-direction: column;
    }
  }
  
  @include media.landscape {
    .content {
      flex-direction: row;
    }
  }
  
  // Retina optimization
  .app-icon {
    background-image: url('/assets/icon.png');
    
    @include media.retina {
      background-image: url('/assets/icon@2x.png');
    }
  }
}
```

## Best Practices

### 1. Mobile-First Approach
Start with mobile styles and use `up()` mixin to progressively enhance for larger screens:

```scss
@use 'media' as media;

.element {
  // Base mobile styles
  padding: 1rem;
  
  // Enhance for tablet and up
  @include media.up(md) {
    padding: 2rem;
  }
  
  // Enhance for desktop and up
  @include media.up(lg) {
    padding: 3rem;
  }
}
```

### 2. Use Semantic Aliases
For better readability, use semantic aliases when appropriate:

```scss
// ❌ Less clear
@include media.down(md) { ... }

// ✅ More clear
@include media.mobile-tablet { ... }
```

### 3. Avoid Magic Numbers
Never use raw pixel values in media queries. Always use breakpoint names:

```scss
// ❌ Bad - magic number
@media (min-width: 768px) { ... }

// ✅ Good - semantic breakpoint
@include media.up(md) { ... }
```

### 4. Combine with Breakpoint Functions
Access breakpoint values when needed:

```scss
@use 'breakpoints' as *;

.element {
  max-width: breakpoint(lg); // 992px
}
```

## Troubleshooting

### "Undefined mixin" error
Make sure to import the media mixins at the top of your component SCSS file:

```scss
@use 'media' as media;
```

### Mixins not available globally
The `stylePreprocessorOptions` in `angular.json` should include:

```json
"stylePreprocessorOptions": {
  "includePaths": ["src/styles"]
}
```

### Breakpoint not recognized
Check that you're using valid breakpoint names: `xs`, `sm`, `md`, `lg`, `xl`, `xxl`.

## Migration from Old System

If you have existing media queries, migrate them gradually:

```scss
// Old style
@media (min-width: 768px) {
  .element { ... }
}

// New style
@use 'media' as media;

@include media.up(md) {
  .element { ... }
}
```

## Angular 19 Compatibility

This system is fully compatible with:
- ✅ Angular 19 CLI
- ✅ Standalone components
- ✅ Component-scoped styles
- ✅ Web applications
- ✅ Capacitor iOS/Android WebView apps
- ✅ Server-Side Rendering (SSR)

## Support

For issues or questions, refer to:
- Bootstrap 5.x breakpoints: https://getbootstrap.com/docs/5.3/layout/breakpoints/
- Sass @use rule: https://sass-lang.com/documentation/at-rules/use
- Angular styles: https://angular.dev/guide/components/styling
