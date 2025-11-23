// BroadcastChannel wrapper for cross-app auth sync
// Uses cookies for persistence across navigation, BroadcastChannel for real-time sync

const CHANNEL_NAME = 'auth-session';
const COOKIE_TOKEN = 'auth_token';
const COOKIE_USER = 'auth_user';

export interface AuthUser {
    name: string;
    email?: string;
}

export interface AuthMessage {
    type: 'login' | 'logout';
    token?: string;
    user?: AuthUser;
}

export class AuthChannel {
    private channel: BroadcastChannel;
    private callback: ((message: AuthMessage) => void) | null = null;

    constructor() {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
    }

    broadcast(token: string | null, user: AuthUser | null): void {
        if (token && user) {
            this._setCookie(COOKIE_TOKEN, token, 1);
            this._setCookie(COOKIE_USER, JSON.stringify(user), 1);
            this.channel.postMessage({ type: 'login', token, user });
        } else {
            this._deleteCookie(COOKIE_TOKEN);
            this._deleteCookie(COOKIE_USER);
            this.channel.postMessage({ type: 'logout' });
        }
    }

    onMessage(callback: (message: AuthMessage) => void): void {
        this.callback = callback;
        this.channel.onmessage = (event: MessageEvent<AuthMessage>) => {
            callback(event.data);
        };
    }

    // Read persisted auth from cookies
    getPersistedAuth(): { token: string; user: AuthUser } | null {
        const token = this._getCookie(COOKIE_TOKEN);
        const userStr = this._getCookie(COOKIE_USER);
        if (token && userStr) {
            try {
                return { token, user: JSON.parse(userStr) };
            } catch {
                return null;
            }
        }
        return null;
    }

    close(): void {
        this.channel.close();
    }

    private _setCookie(name: string, value: string, days: number): void {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
    }

    private _getCookie(name: string): string | null {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
    }

    private _deleteCookie(name: string): void {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
}

// Singleton instance for convenience
export const authChannel = new AuthChannel();
