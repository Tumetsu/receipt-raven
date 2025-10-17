// Service Worker for handling Web Share Target
const CACHE_NAME = 'share-target-cache-v1';

self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

// Handle share target POST requests
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Intercept POST requests to /upload (from share target)
  if (event.request.method === 'POST' && url.pathname === '/upload') {
    event.respondWith(handleShareTarget(event.request));
  }
});

async function handleShareTarget(request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image');

    if (image && image instanceof File) {
      // Store the shared image in Cache API
      const cache = await caches.open(CACHE_NAME);
      const response = new Response(image, {
        headers: { 'Content-Type': image.type }
      });
      await cache.put('/shared-image', response);

      // Redirect to the upload page with a flag indicating shared content
      return Response.redirect('/upload?shared=true', 303);
    }

    // If no image, just redirect to upload page
    return Response.redirect('/upload', 303);
  } catch (error) {
    console.error('Error handling share target:', error);
    return Response.redirect('/upload', 303);
  }
}
