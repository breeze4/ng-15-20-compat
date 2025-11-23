# Project Instructions

This project uses **pnpm** for package management. Run commands from the `main/` directory.

**IMPORTANT**: Do NOT run pnpm commands yourself. The user runs this on Windows while Claude Code runs in WSL - running pnpm from WSL will mess up the installed dependencies. Only update package.json files and let the user run the commands.

## Key Commands

```bash
pnpm install          # Install workspace dependencies
pnpm build:shared     # Build shared library
pnpm publish:shared   # Publish to local registry
pnpm serve:host       # Serve host-v15 on port 4200
```

## Architecture

See `docs/SPEC.md` for full architecture details.
