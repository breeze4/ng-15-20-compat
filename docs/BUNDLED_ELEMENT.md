# Bundled Angular Elements Architecture

## Problem

v15 components fail in v20 runtime: Zone.js incompatibility, JIT compilation errors, incompatible DI.

## Solution

Bundle v15 runtime inside component. v20 host treats as generic custom element.

## Build Process

Compile v15 component as standalone application with custom webpack config:
- AOT compiled with v15 compiler
- Bundle includes complete v15 runtime + Zone.js
- Entry point calls `createCustomElement` and `customElements.define`
- Component uses isolated injector and Zone.js instance

Output: `main.js` (single bundle)

## Consumption Pattern

```typescript
// v20 app - load as side-effect script
import '@myorg/shared-ui-bundle/loader.js'

// v20 template - treat as custom element
<my-widget
  [attr.user-id]="userId"
  (data-changed)="handleChange($event)">
</my-widget>
```

Use `CUSTOM_ELEMENTS_SCHEMA`. Pass data via attributes/properties. Receive events via CustomEvents.

## Architecture Decisions

### Cannot Defer

**Communication**: Attributes/properties in, CustomEvents out. No DI or Router across boundary.

**Encapsulation**: **Material components require Light DOM** (ViewEncapsulation.Emulated) - overlays break in ShadowDOM.

**Build Pipeline**: Single-bundle output. Structure changes break consumers.

### Should Not Defer

**Zone.js Detection**: Check `window.Zone` before loading.

**Versioning**: Version artifact names (`widget.v1.2.3.js`).

**Error Reporting**: Define error communication pattern.

### Can Defer

**Component Selection**, **Bundle Size**, **Optimizations**: Add incrementally.

## Implementation Guide

**Test case**: Bundle `ZoneScenario3bComponent` (Material Dialog/Select/DatePicker) for v20 host.

**Key constraint**: Material requires Light DOM (ViewEncapsulation.Emulated).

**Rule**: Create new components for bundling. Keep originals for comparison.

### Prerequisites

**Workspace:**
- `main/` - Nx + Angular 15 (TS 4.9)
- `externals/` - Angular 20 (TS 5.8)
- Local npm registry: `http://0.0.0.0:4873`

**Dependencies (not installed):**
```bash
cd main
pnpm add -D @nx/angular
pnpm add @angular/material@^15.2.0 @angular/cdk@^15.2.0
```

**Build:** Uses `@nx/angular:webpack-browser` (Nx), not `ngx-build-plus` (Angular CLI).

**Zone.js:** Bundle uses 0.12.0. `settings-v20` uses 0.15.1. `profile-v20` is zoneless. Test coexistence in settings-v20.

### Step 1: Create Bundle Project

```bash
cd main
nx generate @nx/angular:application shared-ui-v15-bundle
pnpm add @angular/material@^15.0.0 @angular/cdk@^15.0.0
```

### Step 2: Configure Builder

`apps/shared-ui-v15-bundle/project.json`:

```json
{
  "name": "shared-ui-v15-bundle",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "sourceRoot": "apps/shared-ui-v15-bundle/src",
  "targets": {
    "build": {
      "executor": "@nx/angular:webpack-browser",
      "options": {
        "outputPath": "dist/apps/shared-ui-v15-bundle",
        "index": false,
        "main": "apps/shared-ui-v15-bundle/src/main.element.ts",
        "tsConfig": "apps/shared-ui-v15-bundle/tsconfig.app.json",
        "polyfills": ["zone.js"],
        "scripts": [],
        "styles": ["apps/shared-ui-v15-bundle/src/theme.scss"],
        "customWebpackConfig": {
          "path": "apps/shared-ui-v15-bundle/webpack.config.js"
        }
      },
      "configurations": {
        "production": {
          "optimization": true,
          "outputHashing": "none",
          "sourceMap": false,
          "namedChunks": false,
          "extractLicenses": false,
          "vendorChunk": false,
          "buildOptimizer": true
        }
      }
    }
  }
}
```

`apps/shared-ui-v15-bundle/webpack.config.js`:

```javascript
module.exports = (config) => {
  config.optimization = {
    ...config.optimization,
    runtimeChunk: false,
    splitChunks: false
  };
  config.output = {
    ...config.output,
    filename: 'main.js',
    chunkFilename: 'main.js'
  };
  if (config.entry.polyfills) {
    config.entry.main = [...config.entry.polyfills, ...config.entry.main];
    delete config.entry.polyfills;
  }
  return config;
};
```

### Step 3: Material Theme

`apps/shared-ui-v15-bundle/src/theme.scss`:

```scss
@use '@angular/material' as mat;

$v15-primary: mat.define-palette(mat.$indigo-palette);
$v15-accent: mat.define-palette(mat.$pink-palette);
$v15-theme: mat.define-light-theme((
  color: (primary: $v15-primary, accent: $v15-accent)
));

// Scope all Material styles to prevent conflicts with v20 host
.v15-legacy-root {
  @include mat.core();
  @include mat.all-component-themes($v15-theme);
  box-sizing: border-box;
  *, *::before, *::after { box-sizing: inherit; }
}
```

### Step 4: Material Overlay Scoping

`apps/shared-ui-v15-bundle/src/scoped-overlay-container.ts`:

```typescript
import { OverlayContainer } from '@angular/cdk/overlay';
import { Injectable } from '@angular/core';

@Injectable()
export class ScopedOverlayContainer extends OverlayContainer {
  protected override _createContainer(): void {
    super._createContainer();
    this._containerElement.classList.add('v15-legacy-root');
  }
}
```

