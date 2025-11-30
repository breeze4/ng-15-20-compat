# Angular 15/20 Compatibility Prototype

## Goal
Test that shared components work in both Angular 15 and Angular 20 host applications.

## Architecture

**Angular 15 Host**: Standalone app consuming shared components
**Angular 20 Host**: Standalone app consuming shared components
**Shared Components**: Built for v15 compatibility, consumed by both hosts
**Legacy components**: Pre-migration components for v14. This is the state of everything *right now*, but after Angular 15 upgrade, other migration paths become possible. Need to build examples of this pre-15 state and how it changes things.

All are separate builds. Shared components published as library or loaded at runtime.

No Module Federation.

## Repository Structure

The base directory contains two independent areas:

- **`main/`**: Nx monorepo with Angular 15 host and shared library
- **`externals/`**: Independent Angular 20 apps (settings-v20, profile-v20)

Each area is self-contained. Run pnpm commands from `main/` or `externals/<app>/`, not the base directory.

## Main Workspace (pnpm + Nx)

### Build System
- **pnpm** for package management
- **Nx** for build orchestration and caching
- Shared library published to local npm registry at `http://localhost:4873`

### App Structure
```
main/
  apps/
    host-v15/    # Angular 15 - Dashboard (main entry at /)
  libs/
    shared/      # @myorg/shared - published to local registry
```

### Local Registry Workflow
1. Build shared library: `cd main && pnpm build:shared`
2. Publish to local registry: `cd main && pnpm publish:shared`
3. External apps consume `@myorg/shared` as npm dependency from registry

## External Apps

Independent Angular CLI projects in `externals/`:

```
externals/
  settings-v20/  # Angular 19 - Settings (port 4201)
  profile-v20/   # Angular 19 zoneless - Profile (port 4202)
```

Each manages its own dependencies and consumes `@myorg/shared` from the local registry.

### Routing Architecture

Each app is a separate build with its own entry point and Angular Router.

**Host v15 (Dashboard)** - Base: `/`
- `/overview` - Dashboard overview
- `/analytics` - Analytics view
- `/reports` - Reports view

**Settings v20** - Base: `/settings/`
- `/general` - General settings
- `/security` - Security settings
- `/notifications` - Notification preferences

**Profile v20 Zoneless** - Base: `/profile/`
- `/overview` - Profile overview
- `/preferences` - User preferences
- `/activity` - Activity log

### Cross-App Navigation
- Intra-app: Angular Router with `routerLink`
- Inter-app: Absolute URLs via `window.location` or `<a href>`
- Auth state preserved via BroadcastChannel across app transitions
- Navbar renders links based on current app context

## Data Flow

### Auth
- Each host owns its own session, performs login, stores JWT
- Host passes token to shared components via input binding
- Shared components read token in ngOnChanges, update their interceptors
- Shared components never read localStorage directly
- Auth code is shared along with a modal to initialize a session and perform basic login/logoff
- No session management beyond bare bones, this should serve 1 user only, no actual login, just session state

### Auth Session Sharing (Cross-App)
- Apps sync auth state in real-time via BroadcastChannel API
- Login/logout in one app broadcasts to all other open tabs
- Shared channel wrapper in `shared/services/auth-channel.js`
- Each host subscribes on init and updates local state on messages

### Routing
- Each host owns its URL
- Host → Shared: passes route via input
- Shared → Host: emits event, host performs navigation
- Routing is shared via a navbar component

### Cross-App Routing
- Unified URL space: v15 at `/`, v20 at `/v20/*`
- Navbar shows routes for both apps
- Same-app navigation: events (current behavior)
- Cross-app navigation: `window.location` changes

## Shared Component Standard

@Component with: `standalone: true`, `ViewEncapsulation.ShadowDom`, `ChangeDetectionStrategy.OnPush`

Inputs: `authToken`, `currentRoute`

## Expected Trade-offs

**Bundle size**: Shared components duplicated in each host build. Measure by comparing combined bundles against monolithic baseline. Track: total JS payload (gzipped), initial load time, TTI delta.

## Possible Mitigations (apply only if needed)

| Issue | Potential Fix |
|-------|---------------|
| Asset 404s | Build shared with `--deploy-url` |
| Type errors for shared components | Add type declarations |

## Zone.js Dependency Test Scenarios

Tests the boundary between Angular host and Web Components across Zone.js configurations.

### Test Component

`zone-scenarios` element with four test scenarios:

#### Scenario 1: Outer → Inner (Input Binding)
- Host updates a signal, passes value via attribute
- Component displays value via `attributeChangedCallback`
- **Expected**: Works in all modes

#### Scenario 2: Inner → Outer (Custom Events)
- Component button dispatches CustomEvent
- Host listens and updates its state
- **Expected**: Works in all modes (Angular wraps template listeners)

#### Scenario 3a: Async - Well-Behaved (FALSE POSITIVE)
- setTimeout → state change → manual render() → dispatch event
- **Expected**: Works everywhere
- **Why**: Component explicitly manages its own lifecycle

#### Scenario 3b: Async - Zone.js Dependent (TRUE TEST)
- setTimeout → state change → NO render()
- Component's internal view never updates without Zone.js
- **Expected**:
  - Zone mode: View updates (Zone.js patches setTimeout)
  - Zoneless: View stays stale (nothing triggers re-render)

### How to Test

1. Open `index-v20.html` (Zone mode)
   - All scenarios should work
   - Component 3b display should match host's lazy counter

