# Architecture Specification: Angular Cross-Version Component Sharing

**Version:** 1.0
**Last Updated:** 2025-11-30
**Status:** Production-Ready with ng-packagr Migration

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Workspace Structure](#workspace-structure)
3. [Shared Component Architecture](#shared-component-architecture)
4. [Build & Compilation Strategy](#build--compilation-strategy)
5. [Cross-Version Compatibility](#cross-version-compatibility)
6. [Zone.js Scenarios & Testing](#zonejs-scenarios--testing)
7. [Publishing & Consumption](#publishing--consumption)
8. [Migration to ng-packagr](#migration-to-ng-packagr)
9. [Alternative Patterns](#alternative-patterns)
10. [Decision Log](#decision-log)

---

## 1. Project Overview

### Purpose

This project demonstrates and validates strategies for sharing Angular components across major version boundaries (Angular 15 → Angular 20), specifically addressing:

- **Cross-version compatibility** between Angular 15 and 20
- **Zone.js vs Zoneless** change detection models
- **Material component** integration challenges
- **Build and packaging** strategies for reusable components

### Key Challenges

1. **Incompatible runtimes**: Angular 15 and 20 use different internal component representations (Ivy metadata formats)
2. **Zone.js breaking changes**: Zone.js 0.12.x (v15) vs 0.15.x (v20) with fundamentally different zoneless model in v20
3. **Material overlay issues**: Material overlays break with ShadowDOM encapsulation in custom elements
4. **JIT compilation availability**: Angular 20 production builds tree-shake the JIT compiler by default

### Success Criteria

- ✅ Components built in Angular 15 runtime work in Angular 20 hosts
- ✅ Components work in both zone and zoneless Angular 20 applications
- ✅ Industry-standard Angular Package Format (APF) compliance
- ✅ Type-safe integration for consuming applications
- ✅ Maintainable build pipeline with reasonable build times
- ✅ Template syntax compatible with both v15 and v20 compilers (syntax audit required)
- ✅ Peer dependency configuration allows installation in v20 hosts without `--force`

---

## 2. Workspace Structure

### Repository Layout

```
ng-15-20-compat/
├── main/                           # Primary workspace (Angular 15)
│   ├── apps/
│   │   └── ng15-zone/             # Angular 15 test host (with Zone.js)
│   ├── libs/
│   │   └── shared/                # Shared component library (THE CORE)
│   │       ├── src/
│   │       │   ├── components/
│   │       │   │   ├── navbar.element.ts           # Vanilla Web Component
│   │       │   │   ├── auth-modal.element.ts       # Vanilla Web Component
│   │       │   │   └── zone-scenarios/             # Angular components
│   │       │   │       ├── zone-scenario-1.component.ts
│   │       │   │       ├── zone-scenario-2.component.ts
│   │       │   │       ├── zone-scenario-3a.component.ts
│   │       │   │       ├── zone-scenario-3b.component.ts
│   │       │   │       └── register.ts             # Custom element registration
│   │       │   ├── services/
│   │       │   │   └── auth-channel.ts             # Cross-app communication
│   │       │   └── index.ts                        # Public API
│   │       ├── ng-package.json                     # ng-packagr config
│   │       ├── project.json                        # Nx build config
│   │       ├── package.json                        # Package metadata
│   │       └── tsconfig.lib.json                   # TypeScript + Angular config
│   ├── dist/
│   │   └── libs/shared/                            # Build output (APF)
│   └── package.json
│
├── externals/                      # External consuming apps (Angular 20)
│   ├── ng20-zone/                 # Angular 20 with Zone.js
│   │   ├── src/
│   │   │   └── main.ts            # Imports @myorg/shared components
│   │   ├── package.json           # Depends on @myorg/shared@^0.0.8
│   │   └── angular.json
│   └── ng20-zoneless/             # Angular 20 zoneless
│       ├── src/
│       │   └── main.ts
│       ├── package.json
│       └── angular.json
│
├── docs/
│   ├── ARCHITECTURE.md            # This file
│   ├── SPEC.md                    # Original specification
│   ├── SHARED_COMPONENTS.md       # Component sharing strategies
│   ├── BUNDLED_ELEMENT.md         # Alternative bundled approach
│   └── TASKS.md                   # Implementation tasks
│
└── verdaccio/                      # Local npm registry
    └── config.yaml
```

### Key Directories

| Path | Purpose | Build Tool | Output |
|------|---------|-----------|---------|
| `main/libs/shared/` | Shared component library source | ng-packagr | APF-compliant package |
| `main/apps/ng15-zone/` | Angular 15 test host | @angular-devkit/build-angular | Application bundle |
| `externals/ng20-zone/` | Angular 20 zone test consumer | @angular-devkit/build-angular | Application bundle |
| `externals/ng20-zoneless/` | Angular 20 zoneless test consumer | @angular-devkit/build-angular | Application bundle |
| `main/dist/libs/shared/` | Published package artifact | - | npm package |

---

## 3. Shared Component Architecture

### Component Types

The shared library uses a **hybrid architecture** with three distinct component patterns:

#### 3.1 Vanilla Web Components

**Examples:** `navbar.element.ts`, `auth-modal.element.ts`

**Architecture:**
```typescript
export class NavbarElement extends HTMLElement {
  private shadow: ShadowRoot;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  private render(): void {
    this.shadow.innerHTML = `
      <style>/* Inline styles */</style>
      <nav><!-- Template --></nav>
    `;
  }
}

customElements.define('shared-navbar', NavbarElement);
```

**Characteristics:**
- Pure JavaScript, no Angular dependencies
- ShadowDOM encapsulation
- Lifecycle managed by browser's Custom Elements API
- No change detection (manual re-render via `render()`)
- Smallest bundle impact (~5KB per component)

**Use Cases:**
- Simple presentational UI (navigation, badges, cards)
- Static content with minimal interactivity
- Components with no dependency injection needs

**Consumption:**
```typescript
// main.ts - Side-effect import
import '@myorg/shared/components/navbar.element';

// app.component.ts
@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
```

```html
<!-- template -->
<shared-navbar></shared-navbar>
```

---

#### 3.2 Angular Components (Wrapped as Custom Elements)

**Examples:** `zone-scenario-1.component.ts`, `zone-scenario-2.component.ts`, `zone-scenario-3a.component.ts`, `zone-scenario-3b.component.ts`

**Architecture:**
```typescript
// Component definition
@Component({
  selector: 'zone-scenario-3a',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="scenario">
      <h3>Scenario 3a: Well-Behaved Async</h3>
      <button (click)="startAsync()">Start Async</button>
      <p>Counter: <strong>{{ counter }}</strong></p>
    </div>
  `
})
export class ZoneScenario3aComponent {
  private cdr = inject(ChangeDetectorRef);

  @Output() asyncComplete = new EventEmitter<number>();
  counter = 0;

  startAsync(): void {
    setTimeout(() => {
      this.counter++;
      this.cdr.markForCheck();  // Explicit CD trigger
      this.asyncComplete.emit(this.counter);
    }, 1000);
  }
}

// Registration helper
export function registerZoneScenarios(injector: Injector): void {
  const elements = [
    { component: ZoneScenario3aComponent, name: 'zone-scenario-3a' },
    // ... more components
  ];

  for (const { component, name } of elements) {
    if (!customElements.get(name)) {
      const element = createCustomElement(component, { injector });
      customElements.define(name, element);
    }
  }
}
```

**Characteristics:**
- Full Angular components with lifecycle hooks, DI, change detection
- Wrapped with `@angular/elements` `createCustomElement()`
- Registered as custom elements at runtime
- Access to host injector (can inject host services)
- Bundle impact: ~15KB per component + shared Angular runtime

**Use Cases:**
- Reactive components with Angular change detection
- Components needing dependency injection
- Form controls, data-bound UI
- Components without Material overlay dependencies

**Consumption:**
```typescript
// main.ts
import { registerZoneScenarios } from '@myorg/shared';

bootstrapApplication(AppComponent, {
  providers: [/* ... */]
}).then(appRef => {
  registerZoneScenarios(appRef.injector);  // Pass host injector
});
```

```html
<!-- template -->
<zone-scenario-3a
  (asyncComplete)="handleComplete($event)">
</zone-scenario-3a>
```

**Communication Model:**
- **Inputs:** Mapped to element attributes via `@angular/elements`
- **Outputs:** Dispatched as native CustomEvents
- **Services:** Can inject from host injector (shared DI context)

---

#### 3.2.1 Styling Constraints

**🔴 CRITICAL ISSUE:** `ViewEncapsulation.ShadowDom` breaks Material component styling.

**The Problem:**

ShadowDOM creates an isolated style boundary. Global styles (Material theme CSS, Bootstrap, Tailwind) **cannot penetrate** the shadow boundary:

```typescript
@Component({
  selector: 'my-material-form',
  standalone: true,
  imports: [MatButtonModule, MatInputModule],
  encapsulation: ViewEncapsulation.ShadowDom,  // ❌ BREAKS MATERIAL
  template: `
    <mat-form-field>
      <input matInput placeholder="Name">
    </mat-form-field>
    <button mat-raised-button>Submit</button>
  `
})
export class MyMaterialFormComponent {}
```

**Result:** Inputs and buttons render **unstyled** (no Material theming).

---

**The Fix: Use ViewEncapsulation.Emulated for Material Components**

```typescript
@Component({
  selector: 'my-material-form',
  standalone: true,
  imports: [MatButtonModule, MatInputModule],
  encapsulation: ViewEncapsulation.Emulated,  // ✅ WORKS WITH MATERIAL
  template: `
    <mat-form-field>
      <input matInput placeholder="Name">
    </mat-form-field>
    <button mat-raised-button>Submit</button>
  `
})
export class MyMaterialFormComponent {}
```

**Important Notes:**
- `Emulated` generates scoped CSS attributes (`_ngcontent-*`)
- Material styles can now reach component elements
- Material **overlays** (dialogs, menus) may still have issues (see Section 9.1 for bundled element approach with scoped overlay container)

---

**Decision Matrix: Which Encapsulation to Use?**

| Component Type | Encapsulation | Reason |
|---------------|---------------|--------|
| Vanilla Web Component (no Angular) | ShadowDom | True isolation, no framework overhead |
| Simple Angular component (no Material) | ShadowDom | Isolation + explicit styles |
| Material component (buttons, inputs) | Emulated | Global theme styles required |
| Material with overlays (dialogs, menus) | Emulated + Scoped Container | See Section 9.1 |
| Form controls | Emulated | Often use Material internally |

---

**Alternative: Inject Styles into ShadowRoot (Advanced)**

If you must use ShadowDom with Material:

```typescript
@Component({
  selector: 'my-shadow-material',
  standalone: true,
  encapsulation: ViewEncapsulation.ShadowDom,
  template: `...`
})
export class MyShadowMaterialComponent implements OnInit {
  private elementRef = inject(ElementRef);

  ngOnInit(): void {
    // Inject Material theme CSS into ShadowRoot
    const shadowRoot = this.elementRef.nativeElement.shadowRoot;
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = 'path/to/material-theme.css';
    shadowRoot.appendChild(styleLink);
  }
}
```

**Trade-offs:**
- ✅ Preserves ShadowDom isolation
- ❌ Requires hosting theme CSS separately
- ❌ Doubles CSS payload (theme loaded in host + shadow)
- ❌ Complex to maintain

**Recommendation:** Use `Emulated` for Material components unless isolation is absolutely required.

---

#### 3.3 Shared Services

**Example:** `auth-channel.ts`

**Architecture:**
```typescript
/**
 * Cross-application message bus using BroadcastChannel API
 */
export class AuthChannel {
  private channel: BroadcastChannel;

  constructor(channelName: string = 'auth-events') {
    this.channel = new BroadcastChannel(channelName);
  }

  sendAuthEvent(event: AuthEvent): void {
    this.channel.postMessage(event);
  }

  onAuthEvent(handler: (event: AuthEvent) => void): void {
    this.channel.addEventListener('message', (e) => handler(e.data));
  }
}
```

**Characteristics:**
- Framework-agnostic (vanilla TypeScript)
- Uses browser APIs (BroadcastChannel, localStorage, etc.)
- No Angular dependencies
- Can be used in both Angular and non-Angular contexts

**Use Cases:**
- Cross-tab communication
- Shared state management
- Event bus between host apps

---

### Component Interaction Patterns

```
┌─────────────────────────────────────────────────────────────┐
│                     Host Application                         │
│                  (Angular 20 - Zoneless)                    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AppComponent                                         │  │
│  │                                                        │  │
│  │  ┌─────────────────┐    ┌────────────────────────┐  │  │
│  │  │ Vanilla Web     │    │ Angular-Wrapped        │  │  │
│  │  │ Component       │    │ Custom Element         │  │  │
│  │  │                 │    │                        │  │  │
│  │  │ <shared-navbar> │    │ <zone-scenario-3a>     │  │  │
│  │  │                 │    │                        │  │  │
│  │  │ ┌─────────────┐ │    │ ┌────────────────────┐ │  │  │
│  │  │ │  ShadowDOM  │ │    │ │  ShadowDOM         │ │  │  │
│  │  │ │             │ │    │ │                    │ │  │  │
│  │  │ │  No CD      │ │    │ │  Angular CD        │ │  │  │
│  │  │ │  Manual     │ │    │ │  inject(CDR)       │ │  │  │
│  │  │ │  render()   │ │    │ │  markForCheck()    │ │  │  │
│  │  │ └─────────────┘ │    │ └────────────────────┘ │  │  │
│  │  └─────────────────┘    │          ▲             │  │  │
│  │                          │          │             │  │  │
│  │                          │     Host Injector      │  │  │
│  │                          │     (Passed via        │  │  │
│  │                          │   createCustomElement) │  │  │
│  │                          └────────────────────────┘  │  │
│  │                                                        │  │
│  │  Communication:                                       │  │
│  │  - Attributes (in)                                    │  │
│  │  - CustomEvents (out)                                 │  │
│  │  - AuthChannel (cross-component)                      │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Build & Compilation Strategy

### 4.1 Current Build Process (ng-packagr with Partial Compilation)

**Tool:** ng-packagr (Angular Package Format library builder)
**Compilation Mode:** Partial (Industry Standard)

**Build Pipeline:**

```
┌──────────────────────────────────────────────────────────────┐
│  Source (TypeScript + Angular Components)                    │
│  libs/shared/src/                                            │
└─────────────────┬────────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────────┐
│  ng-packagr with Angular Compiler (ngc)                      │
│  - compilationMode: "partial"                                │
│  - Compiles decorators to ɵɵngDeclare* metadata             │
│  - Template stays as string (NOT compiled to instructions)   │
│  - Generates ESM2022 + FESM2022 outputs                      │
└─────────────────┬────────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────────┐
│  dist/libs/shared/ (Angular Package Format)                  │
│                                                               │
│  ├── esm2022/                     # Per-file ESM modules     │
│  │   ├── index.mjs                                           │
│  │   ├── components/                                         │
│  │   │   └── zone-scenario-3a.component.mjs                  │
│  │   └── ...                                                 │
│  │                                                            │
│  ├── fesm2022/                    # Flat (single-file) ESM   │
│  │   └── myorg-shared.mjs                                    │
│  │                                                            │
│  ├── package.json                 # With "exports" field     │
│  ├── index.d.ts                   # Public API types         │
│  └── README.md                                               │
└─────────────────┬────────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────────┐
│  Published to npm registry (verdaccio:4873)                  │
│  @myorg/shared@0.0.8                                         │
└──────────────────────────────────────────────────────────────┘
```

**Key Configuration Files:**

**ng-package.json:**
```json
{
  "$schema": "../../node_modules/ng-packagr/ng-package.schema.json",
  "dest": "../../dist/libs/shared",
  "lib": {
    "entryFile": "src/index.ts"
  }
}
```

**tsconfig.lib.json:**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/libs/shared",
    "declaration": true,
    "types": []
  },
  "angularCompilerOptions": {
    "compilationMode": "partial",      // KEY: Partial compilation
    "enableIvy": true,
    "generateDeepReexports": false
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.spec.ts"]
}
```

**project.json:**
```json
{
  "targets": {
    "build": {
      "executor": "@nx/angular:package",    // Uses ng-packagr
      "outputs": ["{workspaceRoot}/dist/libs/shared"],
      "options": {
        "project": "libs/shared/ng-package.json"
      },
      "configurations": {
        "production": {
          "tsConfig": "libs/shared/tsconfig.lib.json"
        }
      }
    }
  }
}
```

---

### 4.2 Compiled Output Analysis

**Before Partial Compilation (Old @nx/js:tsc approach):**

```javascript
// zone-scenario-3a.component.js (Runtime decorators)
let ZoneScenario3aComponent = class ZoneScenario3aComponent {
    constructor(cdr) {
        this.cdr = cdr;
        this.asyncComplete = new EventEmitter();
        this.counter = 0;
    }
    startAsync() { /* ... */ }
};
__decorate([
    Output(),
    __metadata("design:type", Object)
], ZoneScenario3aComponent.prototype, "asyncComplete", void 0);
ZoneScenario3aComponent = __decorate([
    Component({
        selector: 'zone-scenario-3a',
        standalone: true,
        template: `<div class="scenario">...</div>`,  // Full template
        styles: [`...`],
        encapsulation: ViewEncapsulation.ShadowDom,
        changeDetection: ChangeDetectionStrategy.OnPush
    }),
    __param(0, Inject(ChangeDetectorRef)),
    __metadata("design:paramtypes", [ChangeDetectorRef])
], ZoneScenario3aComponent);
```

**Problem:** The `@Component()` decorator is still present, requiring JIT compilation at runtime. Angular 20 zoneless hosts can't reliably process Angular 15's decorator metadata.

---

**After Partial Compilation (Current ng-packagr approach):**

```javascript
// zone-scenario-3a.component.mjs (Partial metadata)
import * as i0 from '@angular/core';

export class ZoneScenario3aComponent {
    constructor() {
        this.cdr = inject(ChangeDetectorRef);
        this.asyncComplete = new EventEmitter();
        this.counter = 0;
    }
    startAsync() { /* ... */ }
}

// Factory function for creating component instances
ZoneScenario3aComponent.ɵfac = function ZoneScenario3aComponent_Factory(t) {
    return new (t || ZoneScenario3aComponent)();
};

// Partial component definition (NOT fully compiled)
ZoneScenario3aComponent.ɵcmp = ɵɵngDeclareComponent({
    version: "15.2.0",                        // Compilation version
    type: ZoneScenario3aComponent,
    selector: "zone-scenario-3a",
    outputs: { asyncComplete: "asyncComplete" },
    ngImport: i0,
    template: `
    <div class="scenario">
      <h3>Scenario 3a: Well-Behaved Async</h3>
      <button (click)="startAsync()">Start Async</button>
      <p>Counter: <strong>{{ counter }}</strong></p>
    </div>
  `,                                          // RAW template string!
    isInline: true,
    styles: [`...`],
    dependencies: [],
    encapsulation: ViewEncapsulation.ShadowDom,
    changeDetection: ChangeDetectionStrategy.OnPush
});
```

**Key Differences:**

| Aspect | Runtime Decorators | Partial Compilation |
|--------|-------------------|---------------------|
| Decorators | `__decorate([Component({...})])` | `ɵɵngDeclareComponent({...})` |
| Template | String in decorator | String in metadata |
| Compilation | Requires JIT at runtime | Deferred to consuming app build |
| Cross-version | Breaks (v15 → v20) | Works (linker handles version) |
| inject() | Not used | Used (`inject(ChangeDetectorRef)`) |

---

### 4.3 Consuming Application Build Process

**Angular 20 App Build with Partial Library:**

```
┌──────────────────────────────────────────────────────────────┐
│  Angular 20 App Source + @myorg/shared (partial)             │
└─────────────────┬────────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────────┐
│  Angular 20 Application Builder                              │
│  (@angular-devkit/build-angular:application)                 │
│                                                               │
│  Step 1: Angular Linker                                      │
│  - Finds ɵɵngDeclareComponent in node_modules/@myorg/shared │
│  - Reads template string + metadata                          │
│  - Compiles template to Angular 20 Ivy instructions          │
│  - Generates ɵɵdefineComponent for v20 runtime               │
│                                                               │
│  Step 2: esbuild Bundler                                     │
│  - Tree-shakes unused components                             │
│  - Bundles app code + linked shared components               │
│  - Minifies JavaScript                                       │
└─────────────────┬────────────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────────────┐
│  dist/ng20-zone/browser/                                     │
│  - main.js  (Angular 20 runtime + app + shared components)  │
│  - All components use Angular 20 instructions                │
└──────────────────────────────────────────────────────────────┘
```

**Result:** Same partially-compiled library works in both Angular 15 and Angular 20 because each consuming app's linker compiles the template to its own version's instruction format.

---

## 5. Cross-Version Compatibility

### 5.1 Compatibility Matrix

| Source Version | Consumer Version | Build Mode | Zone.js | Status | Notes |
|---------------|-----------------|------------|---------|--------|-------|
| Angular 15 | Angular 15 | Partial | 0.12.0 | ✅ Works | Same version, trivial |
| Angular 15 | Angular 20 Zone | Partial | 0.15.0 | ✅ Works | Linker handles version diff |
| Angular 15 | Angular 20 Zoneless | Partial | None | ✅ Works* | *Well-behaved components only |
| Angular 15 | Angular 19 | Partial | 0.14.x | ✅ Works | Intermediate version |
| Angular 15 | Angular 20 | Runtime Decorators | 0.15.0 | ❌ Breaks | JIT compilation issues |

**Legend:**
- ✅ **Works:** Components load and function correctly
- ⚠️ **Partial:** Some scenarios work, others fail
- ❌ **Breaks:** Runtime errors, JIT compilation failures

---

### 5.2 Partial Compilation: How It Works

**The Problem:**

Angular 15 compiler generates Ivy instructions specific to v15:
```javascript
// Fully compiled by Angular 15
function ZoneScenario_Template(rf, ctx) {
  if (rf & 1) {
    ɵɵelementStart(0, 'button', 0);   // v15 instruction format
    ɵɵlistener('click', function() { return ctx.startAsync(); });
    ɵɵtext(1, 'Start');
    ɵɵelementEnd();
  }
}
```

Angular 20 runtime expects v20 instructions (different internal format). Passing v15 instructions to v20 runtime causes incompatibility.

**The Solution: Partial Compilation**

Library publishes **uncompiled template**:
```javascript
// Partial metadata
ɵɵngDeclareComponent({
  version: "15.2.0",
  type: ZoneScenario3aComponent,
  template: `<button (click)="startAsync()">Start</button>`,  // String!
  // ... metadata
})
```

**Consuming app's linker** compiles template during build:

Angular 15 app:
```javascript
// Angular 15 linker reads partial metadata
// Compiles template to v15 instructions
function ZoneScenario_Template_V15(rf, ctx) {
  // v15-specific instructions
}
```

Angular 20 app:
```javascript
// Angular 20 linker reads SAME partial metadata
// Compiles template to v20 instructions
function ZoneScenario_Template_V20(rf, ctx) {
  // v20-specific instructions
}
```

**Result:** Same library source produces version-specific instructions at build time.

---

### 5.2.1 Template Syntax Compatibility

**🔴 CRITICAL RISK:** Templates must use syntax compatible with **both** v15 and v20 compilers.

**The Hidden Risk:**

The Angular 20 linker compiles the v15 template string during the v20 app build. If the template uses syntax that was:
- Valid in Angular 15
- **Deprecated and removed** in Angular 20

...then the **library build succeeds** (v15 compiler accepts it), but the **consuming app build fails** (v20 linker rejects it).

---

**Example: Deprecated Syntax**

```typescript
// Component built with Angular 15
@Component({
  selector: 'legacy-syntax',
  template: `
    <!-- Hypothetical: ngNonBindable behavior changed in v20 -->
    <div ngNonBindable>{{ this.value }}</div>

    <!-- Or: Pipe removed in v20 -->
    <p>{{ date | deprecatedPipe }}</p>
  `
})
export class LegacySyntaxComponent {
  value = 'test';
  date = new Date();
}
```

**Build output:**
```bash
# Angular 15 build (library)
✅ Build succeeded  # v15 compiler accepts deprecated syntax

# Angular 20 build (consuming app)
❌ Error: Template parse errors:
   The pipe 'deprecatedPipe' could not be found
   ...at legacy-syntax.component.ts:4
```

**Root Cause:** The linker uses the **v20 template compiler** to process the string template.

---

**Mitigation Strategy:**

#### 1. Use Syntax Intersection

Only use template syntax supported by **both** v15 and v20:
- ✅ Standard bindings: `[prop]="value"`, `(event)="handler()"`
- ✅ Structural directives: `*ngIf`, `*ngFor`
- ✅ Built-in pipes: `date`, `json`, `async` (verify no breaking changes)
- ⚠️ Avoid deprecated features listed in Angular migration guides

#### 2. CI Step: Build Dummy v20 App

**Add to CI pipeline:**

```bash
# After building library
cd main
pnpm build:shared
pnpm publish:shared

# Test against v20 consumer
cd ../externals/ng20-zone
pnpm install
pnpm run build  # Will fail if template syntax incompatible

if [ $? -ne 0 ]; then
  echo "❌ Template syntax incompatible with Angular 20 linker!"
  exit 1
fi
```

**Purpose:** Catches template syntax issues **before** production publish.

#### 3. Review Angular Migration Guides

When authoring components, check:
- [Angular Update Guide](https://angular.dev/update-guide)
- Breaking changes between v15 and v20
- Deprecated APIs and template syntax

**Common Issues:**
- Removed pipes (check `@angular/common` CHANGELOG)
- Changed directive behavior (`ngModel`, form controls)
- Removed `@angular/platform-browser` APIs

---

**Cross-Reference:** See Section 1 Success Criteria (Template syntax audit required).

---

### 5.3 Why inject() Function Improves Compatibility

**Constructor DI (Old approach):**
```typescript
constructor(@Inject(ChangeDetectorRef) private cdr: ChangeDetectorRef) {}
```

Compiled to:
```javascript
__param(0, Inject(ChangeDetectorRef)),
__metadata("design:paramtypes", [ChangeDetectorRef])
```

**Problems:**
- Relies on `emitDecoratorMetadata: true`
- Metadata may be lost or misinterpreted across versions
- `__param` decorator processing varies between v15 and v20

**inject() Function (Current approach):**
```typescript
private cdr = inject(ChangeDetectorRef);
```

Compiled to:
```javascript
this.cdr = inject(ChangeDetectorRef);
```

**Benefits:**
- Direct function call, no decorator metadata needed
- Same code path in v15 and v20
- Clearer intent (explicit dependency)
- Works even with `emitDecoratorMetadata: false`

---

### 5.3.1 Target Compatibility (JavaScript Output)

**🟡 HIGH RISK:** Mismatched TypeScript compilation targets can cause DI token resolution failures.

**The Issue:**

When a v15 library (compiled to ES2022) is consumed by a v20 app (also ES2022), DI token lookup relies on **class identity**. If the library and app compile classes differently (ES5 vs ES2022, different decorators), the runtime might not recognize tokens as matching.

**Example Failure:**

```typescript
// Library: libs/shared/src/services/data.service.ts
@Injectable()
export class DataService {
  getData() { return 'data'; }
}

// Library tsconfig.lib.json
{
  "compilerOptions": {
    "target": "ES5"  // ❌ Problem: ES5 target
  }
}

// Host app: Angular 20
{
  "compilerOptions": {
    "target": "ES2022"  // ✅ ES2022 target
  }
}
```

**Runtime error:**
```
NullInjectorError: No provider for DataService!
```

**Root Cause:** ES5-compiled class constructors have different metadata than ES2022 native classes. The DI system uses class reference as token, but transpilation differences break identity check.

---

**Verification Steps:**

#### 1. Check Library Target

```bash
cat main/libs/shared/tsconfig.lib.json | grep target
```

**Expected:**
```json
{
  "compilerOptions": {
    "target": "ES2022"  // ✅ Match consuming apps
  }
}
```

#### 2. Check ng-packagr Output

```bash
cat main/dist/libs/shared/esm2022/index.mjs | head -20
```

**Look for:** Native ES2022 classes (no `function` constructors, use `class` keyword).

#### 3. Test DI in Consuming App

```typescript
// In Angular 20 host
import { Component, inject } from '@angular/core';
import { DataService } from '@myorg/shared';

@Component({
  selector: 'app-test',
  template: `<p>{{ data }}</p>`
})
export class TestComponent {
  private dataService = inject(DataService);  // Test injection
  data = this.dataService.getData();
}
```

**If error occurs:**
- Check library `tsconfig.lib.json` target
- Rebuild library with correct target
- Verify consuming app can inject services

---

**Recommended Configuration:**

**Library (libs/shared/tsconfig.lib.json):**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",           // Match v20 default
    "module": "ES2022",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "types": []
  },
  "angularCompilerOptions": {
    "compilationMode": "partial",
    "enableIvy": true
  }
}
```

**ng-packagr automatically generates:**
- `esm2022/` - ES2022 modules
- `fesm2022/` - Flattened ES2022 modules

**Cross-Reference:** See Section 4.1 for full tsconfig.lib.json.

---

**When This Matters:**

| Scenario | Risk | Mitigation |
|----------|------|------------|
| Monorepo (same workspace) | Low | Build system enforces consistent target |
| Published library (npm) | **High** | Explicitly set target in tsconfig.lib.json |
| Micro-frontends | **High** | Each app may have different targets |
| ES5 legacy support | **Critical** | Avoid ES5; use ES2020+ for modern Angular |

---

## 6. Zone.js Scenarios & Testing

### 6.1 Zone.js Architecture

**Purpose:** Automatically trigger change detection when async operations complete.

**Mechanism:**
```
setTimeout() → Zone.js patches it → Callback executes →
Zone.js detects completion → Triggers ApplicationRef.tick() →
Change detection runs
```

**Version Differences:**

| Angular Version | Zone.js Version | Model | Behavior |
|----------------|----------------|-------|----------|
| 15 | 0.12.0 | Zone-required | All async operations patched |
| 20 (zone mode) | 0.15.0 | Zone-optional | Compatible with 0.12.0 |
| 20 (zoneless) | None | Signals-based | No automatic CD from async |

---

### 6.2 Test Scenarios

The shared library includes 4 test scenarios demonstrating different Zone.js behaviors:

#### Scenario 1: Synchronous Updates

**Component:** `zone-scenario-1.component.ts`

```typescript
@Component({
  selector: 'zone-scenario-1',
  standalone: true,
  template: `
    <button (click)="increment()">Increment</button>
    <p>Counter: {{ counter }}</p>
  `
})
export class ZoneScenario1Component {
  counter = 0;

  increment(): void {
    this.counter++;  // Synchronous update
  }
}
```

**Expected Behavior:**

| Host Type | Result | Explanation |
|-----------|--------|-------------|
| Angular 15 Zone | ✅ Works | Click event triggers CD |
| Angular 20 Zone | ✅ Works | Click event triggers CD |
| Angular 20 Zoneless | ✅ Works | Framework triggers CD on events |

**Key Insight:** Synchronous updates in event handlers work everywhere because Angular framework explicitly triggers CD after DOM events.

---

#### Scenario 2: Promise-Based Async

**Component:** `zone-scenario-2.component.ts`

```typescript
@Component({
  selector: 'zone-scenario-2',
  standalone: true,
  template: `
    <button (click)="startAsync()">Start Promise</button>
    <p>Status: {{ status }}</p>
  `
})
export class ZoneScenario2Component {
  status = 'idle';

  async startAsync(): Promise<void> {
    this.status = 'loading';
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.status = 'complete';  // Async update after promise resolves
  }
}
```

**Expected Behavior:**

| Host Type | Result | Explanation |
|-----------|--------|-------------|
| Angular 15 Zone | ✅ Works | Zone.js patches Promise, triggers CD when resolved |
| Angular 20 Zone | ✅ Works | Same behavior |
| Angular 20 Zoneless | ❌ Breaks | No Zone.js to detect promise completion, view stays "loading" |

**Key Insight:** Async/await (Promises) rely on Zone.js patching to trigger CD in zoneless hosts.

---

#### Scenario 3a: Well-Behaved Async

**Component:** `zone-scenario-3a.component.ts`

```typescript
@Component({
  selector: 'zone-scenario-3a',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button (click)="startAsync()">Start Async</button>
    <p>Counter: {{ counter }}</p>
  `
})
export class ZoneScenario3aComponent {
  private cdr = inject(ChangeDetectorRef);

  @Output() asyncComplete = new EventEmitter<number>();
  counter = 0;

  startAsync(): void {
    setTimeout(() => {
      this.counter++;
      this.cdr.markForCheck();  // Explicit CD trigger
      this.asyncComplete.emit(this.counter);
    }, 1000);
  }
}
```

**Expected Behavior:**

| Host Type | Result | Explanation |
|-----------|--------|-------------|
| Angular 15 Zone | ✅ Works | Explicit markForCheck() triggers CD |
| Angular 20 Zone | ✅ Works | Same |
| Angular 20 Zoneless | ✅ Works | Explicit markForCheck() works in zoneless |

**Key Insight:** Components that explicitly call `markForCheck()` are "zoneless-compatible" and work everywhere.

---

#### Scenario 3b: Zone-Dependent Async

**Component:** `zone-scenario-3b.component.ts`

```typescript
@Component({
  selector: 'zone-scenario-3b',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button (click)="startAsync()">Start Lazy Async</button>
    <button (click)="forceUpdate()">Force Update</button>
    <p>Counter (internal): {{ counter }}</p>
    <p class="note">In zoneless: display freezes, but events still fire.</p>
  `
})
export class ZoneScenario3bComponent {
  private cdr = inject(ChangeDetectorRef);

  @Output() lazyComplete = new EventEmitter<number>();
  counter = 0;

  startAsync(): void {
    setTimeout(() => {
      this.counter++;
      // NO markForCheck() - relies on Zone.js to trigger CD
      this.lazyComplete.emit(this.counter);
    }, 1000);
  }

  forceUpdate(): void {
    this.cdr.markForCheck();  // Manual CD trigger for debugging
  }
}
```

**Expected Behavior:**

| Host Type | Result | Explanation |
|-----------|--------|-------------|
| Angular 15 Zone | ✅ Works | Zone.js detects setTimeout, triggers CD |
| Angular 20 Zone | ✅ Works | Same |
| Angular 20 Zoneless | ❌ Breaks | No Zone.js, view stays stale (counter updates internally but not rendered) |

**Key Insight:** This simulates "lazy" Angular 15 components that don't explicitly trigger CD. These are the components that break in zoneless hosts and require refactoring.

**Debugging Pattern:** Click "Force Update" to verify counter is updating internally, just not rendering due to missing CD trigger.

---

### 6.3 Testing Matrix

| Scenario | Zone 15 | Zone 20 | Zoneless 20 | Requires Refactor? |
|----------|---------|---------|-------------|-------------------|
| 1: Sync | ✅ | ✅ | ✅ | No |
| 2: Promise | ✅ | ✅ | ❌ | Yes (add markForCheck) |
| 3a: Well-Behaved | ✅ | ✅ | ✅ | No |
| 3b: Zone-Dependent | ✅ | ✅ | ❌ | Yes (add markForCheck or use signals) |
| 4: Signal Inputs | ✅ | ✅ | ✅ | No (but requires unwrapping) |

**Migration Strategy for Zoneless:**
1. Identify components like Scenario 3b (async without markForCheck)
2. Refactor to explicitly call `markForCheck()` after async operations
3. OR: Migrate to signals for reactive state management
4. OR: Bundle component with its own Zone.js (Bundled Element pattern)

---

### 6.4 Scenario 4: Signal Input Interop

**🟡 HIGH PRIORITY:** Angular 20 hosts using signals must unwrap values before passing to Angular 15 components.

**The Problem:**

Angular 20 introduced **signals** as first-class reactive primitives. A v20 host might use signals for state:

```typescript
// Angular 20 host
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <zone-scenario-4 [counter]="counterSignal"></zone-scenario-4>
  `
})
export class AppComponent {
  counterSignal = signal(0);

  increment() {
    this.counterSignal.set(this.counterSignal() + 1);
  }
}
```

**Angular 15 component (in shared library):**

```typescript
// Angular 15 component (no signal support)
@Component({
  selector: 'zone-scenario-4',
  standalone: true,
  template: `<p>Counter: {{ counter }}</p>`
})
export class ZoneScenario4Component {
  @Input() counter: number = 0;
}
```

**Problem:** Angular 15 `@Input()` expects a **value** (number), but receives a **signal function**.

**Result:**
```html
<!-- Rendered output -->
<p>Counter: function signal() { [native code] }</p>
```

---

**The Solution: Unwrap Signals in v20 Host**

```typescript
// Angular 20 host (CORRECT)
@Component({
  selector: 'app-root',
  template: `
    <!-- Unwrap signal with () before passing to v15 component -->
    <zone-scenario-4 [counter]="counterSignal()"></zone-scenario-4>
  `
})
export class AppComponent {
  counterSignal = signal(0);
}
```

**Now the v15 component receives:** `counter = 0` (number, not function).

---

**Example Component for Testing:**

```typescript
// libs/shared/src/components/zone-scenarios/zone-scenario-4.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'zone-scenario-4',
  standalone: true,
  template: `
    <div class="scenario">
      <h3>Scenario 4: Signal Input Interop</h3>
      <p>Counter value: <strong>{{ counter }}</strong></p>
      <p>Type: <strong>{{ typeof counter }}</strong></p>
      <p class="note">
        v20 host must unwrap signals: [counter]="signal()" not [counter]="signal"
      </p>
    </div>
  `,
  styles: [`
    .scenario { padding: 1rem; border: 1px solid #ddd; margin: 1rem 0; }
    .note { font-size: 0.9em; color: #666; }
  `]
})
export class ZoneScenario4Component {
  @Input() counter: number = 0;

  // For debugging: expose typeof to template
  get typeof() {
    return (val: any) => typeof val;
  }
}
```

**Registration (register.ts):**
```typescript
export function registerZoneScenarios(injector: Injector): void {
  const elements = [
    { component: ZoneScenario1Component, name: 'zone-scenario-1' },
    { component: ZoneScenario2Component, name: 'zone-scenario-2' },
    { component: ZoneScenario3aComponent, name: 'zone-scenario-3a' },
    { component: ZoneScenario3bComponent, name: 'zone-scenario-3b' },
    { component: ZoneScenario4Component, name: 'zone-scenario-4' },  // NEW
  ];

  for (const { component, name } of elements) {
    if (!customElements.get(name)) {
      const element = createCustomElement(component, { injector });
      customElements.define(name, element);
    }
  }
}
```

---

**Testing in v20 Host:**

```typescript
// externals/ng20-zone/src/app/app.component.ts
import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <h2>Signal Input Test</h2>

    <!-- WRONG: Passes signal function -->
    <zone-scenario-4 [counter]="wrongSignal"></zone-scenario-4>

    <!-- CORRECT: Unwraps signal value -->
    <zone-scenario-4 [counter]="correctSignal()"></zone-scenario-4>

    <button (click)="increment()">Increment</button>
  `
})
export class AppComponent {
  wrongSignal = signal(42);      // Will display as function
  correctSignal = signal(100);   // Will display as number

  increment(): void {
    this.wrongSignal.update(v => v + 1);
    this.correctSignal.update(v => v + 1);
  }
}
```

**Expected Behavior:**

| Binding | Rendered Value | Type |
|---------|---------------|------|
| `[counter]="wrongSignal"` | `function signal() {...}` | function |
| `[counter]="correctSignal()"` | `100` (updates on click) | number |

---

**Key Insights:**

1. **Angular 15 components have NO signal awareness** - They see signals as opaque functions
2. **v20 hosts must explicitly unwrap** - Use `signal()` syntax in template bindings
3. **Change detection still works** - When signal updates, Angular 20 framework triggers CD
4. **No refactoring needed for v15 components** - They continue using `@Input()` decorators

---

**Edge Case: `cdr.detach()` in OnPush Components**

If a v15 component uses `ChangeDetectionStrategy.OnPush` and calls `cdr.detach()`:

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ...
})
export class DetachedComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.cdr.detach();  // Manual CD control
  }
}
```

**Behavior in Zone.js host:**
- Input changes still trigger CD via `markForCheck()`
- Component's internal async operations require manual `detectChanges()`

**Behavior in Zoneless host:**
- Input changes trigger CD via framework's signal tracking
- Internal async operations require `markForCheck()` (no Zone.js to auto-detect)

**Recommendation:** Avoid `cdr.detach()` in shared components intended for both zone and zoneless hosts.

---

## 7. Publishing & Consumption

### 7.1 Build and Publish Workflow

**Commands (run from `main/` directory):**

```bash
# 1. Build shared library
pnpm build:shared
# Output: main/dist/libs/shared/ (APF-compliant package)

