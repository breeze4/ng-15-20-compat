# Angular 15/20 Compatibility Prototype

## Goal
Test that shared components work in both Angular 15 and Angular 20 host applications.

## Architecture

**Angular 15 Host**: Standalone app consuming shared components
**Angular 20 Host**: Standalone app consuming shared components
**Shared Components**: Built for v15 compatibility, consumed by both hosts
**Legacy components**: Pre-migration components for v14. This is the state of everything *right now*, but after Angular 15 upgrade, other migration paths become possible. Need to build examples of this pre-15 state and how it changes things.

All are separate builds. Shared components published as library or loaded at runtime.

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

## Migration Pattern (v14/15 → v20 Ready)

1. Add `standalone: true` with explicit imports
2. Add `OnPush` change detection
3. Use immutable patterns (replace arrays, don't mutate)
4. Remove from NgModule declarations, add to imports
