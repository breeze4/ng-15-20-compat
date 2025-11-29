# Bundled Angular Elements Implementation Tasks

## Phase 1: Bundle Project Setup

- [ ] Install required dependencies in main workspace (@nx/angular, @angular/material, @angular/cdk)
- [ ] Generate shared-ui-v15-bundle application using Nx
- [ ] Configure project.json with custom webpack-browser executor and build options
- [ ] Create webpack.config.js with single-bundle optimization settings
- [ ] Verify bundle project builds successfully with default setup

## Phase 2: Material Styling Configuration

- [ ] Create theme.scss with scoped Material theme under .v15-legacy-root class
- [ ] Create ScopedOverlayContainer class to apply v15-legacy-root to overlays
- [ ] Update webpack.config.js to force CSS inline (style-loader instead of MiniCssExtractPlugin)
- [ ] Verify styles are inlined in bundle output (no separate CSS file)

## Phase 3: Bundled Component Implementation

- [ ] Create zone-scenario-3b-bundled.component.ts with Material overlay components (Dialog, Select, DatePicker, Autocomplete, Tooltip)
- [ ] Add Material data components to bundled component (Table, Paginator, Sort)
- [ ] Add Material global services to bundled component (Snackbar)
- [ ] Add Zone.js test functionality (lazy counter with setTimeout)
- [ ] Create ExampleDialogComponent for Dialog testing
- [ ] Verify component compiles without errors

## Phase 4: Custom Element Bootstrap

- [ ] Create main.element.ts with Zone.js conditional loading
- [ ] Configure createApplication with ScopedOverlayContainer provider
- [ ] Register custom element as 'zone-scenario-3b-v15-bundled'
- [ ] Update project.json to use main.element.ts as entry point
- [ ] Verify bundle builds and contains all required code

## Phase 5: Publishing Setup

- [ ] Create package.json in apps/shared-ui-v15-bundle directory
- [ ] Configure assets in project.json to include package.json in build output
- [ ] Add build:bundle and publish:bundle scripts to main/package.json
- [ ] Build production bundle and verify output structure
- [ ] Publish bundle to local npm registry (http://0.0.0.0:4873)

## Phase 6: v20 Host Integration

- [ ] Install @myorg/shared-ui-v15-bundle in externals/profile-v20
- [ ] Configure angular.json asset mapping for main.js
- [ ] Add script tag to profile-v20 index.html
- [ ] Update profile-v20 app.component.ts with CUSTOM_ELEMENTS_SCHEMA and custom element usage
- [ ] Verify profile-v20 builds successfully

## Phase 7: Verification (Manual Testing)

Manual test checklist:
- Bundle loads before host renders (no flash of undefined element)
- All Material overlays open and styled: Dialog, Select, DatePicker, Autocomplete, Tooltip, Snackbar
- Overlays have `.v15-legacy-root` class (inspect in DevTools)
- Material icons render correctly (not blank squares)
- Table sorting/pagination works
- Autocomplete filtering works (reactive forms + Zone.js)
- Lazy counter updates (Zone.js change detection)
- Host receives `event.detail` from bundled component
- No Zone.js console errors
- No style leakage (v15 styles don't bleed into v20 host)
- Network tab shows only main.js (no separate styles.css)

## Debug Reference

Common issues:
- **No styles:** CSS not inlined. Check webpack style-loader config.
- **Icons missing:** Material Icons font not loaded. Check theme.scss.
- **Overlays unstyled:** Check `ScopedOverlayContainer`, verify `.v15-legacy-root` in theme.
- **Zone conflict:** Check console. If zoneless host affected, Zone.js globally patched APIs.
- **Table/forms broken:** Check reactive forms imports, verify Zone triggers change detection.
