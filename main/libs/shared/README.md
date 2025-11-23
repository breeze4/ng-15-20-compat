# Shared Library

Reusable components and services consumed by all host apps.

## Purpose

Provides shared UI components and services that work across Angular 15 and 20 hosts. Published to local npm registry as `@myorg/shared`.

## Architecture

- Components: Standalone, ShadowDOM encapsulation, OnPush change detection
- Services: Auth channel (BroadcastChannel), routing utilities

## Commands

```bash
# From workspace root
pnpm build:shared     # Build library to dist/libs/shared
pnpm publish:shared   # Publish to local registry (http://$WIN_IP:4873)
```

## Consuming

External apps install via: `pnpm add @myorg/shared --registry http://$WIN_IP:4873`
