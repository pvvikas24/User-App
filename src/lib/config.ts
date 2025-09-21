export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

if (process.env.NODE_ENV !== 'production' && !GOOGLE_MAPS_API_KEY) {
  console.warn(
    'Google Maps API key is not set. The map will not function properly. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env.local file.'
  );
}
