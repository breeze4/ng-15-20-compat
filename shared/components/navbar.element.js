// Shared Navbar Component (Web Component)
// Emits navigation events to host, receives current route via attribute
// Supports cross-app navigation between v15 and v20

export class NavbarElement extends HTMLElement {
    static get observedAttributes() {
        return ['current-route', 'app-id'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this._setupEventListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    _setupEventListeners() {
        this.shadowRoot.addEventListener('click', (e) => {
            if (e.target.matches('.nav-link')) {
                e.preventDefault();
                const route = e.target.dataset.route;
                this.dispatchEvent(new CustomEvent('navigate', {
                    detail: { route },
                    bubbles: true,
                    composed: true
                }));
            }
            // Cross-app links use actual href navigation - no prevention needed
        });
    }

    render() {
        const currentRoute = this.getAttribute('current-route') || '/dashboard';
        const appId = this.getAttribute('app-id') || 'v15';

        this.shadowRoot.innerHTML = `
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
                }
                .app-link {
                    border-color: ${appId === 'v15' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(59, 130, 246, 0.5)'};
                }
                .app-link.current-app {
                    opacity: 0.5;
                    cursor: default;
                }
            </style>
            <nav>
                <button class="nav-link ${currentRoute === '/dashboard' ? 'active' : ''}" data-route="/dashboard">
                    Dashboard
                </button>
                <button class="nav-link ${currentRoute === '/settings' ? 'active' : ''}" data-route="/settings">
                    Settings
                </button>
                <button class="nav-link ${currentRoute === '/profile' ? 'active' : ''}" data-route="/profile">
                    Profile
                </button>
                <div class="separator"></div>
                <a class="app-link ${appId === 'v15' ? 'current-app' : ''}"
                   href="${appId === 'v15' ? '#' : 'index-v15.html'}"
                   ${appId === 'v15' ? 'onclick="return false;"' : ''}>
                    v15
                </a>
                <a class="app-link ${appId === 'v20' ? 'current-app' : ''}"
                   href="${appId === 'v20' ? '#' : 'index-v20.html'}"
                   ${appId === 'v20' ? 'onclick="return false;"' : ''}>
                    v20
                </a>
            </nav>
        `;
    }
}

customElements.define('shared-navbar', NavbarElement);
