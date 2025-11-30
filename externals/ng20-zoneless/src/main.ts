import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { registerZoneScenarios } from '@myorg/shared';

// Register shared web components
import '@myorg/shared/components/navbar.element';
import '@myorg/shared/components/auth-modal.element';

bootstrapApplication(AppComponent, {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes)
  ]
}).then(appRef => {
  registerZoneScenarios(appRef.injector);
}).catch(err => console.error(err));
