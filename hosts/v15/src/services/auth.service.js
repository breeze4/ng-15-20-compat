import { Injectable } from 'https://esm.sh/@angular/core@15.2.0?deps=rxjs@7.8.1,zone.js@0.13.3';

// Service simulating Auth (Basic JWT) - Angular 15 style (no signals)
export const AuthService = Injectable({ providedIn: 'root' })(class {
    user = null;
    token = '';

    login() {
        this.token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.MOCK_TOKEN.' + Date.now();
        this.user = { name: 'Officer K', role: 'Admin' };
    }

    logout() {
        this.token = '';
        this.user = null;
    }
});
