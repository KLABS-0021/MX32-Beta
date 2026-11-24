/* MX32 Patch Sheet: offline cache.
   After the app is opened once with internet, it opens and works with no signal.
   When you change any file, raise VERSION so phones pick up the new copy. */
var VERSION = "mx32-2026-11-25-wing3";
var FILES = [
  "./",
  "index.html",
  "wing-base.snap",
  "manifest.webmanifest",
  "icon-180.png",
  "icon-192.png",
  "icon-512.png",
  "lib/jspdf.umd.min.js",
  "fonts/ibm-plex-sans-latin-400-normal.woff2",
  "fonts/ibm-plex-sans-latin-500-normal.woff2",
  "fonts/ibm-plex-sans-latin-600-normal.woff2",
  "fonts/ibm-plex-sans-latin-700-normal.woff2",
  "fonts/ibm-plex-mono-latin-400-normal.woff2",
  "fonts/ibm-plex-mono-latin-500-normal.woff2",
  "fonts/ibm-plex-mono-latin-600-normal.woff2"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(VERSION)
      .then(function (c) { return c.addAll(FILES.map(function (f) { return new Request(f, { cache: "reload" }); })); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.clients.claim(); })
  );
});

/* Network with a short timeout, else the saved copy. */
function fromNetwork(req, ms) {
  return new Promise(function (res, rej) {
    var t = setTimeout(rej, ms);
    fetch(req).then(function (r) {
      clearTimeout(t);
      if (r && r.ok) {
        var copy = r.clone();
        caches.open(VERSION).then(function (c) { c.put(req, copy); });
        res(r);
      } else rej();
    }, function () { clearTimeout(t); rej(); });
  });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;

  /* The app page: try the internet first (to get updates), fall back to the saved copy after 3 s. */
  if (req.mode === "navigate") {
    e.respondWith(
      fromNetwork(req, 3000).catch(function () {
        return caches.match(req, { ignoreSearch: true }).then(function (r) {
          return r || caches.match("index.html").then(function (x) { return x || caches.match("./"); });
        });
      })
    );
    return;
  }

  /* Everything else (fonts, icons, PDF tool): saved copy first. */
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (r) {
      return r || fetch(req).then(function (n) {
        if (n && n.ok) { var copy = n.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
        return n;
      });
    })
  );
});
