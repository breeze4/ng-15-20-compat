// Bootstrap imports - ZONELESS MODE (no zone.js polyfill imported)
// Note: Still use same esm.sh URLs as main.js to avoid duplicate Angular instances
import 'https://esm.sh/@angular/compiler@19.0.0';

import { bootstrapApplication } from 'https://esm.sh/@angular/platform-browser@19.0.0?deps=rxjs@7.8.1,zone.js@0.15.0';
import { provideExperimentalZonelessChangeDetection } from 'https://esm.sh/@angular/core@19.0.0?deps=rxjs@7.8.1,zone.js@0.15.0';

// Register shared web components
import '../../../shared/index.js';

// App imports
import { AppComponent } from './components/app.component.js';
import { AuthService } from './services/auth.service.js';

// Bootstrap the application in ZONELESS mode
// This demonstrates the Zone.js collision issue:
// - The host runs without Zone.js
// - Async operations in Web Components won't trigger Angular CD
bootstrapApplication(AppComponent, {
    providers: [
        AuthService,
        provideExperimentalZonelessChangeDetection()
    ]
}).catch(err => console.error(err));
