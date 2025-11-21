# Tasks: Angular 15/20 Compatibility Prototype

## Phase 1: Project Structure
- [x] Create directory structure (hosts/v15, hosts/v20, shared, legacy-v14)
- [x] Move current app to hosts/v20 as base
- [x] Delete app.js duplicate

## Phase 2: Version Pinning
- [x] Update v20 host to Angular 19 imports (simulating v20)
- [x] Create v15 host with Angular 15 imports

## Phase 3: Shared Components Library
- [x] Create shared/components/navbar.element.js
- [x] Create shared/components/auth-modal.element.js
- [x] Move legacy-dashboard to shared/components/
- [x] Create shared/index.js exports

## Phase 4: Host Integration
- [x] Update v20 host to use shared components
- [x] Create v15 host integration

## Phase 5: Legacy v14 Example
- [x] Create legacy-v14 NgModule example (README with migration pattern)

## Phase 6: Entry Points
- [x] Create index-v15.html and index-v20.html entry points
- [x] Update root index.html as selector page
