/* AsesiDoku · trabajador de servicio
   El armazon se guarda al instalar: a partir de la segunda visita el juego
   arranca sin red. Las tandas de casos se guardan segun se piden, asi que
   quien juegue treinta casos acaba con treinta en el bolsillo y no con mil.

   Estrategia: para el armazon, primero la cache (arranque instantaneo) y
   actualizacion por detras. Para las tandas, primero la cache y punto: un
   caso publicado no cambia nunca. */
const V = '8842408888';
const SHELL = 'asesidoku-shell-' + V;
const DATA  = 'asesidoku-data-' + V;
const CORE = ['./', './index.html', './manifest.webmanifest',
              './icono.svg', './data/core.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(
    ks.filter(k => k.indexOf(V) < 0).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;

  /* las tandas de casos no cambian: cache y listo */
  if (/\/data\/c-\d+\.json$/.test(u.pathname)) {
    e.respondWith(caches.open(DATA).then(c =>
      c.match(e.request).then(hit => hit || fetch(e.request).then(r => {
        if (r.ok) c.put(e.request, r.clone());
        return r;
      }))));
    return;
  }

  /* el armazon: lo que hay en cache, y de paso se refresca */
  e.respondWith(caches.open(SHELL).then(c =>
    c.match(e.request).then(hit => {
      const red = fetch(e.request).then(r => {
        if (r.ok) c.put(e.request, r.clone());
        return r;
      }).catch(() => hit);
      return hit || red;
    })));
});
