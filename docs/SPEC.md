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

### Routing
- Each host owns its URL
- Host → Shared: passes route via input
- Shared → Host: emits event, host performs navigation
- Routing is shared via a navbar component

## Shared Component Standard

@Component with: `standalone: true`, `ViewEncapsulation.ShadowDom`, `ChangeDetectionStrategy.OnPush`

Inputs: `authToken`, `currentRoute`

## Expected Trade-offs

**Bundle size**: Shared components duplicated in each host build. Measure by comparing combined bundles against monolithic baseline. Track: total JS payload (gzipped), initial load time, TTI delta.

## Possible Mitigations (apply only if needed)

| Issue | Potential Fix |
|-------|---------------|
| Zone.js conflict | Load zone.js once per host only |
| Asset 404s | Build shared with `--deploy-url` |
| Type errors for shared components | Add type declarations |

## Migration Pattern (v14/15 → v20 Ready)

1. Add `standalone: true` with explicit imports
2. Add `OnPush` change detection
3. Use immutable patterns (replace arrays, don't mutate)
4. Remove from NgModule declarations, add to imports
