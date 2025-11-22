// BroadcastChannel wrapper for cross-app auth sync
// Uses cookies for persistence across navigation, BroadcastChannel for real-time sync
const CHANNEL_NAME = 'auth-session';
const COOKIE_TOKEN = 'auth_token';
const COOKIE_USER = 'auth_user';

export class AuthChannel {
    constructor() {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.callback = null;
    }

    broadcast(token, user) {
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

    onMessage(callback) {
        this.callback = callback;
        this.channel.onmessage = (event) => {
            callback(event.data);
        };
    }

    // Read persisted auth from cookies
    getPersistedAuth() {
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

    close() {
        this.channel.close();
    }

    _setCookie(name, value, days) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
    }

    _getCookie(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : null;
    }

    _deleteCookie(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
}

// Singleton instance for convenience
export const authChannel = new AuthChannel();
