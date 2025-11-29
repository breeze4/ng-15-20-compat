# Bundled Angular Elements Architecture

## Problem

Loading v15 components in v20 runtime fails: Zone.js incompatibility, JIT compilation errors, incompatible DI systems.

## Solution

Bundle v15 runtime inside component artifact. v20 host treats as generic custom element, not Angular component.

## Build Process

**Build Step**: Use custom builder (ngx-build-plus or Esbuild script) to compile v15 component as standalone application
- Component is AOT compiled with v15 compiler
- Bundle includes complete v15 runtime (core, common, platform-browser)
- Entry point calls `createCustomElement` and `customElements.define` on file load
- Component uses its own internal injector and Zone.js instance

**Artifact Structure**:
```
dist/shared-ui-bundle/
  loader.js          # Side-effect script that registers custom element
  runtime.js         # v15 Angular runtime
  polyfills.js       # Zone.js and other polyfills
  main.js            # Component code
```

## Consumption Pattern

**v20 Host Integration**:
- Import bundle as side-effect script (like jQuery plugin or YouTube embed)
- Treat as non-Angular element using `CUSTOM_ELEMENTS_SCHEMA`
- Pass data via standard HTML attributes/properties
- Receive events via standard CustomEvent dispatches

Pseudocode:
```
// v20 app bootstrap
import '@myorg/shared-ui-bundle/loader.js'  // Defines <my-widget>

// v20 component template
<my-widget
  [attr.user-id]="userId"
  (data-changed)="handleChange($event)">
</my-widget>
```

## Architecture Decisions

Organized by retrofit difficulty.

### Cannot Defer (Breaking Changes)

**Communication**: Attributes/properties in, CustomEvents out. Cannot use DI or Angular Router across boundary.

**Encapsulation**: Choose ShadowDOM vs Light DOM per component at creation. **For Material components: must use Light DOM** (ViewEncapsulation.Emulated) - Material overlays break in ShadowDOM.

**Build Pipeline**: ngx-build-plus with single-bundle output. Changing artifact structure breaks consumer imports.

### Should Not Defer (Add Now, Painful Later)

**Zone.js Detection**: Check `window.Zone` before loading. Prevents conflicts if host adds Zone later. Zero cost upfront.

**Versioning**: Use versioned artifact names (`widget.v1.2.3.js`). Without this, no cache invalidation mechanism.

**Error Reporting**: Define how bundle reports errors to host (CustomEvent vs console).

### Can Defer (Iterative)

**Component Selection**: Choose which components to bundle vs rewrite. Can change per component.

**Bundle Size**: Measure after implementation (~100-150kb per bundle). Establish thresholds.

**Optimizations**: Tree-shaking, runtime sharing. Add incrementally if needed.

## Implementation Guide

### Overview

This guide demonstrates bundling a v15 Angular component with Material dependencies into a self-contained JavaScript bundle that runs its own isolated Angular runtime.

**Test case**: Port `ZoneScenario3bComponent` with Angular Material Dialog/Select/DatePicker to v20 host using bundled element pattern.

**Key constraint**: Cannot use ShadowDOM encapsulation because Material overlays break with Shadow boundaries.

When building new versions of existing components, when considering a new way of implementing it, make sure to add it as a separate component and leave the code wired in to enable comparison of approaches directly and switch between them or view them simulataneously.

### Step 1: Create Dedicated Build Project

Create a new application project for components that will be bundled:

```bash
# In main/ workspace
nx generate @nx/angular:application shared-ui-v15
```

Install build tooling and Material:

```bash
cd main
pnpm add -D ngx-build-plus
pnpm add @angular/material@^15.0.0 @angular/cdk@^15.0.0
```

### Step 2: Configure Bundle Builder

Update `angular.json` for the `shared-ui-v15` project:

```json
{
  "projects": {
    "shared-ui-v15": {
      "architect": {
        "build": {
          "builder": "ngx-build-plus:browser",
          "options": {
            "outputPath": "dist/shared-ui-v15",
            "main": "apps/shared-ui-v15/src/main.element.ts",
            "extraWebpackConfig": "apps/shared-ui-v15/webpack.config.js",
            "singleBundle": true,
            "outputHashing": "none",
            "keepPolyfills": true
          }
        }
      }
    }
  }
}
```

