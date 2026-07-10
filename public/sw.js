const CACHE_NAME = 'jr-academy-v3'; // Naikkan versinya
const urlsToCache = [
    '/',
    '/index.html',
    '/daftar.html',
    '/css/style.css',
    '/images/logo.png'
];

// ===================================================
// 1. INSTALL: Paksa sistem langsung pakai versi terbaru
// ===================================================
self.addEventListener('install', event => {
    self.skipWaiting(); // Memaksa Service Worker baru langsung jalan!
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        })
    );
});

// ===================================================
// 2. ACTIVATE: Mesin Penghancur Cache Versi Lama
// ===================================================
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    // Jika nama cache tidak sama dengan 'jr-academy-v3', HAPUS!
                    if (cacheName !== CACHE_NAME) {
                        console.log('Menghapus cache lama:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// ===================================================
// 3. FETCH: Strategi "NETWORK FIRST" (Anti Nyangkut)
// ===================================================
self.addEventListener('fetch', event => {
    // Abaikan request POST/UPDATE ke Supabase agar tidak error
    if (event.request.method !== 'GET') return;

    event.respondWith(
        // Coba ambil dari Internet / Server dulu (Biar selalu dapat versi terbaru)
        fetch(event.request)
            .catch(() => {
                // JIKA OFFLINE / TIDAK ADA KUOTA, baru tampilkan dari memori Cache HP
                return caches.match(event.request);
            })
    );
});
