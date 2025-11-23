import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { AuthChannel, authChannel } from '@shared/services/auth-channel';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="app-container">
      <header>
        <h1>Angular 15 Host</h1>
        <shared-auth-modal
          [attr.auth-token]="authToken"
          [attr.user-name]="userName"
          (auth-login)="onLogin()"
          (auth-logout)="onLogout()">
        </shared-auth-modal>
      </header>

      <shared-navbar
        app-id="host"
        [attr.current-route]="currentRoute"
        (navigate)="onNavigate($event)">
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
  authToken = '';
  userName = '';
  currentRoute = '/overview';

  private authChannel = authChannel;

  constructor(private router: Router) {
    // Restore auth from cookies
    const persisted = this.authChannel.getPersistedAuth();
    if (persisted) {
      this.authToken = persisted.token;
      this.userName = persisted.user.name;
    }

    // Listen for auth changes from other apps
    this.authChannel.onMessage((msg) => {
      if (msg.type === 'login' && msg.token && msg.user) {
        this.authToken = msg.token;
        this.userName = msg.user.name;
      } else if (msg.type === 'logout') {
        this.authToken = '';
        this.userName = '';
      }
    });

    // Update currentRoute based on router events
    this.router.events.subscribe(() => {
      this.currentRoute = '/' + this.router.url.split('/')[1];
    });
  }

  onLogin(): void {
    const token = 'mock-jwt-token-' + Date.now();
    const user = { name: 'Demo User', email: 'demo@example.com' };
    this.authToken = token;
    this.userName = user.name;
    this.authChannel.broadcast(token, user);
  }

  onLogout(): void {
    this.authToken = '';
    this.userName = '';
    this.authChannel.broadcast(null, null);
  }

  onNavigate(event: Event): void {
    const route = (event as CustomEvent).detail.route;
    this.router.navigate([route]);
  }
}
