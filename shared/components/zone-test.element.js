// Zone.js Test Component (Web Component)
// Tests whether async operations trigger host change detection
// Uses setTimeout - Zone.js patches this to trigger Angular CD

export class ZoneTestElement extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._counter = 0;
        this._pending = false;
    }

    connectedCallback() {
        this.render();
        this._setupEventListeners();
    }

    _setupEventListeners() {
        this.shadowRoot.addEventListener('click', (e) => {
            if (e.target.matches('.increment-btn')) {
                this._triggerAsyncIncrement();
            }
            if (e.target.matches('.sync-btn')) {
                this._triggerSyncIncrement();
            }
        });
    }

    _triggerAsyncIncrement() {
        if (this._pending) return;
        this._pending = true;
        this.render();

        // This setTimeout is the key test:
        // - With Zone.js: Angular detects this completes and runs CD
        // - Without Zone.js: Angular won't know this happened
        setTimeout(() => {
            this._counter++;
            this._pending = false;
            this.render();

            // Dispatch event to notify host of state change
            this.dispatchEvent(new CustomEvent('counter-changed', {
                detail: { counter: this._counter, async: true },
                bubbles: true,
                composed: true
            }));
        }, 500);
    }

    _triggerSyncIncrement() {
        this._counter++;
        this.render();

        // Sync event - should always work
        this.dispatchEvent(new CustomEvent('counter-changed', {
            detail: { counter: this._counter, async: false },
            bubbles: true,
            composed: true
        }));
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                .container {
                    padding: 1rem;
                    background: rgba(0,0,0,0.3);
                    border-radius: 0.5rem;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .title {
                    font-size: 0.875rem;
                    font-weight: bold;
                    margin-bottom: 1rem;
                    color: #f59e0b;
                }
                .counter-display {
                    font-size: 2rem;
                    font-weight: bold;
                    text-align: center;
                    padding: 1rem;
                    background: rgba(0,0,0,0.3);
                    border-radius: 0.5rem;
                    margin-bottom: 1rem;
                    font-family: monospace;
                }
                .buttons {
                    display: flex;
                    gap: 0.5rem;
                }
                button {
                    flex: 1;
                    padding: 0.75rem;
                    border-radius: 0.25rem;
                    cursor: pointer;
                    font-size: 0.875rem;
                    border: none;
                    transition: all 0.2s;
                }
                .increment-btn {
                    background: #3b82f6;
                    color: white;
                }
                .increment-btn:hover {
                    background: #2563eb;
                }
                .increment-btn:disabled {
                    background: #6b7280;
                    cursor: not-allowed;
                }
                .sync-btn {
                    background: #10b981;
                    color: white;
                }
                .sync-btn:hover {
                    background: #059669;
                }
                .note {
                    margin-top: 1rem;
                    font-size: 0.75rem;
                    color: #9ca3af;
                }
                .note strong {
                    color: #f59e0b;
                }
            </style>
            <div class="container">
                <div class="title">Zone.js Test Component</div>
                <div class="counter-display">${this._counter}</div>
                <div class="buttons">
                    <button class="sync-btn">Sync +1</button>
                    <button class="increment-btn" ${this._pending ? 'disabled' : ''}>
                        ${this._pending ? 'Waiting...' : 'Async +1 (500ms)'}
                    </button>
                </div>
                <div class="note">
                    <strong>Test:</strong> If host counter updates after async click, Zone.js is working correctly.
                </div>
            </div>
        `;
    }
}

customElements.define('zone-test', ZoneTestElement);
