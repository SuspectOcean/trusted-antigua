// Minimal service worker — its only job is to make Trusted Antigua an installable
// PWA (this is what lets Chrome/Android offer the "Install" prompt). It deliberately
// does NOT cache anything: the fetch handler is a passthrough, so pages are always
// fetched fresh from the network and users never get a stale version of the app.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => { /* passthrough — let the browser handle it normally */ });
