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
  `]
})
export class AppComponent {
  authToken = signal('');
  userName = signal('');
  currentRoute = signal('/overview');

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
}
