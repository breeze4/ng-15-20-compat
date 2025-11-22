// Zone.js Dependency Test Scenarios
// Tests actual Zone.js behavior vs "well-behaved" components

export class ZoneScenariosElement extends HTMLElement {
    static get observedAttributes() {
        return ['input-value'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._inputValue = '';
        this._eventCount = 0;
        this._wellBehavedCounter = 0;
        this._lazyCounter = 0;
        this._wellBehavedPending = false;
        this._lazyPending = false;
    }

    connectedCallback() {
        this.render();
        this._setupEventListeners();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'input-value' && oldValue !== newValue) {
            this._inputValue = newValue || '';
            this.render();
        }
    }

    _setupEventListeners() {
        this.shadowRoot.addEventListener('click', (e) => {
            if (e.target.matches('.emit-event-btn')) {
                this._emitEvent();
            }
            if (e.target.matches('.async-wellbehaved-btn')) {
                this._triggerWellBehavedAsync();
            }
            if (e.target.matches('.async-lazy-btn')) {
                this._triggerLazyAsync();
            }
        });
    }

    // Test 2: Inner to Outer - Custom Event
    _emitEvent() {
        this._eventCount++;
        this.render();

        this.dispatchEvent(new CustomEvent('scenario-event', {
            detail: { count: this._eventCount, message: 'Event from component' },
            bubbles: true,
            composed: true
        }));
    }

    // Test 3a: Well-Behaved Async (calls render - FALSE POSITIVE)
    _triggerWellBehavedAsync() {
        if (this._wellBehavedPending) return;
        this._wellBehavedPending = true;
        this.render();

        setTimeout(() => {
            this._wellBehavedCounter++;
            this._wellBehavedPending = false;
            this.render(); // <-- THE CHEAT: Explicit render call

            this.dispatchEvent(new CustomEvent('async-complete', {
                detail: { counter: this._wellBehavedCounter, type: 'wellbehaved' },
                bubbles: true,
                composed: true
            }));
        }, 500);
    }

    // Test 3b: Lazy Async (NO render - TRUE TEST)
    // Simulates real Angular component behavior
    _triggerLazyAsync() {
        if (this._lazyPending) return;
        this._lazyPending = true;
        this.render();

        setTimeout(() => {
            this._lazyCounter++;
            this._lazyPending = false;
            // NO render() call - simulates Zone.js-dependent component
            // The internal state changed but view won't update

            console.log(`[Lazy] Counter is now ${this._lazyCounter} but UI may be stale`);

            // Still dispatch event so host knows something happened
            this.dispatchEvent(new CustomEvent('async-complete', {
                detail: { counter: this._lazyCounter, type: 'lazy' },
                bubbles: true,
                composed: true
            }));
        }, 500);
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                }
                .scenarios {
                    display: grid;
                    gap: 1rem;
                }
                .scenario {
                    padding: 1rem;
                    background: rgba(0,0,0,0.3);
                    border-radius: 0.5rem;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .scenario-title {
                    font-size: 0.75rem;
                    font-weight: bold;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 0.75rem;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .title-1 { color: #60a5fa; }
                .title-2 { color: #34d399; }
                .title-3a { color: #fbbf24; }
                .title-3b { color: #f87171; }

                .value-display {
                    font-family: monospace;
                    font-size: 1.25rem;
                    padding: 0.5rem;
                    background: rgba(0,0,0,0.3);
                    border-radius: 0.25rem;
                    text-align: center;
                    margin-bottom: 0.5rem;
                }

                button {
                    width: 100%;
                    padding: 0.5rem;
                    border-radius: 0.25rem;
                    cursor: pointer;
                    font-size: 0.875rem;
                    border: none;
                    transition: all 0.2s;
                }
                button:disabled {
                    background: #6b7280 !important;
                    cursor: not-allowed;
                }

                .emit-event-btn { background: #10b981; color: white; }
                .emit-event-btn:hover { background: #059669; }

                .async-wellbehaved-btn { background: #f59e0b; color: white; }
                .async-wellbehaved-btn:hover { background: #d97706; }

                .async-lazy-btn { background: #ef4444; color: white; }
                .async-lazy-btn:hover { background: #dc2626; }

                .note {
                    margin-top: 0.5rem;
                    font-size: 0.625rem;
                    color: #9ca3af;
                    line-height: 1.4;
                }
                .note strong { color: inherit; }

                .indicator {
                    display: inline-block;
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
                .indicator-pass { background: #10b981; }
                .indicator-fail { background: #ef4444; }
                .indicator-warn { background: #f59e0b; }
            </style>

            <div class="scenarios">
                <!-- Test 1: Outer to Inner -->
                <div class="scenario">
                    <div class="scenario-title title-1">
                        <span class="indicator indicator-pass"></span>
                        1. Outer → Inner (Input)
                    </div>
                    <div class="value-display">
                        ${this._inputValue || '(empty)'}
                    </div>
                    <div class="note">
                        Host passes value via attribute. Always works - attributeChangedCallback fires.
                    </div>
                </div>

                <!-- Test 2: Inner to Outer -->
                <div class="scenario">
                    <div class="scenario-title title-2">
                        <span class="indicator indicator-pass"></span>
                        2. Inner → Outer (Event)
                    </div>
                    <div class="value-display">
                        Sent: ${this._eventCount}
                    </div>
                    <button class="emit-event-btn">Emit Event to Host</button>
                    <div class="note">
                        Dispatches CustomEvent. Always works - Angular wraps template listeners.
                    </div>
                </div>

                <!-- Test 3a: Well-Behaved Async -->
                <div class="scenario">
                    <div class="scenario-title title-3a">
                        <span class="indicator indicator-warn"></span>
                        3a. Async - Well-Behaved
                    </div>
                    <div class="value-display">
                        ${this._wellBehavedCounter}
                    </div>
                    <button class="async-wellbehaved-btn" ${this._wellBehavedPending ? 'disabled' : ''}>
                        ${this._wellBehavedPending ? 'Working...' : 'Async +1 (500ms)'}
                    </button>
                    <div class="note">
                        <strong>FALSE POSITIVE:</strong> Calls render() after setTimeout.
                        Works everywhere but doesn't test Zone.js.
                    </div>
                </div>

                <!-- Test 3b: Lazy Async (True Test) -->
                <div class="scenario">
                    <div class="scenario-title title-3b">
                        <span class="indicator indicator-fail"></span>
                        3b. Async - Zone.js Dependent
                    </div>
                    <div class="value-display">
                        ${this._lazyCounter}
                    </div>
                    <button class="async-lazy-btn" ${this._lazyPending ? 'disabled' : ''}>
                        ${this._lazyPending ? 'Working...' : 'Async +1 (500ms)'}
                    </button>
                    <div class="note">
                        <strong>TRUE TEST:</strong> No render() after setTimeout.
                        <br>Zone mode: Updates. Zoneless: Stays at ${this._lazyCounter} forever.
                        <br>Check console for actual value.
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('zone-scenarios', ZoneScenariosElement);
