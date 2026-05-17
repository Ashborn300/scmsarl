// Minimal service worker — required for PWA installability on Chrome/Android.
// Network-first for navigations to avoid stale shells. No precache.

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => new Response("Offline", { status: 503 }))
    );
  }
});
