import { signal } from 'https://esm.sh/@angular/core@19.0.0?deps=rxjs@7.8.1';

// Service simulating Auth (Basic JWT)
export class AuthService {
    user = signal(null);
    token = signal('');

    login() {
        this.token.set('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.MOCK_TOKEN.' + Date.now());
        this.user.set({ name: 'Officer K', role: 'Admin' });
    }

    logout() {
        this.token.set('');
        this.user.set(null);
    }
}