# 2. Publish to local registry
pnpm publish:shared
# Registry: http://localhost:4873
# Package: @myorg/shared@0.0.8
```

**Publishing Script (main/package.json):**
```json
{
  "scripts": {
    "build:shared": "nx build shared",
    "publish:shared": "cd dist/libs/shared && npm publish --registry http://localhost:4873"
  }
}
```

---

### 7.2 Consumption Pattern

**External App (ng20-zone/package.json):**
```json
{
  "dependencies": {
    "@myorg/shared": "^0.0.8"
  }
}
```

**Installation:**
```bash
cd externals/ng20-zone
pnpm install  # Fetches @myorg/shared from local registry
```

**Import and Register (ng20-zone/src/main.ts):**
```typescript
import '@angular/compiler';  // Ensure JIT compiler available (if needed)
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { registerZoneScenarios } from '@myorg/shared';

// Register shared web components
import '@myorg/shared/components/navbar.element';
import '@myorg/shared/components/auth-modal.element';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes)
  ]
}).then(appRef => {
  registerZoneScenarios(appRef.injector);  // Register Angular-wrapped components
}).catch(err => console.error(err));
```

**Usage in Template (app.component.html):**
```html
<!-- Vanilla Web Components -->
<shared-navbar></shared-navbar>
<shared-auth-modal></shared-auth-modal>

