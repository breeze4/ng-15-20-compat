# Legacy v14 Component Example

This directory demonstrates the pre-migration state of Angular 14 components using NgModule patterns.

## Before Migration (v14 NgModule Pattern)

```javascript
// dashboard.module.js - NgModule-based component
import { NgModule, Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-dashboard',
    template: `<div>Dashboard: {{ user?.name }}</div>`
})
export class DashboardComponent {
    @Input() user;
    @Input() token;
    @Output() navigate = new EventEmitter();
}

@NgModule({
    declarations: [DashboardComponent],
    imports: [CommonModule],
    exports: [DashboardComponent]
})
export class DashboardModule {}
```

## After Migration (v15+ Standalone Pattern)

```javascript
// dashboard.component.js - Standalone component
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    template: `<div>Dashboard: {{ user?.name }}</div>`
})
export class DashboardComponent {
    @Input() user;
    @Input() token;
    @Output() navigate = new EventEmitter();
}
```

## Key Migration Steps

1. Add `standalone: true` to @Component decorator
2. Add explicit `imports` array with dependencies (CommonModule, etc.)
3. Remove component from NgModule `declarations`
4. Remove NgModule entirely if it only contained this component
5. Import component directly where needed instead of importing the module

## Converting to Web Component (for cross-version sharing)

To share this component with v20 hosts, wrap it using @angular/elements:

```javascript
import { createCustomElement } from '@angular/elements';
import { createApplication } from '@angular/platform-browser';

const app = await createApplication();
const DashboardElement = createCustomElement(DashboardComponent, { injector: app.injector });
customElements.define('legacy-dashboard', DashboardElement);
```

This allows the component to be consumed as a standard Web Component with attribute-based inputs and CustomEvent outputs.
