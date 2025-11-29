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

**Zone.js:** Bundle uses 0.12.0. `settings-v20` uses 0.15.1. `profile-v20` is zoneless.
- Zone.js does not support multiple instances - first loaded wins globally
- Risk: Patching zoneless host breaks native API assumptions. Test thoroughly.

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
    const polyfills = Array.isArray(config.entry.polyfills) ? config.entry.polyfills : [config.entry.polyfills];
    config.entry.main = [...polyfills, ...config.entry.main];
    delete config.entry.polyfills;
  }

  // Force CSS inline - critical for single-file bundle
  config.module.rules.forEach(rule => {
    if (rule.use && Array.isArray(rule.use)) {
      rule.use = rule.use.map(loader => {
        if (typeof loader === 'object' && loader.loader?.includes('MiniCssExtractPlugin')) {
          return { loader: 'style-loader' };
        }
        return loader;
      });
    }
  });

  return config;
};
```

### Step 3: Material Theme

`apps/shared-ui-v15-bundle/src/theme.scss`:

```scss
@use '@angular/material' as mat;
@import url('https://fonts.googleapis.com/icon?family=Material+Icons');

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

Test complex Material features: overlays (Dialog/Select/DatePicker/Autocomplete/Tooltip), data rendering (Table/Paginator/Sort), global services (Snackbar).

`apps/shared-ui-v15-bundle/src/app/zone-scenario-3b-bundled.component.ts`:

```typescript
import { Component, ViewEncapsulation, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-zone-scenario-3b-bundled',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatAutocompleteModule, MatTooltipModule,
    MatDialogModule, MatSnackBarModule, MatTableModule, MatPaginatorModule, MatSortModule
  ],
  encapsulation: ViewEncapsulation.Emulated,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="v15-legacy-root">
      <h3>v15 Material Bundle Test</h3>

      <!-- Overlay: Select -->
      <mat-form-field>
        <mat-label>Select</mat-label>
        <mat-select [(value)]="selectedValue">
          <mat-option value="opt1">Option 1</mat-option>
          <mat-option value="opt2">Option 2</mat-option>
        </mat-select>
      </mat-form-field>

      <!-- Overlay: DatePicker -->
      <mat-form-field>
        <mat-label>Date</mat-label>
        <input matInput [matDatepicker]="picker">
        <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
        <mat-datepicker #picker></mat-datepicker>
      </mat-form-field>

      <!-- Overlay: Autocomplete (filtered) -->
      <mat-form-field>
        <mat-label>Autocomplete</mat-label>
        <input matInput [formControl]="autoControl" [matAutocomplete]="auto">
        <mat-autocomplete #auto="matAutocomplete">
          <mat-option *ngFor="let opt of filteredOptions" [value]="opt">{{opt}}</mat-option>
        </mat-autocomplete>
      </mat-form-field>

      <!-- Overlay: Tooltip -->
      <button mat-button matTooltip="v15 tooltip">Hover Tooltip</button>

      <!-- Overlay: Dialog -->
      <button mat-raised-button (click)="openDialog()">Open Dialog</button>

      <!-- Global Service: Snackbar -->
      <button mat-button (click)="openSnackbar()">Snackbar</button>

      <!-- Data Rendering: Table with Sort/Paginator -->
      <table mat-table [dataSource]="tableData" matSort>
        <ng-container matColumnDef="id">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>ID</th>
          <td mat-cell *matCellDef="let row">{{row.id}}</td>
        </ng-container>
        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
          <td mat-cell *matCellDef="let row">{{row.name}}</td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="['id', 'name']"></tr>
        <tr mat-row *matRowDef="let row; columns: ['id', 'name']"></tr>
      </table>
      <mat-paginator [pageSizeOptions]="[5, 10]" showFirstLastButtons></mat-paginator>

      <!-- Zone test -->
      <p>Counter: {{lazyCount}}</p>
      <button mat-button (click)="startLazy()">Start Lazy</button>
    </div>
  `
})
export class ZoneScenario3bBundledComponent {
  selectedValue = 'opt1';
  lazyCount = 0;
  autoControl = new FormControl('');
  filteredOptions = ['Apple', 'Banana', 'Cherry'];
  tableData = [{id: 1, name: 'Item 1'}, {id: 2, name: 'Item 2'}];
  @Output() lazyComplete = new EventEmitter<number>();

  constructor(private dialog: MatDialog, private snackBar: MatSnackBar) {
    this.autoControl.valueChanges.subscribe(val => {
      this.filteredOptions = ['Apple', 'Banana', 'Cherry'].filter(o =>
        o.toLowerCase().includes((val || '').toLowerCase())
      );
    });
  }

  openDialog() { this.dialog.open(ExampleDialogComponent); }
  openSnackbar() { this.snackBar.open('v15 Snackbar', 'Close', {duration: 3000}); }

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
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2>v15 Dialog</h2>
    <p>Tests overlay scoping</p>
    <button mat-button mat-dialog-close>Close</button>
  `
})
export class ExampleDialogComponent {}
```

**Components tested:**
- **Overlays:** Dialog, Select, DatePicker, Autocomplete, Tooltip (all use CDK Overlay)
- **Global Services:** Snackbar (uses global overlay container)
- **Complex Rendering:** Table with Sort/Paginator (tests large DOM updates)
- **Form Controls:** Autocomplete filtering (tests reactive forms + Zone.js)

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
# Verify: dist/apps/shared-ui-v15-bundle should contain ONLY main.js (no styles.css)
ls dist/apps/shared-ui-v15-bundle
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

**Critical:** Do NOT add `dependencies` or `peerDependencies`. Angular v15 is bundled in main.js. Adding deps here causes v20 host to install conflicting Angular versions.

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

Build and publish:

```bash
cd main
pnpm build:bundle
# Optional: Version filename for cache busting (mv main.js main.v0.0.1.js, update package.json "main")
pnpm publish:bundle
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
- Bundle loads before host renders (no flash of undefined element)
- All Material overlays open and styled: Dialog, Select, DatePicker, Autocomplete, Tooltip, Snackbar
- Overlays have `.v15-legacy-root` class (inspect in DevTools)
- Material icons render correctly (not blank squares)
- Table sorting/pagination works
- Autocomplete filtering works (reactive forms + Zone.js)
- Lazy counter updates (Zone.js change detection)
- Host receives `event.detail` from bundled component
- No Zone.js console errors
- No style leakage (v15 styles don't bleed into v20 host)
- Network tab shows only main.js (no separate styles.css)

**Debug:**
- **No styles:** CSS not inlined. Check webpack style-loader config.
- **Icons missing:** Material Icons font not loaded. Check theme.scss.
- **Overlays unstyled:** Check `ScopedOverlayContainer`, verify `.v15-legacy-root` in theme.
- **Zone conflict:** Check console. If zoneless host affected, Zone.js globally patched APIs.
- **Table/forms broken:** Check reactive forms imports, verify Zone triggers change detection.
