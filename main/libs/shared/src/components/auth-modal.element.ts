// Shared Auth Modal Component (Web Component)
// Simple auth UI - emits login/logout events to host

export class AuthModalElement extends HTMLElement {
    static get observedAttributes(): string[] {
        return ['auth-token', 'user-name'];
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
            if (target.matches('.login-btn')) {
                this.dispatchEvent(new CustomEvent('auth-login', {
                    bubbles: true,
                    composed: true
                }));
            }
            if (target.matches('.logout-btn')) {
                this.dispatchEvent(new CustomEvent('auth-logout', {
                    bubbles: true,
                    composed: true
                }));
            }
        });
    }

    render(): void {
        const token = this.getAttribute('auth-token') || '';
        const userName = this.getAttribute('user-name') || '';
        const isLoggedIn = !!token;

        this.shadowRoot!.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                .auth-container {
                    padding: 1rem;
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 0.5rem;
                    background: rgba(0,0,0,0.2);
                }
                .auth-status {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 1rem;
                }
                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
                .status-dot.online { background: #22c55e; }
                .status-dot.offline { background: #6b7280; }
                .btn {
                    padding: 0.5rem 1rem;
                    border-radius: 0.25rem;
                    border: none;
                    cursor: pointer;
                    font-size: 0.875rem;
                    transition: all 0.2s;
                }
                .login-btn {
                    background: #3b82f6;
                    color: white;
                }
                .login-btn:hover { background: #2563eb; }
                .logout-btn {
                    background: #ef4444;
                    color: white;
                }
                .logout-btn:hover { background: #dc2626; }
                .token-preview {
                    font-family: monospace;
                    font-size: 0.75rem;
                    color: rgba(255,255,255,0.5);
                    margin-top: 0.5rem;
                }
            </style>
            <div class="auth-container">
                ${isLoggedIn ? `
                    <div class="auth-status">
                        <div class="user-info">
                            <span class="status-dot online"></span>
                            <span>${userName || 'User'}</span>
                        </div>
                        <button class="btn logout-btn">Sign Out</button>
                    </div>
                    <div class="token-preview">Token: ${token.substring(0, 20)}...</div>
                ` : `
                    <div class="auth-status">
                        <div class="user-info">
                            <span class="status-dot offline"></span>
                            <span>Not authenticated</span>
                        </div>
                        <button class="btn login-btn">Sign In</button>
                    </div>
                `}
            </div>
        `;
    }
}

customElements.define('shared-auth-modal', AuthModalElement);
