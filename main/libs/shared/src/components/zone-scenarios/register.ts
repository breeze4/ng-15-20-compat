import { Injector } from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { ZoneScenario1Component } from './zone-scenario-1.component';
import { ZoneScenario2Component } from './zone-scenario-2.component';
import { ZoneScenario3aComponent } from './zone-scenario-3a.component';
import { ZoneScenario3bComponent } from './zone-scenario-3b.component';

/**
 * Register all zone scenario components as custom elements.
 * Call this function after bootstrapping your application.
 *
 * @example
 * bootstrapApplication(AppComponent).then(appRef => {
 *   registerZoneScenarios(appRef.injector);
 * });
 */
export function registerZoneScenarios(injector: Injector): void {
  const elements: Array<{ component: any; name: string }> = [
    { component: ZoneScenario1Component, name: 'zone-scenario-1' },
    { component: ZoneScenario2Component, name: 'zone-scenario-2' },
    { component: ZoneScenario3aComponent, name: 'zone-scenario-3a' },
    { component: ZoneScenario3bComponent, name: 'zone-scenario-3b' },
  ];

  for (const { component, name } of elements) {
    if (!customElements.get(name)) {
      const element = createCustomElement(component, { injector });
      customElements.define(name, element);
    }
  }
}

// Re-export components for direct use if needed
export {
  ZoneScenario1Component,
  ZoneScenario2Component,
  ZoneScenario3aComponent,
  ZoneScenario3bComponent,
};
