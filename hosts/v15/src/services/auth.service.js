import { Injectable } from 'https://esm.sh/@angular/core@15.2.0?deps=rxjs@7.8.1,zone.js@0.13.3';
import { authChannel } from '../../../../shared/services/auth-channel.js';

// Service simulating Auth (Basic JWT) - Angular 15 style (no signals)
export const AuthService = Injectable({ providedIn: 'root' })(class {
    user = null;
    token = '';

    constructor() {
        // Subscribe to auth channel for cross-app sync
        authChannel.onMessage((message) => {
            if (message.type === 'login') {
                this.token = message.token;
                this.user = message.user;
            } else if (message.type === 'logout') {
                this.token = '';
                this.user = null;
            }
        });
    }

    login() {
        this.token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.MOCK_TOKEN.' + Date.now();
        this.user = { name: 'Officer K', role: 'Admin' };
        authChannel.broadcast(this.token, this.user);
    }

    logout() {
        this.token = '';
        this.user = null;
        authChannel.broadcast(null, null);
    }
});