Create `apps/shared-ui-v15/webpack.config.js`:

```javascript
module.exports = {
  output: {
    filename: 'main.js',
    library: 'v15Bundle',
    libraryTarget: 'umd'
  }
};
```

### Step 3: Material Theme Configuration

Create `apps/shared-ui-v15/src/theme.scss`:

```scss
@use '@angular/material' as mat;

// Define v15 theme
$v15-primary: mat.define-palette(mat.$indigo-palette);
$v15-accent: mat.define-palette(mat.$pink-palette);
$v15-theme: mat.define-light-theme((
  color: (
    primary: $v15-primary,
    accent: $v15-accent,
  )
));

// CRITICAL: Scope all Material styles inside .v15-legacy-root
// This prevents conflicts with v20 host's Material theme
.v15-legacy-root {
  @include mat.core();
  @include mat.all-component-themes($v15-theme);

  // Reset box sizing
  box-sizing: border-box;
  *, *::before, *::after {
    box-sizing: inherit;
  }
}
```

### Step 4: Solve Material Overlay Scoping

Material components (Dialog, Select, DatePicker) render overlays outside the component DOM tree. Create a custom overlay container to scope these:

Create `apps/shared-ui-v15/src/scoped-overlay-container.ts`:

```typescript
import { OverlayContainer } from '@angular/cdk/overlay';
import { Injectable } from '@angular/core';

/**
 * Custom overlay container that applies .v15-legacy-root class
 * so Material overlays inherit the scoped theme
 */
@Injectable()
export class ScopedOverlayContainer extends OverlayContainer {
  protected override _createContainer(): void {
    super._createContainer();
    this._containerElement.classList.add('v15-legacy-root');
  }
}
```

### Step 5: Create Zone-Safe Bootstrap

Create `apps/shared-ui-v15/src/main.element.ts`:

```typescript
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { OverlayContainer } from '@angular/cdk/overlay';
import { ScopedOverlayContainer } from './scoped-overlay-container';
import { ZoneScenario3bComponent } from './app/zone-scenario-3b.component';

// Import theme (will be bundled)
import './theme.scss';

/**
 * Self-bootstrapping entry point for bundled v15 component
 * - Checks for existing Zone.js before loading
 * - Creates isolated Angular runtime
 * - Registers custom element
 */
(async () => {
  // 1. Conditional Zone Loading - prevents conflicts with v20 host
  if (!(window as any).Zone) {
    await import('zone.js');
  }

  // 2. Bootstrap internal v15 runtime
  const app = await createApplication({
    providers: [
      // Use scoped overlay container for Material
      { provide: OverlayContainer, useClass: ScopedOverlayContainer }
    ]
  });

  // 3. Register custom element
  const element = createCustomElement(ZoneScenario3bComponent, {
    injector: app.injector
  });
  customElements.define('zone-scenario-3b-v15', element);
})();
```

### Step 6: Configure Component for Isolation

Update `ZoneScenario3bComponent`:

```typescript
import { Component, ViewEncapsulation, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-zone-scenario-3b',
  standalone: true,
  imports: [
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule
  ],
  // CRITICAL: Use Emulated, NOT ShadowDom (Material overlays break)
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- CRITICAL: Wrap entire template in .v15-legacy-root -->
    <div class="v15-legacy-root">
      <h3>v15 Bundled Component with Material</h3>

      <!-- Material Select - tests overlay positioning -->
      <mat-form-field>
        <mat-label>Select Option</mat-label>
        <mat-select [(value)]="selectedValue">
          <mat-option value="option1">Option 1</mat-option>
          <mat-option value="option2">Option 2</mat-option>
        </mat-select>
      </mat-form-field>

      <!-- Material DatePicker - tests portal rendering -->
      <mat-form-field>
        <mat-label>Choose Date</mat-label>
        <input matInput [matDatepicker]="picker">
        <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>

      <!-- Material Dialog - tests overlay scoping -->
      <button mat-raised-button (click)="openDialog()">Open Dialog</button>

      <!-- Zone-dependent async test -->
      <p>Lazy counter (no manual render): {{lazyCount}}</p>
      <button mat-button (click)="startLazy()">Start Lazy</button>
    </div>
  `
})
export class ZoneScenario3bComponent {
  selectedValue = 'option1';
  lazyCount = 0;

