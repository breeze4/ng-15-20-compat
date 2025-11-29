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

### Prerequisites

Before implementing the bundled element architecture, ensure your environment meets these requirements:

**Workspace Structure:**
- `main/` - Nx monorepo with Angular 15 (TypeScript 4.9.0)
- `externals/` - Independent Angular CLI projects with Angular 20 (TypeScript 5.8.0)
- Local npm registry running at `http://0.0.0.0:4873` (for package distribution)

**Required Dependencies (NOT currently installed in main/):**

```bash
cd main
pnpm add -D @nx/angular          # Nx Angular plugin for webpack executor
pnpm add @angular/material@^15.2.0 @angular/cdk@^15.2.0
```

**Note on Build Tools:**
- This guide originally referenced `ngx-build-plus`, which is designed for Angular CLI workspaces with `angular.json`
- The current codebase uses **Nx** with `project.json` format
- We use `@nx/angular:webpack-browser` executor instead (Nx's official webpack customization)
- The `angular.json` examples below are provided for reference; actual implementation uses `project.json`

**Zone.js Version Compatibility:**
- Bundle will use Zone.js 0.12.0 (Angular 15 standard)
- `settings-v20` uses Zone.js 0.15.1 (Angular 20 standard)
- `profile-v20` is zoneless (no Zone.js)
- **Risk**: Untested coexistence of Zone.js 0.12.0 and 0.15.1 in settings-v20
- **Recommendation**: Test thoroughly in settings-v20 environment

**TypeScript Version Split:**
- Bundle builds with TypeScript 4.9.0 (required by Angular 15)
- Consuming apps use TypeScript 5.8.0
- **This is not a problem**: Bundle outputs JavaScript, no TS version dependency at runtime
- Consuming apps load via `<script>` tag, not TypeScript imports

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

**For Nx Workspaces (Recommended for current codebase):**

Create `apps/shared-ui-v15-bundle/project.json`:

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

Create `apps/shared-ui-v15-bundle/webpack.config.js`:

```javascript
module.exports = (config, options) => {
  // Disable code splitting - create single bundle
  config.optimization = {
    ...config.optimization,
    runtimeChunk: false,
    splitChunks: false
  };

  // Force single output file
  config.output = {
    ...config.output,
    filename: 'main.js',
    chunkFilename: 'main.js'
  };

  // Inline polyfills into main bundle
  if (config.entry.polyfills) {
    config.entry.main = [
      ...config.entry.polyfills,
      ...config.entry.main
    ];
    delete config.entry.polyfills;
  }

  return config;
};
```

**For Angular CLI Workspaces (Reference only):**

If using pure Angular CLI with `angular.json` (not applicable to current codebase):

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

With `webpack.config.js`:

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

Create `apps/shared-ui-v15-bundle/src/theme.scss`:

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

Create `apps/shared-ui-v15-bundle/src/scoped-overlay-container.ts`:

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

### Step 5: Create New Bundled Component

**IMPORTANT**: Create a NEW component for bundling. Do NOT modify the existing `ZoneScenario3bComponent` in the shared library - keep it for comparison.

Create `apps/shared-ui-v15-bundle/src/app/zone-scenario-3b-bundled.component.ts`:

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
  imports: [
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule
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
export class ZoneScenario3bBundledComponent {
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

### Step 6: Create Zone-Safe Bootstrap

Create `apps/shared-ui-v15-bundle/src/main.element.ts`:

```typescript
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';
import { OverlayContainer } from '@angular/cdk/overlay';
import { ScopedOverlayContainer } from './scoped-overlay-container';
import { ZoneScenario3bBundledComponent } from './app/zone-scenario-3b-bundled.component';

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
  const element = createCustomElement(ZoneScenario3bBundledComponent, {
    injector: app.injector
  });
  customElements.define('zone-scenario-3b-v15-bundled', element);
})();
```

**Note**: The custom element tag is `zone-scenario-3b-v15-bundled` to distinguish it from any existing elements.

### Step 7: Build the Bundle

```bash
cd main
nx build shared-ui-v15-bundle --configuration=production
# Outputs: dist/apps/shared-ui-v15-bundle/main.js
```

Verify bundle contains:
- Angular v15 runtime
- Zone.js (conditionally loaded)
- Material components and theme
- Component code
- Scoped overlay container

### Step 8: Publish and Consume Bundle

**Option A: npm Package Distribution (RECOMMENDED)**

This approach aligns with the existing `@myorg/shared` library workflow and avoids cross-monorepo file dependencies.

**1. Create package.json for the bundle:**

Create `apps/shared-ui-v15-bundle/package.json`:

```json
{
  "name": "@myorg/shared-ui-v15-bundle",
  "version": "0.0.1",
  "description": "Bundled v15 Angular Elements for v20 host consumption",
  "main": "./main.js",
  "files": [
    "main.js"
  ],
  "publishConfig": {
    "registry": "http://0.0.0.0:4873"
  }
}
```

**2. Configure Nx to copy package.json:**

Update `apps/shared-ui-v15-bundle/project.json` to include package.json in build output:

```json
{
  "targets": {
    "build": {
      "options": {
        "assets": [
          {
            "glob": "package.json",
            "input": "apps/shared-ui-v15-bundle",
            "output": "."
          }
        ]
      }
    }
  }
}
```

**3. Add publish script:**

In `main/package.json`, add:

```json
{
  "scripts": {
    "build:bundle": "nx build shared-ui-v15-bundle --configuration=production",
    "publish:bundle": "cd dist/apps/shared-ui-v15-bundle && pnpm publish --no-git-checks"
  }
}
```

**4. Build and publish:**

```bash
cd main
pnpm build:bundle
pnpm publish:bundle
```

**5. Install in v20 apps:**

```bash
cd externals/profile-v20
pnpm add @myorg/shared-ui-v15-bundle@0.0.1
```

**6. Configure asset copying from node_modules:**

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
                "input": "node_modules/@myorg/shared-ui-v15-bundle",
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

**Why this approach?**
- ✅ Leverages existing local registry infrastructure
- ✅ No cross-monorepo file dependencies
- ✅ Versioned and cacheable
- ✅ Works reliably in CI/CD
- ✅ Angular dev server handles node_modules assets correctly

**Option B: Direct Asset Copy (NOT RECOMMENDED)**

Only use if npm registry is unavailable. This approach has limitations:

```json
{
  "assets": [
    {
      "glob": "main.js",
      "input": "../../main/dist/apps/shared-ui-v15-bundle",
      "output": "assets/legacy/"
    }
  ]
}
```

**Limitations:**
- ❌ No build orchestration - must manually build main/ before externals/
- ❌ Dev server won't watch cross-monorepo files
- ❌ Fragile in CI/CD pipelines
- ❌ No versioning

### Step 9: Load Bundle in v20 Host

**1. Load the script** in `externals/profile-v20/src/index.html`:

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

  <!-- Load v15 bundle - defines <zone-scenario-3b-v15-bundled> -->
  <script src="assets/legacy/main.js"></script>
</body>
</html>
```

**2. Use in component** - `externals/profile-v20/src/app/app.component.ts`:

```typescript
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],  // Required for custom elements
  template: `
    <h1>v20 Host (Zoneless)</h1>

    <!-- v15 bundled component -->
    <zone-scenario-3b-v15-bundled
      (lazyComplete)="onLazyComplete($event)">
    </zone-scenario-3b-v15-bundled>

    <p>Host received lazy event: {{receivedValue}}</p>
  `
})
export class AppComponent {
  receivedValue = 0;

  onLazyComplete(event: CustomEvent<number>) {
    // CustomEvent.detail contains the emitted value
    this.receivedValue = event.detail;
  }
}
```

**Note**: Since the bundled component emits standard CustomEvents, access the value via `event.detail` rather than expecting Angular's EventEmitter format.

### Step 10: Verify Success

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
