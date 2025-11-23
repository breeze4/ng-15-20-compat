// Shared Navbar Component (Web Component)
// Emits navigation events to host, receives current route via attribute
// Supports cross-app navigation between apps

export class NavbarElement extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['current-route', 'app-id', 'base-href'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback(): void {
        this.render();
        this._setupEventListeners();
    }

    attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    private _setupEventListeners(): void {
        this.shadowRoot!.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.matches('.nav-link')) {
                e.preventDefault();
                const route = target.dataset.route;
                this.dispatchEvent(new CustomEvent('navigate', {
                    detail: { route },
                    bubbles: true,
                    composed: true
                }));
            }
        });
    }

    render(): void {
        const currentRoute = this.getAttribute('current-route') || '/overview';
        const appId = this.getAttribute('app-id') || 'host';

        // Define routes for each app section
        const dashboardRoutes = [
            { path: '/overview', label: 'Overview' },
            { path: '/analytics', label: 'Analytics' },
            { path: '/reports', label: 'Reports' }
        ];

        const settingsRoutes = [
            { path: '/general', label: 'General' },
            { path: '/security', label: 'Security' },
            { path: '/notifications', label: 'Notifications' }
        ];

        const profileRoutes = [
            { path: '/overview', label: 'Overview' },
            { path: '/preferences', label: 'Preferences' },
            { path: '/activity', label: 'Activity' }
        ];

        // Get current app's routes
        let routes: { path: string; label: string }[] = [];
        let appLabel = '';
        if (appId === 'host') {
            routes = dashboardRoutes;
            appLabel = 'Dashboard';
        } else if (appId === 'settings') {
            routes = settingsRoutes;
            appLabel = 'Settings';
        } else if (appId === 'profile') {
            routes = profileRoutes;
            appLabel = 'Profile';
        }

        const routeButtons = routes.map(r => `
            <button class="nav-link ${currentRoute === r.path ? 'active' : ''}" data-route="${r.path}">
                ${r.label}
            </button>
        `).join('');

        this.shadowRoot!.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                nav {
                    display: flex;
                    gap: 0.5rem;
                    padding: 0.5rem;
                    background: rgba(0,0,0,0.2);
                    border-radius: 0.5rem;
                    flex-wrap: wrap;
                    align-items: center;
                }
                .app-label {
                    font-weight: bold;
                    padding: 0.5rem;
                    color: rgba(255,255,255,0.9);
                }
                .nav-link, .app-link {
                    padding: 0.5rem 1rem;
                    border-radius: 0.25rem;
                    cursor: pointer;
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.2);
                    color: inherit;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                    text-decoration: none;
                }
                .nav-link:hover, .app-link:hover {
                    background: rgba(255,255,255,0.1);
                }
                .nav-link.active {
                    background: rgba(59, 130, 246, 0.5);
                    border-color: rgba(59, 130, 246, 0.8);
                }
                .separator {
                    width: 1px;
                    background: rgba(255,255,255,0.2);
                    margin: 0 0.25rem;
                    height: 24px;
                }
                .app-link {
                    border-color: rgba(255,255,255,0.3);
                }
                .app-link.current-app {
                    background: rgba(59, 130, 246, 0.3);
                    border-color: rgba(59, 130, 246, 0.5);
                }
            </style>
            <nav>
                <span class="app-label">${appLabel}</span>
                ${routeButtons}
                <div class="separator"></div>
                <a class="app-link ${appId === 'host' ? 'current-app' : ''}" href="/">
                    Dashboard
                </a>
                <a class="app-link ${appId === 'settings' ? 'current-app' : ''}" href="/settings/">
                    Settings
                </a>
                <a class="app-link ${appId === 'profile' ? 'current-app' : ''}" href="/profile/">
                    Profile
                </a>
            </nav>
        `;
    }
}

customElements.define('shared-navbar', NavbarElement);
