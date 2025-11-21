// Shared Navbar Component (Web Component)
// Emits navigation events to host, receives current route via attribute

export class NavbarElement extends HTMLElement {
    static get observedAttributes() {
        return ['current-route'];
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
        });
    }

    render() {
        const currentRoute = this.getAttribute('current-route') || '/';

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
                }
                .nav-link {
                    padding: 0.5rem 1rem;
                    border-radius: 0.25rem;
                    cursor: pointer;
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.2);
                    color: inherit;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                }
                .nav-link:hover {
                    background: rgba(255,255,255,0.1);
                }
                .nav-link.active {
                    background: rgba(59, 130, 246, 0.5);
                    border-color: rgba(59, 130, 246, 0.8);
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
            </nav>
        `;
    }
}

customElements.define('shared-navbar', NavbarElement);
