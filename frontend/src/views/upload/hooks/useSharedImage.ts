import { useEffect, useState } from 'react';
import { useSnackbar } from 'notistack';

const CACHE_NAME = 'share-target-cache-v1';
const CACHE_KEY = '/shared-image';

/**
 * Hook to handle images shared via iOS Share Target API
 * Checks for shared=true query parameter and retrieves image from cache
 */
export function useSharedImage() {
  const [sharedImage, setSharedImage] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('shared') !== 'true') {
      return;
    }

    // Remove the query parameter from URL
    window.history.replaceState({}, '', '/upload');

    // Retrieve shared image from cache
    caches
      .open(CACHE_NAME)
      .then(cache => {
        cache.match(CACHE_KEY).then(response => {
          if (response) {
            response.blob().then(blob => {
              // Convert blob to data URL
              const reader = new FileReader();
              reader.onloadend = () => {
                const dataUrl = reader.result as string;
                setSharedImage(dataUrl);
              };
              reader.readAsDataURL(blob);

              // Clean up cache after reading
              cache.delete(CACHE_KEY);
            });
          }
        });
      })
      .catch(error => {
        console.error('Error retrieving shared image:', error);
        enqueueSnackbar('Failed to load shared image', { variant: 'error' });
      });
  }, [enqueueSnackbar]);

  return sharedImage;
}
