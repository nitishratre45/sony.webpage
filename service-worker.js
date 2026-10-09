self.addEventListener("install", event => self.skipWaiting());
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));
// Intentionally do not intercept requests: live streams and APIs must remain untouched.
