const CACHE_NAME = "touchgrass-v1";

const STATIC_ASSETS = [
  "/task-tracker/index.html",
  "/task-tracker/landing.html",
  "/task-tracker/feed.html",
  "/task-tracker/profile.html",
  "/task-tracker/profile-setup.html",
  "/task-tracker/suggestions.html",
  "/task-tracker/calendar.html",
  "/task-tracker/style.css",
  "/task-tracker/auth.js",
  "/task-tracker/manifest.json",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (
    url.hostname.includes("firebase") ||
    url.hostname.includes("google") ||
    url.hostname.includes("googleapis") ||
    url.hostname.includes("gstatic")
  ) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request)
        .then(cached => cached || caches.match("/task-tracker/landing.html"))
      )
  );
});