<!-- Angular-Wrapped Components -->
<zone-scenario-3a
  (asyncComplete)="handleComplete($event)">
</zone-scenario-3a>

<zone-scenario-3b
  (lazyComplete)="handleLazy($event)">
</zone-scenario-3b>
```

**App Component Configuration:**
```typescript
@Component({
  selector: 'app-root',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],  // Required for custom elements
  templateUrl: './app.component.html'
})
export class AppComponent {
  handleComplete(counter: number): void {
    console.log('Scenario 3a completed:', counter);
  }

  handleLazy(counter: number): void {
    console.log('Scenario 3b completed:', counter);
  }
}
```

---

### 7.3 Dependency Strategy & Peer Dependencies

**🔴 CRITICAL ISSUE:** Peer dependency configuration directly impacts whether external Angular 20 apps can install your library without errors.

#### The Problem: Version Conflict

When ng-packagr builds the library, it generates a `package.json` with `peerDependencies` based on your `main/libs/shared/package.json`. If not configured correctly:

**Generated package.json (WRONG):**
```json
{
  "name": "@myorg/shared",
  "version": "0.0.8",
  "peerDependencies": {
    "@angular/core": "^15.2.0",
    "@angular/common": "^15.2.0",
    "@angular/platform-browser": "^15.2.0"
  }
}
```

**Consumer app (Angular 20):**
```json
{
  "dependencies": {
    "@angular/core": "^20.0.0",
    "@myorg/shared": "^0.0.8"
  }
}
```

**Result:**
```bash
npm ERR! ERESOLVE unable to resolve dependency tree
npm ERR! Could not resolve dependency:
npm ERR! peer @angular/core@"^15.2.0" from @myorg/shared@0.0.8
npm ERR! conflicting with @angular/core@20.0.0
```

**Dangerous Workaround (DO NOT USE):**
```bash
npm install --legacy-peer-deps  # Masks real compatibility issues!
pnpm install --force            # Destabilizes lockfile!
```

---

#### The Solution: Permissive Peer Dependencies

**Configure main/libs/shared/package.json with permissive ranges:**

```json
{
  "name": "@myorg/shared",
  "version": "0.0.8",
  "peerDependencies": {
    "@angular/core": ">=15.2.0 <21.0.0",
    "@angular/common": ">=15.2.0 <21.0.0",
    "@angular/platform-browser": ">=15.2.0 <21.0.0",
    "@angular/elements": ">=15.2.0 <21.0.0"
  },
  "dependencies": {
    "tslib": "^2.3.0"
  }
}
```

**Rationale:**
- `>=15.2.0` allows Angular 15, 16, 17, 18, 19, 20
- `<21.0.0` blocks untested Angular 21+ (update range when validated)
- Partial compilation ensures template compiles to each consumer's version

---

#### Configuration: ng-package.json

If you need finer control over what's treated as peer vs regular dependency:

```json
{
  "$schema": "../../node_modules/ng-packagr/ng-package.schema.json",
  "dest": "../../dist/libs/shared",
  "lib": {
    "entryFile": "src/index.ts"
  },
  "allowedNonPeerDependencies": [
    "tslib"
  ]
}
```

**`allowedNonPeerDependencies`:** Prevents these from being promoted to `peerDependencies` (useful for small utility libraries that should be bundled).

---

#### Verification: CI Step

**Add to your CI pipeline:**

```bash
# After publishing to local registry
cd externals/ng20-zone

