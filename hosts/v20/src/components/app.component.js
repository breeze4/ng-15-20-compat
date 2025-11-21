import {
    Component,
    signal,
    inject,
    CUSTOM_ELEMENTS_SCHEMA
} from 'https://esm.sh/@angular/core@19.0.0?deps=rxjs@7.8.1,zone.js@0.15.0';
import { CommonModule } from 'https://esm.sh/@angular/common@19.0.0?deps=rxjs@7.8.1,zone.js@0.15.0';
import { AuthService } from '../services/auth.service.js';

export const AppComponent = Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    template: `
        <div class="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
            <!-- Header -->
            <header class="mb-8 flex justify-between items-center border-b border-slate-700 pb-4">
                <div>
                    <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                        Prototype: Ng20 Host
                    </h1>
                    <p class="text-slate-400 text-sm">Running in Zoneless Compatibility Mode</p>
                </div>

                <div class="flex items-center gap-4">
                    <ng-container *ngIf="auth.user(); else loggedOut">
                        <span class="text-green-400">● {{ auth.user().name }}</span>
                        <button (click)="auth.logout()" class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm">
                            Sign Out
                        </button>
                    </ng-container>
                    <ng-template #loggedOut>
                        <button (click)="auth.login()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm">
                            Authenticate (OIDC)
                        </button>
                    </ng-template>
                </div>
            </header>

            <main class="grid grid-cols-1 lg:grid-cols-2 gap-8">

                <!-- Host Functionality (Modern) -->
                <section class="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h2 class="text-xl font-semibold mb-4 text-blue-300">Host App (v20)</h2>

                    <div class="mb-6 space-y-2">
                        <label class="text-xs uppercase tracking-wider text-slate-500">Current Route (Host Driven)</label>
                        <div class="flex gap-2">
                            <button (click)="navigate('/dashboard')"
                                class="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600 transition"
                                [class.ring-2]="currentRoute() === '/dashboard'">
                                /dashboard
                            </button>
                            <button (click)="navigate('/settings')"
                                class="px-3 py-1 bg-slate-700 rounded hover:bg-slate-600 transition"
                                [class.ring-2]="currentRoute() === '/settings'">
                                /settings
                            </button>
                        </div>
                        <div class="mt-2 text-xs font-mono text-slate-400">
                            Active Path: {{ currentRoute() }}
                        </div>
                    </div>

                    <div class="p-4 bg-slate-900 rounded border border-slate-800">
                        <h3 class="text-sm font-bold text-slate-400 mb-2">Compatibility Logs</h3>
                        <ul class="text-xs font-mono space-y-1 h-32 overflow-y-auto text-green-300">
                            <li *ngFor="let log of logs()">> {{ log }}</li>
                        </ul>
                    </div>
                </section>

                <!-- Legacy Integration Point -->
                <section class="bg-slate-800 p-6 rounded-xl border border-slate-700 relative overflow-hidden">
                    <div class="absolute top-0 right-0 bg-yellow-600 text-white text-xs px-2 py-1 rounded-bl">
                        Angular Elements (v15)
                    </div>
                    <h2 class="text-xl font-semibold mb-4 text-yellow-300">Shared Component</h2>

                    <p class="text-sm text-slate-400 mb-6">
                        This area loads the "Legacy Dashboard" component. It receives the Auth Token and Route state from the Host via attributes.
                    </p>

                    <legacy-dashboard
                        [attr.auth-token]="auth.token()"
                        [attr.current-route]="currentRoute()"
                        (legacy-navigate)="handleLegacyNav($event)"
                    ></legacy-dashboard>

                </section>
            </main>
        </div>
    `
})(class {
    auth = inject(AuthService);
    currentRoute = signal('/dashboard');
    logs = signal(['System initialized.', 'Waiting for auth...']);

    navigate(path) {
        this.currentRoute.set(path);
        this.addLog(`Host navigated to: ${path}`);
    }

    handleLegacyNav(event) {
        const requestedRoute = event.detail.route;
        this.addLog(`v15 Component requested nav: ${requestedRoute}`);
        this.currentRoute.set(requestedRoute);
    }

    addLog(msg) {
        this.logs.update(l => [msg, ...l]);
    }
});