### Step 5: Create Bundled Component

`apps/shared-ui-v15-bundle/src/app/zone-scenario-3b-bundled.component.ts`:

```typescript
import { Component, ViewEncapsulation, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-zone-scenario-3b-bundled',
  standalone: true,
  imports: [MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  encapsulation: ViewEncapsulation.Emulated, // Required for Material overlays
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="v15-legacy-root">
      <h3>v15 Bundled Component with Material</h3>
      <mat-form-field>
        <mat-label>Select Option</mat-label>
        <mat-select [(value)]="selectedValue">
          <mat-option value="option1">Option 1</mat-option>
          <mat-option value="option2">Option 2</mat-option>
        </mat-select>
      </mat-form-field>
      <mat-form-field>
        <mat-label>Choose Date</mat-label>
        <input matInput [matDatepicker]="picker">
        <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>
      <button mat-raised-button (click)="openDialog()">Open Dialog</button>
      <p>Lazy counter: {{lazyCount}}</p>
      <button mat-button (click)="startLazy()">Start Lazy</button>
    </div>
  `
})
export class ZoneScenario3bBundledComponent {
  selectedValue = 'option1';
  lazyCount = 0;
  @Output() lazyComplete = new EventEmitter<number>();

  constructor(private dialog: MatDialog) {}

  openDialog() { this.dialog.open(ExampleDialogComponent); }

  startLazy() {
    setTimeout(() => {
      this.lazyCount++;
      this.lazyComplete.emit(this.lazyCount);
    }, 1000);
  }
}

@Component({
  selector: 'app-example-dialog',
  standalone: true,
  template: '<h2>Dialog from v15 Bundle</h2><p>Overlay styled correctly</p>'
})
export class ExampleDialogComponent {}
```

### Step 6: Bootstrap

`apps/shared-ui-v15-bundle/src/main.element.ts`:

```typescript
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { OverlayContainer } from '@angular/cdk/overlay';
import { ScopedOverlayContainer } from './scoped-overlay-container';
import { ZoneScenario3bBundledComponent } from './app/zone-scenario-3b-bundled.component';
import './theme.scss';

(async () => {
  if (!(window as any).Zone) {
    await import('zone.js');
  }

  const app = await createApplication({
    providers: [{ provide: OverlayContainer, useClass: ScopedOverlayContainer }]
  });

  const element = createCustomElement(ZoneScenario3bBundledComponent, { injector: app.injector });
  customElements.define('zone-scenario-3b-v15-bundled', element);
})();
```

### Step 7: Build

```bash
cd main
nx build shared-ui-v15-bundle --configuration=production
# Outputs: dist/apps/shared-ui-v15-bundle/main.js
```

### Step 8: Publish and Consume

`apps/shared-ui-v15-bundle/package.json`:

```json
{
  "name": "@myorg/shared-ui-v15-bundle",
  "version": "0.0.1",
  "main": "./main.js",
  "files": ["main.js"],
  "publishConfig": { "registry": "http://0.0.0.0:4873" }
}
```

Add to `apps/shared-ui-v15-bundle/project.json`:

```json
{
  "targets": {
    "build": {
      "options": {
        "assets": [
          { "glob": "package.json", "input": "apps/shared-ui-v15-bundle", "output": "." }
        ]
      }
    }
  }
}
```

Add to `main/package.json`:

```json
{
  "scripts": {
    "build:bundle": "nx build shared-ui-v15-bundle --configuration=production",
    "publish:bundle": "cd dist/apps/shared-ui-v15-bundle && pnpm publish --no-git-checks"
  }
}
```

Publish:

```bash
cd main
pnpm build:bundle && pnpm publish:bundle
```

Install in v20:

```bash
cd externals/profile-v20
pnpm add @myorg/shared-ui-v15-bundle@0.0.1
```

Configure asset in `externals/profile-v20/angular.json`:

```json
{
  "projects": {
    "profile-v20": {
      "architect": {
        "build": {
          "options": {
            "assets": [
              { "glob": "main.js", "input": "node_modules/@myorg/shared-ui-v15-bundle", "output": "assets/legacy/" }
            ]
          }
        }
      }
    }
  }
}
```

### Step 9: Load in v20 Host

`externals/profile-v20/src/index.html`:

```html
<body>
  <app-root></app-root>
  <script src="assets/legacy/main.js"></script>
</body>
```

`externals/profile-v20/src/app/app.component.ts`:

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <h1>v20 Host</h1>
    <zone-scenario-3b-v15-bundled (lazyComplete)="onLazyComplete($event)">
    </zone-scenario-3b-v15-bundled>
    <p>Received: {{receivedValue}}</p>
  `
})
export class AppComponent {
  receivedValue = 0;
  onLazyComplete(event: CustomEvent<number>) {
    this.receivedValue = event.detail; // CustomEvent format
  }
}
```

### Step 10: Verify

```bash
cd externals/profile-v20 && pnpm start
```

**Test:**
- Material overlays open and styled correctly
- Overlays have `.v15-legacy-root` class
- Lazy counter updates (Zone.js working)
- Host receives events
- No Zone.js conflicts
- No style conflicts

**Debug:**
- Overlay styles wrong: Check `ScopedOverlayContainer` adds class, verify `theme.scss` scoping
- Zone conflict: Verify v20 loads before bundle
- Async not updating: Check `window.Zone`, use ViewEncapsulation.Emulated
- Overlays invisible: Check z-index conflicts