  @Output() lazyComplete = new EventEmitter<number>();

  constructor(private dialog: MatDialog) {}

  openDialog() {
    this.dialog.open(ExampleDialogComponent);
  }

  startLazy() {
    // Zone-dependent: relies on Zone.js to trigger change detection
    setTimeout(() => {
      this.lazyCount++;
      this.lazyComplete.emit(this.lazyCount);
    }, 1000);
  }
}

@Component({
  selector: 'app-example-dialog',
  standalone: true,
  template: '<h2>Dialog from v15 Bundle</h2><p>Overlay should be styled correctly</p>'
})
export class ExampleDialogComponent {}
```

### Step 7: Build the Bundle

```bash
cd main
nx build shared-ui-v15
# Outputs: dist/shared-ui-v15/main.js
```

Verify bundle contains:
- Angular v15 runtime
- Zone.js (conditionally loaded)
- Material components and theme
- Component code
- Scoped overlay container

### Step 8: Consume in v20 Host

**Option A: Copy to assets**

Update `externals/profile-v20/angular.json`:

```json
{
  "projects": {
    "profile-v20": {
      "architect": {
        "build": {
          "options": {
            "assets": [
              {
                "glob": "main.js",
                "input": "../../main/dist/shared-ui-v15",
                "output": "assets/legacy/"
              }
            ]
          }
        }
      }
    }
  }
}
```

**Option B: Load from local registry**

Publish bundle as npm package and load from `node_modules`.

**Load the script** in `externals/profile-v20/src/index.html`:

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Profile v20</title>
  <base href="/">
</head>
<body>
  <app-root></app-root>

  <!-- Load v15 bundle - defines <zone-scenario-3b-v15> -->
  <script src="assets/legacy/main.js"></script>
</body>
</html>
```

**Use in component** - `externals/profile-v20/src/app/app.component.ts`:

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],  // Required for custom elements
  template: `
    <h1>v20 Host (Zoneless)</h1>

    <!-- v15 bundled component -->
    <zone-scenario-3b-v15
      (lazyComplete)="onLazyComplete($event)">
    </zone-scenario-3b-v15>

    <p>Host received lazy event: {{receivedValue}}</p>
  `
})
export class AppComponent {
  receivedValue = 0;

  onLazyComplete(value: number) {
    this.receivedValue = value;
  }
}
```

### Step 9: Verify Success

**Start v20 host:**
```bash
cd externals/profile-v20
pnpm start
```

**Test checklist:**
- [ ] Component renders with Material styling
- [ ] MatSelect overlay opens and is styled correctly
- [ ] MatDatepicker overlay opens and is styled correctly
- [ ] MatDialog opens and is styled correctly (not affected by v20 styles)
- [ ] Overlays have `.v15-legacy-root` class applied
- [ ] Lazy counter updates (proves Zone.js works in bundle)
- [ ] Host receives `lazyComplete` event
- [ ] No console errors about Zone.js conflicts
- [ ] v20 host's Material components (if any) are not affected by v15 theme

### Troubleshooting

**Overlay styles wrong:**
- Verify `ScopedOverlayContainer` adds `.v15-legacy-root` class
- Check browser DevTools: overlay container should have class applied
- Confirm `theme.scss` scopes all Material styles inside `.v15-legacy-root`

**Zone.js conflict:**
- Check bundle's Zone detection: should see "Zone already loaded" in console if v20 has Zone
- Verify v20 loads before bundle script in `index.html`

**Component doesn't update on async:**
- Verify Zone.js is loaded (check `window.Zone` in console)
- Component must use `ViewEncapsulation.Emulated` or `None`, not `ShadowDom`

**Material overlays invisible:**
- Check z-index conflicts between v15 and v20 styles
- Verify overlay container exists in DOM and has content