# Clean install (no lockfile) to test peer dependency resolution
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Should succeed WITHOUT --legacy-peer-deps or --force
if [ $? -ne 0 ]; then
  echo "❌ Peer dependency conflict detected!"
  exit 1
fi
```

---

#### Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `ERESOLVE peer @angular/core@"^15.2.0"` | Peer range too restrictive | Update to `>=15.2.0 <21.0.0` in `libs/shared/package.json` |
| `Cannot find module '@angular/core'` | Missing peer dependency declaration | Add to `peerDependencies` |
| `Multiple @angular/core versions installed` | Consumer used `--force` | Fix peer range, reinstall cleanly |

**Cross-Reference:** See Section 8.1 Step 4 for updating package.json during migration.

---

### 7.4 Versioning Strategy

**Semantic Versioning:**
- **Patch (0.0.X):** Bug fixes, internal refactors, no API changes
- **Minor (0.X.0):** New components, new features, backward-compatible
- **Major (X.0.0):** Breaking API changes, component removals

**Current Version:** `0.0.8`

**Changelog (example):**
```
0.0.8 (2025-11-30)
- BREAKING: Migrated to ng-packagr with partial compilation
- BREAKING: Build output format changed to Angular Package Format (APF)
- Components now use inject() function instead of constructor DI
- Improved cross-version compatibility (Angular 15-20+)

