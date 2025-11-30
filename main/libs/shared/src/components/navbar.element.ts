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
                const route = target.dataset['route'];
                this.dispatchEvent(new CustomEvent('navigate', {
                    detail: { route },
                    bubbles: true,
                    composed: true
                }));
            }
        });
    }

    render(): void {
        const currentRoute = this.getAttribute('current-route') || '/zones';
        const appId = this.getAttribute('app-id') || 'ng15-zone';

        // Define routes - same for all apps
        const testRoutes = [
            { path: '/zones', label: 'Zones' },
            { path: '/material', label: 'Material' }
        ];

        // Get current app's label
        let routes: { path: string; label: string }[] = testRoutes;
        let appLabel = '';
        if (appId === 'ng15-zone') {
            appLabel = 'Ng15+Zone';
        } else if (appId === 'ng20-zone') {
            appLabel = 'Ng20+Zone';
        } else if (appId === 'ng20-zoneless') {
            appLabel = 'Ng20 Zoneless';
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
                <a class="app-link ${appId === 'ng15-zone' ? 'current-app' : ''}" href="/">
                    Ng15+Zone
                </a>
                <a class="app-link ${appId === 'ng20-zone' ? 'current-app' : ''}" href="/settings/">
                    Ng20+Zone
                </a>
                <a class="app-link ${appId === 'ng20-zoneless' ? 'current-app' : ''}" href="/profile/">
                    Ng20 Zoneless
                </a>
            </nav>
        `;
    }
}

customElements.define('shared-navbar', NavbarElement);
