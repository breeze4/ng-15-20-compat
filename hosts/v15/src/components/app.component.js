import {
    Component,
    inject,
    CUSTOM_ELEMENTS_SCHEMA
} from 'https://esm.sh/@angular/core@15.2.0?deps=rxjs@7.8.1,zone.js@0.13.3';
import { CommonModule } from 'https://esm.sh/@angular/common@15.2.0?deps=rxjs@7.8.1,zone.js@0.13.3';
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
                    <h1 class="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-300">
                        Prototype: Ng15 Host
                    </h1>
                    <p class="text-slate-400 text-sm">Running with Zone.js Change Detection</p>
                </div>

                <!-- Shared Auth Component -->
                <shared-auth-modal
                    [attr.auth-token]="auth.token"
                    [attr.user-name]="auth.user?.name || ''"
                    (auth-login)="auth.login()"
                    (auth-logout)="auth.logout()"
                ></shared-auth-modal>
            </header>

            <main class="grid grid-cols-1 lg:grid-cols-2 gap-8">

                <!-- Host Functionality -->
                <section class="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h2 class="text-xl font-semibold mb-4 text-green-300">Host App (v15)</h2>

                    <div class="mb-6 space-y-2">
                        <label class="text-xs uppercase tracking-wider text-slate-500">Navigation (Shared Component)</label>

                        <!-- Shared Navbar Component -->
                        <shared-navbar
                            [attr.current-route]="currentRoute"
                            (navigate)="handleNav($event)"
                        ></shared-navbar>

                        <div class="mt-2 text-xs font-mono text-slate-400">
                            Active Path: {{ currentRoute }}
                        </div>
                    </div>

                    <div class="p-4 bg-slate-900 rounded border border-slate-800">
                        <h3 class="text-sm font-bold text-slate-400 mb-2">Compatibility Logs</h3>
                        <ul class="text-xs font-mono space-y-1 h-32 overflow-y-auto text-green-300">
                            <li *ngFor="let log of logs">> {{ log }}</li>
                        </ul>
                    </div>
                </section>

                <!-- Shared Component Integration -->
                <section class="bg-slate-800 p-6 rounded-xl border border-slate-700 relative overflow-hidden">
                    <div class="absolute top-0 right-0 bg-yellow-600 text-white text-xs px-2 py-1 rounded-bl">
                        Shared Components
                    </div>
                    <h2 class="text-xl font-semibold mb-4 text-yellow-300">Legacy Dashboard</h2>

                    <p class="text-sm text-slate-400 mb-6">
                        All three components below are shared Web Components receiving state via attributes.
                    </p>

                    <legacy-dashboard
                        [attr.auth-token]="auth.token"
                        [attr.current-route]="currentRoute"
                        (legacy-navigate)="handleNav($event)"
                    ></legacy-dashboard>

                </section>

                <!-- Zone.js Test Section -->
                <section class="bg-slate-800 p-6 rounded-xl border border-slate-700 lg:col-span-2">
                    <h2 class="text-xl font-semibold mb-4 text-purple-300">Zone.js Change Detection Test</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <zone-test
                            (counter-changed)="handleCounterChange($event)"
                        ></zone-test>
                        <div class="p-4 bg-slate-900 rounded border border-slate-800">
                            <h3 class="text-sm font-bold text-slate-400 mb-2">Host Counter (reflects component state)</h3>
                            <div class="text-4xl font-bold font-mono text-center py-4">{{ hostCounter }}</div>
                            <p class="text-xs text-slate-500 mt-2">
                                If this updates after async button click, Zone.js is correctly triggering change detection.
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    `
})(class {
    auth = inject(AuthService);
    currentRoute = '/dashboard';
    logs = ['System initialized.', 'Waiting for auth...'];
    hostCounter = 0;

    handleNav(event) {
        const route = event.detail.route;
        this.currentRoute = route;
        this.addLog(`Navigated to: ${route}`);
    }

    addLog(msg) {
        this.logs = [msg, ...this.logs];
    }

    handleCounterChange(event) {
        this.hostCounter = event.detail.counter;
        const type = event.detail.async ? 'async' : 'sync';
        this.addLog(`Counter ${type}: ${this.hostCounter}`);
    }
});
