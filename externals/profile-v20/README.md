# Profile v20 (Zoneless)

Angular 20 profile application **without zone.js** - served at `/profile/`.

## Purpose

Tests shared components in a zoneless Angular 20 host. Demonstrates change detection boundary issues when zone.js-dependent components run in a zoneless environment.

## Routes

- `/overview` - Profile overview
- `/preferences` - User preferences
- `/activity` - Activity log

## Commands

```bash
cd externals/profile-v20
pnpm install    # Install deps (includes @myorg/shared from local registry)
pnpm start      # Dev server on port 4202
pnpm build      # Production build
```

## Note

This app intentionally has no zone.js polyfill to test async change detection scenarios.
