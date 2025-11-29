import { Component, CUSTOM_ELEMENTS_SCHEMA, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { authChannel } from '@myorg/shared/services/auth-channel';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="app-container">
      <header>
        <h1>Angular 19 Profile (Zoneless)</h1>
        <shared-auth-modal
          [attr.auth-token]="authToken()"
          [attr.user-name]="userName()"
          (auth-login)="onLogin()"
          (auth-logout)="onLogout()">
        </shared-auth-modal>
      </header>

      <shared-navbar
        app-id="profile"
        [attr.current-route]="currentRoute()"
        (navigate)="onNavigate($any($event))">
      </shared-navbar>

      <main>
        <router-outlet></router-outlet>
      </main>

      <section class="zone-scenarios">
        <h2>Zone.js Test Scenarios (Zoneless Host)</h2>
        <zone-scenario-1 [attr.value]="scenario1Value()"></zone-scenario-1>
        <zone-scenario-2 (clicked)="onScenario2Click($any($event))"></zone-scenario-2>
        <p>Host received clicks: {{ scenario2Clicks() }}</p>
        <zone-scenario-3a (asyncComplete)="onScenario3aComplete($any($event))"></zone-scenario-3a>
        <p>Host received 3a count: {{ scenario3aCount() }}</p>
        <zone-scenario-3b (lazyComplete)="onScenario3bComplete($any($event))"></zone-scenario-3b>
        <p>Host received 3b count: {{ scenario3bCount() }} <em>(compare with component display above)</em></p>
        <button (click)="updateScenario1()">Update Scenario 1 Value</button>
      </section>
    </div>
  `,
  styles: [`
    .app-container {
      padding: 1rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    h1 {
      margin: 0;
      font-size: 1.5rem;
    }
    main {
      margin-top: 1rem;
      padding: 1rem;
      background: rgba(255,255,255,0.1);
      border-radius: 0.5rem;
    }
    .zone-scenarios {
      margin-top: 2rem;
      padding: 1rem;
      border: 2px solid #e57373;
      border-radius: 0.5rem;
      background: #fff3e0;
    }
    .zone-scenarios h2 {
      margin: 0 0 1rem 0;
      font-size: 1.2rem;
    }
    .zone-scenarios p {
      margin: 0.5rem 0;
      font-size: 0.9rem;
      color: #666;
    }
    .zone-scenarios em {
      color: #d32f2f;
    }
    .zone-scenarios button {
      margin-top: 1rem;
      padding: 0.5rem 1rem;
    }
  `]
})
export class AppComponent {
  authToken = signal('');
  userName = signal('');
  currentRoute = signal('/overview');

  // Zone scenario state (using signals for zoneless)
  scenario1Value = signal('Initial');
  scenario2Clicks = signal(0);
  scenario3aCount = signal(0);
  scenario3bCount = signal(0);

  private authChannelInstance = authChannel;

  constructor(private router: Router, private cdr: ChangeDetectorRef) {
    const persisted = this.authChannelInstance.getPersistedAuth();
    if (persisted) {
      this.authToken.set(persisted.token);
      this.userName.set(persisted.user.name);
    }

    this.authChannelInstance.onMessage((msg: any) => {
      if (msg.type === 'login' && msg.token && msg.user) {
        this.authToken.set(msg.token);
        this.userName.set(msg.user.name);
      } else if (msg.type === 'logout') {
        this.authToken.set('');
        this.userName.set('');
      }
      this.cdr.markForCheck();
    });

    this.router.events.subscribe(() => {
      this.currentRoute.set('/' + this.router.url.split('/')[1]);
    });
  }

  onLogin(): void {
    const token = 'mock-jwt-token-' + Date.now();
    const user = { name: 'Demo User', email: 'demo@example.com' };
    this.authToken.set(token);
    this.userName.set(user.name);
    this.authChannelInstance.broadcast(token, user);
  }

  onLogout(): void {
    this.authToken.set('');
    this.userName.set('');
    this.authChannelInstance.broadcast(null, null);
  }

  onNavigate(event: CustomEvent<{ route: string }>): void {
    const route = event.detail.route;
    this.router.navigate([route]);
  }

  // Zone scenario handlers
  updateScenario1(): void {
    this.scenario1Value.set('Updated-' + Date.now());
  }

  onScenario2Click(event: CustomEvent<number>): void {
    this.scenario2Clicks.set(event.detail);
  }

  onScenario3aComplete(event: CustomEvent<number>): void {
    this.scenario3aCount.set(event.detail);
  }

  onScenario3bComplete(event: CustomEvent<number>): void {
    this.scenario3bCount.set(event.detail);
  }
}
