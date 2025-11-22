import { signal } from 'https://esm.sh/@angular/core@19.0.0?deps=rxjs@7.8.1';
import { authChannel } from '../../../../shared/services/auth-channel.js';

// Service simulating Auth (Basic JWT)
export class AuthService {
    user = signal(null);
    token = signal('');

    constructor() {
        // Restore from cookies on init
        const persisted = authChannel.getPersistedAuth();
        if (persisted) {
            this.token.set(persisted.token);
            this.user.set(persisted.user);
        }

        // Subscribe to auth channel for cross-tab sync
        authChannel.onMessage((message) => {
            if (message.type === 'login') {
                this.token.set(message.token);
                this.user.set(message.user);
            } else if (message.type === 'logout') {
                this.token.set('');
                this.user.set(null);
            }
        });
    }

    login() {
        this.token.set('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.MOCK_TOKEN.' + Date.now());
        this.user.set({ name: 'Officer K', role: 'Admin' });
        authChannel.broadcast(this.token(), this.user());
    }

    logout() {
        this.token.set('');
        this.user.set(null);
        authChannel.broadcast(null, null);
    }
}
