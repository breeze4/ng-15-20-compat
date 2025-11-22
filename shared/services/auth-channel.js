// BroadcastChannel wrapper for cross-app auth sync
const CHANNEL_NAME = 'auth-session';

export class AuthChannel {
    constructor() {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.callback = null;
    }

    broadcast(token, user) {
        if (token && user) {
            this.channel.postMessage({ type: 'login', token, user });
        } else {
            this.channel.postMessage({ type: 'logout' });
        }
    }

    onMessage(callback) {
        this.callback = callback;
        this.channel.onmessage = (event) => {
            callback(event.data);
        };
    }

    close() {
        this.channel.close();
    }
}

// Singleton instance for convenience
export const authChannel = new AuthChannel();