0.0.7 (2025-11-29)
- Added explicit @Inject decorators to zone scenarios 3a and 3b
- Fixed NG0202 DI errors in Angular 20 hosts

0.0.6 (2025-11-28)
- Initial zone scenario components
- Added custom element registration helper
```

---

## 8. Migration to ng-packagr

### 8.1 Migration Instructions

**Prerequisites:**
- Ensure `ng-packagr` is installed: `pnpm add -D ng-packagr`
- Ensure `@nx/angular` is installed

**Steps:**

#### Step 1: Install Dependencies

```bash
cd main
pnpm add -D ng-packagr
```

#### Step 2: Verify Configuration Files

Ensure these files exist with correct content:

**main/libs/shared/ng-package.json:**
```json
{
  "$schema": "../../node_modules/ng-packagr/ng-package.schema.json",
  "dest": "../../dist/libs/shared",
  "lib": {
    "entryFile": "src/index.ts"
  }
}
```

**main/libs/shared/tsconfig.lib.json:**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/libs/shared",
    "declaration": true,
    "types": []
  },
  "angularCompilerOptions": {
    "compilationMode": "partial",
    "enableIvy": true,
    "generateDeepReexports": false
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.spec.ts"]
}
```

**main/libs/shared/project.json:**
```json
{
  "targets": {
    "build": {
      "executor": "@nx/angular:package",
      "outputs": ["{workspaceRoot}/dist/libs/shared"],
      "options": {
        "project": "libs/shared/ng-package.json"
      },
      "configurations": {
        "production": {
          "tsConfig": "libs/shared/tsconfig.lib.json"
        },
        "development": {
          "tsConfig": "libs/shared/tsconfig.lib.json"
        }
      },
      "defaultConfiguration": "production"
    }
  }
}
```