2. Open `index-v20-zoneless.html`
   - Scenarios 1, 2, 3a work normally
   - Scenario 3b: Component display freezes, but host receives event
   - Compare component's 3b display vs host's "Lazy (event)" value

### Why This Matters

The "lazy" test simulates real Angular 15 component behavior:
- Real Angular components don't call render() manually
- They rely on Zone.js to detect async completion and trigger CD
- When wrapped as Web Components in a zoneless host, internal async operations won't update the view

### Implications for Migration

If wrapping Angular 15 components as Web Components for use in Angular 20 zoneless:
- Communication via attributes/events works fine
- Internal async operations (setTimeout, HTTP) won't trigger view updates
- Options:
  1. Keep Zone.js in the host (simplest)
  2. Ensure wrapped components use signals or explicit CD triggers
  3. Build shared components as "well-behaved" Web Components with explicit render()

## Wrapped Angular Components Pattern

Native Angular v15 components wrapped as Web Components using `@angular/elements`. This demonstrates the real migration pattern for sharing Angular components across different Angular versions.

### Component Structure

```
shared/src/components/zone-scenarios/
  zone-scenario-1.component.ts    # Input binding test
  zone-scenario-2.component.ts    # Custom events test
  zone-scenario-3a.component.ts   # Well-behaved async
  zone-scenario-3b.component.ts   # Zone-dependent async
  register.ts                     # createCustomElement registration
```

### Registration Pattern

Host apps call registration function to define custom elements:

```typescript
// In host app bootstrap
import { registerZoneScenarios } from '@myorg/shared';

bootstrapApplication(AppComponent).then(appRef => {
  registerZoneScenarios(appRef.injector);
});
```

### Component Standard

All wrapped components use:
- `standalone: true`
- `ViewEncapsulation.ShadowDom`
- `ChangeDetectionStrategy.OnPush`
- Inputs via `@Input()` mapped to element attributes
- Outputs via `@Output()` EventEmitter dispatching CustomEvents

### Why Wrap Instead of Vanilla Web Components

- Demonstrates real migration path for existing Angular codebases
- Components use Angular DI, services, pipes
- Zone.js dependency is visible (Scenario 3b)
- Same component code works in both zoned and zoneless hosts (with caveats)

## Bundled Element Architecture

For components that cannot be made v20-compatible through standard wrapping (due to Zone.js incompatibility, JIT compilation requirements, or incompatible DI systems), use the bundled element pattern.

### Concept

Bundle the v15 component with its entire Angular runtime into a single JavaScript file. The v20 host treats it as a generic custom element, not an Angular component.

### Distribution Strategy

**Primary Method: npm Package Publishing**

Following the existing `@myorg/shared` workflow:

1. Build bundle in `main/` workspace (Angular 15, TypeScript 4.9)
2. Package as `@myorg/shared-ui-v15-bundle`
3. Publish to local registry at `http://localhost:4873`
4. v20 apps install as npm dependency
5. Angular build copies bundle from `node_modules/` to assets
6. Load via `<script>` tag in index.html

**Why npm packages?**
- ✅ Leverages existing local registry infrastructure
- ✅ No cross-monorepo file dependencies
- ✅ Versioned and cacheable
- ✅ Works reliably in CI/CD
- ✅ Angular dev server handles node_modules assets correctly

**Alternative: Direct asset copying** (not recommended - no build orchestration, dev server won't watch cross-monorepo files, fragile in CI/CD)

### Build Configuration

**Nx Executor**: Use `@nx/angular:webpack-browser` with custom webpack config (not `ngx-build-plus`, which is designed for Angular CLI workspaces)

**Single Bundle Output**: Custom webpack config disables code splitting and inlines all chunks into `main.js`

**Component Versioning**: Create NEW components for bundling (e.g., `ZoneScenario3bBundledComponent`) rather than modifying existing ones - preserves originals for comparison

### Zone.js Handling

**Version Compatibility Risk**:
- Bundle uses Zone.js 0.12.0 (Angular 15)
- `settings-v20` uses Zone.js 0.15.1 (Angular 20)
- `profile-v20` is zoneless (no Zone.js)
- **Untested**: Coexistence of Zone.js 0.12.0 and 0.15.1 in same runtime

**Bootstrap Strategy**: Check `window.Zone` before loading - if present, reuse host's Zone.js instance

### TypeScript Version Handling

**Not a Problem**: Bundle builds with TS 4.9.0 (required by Angular 15), outputs JavaScript. Consuming v20 apps use TS 5.8.0 but load bundle via `<script>` tag (no TypeScript compilation of bundle).

### Material Components

**Encapsulation Constraint**: Must use `ViewEncapsulation.Emulated`, NOT `ShadowDom` - Material overlays break with Shadow boundaries

**Style Scoping**: All Material styles scoped inside `.v15-legacy-root` class to prevent conflicts with v20 host theme

**Overlay Container**: Custom `ScopedOverlayContainer` applies `.v15-legacy-root` to overlay containers so dialogs/menus inherit scoped theme

### Communication Pattern

Same as standard Web Components:
- **Inputs**: HTML attributes/properties
- **Outputs**: CustomEvent dispatches (not Angular EventEmitter)
- **No shared DI**: Bundle has isolated injector
- **No shared Router**: Each runtime manages own routing

### Implementation Details

See [BUNDLED_ELEMENT.md](./BUNDLED_ELEMENT.md) for complete implementation guide.

## Migration Pattern (v14/15 → v20 Ready)

1. Add `standalone: true` with explicit imports
2. Add `OnPush` change detection
3. Use immutable patterns (replace arrays, don't mutate)
4. Remove from NgModule declarations, add to imports
