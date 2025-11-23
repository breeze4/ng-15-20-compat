# Angular 15 Host + Shared Library

Nx workspace with Angular 15 host application and shared component library.

## Architecture

- **host-v15**: Angular 15 Dashboard at `/` (port 4200)
- **@myorg/shared**: Shared web components published to local registry

## Prerequisites

Local npm registry running at `http://0.0.0.0:4873` (e.g., Verdaccio)

## Development

### Setup

```bash
pnpm install
```

### Build and Publish Shared Library

```bash
pnpm build:shared
pnpm publish:shared
```

### Run Host Application

```bash
pnpm serve:host    # Dashboard on port 4200
```

## Access URLs

- Dashboard: http://localhost:4200

## Architecture Details

See `docs/SPEC.md` for detailed architecture documentation.
