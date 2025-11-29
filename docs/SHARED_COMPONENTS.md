# Cross-Version Angular Component Sharing

## Problem Statement

**Goal:** Share native Angular components between Angular v15 and v20 applications.

**Approach attempted:**
1. Create Angular components in the shared library (compiled with v15)
2. Wrap them as custom elements using `@angular/elements`
3. Publish to npm registry
4. Import and register in consuming apps (v15 and v20)

**Result:** Fails in v20 apps with JIT compilation error.

## The Zone.js Test Scenario

The purpose was to demonstrate Zone.js dependency across different host configurations.

### Zone-Dependent Component

This component relies on Zone.js to trigger change detection after async operations:

```typescript
@Component({
  selector: 'zone-scenario-3b',
  standalone: true,
  template: `
    <div>
      <button (click)="startAsync()">Start Async</button>
      <p>Counter: {{ counter }}</p>
    </div>
  `,
  encapsulation: ViewEncapsulation.ShadowDom,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ZoneScenario3bComponent {
  @Output() lazyComplete = new EventEmitter<number>();
  counter = 0;

  startAsync(): void {
    setTimeout(() => {
      this.counter++;
      // NO markForCheck() - relies on Zone.js to trigger CD
      this.lazyComplete.emit(this.counter);
    }, 1000);
  }
}
```

**Expected behavior:**
- In zoned host: View updates (Zone.js patches setTimeout)
- In zoneless host: View freezes but events still fire

### Well-Behaved Component (Contrast)

```typescript
export class ZoneScenario3aComponent {
  @Output() asyncComplete = new EventEmitter<number>();
  counter = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  startAsync(): void {
    setTimeout(() => {
      this.counter++;
      this.cdr.markForCheck();  // Explicit CD trigger - works everywhere
      this.asyncComplete.emit(this.counter);
    }, 1000);
  }
}
```

## Registration Glue Code

### Shared Library Registration

```typescript
// libs/shared/src/components/zone-scenarios/register.ts
import { Injector } from '@angular/core';
import { createCustomElement } from '@angular/elements';

export function registerZoneScenarios(injector: Injector): void {
  const scenarios = [
    { component: ZoneScenario1Component, name: 'zone-scenario-1' },
    { component: ZoneScenario2Component, name: 'zone-scenario-2' },
    { component: ZoneScenario3aComponent, name: 'zone-scenario-3a' },
    { component: ZoneScenario3bComponent, name: 'zone-scenario-3b' },
  ];

  for (const { component, name } of scenarios) {
    if (!customElements.get(name)) {
      const element = createCustomElement(component, { injector });
      customElements.define(name, element);
    }
  }
}
```

### Host App Bootstrap

```typescript
// main.ts (in consuming app)
import { bootstrapApplication } from '@angular/platform-browser';
import { registerZoneScenarios } from '@myorg/shared';

bootstrapApplication(AppComponent, {
  providers: [...]
}).then(appRef => {
  registerZoneScenarios(appRef.injector);
});
```

### Template Usage

```typescript
@Component({
  template: `
    <zone-scenario-3b
      (lazyComplete)="onComplete($event)">
    </zone-scenario-3b>
    <p>Host received: {{ count }}</p>
  `,
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppComponent {
  count = 0;
  onComplete(event: CustomEvent<number>) {
    this.count = event.detail;
  }
}
```

## The Error

When v20 apps try to register components compiled by v15:

```
Error: The component 'ZoneScenario3bComponent' needs to be compiled
using the JIT compiler, but '@angular/compiler' is not available.

JIT compilation is discouraged for production use-cases!
Consider using AOT mode instead.
```

**Root cause:** Angular's internal component representation differs between major versions. The v20 runtime cannot interpret the v15 compiled component metadata. It attempts JIT compilation as a fallback, which fails without the compiler loaded.

## Options Analysis

### Option A: Vanilla Web Components

Convert zone-scenarios to plain `HTMLElement` classes (like existing navbar/auth-modal).

**Pros:**
- Works across all versions
- No Angular runtime dependency

**Cons:**
- Loses the Zone.js test entirely
- Cannot demonstrate real Angular component behavior
- No access to Angular DI, pipes, directives

**Verdict:** Defeats the purpose of this specific test.

### Option B: Source-Level Sharing

Share TypeScript source, let each app compile with its own Angular version.

**Pros:**
- Each app gets properly compiled components
- Zone.js test would work

**Cons:**
- Each app needs full Angular compiler setup
- Complex build configurations
- TypeScript version mismatches (v15 uses TS 4.9, v20 uses TS 5.8)
- Not how real teams share code

**Verdict:** Impractical infrastructure overhead.

### Option C: Dual Builds

Publish separate builds for each Angular version (`@myorg/shared-v15`, `@myorg/shared-v20`).

**Pros:**
- Each version gets compatible compiled output
- Clean separation

**Cons:**
- Duplicate maintenance
- Build complexity
- Must keep implementations in sync

**Verdict:** Viable for important shared libraries, but significant overhead.

### Option D: Same Angular Version Everywhere

Keep all apps on the same Angular version.

**Pros:**
- Component sharing works naturally
- Single build pipeline
- No compatibility issues

**Cons:**
- Constraining for large organizations
- Blocks teams from upgrading independently
- Not always feasible during migrations

**Verdict:** The ideal solution when achievable.

## Key Findings

1. **Cross-version compiled component sharing does not work.** Angular's internal metadata format is version-specific. Components compiled for v15 cannot be registered as custom elements in a v20 runtime.

2. **Zone.js dependency testing requires same-runtime execution.** The scenario where a component relies on Zone.js for change detection can only be demonstrated when the component runs within the same Angular runtime as the host.

3. **Framework-agnostic Web Components are the practical choice for cross-version sharing.** If you must share UI across different Angular versions, vanilla Web Components (HTMLElement) are the only reliable approach—but they cannot leverage Angular features.

4. **The `@angular/elements` wrapper is version-coupled.** `createCustomElement()` expects components compiled for the same Angular version. It's designed for exposing Angular components to non-Angular consumers, not for cross-version Angular interop.

## Implications for Migration

### For Teams with Multiple Angular Versions

If you have apps on different Angular versions and need shared UI:

1. **Shared chrome (navbar, footer, modals):** Use vanilla Web Components. Accept the loss of Angular features.

2. **Complex shared components:** Keep them in each app's codebase. Sync changes manually or use code generation.

3. **During migration:** Prioritize getting all apps to the same version. Cross-version component sharing is not a sustainable pattern.

### When to Use Each Pattern

| Scenario | Recommended Approach |
|----------|---------------------|
| Same Angular version across apps | Native components with @angular/elements |
| Mixed versions, simple UI | Vanilla Web Components |
| Mixed versions, complex components | Duplicate in each app |
| Exposing Angular to non-Angular consumers | @angular/elements (single version) |

## Next Steps

1. **For this prototype:** Remove zone-scenarios from v20 apps, keep only in host-v15 where the test is valid.

2. **Alternative test:** Create equivalent vanilla Web Component versions of zone-scenarios that manually demonstrate the same patterns (setTimeout without explicit render vs. with render).

3. **Document the finding:** This limitation should inform architectural decisions for the real migration.
