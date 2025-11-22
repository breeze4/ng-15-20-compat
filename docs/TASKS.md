# Shared Auth & Cross-App Routing

## Mini Spec

### Shared Auth via BroadcastChannel
- Apps sync login/logout in real-time across tabs using BroadcastChannel API
- When one app logs in: broadcasts `{type: 'login', token, user}` to channel
- When one app logs out: broadcasts `{type: 'logout'}` to channel
- Each host subscribes on init, updates its auth state when receiving messages
- No localStorage persistence; session only lives while at least one tab is open

### Unified URL Routing
- v15 app: `/` (root)
- v20 app: `/v20/*`
- Navbar displays routes for both apps
- Same-app routes: emit events (current behavior)
- Cross-app routes: use `window.location` navigation

---

## Tasks

- [x] Create `shared/services/auth-channel.js` - BroadcastChannel wrapper with `broadcast(token, user)`, `onMessage(callback)`, and `close()` methods

- [x] Update v15 `auth.service.js` - Subscribe to auth channel on init, broadcast on login/logout, update state when receiving broadcasts

- [x] Update v20 `auth.service.js` - Same channel integration using signals

- [ ] Update `index.html` - Change landing page to redirect or frame the v15 app at root, link to v20 at `/v20`

- [ ] Move v15 app to serve from root path - Update any relative paths in v15 host

- [ ] Configure v20 app for `/v20` base path - Update base href or deploy URL

- [ ] Update `navbar.element.js` - Add cross-app routes (`/` for v15 home, `/v20` for v20 home), use actual href navigation for cross-app links vs events for same-app routes

- [ ] Update both app components - Handle cross-app navigation events from navbar by changing `window.location` instead of internal state
