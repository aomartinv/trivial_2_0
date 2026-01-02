const CACHE_NAME = 'trivial-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/src/main.js',
  '/questions.csv',
  '/categories.json',
  '/assets/bro-boda.jpeg',
  '/assets/first_victory.png',
  '/assets/sprechen-sie-matlab.jpg'
  // Add any other images or files
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});