#### Step 3: Update Component DI Pattern (Optional but Recommended)

Migrate from constructor DI to `inject()` function:

**Before:**
```typescript
import { Component, Inject, ChangeDetectorRef } from '@angular/core';

@Component({ /* ... */ })
export class ZoneScenario3aComponent {
  constructor(@Inject(ChangeDetectorRef) private cdr: ChangeDetectorRef) {}
}
```

**After:**
```typescript
import { Component, inject, ChangeDetectorRef } from '@angular/core';

@Component({ /* ... */ })
export class ZoneScenario3aComponent {
  private cdr = inject(ChangeDetectorRef);
}
```

**Benefits:**
- Cleaner code (no constructor boilerplate)
- More explicit dependency declaration
- Future-proof (Angular team's recommended pattern)

#### Step 4: Bump Package Version

Update `main/libs/shared/package.json`:
```json
{
  "version": "0.0.8"  // Increment from 0.0.7
}
```

#### Step 5: Build Library

```bash
cd main
pnpm build:shared
```

**Expected output:**
- Build takes ~10-15 seconds (slower than @nx/js:tsc but acceptable)
- `dist/libs/shared/` contains APF structure:
  - `esm2022/` directory
  - `fesm2022/` directory
  - `package.json` with "exports" field

**Verify build output:**
```bash
ls -la dist/libs/shared/
# Should see: esm2022/, fesm2022/, package.json, index.d.ts, README.md
```

#### Step 6: Publish to Registry

```bash
pnpm publish:shared
```

**Verify publication:**
```bash
npm view @myorg/shared@0.0.8 --registry http://localhost:4873
```

#### Step 7: Update Consumer Apps

**For ng20-zone:**
```bash
cd externals/ng20-zone
pnpm update @myorg/shared
```

**For ng20-zoneless:**
```bash
cd externals/ng20-zoneless
pnpm update @myorg/shared
```

#### Step 8: Test

**Test ng20-zone:**
```bash
cd externals/ng20-zone
npm start
```

Open http://localhost:4201/settings/

**Verify:**
- ✅ No JIT compilation errors in console
- ✅ No NG0202 DI errors
- ✅ Zone scenarios 1, 2, 3a, 3b all work correctly
- ✅ Navbar and auth modal render

**Test ng20-zoneless:**
```bash
cd externals/ng20-zoneless
npm start
```

Open http://localhost:4202/profile/

**Verify:**
- ✅ Components load without errors
- ✅ Scenario 1 works (sync updates)
- ⚠️ Scenario 2 may not update (Promise-based, needs Zone.js)
- ✅ Scenario 3a works (explicit markForCheck)
- ❌ Scenario 3b doesn't update (Zone-dependent, expected)

---

### 8.2 Rollback Plan

If migration fails, rollback to previous approach:

#### Revert Configuration Files

**main/libs/shared/project.json:**
```json
{
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/libs/shared",
        "main": "libs/shared/src/index.ts",
        "tsConfig": "libs/shared/tsconfig.lib.json",
        "assets": ["libs/shared/package.json"]
      }
    }
  }
}
```

**main/libs/shared/tsconfig.lib.json:**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/libs/shared",
    "declaration": true,
    "types": []
  },
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/*.spec.ts"]
}
```

**Delete:**
- `main/libs/shared/ng-package.json`

**Revert component changes** (if inject() migration was done):
```typescript
// Revert to constructor DI with @Inject
constructor(@Inject(ChangeDetectorRef) private cdr: ChangeDetectorRef) {}
```

**Rebuild and republish:**
```bash
pnpm build:shared
pnpm publish:shared
```

---

## 9. Alternative Patterns

### 9.1 Bundled Element Pattern

**When to Use:**
- Component cannot be migrated to Angular 20 (breaking Material changes, etc.)
- Need Zone.js in zoneless host (isolated Zone.js instance)
- Complex Material components with overlays

**Architecture:**

```
┌────────────────────────────────────────────────────────────┐
│  Bundle App (Angular 15)                                   │
│  apps/shared-ui-v15-bundle/                                │
│                                                             │
│  ├── src/                                                  │
│  │   ├── components/                                       │
│  │   │   └── data-grid-v15.component.ts   # Material comp │
│  │   └── main.element.ts                  # Entry point   │
│  │                                                          │
│  └── webpack.config.js                     # Single bundle │
└────────────────────────────────────────────────────────────┘
                         │
                         ▼ Build (webpack)
┌────────────────────────────────────────────────────────────┐
│  dist/apps/shared-ui-v15-bundle/                           │
│  └── main.js              (~500KB minified, 200KB gzipped)│
│      - Angular 15 runtime                                  │
│      - Zone.js 0.12.0                                      │
│      - Material components                                 │
│      - Inline CSS                                          │
│      - Custom element registration                         │
└────────────────────────────────────────────────────────────┘
                         │
                         ▼ Publish to npm
┌────────────────────────────────────────────────────────────┐
│  @myorg/shared-ui-v15-bundle@1.0.0                         │
│  └── main.js                                               │
└────────────────────────────────────────────────────────────┘
                         │
                         ▼ Consume in v20 app
┌────────────────────────────────────────────────────────────┐
│  Angular 20 Host (Zoneless)                                │
│  <script src="node_modules/@myorg/.../main.js">           │
│  <data-grid-v15-bundled [attr.data]="tableData">          │
└────────────────────────────────────────────────────────────┘
```

**Trade-offs:**
- ✅ Maximum isolation, works in any host
- ✅ Can freeze component on Angular 15 forever
- ❌ Large bundle size (~500KB per bundle)
- ❌ Slow build iteration (rebuild entire Angular app)
- ❌ No DI/routing integration with host

**See:** `docs/BUNDLED_ELEMENT.md` for detailed implementation.

---

### 9.2 Source-Level Sharing

**Pattern:** Consuming apps import TypeScript source directly via tsconfig path mapping.

**Configuration:**
```json
// ng20-zone/tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@myorg/shared": ["../../main/libs/shared/src/index.ts"],
      "@myorg/shared/*": ["../../main/libs/shared/src/*"]
    }
  }
}
```

**Trade-offs:**
- ✅ Full type integration, hot reload works
- ✅ Consuming app compiles components to its version
- ❌ Tight coupling (changes affect all consumers immediately)
- ❌ TypeScript version conflicts (v15 uses TS 4.9, v20 uses TS 5.8)
- ❌ Not suitable for external distribution (npm)

**Use Case:** Monorepo where all apps coordinate Angular upgrades.

---

## 10. Decision Log

### 10.1 Why ng-packagr with Partial Compilation?

**Decision:** Use ng-packagr with `compilationMode: "partial"` for building shared library.

**Rationale:**
1. **Industry Standard:** Angular Package Format (APF) is the official recommendation for Angular libraries
2. **Cross-Version Compatibility:** Partial compilation defers template compilation to consuming app, ensuring version compatibility
3. **Future-Proof:** Aligns with Angular team's direction, works with Angular 15-20+
4. **Maintainable:** Standard tooling, well-documented, supported by Angular team

**Alternatives Considered:**
- **@nx/js:tsc:** Simpler, faster build, but produces runtime decorators that break cross-version
- **Bundled Element:** Solves cross-version but massive bundle size, poor scalability
- **Source-Level:** Works in monorepo but not for external distribution

**Outcome:** ng-packagr selected as production-ready, maintainable solution.

---

### 10.2 Why inject() Function?

**Decision:** Migrate DI from constructor injection to `inject()` function.

**Rationale:**
1. **Cleaner Code:** No constructor boilerplate, explicit dependency declaration
2. **Future-Proof:** Angular team's recommended pattern since v14
3. **Better Tree-Shaking:** Conditional injection enables better dead code elimination
4. **Compatibility:** Works same way in v15 and v20, no decorator metadata issues

**Alternatives Considered:**
- **@Inject() Decorator:** Works but verbose, relies on decorator metadata
- **Type-Based DI:** Simplest but relies on `emitDecoratorMetadata`, may break in edge cases

**Outcome:** inject() provides best balance of clarity, compatibility, and future-proofing.

---

### 10.3 Why Hybrid Component Architecture?

**Decision:** Support vanilla Web Components, Angular-wrapped components, and shared services in same library.

**Rationale:**
1. **Flexibility:** Different components have different requirements (simple UI vs reactive forms)
2. **Performance:** Vanilla components minimize bundle impact for simple UI
3. **Gradual Migration:** Can start with vanilla, upgrade to Angular-wrapped as needed
4. **Pragmatism:** Not all components need full Angular features

**Trade-offs:**
- ✅ Optimizes bundle size per component complexity
- ✅ Allows incremental adoption of Angular features
- ❌ Mixed patterns increase cognitive load
- ❌ Developers must understand when to use which pattern

**Outcome:** Hybrid approach provides best ROI for diverse component needs.

---

### 10.4 Why Local npm Registry (Verdaccio)?

**Decision:** Use Verdaccio local registry instead of npm link or file paths.

**Rationale:**
1. **Realistic Testing:** Mimics production npm workflow exactly
2. **Version Control:** Can test different package versions side-by-side
3. **Publish Validation:** Catches packaging issues before production publish
4. **Isolated:** No pollution of global npm registry

**Alternatives Considered:**
- **npm link:** Symlinks have path resolution issues, don't test packaging
- **file: protocol:** Similar issues to npm link
- **Public npm:** Too risky for experimental packages

**Outcome:** Verdaccio provides production-like testing without production risk.

---

## Appendix A: Quick Reference

### Build Commands

```bash
# Build shared library
cd main
pnpm build:shared

# Publish to local registry
pnpm publish:shared

# Build and serve ng15-zone test host
pnpm serve:host

# Build external Angular 20 apps
cd externals/ng20-zone
npm run build
npm start  # Port 4201

cd externals/ng20-zoneless
npm run build
npm start  # Port 4202
```

### Key Files

| File | Purpose |
|------|---------|
| `main/libs/shared/ng-package.json` | ng-packagr configuration |
| `main/libs/shared/tsconfig.lib.json` | TypeScript + Angular compiler options |
| `main/libs/shared/project.json` | Nx build configuration |
| `main/libs/shared/src/index.ts` | Public API exports |
| `main/libs/shared/package.json` | Package metadata, version, peer deps |
| `docs/ARCHITECTURE.md` | This document |
| `docs/SPEC.md` | Original project specification |
| `docs/BUNDLED_ELEMENT.md` | Alternative bundled element pattern |

### Troubleshooting

| Issue | Solution |
|-------|----------|
| JIT compilation error | Ensure `import '@angular/compiler'` in main.ts |
| NG0202 DI error | Migrate to ng-packagr with partial compilation |
| Zone scenario doesn't update in zoneless | Add explicit `markForCheck()` or use bundled element |
| Material overlays unstyled | Use bundled element pattern with scoped overlay container |
| Build very slow | Expected with ng-packagr (~10-15s), optimize if > 30s |
| Package not found in external apps | Verify published to registry: `npm view @myorg/shared` |
| `ERESOLVE peer @angular/core@"^15.2.0"` | Update peer deps to `>=15.2.0 <21.0.0` in libs/shared/package.json (see 7.3) |
| Material components render unstyled | Switch from `ViewEncapsulation.ShadowDom` to `Emulated` (see 3.2.1) |
| v20 app build fails with template error | Template uses v15-only syntax; audit against v20 compiler (see 5.2.1) |
| `NullInjectorError: No provider for X` | Check library tsconfig target matches v20 (ES2022); see 5.3.1 |
| Signal displays as `[Function]` in v15 component | v20 host must unwrap: `[prop]="signal()"` not `[prop]="signal"` (see 6.4) |
| OnPush component doesn't update in zoneless | Add `markForCheck()` after async operations; see 6.2 Scenario 3a |

---

## Appendix B: Glossary

**Angular Package Format (APF):** Official specification for packaging Angular libraries for npm distribution. Includes ESM2022, FESM2022, type definitions, and metadata.

**Partial Compilation:** Build mode where Angular compiler generates intermediate metadata (ɵɵngDeclare*) instead of fully compiled instructions. Consuming app's linker finishes compilation.

**Custom Element:** Web standard (W3C) for defining reusable HTML elements. Angular components can be wrapped as custom elements using `@angular/elements`.

**ShadowDOM:** Web standard for style and DOM encapsulation. Creates isolated DOM subtree for component.

**Zone.js:** Library that patches async APIs (setTimeout, Promise, etc.) to enable automatic change detection in Angular.

**inject() Function:** Modern Angular DI pattern (v14+) using function call instead of constructor parameters.

**Linker:** Build tool in Angular CLI that processes partially-compiled libraries during application build, finishing template compilation.

**Ivy:** Angular's current rendering engine (since v9). Produces version-specific instruction format.

**ɵɵngDeclareComponent:** Partial compilation metadata format. "ɵɵ" prefix indicates private/internal API.

**ɵɵdefineComponent:** Fully compiled component metadata format with template instructions.

**Verdaccio:** Lightweight private npm registry for local package testing.

---

**End of Architecture Specification**
