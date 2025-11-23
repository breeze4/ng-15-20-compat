# Settings v20

Angular 20 settings application with zone.js - served at `/settings/`.

## Purpose

Tests that shared components work in an Angular 20 host with standard zone.js change detection.

## Routes

- `/general` - General settings
- `/security` - Security settings
- `/notifications` - Notification preferences

## Commands

```bash
cd externals/settings-v20
pnpm install    # Install deps (includes @myorg/shared from local registry)
pnpm start      # Dev server on port 4201
pnpm build      # Production build
```
