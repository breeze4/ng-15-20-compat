# Tasks: Move V20 Apps to Externals with Local Registry

## Phase 1: Make Shared Library Publishable
- [x] 1. Update `libs/shared/package.json` - remove private flag, set name to `@myorg/shared`
- [x] 2. Update `libs/shared/project.json` - add build target
- [x] 3. Update `libs/shared/tsconfig.json` - enable declarations
- [x] 4. Create `libs/shared/.npmrc` - point to local registry

## Phase 2: Create External Settings App
- [x] 5. Create `externals/settings-v20/` directory
- [x] 6. Move `apps/settings-v20/src/` to `externals/settings-v20/src/`
- [x] 7. Create `externals/settings-v20/package.json`
- [x] 8. Create `externals/settings-v20/angular.json`
- [x] 9. Create `externals/settings-v20/tsconfig.json` and `tsconfig.app.json`
- [x] 10. Create `externals/settings-v20/.npmrc`
- [x] 11. Update imports from `@shared/*` to `@myorg/shared`

## Phase 3: Create External Profile App
- [x] 12. Create `externals/profile-v20/` directory
- [x] 13. Move `apps/profile-v20/src/` to `externals/profile-v20/src/`
- [x] 14. Create `externals/profile-v20/package.json`
- [x] 15. Create `externals/profile-v20/angular.json`
- [x] 16. Create `externals/profile-v20/tsconfig.json` and `tsconfig.app.json`
- [x] 17. Create `externals/profile-v20/.npmrc`
- [x] 18. Update imports from `@shared/*` to `@myorg/shared`

## Phase 4: Clean Up Nx Workspace
- [x] 19. Delete `apps/settings-v20/` directory
- [x] 20. Delete `apps/profile-v20/` directory
- [x] 21. Delete `proxy.conf.js`
- [x] 22. Update root `package.json` - add shared build/publish scripts
- [x] 23. Update `pnpm-workspace.yaml`

## Phase 5: Update Documentation
- [x] 24. Update `docs/SPEC.md` with new architecture
- [x] 25. Update `README.md` with workflow
