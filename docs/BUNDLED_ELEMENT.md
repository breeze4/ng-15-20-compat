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

## Reference

See `docs/TASKS.md` for implementation steps and detailed code examples.
