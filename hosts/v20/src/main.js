// Bootstrap imports - order matters
import 'https://esm.sh/zone.js@0.15.0';
import 'https://esm.sh/@angular/compiler@19.0.0';

import { bootstrapApplication } from 'https://esm.sh/@angular/platform-browser@19.0.0?deps=rxjs@7.8.1,zone.js@0.15.0';

// Register shared web components
import '../../../shared/index.js';

// App imports
import { AppComponent } from './components/app.component.js';
import { AuthService } from './services/auth.service.js';

// Bootstrap the application
bootstrapApplication(AppComponent, {
    providers: [AuthService]
}).catch(err => console.error(err));
