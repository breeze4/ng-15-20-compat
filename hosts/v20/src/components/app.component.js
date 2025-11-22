import {
    Component,
    signal,
    inject,
    CUSTOM_ELEMENTS_SCHEMA
} from 'https://esm.sh/@angular/core@19.0.0?deps=rxjs@7.8.1';
import { CommonModule } from 'https://esm.sh/@angular/common@19.0.0?deps=rxjs@7.8.1';
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
                    <p class="text-slate-400 text-sm">Running with Signals API</p>
                </div>

                <!-- Shared Auth Component -->
                <shared-auth-modal
                    [attr.auth-token]="auth.token()"
                    [attr.user-name]="auth.user()?.name || ''"
                    (auth-login)="auth.login()"
                    (auth-logout)="auth.logout()"
                ></shared-auth-modal>
            </header>

            <main class="grid grid-cols-1 lg:grid-cols-2 gap-8">

                <!-- Host Functionality (Modern) -->
                <section class="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <h2 class="text-xl font-semibold mb-4 text-blue-300">Host App (v20)</h2>

                    <div class="mb-6 space-y-2">
                        <label class="text-xs uppercase tracking-wider text-slate-500">Navigation (Shared Component)</label>

                        <!-- Shared Navbar Component -->
                        <shared-navbar
                            [attr.current-route]="currentRoute()"
                            [attr.app-id]="'v20'"
                            (navigate)="handleNav($event)"
                        ></shared-navbar>

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
                        Shared Components
                    </div>
                    <h2 class="text-xl font-semibold mb-4 text-yellow-300">Legacy Dashboard</h2>

                    <p class="text-sm text-slate-400 mb-6">
                        All three components below are shared Web Components receiving state via attributes.
                    </p>

                    <legacy-dashboard
                        [attr.auth-token]="auth.token()"
                        [attr.current-route]="currentRoute()"
                        (legacy-navigate)="handleNav($event)"
                    ></legacy-dashboard>

                </section>

                <!-- Zone.js Test Scenarios -->
                <section class="bg-slate-800 p-6 rounded-xl border border-slate-700 lg:col-span-2">
                    <h2 class="text-xl font-semibold mb-4 text-purple-300">Zone.js Dependency Test Scenarios</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Component Side -->
                        <div>
                            <h3 class="text-sm font-bold text-slate-400 mb-3">Component (Web Component)</h3>
                            <zone-scenarios
                                [attr.input-value]="testInputValue()"
                                (scenario-event)="handleScenarioEvent($event)"
                                (async-complete)="handleAsyncComplete($event)"
                            ></zone-scenarios>
                        </div>

                        <!-- Host Side -->
                        <div class="space-y-4">
                            <h3 class="text-sm font-bold text-slate-400 mb-3">Host (Angular {{ zoneless ? 'Zoneless' : 'Zone' }})</h3>

                            <!-- Test 1: Outer to Inner Control -->
                            <div class="p-3 bg-slate-900 rounded border border-slate-800">
                                <h4 class="text-xs font-bold text-blue-400 mb-2">1. Outer → Inner</h4>
                                <button
                                    (click)="updateTestInput()"
                                    class="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded">
                                    Send: "{{ testInputValue() }}" → "{{ nextInputValue() }}"
                                </button>
                            </div>

                            <!-- Test 2: Inner to Outer Result -->
                            <div class="p-3 bg-slate-900 rounded border border-slate-800">
                                <h4 class="text-xs font-bold text-green-400 mb-2">2. Inner → Outer</h4>
                                <div class="text-2xl font-bold font-mono text-center py-1">{{ hostEventCount() }}</div>
                                <p class="text-xs text-slate-500 text-center">Events received from component</p>
                            </div>

                            <!-- Test 3: Async Results -->
                            <div class="p-3 bg-slate-900 rounded border border-slate-800">
                                <h4 class="text-xs font-bold text-yellow-400 mb-2">3. Async Results (Host Side)</h4>
                                <div class="grid grid-cols-2 gap-2 text-center">
                                    <div>
                                        <div class="text-lg font-bold font-mono">{{ hostWellBehaved() }}</div>
                                        <p class="text-xs text-slate-500">Well-behaved</p>
                                    </div>
                                    <div>
                                        <div class="text-lg font-bold font-mono">{{ hostLazy() }}</div>
                                        <p class="text-xs text-slate-500">Lazy (event)</p>
                                    </div>
                                </div>
                                <p class="text-xs text-red-400 mt-2 text-center">
                                    Compare component's 3b display vs host's lazy value
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    `
})(class {
    auth = inject(AuthService);
    currentRoute = signal('/dashboard');
    logs = signal(['System initialized.', 'Waiting for auth...']);

    // Zone test scenario signals
    testInputValue = signal('Alpha');
    hostEventCount = signal(0);
    hostWellBehaved = signal(0);
    hostLazy = signal(0);

    // For zoneless indicator
    zoneless = false; // Will be overridden in zoneless bootstrap

    // Input values to cycle through
    _inputValues = ['Alpha', 'Beta', 'Gamma', 'Delta'];
    _inputIndex = 0;

    nextInputValue() {
        return this._inputValues[(this._inputIndex + 1) % this._inputValues.length];
    }

    updateTestInput() {
        this._inputIndex = (this._inputIndex + 1) % this._inputValues.length;
        this.testInputValue.set(this._inputValues[this._inputIndex]);
        this.addLog(`Input → ${this._inputValues[this._inputIndex]}`);
    }

    handleScenarioEvent(event) {
        this.hostEventCount.set(event.detail.count);
        this.addLog(`Event received: ${event.detail.count}`);
    }

    handleAsyncComplete(event) {
        if (event.detail.type === 'wellbehaved') {
            this.hostWellBehaved.set(event.detail.counter);
        } else {
            this.hostLazy.set(event.detail.counter);
        }
        this.addLog(`Async ${event.detail.type}: ${event.detail.counter}`);
    }

    handleNav(event) {
        const route = event.detail.route;
        this.currentRoute.set(route);
        this.addLog(`Navigated to: ${route}`);
    }

    addLog(msg) {
        this.logs.update(l => [msg, ...l]);
    }
});
