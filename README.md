# Angular 15/20 Compatibility Prototype

Tests shared web components across Angular 15 and Angular 20 applications using a local npm registry.

## Structure

- **main/**: Nx monorepo with Angular 15 host and `@myorg/shared` library
- **externals/settings-v20/**: Standalone Angular 19 app
- **externals/profile-v20/**: Standalone Angular 19 zoneless app

## Prerequisites

Local npm registry at `http://0.0.0.0:4873` (e.g., Verdaccio)

## Install

```bash
cd main && pnpm install
cd externals/settings-v20 && pnpm install
cd externals/profile-v20 && pnpm install
```

## Build & Publish Shared Library

```bash
cd main && pnpm build:shared && pnpm publish:shared
```

## Run

```bash
# Host (port 4200)
cd main && pnpm serve:host

# Settings (port 4201)
cd externals/settings-v20 && pnpm start

# Profile (port 4202)
cd externals/profile-v20 && pnpm start
```

## URLs

- http://localhost:4200 - Dashboard (Angular 15), proxies to both settings and profile as a stitched together app
- http://localhost:4201 - Settings (Angular 19)
- http://localhost:4202 - Profile (Angular 19 zoneless)
